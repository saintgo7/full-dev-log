'use client';

import { useEffect, useRef, useState, useCallback, RefObject } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /** Only trigger once when element becomes visible */
  triggerOnce?: boolean;
  /** Initial visibility state */
  initialInView?: boolean;
  /** Callback when intersection state changes */
  onChange?: (inView: boolean, entry: IntersectionObserverEntry) => void;
  /** Skip observing (useful for conditional observation) */
  skip?: boolean;
}

interface UseIntersectionObserverReturn {
  /** Ref to attach to the target element */
  ref: RefObject<HTMLDivElement>;
  /** Whether the element is currently in view */
  inView: boolean;
  /** The intersection observer entry */
  entry: IntersectionObserverEntry | null;
}

/**
 * useIntersectionObserver - Observe element visibility with Intersection Observer API
 *
 * @param options - Configuration options
 * @returns Object with ref, inView state, and entry
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { ref, inView } = useIntersectionObserver();
 *
 * return (
 *   <div ref={ref}>
 *     {inView ? <HeavyComponent /> : <Placeholder />}
 *   </div>
 * );
 *
 * // With options
 * const { ref, inView } = useIntersectionObserver({
 *   threshold: 0.5,
 *   triggerOnce: true,
 * });
 * ```
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    triggerOnce = false,
    initialInView = false,
    onChange,
    skip = false,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(initialInView);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || skip) return;

    // Skip if triggerOnce has already triggered
    if (triggerOnce && hasTriggered.current) return;

    const observer = new IntersectionObserver(
      ([observerEntry]) => {
        const isIntersecting = observerEntry.isIntersecting;

        setInView(isIntersecting);
        setEntry(observerEntry);
        onChange?.(isIntersecting, observerEntry);

        if (isIntersecting && triggerOnce) {
          hasTriggered.current = true;
          observer.disconnect();
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, root, rootMargin, triggerOnce, onChange, skip]);

  return { ref, inView, entry };
}

/**
 * useInView - Simplified version returning just inView boolean
 */
export function useInView(
  options?: UseIntersectionObserverOptions
): [RefObject<HTMLDivElement>, boolean] {
  const { ref, inView } = useIntersectionObserver(options);
  return [ref, inView];
}

interface UseInfiniteScrollOptions {
  /** Callback when sentinel becomes visible */
  onLoadMore: () => void;
  /** Whether more data is available */
  hasNextPage?: boolean;
  /** Whether currently loading */
  isLoading?: boolean;
  /** Root margin for earlier triggering */
  rootMargin?: string;
  /** Threshold (0-1) */
  threshold?: number;
  /** Enabled state */
  enabled?: boolean;
}

/**
 * useInfiniteScroll - Hook for implementing infinite scroll
 *
 * @example
 * ```tsx
 * const { sentinelRef } = useInfiniteScroll({
 *   onLoadMore: fetchNextPage,
 *   hasNextPage,
 *   isLoading: isFetchingNextPage,
 * });
 *
 * return (
 *   <div>
 *     {items.map(item => <Item key={item.id} />)}
 *     <div ref={sentinelRef} /> {/* Invisible trigger element *\/}
 *   </div>
 * );
 * ```
 */
export function useInfiniteScroll({
  onLoadMore,
  hasNextPage = true,
  isLoading = false,
  rootMargin = '200px',
  threshold = 0,
  enabled = true,
}: UseInfiniteScrollOptions): {
  sentinelRef: RefObject<HTMLDivElement>;
  inView: boolean;
} {
  const loadMoreRef = useRef(onLoadMore);
  loadMoreRef.current = onLoadMore;

  const shouldTrigger = enabled && hasNextPage && !isLoading;

  const handleIntersect = useCallback(
    (inView: boolean) => {
      if (inView && shouldTrigger) {
        loadMoreRef.current();
      }
    },
    [shouldTrigger]
  );

  const { ref, inView } = useIntersectionObserver({
    rootMargin,
    threshold,
    onChange: handleIntersect,
    skip: !shouldTrigger,
  });

  return { sentinelRef: ref, inView };
}

interface UseLazyLoadOptions {
  /** Whether to start loading immediately on mount */
  immediate?: boolean;
  /** Root margin for earlier loading */
  rootMargin?: string;
}

/**
 * useLazyLoad - Hook for lazy loading content when it becomes visible
 *
 * @example
 * ```tsx
 * const { ref, shouldLoad, hasLoaded } = useLazyLoad({
 *   rootMargin: '100px',
 * });
 *
 * return (
 *   <div ref={ref}>
 *     {shouldLoad ? <HeavyContent /> : <Skeleton />}
 *   </div>
 * );
 * ```
 */
export function useLazyLoad(options: UseLazyLoadOptions = {}): {
  ref: RefObject<HTMLDivElement>;
  shouldLoad: boolean;
  hasLoaded: boolean;
} {
  const { immediate = false, rootMargin = '100px' } = options;
  const [hasLoaded, setHasLoaded] = useState(immediate);

  const { ref, inView } = useIntersectionObserver({
    triggerOnce: true,
    rootMargin,
    skip: immediate,
  });

  useEffect(() => {
    if (inView && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [inView, hasLoaded]);

  return {
    ref,
    shouldLoad: immediate || inView || hasLoaded,
    hasLoaded,
  };
}

/**
 * useVisibilityTracking - Track how long an element is visible
 *
 * @example
 * ```tsx
 * const { ref, visibleTime, visibilityPercentage } = useVisibilityTracking();
 *
 * // Track for analytics
 * useEffect(() => {
 *   if (visibleTime > 5000) {
 *     trackEngagement('long_view');
 *   }
 * }, [visibleTime]);
 * ```
 */
export function useVisibilityTracking(options: {
  threshold?: number;
  trackInterval?: number;
} = {}): {
  ref: RefObject<HTMLDivElement>;
  inView: boolean;
  visibleTime: number;
  visibilityPercentage: number;
} {
  const { threshold = 0.5, trackInterval = 100 } = options;
  const [visibleTime, setVisibleTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { ref, inView, entry } = useIntersectionObserver({ threshold });

  useEffect(() => {
    if (inView) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current;
          setVisibleTime(prev => prev + trackInterval);
        }
      }, trackInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      startTimeRef.current = null;
    }

    setTotalTime(prev => prev + trackInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [inView, trackInterval]);

  const visibilityPercentage = totalTime > 0
    ? Math.round((visibleTime / totalTime) * 100)
    : 0;

  return {
    ref,
    inView,
    visibleTime,
    visibilityPercentage,
  };
}

export default useIntersectionObserver;
