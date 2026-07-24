import { prisma } from '../lib/prisma.js';
import { NotFoundError, AuthorizationError } from '../utils/errors.js';
import { socketManager } from '../websocket/socketManager.js';

// Notification types
export type NotificationType =
  | 'report_ready'
  | 'team_invite'
  | 'mention'
  | 'anomaly_detected'
  | 'milestone_reached';

// Options for getting notifications
export interface GetNotificationsOptions {
  cursor?: string;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}

/**
 * Create a new notification for a user
 */
export async function create(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : {},
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Send real-time notification via WebSocket
  socketManager.broadcastNotification(userId, {
    type: mapNotificationTypeToSocketType(type),
    title,
    message,
    timestamp: notification.createdAt,
  });

  // Also emit a dedicated notification event for the notification center
  const io = socketManager.getIO();
  if (io) {
    io.to(`user:${userId}`).emit('notification:created', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: notification.read,
      createdAt: notification.createdAt,
    });
  }

  return notification;
}

/**
 * Get paginated notifications for a user
 */
export async function getNotifications(
  userId: string,
  options: GetNotificationsOptions = {}
) {
  const { cursor, limit = 20, unreadOnly = false, type } = options;

  const where: Record<string, unknown> = { userId };

  if (unreadOnly) {
    where.read = false;
  }

  if (type) {
    where.type = type;
  }

  const notifications = await prisma.notification.findMany({
    where,
    take: limit + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      data: true,
      read: true,
      createdAt: true,
    },
  });

  const hasMore = notifications.length > limit;
  const items = hasMore ? notifications.slice(0, -1) : notifications;

  return {
    items,
    pagination: {
      cursor: items.length > 0 ? items[items.length - 1].id : null,
      hasMore,
    },
  };
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new NotFoundError('Notification');
  }

  if (notification.userId !== userId) {
    throw new AuthorizationError('You can only mark your own notifications as read');
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      data: true,
      read: true,
      createdAt: true,
    },
  });

  // Broadcast update via WebSocket
  const io = socketManager.getIO();
  if (io) {
    io.to(`user:${userId}`).emit('notification:read', {
      notificationId,
      read: true,
    });
  }

  return updated;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: { read: true },
  });

  // Broadcast update via WebSocket
  const io = socketManager.getIO();
  if (io) {
    io.to(`user:${userId}`).emit('notification:all-read', {
      timestamp: new Date(),
    });
  }

  return result.count;
}

/**
 * Delete a single notification
 */
export async function deleteNotification(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new NotFoundError('Notification');
  }

  if (notification.userId !== userId) {
    throw new AuthorizationError('You can only delete your own notifications');
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  // Broadcast deletion via WebSocket
  const io = socketManager.getIO();
  if (io) {
    io.to(`user:${userId}`).emit('notification:deleted', {
      notificationId,
    });
  }
}

/**
 * Clear all notifications for a user
 */
export async function clearAll(userId: string): Promise<number> {
  const result = await prisma.notification.deleteMany({
    where: { userId },
  });

  // Broadcast clear via WebSocket
  const io = socketManager.getIO();
  if (io) {
    io.to(`user:${userId}`).emit('notification:cleared', {
      timestamp: new Date(),
    });
  }

  return result.count;
}

/**
 * Create notification for report ready
 */
export async function notifyReportReady(
  userId: string,
  report: { id: string; title: string; reportType: string }
) {
  return create(
    userId,
    'report_ready',
    'Report Ready',
    `Your ${report.reportType} report "${report.title}" is ready to view.`,
    { reportId: report.id, reportType: report.reportType }
  );
}

/**
 * Create notification for team invite
 */
export async function notifyTeamInvite(
  userId: string,
  team: { id: string; name: string },
  inviter: { id: string; name: string }
) {
  return create(
    userId,
    'team_invite',
    'Team Invitation',
    `${inviter.name} invited you to join team "${team.name}".`,
    { teamId: team.id, teamName: team.name, inviterId: inviter.id }
  );
}

/**
 * Create notification for mention
 */
export async function notifyMention(
  userId: string,
  note: { id: string; title: string },
  mentioner: { id: string; name: string }
) {
  return create(
    userId,
    'mention',
    'You were mentioned',
    `${mentioner.name} mentioned you in "${note.title}".`,
    { noteId: note.id, noteTitle: note.title, mentionerId: mentioner.id }
  );
}

/**
 * Create notification for anomaly detection
 */
export async function notifyAnomalyDetected(
  userId: string,
  anomaly: { type: string; description: string; severity: string }
) {
  return create(
    userId,
    'anomaly_detected',
    'Anomaly Detected',
    anomaly.description,
    { anomalyType: anomaly.type, severity: anomaly.severity }
  );
}

/**
 * Create notification for milestone reached
 */
export async function notifyMilestoneReached(
  userId: string,
  milestone: { name: string; description: string }
) {
  return create(
    userId,
    'milestone_reached',
    'Milestone Reached',
    milestone.description,
    { milestoneName: milestone.name }
  );
}

/**
 * Map notification type to socket notification type
 */
function mapNotificationTypeToSocketType(
  type: NotificationType
): 'info' | 'success' | 'warning' | 'error' {
  switch (type) {
    case 'report_ready':
      return 'success';
    case 'team_invite':
      return 'info';
    case 'mention':
      return 'info';
    case 'anomaly_detected':
      return 'warning';
    case 'milestone_reached':
      return 'success';
    default:
      return 'info';
  }
}
