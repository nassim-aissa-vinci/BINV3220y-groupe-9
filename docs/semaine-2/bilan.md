# Bilan — Séance 7 : candidatures (EF-32, EF-33) avec GitHub Copilot

Branche `semaine-7`. Travail fait avec le mode **Plan**, puis le mode **Agent** de GitHub Copilot
(modèle choisi automatiquement : GPT-6 Luna ; 2,4 crédits pour la planification).

## 1. Choix faits pendant la planification

Le cahier des charges (`docs/cdc_gesta_developpement.md`, §7.4) ne tranche pas plusieurs points.
Copilot nous a posé des questions en mode Plan ; voici nos décisions :

- **Doublons interdits** : un étudiant ne peut pas avoir deux candidatures non retirées sur la même
  offre (409). Contrôle dans le service **et** index unique partiel en base (nouvelle migration 002).
  Conséquence : une candidature « Retenue » ou « Non retenue » bloque aussi une nouvelle candidature.
- **Nouvelle candidature possible après un retrait** : une nouvelle ligne est créée, l'ancienne reste
  « Retirée » (l'historique est conservé).
- **« Traitée »** = statut `SELECTED` ou `REJECTED`. On ne peut retirer qu'une candidature `IN_PROGRESS`.
- **Retirer = changer le statut** en `WITHDRAWN`, sans supprimer la ligne (EF-33 affiche « Retirée »).
- **Message facultatif** : espaces de début et de fin supprimés (`trim`), vide → `null`,
  1000 caractères maximum après nettoyage.
- **Routes** : `POST /applications`, `GET /applications/me`, `PATCH /applications/:applicationId/withdraw`.
  Aucun identifiant d'étudiant dans l'URL (ENF-04) : l'étudiant est toujours celui de la session.
- **Codes d'erreur** : 403 pour un autre rôle ; 404 pour une offre inexistante ; 409 pour une offre
  non publiée, un doublon ou un retrait impossible ; **404 (et non 403) pour la candidature d'un autre
  étudiant**, afin de ne pas révéler qu'elle existe (protection contre l'IDOR).
