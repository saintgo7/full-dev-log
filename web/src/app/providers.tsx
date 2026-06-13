'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { createQueryClient } from '@/lib/queryClient';

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient once on mount with optimized configuration
  const [queryClient] = useState(() => createQueryClient());

  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    api.setToken(accessToken);
  }, [accessToken]);

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>{children}</SocketProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
