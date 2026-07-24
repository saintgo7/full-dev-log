'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck, Filter, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NotificationList } from '@/components/notifications';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import type { Notification, NotificationType } from '@/types';

const typeFilters: { value: NotificationType | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'report', label: '리포트' },
  { value: 'team', label: '팀' },
  { value: 'mention', label: '멘션' },
  { value: 'alert', label: '알림' },
  { value: 'system', label: '시스템' },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>(
    'all'
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotifications({
      type: selectedType === 'all' ? undefined : selectedType,
      limit: 20,
    });

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.pages.flatMap((page) => page.items) ?? [];

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <div>
      <Header title="알림" />

      <div className="p-6 space-y-6 max-w-4xl">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Type Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            {typeFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={selectedType === filter.value ? 'default' : 'outline'}
                size="sm"
                className="flex-shrink-0"
                onClick={() => setSelectedType(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Mark All as Read */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            모두 읽음 처리
          </Button>
        </div>

        {/* Notifications List */}
        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <NotificationList
                  notifications={notifications}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  onClick={handleNotificationClick}
                  groupByDate={true}
                  showActions={true}
                  emptyMessage={
                    selectedType === 'all'
                      ? '알림이 없습니다'
                      : `${typeFilters.find((f) => f.value === selectedType)?.label} 알림이 없습니다`
                  }
                />

                {/* Load More */}
                {hasNextPage && (
                  <div className="flex justify-center mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          불러오는 중...
                        </>
                      ) : (
                        '더 보기'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
