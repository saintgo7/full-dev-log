/**
 * Anomaly Detection Service - DevLog Hub
 * M9-T2: Anomaly Detection and Recommendations API
 *
 * Detects unusual patterns in user work behavior:
 * - Unusual work hours (late night, weekends)
 * - Overwork detection (consecutive long work days)
 * - Inactivity detection (unusual gaps)
 */

import { prisma } from '../lib/prisma.js';

// Types
export type AnomalySeverity = 'low' | 'medium' | 'high';
export type AnomalyType = 'work_pattern' | 'overwork' | 'inactivity';

export interface Anomaly {
  id: string;
  userId: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description: string;
  detectedAt: Date;
  data: Record<string, unknown>;
  dismissed: boolean;
}

// In-memory cache for detected anomalies (in production, use Redis or database)
const anomalyCache = new Map<string, Anomaly[]>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const cacheTimestamps = new Map<string, number>();

/**
 * Calculate standard deviation for an array of numbers
 */
function calculateStdDev(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 };

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  return { mean, stdDev };
}

/**
 * Generate a unique anomaly ID
 */
function generateAnomalyId(userId: string, type: AnomalyType, timestamp: Date): string {
  return `${userId}-${type}-${timestamp.toISOString().split('T')[0]}`;
}

/**
 * Get user's baseline work patterns from historical data
 */
async function getUserWorkBaseline(userId: string, days: number = 30): Promise<{
  avgDailyHours: number;
  stdDevDailyHours: number;
  typicalStartHour: number;
  typicalEndHour: number;
  workDays: number[]; // 0-6 for days user typically works
  hourlyDistribution: number[];
}> {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const events = await prisma.event.findMany({
    where: {
      userId,
      localTimestamp: { gte: dateFrom },
    },
    select: {
      localTimestamp: true,
    },
    orderBy: { localTimestamp: 'asc' },
  });

  if (events.length === 0) {
    // Return defaults for new users
    return {
      avgDailyHours: 8,
      stdDevDailyHours: 2,
      typicalStartHour: 9,
      typicalEndHour: 18,
      workDays: [1, 2, 3, 4, 5], // Mon-Fri
      hourlyDistribution: new Array(24).fill(0),
    };
  }

  // Group events by day
  const eventsByDay = new Map<string, Date[]>();
  const hourlyDistribution = new Array(24).fill(0);
  const dayOfWeekCounts = new Array(7).fill(0);

  events.forEach(event => {
    const date = event.localTimestamp.toISOString().split('T')[0];
    if (!eventsByDay.has(date)) {
      eventsByDay.set(date, []);
    }
    eventsByDay.get(date)!.push(event.localTimestamp);

    const hour = event.localTimestamp.getHours();
    hourlyDistribution[hour]++;

    const dayOfWeek = event.localTimestamp.getDay();
    dayOfWeekCounts[dayOfWeek]++;
  });

  // Calculate daily work hours
  const dailyHours: number[] = [];
  const startHours: number[] = [];
  const endHours: number[] = [];

  eventsByDay.forEach(timestamps => {
    if (timestamps.length === 0) return;

    const sorted = timestamps.sort((a, b) => a.getTime() - b.getTime());
    const firstEvent = sorted[0];
    const lastEvent = sorted[sorted.length - 1];

    const hoursWorked = (lastEvent.getTime() - firstEvent.getTime()) / (1000 * 60 * 60);
    if (hoursWorked > 0 && hoursWorked < 24) {
      dailyHours.push(hoursWorked);
      startHours.push(firstEvent.getHours());
      endHours.push(lastEvent.getHours());
    }
  });

  const { mean: avgDailyHours, stdDev: stdDevDailyHours } = calculateStdDev(dailyHours);
  const { mean: typicalStartHour } = calculateStdDev(startHours);
  const { mean: typicalEndHour } = calculateStdDev(endHours);

  // Determine typical work days (days with > 10% of total events)
  const totalEvents = dayOfWeekCounts.reduce((sum, count) => sum + count, 0);
  const threshold = totalEvents * 0.1;
  const workDays = dayOfWeekCounts
    .map((count, day) => ({ day, count }))
    .filter(({ count }) => count > threshold)
    .map(({ day }) => day);

  return {
    avgDailyHours: avgDailyHours || 8,
    stdDevDailyHours: stdDevDailyHours || 2,
    typicalStartHour: Math.round(typicalStartHour) || 9,
    typicalEndHour: Math.round(typicalEndHour) || 18,
    workDays: workDays.length > 0 ? workDays : [1, 2, 3, 4, 5],
    hourlyDistribution,
  };
}

