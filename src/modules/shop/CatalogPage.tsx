import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { ShoppingCart, Loader2, ImageOff, Radio, X, Minus, Plus } from 'lucide-react';

import { ShopHeader } from '@/components/ShopHeader';
import { shopApi } from './shop.api';
import { useCart } from '@/stores/cart.store';
import { formatCfa } from '@/lib/utils';
import { useIsDesktop } from '@/lib/useIsDesktop';
import { CatalogDesktop } from './CatalogDesktop';
import type { Product, ProductVariant, VariantType } from '@/types/api';
import { useShopSocket } from '@/hooks/useShopSocket';

const VARIANT_LABELS: Record<VariantType, string> = {
  COULEUR: 'Couleur',
  TAILLE: 'Taille',
  POINTURE: 'Pointure',
};

// ─── QuantitySheet ────────────────────────────────────────────────────────────
function QuantitySheet({
  product,
  saleSlug,
  onClose,
}: {
  product: Product;
  saleSlug: string;
  onClose: () => void;
}) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variantsByType = useMemo(() => {
    const map = new Map<VariantType, ProductVariant[]>();
    for (const v of product.variants) {
      if (!map.has(v.type)) map.set(v.type, []);
      map.get(v.type)!.push(v);
    }
    return map;
  }, [product.variants]);

  const types = Array.from(variantsByType.keys());
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
  const variantLabel = types.map((t) => selectedByType.get(t)?.value).filter(Boolean).join(' · ');

  function handleAjouter() {
    if (isOutOfStock || added) return;
    add({
      productId: product.id,
      variantId: primaryVariant?.id ?? null,
      variantLabel: variantLabel || null,
      productName: product.name,
      photoUrl: product.photoUrl,
      priceCfa: product.priceCfa,
      sellerId: product.sellerId,
      saleSlug,
      quantity: qty,
    });
    setAdded(true);
    setTimeout(() => { onClose(); }, 900);
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-ink/15" />
        </div>

        <div className="px-5 pt-3 pb-8 space-y-5">
          {/* Produit */}
          <div className="flex items-center gap-3">
            {product.photoUrl ? (
              <img
                src={product.photoUrl}
                alt={product.name ?? ''}
                className="h-16 w-16 rounded-2xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-cream-100 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              {product.name && (
                <div className="font-semibold text-ink text-base leading-tight">{product.name}</div>
              )}
              <div className="text-xl font-bold text-ink mt-0.5">
                {product.priceCfa.toLocaleString('fr-FR')}{' '}
                <span className="text-sm font-semibold">F CFA</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-ink/30 flex-shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Variantes */}
          {hasVariants && (
            <div className="space-y-3">
              {types.map((type) => {
                const variants = variantsByType.get(type)!;
                const selected = selectedByType.get(type);
                return (
                  <div key={type}>
                    <div className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">
                      {VARIANT_LABELS[type]}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((v) => {
                        const active = selected?.id === v.id;
                        const disabled = v.stock === 0;
                        return (
                          <button
                            key={v.id}
                            disabled={disabled}
                            onClick={() => {
                              const next = new Map(selectedByType);
                              next.set(type, v);
                              setSelectedByType(next);
                              setQty(1);
                            }}
                            className={`min-w-[48px] h-10 px-3 rounded-xl text-sm font-semibold border transition ${
                              active
                                ? 'bg-forest text-white border-forest'
                                : disabled
                                ? 'text-ink/20 border-ink/10 line-through'
                                : 'text-ink border-ink/20'
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

          {/* Quantité */}
          {!isOutOfStock && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink/60">Quantité</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="h-9 w-9 rounded-full bg-cream-100 flex items-center justify-center text-ink disabled:opacity-30 transition"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-lg font-bold text-ink w-6 text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty}
                  className="h-9 w-9 rounded-full bg-forest flex items-center justify-center text-white disabled:opacity-30 transition"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* CTA */}
          {isOutOfStock ? (
            <button disabled className="btn-primary opacity-30">
              Rupture de stock
            </button>
          ) : added ? (
            <button disabled className="btn-primary bg-green-600">
              ✓ Ajouté · {formatCfa(product.priceCfa * qty)}
            </button>
          ) : (
            <button className="btn-primary" onClick={handleAjouter}>
              <ShoppingCart className="h-5 w-5" />
              Ajouter · {formatCfa(product.priceCfa * qty)}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Photo slide (card cliquable) ────────────────────────────────────────────
function PhotoSlide({ p, onSelect }: { p: Product; onSelect: () => void }) {
  const startPos = useRef<{ x: number; y: number } | null>(null);

  return (
    <div className="flex-[0_0_100%] min-w-0 h-full px-4">
      <div
        className="h-full rounded-3xl overflow-hidden relative bg-cream-100 cursor-pointer"
        onPointerDown={(e) => { startPos.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={(e) => {
          if (!startPos.current) return;
          const dx = Math.abs(e.clientX - startPos.current.x);
          const dy = Math.abs(e.clientY - startPos.current.y);
          if (dx < 8 && dy < 8) onSelect();
          startPos.current = null;
        }}
      >
        {p.photoUrl ? (
          <img src={p.photoUrl} alt={p.name ?? ''} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full flex items-center justify-center text-ink/20">
            <ImageOff className="h-16 w-16" />
          </div>
        )}
        {/* Gradient + prix */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-5 left-5">
          <span className="text-4xl font-bold text-white leading-none">
            {p.priceCfa.toLocaleString('fr-FR')}
          </span>
          <span className="text-lg font-semibold text-white/90 ml-2">F CFA</span>
        </div>
      </div>
    </div>
  );
}

// ─── CatalogPage ─────────────────────────────────────────────────────────────
export function CatalogPage() {
  const { saleSlug } = useParams<{ saleSlug: string }>();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'center' });
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [qtyOpen, setQtyOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['shop', saleSlug],
    queryFn: () => shopApi.bySaleSlug(saleSlug!),
    enabled: !!saleSlug,
  });

  const livesQuery = useQuery({
    queryKey: ['active-lives'],
    queryFn: shopApi.activeLives,
    refetchInterval: 30_000,
  });

  useShopSocket(
    saleSlug,
    () => { void livesQuery.refetch(); },
    () => { void livesQuery.refetch(); },
  );

  const allCartItems = useCart((s) => s.items);
  const { cartTotalQty, cartTotalCfa } = useMemo(() => {
    const items = saleSlug ? allCartItems.filter((i) => i.saleSlug === saleSlug) : [];
    return {
      cartTotalQty: items.reduce((a, i) => a + i.quantity, 0),
      cartTotalCfa: items.reduce((a, i) => a + i.priceCfa * i.quantity, 0),
    };
  }, [allCartItems, saleSlug]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIdx(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  if (isLoading || livesQuery.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-ink text-lg font-semibold">Boutique introuvable</div>
        <div className="text-ink/50 text-sm mt-2">Vérifie le lien avec la vendeuse.</div>
      </div>
    );
  }

  const { seller, products } = data;
  const liveActive = (livesQuery.data ?? []).some(
    (l) => l.sellerId === seller.id && l.status === 'LIVE',
  );

  // Écran d'attente si pas de live
  if (!liveActive) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <ShopHeader seller={seller} liveActive={false} />
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="h-24 w-24 rounded-full bg-ink/5 flex items-center justify-center">
            <Radio className="h-10 w-10 text-ink/20" />
          </div>
          <div>
            <div className="font-display text-2xl font-semibold text-ink mb-2">
              {seller.shopName ?? seller.name}
            </div>
            <p className="text-ink/60 text-base">Pas de live en cours pour l'instant.</p>
            <p className="text-ink/40 text-sm mt-1">
              La boutique s'ouvrira dès que la vendeuse démarre son live.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink/40">
            <Loader2 className="h-3 w-3 animate-spin" />
            Vérification automatique toutes les 30s…
          </div>
        </div>
      </div>
    );
  }

  if (isDesktop) {
    return (
      <CatalogDesktop
        seller={seller}
        products={products}
        saleSlug={saleSlug!}
        liveActive={liveActive}
        cartTotalQty={cartTotalQty}
        cartTotalCfa={cartTotalCfa}
      />
    );
  }

  const currentProduct = products[selectedIdx] ?? products[0];

  // ── Mobile : photo pleine hauteur + Commander ──
  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <ShopHeader seller={seller} liveActive={liveActive} />

      {/* Zone photos — flex-1 pour prendre toute la hauteur disponible */}
      <div className="flex-1 flex flex-col min-h-0 pt-3 pb-4">
        {/* Carousel */}
        <div className="flex-1 min-h-0 overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            {products.map((p, i) => (
              <PhotoSlide key={p.id} p={p} onSelect={() => { setSelectedIdx(i); setQtyOpen(true); }} />
            ))}
          </div>
        </div>

        {/* Dots */}
        {products.length > 1 && (
          <div className="flex justify-center gap-2 pt-3 pb-1">
            {products.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === selectedIdx ? 'w-6 bg-gold' : 'w-2 bg-ink/15'
                }`}
              />
            ))}
          </div>
        )}

        {/* Bouton Commander */}
        <div className="px-4 pt-3">
          {cartTotalQty > 0 ? (
            <button
              className="btn-primary"
              onClick={() => navigate(`/s/${saleSlug}/checkout`)}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Commander</span>
              <span className="ml-1 font-normal opacity-80">· {formatCfa(cartTotalCfa)}</span>
              <span className="ml-2 bg-white/25 rounded-full px-2 py-0.5 text-xs font-bold">
                {cartTotalQty}
              </span>
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={() => setQtyOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              Commander
            </button>
          )}
        </div>
      </div>

      {/* Bottom sheet quantité */}
      {qtyOpen && currentProduct && (
        <QuantitySheet
          product={currentProduct}
          saleSlug={saleSlug!}
          onClose={() => setQtyOpen(false)}
        />
      )}
    </div>
  );
}
