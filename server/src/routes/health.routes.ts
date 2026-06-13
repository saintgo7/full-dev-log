/**
 * Health Check Routes
 * Provides health, readiness, and liveness endpoints for Kubernetes probes
 */

import { Router } from 'express';
import {
  healthCheck,
  readinessCheck,
  livenessCheck,
  detailedHealth,
  getMetrics,
  getMetricsSummary,
} from '../controllers/health.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Public health endpoints (for load balancers and k8s probes)
// These should NOT require authentication

/**
 * @route   GET /health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', healthCheck);

/**
 * @route   GET /health/ready
 * @desc    Kubernetes readiness probe
 * @access  Public
 */
router.get('/ready', readinessCheck);

/**
 * @route   GET /health/live
 * @desc    Kubernetes liveness probe
 * @access  Public
 */
router.get('/live', livenessCheck);

export default router;

// Export a separate router for API routes that require authentication
export const healthApiRoutes = Router();

/**
 * @route   GET /api/v1/health/detailed
 * @desc    Detailed health information with all components
 * @access  Private (requires authentication)
 */
healthApiRoutes.get('/detailed', authMiddleware, detailedHealth);

/**
 * @route   GET /api/v1/health/metrics
 * @desc    Metrics summary as JSON
 * @access  Private (requires authentication)
 */
healthApiRoutes.get('/metrics', authMiddleware, getMetricsSummary);

// Export metrics route separately (can be public or private based on security requirements)
export const metricsRouter = Router();

/**
 * @route   GET /metrics
 * @desc    Prometheus-compatible metrics endpoint
 * @access  Public (can be secured via network policy in production)
 */
metricsRouter.get('/', getMetrics);
