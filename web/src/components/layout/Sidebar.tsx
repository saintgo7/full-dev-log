'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Clock,
  FolderKanban,
  Settings,
  StickyNote,
  Search,
  Cpu,
  Terminal,
  FileText,
  Brain,
  Users,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/timeline', label: '타임라인', icon: Clock },
  { href: '/terminal', label: '터미널', icon: Terminal },
  { href: '/reports', label: '리포트', icon: FileText },
  { href: '/insights', label: 'AI 인사이트', icon: Brain },
  { href: '/search', label: '검색', icon: Search },
  { href: '/projects', label: '프로젝트', icon: FolderKanban },
  { href: '/teams', label: '팀', icon: Users },
  { href: '/notes', label: '메모', icon: StickyNote },
  { href: '/notifications', label: '알림', icon: Bell },
  { href: '/agents', label: '에이전트', icon: Cpu },
  { href: '/settings', label: '설정', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-card h-screen sticky top-0">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">D</span>
          </div>
          <span className="font-semibold text-lg">DevLog Hub</span>
        </Link>
      </div>

      <nav className="px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
