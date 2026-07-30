import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Check, Truck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import { useCart } from '@/stores/cart.store';
import { recallShop } from '@/lib/lastShop';

export function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = id ? Number(id) : null;
  useOrderSocket(orderId);
  const location = useLocation();
  const navigate = useNavigate();
  const clear = useCart((s) => s.clear);
  const clearFor = useCart((s) => s.clearFor);

  const state = (location.state as { saleSlug?: string; buyerFirstName?: string } | null) ?? {};
  /**
   * Après un paiement en ligne, Pay2Up renvoie ici par un rechargement complet
   * de la page : `location.state` est vide. On retombe alors sur la boutique
   * mémorisée au passage en caisse, sans quoi l'écran serait sans issue.
   */
  const saleSlug = state.saleSlug ?? recallShop() ?? undefined;
  const buyerFirstName = state.buyerFirstName;

  // La commande est passée : ce panier n'a plus lieu d'être. Les autres
  // boutiques ne sont vidées que si l'on ne sait pas d'où vient la commande.
  useEffect(() => {
    if (saleSlug) clearFor(saleSlug);
    else clear();
  }, [saleSlug, clearFor, clear]);

  return (
    <div className="flex-1 flex flex-col bg-white p-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="relative mb-8"
        >
          <div className="h-24 w-24 rounded-full bg-[#C9A84C] flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Check className="h-12 w-12 text-white" strokeWidth={2.5} />
          </div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 300 }}
            className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-gold flex items-center justify-center shadow-sm"
          >
            <span className="text-sm">🎉</span>
          </motion.div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-1.5 mb-10"
        >
          <div className="text-xs text-slate-400 font-bold uppercase tracking-[0.15em]">
            Commande #{id}
          </div>
          <h1 className="font-display text-3xl font-medium text-slate-900 tracking-tight">
            {buyerFirstName ? `Merci ${buyerFirstName} !` : 'Commande confirmée !'}
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
            {buyerFirstName
              ? 'On te contacte très vite pour organiser la livraison.'
              : 'La vendeuse te contactera pour organiser ta livraison.'}
          </p>
        </motion.div>

        {/* Delivery card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="w-full max-w-xs bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col items-center gap-3"
        >
          <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Truck className="h-7 w-7 text-[#C9A84C]" />
          </div>
          <div>
            <div className="font-display text-2xl font-medium text-slate-900 tracking-tight">Livré en 24h</div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Partout à Dakar</div>
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="pt-6"
      >
        {/* Pas de bouton « contacter la vendeuse » : le lien boutique est
            public, on n'y expose pas son numéro — qui est aussi son
            identifiant de connexion. C'est elle qui rappelle pour la
            livraison, comme annoncé plus haut. */}
        {saleSlug && (
          <button className="btn-primary" onClick={() => navigate(`/s/${saleSlug}`)}>
            <span>Continuer mes achats</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
