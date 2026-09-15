import { Request, Response, NextFunction } from 'express';
import { marketplaceService } from '../services/marketplace.service';
import { HttpStatus } from '../types';

export const createListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listing = await marketplaceService.createListing(req.user!.userId, req.body);
    res.status(HttpStatus.CREATED).json({ success: true, message: 'Listing created successfully', data: listing });
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const listing = await marketplaceService.updateListing(req.user!.userId, id as string, req.body);
    res.status(HttpStatus.OK).json({ success: true, message: 'Listing updated successfully', data: listing });
  } catch (error) {
    next(error);
  }
};

export const getListingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const listing = await marketplaceService.getListingById(id as string);
    res.status(HttpStatus.OK).json({ success: true, message: 'Listing retrieved successfully', data: listing });
  } catch (error) {
    next(error);
  }
};

export const getNearbyListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { longitude, latitude, radius, page, limit, type, category, search } = req.query;

    if (!longitude || !latitude) {
      res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Longitude and latitude are required' });
      return;
    }

    const filters = {
      type: type as string,
      category: category as string,
      search: search as string,
    };

    const results = await marketplaceService.getNearbyListings(
      parseFloat(longitude as string),
      parseFloat(latitude as string),
      radius ? parseFloat(radius as string) : 10,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10,
      filters
    );

    res.status(HttpStatus.OK).json({ success: true, message: 'Nearby listings retrieved successfully', data: results });
  } catch (error) {
    next(error);
  }
};

export const searchListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, page, limit } = req.query;

    if (!q) {
      res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Search query is required' });
      return;
    }

    const results = await marketplaceService.searchListings(
      q as string,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10
    );

    res.status(HttpStatus.OK).json({ success: true, message: 'Listings searched successfully', data: results });
  } catch (error) {
    next(error);
  }
};

export const getBusinessListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req.params;
    const { page, limit } = req.query;

    const results = await marketplaceService.getBusinessListings(
      businessId as string,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10
    );

    res.status(HttpStatus.OK).json({ success: true, message: 'Business listings retrieved successfully', data: results });
  } catch (error) {
    next(error);
  }
};

export const getOwnerListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;

    const results = await marketplaceService.getOwnerListings(
      req.user!.userId,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20
    );

    res.status(HttpStatus.OK).json({ success: true, message: 'Owner listings retrieved successfully', data: results });
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user!.role === 'ADMIN';
    
    await marketplaceService.deleteListing(req.user!.userId, id as string, isAdmin);
    res.status(HttpStatus.OK).json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateListingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const isAdmin = req.user!.role === 'ADMIN';

    if (isActive === undefined) {
      res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'isActive field is required' });
      return;
    }

    const listing = await marketplaceService.updateListingStatus(req.user!.userId, id as string, isActive, isAdmin);
    res.status(HttpStatus.OK).json({ success: true, message: 'Listing status updated successfully', data: listing });
  } catch (error) {
    next(error);
  }
};

export const getAllListingsForAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;

    const results = await marketplaceService.getAllListingsForAdmin(
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20
    );

    res.status(HttpStatus.OK).json({ success: true, message: 'All listings retrieved successfully', data: results });
  } catch (error) {
    next(error);
  }
};
