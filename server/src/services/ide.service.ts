import { prisma, Prisma } from '../lib/prisma.js';
import { generateApiToken } from '../utils/jwt.js';
import { NotFoundError } from '../utils/errors.js';
import type {
  RegisterIdeInput,
  HeartbeatInput,
  IdeEventInput,
  IdeType,
} from '../schemas/ide.schema.js';
import type { EventType } from '@prisma/client';

// IDE Agent machine ID prefix for virtual IDE agents
const IDE_AGENT_PREFIX = 'ide-agent-';

// In-memory store for connected IDE instances
interface IdeInstance {
  id: string;
  userId: string;
  agentId: string; // Associated IDE agent for storing events
  ideName: string;
  ideType: IdeType;
  ideVersion?: string;
  extensionVersion?: string;
  workspacePath?: string;
  workspaceName?: string;
  machineId?: string;
  os?: string;
  token: string;
  connectedAt: Date;
  lastHeartbeat: Date;
  activeFile?: string;
  activeLanguage?: string;
  socketId?: string;
}

interface IdeStats {
  totalEvents: number;
  eventsByType: Array<{ type: string; count: number }>;
  eventsByIde: Array<{ ideType: string; count: number }>;
  topFiles: Array<{ filePath: string; count: number }>;
  topLanguages: Array<{ language: string; count: number }>;
  activityByHour: number[];
  connectedIdes: number;
}

/**
 * Get or create an IDE agent for storing IDE events
 * Each user gets one virtual "IDE Agent" to associate their IDE events with
 */
async function getOrCreateIdeAgent(userId: string, os?: string): Promise<string> {
  const machineId = `${IDE_AGENT_PREFIX}${userId}`;

  // Try to find existing IDE agent
  const existing = await prisma.agent.findUnique({
    where: { machineId },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  // Create new IDE agent for this user
  const apiToken = generateApiToken();
  const agent = await prisma.agent.create({
    data: {
      userId,
      name: 'IDE Integration',
      machineId,
      os: os || 'unknown',
      apiToken,
      status: 'active',
    },
    select: { id: true },
  });

  return agent.id;
}

/**
 * IDE Connection Manager
 * Manages connected IDE instances and their state
 */
class IdeConnectionManager {
  private instances: Map<string, IdeInstance> = new Map();
  private userInstances: Map<string, Set<string>> = new Map();
  private tokenToInstance: Map<string, string> = new Map();
  private heartbeatTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Register a new IDE instance
   */
  async registerIde(userId: string, input: RegisterIdeInput): Promise<IdeInstance> {
    const id = crypto.randomUUID();
    const token = generateApiToken();
    const now = new Date();

    // Get or create the IDE agent for storing events
    const agentId = await getOrCreateIdeAgent(userId, input.os);

    const instance: IdeInstance = {
      id,
      userId,
      agentId,
      ideName: input.ideName,
      ideType: input.ideType,
      ideVersion: input.ideVersion,
      extensionVersion: input.extensionVersion,
      workspacePath: input.workspacePath,
      workspaceName: input.workspaceName,
      machineId: input.machineId,
      os: input.os,
      token,
      connectedAt: now,
      lastHeartbeat: now,
    };

    // Store instance
    this.instances.set(id, instance);
    this.tokenToInstance.set(token, id);

    // Track per user
    if (!this.userInstances.has(userId)) {
      this.userInstances.set(userId, new Set());
    }
    this.userInstances.get(userId)!.add(id);

    return instance;
  }

  /**
   * Unregister an IDE instance
   */
  unregisterIde(instanceId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return false;
    }

    // Remove from all maps
    this.instances.delete(instanceId);
    this.tokenToInstance.delete(instance.token);

    const userSet = this.userInstances.get(instance.userId);
    if (userSet) {
      userSet.delete(instanceId);
      if (userSet.size === 0) {
        this.userInstances.delete(instance.userId);
      }
    }

    return true;
  }

  /**
   * Update heartbeat for an IDE instance
   */
  updateHeartbeat(input: HeartbeatInput): IdeInstance | null {
    const instance = this.instances.get(input.ideInstanceId);
    if (!instance) {
      return null;
    }

    instance.lastHeartbeat = new Date();
    instance.activeFile = input.activeFile;
    instance.activeLanguage = input.activeLanguage;

    if (input.workspacePath) {
      instance.workspacePath = input.workspacePath;
    }

    return instance;
  }

  /**
   * Get instance by ID
   */
  getInstance(instanceId: string): IdeInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Get instance by token
   */
  getInstanceByToken(token: string): IdeInstance | undefined {
    const instanceId = this.tokenToInstance.get(token);
    if (!instanceId) {
      return undefined;
    }
    return this.instances.get(instanceId);
  }

  /**
   * Get all instances for a user
   */
  getUserInstances(userId: string): IdeInstance[] {
    const instanceIds = this.userInstances.get(userId);
    if (!instanceIds) {
      return [];
    }

    const instances: IdeInstance[] = [];
    for (const id of instanceIds) {
      const instance = this.instances.get(id);
      if (instance) {
        instances.push(instance);
      }
    }

    return instances;
  }

  /**
   * Get active instances (with recent heartbeat)
   */
  getActiveInstances(userId: string): IdeInstance[] {
    const cutoff = new Date(Date.now() - this.heartbeatTimeout);
    return this.getUserInstances(userId).filter(
      instance => instance.lastHeartbeat >= cutoff
    );
  }

  /**
   * Check and remove stale instances
   */
  cleanupStaleInstances(): string[] {
    const cutoff = new Date(Date.now() - this.heartbeatTimeout);
    const staleIds: string[] = [];

    for (const [id, instance] of this.instances) {
      if (instance.lastHeartbeat < cutoff) {
        staleIds.push(id);
      }
    }

    for (const id of staleIds) {
      this.unregisterIde(id);
    }

    return staleIds;
  }

  /**
   * Set socket ID for an instance
   */
  setSocketId(instanceId: string, socketId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.socketId = socketId;
    }
  }

  /**
   * Get total connected count
   */
  getConnectedCount(): number {
    return this.instances.size;
  }

  /**
   * Get connected count for a user
   */
  getUserConnectedCount(userId: string): number {
    return this.userInstances.get(userId)?.size || 0;
  }
}

