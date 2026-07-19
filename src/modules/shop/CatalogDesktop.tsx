import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ImageOff, MapPin, Radio, Sparkles, ShoppingCart } from 'lucide-react';

import { formatCfa } from '@/lib/utils';
import { useCart } from '@/stores/cart.store';
import type { Product, ProductVariant, SellerBrief, VariantType } from '@/types/api';

const VARIANT_LABELS: Record<VariantType, string> = {
  COULEUR: 'Couleur',
  TAILLE: 'Taille',
  POINTURE: 'Pointure',
};

interface Props {
  seller: SellerBrief;
  products: Product[];
  saleSlug: string;
  liveActive: boolean;
  cartTotalQty: number;
  cartTotalCfa: number;
}

/**
 * Card produit — même look que la vue mobile (photo + price badge + variantes + gros bouton Commander),
 * arrangée en grille sur desktop.
 */
function ProductCard({ p, saleSlug }: { p: Product; saleSlug: string }) {
  const add = useCart((s) => s.add);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [added, setAdded] = useState(false);

  const variantsByType = useMemo(() => {
    const map = new Map<VariantType, ProductVariant[]>();
    for (const v of p.variants) {
      if (!map.has(v.type)) map.set(v.type, []);
      map.get(v.type)!.push(v);
    }
    return map;
  }, [p.variants]);

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
    : p.stock === 0;

  const primaryVariant = types.length > 0 ? selectedByType.get(types[0]) ?? null : null;
  const variantLabel = types.map((t) => selectedByType.get(t)?.value).filter(Boolean).join(' · ');

  function handleAdd() {
    if (isOutOfStock || added) return;
    add({
      productId: p.id,
      variantId: primaryVariant?.id ?? null,
      variantLabel: variantLabel || null,
      productName: p.name,
      photoUrl: p.photoUrl,
      priceCfa: p.priceCfa,
      sellerId: p.sellerId,
      saleSlug,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="rounded-2xl bg-white shadow-card overflow-hidden flex flex-col">
      {/* Photo + price badge */}
      <div className="relative aspect-square w-full bg-cream-100">
        {p.photoUrl ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-cream-100 to-cream-200 animate-pulse" />
            )}
            <img
              src={p.photoUrl}
              alt={p.name ?? ''}
              onLoad={() => setImgLoaded(true)}
              className={`h-full w-full object-cover transition-opacity duration-500 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-forest/20">
            <ImageOff className="h-16 w-16" />
          </div>
        )}

        <div className="absolute bottom-2 right-2 rounded-lg bg-white/95 backdrop-blur px-3 py-1.5 shadow-soft">
          <div className="text-xl font-bold text-forest leading-none">
            {p.priceCfa.toLocaleString('fr-FR')}{' '}
            <span className="text-[10px] font-medium">F CFA</span>
          </div>
        </div>
      </div>

      {/* Content compact */}
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        {p.name && (
          <div className="font-display text-base font-semibold text-forest line-clamp-1">
            {p.name}
          </div>
        )}

        {hasVariants && (
          <div className="space-y-2">
            {types.map((type) => {
              const variants = variantsByType.get(type)!;
              const selected = selectedByType.get(type);
              return (
                <div key={type}>
                  <div className="text-[10px] font-medium text-forest/50 uppercase tracking-wider mb-1">
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
                          onClick={() => {
                            const next = new Map(selectedByType);
                            next.set(type, v);
                            setSelectedByType(next);
                          }}
                          className={`min-w-[36px] h-7 px-2 rounded-md text-xs font-medium border transition ${
                            active
                              ? 'bg-forest text-white border-forest'
                              : disabled
                              ? 'text-forest/30 border-forest/10 line-through'
                              : 'bg-white text-forest border-forest/20 hover:border-forest/40'
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

        <div className="flex-1" />

        {isOutOfStock ? (
          <button
            disabled
            className="w-full h-10 rounded-full bg-forest/25 text-white font-semibold text-sm cursor-not-allowed"
          >
            Rupture
          </button>
        ) : added ? (
          <button
            disabled
            className="w-full h-10 rounded-full bg-green-600 text-white font-semibold text-sm"
          >
            ✓ Ajouté au panier
          </button>
        ) : (
          <button
            onClick={handleAdd}
            className="w-full h-10 rounded-full bg-forest text-white font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-forest/90 active:scale-[0.98] transition"
          >
            <ShoppingCart className="h-4 w-4" />
            Ajouter au panier
          </button>
        )}
      </div>
    </div>
  );
}

const FILTERS = ['Tous', 'Nouveautés', 'Rupture'] as const;

export function CatalogDesktop({
  seller,
  products,
  saleSlug,
  liveActive,
  cartTotalQty,
  cartTotalCfa,
}: Props) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('Tous');

  const filtered = products.filter((p) => {
    if (activeFilter === 'Tous') return true;
    if (activeFilter === 'Rupture') {
      const totalStock =
        p.variants.length > 0 ? p.variants.reduce((a, v) => a + v.stock, 0) : p.stock;
      return totalStock === 0;
    }
    if (activeFilter === 'Nouveautés') {
      const week = 7 * 24 * 60 * 60 * 1000;
      return Date.now() - new Date(p.createdAt).getTime() < week;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-cream">
      {/* Top bar sticky */}
      <header className="sticky top-0 z-20 bg-cream/85 backdrop-blur border-b border-forest/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between gap-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 hover:opacity-70 transition-opacity"
          >
            <div className="h-9 w-9 rounded-lg bg-forest text-white flex items-center justify-center font-serif text-xl font-bold">
              D
            </div>
            <span className="text-xl font-display font-semibold text-forest tracking-tight">
              Diayma
            </span>
          </button>

          <div className="hidden md:flex items-center text-sm text-forest/60 font-medium">
            Livraison 24h à Dakar · Paiement sécurisé
          </div>

          <button
            disabled={cartTotalQty === 0}
            onClick={() => navigate(`/s/${saleSlug}/checkout`)}
            className="relative flex items-center gap-2 rounded-full bg-forest text-white pl-4 pr-5 h-11 font-semibold text-sm hover:bg-forest/90 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>
              Panier
              {cartTotalQty > 0 && (
                <span className="ml-2 opacity-90 font-normal">· {formatCfa(cartTotalCfa)}</span>
              )}
            </span>
            {cartTotalQty > 0 && (
              <span
                className="absolute -top-2 -right-2 h-6 min-w-6 px-1.5 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-md"
                style={{ backgroundColor: '#C24E2F', border: '2px solid #F5EDD9' }}
              >
                {cartTotalQty}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero éditorial */}
      <section className="relative bg-gradient-to-br from-cream-100 via-cream to-cream-200 border-b border-forest/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center relative">
          <div>
            {liveActive && (
              <div
                className="inline-flex items-center gap-1.5 rounded-full text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-5"
                style={{ backgroundColor: '#C24E2F' }}
              >
                <Radio className="h-3 w-3 animate-pulse" />
                En direct maintenant
              </div>
            )}
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-forest/10 px-3 py-1 text-xs font-medium text-forest/70 mb-4">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#B8945F' }} />
              La boutique de
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium text-forest tracking-tightest leading-[1.05] mb-4">
              {seller.shopName ?? seller.name}
            </h1>
            <p className="text-forest/60 text-lg max-w-md mb-6">
              Créations sélectionnées avec soin par{' '}
              <span className="font-semibold text-forest">{seller.name}</span>
              {seller.city && (
                <>
                  {' '}·{' '}
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {seller.city}
                  </span>
                </>
              )}
            </p>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <div className="font-display font-semibold text-2xl text-forest leading-none">
                  {products.length}
                </div>
                <div className="text-forest/50 text-xs uppercase tracking-widest mt-1">
                  Produit{products.length > 1 ? 's' : ''}
                </div>
              </div>
              <div className="h-8 w-px bg-forest/15" />
              <div>
                <div className="font-display font-semibold text-2xl text-forest leading-none">
                  24h
                </div>
                <div className="text-forest/50 text-xs uppercase tracking-widest mt-1">
                  Livraison
                </div>
              </div>
              <div className="h-8 w-px bg-forest/15" />
              <div>
                <div className="font-display font-semibold text-2xl text-forest leading-none">3</div>
                <div className="text-forest/50 text-xs uppercase tracking-widest mt-1">
                  Paiements
                </div>
              </div>
            </div>
          </div>

          {/* Visual côté droit */}
          <div className="hidden md:block relative aspect-square max-w-md ml-auto">
            <div
              className="absolute inset-0 rounded-3xl rotate-3"
              style={{
                background:
                  'linear-gradient(135deg, rgba(184,148,95,0.25), rgba(194,78,47,0.15), rgba(31,77,58,0.15))',
              }}
            />
            {products[0]?.photoUrl ? (
              <img
                src={products[0].photoUrl}
                alt=""
                className="relative h-full w-full object-cover rounded-3xl shadow-2xl"
              />
            ) : (
              <div className="relative h-full w-full rounded-3xl bg-cream-200 flex items-center justify-center text-forest/20">
                <Sparkles className="h-24 w-24" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filtres */}
      <section className="border-b border-forest/10 sticky top-[73px] z-10 backdrop-blur bg-cream/85">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-3 flex items-center gap-1 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeFilter === f
                  ? 'bg-forest text-white'
                  : 'text-forest/60 hover:bg-forest/5 hover:text-forest'
              }`}
            >
              {f}
            </button>
          ))}
          <div className="ml-auto text-xs text-forest/50 hidden md:block">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          </div>
        </div>
      </section>

      {/* Grid produits — cards style mobile en 3 colonnes */}
      <section className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-10 py-10">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-forest/50">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-40" />
            Aucun produit dans cette catégorie
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} saleSlug={saleSlug} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-forest/10 bg-white py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-forest/60">
          <div className="flex items-center gap-2 font-display">
            <span className="text-forest font-semibold">Diayma</span>
            <span>·</span>
            <span>Fait avec ❤️ à Dakar</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Paiement 100% sécurisé</span>
            <span>·</span>
            <span>Livraison 24h</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
