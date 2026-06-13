/**
 * Structured Logger with JSON output and context enrichment
 * Provides consistent logging format across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  agentId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  [key: string]: unknown;
}

// Sensitive fields to mask in logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiToken',
  'accessToken',
  'refreshToken',
  'authorization',
  'secret',
  'apiKey',
  'api_key',
  'bearer',
  'credential',
  'private',
];

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: LogLevel;
  private isProduction: boolean;
  private defaultContext: LogContext = {};

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || (this.isProduction ? 'info' : 'debug');
  }

  /**
   * Set default context that will be included in all log entries
   */
  setDefaultContext(context: LogContext): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context);
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  /**
   * Mask sensitive data in objects
   */
  private maskSensitive(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.maskSensitive(item));
    }

    if (typeof obj === 'object') {
      const masked: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
          masked[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          masked[key] = this.maskSensitive(value);
        } else {
          masked[key] = value;
        }
      }
      return masked;
    }

    return obj;
  }

  /**
   * Format and output log entry
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    // Merge contexts
    const mergedContext = { ...this.defaultContext, ...context };
    if (Object.keys(mergedContext).length > 0) {
      entry.context = this.maskSensitive(mergedContext) as LogContext;
    }

    // Add error details if present
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isProduction ? undefined : error.stack,
      };
    }

    // Output format depends on environment
    if (this.isProduction) {
      // JSON format for production (log aggregation systems)
      console.log(JSON.stringify(entry));
    } else {
      // Readable format for development
      this.formatDevLog(entry);
    }
  }

  /**
   * Format log for development console
   */
  private formatDevLog(entry: LogEntry): void {
    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    const color = levelColors[entry.level];

    let output = `${color}[${entry.timestamp}] [${entry.level.toUpperCase()}]${reset} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += ` ${JSON.stringify(entry.context)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  ${entry.error.stack}`;
      }
    }

    console.log(output);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | LogContext, context?: LogContext): void {
    if (error instanceof Error) {
      this.log('error', message, context, error);
    } else {
      this.log('error', message, error);
    }
  }

  /**
   * Log HTTP request details
   */
  request(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `${method} ${path} ${statusCode} ${duration}ms`, {
      ...context,
      http: {
        method,
        path,
        statusCode,
        duration,
      },
    });
  }
}

/**
 * Child logger with pre-set context
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private context: LogContext
  ) {}

  debug(message: string, additionalContext?: LogContext): void {
    this.parent.debug(message, { ...this.context, ...additionalContext });
  }

  info(message: string, additionalContext?: LogContext): void {
    this.parent.info(message, { ...this.context, ...additionalContext });
  }

  warn(message: string, additionalContext?: LogContext): void {
    this.parent.warn(message, { ...this.context, ...additionalContext });
  }

  error(message: string, error?: Error | LogContext, additionalContext?: LogContext): void {
    if (error instanceof Error) {
      this.parent.error(message, error, { ...this.context, ...additionalContext });
    } else {
      this.parent.error(message, { ...this.context, ...error });
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types
export type { LogLevel, LogContext, LogEntry };
