const KEY = 'diayma-last-shop';

/**
 * Boutique d'où part la commande en cours.
 *
 * Le paiement en ligne quitte le site vers Pay2Up et y revient par un
 * rechargement complet de la page : l'état de navigation de React Router
 * (`location.state`) est alors vide, et l'écran de confirmation ne sait plus
 * de quelle boutique il vient. On double donc ce state par un stockage qui
 * survit au rechargement, pour pouvoir ramener l'acheteuse au catalogue.
 */
export function rememberShop(saleSlug: string): void {
  try {
    localStorage.setItem(KEY, saleSlug);
  } catch {
    // Navigation privée ou stockage plein : on se rabat sur `location.state`.
  }
}

export function recallShop(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
