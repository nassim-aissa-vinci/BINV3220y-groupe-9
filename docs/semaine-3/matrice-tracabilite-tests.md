# Traçabilité des tests — candidatures (EF-32, EF-33, RG-03)

## Périmètre et méthode

EF-32 demande qu'un étudiant puisse candidater à une offre publiée, avec message
facultatif, et retirer sa candidature tant qu'elle n'a pas été traitée. EF-33 demande
l'affichage de ses candidatures avec les quatre statuts (`docs/cdc_gesta_developpement.md:205-206`).
RG-03 limite les candidatures aux offres publiées (`docs/cdc_gesta_developpement.md:139`).
Les décisions de planification de la séance 7 précisent doublons, retrait, codes
d'erreur, isolation, tri et report du filtre annuel (`docs/semaine-2/bilan.md:11-30`).

La colonne **Avant** reflète l'état documenté avant l'ajout/renforcement des tests dans
`backend/tests/applications.test.ts`. La colonne **Après** reflète les tests actuels.

- **Couvert** : test backend avec statut HTTP et assertions de l'effet attendu ou de
  l'absence d'effet en base.
- **Partiel** : seules certaines assertions du comportement existent. Les tests frontend
  avec `stubFetch` n'établissent pas l'effet serveur ni l'état SQLite.
- **Absent** : aucun test pertinent ne vérifie le cas.

Pour un refus, la couverture exige le statut HTTP, le code d'erreur et l'égalité du
snapshot des candidatures avant/après. Pour une lecture GET réussie, les tests actuels
vérifient la réponse, mais ne comparent pas la base : classement **Partiel** selon le
critère strict. Les résultats d'interface simulés sont indiqués séparément.

## EF-32 / RG-03 — candidature et refus

