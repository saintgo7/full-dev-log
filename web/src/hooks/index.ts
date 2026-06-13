// Custom hooks for DevLog Hub

// Socket hooks
export {
  useSocket,
  useSocketConnection,
  useSocketEmit,
  useProjectSocket,
  useAgentSocket,
} from './useSocket';

// Notification hooks
export {
  useNotification,
  useNotificationStore,
  type NotificationType,
  type Notification,
  type NotificationOptions,
} from './useNotification';

// Terminal hooks
export {
  useTerminalEvents,
  useTerminalStats,
  useTerminalSearch,
} from './useTerminal';

// Report hooks
export {
  useReports,
  useReport,
  useGenerateReport,
  useDeleteReport,
  useExportReport,
} from './useReports';

// Insights hooks
export {
  useInsights,
  usePatterns,
  useProductivity,
  useAnomalies,
  useRecommendations,
  useDismissAnomaly,
} from './useInsights';

// Performance optimization hooks
export {
  useDebounce,
  useDebouncedCallback,
  useDebouncedState,
  useThrottle,
  useThrottledCallback,
} from './useDebounce';

export {
  useIntersectionObserver,
  useInView,
  useInfiniteScroll,
  useLazyLoad,
  useVisibilityTracking,
} from './useIntersectionObserver';

export {
  useOptimisticUpdate,
  useOptimisticListUpdate,
  useOptimisticInfiniteUpdate,
} from './useOptimisticUpdate';
