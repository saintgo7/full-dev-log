'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Loader2,
  Hash,
  MessageSquare,
  Webhook,
  AlertTriangle,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { IntegrationCard } from '@/components/teams/IntegrationCard';
import { AddIntegrationModal } from '@/components/teams/AddIntegrationModal';
import { useTeam, useUpdateTeam, useDeleteTeam } from '@/hooks/useTeams';
import {
  useIntegrations,
  useTestIntegration,
  useDeleteIntegration,
} from '@/hooks/useIntegrations';
import type { Integration } from '@/types';

interface TeamSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default function TeamSettingsPage({ params }: TeamSettingsPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIntegration, setEditingIntegration] =
    useState<Integration | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: team, isLoading: teamLoading } = useTeam(id);
  const { data: integrations, isLoading: integrationsLoading } =
    useIntegrations(id);
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const testIntegration = useTestIntegration();
  const deleteIntegration = useDeleteIntegration();

  // Initialize form values when team loads
  if (team && !teamName && !teamDescription) {
    setTeamName(team.name);
    setTeamDescription(team.description || '');
  }

  const handleUpdateTeam = async () => {
    if (!teamName.trim()) return;

    try {
      await updateTeam.mutateAsync({
        id,
        data: {
          name: teamName.trim(),
          description: teamDescription.trim() || undefined,
        },
      });
    } catch (error) {
      console.error('Failed to update team:', error);
    }
  };

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam.mutateAsync(id);
      router.push('/teams');
    } catch (error) {
      console.error('Failed to delete team:', error);
    }
  };

  const handleTestIntegration = (integrationId: string) => {
    testIntegration.mutate({ teamId: id, integrationId });
  };

  const handleEditIntegration = (integration: Integration) => {
    setEditingIntegration(integration);
    setShowAddModal(true);
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    try {
      await deleteIntegration.mutateAsync({ teamId: id, integrationId });
    } catch (error) {
      console.error('Failed to delete integration:', error);
    }
  };

  if (teamLoading) {
    return (
      <div>
        <Header title="팀 설정" />
        <div className="p-6">
          <div className="animate-pulse space-y-6 max-w-2xl">
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="h-40 bg-muted rounded-lg" />
            <div className="h-40 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div>
        <Header title="팀 설정" />
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

  return (
    <div>
      <Header title={`${team.name} 설정`} />

      <div className="p-6 space-y-6 max-w-3xl">
        {/* Back Button */}
        <Link href={`/teams/${id}`}>
          <Button variant="ghost" size="sm" className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            팀으로 돌아가기
          </Button>
        </Link>

        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold">팀 설정</h1>
          <p className="text-muted-foreground mt-1">
            팀 정보 및 연동 설정을 관리합니다
          </p>
        </div>

        {/* Team Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">팀 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="teamName" className="block text-sm font-medium mb-1.5">
                팀 이름 <span className="text-destructive">*</span>
              </label>
              <Input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                maxLength={50}
              />
            </div>
            <div>
              <label
                htmlFor="teamDescription"
                className="block text-sm font-medium mb-1.5"
              >
                설명
              </label>
              <textarea
                id="teamDescription"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                maxLength={200}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleUpdateTeam}
                disabled={
                  !teamName.trim() ||
                  (teamName === team.name &&
                    teamDescription === (team.description || '')) ||
                  updateTeam.isPending
                }
              >
                {updateTeam.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  '변경사항 저장'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">연동</CardTitle>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              연동 추가
            </Button>
          </CardHeader>
          <CardContent>
            {integrationsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : integrations && integrations.length > 0 ? (
              <div className="space-y-3">
                {integrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onTest={handleTestIntegration}
                    onEdit={handleEditIntegration}
                    onDelete={handleDeleteIntegration}
                    isTestPending={testIntegration.isPending}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center gap-2 mb-3 text-muted-foreground/50">
                  <Hash className="h-8 w-8" />
                  <MessageSquare className="h-8 w-8" />
                  <Webhook className="h-8 w-8" />
                </div>
                <p className="text-muted-foreground mb-4">
                  아직 연동이 없습니다
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  첫 연동 추가하기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              위험 구역
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg">
              <div>
                <p className="font-medium">팀 삭제</p>
                <p className="text-sm text-muted-foreground">
                  팀과 모든 관련 데이터가 영구적으로 삭제됩니다
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                팀 삭제
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <div className="relative w-full max-w-md bg-background rounded-lg shadow-lg p-6 mx-4">
              <h3 className="text-lg font-semibold mb-2">팀 삭제 확인</h3>
              <p className="text-muted-foreground mb-4">
                정말로 <strong>{team.name}</strong> 팀을 삭제하시겠습니까? 이
                작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteTeam}
                  disabled={deleteTeam.isPending}
                >
                  {deleteTeam.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      삭제 중...
                    </>
                  ) : (
                    '삭제'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Integration Modal */}
        <AddIntegrationModal
          isOpen={showAddModal}
          teamId={id}
          onClose={() => {
            setShowAddModal(false);
            setEditingIntegration(null);
          }}
          editingIntegration={editingIntegration}
        />
      </div>
    </div>
  );
}