| Cas précis | Résultat attendu | Tests et assertions actuels | Avant | Après |
|---|---|---|---|---|
| Candidater à une offre publiée avec message | `201`, `IN_PROGRESS`, message nettoyé, ligne reliée à l'étudiant connecté. | Backend `applications.test.ts`, « crée une candidature avec un message normalisé » (l. 247-266) : `201`, DTO (offre, message, statut) et `student_id` relu en base. Frontend `OffersPage.test.tsx`, « permet à un étudiant de candidater à une offre publiée avec un message » (l. 116-149) : succès et POST simulé. | Couvert | Couvert |
| Message absent, vide ou espaces | `201`, message `null` dans la réponse et en base. | Backend « accepte un message vide (%s) et le stocke à NULL » (l. 268-278) : cas `undefined`, `""`, `"   "`, statut, réponse et valeur SQL `NULL`. Frontend `OffersPage.test.tsx`, « permet à un étudiant de candidater sans message » (l. 173-200), corps POST simulé. | Couvert | Couvert |
| Message normalisé à 1000 caractères | Accepté et longueur conservée. | Backend « accepte un message normalisé de 1000 caractères » (l. 280-288) : `201` et longueur dans la réponse, sans lecture de la ligne insérée. | Partiel | Partiel |
| Message normalisé supérieur à 1000 caractères | `400 INVALID_BODY`, aucune insertion. | Backend « rejette un message normalisé de plus de 1000 caractères » (l. 290-300) : statut, code et snapshot complet des candidatures inchangé. | Partiel | Couvert |
| Offre inexistante | `404 NOT_FOUND`, aucune insertion. | Backend « renvoie 404 pour une offre inexistante » (l. 329-336) : statut, code et snapshot inchangé. | Partiel | Couvert |
| Offre `SUBMITTED` | `409 OFFER_NOT_PUBLISHED`, aucune insertion. | Backend `it.each`, « refuse une candidature à une offre %s (409) » (l. 338-350), cas `CLIENT_PORTAL` ; statut, code et snapshot inchangé. Frontend « n'affiche pas l'action de candidature pour une offre non publiée » (`OffersPage.test.tsx`, l. 162-171) vérifie le bouton masqué pour la fixture `SUBMITTED`, sans appel de refus. | Partiel | Couvert |
| Offre `PENDING` | `409 OFFER_NOT_PUBLISHED`, aucune insertion. | Même test paramétré (l. 338-350), cas `E2E_TESTS` ; statut, code et snapshot inchangé. | Absent | Couvert |
| Offre `ASSIGNED` | `409 OFFER_NOT_PUBLISHED`, aucune insertion. | Même test paramétré (l. 338-350), cas `CLOUD_MIGRATION` ; statut, code et snapshot inchangé. | Absent | Couvert |
| Offre `ARCHIVED` | `409 OFFER_NOT_PUBLISHED`, aucune insertion. | Même test paramétré (l. 338-350), cas `PDF_REPORTS` ; statut, code et snapshot inchangé. | Absent | Couvert |
| Doublon sur `IN_PROGRESS` | `409 APPLICATION_EXISTS`, candidature initiale inchangée, pas de deuxième ligne. | Backend `it.each`, « refuse une candidature déjà existante au statut %s » (l. 352-370), cas `IN_PROGRESS` ; statut, code et snapshot inchangé. Frontend « affiche le refus 409 d'une candidature déjà existante » (`OffersPage.test.tsx`, l. 202-214) vérifie une alerte sur réponse simulée. | Partiel | Couvert |
| Doublon sur `SELECTED` | `409 APPLICATION_EXISTS`, candidature retenue inchangée. | Même test paramétré (l. 352-370), cas `SELECTED` injecté avant la requête ; statut, code et snapshot inchangé après. | Partiel | Couvert |
| Doublon sur `REJECTED` | `409 APPLICATION_EXISTS`, candidature non retenue inchangée. | Même test paramétré (l. 352-370), cas `REJECTED` injecté avant la requête ; statut, code et snapshot inchangé après. | Partiel | Couvert |
| Recandidater après retrait | `201`, ancienne ligne `WITHDRAWN` conservée et nouvelle ligne `IN_PROGRESS`. | Backend « retire une candidature en cours en conservant son historique » (l. 52-89) vérifie retrait HTTP/ligne, recandidature HTTP et historique SQL exact. « permet de candidater à nouveau après une candidature retirée » (l. 372-377) vérifie aussi le `201` et `IN_PROGRESS`. Frontend ApplicationsPage (l. 101-127) ne teste que l'affichage du retrait sous mock. | Couvert | Couvert |
| Identité d'étudiant dérivée de la session, corps avec `studentId` d'un tiers | La ligne créée appartient à l'étudiant connecté. | Backend « dérive l'étudiant de la session et ignore tout studentId fourni » (l. 302-314) : `201`, lecture SQL de `student_id` égale au demandeur connecté. | Couvert | Couvert |
| Corps de candidature invalide | `400 INVALID_BODY`, aucune insertion. | Backend « rejette un corps invalide » (l. 317-327) : statut, code et snapshot inchangé. | Partiel | Couvert |
| Rôle administrateur tente de candidater | `403 FORBIDDEN`, aucune insertion. | Backend `it.each`, « refuse une candidature par %s (403) » (l. 232-243), cas admin : statut, code et snapshot inchangé. Frontend OffersPage (l. 152-160) masque bouton/formulaire pour admin sous mock. | Partiel | Couvert |
| Contact déposant tente de candidater | `403 FORBIDDEN`, aucune insertion. | Même test paramétré (l. 232-243), cas déposant : statut, code et snapshot inchangé. Frontend OffersPage (l. 152-160) masque l'action sous mock. | Partiel | Couvert |
| Contact promoteur tente de candidater | `403 FORBIDDEN`, aucune insertion. | Même test paramétré (l. 232-243), cas `NADIA_CHERIF` : statut, code et snapshot inchangé. | Absent | Couvert |
| Contact signataire seul tente de candidater | `403 FORBIDDEN`, aucune insertion. | Aucun test dédié avec un compte contact limité au rôle de signataire seul. | Absent | Absent |
| POST sans session | `401 UNAUTHENTICATED`, aucune insertion. | Backend « refuse une requête sans session (401) » dans le bloc POST (l. 223-230) : statut, code et snapshot inchangé. | Partiel | Couvert |
| Étudiant ayant déjà un stage validé candidate | La décision séance 7 n'impose aucun blocage, donc candidature autorisée si l'offre est publiée. | La décision est mentionnée dans `docs/semaine-2/bilan.md:30` ; aucun test de candidature dans cette situation. | Absent | Absent |

## EF-32 — retrait

