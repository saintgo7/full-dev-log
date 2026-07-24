import { QueryClient, QueryClientConfig } from '@tanstack/react-query';

/**
 * Query cache time constants (in milliseconds)
 */
export const CACHE_TIME = {
  /** 30 seconds - for frequently changing data */
  SHORT: 1000 * 30,
  /** 1 minute - default stale time */
  STALE: 1000 * 60,
  /** 5 minutes - for semi-static data */
  MEDIUM: 1000 * 60 * 5,
  /** 30 minutes - for static data */
  LONG: 1000 * 60 * 30,
  /** 1 hour - for rarely changing data */
  VERY_LONG: 1000 * 60 * 60,
  /** 24 hours - for essentially static data */
  DAY: 1000 * 60 * 60 * 24,
} as const;

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG = {
  /** Maximum retry attempts */
  retryCount: 3,
  /** Delay between retries (with exponential backoff) */
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  /** Only retry on specific errors */
  retry: (failureCount: number, error: Error) => {
    // Don't retry on 4xx errors (client errors)
    if ('status' in error) {
      const status = (error as any).status;
      if (status >= 400 && status < 500) {
        return false;
      }
    }
    // Retry up to 3 times for other errors
    return failureCount < 3;
  },
};

/**
 * Query client configuration for optimal performance
 */
export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      /**
       * Stale time - how long data is considered fresh
       * Fresh data won't trigger a refetch
       */
      staleTime: CACHE_TIME.STALE, // 1 minute

      /**
       * Garbage collection time (formerly cacheTime)
       * How long inactive queries stay in cache before being garbage collected
       */
      gcTime: CACHE_TIME.MEDIUM, // 5 minutes

      /**
       * Retry configuration
       */
      retry: DEFAULT_RETRY_CONFIG.retry,
      retryDelay: DEFAULT_RETRY_CONFIG.retryDelay,

      /**
       * Refetch behavior
       */
      refetchOnMount: true,
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: true,

      /**
       * Network mode
       * 'online' - only fetch when online
       * 'always' - always try to fetch
       * 'offlineFirst' - use cache first, then fetch
       */
      networkMode: 'online',

      /**
       * Structural sharing - reuse unchanged parts of data
       * Helps prevent unnecessary re-renders
       */
      structuralSharing: true,

      /**
       * Placeholder data behavior
       */
      placeholderData: (previousData: unknown) => previousData,
    },
    mutations: {
      /**
       * Retry configuration for mutations
       * Generally more conservative than queries
       */
      retry: 1,
      retryDelay: 1000,

      /**
       * Network mode for mutations
       */
      networkMode: 'online',
    },
  },
};

/**
 * Create a configured QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient(queryClientConfig);
}

/**
 * Query key factory for consistent key generation
 *
 * @example
 * ```ts
 * // Usage in hooks
 * useQuery({
 *   queryKey: queryKeys.events.list({ type: 'git' }),
 *   queryFn: () => fetchEvents({ type: 'git' }),
 * });
 *
 * // Invalidation
 * queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
 * ```
 */
export const queryKeys = {
  // Events
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.events.lists(), filters] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.events.details(), id] as const,
    stats: (days: number) => [...queryKeys.events.all, 'stats', days] as const,
    search: (query: string) => [...queryKeys.events.all, 'search', query] as const,
  },

  // Agents
  agents: {
    all: ['agents'] as const,
    lists: () => [...queryKeys.agents.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      filters
        ? ([...queryKeys.agents.lists(), filters] as const)
        : queryKeys.agents.lists(),
    details: () => [...queryKeys.agents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.agents.details(), id] as const,
    stats: (id: string) => [...queryKeys.agents.all, 'stats', id] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      filters
        ? ([...queryKeys.projects.lists(), filters] as const)
        : queryKeys.projects.lists(),
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },

  // Notes
  notes: {
    all: ['notes'] as const,
    lists: () => [...queryKeys.notes.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      filters
        ? ([...queryKeys.notes.lists(), filters] as const)
        : queryKeys.notes.lists(),
    details: () => [...queryKeys.notes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.notes.details(), id] as const,
  },

  // Teams
  teams: {
    all: ['teams'] as const,
    lists: () => [...queryKeys.teams.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      filters
        ? ([...queryKeys.teams.lists(), filters] as const)
        : queryKeys.teams.lists(),
    details: () => [...queryKeys.teams.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.teams.details(), id] as const,
    members: (id: string) => [...queryKeys.teams.detail(id), 'members'] as const,
    activity: (id: string) => [...queryKeys.teams.detail(id), 'activity'] as const,
  },

  // Reports
  reports: {
    all: ['reports'] as const,
    lists: () => [...queryKeys.reports.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      filters
        ? ([...queryKeys.reports.lists(), filters] as const)
        : queryKeys.reports.lists(),
    details: () => [...queryKeys.reports.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reports.details(), id] as const,
  },

  // Insights
  insights: {
    all: ['insights'] as const,
    patterns: () => [...queryKeys.insights.all, 'patterns'] as const,
    anomalies: () => [...queryKeys.insights.all, 'anomalies'] as const,
    recommendations: () => [...queryKeys.insights.all, 'recommendations'] as const,
    productivity: () => [...queryKeys.insights.all, 'productivity'] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
    preferences: () => [...queryKeys.notifications.all, 'preferences'] as const,
  },

  // User
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    settings: () => [...queryKeys.user.all, 'settings'] as const,
  },
} as const;

/**
 * Predefined stale time configurations for different data types
 */
export const staleTimeConfig = {
  /** Real-time data - always refetch */
  realtime: 0,
  /** Frequently changing data (events, activity) */
  dynamic: CACHE_TIME.SHORT,
  /** Standard data (lists, details) */
  standard: CACHE_TIME.STALE,
  /** Semi-static data (user profile, team info) */
  semiStatic: CACHE_TIME.MEDIUM,
  /** Static data (settings, preferences) */
  static: CACHE_TIME.LONG,
  /** Rarely changing data (enums, constants) */
  persistent: CACHE_TIME.VERY_LONG,
} as const;

export default createQueryClient;
