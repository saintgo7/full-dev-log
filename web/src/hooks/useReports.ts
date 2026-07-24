'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportApi, type ReportExportFormat } from '@/services/report';
import type { ReportListFilters, GenerateReportParams, ReportType } from '@/types';

/**
 * Hook to fetch reports list with pagination
 */
export function useReports(options?: { type?: ReportType; limit?: number }) {
  const { type, limit = 20 } = options || {};

  return useInfiniteQuery({
    queryKey: ['reports', { type, limit }],
    queryFn: ({ pageParam }) =>
      reportApi.list({
        type,
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
 * Hook to fetch a single report by ID
 */
export function useReport(id: string) {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => reportApi.get(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to generate a new report
 */
export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: GenerateReportParams) => reportApi.generate(params),
    onSuccess: () => {
      // Invalidate reports list to refetch
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

/**
 * Hook to delete a report
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reportApi.delete(id),
    onSuccess: () => {
      // Invalidate reports list to refetch
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

/**
 * Hook to export a report
 */
export function useExportReport() {
  return useMutation({
    mutationFn: ({ id, format }: { id: string; format: ReportExportFormat }) =>
      reportApi.export(id, format),
    onSuccess: (blob, { id, format }) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${id}.${format === 'markdown' ? 'md' : 'html'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}
