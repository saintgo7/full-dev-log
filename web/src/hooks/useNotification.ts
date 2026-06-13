'use client';

import { create } from 'zustand';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // ms, default 5000
  sound?: boolean;
  persistent?: boolean; // Don't auto-dismiss
}

export interface NotificationOptions {
  title: string;
  message: string;
  type?: NotificationType;
  duration?: number;
  sound?: boolean;
  persistent?: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  maxVisible: number;
  soundEnabled: boolean;

  // Actions
  addNotification: (options: NotificationOptions) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setMaxVisible: (max: number) => void;

  // Convenience methods
  info: (title: string, message: string, options?: Partial<NotificationOptions>) => string;
  success: (title: string, message: string, options?: Partial<NotificationOptions>) => string;
  warning: (title: string, message: string, options?: Partial<NotificationOptions>) => string;
  error: (title: string, message: string, options?: Partial<NotificationOptions>) => string;
}

const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Sound URLs for different notification types
const NOTIFICATION_SOUNDS: Record<NotificationType, string> = {
  info: '/sounds/notification-info.mp3',
  success: '/sounds/notification-success.mp3',
  warning: '/sounds/notification-warning.mp3',
  error: '/sounds/notification-error.mp3',
};

const playSound = (type: NotificationType) => {
  if (typeof window !== 'undefined') {
    // Use Web Audio API for better browser support
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      // Generate different tones for different notification types
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different types
      const frequencies: Record<NotificationType, number> = {
        info: 440,    // A4
        success: 523, // C5
        warning: 392, // G4
        error: 330,   // E4
      };

      oscillator.frequency.value = frequencies[type];
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch {
      // Fallback: try loading audio file if available
      const audio = new Audio(NOTIFICATION_SOUNDS[type]);
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silently fail if audio can't play
      });
    }
  }
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  maxVisible: 3,
  soundEnabled: true,

  addNotification: (options) => {
    const id = generateId();
    const notification: Notification = {
      id,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      timestamp: new Date(),
      duration: options.duration ?? 5000,
      sound: options.sound,
      persistent: options.persistent ?? false,
    };

    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    // Play sound if enabled and notification requests it (or error/warning types by default)
    const shouldPlaySound =
      get().soundEnabled &&
      (options.sound === true ||
       (options.sound !== false && (notification.type === 'error' || notification.type === 'warning')));

    if (shouldPlaySound) {
      playSound(notification.type);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  setSoundEnabled: (enabled) => {
    set({ soundEnabled: enabled });
  },

  setMaxVisible: (max) => {
    set({ maxVisible: max });
  },

  info: (title, message, options = {}) => {
    return get().addNotification({ ...options, title, message, type: 'info' });
  },

  success: (title, message, options = {}) => {
    return get().addNotification({ ...options, title, message, type: 'success' });
  },

  warning: (title, message, options = {}) => {
    return get().addNotification({ ...options, title, message, type: 'warning' });
  },

  error: (title, message, options = {}) => {
    return get().addNotification({ ...options, title, message, type: 'error' });
  },
}));

// Hook for easy access in components
export function useNotification() {
  const store = useNotificationStore();

  return {
    // State
    notifications: store.notifications,
    soundEnabled: store.soundEnabled,

    // Actions
    notify: store.addNotification,
    remove: store.removeNotification,
    clearAll: store.clearAll,
    setSoundEnabled: store.setSoundEnabled,

    // Convenience methods
    info: store.info,
    success: store.success,
    warning: store.warning,
    error: store.error,
  };
}
