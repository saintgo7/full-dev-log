'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Clock,
  GitCommit,
  GitBranch,
  FileText,
  FilePlus,
  FileEdit,
  FileX,
  TrendingUp,
  Target,
  FolderKanban,
  Zap,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Report } from '@/types';

interface ReportDetailProps {
  report: Report;
  className?: string;
}

// Productivity score color
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

// Format hour to readable string
function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}${period}`;
}

// Summary Cards Section
function SummarySection({ report }: { report: Report }) {
  const { summary } = report;
  const activeHours = Math.round(summary.totalActiveMinutes / 60);
  const activeMinutes = summary.totalActiveMinutes % 60;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Summary</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalEvents.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Development activities recorded
            </p>
          </CardContent>
        </Card>

        {/* Active Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeHours}h {activeMinutes}m
            </div>
            <p className="text-xs text-muted-foreground">
              Total coding hours
            </p>
          </CardContent>
        </Card>

        {/* Productivity Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', getScoreColor(summary.productivityScore))}>
              {summary.productivityScore}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on activity patterns
            </p>
          </CardContent>
        </Card>

        {/* Peak Hour */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHour(summary.peakHour)}
            </div>
            <p className="text-xs text-muted-foreground">
              Most active time of day
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// Git Activity Section
function GitActivitySection({ report }: { report: Report }) {
  const { gitActivity } = report;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Git Activity</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Git Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Commit Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <GitCommit className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                <div className="text-xl font-bold">{gitActivity.totalCommits}</div>
                <div className="text-xs text-muted-foreground">Commits</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <TrendingUp className="w-5 h-5 mx-auto mb-2 text-green-500" />
                <div className="text-xl font-bold text-green-600">
                  +{gitActivity.totalLinesAdded.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Lines Added</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <TrendingUp className="w-5 h-5 mx-auto mb-2 text-red-500 transform rotate-180" />
                <div className="text-xl font-bold text-red-600">
                  -{gitActivity.totalLinesRemoved.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Lines Removed</div>
              </div>
            </div>

            {/* Branch Activity */}
            {gitActivity.branchActivity.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Branch Activity
                </h4>
                <div className="space-y-2">
                  {gitActivity.branchActivity.slice(0, 5).map((branch) => {
                    const maxCommits = gitActivity.branchActivity[0]?.commits || 1;
                    const percentage = (branch.commits / maxCommits) * 100;

                    return (
                      <div key={branch.branch} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <code className="text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[180px]">
                            {branch.branch}
                          </code>
                          <span className="text-muted-foreground">{branch.commits}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500/60 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Commits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notable Commits</CardTitle>
          </CardHeader>
          <CardContent>
            {gitActivity.topCommits.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No commits in this period
              </p>
            ) : (
              <div className="space-y-3">
                {gitActivity.topCommits.slice(0, 5).map((commit) => (
                  <div
                    key={commit.hash}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <GitCommit className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">
                        {commit.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs text-muted-foreground font-mono">
                          {commit.hash.slice(0, 7)}
                        </code>
                        <span className="text-xs text-muted-foreground">
                          {new Date(commit.timestamp).toLocaleDateString('ko-KR')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {commit.linesChanged > 0 ? `+${commit.linesChanged}` : commit.linesChanged} lines
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// File Activity Section
function FileActivitySection({ report }: { report: Report }) {
  const { fileActivity } = report;
  const totalFileChanges =
    fileActivity.filesCreated + fileActivity.filesModified + fileActivity.filesDeleted;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">File Activity</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {/* File Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">File Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <FilePlus className="w-5 h-5 mx-auto mb-2 text-green-500" />
                <div className="text-xl font-bold">{fileActivity.filesCreated}</div>
                <div className="text-xs text-muted-foreground">Created</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <FileEdit className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                <div className="text-xl font-bold">{fileActivity.filesModified}</div>
                <div className="text-xs text-muted-foreground">Modified</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <FileX className="w-5 h-5 mx-auto mb-2 text-red-500" />
                <div className="text-xl font-bold">{fileActivity.filesDeleted}</div>
                <div className="text-xs text-muted-foreground">Deleted</div>
              </div>
            </div>

            {/* File Type Distribution */}
            {fileActivity.fileTypeDistribution.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">File Types</h4>
                <div className="flex flex-wrap gap-2">
                  {fileActivity.fileTypeDistribution.slice(0, 8).map((type) => (
                    <Badge
                      key={type.extension}
                      variant="outline"
                      className="text-xs"
                    >
                      {type.extension || 'no ext'}{' '}
                      <span className="ml-1 text-muted-foreground">
                        {type.percentage.toFixed(0)}%
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Files */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Most Changed Files</CardTitle>
          </CardHeader>
          <CardContent>
            {fileActivity.topFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No file changes in this period
              </p>
            ) : (
              <div className="space-y-3">
                {fileActivity.topFiles.slice(0, 5).map((file, index) => (
                  <div
                    key={file.path}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30"
                  >
                    <span className="text-muted-foreground text-xs w-4">
                      {index + 1}.
                    </span>
                    <FileText className="w-4 h-4 text-violet-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono truncate">{file.path}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {file.changeCount}x
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// Hourly Activity Chart
function HourlyActivityChart({ data }: { data: Array<{ hour: number; count: number }> }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Hourly Activity Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32">
            {data.map((item) => {
              const height = (item.count / maxCount) * 100;
              return (
                <div
                  key={item.hour}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className={cn(
                      'w-full rounded-t transition-all',
                      item.count > 0 ? 'bg-primary/60' : 'bg-muted'
                    )}
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${formatHour(item.hour)}: ${item.count} events`}
                  />
                  {item.hour % 6 === 0 && (
                    <span className="text-xs text-muted-foreground">
                      {formatHour(item.hour)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

// Project Distribution Chart
function ProjectDistributionChart({
  data,
}: {
  data: Array<{ projectName: string; count: number; percentage: number }>;
}) {
  if (data.length === 0) return null;

  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FolderKanban className="w-4 h-4" />
            Project Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.map((project) => (
              <div key={project.projectName} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[200px]">
                    {project.projectName}
                  </span>
                  <span className="text-muted-foreground">
                    {project.count} ({project.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/60 rounded-full transition-all"
                    style={{ width: `${project.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function ReportDetail({ report, className }: ReportDetailProps) {
  return (
    <div className={cn('space-y-8', className)}>
      <SummarySection report={report} />
      <GitActivitySection report={report} />
      <FileActivitySection report={report} />
      <div className="grid gap-4 md:grid-cols-2">
        <HourlyActivityChart data={report.hourlyActivity} />
        <ProjectDistributionChart data={report.projectDistribution} />
      </div>
    </div>
  );
}
