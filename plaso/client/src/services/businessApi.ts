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
    return api.post('/businesses', data);
  },

  getMyBusiness: async () => {
    return api.get('/businesses/owner/me');
  },

  updateMyBusiness: async (data: Partial<IBusinessData>) => {
    return api.patch('/businesses/owner/me', data);
  },

  // Admin Actions
  getAdminBusinesses: async (status?: string, page = 1) => {
    return api.get(`/businesses/admin/list?status=${status || ''}&page=${page}`);
  },

  updateBusinessStatus: async (id: string, status: string) => {
    return api.patch(`/businesses/admin/${id}/status`, { status });
  },

  // Public Actions
  getBusinessById: async (id: string) => {
    return api.get(`/businesses/${id}`);
  }
};
