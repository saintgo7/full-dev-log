'use client';

import { useState, useMemo, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { SearchBar } from '@/components/features/SearchBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VirtualList } from '@/components/common/VirtualList';
import { TimelineEventSkeleton } from '@/components/common/Skeleton';
import { useInfiniteScroll } from '@/hooks/useIntersectionObserver';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import EventCard from '@/components/features/EventCard';
import { useEvents } from '@/hooks/useEvents';
import type { EventType, Event } from '@/types';

const eventTypes: { value: EventType | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'git', label: 'Git' },
  { value: 'file', label: 'File' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'manual', label: 'Note' },
];

const EVENT_ITEM_HEIGHT = 96; // Height of each event card in pixels

export default function TimelinePage() {
  const [selectedType, setSelectedType] = useState<EventType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const filters = useMemo(() => ({
    eventType: selectedType === 'all' ? undefined : selectedType,
    search: searchQuery || undefined,
    limit: 50,
  }), [selectedType, searchQuery]);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useEvents(filters);

  const events = useMemo(() =>
    data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages]
  );

  // Debounced filter change handler
  const handleTypeChange = useDebouncedCallback((type: EventType | 'all') => {
    setSelectedType(type);
    setSelectedEvent(null);
  }, 100);

  // Search handler (SearchBar already debounces)
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setSelectedEvent(null);
  }, []);

  // Infinite scroll hook
  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isLoading: isFetchingNextPage,
    rootMargin: '200px',
  });

  // Render event item for virtual list
  const renderEventItem = useCallback((event: Event) => (
    <EventCard
      event={event}
      onSelect={setSelectedEvent}
      isSelected={event.id === selectedEvent?.id}
    />
  ), [selectedEvent?.id]);

  // Key extractor for virtual list
  const keyExtractor = useCallback((event: Event) => event.id, []);

  return (
    <div className="h-screen flex flex-col">
      <Header title="타임라인" />

      <div className="p-6 space-y-4 flex-1 overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <SearchBar
            onSearch={handleSearch}
            placeholder="이벤트 검색..."
            className="w-80"
            debounceDelay={400}
          />

          <div className="flex gap-2">
            {eventTypes.map((type) => (
              <Button
                key={type.value}
                variant={selectedType === type.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTypeChange(type.value)}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex gap-6 h-[calc(100%-80px)]">
          <div className="flex-1 flex flex-col">
            {/* Virtual List for Events */}
            <VirtualList
              items={events}
              itemHeight={EVENT_ITEM_HEIGHT}
              renderItem={renderEventItem}
              keyExtractor={keyExtractor}
              isLoading={isLoading}
              loadingSkeletonCount={5}
              emptyMessage="이벤트가 없습니다"
              emptyComponent={
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">이벤트가 없습니다</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    에이전트를 설치하고 활동을 시작하세요
                  </p>
                </div>
              }
              className="flex-1"
              gap={12}
              onEndReached={fetchNextPage}
              endReachedThreshold={300}
              footerComponent={
                <>
                  {/* Infinite scroll sentinel */}
                  <div ref={sentinelRef} className="h-1" />

                  {/* Loading indicator */}
                  {isFetchingNextPage && (
                    <div className="py-4 space-y-3">
                      <TimelineEventSkeleton />
                      <TimelineEventSkeleton />
                    </div>
                  )}

                  {/* Load more button as fallback */}
                  {hasNextPage && !isFetchingNextPage && (
                    <div className="py-4 text-center">
                      <Button
                        variant="outline"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                      >
                        더 보기
                      </Button>
                    </div>
                  )}
                </>
              }
            />
          </div>

          {/* Event Detail */}
          {selectedEvent && (
            <div className="w-96 border rounded-lg bg-card p-6 overflow-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={selectedEvent.eventType as 'git' | 'file' | 'terminal' | 'manual'}>
                    {selectedEvent.eventType}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedEvent.eventAction}
                  </span>
                </div>

                {selectedEvent.title && (
                  <h3 className="font-semibold">{selectedEvent.title}</h3>
                )}

                {selectedEvent.content && (
                  <div className="rounded-lg bg-muted p-4">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {selectedEvent.content}
                    </pre>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  {selectedEvent.filePath && (
                    <div>
                      <span className="text-muted-foreground">파일:</span>
                      <code className="ml-2 font-mono text-xs bg-muted px-1 py-0.5 rounded">
                        {selectedEvent.filePath}
                      </code>
                    </div>
                  )}

                  {selectedEvent.gitBranch && (
                    <div>
                      <span className="text-muted-foreground">브랜치:</span>
                      <code className="ml-2 font-mono text-xs bg-muted px-1 py-0.5 rounded">
                        {selectedEvent.gitBranch}
                      </code>
                    </div>
                  )}

                  {selectedEvent.gitCommitHash && (
                    <div>
                      <span className="text-muted-foreground">커밋:</span>
                      <code className="ml-2 font-mono text-xs bg-muted px-1 py-0.5 rounded">
                        {selectedEvent.gitCommitHash.substring(0, 7)}
                      </code>
                    </div>
                  )}

                  <div>
                    <span className="text-muted-foreground">시간:</span>
                    <span className="ml-2">
                      {new Date(selectedEvent.localTimestamp).toLocaleString('ko-KR')}
                    </span>
                  </div>

                  {selectedEvent.agent && (
                    <div>
                      <span className="text-muted-foreground">에이전트:</span>
                      <span className="ml-2">{selectedEvent.agent.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
