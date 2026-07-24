'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import EventCard from './EventCard';
import type { Event } from '@/types';

interface TimelineProps {
  events: Event[];
  onEventSelect?: (event: Event) => void;
  selectedEventId?: string;
  isLoading?: boolean;
}

export function Timeline({
  events,
  onEventSelect,
  selectedEventId,
  isLoading,
}: TimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">이벤트가 없습니다</p>
        <p className="text-sm text-muted-foreground mt-1">
          에이전트를 설치하고 활동을 시작하세요
        </p>
      </div>
    );
  }

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.localTimestamp).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-6 pr-4">
        {Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <div key={date}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-2">
              {date}
            </h3>
            <div className="space-y-3">
              {dateEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelect={onEventSelect}
                  isSelected={event.id === selectedEventId}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
