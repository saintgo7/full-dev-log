/**
 * Health Check Service
 * Provides comprehensive health status checks for the application
 */

import { prisma } from '../lib/prisma.js';
import { cache } from '../lib/cache.js';
import { socketManager } from '../websocket/socketManager.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import os from 'os';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ComponentHealth {
  status: HealthStatus;
  latency?: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  status: HealthStatus;
  version: string;
  uptime: number;
  timestamp: string;
  components: {
    database: ComponentHealth;
    cache: ComponentHealth;
    websocket: ComponentHealth;
  };
  system?: {
    memory: {
      total: number;
      free: number;
      used: number;
      usedPercent: number;
    };
    cpu: {
      loadAvg: number[];
      cores: number;
    };
    disk?: {
      available: number;
      total: number;
      usedPercent: number;
    };
  };
}

class HealthChecker {
  private startTime: number = Date.now();
  private appVersion: string = '1.0.0';

  constructor() {
    this.loadVersion();
  }

  /**
   * Load application version from package.json
   */
  private loadVersion(): void {
    try {
      const packagePath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
      this.appVersion = packageJson.version || '1.0.0';
    } catch {
      // Default version if package.json cannot be read
      this.appVersion = '1.0.0';
    }
  }

  /**
   * Get application version
   */
  getVersion(): string {
    return this.appVersion;
  }

  /**
   * Get server uptime in seconds
   */
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Check database connection
   */
  async checkDatabase(): Promise<ComponentHealth> {
    const start = Date.now();

    try {
      // Execute a simple query to test connection
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return {
        status: latency > 1000 ? 'degraded' : 'healthy',
        latency,
        message: latency > 1000 ? 'Database response time is slow' : 'Connected',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        message: error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }

  /**
   * Check cache service status
   */
  checkCache(): ComponentHealth {
    try {
      const stats = cache.getStats();

      // Check if cache is functioning by testing set/get
      const testKey = '__health_check__';
      cache.set(testKey, 'test', 1);
      const retrieved = cache.get<string>(testKey);
      cache.delete(testKey);

      if (retrieved !== 'test') {
        return {
          status: 'unhealthy',
          message: 'Cache read/write failed',
        };
      }

      return {
        status: 'healthy',
        message: 'Cache operational',
        details: {
          entries: stats.entries,
          hitRate: `${stats.hitRate.toFixed(2)}%`,
          memoryUsage: stats.memoryUsageEstimate,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Cache check failed',
      };
    }
  }

  /**
   * Check WebSocket server status
   */
  checkWebSocket(): ComponentHealth {
    try {
      const io = socketManager.getIO();

      if (!io) {
        return {
          status: 'unhealthy',
          message: 'WebSocket server not initialized',
        };
      }

      const connectedUsers = socketManager.getConnectedUsers();

      return {
        status: 'healthy',
        message: 'WebSocket server running',
        details: {
          connectedClients: connectedUsers.length,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'WebSocket check failed',
      };
    }
  }

  /**
   * Check memory usage
   */
  checkMemory(): {
    total: number;
    free: number;
    used: number;
    usedPercent: number;
  } {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      usedPercent: (usedMem / totalMem) * 100,
    };
  }

  /**
   * Check disk space (simplified - checks current directory)
   */
  async checkDiskSpace(): Promise<{
    available: number;
    total: number;
    usedPercent: number;
  } | null> {
    // Note: For a production system, you might want to use a library like 'disk-space' or 'check-disk-space'
    // This is a simplified placeholder that returns null if disk info cannot be obtained
    try {
      // On Unix systems, we could parse df output
      // For cross-platform compatibility, returning null here
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get comprehensive health status
   */
  async getFullHealth(): Promise<SystemHealth> {
    const [database, websocket] = await Promise.all([
      this.checkDatabase(),
      Promise.resolve(this.checkWebSocket()),
    ]);

    const cacheHealth = this.checkCache();
    const memory = this.checkMemory();
    const disk = await this.checkDiskSpace();

    // Determine overall status
    const componentStatuses = [database.status, cacheHealth.status, websocket.status];
    let overallStatus: HealthStatus = 'healthy';

    if (componentStatuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (componentStatuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    const health: SystemHealth = {
      status: overallStatus,
      version: this.appVersion,
      uptime: this.getUptime(),
      timestamp: new Date().toISOString(),
      components: {
        database,
        cache: cacheHealth,
        websocket,
      },
      system: {
        memory,
        cpu: {
          loadAvg: os.loadavg(),
          cores: os.cpus().length,
        },
      },
    };

    if (disk) {
      health.system!.disk = disk;
    }

    return health;
  }

  /**
   * Simple liveness check
   * Returns true if the process is alive and responding
   */
  isAlive(): boolean {
    return true;
  }

  /**
   * Readiness check
   * Returns true if the service is ready to accept traffic
   */
  async isReady(): Promise<boolean> {
    try {
      const dbHealth = await this.checkDatabase();
      return dbHealth.status !== 'unhealthy';
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const healthChecker = new HealthChecker();

// Export class for testing
export { HealthChecker };
