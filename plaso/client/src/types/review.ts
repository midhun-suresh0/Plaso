import { ApiResponse, PaginatedResponse } from './index';

export enum ReviewStatus {
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
  REPORTED = 'REPORTED',
  REMOVED = 'REMOVED',
}

export interface BusinessResponse {
  comment: string;
  respondedAt: string;
}

export interface ReviewAuthor {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface Review {
  _id: string;
  author: ReviewAuthor;
  business: any; // Can be populated business object or ID
  listing?: any; // Can be populated listing object or ID
  order: string;
  rating: number;
  title?: string;
  comment: string;
  images: string[];
  status: ReviewStatus;
  businessResponse?: BusinessResponse;
  helpfulCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CreateReviewRequest {
  order: string;
  business: string;
  listing?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface ReviewReport {
  _id: string;
  review: string;
  reporter: string;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
}
