import * as vscode from 'vscode';
import WebSocket from 'ws';
import { DevLogConfig } from '../config';

export interface DevLogEvent {
  type: 'file_change' | 'file_create' | 'file_delete' | 'session_start' | 'session_end';
  timestamp: string;
  data: {
    filePath?: string;
    language?: string;
    linesAdded?: number;
    linesRemoved?: number;
    project?: string;
    [key: string]: unknown;
  };
}

export interface DevLogInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface ConnectionState {
  connected: boolean;
  lastConnected?: Date;
  error?: string;
}

type ConnectionListener = (state: ConnectionState) => void;
type EventListener = (event: DevLogEvent) => void;

export class DevLogClient {
  private ws: WebSocket | null = null;
  private config: DevLogConfig;
  private connectionState: ConnectionState = { connected: false };
  private connectionListeners: Set<ConnectionListener> = new Set();
  private eventListeners: Set<EventListener> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private eventQueue: DevLogEvent[] = [];
  private readonly maxQueueSize = 100;

  constructor(config: DevLogConfig) {
    this.config = config;
  }

  updateConfig(config: DevLogConfig): void {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.config.wsUrl}/ws?agentId=${encodeURIComponent(this.config.agentId)}`;
        this.ws = new WebSocket(wsUrl, {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        });

        this.ws.on('open', () => {
          this.updateConnectionState({ connected: true, lastConnected: new Date() });
          this.flushEventQueue();
          resolve();
        });

        this.ws.on('message', (data) => {
          try {
            const event = JSON.parse(data.toString()) as DevLogEvent;
            this.notifyEventListeners(event);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        });

        this.ws.on('close', () => {
          this.updateConnectionState({ connected: false });
          this.scheduleReconnect();
        });

        this.ws.on('error', (error) => {
          this.updateConnectionState({
            connected: false,
            error: error.message
          });
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.updateConnectionState({ connected: false });
  }

  async sendEvent(event: DevLogEvent): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      this.queueEvent(event);
    }
  }

  async getInsights(): Promise<DevLogInsight[]> {
    const response = await this.fetchApi('/api/insights');
    return response.data || [];
  }

  async getRecentActivity(): Promise<DevLogEvent[]> {
    const response = await this.fetchApi('/api/events/recent');
    return response.data || [];
  }

  async syncNow(): Promise<{ synced: number }> {
    const response = await this.fetchApi('/api/sync', {
      method: 'POST',
      body: JSON.stringify({ agentId: this.config.agentId }),
    });
    return response;
  }

  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  onConnectionChange(listener: ConnectionListener): vscode.Disposable {
    this.connectionListeners.add(listener);
    return new vscode.Disposable(() => {
      this.connectionListeners.delete(listener);
    });
  }

  onEvent(listener: EventListener): vscode.Disposable {
    this.eventListeners.add(listener);
    return new vscode.Disposable(() => {
      this.eventListeners.delete(listener);
    });
  }

  private async fetchApi(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.serverUrl}${path}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private updateConnectionState(state: Partial<ConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...state };
    this.notifyConnectionListeners();
  }

  private notifyConnectionListeners(): void {
    const state = this.getConnectionState();
    this.connectionListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.error('Connection listener error:', error);
      }
    });
  }

  private notifyEventListeners(event: DevLogEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  private queueEvent(event: DevLogEvent): void {
    this.eventQueue.push(event);
    if (this.eventQueue.length > this.maxQueueSize) {
      this.eventQueue.shift();
    }
  }

  private flushEventQueue(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(event));
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.config.autoConnect) {
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }
    }, 5000);
  }
}
