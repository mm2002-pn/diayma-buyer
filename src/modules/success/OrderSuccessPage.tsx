import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Check, Phone, Truck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import { useCart } from '@/stores/cart.store';

export function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = id ? Number(id) : null;
  useOrderSocket(orderId);
  const location = useLocation();
  const clear = useCart((s) => s.clear);

  useEffect(() => { clear(); }, [clear]);
  const navigate = useNavigate();
  const state = (location.state as { saleSlug?: string; buyerFirstName?: string } | null) ?? {};
  const saleSlug = state.saleSlug;
  const buyerFirstName = state.buyerFirstName;

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
          <div className="h-24 w-24 rounded-full bg-[#0066FF] flex items-center justify-center shadow-lg shadow-blue-500/30">
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
            <Truck className="h-7 w-7 text-[#0066FF]" />
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
        className="space-y-3 pt-6"
      >
        <a href="tel:+221000000000" className="btn-primary">
          <Phone className="h-5 w-5" />
          Contacter la vendeuse
        </a>
        {saleSlug && (
          <button className="btn-secondary" onClick={() => navigate(`/s/${saleSlug}`)}>
            <span>Retour au catalogue</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
