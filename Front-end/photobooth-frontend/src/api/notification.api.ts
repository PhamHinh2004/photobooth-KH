import axiosInstance from './axios';
import type { NotificationItem, NotificationListResponse } from '@/types/notification.types';

export const notificationApi = {
  getNotifications: async (page = 1, limit = 20): Promise<NotificationListResponse> => {
    const res = await axiosInstance.get('/notifications', {
      params: { page, limit },
    });
    return res.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const res = await axiosInstance.get('/notifications/unread-count');
    return res.data;
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    const res = await axiosInstance.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean; message: string }> => {
    const res = await axiosInstance.patch('/notifications/read-all');
    return res.data;
  },

  deleteNotification: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await axiosInstance.delete(`/notifications/${id}`);
    return res.data;
  },
};
