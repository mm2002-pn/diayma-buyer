# Écran Catalogue — points à adresser

Préparation de la refonte. Ce document **inventorie**, il ne tranche pas le
format retenu (grille, swipe plein écran, hybride) : cette décision est prise
dans un second temps.

Fichiers concernés :
- `src/modules/shop/CatalogPage.tsx` — version mobile (carrousel) + aiguillage
- `src/modules/shop/CatalogDesktop.tsx` — version desktop (grille)
- `src/components/ShopHeader.tsx` — en-tête vendeuse mobile
- `src/modules/shop/shop.api.ts` — appels API

---

## A. Blocages fonctionnels

Points issus de l'audit qui vivent dans ces fichiers. Ils conditionnent la
refonte : la nouvelle maquette doit prévoir la place pour les résoudre.

### A1 — Le produit actif n'est pas appliqué à l'arrivée
`CatalogPage.tsx:302-304` — le `useEffect` recopie `data.products` tel quel et
ignore `data.featuredProductId`, pourtant reçu de l'API. Le réordonnancement
n'existe que dans le gestionnaire de socket (ligne 287), donc uniquement si le
changement survient pendant que la page est déjà ouverte.
→ **La refonte doit définir où et comment le produit actif est mis en avant**
(première position ? bloc dédié ? badge ?).

### A2 — La boutique est inaccessible hors live
`CatalogPage.tsx:355-379` — un `if (!liveActive)` court-circuite tout le
catalogue et affiche « Pas de live en cours ».
→ **Décision D2 : à supprimer.** Le live devient un état d'enrichissement, plus
une condition d'accès. C'est le changement structurant de la refonte.

### A3 — Les variantes multiples sont perdues
`CatalogPage.tsx:67` et `CatalogDesktop.tsx:58` — seul l'identifiant du
**premier** axe de variante est envoyé (`types[0]`). Un produit Couleur + Taille
part au panier sans sa taille.
→ La refonte doit prévoir un sélecteur de variantes qui remonte **tous** les
axes, et une clé de panier qui les distingue.

### A4 — L'endpoint des lives est global et bloquant
`CatalogPage.tsx:277-281` — `/lives/active` est appelé toutes les 30 s et
renvoie **tous les lives de toutes les vendeuses** (champ `revenueCfa` compris),
filtrés ensuite côté client.
`CatalogPage.tsx:326` — l'écran reste en chargement tant que cette requête
globale n'a pas répondu, alors qu'elle n'est pas nécessaire pour afficher les
produits.
→ Besoin d'un endpoint par boutique, ou du statut live directement dans la
réponse `/shops/{slug}`. **À arbitrer avec le backend.**

---

## B. Informations manquantes à l'écran

C'est le cœur du problème pour des boutiques ouvertes en permanence : en live, la
vendeuse commente à l'oral et compense les manques. Hors live, l'acheteuse est
seule face à l'écran.

### B1 — Le nom du produit n'apparaît pas sur mobile
`CatalogPage.tsx:250-255` — la diapositive n'affiche **que le prix**. Ni nom, ni
description, ni stock. L'acheteuse regarde une photo et un montant.
Le nom n'apparaît qu'après ouverture du tiroir (ligne 113).

### B2 — Le stock n'est visible nulle part avant le tiroir
Ni sur la diapositive mobile, ni sur la carte desktop. On découvre « Rupture »
seulement après avoir tapé le produit (mobile) ou au checkout (desktop).
→ Prévoir un affichage type « Plus que 3 » / « Épuisé » sur la vignette.

### B3 — Aucune description produit
Le type `Product` (`src/types/api.ts:20-32`) ne contient aucun champ
description. **À vérifier avec le backend** : existe-t-il, ou faut-il l'ajouter ?
Sans lui, une boutique ouverte en permanence reste très pauvre.

### B4 — L'avatar de la vendeuse n'est jamais utilisé
`SellerBrief.avatarUrl` existe dans le type (`api.ts:17`) mais n'est utilisé
nulle part : `ShopHeader.tsx:31` et `CatalogDesktop.tsx:220,269` affichent
uniquement l'initiale du prénom. Manque de personnalisation, alors que tout le
modèle repose sur la relation à la vendeuse.

### B5 — La ville de la vendeuse est absente sur mobile
`seller.city` est affiché sur desktop (`CatalogDesktop.tsx:226`) mais pas dans
`ShopHeader.tsx`. Information utile puisque la vendeuse gère elle-même la
livraison (décision D3).

---

## C. Interactions à revoir

### C1 — Le geste principal est invisible
Pour ajouter un produit sur mobile, il faut **taper la photo**
(`CatalogPage.tsx:225-239`). Rien ne l'indique : aucun bouton, aucune icône,
aucune indication textuelle.

### C2 — Le bouton « Commander » ment quand le panier est vide
`CatalogPage.tsx:441-449` — panier vide, « Commander » ouvre en réalité le
tiroir d'ajout du produit courant. Le libellé ne correspond pas à l'action.

