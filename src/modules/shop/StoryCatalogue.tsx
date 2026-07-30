import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronUp, ImageOff, Loader2, Minus, Pause, Plus, Radio, ShoppingCart } from 'lucide-react';

import { useCart } from '@/stores/cart.store';
import { formatCfa } from '@/lib/utils';
import type { Product, ProductVariant, SellerBrief, VariantType } from '@/types/api';
import { CartSheet } from './CartSheet';

/** Durée d'affichage d'une photo avant avance automatique. */
const PHOTO_DURATION_MS = 5_000;
/** Au-delà de ce délai, un appui est considéré comme un appui long (pause). */
const LONG_PRESS_MS = 320;
/** Largeur des zones latérales (produit précédent / suivant). */
const SIDE_ZONE_RATIO = 0.25;

const VARIANT_LABELS: Record<VariantType, string> = {
  COULEUR: 'Couleur',
  TAILLE: 'Taille',
  POINTURE: 'Pointure',
  PLAT: 'Plat',
  PIECE: 'Pièce',
};

/** Photos d'un produit, avec repli sur la photo unique tant que l'API n'en renvoie qu'une. */
function productPhotos(p: Product): string[] {
  const many = (p.photoUrls ?? []).filter((u): u is string => !!u);
  if (many.length > 0) return many;
  return p.photoUrl ? [p.photoUrl] : [];
}

interface Props {
  seller: SellerBrief;
  products: Product[];
  saleSlug: string;
  liveActive: boolean;
  activeLiveId?: number | null;
  /** Produit sur lequel ouvrir la vue (produit mis en avant par la vendeuse). */
  initialProductId?: number | null;
  /** Produit vers lequel sauter quand la vendeuse change de produit actif pendant le live. */
  jumpToProductId?: number | null;
}

