import MarketplaceListing, { IMarketplaceListing, ListingType, PriceType, AvailabilityStatus } from '../models/marketplaceListing.model';
import Business, { BusinessStatus } from '../models/business.model';
import { AppError, HttpStatus } from '../types';
import slugify from 'slugify';

interface CreateListingDTO {
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

interface UpdateListingDTO extends Partial<CreateListingDTO> {
  isActive?: boolean;
}

class MarketplaceService {
  /**
   * Create a new marketplace listing
   */
  async createListing(userId: string, data: CreateListingDTO): Promise<IMarketplaceListing> {
    // 1. Verify business ownership and status
    const business = await Business.findById(data.businessId);
    
    if (!business) {
      throw new AppError('Business not found', HttpStatus.NOT_FOUND);
    }

    if (business.owner.toString() !== userId) {
      throw new AppError('You do not have permission to create listings for this business', HttpStatus.FORBIDDEN);
    }

    if (business.verificationStatus !== BusinessStatus.APPROVED || !business.isActive) {
      throw new AppError('Your business must be approved and active to publish listings', HttpStatus.FORBIDDEN);
    }

    // 2. Generate slug
    const baseSlug = slugify(data.title, { lower: true, strict: true });
    const uniqueString = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${uniqueString}`;

    // 3. Create listing with business location
    const listing = new MarketplaceListing({
      ...data,
      business: business._id,
      slug,
      location: business.location, // Inherit location for geospatial search
    });

    await listing.save();
    return listing;
  }

  /**
   * Update an existing listing
   */
  async updateListing(userId: string, listingId: string, data: UpdateListingDTO): Promise<IMarketplaceListing> {
    const listing = await MarketplaceListing.findById(listingId).populate('business');
    
    if (!listing) {
      throw new AppError('Listing not found', HttpStatus.NOT_FOUND);
    }

    const business = listing.business as any;

    if (business.owner.toString() !== userId) {
      throw new AppError('You do not have permission to edit this listing', HttpStatus.FORBIDDEN);
    }

    // If title changes, we might want to update the slug, but keeping it stable is usually better for SEO.
    // For now, we only update the provided fields.
    Object.assign(listing, data);
    
    // Ensure stock validation for products
    if (listing.type === ListingType.SERVICE && listing.stock !== undefined) {
      listing.stock = undefined; // Services shouldn't have stock
    }

    await listing.save();
    return listing;
  }

  /**
   * Get listing by ID
   */
  async getListingById(listingId: string): Promise<IMarketplaceListing> {
    const listing = await MarketplaceListing.findById(listingId)
      .populate('business', 'name logo coverImage category verificationStatus isActive address openingHours')
      .lean();

    if (!listing) {
      throw new AppError('Listing not found', HttpStatus.NOT_FOUND);
    }

    return listing as unknown as IMarketplaceListing;
  }

  /**
   * Get nearby listings using geospatial query
   */
  async getNearbyListings(
    longitude: number,
    latitude: number,
    radiusKm: number = 10,
    page: number = 1,
    limit: number = 10,
    filters?: {
      type?: string;
      category?: string;
      search?: string;
    }
  ) {
    const skip = (page - 1) * limit;

    const geoNearStage: any = {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        distanceField: 'distance',
        maxDistance: radiusKm * 1000, // Convert km to meters
        spherical: true,
      },
    };

    // Build match query
    const matchQuery: any = {
      isActive: true,
      availabilityStatus: { $ne: AvailabilityStatus.UNAVAILABLE }
    };

    if (filters?.type) {
      matchQuery.type = filters.type;
    }

    if (filters?.category) {
      matchQuery.category = filters.category;
    }

    if (filters?.search) {
      matchQuery.$text = { $search: filters.search };
    }

    const pipeline: any[] = [
      geoNearStage,
      { $match: matchQuery },
      // Lookup business to verify it's still approved and active
      {
        $lookup: {
          from: 'businesses',
          localField: 'business',
          foreignField: '_id',
          as: 'businessDetails'
        }
      },
      { $unwind: '$businessDetails' },
      {
        $match: {
          'businessDetails.verificationStatus': BusinessStatus.APPROVED,
          'businessDetails.isActive': true
        }
      },
      // Sort logic could go here (e.g., sort by distance, which is default for geoNear)
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          title: 1,
          slug: 1,
          type: 1,
          price: 1,
          currency: 1,
          priceType: 1,
          images: 1,
          category: 1,
          distance: 1,
          availabilityStatus: 1,
          business: {
            _id: '$businessDetails._id',
            name: '$businessDetails.name',
            logo: '$businessDetails.logo',
          }
        }
      }
    ];

    const results = await MarketplaceListing.aggregate(pipeline);

    // Get total count for pagination (requires a separate pipeline without skip/limit)
    const countPipeline = [...pipeline];
    countPipeline.splice(countPipeline.length - 3, 3); // Remove skip, limit, project
    countPipeline.push({ $count: 'total' });
    
    const countResult = await MarketplaceListing.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    return {
      listings: results,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Search listings globally (text search)
   */
  async searchListings(query: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const matchQuery = {
      $text: { $search: query },
      isActive: true,
      availabilityStatus: { $ne: AvailabilityStatus.UNAVAILABLE }
    };

    const listings = await MarketplaceListing.find(matchQuery)
      .populate({
        path: 'business',
        select: 'name logo verificationStatus isActive',
        match: { verificationStatus: BusinessStatus.APPROVED, isActive: true } // Only from approved/active businesses
      })
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter out listings where business didn't match the populate condition (returns null)
    const validListings = listings.filter(l => l.business !== null);

    const total = await MarketplaceListing.countDocuments(matchQuery);

    return {
      listings: validListings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all listings for a specific business (Public view)
   */
  async getBusinessListings(businessId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const query = { business: businessId, isActive: true };

    const listings = await MarketplaceListing.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await MarketplaceListing.countDocuments(query);

    return {
      listings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all listings for the authenticated business owner
   */
  async getOwnerListings(userId: string, page: number = 1, limit: number = 20) {
    // First find all businesses owned by this user
    const businesses = await Business.find({ owner: userId }).select('_id name');
    const businessIds = businesses.map(b => b._id);

    const skip = (page - 1) * limit;
    const query = { business: { $in: businessIds } };

    const listings = await MarketplaceListing.find(query)
      .populate('business', 'name logo')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await MarketplaceListing.countDocuments(query);

    return {
      listings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete a listing
   */
  async deleteListing(userId: string, listingId: string, isAdmin: boolean = false) {
    const listing = await MarketplaceListing.findById(listingId).populate('business');
    
    if (!listing) {
      throw new AppError('Listing not found', HttpStatus.NOT_FOUND);
    }

    const business = listing.business as any;

    if (!isAdmin && business.owner.toString() !== userId) {
      throw new AppError('You do not have permission to delete this listing', HttpStatus.FORBIDDEN);
    }

    await MarketplaceListing.findByIdAndDelete(listingId);
    return true;
  }

  /**
   * Admin: Get all listings for moderation
   */
  async getAllListingsForAdmin(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const listings = await MarketplaceListing.find()
      .populate('business', 'name verificationStatus isActive')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await MarketplaceListing.countDocuments();

    return {
      listings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update listing status (Admin or Owner)
   */
  async updateListingStatus(userId: string, listingId: string, isActive: boolean, isAdmin: boolean = false) {
    const listing = await MarketplaceListing.findById(listingId).populate('business');
    
    if (!listing) {
      throw new AppError('Listing not found', HttpStatus.NOT_FOUND);
    }

    const business = listing.business as any;

    if (!isAdmin && business.owner.toString() !== userId) {
      throw new AppError('You do not have permission to update this listing', HttpStatus.FORBIDDEN);
    }

    listing.isActive = isActive;
    await listing.save();
    return listing;
  }
}

export const marketplaceService = new MarketplaceService();