### C3 — Rien n'indique qu'on peut swiper
Le carrousel occupe tout l'écran sans laisser dépasser la diapositive suivante,
sans flèches, sans compteur. Seuls de petits points en bas
(`CatalogPage.tsx:414-425`) suggèrent qu'il y a autre chose.

### C4 — Pas de sélecteur de quantité sur desktop
`CatalogDesktop.tsx:61-75` — `handleAdd` ajoute toujours 1 unité. Le mobile a un
sélecteur (tiroir), le desktop non. Incohérence entre les deux versions.

### C5 — Le filtre « Rupture » est un filtre de vendeur
`CatalogDesktop.tsx:188` — les filtres sont `Tous / Nouveautés / Rupture`.
« Rupture » affiche **uniquement** les produits épuisés : utile pour gérer un
stock, absurde pour acheter.

### C6 — Impossible de modifier le panier depuis le catalogue
Une fois un produit ajouté, on ne peut ni le retirer ni changer sa quantité sans
aller jusqu'au checkout. Aucun aperçu du panier non plus.

### C7 — Bascule mobile/desktop à 768 px
`src/lib/useIsDesktop.ts` — une tablette en portrait bascule sur la grille
desktop avec sa barre latérale de filtres. À valider ou à repousser à 1024 px.

---

## D. États non gérés

### D1 — Catalogue vide
Si la boutique n'a aucun produit, la version mobile affiche un écran blanc avec
un bouton « Commander » inopérant : le carrousel est vide, `currentProduct` vaut
`undefined` (`CatalogPage.tsx:395`), donc le tiroir ne s'ouvre jamais.
Le desktop gère bien ce cas (`CatalogDesktop.tsx:375-380`). **Cas très probable
avec des boutiques ouvertes en permanence.**

### D2 — « Boutique introuvable » sans porte de sortie
`CatalogPage.tsx:336-346` — aucun bouton « Réessayer », alors qu'une simple
coupure réseau déclenche cet écran. Message identique pour un lien erroné et
pour une panne.

### D3 — Pas d'indicateur de chargement des images sur mobile
Le desktop a un squelette animé (`CatalogDesktop.tsx:83`), le mobile non : la
photo apparaît d'un coup après un temps mort. Pénalisant sur réseau sénégalais.

### D4 — Rupture de stock totale
Que se passe-t-il si tous les produits sont épuisés ? Aucun message dédié : sur
mobile on parcourt des photos toutes marquées « Rupture de stock » au tiroir.

---

## E. Qualité technique à traiter pendant la refonte

### E1 — Duplication de l'état des produits
`CatalogPage.tsx:269` — `products` est un `useState` alimenté depuis TanStack
Query par un `useEffect` (ligne 302). Toute nouvelle réponse du serveur écrase le
réordonnancement fait par le socket. Pattern à revoir : dériver l'ordre plutôt
que le stocker.

### E2 — Minuteurs non nettoyés
`CatalogPage.tsx:84` (`setTimeout` 900 ms) et `CatalogDesktop.tsx:74`
(`setTimeout` 2000 ms) ne sont pas annulés au démontage du composant.

### E3 — Deux composants qui dupliquent la même logique
La gestion des variantes, du stock et de l'ajout au panier est écrite deux fois,
presque à l'identique, dans `CatalogPage.tsx:38-85` et `CatalogDesktop.tsx:33-75`.
D'où le bug A3 présent en double. À factoriser dans un hook partagé.

### E4 — Résidus visuels bleus
Design doré (`#C9A84C`), mais ombres et fonds bleus subsistent :
`CatalogDesktop.tsx:177` (`shadow-blue-500/20`), ligne 245 (idem).

### E5 — Classe dupliquée
`CatalogPage.tsx:372` — `px-5 sm:px-6 sm:px-6`.

### E6 — Statistiques desktop écrites en dur
`CatalogDesktop.tsx:286-289` — « 24h Livraison » contredit la décision D3
(Diayma ne gère pas la livraison) et « 3 Paiements » est faux tant qu'Orange
Money n'est pas sélectionnable (bloquant B1 de l'audit).

---

## F. Accessibilité

- Photos produits avec `alt` vide quand le produit n'a pas de nom
  (`CatalogPage.tsx:242`, `CatalogDesktop.tsx:86`).
- Boutons de variantes sans état accessible (`aria-pressed` absent).
- Carrousel non navigable au clavier.
- Contrastes faibles sur les textes secondaires (`text-slate-300`, `text-ink/35`).

---

## Questions à trancher avant de coder

1. **Format mobile** : grille scrollable, swipe plein écran conservé, ou hybride
   (grille + mise en avant du produit actif pendant le live) ?
2. **Rôle du live** : simple badge, bandeau, ou bloc dédié pour le produit actif ?
3. **Description produit** : le backend peut-il en fournir une (point B3) ?
4. **Statut live** : peut-on l'obtenir via `/shops/{slug}` pour supprimer l'appel
   global `/lives/active` (point A4) ?
5. **Seuil mobile/desktop** : 768 px ou 1024 px (point C7) ?
