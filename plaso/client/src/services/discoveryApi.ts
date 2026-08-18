import api from './api';
import { ApiResponse } from '../types';

export interface SuggestedUser {
  _id: string;
  name: string;
  username?: string;
  profileImage?: string;
  sharedInterests: number;
}

export const discoveryApi = {
  getSuggestedUsers: (limit: number = 5): Promise<ApiResponse<SuggestedUser[]>> => {
    return api.get(`/users/suggestions?limit=${limit}`);
  }
};
