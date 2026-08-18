import mongoose, { Document, Schema } from 'mongoose';

export enum BusinessStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export interface IOpeningHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface IBusiness extends Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  category: string;
  subCategory?: string;
  logo?: string;
  coverImage?: string;
  images?: string[];
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  location: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  openingHours?: IOpeningHours;
  isOpen: boolean;
  verificationStatus: BusinessStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema: Schema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
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
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
    },
    logo: {
      type: String,
    },
    coverImage: {
      type: String,
    },
    images: {
      type: [String],
      default: [],
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    website: {
      type: String,
    },
    address: {
      type: String,
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
    openingHours: {
      monday: { type: String, default: 'Closed' },
      tuesday: { type: String, default: 'Closed' },
      wednesday: { type: String, default: 'Closed' },
      thursday: { type: String, default: 'Closed' },
      friday: { type: String, default: 'Closed' },
      saturday: { type: String, default: 'Closed' },
      sunday: { type: String, default: 'Closed' },
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(BusinessStatus),
      default: BusinessStatus.PENDING,
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
BusinessSchema.index({ location: '2dsphere' });
BusinessSchema.index({ owner: 1 });
BusinessSchema.index({ verificationStatus: 1 });
BusinessSchema.index({ category: 1 });
BusinessSchema.index({ name: 'text', category: 'text' }); // Search index

export default mongoose.model<IBusiness>('Business', BusinessSchema);
