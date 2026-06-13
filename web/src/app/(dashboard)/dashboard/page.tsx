'use client';

import { GitCommit, FileText, Terminal, PenLine, Activity, ServerIcon } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/features/StatsCard';
import { Timeline } from '@/components/features/Timeline';
import { RealtimeEventFeed } from '@/components/realtime/RealtimeEventFeed';
import { AgentStatusMonitor } from '@/components/realtime/AgentStatusMonitor';
import { useEvents, useEventStats } from '@/hooks/useEvents';
import { useAgents } from '@/hooks/useAgents';

export default function DashboardPage() {
  const { data: eventsData, isLoading: eventsLoading } = useEvents({ limit: 10 });
  const { data: stats, isLoading: statsLoading } = useEventStats(7);
  const { data: agents, isLoading: agentsLoading } = useAgents();

  const events = eventsData?.pages.flatMap((page) => page.items) ?? [];

  // Calculate active agents count
  const onlineAgents = agents?.filter(a => a.status === 'active').length ?? 0;
  const totalAgents = agents?.length ?? 0;

  const getTypeCount = (type: string) => {
    return stats?.byType.find((t) => t.type === type)?.count ?? 0;
  };

  const totalEvents = stats?.byType.reduce((sum, t) => sum + t.count, 0) ?? 0;

  return (
    <div>
      <Header title="대시보드" />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <StatsCard
            title="전체 활동"
            value={totalEvents}
            description="최근 7일"
            icon={<Activity className="h-4 w-4" />}
          />
          <StatsCard
            title="에이전트"
            value={`${onlineAgents}/${totalAgents}`}
            description="온라인/전체"
            icon={<ServerIcon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
          />
          <StatsCard
            title="Git 활동"
            value={getTypeCount('git')}
            description="커밋, 푸시 등"
            icon={<GitCommit className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
          />
          <StatsCard
            title="파일 변경"
            value={getTypeCount('file')}
            description="생성, 수정, 삭제"
            icon={<FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
          />
          <StatsCard
            title="터미널"
            value={getTypeCount('terminal')}
            description="명령 실행"
            icon={<Terminal className="h-4 w-4 text-green-600 dark:text-green-400" />}
          />
          <StatsCard
            title="메모"
            value={getTypeCount('manual')}
            description="수동 기록"
            icon={<PenLine className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
          />
        </div>

        {/* Agent Status Monitor */}
        {agents && agents.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">에이전트 상태</h2>
            <AgentStatusMonitor agents={agents} />
          </div>
        )}

        {agentsLoading && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">에이전트 상태</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <h2 className="text-lg font-semibold mb-4">최근 활동</h2>
            <Timeline
              events={events}
              isLoading={eventsLoading}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">실시간 피드</h2>
            <RealtimeEventFeed />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">일별 활동</h2>
            <div className="rounded-lg border bg-card p-6">
              {statsLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.byDay.slice(0, 7).map((day) => (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-24">
                        {new Date(day.date).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${Math.min((day.count / (Math.max(...stats.byDay.map(d => d.count)) || 1)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {day.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
