import api from './api';

class AdminService {
  async getOverview(range: string = 'all') {
    const response = await api.get<any>(`/admin/analytics/overview?range=${range}`);
    return response.data.data;
  }

  async getUserAnalytics(range: string = 'all') {
    const response = await api.get<any>(`/admin/analytics/users?range=${range}`);
    return response.data.data;
  }

  async getBusinessAnalytics(range: string = 'all') {
    const response = await api.get<any>(`/admin/analytics/businesses?range=${range}`);
    return response.data.data;
  }

  async getMarketplaceAnalytics(range: string = 'all') {
    const response = await api.get<any>(`/admin/analytics/marketplace?range=${range}`);
    return response.data.data;
  }

  async getOrderAnalytics(range: string = 'all') {
    const response = await api.get<any>(`/admin/analytics/orders?range=${range}`);
    return response.data.data;
  }

  async getRevenueAnalytics(range: string = 'all') {
    const response = await api.get<any>(`/admin/analytics/revenue?range=${range}`);
    return response.data.data;
  }

  async getTrendsAnalytics(range: string = '30d') {
    const response = await api.get<any>(`/admin/analytics/trends?range=${range}`);
    return response.data.data;
  }

  async getTopEntities(range: string = 'all') {
    const response = await api.get<any>(`/admin/analytics/top?range=${range}`);
    return response.data.data;
  }
}

export default new AdminService();
