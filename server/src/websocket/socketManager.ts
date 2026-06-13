import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../lib/prisma';
import * as agentService from '../services/agent.service';
import { ideConnectionManager, validateIdeToken } from '../services/ide.service';

interface SocketUser {
  userId: string;
  email: string;
  socketId: string;
}

interface IdeStatusPayload {
  action: 'connected' | 'disconnected' | 'updated';
  ideInstanceId: string;
  ideName?: string;
  ideType?: string;
  activeFile?: string;
  activeLanguage?: string;
}

interface IdeEventBatchPayload {
  ideInstanceId: string;
  events: Array<{
    id: string;
    eventType: string;
    eventAction: string;
    title: string | null;
  }>;
  timestamp: Date;
}

interface EventPayload {
  id: string;
  eventType: string;
  eventAction: string;
  title: string | null;
  content?: string | null;
  projectId?: string | null;
  localTimestamp: Date;
  agent: {
    id: string;
    name: string;
    userId: string;
  };
}

interface NotificationPayload {
  id?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
}

class SocketManager {
  private io: Server | null = null;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private userRooms: Map<string, Set<string>> = new Map();
  private inactiveCheckInterval: NodeJS.Timeout | null = null;

  initialize(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3020',
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.startInactiveAgentChecker();

    console.log('🔌 WebSocket server initialized');
  }

  /**
   * Periodically check for inactive agents and broadcast status changes
   * Runs every 60 seconds
   */
  private startInactiveAgentChecker() {
    // Check every 60 seconds for agents that haven't sent heartbeat in 5 minutes
    this.inactiveCheckInterval = setInterval(async () => {
      try {
        const inactiveAgents = await agentService.checkInactiveAgents();

        // Broadcast status updates for each newly inactive agent
        for (const agent of inactiveAgents) {
          this.broadcastAgentStatus(agent.id, 'inactive', agent.userId);

          // Send notification that agent went offline
          this.broadcastNotification(agent.userId, {
            type: 'warning',
            title: 'Agent Offline',
            message: `${agent.name} is no longer connected`,
            timestamp: new Date(),
          });
        }

        if (inactiveAgents.length > 0) {
          console.log(`📡 Marked ${inactiveAgents.length} agent(s) as inactive`);
        }
      } catch (error) {
        console.error('Error checking inactive agents:', error);
      }
    }, 60 * 1000); // Check every 60 seconds

    console.log('⏱️ Inactive agent checker started (60s interval)');
  }

  /**
   * Stop the inactive agent checker (for graceful shutdown)
   */
  stopInactiveAgentChecker() {
    if (this.inactiveCheckInterval) {
      clearInterval(this.inactiveCheckInterval);
      this.inactiveCheckInterval = null;
      console.log('⏱️ Inactive agent checker stopped');
    }
  }

  private setupMiddleware() {
    if (!this.io) return;

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = verifyAccessToken(token);
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true },
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      const user = socket.data.user;
      console.log(`✅ User connected: ${user.email} (${socket.id})`);

      // Store connected user
      this.connectedUsers.set(socket.id, {
        userId: user.id,
        email: user.email,
        socketId: socket.id,
      });

      // Join user-specific room
      socket.join(`user:${user.id}`);

      // Join project rooms
      this.joinUserProjects(socket, user.id);

      // Join team rooms
      this.joinUserTeams(socket, user.id);

      // Handle events
      socket.on('join:project', async (projectId: string) => {
        // Security: Validate user is a member of this project before joining
        try {
          const membership = await prisma.projectMember.findFirst({
            where: {
              projectId,
              userId: user.id,
            },
          });

          if (!membership) {
            socket.emit('error', {
              type: 'authorization_error',
              message: 'You are not a member of this project',
            });
            console.warn(`⚠️ Unauthorized join attempt: ${user.email} → project:${projectId}`);
            return;
          }

          socket.join(`project:${projectId}`);
          console.log(`User ${user.email} joined project room: ${projectId}`);
        } catch (error) {
          console.error('Error joining project room:', error);
          socket.emit('error', {
            type: 'server_error',
            message: 'Failed to join project room',
          });
        }
      });

      socket.on('leave:project', (projectId: string) => {
        socket.leave(`project:${projectId}`);
        console.log(`User ${user.email} left project room: ${projectId}`);
      });

      // Team room events
      socket.on('join:team', async (teamId: string) => {
        // Security: Validate user is a member of this team before joining
        try {
          const membership = await prisma.teamMember.findFirst({
            where: {
              teamId,
              userId: user.id,
            },
          });

          if (!membership) {
            socket.emit('error', {
              type: 'authorization_error',
              message: 'You are not a member of this team',
            });
            console.warn(`Warning: Unauthorized team join attempt: ${user.email} -> team:${teamId}`);
            return;
          }

          socket.join(`team:${teamId}`);
          console.log(`User ${user.email} joined team room: ${teamId}`);
        } catch (error) {
          console.error('Error joining team room:', error);
          socket.emit('error', {
            type: 'server_error',
            message: 'Failed to join team room',
          });
        }
      });

