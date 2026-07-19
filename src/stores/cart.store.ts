import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: number;
  variantId: number | null;
  variantLabel: string | null; // ex: "Rouge" ou "M"
  productName: string | null;
  photoUrl: string | null;
  priceCfa: number;
  quantity: number;
  sellerId: number;
  saleSlug: string;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  remove: (productId: number, variantId: number | null) => void;
  updateQty: (productId: number, variantId: number | null, qty: number) => void;
  clear: () => void;
  totalCfa: () => number;
  count: () => number;
  itemsFor: (saleSlug: string) => CartItem[];
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (payload) =>
        set((s) => {
          const existing = s.items.find(
            (i) => i.productId === payload.productId && i.variantId === payload.variantId
          );
          const qty = payload.quantity ?? 1;
          if (existing) {
            return {
              items: s.items.map((i) =>
                i === existing ? { ...i, quantity: i.quantity + qty } : i
              ),
            };
          }
          return { items: [...s.items, { ...payload, quantity: qty }] };
        }),
      remove: (productId, variantId) =>
        set((s) => ({
          items: s.items.filter((i) => !(i.productId === productId && i.variantId === variantId)),
        })),
      updateQty: (productId, variantId, qty) =>
        set((s) => ({
          items: s.items
            .map((i) =>
              i.productId === productId && i.variantId === variantId
                ? { ...i, quantity: Math.max(0, qty) }
                : i
            )
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      totalCfa: () => get().items.reduce((acc, i) => acc + i.priceCfa * i.quantity, 0),
      count: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      itemsFor: (saleSlug) => get().items.filter((i) => i.saleSlug === saleSlug),
    }),
    { name: 'diayma-cart' }
  )
);
