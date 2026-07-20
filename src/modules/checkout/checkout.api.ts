import { api } from '@/lib/api';
import type { OrderResponse, PaymentMethod } from '@/types/api';

export interface CreateOrderPayload {
  liveId?: number | null;
  buyerPhone: string;
  paymentMethod: PaymentMethod;
  items: { productId: number; variantId?: number | null; quantity: number }[];
}

export const checkoutApi = {
  createOrder: (payload: CreateOrderPayload) =>
    api.post<OrderResponse>('/orders', payload).then((r) => r.data),
};
