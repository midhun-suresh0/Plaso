import mongoose, { Document, Schema } from 'mongoose';

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

export interface IMarketplaceListing extends Document {
  business: mongoose.Types.ObjectId;
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
  location: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceListingSchema: Schema = new Schema(
  {
    business: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(ListingType),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    priceType: {
      type: String,
      enum: Object.values(PriceType),
      default: PriceType.FIXED,
    },
    availabilityStatus: {
      type: String,
      enum: Object.values(AvailabilityStatus),
      default: AvailabilityStatus.AVAILABLE,
    },
    stock: {
      type: Number,
      min: [0, 'Stock cannot be negative'],
    },
    unit: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
MarketplaceListingSchema.index({ location: '2dsphere' });
MarketplaceListingSchema.index({ business: 1 });
MarketplaceListingSchema.index({ category: 1 });
MarketplaceListingSchema.index({ type: 1 });
MarketplaceListingSchema.index({ availabilityStatus: 1 });
MarketplaceListingSchema.index({ isActive: 1 });
MarketplaceListingSchema.index({ title: 'text', description: 'text', category: 'text' });

export default mongoose.model<IMarketplaceListing>('MarketplaceListing', MarketplaceListingSchema);
