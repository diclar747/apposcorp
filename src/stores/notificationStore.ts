import { create } from 'zustand';
import type { Notification } from '@/types';
import { notificationsApi } from '@/lib/api';

const calcUnread = (notifications: Notification[]) =>
  notifications.filter(n => !n.isRead).length;

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  unreadCount: number;

  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: false,
  unreadCount: 0,

  fetchNotifications: async () => {
    set({ isLoading: true });

    try {
      const notifications = await notificationsApi.getAll();
      set({
        notifications,
        isLoading: false,
        unreadCount: calcUnread(notifications),
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    // Optimistic update
    const newNotifications = get().notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    );
    set({
      notifications: newNotifications,
      unreadCount: calcUnread(newNotifications),
    });

    try {
      await notificationsApi.markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    // Optimistic update - all notifications in store belong to current user
    const newNotifications = get().notifications.map(n => ({ ...n, isRead: true }));
    set({
      notifications: newNotifications,
      unreadCount: 0,
    });

    try {
      await notificationsApi.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  addNotification: (notification: Notification) => {
    const newNotifications = [notification, ...get().notifications];
    set({
      notifications: newNotifications,
      unreadCount: calcUnread(newNotifications),
    });
  },
}));

// Listen for push messages from service worker to instantly refresh
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'NEW_NOTIFICATION') {
      useNotificationStore.getState().fetchNotifications();
    }
  });
}
