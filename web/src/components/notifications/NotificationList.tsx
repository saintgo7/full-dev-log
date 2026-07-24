'use client';

import { useMemo } from 'react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Inbox } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import type { Notification } from '@/types';

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: Notification) => void;
  groupByDate?: boolean;
  showActions?: boolean;
  emptyMessage?: string;
}

interface GroupedNotifications {
  label: string;
  notifications: Notification[];
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return '오늘';
  if (isYesterday(date)) return '어제';
  if (isThisWeek(date)) return format(date, 'EEEE', { locale: ko });
  return format(date, 'M월 d일', { locale: ko });
}

function groupNotificationsByDate(
  notifications: Notification[]
): GroupedNotifications[] {
  const groups: Map<string, Notification[]> = new Map();

  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt);
    const label = getDateLabel(date);

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(notification);
  });

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    notifications: items,
  }));
}

export function NotificationList({
  notifications,
  onMarkAsRead,
  onDelete,
  onClick,
  groupByDate = true,
  showActions = true,
  emptyMessage = '알림이 없습니다',
}: NotificationListProps) {
  const groupedNotifications = useMemo(() => {
    if (!groupByDate) {
      return [{ label: '', notifications }];
    }
    return groupNotificationsByDate(notifications);
  }, [notifications, groupByDate]);

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedNotifications.map((group, groupIndex) => (
        <div key={group.label || groupIndex}>
          {groupByDate && group.label && (
            <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
              {group.label}
            </h3>
          )}
          <div className="space-y-1">
            {group.notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                onClick={onClick}
                showActions={showActions}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