/**
 * Detect unusual work hours (late night, weekends when user doesn't usually work)
 */
export async function detectWorkPatternAnomalies(userId: string): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  const baseline = await getUserWorkBaseline(userId);

  // Check recent events (last 24 hours)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const recentEvents = await prisma.event.findMany({
    where: {
      userId,
      localTimestamp: { gte: yesterday },
    },
    select: {
      localTimestamp: true,
    },
  });

  if (recentEvents.length === 0) return anomalies;

  // Check for late night work (11 PM - 5 AM)
  const lateNightEvents = recentEvents.filter(event => {
    const hour = event.localTimestamp.getHours();
    return hour >= 23 || hour < 5;
  });

  if (lateNightEvents.length > 3) {
    anomalies.push({
      id: generateAnomalyId(userId, 'work_pattern', new Date()),
      userId,
      type: 'work_pattern',
      severity: 'medium',
      title: 'Late Night Work Detected',
      description: `You had ${lateNightEvents.length} activities between 11 PM and 5 AM. This unusual work pattern may affect your sleep quality and productivity.`,
      detectedAt: new Date(),
      data: {
        eventCount: lateNightEvents.length,
        timeRange: '23:00 - 05:00',
        typicalEndHour: baseline.typicalEndHour,
      },
      dismissed: false,
    });
  }

  // Check for weekend work when user typically doesn't work weekends
  const isWeekendWorker = baseline.workDays.includes(0) || baseline.workDays.includes(6);
  if (!isWeekendWorker) {
    const weekendEvents = recentEvents.filter(event => {
      const day = event.localTimestamp.getDay();
      return day === 0 || day === 6;
    });

    if (weekendEvents.length > 5) {
      anomalies.push({
        id: generateAnomalyId(userId, 'work_pattern', new Date()) + '-weekend',
        userId,
        type: 'work_pattern',
        severity: 'low',
        title: 'Weekend Work Detected',
        description: `You had ${weekendEvents.length} activities during the weekend. Consider taking time off to maintain work-life balance.`,
        detectedAt: new Date(),
        data: {
          eventCount: weekendEvents.length,
          typicalWorkDays: baseline.workDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]),
        },
        dismissed: false,
      });
    }
  }

  // Check for very early starts (before typical start time by 3+ hours)
  const earlyStartEvents = recentEvents.filter(event => {
    const hour = event.localTimestamp.getHours();
    return hour < baseline.typicalStartHour - 3 && hour >= 5;
  });

  if (earlyStartEvents.length > 2) {
    anomalies.push({
      id: generateAnomalyId(userId, 'work_pattern', new Date()) + '-early',
      userId,
      type: 'work_pattern',
      severity: 'low',
      title: 'Unusually Early Work Start',
      description: `You started work before ${baseline.typicalStartHour - 3}:00 AM, which is earlier than your typical ${baseline.typicalStartHour}:00 AM start. Early starts can disrupt your routine.`,
      detectedAt: new Date(),
      data: {
        eventCount: earlyStartEvents.length,
        typicalStartHour: baseline.typicalStartHour,
      },
      dismissed: false,
    });
  }

  return anomalies;
}

/**
 * Detect consecutive long work days (overwork pattern)
 */
