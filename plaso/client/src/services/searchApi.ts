import api from './api';
import { ApiResponse } from '../types';
import { Post, FeedResponse } from '../types/post';

export interface SearchUser {
  _id: string;
  name: string;
  username?: string;
  profileImage?: string;
}

export interface SearchUsersResponse {
  users: SearchUser[];
  page: number;
  limit: number;
  totalCount: number;
  hasMore: boolean;
}

export const searchApi = {
  searchUsers: (query: string, page: number = 1, limit: number = 20): Promise<ApiResponse<SearchUsersResponse>> => {
    return api.get(`/search/users?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  },

  searchPosts: (query: string, page: number = 1, limit: number = 20): Promise<ApiResponse<FeedResponse>> => {
    return api.get(`/search/posts?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  }
};
