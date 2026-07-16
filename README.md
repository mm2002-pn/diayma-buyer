# Diayma Buyer

Interface web **acheteuse** de **Diayma** — social commerce & live shopping (Sénégal 🇸🇳).

L'acheteuse arrive via un lien perso de vendeuse (`/s/{saleSlug}`) partagé depuis un
live TikTok, WhatsApp, ou Instagram. **Aucun compte, aucune connexion** — elle
consulte, choisit, paie. PWA installable sur l'écran d'accueil.

Consomme l'API [diayma-api](https://github.com/mm2002-pn/diayma-api) en anonyme.

---

## Stack

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** — palette Diayma (crème + vert profond + doré)
- **embla-carousel-react** — swipe TikTok-like entre produits
- **framer-motion** — transitions écrans
- **TanStack Query v5** — data fetching
- **axios** — HTTP client
- **Zustand** + `persist` — panier localStorage
- **react-hook-form** + **zod** — formulaires validés
- **vite-plugin-pwa** — installable, service worker

---

## Démarrage

```bash
npm install
cp .env.example .env
# renseigner VITE_API_URL (défaut: http://localhost:4000/api/v1)
npm run dev
```

Accès : http://localhost:5175

Pour tester : ouvre `http://localhost:5175/s/<saleSlug>` avec un `saleSlug`
existant en base (visible dans la colonne "Vendeuse" du back office admin).

---

## Structure

```
src/
├── App.tsx                          RouterProvider + QueryClientProvider
├── main.tsx
├── index.css                        Tailwind + tokens Diayma + btn utilitaires
├── lib/
│   ├── env.ts    api.ts             axios
│   ├── queryClient.ts
│   └── utils.ts                     cn(), formatCfa
├── stores/
│   └── cart.store.ts                Zustand persist
├── types/api.ts                     Product, Variant, Live, PaymentMethod
├── routes/router.tsx                Landing / Shop / Checkout / Success
├── components/
│   └── ShopHeader.tsx               header vendeuse + badge LIVE
└── modules/
    ├── landing/LandingPage.tsx      /
    ├── shop/CatalogPage.tsx         /s/:saleSlug  — swipe catalogue + FAB panier
    ├── checkout/CheckoutPage.tsx    /s/:saleSlug/checkout  — panier → coordonnées → paiement
    └── success/OrderSuccessPage.tsx /order/success/:id  — confirmation
```

---

## Parcours acheteuse (miroir de la maquette)

| # | Écran | Route |
|---|---|---|
| 0 | Lien TikTok / WhatsApp / Instagram | Hors app |
| 1 | **Catalogue** — swipe entre produits, gros bouton Commander | `/s/:saleSlug` |
| 2 | **Coordonnées** — Prénom, Nom, Téléphone, Adresse | `/s/:saleSlug/checkout` (étape 1) |
| 3 | **Paiement** — Orange Money / Wave / À la livraison | `/s/:saleSlug/checkout` (étape 2) |
| 4 | **Confirmation** — "Livré en 24h", contact vendeuse | `/order/success/:id` |

---

## PWA

Manifeste + service worker configurés (`vite-plugin-pwa` en `autoUpdate`).

À finaliser : icônes `icon-192.png` / `icon-512.png` / `icon-512-maskable.png`
dans `public/`. Après quoi, Chrome / Safari proposeront "Ajouter à l'écran d'accueil"
et l'app s'ouvre en plein écran.
