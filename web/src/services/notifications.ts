import { api } from './api';
import type {
  Notification,
  NotificationPreferences,
  NotificationFilters,
  UpdateNotificationPreferences,
  PaginatedResponse,
} from '@/types';

export const notificationsApi = {
  // Notifications
  getNotifications: (filters: NotificationFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    const queryString = params.toString();
    return api.get<PaginatedResponse<Notification>>(
      `/notifications${queryString ? `?${queryString}` : ''}`
    );
  },

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    api.patch<Notification>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.post<{ count: number }>('/notifications/read-all'),

  deleteNotification: (id: string) =>
    api.delete<void>(`/notifications/${id}`),

  // Preferences
  getPreferences: () =>
    api.get<NotificationPreferences>('/notifications/preferences'),

  updatePreferences: (data: UpdateNotificationPreferences) =>
    api.patch<NotificationPreferences>('/notifications/preferences', data),
};
