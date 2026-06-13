'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pin, FolderKanban, Loader2, X } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SharedNoteCard } from '@/components/teams/SharedNoteCard';
import {
  useTeam,
  useTeamMembers,
  useTeamNotes,
  useCreateNote,
  useDeleteNote,
  useTogglePinNote,
} from '@/hooks/useTeams';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface NotesPageProps {
  params: Promise<{ id: string }>;
}

export default function NotesPage({ params }: NotesPageProps) {
  const { id: teamId } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();

  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });

  const { data: team, isLoading: teamLoading } = useTeam(teamId);
  const { data: members } = useTeamMembers(teamId);
  const {
    data: notesData,
    isLoading: notesLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTeamNotes(teamId, {
    isPinned: showPinnedOnly ? true : undefined,
    limit: 12,
  });

  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const togglePinNote = useTogglePinNote();

  const notes = notesData?.pages.flatMap((page) => page.items) ?? [];
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const unpinnedNotes = notes.filter((n) => !n.isPinned);

  const currentMember = members?.find((m) => m.userId === user?.id);
  const canManage =
    currentMember?.role === 'owner' || currentMember?.role === 'admin';

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    try {
      await createNote.mutateAsync({
        teamId,
        data: {
          title: newNote.title.trim(),
          content: newNote.content.trim(),
        },
      });
      setNewNote({ title: '', content: '' });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleTogglePin = async (noteId: string) => {
    try {
      await togglePinNote.mutateAsync({ teamId, noteId });
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('정말로 이 노트를 삭제하시겠습니까?')) return;

    try {
      await deleteNote.mutateAsync({ teamId, noteId });
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  if (teamLoading) {
    return (
      <div>
        <Header title="공유 노트" />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-muted rounded-lg" />
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
        <Header title="공유 노트" />
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
      <Header title={`${team.name} - 공유 노트`} />

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
            <h1 className="text-2xl font-bold">공유 노트</h1>
            <p className="text-muted-foreground">
              {notes.length}개의 노트
            </p>
          </div>

          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            노트 작성
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Badge
            variant={!showPinnedOnly ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setShowPinnedOnly(false)}
          >
            전체
          </Badge>
          <Badge
            variant={showPinnedOnly ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setShowPinnedOnly(true)}
          >
            <Pin className="h-3 w-3 mr-1" />
            고정된 노트
          </Badge>
        </div>

        {/* Loading */}
        {notesLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!notesLoading && notes.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {showPinnedOnly
                ? '고정된 노트가 없습니다'
                : '아직 공유된 노트가 없습니다'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              {showPinnedOnly
                ? '노트를 고정하면 여기에 표시됩니다.'
                : '팀과 공유할 노트를 작성해보세요.'}
            </p>
            {!showPinnedOnly && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                첫 번째 노트 작성
              </Button>
            )}
          </div>
        )}

        {/* Pinned Notes Section */}
        {!showPinnedOnly && pinnedNotes.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Pin className="h-4 w-4" />
              고정된 노트
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pinnedNotes.map((note) => (
                <SharedNoteCard
                  key={note.id}
                  note={note}
                  canManage={canManage || note.author.id === user?.id}
                  onTogglePin={handleTogglePin}
                  onDelete={handleDeleteNote}
                />
              ))}
            </div>
          </div>
        )}

        {/* All/Unpinned Notes */}
        {notes.length > 0 && (
          <div>
            {!showPinnedOnly && pinnedNotes.length > 0 && (
              <h2 className="text-lg font-semibold mb-4">모든 노트</h2>
            )}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(showPinnedOnly ? notes : unpinnedNotes).map((note) => (
                <SharedNoteCard
                  key={note.id}
                  note={note}
                  canManage={canManage || note.author.id === user?.id}
                  onTogglePin={handleTogglePin}
                  onDelete={handleDeleteNote}
                />
              ))}
            </div>

            {/* Load More */}
            {hasNextPage && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      로딩 중...
                    </>
                  ) : (
                    '더 보기'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Note Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-background rounded-lg shadow-lg p-6 mx-4">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-semibold mb-4">새 노트 작성</h2>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium mb-1.5"
                >
                  제목 <span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  type="text"
                  placeholder="노트 제목을 입력하세요"
                  value={newNote.title}
                  onChange={(e) =>
                    setNewNote({ ...newNote, title: e.target.value })
                  }
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-medium mb-1.5"
                >
                  내용 <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="content"
                  placeholder="노트 내용을 입력하세요"
                  value={newNote.content}
                  onChange={(e) =>
                    setNewNote({ ...newNote, content: e.target.value })
                  }
                  required
                  rows={6}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !newNote.title.trim() ||
                    !newNote.content.trim() ||
                    createNote.isPending
                  }
                >
                  {createNote.isPending ? '저장 중...' : '저장'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
