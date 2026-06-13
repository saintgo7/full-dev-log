/**
 * Cache Key Generators
 * Centralized cache key definitions for consistency across the application
 */

// Cache key prefixes
const PREFIXES = {
  USER: 'user',
  TEAM: 'team',
  REPORT: 'report',
  PROJECT: 'project',
  ANALYSIS: 'analysis',
  RESPONSE: 'response',
} as const;

// TTL values in seconds
export const CACHE_TTL = {
  SHORT: 60,           // 1 minute - for frequently changing data
  MEDIUM: 300,         // 5 minutes - default
  LONG: 900,           // 15 minutes - for slower changing data
  VERY_LONG: 3600,     // 1 hour - for rarely changing data
  STATS: 600,          // 10 minutes - for statistics
  RESPONSE: 60,        // 1 minute - for HTTP response caching
} as const;

/**
 * User-related cache keys
 */
export const userKeys = {
  /**
   * User statistics cache key
   * @param userId - User ID
   * @param dateRange - Optional date range identifier (e.g., '7d', '30d')
   */
  stats: (userId: string, dateRange?: string): string =>
    dateRange
      ? `${PREFIXES.USER}:stats:${userId}:${dateRange}`
      : `${PREFIXES.USER}:stats:${userId}`,

  /**
   * User preferences cache key
   */
  preferences: (userId: string): string =>
    `${PREFIXES.USER}:prefs:${userId}`,

  /**
   * User's comprehensive analysis cache key
   */
  analysis: (userId: string, startDate: string, endDate: string): string =>
    `${PREFIXES.USER}:analysis:${userId}:${startDate}:${endDate}`,

  /**
   * User's hourly activity pattern
   */
  hourlyActivity: (userId: string, startDate: string, endDate: string): string =>
    `${PREFIXES.USER}:hourly:${userId}:${startDate}:${endDate}`,

  /**
   * User's daily activity pattern
   */
  dailyActivity: (userId: string, startDate: string, endDate: string): string =>
    `${PREFIXES.USER}:daily:${userId}:${startDate}:${endDate}`,

  /**
   * User's productivity score
   */
  productivityScore: (userId: string, date: string): string =>
    `${PREFIXES.USER}:productivity:${userId}:${date}`,

  /**
   * Pattern for clearing all user cache entries
   */
  pattern: (userId: string): string =>
    `${PREFIXES.USER}:*:${userId}*`,
};

/**
 * Team-related cache keys
 */
export const teamKeys = {
  /**
   * Team statistics cache key
   */
  stats: (teamId: string): string =>
    `${PREFIXES.TEAM}:stats:${teamId}`,

  /**
   * Team member list cache key
   */
  members: (teamId: string): string =>
    `${PREFIXES.TEAM}:members:${teamId}`,

  /**
   * Team projects list cache key
   */
  projects: (teamId: string): string =>
    `${PREFIXES.TEAM}:projects:${teamId}`,

  /**
   * Team details cache key
   */
  details: (teamId: string): string =>
    `${PREFIXES.TEAM}:details:${teamId}`,

  /**
   * User's teams list cache key
   */
  userTeams: (userId: string): string =>
    `${PREFIXES.TEAM}:user:${userId}`,

  /**
   * Pattern for clearing all team cache entries
   */
  pattern: (teamId: string): string =>
    `${PREFIXES.TEAM}:*:${teamId}*`,

  /**
   * Pattern for clearing all team-related cache for a user
   */
  userPattern: (userId: string): string =>
    `${PREFIXES.TEAM}:user:${userId}*`,
};

/**
 * Report-related cache keys
 */
export const reportKeys = {
  /**
   * Report summary cache key
   */
  summary: (reportId: string): string =>
    `${PREFIXES.REPORT}:summary:${reportId}`,

  /**
   * Report full data cache key
   */
  full: (reportId: string): string =>
    `${PREFIXES.REPORT}:full:${reportId}`,

  /**
   * User's reports list cache key
   */
  userReports: (userId: string): string =>
    `${PREFIXES.REPORT}:user:${userId}`,

  /**
   * Pattern for clearing all report cache entries
   */
  pattern: (reportId: string): string =>
    `${PREFIXES.REPORT}:*:${reportId}*`,
};

/**
 * Project-related cache keys
 */
export const projectKeys = {
  /**
   * Project activity cache key
   */
  activity: (projectId: string): string =>
    `${PREFIXES.PROJECT}:activity:${projectId}`,

  /**
   * Project statistics cache key
   */
  stats: (projectId: string): string =>
    `${PREFIXES.PROJECT}:stats:${projectId}`,

  /**
   * Project details cache key
   */
  details: (projectId: string): string =>
    `${PREFIXES.PROJECT}:details:${projectId}`,

  /**
   * User's projects list cache key
   */
  userProjects: (userId: string): string =>
    `${PREFIXES.PROJECT}:user:${userId}`,

  /**
   * Pattern for clearing all project cache entries
   */
  pattern: (projectId: string): string =>
    `${PREFIXES.PROJECT}:*:${projectId}*`,
};

/**
 * Response caching keys (for HTTP response caching)
 */
export const responseKeys = {
  /**
   * Generate response cache key from request
   */
  fromRequest: (method: string, path: string, query?: string): string =>
    query
      ? `${PREFIXES.RESPONSE}:${method}:${path}:${query}`
      : `${PREFIXES.RESPONSE}:${method}:${path}`,

  /**
   * Pattern for clearing response cache
   */
  pattern: (pathPrefix?: string): string =>
    pathPrefix
      ? `${PREFIXES.RESPONSE}:*:${pathPrefix}*`
      : `${PREFIXES.RESPONSE}:*`,
};

/**
 * Helper function to format date for cache keys
 */
export function formatDateForKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Helper to get date range identifier
 */
export function getDateRangeId(days: number): string {
  return `${days}d`;
}

/**
 * All cache key namespaces for bulk operations
 */
export const cacheNamespaces = {
  USER: PREFIXES.USER,
  TEAM: PREFIXES.TEAM,
  REPORT: PREFIXES.REPORT,
  PROJECT: PREFIXES.PROJECT,
  RESPONSE: PREFIXES.RESPONSE,
} as const;

export type CacheNamespace = keyof typeof cacheNamespaces;
