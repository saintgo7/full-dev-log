/**
 * Report Service - DevLog Hub Report Generation
 * M8-T2: Report Generation Service Implementation
 */

import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';
import type { GenerateReportInput, ReportFiltersInput } from '../schemas/report.schema.js';
import type { ReportType } from '@prisma/client';
import {
  ReportTemplate,
  ReportSummary,
  GitActivityReport,
  FileActivityReport,
  TerminalActivityReport,
  ProjectBreakdownItem,
  getDateRangeForType,
  calculateProductivityScore,
} from '../types/report.js';

/**
 * Database report type for API responses
 */
export interface ReportRecord {
  id: string;
  userId: string;
  projectId: string | null;
  reportType: ReportType;
  title: string;
  data: Prisma.JsonValue;
  startDate: Date;
  endDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  project?: {
    id: string;
    name: string;
  } | null;
}

/**
 * Calculate date range based on report type
 */
function calculateDateRange(type: ReportType, startDate?: string, endDate?: string): { dateFrom: Date; dateTo: Date } {
  if (type === 'custom') {
    if (!startDate || !endDate) {
      throw new Error('startDate and endDate are required for custom report type');
    }
    return {
      dateFrom: new Date(startDate),
      dateTo: new Date(endDate),
    };
  }

  const { startDate: dateFrom, endDate: dateTo } = getDateRangeForType(type);
  return { dateFrom, dateTo };
}

/**
 * Generate report title based on type and date range
 */
function generateReportTitle(type: ReportType, dateFrom: Date, dateTo: Date, projectName?: string): string {
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const prefix = projectName ? `[${projectName}] ` : '';

  switch (type) {
    case 'daily':
      return `${prefix}Daily Report - ${formatDate(dateFrom)}`;
    case 'weekly':
      return `${prefix}Weekly Report - ${formatDate(dateFrom)} to ${formatDate(dateTo)}`;
    case 'monthly':
      return `${prefix}Monthly Report - ${formatDate(dateFrom)} to ${formatDate(dateTo)}`;
    case 'custom':
      return `${prefix}Custom Report - ${formatDate(dateFrom)} to ${formatDate(dateTo)}`;
    default:
      return `${prefix}Report - ${formatDate(dateFrom)}`;
  }
}

/**
 * Get Git activity statistics
 */
async function getGitActivity(
  userId: string,
  dateFrom: Date,
  dateTo: Date,
  projectId?: string
): Promise<GitActivityReport> {
  const where: Prisma.EventWhereInput = {
    userId,
    eventType: 'git',
    localTimestamp: { gte: dateFrom, lte: dateTo },
  };

  if (projectId) {
    where.projectId = projectId;
  }

  const gitEvents = await prisma.event.findMany({
    where,
    orderBy: { localTimestamp: 'desc' },
    select: {
      eventAction: true,
      title: true,
      content: true,
      gitCommitHash: true,
      gitBranch: true,
      metadata: true,
      localTimestamp: true,
    },
  });

  const commits = gitEvents.filter(e => e.eventAction === 'commit');
  let linesAdded = 0;
  let linesDeleted = 0;
  const branches = new Set<string>();

  gitEvents.forEach(e => {
    if (e.gitBranch) branches.add(e.gitBranch);
    const metadata = e.metadata as Record<string, unknown> | null;
    if (metadata) {
      linesAdded += (metadata.linesAdded as number) || 0;
      linesDeleted += (metadata.linesDeleted as number) || 0;
    }
  });

  return {
    totalCommits: commits.length,
    linesAdded,
    linesDeleted,
    topCommits: commits.slice(0, 10).map(c => ({
      hash: c.gitCommitHash || '',
      message: c.title || c.content || 'No message',
      timestamp: c.localTimestamp,
    })),
    branches: Array.from(branches),
  };
}

/**
 * Get File activity statistics
 */
