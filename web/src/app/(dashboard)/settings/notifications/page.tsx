'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';

export default function NotificationSettingsPage() {
  return (
    <div>
      <Header title="알림 설정" />

      <div className="p-6 space-y-6 max-w-2xl">
        {/* Back Button */}
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            설정으로 돌아가기
          </Button>
        </Link>

        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold">알림 설정</h1>
          <p className="text-muted-foreground mt-1">
            알림 수신 방법과 유형을 관리합니다
          </p>
        </div>

        {/* Preferences Component */}
        <NotificationPreferences />
      </div>
    </div>
  );
}
