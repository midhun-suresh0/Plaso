import Cart, { ICart } from '../models/cart.model';
import MarketplaceListing, { AvailabilityStatus } from '../models/marketplaceListing.model';
import Business from '../models/business.model';
import { AppError, HttpStatus } from '../types';

export class CartService {
  /**
   * Get user's cart
   */
  static async getCart(userId: string): Promise<ICart | null> {
    const cart = await Cart.findOne({ user: userId })
      .populate('items.listing', 'title price images type availabilityStatus stock')
      .populate('items.business', 'name');
    return cart;
  }

  /**
   * Add item to cart
   */
  static async addItem(userId: string, listingId: string, quantity: number): Promise<ICart> {
    if (quantity < 1) {
      throw new AppError('Quantity must be at least 1', HttpStatus.BAD_REQUEST);
    }

    const listing = await MarketplaceListing.findById(listingId);
    if (!listing) {
      throw new AppError('Listing not found', HttpStatus.NOT_FOUND);
    }

    if (!listing.isActive) {
      throw new AppError('Listing is not available', HttpStatus.BAD_REQUEST);
    }

    if (listing.availabilityStatus !== AvailabilityStatus.AVAILABLE) {
      throw new AppError('Listing is currently unavailable or out of stock', HttpStatus.BAD_REQUEST);
    }

    if (listing.stock !== undefined && listing.stock !== null && quantity > listing.stock) {
      throw new AppError(`Only ${listing.stock} items available in stock`, HttpStatus.BAD_REQUEST);
    }

    const business = await Business.findById(listing.business);
    if (!business || business.verificationStatus !== 'APPROVED') {
      throw new AppError('Business is not active or approved', HttpStatus.BAD_REQUEST);
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // Create new cart
      cart = new Cart({
        user: userId,
        items: [{ listing: listingId, business: listing.business, quantity }],
      });
    } else {
      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.listing.toString() === listingId
      );

      if (existingItemIndex >= 0) {
        // Update quantity
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        
        if (listing.stock !== undefined && listing.stock !== null && newQuantity > listing.stock) {
            throw new AppError(`Cannot add more. Only ${listing.stock} items available in stock`, HttpStatus.BAD_REQUEST);
        }
        
        cart.items[existingItemIndex].quantity = newQuantity;
      } else {
        // Add new item
        cart.items.push({
          listing: listing._id as any,
          business: listing.business as any,
          quantity,
          addedAt: new Date(),
        });
      }
    }

    await cart.save();
    return await this.getCart(userId) as ICart;
  }

  /**
   * Update cart item quantity
   */
  static async updateItemQuantity(userId: string, listingId: string, quantity: number): Promise<ICart> {
    if (quantity < 1) {
      return this.removeItem(userId, listingId);
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw new AppError('Cart not found', HttpStatus.NOT_FOUND);
    }

    const itemIndex = cart.items.findIndex(item => item.listing.toString() === listingId);
    if (itemIndex === -1) {
      throw new AppError('Item not found in cart', HttpStatus.NOT_FOUND);
    }

    const listing = await MarketplaceListing.findById(listingId);
    if (!listing || !listing.isActive || listing.availabilityStatus !== AvailabilityStatus.AVAILABLE) {
      throw new AppError('Listing is currently unavailable', HttpStatus.BAD_REQUEST);
    }

    if (listing.stock !== undefined && listing.stock !== null && quantity > listing.stock) {
      throw new AppError(`Only ${listing.stock} items available in stock`, HttpStatus.BAD_REQUEST);
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    return await this.getCart(userId) as ICart;
  }

  /**
   * Remove item from cart
   */
  static async removeItem(userId: string, listingId: string): Promise<ICart> {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw new AppError('Cart not found', HttpStatus.NOT_FOUND);
    }

    cart.items = cart.items.filter(item => item.listing.toString() !== listingId);
    await cart.save();

    return await this.getCart(userId) as ICart;
  }

  /**
   * Clear user cart
   */
  static async clearCart(userId: string): Promise<void> {
    await Cart.findOneAndDelete({ user: userId });
  }
}
