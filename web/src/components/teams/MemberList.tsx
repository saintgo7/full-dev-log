'use client';

import { useState } from 'react';
import { MoreHorizontal, Shield, ShieldCheck, Crown, UserMinus, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TeamMember, TeamRole } from '@/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

interface MemberListProps {
  members: TeamMember[];
  currentUserRole?: TeamRole;
  onUpdateRole?: (memberId: string, role: TeamRole) => void;
  onRemoveMember?: (memberId: string) => void;
  isLoading?: boolean;
}

const roleConfig: Record<
  TeamRole,
  { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'outline' }
> = {
  owner: { label: '오너', icon: Crown, variant: 'default' },
  admin: { label: '관리자', icon: ShieldCheck, variant: 'secondary' },
  member: { label: '멤버', icon: Shield, variant: 'outline' },
};

export function MemberList({
  members,
  currentUserRole,
  onUpdateRole,
  onRemoveMember,
  isLoading,
}: MemberListProps) {
  const { user } = useAuthStore();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  const handleRoleChange = (memberId: string, newRole: TeamRole) => {
    onUpdateRole?.(memberId, newRole);
    setOpenDropdown(null);
  };

  const handleRemove = (memberId: string) => {
    onRemoveMember?.(memberId);
    setOpenDropdown(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted animate-pulse">
            <div className="w-10 h-10 rounded-full bg-muted-foreground/20" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted-foreground/20 rounded" />
              <div className="h-3 w-48 bg-muted-foreground/20 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const config = roleConfig[member.role];
        const Icon = config.icon;
        const isCurrentUser = member.userId === user?.id;
        const canModify =
          canManageMembers &&
          !isCurrentUser &&
          member.role !== 'owner' &&
          (currentUserRole === 'owner' || member.role !== 'admin');

        return (
          <div
            key={member.id}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {member.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{member.user.name}</span>
                {isCurrentUser && (
                  <span className="text-xs text-muted-foreground">(나)</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {member.user.email}
              </p>
            </div>

            <Badge variant={config.variant} className="flex items-center gap-1">
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>

            {canModify && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setOpenDropdown(openDropdown === member.id ? null : member.id)
                  }
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>

                {openDropdown === member.id && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setOpenDropdown(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-popover p-1 shadow-md z-50">
                      {currentUserRole === 'owner' && member.role !== 'admin' && (
                        <button
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                          onClick={() => handleRoleChange(member.id, 'admin')}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          관리자로 변경
                        </button>
                      )}
                      {currentUserRole === 'owner' && member.role === 'admin' && (
                        <button
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                          onClick={() => handleRoleChange(member.id, 'member')}
                        >
                          <Shield className="h-4 w-4" />
                          멤버로 변경
                        </button>
                      )}
                      <button
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemove(member.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                        팀에서 제거
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {members.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          아직 팀원이 없습니다.
        </div>
      )}
    </div>
  );
}
