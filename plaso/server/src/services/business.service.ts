import Business, { BusinessStatus, IBusiness } from '../models/business.model';
import { AppError, HttpStatus } from '../types';

export class BusinessService {
  /**
   * Create a new business
   */
  static async createBusiness(ownerId: string, data: Partial<IBusiness>): Promise<IBusiness> {
    const existingBusiness = await Business.findOne({ owner: ownerId });
    if (existingBusiness) {
      throw new AppError('You already own a business', HttpStatus.BAD_REQUEST);
    }

    // Ensure slug is unique, simple slugification
    const baseSlug = data.name ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'business';
    let slug = baseSlug;
    let slugExists = await Business.findOne({ slug });
    let counter = 1;
    while (slugExists) {
      slug = `${baseSlug}-${counter}`;
      slugExists = await Business.findOne({ slug });
      counter++;
    }

    const business = new Business({
      ...data,
      owner: ownerId,
      slug,
      verificationStatus: BusinessStatus.PENDING,
    });

    await business.save();
    return business;
  }

  /**
   * Get the business owned by the user
   */
  static async getOwnerBusiness(ownerId: string): Promise<IBusiness | null> {
    return Business.findOne({ owner: ownerId });
  }

  /**
   * Update owner's business
   */
  static async updateBusiness(ownerId: string, data: Partial<IBusiness>): Promise<IBusiness> {
    const business = await Business.findOne({ owner: ownerId });
    if (!business) {
      throw new AppError('Business not found', HttpStatus.NOT_FOUND);
    }

    // Only allow updating certain fields
    const updatableFields = [
      'name', 'description', 'category', 'subCategory', 'logo',
      'coverImage', 'images', 'phone', 'email', 'website',
      'address', 'location', 'openingHours', 'isOpen'
    ];

    for (const field of updatableFields) {
      if (data[field as keyof IBusiness] !== undefined) {
        (business as any)[field] = data[field as keyof IBusiness];
      }
    }

    await business.save();
    return business;
  }

  /**
   * Get public business by ID
   */
  static async getBusinessById(id: string): Promise<IBusiness> {
    const business = await Business.findById(id).populate('owner', 'name profileImage');
    if (!business) {
      throw new AppError('Business not found', HttpStatus.NOT_FOUND);
    }
    return business;
  }

  /**
   * Get nearby businesses
   */
  static async getNearbyBusinesses(longitude: number, latitude: number, maxDistanceKm: number = 5, category?: string) {
    const maxDistanceMeters = maxDistanceKm * 1000;
    
    const query: any = {
      verificationStatus: BusinessStatus.APPROVED,
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
    };

    if (category) {
      query.category = category;
    }

    const businesses = await Business.find(query).limit(50);
    return businesses;
  }

  /**
   * Search businesses
   */
  static async searchBusinesses(q: string, category?: string, page = 1, limit = 20) {
    const query: any = {
      verificationStatus: BusinessStatus.APPROVED,
      isActive: true,
    };

    if (q) {
      query.$text = { $search: q };
    }

    if (category) {
      query.category = category;
    }

    const skip = (page - 1) * limit;
    
    // If text search, sort by text score, else sort by creation
    const sort = q ? { score: { $meta: 'textScore' } } : { createdAt: -1 };

    const businesses = await Business.find(query)
      .sort(sort as any)
      .skip(skip)
      .limit(limit);

    const totalCount = await Business.countDocuments(query);

    return {
      businesses,
      hasMore: skip + businesses.length < totalCount,
      totalCount,
    };
  }

  /**
   * Admin: Get all businesses (optionally filter by status)
   */
  static async getAdminBusinesses(status?: BusinessStatus, page = 1, limit = 20) {
    const query: any = {};
    if (status) {
      query.verificationStatus = status;
    }

    const skip = (page - 1) * limit;
    const businesses = await Business.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Business.countDocuments(query);

    return {
      businesses,
      hasMore: skip + businesses.length < totalCount,
      totalCount,
    };
  }

  /**
   * Admin: Update business status
   */
  static async updateBusinessStatus(id: string, status: BusinessStatus) {
    const business = await Business.findById(id);
    if (!business) {
      throw new AppError('Business not found', HttpStatus.NOT_FOUND);
    }

    business.verificationStatus = status;
    
    // If suspended, mark inactive as well
    if (status === BusinessStatus.SUSPENDED) {
      business.isActive = false;
    } else if (status === BusinessStatus.APPROVED) {
      business.isActive = true;
    }

    await business.save();
    return business;
  }
}
