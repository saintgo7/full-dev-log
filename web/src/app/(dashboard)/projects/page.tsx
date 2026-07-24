'use client';

import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { FolderKanban } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <div>
      <Header title="프로젝트" />

      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">프로젝트 기능 준비 중</h3>
            <p className="text-sm text-muted-foreground">
              곧 프로젝트별로 이벤트를 그룹화하고 관리할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
