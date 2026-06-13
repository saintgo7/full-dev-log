'use client';

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Terminal,
  FolderOpen,
  Clock,
  ChevronRight,
  Loader2,
  ArrowUp,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';
import type { Event } from '@/types';

interface TerminalEventListProps {
  events: Event[];
  isLoading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  onEventSelect?: (event: Event) => void;
  selectedEventId?: string;
  className?: string;
}

// Shell type badge colors (bash: blue, zsh: green)
const SHELL_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  bash: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
  },
  zsh: {
    bg: 'bg-green-500/10',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500/20',
  },
  fish: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/20',
  },
  powershell: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/20',
  },
  sh: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/20',
  },
};

const getShellBadgeColor = (shell: string) => {
  const normalizedShell = shell?.toLowerCase() || '';
  return SHELL_BADGE_COLORS[normalizedShell] || {
    bg: 'bg-gray-500/10',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/20',
  };
};

// Extract shell type from metadata
const getShellType = (event: Event): string => {
  const metadata = event.metadata as Record<string, unknown>;
  return (metadata?.shell as string) || (metadata?.shellType as string) || 'sh';
};

// Extract working directory from metadata
const getWorkingDir = (event: Event): string | null => {
  const metadata = event.metadata as Record<string, unknown>;
  return (metadata?.cwd as string) || (metadata?.workingDirectory as string) || null;
};

// Extract command from event
const getCommand = (event: Event): string => {
  const metadata = event.metadata as Record<string, unknown>;
  return (metadata?.command as string) || event.content || event.title || '';
};

// Single terminal event item
const TerminalEventItem = memo(function TerminalEventItem({
  event,
  onSelect,
  isSelected,
  isNew,
}: {
  event: Event;
  onSelect?: (event: Event) => void;
  isSelected: boolean;
  isNew: boolean;
}) {
  const shell = getShellType(event);
  const workingDir = getWorkingDir(event);
  const command = getCommand(event);
  const shellColors = getShellBadgeColor(shell);

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary',
        isNew && 'animate-in fade-in slide-in-from-top-2 duration-300 ring-2 ring-green-500/30'
      )}
      onClick={() => onSelect?.(event)}
    >
      <div className="flex items-start gap-3">
        {/* Terminal icon */}
        <div className="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex-shrink-0">
          <Terminal className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Header: Shell badge, action, time */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              className={cn(
                'text-xs font-mono',
                shellColors.bg,
                shellColors.text,
                'border-transparent'
              )}
            >
              {shell}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {event.eventAction}
            </span>
            <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
              {formatDistanceToNow(new Date(event.localTimestamp), {
                addSuffix: true,
                locale: ko,
              })}
            </span>
          </div>

          {/* Command with syntax highlighting */}
          <div className="rounded-md bg-zinc-950 dark:bg-zinc-900 p-3 overflow-x-auto">
            <div className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <code className="text-sm font-mono text-zinc-100 whitespace-pre-wrap break-all">
                {command}
              </code>
            </div>
          </div>

          {/* Working directory */}
          {workingDir && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="font-mono truncate">{workingDir}</span>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {new Date(event.localTimestamp).toLocaleString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            {event.agent && (
              <>
                <span className="text-muted-foreground/50">|</span>
                <span className="truncate">{event.agent.name}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});

export function TerminalEventList({
  events: initialEvents,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onEventSelect,
  selectedEventId,
  className,
}: TerminalEventListProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const [newEventCount, setNewEventCount] = useState(0);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtTopRef = useRef(true);

  // Sync initial events
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  // Handle real-time terminal events
  useSocket(
    'terminal:new',
    useCallback((newEvent: Event) => {
      // Only process terminal events
      if (newEvent.eventType !== 'terminal') return;

      setEvents((prev) => {
        // Prevent duplicates
        if (prev.some((e) => e.id === newEvent.id)) return prev;
        return [newEvent, ...prev];
      });

      // Mark as new for animation
      setNewEventIds((prev) => new Set(prev).add(newEvent.id));
      setTimeout(() => {
        setNewEventIds((prev) => {
          const updated = new Set(prev);
          updated.delete(newEvent.id);
          return updated;
        });
      }, 2000);

      // Update counter if scrolled down
      if (!isAtTopRef.current) {
        setNewEventCount((prev) => prev + 1);
      }
    }, [])
  );

  // Also listen to generic event:new and filter for terminal events
  useSocket(
    'event:new',
    useCallback((newEvent: Event) => {
      // Only process terminal events
      if (newEvent.eventType !== 'terminal') return;

      setEvents((prev) => {
        // Prevent duplicates
        if (prev.some((e) => e.id === newEvent.id)) return prev;
        return [newEvent, ...prev];
      });

      // Mark as new for animation
      setNewEventIds((prev) => new Set(prev).add(newEvent.id));
      setTimeout(() => {
        setNewEventIds((prev) => {
          const updated = new Set(prev);
          updated.delete(newEvent.id);
          return updated;
        });
      }, 2000);

      // Update counter if scrolled down
      if (!isAtTopRef.current) {
        setNewEventCount((prev) => prev + 1);
      }
    }, [])
  );

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop } = scrollContainerRef.current;
      const atTop = scrollTop < 10;
      isAtTopRef.current = atTop;
      setIsScrolledDown(!atTop);

      if (atTop) {
        setNewEventCount(0);
      }
    }
  }, []);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
      setNewEventCount(0);
    }
  }, []);

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-14 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-16 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-48 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Terminal className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">No terminal events</p>
        <p className="text-sm text-muted-foreground mt-1">
          Terminal commands will appear here when executed
        </p>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* New events button */}
      {isScrolledDown && newEventCount > 0 && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
          <Button
            size="sm"
            onClick={scrollToTop}
            className="rounded-full shadow-lg gap-1.5 bg-green-600 hover:bg-green-700"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            <span>
              {newEventCount} new command{newEventCount > 1 ? 's' : ''}
            </span>
          </Button>
        </div>
      )}

      <ScrollArea className="h-[calc(100vh-350px)]">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="space-y-3 pr-4"
        >
          {events.map((event) => (
            <TerminalEventItem
              key={event.id}
              event={event}
              onSelect={onEventSelect}
              isSelected={event.id === selectedEventId}
              isNew={newEventIds.has(event.id)}
            />
          ))}

          {/* Load more button */}
          {hasNextPage && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
