'use client';

import Link from 'next/link';
import { Bell, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <Header title="설정" />

      <div className="p-6 space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>프로필</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  이름
                </label>
                <p className="mt-1">{user?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  이메일
                </label>
                <p className="mt-1">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  역할
                </label>
                <p className="mt-1 capitalize">{user?.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings Link */}
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <Link href="/settings/notifications">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">알림 설정</p>
                  <p className="text-sm text-muted-foreground">
                    알림 수신 방법과 유형을 관리합니다
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>앱 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">버전</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GitHub</span>
              <a
                href="https://github.com/saintgo7/full-dev-log"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                saintgo7/full-dev-log
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
