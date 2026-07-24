'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { SearchBar } from '@/components/features/SearchBar';
import { TerminalStats, TerminalEventList, CommandChart } from '@/components/terminal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTerminalEvents, useTerminalStats } from '@/hooks/useTerminal';
import type { Event } from '@/types';

// Shell filter options
const shellFilters = [
  { value: 'all', label: 'All Shells' },
  { value: 'bash', label: 'Bash' },
  { value: 'zsh', label: 'Zsh' },
  { value: 'fish', label: 'Fish' },
  { value: 'powershell', label: 'PowerShell' },
];

// Helper to extract metadata safely
function getMetadataValue(event: Event, key: string): string | null {
  const metadata = event.metadata as Record<string, unknown> | null;
  if (!metadata) return null;
  const value = metadata[key];
  return typeof value === 'string' ? value : null;
}

function getMetadataNumber(event: Event, key: string): number | null {
  const metadata = event.metadata as Record<string, unknown> | null;
  if (!metadata) return null;
  const value = metadata[key];
  return typeof value === 'number' ? value : null;
}

// Terminal Event Detail Panel Component
function TerminalDetailPanel({ event }: { event: Event }) {
  const shell = getMetadataValue(event, 'shell') || getMetadataValue(event, 'shellType') || 'sh';
  const command = getMetadataValue(event, 'command') || event.content || event.title || '-';
  const cwd = getMetadataValue(event, 'cwd') || getMetadataValue(event, 'workingDirectory');
  const exitCode = getMetadataNumber(event, 'exitCode');
  const output = getMetadataValue(event, 'output');

  return (
    <div className="w-96 flex-shrink-0">
      <div className="sticky top-0">
        <h3 className="text-lg font-semibold mb-4">Command Details</h3>
        <div className="rounded-lg border bg-card p-6 space-y-4">
          {/* Shell Type */}
          <div>
            <span className="text-sm text-muted-foreground">Shell</span>
            <div className="mt-1">
              <Badge variant="terminal" className="font-mono">
                {shell}
              </Badge>
            </div>
          </div>

          {/* Command */}
          <div>
            <span className="text-sm text-muted-foreground">Command</span>
            <div className="mt-1 rounded-md bg-zinc-950 dark:bg-zinc-900 p-3">
              <code className="text-sm font-mono text-zinc-100 whitespace-pre-wrap break-all">
                {command}
              </code>
            </div>
          </div>

          {/* Working Directory */}
          {cwd && (
            <div>
              <span className="text-sm text-muted-foreground">Working Directory</span>
              <div className="mt-1">
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded break-all">
                  {cwd}
                </code>
              </div>
            </div>
          )}

          {/* Exit Code */}
          {exitCode !== null && (
            <div>
              <span className="text-sm text-muted-foreground">Exit Code</span>
              <div className="mt-1">
                <Badge variant={exitCode === 0 ? 'default' : 'destructive'}>
                  {exitCode}
                </Badge>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div>
            <span className="text-sm text-muted-foreground">Timestamp</span>
            <div className="mt-1 text-sm">
              {new Date(event.localTimestamp).toLocaleString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          </div>

          {/* Agent */}
          {event.agent && (
            <div>
              <span className="text-sm text-muted-foreground">Agent</span>
              <div className="mt-1 text-sm">
                {event.agent.name}
              </div>
            </div>
          )}

          {/* Project */}
          {event.project && (
            <div>
              <span className="text-sm text-muted-foreground">Project</span>
              <div className="mt-1">
                <Badge variant="outline">{event.project.name}</Badge>
              </div>
            </div>
          )}

          {/* Output (if available) */}
          {output && (
            <div>
              <span className="text-sm text-muted-foreground">Output</span>
              <div className="mt-1 rounded-md bg-muted p-3 max-h-48 overflow-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {output}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TerminalPage() {
  const [selectedShell, setSelectedShell] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Build filters based on state
  const filters = useMemo(() => ({
    shell: selectedShell === 'all' ? undefined : selectedShell,
    search: searchQuery || undefined,
  }), [selectedShell, searchQuery]);

  // Fetch terminal events with pagination
  const {
    data: eventsData,
    isLoading: eventsLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTerminalEvents({ limit: 20, filters });

  // Fetch terminal stats
  const { data: stats, isLoading: statsLoading } = useTerminalStats();

  // Flatten paginated events
  const events = eventsData?.pages.flatMap((page) => page.items) ?? [];

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle load more
  const handleLoadMore = () => {
    fetchNextPage();
  };

  return (
    <div className="h-screen flex flex-col">
      <Header title="Terminal Activity" />

      <div className="flex-1 overflow-hidden">
        <div className="p-6 space-y-6 h-full overflow-y-auto">
          {/* Statistics Section */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Statistics</h2>
            <TerminalStats stats={stats} isLoading={statsLoading} />
          </section>

          {/* Hourly Activity Chart */}
          <section>
            <CommandChart
              data={stats?.hourlyDistribution}
              isLoading={statsLoading}
            />
          </section>

          {/* Filters Section */}
          <section className="flex flex-wrap items-center gap-4">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search commands..."
              className="w-80"
            />

            <div className="flex gap-2 flex-wrap">
              {shellFilters.map((shell) => (
                <Button
                  key={shell.value}
                  variant={selectedShell === shell.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedShell(shell.value)}
                >
                  {shell.label}
                </Button>
              ))}
            </div>
          </section>

          {/* Command List Section */}
          <section className="flex gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Command History</h2>
                <Badge variant="outline" className="text-xs">
                  {events.length} commands
                </Badge>
              </div>

              <TerminalEventList
                events={events}
                isLoading={eventsLoading}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onLoadMore={handleLoadMore}
                onEventSelect={setSelectedEvent}
                selectedEventId={selectedEvent?.id}
              />
            </div>

            {/* Event Detail Panel */}
            {selectedEvent && <TerminalDetailPanel event={selectedEvent} />}
          </section>
        </div>
      </div>
    </div>
  );
}
