/**
 * Recommendation Service - DevLog Hub
 * M9-T2: Anomaly Detection and Recommendations API
 *
 * Provides personalized recommendations based on user work patterns:
 * - Optimal work hours suggestions
 * - Break suggestions based on continuous work
 * - Productivity tips based on patterns
 */

import { prisma } from '../lib/prisma.js';

// Types
export type RecommendationType = 'optimal_hours' | 'break_suggestion' | 'productivity_tip';

export interface Recommendation {
  id: string;
  userId: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: number; // 1-5, 5 being highest priority
  actionItems: string[];
  generatedAt: Date;
  validUntil: Date;
  data: Record<string, unknown>;
}

export interface OptimalHours {
  mostProductiveHours: number[]; // Hours of day (0-23)
  suggestedStartTime: string;
  suggestedEndTime: string;
  peakFocusWindow: { start: number; end: number };
  reason: string;
}

export interface BreakSuggestion {
  shouldTakeBreak: boolean;
  reason: string;
  suggestedDuration: number; // minutes
  suggestedActivity: string;
  lastBreakTime?: Date;
  continuousWorkMinutes?: number;
}

export interface ProductivityTip {
  category: string;
  tip: string;
  impact: 'high' | 'medium' | 'low';
  basedOn: string;
}

// Cache for recommendations (recalculate weekly)
const recommendationCache = new Map<string, Recommendation[]>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week
const cacheTimestamps = new Map<string, number>();

/**
 * Generate a unique recommendation ID
 */
function generateRecommendationId(userId: string, type: RecommendationType): string {
  return `${userId}-${type}-${Date.now()}`;
}

/**
 * Calculate one week from now
 */
function getOneWeekFromNow(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}

/**
 * Get user's hourly productivity distribution
 */
async function getHourlyProductivity(userId: string, days: number = 30): Promise<{
  hourlyEventCount: number[];
  hourlyAvgIntervals: number[]; // Average time between events per hour
  totalEvents: number;
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

  const hourlyEventCount = new Array(24).fill(0);
  const hourlyIntervals = new Array(24).fill(null).map(() => [] as number[]);

  // Group events by hour and calculate intervals
  let prevEvent: Date | null = null;
  events.forEach(event => {
    const hour = event.localTimestamp.getHours();
    hourlyEventCount[hour]++;

    if (prevEvent) {
      const interval = (event.localTimestamp.getTime() - prevEvent.getTime()) / (1000 * 60); // minutes
      if (interval < 60 && interval > 0) { // Only count reasonable intervals
        const prevHour = prevEvent.getHours();
        hourlyIntervals[prevHour].push(interval);
      }
    }
    prevEvent = event.localTimestamp;
  });

  // Calculate average intervals per hour
  const hourlyAvgIntervals = hourlyIntervals.map(intervals => {
    if (intervals.length === 0) return 60; // Default to 60 if no data
    return intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
  });

  return {
    hourlyEventCount,
    hourlyAvgIntervals,
    totalEvents: events.length,
  };
}

/**
 * Get optimal work hours based on user's productivity patterns
 */
export async function getOptimalWorkHours(userId: string): Promise<OptimalHours> {
  const { hourlyEventCount, hourlyAvgIntervals, totalEvents } = await getHourlyProductivity(userId);

  if (totalEvents < 50) {
    // Not enough data for personalized recommendations
    return {
      mostProductiveHours: [9, 10, 11, 14, 15, 16],
      suggestedStartTime: '09:00',
      suggestedEndTime: '18:00',
      peakFocusWindow: { start: 9, end: 12 },
      reason: 'Based on general productivity research. More personalized recommendations will be available after tracking more activity.',
    };
  }

  // Find hours with most activity (indicates user is active)
  const hourlyScores = hourlyEventCount.map((count, hour) => {
    // Score = event count * (1 / average interval) - shorter intervals mean more intense work
    const intensityScore = hourlyAvgIntervals[hour] > 0 ? 1 / hourlyAvgIntervals[hour] : 0;
    return {
      hour,
      score: count * intensityScore,
      eventCount: count,
      avgInterval: hourlyAvgIntervals[hour],
    };
  });

  // Sort by score to find most productive hours
  const sortedHours = [...hourlyScores]
    .filter(h => h.eventCount > 0)
    .sort((a, b) => b.score - a.score);

  const mostProductiveHours = sortedHours.slice(0, 6).map(h => h.hour).sort((a, b) => a - b);

  // Find peak focus window (3 consecutive hours with highest combined score)
  let maxWindowScore = 0;
  let peakStart = 9;

  for (let start = 6; start <= 20; start++) {
    const windowScore = hourlyScores[start].score +
                        hourlyScores[start + 1].score +
                        hourlyScores[start + 2].score;
    if (windowScore > maxWindowScore) {
      maxWindowScore = windowScore;
      peakStart = start;
    }
  }

  // Determine suggested start/end times
  const activeHours = hourlyScores.filter(h => h.eventCount > totalEvents / 30);
  const suggestedStart = activeHours.length > 0 ? Math.min(...activeHours.map(h => h.hour)) : 9;
  const suggestedEnd = activeHours.length > 0 ? Math.max(...activeHours.map(h => h.hour)) + 1 : 18;

  return {
    mostProductiveHours,
    suggestedStartTime: `${suggestedStart.toString().padStart(2, '0')}:00`,
    suggestedEndTime: `${suggestedEnd.toString().padStart(2, '0')}:00`,
    peakFocusWindow: { start: peakStart, end: peakStart + 3 },
    reason: `Based on your ${totalEvents} tracked activities over the past 30 days. Your highest productivity correlates with ${mostProductiveHours.map(h => `${h}:00`).join(', ')}.`,
  };
}