async function getFileActivity(
  userId: string,
  dateFrom: Date,
  dateTo: Date,
  projectId?: string
): Promise<FileActivityReport> {
  const where: Prisma.EventWhereInput = {
    userId,
    eventType: 'file',
    localTimestamp: { gte: dateFrom, lte: dateTo },
  };

  if (projectId) {
    where.projectId = projectId;
  }

  const fileEvents = await prisma.event.findMany({
    where,
    select: {
      eventAction: true,
      filePath: true,
    },
  });

  let created = 0;
  let modified = 0;
  let deleted = 0;
  const fileChanges = new Map<string, number>();
  const extensionCounts = new Map<string, number>();

  fileEvents.forEach(e => {
    // Count by action
    switch (e.eventAction) {
      case 'create':
        created++;
        break;
      case 'modify':
      case 'change':
        modified++;
        break;
      case 'delete':
        deleted++;
        break;
    }

    // Count by file path
    if (e.filePath) {
      fileChanges.set(e.filePath, (fileChanges.get(e.filePath) || 0) + 1);

      // Extract extension
      const ext = e.filePath.split('.').pop() || 'none';
      extensionCounts.set(ext, (extensionCounts.get(ext) || 0) + 1);
    }
  });

  // Top files by changes
  const topFiles = Array.from(fileChanges.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([path, changes]) => ({ path, changes }));

  // By extension
  const byExtension = Array.from(extensionCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([extension, count]) => ({ extension, count }));

  return {
    created,
    modified,
    deleted,
    topFiles,
    byExtension,
  };
}

/**
 * Get Terminal activity statistics
 */
async function getTerminalActivity(
  userId: string,
  dateFrom: Date,
  dateTo: Date,
  projectId?: string
): Promise<TerminalActivityReport> {
  const where: Prisma.EventWhereInput = {
    userId,
    eventType: 'terminal',
    localTimestamp: { gte: dateFrom, lte: dateTo },
  };

  if (projectId) {
    where.projectId = projectId;
  }

  const terminalEvents = await prisma.event.findMany({
    where,
    select: {
      title: true,
      content: true,
      metadata: true,
    },
  });

  const commandCounts = new Map<string, number>();
  const shellCounts: Record<string, number> = {};

  terminalEvents.forEach(e => {
    const metadata = e.metadata as Record<string, unknown> | null;
    const command = (metadata?.command as string) || e.title || e.content || '';
    const baseCommand = command.trim().split(/\s+/)[0];

    if (baseCommand) {
      commandCounts.set(baseCommand, (commandCounts.get(baseCommand) || 0) + 1);
    }

    // Shell type
    const shell = (metadata?.shell as string) || 'unknown';
    shellCounts[shell] = (shellCounts[shell] || 0) + 1;
  });

  const topCommands = Array.from(commandCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([command, count]) => ({ command, count }));

  return {
    totalCommands: terminalEvents.length,
    uniqueCommands: commandCounts.size,
    topCommands,
    byShell: shellCounts,
  };
}

/**
 * Get hourly distribution of events (24 hours)
 */
async function getHourlyDistribution(
  userId: string,
  dateFrom: Date,
  dateTo: Date,
  projectId?: string
): Promise<number[]> {
  const where: Prisma.EventWhereInput = {
    userId,
    localTimestamp: { gte: dateFrom, lte: dateTo },
  };

  if (projectId) {
    where.projectId = projectId;
  }

  const events = await prisma.event.findMany({
    where,
    select: { localTimestamp: true },
  });

  const hourlyDistribution = new Array(24).fill(0);
  events.forEach(e => {
    const hour = new Date(e.localTimestamp).getHours();
    hourlyDistribution[hour]++;
  });

  return hourlyDistribution;
}

/**
 * Get daily distribution of events
 */
