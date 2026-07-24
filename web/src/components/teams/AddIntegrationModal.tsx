'use client';

import { useState } from 'react';
import {
  X,
  Hash,
  MessageSquare,
  Webhook,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCreateIntegration, useTestIntegration } from '@/hooks/useIntegrations';
import type { IntegrationType, Integration, CreateIntegrationParams } from '@/types';

interface AddIntegrationModalProps {
  isOpen: boolean;
  teamId: string;
  onClose: () => void;
  onSuccess?: () => void;
  editingIntegration?: Integration | null;
}

const integrationTypes: {
  type: IntegrationType;
  label: string;
  icon: typeof Hash;
  color: string;
  bgColor: string;
  placeholder: string;
}[] = [
  {
    type: 'slack',
    label: 'Slack',
    icon: Hash,
    color: 'text-[#4A154B]',
    bgColor: 'bg-[#4A154B]/10',
    placeholder: 'https://hooks.slack.com/services/...',
  },
  {
    type: 'discord',
    label: 'Discord',
    icon: MessageSquare,
    color: 'text-[#5865F2]',
    bgColor: 'bg-[#5865F2]/10',
    placeholder: 'https://discord.com/api/webhooks/...',
  },
  {
    type: 'webhook',
    label: 'Custom Webhook',
    icon: Webhook,
    color: 'text-gray-600',
    bgColor: 'bg-gray-600/10',
    placeholder: 'https://your-webhook-url.com/...',
  },
];

const availableEvents = [
  { id: 'member_joined', label: '멤버 가입' },
  { id: 'member_left', label: '멤버 탈퇴' },
  { id: 'note_created', label: '노트 생성' },
  { id: 'note_updated', label: '노트 수정' },
  { id: 'report_generated', label: '리포트 생성' },
  { id: 'anomaly_detected', label: '이상 패턴 감지' },
];

export function AddIntegrationModal({
  isOpen,
  teamId,
  onClose,
  onSuccess,
  editingIntegration,
}: AddIntegrationModalProps) {
  const [selectedType, setSelectedType] = useState<IntegrationType>(
    editingIntegration?.type || 'slack'
  );
  const [name, setName] = useState(editingIntegration?.name || '');
  const [webhookUrl, setWebhookUrl] = useState(
    editingIntegration?.webhookUrl || ''
  );
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    editingIntegration?.events || ['member_joined', 'note_created']
  );
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const createIntegration = useCreateIntegration();
  const testIntegration = useTestIntegration();

  const handleClose = () => {
    setSelectedType('slack');
    setName('');
    setWebhookUrl('');
    setSelectedEvents(['member_joined', 'note_created']);
    setTestResult(null);
    onClose();
  };

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    );
  };

  const handleTest = async () => {
    // For testing, we would normally need an existing integration ID
    // Since this is a new integration, we'll simulate a test
    setTestResult(null);

    // Validate URL format based on type
    let isValid = false;
    if (selectedType === 'slack') {
      isValid = webhookUrl.startsWith('https://hooks.slack.com/');
    } else if (selectedType === 'discord') {
      isValid = webhookUrl.startsWith('https://discord.com/api/webhooks/');
    } else {
      isValid = webhookUrl.startsWith('https://');
    }

    if (!isValid) {
      setTestResult({
        success: false,
        message: 'Invalid webhook URL format for ' + selectedType,
      });
      return;
    }

    // Simulate successful test
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setTestResult({
      success: true,
      message: 'Webhook URL format is valid',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !webhookUrl.trim() || selectedEvents.length === 0) {
      return;
    }

    try {
      await createIntegration.mutateAsync({
        teamId,
        data: {
          type: selectedType,
          name: name.trim(),
          webhookUrl: webhookUrl.trim(),
          events: selectedEvents,
        },
      });
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Failed to create integration:', error);
    }
  };

  if (!isOpen) return null;

  const selectedTypeConfig = integrationTypes.find(
    (t) => t.type === selectedType
  )!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-background rounded-lg shadow-lg p-6 mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <h2 className="text-xl font-semibold mb-4">
          {editingIntegration ? '연동 수정' : '새 연동 추가'}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Integration Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              연동 유형 <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {integrationTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.type}
                    type="button"
                    className={cn(
                      'p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-2',
                      selectedType === type.type
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-muted/50 hover:bg-muted'
                    )}
                    onClick={() => setSelectedType(type.type)}
                  >
                    <div className={cn('p-2 rounded-lg', type.bgColor)}>
                      <Icon className={cn('h-5 w-5', type.color)} />
                    </div>
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5">
              연동 이름 <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              type="text"
              placeholder="예: 개발팀 알림"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
            />
          </div>

          {/* Webhook URL Input */}
          <div>
            <label
              htmlFor="webhookUrl"
              className="block text-sm font-medium mb-1.5"
            >
              Webhook URL <span className="text-destructive">*</span>
            </label>
            <Input
              id="webhookUrl"
              type="url"
              placeholder={selectedTypeConfig.placeholder}
              value={webhookUrl}
              onChange={(e) => {
                setWebhookUrl(e.target.value);
                setTestResult(null);
              }}
              required
            />
            {/* Test Button and Result */}
            <div className="flex items-center gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={!webhookUrl.trim()}
              >
                URL 테스트
              </Button>
              {testResult && (
                <span
                  className={cn(
                    'text-sm flex items-center gap-1',
                    testResult.success ? 'text-green-600' : 'text-destructive'
                  )}
                >
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {testResult.message}
                </span>
              )}
            </div>
          </div>

          {/* Event Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              알림 이벤트 <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableEvents.map((event) => (
                <label
                  key={event.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors',
                    selectedEvents.includes(event.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:bg-muted/50'
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedEvents.includes(event.id)}
                    onChange={() => handleEventToggle(event.id)}
                  />
                  <div
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center',
                      selectedEvents.includes(event.id)
                        ? 'bg-primary border-primary'
                        : 'border-input'
                    )}
                  >
                    {selectedEvents.includes(event.id) && (
                      <svg
                        className="w-3 h-3 text-primary-foreground"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">{event.label}</span>
                </label>
              ))}
            </div>
            {selectedEvents.length === 0 && (
              <p className="text-xs text-destructive mt-1">
                최소 하나의 이벤트를 선택해주세요
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button
              type="submit"
              disabled={
                !name.trim() ||
                !webhookUrl.trim() ||
                selectedEvents.length === 0 ||
                createIntegration.isPending
              }
            >
              {createIntegration.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : editingIntegration ? (
                '저장'
              ) : (
                '추가'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
