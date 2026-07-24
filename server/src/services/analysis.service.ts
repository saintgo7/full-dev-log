import { prisma } from '../lib/prisma.js';
import { cache } from '../lib/cache.js';
import { userKeys, CACHE_TTL, formatDateForKey } from '../lib/cacheKeys.js';
import type { EventType } from '@prisma/client';

// ============================================
// Type Definitions
// ============================================

/**
 * Hourly activity breakdown
 */
export interface HourlyActivity {
  hour: number; // 0-23
  eventCount: number;
  eventTypes: Record<string, number>;
}

/**
 * Daily activity breakdown by day of week
 */
export interface DailyActivity {
  dayOfWeek: number; // 0 (Sunday) - 6 (Saturday)
  dayName: string;
  eventCount: number;
  eventTypes: Record<string, number>;
}

/**
 * File type activity
 */
export interface FileTypeActivity {
  extension: string;
  fileCount: number;
  editCount: number;
  lastEdited: Date | null;
}

/**
 * Project activity summary
 */
export interface ProjectActivity {
  projectId: string;
  projectName: string;
  eventCount: number;
  eventTypes: Record<string, number>;
  firstActivity: Date;
  lastActivity: Date;
}

/**
 * Productivity statistics
 */
export interface ProductivityStats {
  score: number; // 0-100
  totalEvents: number;
  focusedMinutes: number;
  breakMinutes: number;
  sessionsCount: number;
  avgSessionLength: number;
}

/**
 * Overall statistics
 */
export interface OverallStats {
  totalEvents: number;
  avgEventsPerDay: number;
  peakHours: Array<{ hour: number; count: number }>;
  mostProductiveDay: DailyActivity | null;
  streakDays: number;
  currentStreak: number;
}

/**
 * Date range input for queries
 */
interface DateRange {
  startDate: Date;
  endDate: Date;
}

// ============================================
// Helper Functions
// ============================================

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Extract file extension from path
 */
function getFileExtension(filePath: string | null): string {
  if (!filePath) return 'unknown';
  const parts = filePath.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1].toLowerCase();
  }
  return 'no-extension';
}

/**
 * Initialize event types record
 */
