'use client';

import React, { useState, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
  /** Fallback image source */
  fallbackSrc?: string;
  /** Show loading blur placeholder */
  showBlur?: boolean;
  /** Aspect ratio for the container (e.g., "16/9", "1/1", "4/3") */
  aspectRatio?: string;
  /** Container className */
  containerClassName?: string;
  /** Custom error component */
  errorComponent?: React.ReactNode;
  /** On load callback */
  onLoad?: () => void;
  /** On error callback */
  onError?: () => void;
}

// Default placeholder blur data URL (tiny gray square)
const DEFAULT_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InJnYmEoMTI4LDEyOCwxMjgsMC4xKSIvPjwvc3ZnPg==';

// Default fallback image
const DEFAULT_FALLBACK =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2UyZThlYyIvPjxwYXRoIGQ9Ik0zMCA0NWgxMHY1SDMweiIgZmlsbD0iIzk0YTNiOCIvPjxwYXRoIGQ9Ik02MCA0NWgxMHY1SDYweiIgZmlsbD0iIzk0YTNiOCIvPjxwYXRoIGQ9Ik0zNSA2NWMwIDAgNy41LTEwIDIwIDAgMTIuNSAxMCAyNSAwIDI1IDAiIHN0cm9rZT0iIzk0YTNiOCIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+PC9zdmc+';

/**
 * OptimizedImage - Wrapper around Next.js Image with enhanced features
 *
 * Features:
 * - Lazy loading with blur placeholder
 * - Error fallback handling
 * - Responsive size presets
 * - Aspect ratio container
 * - Loading state
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/images/photo.jpg"
 *   alt="Profile photo"
 *   width={200}
 *   height={200}
 *   aspectRatio="1/1"
 *   showBlur
 * />
 * ```
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  showBlur = true,
  aspectRatio,
  containerClassName,
  errorComponent,
  className,
  onLoad,
  onError,
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    setCurrentSrc(fallbackSrc);
    onError?.();
  }, [fallbackSrc, onError]);

  // If there's an error and custom error component provided
  if (hasError && errorComponent) {
    return <>{errorComponent}</>;
  }

  const imageElement = (
    <Image
      src={currentSrc}
      alt={alt}
      className={cn(
        'transition-opacity duration-300',
        isLoading ? 'opacity-0' : 'opacity-100',
        className
      )}
      placeholder={showBlur && !priority ? 'blur' : 'empty'}
      blurDataURL={showBlur ? DEFAULT_BLUR_DATA_URL : undefined}
      onLoad={handleLoad}
      onError={handleError}
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      {...props}
    />
  );

  // If aspect ratio is specified, wrap in a container
  if (aspectRatio) {
    return (
      <div
        className={cn(
          'relative overflow-hidden',
          isLoading && 'bg-muted animate-pulse',
          containerClassName
        )}
        style={{ aspectRatio }}
      >
        {imageElement}
      </div>
    );
  }

  return imageElement;
}

/**
 * Responsive image sizes presets
 */
export const imageSizes = {
  thumbnail: {
    width: 64,
    height: 64,
    sizes: '64px',
  },
  small: {
    width: 128,
    height: 128,
    sizes: '128px',
  },
  medium: {
    width: 256,
    height: 256,
    sizes: '(max-width: 768px) 100vw, 256px',
  },
  large: {
    width: 512,
    height: 512,
    sizes: '(max-width: 768px) 100vw, 512px',
  },
  full: {
    fill: true,
    sizes: '100vw',
  },
} as const;

interface AvatarImageProps extends Omit<OptimizedImageProps, 'width' | 'height'> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const avatarSizes = {
  xs: { width: 24, height: 24 },
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 56, height: 56 },
  xl: { width: 96, height: 96 },
};

/**
 * AvatarImage - Optimized avatar image component
 */
export function AvatarImage({
  size = 'md',
  className,
  ...props
}: AvatarImageProps) {
  const dimensions = avatarSizes[size];

  return (
    <OptimizedImage
      {...props}
      {...dimensions}
      className={cn('rounded-full object-cover', className)}
      showBlur={false}
    />
  );
}

interface BannerImageProps extends Omit<OptimizedImageProps, 'width' | 'height' | 'fill'> {
  variant?: 'hero' | 'card' | 'thumbnail';
}

const bannerAspectRatios = {
  hero: '21/9',
  card: '16/9',
  thumbnail: '4/3',
};

/**
 * BannerImage - Optimized banner/cover image component
 */
export function BannerImage({
  variant = 'card',
  className,
  containerClassName,
  ...props
}: BannerImageProps) {
  return (
    <OptimizedImage
      {...props}
      fill
      className={cn('object-cover', className)}
      containerClassName={containerClassName}
      aspectRatio={bannerAspectRatios[variant]}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}

export default OptimizedImage;
