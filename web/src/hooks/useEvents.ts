'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { eventsApi, type EventFilters } from '@/services/events';

export function useEvents(filters: EventFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['events', filters],
    queryFn: ({ pageParam }) =>
      eventsApi.getEvents({ ...filters, cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.cursor : undefined,
    initialPageParam: undefined as string | undefined,
  });
}

export function useEventStats(days: number = 7) {
  return useQuery({
    queryKey: ['events', 'stats', days],
    queryFn: () => eventsApi.getStats(days),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useEventSearch(query: string) {
  return useQuery({
    queryKey: ['events', 'search', query],
    queryFn: () => eventsApi.search(query),
    enabled: query.length > 0,
  });
}
