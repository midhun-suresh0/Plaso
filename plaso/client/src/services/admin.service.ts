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
  async getReports(page: number = 1, limit: number = 20, search?: string, status?: string) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const response = await api.get<any>(`/admin/reports?${params.toString()}`);
    return response.data.data;
  }

  async updateReportStatus(id: string, status: string, note?: string) {
    const response = await api.patch<any>(`/admin/reports/${id}`, { status, note });
    return response.data.data;
  }

  async getBusinesses(page: number = 1, limit: number = 20, status?: string) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    const response = await api.get<any>(`/admin/businesses?${params.toString()}`);
    return response.data.data;
  }

  async updateBusinessStatus(id: string, status: string, reason?: string) {
    const response = await api.patch<any>(`/admin/businesses/${id}/status`, { status, reason });
    return response.data.data;
  }
}

export default new AdminService();
