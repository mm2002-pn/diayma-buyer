import { useEffect, useState } from 'react';
import { ImageOff, Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';

import { useCart, type CartItem } from '@/stores/cart.store';
import { formatCfa } from '@/lib/utils';

interface Props {
  open: boolean;
  items: CartItem[];
  totalCfa: number;
  onClose: () => void;
  onCommander: () => void;
  onClearAll: () => void;
}

/**
 * Panier consultable sans quitter la story : l'acheteuse vérifie et corrige sa
 * commande, puis revient au direct. Les lignes s'identifient par la photo et la
 * variante — le nom du produit n'est pas encore renvoyé par l'API.
 */
export function CartSheet({ open, items, totalCfa, onClose, onCommander, onClearAll }: Props) {
  const updateQty = useCart((s) => s.updateQty);
  const removeItem = useCart((s) => s.remove);

  /** Le vidage complet est irréversible : on demande une confirmation sur place. */
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => {
    if (!open) setConfirmClear(false);
  }, [open]);

  // Fermeture au clavier (desktop).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // La dernière ligne supprimée vide le panier : plus rien à consulter.
  useEffect(() => {
    if (open && items.length === 0) onClose();
  }, [open, items.length, onClose]);

  if (!open) return null;

  const count = items.reduce((a, i) => a + i.quantity, 0);

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      {/* Voile : un tap en dehors du panneau referme et rend le direct */}
      <button
        aria-label="Fermer le panier"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mon panier"
        className="relative max-h-[78%] flex flex-col rounded-t-[1.75rem] bg-neutral-950 ring-1 ring-white/10"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-base font-semibold text-white">Mon panier</span>
            <span className="text-sm text-white/45 tabular-nums">
              {count} article{count > 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer le panier"
            className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Lignes */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 divide-y divide-white/8">
          {items.map((item) => (
            <div key={`${item.productId}-${item.variantId ?? 'base'}`} className="flex gap-3 py-3.5">
              {item.photoUrl ? (
                <img
                  src={item.photoUrl}
                  alt=""
                  className="h-16 w-16 rounded-xl object-cover flex-shrink-0 bg-white/5"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <ImageOff className="h-5 w-5 text-white/25" />
                </div>
              )}

              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {item.variantLabel && (
                      <div className="text-sm font-semibold text-white truncate">
                        {item.variantLabel}
                      </div>
                    )}
                    <div className="text-xs text-white/45 tabular-nums">
                      {formatCfa(item.priceCfa)} l'unité
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.variantId)}
                    aria-label={`Retirer ${item.variantLabel ?? 'ce produit'} du panier`}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white/35 hover:text-red-400 hover:bg-white/10 active:scale-95 transition-all flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 mt-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.productId, item.variantId, item.quantity - 1)}
                      aria-label="Réduire la quantité"
                      className="h-9 w-9 rounded-xl bg-white/12 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-[2ch] text-center text-sm font-bold text-white tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.productId, item.variantId, item.quantity + 1)}
                      aria-label="Augmenter la quantité"
                      className="h-9 w-9 rounded-xl bg-white/12 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-white tabular-nums">
                    {formatCfa(item.priceCfa * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pied : total, commande, vidage */}
        <div className="flex-shrink-0 px-5 pt-4 pb-7 space-y-3 border-t border-white/10">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-white/55">Total</span>
            <span className="text-2xl font-extrabold text-white tabular-nums">
              {formatCfa(totalCfa)}
            </span>
          </div>

          <button
            onClick={onCommander}
            className="w-full h-14 rounded-full bg-forest-400 text-white text-base font-semibold flex items-center justify-center gap-2.5 hover:bg-forest active:scale-[0.98] transition-all"
          >
            <ShoppingCart className="h-5 w-5 flex-shrink-0" />
            Commander
          </button>

          {/* Action destructrice : volontairement discrète, et jamais en un seul tap. */}
          {confirmClear ? (
            <div className="flex items-center justify-center gap-3 pt-0.5">
              <span className="text-xs text-white/55">Vider tout le panier ?</span>
              <button
                onClick={onClearAll}
                className="text-xs font-bold text-red-400 hover:text-red-300 px-2 py-1"
              >
                Oui, vider
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-xs font-semibold text-white/55 hover:text-white px-2 py-1"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="w-full text-xs font-semibold text-white/35 hover:text-white/70 py-1 transition-colors"
            >
              Vider le panier
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
