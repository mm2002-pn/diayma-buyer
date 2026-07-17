import { MessageCircle, ShoppingBag, Truck, ArrowRight } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-cream">
      <header className="border-b border-forest/10 bg-cream/85 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-forest text-cream flex items-center justify-center font-serif text-xl font-bold">
              D
            </div>
            <span className="text-xl font-display font-semibold text-forest tracking-tight">Diayma</span>
          </div>
          <div className="text-sm text-forest/60 hidden md:block">
            Boutique locale · Livraison 24h à Dakar
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-cream-100 via-cream to-cream-200 border-b border-forest/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-forest/10 px-3 py-1 text-xs font-medium text-forest/70 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                Social commerce du Sénégal
              </div>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium text-forest tracking-tightest leading-[1.05] mb-6">
                Le marché sénégalais,{' '}
                <em className="text-clay not-italic">à portée de main.</em>
              </h1>
              <p className="text-forest/70 text-lg md:text-xl max-w-xl mb-8 leading-relaxed">
                Achète directement chez tes vendeuses préférées pendant leurs
                lives, sans compte et sans complication. Paye avec Orange Money,
                Wave ou à la livraison.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-forest border-b-2 border-forest pb-0.5">
                  Reçois un lien de vendeuse pour commencer
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Décor visuel */}
            <div className="hidden md:block relative aspect-square max-w-md ml-auto">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gold/25 via-clay/15 to-forest/15 rotate-3" />
              <div className="relative h-full w-full rounded-3xl bg-forest overflow-hidden shadow-2xl flex items-center justify-center">
                <div className="text-center px-8">
                  <div className="font-display text-cream text-6xl mb-3">D</div>
                  <div className="text-cream/70 text-sm uppercase tracking-widest">
                    Diayma
                  </div>
                  <div className="text-cream text-lg font-display mt-4">
                    « Achète auprès de celles que tu aimes. »
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Étapes */}
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <div className="text-center mb-14">
            <div className="text-xs uppercase tracking-widest text-forest/50 font-semibold mb-3">
              Comment ça marche
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-medium text-forest tracking-tight">
              Commander en 3 étapes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                icon: MessageCircle,
                title: 'Reçois le lien',
                desc: 'Ta vendeuse partage son lien Diayma sur WhatsApp ou pendant un live TikTok / Instagram.',
              },
              {
                num: '02',
                icon: ShoppingBag,
                title: 'Choisis & paie',
                desc: 'Découvre la boutique, sélectionne le produit puis paie avec Orange Money, Wave, ou à la livraison.',
              },
              {
                num: '03',
                icon: Truck,
                title: 'Reçois en 24h',
                desc: 'La vendeuse te contacte pour organiser la livraison chez toi, partout à Dakar.',
              },
            ].map((s) => (
              <div
                key={s.num}
                className="relative rounded-3xl bg-white p-8 shadow-soft border border-forest/5 hover:shadow-card transition-shadow"
              >
                <div className="absolute top-6 right-6 text-forest/8 font-display text-6xl font-bold leading-none">
                  {s.num}
                </div>
                <div className="h-12 w-12 rounded-2xl bg-gold/20 text-forest flex items-center justify-center mb-5">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-2xl font-medium text-forest mb-2">{s.title}</h3>
                <p className="text-forest/60 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bandeau */}
        <section className="bg-forest text-cream">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              ['24h', 'Livraison Dakar'],
              ['3', 'Modes de paiement'],
              ['0', 'Compte à créer'],
              ['100%', 'Local'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-5xl font-medium mb-2">{n}</div>
                <div className="text-cream/70 text-xs uppercase tracking-widest">{l}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-forest/10 bg-white py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-forest/60">
          <div className="flex items-center gap-2 font-display">
            <span className="text-forest font-semibold">Diayma</span>
            <span>·</span>
            <span>Fait avec ❤️ à Dakar</span>
          </div>
          <div className="text-xs text-forest/50">
            Pas de lien ? Demande à ta vendeuse son <em className="not-italic font-semibold">lien Diayma</em> sur WhatsApp.
          </div>
        </div>
      </footer>
    </div>
  );
}
