'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import {
  useNotificationStore,
  type Notification,
  type NotificationType
} from '@/hooks/useNotification';
import {
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  XCircleIcon,
  XIcon,
  Volume2Icon,
  VolumeXIcon
} from 'lucide-react';

// Icon mapping for notification types
const ICONS: Record<NotificationType, typeof InfoIcon> = {
  info: InfoIcon,
  warning: AlertCircleIcon,
  error: XCircleIcon,
  success: CheckCircleIcon,
};

// Color configuration for notification types
const COLORS: Record<NotificationType, {
  bg: string;
  border: string;
  progressBg: string;
}> = {
  info: {
    bg: 'bg-blue-500',
    border: 'border-l-blue-500',
    progressBg: 'bg-blue-500',
  },
  success: {
    bg: 'bg-green-500',
    border: 'border-l-green-500',
    progressBg: 'bg-green-500',
  },
  warning: {
    bg: 'bg-amber-500',
    border: 'border-l-amber-500',
    progressBg: 'bg-amber-500',
  },
  error: {
    bg: 'bg-red-500',
    border: 'border-l-red-500',
    progressBg: 'bg-red-500',
  },
};

// Individual toast item with progress bar
interface ToastItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  index: number;
}

function ToastItem({ notification, onDismiss, index }: ToastItemProps) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(notification.duration || 5000);

  const Icon = ICONS[notification.type];
  const colors = COLORS[notification.type];
  const duration = notification.duration || 5000;

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    // Clear any existing exit timer
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
    }
    exitTimerRef.current = setTimeout(() => {
      onDismiss(notification.id);
    }, 200); // Match exit animation duration
  }, [notification.id, onDismiss]);

  // Cleanup exit timer on unmount
  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  // Progress bar and auto-dismiss logic
  useEffect(() => {
    if (notification.persistent) return;

    const startTimer = () => {
      startTimeRef.current = Date.now();

      const updateProgress = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const newRemaining = remainingTimeRef.current - elapsed;

        if (newRemaining <= 0) {
          handleDismiss();
          return;
        }

        const progressPercent = (newRemaining / duration) * 100;
        setProgress(progressPercent);

        timerRef.current = setTimeout(updateProgress, 50);
      };

      updateProgress();
    };

    if (!isPaused) {
      startTimer();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        // Store remaining time when pausing
        if (isPaused) {
          const elapsed = Date.now() - startTimeRef.current;
          remainingTimeRef.current = remainingTimeRef.current - elapsed;
        }
      }
    };
  }, [isPaused, notification.persistent, duration, handleDismiss]);

  const handleMouseEnter = () => {
    if (!notification.persistent) {
      // Store remaining time before pausing
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        const elapsed = Date.now() - startTimeRef.current;
        remainingTimeRef.current = remainingTimeRef.current - elapsed;
      }
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (!notification.persistent) {
      setIsPaused(false);
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden
        bg-background border rounded-lg shadow-lg
        flex flex-col
        transition-all duration-200 ease-in-out
        border-l-4 ${colors.border}
        ${isExiting
          ? 'animate-out slide-out-to-right fade-out opacity-0 translate-x-full'
          : 'animate-in slide-in-from-right fade-in'}
      `}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      aria-live="polite"
    >
      {/* Main content */}
      <div className="p-4 flex items-start space-x-3">
        <div className={`${colors.bg} rounded-full p-1 mt-0.5 flex-shrink-0`}>
          <Icon className="h-4 w-4 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1 break-words">
            {notification.message}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            {notification.timestamp.toLocaleTimeString()}
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted flex-shrink-0"
          aria-label="Dismiss notification"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      {!notification.persistent && (
        <div className="h-1 w-full bg-muted">
          <div
            className={`h-full ${colors.progressBg} transition-all duration-50 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Queue indicator for hidden notifications
interface QueueIndicatorProps {
  count: number;
  onClearAll: () => void;
}

function QueueIndicator({ count, onClearAll }: QueueIndicatorProps) {
  if (count === 0) return null;

  return (
    <div className="bg-muted/80 backdrop-blur-sm border rounded-lg shadow-md p-2 flex items-center justify-between text-xs">
      <span className="text-muted-foreground">
        +{count} more notification{count > 1 ? 's' : ''} in queue
      </span>
      <button
        onClick={onClearAll}
        className="text-primary hover:underline ml-2"
      >
        Clear all
      </button>
    </div>
  );
}

// Sound toggle button
interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="bg-muted/80 backdrop-blur-sm border rounded-full p-2 shadow-md hover:bg-muted transition-colors"
      aria-label={enabled ? 'Mute notifications' : 'Unmute notifications'}
      title={enabled ? 'Mute notifications' : 'Unmute notifications'}
    >
      {enabled ? (
        <Volume2Icon className="h-4 w-4 text-muted-foreground" />
      ) : (
        <VolumeXIcon className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}

// Main NotificationToast component
export function NotificationToast() {
  const {
    notifications,
    maxVisible,
    soundEnabled,
    addNotification,
    removeNotification,
    clearAll,
    setSoundEnabled,
  } = useNotificationStore();

  // Listen for WebSocket notifications
  useSocket('notification:new', (notification: {
    id?: string;
    type: NotificationType;
    title: string;
    message: string;
    sound?: boolean;
  }) => {
    addNotification({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      sound: notification.sound,
    });
  });

  // Calculate visible and queued notifications
  const visibleNotifications = notifications.slice(-maxVisible);
  const queuedCount = Math.max(0, notifications.length - maxVisible);

  // Show nothing if no notifications
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 flex flex-col space-y-2">
      {/* Sound toggle button */}
      <div className="flex justify-end mb-1">
        <SoundToggle
          enabled={soundEnabled}
          onToggle={() => setSoundEnabled(!soundEnabled)}
        />
      </div>

      {/* Queue indicator */}
      <QueueIndicator count={queuedCount} onClearAll={clearAll} />

      {/* Visible toast notifications */}
      <div className="space-y-2">
        {visibleNotifications.map((notification, index) => (
          <ToastItem
            key={notification.id}
            notification={notification}
            onDismiss={removeNotification}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

// Export for external use
export { type Notification, type NotificationType };
