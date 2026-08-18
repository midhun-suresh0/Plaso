export type LocationPrivacy = 'PUBLIC' | 'NEARBY' | 'PRIVATE';

export interface PostAuthor {
  _id: string;
  name: string;
  username?: string;
  profileImage?: string;
}

export interface Post {
  _id: string;
  content?: string;
  media?: string[];
  visibility: LocationPrivacy;
  locationName?: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  distance?: number; // returned if queried via $geoNear
  distanceKm?: number;
  author: PostAuthor;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface Comment {
  _id: string;
  post: string;
  author: PostAuthor;
  content: string;
  createdAt: string;
}

export interface FeedResponse {
  posts: Post[];
  page: number;
  limit: number;
  totalCount: number;
  hasMore: boolean;
}

export interface CreatePostRequest {
  content?: string;
  media?: string[];
  visibility: LocationPrivacy;
  location?: {
    longitude: number;
    latitude: number;
  };
  locationName?: string;
}

export interface CommentsResponse {
  comments: Comment[];
  page: number;
  limit: number;
  totalCount: number;
  hasMore: boolean;
}
