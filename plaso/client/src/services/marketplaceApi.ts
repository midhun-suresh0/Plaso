import api from './api';
import { ApiResponse, PaginatedResponse } from '../types';
import { MarketplaceListing, CreateListingPayload, UpdateListingPayload, MarketplaceFilters } from '../types/marketplace';

class MarketplaceApi {
  /**
   * Create a new marketplace listing
   */
  async createListing(data: CreateListingPayload): Promise<ApiResponse<MarketplaceListing>> {
    const response = await api.post<MarketplaceListing>('/marketplace', data);
    return response;
  }

  /**
   * Update an existing listing
   */
  async updateListing(id: string, data: UpdateListingPayload): Promise<ApiResponse<MarketplaceListing>> {
    const response = await api.patch<MarketplaceListing>(`/marketplace/${id}`, data);
    return response;
  }

  /**
   * Get a listing by ID
   */
  async getListingById(id: string): Promise<ApiResponse<MarketplaceListing>> {
    const response = await api.get<MarketplaceListing>(`/marketplace/${id}`);
    return response;
  }

  /**
   * Get nearby listings
   */
  async getNearbyListings(
    longitude: number,
    latitude: number,
    page: number = 1,
    limit: number = 10,
    filters?: MarketplaceFilters
  ): Promise<ApiResponse<PaginatedResponse<MarketplaceListing>>> {
    const params: any = {
      longitude,
      latitude,
      page,
      limit,
      ...filters,
    };
    
    // Remove undefined values so they don't become the string "undefined"
    Object.keys(params).forEach(key => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    const qs = new URLSearchParams(params);
    const response = await api.get<PaginatedResponse<MarketplaceListing>>(`/marketplace/nearby?${qs.toString()}`);
    return response;
  }

  /**
   * Search listings globally
   */
  async searchListings(
    q: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginatedResponse<MarketplaceListing>>> {
    const response = await api.get<PaginatedResponse<MarketplaceListing>>(`/marketplace/search?q=${q}&page=${page}&limit=${limit}`);
    return response;
  }

  /**
   * Get public listings for a business
   */
  async getBusinessListings(
    businessId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginatedResponse<MarketplaceListing>>> {
    const response = await api.get<PaginatedResponse<MarketplaceListing>>(`/marketplace/business/${businessId}?page=${page}&limit=${limit}`);
    return response;
  }

  /**
   * Get all listings for the authenticated business owner
   */
  async getOwnerListings(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<MarketplaceListing>>> {
    const response = await api.get<PaginatedResponse<MarketplaceListing>>(`/marketplace/me/listings?page=${page}&limit=${limit}`);
    return response;
  }

  /**
   * Delete a listing
   */
  async deleteListing(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<void>(`/marketplace/${id}`);
    return response;
  }

  /**
   * Update listing status (Activate/Deactivate)
   */
  async updateListingStatus(id: string, isActive: boolean): Promise<ApiResponse<MarketplaceListing>> {
    const response = await api.patch<MarketplaceListing>(`/marketplace/${id}/status`, { isActive });
    return response;
  }

  /**
   * Admin: Get all listings
   */
  async getAllListingsForAdmin(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<MarketplaceListing>>> {
    const response = await api.get<PaginatedResponse<MarketplaceListing>>(`/marketplace/admin/all?page=${page}&limit=${limit}`);
    return response;
  }
}

export const marketplaceApi = new MarketplaceApi();
