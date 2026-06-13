import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './auth';

class SocketManager {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect() {
    if (this.socket?.connected) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      console.error('No auth token available for WebSocket connection');
      return;
    }

    this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket:', reason);
      this.emit('disconnected', reason);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });

    // Event handlers
    this.socket.on('event:new', (data) => {
      this.emit('event:new', data);
    });

    this.socket.on('event:update', (data) => {
      this.emit('event:update', data);
    });

    this.socket.on('agent:status:update', (data) => {
      this.emit('agent:status:update', data);
    });

    this.socket.on('notification:new', (data) => {
      this.emit('notification:new', data);
    });

    this.socket.on('dashboard:stats:update', (data) => {
      this.emit('dashboard:stats:update', data);
    });

    this.socket.on('dashboard:activity:update', (data) => {
      this.emit('dashboard:activity:update', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Event emitter methods
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return cleanup function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Socket.io emit wrapper
  send(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot send ${event}: WebSocket not connected`);
    }
  }

  // Room management
  joinProject(projectId: string) {
    this.send('join:project', projectId);
  }

  leaveProject(projectId: string) {
    this.send('leave:project', projectId);
  }

  joinAgent(agentId: string) {
    this.send('join:agent', agentId);
  }

  leaveAgent(agentId: string) {
    this.send('leave:agent', agentId);
  }

  // Agent status
  updateAgentStatus(agentId: string, status: string) {
    this.send('agent:status', { agentId, status });
  }

  // Connection status
  get isConnected() {
    return this.socket?.connected || false;
  }

  get connectionId() {
    return this.socket?.id || null;
  }
}

// Singleton instance
const socketManager = new SocketManager();

export default socketManager;