export enum ListingType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

export enum PriceType {
  FIXED = 'FIXED',
  STARTING_FROM = 'STARTING_FROM',
  NEGOTIABLE = 'NEGOTIABLE',
  FREE = 'FREE',
}

export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  UNAVAILABLE = 'UNAVAILABLE',
}

export interface MarketplaceListing {
  _id: string;
  business: {
    _id: string;
    name: string;
    logo?: string;
    verificationStatus?: string;
    isActive?: boolean;
    category?: string;
    address?: string;
  };
  type: ListingType;
  title: string;
  slug: string;
  description: string;
  category: string;
  subCategory?: string;
  images: string[];
  price: number;
  currency: string;
  priceType: PriceType;
  availabilityStatus: AvailabilityStatus;
  stock?: number;
  unit?: string;
  location?: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  distance?: number; // Only present in geospatial queries
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingPayload {
  businessId: string;
  type: ListingType;
  title: string;
  description: string;
  category: string;
  subCategory?: string;
  images?: string[];
  price: number;
  currency?: string;
  priceType?: PriceType;
  availabilityStatus?: AvailabilityStatus;
  stock?: number;
  unit?: string;
}

export interface UpdateListingPayload extends Partial<CreateListingPayload> {
  isActive?: boolean;
}

export interface MarketplaceFilters {
  type?: string;
  category?: string;
  search?: string;
  radius?: number;
}
