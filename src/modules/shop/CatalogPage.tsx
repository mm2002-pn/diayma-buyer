import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { ShoppingCart, Loader2, ImageOff } from 'lucide-react';

import { ShopHeader } from '@/components/ShopHeader';
import { shopApi } from './shop.api';
import { useCart } from '@/stores/cart.store';
import { formatCfa } from '@/lib/utils';
import { useIsDesktop } from '@/lib/useIsDesktop';
import { CatalogDesktop } from './CatalogDesktop';
import type { Product, ProductVariant } from '@/types/api';

function ProductSlide({ p, saleSlug }: { p: Product; saleSlug: string }) {
  const add = useCart((s) => s.add);
  const navigate = useNavigate();
  const hasVariants = p.variants.length > 0;
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    hasVariants ? p.variants.find((v) => v.stock > 0) ?? p.variants[0] : null
  );

  const isOutOfStock = hasVariants
    ? (selectedVariant?.stock ?? 0) === 0
    : p.stock === 0;

  function handleAdd() {
    if (isOutOfStock) return;
    add({
      productId: p.id,
      variantId: selectedVariant?.id ?? null,
      variantLabel: selectedVariant?.value ?? null,
      productName: p.name,
      photoUrl: p.photoUrl,
      priceCfa: p.priceCfa,
      sellerId: p.sellerId,
      saleSlug,
    });
    navigate(`/s/${saleSlug}/checkout`);
  }

  return (
    <div className="flex-[0_0_100%] min-w-0 px-4">
      <div className="rounded-2xl bg-white shadow-card overflow-hidden">
        <div className="relative aspect-[4/5] w-full bg-cream-100">
          {p.photoUrl ? (
            <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-forest/30">
              <ImageOff className="h-16 w-16" />
            </div>
          )}
          <div className="absolute bottom-3 right-3 rounded-xl bg-white/95 px-4 py-2 shadow-soft">
            <div className="text-[10px] uppercase tracking-wider text-forest/60">Prix</div>
            <div className="text-2xl font-bold text-forest leading-none">
              {p.priceCfa.toLocaleString('fr-FR')} <span className="text-xs font-medium">F CFA</span>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="text-xl font-semibold text-forest">{p.name}</div>

          {hasVariants && (
            <div className="flex flex-wrap gap-2">
              {p.variants.map((v) => {
                const active = selectedVariant?.id === v.id;
                const disabled = v.stock === 0;
                return (
                  <button
                    key={v.id}
                    disabled={disabled}
                    onClick={() => setSelectedVariant(v)}
                    className={`min-w-[52px] h-10 px-3 rounded-lg text-sm font-medium border transition ${
                      active
                        ? 'bg-forest text-white border-forest'
                        : disabled
                        ? 'text-forest/30 border-forest/10 line-through'
                        : 'bg-white text-forest border-forest/20'
                    }`}
                  >
                    {v.value}
                  </button>
                );
              })}
            </div>
          )}

          {isOutOfStock ? (
            <button disabled className="btn-primary bg-forest/30">
              Rupture de stock
            </button>
          ) : (
            <button className="btn-primary" onClick={handleAdd}>
              <ShoppingCart className="h-5 w-5" />
              Commander
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CatalogPage() {
  const { saleSlug } = useParams<{ saleSlug: string }>();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'center' });
  const [selectedIdx, setSelectedIdx] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['shop', saleSlug],
    queryFn: () => shopApi.bySaleSlug(saleSlug!),
    enabled: !!saleSlug,
  });

  // useQuery : évite `= []` en destructuring (référence différente à chaque render).
  const livesQuery = useQuery({
    queryKey: ['active-lives'],
    queryFn: shopApi.activeLives,
  });
  const lives = livesQuery.data;

  // Cart : sélection stable de la référence brute, dérivation via useMemo.
  const allCartItems = useCart((s) => s.items);
  const { cartTotalQty, cartTotalCfa } = useMemo(() => {
    const items = saleSlug ? allCartItems.filter((i) => i.saleSlug === saleSlug) : [];
    return {
      cartTotalQty: items.reduce((a, i) => a + i.quantity, 0),
      cartTotalCfa: items.reduce((a, i) => a + i.priceCfa * i.quantity, 0),
    };
  }, [allCartItems, saleSlug]);

  // Handler stable pour éviter un ré-abonnement embla à chaque render.
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIdx(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-forest text-lg font-semibold">Boutique introuvable</div>
        <div className="text-forest/60 text-sm mt-2">Vérifie le lien avec la vendeuse.</div>
      </div>
    );
  }

  const { seller, products } = data;
  const liveActive = (lives ?? []).some((l) => l.sellerId === seller.id && l.status === 'LIVE');

  // Desktop → site e-commerce classique (grid de cards)
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

  // Mobile → parcours swipe TikTok-like
  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <ShopHeader seller={seller} liveActive={liveActive} />

      <div className="flex-1 flex flex-col">
        {products.length === 1 ? (
          <ProductSlide p={products[0]} saleSlug={saleSlug!} />
        ) : (
          <>
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex touch-pan-y">
                {products.map((p) => (
                  <ProductSlide key={p.id} p={p} saleSlug={saleSlug!} />
                ))}
              </div>
            </div>

            {/* Dots indicateur */}
            <div className="flex justify-center gap-1.5 py-3">
              {products.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === selectedIdx ? 'w-6 bg-forest' : 'w-1.5 bg-forest/30'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <div className="text-center text-xs text-forest/50 pb-4">
          {products.length > 1 ? `Swipe pour découvrir · ${products.length} produits` : '1 produit'}
        </div>
      </div>

      {cartTotalQty > 0 && (
        <div className="sticky bottom-0 inset-x-0 p-4 bg-cream/95 backdrop-blur border-t border-forest/10">
          <button className="btn-primary" onClick={() => navigate(`/s/${saleSlug}/checkout`)}>
            <ShoppingCart className="h-5 w-5" />
            Voir mon panier ({cartTotalQty}) · {formatCfa(cartTotalCfa)}
          </button>
        </div>
      )}
    </div>
  );
}
