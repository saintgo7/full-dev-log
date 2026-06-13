/**
 * Request Logger Middleware
 * Logs incoming requests and outgoing responses with timing
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';
import { metrics } from '../lib/metrics.js';
import { randomUUID } from 'crypto';

// Extend Express Request to include request ID
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

interface RequestLoggerOptions {
  skipPaths?: string[];
  skipHealthChecks?: boolean;
}

const DEFAULT_OPTIONS: RequestLoggerOptions = {
  skipPaths: [],
  skipHealthChecks: true,
};

/**
 * Generate a short request ID
 */
function generateRequestId(): string {
  return randomUUID().substring(0, 8);
}

/**
 * Create request logger middleware
 */
export function createRequestLogger(options: RequestLoggerOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Build skip paths set
  const skipPaths = new Set(opts.skipPaths);
  if (opts.skipHealthChecks) {
    skipPaths.add('/health');
    skipPaths.add('/health/ready');
    skipPaths.add('/health/live');
    skipPaths.add('/metrics');
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip logging for specified paths
    if (skipPaths.has(req.path)) {
      return next();
    }

    // Generate and attach request ID
    const requestId = req.headers['x-request-id'] as string || generateRequestId();
    req.requestId = requestId;
    req.startTime = Date.now();

    // Set response header
    res.setHeader('X-Request-ID', requestId);

    // Log request start
    logger.debug('Request received', {
      requestId,
      method: req.method,
      path: req.path,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.socket.remoteAddress,
    });

    // Track active connections
    metrics.incrementConnections();

    // Capture response data
    const originalSend = res.send.bind(res);
    res.send = function (body: unknown): Response {
      const duration = Date.now() - (req.startTime || Date.now());
      const statusCode = res.statusCode;

      // Record metrics
      metrics.recordRequest(req.path, req.method, statusCode, duration);
      metrics.decrementConnections();

      // Log request completion
      logger.request(req.method, req.path, statusCode, duration, {
        requestId,
        userId: (req as any).user?.userId,
      });

      return originalSend(body);
    };

    // Handle connection close without response
    res.on('close', () => {
      if (!res.writableEnded) {
        const duration = Date.now() - (req.startTime || Date.now());
        logger.warn('Request connection closed before response', {
          requestId,
          method: req.method,
          path: req.path,
          duration,
        });
        metrics.decrementConnections();
        metrics.recordError('connection_closed');
      }
    });

    next();
  };
}

/**
 * Default request logger middleware
 */
export const requestLogger = createRequestLogger();