async function getDailyDistribution(
  userId: string,
  dateFrom: Date,
  dateTo: Date,
  projectId?: string
): Promise<Array<{ date: string; count: number }>> {
  const where: Prisma.EventWhereInput = {
    userId,
    localTimestamp: { gte: dateFrom, lte: dateTo },
  };

  if (projectId) {
    where.projectId = projectId;
  }

  const dailyStats = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
    SELECT DATE(local_timestamp) as date, COUNT(*) as count
    FROM events
    WHERE user_id = ${userId}
      AND local_timestamp >= ${dateFrom}
      AND local_timestamp <= ${dateTo}
      ${projectId ? Prisma.sql`AND project_id = ${projectId}` : Prisma.empty}
    GROUP BY DATE(local_timestamp)
    ORDER BY date ASC
  `;

  return dailyStats.map(s => ({
    date: s.date,
    count: Number(s.count),
  }));
}

/**
 * Get project breakdown
 */
async function getProjectBreakdown(
  userId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<ProjectBreakdownItem[]> {
  const projectStats = await prisma.event.groupBy({
    by: ['projectId'],
    where: {
      userId,
      localTimestamp: { gte: dateFrom, lte: dateTo },
    },
    _count: { id: true },
  });

  const totalEvents = projectStats.reduce((sum, s) => sum + s._count.id, 0);

  // Get project names
  const projectIds = projectStats
    .map(s => s.projectId)
    .filter((id): id is string => id !== null);

  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true },
  });

  const projectMap = new Map(projects.map(p => [p.id, p.name]));

  return projectStats.map(s => ({
    projectId: s.projectId,
    projectName: s.projectId ? (projectMap.get(s.projectId) || 'Unknown') : 'Unassigned',
    eventCount: s._count.id,
    percentage: totalEvents > 0 ? Math.round((s._count.id / totalEvents) * 100) : 0,
  })).sort((a, b) => b.eventCount - a.eventCount);
}

/**
 * Calculate active hours from hourly distribution
 */
function calculateActiveHours(hourlyDistribution: number[]): number {
  return hourlyDistribution.filter(count => count > 0).length;
}

/**
 * Determine top activity type
 */
function getTopActivityType(
  gitActivity: GitActivityReport,
  fileActivity: FileActivityReport,
  terminalActivity: TerminalActivityReport
): string {
  const activities = [
    { type: 'Git', count: gitActivity.totalCommits },
    { type: 'File', count: fileActivity.created + fileActivity.modified + fileActivity.deleted },
    { type: 'Terminal', count: terminalActivity.totalCommands },
  ];

  const sorted = activities.sort((a, b) => b.count - a.count);
  return sorted[0].count > 0 ? sorted[0].type : 'None';
}

/**
 * Generate report content in markdown format
 */
function generateReportContent(
  type: ReportType,
  dateFrom: Date,
  dateTo: Date,
  summary: ReportSummary,
  gitActivity: GitActivityReport,
  fileActivity: FileActivityReport,
  terminalActivity: TerminalActivityReport,
  projectName?: string
): string {
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const formatDateTime = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 19);

  let content = `# ${generateReportTitle(type, dateFrom, dateTo, projectName)}\n\n`;
  content += `**Period:** ${formatDate(dateFrom)} ~ ${formatDate(dateTo)}\n\n`;
  content += `**Generated:** ${formatDateTime(new Date())}\n\n`;
  content += `---\n\n`;

  // Summary section
  content += `## Summary\n\n`;
  content += `- **Total Events:** ${summary.totalEvents}\n`;
  content += `- **Active Hours:** ${summary.activeHours}\n`;
  content += `- **Top Activity:** ${summary.topActivity}\n`;
  content += `- **Productivity Score:** ${summary.productivity}/100\n\n`;

  // Git activity
  content += `## Git Activity\n\n`;
  content += `- **Total Commits:** ${gitActivity.totalCommits}\n`;
  content += `- **Lines Added:** ${gitActivity.linesAdded}\n`;
  content += `- **Lines Deleted:** ${gitActivity.linesDeleted}\n`;
  content += `- **Branches:** ${gitActivity.branches.join(', ') || 'N/A'}\n\n`;

  if (gitActivity.topCommits.length > 0) {
    content += `### Recent Commits\n\n`;
    gitActivity.topCommits.forEach(commit => {
      const hash = commit.hash ? commit.hash.substring(0, 7) : 'N/A';
      content += `- \`${hash}\` - ${commit.message} (${formatDateTime(commit.timestamp)})\n`;
    });
    content += `\n`;
  }

  // File activity
  content += `## File Activity\n\n`;
  content += `- **Created:** ${fileActivity.created}\n`;
  content += `- **Modified:** ${fileActivity.modified}\n`;
  content += `- **Deleted:** ${fileActivity.deleted}\n\n`;

  if (fileActivity.topFiles.length > 0) {
    content += `### Top Files\n\n`;
    content += `| File | Changes |\n`;
    content += `|------|--------|\n`;
    fileActivity.topFiles.forEach(file => {
      content += `| ${file.path} | ${file.changes} |\n`;
    });
    content += `\n`;
  }

  // Terminal activity
  content += `## Terminal Activity\n\n`;
  content += `- **Total Commands:** ${terminalActivity.totalCommands}\n`;
  content += `- **Unique Commands:** ${terminalActivity.uniqueCommands}\n\n`;

  if (terminalActivity.topCommands.length > 0) {
    content += `### Top Commands\n\n`;
    content += `| Command | Count |\n`;
    content += `|---------|-------|\n`;
    terminalActivity.topCommands.forEach(cmd => {
      content += `| ${cmd.command} | ${cmd.count} |\n`;
    });
    content += `\n`;
  }

  return content;
}

