'use client';

import { useState } from 'react';
import { X, Shield, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInviteMember } from '@/hooks/useTeams';
import type { TeamRole } from '@/types';
import { cn } from '@/lib/utils';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onSuccess?: () => void;
}

const roleOptions: Array<{
  value: TeamRole;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    value: 'admin',
    label: '관리자',
    description: '멤버 관리 및 팀 설정 수정 가능',
    icon: ShieldCheck,
  },
  {
    value: 'member',
    label: '멤버',
    description: '기본 권한, 노트 작성 및 조회 가능',
    icon: Shield,
  },
];

export function InviteMemberModal({
  isOpen,
  onClose,
  teamId,
  onSuccess,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('member');
  const inviteMember = useInviteMember();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    try {
      await inviteMember.mutateAsync({
        teamId,
        data: {
          email: email.trim(),
          role,
        },
      });
      setEmail('');
      setRole('member');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to invite member:', error);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('member');
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
        <h2 className="text-xl font-semibold mb-4">멤버 초대</h2>
        <p className="text-sm text-muted-foreground mb-4">
          초대할 멤버의 이메일 주소를 입력하세요. 초대 링크가 이메일로 전송됩니다.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              이메일 주소 <span className="text-destructive">*</span>
            </label>
            <Input
              id="email"
              type="email"
              placeholder="member@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">역할 선택</label>
            <div className="space-y-2">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.value}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      role === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent/50'
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={role === option.value}
                      onChange={(e) => setRole(e.target.value as TeamRole)}
                      className="sr-only"
                    />
                    <Icon
                      className={cn(
                        'h-5 w-5 mt-0.5',
                        role === option.value
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    />
                    <div className="flex-1">
                      <p
                        className={cn(
                          'font-medium',
                          role === option.value ? 'text-primary' : ''
                        )}
                      >
                        {option.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border-2 mt-0.5',
                        role === option.value
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      )}
                    >
                      {role === option.value && (
                        <div className="w-full h-full rounded-full bg-primary-foreground scale-50" />
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button
              type="submit"
              disabled={!email.trim() || inviteMember.isPending}
            >
              {inviteMember.isPending ? '전송 중...' : '초대 전송'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
