import { prisma } from '../lib/prisma.js';
import type { NotificationType } from './notification.service.js';

// Channel types for notifications
export type NotificationChannel = 'email' | 'push' | 'in_app';

// Preference update data
export interface UpdatePreferencesInput {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
  reportReady?: boolean;
  teamInvite?: boolean;
  mentions?: boolean;
  anomalies?: boolean;
  weeklyDigest?: boolean;
}

// Default preferences
const DEFAULT_PREFERENCES: UpdatePreferencesInput = {
  emailEnabled: true,
  pushEnabled: true,
  inAppEnabled: true,
  reportReady: true,
  teamInvite: true,
  mentions: true,
  anomalies: true,
  weeklyDigest: true,
};

/**
 * Get notification preferences for a user
 * Creates default preferences if they don't exist
 */
export async function getPreferences(userId: string) {
  let preferences = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  // Create default preferences if not exists
  if (!preferences) {
    preferences = await prisma.notificationPreference.create({
      data: {
        userId,
        ...DEFAULT_PREFERENCES,
      },
    });
  }

  return {
    id: preferences.id,
    userId: preferences.userId,
    channels: {
      email: preferences.emailEnabled,
      push: preferences.pushEnabled,
      inApp: preferences.inAppEnabled,
    },
    types: {
      reportReady: preferences.reportReady,
      teamInvite: preferences.teamInvite,
      mentions: preferences.mentions,
      anomalies: preferences.anomalies,
      weeklyDigest: preferences.weeklyDigest,
    },
  };
}

/**
 * Update notification preferences for a user
 */
export async function updatePreferences(userId: string, data: UpdatePreferencesInput) {
  // Ensure preferences exist first
  await getPreferences(userId);

  const preferences = await prisma.notificationPreference.update({
    where: { userId },
    data: {
      ...(data.emailEnabled !== undefined && { emailEnabled: data.emailEnabled }),
      ...(data.pushEnabled !== undefined && { pushEnabled: data.pushEnabled }),
      ...(data.inAppEnabled !== undefined && { inAppEnabled: data.inAppEnabled }),
      ...(data.reportReady !== undefined && { reportReady: data.reportReady }),
      ...(data.teamInvite !== undefined && { teamInvite: data.teamInvite }),
      ...(data.mentions !== undefined && { mentions: data.mentions }),
      ...(data.anomalies !== undefined && { anomalies: data.anomalies }),
      ...(data.weeklyDigest !== undefined && { weeklyDigest: data.weeklyDigest }),
    },
  });

  return {
    id: preferences.id,
    userId: preferences.userId,
    channels: {
      email: preferences.emailEnabled,
      push: preferences.pushEnabled,
      inApp: preferences.inAppEnabled,
    },
    types: {
      reportReady: preferences.reportReady,
      teamInvite: preferences.teamInvite,
      mentions: preferences.mentions,
      anomalies: preferences.anomalies,
      weeklyDigest: preferences.weeklyDigest,
    },
  };
}

/**
 * Check if a notification should be sent to a user via a specific channel
 */
export async function shouldNotify(
  userId: string,
  type: NotificationType,
  channel: NotificationChannel
): Promise<boolean> {
  const preferences = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  // If no preferences, use defaults (all enabled)
  if (!preferences) {
    return true;
  }

  // Check channel preference
  let channelEnabled = false;
  switch (channel) {
    case 'email':
      channelEnabled = preferences.emailEnabled;
      break;
    case 'push':
      channelEnabled = preferences.pushEnabled;
      break;
    case 'in_app':
      channelEnabled = preferences.inAppEnabled;
      break;
  }

  if (!channelEnabled) {
    return false;
  }

  // Check type preference
  switch (type) {
    case 'report_ready':
      return preferences.reportReady;
    case 'team_invite':
      return preferences.teamInvite;
    case 'mention':
      return preferences.mentions;
    case 'anomaly_detected':
      return preferences.anomalies;
    case 'milestone_reached':
      // Milestone notifications follow anomalies setting (achievement category)
      return preferences.anomalies;
    default:
      return true;
  }
}

/**
 * Check if user has email notifications enabled for a type
 */
export async function shouldSendEmail(
  userId: string,
  type: NotificationType
): Promise<boolean> {
  return shouldNotify(userId, type, 'email');
}

/**
 * Check if user has push notifications enabled for a type
 */
export async function shouldSendPush(
  userId: string,
  type: NotificationType
): Promise<boolean> {
  return shouldNotify(userId, type, 'push');
}

/**
 * Check if user has in-app notifications enabled for a type
 */
export async function shouldSendInApp(
  userId: string,
  type: NotificationType
): Promise<boolean> {
  return shouldNotify(userId, type, 'in_app');
}

/**
 * Get all users who have email enabled for weekly digest
 */
export async function getUsersForWeeklyDigest() {
  const preferences = await prisma.notificationPreference.findMany({
    where: {
      emailEnabled: true,
      weeklyDigest: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return preferences.map((p) => p.user);
}

/**
 * Reset preferences to defaults
 */
export async function resetPreferences(userId: string) {
  // Ensure preferences exist
  await getPreferences(userId);

  return updatePreferences(userId, DEFAULT_PREFERENCES);
}
