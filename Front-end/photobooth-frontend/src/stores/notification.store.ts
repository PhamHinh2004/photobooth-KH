import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { notificationApi } from '@/api/notification.api';
import { API_SOCKET_ORIGIN } from '@/api/apiConfig';
import type { NotificationItem } from '@/types/notification.types';

let notificationSocket: Socket | null = null;

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  page: number;
  hasMore: boolean;
  total: number;
  isConnected: boolean;

  fetchNotifications: (page?: number, append?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  connectSocket: (token?: string) => void;
  disconnectSocket: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  page: 1,
  hasMore: true,
  total: 0,
  isConnected: false,

  fetchNotifications: async (page = 1, append = false) => {
    try {
      set({ loading: true });
      const res = await notificationApi.getNotifications(page, 15);
      set({
        notifications: append ? [...get().notifications, ...res.data] : res.data,
        total: res.total,
        page: res.page,
        hasMore: res.page < res.totalPages,
        unreadCount: res.unreadCount,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      set({ unreadCount: res.count });
    } catch (error) {
      console.error('Failed to fetch unread count', error);
    }
  },

  markAsRead: async (id: string) => {
    // Optimistic update
    const current = get().notifications;
    const target = current.find((n) => n.id === id);
    if (target && !target.is_read) {
      set({
        notifications: current.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n,
        ),
        unreadCount: Math.max(0, get().unreadCount - 1),
      });
    }

    try {
      await notificationApi.markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  },

  markAllAsRead: async () => {
    // Optimistic update
    set({
      notifications: get().notifications.map((n) => ({
        ...n,
        is_read: true,
        read_at: new Date().toISOString(),
      })),
      unreadCount: 0,
    });

    try {
      await notificationApi.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  },

  deleteNotification: async (id: string) => {
    const current = get().notifications;
    const target = current.find((n) => n.id === id);
    const wasUnread = target && !target.is_read;

    set({
      notifications: current.filter((n) => n.id !== id),
      total: Math.max(0, get().total - 1),
      unreadCount: wasUnread ? Math.max(0, get().unreadCount - 1) : get().unreadCount,
    });

    try {
      await notificationApi.deleteNotification(id);
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  },

  connectSocket: (token?: string) => {
    if (!token) return;

    if (notificationSocket) {
      notificationSocket.disconnect();
      notificationSocket = null;
    }

    const socketUrl = `${API_SOCKET_ORIGIN}/notifications`;
    notificationSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: { token },
      query: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    notificationSocket.on('connect_error', (err) => {
      console.warn('[Notification Socket] connect error:', err?.message);
    });

    notificationSocket.on('connect', () => {
      set({ isConnected: true });
    });

    notificationSocket.on('disconnect', () => {
      set({ isConnected: false });
    });

    // Nhận thông báo realtime mới
    notificationSocket.on('notification:new', (newNotification: NotificationItem) => {
      set((state) => {
        // Tránh trùng ID
        const exists = state.notifications.some((n) => n.id === newNotification.id);
        const updatedList = exists
          ? state.notifications.map((n) => (n.id === newNotification.id ? newNotification : n))
          : [newNotification, ...state.notifications];

        return {
          notifications: updatedList,
          unreadCount: state.unreadCount + 1,
          total: state.total + 1,
        };
      });
    });

    // Đồng bộ khi tab khác ấn "Đánh dấu tất cả đã đọc"
    notificationSocket.on('notification:read_all', () => {
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          is_read: true,
          read_at: new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    });

    // Đồng bộ khi 1 thông báo được đọc
    notificationSocket.on('notification:read', ({ id }: { id: string }) => {
      set((state) => {
        const target = state.notifications.find((n) => n.id === id);
        const wasUnread = target && !target.is_read;

        return {
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n,
          ),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });
    });
  },

  disconnectSocket: () => {
    if (notificationSocket) {
      notificationSocket.disconnect();
      notificationSocket = null;
      set({ isConnected: false });
    }
  },
}));
