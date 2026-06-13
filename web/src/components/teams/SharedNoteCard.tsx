'use client';

import { Pin, MessageSquare, FolderKanban, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SharedNote } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SharedNoteCardProps {
  note: SharedNote;
  onTogglePin?: (noteId: string) => void;
  onEdit?: (noteId: string) => void;
  onDelete?: (noteId: string) => void;
  canManage?: boolean;
  className?: string;
}

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

export function SharedNoteCard({
  note,
  onTogglePin,
  onEdit,
  onDelete,
  canManage = false,
  className,
}: SharedNoteCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const commentCount = note._count?.comments ?? 0;

  return (
    <Card
      className={cn(
        'relative hover:bg-accent/50 transition-colors',
        note.isPinned && 'border-primary/50',
        className
      )}
    >
      {note.isPinned && (
        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
          <Pin className="h-3 w-3" />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold line-clamp-1">
            {note.title}
          </CardTitle>

          {canManage && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-40 rounded-md border bg-popover p-1 shadow-md z-50">
                    <button
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin?.(note.id);
                        setShowMenu(false);
                      }}
                    >
                      <Pin className="h-4 w-4" />
                      {note.isPinned ? '고정 해제' : '고정'}
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(note.id);
                        setShowMenu(false);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      수정
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(note.id);
                        setShowMenu(false);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {note.content}
        </p>

        {note.project && (
          <Badge variant="outline" className="mb-3 text-xs">
            <FolderKanban className="h-3 w-3 mr-1" />
            {note.project.name}
          </Badge>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-xs">
                {note.author.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {note.author.name}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {commentCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {commentCount}
              </span>
            )}
            <span>{formatRelativeTime(note.updatedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
