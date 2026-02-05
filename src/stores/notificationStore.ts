import { create } from 'zustand';
import type { Notification } from '@/types';
import { notificationsApi } from '@/lib/api';

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;

  // Getters
  unreadCount: number;

  // Actions
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: false,

  get unreadCount() {
    return get().notifications.filter(n => !n.isRead).length;
  },

  fetchNotifications: async (userId: string) => {
    set({ isLoading: true });

    try {
      const notifications = await notificationsApi.getAll();
      set({
        notifications,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    // Optimistic update
    set({
      notifications: get().notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      )
    });

    try {
      await notificationsApi.markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Revert if needed, but for read status it's usually fine
    }
  },

  markAllAsRead: async (userId: string) => {
    // Optimistic update
    set({
      notifications: get().notifications.map(n =>
        n.userId === userId ? { ...n, isRead: true } : n
      )
    });

    try {
      await notificationsApi.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  addNotification: (notification: Notification) => {
    set({
      notifications: [notification, ...get().notifications]
    });
  },
}));

