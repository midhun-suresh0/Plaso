import api from './api';
import { ApiResponse } from '../types';
import { Post, FeedResponse, CreatePostRequest, CommentsResponse, Comment } from '../types/post';

export const postApi = {
  createPost: (data: CreatePostRequest): Promise<ApiResponse<Post>> => {
    return api.post('/posts', data);
  },

  getFeed: (type: 'home' | 'nearby' = 'home', page: number = 1, limit: number = 10): Promise<ApiResponse<FeedResponse>> => {
    return api.get(`/posts/feed?type=${type}&page=${page}&limit=${limit}`);
  },

  getPost: (id: string): Promise<ApiResponse<Post>> => {
    return api.get(`/posts/${id}`);
  },

  getUserPosts: (userId: string, page: number = 1, limit: number = 10): Promise<ApiResponse<FeedResponse>> => {
    return api.get(`/posts/user/${userId}?page=${page}&limit=${limit}`);
  },

  deletePost: (id: string): Promise<ApiResponse<any>> => {
    return api.delete(`/posts/${id}`);
  },

  likePost: (id: string): Promise<ApiResponse<{ liked: boolean }>> => {
    return api.post(`/posts/${id}/like`, {});
  },

  unlikePost: (id: string): Promise<ApiResponse<{ unliked: boolean }>> => {
    return api.delete(`/posts/${id}/like`);
  },

  getComments: (id: string, page: number = 1, limit: number = 20): Promise<ApiResponse<CommentsResponse>> => {
    return api.get(`/posts/${id}/comments?page=${page}&limit=${limit}`);
  },

  addComment: (id: string, content: string): Promise<ApiResponse<Comment>> => {
    return api.post(`/posts/${id}/comments`, { content });
  },

  deleteComment: (id: string): Promise<ApiResponse<any>> => {
    return api.delete(`/comments/${id}`);
  },

  editComment: (id: string, content: string): Promise<ApiResponse<Comment>> => {
    return api.patch(`/comments/${id}`, { content });
  },

  savePost: (id: string): Promise<ApiResponse<{ saved: boolean }>> => {
    return api.post(`/posts/${id}/save`, {});
  },

  unsavePost: (id: string): Promise<ApiResponse<{ unsaved: boolean }>> => {
    return api.delete(`/posts/${id}/save`);
  },

  getSavedPosts: (page: number = 1, limit: number = 10): Promise<ApiResponse<FeedResponse>> => {
    return api.get(`/users/me/saved-posts?page=${page}&limit=${limit}`);
  }
};
