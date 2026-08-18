import api from './api';
import { ApiResponse } from '../types';

export interface NotificationSender {
  _id: string;
  name: string;
  username?: string;
  profileImage?: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: NotificationSender;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MENTION';
  post?: any; // To allow flexibility for populated post data (usually content)
  comment?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  page: number;
  limit: number;
  totalCount: number;
  hasMore: boolean;
}

export const notificationApi = {
  getNotifications: (page: number = 1, limit: number = 20): Promise<ApiResponse<NotificationResponse>> => {
    return api.get(`/notifications?page=${page}&limit=${limit}`);
  },

  getUnreadCount: (): Promise<ApiResponse<{ unreadCount: number }>> => {
    return api.get('/notifications/unread-count');
  },

  markAsRead: (id: string): Promise<ApiResponse<Notification>> => {
    return api.patch(`/notifications/${id}/read`, {});
  },

  markAllAsRead: (): Promise<ApiResponse<{ modifiedCount: number }>> => {
    return api.patch('/notifications/read-all', {});
  }
};
