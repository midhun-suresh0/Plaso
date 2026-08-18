import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  USER = 'USER',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  ADMIN = 'ADMIN',
}

export enum LocationPrivacy {
  PUBLIC = 'PUBLIC',
  NEARBY = 'NEARBY',
  PRIVATE = 'PRIVATE',
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  username?: string;
  bio?: string;
  profileImage?: string;
  interests?: string[];
  locationPrivacy: LocationPrivacy;
  discoveryRadius: number; // in km
  location?: {
    type: string;
    coordinates: number[];
  };
  passwordResetOtpHash?: string;
  passwordResetOtpExpiresAt?: Date;
  passwordResetOtpAttempts?: number;
  passwordResetOtpVerified?: boolean;
  passwordResetOtpLastSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    profileImage: {
      type: String,
    },
    interests: {
      type: [String],
      default: [],
    },
    locationPrivacy: {
      type: String,
      enum: Object.values(LocationPrivacy),
      default: LocationPrivacy.NEARBY,
    },
    discoveryRadius: {
      type: Number,
      enum: [1, 3, 5, 10, 25],
      default: 5,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    passwordResetOtpHash: {
      type: String,
    },
    passwordResetOtpExpiresAt: {
      type: Date,
    },
    passwordResetOtpAttempts: {
      type: Number,
      default: 0,
    },
    passwordResetOtpVerified: {
      type: Boolean,
      default: false,
    },
    passwordResetOtpLastSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Indexes
UserSchema.index({ location: '2dsphere' });
UserSchema.index({ username: 1 }, { unique: true, sparse: true });
UserSchema.index({ name: 1 }); // Index for name searches

// Prevent returning passwordHash in JSON by default if we ever call toJSON on the model
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export default mongoose.model<IUser>('User', UserSchema);