/**
 * Get break suggestions based on continuous work detection
 */
export async function getBreakSuggestions(userId: string): Promise<BreakSuggestion> {
  // Get recent events (last 3 hours)
  const threeHoursAgo = new Date();
  threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

  const recentEvents = await prisma.event.findMany({
    where: {
      userId,
      localTimestamp: { gte: threeHoursAgo },
    },
    select: {
      localTimestamp: true,
    },
    orderBy: { localTimestamp: 'desc' },
  });

  if (recentEvents.length === 0) {
    return {
      shouldTakeBreak: false,
      reason: 'No recent activity detected.',
      suggestedDuration: 0,
      suggestedActivity: 'N/A',
    };
  }

  // Calculate continuous work time
  const sortedEvents = recentEvents.sort((a, b) => a.localTimestamp.getTime() - b.localTimestamp.getTime());
  const firstEvent = sortedEvents[0];
  const lastEvent = sortedEvents[sortedEvents.length - 1];
  const continuousWorkMinutes = (lastEvent.localTimestamp.getTime() - firstEvent.localTimestamp.getTime()) / (1000 * 60);

  // Check for gaps > 15 minutes (indicates breaks)
  let lastBreakTime: Date | undefined;
  for (let i = 1; i < sortedEvents.length; i++) {
    const gap = (sortedEvents[i].localTimestamp.getTime() - sortedEvents[i - 1].localTimestamp.getTime()) / (1000 * 60);
    if (gap > 15) {
      lastBreakTime = sortedEvents[i].localTimestamp;
    }
  }

  // Determine if break is needed
  const minutesSinceBreak = lastBreakTime
    ? (Date.now() - lastBreakTime.getTime()) / (1000 * 60)
    : continuousWorkMinutes;

  const activities = [
    'Take a short walk outside',
    'Do some stretching exercises',
    'Get a healthy snack',
    'Practice deep breathing for 5 minutes',
    'Have a coffee or tea break',
    'Look away from the screen and rest your eyes',
    'Chat with a colleague',
    'Do a quick meditation',
  ];

  if (minutesSinceBreak > 90) {
    return {
      shouldTakeBreak: true,
      reason: `You've been working continuously for ${Math.round(minutesSinceBreak)} minutes. Research shows taking regular breaks improves focus and productivity.`,
      suggestedDuration: minutesSinceBreak > 120 ? 15 : 10,
      suggestedActivity: activities[Math.floor(Math.random() * activities.length)],
      lastBreakTime,
      continuousWorkMinutes: Math.round(minutesSinceBreak),
    };
  } else if (minutesSinceBreak > 60) {
    return {
      shouldTakeBreak: true,
      reason: `You've been working for over an hour. A short break would help maintain your productivity.`,
      suggestedDuration: 5,
      suggestedActivity: activities[Math.floor(Math.random() * activities.length)],
      lastBreakTime,
      continuousWorkMinutes: Math.round(minutesSinceBreak),
    };
  }

  return {
    shouldTakeBreak: false,
    reason: `You're on track! Last break was ${lastBreakTime ? Math.round(minutesSinceBreak) + ' minutes ago' : 'recently'}.`,
    suggestedDuration: 0,
    suggestedActivity: 'Keep up the good work!',
    lastBreakTime,
    continuousWorkMinutes: Math.round(minutesSinceBreak),
  };
}

/**
 * Get personalized productivity tips based on patterns
 */
