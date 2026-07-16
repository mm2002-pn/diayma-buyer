import { api } from '@/lib/api';
import type { Product, ProductListResponse, Live } from '@/types/api';

export const shopApi = {
  bySaleSlug: async (slug: string): Promise<{ seller: NonNullable<Product['seller']>; products: Product[] }> => {
    // Résolution du saleSlug → sellerId via le premier produit trouvé.
    // (Endpoint dédié `/shops/:saleSlug` peut être ajouté côté API plus tard pour être plus propre.)
    const res = await api.get<ProductListResponse>('/products', {
      params: { pageSize: 100, status: 'ACTIVE' },
    });
    const products = res.data.items.filter((p) => p.seller?.saleSlug === slug);
    if (products.length === 0) {
      throw new Error('Boutique introuvable');
    }
    return {
      seller: products[0].seller!,
      products,
    };
  },
  productById: (id: number) => api.get<Product>(`/products/${id}`).then((r) => r.data),
  activeLives: () => api.get<{ items: Live[] }>('/lives/active').then((r) => r.data.items),
};