      socket.on('leave:team', (teamId: string) => {
        socket.leave(`team:${teamId}`);
        console.log(`User ${user.email} left team room: ${teamId}`);
      });

      socket.on('agent:status', async (data) => {
        // Broadcast agent status to all users in the project
        const { agentId, status } = data;
        const agent = await prisma.agent.findUnique({
          where: { id: agentId },
          select: { userId: true },
        });

        if (agent) {
          this.io?.to(`user:${agent.userId}`).emit('agent:status:update', {
            agentId,
            status,
            timestamp: new Date(),
          });
        }
      });

      // IDE-specific socket events
      socket.on('ide:register', async (data: { token: string }) => {
        try {
          const ideInfo = validateIdeToken(data.token);
          if (!ideInfo) {
            socket.emit('ide:error', {
              type: 'authentication_error',
              message: 'Invalid IDE token',
            });
            return;
          }

          // Verify the IDE belongs to this user
          if (ideInfo.userId !== user.id) {
            socket.emit('ide:error', {
              type: 'authorization_error',
              message: 'IDE token does not belong to this user',
            });
            return;
          }

          // Associate socket with IDE instance
          ideConnectionManager.setSocketId(ideInfo.ideInstanceId, socket.id);

          // Join IDE-specific room
          socket.join(`ide:${ideInfo.ideInstanceId}`);
          socket.join(`user:${user.id}:ide`);

          socket.emit('ide:registered', {
            ideInstanceId: ideInfo.ideInstanceId,
            ideName: ideInfo.ideName,
            ideType: ideInfo.ideType,
          });

          console.log(`🔌 IDE registered via WebSocket: ${ideInfo.ideName} (${ideInfo.ideInstanceId})`);
        } catch (error) {
          console.error('Error registering IDE via WebSocket:', error);
          socket.emit('ide:error', {
            type: 'server_error',
            message: 'Failed to register IDE',
          });
        }
      });

      socket.on('ide:event', async (data: { ideInstanceId: string; event: unknown }) => {
        try {
          // Verify the IDE instance belongs to this user
          const instance = ideConnectionManager.getInstance(data.ideInstanceId);
          if (!instance || instance.userId !== user.id) {
            socket.emit('ide:error', {
              type: 'authorization_error',
              message: 'Invalid IDE instance',
            });
            return;
          }

          // Broadcast the event to the user's dashboard
          this.io?.to(`user:${user.id}`).emit('ide:event:new', {
            ideInstanceId: data.ideInstanceId,
            ideName: instance.ideName,
            ideType: instance.ideType,
            event: data.event,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error('Error processing IDE event via WebSocket:', error);
        }
      });

      socket.on('ide:sync', async (data: { ideInstanceId: string }) => {
        try {
          // Get IDE status for this instance
          const instance = ideConnectionManager.getInstance(data.ideInstanceId);
          if (!instance || instance.userId !== user.id) {
            socket.emit('ide:error', {
              type: 'authorization_error',
              message: 'Invalid IDE instance',
            });
            return;
          }

          // Send current status
          socket.emit('ide:sync:response', {
            ideInstanceId: instance.id,
            ideName: instance.ideName,
            ideType: instance.ideType,
            activeFile: instance.activeFile,
            activeLanguage: instance.activeLanguage,
            lastHeartbeat: instance.lastHeartbeat,
          });
        } catch (error) {
          console.error('Error syncing IDE status:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${user.email} (${socket.id})`);
        this.connectedUsers.delete(socket.id);
      });
    });
  }

  private async joinUserProjects(socket: any, userId: string) {
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      select: { id: true },
    });

