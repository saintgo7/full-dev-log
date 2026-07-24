'use client';

import { useState } from 'react';
import { Plus, Users, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { TeamCard } from '@/components/teams/TeamCard';
import { CreateTeamModal } from '@/components/teams/CreateTeamModal';
import { useTeams } from '@/hooks/useTeams';

export default function TeamsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useTeams({ limit: 12 });

  const teams = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div>
      <Header title="팀" />

      <div className="p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">내 팀</h2>
            <p className="text-sm text-muted-foreground">
              팀을 만들어 동료들과 협업하세요
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            팀 만들기
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && teams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">아직 팀이 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              새 팀을 만들어 동료들과 함께 개발 활동을 공유하고 협업하세요.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              첫 번째 팀 만들기
            </Button>
          </div>
        )}

        {/* Teams Grid */}
        {teams.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>

            {/* Load More */}
            {hasNextPage && (
              <div className="flex justify-center mt-8">
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
          </>
        )}
      </div>

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
