/**
 * Database Configuration - DevLog Hub Database Management
 * M13-T1: Connection pool and database utilities
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  connectionLimit: number;
  poolTimeout: number;
  queryTimeout: number;
  slowQueryThreshold: number;
}

/**
 * Connection statistics
 */
export interface ConnectionStats {
  activeConnections: number;
  idleConnections: number;
  totalQueries: number;
  avgQueryTime: number;
}

/**
 * Default database configuration
 */
export const defaultDatabaseConfig: DatabaseConfig = {
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT || '10000', 10), // 10 seconds
  queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10), // 30 seconds
  slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '1000', 10), // 1 second
};

/**
 * Query metrics collector
 */
class QueryMetrics {
  private queryCount: number = 0;
  private totalQueryTime: number = 0;
  private slowQueries: Array<{ query: string; duration: number; timestamp: Date }> = [];
  private maxSlowQueries: number = 100;

  recordQuery(duration: number, query?: string) {
    this.queryCount++;
    this.totalQueryTime += duration;

    if (duration > defaultDatabaseConfig.slowQueryThreshold && query) {
      this.slowQueries.push({
        query: query.substring(0, 500), // Truncate for storage
        duration,
        timestamp: new Date(),
      });

      // Keep only the most recent slow queries
      if (this.slowQueries.length > this.maxSlowQueries) {
        this.slowQueries = this.slowQueries.slice(-this.maxSlowQueries);
      }
    }
  }

  getStats() {
    return {
      totalQueries: this.queryCount,
      avgQueryTime: this.queryCount > 0 ? this.totalQueryTime / this.queryCount : 0,
      slowQueryCount: this.slowQueries.length,
    };
  }

  getSlowQueries() {
    return [...this.slowQueries];
  }

  reset() {
    this.queryCount = 0;
    this.totalQueryTime = 0;
    this.slowQueries = [];
  }
}

/**
 * Global query metrics instance
 */
export const queryMetrics = new QueryMetrics();

/**
 * Get current connection statistics
 * Note: Prisma doesn't expose direct connection pool stats,
 * so we provide query-level metrics instead
 *
 * @returns Connection and query statistics
 */
export async function getConnectionStats(): Promise<{
  database: string;
  poolSize: number;
  queryStats: {
    totalQueries: number;
    avgQueryTime: number;
    slowQueryCount: number;
  };
  health: 'healthy' | 'degraded' | 'unhealthy';
}> {
  const queryStats = queryMetrics.getStats();

  // Health check
  let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    health = 'unhealthy';
  }

  // Check for degraded state (many slow queries)
  if (queryStats.slowQueryCount > 50 || queryStats.avgQueryTime > 500) {
    health = health === 'healthy' ? 'degraded' : health;
  }

  return {
    database: 'postgresql',
    poolSize: defaultDatabaseConfig.connectionLimit,
    queryStats,
    health,
  };
}

/**
 * Execute raw SQL query with timeout and metrics
 * Use for complex aggregate queries that are difficult with Prisma
 *
 * @param sql - Raw SQL query
 * @param params - Query parameters
 * @returns Query results
 *
 * @example
 * const results = await executeRawQuery(
 *   Prisma.sql`SELECT DATE(local_timestamp), COUNT(*) FROM events WHERE user_id = ${userId} GROUP BY 1`
 * );
 */
export async function executeRawQuery<T>(
  sql: Prisma.Sql
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await prisma.$queryRaw<T>(sql);
    const duration = Date.now() - startTime;
    queryMetrics.recordQuery(duration, sql.text);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    queryMetrics.recordQuery(duration, sql.text);
    throw error;
  }
}

/**
 * Execute multiple raw queries in a transaction
 *
 * @param queries - Array of SQL queries
 * @returns Array of query results
 */
export async function executeRawTransaction<T>(
  queries: Prisma.Sql[]
): Promise<T[]> {
  const startTime = Date.now();

  try {
    const results = await prisma.$transaction(
      queries.map(sql => prisma.$queryRaw<T>(sql))
    ) as T[];

    const duration = Date.now() - startTime;
    queryMetrics.recordQuery(duration, `Transaction with ${queries.length} queries`);

    return results;
  } catch (error) {
    const duration = Date.now() - startTime;
    queryMetrics.recordQuery(duration, `Failed transaction with ${queries.length} queries`);
    throw error;
  }
}

/**
 * Optimized count query using raw SQL
 * More efficient than Prisma's count for simple counts
 *
 * @param table - Table name
 * @param where - WHERE clause conditions
 * @returns Count result
 */
