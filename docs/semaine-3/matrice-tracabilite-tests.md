# Traçabilité des tests — candidatures (EF-32, EF-33, RG-03)

## Périmètre et méthode

EF-32 demande qu'un étudiant puisse candidater à une offre publiée, avec message
facultatif, et retirer sa candidature tant qu'elle n'a pas été traitée. EF-33 demande
l'affichage des candidatures de l'étudiant avec les états « En cours », « Retenue »,
« Non retenue » et « Retirée » (`docs/cdc_gesta_developpement.md:205-206`). RG-03
limite la candidature aux offres au statut « Publiée » (`docs/cdc_gesta_developpement.md:139`).

Les décisions prises à la planification précisent notamment la règle anti-doublon,
la possibilité de recandidater après retrait, la définition de « traitée », les codes
HTTP, l'isolation par session, le tri et le report du filtre d'année
(`docs/semaine-2/bilan.md:11-30`).

**Classement strict appliqué à chaque cas** :

- **Couvert** : le test backend vérifie le code HTTP et l'effet attendu ou l'absence
  d'effet en base.
- **Partiel** : le test appelle la route et vérifie une partie du résultat, mais pas
  toutes ces assertions, en particulier l'état de la base après un refus. Un test
  frontend sous `stubFetch` vérifie uniquement le rendu/comportement de l'interface ;
  il ne prouve pas l'effet serveur ou la base.
- **Absent** : aucun test pertinent ne vérifie le cas.

Pour les GET, les tests vérifient parfois bien la réponse et son contenu, mais ne
vérifient pas explicitement l'absence d'effet en base ; ils sont donc marqués
**Partiel** suivant le critère strict demandé. Les tests backend cités sont ceux des
fichiers du dépôt ; les tests frontend listés sont des tests de composant avec API
simulée.

## EF-32 / RG-03 — candidater et refus

