'use client';

import {
  UserPlus,
  UserMinus,
  Shield,
  StickyNote,
  Pin,
  FolderPlus,
  FolderMinus,
  Edit,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { TeamActivity, TeamActivityType } from '@/types';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  activities: TeamActivity[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

const activityConfig: Record<
  TeamActivityType,
  { icon: React.ElementType; color: string }
> = {
  member_joined: { icon: UserPlus, color: 'text-green-500' },
  member_left: { icon: UserMinus, color: 'text-red-500' },
  member_role_changed: { icon: Shield, color: 'text-blue-500' },
  note_created: { icon: StickyNote, color: 'text-yellow-500' },
  note_updated: { icon: Edit, color: 'text-orange-500' },
  note_pinned: { icon: Pin, color: 'text-purple-500' },
  project_added: { icon: FolderPlus, color: 'text-cyan-500' },
  project_removed: { icon: FolderMinus, color: 'text-pink-500' },
};

function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return then.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

export function ActivityFeed({
  activities,
  isLoading,
  hasMore,
  onLoadMore,
}: ActivityFeedProps) {
  if (isLoading && activities.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-muted" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/4 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        아직 활동 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-6">
        {activities.map((activity, index) => {
          const config = activityConfig[activity.activityType];
          const Icon = config.icon;

          return (
            <div key={activity.id} className="relative flex gap-4 pl-0">
              {/* Icon circle */}
              <div
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background',
                  config.color
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-start gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-xs">
                      {activity.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user.name}</span>
                      <span className="text-muted-foreground">
                        {' '}
                        {activity.description}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="text-sm text-primary hover:underline disabled:opacity-50"
          >
            {isLoading ? '로딩 중...' : '더 보기'}
          </button>
        </div>
      )}
    </div>
  );
}