export async function getProductivityTips(userId: string): Promise<ProductivityTip[]> {
  const tips: ProductivityTip[] = [];

  // Get user's event statistics
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const events = await prisma.event.findMany({
    where: {
      userId,
      localTimestamp: { gte: twoWeeksAgo },
    },
    select: {
      localTimestamp: true,
      eventType: true,
    },
  });

  if (events.length < 20) {
    return [{
      category: 'Getting Started',
      tip: 'Keep using DevLog to track your activities. Personalized tips will appear after more data is collected.',
      impact: 'medium',
      basedOn: 'Limited activity data',
    }];
  }

  // Analyze patterns
  const hourlyDistribution = new Array(24).fill(0);
  const dayDistribution = new Array(7).fill(0);
  const eventTypes = new Map<string, number>();

  events.forEach(event => {
    hourlyDistribution[event.localTimestamp.getHours()]++;
    dayDistribution[event.localTimestamp.getDay()]++;
    const type = event.eventType;
    eventTypes.set(type, (eventTypes.get(type) || 0) + 1);
  });

  // Check for late night work
  const lateNightActivity = hourlyDistribution[22] + hourlyDistribution[23] +
                           hourlyDistribution[0] + hourlyDistribution[1];
  const totalActivity = hourlyDistribution.reduce((sum, count) => sum + count, 0);

  if (lateNightActivity > totalActivity * 0.15) {
    tips.push({
      category: 'Work-Life Balance',
      tip: 'Consider shifting some late-night work to daytime hours. Evening screen time can affect sleep quality and next-day productivity.',
      impact: 'high',
      basedOn: `${Math.round(lateNightActivity / totalActivity * 100)}% of your activity occurs between 10 PM and 2 AM`,
    });
  }

  // Check for weekend work
  const weekendActivity = dayDistribution[0] + dayDistribution[6];
  const weekdayActivity = dayDistribution.slice(1, 6).reduce((sum, count) => sum + count, 0);

  if (weekendActivity > weekdayActivity * 0.3) {
    tips.push({
      category: 'Work-Life Balance',
      tip: 'Your weekend activity is relatively high. Consider planning dedicated rest days to prevent burnout.',
      impact: 'medium',
      basedOn: `Weekend activity is ${Math.round(weekendActivity / weekdayActivity * 100)}% of weekday activity`,
    });
  }

  // Check for concentration gaps
  const morningActivity = hourlyDistribution.slice(9, 12).reduce((sum, c) => sum + c, 0);
  const afternoonActivity = hourlyDistribution.slice(14, 17).reduce((sum, c) => sum + c, 0);

  if (morningActivity > afternoonActivity * 2) {
    tips.push({
      category: 'Productivity',
      tip: 'Your morning productivity is significantly higher than afternoon. Schedule complex tasks for the morning and routine tasks for the afternoon.',
      impact: 'high',
      basedOn: 'Morning activity is 2x higher than afternoon activity',
    });
  } else if (afternoonActivity > morningActivity * 2) {
    tips.push({
      category: 'Productivity',
      tip: 'You seem to be more productive in the afternoon. Consider using mornings for meetings and planning, saving deep work for later.',
      impact: 'high',
      basedOn: 'Afternoon activity is 2x higher than morning activity',
    });
  }

  // Check event type distribution
  const gitEvents = eventTypes.get('git') || 0;
  const fileEvents = eventTypes.get('file') || 0;
  const terminalEvents = eventTypes.get('terminal') || 0;

  if (gitEvents / totalActivity < 0.1 && fileEvents > 20) {
    tips.push({
      category: 'Version Control',
      tip: 'Consider committing more frequently. Smaller, atomic commits make it easier to track changes and roll back if needed.',
      impact: 'medium',
      basedOn: `Only ${Math.round(gitEvents / totalActivity * 100)}% of activities are git operations`,
    });
  }

  // Check for consistent schedule
  const activeHours = hourlyDistribution.map((count, hour) => ({ hour, count }))
    .filter(h => h.count > totalActivity / 30)
    .map(h => h.hour);

  if (activeHours.length > 12) {
    tips.push({
      category: 'Focus',
      tip: 'Your work is spread across many hours. Try establishing a more consistent schedule with defined start and end times for better focus.',
      impact: 'medium',
      basedOn: `Activity detected across ${activeHours.length} different hours`,
    });
  }

  // Add general productivity tips if list is short
  if (tips.length < 3) {
    const generalTips: ProductivityTip[] = [
      {
        category: 'Focus',
        tip: 'Try the Pomodoro Technique: 25 minutes of focused work followed by a 5-minute break.',
        impact: 'medium',
        basedOn: 'General productivity research',
      },
      {
        category: 'Health',
        tip: 'Remember to stay hydrated. Keeping water nearby can help maintain focus throughout the day.',
        impact: 'low',
        basedOn: 'General wellness recommendation',
      },
      {
        category: 'Environment',
        tip: 'Consider optimizing your workspace lighting. Natural light or proper task lighting can reduce eye strain.',
        impact: 'low',
        basedOn: 'Ergonomics research',
      },
    ];

    for (const tip of generalTips) {
      if (tips.length < 5) {
        tips.push(tip);
      }
    }
  }

  return tips;
}