function initEventTypes(): Record<string, number> {
  return {
    git: 0,
    file: 0,
    terminal: 0,
    manual: 0,
  };
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

/**
 * Get date string in YYYY-MM-DD format
 */
function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================
// CodingPatternAnalyzer Class
// ============================================

export class CodingPatternAnalyzer {
  /**
   * Analyze activity grouped by hour (0-23)
   */
  async analyzeHourlyActivity(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<HourlyActivity[]> {
    const events = await prisma.event.findMany({
      where: {
        userId,
        localTimestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        eventType: true,
        localTimestamp: true,
      },
    });

    // Initialize hourly buckets
    const hourlyData: HourlyActivity[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      eventCount: 0,
      eventTypes: initEventTypes(),
    }));

    // Aggregate events by hour
    for (const event of events) {
      const hour = new Date(event.localTimestamp).getHours();
      hourlyData[hour].eventCount++;
      hourlyData[hour].eventTypes[event.eventType] =
        (hourlyData[hour].eventTypes[event.eventType] || 0) + 1;
    }

    return hourlyData;
  }

  /**
   * Analyze activity grouped by day of week
   */
  async analyzeDailyActivity(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyActivity[]> {
    const events = await prisma.event.findMany({
      where: {
        userId,
        localTimestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        eventType: true,
        localTimestamp: true,
      },
    });

    // Initialize daily buckets (0 = Sunday, 6 = Saturday)
    const dailyData: DailyActivity[] = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      dayName: DAY_NAMES[i],
      eventCount: 0,
      eventTypes: initEventTypes(),
    }));

    // Aggregate events by day of week
    for (const event of events) {
      const dayOfWeek = new Date(event.localTimestamp).getDay();
      dailyData[dayOfWeek].eventCount++;
      dailyData[dayOfWeek].eventTypes[event.eventType] =
        (dailyData[dayOfWeek].eventTypes[event.eventType] || 0) + 1;
    }

    return dailyData;
  }

  /**
   * Analyze most edited file types/extensions
   */
  async analyzeFileTypeActivity(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FileTypeActivity[]> {
    const fileEvents = await prisma.event.findMany({
      where: {
        userId,
        eventType: 'file',
        localTimestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        filePath: true,
        localTimestamp: true,
      },
    });

    // Group by file extension
    const extensionMap = new Map<
      string,
      { fileSet: Set<string>; editCount: number; lastEdited: Date }
    >();

    for (const event of fileEvents) {
      const ext = getFileExtension(event.filePath);
      const existing = extensionMap.get(ext);

      if (existing) {
        if (event.filePath) {
          existing.fileSet.add(event.filePath);
        }
        existing.editCount++;
        if (event.localTimestamp > existing.lastEdited) {
          existing.lastEdited = event.localTimestamp;
        }
      } else {
        const fileSet = new Set<string>();
        if (event.filePath) {
          fileSet.add(event.filePath);
        }
        extensionMap.set(ext, {
          fileSet,
          editCount: 1,
          lastEdited: event.localTimestamp,
        });
      }
    }

    // Convert to array and sort by edit count
    const result: FileTypeActivity[] = Array.from(extensionMap.entries())
      .map(([extension, data]) => ({
        extension,
        fileCount: data.fileSet.size,
        editCount: data.editCount,
        lastEdited: data.lastEdited,
      }))
      .sort((a, b) => b.editCount - a.editCount);

    return result;
  }

  /**
   * Analyze activity per project
   */
  async analyzeProjectActivity(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProjectActivity[]> {
    // Get events with project information
    const events = await prisma.event.findMany({
      where: {
        userId,
        projectId: { not: null },
        localTimestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        eventType: true,
        localTimestamp: true,
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Group by project
    const projectMap = new Map<
      string,
      {
        projectName: string;
        eventCount: number;
        eventTypes: Record<string, number>;
        firstActivity: Date;
        lastActivity: Date;
      }
    >();

    for (const event of events) {
      if (!event.projectId || !event.project) continue;

      const existing = projectMap.get(event.projectId);

      if (existing) {
        existing.eventCount++;
        existing.eventTypes[event.eventType] =
          (existing.eventTypes[event.eventType] || 0) + 1;
        if (event.localTimestamp < existing.firstActivity) {
          existing.firstActivity = event.localTimestamp;
        }
        if (event.localTimestamp > existing.lastActivity) {
          existing.lastActivity = event.localTimestamp;
        }
      } else {
        projectMap.set(event.projectId, {
          projectName: event.project.name,
          eventCount: 1,
          eventTypes: { ...initEventTypes(), [event.eventType]: 1 },
          firstActivity: event.localTimestamp,
          lastActivity: event.localTimestamp,
        });
      }
    }

    // Convert to array and sort by event count
    const result: ProjectActivity[] = Array.from(projectMap.entries())
      .map(([projectId, data]) => ({
        projectId,
        ...data,
      }))
      .sort((a, b) => b.eventCount - a.eventCount);

    return result;
  }

  /**
   * Calculate productivity score based on focused work sessions
   * Score is based on:
   * - Total activity (30%)
   * - Consistency/no long gaps (30%)
   * - Session length (20%)
   * - Event diversity (20%)
   */
  async calculateProductivityScore(
    userId: string,
    date: Date
  ): Promise<ProductivityStats> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await prisma.event.findMany({
      where: {
        userId,
        localTimestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        eventType: true,
        localTimestamp: true,
      },
      orderBy: {
        localTimestamp: 'asc',
      },
    });

    const totalEvents = events.length;

    if (totalEvents === 0) {
      return {
        score: 0,
        totalEvents: 0,
        focusedMinutes: 0,
        breakMinutes: 0,
        sessionsCount: 0,
        avgSessionLength: 0,
      };
    }

    // Identify work sessions (gap > 30 minutes = new session)
    const SESSION_GAP_MINUTES = 30;
    const sessions: Array<{ start: Date; end: Date; events: number }> = [];
    let currentSession = {
      start: events[0].localTimestamp,
      end: events[0].localTimestamp,
      events: 1,
    };

    for (let i = 1; i < events.length; i++) {
      const prevTime = events[i - 1].localTimestamp.getTime();
      const currTime = events[i].localTimestamp.getTime();
      const gapMinutes = (currTime - prevTime) / (1000 * 60);

      if (gapMinutes > SESSION_GAP_MINUTES) {
        // End current session and start new one
        sessions.push(currentSession);
        currentSession = {
          start: events[i].localTimestamp,
          end: events[i].localTimestamp,
          events: 1,
        };
      } else {
        currentSession.end = events[i].localTimestamp;
        currentSession.events++;
      }
    }
    sessions.push(currentSession);

    // Calculate focused and break time
    let focusedMinutes = 0;
    let breakMinutes = 0;

    for (let i = 0; i < sessions.length; i++) {
      const sessionDuration =
        (sessions[i].end.getTime() - sessions[i].start.getTime()) / (1000 * 60);
      focusedMinutes += Math.max(sessionDuration, 1); // At least 1 minute per event

      if (i < sessions.length - 1) {
        const breakDuration =
          (sessions[i + 1].start.getTime() - sessions[i].end.getTime()) / (1000 * 60);
        breakMinutes += breakDuration;
      }
    }

    const sessionsCount = sessions.length;
    const avgSessionLength = focusedMinutes / sessionsCount;

    // Calculate score components
    // 1. Activity score (0-30): Based on number of events, normalized to ~100 events/day max
    const activityScore = Math.min(30, (totalEvents / 100) * 30);

    // 2. Consistency score (0-30): Based on average session length vs breaks
    const focusRatio =
      focusedMinutes > 0 ? focusedMinutes / (focusedMinutes + breakMinutes) : 0;
    const consistencyScore = focusRatio * 30;

    // 3. Session quality score (0-20): Based on optimal session length (45-90 min)
    let sessionQualityScore = 0;
    for (const session of sessions) {
      const duration =
        (session.end.getTime() - session.start.getTime()) / (1000 * 60);
      if (duration >= 45 && duration <= 90) {
        sessionQualityScore += 5;
      } else if (duration >= 20 && duration < 45) {
        sessionQualityScore += 3;
      } else if (duration > 90) {
        sessionQualityScore += 2; // Too long might indicate no breaks
      } else {
        sessionQualityScore += 1;
      }
    }
    sessionQualityScore = Math.min(20, sessionQualityScore);

    // 4. Diversity score (0-20): Based on variety of event types
    const eventTypeCounts: Record<string, number> = {};
    for (const event of events) {
      eventTypeCounts[event.eventType] =
        (eventTypeCounts[event.eventType] || 0) + 1;
    }
    const uniqueTypes = Object.keys(eventTypeCounts).length;
    const diversityScore = (uniqueTypes / 4) * 20; // 4 is max event types

    const score = Math.round(
      activityScore + consistencyScore + sessionQualityScore + diversityScore
    );

    return {
      score: Math.min(100, score),
      totalEvents,
      focusedMinutes: Math.round(focusedMinutes),
      breakMinutes: Math.round(breakMinutes),
      sessionsCount,
      avgSessionLength: Math.round(avgSessionLength),
    };
  }

  /**
   * Calculate overall statistics for a user
   * Results are cached for CACHE_TTL.STATS seconds
   */
  async calculateOverallStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<OverallStats> {
    const cacheKey = userKeys.stats(
      userId,
      `${formatDateForKey(startDate)}_${formatDateForKey(endDate)}`
    );

    return cache.wrap(
      cacheKey,
      async () => {
        // Get all events in the date range
        const events = await prisma.event.findMany({
          where: {
            userId,
            localTimestamp: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            eventType: true,
            localTimestamp: true,
          },
          orderBy: {
            localTimestamp: 'asc',
          },
        });

        const totalEvents = events.length;

        if (totalEvents === 0) {
          return {
            totalEvents: 0,
            avgEventsPerDay: 0,
            peakHours: [],
            mostProductiveDay: null,
            streakDays: 0,
            currentStreak: 0,
          };
        }

        // Calculate days in range
        const daysInRange = Math.max(1, daysBetween(startDate, endDate) + 1);
        const avgEventsPerDay = totalEvents / daysInRange;

        // Get hourly activity for peak hours
        const hourlyData = await this.analyzeHourlyActivity(userId, startDate, endDate);
        const peakHours = hourlyData
          .filter((h) => h.eventCount > 0)
          .sort((a, b) => b.eventCount - a.eventCount)
          .slice(0, 3)
          .map((h) => ({ hour: h.hour, count: h.eventCount }));

        // Get daily activity for most productive day
        const dailyData = await this.analyzeDailyActivity(userId, startDate, endDate);
        const mostProductiveDay = dailyData.reduce(
          (max, day) => (day.eventCount > (max?.eventCount || 0) ? day : max),
          null as DailyActivity | null
        );

        // Calculate streaks
        const { streakDays, currentStreak } = await this.calculateStreaks(userId);

        return {
          totalEvents,
          avgEventsPerDay: Math.round(avgEventsPerDay * 10) / 10,
          peakHours,
          mostProductiveDay,
          streakDays,
          currentStreak,
        };
      },
      CACHE_TTL.STATS
    );
  }

  /**
   * Calculate activity streaks (consecutive days with activity)
   */
  async calculateStreaks(userId: string): Promise<{
    streakDays: number;
    currentStreak: number;
  }> {
    // Get unique dates with activity in the last 365 days
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const events = await prisma.event.findMany({
      where: {
        userId,
        localTimestamp: {
          gte: oneYearAgo,
        },
      },
      select: {
        localTimestamp: true,
      },
      orderBy: {
        localTimestamp: 'desc',
      },
    });

    if (events.length === 0) {
      return { streakDays: 0, currentStreak: 0 };
    }

    // Get unique dates
    const uniqueDates = new Set<string>();
    for (const event of events) {
      uniqueDates.add(getDateString(event.localTimestamp));
    }

    const sortedDates = Array.from(uniqueDates).sort().reverse();
    const totalStreakDays = sortedDates.length;

    // Calculate current streak (from today/yesterday)
    const today = getDateString(new Date());
    const yesterday = getDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));

    let currentStreak = 0;

    // Check if streak starts from today or yesterday
    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      currentStreak = 1;
      let lastDate = new Date(sortedDates[0]);

      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        const daysDiff = daysBetween(lastDate, currentDate);

        if (daysDiff === 1) {
          currentStreak++;
          lastDate = currentDate;
        } else {
          break;
        }
      }
    }

    return {
      streakDays: totalStreakDays,
      currentStreak,
    };
  }

  /**
   * Get comprehensive analysis for a user
   * Results are cached for CACHE_TTL.STATS seconds
   */
  async getComprehensiveAnalysis(
    userId: string,
    dateRange: DateRange
  ): Promise<{
    hourlyActivity: HourlyActivity[];
    dailyActivity: DailyActivity[];
    fileTypeActivity: FileTypeActivity[];
    projectActivity: ProjectActivity[];
    overallStats: OverallStats;
  }> {
    const cacheKey = userKeys.analysis(
      userId,
      formatDateForKey(dateRange.startDate),
      formatDateForKey(dateRange.endDate)
    );

    return cache.wrap(
      cacheKey,
      async () => {
        const [hourlyActivity, dailyActivity, fileTypeActivity, projectActivity, overallStats] =
          await Promise.all([
            this.analyzeHourlyActivity(userId, dateRange.startDate, dateRange.endDate),
            this.analyzeDailyActivity(userId, dateRange.startDate, dateRange.endDate),
            this.analyzeFileTypeActivity(userId, dateRange.startDate, dateRange.endDate),
            this.analyzeProjectActivity(userId, dateRange.startDate, dateRange.endDate),
            this.calculateOverallStats(userId, dateRange.startDate, dateRange.endDate),
          ]);

        return {
          hourlyActivity,
          dailyActivity,
          fileTypeActivity,
          projectActivity,
          overallStats,
        };
      },
      CACHE_TTL.STATS
    );
  }

  /**
   * Invalidate all cached analysis data for a user
   * Call this when new events are added
   */
  invalidateUserCache(userId: string): void {
    cache.clear(userKeys.pattern(userId));
  }
}

