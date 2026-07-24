'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Hash,
  MessageSquare,
  Webhook,
  MoreVertical,
  Play,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Integration, IntegrationType } from '@/types';

interface IntegrationCardProps {
  integration: Integration;
  onTest?: (id: string) => void;
  onEdit?: (integration: Integration) => void;
  onDelete?: (id: string) => void;
  isTestPending?: boolean;
}

const typeConfig: Record<
  IntegrationType,
  { icon: typeof Hash; label: string; color: string; bgColor: string }
> = {
  slack: {
    icon: Hash,
    label: 'Slack',
    color: 'text-[#4A154B]',
    bgColor: 'bg-[#4A154B]/10',
  },
  discord: {
    icon: MessageSquare,
    label: 'Discord',
    color: 'text-[#5865F2]',
    bgColor: 'bg-[#5865F2]/10',
  },
  webhook: {
    icon: Webhook,
    label: 'Webhook',
    color: 'text-gray-600',
    bgColor: 'bg-gray-600/10',
  },
};

export function IntegrationCard({
  integration,
  onTest,
  onEdit,
  onDelete,
  isTestPending,
}: IntegrationCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const config = typeConfig[integration.type] || typeConfig.webhook;
  const Icon = config.icon;

  const handleTest = () => {
    onTest?.(integration.id);
    setShowMenu(false);
  };

  const handleEdit = () => {
    onEdit?.(integration);
    setShowMenu(false);
  };

  const handleDelete = () => {
    onDelete?.(integration.id);
    setShowMenu(false);
  };

  return (
    <Card className={cn(!integration.enabled && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          {/* Icon and Info */}
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-lg', config.bgColor)}>
              <Icon className={cn('h-5 w-5', config.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{integration.name}</h3>
                <Badge
                  variant={integration.enabled ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {integration.enabled ? '활성' : '비활성'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {config.label}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {integration.events.map((event) => (
                  <Badge key={event} variant="outline" className="text-xs">
                    {event}
                  </Badge>
                ))}
              </div>
              {integration.lastTestedAt && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  마지막 테스트:{' '}
                  {formatDistanceToNow(new Date(integration.lastTestedAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-40 bg-background border rounded-lg shadow-lg z-50 py-1">
                  <button
                    className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                    onClick={handleTest}
                    disabled={isTestPending}
                  >
                    {isTestPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    테스트
                  </button>
                  <button
                    className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                    onClick={handleEdit}
                  >
                    <Pencil className="h-4 w-4" />
                    수정
                  </button>
                  <button
                    className="w-full px-3 py-2 text-sm text-left hover:bg-muted text-destructive flex items-center gap-2"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
