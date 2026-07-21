import { api } from '@/lib/api';
import type { OrderResponse, PaymentMethod } from '@/types/api';

export interface CreateOrderPayload {
  liveId?: number | null;
  buyerPhone: string;
  paymentMethod: PaymentMethod;
  items: { productId: number; variantId?: number | null; quantity: number }[];
}

export interface CreateOrderResponse extends OrderResponse {
  /** Bictorys hosted checkout URL — present for WAVE / ORANGE_MONEY orders */
  checkoutUrl?: string;
}

export const checkoutApi = {
  createOrder: (payload: CreateOrderPayload) =>
    api.post<CreateOrderResponse>('/orders', payload).then((r) => r.data),
};
