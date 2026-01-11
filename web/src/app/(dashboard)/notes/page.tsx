'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/features/SearchBar';
import { useNotes, useCreateNote, useDeleteNote } from '@/hooks/useNotes';

export default function NotesPage() {
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: notes, isLoading } = useNotes(search);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const tagsStr = formData.get('tags') as string;
    const tags = tagsStr ? tagsStr.split(',').map((t) => t.trim()) : [];

    try {
      await createNote.mutateAsync({ title, content, tags });
      setShowCreateForm(false);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('메모를 삭제하시겠습니까?')) {
      await deleteNote.mutateAsync(id);
    }
  };

  return (
    <div>
      <Header title="메모" />

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center gap-4">
          <SearchBar
            onSearch={setSearch}
            placeholder="메모 검색..."
            className="w-80"
          />
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            메모 작성
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>새 메모</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">제목</label>
                  <Input name="title" placeholder="메모 제목" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">내용</label>
                  <textarea
                    name="content"
                    placeholder="메모 내용을 입력하세요..."
                    className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">태그</label>
                  <Input
                    name="tags"
                    placeholder="태그1, 태그2, 태그3 (쉼표로 구분)"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createNote.isPending}>
                    {createNote.isPending ? '저장 중...' : '저장'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    취소
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Notes Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : notes?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">메모가 없습니다</h3>
              <p className="text-sm text-muted-foreground mb-4">
                중요한 내용을 메모로 기록하세요.
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                메모 작성
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {notes?.map((note) => (
              <Card key={note.id} className="group">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <CardTitle className="text-lg font-medium line-clamp-1">
                    {note.title}
                  </CardTitle>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {note.content}
                  </p>
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(note.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
