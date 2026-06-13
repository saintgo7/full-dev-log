import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getNotificationsQuerySchema,
  markAsReadParamsSchema,
  deleteNotificationParamsSchema,
  updatePreferencesBodySchema,
} from '../schemas/notification.schema.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============ Notifications ============

// GET /api/v1/notifications - Get paginated notifications
router.get(
  '/',
  validate(getNotificationsQuerySchema, 'query'),
  notificationController.getNotifications
);

// GET /api/v1/notifications/unread-count - Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// PATCH /api/v1/notifications/:id/read - Mark single notification as read
router.patch(
  '/:id/read',
  validate(markAsReadParamsSchema, 'params'),
  notificationController.markAsRead
);

// POST /api/v1/notifications/read-all - Mark all notifications as read
router.post('/read-all', notificationController.markAllAsRead);

// DELETE /api/v1/notifications/:id - Delete a single notification
router.delete(
  '/:id',
  validate(deleteNotificationParamsSchema, 'params'),
  notificationController.deleteNotification
);

// DELETE /api/v1/notifications - Clear all notifications
router.delete('/', notificationController.clearAllNotifications);

// ============ Notification Preferences ============

// GET /api/v1/notifications/preferences - Get notification preferences
router.get('/preferences', notificationController.getPreferences);

// PATCH /api/v1/notifications/preferences - Update notification preferences
router.patch(
  '/preferences',
  validate(updatePreferencesBodySchema),
  notificationController.updatePreferences
);

// POST /api/v1/notifications/preferences/reset - Reset preferences to defaults
router.post('/preferences/reset', notificationController.resetPreferences);

export default router;
