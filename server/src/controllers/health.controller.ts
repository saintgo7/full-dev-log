/**
 * Health Check Controller
 * Provides endpoints for health checks, readiness, and liveness probes
 */

import { Request, Response } from 'express';
import { healthChecker } from '../services/health.service.js';
import { logger } from '../lib/logger.js';
import { metrics } from '../lib/metrics.js';

/**
 * Basic health check endpoint
 * Returns minimal health status for load balancers
 * GET /health
 */
export async function healthCheck(req: Request, res: Response): Promise<void> {
  try {
    const isReady = await healthChecker.isReady();

    if (isReady) {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Service unavailable',
      });
    }
  } catch (error) {
    logger.error('Health check failed', error as Error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
    });
  }
}

/**
 * Kubernetes readiness probe
 * Returns 200 if the service is ready to accept traffic
 * GET /health/ready
 */
export async function readinessCheck(req: Request, res: Response): Promise<void> {
  try {
    const isReady = await healthChecker.isReady();

    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        message: 'Service is not ready to accept traffic',
      });
    }
  } catch (error) {
    logger.error('Readiness check failed', error as Error);
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      message: 'Readiness check failed',
    });
  }
}

/**
 * Kubernetes liveness probe
 * Returns 200 if the process is alive
 * GET /health/live
 */
export function livenessCheck(req: Request, res: Response): void {
  // Simple liveness check - if we can respond, we're alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Detailed health check endpoint (authenticated)
 * Returns comprehensive system health information
 * GET /api/v1/health/detailed
 */
export async function detailedHealth(req: Request, res: Response): Promise<void> {
  try {
    const health = await healthChecker.getFullHealth();

    const statusCode = health.status === 'unhealthy' ? 503 : health.status === 'degraded' ? 200 : 200;

    res.status(statusCode).json({
      success: true,
      data: health,
    });
  } catch (error) {
    logger.error('Detailed health check failed', error as Error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: 'Failed to retrieve health information',
      },
    });
  }
}

/**
 * Prometheus metrics endpoint
 * Returns metrics in Prometheus text format
 * GET /metrics
 */
export function getMetrics(req: Request, res: Response): void {
  try {
    const metricsOutput = metrics.getMetrics();

    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.status(200).send(metricsOutput);
  } catch (error) {
    logger.error('Metrics retrieval failed', error as Error);
    res.status(500).send('# Error retrieving metrics');
  }
}

/**
 * Metrics summary as JSON (for internal use)
 * GET /api/v1/health/metrics
 */
export function getMetricsSummary(req: Request, res: Response): void {
  try {
    const summary = metrics.getSummary();

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Metrics summary retrieval failed', error as Error);
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_ERROR',
        message: 'Failed to retrieve metrics summary',
      },
    });
  }
}
