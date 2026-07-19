export type VariantType = 'COULEUR' | 'TAILLE' | 'POINTURE';

export interface ProductVariant {
  id: number;
  productId: number;
  type: VariantType;
  value: string;
  stock: number;
}

export interface SellerBrief {
  id: number;
  name: string;
  shopName: string | null;
  saleSlug: string | null;
  city: string | null;
  avatarUrl?: string | null;
}

export interface Product {
  id: number;
  sellerId: number;
  seller?: SellerBrief;
  name: string | null;
  priceCfa: number;
  photoUrl: string | null;
  stock: number;
  status: 'ACTIVE' | 'ARCHIVED';
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  items: Product[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export type PaymentMethod = 'ORANGE_MONEY' | 'WAVE' | 'COD';

export interface Live {
  id: number;
  sellerId: number;
  status: 'LIVE' | 'ENDED';
  title: string | null;
  startedAt: string;
  endedAt: string | null;
  revenueCfa: number;
  seller?: SellerBrief;
}

export interface OrderResponse {
  order: {
    id: number;
    sellerId: number;
    buyerPhone: string;
    paymentMethod: PaymentMethod;
    status: string;
    totalCfa: number;
    createdAt: string;
  };
}
