'use client';

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode
} from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './Skeleton';

interface VirtualListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Function to render each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Optional key extractor */
  keyExtractor?: (item: T, index: number) => string | number;
  /** Container height (default: 100%) */
  height?: number | string;
  /** Number of items to render above/below visible area */
  overscan?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Loading skeleton count */
  loadingSkeletonCount?: number;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state component */
  emptyComponent?: ReactNode;
  /** Container className */
  className?: string;
  /** List className */
  listClassName?: string;
  /** Item className */
  itemClassName?: string;
  /** Callback when reaching end of list */
  onEndReached?: () => void;
  /** Threshold for onEndReached (in pixels from bottom) */
  endReachedThreshold?: number;
  /** Header component (fixed, not scrolled) */
  headerComponent?: ReactNode;
  /** Footer component (fixed, not scrolled) */
  footerComponent?: ReactNode;
  /** Enable smooth scrolling */
  smoothScroll?: boolean;
  /** Gap between items in pixels */
  gap?: number;
}

/**
 * VirtualList - Efficiently renders large lists with virtual scrolling
 *
 * Only renders items that are visible in the viewport plus an overscan buffer,
 * dramatically reducing DOM nodes for large lists.
 *
 * @example
 * ```tsx
 * <VirtualList
 *   items={events}
 *   itemHeight={80}
 *   renderItem={(event) => <EventCard event={event} />}
 *   keyExtractor={(event) => event.id}
 *   onEndReached={loadMore}
 * />
 * ```
 */
export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  keyExtractor,
  height = '100%',
  overscan = 3,
  isLoading = false,
  loadingSkeletonCount = 5,
  emptyMessage = 'No items to display',
  emptyComponent,
  className,
  listClassName,
  itemClassName,
  onEndReached,
  endReachedThreshold = 200,
  headerComponent,
  footerComponent,
  smoothScroll = true,
  gap = 0,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const lastEndReachedRef = useRef<number>(0);

  // Calculate total height including gaps
  const totalHeight = useMemo(() => {
    if (items.length === 0) return 0;
    return items.length * itemHeight + (items.length - 1) * gap;
  }, [items.length, itemHeight, gap]);

  // Calculate visible range
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    if (containerHeight === 0 || items.length === 0) {
      return { startIndex: 0, endIndex: 0, visibleItems: [] };
    }

    const itemTotalHeight = itemHeight + gap;
    const start = Math.max(0, Math.floor(scrollTop / itemTotalHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemTotalHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items.slice(start, end + 1),
    };
  }, [scrollTop, containerHeight, items, itemHeight, gap, overscan]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);

    // Check if we've reached the end
    if (onEndReached) {
      const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
      if (scrollBottom < endReachedThreshold) {
        // Prevent multiple calls
        const now = Date.now();
        if (now - lastEndReachedRef.current > 1000) {
          lastEndReachedRef.current = now;
          onEndReached();
        }
      }
    }
  }, [onEndReached, endReachedThreshold]);

  // Update container height on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Scroll to specific index
  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) return;

    const offset = index * (itemHeight + gap);
    container.scrollTo({
      top: offset,
      behavior: smoothScroll ? behavior : 'auto',
    });
  }, [itemHeight, gap, smoothScroll]);

  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: loadingSkeletonCount }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn('w-full', itemClassName)}
            style={{ height: itemHeight }}
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (!isLoading && items.length === 0) {
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }

    return (
      <div className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const offsetTop = startIndex * (itemHeight + gap);

  return (
    <div className={cn('flex flex-col', className)} style={{ height }}>
      {headerComponent}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={cn(
          'flex-1 overflow-auto',
          smoothScroll && 'scroll-smooth',
          listClassName
        )}
      >
        <div
          style={{
            height: totalHeight,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: offsetTop,
              left: 0,
              right: 0,
            }}
          >
            {visibleItems.map((item, index) => {
              const actualIndex = startIndex + index;
              const key = keyExtractor
                ? keyExtractor(item, actualIndex)
                : actualIndex;

              return (
                <div
                  key={key}
                  className={itemClassName}
                  style={{
                    height: itemHeight,
                    marginBottom: actualIndex < items.length - 1 ? gap : 0,
                  }}
                >
                  {renderItem(item, actualIndex)}
                </div>
              );
            })}
          </div>
        </div>
        {isLoading && items.length > 0 && (
          <div className="py-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        )}
      </div>
      {footerComponent}
    </div>
  );
}

/**
 * Hook to manage virtual list with ref forwarding
 */
export function useVirtualList<T>(items: T[], itemHeight: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const getVisibleRange = useCallback((overscan = 3) => {
    if (containerHeight === 0) return { start: 0, end: 0 };

    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);

    return { start, end };
  }, [scrollTop, containerHeight, items.length, itemHeight]);

  const scrollToIndex = useCallback((index: number) => {
    containerRef.current?.scrollTo({
      top: index * itemHeight,
      behavior: 'smooth',
    });
  }, [itemHeight]);

  return {
    containerRef,
    handleScroll,
    getVisibleRange,
    scrollToIndex,
    totalHeight: items.length * itemHeight,
  };
}

export default VirtualList;
