import { Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service.js';
import * as notificationPreferenceService from '../services/notificationPreference.service.js';
import type { AuthRequest } from '../types/index.js';
import type {
  GetNotificationsQuery,
  UpdatePreferencesBody,
} from '../schemas/notification.schema.js';

/**
 * Get paginated notifications for the authenticated user
 */
export async function getNotifications(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const query = req.query as unknown as GetNotificationsQuery;
    const result = await notificationService.getNotifications(
      req.user!.userId,
      {
        cursor: query.cursor,
        limit: query.limit,
        unreadOnly: query.unreadOnly,
        type: query.type,
      }
    );

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get unread notification count for the authenticated user
 */
export async function getUnreadCount(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const count = await notificationService.getUnreadCount(req.user!.userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user!.userId
    );

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark all notifications as read for the authenticated user
 */
export async function markAllAsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const count = await notificationService.markAllAsRead(req.user!.userId);

    res.json({
      success: true,
      data: {
        message: 'All notifications marked as read',
        count,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a single notification
 */
export async function deleteNotification(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await notificationService.deleteNotification(
      req.params.id,
      req.user!.userId
    );

    res.json({
      success: true,
      data: { message: 'Notification deleted' },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Clear all notifications for the authenticated user
 */
export async function clearAllNotifications(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const count = await notificationService.clearAll(req.user!.userId);

    res.json({
      success: true,
      data: {
        message: 'All notifications cleared',
        count,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get notification preferences for the authenticated user
 */
export async function getPreferences(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const preferences = await notificationPreferenceService.getPreferences(
      req.user!.userId
    );

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update notification preferences for the authenticated user
 */
export async function updatePreferences(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body as UpdatePreferencesBody;
    const preferences = await notificationPreferenceService.updatePreferences(
      req.user!.userId,
      body
    );

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reset notification preferences to defaults
 */
export async function resetPreferences(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const preferences = await notificationPreferenceService.resetPreferences(
      req.user!.userId
    );

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}
