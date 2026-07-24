import { api } from './api';
import type {
  InsightsSummary,
  PatternAnalysis,
  ProductivityMetrics,
  Anomaly,
  Recommendation,
  PaginatedResponse,
} from '@/types';

export interface InsightsFilters {
  startDate?: string;
  endDate?: string;
  projectId?: string;
}

export interface AnomalyFilters {
  dismissed?: boolean;
  severity?: 'low' | 'medium' | 'high';
  limit?: number;
  cursor?: string;
}

export const insightsApi = {
  /**
   * Get complete insights summary including patterns, productivity, anomalies, and recommendations
   */
  getSummary: (filters: InsightsFilters = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    return api.get<InsightsSummary>(
      `/insights${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get pattern analysis data
   */
  getPatterns: (filters: InsightsFilters = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    return api.get<PatternAnalysis>(
      `/insights/patterns${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get productivity metrics
   */
  getProductivity: (filters: InsightsFilters = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    return api.get<ProductivityMetrics>(
      `/insights/productivity${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get anomalies list
   */
  getAnomalies: (filters: AnomalyFilters = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    return api.get<PaginatedResponse<Anomaly>>(
      `/insights/anomalies${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Dismiss an anomaly
   */
  dismissAnomaly: (id: string) =>
    api.patch<Anomaly>(`/insights/anomalies/${id}/dismiss`),

  /**
   * Get recommendations list
   */
  getRecommendations: () =>
    api.get<Recommendation[]>('/insights/recommendations'),
};
