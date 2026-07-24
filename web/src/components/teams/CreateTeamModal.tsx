'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateTeam } from '@/hooks/useTeams';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateTeamModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTeamModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const createTeam = useCreateTeam();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    try {
      await createTeam.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName('');
      setDescription('');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-background rounded-lg shadow-lg p-6 mx-4">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <h2 className="text-xl font-semibold mb-4">새 팀 만들기</h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5">
              팀 이름 <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              type="text"
              placeholder="팀 이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1.5"
            >
              설명
            </label>
            <textarea
              id="description"
              placeholder="팀에 대한 간단한 설명을 입력하세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {description.length}/200
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createTeam.isPending}
            >
              {createTeam.isPending ? '생성 중...' : '팀 만들기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
