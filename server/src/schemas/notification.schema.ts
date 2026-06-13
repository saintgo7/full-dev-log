import { z } from 'zod';

// Notification type enum
export const notificationTypeSchema = z.enum([
  'report_ready',
  'team_invite',
  'mention',
  'anomaly_detected',
  'milestone_reached',
]);
export type NotificationTypeEnum = z.infer<typeof notificationTypeSchema>;

// Get notifications query params
export const getNotificationsQuerySchema = z.object({
  cursor: z.string().uuid('Invalid cursor').optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(100)),
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  type: notificationTypeSchema.optional(),
});
export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;

// Mark notification as read params
export const markAsReadParamsSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
});
export type MarkAsReadParams = z.infer<typeof markAsReadParamsSchema>;

// Delete notification params
export const deleteNotificationParamsSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
});
export type DeleteNotificationParams = z.infer<typeof deleteNotificationParamsSchema>;

// Update notification preferences body
export const updatePreferencesBodySchema = z.object({
  // Channel preferences
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),

  // Type preferences
  reportReady: z.boolean().optional(),
  teamInvite: z.boolean().optional(),
  mentions: z.boolean().optional(),
  anomalies: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
});
export type UpdatePreferencesBody = z.infer<typeof updatePreferencesBodySchema>;

// Response schemas for documentation
export const notificationResponseSchema = z.object({
  id: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  data: z.record(z.unknown()),
  read: z.boolean(),
  createdAt: z.date(),
});
export type NotificationResponse = z.infer<typeof notificationResponseSchema>;

export const notificationPreferencesResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  channels: z.object({
    email: z.boolean(),
    push: z.boolean(),
    inApp: z.boolean(),
  }),
  types: z.object({
    reportReady: z.boolean(),
    teamInvite: z.boolean(),
    mentions: z.boolean(),
    anomalies: z.boolean(),
    weeklyDigest: z.boolean(),
  }),
});
export type NotificationPreferencesResponse = z.infer<typeof notificationPreferencesResponseSchema>;
