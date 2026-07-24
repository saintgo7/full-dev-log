// WebSocket event types
export enum SocketEvents {
  // Connection events
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  ERROR = 'error',

  // Room events
  JOIN_PROJECT = 'join:project',
  LEAVE_PROJECT = 'leave:project',
  JOIN_AGENT = 'join:agent',
  LEAVE_AGENT = 'leave:agent',

  // Event updates
  EVENT_NEW = 'event:new',
  EVENT_UPDATE = 'event:update',
  EVENT_DELETE = 'event:delete',
  EVENT_BATCH = 'event:batch',

  // Terminal events (specialized subscription)
  TERMINAL_NEW = 'terminal:new',
  TERMINAL_BATCH = 'terminal:batch',

  // Agent events
  AGENT_STATUS = 'agent:status',
  AGENT_STATUS_UPDATE = 'agent:status:update',
  AGENT_CONNECTED = 'agent:connected',
  AGENT_DISCONNECTED = 'agent:disconnected',
  AGENT_SYNC_START = 'agent:sync:start',
  AGENT_SYNC_COMPLETE = 'agent:sync:complete',

  // Notification events
  NOTIFICATION_NEW = 'notification:new',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_CLEAR = 'notification:clear',

  // Dashboard events
  DASHBOARD_STATS_UPDATE = 'dashboard:stats:update',
  DASHBOARD_ACTIVITY_UPDATE = 'dashboard:activity:update',

  // Project events
  PROJECT_UPDATE = 'project:update',
  PROJECT_MEMBER_JOIN = 'project:member:join',
  PROJECT_MEMBER_LEAVE = 'project:member:leave',

  // Note events
  NOTE_NEW = 'note:new',
  NOTE_UPDATE = 'note:update',
  NOTE_DELETE = 'note:delete',
}

export interface EventPayload {
  id: string;
  eventType: string;
  eventAction: string;
  filePath?: string;
  content?: any;
  localTimestamp: Date;
  agentId: string;
  projectId?: string;
}

export interface AgentStatusPayload {
  agentId: string;
  status: 'online' | 'offline' | 'syncing' | 'error';
  lastSeen?: Date;
  message?: string;
}

export interface NotificationPayload {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
}

export interface DashboardStatsPayload {
  totalEvents: number;
  todayEvents: number;
  activeAgents: number;
  activeProjects: number;
  recentActivity: any[];
}

/**
 * Terminal event payload for terminal:new events
 * Used for clients that want to subscribe specifically to terminal commands
 */
export interface TerminalEventPayload {
  id: string;
  command: string | null;
  eventAction: string;
  localTimestamp: Date;
  agent: {
    id: string;
    name: string;
    userId: string;
  };
  projectId?: string;
  metadata?: {
    shell?: string;
    exitCode?: number;
    cwd?: string;
    duration?: number;
  };
}

/**
 * Terminal statistics payload
 */
export interface TerminalStatsPayload {
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
  byHour: number[];
}