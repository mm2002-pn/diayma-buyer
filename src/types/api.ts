export type VariantType = 'COULEUR' | 'TAILLE' | 'POINTURE' | 'PLAT' | 'PIECE';

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
  shopMode?: 'STORY' | 'ECOMMERCE';
}

export interface Product {
  id: number;
  sellerId: number;
  seller?: SellerBrief;
  name: string | null;
  priceCfa: number;
  photoUrl: string | null;
  /**
   * Photos additionnelles du produit (faces, angles, détails), utilisées par la
   * vue story. Champ optionnel : tant que l'API ne le renvoie pas, la vue se
   * replie sur `photoUrl` et n'affiche qu'un seul segment de progression.
   */
  photoUrls?: string[] | null;
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
