/**
 * Express Cache Middleware
 * Provides response caching and cache invalidation middleware
 */

import { Request, Response, NextFunction } from 'express';
import { cache } from '../lib/cache.js';
import { responseKeys, CACHE_TTL } from '../lib/cacheKeys.js';
import type { AuthRequest } from '../types/index.js';

interface CachedResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  etag?: string;
}

/**
 * Generate cache key from request
 */
function generateCacheKey(
  req: Request,
  keyGenerator?: (req: Request) => string
): string {
  if (keyGenerator) {
    return keyGenerator(req);
  }

  // Default key generation: method + path + sorted query params
  const queryString = Object.keys(req.query)
    .sort()
    .map((key) => `${key}=${req.query[key]}`)
    .join('&');

  return responseKeys.fromRequest(req.method, req.path, queryString || undefined);
}

/**
 * Generate ETag from response body
 */
function generateETag(body: unknown): string {
  const content = typeof body === 'string' ? body : JSON.stringify(body);
  // Simple hash for ETag
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

/**
 * Cache response middleware
 * Caches GET responses with optional TTL and key generator
 *
 * @param ttl - Time to live in seconds (default: CACHE_TTL.RESPONSE)
 * @param keyGenerator - Custom key generator function
 */
export function cacheResponse(
  ttl: number = CACHE_TTL.RESPONSE,
  keyGenerator?: (req: Request) => string
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    const cacheKey = generateCacheKey(req, keyGenerator);

    // Check for cached response
    const cached = cache.get<CachedResponse>(cacheKey);

    if (cached) {
      // Check ETag for conditional requests
      const clientETag = req.headers['if-none-match'];
      if (clientETag && cached.etag && clientETag === cached.etag) {
        res.status(304).end();
        return;
      }

      // Set cached headers
      for (const [key, value] of Object.entries(cached.headers)) {
        res.setHeader(key, value);
      }

      // Add cache-related headers
      res.setHeader('X-Cache', 'HIT');
      if (cached.etag) {
        res.setHeader('ETag', cached.etag);
      }

      res.status(cached.statusCode).json(cached.body);
      return;
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to capture response
    res.json = function (body: unknown): Response {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const etag = generateETag(body);

        const responseToCache: CachedResponse = {
          statusCode: res.statusCode,
          body,
          headers: {
            'Content-Type': 'application/json',
          },
          etag,
        };

        cache.set(cacheKey, responseToCache, ttl);

        // Set ETag header
        res.setHeader('ETag', etag);
      }

      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}

/**
 * Invalidate cache middleware
 * Clears cache entries matching patterns after successful mutations
 *
 * @param patterns - Cache patterns to clear (supports * wildcard)
 */
export function invalidateCache(
  patterns: string[] | ((req: Request) => string[])
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after successful response
    res.json = function (body: unknown): Response {
      // Only invalidate on successful mutations
      if (
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
        res.statusCode >= 200 &&
        res.statusCode < 300
      ) {
        const patternsToInvalidate =
          typeof patterns === 'function' ? patterns(req) : patterns;

        for (const pattern of patternsToInvalidate) {
          cache.clear(pattern);
        }
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Invalidate cache by user ID
 * Useful for user-specific cache invalidation
 */
export function invalidateUserCache() {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown): Response {
      if (
        req.user?.userId &&
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
        res.statusCode >= 200 &&
        res.statusCode < 300
      ) {
        // Clear user-related caches
        cache.clear(`user:*:${req.user.userId}*`);
        cache.clear(`team:user:${req.user.userId}*`);
        cache.clear(`project:user:${req.user.userId}*`);
        cache.clear(`report:user:${req.user.userId}*`);
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Cache control headers middleware
 * Sets appropriate cache control headers based on resource type
 */
export function setCacheHeaders(
  options: {
    maxAge?: number;
    private?: boolean;
    noCache?: boolean;
    mustRevalidate?: boolean;
  } = {}
) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const directives: string[] = [];

    if (options.noCache) {
      directives.push('no-cache', 'no-store', 'must-revalidate');
    } else {
      if (options.private) {
        directives.push('private');
      } else {
        directives.push('public');
      }

      if (options.maxAge !== undefined) {
        directives.push(`max-age=${options.maxAge}`);
      }

      if (options.mustRevalidate) {
        directives.push('must-revalidate');
      }
    }

    res.setHeader('Cache-Control', directives.join(', '));
    next();
  };
}

/**
 * Vary header middleware
 * Ensures proper cache variation based on request headers
 */
export function setVaryHeader(headers: string[] = ['Accept', 'Authorization']) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('Vary', headers.join(', '));
    next();
  };
}

/**
 * Conditional request handler
 * Handles If-None-Match and If-Modified-Since headers
 */
export function handleConditionalRequest(
  getETag: (req: Request) => string | Promise<string>,
  getLastModified?: (req: Request) => Date | Promise<Date>
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const etag = await getETag(req);
      const clientETag = req.headers['if-none-match'];

      if (clientETag && clientETag === etag) {
        res.status(304).end();
        return;
      }

      if (getLastModified) {
        const lastModified = await getLastModified(req);
        const clientModified = req.headers['if-modified-since'];

        if (clientModified) {
          const clientDate = new Date(clientModified);
          if (lastModified <= clientDate) {
            res.status(304).end();
            return;
          }
        }

        res.setHeader('Last-Modified', lastModified.toUTCString());
      }

      res.setHeader('ETag', etag);
      next();
    } catch {
      next();
    }
  };
}
