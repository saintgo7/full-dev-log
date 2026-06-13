'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  FileText,
  Users,
  AtSign,
  AlertTriangle,
  Info,
  Trash2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType } from '@/types';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: Notification) => void;
  showActions?: boolean;
}

const typeConfig: Record<
  NotificationType,
  { icon: typeof FileText; color: string; bgColor: string }
> = {
  report: {
    icon: FileText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  team: {
    icon: Users,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  mention: {
    icon: AtSign,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  alert: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  system: {
    icon: Info,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
  },
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  showActions = true,
}: NotificationItemProps) {
  const config = typeConfig[notification.type] || typeConfig.system;
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    onClick?.(notification);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead?.(notification.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(notification.id);
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer group',
        notification.read
          ? 'bg-transparent hover:bg-muted/50'
          : 'bg-primary/5 hover:bg-primary/10'
      )}
      onClick={handleClick}
    >
      {/* Type Icon */}
      <div className={cn('p-2 rounded-lg flex-shrink-0', config.bgColor)}>
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm font-medium truncate',
              !notification.read && 'text-foreground',
              notification.read && 'text-muted-foreground'
            )}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: ko,
          })}
        </p>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.read && onMarkAsRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleMarkAsRead}
              title="읽음으로 표시"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={handleDelete}
              title="삭제"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
