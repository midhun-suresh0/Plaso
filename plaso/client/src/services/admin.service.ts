import api from './api';

class AdminService {
  private unwrap(response: any) {
    if (!response) return null;
    // Check if the response itself has .data
    if (response.data !== undefined) {
      // If response.data also has .data (nested, e.g. from an axios wrapper), unwrap it
      if (response.data && response.data.data !== undefined) {
        return response.data.data;
      }
      return response.data;
    }
    return response;
  }

  async getOverview(range: string = 'all') {
    const response = await api.get<any>(`/admin/analytics/overview?range=${range}`);
    return this.unwrap(response);
  }

  async getUserAnalytics(range: string = 'all') {
    const response = await api.get<any>(`/admin/analytics/users?range=${range}`);
    return this.unwrap(response);
  }

  async getBusinessAnalytics(range: string = 'all') {
    const response = await api.get<any>(`/admin/analytics/businesses?range=${range}`);
    return this.unwrap(response);
  }

  async getMarketplaceAnalytics(range: string = 'all') {
    const response = await api.get<any>(`/admin/analytics/marketplace?range=${range}`);
    return this.unwrap(response);
  }

  async getOrderAnalytics(range: string = 'all') {
    const response = await api.get<any>(`/admin/analytics/orders?range=${range}`);
    return this.unwrap(response);
  }

  async getRevenueAnalytics(range: string = 'all') {
    const response = await api.get<any>(`/admin/analytics/revenue?range=${range}`);
    return this.unwrap(response);
  }

  async getTrendsAnalytics(range: string = '30d') {
    const response = await api.get<any>(`/admin/analytics/trends?range=${range}`);
    return this.unwrap(response);
  }

  async getTopEntities(range: string = 'all') {
    const response = await api.get<any>(`/admin/analytics/top?range=${range}`);
    return this.unwrap(response);
  }

  async getReviewAnalytics(range: string = 'all') {
    const response = await api.get<any>(`/admin/analytics/reviews?range=${range}`);
    return this.unwrap(response);
  }

  async getSocialAnalytics(range: string = 'all') {
    const response = await api.get<any>(`/admin/analytics/social?range=${range}`);
    return this.unwrap(response);
  }

  async getIntelligenceAnalytics() {
    const response = await api.get<any>('/admin/analytics/intelligence');
    return this.unwrap(response);
  }

  async getReports(page: number = 1, limit: number = 20, search?: string, status?: string) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const response = await api.get<any>(`/admin/reports?${params.toString()}`);
    return this.unwrap(response);
  }

  async updateReportStatus(id: string, status: string, note?: string) {
    const response = await api.patch<any>(`/admin/reports/${id}`, { status, note });
    return this.unwrap(response);
  }

  async getBusinesses(page: number = 1, limit: number = 20, status?: string) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    const response = await api.get<any>(`/admin/businesses?${params.toString()}`);
    return this.unwrap(response);
  }

  async updateBusinessStatus(id: string, status: string, reason?: string) {
    const response = await api.patch<any>(`/admin/businesses/${id}/status`, { status, reason });
    return this.unwrap(response);
  }
}

export default new AdminService();
