'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Filter, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActivityFeed } from '@/components/teams/ActivityFeed';
import { useTeam, useTeamActivity } from '@/hooks/useTeams';
import type { TeamActivityType } from '@/types';
import { cn } from '@/lib/utils';

interface ActivityPageProps {
  params: Promise<{ id: string }>;
}

const activityTypeFilters: Array<{
  value: TeamActivityType | 'all';
  label: string;
}> = [
  { value: 'all', label: '전체' },
  { value: 'member_joined', label: '멤버 가입' },
  { value: 'member_left', label: '멤버 탈퇴' },
  { value: 'member_role_changed', label: '역할 변경' },
  { value: 'note_created', label: '노트 생성' },
  { value: 'note_updated', label: '노트 수정' },
  { value: 'note_pinned', label: '노트 고정' },
  { value: 'project_added', label: '프로젝트 추가' },
  { value: 'project_removed', label: '프로젝트 제거' },
];

export default function ActivityPage({ params }: ActivityPageProps) {
  const { id: teamId } = use(params);
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<TeamActivityType | 'all'>(
    'all'
  );

  const { data: team, isLoading: teamLoading } = useTeam(teamId);
  const {
    data: activityData,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTeamActivity(teamId, {
    activityType: selectedFilter === 'all' ? undefined : selectedFilter,
    limit: 20,
  });

  const activities = activityData?.pages.flatMap((page) => page.items) ?? [];

  if (teamLoading) {
    return (
      <div>
        <Header title="팀 활동" />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-96 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div>
        <Header title="팀 활동" />
        <div className="p-6 text-center py-16">
          <h2 className="text-xl font-semibold mb-2">팀을 찾을 수 없습니다</h2>
          <Button onClick={() => router.push('/teams')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            팀 목록으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title={`${team.name} - 활동`} />

      <div className="p-6 space-y-6">
        {/* Back & Header */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2"
            onClick={() => router.push(`/teams/${teamId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            팀 대시보드
          </Button>
          <h1 className="text-2xl font-bold">팀 활동</h1>
          <p className="text-muted-foreground">
            팀의 모든 활동 내역을 확인하세요
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              활동 유형 필터
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activityTypeFilters.map((filter) => (
                <Badge
                  key={filter.value}
                  variant={
                    selectedFilter === filter.value ? 'default' : 'outline'
                  }
                  className={cn(
                    'cursor-pointer transition-colors',
                    selectedFilter === filter.value
                      ? ''
                      : 'hover:bg-accent'
                  )}
                  onClick={() => setSelectedFilter(filter.value)}
                >
                  {filter.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">활동 타임라인</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed
              activities={activities}
              isLoading={isLoading}
              hasMore={hasNextPage}
              onLoadMore={() => fetchNextPage()}
            />

            {/* Load More Button */}
            {hasNextPage && !isLoading && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      로딩 중...
                    </>
                  ) : (
                    '더 보기'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
