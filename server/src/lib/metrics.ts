/**
 * Simple Metrics Collection for Prometheus-compatible output
 * Tracks request counts, response times, and error rates
 */

interface RequestMetric {
  path: string;
  method: string;
  status: number;
  count: number;
  totalDuration: number;
  durations: number[]; // For histogram
}

interface MetricsConfig {
  histogramBuckets: number[];
  maxSamples: number;
}

const DEFAULT_CONFIG: MetricsConfig = {
  // Histogram buckets in milliseconds
  histogramBuckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  // Maximum samples to keep for histogram calculation
  maxSamples: 1000,
};

class MetricsCollector {
  private requests: Map<string, RequestMetric> = new Map();
  private activeConnections: number = 0;
  private errorCounts: Map<string, number> = new Map();
  private startTime: number = Date.now();
  private config: MetricsConfig;

  constructor(config?: Partial<MetricsConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a key for a request metric
   */
  private getKey(path: string, method: string, status: number): string {
    // Normalize path by replacing IDs with placeholders
    const normalizedPath = path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id');
    return `${method}:${normalizedPath}:${status}`;
  }

  /**
   * Record a request
   */
  recordRequest(path: string, method: string, status: number, duration: number): void {
    const key = this.getKey(path, method, status);

    let metric = this.requests.get(key);
    if (!metric) {
      metric = {
        path: path
          .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
          .replace(/\/\d+/g, '/:id'),
        method,
        status,
        count: 0,
        totalDuration: 0,
        durations: [],
      };
      this.requests.set(key, metric);
    }

    metric.count++;
    metric.totalDuration += duration;

    // Keep only recent samples for histogram
    if (metric.durations.length >= this.config.maxSamples) {
      metric.durations.shift();
    }
    metric.durations.push(duration);

    // Track error counts separately
    if (status >= 400) {
      const errorKey = status >= 500 ? '5xx' : '4xx';
      this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    }
  }

  /**
   * Increment active connections
   */
  incrementConnections(): void {
    this.activeConnections++;
  }

  /**
   * Decrement active connections
   */
  decrementConnections(): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
  }

  /**
   * Get active connections count
   */
  getActiveConnections(): number {
    return this.activeConnections;
  }

  /**
   * Record a custom error
   */
  recordError(type: string): void {
    this.errorCounts.set(type, (this.errorCounts.get(type) || 0) + 1);
  }

  /**
   * Calculate histogram buckets for a set of durations
   */
  private calculateHistogram(durations: number[]): Record<string, number> {
    const histogram: Record<string, number> = {};

    for (const bucket of this.config.histogramBuckets) {
      histogram[`le="${bucket}"`] = durations.filter(d => d <= bucket).length;
    }
    histogram['le="+Inf"'] = durations.length;

    return histogram;
  }

  /**
   * Get metrics in Prometheus format
   */
  getMetrics(): string {
    const lines: string[] = [];
    const uptime = (Date.now() - this.startTime) / 1000;

    // Uptime
    lines.push('# HELP devlog_uptime_seconds Server uptime in seconds');
    lines.push('# TYPE devlog_uptime_seconds gauge');
    lines.push(`devlog_uptime_seconds ${uptime}`);
    lines.push('');

    // Active connections
    lines.push('# HELP devlog_active_connections Current number of active connections');
    lines.push('# TYPE devlog_active_connections gauge');
    lines.push(`devlog_active_connections ${this.activeConnections}`);
    lines.push('');

    // Request counts
    lines.push('# HELP devlog_http_requests_total Total number of HTTP requests');
    lines.push('# TYPE devlog_http_requests_total counter');
    for (const [, metric] of this.requests) {
      lines.push(
        `devlog_http_requests_total{method="${metric.method}",path="${metric.path}",status="${metric.status}"} ${metric.count}`
      );
    }
    lines.push('');

    // Request duration histogram
    lines.push('# HELP devlog_http_request_duration_ms HTTP request duration in milliseconds');
    lines.push('# TYPE devlog_http_request_duration_ms histogram');
    for (const [, metric] of this.requests) {
      const histogram = this.calculateHistogram(metric.durations);
      for (const [bucket, count] of Object.entries(histogram)) {
        lines.push(
          `devlog_http_request_duration_ms_bucket{method="${metric.method}",path="${metric.path}",${bucket}} ${count}`
        );
      }
      lines.push(
        `devlog_http_request_duration_ms_sum{method="${metric.method}",path="${metric.path}"} ${metric.totalDuration}`
      );
      lines.push(
        `devlog_http_request_duration_ms_count{method="${metric.method}",path="${metric.path}"} ${metric.count}`
      );
    }
    lines.push('');

    // Error counts
    lines.push('# HELP devlog_errors_total Total number of errors by type');
    lines.push('# TYPE devlog_errors_total counter');
    for (const [type, count] of this.errorCounts) {
      lines.push(`devlog_errors_total{type="${type}"} ${count}`);
    }
    lines.push('');

    // Memory usage
    const memUsage = process.memoryUsage();
    lines.push('# HELP devlog_memory_bytes Memory usage in bytes');
    lines.push('# TYPE devlog_memory_bytes gauge');
    lines.push(`devlog_memory_bytes{type="rss"} ${memUsage.rss}`);
    lines.push(`devlog_memory_bytes{type="heapTotal"} ${memUsage.heapTotal}`);
    lines.push(`devlog_memory_bytes{type="heapUsed"} ${memUsage.heapUsed}`);
    lines.push(`devlog_memory_bytes{type="external"} ${memUsage.external}`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Get summary statistics as JSON
   */
  getSummary(): {
    uptime: number;
    activeConnections: number;
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    requestsByEndpoint: Record<string, number>;
    errorCounts: Record<string, number>;
  } {
    let totalRequests = 0;
    let totalDuration = 0;
    let totalErrors = 0;
    const requestsByEndpoint: Record<string, number> = {};

    for (const [, metric] of this.requests) {
      totalRequests += metric.count;
      totalDuration += metric.totalDuration;
      if (metric.status >= 400) {
        totalErrors += metric.count;
      }

      const endpointKey = `${metric.method} ${metric.path}`;
      requestsByEndpoint[endpointKey] = (requestsByEndpoint[endpointKey] || 0) + metric.count;
    }

    return {
      uptime: (Date.now() - this.startTime) / 1000,
      activeConnections: this.activeConnections,
      totalRequests,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      averageResponseTime: totalRequests > 0 ? totalDuration / totalRequests : 0,
      requestsByEndpoint,
      errorCounts: Object.fromEntries(this.errorCounts),
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.requests.clear();
    this.errorCounts.clear();
    this.startTime = Date.now();
  }
}

// Export singleton instance
export const metrics = new MetricsCollector();

// Export types and class for testing
export { MetricsCollector };
export type { RequestMetric, MetricsConfig };
