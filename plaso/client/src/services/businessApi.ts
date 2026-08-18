import api from './api';

export interface IBusinessData {
  name: string;
  description: string;
  category: string;
  subCategory?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  location: {
    longitude: number;
    latitude: number;
  };
  openingHours?: any;
}

export const businessApi = {
  // Owner Actions
  createBusiness: async (data: IBusinessData) => {
    const response = await api.post('/businesses', data);
    return response.data;
  },

  getMyBusiness: async () => {
    const response = await api.get('/businesses/owner/me');
    return response.data;
  },

  updateMyBusiness: async (data: Partial<IBusinessData>) => {
    const response = await api.patch('/businesses/owner/me', data);
    return response.data;
  },

  // Admin Actions
  getAdminBusinesses: async (status?: string, page = 1) => {
    const response = await api.get(`/businesses/admin/list?status=${status || ''}&page=${page}`);
    return response.data;
  },

  updateBusinessStatus: async (id: string, status: string) => {
    const response = await api.patch(`/businesses/admin/${id}/status`, { status });
    return response.data;
  },

  // Public Actions
  getBusinessById: async (id: string) => {
    const response = await api.get(`/businesses/${id}`);
    return response.data;
  }
};
