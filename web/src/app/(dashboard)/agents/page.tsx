'use client';

import { useState } from 'react';
import { Cpu, Copy, RefreshCw, Trash2, Plus, Check } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAgents, useCreateAgent, useRegenerateToken, useDeleteAgent } from '@/hooks/useAgents';

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents();
  const createAgent = useCreateAgent();
  const regenerateToken = useRegenerateToken();
  const deleteAgent = useDeleteAgent();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const machineId = `machine-${Date.now()}`;
    const os = (formData.get('os') as 'darwin' | 'windows' | 'linux') || 'darwin';

    try {
      await createAgent.mutateAsync({ name, machineId, os });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  };

  const handleCopyToken = async (agentId: string, token: string) => {
    await navigator.clipboard.writeText(token);
    setCopiedId(agentId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = async (id: string) => {
    if (confirm('토큰을 재생성하면 기존 토큰은 더 이상 사용할 수 없습니다. 계속하시겠습니까?')) {
      await regenerateToken.mutateAsync(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('에이전트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      await deleteAgent.mutateAsync(id);
    }
  };

  return (
    <div>
      <Header title="에이전트" />

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            로컬 에이전트를 관리하고 API 토큰을 설정합니다.
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            에이전트 추가
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>새 에이전트 등록</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">이름</label>
                    <Input name="name" placeholder="My Laptop" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">운영체제</label>
                    <select
                      name="os"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="darwin">macOS</option>
                      <option value="windows">Windows</option>
                      <option value="linux">Linux</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createAgent.isPending}>
                    {createAgent.isPending ? '생성 중...' : '생성'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    취소
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Agents List */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : agents?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Cpu className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">등록된 에이전트가 없습니다</h3>
              <p className="text-sm text-muted-foreground mb-4">
                에이전트를 추가하여 개발 활동을 수집하세요.
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                에이전트 추가
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {agents?.map((agent) => (
              <Card key={agent.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">{agent.name}</CardTitle>
                  <Badge
                    variant={agent.status === 'active' ? 'default' : 'secondary'}
                  >
                    {agent.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">OS:</span>
                      <span className="ml-2">{agent.os}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">마지막 동기화:</span>
                      <span className="ml-2">
                        {agent.lastSyncAt
                          ? new Date(agent.lastSyncAt).toLocaleString('ko-KR')
                          : '없음'}
                      </span>
                    </div>
                  </div>

                  {agent.apiToken && (
                    <div className="flex items-center gap-2 p-2 rounded bg-muted">
                      <code className="text-xs flex-1 truncate font-mono">
                        {agent.apiToken.substring(0, 20)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyToken(agent.id, agent.apiToken!)}
                      >
                        {copiedId === agent.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerate(agent.id)}
                      disabled={regenerateToken.isPending}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      토큰 재생성
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(agent.id)}
                      disabled={deleteAgent.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      삭제
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
