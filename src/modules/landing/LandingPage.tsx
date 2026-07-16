import { Radio } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-8 text-center">
      <div className="mb-6 flex items-center gap-2 rounded-full bg-forest text-white px-4 py-2 text-sm font-semibold">
        <Radio className="h-4 w-4" />
        Diayma
      </div>
      <h1 className="text-4xl font-bold text-forest font-display mb-4">
        Achète direct chez tes vendeuses préférées
      </h1>
      <p className="text-forest/70 mb-8">
        Ouvre le lien partagé par ta vendeuse pour découvrir ses produits.
      </p>
      <div className="text-xs text-forest/50">
        Pas de lien ? Demande-lui son <em>lien Diayma</em> sur WhatsApp.
      </div>
    </div>
  );
}
