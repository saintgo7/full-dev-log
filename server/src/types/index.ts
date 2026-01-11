import { Request } from 'express';
import { User, Agent } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AgentPayload {
  agentId: string;
  userId: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface AgentRequest extends Request {
  agent?: Agent & { user: User };
}

export interface ApiResponse<T = unknown> {
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
    total?: number;
  };
}

export type EventType = 'git' | 'file' | 'terminal' | 'manual';

export interface CreateEventDto {
  eventType: EventType;
  eventAction: string;
  title?: string;
  content?: string;
  metadata?: Record<string, unknown>;
  filePath?: string;
  gitBranch?: string;
  gitCommitHash?: string;
  localTimestamp: string;
}

export interface EventFilters {
  userId?: string;
  projectId?: string;
  eventType?: EventType;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}
