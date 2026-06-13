import { prisma } from '../lib/prisma.js';
import type { CreateEventInput, EventFiltersInput } from '../schemas/event.schema.js';
import type { EventType, Prisma } from '@prisma/client';
import {
  selectPresets,
  includePresets,
  paginateQuery,
  processPaginatedResults,
  buildEventFilters,
  batchLoader,
} from '../lib/queryOptimizer.js';
import { aggregations } from '../lib/database.js';
import { getLastNDays, startOfDayUTC, endOfDayUTC } from '../utils/dateHelpers.js';

interface BatchResult {
  processed: number;
  failed: number;
  created: Array<{
    id: string;
    eventType: EventType;
    eventAction: string;
    title: string | null;
    content: string | null;
    projectId: string | null;
    localTimestamp: Date;
  }>;
}

export async function createEventBatch(
  agentId: string,
  userId: string,
  events: CreateEventInput[]
): Promise<BatchResult> {
  let processed = 0;
  let failed = 0;
  const created: BatchResult['created'] = [];

  // Update last sync time and set agent status to active
  await prisma.agent.update({
    where: { id: agentId },
    data: {
      lastSyncAt: new Date(),
      lastActiveAt: new Date(),
      status: 'active',
    },
  });

  // Process events in transaction
  await prisma.$transaction(async (tx) => {
    for (const event of events) {
      try {
        const createdEvent = await tx.event.create({
          data: {
            agentId,
            userId,
            eventType: event.eventType as EventType,
            eventAction: event.eventAction,
            title: event.title,
            content: event.content,
            metadata: (event.metadata || {}) as Prisma.InputJsonValue,
            filePath: event.filePath,
            gitBranch: event.gitBranch,
            gitCommitHash: event.gitCommitHash,
            localTimestamp: new Date(event.localTimestamp),
          },
          select: {
            id: true,
            eventType: true,
            eventAction: true,
            title: true,
            content: true,
            projectId: true,
            localTimestamp: true,
          },
        });
        created.push(createdEvent);
        processed++;
      } catch (error) {
        console.error('Failed to create event:', error);
        failed++;
      }
    }
  });

  return { processed, failed, created };
}

export async function getEvents(userId: string, filters: EventFiltersInput) {
  // Use optimized filter builder (M13-T1)
  const where = buildEventFilters({
    userId,
    projectId: filters.projectId,
    eventType: filters.eventType,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    search: filters.search,
  });

  // Use optimized pagination helper
  const paginationOpts = paginateQuery({
    cursor: filters.cursor,
    limit: filters.limit,
  });

  // Build query with optimized includes
  const queryOptions: Prisma.EventFindManyArgs = {
    where,
    ...paginationOpts,
    orderBy: { localTimestamp: 'desc' },
    // Use optimized select to reduce data transfer
    select: {
      id: true,
      eventType: true,
      eventAction: true,
      title: true,
      content: true,
      localTimestamp: true,
      projectId: true,
      agentId: true,
      // Include minimal relation data
      project: { select: selectPresets.projectMinimal },
      agent: { select: selectPresets.agentMinimal },
    },
  };

  const events = await prisma.event.findMany(queryOptions);

  // Use optimized pagination result processor
  return processPaginatedResults(events, filters.limit);
}

export async function getEventById(userId: string, eventId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, userId },
    include: {
      project: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true } },
    },
  });
}

export async function getEventStats(userId: string, days: number = 7) {
  // Use optimized date range helper (M13-T1)
  const { start: dateFrom, end: dateTo } = getLastNDays(days);

  // Run both queries in parallel for better performance
  const [typeStats, dailyStats] = await Promise.all([
    // Use Prisma groupBy for type statistics
    prisma.event.groupBy({
      by: ['eventType'],
      where: {
        userId,
        localTimestamp: { gte: dateFrom, lte: dateTo },
      },
      _count: { id: true },
    }),
    // Use optimized aggregation for daily stats
    aggregations.dailyEventCounts(userId, dateFrom, dateTo),
  ]);

  return {
    byType: typeStats.map((s) => ({ type: s.eventType, count: s._count.id })),
    byDay: dailyStats,
  };
}

