import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Check, Phone, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

interface StateOrder {
  id: number;
  buyerPhone?: string;
  buyerName?: string;
  totalCfa?: number;
}

export function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as { order?: StateOrder; saleSlug?: string } | null) ?? {};
  const order = state.order;
  const saleSlug = state.saleSlug;

  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="h-24 w-24 rounded-full bg-forest flex items-center justify-center shadow-card"
        >
          <Check className="h-14 w-14 text-white" strokeWidth={3} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6 space-y-2"
        >
          <div className="text-forest/70 text-sm">Commande #{id}</div>
          <div className="text-forest text-lg font-medium">Confirmation envoyée</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 flex flex-col items-center gap-2"
        >
          <div className="rounded-2xl bg-gold/20 p-4">
            <Truck className="h-10 w-10 text-forest mx-auto" />
          </div>
          <div className="text-3xl font-bold text-forest mt-2 font-display">Livré en 24h</div>
          {order?.buyerName && (
            <div className="text-sm text-forest/60 mt-2">Bonjour {order.buyerName.split(' ')[0]}, on te contacte très vite.</div>
          )}
        </motion.div>
      </div>

      <div className="space-y-3 pt-6">
        <a
          href="tel:+221000000000"
          className="btn-primary bg-forest"
        >
          <Phone className="h-5 w-5" />
          Contacter la vendeuse
        </a>
        {saleSlug && (
          <button className="btn-secondary" onClick={() => navigate(`/s/${saleSlug}`)}>
            Retour au catalogue
          </button>
        )}
      </div>
    </div>
  );
}