// Singleton instance
export const ideConnectionManager = new IdeConnectionManager();

/**
 * Register a new IDE instance
 */
export async function registerIde(userId: string, input: RegisterIdeInput) {
  const instance = await ideConnectionManager.registerIde(userId, input);

  // Log the registration as an event
  await prisma.event.create({
    data: {
      agentId: instance.agentId,
      userId,
      eventType: 'manual' as EventType,
      eventAction: 'ide_connected',
      title: `IDE Connected: ${input.ideName}`,
      content: `${input.ideType} ${input.ideVersion || ''} connected from ${input.workspacePath || 'unknown workspace'}`,
      metadata: {
        ideInstanceId: instance.id,
        ideType: input.ideType,
        ideVersion: input.ideVersion,
        extensionVersion: input.extensionVersion,
        workspacePath: input.workspacePath,
        workspaceName: input.workspaceName,
        machineId: input.machineId,
        os: input.os,
      } as Prisma.InputJsonValue,
      localTimestamp: new Date(),
    },
  });

  return {
    ideInstanceId: instance.id,
    token: instance.token,
    connectedAt: instance.connectedAt,
  };
}

/**
 * Handle IDE heartbeat
 */
export function heartbeat(input: HeartbeatInput) {
  const instance = ideConnectionManager.updateHeartbeat(input);

  if (!instance) {
    throw new NotFoundError('IDE instance');
  }

  return {
    status: 'active',
    lastHeartbeat: instance.lastHeartbeat,
    activeFile: instance.activeFile,
    activeLanguage: instance.activeLanguage,
  };
}

/**
 * Process batch events from IDE
 */
export async function processBatchEvents(
  userId: string,
  ideInstanceId: string,
  events: IdeEventInput[]
) {
  const instance = ideConnectionManager.getInstance(ideInstanceId);

  if (!instance) {
    throw new NotFoundError('IDE instance');
  }

  if (instance.userId !== userId) {
    throw new NotFoundError('IDE instance');
  }

  let processed = 0;
  let failed = 0;
  const created: Array<{
    id: string;
    eventType: string;
    eventAction: string;
    title: string | null;
  }> = [];

  // Map IDE event types to DevLog event types
  const mapEventType = (ideEventType: string): EventType => {
    switch (ideEventType) {
      case 'terminal_command':
        return 'terminal';
      case 'git_operation':
        return 'git';
      case 'file_open':
      case 'file_close':
      case 'file_save':
      case 'file_edit':
        return 'file';
      default:
        return 'manual';
    }
  };

  // Process events in transaction
  await prisma.$transaction(async (tx) => {
    for (const event of events) {
      try {
        const createdEvent = await tx.event.create({
          data: {
            agentId: instance.agentId,
            userId,
            eventType: mapEventType(event.eventType),
            eventAction: `ide_${event.eventAction}`,
            title: event.title,
            content: event.content,
            filePath: event.filePath,
            metadata: {
              ideInstanceId,
              ideType: instance.ideType,
              ideName: instance.ideName,
              originalEventType: event.eventType,
              language: event.language,
              lineNumber: event.lineNumber,
              columnNumber: event.columnNumber,
              duration: event.duration,
              ...(event.metadata || {}),
            } as Prisma.InputJsonValue,
            localTimestamp: new Date(event.localTimestamp),
          },
          select: {
            id: true,
            eventType: true,
            eventAction: true,
            title: true,
          },
        });

        created.push({
          id: createdEvent.id,
          eventType: createdEvent.eventType,
          eventAction: createdEvent.eventAction,
          title: createdEvent.title,
        });
        processed++;
      } catch (error) {
        console.error('Failed to create IDE event:', error);
        failed++;
      }
    }
  });

  // Update heartbeat
  ideConnectionManager.updateHeartbeat({
    ideInstanceId,
    activeFile: events[events.length - 1]?.filePath,
    activeLanguage: events[events.length - 1]?.language,
  });

  return { processed, failed, created };
}

