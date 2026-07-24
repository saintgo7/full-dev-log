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
 * Export Prisma instance for direct access when needed
 */
export { prisma };
