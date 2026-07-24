'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Mail, Clock, X } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MemberList } from '@/components/teams/MemberList';
import { InviteMemberModal } from '@/components/teams/InviteMemberModal';
import {
  useTeam,
  useTeamMembers,
  useTeamInvitations,
  useUpdateMemberRole,
  useRemoveMember,
  useCancelInvitation,
} from '@/hooks/useTeams';
import { useAuthStore } from '@/stores/authStore';
import type { TeamRole } from '@/types';

interface MembersPageProps {
  params: Promise<{ id: string }>;
}

export default function MembersPage({ params }: MembersPageProps) {
  const { id: teamId } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const { data: team, isLoading: teamLoading } = useTeam(teamId);
  const { data: members, isLoading: membersLoading } = useTeamMembers(teamId);
  const { data: invitations } = useTeamInvitations(teamId);

  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const cancelInvitation = useCancelInvitation();

  const currentMember = members?.find((m) => m.userId === user?.id);
  const currentUserRole = currentMember?.role;
  const isOwnerOrAdmin =
    currentUserRole === 'owner' || currentUserRole === 'admin';

  const pendingInvitations =
    invitations?.filter((inv) => inv.status === 'pending') ?? [];

  const handleUpdateRole = async (memberId: string, role: TeamRole) => {
    try {
      await updateRole.mutateAsync({
        teamId,
        memberId,
        data: { role },
      });
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('정말로 이 멤버를 팀에서 제거하시겠습니까?')) return;

    try {
      await removeMember.mutateAsync({ teamId, memberId });
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation.mutateAsync({ teamId, invitationId });
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
    }
  };

  if (teamLoading) {
    return (
      <div>
        <Header title="팀 멤버" />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div>
        <Header title="팀 멤버" />
        <div className="p-6 text-center py-16">
          <h2 className="text-xl font-semibold mb-2">팀을 찾을 수 없습니다</h2>
          <Button onClick={() => router.push('/teams')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            팀 목록으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title={`${team.name} - 멤버`} />

      <div className="p-6 space-y-6">
        {/* Back & Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 -ml-2"
              onClick={() => router.push(`/teams/${teamId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              팀 대시보드
            </Button>
            <h1 className="text-2xl font-bold">팀 멤버</h1>
            <p className="text-muted-foreground">
              {members?.length ?? 0}명의 멤버
            </p>
          </div>

          {isOwnerOrAdmin && (
            <Button onClick={() => setIsInviteModalOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              멤버 초대
            </Button>
          )}
        </div>

        {/* Pending Invitations */}
        {isOwnerOrAdmin && pendingInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                대기 중인 초대 ({pendingInvitations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{invitation.email}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {invitation.role === 'admin' ? '관리자' : '멤버'}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(invitation.expiresAt).toLocaleDateString(
                              'ko-KR'
                            )}{' '}
                            만료
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleCancelInvitation(invitation.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">멤버 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <MemberList
              members={members ?? []}
              currentUserRole={currentUserRole}
              onUpdateRole={handleUpdateRole}
              onRemoveMember={handleRemoveMember}
              isLoading={membersLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        teamId={teamId}
      />
    </div>
  );
}