| Cas précis | Résultat attendu | Tests et assertions actuels | Avant | Après |
|---|---|---|---|---|
| Retirer sa candidature `IN_PROGRESS` | `200`, même ligne conservée au statut `WITHDRAWN`. | Backend « retire une candidature en cours en conservant son historique » (`applications.test.ts`, l. 52-71) : statut, DTO et ligne SQL complète. Frontend ApplicationsPage « retire une candidature en cours et conserve sa ligne dans l'historique » (l. 101-127) : libellé, bouton et PATCH simulé. | Couvert | Couvert |
| Retrait d'une candidature `SELECTED` | `409 APPLICATION_NOT_WITHDRAWABLE`, ligne inchangée. | Backend `it.each`, « refuse le retrait d'une candidature %s (409) » (l. 91-102), cas sélectionné : statut, code et snapshot inchangé. | Partiel | Couvert |
| Retrait d'une candidature `REJECTED` | `409 APPLICATION_NOT_WITHDRAWABLE`, ligne inchangée. | Même test paramétré (l. 91-102), cas non retenu : statut, code et snapshot inchangé. | Partiel | Couvert |
| Retrait d'une candidature déjà `WITHDRAWN` | `409 APPLICATION_NOT_WITHDRAWABLE`, ligne inchangée. | Même test paramétré (l. 91-102), cas déjà retiré : statut, code et snapshot inchangé. | Partiel | Couvert |
| Retrait de la candidature d'un autre étudiant | `404 NOT_FOUND`, candidature ciblée inchangée. | Backend « renvoie 404 si la candidature appartient à un autre étudiant » (l. 104-115) : statut, code et snapshot inchangé. | Partiel | Couvert |
| Retrait d'une candidature inexistante | `404 NOT_FOUND`, aucune ligne créée/modifiée. | Backend « renvoie 404 si la candidature n'existe pas » (l. 117-124) : statut, code et snapshot inchangé. | Partiel | Couvert |
| Retrait par administrateur | `403 FORBIDDEN`, aucune modification. | Backend `it.each`, « refuse le retrait par un %s (403) » (l. 126-137), cas admin : statut, code et snapshot inchangé. | Partiel | Couvert |
| Retrait par contact déposant | `403 FORBIDDEN`, aucune modification. | Même test paramétré (l. 126-137), cas contact déposant : statut, code et snapshot inchangé. | Absent | Couvert |
| Retrait par contact promoteur | `403 FORBIDDEN`, aucune modification. | Même test paramétré (l. 126-137), cas `NADIA_CHERIF` : statut, code et snapshot inchangé. | Absent | Couvert |
| Retrait par contact signataire seul | `403 FORBIDDEN`, aucune modification. | Aucun test dédié avec un compte contact limité au rôle de signataire seul. | Absent | Absent |
| PATCH sans session | `401 UNAUTHENTICATED`, aucune modification. | Backend « refuse le retrait sans session (401) » (l. 139-148) : statut, code et snapshot inchangé. | Absent | Couvert |
| Identifiant de candidature invalide | `400 INVALID_QUERY`, aucune modification. | Backend « rejette un identifiant invalide (400) » (l. 150-159) : statut, code et snapshot inchangé. | Partiel | Couvert |
| Le backend refuse un retrait `409` et l'interface garde l'action | Afficher l'erreur et laisser la candidature disponible à une nouvelle tentative. | Frontend ApplicationsPage « affiche une erreur 409 et conserve l'action de retrait » (l. 129-142) : alerte et bouton visibles sur réponse simulée ; pas d'assertion de base. | Partiel | Partiel |

## EF-33 — consultation, statuts, isolation et tri

