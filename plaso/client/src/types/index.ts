/**
 * Shared TypeScript types for the Plaso mobile app.
 */
import { MarketplaceListing } from './marketplace';

/**
 * Standard API response from the Plaso backend.
 */
export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  listings: T[];
  reviews: T[];
  items: T[];
  pagination: {
    total: number;
    pages: number;
    current: number;
    limit: number;
  };
}

/**
 * Health check response from GET /api/health.
 */
export interface HealthCheckResponse {
  success: boolean;
  message: string;
}

/**
 * Navigation parameter list for type-safe navigation.
 * Add new screens here as they are created.
 */
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyOtp: { email: string };
  ResetPassword: { email: string };
  Profile: undefined;
  EditProfile: undefined;
  CreatePost: { asBusiness?: boolean } | undefined;
  PostDetails: { post: any };
  UserProfile: { userId: string };
  SavedPosts: undefined;
  Notifications: undefined;
  Search: undefined;
  BusinessDiscovery: undefined;
  BusinessProfile: { businessId: string };
  BusinessDashboard: undefined;
  EditBusiness: undefined;
  AdminBusinesses: undefined;
  AdminBusinessDetails: { businessId: string };
  
  // Review Routes
  CreateReview: { orderId: string, businessId: string, listingId?: string, reviewId?: string };
  MyReviews: undefined;
  AdminReviews: undefined;
  
  // Marketplace Routes
  Marketplace: undefined;
  ListingDetails: { listingId: string };
  CreateListing: { businessId: string };
  EditListing: { listing: MarketplaceListing };
  BusinessListings: { businessId: string };
  AdminListings: undefined;
  
  // Order & Cart Routes
  Cart: undefined;
  Checkout: undefined;
  MyOrders: undefined;
  OrderDetails: { orderId: string };
  BusinessOrders: { businessId: string };
  AdminOrders: undefined;
};
