# Audit fonctionnel — Parcours acheteur (diayma-buyer)

Date : 28/07/2026 · Branche `main` · Commit `d77629d`

Périmètre : l'application web acheteuse (`apps/diayma-buyer`), confrontée aux
maquettes validées (`design/parcours_acheteur.png`) et au cahier des charges
produit (`apps/diayema-mobile/CLAUDE.md`).

---

## Verdict global

Le code est **techniquement sain** : TypeScript compile sans erreur, le linter ne
remonte rien, l'architecture est propre et lisible.

En revanche, le parcours comporte **5 anomalies bloquantes** avant le pilote, dont
deux touchent au cœur du modèle Diayema : le choix du moyen de paiement et le
« Produit Actif ».

| Sévérité | Nombre | Signification |
|---|---|---|
| Bloquant | 5 | À corriger avant le pilote |
| Important | 10 | Perte de commandes ou de données business |
| À améliorer | 13 | Qualité, confiance, conformité |

---

## Décisions produit actées

Ces points ont été tranchés par Omar. Ils ne sont **pas** des anomalies — ils sont
consignés ici pour que le développement s'aligne dessus.

**D1 — Le checkout ne demande que le numéro de téléphone.**
La maquette prévoyait un écran « Coordonnées » (Prénom + Nom) et le cahier des
charges vendeuse mentionnait une adresse. **Choix assumé** : on reste sur le
seul numéro, pour réduire la friction au maximum.
*Conséquence à répercuter* : l'écran « Détails commande » (V6) de l'app vendeuse
et la transmission au livreur doivent fonctionner avec un numéro seul. La
vendeuse récupère le nom et l'adresse par téléphone ou WhatsApp.

**D2 — Les boutiques deviennent ouvertes en permanence.**
On abandonne le modèle « accessible uniquement pendant un live ». Le catalogue
doit rester consultable et commandable en dehors des lives. Voir **B2** et
**I5** ci-dessous, qui deviennent des chantiers à part entière.

**D3 — Aucun frais de livraison à gérer.**
Dans le cadre du MVP, Diayma ne gère pas la livraison : c'est le vendeur qui
s'en charge de bout en bout. Aucun calcul, aucun affichage de frais n'est
attendu dans l'application.

---

## BLOQUANTS

### B1 — L'acheteuse ne peut pas choisir Orange Money

La maquette (écran 3) propose **trois boutons distincts** : Orange Money, Wave,
À la livraison.

Le code affiche **un seul bouton** « Payer en ligne » avec les deux logos, et
envoie systématiquement `WAVE` au serveur :

> `src/modules/checkout/CheckoutPage.tsx:270` — `onClick={() => onPay('WAVE')}`

Conséquences :
- Le type `ORANGE_MONEY` existe dans le code mais n'est **jamais utilisé**.
- Toute commande en ligne est enregistrée comme « Wave » en base, même payée par
  Orange Money → les statistiques de la vendeuse et la répartition des
  commissions sont fausses.

### B2 — Le « Produit Actif » n'est pas appliqué à l'arrivée

C'est le concept clé de Diayema : « un lien unique redirige toujours l'acheteur
vers le produit **actuellement** présenté ».

Le serveur renvoie bien `featuredProductId`, et le code le récupère… mais ne s'en
sert **que** si un évènement temps réel arrive pendant que la page est déjà
ouverte. À l'ouverture du lien, le produit mis en avant n'est pas remonté en
premier.

> `src/modules/shop/shop.api.ts:5` — `featuredProductId` est bien typé et reçu.
> `src/modules/shop/CatalogPage.tsx:302-304` — le `useEffect` recopie
> `data.products` tel quel, sans jamais lire `data.featuredProductId`.

Concrètement : la vendeuse dit « regardez ce sac » en live, l'acheteuse clique,
et tombe sur un autre produit. C'est exactement le problème que Diayema est censé
résoudre.

### B3 — Le rattachement au live se perd au rafraîchissement

Le `liveId` transite uniquement par la mémoire de navigation
(`navigate(..., { state: { liveId } })`).

