import api from '../api';
import { ApiResponse } from '../../types';
import { Order, OrderStatus } from '../../types/order';

export interface CheckoutData {
  deliveryAddress?: string;
  customerNote?: string;
  scheduledDate?: string;
  scheduledTime?: string;
}

export const orderApi = {
  // USER
  createOrder: async (data: CheckoutData) => {
    const response = await api.post<{ orders: Order[] }>('/orders', data);
    return response;
  },

  getMyOrders: async () => {
    const response = await api.get<{ orders: Order[] }>('/orders');
    return response;
  },

  getOrderById: async (orderId: string) => {
    const response = await api.get<{ order: Order }>(`/orders/${orderId}`);
    return response;
  },

  cancelOrder: async (orderId: string, reason?: string) => {
    const response = await api.patch<{ order: Order }>(`/orders/${orderId}/cancel`, { reason });
    return response;
  },

  confirmOrderCompletion: async (orderId: string) => {
    const response = await api.patch<{ order: Order }>(`/orders/${orderId}/complete`, {});
    return response;
  },

  disputeOrder: async (orderId: string, reason: string) => {
    const response = await api.patch<{ order: Order }>(`/orders/${orderId}/dispute`, { reason });
    return response;
  },

  // BUSINESS_OWNER
  getBusinessOrders: async (businessId: string) => {
    const response = await api.get<{ orders: Order[] }>(`/orders/business/${businessId}`);
    return response;
  },

  updateBusinessOrderStatus: async (orderId: string, status: OrderStatus) => {
    const response = await api.patch<{ order: Order }>(`/orders/business/${orderId}/status`, { status });
    return response;
  },

  // ADMIN
  getAdminOrders: async () => {
    const response = await api.get<{ orders: Order[] }>('/orders/admin/all');
    return response;
  }
};
