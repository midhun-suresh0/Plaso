import api from './api';

export const businessDiscoveryApi = {
  getNearbyBusinesses: async (longitude: number, latitude: number, radius: number = 5, category?: string) => {
    const qs = new URLSearchParams({ lng: longitude.toString(), lat: latitude.toString(), radius: radius.toString() });
    if (category) qs.append('category', category);
    const response = await api.get(`/businesses/nearby?${qs.toString()}`);
    return response.data;
  },

  searchBusinesses: async (q: string, category?: string, page = 1, limit = 20) => {
    const qs = new URLSearchParams({ q, page: page.toString(), limit: limit.toString() });
    if (category) qs.append('category', category);
    const response = await api.get(`/businesses/search?${qs.toString()}`);
    return response.data;
  }
};
