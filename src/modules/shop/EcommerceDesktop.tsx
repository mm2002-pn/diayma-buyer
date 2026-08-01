import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ImageOff, Minus, Plus, Radio, ShoppingCart } from 'lucide-react';

import { useCart } from '@/stores/cart.store';
import { formatCfa } from '@/lib/utils';
import type { Product, ProductVariant, SellerBrief, VariantType } from '@/types/api';
import { CartSheet } from './CartSheet';

const VARIANT_LABELS: Record<VariantType, string> = {
  COULEUR: 'Couleur',
  TAILLE: 'Taille',
  POINTURE: 'Pointure',
  PLAT: 'Plat',
  PIECE: 'Pièce',
};

function productPhoto(p: Product): string | null {
  return (p.photoUrls ?? [])[0] ?? p.photoUrl ?? null;
}

interface CardProps {
  product: Product;
  saleSlug: string;
}

function ProductCard({ product, saleSlug }: CardProps) {
  const add = useCart((s) => s.add);
  const updateQty = useCart((s) => s.updateQty);
  const allItems = useCart((s) => s.items);
  const [justAdded, setJustAdded] = useState(false);

  const variantsByType = useMemo(() => {
    const map = new Map<VariantType, ProductVariant[]>();
    for (const v of product.variants) {
      if (!map.has(v.type)) map.set(v.type, []);
      map.get(v.type)!.push(v);
    }
    return map;
  }, [product.variants]);

  const types = useMemo(() => Array.from(variantsByType.keys()), [variantsByType]);
  const hasVariants = types.length > 0;

  const [selectedByType, setSelectedByType] = useState<Map<VariantType, ProductVariant>>(() => {
    const init = new Map<VariantType, ProductVariant>();
    for (const [type, variants] of variantsByType) {
      const first = variants.find((v) => v.stock > 0) ?? variants[0];
      if (first) init.set(type, first);
    }
    return init;
  });

  const isOutOfStock = hasVariants
    ? types.some((t) => (selectedByType.get(t)?.stock ?? 0) === 0)
    : product.stock === 0;

  const maxQty = hasVariants
    ? Math.min(...types.map((t) => selectedByType.get(t)?.stock ?? 0))
    : product.stock;

  const primaryVariant = types.length > 0 ? selectedByType.get(types[0]) ?? null : null;
  const currentVariantId = primaryVariant?.id ?? null;
  const variantLabel = types.map((t) => selectedByType.get(t)?.value).filter(Boolean).join(' · ');

  const currentLine = allItems.find(
    (i) => i.saleSlug === saleSlug && i.productId === product.id && i.variantId === currentVariantId,
  ) ?? null;

  function handleAdd() {
    if (isOutOfStock) return;
    add({
      productId: product.id,
      variantId: currentVariantId,
      variantLabel: variantLabel || null,
      productName: product.name,
      photoUrl: productPhoto(product),
      priceCfa: product.priceCfa,
      sellerId: product.sellerId,
      saleSlug,
      quantity: 1,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  function setQty(next: number) {
    updateQty(product.id, currentVariantId, Math.max(0, Math.min(next, maxQty)));
  }

  const photo = productPhoto(product);

  return (
    <div className="flex flex-col bg-neutral-900 rounded-2xl overflow-hidden">
      {/* Photo */}
      <div className="relative aspect-[3/4] bg-neutral-800">
        {photo ? (
          <img src={photo} alt={product.name ?? ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white/60 text-sm font-semibold">Rupture de stock</span>
          </div>
        )}
        {!isOutOfStock && maxQty > 0 && maxQty <= 5 && (
          <div className="absolute top-2 left-2 bg-black/70 rounded-full px-2.5 py-1 text-[11px] font-bold text-white/80">
            Il reste {maxQty}
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="flex flex-col gap-3 p-3 flex-1">
        {product.name && (
          <p className="text-sm font-medium text-white/70 truncate">{product.name}</p>
        )}
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-white leading-none">
            {product.priceCfa.toLocaleString('fr-FR')}
          </span>
          <span className="text-sm font-semibold text-white/60">F</span>
        </div>

        {/* Variantes */}
        {hasVariants && (
          <div className="space-y-2">
            {types.map((type) => {
              const variants = variantsByType.get(type)!;
              const selected = selectedByType.get(type);
              return (
                <div key={type}>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                    {VARIANT_LABELS[type]}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {variants.map((v) => {
                      const active = selected?.id === v.id;
                      const disabled = v.stock === 0;
                      return (
                        <button
                          key={v.id}
                          disabled={disabled}
                          onClick={() => setSelectedByType((prev) => new Map(prev).set(type, v))}
                          className={`min-w-[36px] h-8 px-2.5 rounded-xl text-xs font-bold transition-all ${
                            active
                              ? 'bg-[#C9A84C] text-white'
                              : disabled
                              ? 'bg-white/5 text-white/20 line-through'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {v.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bouton action */}
        <div className="mt-auto">
          {isOutOfStock ? (
            <button disabled className="w-full h-11 rounded-xl bg-white/5 text-white/30 text-sm font-semibold">
              Rupture
            </button>
          ) : currentLine ? (
            <div className="w-full h-11 rounded-xl bg-white/10 flex items-center justify-between px-1.5">
              <button
                onClick={() => setQty(currentLine.quantity - 1)}
                className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <div className="flex flex-col items-center leading-none">
                <span className="text-base font-bold text-white tabular-nums">{currentLine.quantity}</span>
                {justAdded ? (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5 mt-0.5">
                    <Check className="h-2.5 w-2.5" /> Ajouté
                  </span>
                ) : (
                  <span className="text-[10px] text-white/40 mt-0.5">au panier</span>
                )}
              </div>
              <button
                onClick={() => setQty(currentLine.quantity + 1)}
                disabled={currentLine.quantity >= maxQty}
                className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-25 active:scale-95 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="w-full h-11 rounded-xl bg-white text-neutral-900 text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Ajouter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  seller: SellerBrief;
  products: Product[];
  saleSlug: string;
  liveActive: boolean;
  activeLiveId?: number | null;
}

export function EcommerceDesktop({ seller, products, saleSlug, liveActive, activeLiveId }: Props) {
  const navigate = useNavigate();
  const allItems = useCart((s) => s.items);
  const clearFor = useCart((s) => s.clearFor);
  const [cartOpen, setCartOpen] = useState(false);

  const cartItems = useMemo(
    () => allItems.filter((i) => i.saleSlug === saleSlug),
    [allItems, saleSlug],
  );
  const cartCount = cartItems.reduce((a, i) => a + i.quantity, 0);
  const cartTotalCfa = cartItems.reduce((a, i) => a + i.priceCfa * i.quantity, 0);

  function handleCommander() {
    if (cartCount === 0) return;
    navigate(`/s/${saleSlug}/checkout`, { state: { liveId: activeLiveId ?? null } });
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-sm border-b border-white/8 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {seller.avatarUrl ? (
            <img src={seller.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-[#C9A84C]/50" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-[#C9A84C] flex items-center justify-center text-white text-sm font-bold">
              {seller.name[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-semibold text-white text-sm">{seller.shopName ?? seller.name}</div>
            {seller.shopName && <div className="text-xs text-white/40">{seller.name}</div>}
          </div>
          {liveActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide">
              <Radio className="h-2.5 w-2.5 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <button
          onClick={() => setCartOpen(true)}
          className="relative h-10 w-10 rounded-full bg-white/8 flex items-center justify-center text-white hover:bg-white/15 transition-all"
        >
          <ShoppingCart className="h-4.5 w-4.5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#C9A84C] text-white text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </header>

      {/* Grid */}
      <main className="flex-1 px-8 py-6 pb-28">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} saleSlug={saleSlug} />
          ))}
        </div>
      </main>

      {/* Barre panier — identique au mobile */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 px-6 pb-6 pt-2">
          <div className="max-w-2xl mx-auto flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm p-1.5 pl-4">
            <button
              onClick={() => setCartOpen(true)}
              className="flex flex-1 min-w-0 items-center gap-2.5 text-left"
            >
              <ShoppingCart className="h-4 w-4 text-white/70 flex-shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-white truncate tabular-nums">
                  {formatCfa(cartTotalCfa)}
                </span>
                <span className="block text-[11px] text-white/45 truncate">
                  {cartCount} article{cartCount > 1 ? 's' : ''} · voir mon panier
                </span>
              </span>
            </button>
            <button
              onClick={handleCommander}
              className="h-11 px-6 rounded-full bg-[#C9A84C] text-white text-sm font-semibold hover:bg-[#B8945F] active:scale-95 transition-all flex-shrink-0"
            >
              Commander
            </button>
          </div>
        </div>
      )}

      <CartSheet
        open={cartOpen}
        items={cartItems}
        totalCfa={cartTotalCfa}
        onClose={() => setCartOpen(false)}
        onCommander={handleCommander}
        onClearAll={() => { clearFor(saleSlug); setCartOpen(false); }}
      />
    </div>
  );
}