export async function detectOverwork(userId: string): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  const baseline = await getUserWorkBaseline(userId);

  // Check last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const events = await prisma.event.findMany({
    where: {
      userId,
      localTimestamp: { gte: weekAgo },
    },
    select: {
      localTimestamp: true,
    },
    orderBy: { localTimestamp: 'asc' },
  });

  if (events.length === 0) return anomalies;

  // Group by day and calculate work hours
  const eventsByDay = new Map<string, Date[]>();
  events.forEach(event => {
    const date = event.localTimestamp.toISOString().split('T')[0];
    if (!eventsByDay.has(date)) {
      eventsByDay.set(date, []);
    }
    eventsByDay.get(date)!.push(event.localTimestamp);
  });

  // Calculate daily hours
  const dailyHours: { date: string; hours: number }[] = [];
  eventsByDay.forEach((timestamps, date) => {
    const sorted = timestamps.sort((a, b) => a.getTime() - b.getTime());
    const firstEvent = sorted[0];
    const lastEvent = sorted[sorted.length - 1];
    const hours = (lastEvent.getTime() - firstEvent.getTime()) / (1000 * 60 * 60);
    if (hours > 0 && hours < 24) {
      dailyHours.push({ date, hours });
    }
  });

  // Check for consecutive long days (>10 hours)
  const longDays = dailyHours.filter(d => d.hours > 10);

  if (longDays.length >= 3) {
    // Check if they are consecutive
    const sortedLongDays = longDays.sort((a, b) => a.date.localeCompare(b.date));
    let consecutiveCount = 1;
    let maxConsecutive = 1;

    for (let i = 1; i < sortedLongDays.length; i++) {
      const prevDate = new Date(sortedLongDays[i - 1].date);
      const currDate = new Date(sortedLongDays[i].date);
      const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (dayDiff === 1) {
        consecutiveCount++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
      } else {
        consecutiveCount = 1;
      }
    }

    if (maxConsecutive >= 3) {
      anomalies.push({
        id: generateAnomalyId(userId, 'overwork', new Date()),
        userId,
        type: 'overwork',
        severity: 'high',
        title: 'Consecutive Overwork Detected',
        description: `You've worked more than 10 hours for ${maxConsecutive} consecutive days. This sustained overwork pattern can lead to burnout and decreased productivity.`,
        detectedAt: new Date(),
        data: {
          consecutiveDays: maxConsecutive,
          longDays: longDays.map(d => ({ date: d.date, hours: Math.round(d.hours * 10) / 10 })),
          avgDailyHours: baseline.avgDailyHours,
        },
        dismissed: false,
      });
    }
  }

  // Check if average exceeds baseline by more than 2 standard deviations
  const avgRecentHours = dailyHours.reduce((sum, d) => sum + d.hours, 0) / dailyHours.length;
  const threshold = baseline.avgDailyHours + (2 * baseline.stdDevDailyHours);

  if (avgRecentHours > threshold && dailyHours.length >= 3) {
    anomalies.push({
      id: generateAnomalyId(userId, 'overwork', new Date()) + '-avg',
      userId,
      type: 'overwork',
      severity: 'medium',
      title: 'Above Average Work Hours',
      description: `Your average daily work hours (${Math.round(avgRecentHours * 10) / 10}h) this week exceeds your typical ${Math.round(baseline.avgDailyHours * 10) / 10}h by more than 2 standard deviations.`,
      detectedAt: new Date(),
      data: {
        avgRecentHours: Math.round(avgRecentHours * 10) / 10,
        baselineAvgHours: Math.round(baseline.avgDailyHours * 10) / 10,
        threshold: Math.round(threshold * 10) / 10,
      },
      dismissed: false,
    });
  }

  return anomalies;
}

/**
 * Detect unusual gaps in activity (potential inactivity issues)
 */
