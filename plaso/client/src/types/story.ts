export interface StoryAuthor {
  _id: string;
  name: string;
  username?: string;
  profileImage?: string;
}

export interface StoryBusiness {
  _id: string;
  name: string;
  logo?: string;
}

export type StoryMediaType = 'IMAGE' | 'VIDEO' | 'TEXT';
export type StoryVisibility = 'PUBLIC' | 'FOLLOWERS_ONLY' | 'BUSINESS_PUBLIC';

export interface Story {
  _id: string;
  author: StoryAuthor;
  authorType: 'USER' | 'BUSINESS';
  business?: StoryBusiness;
  mediaType: StoryMediaType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  text?: string;
  backgroundColor?: string;
  locationName?: string;
  visibility: StoryVisibility;
  expiresAt: string;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  viewed?: boolean;
}

export interface StoryGroup {
  id: string;
  type: 'USER' | 'BUSINESS';
  author: StoryAuthor;
  business?: StoryBusiness;
  stories: Story[];
  allViewed: boolean;
  latestUpdate: string;
}

export interface StoryViewer {
  _id: string;
  story: string;
  viewer: StoryAuthor;
  viewedAt: string;
}