| Cas précis | Résultat attendu | Tests et assertions actuels | Avant | Après |
|---|---|---|---|---|
| Consulter les candidatures et leurs détails d'offre | `200`, contenu limité à l'étudiant courant avec détails attendus. | Backend « retourne uniquement les candidatures de l'étudiant connecté » (`applications.test.ts`, l. 184-204) vérifie `200`, IDs, champs et absence de `studentId`. Frontend ApplicationsPage « affiche ses candidatures avec les libellés français des statuts » (l. 54-72) vérifie affichage et appel GET sous mock. | Partiel | Partiel |
| Isolation entre étudiants | Chaque étudiant ne voit que ses lignes, aucun détail d'un tiers. | Backend « retourne uniquement les candidatures de l'étudiant connecté » (l. 184-204) compare la liste attendue d'Inès ; « ne révèle pas les candidatures d'un autre étudiant » (l. 206-212) vérifie l'ID unique de Youssef. Aucun effet de base n'est contrôlé pour ces GET. | Partiel | Partiel |
| Étudiant sans candidature | `200 []`, message d'état vide dans l'interface. | Backend « retourne une liste vide pour un étudiant sans candidature » (l. 214-220) vérifie statut et réponse. Frontend ApplicationsPage « affiche un état vide » (l. 74-82) et App « permet à l'étudiant d'ouvrir la liste de ses candidatures » (`App.test.tsx`, l. 58-73) vérifient le rendu mocké. | Partiel | Partiel |
| Les quatre statuts ont le bon libellé | Traduire `IN_PROGRESS`, `SELECTED`, `REJECTED`, `WITHDRAWN`. | Frontend ApplicationsPage « affiche ses candidatures avec les libellés français des statuts » (l. 54-68) teste les quatre libellés avec fixture locale. Le GET backend ne vérifie explicitement que `IN_PROGRESS` (l. 184-204). | Partiel | Partiel |
| Tri des candidatures | `applied_at DESC`, puis `id DESC` en cas d'égalité. | Backend « retourne uniquement les candidatures de l'étudiant connecté » (l. 184-190) vérifie l'ordre de deux IDs dont les dates diffèrent ; égalité de date / départage par ID non testé. Frontend n'asserte pas le tri. | Partiel | Partiel |
| Candidatures de plusieurs années pour un même étudiant (EF-72 reporté) | Toutes restent affichées, sans filtre année courante. | Aucun test GET ne met en place des lignes de plusieurs années pour un même étudiant et n'en vérifie la présence. | Absent | Absent |
| GET par administrateur ou contact déposant | `403 FORBIDDEN`. | Backend `it.each`, « refuse la consultation par un %s (403) » (l. 172-182) couvre admin et contact déposant, vérifie statut, code et snapshot inchangé. Frontend NavBar « masque Mes candidatures à un %s » (l. 35-43) masque le lien sous mock. | Partiel | Couvert |
| GET par contact d'un autre rôle (promoteur ou signataire) | `403 FORBIDDEN`. | Le test paramétré GET (l. 172-182) n'utilise que l'administrateur et le contact déposant. Aucun test de cette route avec un contact promoteur/signataire. | Absent | Absent |
| GET sans session | `401 UNAUTHENTICATED`. | Backend « refuse une requête sans session (401) » dans le bloc GET (l. 163-170) : statut, code et snapshot inchangé. Aucun test de chargement frontend sans jeton. | Partiel | Couvert |

## Tests voisins hors EF-32/33

- `backend/tests/db/constraints.test.ts:172-185` vérifie par insertion SQL l'index
  interdisant le doublon et l'insertion possible après retrait ; ce n'est pas un test
  HTTP/service.
- `backend/tests/db/seed.test.ts:93-100` vérifie que les fixtures contiennent tous les
  statuts de candidature ; `:157-181` vérifie la cohérence du stage issu de l'offre et
  de la candidature retenue (RG-04/EF-34), pas les routes EF-32/33.
- `backend/tests/offers.test.ts` couvre le catalogue `GET /offers` et sa visibilité
  (EF-30), pas les routes de candidature.
- `auth.test.ts`, `companies.test.ts`, `health.test.ts`, `nodeVersion.test.ts`,
  `permissions.test.ts` et les tests frontend hors `OffersPage`, `ApplicationsPage`,
  `App` et `NavBar` ne sont pas attribués aux exigences de candidature sans assertion
  correspondante.

## Récapitulatif des classements

Comptage par ligne de cas des tableaux ci-dessus (un cas paramétré décliné par statut
ou rôle compte pour une ligne par variante).

| Exigence / parcours | Avant — Couvert | Avant — Partiel | Avant — Absent | Après — Couvert | Après — Partiel | Après — Absent |
|---|---:|---:|---:|---:|---:|---:|
| EF-32 candidature et refus (21 cas) | 4 | 11 | 6 | 18 | 1 | 2 |
| EF-32 retrait (13 cas) | 1 | 8 | 4 | 11 | 1 | 1 |
| EF-33 consultation (9 cas) | 0 | 7 | 2 | 2 | 5 | 2 |
| **Total (43 cas)** | **5** | **26** | **12** | **31** | **7** | **5** |