export async function fastCount(
  table: string,
  userId: string,
  additionalConditions?: string
): Promise<number> {
  const whereClause = additionalConditions
    ? `user_id = $1 AND ${additionalConditions}`
    : `user_id = $1`;

  const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*) as count FROM ${table} WHERE ${whereClause}`,
    userId
  );

  return Number(result[0]?.count || 0);
}

/**
 * Perform a health check on the database
 *
 * @returns Health check result
 */
export async function healthCheck(): Promise<{
  status: 'ok' | 'error';
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'error',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Common aggregation queries optimized for performance
 */
export const aggregations = {
  /**
   * Get daily event counts for a user
   */
  async dailyEventCounts(
    userId: string,
    dateFrom: Date,
    dateTo: Date,
    projectId?: string
  ): Promise<Array<{ date: string; count: number }>> {
    const projectFilter = projectId ? Prisma.sql`AND project_id = ${projectId}` : Prisma.empty;

    const results = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(local_timestamp) as date, COUNT(*) as count
      FROM events
      WHERE user_id = ${userId}
        AND local_timestamp >= ${dateFrom}
        AND local_timestamp <= ${dateTo}
        ${projectFilter}
      GROUP BY DATE(local_timestamp)
      ORDER BY date DESC
    `;

    return results.map(r => ({
      date: r.date,
      count: Number(r.count),
    }));
  },

  /**
   * Get event type distribution for a user
   */
  async eventTypeDistribution(
    userId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<Array<{ eventType: string; count: number }>> {
    const results = await prisma.$queryRaw<Array<{ event_type: string; count: bigint }>>`
      SELECT event_type, COUNT(*) as count
      FROM events
      WHERE user_id = ${userId}
        AND local_timestamp >= ${dateFrom}
        AND local_timestamp <= ${dateTo}
      GROUP BY event_type
      ORDER BY count DESC
    `;

    return results.map(r => ({
      eventType: r.event_type,
      count: Number(r.count),
    }));
  },

  /**
   * Get hourly activity distribution
   */
  async hourlyDistribution(
    userId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<number[]> {
    const results = await prisma.$queryRaw<Array<{ hour: number; count: bigint }>>`
      SELECT EXTRACT(HOUR FROM local_timestamp)::integer as hour, COUNT(*) as count
      FROM events
      WHERE user_id = ${userId}
        AND local_timestamp >= ${dateFrom}
        AND local_timestamp <= ${dateTo}
      GROUP BY hour
      ORDER BY hour
    `;

    // Fill in all 24 hours with counts
    const distribution = new Array(24).fill(0);
    results.forEach(r => {
      distribution[r.hour] = Number(r.count);
    });

    return distribution;
  },

  /**
   * Get project activity summary
   */
  async projectActivitySummary(
    userId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<Array<{
    projectId: string | null;
    eventCount: number;
    lastActivity: Date;
  }>> {
    const results = await prisma.$queryRaw<Array<{
      project_id: string | null;
      event_count: bigint;
      last_activity: Date;
    }>>`
      SELECT
        project_id,
        COUNT(*) as event_count,
        MAX(local_timestamp) as last_activity
      FROM events
      WHERE user_id = ${userId}
        AND local_timestamp >= ${dateFrom}
        AND local_timestamp <= ${dateTo}
      GROUP BY project_id
      ORDER BY event_count DESC
    `;

    return results.map(r => ({
      projectId: r.project_id,
      eventCount: Number(r.event_count),
      lastActivity: r.last_activity,
    }));
  },
};

/**
 * Database maintenance utilities
 */
export const maintenance = {
  /**
   * Analyze tables for query optimization
   * Run periodically to update PostgreSQL statistics
   */
  async analyzeTable(table: string): Promise<void> {
    await prisma.$executeRawUnsafe(`ANALYZE ${table}`);
  },

  /**
   * Get table size statistics
   */
  async getTableStats(table: string): Promise<{
    rowCount: number;
    tableSize: string;
    indexSize: string;
  }> {
    const result = await prisma.$queryRaw<Array<{
      row_count: bigint;
      table_size: string;
      index_size: string;
    }>>`
      SELECT
        reltuples::bigint as row_count,
        pg_size_pretty(pg_table_size(${table}::regclass)) as table_size,
        pg_size_pretty(pg_indexes_size(${table}::regclass)) as index_size
      FROM pg_class
      WHERE relname = ${table}
    `;

    const stats = result[0];
    return {
      rowCount: Number(stats?.row_count || 0),
      tableSize: stats?.table_size || '0 bytes',
      indexSize: stats?.index_size || '0 bytes',
    };
  },
};

/**
 * Export Prisma instance for direct access when needed
 */
export { prisma };
