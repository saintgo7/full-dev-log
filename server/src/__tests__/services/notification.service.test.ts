/**
 * Notification Service Unit Tests
 * Tests notification creation, marking as read, and preferences
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as notificationService from '../../services/notification.service.js';
import { prisma } from '../../lib/prisma.js';
import { socketManager } from '../../websocket/socketManager.js';
import { mockNotification, mockUser } from '../mocks/prisma.mock.js';
import { NotFoundError, AuthorizationError } from '../../utils/errors.js';

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create notification successfully', async () => {
      const userId = 'user-123';
      const type = 'report_ready';
      const title = 'Report Ready';
      const message = 'Your daily report is ready.';
      const data = { reportId: 'report-123' };

      const notification = mockNotification({
        userId,
        type,
        title,
        message,
        data,
      });

      const user = mockUser({ id: userId });

      (prisma.notification.create as jest.Mock).mockResolvedValue({
        ...notification,
        user,
      });

      const result = await notificationService.create(userId, type, title, message, data);

      expect(result).toBeDefined();
      expect(result.type).toBe(type);
      expect(result.title).toBe(title);
      expect(result.message).toBe(message);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId,
          type,
          title,
          message,
          data: expect.any(Object),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      expect(socketManager.broadcastNotification).toHaveBeenCalled();
    });

    it('should broadcast notification via WebSocket', async () => {
      const userId = 'user-123';
      const notification = mockNotification({ userId });
      const user = mockUser({ id: userId });

      (prisma.notification.create as jest.Mock).mockResolvedValue({
        ...notification,
        user,
      });

      const mockIO = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };
      (socketManager.getIO as jest.Mock).mockReturnValue(mockIO);

      await notificationService.create(userId, 'report_ready', 'Test', 'Message');

      expect(mockIO.to).toHaveBeenCalledWith(`user:${userId}`);
      expect(mockIO.emit).toHaveBeenCalledWith(
        'notification:created',
        expect.objectContaining({
          id: notification.id,
          type: notification.type,
          title: notification.title,
        })
      );
    });

    it('should handle notification without data', async () => {
      const userId = 'user-123';
      const notification = mockNotification({ userId, data: {} });
      const user = mockUser({ id: userId });

      (prisma.notification.create as jest.Mock).mockResolvedValue({
        ...notification,
        user,
      });

      const result = await notificationService.create(
        userId,
        'milestone_reached',
        'Milestone',
        'Congratulations!'
      );

      expect(result.data).toEqual({});
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      const userId = 'user-123';
      const notifications = Array.from({ length: 15 }, (_, i) =>
        mockNotification({
          id: `notif-${i + 1}`,
          userId,
          read: i % 2 === 0,
        })
      );

      (prisma.notification.findMany as jest.Mock).mockResolvedValue(notifications);

      const result = await notificationService.getNotifications(userId, { limit: 20 });

      expect(result.items).toHaveLength(15);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('should filter unread notifications', async () => {
      const userId = 'user-123';
      const unreadNotifications = [
        mockNotification({ id: 'notif-1', userId, read: false }),
        mockNotification({ id: 'notif-2', userId, read: false }),
      ];

      (prisma.notification.findMany as jest.Mock).mockResolvedValue(unreadNotifications);

      const result = await notificationService.getNotifications(userId, {
        unreadOnly: true,
        limit: 20,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.every((n) => !n.read)).toBe(true);
    });

    it('should filter notifications by type', async () => {
      const userId = 'user-123';
      const reportNotifications = [
        mockNotification({ id: 'notif-1', userId, type: 'report_ready' }),
        mockNotification({ id: 'notif-2', userId, type: 'report_ready' }),
      ];

      (prisma.notification.findMany as jest.Mock).mockResolvedValue(reportNotifications);

      const result = await notificationService.getNotifications(userId, {
        type: 'report_ready',
        limit: 20,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.every((n) => n.type === 'report_ready')).toBe(true);
    });

    it('should handle cursor-based pagination', async () => {
      const userId = 'user-123';
      const notifications = Array.from({ length: 11 }, (_, i) =>
        mockNotification({ id: `notif-${i + 1}`, userId })
      );

      (prisma.notification.findMany as jest.Mock).mockResolvedValue(notifications);

      const result = await notificationService.getNotifications(userId, {
        cursor: 'notif-10',
        limit: 10,
      });

      expect(result.items).toHaveLength(10);
      expect(result.pagination.hasMore).toBe(true);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      const userId = 'user-123';

      (prisma.notification.count as jest.Mock).mockResolvedValue(5);

      const count = await notificationService.getUnreadCount(userId);

      expect(count).toBe(5);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId,
          read: false,
        },
      });
    });

    it('should return 0 when no unread notifications', async () => {
      const userId = 'user-123';

      (prisma.notification.count as jest.Mock).mockResolvedValue(0);

      const count = await notificationService.getUnreadCount(userId);

      expect(count).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const userId = 'user-123';
      const notificationId = 'notif-123';
      const notification = mockNotification({ id: notificationId, userId, read: false });
      const updatedNotification = { ...notification, read: true };

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(notification);
      (prisma.notification.update as jest.Mock).mockResolvedValue(updatedNotification);

      const mockIO = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };
      (socketManager.getIO as jest.Mock).mockReturnValue(mockIO);

      const result = await notificationService.markAsRead(notificationId, userId);

      expect(result.read).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: { read: true },
        select: expect.any(Object),
      });

      expect(mockIO.to).toHaveBeenCalledWith(`user:${userId}`);
      expect(mockIO.emit).toHaveBeenCalledWith('notification:read', {
        notificationId,
        read: true,
      });
    });

    it('should throw NotFoundError if notification does not exist', async () => {
      const userId = 'user-123';
      const notificationId = 'nonexistent';

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(notificationService.markAsRead(notificationId, userId)).rejects.toThrow(
        NotFoundError
      );
      await expect(notificationService.markAsRead(notificationId, userId)).rejects.toThrow(
        'Notification'
      );
    });

    it('should throw AuthorizationError if user does not own notification', async () => {
      const userId = 'user-123';
      const otherUserId = 'user-456';
      const notificationId = 'notif-123';
      const notification = mockNotification({ id: notificationId, userId: otherUserId });

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(notification);

      await expect(notificationService.markAsRead(notificationId, userId)).rejects.toThrow(
        AuthorizationError
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const userId = 'user-123';

      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 5 });

      const mockIO = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };
      (socketManager.getIO as jest.Mock).mockReturnValue(mockIO);

      const count = await notificationService.markAllAsRead(userId);

      expect(count).toBe(5);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId,
          read: false,
        },
        data: { read: true },
      });

      expect(mockIO.emit).toHaveBeenCalledWith(
        'notification:all-read',
        expect.objectContaining({
          timestamp: expect.any(Date),
        })
      );
    });

    it('should return 0 if no unread notifications', async () => {
      const userId = 'user-123';

      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const count = await notificationService.markAllAsRead(userId);

      expect(count).toBe(0);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      const userId = 'user-123';
      const notificationId = 'notif-123';
      const notification = mockNotification({ id: notificationId, userId });

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(notification);
      (prisma.notification.delete as jest.Mock).mockResolvedValue(notification);

      const mockIO = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };
      (socketManager.getIO as jest.Mock).mockReturnValue(mockIO);

      await notificationService.deleteNotification(notificationId, userId);

      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: notificationId },
      });

      expect(mockIO.emit).toHaveBeenCalledWith('notification:deleted', {
        notificationId,
      });
    });

    it('should throw NotFoundError if notification does not exist', async () => {
      const userId = 'user-123';
      const notificationId = 'nonexistent';

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        notificationService.deleteNotification(notificationId, userId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError if user does not own notification', async () => {
      const userId = 'user-123';
      const otherUserId = 'user-456';
      const notificationId = 'notif-123';
      const notification = mockNotification({ id: notificationId, userId: otherUserId });

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(notification);

      await expect(
        notificationService.deleteNotification(notificationId, userId)
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('clearAll', () => {
    it('should clear all notifications for user', async () => {
      const userId = 'user-123';

      (prisma.notification.deleteMany as jest.Mock).mockResolvedValue({ count: 10 });

      const mockIO = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };
      (socketManager.getIO as jest.Mock).mockReturnValue(mockIO);

      const count = await notificationService.clearAll(userId);

      expect(count).toBe(10);
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });

      expect(mockIO.emit).toHaveBeenCalledWith(
        'notification:cleared',
        expect.objectContaining({
          timestamp: expect.any(Date),
        })
      );
    });
  });

  describe('notifyReportReady', () => {
    it('should create report ready notification', async () => {
      const userId = 'user-123';
      const report = {
        id: 'report-123',
        title: 'Daily Report',
        reportType: 'daily',
      };

      const user = mockUser({ id: userId });

      (prisma.notification.create as jest.Mock).mockImplementation((args) => {
        return Promise.resolve({
          ...mockNotification({
            userId,
            type: args.data.type,
            title: args.data.title,
            message: args.data.message,
          }),
          user,
        });
      });

      const result = await notificationService.notifyReportReady(userId, report);

      expect(result.type).toBe('report_ready');
      expect(result.title).toContain('Report');
      expect(result.message).toContain('report');
    });
  });

  describe('notifyTeamInvite', () => {
    it('should create team invite notification', async () => {
      const userId = 'user-123';
      const team = { id: 'team-123', name: 'Dev Team' };
      const inviter = { id: 'user-456', name: 'John Doe' };

      const user = mockUser({ id: userId });

      (prisma.notification.create as jest.Mock).mockImplementation((args) => {
        return Promise.resolve({
          ...mockNotification({
            userId,
            type: args.data.type,
            title: args.data.title,
            message: args.data.message,
          }),
          user,
        });
      });

      const result = await notificationService.notifyTeamInvite(userId, team, inviter);

      expect(result.type).toBe('team_invite');
      expect(result.title).toContain('Team');
      expect(result.message).toBeDefined();
    });
  });

  describe('notifyAnomalyDetected', () => {
    it('should create anomaly detected notification', async () => {
      const userId = 'user-123';
      const anomaly = {
        type: 'unusual_activity',
        description: 'Unusual commit pattern detected',
        severity: 'high',
      };

      const user = mockUser({ id: userId });

      (prisma.notification.create as jest.Mock).mockImplementation((args) => {
        return Promise.resolve({
          ...mockNotification({
            userId,
            type: args.data.type,
            title: args.data.title,
            message: args.data.message,
          }),
          user,
        });
      });

      const result = await notificationService.notifyAnomalyDetected(userId, anomaly);

      expect(result.type).toBe('anomaly_detected');
      expect(result.title).toContain('Anomaly');
      expect(result.message).toBeDefined();
    });
  });

  describe('notifyMilestoneReached', () => {
    it('should create milestone reached notification', async () => {
      const userId = 'user-123';
      const milestone = {
        name: '100 Commits',
        description: 'You have reached 100 commits!',
      };

      const user = mockUser({ id: userId });

      (prisma.notification.create as jest.Mock).mockImplementation((args) => {
        return Promise.resolve({
          ...mockNotification({
            userId,
            type: args.data.type,
            title: args.data.title,
            message: args.data.message,
          }),
          user,
        });
      });

      const result = await notificationService.notifyMilestoneReached(userId, milestone);

      expect(result.type).toBe('milestone_reached');
      expect(result.title).toContain('Milestone');
      expect(result.message).toBeDefined();
    });
  });
});
