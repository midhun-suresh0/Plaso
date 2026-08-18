import api from './api';
import { ApiResponse } from '../types';

export interface LocationPrivacy {
  PUBLIC: 'PUBLIC';
  NEARBY: 'NEARBY';
  PRIVATE: 'PRIVATE';
}

export interface UserProfileUpdate {
  name?: string;
  username?: string;
  bio?: string;
  profileImage?: string;
  interests?: string[];
  locationPrivacy?: keyof LocationPrivacy;
  discoveryRadius?: number;
}

export interface UserLocationUpdate {
  latitude: number;
  longitude: number;
}

export const userApi = {
  /**
   * Update the current user's profile and settings
   */
  async updateProfile(data: UserProfileUpdate): Promise<ApiResponse<any>> {
    return api.patch<any>('/users/me', data);
  },

  /**
   * Update the current user's location
   */
  async updateLocation(data: UserLocationUpdate): Promise<ApiResponse<any>> {
    return api.patch<any>('/users/me/location', data);
  },

  /**
   * Get public profile
   */
  async getPublicProfile(userId: string): Promise<ApiResponse<any>> {
    return api.get<any>(`/users/${userId}`);
  },

  /**
   * Follow a user
   */
  async followUser(userId: string): Promise<ApiResponse<any>> {
    return api.post<any>(`/users/${userId}/follow`, {});
  },

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string): Promise<ApiResponse<any>> {
    return api.delete<any>(`/users/${userId}/follow`);
  },

  /**
   * Get Followers
   */
  async getFollowers(userId: string, page = 1, limit = 20): Promise<ApiResponse<any>> {
    return api.get<any>(`/users/${userId}/followers?page=${page}&limit=${limit}`);
  },

  /**
   * Get Following
   */
  async getFollowing(userId: string, page = 1, limit = 20): Promise<ApiResponse<any>> {
    return api.get<any>(`/users/${userId}/following?page=${page}&limit=${limit}`);
  }
};