- **Tri de « Mes candidatures »** : plus récentes d'abord (`applied_at` puis `id` décroissants).
- **EF-72 (filtre sur l'année en cours) reporté** : les candidatures de toutes les années s'affichent.
  Limite notée dans `backend/API.md`. Filtrer aussi le catalogue des offres aurait touché à EF-30,
  hors périmètre.
- **Trois étapes séparées** (candidater, consulter, retirer), une à la fois, chacune vérifiée puis commitée.
- Pas de blocage pour un étudiant qui a déjà un stage validé (le CdC n'en parle pas).

À la relecture du plan, nous avons ajouté trois demandes : le bouton « Candidater » visible seulement
pour un étudiant et sur une offre publiée, un fichier `applications.http` pour tester les refus, et
la documentation de chaque route dans `API.md` dès l'étape qui la crée.

## 2. Résultat

**Ce qui fonctionne** : un étudiant candidate à une offre publiée (avec ou sans message), consulte
ses candidatures avec leur statut en français, et retire une candidature en cours. Les refus sont
contrôlés côté serveur (rôle, offre non publiée, doublon, retrait d'une candidature traitée ou
d'un autre étudiant).

**Difficultés rencontrées** :
- Les tests frontend ne démarraient pas dans le sandbox de Copilot (le démarrage des processus
  Vitest `forks` expirait). Lancés par nous dans le terminal de VS Code, ils passaient. Ensuite, nous
  avons demandé à Copilot de ne plus les lancer, et nous les avons exécutés nous-mêmes.
- Conséquence : un test frontend écrit par Copilot sans avoir pu l'exécuter échouait
  (`getByText("Aucun message")` trouvait 3 éléments). Détecté en lançant les tests, corrigé par
  une demande ciblée (`getAllByText`).
- Le push sur GitHub échouait : le token de GitHub CLI avait expiré. Résolu avec `gh auth login`.

**Limites restantes** :
- EF-72 non appliqué (voir les choix).
- Sur la page des offres, le bouton « Candidater » reste affiché pour une offre à laquelle l'étudiant
  a déjà candidaté ; un second envoi est refusé avec un message d'erreur (409).
- Le formulaire de candidature s'affiche sous le tableau des offres : avec une longue liste, il
  peut passer inaperçu.

## 3. Modifications

Commits : `9bb1c1b` (candidater), `5549e21` (refactoring du formulaire), `b606d7e` (consulter),
`e4917b8` (retirer), puis un commit de correction du lint.

**Backend**
- `db/migrations/002_applications_active_unique.sql` : index unique partiel
  `(offer_id, student_id) WHERE status <> 'WITHDRAWN'`. La migration `001` n'a pas été modifiée.
- `models/application.ts`, `mappers/application.mapper.ts` : types et conversions DBO → objet → DTO.
- `repositories/applications.repository.ts` : requêtes SQL. La liste est filtrée par `student_id`.
  Le retrait est une seule requête (`UPDATE … WHERE id = ? AND student_id = ? AND status = 'IN_PROGRESS'`).
- `services/applications.service.ts` : règles métier (rôle, offre publiée, message, doublon, retrait).
- `controllers/applications.controller.ts` : les 3 routes, avec validation du corps et de l'identifiant.
- `services/permissions.ts` : règles nommées `canApplyToOffers`, `canViewOwnApplications`,
  `canWithdrawOwnApplications`.
- `app.ts` (branchement des couches), `API.md` (documentation), `http/applications.http`.

**Frontend**
- `services/applications.service.ts`, `models/application.ts`, `utils/guards.ts` : appels à l'API
  et validation des réponses.
- `hooks/useApplyToOffer.ts`, `hooks/useApplications.ts` : état de chargement, d'erreur et d'envoi.
- `components/OfferTable.tsx`, `pages/OffersPage.tsx` : bouton « Candidater » et formulaire du message.
- `pages/ApplicationsPage.tsx` : page « Mes candidatures », avec le bouton « Retirer ».
- `App.tsx`, `components/NavBar.tsx`, `utils/permissions.ts` : route `/mes-candidatures` et lien,
  réservés aux étudiants. `utils/labels.ts` : libellés français des statuts.

**Décisions prises après lecture du code produit** : après l'étape 1, la logique du formulaire était
entièrement dans `OffersPage.tsx` (5 `useState` et l'envoi). Nous avons demandé de la déplacer dans un
hook, conformément aux conventions du projet (commit `5549e21`).

## 4. Validation fonctionnelle

Cas notés avant les essais. Seul le premier a été essayé dans le navigateur (`npm run dev`, connexions de démo).

| Cas | Compte | Attendu | Observé |
|---|---|---|---|
| Page « Mes candidatures » sans candidature | Louis | Message « Vous n'avez pas encore candidaté » | OK |
| Candidater **sans** message | Louis | Candidature « En cours » | Non testé |
| Candidater **avec** message | Dmytro | Message enregistré, « En cours » | Non testé |
| Candidature visible après rechargement (F5) | Louis, Dmytro | Toujours présente | Non testé |
| Doublon | Lucas (Gestion de flotte) | Erreur affichée (409) | Non testé |
| Séparation entre étudiants | Lucas puis Inès | Chacun ne voit que ses candidatures | Non testé |
| Statuts traités | Léa / Mateusz | « Non retenue » / « Retenue », pas de bouton « Retirer » | Non testé |
| Retrait d'une candidature en cours | Youssef | « Retirée », toujours visible après F5 | Non testé |
| Nouvelle candidature après retrait | Inès (API de facturation) | Deux lignes : « Retirée » et « En cours » | Non testé |
| Autre rôle | Admin, déposant | Ni bouton « Candidater » ni lien « Mes candidatures » ; `/mes-candidatures` refusé | Non testé |

Refus impossibles à provoquer dans l'interface, testés avec `backend/http/applications.http` :

| Requête | Attendu | Observé |
|---|---|---|
| `POST /applications` par l'admin / par un déposant | 403 | Non testé |
| `POST /applications` sur une offre non publiée | 409 | Non testé |
| `GET /applications/me` par l'admin | 403 | Non testé |
| Retrait de la candidature d'un autre étudiant | 404 | Non testé |
| Retrait d'une candidature déjà traitée | 409 | Non testé |

Faute de temps, seul le premier cas a été essayé dans le navigateur, et les refus n'ont pas été testés avec le fichier `.http`. Ces comportements sont couverts par les tests automatiques (§ 6), mais pas vérifiés manuellement.

## 5. Qualité

**Points vérifiés dans le code** (relecture des diffs dans le Contrôle de code source) :
- Les couches sont respectées : SQL dans les repositories, règles dans les services, aucun objet
  `Request` dans les services, erreurs signalées avec `HttpError`.
- Les règles d'accès sont nommées et regroupées dans `permissions.ts`, et vérifiées côté serveur.
  L'étudiant vient toujours de la session (`getCurrentUser(req)`), jamais d'un paramètre envoyé par le client.
- Le retrait est atomique : statut et propriétaire sont vérifiés dans la même requête `UPDATE`.
- Les requêtes simultanées sont gérées : l'index unique transforme un doublon concurrent en 409
  plutôt qu'en erreur 500.
- Aucune nouvelle dépendance, aucune modification de la configuration de Vitest.

**Problèmes repérés** :
- Étape 1 : logique du formulaire dans la page au lieu d'un hook → corrigé (`5549e21`).
- Deux tests frontend portaient le même nom, et les cas d'erreur n'étaient pas testés → corrigé.
- Un test frontend faux (voir § 2) → corrigé.
- **`npm run lint` échouait depuis l'étape 2** : `react(set-state-in-effect)` dans
  `hooks/useApplications.ts` (appels à `setIsLoading` et `setError` directement dans le `useEffect`).
  Copilot ne lançait que le typecheck et des tests ciblés, jamais le lint : seul `npm run check`
  l'a révélé. Corrigé par une demande ciblée, sur le modèle de `useOffers` : l'état de chargement est désormais associé au token de la requête, sans appel synchrone à un setter dans l'effet.
- Le typecheck a trouvé, à chaque étape, des erreurs de typage dans les tests écrits par Copilot,
  alors que ces tests passaient. Copilot les a corrigées.
- Petite incohérence de nom : la règle s'appelle `canViewOwnApplications` dans le backend et
  `canListApplications` dans le frontend. Non corrigé.
- Le rôle est vérifié deux fois, par `authorize` dans le contrôleur puis dans le service. Double
  protection volontaire, comme dans le code existant.

## 6. Tests et commandes

**Tests ajoutés**
- `backend/tests/applications.test.ts` : création (message normalisé, vide, 1000 et 1001 caractères),
  refus (corps invalide, offre inexistante 404, offre non publiée 409, doublons `IN_PROGRESS`,
  `SELECTED` et `REJECTED`), nouvelle candidature après retrait, liste limitée à l'étudiant connecté,
  liste vide, retrait (succès, 409 pour chaque statut non retirable, 404 pour un autre étudiant ou un
  identifiant inexistant, 403 pour l'admin, 400 pour un identifiant invalide), accès sans session (401).
- `backend/tests/db/constraints.test.ts` et `migrations.test.ts` : index unique partiel et migration 002.
- `frontend/tests/OffersPage.test.tsx` : candidature avec et sans message, affichage du 409, bouton
  absent pour l'admin, pour le déposant et pour une offre non publiée.
- `frontend/tests/ApplicationsPage.test.tsx` : libellés des statuts, liste vide, erreurs, session
  expirée, retrait, erreur 409 au retrait. Plus des compléments dans `NavBar`, `App` et `guards`.

**Exemple de comportement couvert par un test** : « dérive l'étudiant de la session et ignore tout
studentId fourni ». Le test envoie `POST /applications` connecté comme un étudiant, avec un
`studentId` appartenant à un autre étudiant dans le corps. Il vérifie que la candidature est créée au
nom de l'étudiant connecté. On ne peut donc pas candidater à la place de quelqu'un d'autre.

**Commandes exécutées**
- Avant la séance, `npm run check` sur `main` : réussi, avec 114 tests backend et 49 tests frontend.
- Par Copilot à chaque étape : tests backend ciblés, `npm run typecheck`, `git diff --check`.
- Par nous : `npm run test -w frontend` à chaque étape (en échec une fois à l'étape 2, voir § 2),
  `git diff --stat`.
- `npm run check` final : typecheck réussi, **147 tests backend** et **67 tests frontend** réussis,
  compilation réussie, mais **lint en échec** (voir § 5). Après correction, `npm run check` passe entièrement : lint, typecheck, tests et build.