| Cas précis | Résultat attendu | Backend : test et assertions constatées | Frontend : test et assertions constatées | Classement |
|---|---|---|---|---|
| Candidater comme étudiant à une offre publiée avec message | `201`; une candidature `IN_PROGRESS` est créée pour l'étudiant connecté avec le message nettoyé. | `backend/tests/applications.test.ts` — « crée une candidature avec un message normalisé » (l. 198-216) : vérifie `201`, le DTO (`offerId`, message nettoyé, `IN_PROGRESS`) et relit `student_id` en base pour l'id retourné. | `frontend/tests/OffersPage.test.tsx` — « permet à un étudiant de candidater à une offre publiée avec un message » (l. 116-149) : vérifie le message de succès et le POST simulé (offre, message, en-têtes). | **Couvert** (backend) ; le test UI est complémentaire, sous mock. |
| Candidater sans champ message, avec message vide ou composé d'espaces | `201`; message nul dans la réponse et en base. | `backend/tests/applications.test.ts` — « accepte un message vide (%s) et le stocke à NULL » (l. 219-229), cas `undefined`, `""`, `"   "` : vérifie `201`, `response.body.message === null` et la valeur SQL `NULL`. | `frontend/tests/OffersPage.test.tsx` — « permet à un étudiant de candidater sans message » (l. 173-200) : succès et corps POST simulé avec message vide. | **Couvert** (backend). |
| Message normalisé à exactement 1000 caractères | Accepté, longueur conservée après `trim`. | `backend/tests/applications.test.ts` — « accepte un message normalisé de 1000 caractères » (l. 231-239) : vérifie `201` et la longueur de la réponse ; ne relit pas la base. | Aucun test de cette limite dans `frontend/tests/`. | **Partiel**. |
| Message normalisé de 1001 caractères | Refus `400 INVALID_BODY`, aucune candidature créée. | `backend/tests/applications.test.ts` — « rejette un message normalisé de plus de 1000 caractères » (l. 241-249) : vérifie `400` et le code d'erreur, mais pas l'absence d'insertion en base. | Aucun test de cette limite dans `frontend/tests/`. | **Partiel**. |
| Offre inexistante | Refus `404 NOT_FOUND`, aucune candidature créée. | `backend/tests/applications.test.ts` — « renvoie 404 pour une offre inexistante » (l. 276-281) : vérifie le statut et le code, pas l'état de la base. | Aucun test de ce cas dans `frontend/tests/`. | **Partiel**. |
| Offre non publiée : `SUBMITTED` | Refus `409 OFFER_NOT_PUBLISHED`, aucune insertion. | `backend/tests/applications.test.ts` — « refuse une offre existante qui n'est pas publiée (409) » (l. 283-290) utilise `OFFER.CLIENT_PORTAL`, une offre `SUBMITTED` dans le seed (`backend/src/db/seed/offersData.ts:31-40`) ; vérifie `409` et le code, mais pas l'absence d'insertion. | `frontend/tests/OffersPage.test.tsx` — « n'affiche pas l'action de candidature pour une offre non publiée » (l. 162-171) : la fixture est `p2Offer` (`SUBMITTED`) et vérifie qu'une seule action reste affichée pour l'offre publiée. C'est un contrôle d'interface simulé, pas un refus HTTP. | **Partiel** (ce seul statut est essayé côté route). |
| Offre non publiée : `PENDING` | Refus `409 OFFER_NOT_PUBLISHED`, aucune insertion. | Aucun appel de `POST /applications` avec une offre `PENDING` (statut présent dans le seed, `backend/src/db/seed/offersData.ts:59-68`). | Aucun test de soumission pour ce statut. | **Absent**. |
| Offre non publiée : `ASSIGNED` | Refus `409 OFFER_NOT_PUBLISHED`, aucune insertion. | Aucun appel de `POST /applications` avec une offre `ASSIGNED` (statut présent dans le seed, `backend/src/db/seed/offersData.ts:73-96`). | La fixture `otherOffer` est `ASSIGNED` dans `frontend/tests/OffersPage.test.tsx:17-24`, mais le test de l'action non publiée ne l'inclut pas (`:162-171`). Aucun test de soumission/refus pour ce statut. | **Absent**. |
| Offre non publiée : `ARCHIVED` | Refus `409 OFFER_NOT_PUBLISHED`, aucune insertion. | Aucun appel de `POST /applications` avec une offre `ARCHIVED` (statut présent dans le seed, `backend/src/db/seed/offersData.ts:137-151`). | Une fixture archivée apparaît dans les tests de liste des offres, mais aucun test de soumission pour ce statut. | **Absent**. |
| Doublon sur candidature `IN_PROGRESS` | Refus `409 APPLICATION_EXISTS`, pas de deuxième ligne. | `backend/tests/applications.test.ts` — `it.each` « refuse une candidature déjà existante au statut %s » (l. 292-308) : vérifie `409` et `APPLICATION_EXISTS` ; ne compare pas le nombre ou l'état des lignes en base après refus. | `frontend/tests/OffersPage.test.tsx` — « affiche le refus 409 d'une candidature déjà existante » (l. 202-214) : vérifie l'alerte d'une réponse simulée `409`, sans état serveur. | **Partiel**. |
| Doublon sur candidature `SELECTED` | Refus `409 APPLICATION_EXISTS`, la candidature retenue reste inchangée. | Même test paramétré dans `backend/tests/applications.test.ts` (l. 292-308), avec insertion préalable `SELECTED` ; vérifie le code HTTP seulement après la requête. | Pas de cas `SELECTED` de doublon côté frontend. | **Partiel**. |
| Doublon sur candidature `REJECTED` | Refus `409 APPLICATION_EXISTS`, la candidature rejetée reste inchangée. | Même test paramétré dans `backend/tests/applications.test.ts` (l. 292-308), avec insertion préalable `REJECTED` ; ne relit pas la base après le refus. | Pas de cas `REJECTED` de doublon côté frontend. | **Partiel**. |
| Nouvelle candidature après retrait | `201`; ancienne ligne `WITHDRAWN` conservée et nouvelle ligne `IN_PROGRESS`. | `backend/tests/applications.test.ts` — « retire une candidature en cours en conservant son historique » (l. 35-71) : vérifie le `200` du retrait, l'ancienne ligne inchangée sauf statut `WITHDRAWN`, le `201` de la nouvelle candidature et l'historique exact `["WITHDRAWN", "IN_PROGRESS"]`. Le test « permet de candidater à nouveau après une candidature retirée » (l. 310-315) vérifie séparément le `201` et `IN_PROGRESS`, mais pas la table. | `frontend/tests/ApplicationsPage.test.tsx` — « retire une candidature en cours et conserve sa ligne dans l'historique » (l. 101-127) : vérifie le rendu retiré et l'appel PATCH simulé, pas une nouvelle candidature ni la base. | **Couvert** (test backend combiné). |
| L'étudiant de la requête vient de la session, pas d'un `studentId` fourni par le client | Création au nom de l'étudiant authentifié uniquement. | `backend/tests/applications.test.ts` — « dérive l'étudiant de la session et ignore tout studentId fourni » (l. 251-263) : vérifie `201` et relit `student_id` en base, égal à l'étudiant du jeton plutôt qu'à celui soumis. | Aucun test d'usurpation du corps dans `frontend/tests/`. | **Couvert** pour l'identité de la ligne créée. |
| Corps de candidature invalide | Refus `400 INVALID_BODY`, aucune insertion. | `backend/tests/applications.test.ts` — « rejette un corps invalide » (l. 266-274) : vérifie `400` et le code ; pas de contrôle de la base. | Aucun test de ce corps invalide. | **Partiel**. |
| Rôle administrateur ou contact déposant tente de candidater | `403 FORBIDDEN`, aucune insertion. | `backend/tests/applications.test.ts` — `it.each` « refuse une candidature par %s (403) » (l. 179-194), admin et contact déposant : vérifie statut et code, mais pas la base après refus. | `frontend/tests/OffersPage.test.tsx` — « n'affiche pas l'action de candidature à un %s » (l. 152-160) : admin et déposant ne voient ni bouton ni formulaire. Ce n'est pas un test de sécurité de l'API. | **Partiel** pour ces deux rôles. |
| Autre rôle de contact (promoteur/signataire seul) tente de candidater | `403 FORBIDDEN`, aucune insertion. | Aucun test de POST avec un contact limité au rôle de promoteur ou signataire. | L'UI teste un contact déposant, pas ces rôles, pour l'action candidature. | **Absent**. |
| Requête POST sans session | `401 UNAUTHENTICATED`, aucune insertion. | `backend/tests/applications.test.ts` — « refuse une requête sans session (401) » dans le bloc POST (l. 179-186) : vérifie `401`, sans contrôle de la base. | Pas de test de POST sans session dans `frontend/tests/`. | **Partiel**. |
| Étudiant ayant déjà un stage validé candidate | Selon la décision de séance, aucun blocage additionnel n'est prévu. | Le bilan indique « Pas de blocage pour un étudiant qui a déjà un stage validé » (`docs/semaine-2/bilan.md:30`), mais aucun test de candidature dans cette situation. | Aucun test frontend de ce cas. | **Absent** (décision non couverte par un test). |

