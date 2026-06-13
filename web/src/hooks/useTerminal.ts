'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { terminalApi, type TerminalFilters } from '@/services/terminal';

/**
 * Hook to fetch terminal events with pagination
 */
export function useTerminalEvents(options?: { limit?: number; filters?: TerminalFilters }) {
  const { limit = 20, filters = {} } = options || {};

  return useInfiniteQuery({
    queryKey: ['terminal', 'events', { limit, ...filters }],
    queryFn: ({ pageParam }) =>
      terminalApi.getEvents({
        ...filters,
        limit,
        cursor: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.cursor : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to fetch terminal statistics
 */
export function useTerminalStats() {
  return useQuery({
    queryKey: ['terminal', 'stats'],
    queryFn: () => terminalApi.getStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to search terminal events
 */
export function useTerminalSearch(query: string) {
  return useQuery({
    queryKey: ['terminal', 'search', query],
    queryFn: () => terminalApi.search(query),
    enabled: query.length > 0,
  });
}
