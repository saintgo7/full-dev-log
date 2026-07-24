'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Terminal,
  Clock,
  Hash,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TerminalStats as TerminalStatsType } from '@/services/terminal';

interface TerminalStatsProps {
  stats?: TerminalStatsType;
  isLoading?: boolean;
  className?: string;
}

// Shell type badge colors
// bash: blue, zsh: green, others: gray
const SHELL_COLORS: Record<string, { bg: string; text: string }> = {
  bash: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
  },
  zsh: {
    bg: 'bg-green-500/10',
    text: 'text-green-600 dark:text-green-400',
  },
  fish: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
  },
  powershell: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
  },
  sh: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
};

const getShellColor = (shell: string) => {
  const normalizedShell = shell.toLowerCase();
  return SHELL_COLORS[normalizedShell] || {
    bg: 'bg-gray-500/10',
    text: 'text-gray-600 dark:text-gray-400',
  };
};

export function TerminalStats({ stats, isLoading, className }: TerminalStatsProps) {
  if (isLoading) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Commands */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commands</CardTitle>
            <Terminal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalCommands?.toLocaleString() ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time terminal commands
            </p>
          </CardContent>
        </Card>

        {/* Today's Commands */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.todayCommands?.toLocaleString() ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Commands executed today
            </p>
          </CardContent>
        </Card>

        {/* Top Command */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono truncate">
              {stats?.topCommands?.[0]?.command ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.topCommands?.[0]?.count ?? 0} executions
            </p>
          </CardContent>
        </Card>

        {/* Active Shells */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shells Used</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.shellUsage?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Different shell types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats: Top Commands and Shell Usage */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top 5 Commands */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top 5 Commands</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.topCommands?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No commands recorded yet
              </p>
            ) : (
              <div className="space-y-3">
                {stats.topCommands.slice(0, 5).map((cmd, index) => {
                  const maxCount = stats.topCommands[0]?.count || 1;
                  const percentage = (cmd.count / maxCount) * 100;

                  return (
                    <div key={cmd.command} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-4">
                            {index + 1}.
                          </span>
                          <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded max-w-[180px] truncate">
                            {cmd.command}
                          </code>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {cmd.count.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500/60 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shell Usage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Shell Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.shellUsage?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No shell data available
              </p>
            ) : (
              <div className="space-y-3">
                {stats.shellUsage.map((shell) => {
                  const colors = getShellColor(shell.shell);

                  return (
                    <div key={shell.shell} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              'text-xs font-mono',
                              colors.bg,
                              colors.text,
                              'border-transparent'
                            )}
                          >
                            {shell.shell}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {shell.count.toLocaleString()} ({shell.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            shell.shell.toLowerCase() === 'bash' && 'bg-blue-500/60',
                            shell.shell.toLowerCase() === 'zsh' && 'bg-green-500/60',
                            shell.shell.toLowerCase() === 'fish' && 'bg-orange-500/60',
                            shell.shell.toLowerCase() === 'powershell' && 'bg-purple-500/60',
                            shell.shell.toLowerCase() === 'sh' && 'bg-cyan-500/60',
                            !SHELL_COLORS[shell.shell.toLowerCase()] && 'bg-gray-500/60'
                          )}
                          style={{ width: `${shell.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
