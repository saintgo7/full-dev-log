/**
 * Cache Controller
 * Admin-only endpoints for cache management
 */

import { Response } from 'express';
import { cache } from '../lib/cache.js';
import { cacheNamespaces, type CacheNamespace } from '../lib/cacheKeys.js';
import type { AuthRequest } from '../types/index.js';

/**
 * Get cache statistics
 * GET /api/v1/admin/cache/stats
 */
export async function getCacheStats(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const stats = cache.getStats();

  // Get key counts per namespace
  const namespaceStats: Record<string, number> = {};
  for (const [name, prefix] of Object.entries(cacheNamespaces)) {
    const keys = cache.keys(`${prefix}:*`);
    namespaceStats[name.toLowerCase()] = keys.length;
  }

  res.json({
    success: true,
    data: {
      ...stats,
      hitRateFormatted: `${stats.hitRate.toFixed(2)}%`,
      memoryUsageFormatted: formatBytes(stats.memoryUsageEstimate),
      namespaces: namespaceStats,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Clear cache entries
 * POST /api/v1/admin/cache/clear
 * Body: { pattern?: string, namespace?: CacheNamespace }
 */
export async function clearCache(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { pattern, namespace } = req.body as {
    pattern?: string;
    namespace?: CacheNamespace;
  };

  let clearedCount: number;
  let clearedPattern: string;

  if (namespace) {
    // Clear by namespace
    const prefix = cacheNamespaces[namespace];
    if (!prefix) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NAMESPACE',
          message: `Invalid namespace. Valid values: ${Object.keys(cacheNamespaces).join(', ')}`,
        },
      });
      return;
    }
    clearedPattern = `${prefix}:*`;
    clearedCount = cache.clear(clearedPattern);
  } else if (pattern) {
    // Clear by custom pattern
    clearedPattern = pattern;
    clearedCount = cache.clear(pattern);
  } else {
    // Clear all
    clearedPattern = '*';
    clearedCount = cache.clear();
  }

  res.json({
    success: true,
    data: {
      clearedCount,
      pattern: clearedPattern,
      message: `Cleared ${clearedCount} cache entries`,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Reset cache statistics
 * POST /api/v1/admin/cache/reset-stats
 */
export async function resetCacheStats(
  req: AuthRequest,
  res: Response
): Promise<void> {
  cache.resetStats();

  res.json({
    success: true,
    data: {
      message: 'Cache statistics have been reset',
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Get cache keys (optionally filtered by pattern)
 * GET /api/v1/admin/cache/keys
 * Query: { pattern?: string, limit?: number }
 */
export async function getCacheKeys(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { pattern, limit = 100 } = req.query as {
    pattern?: string;
    limit?: number;
  };

  const keys = cache.keys(pattern);
  const limitedKeys = keys.slice(0, Number(limit));

  res.json({
    success: true,
    data: {
      keys: limitedKeys,
      totalCount: keys.length,
      returnedCount: limitedKeys.length,
      pattern: pattern || '*',
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Trigger cache cleanup (remove expired entries)
 * POST /api/v1/admin/cache/cleanup
 */
export async function cleanupCache(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const cleanedCount = cache.cleanup();

  res.json({
    success: true,
    data: {
      cleanedCount,
      message: `Cleaned up ${cleanedCount} expired entries`,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Helper function to format bytes
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
