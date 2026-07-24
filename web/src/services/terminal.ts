import { api } from './api';
import type { Event, PaginatedResponse } from '@/types';

export interface TerminalFilters {
  shell?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface TerminalStats {
  totalCommands: number;
  todayCommands: number;
  topCommands: Array<{ command: string; count: number }>;
  shellUsage: Array<{ shell: string; count: number; percentage: number }>;
  hourlyDistribution: Array<{ hour: number; count: number }>;
}

export const terminalApi = {
  /**
   * Get terminal events with optional filters
   */
  getEvents: (filters: TerminalFilters = {}) => {
    const params = new URLSearchParams();
    params.append('eventType', 'terminal');

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    return api.get<PaginatedResponse<Event>>(`/events?${params.toString()}`);
  },

  /**
   * Get terminal-specific statistics
   */
  getStats: () =>
    api.get<TerminalStats>('/events/terminal/stats'),

  /**
   * Search terminal events by command
   */
  search: (query: string, limit: number = 50) =>
    api.get<Event[]>(
      `/events/search?q=${encodeURIComponent(query)}&eventType=terminal&limit=${limit}`
    ),
};
