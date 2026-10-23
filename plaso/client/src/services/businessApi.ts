import api from './api';

export interface IBusinessData {
  name: string;
  description: string;
  category: string;
  subCategory?: string;
  logo?: string;
  coverImage?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  location?: any;
  openingHours?: any;
  isOpen?: boolean;
}

export const businessApi = {
  // Owner Actions
  createBusiness: async (data: IBusinessData | FormData) => {
    return api.post('/businesses', data);
  },

  getMyBusinesses: async () => {
    return api.get('/businesses/owner/me');
  },

  updateMyBusiness: async (businessId: string, data: Partial<IBusinessData> | FormData) => {
    if (data instanceof FormData) {
      data.append('businessId', businessId);
      return api.patch('/businesses/owner/me', data);
    }
    return api.patch('/businesses/owner/me', { businessId, ...data });
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
