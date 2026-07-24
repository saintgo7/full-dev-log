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

// Report types
export type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  startDate: string;
  endDate: string;
  projectId: string | null;
  project: { id: string; name: string } | null;
  summary: ReportSummary;
  gitActivity: ReportGitActivity;
  fileActivity: ReportFileActivity;
  hourlyActivity: Array<{ hour: number; count: number }>;
  projectDistribution: Array<{ projectName: string; count: number; percentage: number }>;
  createdAt: string;
  userId: string;
}

export interface ReportSummary {
  totalEvents: number;
  totalActiveMinutes: number;
  productivityScore: number;
  peakHour: number;
  mostActiveProject: string | null;
}

export interface ReportGitActivity {
  totalCommits: number;
  totalLinesAdded: number;
  totalLinesRemoved: number;
  topCommits: Array<{
    hash: string;
    message: string;
    timestamp: string;
    linesChanged: number;
  }>;
  branchActivity: Array<{ branch: string; commits: number }>;
}

export interface ReportFileActivity {
  filesCreated: number;
  filesModified: number;
  filesDeleted: number;
  topFiles: Array<{
    path: string;
    changeCount: number;
    lastModified: string;
  }>;
  fileTypeDistribution: Array<{ extension: string; count: number; percentage: number }>;
}

export interface GenerateReportParams {
  type: ReportType;
  projectId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReportListFilters {
  type?: ReportType;
  projectId?: string;
  limit?: number;
  cursor?: string;
}

// AI Insights types
export type AnomalySeverity = 'low' | 'medium' | 'high';
export type AnomalyType = 'unusual_hours' | 'activity_spike' | 'inactivity' | 'pattern_break';
export type RecommendationCategory = 'optimal_hours' | 'break_suggestion' | 'productivity_tip';

export interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description: string;
  detectedAt: string;
  dismissed: boolean;
  metadata?: Record<string, unknown>;
}

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
  priority: number;
  createdAt: string;
}

export interface PatternAnalysis {
  hourlyActivity: Array<{ hour: number; count: number; isPeakHour: boolean }>;
  dayOfWeekActivity: Array<{ day: number; dayName: string; count: number; intensity: number }>;
  peakHours: number[];
  quietHours: number[];
  averageSessionDuration: number;
  mostProductiveDay: string;
}

export interface ProductivityMetrics {
  score: number;
  previousScore: number;
  trend: number;
  level: 'low' | 'medium' | 'high' | 'excellent';
  streakDays: number;
  focusScore: number;
  consistencyScore: number;
}

export interface InsightsSummary {
  patterns: PatternAnalysis;
  productivity: ProductivityMetrics;
  anomalies: Anomaly[];
  recommendations: Recommendation[];
}

// Team types
export type TeamRole = 'owner' | 'admin' | 'member';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    members: number;
    projects: number;
    sharedNotes: number;
  };
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export type TeamActivityType =
  | 'member_joined'
  | 'member_left'
  | 'member_role_changed'
  | 'note_created'
  | 'note_updated'
  | 'note_pinned'
  | 'project_added'
  | 'project_removed';

export interface TeamActivity {
  id: string;
  teamId: string;
  activityType: TeamActivityType;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SharedNote {
  id: string;
  teamId: string;
  title: string;
  content: string;
  isPinned: boolean;
  projectId: string | null;
  project: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    comments: number;
  };
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: TeamRole;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface CreateTeamParams {
  name: string;
  description?: string;
}

export interface InviteMemberParams {
  email: string;
  role: TeamRole;
}

export interface UpdateMemberRoleParams {
  role: TeamRole;
}

export interface CreateSharedNoteParams {
  title: string;
  content: string;
  projectId?: string;
  isPinned?: boolean;
}

export interface TeamFilters {
  limit?: number;
  cursor?: string;
}

export interface TeamActivityFilters {
  activityType?: TeamActivityType;
  limit?: number;
  cursor?: string;
}

export interface SharedNoteFilters {
  projectId?: string;
  isPinned?: boolean;
  limit?: number;
  cursor?: string;
}

// Notification types
export type NotificationType = 'report' | 'team' | 'mention' | 'alert' | 'system';
export type NotificationChannel = 'email' | 'push' | 'in_app';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  channels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  types: {
    report: boolean;
    team: boolean;
    mention: boolean;
    alert: boolean;
    system: boolean;
  };
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  updatedAt: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  read?: boolean;
  limit?: number;
  cursor?: string;
}

export interface UpdateNotificationPreferences {
  channels?: {
    email?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
  types?: {
    report?: boolean;
    team?: boolean;
    mention?: boolean;
    alert?: boolean;
    system?: boolean;
  };
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

// Integration types
export type IntegrationType = 'slack' | 'discord' | 'webhook';

export interface Integration {
  id: string;
  teamId: string;
  type: IntegrationType;
  name: string;
  webhookUrl: string;
  enabled: boolean;
  events: string[];
  lastTestedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntegrationParams {
  type: IntegrationType;
  name: string;
  webhookUrl: string;
  events: string[];
}

export interface UpdateIntegrationParams {
  name?: string;
  webhookUrl?: string;
  enabled?: boolean;
  events?: string[];
}

export interface IntegrationTestResult {
  success: boolean;
  message: string;
  testedAt: string;
}
