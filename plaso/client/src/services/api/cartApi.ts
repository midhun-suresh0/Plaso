import api from '../api';
import { ApiResponse } from '../../types';
import { Cart } from '../../types/order';

export const cartApi = {
  getCart: async () => {
    const response = await api.get<{ cart: Cart }>('/cart');
    return response;
  },

  addItem: async (listingId: string, quantity: number) => {
    const response = await api.post<{ cart: Cart }>('/cart/items', { listingId, quantity });
    return response;
  },

  updateItemQuantity: async (itemId: string, quantity: number) => {
    const response = await api.patch<{ cart: Cart }>(`/cart/items/${itemId}`, { quantity });
    return response;
  },

  removeItem: async (itemId: string) => {
    const response = await api.delete<{ cart: Cart }>(`/cart/items/${itemId}`);
    return response;
  },

  clearCart: async () => {
    const response = await api.delete<undefined>('/cart');
    return response;
  }
};
