/**
 * Event Service Unit Tests
 * Tests event creation, queries, filtering, and pagination
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as eventService from '../../services/event.service.js';
import { prisma } from '../../lib/prisma.js';
import { mockEvent, mockEvents, mockAgent } from '../mocks/prisma.mock.js';

describe('Event Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEventBatch', () => {
    it('should create multiple events successfully', async () => {
      const agentId = 'agent-123';
      const userId = 'user-123';
      const events = [
        {
          eventType: 'file' as const,
          eventAction: 'modify',
          title: 'Modified file1.ts',
          content: null,
          metadata: {},
          filePath: '/path/to/file1.ts',
          gitBranch: 'main',
          gitCommitHash: null,
          localTimestamp: new Date().toISOString(),
        },
        {
          eventType: 'git' as const,
          eventAction: 'commit',
          title: 'feat: add feature',
          content: null,
          metadata: {},
          filePath: null,
          gitBranch: 'main',
          gitCommitHash: 'abc123',
          localTimestamp: new Date().toISOString(),
        },
      ];

      const createdEvents = events.map((e, i) =>
        mockEvent({
          id: `event-${i + 1}`,
          eventType: e.eventType,
          eventAction: e.eventAction,
          title: e.title,
        })
      );

      (prisma.agent.update as jest.Mock).mockResolvedValue(mockAgent({ id: agentId }));

      // Mock transaction
      const mockTxCreate = jest.fn();
      createdEvents.forEach((event) => {
        mockTxCreate.mockResolvedValueOnce(event);
      });

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          event: {
            create: mockTxCreate,
          },
        };
        return callback(tx);
      });

      const result = await eventService.createEventBatch(agentId, userId, events);

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.created).toHaveLength(2);

      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: { id: agentId },
        data: expect.objectContaining({
          status: 'active',
        }),
      });
    });

    it('should handle partial failures in batch', async () => {
      const agentId = 'agent-123';
      const userId = 'user-123';
      const events = [
        {
          eventType: 'file' as const,
          eventAction: 'modify',
          title: 'File 1',
          content: null,
          metadata: {},
          filePath: '/file1.ts',
          gitBranch: null,
          gitCommitHash: null,
          localTimestamp: new Date().toISOString(),
        },
        {
          eventType: 'file' as const,
          eventAction: 'modify',
          title: 'File 2',
          content: null,
          metadata: {},
          filePath: '/file2.ts',
          gitBranch: null,
          gitCommitHash: null,
          localTimestamp: new Date().toISOString(),
        },
      ];

      (prisma.agent.update as jest.Mock).mockResolvedValue(mockAgent({ id: agentId }));

      const mockTxCreate = jest.fn();
      mockTxCreate
        .mockResolvedValueOnce(mockEvent({ id: 'event-1', title: 'File 1' }))
        .mockRejectedValueOnce(new Error('Database error'));

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          event: {
            create: mockTxCreate,
          },
        };
        return callback(tx);
      });

      const result = await eventService.createEventBatch(agentId, userId, events);

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.created).toHaveLength(1);
    });

    it('should update agent last sync and active timestamps', async () => {
      const agentId = 'agent-123';
      const userId = 'user-123';
      const events = [
        {
          eventType: 'file' as const,
          eventAction: 'modify',
          title: 'Test',
          content: null,
          metadata: {},
          filePath: '/test.ts',
          gitBranch: null,
          gitCommitHash: null,
          localTimestamp: new Date().toISOString(),
        },
      ];

      (prisma.agent.update as jest.Mock).mockResolvedValue(mockAgent());
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          event: {
            create: jest.fn().mockResolvedValue(mockEvent()),
          },
        };
        return callback(tx);
      });

      await eventService.createEventBatch(agentId, userId, events);

      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: { id: agentId },
        data: {
          lastSyncAt: expect.any(Date),
          lastActiveAt: expect.any(Date),
          status: 'active',
        },
      });
    });
  });

  describe('getEvents', () => {
    it('should return paginated events', async () => {
      const userId = 'user-123';
      const filters = {
        limit: 20,
      };

      const events = mockEvents(15, { userId });

      (prisma.event.findMany as jest.Mock).mockResolvedValue(events);

      const result = await eventService.getEvents(userId, filters);

      expect(result.items).toHaveLength(15);
      expect(result.pagination.hasMore).toBe(false);
      expect(prisma.event.findMany).toHaveBeenCalled();
    });

    it('should filter by event type', async () => {
      const userId = 'user-123';
      const filters = {
        eventType: 'git' as const,
        limit: 20,
      };

      const gitEvents = mockEvents(5, { userId, eventType: 'git' });

      (prisma.event.findMany as jest.Mock).mockResolvedValue(gitEvents);

      const result = await eventService.getEvents(userId, filters);

      expect(result.items).toHaveLength(5);
      expect(result.items.every((e) => e.eventType === 'git')).toBe(true);
    });

    it('should filter by date range', async () => {
      const userId = 'user-123';
      const dateFrom = '2024-01-01T00:00:00Z';
      const dateTo = '2024-01-31T23:59:59Z';
      const filters = {
        dateFrom,
        dateTo,
        limit: 20,
      };

      const events = mockEvents(10, { userId });

      (prisma.event.findMany as jest.Mock).mockResolvedValue(events);

      await eventService.getEvents(userId, filters);

      expect(prisma.event.findMany).toHaveBeenCalled();
      const callArgs = (prisma.event.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.localTimestamp).toBeDefined();
    });

    it('should handle cursor-based pagination', async () => {
      const userId = 'user-123';
      const filters = {
        cursor: 'event-10',
        limit: 20,
      };

      const events = mockEvents(15, { userId });

      (prisma.event.findMany as jest.Mock).mockResolvedValue(events);

      const result = await eventService.getEvents(userId, filters);

      expect(result.items).toHaveLength(15);
      expect(prisma.event.findMany).toHaveBeenCalled();
    });

    it('should return hasMore true when more events available', async () => {
      const userId = 'user-123';
      const filters = {
        limit: 10,
      };

      // Return 11 events (limit + 1)
      const events = mockEvents(11, { userId });

      (prisma.event.findMany as jest.Mock).mockResolvedValue(events);

      const result = await eventService.getEvents(userId, filters);

      expect(result.items).toHaveLength(10);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.cursor).toBe(events[9].id);
    });

    it('should search by text query', async () => {
      const userId = 'user-123';
      const filters = {
        search: 'feature',
        limit: 20,
      };

      const events = mockEvents(3, {
        userId,
        title: 'Added feature',
      });

      (prisma.event.findMany as jest.Mock).mockResolvedValue(events);

      await eventService.getEvents(userId, filters);

      expect(prisma.event.findMany).toHaveBeenCalled();
    });
  });

  describe('getEventById', () => {
    it('should return event by id', async () => {
      const userId = 'user-123';
      const eventId = 'event-123';
      const event = mockEvent({ id: eventId, userId });

      (prisma.event.findFirst as jest.Mock).mockResolvedValue({
        ...event,
        project: null,
        agent: { id: 'agent-123', name: 'Test Agent' },
      });

      const result = await eventService.getEventById(userId, eventId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(eventId);
      expect(prisma.event.findFirst).toHaveBeenCalledWith({
        where: { id: eventId, userId },
        include: expect.any(Object),
      });
    });

    it('should return null if event not found', async () => {
      const userId = 'user-123';
      const eventId = 'nonexistent';

      (prisma.event.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await eventService.getEventById(userId, eventId);

      expect(result).toBeNull();
    });
  });

  describe('getEventStats', () => {
    it('should return event statistics', async () => {
      const userId = 'user-123';
      const days = 7;

      const typeStats = [
        { eventType: 'file', _count: { id: 50 } },
        { eventType: 'git', _count: { id: 30 } },
        { eventType: 'terminal', _count: { id: 20 } },
      ];

      const dailyStats = [
        { date: '2024-01-01', count: 20 },
        { date: '2024-01-02', count: 25 },
        { date: '2024-01-03', count: 30 },
      ];

      (prisma.event.groupBy as jest.Mock).mockResolvedValue(typeStats);

      // Mock $queryRaw for daily stats
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(
        dailyStats.map(s => ({ date: s.date, count: BigInt(s.count) }))
      );

      const result = await eventService.getEventStats(userId, days);

      expect(result.byType).toHaveLength(3);
      expect(result.byType[0]).toEqual({ type: 'file', count: 50 });
      expect(result.byDay).toEqual(dailyStats);
    });
  });

  describe('searchEvents', () => {
    it('should search events by query string', async () => {
      const userId = 'user-123';
      const query = 'feature';
      const limit = 50;

      const events = mockEvents(5, {
        userId,
        title: 'Added feature',
      });

      (prisma.event.findMany as jest.Mock).mockResolvedValue(events);

      const result = await eventService.searchEvents(userId, query, limit);

      expect(result).toHaveLength(5);
      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            OR: expect.any(Array),
          }),
          take: limit,
        })
      );
    });

    it('should search in multiple fields', async () => {
      const userId = 'user-123';
      const query = 'test';

      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

      await eventService.searchEvents(userId, query);

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: expect.any(Object) }),
              expect.objectContaining({ content: expect.any(Object) }),
              expect.objectContaining({ filePath: expect.any(Object) }),
              expect.objectContaining({ gitBranch: expect.any(Object) }),
            ]),
          }),
        })
      );
    });
  });

  describe('getTerminalStats', () => {
    it('should return terminal statistics', async () => {
      const userId = 'user-123';
      const days = 7;

      const terminalEvents = [
        mockEvent({
          userId,
          eventType: 'terminal',
          title: 'git status',
          metadata: { command: 'git status', shell: 'zsh' },
        }),
        mockEvent({
          userId,
          eventType: 'terminal',
          title: 'npm install',
          metadata: { command: 'npm install', shell: 'bash' },
        }),
        mockEvent({
          userId,
          eventType: 'terminal',
          title: 'git commit',
          metadata: { command: 'git commit', shell: 'zsh' },
        }),
      ];

      (prisma.event.findMany as jest.Mock).mockResolvedValue(terminalEvents);

      const result = await eventService.getTerminalStats(userId, days);

      expect(result.totalCommands).toBe(3);
      expect(result.uniqueCommands).toBeGreaterThan(0);
      expect(result.topCommands).toBeDefined();
      expect(result.byShell).toBeDefined();
      expect(result.byShell.zsh).toBe(2);
      expect(result.byShell.bash).toBe(1);
      expect(result.byHour).toHaveLength(24);
    });

    it('should calculate top commands correctly', async () => {
      const userId = 'user-123';

      const terminalEvents = [
        mockEvent({
          userId,
          eventType: 'terminal',
          metadata: { command: 'git status' },
        }),
        mockEvent({
          userId,
          eventType: 'terminal',
          metadata: { command: 'git status' },
        }),
        mockEvent({
          userId,
          eventType: 'terminal',
          metadata: { command: 'npm install' },
        }),
      ];

      (prisma.event.findMany as jest.Mock).mockResolvedValue(terminalEvents);

      const result = await eventService.getTerminalStats(userId, 7);

      expect(result.topCommands[0].command).toBe('git');
      expect(result.topCommands[0].count).toBe(2);
    });
  });
});
