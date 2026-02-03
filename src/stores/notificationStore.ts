import { create } from 'zustand';
import type { Notification } from '@/types';
import { mockNotifications } from '@/data/mockData';

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  
  // Getters
  unreadCount: number;
  
  // Actions
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: (userId: string) => void;
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
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const notifications = mockNotifications.filter(n => n.userId === userId);
    
    set({ 
      notifications: notifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      isLoading: false 
    });
  },

  markAsRead: (id: string) => {
    set({
      notifications: get().notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      )
    });
    
    // Actualizar en mockNotifications también
    const notif = mockNotifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
    }
  },

  markAllAsRead: (userId: string) => {
    set({
      notifications: get().notifications.map(n =>
        n.userId === userId ? { ...n, isRead: true } : n
      )
    });
    
    // Actualizar en mockNotifications
    mockNotifications.forEach(n => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
  },

  addNotification: (notification: Notification) => {
    mockNotifications.push(notification);
    set({
      notifications: [notification, ...get().notifications]
    });
  },
}));
