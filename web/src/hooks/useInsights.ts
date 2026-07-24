'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insightsApi, type InsightsFilters, type AnomalyFilters } from '@/services/insights';

/**
 * Hook to fetch complete insights summary
 */
export function useInsights(filters: InsightsFilters = {}) {
  return useQuery({
    queryKey: ['insights', filters],
    queryFn: () => insightsApi.getSummary(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch pattern analysis data
 */
export function usePatterns(filters: InsightsFilters = {}) {
  return useQuery({
    queryKey: ['insights', 'patterns', filters],
    queryFn: () => insightsApi.getPatterns(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch productivity metrics
 */
export function useProductivity(filters: InsightsFilters = {}) {
  return useQuery({
    queryKey: ['insights', 'productivity', filters],
    queryFn: () => insightsApi.getProductivity(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch anomalies with pagination
 */
export function useAnomalies(filters: Omit<AnomalyFilters, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: ['insights', 'anomalies', filters],
    queryFn: ({ pageParam }) =>
      insightsApi.getAnomalies({ ...filters, cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.cursor : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to fetch recommendations
 */
export function useRecommendations() {
  return useQuery({
    queryKey: ['insights', 'recommendations'],
    queryFn: () => insightsApi.getRecommendations(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to dismiss an anomaly
 */
export function useDismissAnomaly() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => insightsApi.dismissAnomaly(id),
    onSuccess: () => {
      // Invalidate anomalies and insights queries to refetch
      queryClient.invalidateQueries({ queryKey: ['insights', 'anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}
