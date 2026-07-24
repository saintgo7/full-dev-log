'use client';

import { useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';
import {
  ServerIcon,
  WifiIcon,
  WifiOffIcon,
  RefreshCwIcon
} from 'lucide-react';

interface AgentStatus {
  agentId: string;
  status: 'online' | 'offline' | 'syncing' | 'error';
  timestamp: string;
  name?: string;
  machineId?: string;
  os?: string;
}

const STATUS_COLORS = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  syncing: 'bg-blue-500',
  error: 'bg-red-500',
};

const STATUS_ICONS = {
  online: WifiIcon,
  offline: WifiOffIcon,
  syncing: RefreshCwIcon,
  error: WifiOffIcon,
};

interface AgentStatusMonitorProps {
  agents: Array<{
    id: string;
    name: string;
    machineId: string;
    os: string;
    status: string;
    lastSyncAt?: string | null;
  }>;
}

export function AgentStatusMonitor({ agents: initialAgents }: AgentStatusMonitorProps) {
  const [agentStatuses, setAgentStatuses] = useState<Map<string, AgentStatus>>(
    new Map(
      initialAgents.map(agent => [
        agent.id,
        {
          agentId: agent.id,
          status: agent.status as any,
          timestamp: agent.lastSyncAt || new Date().toISOString(),
          name: agent.name,
          machineId: agent.machineId,
          os: agent.os,
        },
      ])
    )
  );

  // Ref to track status for notifications (avoids stale closure)
  const agentStatusesRef = useRef(agentStatuses);
  agentStatusesRef.current = agentStatuses;

  // Handle agent status updates from WebSocket
  useSocket('agent:status:update', useCallback((data: {
    agentId: string;
    status: 'online' | 'offline' | 'syncing' | 'error';
    timestamp: string;
  }) => {
    // Access current state via ref to avoid stale closure
    const currentAgent = agentStatusesRef.current.get(data.agentId);
    const previousStatus = currentAgent?.status;

    setAgentStatuses(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(data.agentId);

      if (existing) {
        newMap.set(data.agentId, {
          ...existing,
          status: data.status,
          timestamp: data.timestamp,
        });
      }

      return newMap;
    });

    // Show notification for status changes (using ref for current values)
    if (currentAgent && previousStatus !== data.status) {
      if (data.status === 'offline') {
        showNotification(
          'Agent Offline',
          `${currentAgent.name} has gone offline`
        );
      } else if (data.status === 'error') {
        showNotification(
          'Agent Error',
          `${currentAgent.name} encountered an error`
        );
      }
    }
  }, [])); // Empty deps - uses ref to access current state

  const showNotification = (title: string, message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || ServerIcon;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.offline;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from(agentStatuses.values()).map(agent => (
        <Card key={agent.agentId} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <ServerIcon className="h-8 w-8 text-muted-foreground" />
                <div
                  className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full ${getStatusColor(
                    agent.status
                  )}`}
                />
              </div>
              
              <div>
                <h4 className="font-medium">{agent.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {agent.os} • {agent.machineId}
                </p>
              </div>
            </div>
            
            <Badge
              variant={agent.status === 'online' ? 'default' : 'secondary'}
              className="flex items-center gap-1"
            >
              {getStatusIcon(agent.status)}
              {agent.status}
            </Badge>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last sync</span>
              <span>
                {formatDistanceToNow(new Date(agent.timestamp), { addSuffix: true })}
              </span>
            </div>
            
            {agent.status === 'syncing' && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <RefreshCwIcon className="h-3 w-3 animate-spin text-blue-500" />
                  <span className="text-xs text-blue-500">Syncing...</span>
                </div>
              </div>
            )}
            
            {agent.status === 'error' && (
              <div className="mt-2">
                <span className="text-xs text-red-500">
                  Connection error. Please check agent.
                </span>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}