/**
 * RecommendationEngine class for comprehensive recommendations
 */
export class RecommendationEngine {
  /**
   * Get all recommendations for a user
   */
  async getAllRecommendations(userId: string): Promise<Recommendation[]> {
    const cacheKey = `recommendations-${userId}`;
    const now = Date.now();

    // Check cache
    if (recommendationCache.has(cacheKey)) {
      const timestamp = cacheTimestamps.get(cacheKey) || 0;
      if (now - timestamp < CACHE_TTL_MS) {
        return recommendationCache.get(cacheKey)!;
      }
    }

    const recommendations: Recommendation[] = [];

    // Get optimal hours recommendation
    const optimalHours = await getOptimalWorkHours(userId);
    recommendations.push({
      id: generateRecommendationId(userId, 'optimal_hours'),
      userId,
      type: 'optimal_hours',
      title: 'Optimal Work Hours',
      description: optimalHours.reason,
      priority: 4,
      actionItems: [
        `Consider starting work around ${optimalHours.suggestedStartTime}`,
        `Schedule your most important tasks between ${optimalHours.peakFocusWindow.start}:00 and ${optimalHours.peakFocusWindow.end}:00`,
        'Use your peak hours for deep work requiring focus',
      ],
      generatedAt: new Date(),
      validUntil: getOneWeekFromNow(),
      data: optimalHours as unknown as Record<string, unknown>,
    });

    // Get break suggestion
    const breakSuggestion = await getBreakSuggestions(userId);
    if (breakSuggestion.shouldTakeBreak) {
      recommendations.push({
        id: generateRecommendationId(userId, 'break_suggestion'),
        userId,
        type: 'break_suggestion',
        title: 'Take a Break',
        description: breakSuggestion.reason,
        priority: 5, // High priority for active break suggestions
        actionItems: [
          `Take a ${breakSuggestion.suggestedDuration}-minute break`,
          breakSuggestion.suggestedActivity,
          'Set a timer to return to work',
        ],
        generatedAt: new Date(),
        validUntil: new Date(Date.now() + 30 * 60 * 1000), // Valid for 30 minutes
        data: breakSuggestion as unknown as Record<string, unknown>,
      });
    }

    // Get productivity tips
    const tips = await getProductivityTips(userId);
    tips.forEach((tip, index) => {
      recommendations.push({
        id: generateRecommendationId(userId, 'productivity_tip') + `-${index}`,
        userId,
        type: 'productivity_tip',
        title: `${tip.category}: ${tip.tip.substring(0, 50)}...`,
        description: tip.tip,
        priority: tip.impact === 'high' ? 4 : tip.impact === 'medium' ? 3 : 2,
        actionItems: [tip.tip],
        generatedAt: new Date(),
        validUntil: getOneWeekFromNow(),
        data: tip as unknown as Record<string, unknown>,
      });
    });

    // Sort by priority (highest first)
    recommendations.sort((a, b) => b.priority - a.priority);

    // Cache results
    recommendationCache.set(cacheKey, recommendations);
    cacheTimestamps.set(cacheKey, now);

    return recommendations;
  }

  /**
   * Get optimal work hours
   */
  async getOptimalWorkHours(userId: string): Promise<OptimalHours> {
    return getOptimalWorkHours(userId);
  }

  /**
   * Get break suggestions
   */
  async getBreakSuggestions(userId: string): Promise<BreakSuggestion> {
    return getBreakSuggestions(userId);
  }

  /**
   * Get productivity tips
   */
  async getProductivityTips(userId: string): Promise<ProductivityTip[]> {
    return getProductivityTips(userId);
  }

  /**
   * Clear cache for a user (useful when preferences change)
   */
  clearCache(userId: string): void {
    const cacheKey = `recommendations-${userId}`;
    recommendationCache.delete(cacheKey);
    cacheTimestamps.delete(cacheKey);
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();
