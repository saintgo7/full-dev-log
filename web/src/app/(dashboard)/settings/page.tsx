'use client';

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