    projects.forEach(project => {
      socket.join(`project:${project.id}`);
    });
  }

  /**
   * Join user to all their team rooms on connection
   */
  private async joinUserTeams(socket: any, userId: string) {
    const teams = await prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    });

    teams.forEach(membership => {
      socket.join(`team:${membership.teamId}`);
    });
  }

  // Broadcast methods

  /**
   * Broadcast a single new event to the user and project rooms
   */
  broadcastNewEvent(event: EventPayload) {
    if (!this.io) return;

    // Broadcast to agent owner
    if (event.agent?.userId) {
      this.io.to(`user:${event.agent.userId}`).emit('event:new', event);
    }

    // Broadcast to project members
    if (event.projectId) {
      this.io.to(`project:${event.projectId}`).emit('event:new', event);
    }

    // Broadcast terminal-specific event for terminal subscribers
    if (event.eventType === 'terminal' && event.agent?.userId) {
      this.broadcastTerminalEvent(event);
    }
  }

  /**
   * Broadcast a terminal event specifically for terminal-focused clients
   * This allows clients to subscribe to terminal events independently
   */
  broadcastTerminalEvent(event: EventPayload) {
    if (!this.io) return;

    // Emit terminal:new event for clients subscribed to terminal events
    if (event.agent?.userId) {
      this.io.to(`user:${event.agent.userId}`).emit('terminal:new', {
        id: event.id,
        command: event.title || event.content,
        eventAction: event.eventAction,
        localTimestamp: event.localTimestamp,
        agent: event.agent,
        projectId: event.projectId,
      });
    }

    if (event.projectId) {
      this.io.to(`project:${event.projectId}`).emit('terminal:new', {
        id: event.id,
        command: event.title || event.content,
        eventAction: event.eventAction,
        localTimestamp: event.localTimestamp,
        agent: event.agent,
        projectId: event.projectId,
      });
    }
  }

  /**
   * Broadcast multiple events at once for efficiency
   * Useful when syncing large batches of events
   */
  broadcastEventBatch(events: EventPayload[], userId: string) {
    if (!this.io || events.length === 0) return;

    // Emit batch event to user
    this.io.to(`user:${userId}`).emit('events:batch', {
      events,
      count: events.length,
      timestamp: new Date(),
    });

    // Also emit to each unique project
    const projectIds = [...new Set(events.filter(e => e.projectId).map(e => e.projectId))];
    projectIds.forEach(projectId => {
      const projectEvents = events.filter(e => e.projectId === projectId);
      this.io?.to(`project:${projectId}`).emit('events:batch', {
        events: projectEvents,
        count: projectEvents.length,
        timestamp: new Date(),
      });
    });
  }

  /**
   * Broadcast agent status update
   */
  broadcastAgentStatus(agentId: string, status: string, userId: string) {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('agent:status:update', {
      agentId,
      status,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast a notification (toast) to a user
   */
  broadcastNotification(userId: string, notification: Omit<NotificationPayload, 'id'>) {
    if (!this.io) return;

    // Generate unique ID for the notification
    const notificationWithId: NotificationPayload = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };

    this.io.to(`user:${userId}`).emit('notification:new', notificationWithId);
  }

  /**
   * Get list of currently connected users
   */
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  /**
   * Check if a user is currently online
   */
  isUserOnline(userId: string) {
    return Array.from(this.connectedUsers.values()).some(
      user => user.userId === userId
    );
  }

  /**
   * Get the socket.io server instance (for advanced use cases)
   */
  getIO() {
    return this.io;
  }

  // IDE-specific broadcast methods

  /**
   * Broadcast IDE status update (connected/disconnected/updated)
   */
  broadcastIdeStatus(userId: string, status: IdeStatusPayload) {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('ide:status:update', {
      ...status,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast IDE events batch to user dashboard
   */
  broadcastIdeEvents(userId: string, payload: IdeEventBatchPayload) {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('ide:events:batch', payload);
  }

  /**
   * Send message to specific IDE instance via its socket
   */
  sendToIde(ideInstanceId: string, event: string, data: unknown) {
    if (!this.io) return;

    this.io.to(`ide:${ideInstanceId}`).emit(event, data);
  }

  /**
   * Broadcast to all IDEs for a specific user
   */
  broadcastToUserIdes(userId: string, event: string, data: unknown) {
    if (!this.io) return;

    this.io.to(`user:${userId}:ide`).emit(event, data);
  }

  // Team collaboration broadcast methods

  /**
   * Broadcast team activity to team members
   */
  broadcastTeamActivity(teamId: string, activity: {
    id: string;
    type: string;
    data: unknown;
    user: { id: string; name: string; email: string } | undefined;
    createdAt: Date;
  }) {
    if (!this.io) return;

    this.io.to(`team:${teamId}`).emit('team:activity:new', {
      ...activity,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast new note created event to team
   */
  broadcastNoteCreated(teamId: string, note: {
    id: string;
    title: string;
    author: { id: string; name: string; email: string };
    createdAt: Date;
  }) {
    if (!this.io) return;

    this.io.to(`team:${teamId}`).emit('note:created', {
      ...note,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast note updated event to team
   */
  broadcastNoteUpdated(teamId: string, note: {
    id: string;
    title: string;
    updatedAt: Date;
  }) {
    if (!this.io) return;

    this.io.to(`team:${teamId}`).emit('note:updated', {
      ...note,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast mention notification to a user
   */
  broadcastMention(userId: string, mention: {
    id: string;
    noteId: string;
    read: boolean;
    createdAt: Date;
  }) {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('mention:new', {
      ...mention,
      timestamp: new Date(),
    });
  }

  /**
   * Join user to team room (called when user connects and is a member of team)
   */
  joinTeamRoom(socketId: string, teamId: string) {
    if (!this.io) return;

    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(`team:${teamId}`);
    }
  }

  /**
   * Leave team room
   */
  leaveTeamRoom(socketId: string, teamId: string) {
    if (!this.io) return;

    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.leave(`team:${teamId}`);
    }
  }
}

export const socketManager = new SocketManager();