## EF-32 — retrait

| Cas précis | Résultat attendu | Backend : test et assertions constatées | Frontend : test et assertions constatées | Classement |
|---|---|---|---|---|
| Retirer sa candidature `IN_PROGRESS` | `200`; même ligne conservée avec statut `WITHDRAWN`. | `backend/tests/applications.test.ts` — « retire une candidature en cours en conservant son historique » (l. 35-58) : vérifie le code, le DTO retourné et la ligne SQL complète (`id`, étudiant, message, statut). | `frontend/tests/ApplicationsPage.test.tsx` — « retire une candidature en cours et conserve sa ligne dans l'historique » (l. 101-127) : vérifie le label « Retirée », la disparition du bouton et la requête PATCH simulée. | **Couvert** (backend). |
| Retirer une candidature `SELECTED` | Refus `409 APPLICATION_NOT_WITHDRAWABLE`; ligne inchangée. | `backend/tests/applications.test.ts` — `it.each` « refuse le retrait d'une candidature %s (409) » (l. 73-83) couvre `SELECTED`; vérifie `409` et le code, mais ne relit pas la ligne en base. | Aucun test frontend de retrait d'une candidature retenue. | **Partiel**. |
| Retirer une candidature `REJECTED` | Refus `409 APPLICATION_NOT_WITHDRAWABLE`; ligne inchangée. | Même test paramétré (l. 73-83) couvre `REJECTED`; vérifie le statut/code, pas l'absence de changement en base. | Aucun test frontend de retrait d'une candidature non retenue. | **Partiel**. |
| Retirer une candidature déjà `WITHDRAWN` | Refus `409 APPLICATION_NOT_WITHDRAWABLE`; ligne inchangée. | Même test paramétré (l. 73-83) couvre `WITHDRAWN`; pas d'assertion de base après le refus. | Aucun test frontend de second retrait. | **Partiel**. |
| Retirer la candidature d'un autre étudiant | `404 NOT_FOUND` pour ne pas révéler son existence ; aucune modification. | `backend/tests/applications.test.ts` — « renvoie 404 si la candidature appartient à un autre étudiant » (l. 85-94) : vérifie `404` et `NOT_FOUND`, mais ne relit pas le statut de la candidature ciblée. | Aucun test frontend inter-comptes de retrait. | **Partiel**. |
| Retrait par administrateur | `403 FORBIDDEN`; aucune modification. | `backend/tests/applications.test.ts` — « refuse le retrait par un administrateur (403) » (l. 103-112) : vérifie statut et code, pas la ligne SQL après tentative. | Pas de test d'appel PATCH sous ce rôle. | **Partiel**. |
| Retrait par contact ou autre rôle non étudiant | `403 FORBIDDEN`; aucune modification. | Aucun test PATCH sous session CONTACT. | Aucun test frontend d'appel PATCH sous ce profil. | **Absent**. |
| Retrait sans session | `401 UNAUTHENTICATED`; aucune modification. | Aucun test PATCH sans en-tête `Authorization`. | Aucun test frontend de retrait sans session. | **Absent**. |
| Retrait avec identifiant invalide | `400 INVALID_QUERY`; aucune modification. | `backend/tests/applications.test.ts` — « rejette un identifiant invalide (400) » (l. 114-121) : vérifie statut et code, pas l'état de la base. | Aucun test d'identifiant invalide. | **Partiel**. |
| Le backend refuse le retrait (`409`) et l'interface reste cohérente | Afficher l'erreur et garder la candidature retirable. | Le refus métier est testé avec statuts/codes dans le test paramétré ci-dessus, sans relire la base. | `frontend/tests/ApplicationsPage.test.tsx` — « affiche une erreur 409 et conserve l'action de retrait » (l. 129-142) : vérifie l'alerte et le bouton dans un scénario `409` simulé. | **Partiel** (UI simulée, pas de test d'intégration). |

## EF-33 — consulter, statuts, isolation et tri

| Cas précis | Résultat attendu | Backend : test et assertions constatées | Frontend : test et assertions constatées | Classement |
|---|---|---|---|---|
| Consulter ses candidatures, avec les détails d'offre associés | `200`; seules les candidatures du demandeur et leurs champs d'affichage sont retournés. | `backend/tests/applications.test.ts` — « retourne uniquement les candidatures de l'étudiant connecté » (l. 141-161) : vérifie `200`, la liste d'IDs, les champs offre/entreprise/année/période/statut, et l'absence de `studentId` dans le DTO. | `frontend/tests/ApplicationsPage.test.tsx` — « affiche ses candidatures avec les libellés français des statuts » (l. 54-72) : vérifie plusieurs titres, libellés et l'URL/jeton utilisés, sur réponse mockée. | **Partiel** selon le critère strict : la réponse est vérifiée, mais l'absence d'effet en base n'est pas contrôlée. |
| Ne pas exposer les candidatures d'un autre étudiant | Réponse `200` avec uniquement les données propres à la session. | `backend/tests/applications.test.ts` — « ne révèle pas les candidatures d'un autre étudiant » (l. 163-169) : vérifie `200`, une seule entrée et son ID, sans assertion d'absence d'effet en base. | Aucun test frontend qui charge deux étudiants et compare leurs listes. | **Partiel**. |
| Étudiant sans candidature | `200` avec `[]`; message vide côté UI. | `backend/tests/applications.test.ts` — « retourne une liste vide pour un étudiant sans candidature » (l. 171-176) : vérifie `200` et `[]`. | `frontend/tests/ApplicationsPage.test.tsx` — « affiche un état vide » (l. 74-82), et `frontend/tests/App.test.tsx` — « permet à l'étudiant d'ouvrir la liste de ses candidatures » (l. 58-73) : vérifient le message à partir d'une réponse mockée `[]`. | **Partiel** sous la règle stricte (réponse/UI vérifiées, pas l'absence d'effet base). |
| Une candidature à chacun des quatre statuts est affichée avec le bon libellé | Traduire `IN_PROGRESS`, `SELECTED`, `REJECTED`, `WITHDRAWN` en « En cours », « Retenue », « Non retenue », « Retirée ». | Le test GET de `backend/tests/applications.test.ts` (l. 141-161) vérifie explicitement `IN_PROGRESS` seulement ; il ne vérifie pas les quatre statuts dans une réponse de liste. | `frontend/tests/ApplicationsPage.test.tsx` — « affiche ses candidatures avec les libellés français des statuts » (l. 54-68) : fixture locale avec les quatre statuts et assertions sur les quatre libellés. | **Partiel** globalement : rendu des quatre états couvert côté UI simulée ; liste backend des quatre états non prouvée par ce test. |
| Les candidatures sont triées de la plus récente à la plus ancienne | `applied_at DESC`, puis `id DESC` pour départager les dates identiques. | `backend/tests/applications.test.ts` — « retourne uniquement les candidatures de l'étudiant connecté » (l. 141-148) vérifie l'ordre des deux IDs d'Inès. Les dates de seed sont 2026-10-03 puis 2026-09-30 (`backend/src/db/seed/offersData.ts:168-200`), ce qui exerce l'ordre par date ; aucun cas de dates identiques ne vérifie le départage par ID. | Le test de `ApplicationsPage.test.tsx` fournit les entrées dans un ordre statique et ne vérifie pas de tri. | **Partiel** : ordre par date exercé ; égalité de dates / second critère non testé. |
| Afficher toutes les années, conformément à la décision de reporter EF-72 | Les candidatures des années différentes restent visibles (pas de filtre année courante). | Aucun test GET ne construit une liste du même étudiant avec plusieurs années et ne vérifie qu'elles sont toutes renvoyées. | La fixture de `ApplicationsPage.test.tsx` contient seulement `2026-2027` (l. 6-48) ; aucun test d'années mêlées. | **Absent**. |
| Rôle non étudiant tente de consulter `GET /applications/me` | `403 FORBIDDEN`. | `backend/tests/applications.test.ts` — `it.each` « refuse la consultation par un %s (403) » (l. 130-139) couvre administrateur et contact déposant ; statut et code sont vérifiés, pas d'assertion DB. | `frontend/tests/NavBar.test.tsx` — « masque Mes candidatures à un %s » (l. 35-43) masque le lien pour admin et contact déposant, sans appeler l'API. | **Partiel** pour ces deux rôles ; les autres rôles de contact ne sont pas explicitement testés. |
| Consultation sans session | `401 UNAUTHENTICATED`. | `backend/tests/applications.test.ts` — « refuse une requête sans session (401) » dans le bloc GET (l. 124-129) : vérifie `401`, sans autre assertion. | Pas de test de chargement de la page Applications sans jeton. | **Partiel**. |

## Tests voisins, mais à ne pas attribuer à EF-32/33

- `backend/tests/db/constraints.test.ts:172-185` contient les tests de contrainte SQLite
  « refuse une deuxième candidature non retirée pour la même offre et le même étudiant »
  et « autorise une nouvelle candidature après retrait ». Ils
  vérifient l'index/la contrainte par insertion SQL, pas le code HTTP ni le service
  `POST /applications` ; ils ne changent donc pas le classement des scénarios de route
  ci-dessus.
- `backend/tests/db/seed.test.ts` — « couvre tous les statuts de candidature et une offre à
  plusieurs candidats » (l. 93-100) vérifie que les fixtures contiennent les
  états prévus ; ce n'est pas un test de réponse `GET /applications/me` ni d'affichage.
- `backend/tests/db/seed.test.ts` — « le stage issu d'une offre correspond à l'offre
  attribuée et à la candidature retenue » (l. 157-181) et les contrôles de cohérence
  candidature/stage vérifient les données de démonstration liées à RG-04 / EF-34, pas
  les parcours EF-32/33.
- `backend/tests/offers.test.ts` porte sur le catalogue `GET /offers`, ses filtres et
  sa visibilité (EF-30), pas sur la création ou la liste des candidatures.
- Les tests `backend/tests/auth.test.ts`, `companies.test.ts`, `health.test.ts`,
  `nodeVersion.test.ts` et `permissions.test.ts` couvrent respectivement
  l'authentification générique, les entreprises, la santé, la version de Node et des
  permissions ; ne pas les compter comme tests d'applications sans cas visant ces routes.
- Dans `frontend/tests/OffersPage.test.tsx`, seuls les tests de candidature cités plus
  haut relèvent du comportement EF-32 ; les tests de catalogue, filtre, chargement et
  visibilité des offres concernent EF-30 ou le fonctionnement général de la page.
- `frontend/tests/App.test.tsx` et `frontend/tests/NavBar.test.tsx` vérifient le routage
  et la navigation vers « Mes candidatures » ; ils ne vérifient pas l'isolation serveur,
  les statuts issus de la base ou les écritures de candidature.
- `frontend/tests/CompaniesPage.test.tsx`, `HomePage.test.tsx`, `LoginPage.test.tsx`
  et `guards.test.ts` ne testent pas EF-32/33.
