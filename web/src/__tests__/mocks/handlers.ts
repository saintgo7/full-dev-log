import { http, HttpResponse } from 'msw';
import type {
  Notification,
  User,
  Team,
  Event,
  Report,
  PaginatedResponse
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Mock data
const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  createdAt: new Date().toISOString(),
};

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'report',
    title: 'Daily Report Ready',
    message: 'Your daily development report is ready',
    read: false,
    actionUrl: '/reports/report-1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    type: 'team',
    title: 'New Team Invitation',
    message: 'You have been invited to join Team Alpha',
    read: false,
    actionUrl: '/teams/team-1',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'notif-3',
    userId: 'user-1',
    type: 'system',
    title: 'System Update',
    message: 'New features available',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Development Team',
    description: 'Main development team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ownerId: 'user-1',
    owner: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    },
    _count: {
      members: 5,
      projects: 3,
      sharedNotes: 12,
    },
  },
  {
    id: 'team-2',
    name: 'Design Team',
    description: 'Design and UX team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ownerId: 'user-2',
    owner: {
      id: 'user-2',
      name: 'Jane Doe',
      email: 'jane@example.com',
    },
    _count: {
      members: 3,
      projects: 2,
      sharedNotes: 8,
    },
  },
];

const mockEvents: Event[] = [
  {
    id: 'event-1',
    eventType: 'git',
    eventAction: 'commit',
    title: 'feat: add user authentication',
    content: 'Implemented JWT-based authentication',
    metadata: {},
    filePath: null,
    gitBranch: 'main',
    gitCommitHash: 'abc123',
    localTimestamp: new Date().toISOString(),
    serverTimestamp: new Date().toISOString(),
    project: { id: 'project-1', name: 'DevLog Hub' },
    agent: { id: 'agent-1', name: 'Macbook Pro' },
  },
];

export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/auth/login`, async () => {
    return HttpResponse.json({
      user: mockUser,
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    });
  }),

  http.get(`${API_URL}/auth/me`, async () => {
    return HttpResponse.json(mockUser);
  }),

  // Notifications endpoints
  http.get(`${API_URL}/notifications`, async ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const read = url.searchParams.get('read');

    let filtered = [...mockNotifications];
    if (read !== null) {
      filtered = filtered.filter((n) => n.read === (read === 'true'));
    }

    const response: PaginatedResponse<Notification> = {
      items: filtered.slice(0, limit),
      pagination: {
        cursor: null,
        hasMore: false,
      },
    };

    return HttpResponse.json(response);
  }),

  http.get(`${API_URL}/notifications/unread/count`, async () => {
    const count = mockNotifications.filter((n) => !n.read).length;
    return HttpResponse.json({ count });
  }),

  http.put(`${API_URL}/notifications/:id/read`, async ({ params }) => {
    const { id } = params;
    const notification = mockNotifications.find((n) => n.id === id);

    if (!notification) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json({ ...notification, read: true });
  }),

  http.put(`${API_URL}/notifications/read-all`, async () => {
    return HttpResponse.json({ success: true });
  }),

  http.delete(`${API_URL}/notifications/:id`, async () => {
    return HttpResponse.json({ success: true });
  }),

  http.get(`${API_URL}/notifications/preferences`, async () => {
    return HttpResponse.json({
      id: 'pref-1',
      userId: 'user-1',
      channels: {
        email: true,
        push: true,
        inApp: true,
      },
      types: {
        report: true,
        team: true,
        mention: true,
        alert: true,
        system: true,
      },
      quietHoursEnabled: false,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.put(`${API_URL}/notifications/preferences`, async () => {
    return HttpResponse.json({
      id: 'pref-1',
      userId: 'user-1',
      channels: {
        email: true,
        push: true,
        inApp: true,
      },
      types: {
        report: true,
        team: true,
        mention: true,
        alert: true,
        system: true,
      },
      quietHoursEnabled: false,
      updatedAt: new Date().toISOString(),
    });
  }),

  // Teams endpoints
  http.get(`${API_URL}/teams`, async () => {
    const response: PaginatedResponse<Team> = {
      items: mockTeams,
      pagination: {
        cursor: null,
        hasMore: false,
      },
    };
    return HttpResponse.json(response);
  }),

  http.get(`${API_URL}/teams/:id`, async ({ params }) => {
    const { id } = params;
    const team = mockTeams.find((t) => t.id === id);

    if (!team) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(team);
  }),

  // Events endpoints
  http.get(`${API_URL}/events`, async () => {
    const response: PaginatedResponse<Event> = {
      items: mockEvents,
      pagination: {
        cursor: null,
        hasMore: false,
      },
    };
    return HttpResponse.json(response);
  }),

  // Reports endpoints
  http.get(`${API_URL}/reports`, async () => {
    const response: PaginatedResponse<Report> = {
      items: [],
      pagination: {
        cursor: null,
        hasMore: false,
      },
    };
    return HttpResponse.json(response);
  }),
];
