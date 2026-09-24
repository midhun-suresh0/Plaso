import api from '../api';
import { ApiResponse, PaginatedResponse } from '../../types';
import { 
  Review, 
  ReviewStats, 
  ReviewReport, 
  CreateReviewRequest, 
  UpdateReviewRequest 
} from '../../types/review';

export const reviewApi = {
  getListingReviews: async (listingId: string, page = 1, limit = 10, sortBy = 'newest') => {
    const qs = new URLSearchParams({ page: page.toString(), limit: limit.toString(), sortBy });
    const response = await api.get<PaginatedResponse<Review>>(`/reviews/listing/${listingId}?${qs.toString()}`);
    return response;
  },

  getListingRatingStats: async (listingId: string) => {
    const response = await api.get<ReviewStats>(`/reviews/listing/${listingId}/stats`);
    return response;
  },

  getBusinessReviews: async (businessId: string, page = 1, limit = 10, sortBy = 'newest') => {
    const qs = new URLSearchParams({ page: page.toString(), limit: limit.toString(), sortBy });
    const response = await api.get<PaginatedResponse<Review>>(`/reviews/business/${businessId}?${qs.toString()}`);
    return response;
  },

  getBusinessRatingStats: async (businessId: string) => {
    const response = await api.get<ReviewStats>(`/reviews/business/${businessId}/stats`);
    return response;
  },

  getMyReviews: async (page = 1, limit = 10) => {
    const qs = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    const response = await api.get<PaginatedResponse<Review>>(`/reviews/me?${qs.toString()}`);
    return response;
  },

  getReviewByOrder: async (orderId: string) => {
    const response = await api.get<Review>(`/reviews/order/${orderId}`);
    return response;
  },

  createReview: async (data: CreateReviewRequest) => {
    const response = await api.post<Review>('/reviews', data);
    return response;
  },

  updateReview: async (id: string, data: UpdateReviewRequest) => {
    const response = await api.patch<Review>(`/reviews/${id}`, data);
    return response;
  },

  deleteReview: async (id: string) => {
    const response = await api.delete<undefined>(`/reviews/${id}`);
    return response;
  },

  reportReview: async (id: string, reason: string, description?: string) => {
    const response = await api.post<ReviewReport>(`/reviews/${id}/report`, { reason, description });
    return response;
  },

  markHelpful: async (id: string) => {
    const response = await api.post<Review>(`/reviews/${id}/helpful`, {});
    return response;
  },

  respondToReview: async (id: string, comment: string) => {
    const response = await api.post<Review>(`/reviews/${id}/respond`, { comment });
    return response;
  },

  // Admin routes
  getAdminReviews: async (status?: string, page = 1, limit = 20) => {
    const params: any = { page, limit };
    if (status) params.status = status;
    const qs = new URLSearchParams(params);
    const response = await api.get<PaginatedResponse<Review>>(`/reviews/admin/all?${qs.toString()}`);
    return response;
  },

  moderateReview: async (id: string, status: string, reason?: string) => {
    const response = await api.patch<Review>(`/reviews/admin/${id}/moderate`, { status, reason });
    return response;
  }
};
