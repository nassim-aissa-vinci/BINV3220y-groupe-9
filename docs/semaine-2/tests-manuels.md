# Tests manuels (end-to-end) — Séance 7 : candidatures

Fonctionnalités testées : EF-32 (candidater, retirer) et EF-33 (consulter ses candidatures).

**Préparation**
- Lancer l'application avec `npm run dev`, puis ouvrir `http://localhost:5173`.
- Se connecter avec les comptes de démonstration (bouton « Changer d'utilisateur »).
- Données de départ : celles de démonstration (`docs/seed.md`). Pour repartir de zéro : `npm run db:reset`.

**Légende** : OK = résultat conforme à l'attendu ; Non testé = cas préparé mais pas encore exécuté.

## Parcours dans le navigateur

| # | Compte | Étapes | Résultat attendu | Résultat observé |
|---|---|---|---|---|
| 1 | Louis Claes | Ouvrir « Mes candidatures » | Message « Vous n'avez pas encore candidaté à une offre. » | OK |
| 2 | Louis Claes | « Offres » → « Candidater » sur une offre publiée → envoyer sans message | Confirmation affichée. Dans « Mes candidatures » : statut « En cours », « Aucun message » | Non testé |
| 3 | Louis Claes | Recharger « Mes candidatures » (F5) | La candidature du cas 2 est toujours affichée | Non testé |
| 4 | Louis Claes | Candidater de nouveau à la même offre | Message d'erreur : candidature déjà existante | Non testé |
| 5 | Dmytro Kovalenko | Candidater à une offre publiée avec un message | Le message apparaît dans « Mes candidatures », statut « En cours » | Non testé |
| 6 | Lucas Dupont | Candidater à « Application React de gestion de flotte » | Message d'erreur : déjà candidat | Non testé |
| 7 | Lucas Dupont, puis Inès Haddad | Comparer « Mes candidatures » | Chacun ne voit que ses propres candidatures | Non testé |
| 8 | Léa Mertens / Mateusz Kowalski | Ouvrir « Mes candidatures » | « Non retenue » / « Retenue », sans bouton « Retirer » | Non testé |
| 9 | Youssef El Amrani | « Retirer » sa candidature (API REST de facturation), puis F5 | Statut « Retirée », la ligne reste affichée | Non testé |
| 10 | Inès Haddad | Candidater de nouveau à « API REST de facturation » (candidature retirée) | Deux lignes : « En cours » (nouvelle) et « Retirée » (ancienne) | Non testé |
| 11 | Administrateur | Ouvrir « Offres » | Aucun bouton « Candidater » | Non testé |
| 12 | Administrateur | Regarder le menu, puis aller sur `/mes-candidatures` | Pas de lien « Mes candidatures », page introuvable | Non testé |
| 13 | Contact déposant | Ouvrir « Offres » | Aucun bouton « Candidater » | Non testé |

## Refus vérifiés par l'API (`backend/http/applications.http`)

Ces cas ne peuvent pas être provoqués depuis l'interface. Les requêtes sont prêtes dans le fichier
`.http` (extension REST Client, avec `npm run dev` lancé).

| # | Requête | Résultat attendu | Résultat observé |
|---|---|---|---|
| 14 | `POST /applications` par l'administrateur | 403 `FORBIDDEN` | Non testé |
| 15 | `POST /applications` par un contact déposant | 403 `FORBIDDEN` | Non testé |
| 16 | `POST /applications` sur une offre non publiée (soumise, en attente ou attribuée) | 409 `OFFER_NOT_PUBLISHED` | Non testé |
| 17 | `POST /applications` sur une offre inexistante | 404 `NOT_FOUND` | Non testé |
| 18 | `POST /applications` avec un message de plus de 1000 caractères | 400 `INVALID_BODY` | Non testé |
| 19 | `GET /applications/me` par l'administrateur | 403 `FORBIDDEN` | Non testé |
| 20 | `PATCH /applications/:id/withdraw` sur la candidature d'un autre étudiant | 404 `NOT_FOUND` | Non testé |
| 21 | `PATCH /applications/:id/withdraw` sur une candidature déjà traitée | 409 `APPLICATION_NOT_WITHDRAWABLE` | Non testé |
| 22 | `PATCH /applications/:id/withdraw` par l'administrateur | 403 `FORBIDDEN` | Non testé |

Les cas 14 à 22 sont aussi couverts par les tests automatiques du backend
(`backend/tests/applications.test.ts`), qui passent.
