/**
 * Error Logger Middleware
 * Logs uncaught errors with categorization and alerting
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';
import { metrics } from '../lib/metrics.js';

// Error categories for classification
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external_service',
  INTERNAL = 'internal',
  UNKNOWN = 'unknown',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

interface CategorizedError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  shouldAlert: boolean;
}

/**
 * Categorize an error based on its properties
 */
function categorizeError(error: Error, statusCode: number): CategorizedError {
  const errorName = error.name.toLowerCase();
  const errorMessage = error.message.toLowerCase();

  // Validation errors (400)
  if (statusCode === 400 || errorName.includes('validation') || errorName.includes('zod')) {
    return {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      shouldAlert: false,
    };
  }

  // Authentication errors (401)
  if (statusCode === 401 || errorName.includes('authentication') || errorName.includes('jwt')) {
    return {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      shouldAlert: false,
    };
  }

  // Authorization errors (403)
  if (statusCode === 403 || errorName.includes('authorization') || errorName.includes('forbidden')) {
    return {
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      shouldAlert: false,
    };
  }

  // Not found errors (404)
  if (statusCode === 404 || errorName.includes('notfound')) {
    return {
      category: ErrorCategory.NOT_FOUND,
      severity: ErrorSeverity.LOW,
      shouldAlert: false,
    };
  }

  // Rate limit errors (429)
  if (statusCode === 429 || errorMessage.includes('rate limit')) {
    return {
      category: ErrorCategory.RATE_LIMIT,
      severity: ErrorSeverity.LOW,
      shouldAlert: false,
    };
  }

  // Database errors
  if (
    errorName.includes('prisma') ||
    errorMessage.includes('database') ||
    errorMessage.includes('postgres') ||
    errorMessage.includes('connection')
  ) {
    return {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.CRITICAL,
      shouldAlert: true,
    };
  }

  // External service errors
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('external')
  ) {
    return {
      category: ErrorCategory.EXTERNAL_SERVICE,
      severity: ErrorSeverity.HIGH,
      shouldAlert: true,
    };
  }

  // Internal server errors (500+)
  if (statusCode >= 500) {
    return {
      category: ErrorCategory.INTERNAL,
      severity: ErrorSeverity.HIGH,
      shouldAlert: true,
    };
  }

  // Unknown errors
  return {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    shouldAlert: statusCode >= 500,
  };
}

/**
 * Trigger alert for critical errors
 * In production, this would integrate with PagerDuty, Slack, etc.
 */
function triggerAlert(
  error: Error,
  category: ErrorCategory,
  severity: ErrorSeverity,
  context: Record<string, unknown>
): void {
  // Log critical alert
  logger.error(`ALERT: ${severity.toUpperCase()} severity error in ${category}`, error, {
    ...context,
    alert: true,
    severity,
    category,
  });

  // In production, you would integrate with alerting services here:
  // - PagerDuty
  // - Slack webhook
  // - Email notification
  // - SMS alert
}

/**
 * Error logger middleware
 * Should be placed after all routes
 */
export function errorLogger(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Determine status code
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  // Categorize the error
  const { category, severity, shouldAlert } = categorizeError(error, statusCode);

  // Build error context
  const context = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    userId: (req as any).user?.userId,
    statusCode,
    category,
    severity,
    ip: req.ip || req.socket.remoteAddress,
  };

  // Record error metric
  metrics.recordError(category);

  // Log the error
  if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
    logger.error(`[${category}] ${error.message}`, error, context);
  } else if (severity === ErrorSeverity.MEDIUM) {
    logger.warn(`[${category}] ${error.message}`, context);
  } else {
    logger.info(`[${category}] ${error.message}`, context);
  }

  // Trigger alert if necessary
  if (shouldAlert && process.env.NODE_ENV === 'production') {
    triggerAlert(error, category, severity, context);
  }

  // Pass to next error handler
  next(error);
}

/**
 * Uncaught exception handler
 * Should be registered early in the application lifecycle
 */
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception', error, {
      type: 'uncaughtException',
      alert: true,
      severity: ErrorSeverity.CRITICAL,
    });

    // In production, you might want to gracefully shutdown
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));

    logger.error('Unhandled promise rejection', error, {
      type: 'unhandledRejection',
      alert: true,
      severity: ErrorSeverity.CRITICAL,
    });
  });

  // Handle warnings
  process.on('warning', (warning: Error) => {
    logger.warn('Process warning', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    });
  });

  logger.info('Global error handlers registered');
}

// Export types
export type { CategorizedError };
