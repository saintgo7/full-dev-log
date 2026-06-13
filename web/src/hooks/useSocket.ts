import { useEffect, useRef, useCallback } from 'react';
import socketManager from '@/lib/socket';

export function useSocket(event: string, handler: Function) {
  const handlerRef = useRef(handler);

  // Update handler ref on each render
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    // Create a stable callback that uses the ref
    const stableHandler = (data: any) => {
      handlerRef.current(data);
    };

    const cleanup = socketManager.on(event, stableHandler);

    return cleanup;
  }, [event]);
}

export function useSocketConnection() {
  useEffect(() => {
    // Connect on mount
    socketManager.connect();

    // Cleanup on unmount
    return () => {
      // Don't disconnect on unmount to maintain connection across pages
      // socketManager.disconnect();
    };
  }, []);

  return {
    isConnected: socketManager.isConnected,
    connectionId: socketManager.connectionId,
    connect: () => socketManager.connect(),
    disconnect: () => socketManager.disconnect(),
  };
}

export function useSocketEmit() {
  const emit = useCallback((event: string, data: any) => {
    socketManager.send(event, data);
  }, []);

  return emit;
}

export function useProjectSocket(projectId: string | null) {
  useEffect(() => {
    if (projectId) {
      socketManager.joinProject(projectId);

      return () => {
        socketManager.leaveProject(projectId);
      };
    }
  }, [projectId]);
}

export function useAgentSocket(agentId: string | null) {
  useEffect(() => {
    if (agentId) {
      socketManager.joinAgent(agentId);

      return () => {
        socketManager.leaveAgent(agentId);
      };
    }
  }, [agentId]);
}