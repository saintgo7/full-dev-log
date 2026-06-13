'use client';

import React, { Suspense, ComponentType, ReactNode } from 'react';
import { Skeleton, CardSkeleton } from './Skeleton';
import { cn } from '@/lib/utils';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error boundary component for catching render errors
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyComponent Error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-destructive mb-2">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-1">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

type LoadingType = 'skeleton' | 'card' | 'spinner' | 'custom';

interface LazyComponentProps<T extends ComponentType<any>> {
  /** The lazy-loaded component */
  component: React.LazyExoticComponent<T>;
  /** Props to pass to the component */
  componentProps?: React.ComponentProps<T>;
  /** Loading fallback type */
  loadingType?: LoadingType;
  /** Custom loading fallback */
  loadingFallback?: ReactNode;
  /** Custom error fallback */
  errorFallback?: ReactNode;
  /** Error callback */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Additional class name for the container */
  className?: string;
  /** Minimum loading time (ms) to prevent flash */
  minLoadingTime?: number;
}

/**
 * Loading skeleton based on type
 */
function LoadingFallback({
  type,
  className
}: {
  type: LoadingType;
  className?: string;
}) {
  switch (type) {
    case 'card':
      return <CardSkeleton className={className} />;
    case 'spinner':
      return (
        <div className={cn('flex items-center justify-center p-8', className)}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    case 'skeleton':
    default:
      return <Skeleton className={cn('h-32 w-full', className)} />;
  }
}

/**
 * Wrapper component for React.lazy with loading skeleton and error boundary
 *
 * @example
 * ```tsx
 * const LazyChart = lazy(() => import('@/components/Chart'));
 *
 * <LazyComponent
 *   component={LazyChart}
 *   componentProps={{ data: chartData }}
 *   loadingType="card"
 * />
 * ```
 */
export function LazyComponent<T extends ComponentType<any>>({
  component: Component,
  componentProps,
  loadingType = 'skeleton',
  loadingFallback,
  errorFallback,
  onError,
  className,
}: LazyComponentProps<T>) {
  const fallback = loadingFallback || (
    <LoadingFallback type={loadingType} className={className} />
  );

  return (
    <ErrorBoundary fallback={errorFallback} onError={onError}>
      <Suspense fallback={fallback}>
        <Component {...(componentProps as any)} />
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * HOC to wrap a component with lazy loading capabilities
 */
export function withLazyLoading<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: Omit<LazyComponentProps<T>, 'component' | 'componentProps'> = {}
) {
  const LazyComp = React.lazy(importFn);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <LazyComponent
        component={LazyComp}
        componentProps={props}
        {...options}
      />
    );
  };
}

export { ErrorBoundary };
export default LazyComponent;
