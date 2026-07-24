'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  GitCommit,
  FileText,
  Terminal,
  PenLine,
  ArrowUp,
  Wifi,
  WifiOff
} from 'lucide-react';
import type { Event, EventType } from '@/types';

// Event type icon mapping per DOC-5 Design System
const EVENT_ICONS: Record<EventType, React.ElementType> = {
  git: GitCommit,
  file: FileText,
  terminal: Terminal,
  manual: PenLine,
};

// Event type labels
const EVENT_LABELS: Record<EventType, string> = {
  git: 'Git',
  file: 'File',
  terminal: 'Terminal',
  manual: 'Note',
};

// Event type color classes per requirements:
// git: orange, file: violet, terminal: green, manual: blue
const EVENT_COLORS: Record<EventType, { bg: string; text: string; border: string }> = {
  git: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/20',
  },
  file: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-500/20',
  },
  terminal: {
    bg: 'bg-green-500/10',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500/20',
  },
  manual: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
  },
};

interface RealtimeEventFeedProps {
  maxEvents?: number;
  className?: string;
}

export function RealtimeEventFeed({
  maxEvents = 50,
  className
}: RealtimeEventFeedProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [newEventCount, setNewEventCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [animatingEventId, setAnimatingEventId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtTopRef = useRef(true);

  // Handle new events from WebSocket
  useSocket('event:new', useCallback((newEvent: Event) => {
    setEvents(prev => {
      // Add new event to the beginning and limit to maxEvents
      const updated = [newEvent, ...prev];
      return updated.slice(0, maxEvents);
    });

    // Set animation for the new event
    setAnimatingEventId(newEvent.id);
    setTimeout(() => setAnimatingEventId(null), 500);

    // If user is scrolled down, increment new event counter
    if (!isAtTopRef.current) {
      setNewEventCount(prev => prev + 1);
    }

    // Show browser notification for important events
    if (newEvent.eventType === 'git' && newEvent.eventAction === 'commit') {
      showNotification('New Git Commit', newEvent.title || 'New commit received');
    }
  }, [maxEvents]));

  // Handle connection status
  useSocket('connected', useCallback(() => {
    setIsConnected(true);
    console.log('Connected to realtime feed');
  }, []));

  useSocket('disconnected', useCallback(() => {
    setIsConnected(false);
    console.log('Disconnected from realtime feed');
  }, []));

  // Browser notification helper
  const showNotification = (title: string, message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
      });
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Handle scroll to detect if user is at top
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop } = scrollContainerRef.current;
      const atTop = scrollTop < 10;
      isAtTopRef.current = atTop;
      setIsScrolledDown(!atTop);

      // Reset new event count when scrolled to top
      if (atTop) {
        setNewEventCount(0);
      }
    }
  }, []);

  // Scroll to top and reset new event count
  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
      setNewEventCount(0);
    }
  }, []);

  // Get icon component for event type
  const getEventIcon = (type: EventType) => {
    const Icon = EVENT_ICONS[type] || EVENT_ICONS.manual;
    return Icon;
  };

  // Get color classes for event type
  const getEventColors = (type: EventType) => {
    return EVENT_COLORS[type] || EVENT_COLORS.manual;
  };

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Realtime Activity</h3>
          <Badge
            variant={isConnected ? 'default' : 'secondary'}
            className={cn(
              'flex items-center gap-1.5',
              isConnected && 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
            )}
          >
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                <span>Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                <span>Offline</span>
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Scrollable Event List */}
      <div className="relative flex-1 overflow-hidden">
        {/* New Events Button */}
        {isScrolledDown && newEventCount > 0 && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
            <Button
              size="sm"
              onClick={scrollToTop}
              className="rounded-full shadow-lg gap-1.5 bg-primary hover:bg-primary/90"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              <span>{newEventCount} new event{newEventCount > 1 ? 's' : ''}</span>
            </Button>
          </div>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-[500px] overflow-y-auto p-4 space-y-3"
        >
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Terminal className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">Waiting for events...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Events will appear here in realtime
              </p>
            </div>
          ) : (
            events.map(event => {
              const Icon = getEventIcon(event.eventType);
              const colors = getEventColors(event.eventType);
              const isAnimating = animatingEventId === event.id;

              return (
                <div
                  key={event.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-all duration-300',
                    'hover:bg-muted/50',
                    colors.border,
                    isAnimating && 'animate-in fade-in slide-in-from-top-2 duration-300 ring-2 ring-primary/20'
                  )}
                >
                  {/* Event Type Icon */}
                  <div className={cn(
                    'p-2 rounded-lg flex-shrink-0',
                    colors.bg,
                    colors.text
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={event.eventType as EventType}
                        className="text-xs"
                      >
                        {EVENT_LABELS[event.eventType]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {event.eventAction}
                      </span>
                      {event.project && (
                        <Badge variant="outline" className="text-xs">
                          {event.project.name}
                        </Badge>
                      )}
                    </div>

                    {/* Title or File Path */}
                    {event.title && (
                      <p className="text-sm font-medium mt-1 truncate">
                        {event.title}
                      </p>
                    )}

                    {event.filePath && (
                      <p className="text-xs text-muted-foreground truncate font-mono mt-1">
                        {event.filePath}
                      </p>
                    )}

                    {/* Git info */}
                    {event.gitBranch && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-mono">{event.gitBranch}</span>
                        {event.gitCommitHash && (
                          <span className="ml-2 font-mono text-primary/70">
                            {event.gitCommitHash.substring(0, 7)}
                          </span>
                        )}
                      </p>
                    )}

                    {/* Timestamp and Agent */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      {event.agent && (
                        <span className="truncate max-w-[100px]">
                          {event.agent.name}
                        </span>
                      )}
                      <span className="text-muted-foreground/50">|</span>
                      <span>
                        {formatDistanceToNow(new Date(event.localTimestamp), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}
