import api from '../api';

export const recommendationApi = {
  getFeed: async (page = 1, limit = 10, type: 'home' | 'nearby' = 'home') => {
    return api.get<any>(`/recommendations/feed?page=${page}&limit=${limit}&type=${type}`);
  },

  getBusinesses: async (latitude: number, longitude: number, page = 1, limit = 10, category?: string) => {
    const categoryQuery = category ? `&category=${category}` : '';
    return api.get<any>(`/recommendations/businesses?latitude=${latitude}&longitude=${longitude}&page=${page}&limit=${limit}${categoryQuery}`);
  },

  getListings: async (latitude: number, longitude: number, page = 1, limit = 10, category?: string) => {
    const categoryQuery = category ? `&category=${category}` : '';
    return api.get<any>(`/recommendations/listings?latitude=${latitude}&longitude=${longitude}&page=${page}&limit=${limit}${categoryQuery}`);
  },

  getTrending: async () => {
    return api.get<any>(`/recommendations/trending`);
  },

  getSearchSuggestions: async (query: string, latitude?: number, longitude?: number) => {
    const locQuery = latitude && longitude ? `&latitude=${latitude}&longitude=${longitude}` : '';
    return api.get<any>(`/recommendations/search-suggestions?q=${query}${locQuery}`);
  },

  submitFeedback: async (type: string, targetId: string, targetModel: 'Post' | 'Business' | 'MarketplaceListing' | 'User' | 'Story') => {
    return api.post<any>(`/recommendations/feedback`, {
      type,
      targetId,
      targetModel
    });
  }
};
