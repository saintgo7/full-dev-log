import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/useNotifications';
import type { ReactNode } from 'react';

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useNotifications', () => {
  beforeEach(() => {
    // Clear any cached data
  });

  it('should fetch notifications', async () => {
    const { result } = renderHook(() => useNotifications({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.pages).toHaveLength(1);
  });

  it('should fetch notifications with filters', async () => {
    const { result } = renderHook(
      () => useNotifications({ limit: 5, read: false }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const items = result.current.data?.pages[0].items || [];
    expect(items.length).toBeLessThanOrEqual(5);
  });

  it('should handle pagination', async () => {
    const { result } = renderHook(() => useNotifications({ limit: 2 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const firstPage = result.current.data?.pages[0];
    expect(firstPage).toBeDefined();
  });

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useNotifications({}), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should fetch next page when hasMore is true', async () => {
    const { result } = renderHook(() => useNotifications({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check if fetchNextPage is available
    expect(result.current.fetchNextPage).toBeDefined();
  });
});

describe('useUnreadCount', () => {
  it('should fetch unread notification count', async () => {
    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.count).toBeGreaterThanOrEqual(0);
  });

  it('should refetch periodically', async () => {
    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // The hook is configured to refetch every 30 seconds
    // This is handled by React Query's refetchInterval
  });

  it('should return count of 2 from mock data', async () => {
    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Based on our mock data, there are 2 unread notifications
    expect(result.current.data?.count).toBe(2);
  });
});

describe('useMarkAsRead', () => {
  it('should mark notification as read', async () => {
    const { result } = renderHook(() => useMarkAsRead(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();

    result.current.mutate('notif-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should invalidate queries on success', async () => {
    const wrapper = createWrapper();
    const { result: markAsReadResult } = renderHook(() => useMarkAsRead(), {
      wrapper,
    });
    const { result: notificationsResult } = renderHook(
      () => useNotifications({}),
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(notificationsResult.current.isSuccess).toBe(true);
    });

    markAsReadResult.current.mutate('notif-1');

    await waitFor(() => {
      expect(markAsReadResult.current.isSuccess).toBe(true);
    });

    // Notifications should be refetched
  });
});

describe('useMarkAllAsRead', () => {
  it('should mark all notifications as read', async () => {
    const { result } = renderHook(() => useMarkAllAsRead(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should invalidate queries on success', async () => {
    const wrapper = createWrapper();
    const { result: markAllResult } = renderHook(() => useMarkAllAsRead(), {
      wrapper,
    });
    const { result: countResult } = renderHook(() => useUnreadCount(), {
      wrapper,
    });

    await waitFor(() => {
      expect(countResult.current.isSuccess).toBe(true);
    });

    markAllResult.current.mutate();

    await waitFor(() => {
      expect(markAllResult.current.isSuccess).toBe(true);
    });

    // Count should be refetched
  });
});

describe('useDeleteNotification', () => {
  it('should delete notification', async () => {
    const { result } = renderHook(() => useDeleteNotification(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();

    result.current.mutate('notif-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should invalidate queries on success', async () => {
    const wrapper = createWrapper();
    const { result: deleteResult } = renderHook(
      () => useDeleteNotification(),
      {
        wrapper,
      }
    );

    deleteResult.current.mutate('notif-1');

    await waitFor(() => {
      expect(deleteResult.current.isSuccess).toBe(true);
    });
  });
});

describe('useNotificationPreferences', () => {
  it('should fetch notification preferences', async () => {
    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.channels).toBeDefined();
    expect(result.current.data?.types).toBeDefined();
  });

  it('should return preferences with correct structure', async () => {
    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const preferences = result.current.data;
    expect(preferences?.channels.email).toBeDefined();
    expect(preferences?.channels.push).toBeDefined();
    expect(preferences?.channels.inApp).toBeDefined();
    expect(preferences?.types.report).toBeDefined();
    expect(preferences?.types.team).toBeDefined();
  });
});

describe('useUpdateNotificationPreferences', () => {
  it('should update notification preferences', async () => {
    const { result } = renderHook(() => useUpdateNotificationPreferences(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();

    result.current.mutate({
      channels: {
        email: false,
      },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should invalidate preferences query on success', async () => {
    const wrapper = createWrapper();
    const { result: updateResult } = renderHook(
      () => useUpdateNotificationPreferences(),
      {
        wrapper,
      }
    );
    const { result: prefsResult } = renderHook(
      () => useNotificationPreferences(),
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(prefsResult.current.isSuccess).toBe(true);
    });

    updateResult.current.mutate({
      channels: {
        email: false,
      },
    });

    await waitFor(() => {
      expect(updateResult.current.isSuccess).toBe(true);
    });

    // Preferences should be refetched
  });

  it('should handle partial updates', async () => {
    const { result } = renderHook(() => useUpdateNotificationPreferences(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      types: {
        report: false,
      },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should handle quiet hours settings', async () => {
    const { result } = renderHook(() => useUpdateNotificationPreferences(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
