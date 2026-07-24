'use client';

import Link from 'next/link';
import { Users, FolderKanban, StickyNote, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Team } from '@/types';
import { cn } from '@/lib/utils';

interface TeamCardProps {
  team: Team;
  className?: string;
}

export function TeamCard({ team, className }: TeamCardProps) {
  const memberCount = team._count?.members ?? 0;
  const projectCount = team._count?.projects ?? 0;
  const noteCount = team._count?.sharedNotes ?? 0;

  return (
    <Link href={`/teams/${team.id}`}>
      <Card
        className={cn(
          'hover:bg-accent/50 transition-colors cursor-pointer group',
          className
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold truncate">
            {team.name}
          </CardTitle>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </CardHeader>
        <CardContent>
          {team.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {team.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{memberCount} 멤버</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FolderKanban className="h-4 w-4" />
              <span>{projectCount} 프로젝트</span>
            </div>
            <div className="flex items-center gap-1.5">
              <StickyNote className="h-4 w-4" />
              <span>{noteCount} 노트</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {team.owner.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {team.owner.name}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
