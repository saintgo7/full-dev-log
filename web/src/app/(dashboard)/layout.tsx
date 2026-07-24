'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { NotificationToast } from '@/components/realtime/NotificationToast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">{children}</main>
      <NotificationToast />
    </div>
  );
}
