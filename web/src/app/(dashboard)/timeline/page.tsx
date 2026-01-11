'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Timeline } from '@/components/features/Timeline';
import { SearchBar } from '@/components/features/SearchBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEvents } from '@/hooks/useEvents';
import type { EventType, Event } from '@/types';

const eventTypes: { value: EventType | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'git', label: 'Git' },
  { value: 'file', label: 'File' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'manual', label: 'Note' },
];

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

  const events = data?.pages.flatMap((page) => page.items) ?? [];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

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
          />

          <div className="flex gap-2">
            {eventTypes.map((type) => (
              <Button
                key={type.value}
                variant={selectedType === type.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type.value)}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex gap-6 h-[calc(100%-80px)]">
          <div className="flex-1">
            <Timeline
              events={events}
              isLoading={isLoading}
              onEventSelect={setSelectedEvent}
              selectedEventId={selectedEvent?.id}
            />

            {hasNextPage && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? '로딩 중...' : '더 보기'}
                </Button>
              </div>
            )}
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
