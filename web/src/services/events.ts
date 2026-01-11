import { api } from './api';
import type { Event, EventStats, PaginatedResponse, EventType } from '@/types';

export interface EventFilters {
  projectId?: string;
  eventType?: EventType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  cursor?: string;
  limit?: number;
}

export const eventsApi = {
  getEvents: (filters: EventFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
    return api.get<PaginatedResponse<Event>>(`/events?${params.toString()}`);
  },

  getEvent: (id: string) =>
    api.get<Event>(`/events/${id}`),

  getStats: (days: number = 7) =>
    api.get<EventStats>(`/events/stats?days=${days}`),

  search: (query: string, limit: number = 50) =>
    api.get<Event[]>(`/events/search?q=${encodeURIComponent(query)}&limit=${limit}`),
};
