/**
 * Shared TypeScript types for the Plaso mobile app.
 */

/**
 * Standard API response from the Plaso backend.
 */
export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
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
};
