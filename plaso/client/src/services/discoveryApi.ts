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
  getSuggestedUsers: (limit: number = 10): Promise<ApiResponse<SuggestedUser[]>> => {
    return api.get(`/users/suggestions?limit=${limit}`);
  },
  
  getNearbyEntities: (params: {
    latitude: number;
    longitude: number;
    radius?: number;
    category?: string;
    type?: string;
    search?: string;
  }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    queryParams.append('latitude', params.latitude.toString());
    queryParams.append('longitude', params.longitude.toString());
    
    if (params.radius) queryParams.append('radius', params.radius.toString());
    if (params.category && params.category !== 'All') queryParams.append('category', params.category);
    if (params.type && params.type !== 'All') queryParams.append('type', params.type.toLowerCase());
    if (params.search) queryParams.append('search', params.search);

    return api.get(`/nearby?${queryParams.toString()}`);
  }
};
