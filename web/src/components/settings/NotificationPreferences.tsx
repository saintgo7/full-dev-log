'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Bell,
  Smartphone,
  FileText,
  Users,
  AtSign,
  AlertTriangle,
  Info,
  Moon,
  Save,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/useNotifications';
import type { NotificationPreferences as NotificationPreferencesType } from '@/types';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

function ToggleSwitch({
  enabled,
  onChange,
  label,
  description,
  icon,
  disabled,
}: ToggleSwitchProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border transition-colors',
        !disabled && 'hover:bg-muted/50 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => !disabled && onChange(!enabled)}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-lg bg-muted">{icon}</div>
        )}
        <div>
          <p className="font-medium text-sm">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          enabled ? 'bg-primary' : 'bg-muted'
        )}
        onClick={(e) => {
          e.stopPropagation();
          !disabled && onChange(!enabled);
        }}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out',
            enabled ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}

export function NotificationPreferences() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  const [localPrefs, setLocalPrefs] = useState<NotificationPreferencesType | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (preferences && !localPrefs) {
      setLocalPrefs(preferences);
    }
  }, [preferences, localPrefs]);

  const handleChannelChange = (
    channel: 'email' | 'push' | 'inApp',
    enabled: boolean
  ) => {
    if (!localPrefs) return;
    setLocalPrefs({
      ...localPrefs,
      channels: { ...localPrefs.channels, [channel]: enabled },
    });
    setHasChanges(true);
  };

  const handleTypeChange = (
    type: 'report' | 'team' | 'mention' | 'alert' | 'system',
    enabled: boolean
  ) => {
    if (!localPrefs) return;
    setLocalPrefs({
      ...localPrefs,
      types: { ...localPrefs.types, [type]: enabled },
    });
    setHasChanges(true);
  };

  const handleQuietHoursToggle = (enabled: boolean) => {
    if (!localPrefs) return;
    setLocalPrefs({
      ...localPrefs,
      quietHoursEnabled: enabled,
    });
    setHasChanges(true);
  };

  const handleQuietHoursChange = (field: 'start' | 'end', value: string) => {
    if (!localPrefs) return;
    setLocalPrefs({
      ...localPrefs,
      [field === 'start' ? 'quietHoursStart' : 'quietHoursEnd']: value,
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localPrefs) return;

    try {
      await updatePreferences.mutateAsync({
        channels: localPrefs.channels,
        types: localPrefs.types,
        quietHoursEnabled: localPrefs.quietHoursEnabled,
        quietHoursStart: localPrefs.quietHoursStart,
        quietHoursEnd: localPrefs.quietHoursEnd,
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  if (isLoading || !localPrefs) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-14 bg-muted rounded animate-pulse" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">알림 채널</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleSwitch
            enabled={localPrefs.channels.email}
            onChange={(enabled) => handleChannelChange('email', enabled)}
            label="이메일"
            description="중요한 알림을 이메일로 받습니다"
            icon={<Mail className="h-4 w-4" />}
          />
          <ToggleSwitch
            enabled={localPrefs.channels.push}
            onChange={(enabled) => handleChannelChange('push', enabled)}
            label="푸시 알림"
            description="브라우저 푸시 알림을 받습니다"
            icon={<Smartphone className="h-4 w-4" />}
          />
          <ToggleSwitch
            enabled={localPrefs.channels.inApp}
            onChange={(enabled) => handleChannelChange('inApp', enabled)}
            label="앱 내 알림"
            description="앱 내에서 알림을 확인합니다"
            icon={<Bell className="h-4 w-4" />}
          />
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">알림 유형</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleSwitch
            enabled={localPrefs.types.report}
            onChange={(enabled) => handleTypeChange('report', enabled)}
            label="리포트"
            description="리포트 생성 완료, 공유 등의 알림"
            icon={<FileText className="h-4 w-4 text-blue-500" />}
          />
          <ToggleSwitch
            enabled={localPrefs.types.team}
            onChange={(enabled) => handleTypeChange('team', enabled)}
            label="팀"
            description="팀 초대, 멤버 변경 등의 알림"
            icon={<Users className="h-4 w-4 text-green-500" />}
          />
          <ToggleSwitch
            enabled={localPrefs.types.mention}
            onChange={(enabled) => handleTypeChange('mention', enabled)}
            label="멘션"
            description="노트나 댓글에서 멘션되었을 때 알림"
            icon={<AtSign className="h-4 w-4 text-purple-500" />}
          />
          <ToggleSwitch
            enabled={localPrefs.types.alert}
            onChange={(enabled) => handleTypeChange('alert', enabled)}
            label="알림"
            description="이상 패턴 감지, 경고 등의 알림"
            icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
          />
          <ToggleSwitch
            enabled={localPrefs.types.system}
            onChange={(enabled) => handleTypeChange('system', enabled)}
            label="시스템"
            description="유지보수, 업데이트 등의 시스템 알림"
            icon={<Info className="h-4 w-4 text-gray-500" />}
          />
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">방해 금지 시간</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleSwitch
            enabled={localPrefs.quietHoursEnabled}
            onChange={handleQuietHoursToggle}
            label="방해 금지 모드 활성화"
            description="지정된 시간 동안 알림을 받지 않습니다"
            icon={<Moon className="h-4 w-4" />}
          />
          {localPrefs.quietHoursEnabled && (
            <div className="flex items-center gap-4 pl-12">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">시작</label>
                <Input
                  type="time"
                  value={localPrefs.quietHoursStart || '22:00'}
                  onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                  className="w-28"
                />
              </div>
              <span className="text-muted-foreground">~</span>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">종료</label>
                <Input
                  type="time"
                  value={localPrefs.quietHoursEnd || '08:00'}
                  onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                  className="w-28"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updatePreferences.isPending}
        >
          {updatePreferences.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              설정 저장
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