> `src/modules/checkout/CheckoutPage.tsx:19` — `const liveId = (state as {...})?.liveId ?? null`

Si l'acheteuse rafraîchit la page, revient en arrière, ou ouvre le checkout
directement, `liveId` vaut `null`. La commande n'est **plus rattachée au live**.

Conséquences pour la vendeuse : le « CA du live en temps réel » (écran V4) et
« commandes regroupées par live » (V5) sont faux. Sur mobile, ce cas arrive très
souvent (l'utilisatrice bascule vers TikTok et revient).

### B4 — Le panier entier est vidé, même celui des autres vendeuses

`clear()` supprime **tous** les articles, sans filtrer par vendeuse.

> `src/stores/cart.store.ts:60` — `clear: () => set({ items: [] })`
> Appelé dans `CheckoutPage.tsx:70` et `OrderSuccessPage.tsx:15`.

Une acheteuse qui suit deux boutiques et remplit deux paniers en perd un en
validant l'autre. Le store possède pourtant déjà `itemsFor(saleSlug)` — la brique
existe, elle n'est simplement pas utilisée pour la suppression.

### B5 — Les produits à plusieurs variantes sont cassés

Quand un produit a plusieurs axes (ex. Couleur **et** Taille), seul l'identifiant
de la **première** variante est envoyé au serveur :

> `src/modules/shop/CatalogPage.tsx:67` — `const primaryVariant = types.length > 0 ? selectedByType.get(types[0]) ...`
> (même logique dans `src/modules/shop/CatalogDesktop.tsx:58`)

La taille choisie n'existe que dans un libellé d'affichage (`variantLabel`), qui
**n'est pas transmis** dans la commande.

Conséquences en cascade :
- La vendeuse reçoit « Robe rouge » sans savoir en quelle taille.
- Le stock est décrémenté sur la mauvaise ligne.
- Dans le panier, « Rouge / M » et « Rouge / L » fusionnent en une seule ligne,
  car la clé d'unicité est `productId + variantId` (`cart.store.ts:34-36`).

---

## IMPORTANTS

### I1 — Le prix affiché peut différer du prix facturé

Le panier est stocké en `localStorage` avec le prix figé au moment de l'ajout.
Au checkout, on revalide le **stock** mais pas le **prix**.

> `src/modules/checkout/CheckoutPage.tsx:40-50` — la `stockMap` ne contient que
> des stocks.

Si la vendeuse change son prix entre-temps, l'acheteuse voit un total et se voit
débiter un autre montant. Litige garanti — et pour un premier achat sans compte,
c'est fatal pour la confiance.

### I2 — Un produit supprimé passe la validation de stock

Quand un produit n'est plus dans le catalogue, `getStock` renvoie `Infinity`
au lieu de `0` :

> `src/modules/checkout/CheckoutPage.tsx:53` — `return stockMap.get(...) ?? Infinity`

Résultat : on peut commander un produit archivé ou supprimé. L'erreur ne
remontera qu'au niveau du serveur, avec un message technique.

### I3 — Le numéro de téléphone n'est pas vraiment validé

> `src/modules/checkout/CheckoutPage.tsx:13` — `const PHONE_RE = /^[0-9]{9}$/`

`000000000` ou `123456789` passent. Les préfixes sénégalais réels (77, 78, 76,
70, 75) ne sont pas vérifiés. Comme c'est le **seul** moyen de recontacter
l'acheteuse (cf. décision D1), une faute de frappe équivaut à une commande
perdue. Ce point devient critique du fait de D1.

### I4 — Le numéro de la vendeuse est un placeholder

> `src/modules/success/OrderSuccessPage.tsx:88` — `<a href="tel:+221000000000">`

Le bouton « Contacter la vendeuse » de l'écran de confirmation appelle un numéro
factice, identique pour toutes les vendeuses. Vu la décision D1 (la vendeuse doit
rappeler pour obtenir le nom et l'adresse), ce bouton devient un maillon
essentiel du parcours.

### I5 — Hors live, la boutique est totalement fermée

> `src/modules/shop/CatalogPage.tsx:355-379`

Sans live actif, l'acheteuse voit « Pas de live en cours ». Elle ne peut ni
parcourir le catalogue, ni recommander, ni retrouver un produit vu la veille.

**Décision D2 : ce comportement doit être supprimé.** Le catalogue devient
consultable et commandable en permanence ; le live devient un simple état
d'enrichissement (badge « Live », produit mis en avant) et non plus une condition
d'accès.

### I6 — L'acheteuse ne peut pas retrouver sa commande

Aucune page de suivi. Le statut n'arrive que par notification temps réel
(`useOrderSocket`), donc **uniquement tant que l'onglet reste ouvert**. Si elle
ferme la page, elle n'a plus aucune trace de sa commande.

### I7 — L'écran de confirmation ne récapitule rien

La commande (`state.order`) est transmise à la page… et jamais affichée. Pas de
montant, pas de liste d'articles, pas de mode de paiement.

> `src/modules/success/OrderSuccessPage.tsx:17` — seuls `saleSlug` et
> `buyerFirstName` sont lus.

### I8 — Code mort à supprimer : `buyerFirstName`

L'écran de confirmation sait afficher « Merci Aïda ! », mais rien n'envoie jamais
ce prénom. Compte tenu de la décision D1 (pas de collecte du prénom), ce code
doit être **retiré** plutôt que complété, ainsi que le message conditionnel
associé.

### I9 — Retour de paiement en ligne dégradé

Après redirection vers Bictorys (`window.location.href = data.checkoutUrl`), le
retour se fait sur une page **sans état de navigation**. Donc :
- pas de bouton « Retour au catalogue » (il dépend de `saleSlug`),
- aucun récapitulatif possible.

Il n'existe par ailleurs **aucune page d'échec de paiement** — si le paiement est
refusé, on ne sait pas où l'acheteuse atterrit.

### I10 — Toutes les données de lives sont exposées à tout le monde

> `src/modules/shop/CatalogPage.tsx:277-281` — `/lives/active` toutes les 30 s,
> filtré côté client.

Chaque acheteuse télécharge la liste de **tous les lives de toutes les
vendeuses** (avec le champ `revenueCfa`) pour n'en garder qu'un. C'est une fuite
de données commerciales et cela ne passera pas l'échelle.

De plus, l'écran reste bloqué en chargement tant que cette requête globale n'a pas
répondu (`isLoading || livesQuery.isLoading`, ligne 326).

---

## À AMÉLIORER

### Cohérence et marque

1. **Trois orthographes coexistent** : « diayema » (titre HTML, manifeste PWA),
   « Diayma » (en-tête du checkout, `CheckoutPage.tsx:130`, README), « Fayékou »
   (fichier de maquettes). À figer une fois pour toutes.
2. **Trois couleurs de thème contradictoires** : `#0066FF` (bleu, `index.html:6`),
   `#0F5B3A` (vert, manifeste PWA), `#C9A84C` (doré, effectivement utilisé dans
   l'interface). Des ombres bleues (`shadow-blue-500/20`) et des fonds bleus
   (`bg-blue-50`) subsistent partout dans un design doré — résidus de template.

### Conformité et confiance

3. **Aucune CGV, aucune mention sur les données personnelles.** On collecte un
   numéro de téléphone sans case à cocher ni lien. Au Sénégal, la CDP
   (Commission de Protection des Données Personnelles) l'exige.
4. « Paiement sécurisé · Données chiffrées » s'affiche même en paiement à la
   livraison, où il n'y a aucun paiement en ligne.
5. **« Livré en 24h · Partout à Dakar » est un engagement écrit en dur** sur
   l'écran de confirmation. Or, décision D3, Diayma ne gère pas la livraison : ce
   délai est promis au nom du vendeur sans qu'il puisse le tenir ni le modifier.
   Formulation à revoir (par exemple « La vendeuse te contacte pour organiser la
   livraison »). Le champ `seller.city` est par ailleurs disponible, mais
   « Dakar » est écrit en dur.

### PWA

6. **Les icônes PWA sont absentes** (`icon-192.png`, `icon-512.png`,
   `icon-512-maskable.png` déclarées dans `vite.config.ts` mais introuvables dans
   `public/`). « Ajouter à l'écran d'accueil » ne fonctionnera pas.

### Expérience utilisateur

7. Sur mobile, quand le panier est vide, le bouton « Commander » ouvre en fait le
   tiroir d'ajout du produit courant (`CatalogPage.tsx:444`). Le libellé ne
   correspond pas à l'action.
8. Rien n'indique qu'il faut **taper la photo** pour ajouter un produit — le geste
   principal du parcours mobile est invisible.
9. Sur desktop, pas de sélecteur de quantité à l'ajout (toujours 1).
10. Le catalogue desktop **ne montre pas le stock** : on ajoute au panier sans
    savoir combien il reste, le problème n'apparaît qu'au checkout. Le filtre
    « Rupture » (`CatalogDesktop.tsx:188`) est également contre-intuitif : il
    affiche **uniquement** les produits épuisés — utile pour un vendeur, pas pour
    un acheteur.
11. « Boutique introuvable » n'offre aucun bouton « Réessayer », alors qu'une
    simple coupure réseau déclenche cet écran.
12. La page d'accueil (`/`) n'offre aucun moyen d'entrer un lien boutique : une
    acheteuse qui atterrit là est dans une impasse.
13. Dans les champs quantité, effacer le contenu remet immédiatement `1`
    (`parseInt(...) || 1`) — saisie désagréable. Et `h-screen` sur le conteneur
    global (`AppShell.tsx:5`) provoque le classique bug de hauteur sur mobile
    quand la barre d'adresse se rétracte : `100dvh` est la correction standard.

---

## Ce qui est bien fait

- Architecture claire et modulaire (`modules/` par écran, `api` séparée du rendu).
- TypeScript compile sans erreur, linter propre.
- La revalidation du stock à l'ouverture du checkout (`staleTime: 0`) avec
  bannière rouge et boutons de paiement désactivés est bien pensée.
- La double protection contre le double-clic (`mutation.isPending`) est en place.
- Le temps réel (live démarré / terminé / produit mis en avant) est correctement
  branché, avec nettoyage des sockets au démontage.
- Le panier persiste en `localStorage` — bon réflexe pour un parcours mobile.
- La distinction mobile (carrousel façon TikTok) / desktop (grille) est un vrai
  plus par rapport au périmètre initial.

---

## À vérifier côté backend (hors de ce repo)

1. Le serveur trie-t-il déjà les produits en plaçant le produit actif en premier ?
   Si oui, **B2** est un faux positif — à confirmer.
2. L'API `/shops/{slug}` fonctionne-t-elle hors live ? Nécessaire pour la
   décision **D2** (boutiques ouvertes en permanence).
3. La confirmation WhatsApp (« Confirmation envoyée » sur la maquette) est-elle
   déclenchée côté serveur ?
4. Le stock est-il **réservé** à la création de commande ? Pendant un live, dix
   acheteuses peuvent valider le même dernier article en même temps.
5. Quelles URL de retour Bictorys sont configurées (succès **et** échec) ?
6. Existe-t-il un endpoint permettant de récupérer le numéro de téléphone de la
   vendeuse, nécessaire pour corriger **I4** ?

---

## Ordre de traitement recommandé

**Avant le pilote (bloquant)**
B1 (choix du paiement) → B5 (variantes multiples) → B4 (panier par vendeuse) →
B3 (rattachement au live) → B2 (produit actif).

**Chantier structurant (décision D2)**
I5 — ouverture permanente des boutiques : supprimer la condition d'accès liée au
live et refondre l'écran catalogue en conséquence.

**Juste après**
I1 (prix), I2 (produit supprimé), I3 (validation du numéro), I4 (contact
vendeuse), I9 (retour de paiement), I8 (nettoyage du code mort).

**Puis**
Suivi de commande (I6), récapitulatif de commande (I7), sécurisation de
l'endpoint des lives (I10), conformité (points 3 et 5) et icônes PWA (point 6).
