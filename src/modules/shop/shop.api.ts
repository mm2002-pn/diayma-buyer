import { api } from '@/lib/api';
import type { Product, Live } from '@/types/api';

export const shopApi = {
  bySaleSlug: async (slug: string): Promise<{ seller: NonNullable<Product['seller']>; products: Product[]; featuredProductId: number | null }> => {
    const res = await api.get<{ seller: NonNullable<Product['seller']>; products: Product[]; featuredProductId: number | null }>(`/shops/${slug}`);
    return res.data;
  },
  productById: (id: number) => api.get<Product>(`/products/${id}`).then((r) => r.data),
  activeLives: () => api.get<{ items: Live[] }>('/lives/active').then((r) => r.data.items),
};