export async function searchEvents(userId: string, query: string, limit: number = 50) {
  // Optimized search with selective fields (M13-T1)
  return prisma.event.findMany({
    where: {
      userId, // Indexed column first for query optimization
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { filePath: { contains: query, mode: 'insensitive' } },
        { gitBranch: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: limit,
    orderBy: { localTimestamp: 'desc' },
    // Select only needed fields
    select: {
      id: true,
      eventType: true,
      eventAction: true,
      title: true,
      content: true,
      filePath: true,
      gitBranch: true,
      localTimestamp: true,
      projectId: true,
      project: { select: selectPresets.projectMinimal },
    },
  });
}

// Terminal event specific types
export interface TerminalStats {
  totalCommands: number;
  uniqueCommands: number;
  topCommands: Array<{
    command: string;
    count: number;
  }>;
  byShell: {
    bash: number;
    zsh: number;
    [key: string]: number;
  };
  byHour: number[]; // 24 elements, commands per hour
}

/**
 * Get terminal events for a user
 */
export async function getTerminalEvents(
  userId: string,
  filters: EventFiltersInput
) {
  const where: Record<string, unknown> = {
    userId,
    eventType: 'terminal',
  };

  if (filters.projectId) {
    where.projectId = filters.projectId;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.localTimestamp = {};
    if (filters.dateFrom) {
      (where.localTimestamp as Record<string, Date>).gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      (where.localTimestamp as Record<string, Date>).lte = new Date(filters.dateTo);
    }
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { content: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const queryOptions: Prisma.EventFindManyArgs = {
    where,
    take: filters.limit + 1,
    orderBy: { localTimestamp: 'desc' },
    include: {
      project: {
        select: { id: true, name: true },
      },
      agent: {
        select: { id: true, name: true },
      },
    },
  };

  if (filters.cursor) {
    queryOptions.cursor = { id: filters.cursor };
    queryOptions.skip = 1;
  }

  const events = await prisma.event.findMany(queryOptions);

  const hasMore = events.length > filters.limit;
  const items = hasMore ? events.slice(0, -1) : events;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return {
    items,
    pagination: {
      cursor: nextCursor,
      hasMore,
    },
  };
}

/**
 * Get terminal statistics for a user
 * Optimized with date helpers and selective queries (M13-T1)
 */
export async function getTerminalStats(
  userId: string,
  days: number = 7
): Promise<TerminalStats> {
  // Use optimized date range helper
  const { start: dateFrom, end: dateTo } = getLastNDays(days);

  // Get terminal events with minimal fields for statistics
  const terminalEvents = await prisma.event.findMany({
    where: {
      userId,
      eventType: 'terminal',
      localTimestamp: { gte: dateFrom, lte: dateTo },
    },
    // Select only fields needed for statistics (M13-T1)
    select: {
      title: true,
      content: true,
      metadata: true,
      localTimestamp: true,
    },
  });

  // Calculate statistics
  const totalCommands = terminalEvents.length;

  // Extract commands from title or content
  const commands = terminalEvents.map(e => {
    // Try to get command from metadata first, then title, then content
    const metadata = e.metadata as Record<string, unknown> | null;
    return (metadata?.command as string) || e.title || e.content || '';
  }).filter(Boolean);

  // Get unique commands (base command without arguments)
  const baseCommands = commands.map(cmd => {
    const parts = cmd.trim().split(/\s+/);
    return parts[0] || '';
  }).filter(Boolean);

  const uniqueCommands = new Set(baseCommands).size;

  // Top commands
  const commandCounts = baseCommands.reduce((acc, cmd) => {
    acc[cmd] = (acc[cmd] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCommands = Object.entries(commandCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([command, count]) => ({ command, count }));

  // By shell type
  const byShell: Record<string, number> = { bash: 0, zsh: 0 };
  terminalEvents.forEach(e => {
    const metadata = e.metadata as Record<string, unknown> | null;
    const shell = (metadata?.shell as string) || 'unknown';
    const shellType = shell.toLowerCase().includes('zsh') ? 'zsh' :
                      shell.toLowerCase().includes('bash') ? 'bash' : shell;
    byShell[shellType] = (byShell[shellType] || 0) + 1;
  });

  // By hour (24-hour distribution)
  const byHour = new Array(24).fill(0);
  terminalEvents.forEach(e => {
    const hour = new Date(e.localTimestamp).getHours();
    byHour[hour]++;
  });

  return {
    totalCommands,
    uniqueCommands,
    topCommands,
    byShell: byShell as TerminalStats['byShell'],
    byHour,
  };
}
