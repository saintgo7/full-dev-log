'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Activity,
  StickyNote,
  FolderKanban,
  Settings,
  ChevronRight,
  ArrowLeft,
  Crown,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/features/StatsCard';
import { useTeam, useTeamMembers, useTeamActivity, useTeamNotes } from '@/hooks/useTeams';
import { useAuthStore } from '@/stores/authStore';
import type { TeamMember } from '@/types';

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export default function TeamPage({ params }: TeamPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: team, isLoading: teamLoading } = useTeam(id);
  const { data: members, isLoading: membersLoading } = useTeamMembers(id);
  const { data: activityData } = useTeamActivity(id, { limit: 5 });
  const { data: notesData } = useTeamNotes(id, { limit: 5 });

  const activities = activityData?.pages.flatMap((page) => page.items) ?? [];
  const notes = notesData?.pages.flatMap((page) => page.items) ?? [];

  const currentMember = members?.find((m) => m.userId === user?.id);
  const isOwnerOrAdmin =
    currentMember?.role === 'owner' || currentMember?.role === 'admin';

  if (teamLoading) {
    return (
      <div>
        <Header title="팀" />
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div>
        <Header title="팀" />
        <div className="p-6 text-center py-16">
          <h2 className="text-xl font-semibold mb-2">팀을 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mb-4">
            삭제되었거나 접근 권한이 없는 팀입니다.
          </p>
          <Button onClick={() => router.push('/teams')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            팀 목록으로
          </Button>
        </div>
      </div>
    );
  }

  const memberCount = team._count?.members ?? members?.length ?? 0;
  const projectCount = team._count?.projects ?? 0;
  const noteCount = team._count?.sharedNotes ?? 0;

  const quickLinks = [
    {
      href: `/teams/${id}/members`,
      icon: Users,
      title: '멤버',
      description: `${memberCount}명의 팀원`,
      color: 'text-blue-500',
    },
    {
      href: `/teams/${id}/activity`,
      icon: Activity,
      title: '활동',
      description: '최근 팀 활동',
      color: 'text-green-500',
    },
    {
      href: `/teams/${id}/notes`,
      icon: StickyNote,
      title: '공유 노트',
      description: `${noteCount}개의 노트`,
      color: 'text-yellow-500',
    },
  ];

  return (
    <div>
      <Header title={team.name} />

      <div className="p-6 space-y-6">
        {/* Back Button & Team Info */}
        <div className="flex items-start justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 -ml-2"
              onClick={() => router.push('/teams')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              팀 목록
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {team.name}
              {currentMember?.role === 'owner' && (
                <Crown className="h-5 w-5 text-yellow-500" />
              )}
            </h1>
            {team.description && (
              <p className="text-muted-foreground mt-1">{team.description}</p>
            )}
          </div>

          {isOwnerOrAdmin && (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              팀 설정
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="멤버"
            value={memberCount}
            description="팀원 수"
            icon={<Users className="h-4 w-4" />}
          />
          <StatsCard
            title="프로젝트"
            value={projectCount}
            description="연결된 프로젝트"
            icon={<FolderKanban className="h-4 w-4" />}
          />
          <StatsCard
            title="공유 노트"
            value={noteCount}
            description="팀 노트"
            icon={<StickyNote className="h-4 w-4" />}
          />
          <StatsCard
            title="최근 활동"
            value={activities.length}
            description="최근 5개"
            icon={<Activity className="h-4 w-4" />}
          />
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg bg-muted ${link.color}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{link.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {link.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Recent Activity & Members */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Members */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">팀 멤버</CardTitle>
              <Link
                href={`/teams/${id}/members`}
                className="text-sm text-primary hover:underline"
              >
                전체 보기
              </Link>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 animate-pulse"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-3 w-32 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {members?.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {member.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.user.email}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {member.role === 'owner'
                          ? '오너'
                          : member.role === 'admin'
                          ? '관리자'
                          : '멤버'}
                      </Badge>
                    </div>
                  ))}
                  {members?.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      아직 팀원이 없습니다
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">최근 공유 노트</CardTitle>
              <Link
                href={`/teams/${id}/notes`}
                className="text-sm text-primary hover:underline"
              >
                전체 보기
              </Link>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  아직 공유된 노트가 없습니다
                </p>
              ) : (
                <div className="space-y-3">
                  {notes.slice(0, 5).map((note) => (
                    <div key={note.id} className="p-3 rounded-lg border">
                      <p className="font-medium text-sm truncate">
                        {note.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {note.content}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="text-[10px]">
                            {note.author.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{note.author.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