/**
 * Get quick stats for IDE sidebar
 */
export async function getQuickStats(userId: string, days: number = 7): Promise<IdeStats> {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  // Get event counts by type
  const eventsByType = await prisma.event.groupBy({
    by: ['eventType'],
    where: {
      userId,
      localTimestamp: { gte: dateFrom },
    },
    _count: { id: true },
  });

  // Get total events
  const totalEvents = eventsByType.reduce((sum, e) => sum + e._count.id, 0);

  // Get top files (from events with filePath)
  const topFilesRaw = await prisma.event.groupBy({
    by: ['filePath'],
    where: {
      userId,
      localTimestamp: { gte: dateFrom },
      filePath: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  });

  const topFiles = topFilesRaw
    .filter(f => f.filePath)
    .map(f => ({
      filePath: f.filePath!,
      count: f._count.id,
    }));

  // Get IDE events by checking metadata for ideInstanceId
  // Using raw query since Prisma doesn't support JSON path queries well in groupBy
  const ideEvents = await prisma.event.findMany({
    where: {
      userId,
      localTimestamp: { gte: dateFrom },
      eventAction: { startsWith: 'ide_' },
    },
    select: {
      metadata: true,
      localTimestamp: true,
    },
  });

  // Count by IDE type and language
  const ideTypeCounts: Record<string, number> = {};
  const languageCounts: Record<string, number> = {};
  const hourCounts = new Array(24).fill(0);

  for (const event of ideEvents) {
    const metadata = event.metadata as Record<string, unknown> | null;
    if (metadata) {
      const ideType = metadata.ideType as string;
      if (ideType) {
        ideTypeCounts[ideType] = (ideTypeCounts[ideType] || 0) + 1;
      }

      const language = metadata.language as string;
      if (language) {
        languageCounts[language] = (languageCounts[language] || 0) + 1;
      }
    }

    const hour = new Date(event.localTimestamp).getHours();
    hourCounts[hour]++;
  }

  // Sort and format
  const eventsByIde = Object.entries(ideTypeCounts)
    .map(([ideType, count]) => ({ ideType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topLanguages = Object.entries(languageCounts)
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Get connected IDE count for this user
  const connectedIdes = ideConnectionManager.getUserConnectedCount(userId);

  return {
    totalEvents,
    eventsByType: eventsByType.map(e => ({
      type: e.eventType,
      count: e._count.id,
    })),
    eventsByIde,
    topFiles,
    topLanguages,
    activityByHour: hourCounts,
    connectedIdes,
  };
}

/**
 * Get status of all IDEs for a user
 */
export function getIdeStatus(userId: string) {
  const allInstances = ideConnectionManager.getUserInstances(userId);
  const activeInstances = ideConnectionManager.getActiveInstances(userId);
  const heartbeatTimeout = 5 * 60 * 1000;

  const instances = allInstances.map(instance => ({
    id: instance.id,
    ideName: instance.ideName,
    ideType: instance.ideType,
    ideVersion: instance.ideVersion,
    extensionVersion: instance.extensionVersion,
    workspacePath: instance.workspacePath,
    workspaceName: instance.workspaceName,
    os: instance.os,
    connectedAt: instance.connectedAt,
    lastHeartbeat: instance.lastHeartbeat,
    activeFile: instance.activeFile,
    activeLanguage: instance.activeLanguage,
    isActive: instance.lastHeartbeat >= new Date(Date.now() - heartbeatTimeout),
  }));

  return {
    total: allInstances.length,
    active: activeInstances.length,
    instances,
  };
}

/**
 * Disconnect an IDE instance
 */
export async function disconnectIde(userId: string, ideInstanceId: string, reason?: string) {
  const instance = ideConnectionManager.getInstance(ideInstanceId);

  if (!instance) {
    throw new NotFoundError('IDE instance');
  }

  if (instance.userId !== userId) {
    throw new NotFoundError('IDE instance');
  }

  // Log disconnect event
  await prisma.event.create({
    data: {
      agentId: instance.agentId,
      userId,
      eventType: 'manual' as EventType,
      eventAction: 'ide_disconnected',
      title: `IDE Disconnected: ${instance.ideName}`,
      content: reason || 'User initiated disconnect',
      metadata: {
        ideInstanceId,
        ideType: instance.ideType,
        ideName: instance.ideName,
        sessionDuration: Date.now() - instance.connectedAt.getTime(),
        reason,
      } as Prisma.InputJsonValue,
      localTimestamp: new Date(),
    },
  });

  // Remove instance
  ideConnectionManager.unregisterIde(ideInstanceId);

  return { success: true, message: 'IDE disconnected' };
}

/**
 * Validate IDE token for WebSocket authentication
 */
export function validateIdeToken(token: string) {
  const instance = ideConnectionManager.getInstanceByToken(token);
  if (!instance) {
    return null;
  }

  return {
    ideInstanceId: instance.id,
    userId: instance.userId,
    ideType: instance.ideType,
    ideName: instance.ideName,
  };
}