export async function detectInactivity(userId: string): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  const baseline = await getUserWorkBaseline(userId);

  // Check last 14 days for gaps
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const events = await prisma.event.findMany({
    where: {
      userId,
      localTimestamp: { gte: twoWeeksAgo },
    },
    select: {
      localTimestamp: true,
    },
    orderBy: { localTimestamp: 'asc' },
  });

  if (events.length === 0) {
    // User has no activity in 14 days
    anomalies.push({
      id: generateAnomalyId(userId, 'inactivity', new Date()),
      userId,
      type: 'inactivity',
      severity: 'low',
      title: 'No Recent Activity',
      description: 'No development activity has been detected in the past 14 days. If you\'re taking a break, that\'s great! Otherwise, check if your agent is connected.',
      detectedAt: new Date(),
      data: {
        lastActivityDaysAgo: 14,
      },
      dismissed: false,
    });
    return anomalies;
  }

  // Find days with no activity
  const activeDays = new Set<string>();
  events.forEach(event => {
    activeDays.add(event.localTimestamp.toISOString().split('T')[0]);
  });

  // Check for consecutive inactive workdays
  const now = new Date();
  let consecutiveInactiveDays = 0;
  let maxInactiveDays = 0;

  for (let i = 0; i < 14; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayOfWeek = checkDate.getDay();

    // Only count if it's a typical work day
    if (baseline.workDays.includes(dayOfWeek)) {
      if (!activeDays.has(dateStr)) {
        consecutiveInactiveDays++;
        maxInactiveDays = Math.max(maxInactiveDays, consecutiveInactiveDays);
      } else {
        consecutiveInactiveDays = 0;
      }
    }
  }

  if (maxInactiveDays >= 3) {
    anomalies.push({
      id: generateAnomalyId(userId, 'inactivity', new Date()),
      userId,
      type: 'inactivity',
      severity: maxInactiveDays >= 5 ? 'high' : 'medium',
      title: 'Unusual Inactivity Detected',
      description: `No activity was detected for ${maxInactiveDays} consecutive work days. This is unusual based on your typical work pattern.`,
      detectedAt: new Date(),
      data: {
        inactiveDays: maxInactiveDays,
        typicalWorkDays: baseline.workDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]),
      },
      dismissed: false,
    });
  }

  // Check for large gaps within a day during typical work hours
  const yesterday = new Date();
  yesterday.setHours(0, 0, 0, 0);

  const todaysEvents = events.filter(e => e.localTimestamp >= yesterday);
  if (todaysEvents.length > 2) {
    const sorted = todaysEvents.sort((a, b) => a.localTimestamp.getTime() - b.localTimestamp.getTime());

    for (let i = 1; i < sorted.length; i++) {
      const gap = (sorted[i].localTimestamp.getTime() - sorted[i - 1].localTimestamp.getTime()) / (1000 * 60 * 60);
      const prevHour = sorted[i - 1].localTimestamp.getHours();

      // Only flag if gap is during typical work hours (not lunch)
      if (gap > 4 && prevHour >= baseline.typicalStartHour && prevHour < baseline.typicalEndHour - 1) {
        anomalies.push({
          id: generateAnomalyId(userId, 'inactivity', new Date()) + `-gap-${i}`,
          userId,
          type: 'inactivity',
          severity: 'low',
          title: 'Long Break Detected',
          description: `A ${Math.round(gap * 10) / 10} hour gap was detected during your typical work hours. Extended breaks might indicate distractions or blockers.`,
          detectedAt: new Date(),
          data: {
            gapHours: Math.round(gap * 10) / 10,
            startTime: sorted[i - 1].localTimestamp.toISOString(),
            endTime: sorted[i].localTimestamp.toISOString(),
          },
          dismissed: false,
        });
        break; // Only report one gap per day
      }
    }
  }

  return anomalies;
}

/**
 * AnomalyDetector class for comprehensive anomaly detection
 */
export class AnomalyDetector {
  /**
   * Detect all types of anomalies for a user
   */
  async detectAll(userId: string): Promise<Anomaly[]> {
    const cacheKey = `anomalies-${userId}`;
    const now = Date.now();

    // Check cache
    if (anomalyCache.has(cacheKey)) {
      const timestamp = cacheTimestamps.get(cacheKey) || 0;
      if (now - timestamp < CACHE_TTL_MS) {
        return anomalyCache.get(cacheKey)!;
      }
    }

    // Detect all anomaly types in parallel
    const [workPatternAnomalies, overworkAnomalies, inactivityAnomalies] = await Promise.all([
      detectWorkPatternAnomalies(userId),
      detectOverwork(userId),
      detectInactivity(userId),
    ]);

    const allAnomalies = [...workPatternAnomalies, ...overworkAnomalies, ...inactivityAnomalies];

    // Cache results
    anomalyCache.set(cacheKey, allAnomalies);
    cacheTimestamps.set(cacheKey, now);

    return allAnomalies;
  }

  /**
   * Detect work pattern anomalies
   */
  async detectWorkPatternAnomalies(userId: string): Promise<Anomaly[]> {
    return detectWorkPatternAnomalies(userId);
  }

  /**
   * Detect overwork patterns
   */
  async detectOverwork(userId: string): Promise<Anomaly[]> {
    return detectOverwork(userId);
  }

  /**
   * Detect inactivity patterns
   */
  async detectInactivity(userId: string): Promise<Anomaly[]> {
    return detectInactivity(userId);
  }

  /**
   * Clear cache for a user (useful when new events arrive)
   */
  clearCache(userId: string): void {
    const cacheKey = `anomalies-${userId}`;
    anomalyCache.delete(cacheKey);
    cacheTimestamps.delete(cacheKey);
  }
}

// Export singleton instance
export const anomalyDetector = new AnomalyDetector();
