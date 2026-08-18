import api from './api';
import { ApiResponse } from '../types';

export interface User {
  _id: string; // From mongoose, maybe backend sends _id or id
  id?: string;
  name: string;
  email: string;
  role: string;
  username?: string;
  bio?: string;
  profileImage?: string;
  interests?: string[];
  locationPrivacy?: 'PUBLIC' | 'NEARBY' | 'PRIVATE';
  discoveryRadius?: number;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface GetMeResponse {
  user: User;
}

export const authApi = {
  /**
   * Register a new user
   */
  async register(data: any): Promise<ApiResponse<AuthResponse>> {
    return api.post<AuthResponse>('/auth/register', data);
  },

  /**
   * Login an existing user
   */
  async login(data: any): Promise<ApiResponse<AuthResponse>> {
    return api.post<AuthResponse>('/auth/login', data);
  },

  /**
   * Get current authenticated user details
   */
  async getCurrentUser(): Promise<ApiResponse<GetMeResponse>> {
    return api.get<GetMeResponse>('/auth/me');
  },

  /**
   * Request password reset link
   */
  async forgotPassword(data: { email: string }): Promise<ApiResponse> {
    return api.post<undefined>('/auth/forgot-password', data);
  },

  /**
   * Verify the 6-digit OTP
   */
  async verifyResetOtp(data: { email: string; otp: string }): Promise<ApiResponse> {
    return api.post<undefined>('/auth/verify-reset-otp', data);
  },

  /**
   * Reset password with verified email
   */
  async resetPassword(data: { email: string; newPassword: string; confirmPassword: string }): Promise<ApiResponse> {
    return api.post<undefined>('/auth/reset-password', data);
  },
};
