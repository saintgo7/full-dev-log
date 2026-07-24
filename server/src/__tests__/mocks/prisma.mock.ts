/**
 * Prisma Mock Utilities
 * Factory functions for generating test data
 */

import type { User, Agent, Event, Session, Notification, Report } from '@prisma/client';

/**
 * Generate a mock user
 */
export function mockUser(overrides?: Partial<User>): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2a$12$abcdefghijklmnopqrstuvwxyz1234567890',
    role: 'user',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Generate a mock agent
 */
export function mockAgent(overrides?: Partial<Agent>): Agent {
  return {
    id: 'agent-123',
    userId: 'user-123',
    name: 'Test Agent',
    hostname: 'localhost',
    apiToken: 'test-api-token-abc123',
    status: 'active',
    lastSyncAt: new Date('2024-01-01'),
    lastActiveAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Generate a mock event
 */
export function mockEvent(overrides?: Partial<Event>): Event {
  return {
    id: 'event-123',
    userId: 'user-123',
    agentId: 'agent-123',
    projectId: null,
    eventType: 'file',
    eventAction: 'modify',
    title: 'Modified file.ts',
    content: null,
    metadata: {},
    filePath: '/path/to/file.ts',
    gitBranch: 'main',
    gitCommitHash: null,
    localTimestamp: new Date('2024-01-01T10:00:00Z'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Generate a mock session
 */
export function mockSession(overrides?: Partial<Session>): Session {
  return {
    id: 'session-123',
    userId: 'user-123',
    refreshToken: 'refresh-token-abc123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Generate a mock notification
 */
export function mockNotification(overrides?: Partial<Notification>): Notification {
  return {
    id: 'notif-123',
    userId: 'user-123',
    type: 'report_ready',
    title: 'Report Ready',
    message: 'Your daily report is ready.',
    data: {},
    read: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Generate a mock report
 */
export function mockReport(overrides?: Partial<Report>): Report {
  return {
    id: 'report-123',
    userId: 'user-123',
    projectId: null,
    reportType: 'daily',
    title: 'Daily Report - 2024-01-01',
    data: {
      type: 'daily',
      userId: 'user-123',
      projectId: null,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-01'),
      generatedAt: new Date('2024-01-01T12:00:00Z'),
      summary: {
        totalEvents: 100,
        activeHours: 8,
        topActivity: 'Git',
        productivity: 85,
      },
      gitActivity: {
        totalCommits: 10,
        linesAdded: 100,
        linesDeleted: 50,
        topCommits: [],
        branches: ['main'],
      },
      fileActivity: {
        created: 5,
        modified: 10,
        deleted: 2,
        topFiles: [],
        byExtension: [],
      },
      terminalActivity: {
        totalCommands: 20,
        uniqueCommands: 10,
        topCommands: [],
        byShell: {},
      },
      hourlyDistribution: new Array(24).fill(0),
      dailyDistribution: [],
      projectBreakdown: [],
    },
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-01'),
    status: 'generated',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Generate multiple mock users
 */
export function mockUsers(count: number, overrides?: Partial<User>): User[] {
  return Array.from({ length: count }, (_, i) =>
    mockUser({
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
      name: `User ${i + 1}`,
      ...overrides,
    })
  );
}

/**
 * Generate multiple mock events
 */
export function mockEvents(count: number, overrides?: Partial<Event>): Event[] {
  const types: Array<Event['eventType']> = ['file', 'git', 'terminal', 'ide'];
  return Array.from({ length: count }, (_, i) =>
    mockEvent({
      id: `event-${i + 1}`,
      eventType: types[i % types.length],
      title: `Event ${i + 1}`,
      localTimestamp: new Date(Date.now() - i * 3600000), // 1 hour apart
      ...overrides,
    })
  );
}

/**
 * Mock Prisma transaction
 */
export function mockTransaction(operations: Record<string, unknown>) {
  return Promise.resolve(operations);
}

/**
 * Mock error responses
 */
export const mockPrismaErrors = {
  notFound: new Error('Record not found'),
  unique: Object.assign(new Error('Unique constraint failed'), {
    code: 'P2002',
  }),
  foreignKey: Object.assign(new Error('Foreign key constraint failed'), {
    code: 'P2003',
  }),
  timeout: Object.assign(new Error('Query timeout'), {
    code: 'P2024',
  }),
};

/**
 * Helper to create a mock Prisma query result
 */
export function mockQueryResult<T>(data: T): Promise<T> {
  return Promise.resolve(data);
}

/**
 * Helper to create a mock Prisma query error
 */
export function mockQueryError(error: Error): Promise<never> {
  return Promise.reject(error);
}