/**
 * Invalidate analysis cache for a user
 * Should be called when new events are recorded
 */
export function invalidateAnalysisCache(userId: string): void {
  cache.clear(userKeys.pattern(userId));
}

// Export singleton instance
export const codingPatternAnalyzer = new CodingPatternAnalyzer();

// Export convenience functions
export async function analyzeHourlyActivity(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<HourlyActivity[]> {
  return codingPatternAnalyzer.analyzeHourlyActivity(userId, startDate, endDate);
}

export async function analyzeDailyActivity(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<DailyActivity[]> {
  return codingPatternAnalyzer.analyzeDailyActivity(userId, startDate, endDate);
}

export async function analyzeFileTypeActivity(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<FileTypeActivity[]> {
  return codingPatternAnalyzer.analyzeFileTypeActivity(userId, startDate, endDate);
}

export async function analyzeProjectActivity(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<ProjectActivity[]> {
  return codingPatternAnalyzer.analyzeProjectActivity(userId, startDate, endDate);
}

export async function calculateProductivityScore(
  userId: string,
  date: Date
): Promise<ProductivityStats> {
  return codingPatternAnalyzer.calculateProductivityScore(userId, date);
}

export async function calculateOverallStats(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<OverallStats> {
  return codingPatternAnalyzer.calculateOverallStats(userId, startDate, endDate);
}

export async function getComprehensiveAnalysis(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  hourlyActivity: HourlyActivity[];
  dailyActivity: DailyActivity[];
  fileTypeActivity: FileTypeActivity[];
  projectActivity: ProjectActivity[];
  overallStats: OverallStats;
}> {
  return codingPatternAnalyzer.getComprehensiveAnalysis(userId, {
    startDate,
    endDate,
  });
}
