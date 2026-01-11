export type EventType = 'git' | 'file' | 'terminal' | 'manual';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  machineId: string;
  os: string;
  status: 'active' | 'inactive' | 'revoked';
  lastSyncAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  apiToken?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  repoUrl: string | null;
  createdAt: string;
  members: ProjectMember[];
  _count?: { events: number };
}

export interface ProjectMember {
  id: string;
  role: 'owner' | 'member' | 'viewer';
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Event {
  id: string;
  eventType: EventType;
  eventAction: string;
  title: string | null;
  content: string | null;
  metadata: Record<string, unknown>;
  filePath: string | null;
  gitBranch: string | null;
  gitCommitHash: string | null;
  localTimestamp: string;
  serverTimestamp: string;
  project: { id: string; name: string } | null;
  agent: { id: string; name: string };
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EventStats {
  byType: Array<{ type: EventType; count: number }>;
  byDay: Array<{ date: string; count: number }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    cursor: string | null;
    hasMore: boolean;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}
