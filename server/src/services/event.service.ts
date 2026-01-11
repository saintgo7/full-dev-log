import { prisma } from '../lib/prisma.js';
import type { CreateEventInput, EventFiltersInput } from '../schemas/event.schema.js';
import type { EventType } from '@prisma/client';

interface BatchResult {
  processed: number;
  failed: number;
}

export async function createEventBatch(
  agentId: string,
  userId: string,
  events: CreateEventInput[]
): Promise<BatchResult> {
  let processed = 0;
  let failed = 0;

  // Update last sync time
  await prisma.agent.update({
    where: { id: agentId },
    data: { lastSyncAt: new Date() },
  });

  // Process events in transaction
  await prisma.$transaction(async (tx) => {
    for (const event of events) {
      try {
        await tx.event.create({
          data: {
            agentId,
            userId,
            eventType: event.eventType as EventType,
            eventAction: event.eventAction,
            title: event.title,
            content: event.content,
            metadata: event.metadata || {},
            filePath: event.filePath,
            gitBranch: event.gitBranch,
            gitCommitHash: event.gitCommitHash,
            localTimestamp: new Date(event.localTimestamp),
          },
        });
        processed++;
      } catch (error) {
        console.error('Failed to create event:', error);
        failed++;
      }
    }
  });

  return { processed, failed };
}

export async function getEvents(userId: string, filters: EventFiltersInput) {
  const where: Record<string, unknown> = { userId };

  if (filters.projectId) {
    where.projectId = filters.projectId;
  }

  if (filters.eventType) {
    where.eventType = filters.eventType;
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

  // Cursor-based pagination
  const cursorOption = filters.cursor
    ? { cursor: { id: filters.cursor }, skip: 1 }
    : {};

  const events = await prisma.event.findMany({
    where,
    take: filters.limit + 1, // Fetch one extra to check if there are more
    orderBy: { localTimestamp: 'desc' },
    include: {
      project: {
        select: { id: true, name: true },
      },
      agent: {
        select: { id: true, name: true },
      },
    },
    ...cursorOption,
  });

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
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const stats = await prisma.event.groupBy({
    by: ['eventType'],
    where: {
      userId,
      localTimestamp: { gte: dateFrom },
    },
    _count: { id: true },
  });

  const dailyStats = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
    SELECT DATE(local_timestamp) as date, COUNT(*) as count
    FROM events
    WHERE user_id = ${userId}
      AND local_timestamp >= ${dateFrom}
    GROUP BY DATE(local_timestamp)
    ORDER BY date DESC
  `;

  return {
    byType: stats.map((s) => ({ type: s.eventType, count: s._count.id })),
    byDay: dailyStats.map((s) => ({ date: s.date, count: Number(s.count) })),
  };
}

export async function searchEvents(userId: string, query: string, limit: number = 50) {
  return prisma.event.findMany({
    where: {
      userId,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { filePath: { contains: query, mode: 'insensitive' } },
        { gitBranch: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: limit,
    orderBy: { localTimestamp: 'desc' },
    include: {
      project: { select: { id: true, name: true } },
    },
  });
}
