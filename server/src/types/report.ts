/**
 * Report Types - DevLog Hub Report System
 * M8-T1: Report Template Design
 */

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';
export type ReportFormat = 'json' | 'markdown' | 'html';

/**
 * Summary section of the report
 */
export interface ReportSummary {
  totalEvents: number;
  activeHours: number;
  topActivity: string;
  productivity: number; // 0-100 score
}

/**
 * Git activity section
 */
export interface GitActivityReport {
  totalCommits: number;
  linesAdded: number;
  linesDeleted: number;
  topCommits: Array<{
    hash: string;
    message: string;
    timestamp: Date;
  }>;
  branches: string[];
}

/**
 * File activity section
 */
export interface FileActivityReport {
  created: number;
  modified: number;
  deleted: number;
  topFiles: Array<{
    path: string;
    changes: number;
  }>;
  byExtension: Array<{
    extension: string;
    count: number;
  }>;
}

/**
 * Terminal activity section
 */
export interface TerminalActivityReport {
  totalCommands: number;
  uniqueCommands: number;
  topCommands: Array<{
    command: string;
    count: number;
  }>;
  byShell: Record<string, number>;
}

/**
 * Project breakdown item
 */
export interface ProjectBreakdownItem {
  projectId: string | null;
  projectName: string;
  eventCount: number;
  percentage: number;
}

/**
 * Main Report Template Interface
 */
export interface ReportTemplate {
  id: string;
  type: ReportType;
  userId: string;
  projectId?: string | null;
  projectName?: string | null;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;

  summary: ReportSummary;
  gitActivity: GitActivityReport;
  fileActivity: FileActivityReport;
  terminalActivity: TerminalActivityReport;
  hourlyDistribution: number[]; // 24 elements (0-23 hours)
  dailyDistribution: Array<{
    date: string;
    count: number;
  }>;
  projectBreakdown: ProjectBreakdownItem[];
}

/**
 * Report generation parameters
 */
export interface GenerateReportParams {
  userId: string;
  type: ReportType;
  startDate?: Date;
  endDate?: Date;
  projectId?: string;
  format?: ReportFormat;
}

/**
 * Report list query options
 */
export interface ReportListOptions {
  type?: ReportType;
  projectId?: string;
  limit?: number;
  offset?: number;
  cursor?: string;
}

/**
 * Report export options
 */
export interface ReportExportOptions {
  format: ReportFormat;
  includeDetails?: boolean;
  filename?: string;
}

/**
 * Report response for API
 */
export interface ReportResponse {
  report: ReportTemplate;
  exportUrl?: string;
}

/**
 * Calculate date ranges for report types
 */
export function getDateRangeForType(type: ReportType): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = new Date(now);
  let startDate: Date;

  switch (type) {
    case 'daily':
      // Today 00:00 ~ 23:59
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'weekly':
      // This week Monday 00:00 ~ Sunday 23:59
      startDate = new Date(now);
      const dayOfWeek = startDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate.setDate(startDate.getDate() - daysToMonday);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'monthly':
      // This month 1st 00:00 ~ last day 23:59
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Last day of current month
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'custom':
    default:
      // Default to last 7 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return { startDate, endDate };
}

/**
 * Calculate productivity score based on activity
 */
export function calculateProductivityScore(
  totalEvents: number,
  activeHours: number,
  gitCommits: number
): number {
  // Base score from events (max 40 points)
  const eventScore = Math.min(totalEvents / 50 * 40, 40);

  // Active hours score (max 30 points, optimal is 6-8 hours)
  let hoursScore = 0;
  if (activeHours >= 6 && activeHours <= 8) {
    hoursScore = 30;
  } else if (activeHours > 8) {
    hoursScore = Math.max(30 - (activeHours - 8) * 2, 15);
  } else {
    hoursScore = activeHours / 6 * 30;
  }

  // Git commits score (max 30 points)
  const commitScore = Math.min(gitCommits / 10 * 30, 30);

  return Math.round(eventScore + hoursScore + commitScore);
}