export function StoryCatalogue({
  seller,
  products,
  saleSlug,
  liveActive,
  activeLiveId,
  initialProductId,
  jumpToProductId,
}: Props) {
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const updateQty = useCart((s) => s.updateQty);
  const clearFor = useCart((s) => s.clearFor);
  const allCartItems = useCart((s) => s.items);
  const [cartOpen, setCartOpen] = useState(false);

  // ── Position dans le catalogue ──────────────────────────────────────────────
  const [productIdx, setProductIdx] = useState(() => {
    const i = products.findIndex((p) => p.id === initialProductId);
    return i > 0 ? i : 0;
  });
  const [photoIdx, setPhotoIdx] = useState(0);

  const product = products[productIdx] ?? products[0];
  const photos = useMemo(() => productPhotos(product), [product]);
  const photoCount = Math.max(1, photos.length);
  const currentPhoto = photos[photoIdx] ?? null;

  // ── Minuterie ───────────────────────────────────────────────────────────────
  const [progress, setProgress] = useState(0);
  /**
   * URL de la photo effectivement prête à l'affichage. On mémorise l'URL plutôt
   * qu'un booléen : l'état redevient « pas prêt » de lui-même au changement de
   * photo, sans effet de remise à zéro qui écraserait une image déjà en cache.
   */
  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const [heldPaused, setHeldPaused] = useState(false);
  /** L'acheteuse a touché aux variantes ou à la quantité : on gèle l'avance pour ce produit. */
  const [interacted, setInteracted] = useState(false);

  // Le panier ouvert gèle aussi le défilement : l'écran ne doit pas changer
  // pendant que l'acheteuse corrige sa commande.
  const paused = heldPaused || interacted || cartOpen;
  const photoReady = currentPhoto == null || readyUrl === currentPhoto;
  const elapsedRef = useRef(0);

  /**
   * Une image déjà en cache est « complete » avant que React n'attache `onLoad`,
   * qui ne se déclencherait alors jamais. On teste donc l'état à la pose du nœud.
   */
  const markReadyIfCached = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth > 0) setReadyUrl(currentPhoto);
  }, [currentPhoto]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const goToProduct = useCallback(
    (next: number) => {
      if (products.length <= 1) return; // catalogue à un seul produit : sans effet
      setProductIdx(((next % products.length) + products.length) % products.length);
      setPhotoIdx(0);
    },
    [products.length],
  );

  const nextPhoto = useCallback(() => {
    // La zone centrale ne change jamais de produit : elle boucle sur les photos.
    if (photoCount <= 1) {
      elapsedRef.current = 0;
      setProgress(0);
      return;
    }
    setPhotoIdx((i) => (i + 1) % photoCount);
  }, [photoCount]);

  /** Fin de minuterie : photo suivante, puis produit suivant à la dernière photo. */
  const advanceRef = useRef<() => void>(() => {});
  advanceRef.current = () => {
    if (photoIdx < photoCount - 1) {
      setPhotoIdx(photoIdx + 1);
      return;
    }
    // Fin de catalogue : boucle vers le premier produit.
    setProductIdx((i) => (i + 1) % products.length);
    setPhotoIdx(0);
  };

  // Remise à zéro de la minuterie à chaque changement de photo ou de produit.
  useEffect(() => {
    elapsedRef.current = 0;
    setProgress(0);
  }, [productIdx, photoIdx]);

  // Sélections et pause d'interaction sont propres à chaque produit.
  useEffect(() => {
    setInteracted(false);
  }, [productIdx]);

  // Saut vers le produit mis en avant par la vendeuse pendant le live.
  useEffect(() => {
    if (jumpToProductId == null) return;
    const i = products.findIndex((p) => p.id === jumpToProductId);
    if (i >= 0) {
      setProductIdx(i);
      setPhotoIdx(0);
    }
  }, [jumpToProductId, products]);

  // Boucle d'animation de la barre de progression.
  useEffect(() => {
    if (paused || !photoReady) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsedRef.current += now - last;
      last = now;
      const p = Math.min(1, elapsedRef.current / PHOTO_DURATION_MS);
      setProgress(p);
      if (p >= 1) {
        advanceRef.current();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused, photoReady, productIdx, photoIdx]);

  // Préchargement : photo suivante du produit, puis première photo du produit suivant.
  useEffect(() => {
    const urls: string[] = [];
    if (photos[photoIdx + 1]) urls.push(photos[photoIdx + 1]);
    const nextProduct = products[(productIdx + 1) % products.length];
    const nextFirst = nextProduct ? productPhotos(nextProduct)[0] : undefined;
    if (nextFirst) urls.push(nextFirst);
    // Pas de nettoyage : vider `src` annulerait un téléchargement déjà utile.
    for (const u of urls) {
      const img = new Image();
      img.src = u;
    }
  }, [photos, photoIdx, productIdx, products]);

  // Navigation clavier (desktop).
  useEffect(() => {
    if (cartOpen) return; // le panier a ses propres raccourcis (Échap)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToProduct(productIdx - 1);
      else if (e.key === 'ArrowRight') goToProduct(productIdx + 1);
      else if (e.key === ' ') { e.preventDefault(); nextPhoto(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goToProduct, nextPhoto, productIdx, cartOpen]);

  // ── Appui : tap court = navigation, appui long = pause ──────────────────────
  const pressTimer = useRef<number | null>(null);
  const isLongPress = useRef(false);

  function clearPress() {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  function onPointerDown() {
    isLongPress.current = false;
    clearPress();
    pressTimer.current = window.setTimeout(() => {
      isLongPress.current = true;
      setHeldPaused(true);
    }, LONG_PRESS_MS);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    clearPress();
    if (isLongPress.current) {
      isLongPress.current = false;
      setHeldPaused(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (ratio < SIDE_ZONE_RATIO) goToProduct(productIdx - 1);
    else if (ratio > 1 - SIDE_ZONE_RATIO) goToProduct(productIdx + 1);
    else nextPhoto();
  }

  function onPointerCancel() {
    clearPress();
    if (isLongPress.current) {
      isLongPress.current = false;
      setHeldPaused(false);
    }
  }

  // ── Variantes et quantité ───────────────────────────────────────────────────
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

  const [selectedByType, setSelectedByType] = useState<Map<VariantType, ProductVariant>>(new Map());

  // Sélection par défaut : première variante disponible de chaque axe.
  useEffect(() => {
    const init = new Map<VariantType, ProductVariant>();
    for (const [type, variants] of variantsByType) {
      const first = variants.find((v) => v.stock > 0) ?? variants[0];
      if (first) init.set(type, first);
    }
    setSelectedByType(init);
  }, [variantsByType]);

  const isOutOfStock = hasVariants
    ? types.some((t) => (selectedByType.get(t)?.stock ?? 0) === 0)
    : product.stock === 0;

  const maxQty = hasVariants
    ? Math.min(...types.map((t) => selectedByType.get(t)?.stock ?? 0))
    : product.stock;

  const primaryVariant = types.length > 0 ? selectedByType.get(types[0]) ?? null : null;
  const variantLabel = types
    .map((t) => selectedByType.get(t)?.value)
    .filter(Boolean)
    .join(' · ');

  // ── Panier ──────────────────────────────────────────────────────────────────
  const cartItems = useMemo(
    () => allCartItems.filter((i) => i.saleSlug === saleSlug),
    [allCartItems, saleSlug],
  );
  const cartCount = cartItems.reduce((a, i) => a + i.quantity, 0);
  const cartTotalCfa = cartItems.reduce((a, i) => a + i.priceCfa * i.quantity, 0);

  /** Ligne du panier correspondant exactement à la sélection courante, s'il y en a une. */
  const currentVariantId = primaryVariant?.id ?? null;
  const currentLine =
    cartItems.find((i) => i.productId === product.id && i.variantId === currentVariantId) ?? null;

  const [justAdded, setJustAdded] = useState(false);
  useEffect(() => { setJustAdded(false); }, [productIdx]);

  /**
   * Ajoute un exemplaire. La quantité ne se règle plus *avant* l'ajout : le
   * bouton se transforme en compteur une fois le produit au panier. L'acheteuse
   * qui commande à l'unité — le cas courant — n'a qu'un seul geste à comprendre.
   */
  function handleAjouter() {
    if (isOutOfStock) return;
    setInteracted(true);
    add({
      productId: product.id,
      variantId: currentVariantId,
      variantLabel: variantLabel || null,
      productName: product.name,
      photoUrl: photos[0] ?? product.photoUrl,
      priceCfa: product.priceCfa,
      sellerId: product.sellerId,
      saleSlug,
      quantity: 1,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  }

  /** Règle la quantité de la ligne courante. À zéro, la ligne sort du panier. */
  function setCurrentQty(next: number) {
    setInteracted(true);
    updateQty(product.id, currentVariantId, next <= 0 ? 0 : Math.min(next, maxQty));
  }

  /**
   * Le panier est déjà constitué : « Commander » ne fait que passer à la caisse.
   * Il n'ajoute plus le produit affiché au passage — c'est ce qui rendait le
   * montant du bouton incompréhensible (prix affiché ≠ total facturé).
   */
  function handleCommander() {
    if (cartCount === 0) return;
    navigate(`/s/${saleSlug}/checkout`, { state: { liveId: activeLiveId ?? null } });
  }

  function handleClearAll() {
    clearFor(saleSlug);
    setCartOpen(false);
  }

  // ── Rendu ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-0 bg-black flex items-center justify-center">
      {/* Cadre : plein écran sur mobile, format téléphone centré sur desktop */}
      <div className="relative w-full h-full md:w-[420px] md:h-[min(880px,94vh)] md:rounded-[2.25rem] overflow-hidden bg-black select-none">

        {/* ── Photo ── */}
        <div className="absolute inset-0">
          {currentPhoto ? (
            <>
              {!photoReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                  <Loader2 className="h-6 w-6 animate-spin text-white/40" />
                </div>
              )}
              <img
                key={`${product.id}-${photoIdx}`}
                ref={markReadyIfCached}
                src={currentPhoto}
                alt={product.name ?? 'Produit'}
                onLoad={() => setReadyUrl(currentPhoto)}
                onError={() => setReadyUrl(currentPhoto)}
                draggable={false}
                className={`h-full w-full object-cover transition-opacity duration-300 ${
                  photoReady ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 text-white/20">
              <ImageOff className="h-16 w-16" />
            </div>
          )}
        </div>

        {/* Dégradés de lisibilité */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />

        {/* ── Zones de tap (photo uniquement, jamais le panneau du bas) ── */}
        <div
          className="absolute inset-x-0 top-0 bottom-0 z-10"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* ── Barre de progression segmentée ── */}
        <div className="absolute inset-x-0 top-0 z-30 flex gap-1 px-3 pt-3 pointer-events-none">
          {Array.from({ length: photoCount }).map((_, i) => (
            <div key={i} className="h-[3px] flex-1 rounded-full bg-white/25 overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width: i < photoIdx ? '100%' : i === photoIdx ? `${progress * 100}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Header vendeuse ── */}
        <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-4 pt-6 pointer-events-none">
          <div className="flex items-center gap-2.5 min-w-0">
            {seller.avatarUrl ? (
              <img
                src={seller.avatarUrl}
                alt=""
                className="h-8 w-8 rounded-full object-cover ring-2 ring-gold/70 flex-shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gold flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/20 flex-shrink-0">
                {seller.name[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm font-semibold text-white truncate drop-shadow">
              {seller.shopName ?? seller.name}
            </span>
            {liveActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide flex-shrink-0">
                <Radio className="h-2.5 w-2.5 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {paused && (
              <Pause className="h-3.5 w-3.5 text-white/70" fill="currentColor" strokeWidth={0} />
            )}
            {/* Le panier n'est plus ici : il vit dans la barre du bas, où il est
                à la fois lisible (nombre + total) et manipulable. */}
            <span className="text-xs font-semibold text-white/70 tabular-nums">
              Produit {productIdx + 1} / {products.length}
            </span>
          </div>
        </div>

        {/* ── Panneau bas : prix, variantes, quantité, CTA ── */}
        <div
          className="absolute inset-x-0 bottom-0 z-30 px-5 pb-7 pt-4 space-y-4"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Nom + prix */}
          <div>
            {product.name && (
              <div className="text-sm font-medium text-white/70 mb-1 truncate">{product.name}</div>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-[2.75rem] leading-none font-extrabold text-white tracking-tight">
                {product.priceCfa.toLocaleString('fr-FR')}
              </span>
              <span className="text-lg font-semibold text-white/80">F CFA</span>
            </div>
            {/* Le stock ne s'affiche qu'à l'approche de la rupture : au-delà,
                c'est du bruit sur un écran qu'on veut garder nu. */}
            {!isOutOfStock && maxQty > 0 && maxQty <= 5 && (
              <div className="mt-2 inline-flex items-center rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-bold text-white/80">
                Il reste {maxQty}
              </div>
            )}
          </div>

          {/* Variantes */}
          {hasVariants && (
            <div className="space-y-3">
              {types.map((type) => {
                const variants = variantsByType.get(type)!;
                const selected = selectedByType.get(type);
                return (
                  <div key={type}>
                    <div className="text-[11px] font-bold text-white/45 uppercase tracking-[0.12em] mb-1.5">
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
                            aria-pressed={active}
                            onClick={() => {
                              // Chaque variante a sa propre ligne de panier :
                              // changer de taille rebascule le bouton sur
                              // « Ajouter » ou sur le compteur de cette taille.
                              setInteracted(true);
                              setSelectedByType((prev) => new Map(prev).set(type, v));
                            }}
                            className={`min-w-[46px] h-11 px-3.5 rounded-2xl text-sm font-bold transition-all ${
                              active
                                ? 'bg-forest-400 text-white'
                                : disabled
                                ? 'bg-white/5 text-white/25 line-through'
                                : 'bg-white/12 text-white hover:bg-white/20'
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

          {/* ── Action produit : ne concerne QUE la photo affichée ── */}
          {isOutOfStock ? (
            <button
              disabled
              className="w-full h-14 rounded-full bg-white/10 text-white/40 font-semibold text-base"
            >
              Rupture de stock
            </button>
          ) : currentLine ? (
            /* Déjà au panier : le bouton devient le compteur de cette ligne. */
            <div className="w-full h-14 rounded-full bg-white/12 flex items-center justify-between px-2">
              <button
                onClick={() => setCurrentQty(currentLine.quantity - 1)}
                aria-label="Réduire la quantité"
                className="h-11 w-11 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 active:scale-95 transition-all"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="flex flex-col items-center leading-none">
                <span className="text-lg font-bold text-white tabular-nums">
                  {currentLine.quantity}
                </span>
                {justAdded ? (
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <Check className="h-3 w-3" />
                    Ajouté
                  </span>
                ) : (
                  <span className="mt-1 text-[11px] font-semibold text-white/45">au panier</span>
                )}
              </div>
              <button
                onClick={() => setCurrentQty(currentLine.quantity + 1)}
                disabled={currentLine.quantity >= maxQty}
                aria-label="Augmenter la quantité"
                className="h-11 w-11 rounded-full bg-white/15 flex items-center justify-center text-white disabled:opacity-25 hover:bg-white/25 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAjouter}
              className="w-full h-14 rounded-full bg-white text-neutral-900 text-base font-bold flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-white/90 transition-all shadow-lg shadow-black/30"
            >
              <Plus className="h-5 w-5 flex-shrink-0" strokeWidth={2.5} />
              Ajouter
            </button>
          )}

          {/* ── Barre panier : ne concerne QUE la commande en cours ── */}
          {cartCount > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm p-1.5 pl-4">
              <button
                onClick={() => setCartOpen(true)}
                aria-label="Voir le détail de mon panier"
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
                <ChevronUp className="h-4 w-4 text-white/35 flex-shrink-0" />
              </button>
              <button
                onClick={handleCommander}
                className="h-11 px-5 rounded-full bg-forest-400 text-white text-sm font-semibold hover:bg-forest active:scale-95 transition-all flex-shrink-0"
              >
                Commander
              </button>
            </div>
          )}
        </div>

        <CartSheet
          open={cartOpen}
          items={cartItems}
          totalCfa={cartTotalCfa}
          onClose={() => setCartOpen(false)}
          onCommander={handleCommander}
          onClearAll={handleClearAll}
        />
      </div>
    </div>
  );
}
