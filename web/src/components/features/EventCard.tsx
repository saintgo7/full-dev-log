'use client';

import { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { GitCommit, FileText, Terminal, StickyNote } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Event, EventType } from '@/types';

interface EventCardProps {
  event: Event;
  onSelect?: (event: Event) => void;
  isSelected?: boolean;
  className?: string;
}

const eventIcons: Record<EventType, React.ElementType> = {
  git: GitCommit,
  file: FileText,
  terminal: Terminal,
  manual: StickyNote,
};

const eventLabels: Record<EventType, string> = {
  git: 'Git',
  file: 'File',
  terminal: 'Terminal',
  manual: 'Note',
};

function EventCard({ event, onSelect, isSelected = false, className }: EventCardProps) {
  const Icon = eventIcons[event.eventType];

  const handleClick = () => {
    onSelect?.(event);
  };

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary',
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            event.eventType === 'git' && 'bg-event-git/10 text-event-git',
            event.eventType === 'file' && 'bg-event-file/10 text-event-file',
            event.eventType === 'terminal' && 'bg-event-terminal/10 text-event-terminal',
            event.eventType === 'manual' && 'bg-event-manual/10 text-event-manual'
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={event.eventType as 'git' | 'file' | 'terminal' | 'manual'}>
              {eventLabels[event.eventType]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {event.eventAction}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(event.localTimestamp), {
                addSuffix: true,
                locale: ko,
              })}
            </span>
          </div>

          {event.title && (
            <h4 className="font-medium text-sm truncate">{event.title}</h4>
          )}

          {event.filePath && (
            <p className="text-xs text-muted-foreground truncate font-mono">
              {event.filePath}
            </p>
          )}

          {event.gitBranch && (
            <p className="text-xs text-muted-foreground">
              <span className="font-mono">{event.gitBranch}</span>
              {event.gitCommitHash && (
                <span className="ml-2 font-mono">
                  {event.gitCommitHash.substring(0, 7)}
                </span>
              )}
            </p>
          )}

          {event.project && (
            <p className="text-xs text-muted-foreground mt-1">
              📁 {event.project.name}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default memo(EventCard);
