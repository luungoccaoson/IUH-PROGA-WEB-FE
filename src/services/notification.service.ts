import { apiClient } from "@/lib/axios";
import { ApiResponse } from "@/types";
import { AppNotification } from "@/types/notification";

export const notificationService = {
  getNotificationsByUserId: async (userId: number): Promise<AppNotification[]> => {
    try {
      const response = await apiClient.get<ApiResponse<AppNotification[]>>(
        `/notifications/user/${userId}`,
      );
      return response.data?.data || [];
    } catch (err) {
      console.warn("Failed to fetch notifications from API:", err);
      return [];
    }
  },

  getUnreadCount: async (userId: number): Promise<number> => {
    try {
      const response = await apiClient.get<ApiResponse<number>>(
        `/notifications/user/${userId}/unread-count`,
      );
      return response.data?.data || 0;
    } catch (err) {
      console.warn("Failed to fetch unread count:", err);
      return 0;
    }
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    try {
      await apiClient.patch<ApiResponse<any>>(`/notifications/${notificationId}/read`);
    } catch (err) {
      console.warn("Failed to mark notification as read:", err);
    }
  },

  markAllAsRead: async (userId: number): Promise<void> => {
    try {
      await apiClient.patch<ApiResponse<void>>(`/notifications/user/${userId}/read-all`);
    } catch (err) {
      console.warn("Failed to mark all notifications as read:", err);
    }
  },

  deleteNotification: async (notificationId: number): Promise<void> => {
    try {
      await apiClient.delete<ApiResponse<void>>(`/notifications/${notificationId}`);
    } catch (err) {
      console.warn("Failed to delete notification:", err);
    }
  },
};
