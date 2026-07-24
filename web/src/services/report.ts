import { api } from './api';
import type {
  Report,
  PaginatedResponse,
  GenerateReportParams,
  ReportListFilters,
} from '@/types';

export type ReportExportFormat = 'markdown' | 'html';

export const reportApi = {
  /**
   * Generate a new report
   */
  generate: (params: GenerateReportParams) =>
    api.post<Report>('/reports/generate', params),

  /**
   * Get list of reports with optional filters
   */
  list: (filters: ReportListFilters = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    return api.get<PaginatedResponse<Report>>(
      `/reports${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get a single report by ID
   */
  get: (id: string) => api.get<Report>(`/reports/${id}`),

  /**
   * Delete a report
   */
  delete: (id: string) => api.delete<{ success: boolean }>(`/reports/${id}`),

  /**
   * Export a report to markdown or HTML
   */
  export: async (id: string, format: ReportExportFormat): Promise<Blob> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const response = await fetch(`${API_URL}/reports/${id}/export?format=${format}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export report');
    }

    return response.blob();
  },
};
