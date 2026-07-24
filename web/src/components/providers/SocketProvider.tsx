'use client';

import { useEffect } from 'react';
import { useSocketConnection } from '@/hooks/useSocket';
import { useAuthStore } from '@/stores/authStore';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, connect, disconnect } = useSocketConnection();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && !isConnected) {
      connect();
    } else if (!isAuthenticated && isConnected) {
      disconnect();
    }
  }, [isAuthenticated, isConnected, connect, disconnect]);

  return <>{children}</>;
}