/**
 * Escape HTML-special characters to prevent XSS in the HTML export
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Convert markdown to HTML
 */
function markdownToHtml(markdown: string, title: string): string {
  // Escape first so agent-collected content (commit messages, file paths,
  // terminal commands) can't inject markup; markdown syntax markers survive.
  let html = escapeHtml(markdown)
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^---$/gim, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');

  const tableRegex = /\|(.+)\|\n\|[-|]+\|\n((?:\|.+\|\n?)+)/g;
  html = html.replace(tableRegex, (match, header, body) => {
    const headerCells = header.split('|').filter(Boolean).map((h: string) => `<th>${h.trim()}</th>`).join('');
    const rows = body.trim().split('\n').map((row: string) => {
      const cells = row.split('|').filter(Boolean).map((c: string) => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; }
    h3 { color: #374151; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-family: 'Monaco', 'Consolas', monospace; font-size: 0.9em; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #e5e7eb; padding: 10px 14px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
    tr:nth-child(even) { background: #fafafa; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    strong { color: #1f2937; }
  </style>
</head>
<body>
  <p>${html}</p>
</body>
</html>`;
}

/**
 * Generate a comprehensive report
 */
export async function generateReport(
  userId: string,
  input: GenerateReportInput
): Promise<ReportTemplate> {
  const { type, projectId, startDate, endDate } = input;
  const { dateFrom, dateTo } = calculateDateRange(type as ReportType, startDate, endDate);

  // Get project name if projectId is provided
  let projectName: string | undefined;
  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId },
      select: { name: true },
    });
    projectName = project?.name;
  }

  // Gather all activity data in parallel
  const [gitActivity, fileActivity, terminalActivity, hourlyDistribution, dailyDistribution, projectBreakdown] =
    await Promise.all([
      getGitActivity(userId, dateFrom, dateTo, projectId),
      getFileActivity(userId, dateFrom, dateTo, projectId),
      getTerminalActivity(userId, dateFrom, dateTo, projectId),
      getHourlyDistribution(userId, dateFrom, dateTo, projectId),
      getDailyDistribution(userId, dateFrom, dateTo, projectId),
      projectId ? Promise.resolve([]) : getProjectBreakdown(userId, dateFrom, dateTo),
    ]);

  // Calculate summary
  const totalEvents =
    gitActivity.totalCommits +
    fileActivity.created +
    fileActivity.modified +
    fileActivity.deleted +
    terminalActivity.totalCommands;

  const activeHours = calculateActiveHours(hourlyDistribution);
  const topActivity = getTopActivityType(gitActivity, fileActivity, terminalActivity);
  const productivity = calculateProductivityScore(totalEvents, activeHours, gitActivity.totalCommits);

  const summary: ReportSummary = {
    totalEvents,
    activeHours,
    topActivity,
    productivity,
  };

  // Generate content
  const title = generateReportTitle(type as ReportType, dateFrom, dateTo, projectName);
  const content = generateReportContent(
    type as ReportType,
    dateFrom,
    dateTo,
    summary,
    gitActivity,
    fileActivity,
    terminalActivity,
    projectName
  );

  // Prepare the full report template for JSON storage
  const reportData: ReportTemplate = {
    id: '', // Will be set after creation
    type: type as ReportType,
    userId,
    projectId,
    projectName,
    startDate: dateFrom,
    endDate: dateTo,
    generatedAt: new Date(),
    summary,
    gitActivity,
    fileActivity,
    terminalActivity,
    hourlyDistribution,
    dailyDistribution,
    projectBreakdown,
  };

  // Save to database
  const report = await prisma.report.create({
    data: {
      userId,
      projectId,
      reportType: type as ReportType,
      title,
      data: reportData as unknown as Prisma.JsonObject,
      startDate: dateFrom,
      endDate: dateTo,
      status: 'generated',
    },
  });

  // Return full report template
  return {
    id: report.id,
    type: type as ReportType,
    userId,
    projectId,
    projectName,
    startDate: dateFrom,
    endDate: dateTo,
    generatedAt: report.createdAt,
    summary,
    gitActivity,
    fileActivity,
    terminalActivity,
    hourlyDistribution,
    dailyDistribution,
    projectBreakdown,
  };
}

/**
 * Get reports for a user with pagination
 */
export async function getReports(
  userId: string,
  filters: ReportFiltersInput
): Promise<{ items: ReportRecord[]; pagination: { cursor: string | null; hasMore: boolean; total: number } }> {
  const where: Prisma.ReportWhereInput = { userId };

  if (filters.type) {
    where.reportType = filters.type as ReportType;
  }

  if (filters.projectId) {
    where.projectId = filters.projectId;
  }

  const queryOptions: Prisma.ReportFindManyArgs = {
    where,
    take: filters.limit + 1,
    orderBy: { createdAt: 'desc' },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  };

  if (filters.cursor) {
    queryOptions.cursor = { id: filters.cursor };
    queryOptions.skip = 1;
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany(queryOptions),
    prisma.report.count({ where }),
  ]);

  const hasMore = reports.length > filters.limit;
  const items = hasMore ? reports.slice(0, -1) : reports;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return {
    items,
    pagination: {
      cursor: nextCursor,
      hasMore,
      total,
    },
  };
}

/**
 * Get a single report by ID
 */
export async function getReportById(
  userId: string,
  reportId: string
): Promise<ReportRecord | null> {
  return prisma.report.findFirst({
    where: { id: reportId, userId },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });
}

/**
 * Delete a report
 */
export async function deleteReport(
  userId: string,
  reportId: string
): Promise<boolean> {
  const report = await prisma.report.findFirst({
    where: { id: reportId, userId },
  });

  if (!report) {
    return false;
  }

  await prisma.report.delete({
    where: { id: reportId },
  });

  return true;
}

/**
 * Export report to markdown or HTML format
 */
export async function exportReport(
  userId: string,
  reportId: string,
  format: 'json' | 'markdown' | 'html'
): Promise<{ content: string; filename: string; contentType: string } | null> {
  const report = await getReportById(userId, reportId);

  if (!report) {
    return null;
  }

  // Parse the stored JSON data as ReportTemplate
  const reportData = report.data as unknown as ReportTemplate;

  // Generate markdown content from stored data
  const markdownContent = generateReportContent(
    reportData.type,
    reportData.startDate,
    reportData.endDate,
    reportData.summary,
    reportData.gitActivity,
    reportData.fileActivity,
    reportData.terminalActivity,
    reportData.projectName || undefined
  );

  switch (format) {
    case 'html':
      return {
        content: markdownToHtml(markdownContent, report.title),
        filename: `report-${reportId}.html`,
        contentType: 'text/html',
      };
    case 'json':
      return {
        content: JSON.stringify(reportData, null, 2),
        filename: `report-${reportId}.json`,
        contentType: 'application/json',
      };
    case 'markdown':
    default:
      return {
        content: markdownContent,
        filename: `report-${reportId}.md`,
        contentType: 'text/markdown',
      };
  }
}

/**
 * Regenerate report data (refresh an existing report)
 */
export async function regenerateReport(
  userId: string,
  reportId: string
): Promise<ReportTemplate | null> {
  const existingReport = await prisma.report.findFirst({
    where: { id: reportId, userId },
  });

  if (!existingReport) {
    return null;
  }

  // Delete old report
  await prisma.report.delete({ where: { id: reportId } });

  // Generate new report with same parameters
  return generateReport(userId, {
    type: existingReport.reportType,
    projectId: existingReport.projectId || undefined,
    startDate: existingReport.startDate.toISOString(),
    endDate: existingReport.endDate.toISOString(),
  });
}
