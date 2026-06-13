/**
 * Admin Routes
 * Protected routes requiring admin role
 */

import { Router, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { AuthorizationError } from '../utils/errors.js';
import {
  getCacheStats,
  clearCache,
  resetCacheStats,
  getCacheKeys,
  cleanupCache,
} from '../controllers/cache.controller.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

/**
 * Admin role check middleware
 * Requires the user to have 'admin' role
 */
async function adminOnly(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
    return;
  }

  next();
}

// Apply auth middleware to all admin routes
router.use(authMiddleware);
router.use(adminOnly);

/**
 * @route   GET /api/v1/admin/cache/stats
 * @desc    Get cache statistics
 * @access  Admin only
 */
router.get('/cache/stats', getCacheStats);

/**
 * @route   POST /api/v1/admin/cache/clear
 * @desc    Clear cache entries by pattern or namespace
 * @body    { pattern?: string, namespace?: 'USER' | 'TEAM' | 'REPORT' | 'PROJECT' | 'RESPONSE' }
 * @access  Admin only
 */
router.post('/cache/clear', clearCache);

/**
 * @route   POST /api/v1/admin/cache/reset-stats
 * @desc    Reset cache hit/miss statistics
 * @access  Admin only
 */
router.post('/cache/reset-stats', resetCacheStats);

/**
 * @route   GET /api/v1/admin/cache/keys
 * @desc    Get cache keys (with optional pattern filter)
 * @query   { pattern?: string, limit?: number }
 * @access  Admin only
 */
router.get('/cache/keys', getCacheKeys);

/**
 * @route   POST /api/v1/admin/cache/cleanup
 * @desc    Trigger cleanup of expired cache entries
 * @access  Admin only
 */
router.post('/cache/cleanup', cleanupCache);

export default router;
