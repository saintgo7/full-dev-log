'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Settings, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem } from './NotificationItem';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/useNotifications';
import type { Notification } from '@/types';

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: countData } = useUnreadCount();
  const { data: notificationsData, isLoading } = useNotifications({ limit: 5 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = countData?.count ?? 0;
  const notifications =
    notificationsData?.pages.flatMap((page) => page.items) ?? [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    setIsOpen(false);
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`알림 ${unreadCount > 0 ? `(${unreadCount}개 읽지 않음)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-background border rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold">알림</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsRead.isPending}
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  모두 읽음
                </Button>
              )}
              <Link href="/settings/notifications">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="max-h-[400px]">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 bg-muted rounded" />
                      <div className="h-3 w-full bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">알림이 없습니다</p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onClick={handleNotificationClick}
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t px-4 py-2">
              <Link
                href="/notifications"
                className="text-sm text-primary hover:underline block text-center"
                onClick={() => setIsOpen(false)}
              >
                모든 알림 보기
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
