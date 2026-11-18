# Conversation GitHub Copilot — Séance 9 : recherche d'offres en TDD (skill test-driven-development)

Export du chat Copilot de VS Code (mode Agent), converti du JSON en texte lisible.

---

## Échange 1

*modèle : agent-host-copilotcli:auto · crédits : 2.90*

**Utilisateur :**

Ajoute la recherche par mot-clé d'EF-30, limitée au titre des offres, côté API et interface.
Règles :
- rechercher un texte contenu dans le titre, sans distinguer majuscules et minuscules ;
- ignorer les espaces au début et à la fin du texte saisi ;
- recherche vide : afficher les offres normalement accessibles ;
- aucune correspondance : liste vide et message adapté ;
- combiner avec le filtre par période existant ;
- conserver la visibilité : un étudiant ne voit que les offres publiées ;
- plusieurs mots : rechercher l'expression entière.
Hors périmètre : recherche approximative et gestion des accents.
Ne lance pas les tests frontend dans ton terminal (ton sandbox les bloque) : je les lancerai.

**Copilot :**

> Read skill [test-driven-development] (`.github/skills/test-driven-development/SKILL.md`)

Je vais repérer le parcours API et interface des offres ainsi que leurs tests existants, puis préparer et lancer uniquement les tests de régression (sans lancer les tests frontend).

> Read `docs/architecture.md`

> Read `backend/API.md`

> Search for `offers|offres|Offer`

> Search for `offer|offers|offres|Offres`

Le parcours identifié passe par `GET /offers`, et les tests API ainsi que page offres existent déjà. Je lis leurs contrats et la règle de visibilité avant d’ajouter des tests ciblés côté API et interface.

> Read `backend/tests/offers.test.ts`

> Read `backend/src/controllers/offers.controller.ts`

> Read `backend/src/services/offers.service.ts`

> Read `frontend/tests/OffersPage.test.tsx`

> Read `frontend/src/pages/OffersPage.tsx`

> Read `frontend/src/hooks/useOffers.ts`

> Read `.github/skills/test-driven-development/writing-good-tests.md`

> Commande : `git status --short; Get-Content package.json; Get-Content backend\package.json`

> Read `frontend/tests/OffersPage.test.tsx`, lines 1 to 180

> Read `frontend/src/services/offers.service.ts`

> Read `backend/src/repositories/offers.repository.ts`

> Search for `GET /offers|period|query|titre`

> Search for `getOffers|fetchMock|findBy|screen.getBy|Offres de stage|Aucune offre`

> Search for `title:|INTERNAL_CHATBOT|BILLING_API|E2E_TESTS`

> Read `frontend/tests/helpers/fetchMock.ts`

Je vais d’abord ajouter les tests sans toucher au code applicatif : API pour casse, espaces, expression entière, période et visibilité étudiant ; interface pour l’envoi du mot-clé combiné au filtre et le message sans résultat. Je ne lancerai que le test API, conformément à ta consigne.

> Edit `backend/tests/offers.test.ts`

> Edit `frontend/tests/OffersPage.test.tsx`

> Commande : `npm run test -w backend -- tests/offers.test.ts`

> Ask User

> Question de Copilot : Valider les tests avant l’implémentation

Tu as validé les tests. Je passe à l’implémentation en réutilisant les conventions de recherche déjà présentes, en gardant la visibilité actuelle dans le service des offres et en documentant le nouveau paramètre API.

> Read `backend/src/controllers/companies.controller.ts`

> Read `backend/src/services/companies.service.ts`

> Read `backend/src/repositories/companies.repository.ts`

> Read `frontend/src/pages/CompaniesPage.tsx`

> Read `frontend/src/hooks/useCompanies.ts`

> Read `backend/API.md`, lines 133 to 175

> Read `frontend/src/components/SearchField.tsx`

> "Apply Patch" failed

> Read `backend/src/controllers/offers.controller.ts`

> Read `backend/src/repositories/offers.repository.ts`

> Commande : `git --no-pager diff -- backend/src/controllers/offers.controller.ts backend/src/repositories/offers.repository.ts backend/src/services/offers.service.ts frontend/src/services/offers.service.ts frontend/src/hooks/useOffers.ts frontend/src/pages/OffersPage.tsx backend/API.md`

> "Apply Patch" failed

> Edit `backend/src/repositories/offers.repository.ts`

> Edit `backend/src/services/offers.service.ts`, `frontend/src/services/offers.service.ts`, `frontend/src/hooks/useOffers.ts`, `frontend/src/pages/OffersPage.tsx`

> Edit `backend/API.md`

> Commande : `npm run test -w backend -- tests/offers.test.ts`

> Commande : `npm run typecheck -w backend`

> Commande : `npm run typecheck -w frontend`

Les 22 tests ciblés API passent désormais, et les vérifications TypeScript des deux workspaces sont vertes. Je complète par la suite backend et le lint ; les tests frontend restent volontairement non exécutés.

> Commande : `npm run test -w backend`

> Commande : `npm run lint`

> Commande : `npm run build`

> Commande : `git status --short; git --no-pager diff --check; git --no-pager diff --stat; git --no-pager diff -- backend/API.md backend/src/controllers/offers.controller.ts backend/src/repositories/offers.repository.ts backend/src/services/offers.service.ts backend/tests/offers.test.ts frontend/src/services/offers.service.ts frontend/src/hooks/useOffers.ts frontend/src/pages/OffersPage.tsx frontend/tests/OffersPage.test.tsx`

> Search for `^diff --git a/(backend/src/controllers/offers.controller.ts|backend/src/repos...`

> Read `frontend/src/hooks/useOffers.ts`

> Read `backend/src/repositories/offers.repository.ts`

> Read `frontend/src/pages/OffersPage.tsx`, lines 1 to 120

> Commande : `git --no-pager diff --check -- backend/API.md backend/src/controllers/offers.controller.ts backend/src/repositories/offers.repository.ts backend/src/services/offers.service.ts backend/tests/offers.test.ts frontend/src/hooks/useOffers.ts frontend/src/pages/OffersPage.tsx frontend/src/services/offers.service.ts frontend/tests/OffersPage.test.tsx; git status --short`

> Edit `frontend/tests/OffersPage.test.tsx`

> Commande : `git --no-pager diff --check -- backend/API.md backend/src/controllers/offers.controller.ts backend/src/repositories/offers.repository.ts backend/src/services/offers.service.ts backend/tests/offers.test.ts frontend/src/hooks/useOffers.ts frontend/src/pages/OffersPage.tsx frontend/src/services/offers.service.ts frontend/tests/OffersPage.test.tsx; if ($?) { Write-Output 'Diff whitespace check passed for task files.' }; git status --short`

La recherche EF-30 est ajoutée : `q` filtre les titres sans tenir compte de la casse, ignore les espaces extérieurs et traite plusieurs mots comme une expression continue. Le filtre se combine à la période et conserve les règles de visibilité. L’interface propose le champ de recherche et un message spécifique en cas de résultat vide.

Modifications principales : controller API (`backend/src/controllers/offers.controller.ts`), repository (`backend/src/repositories/offers.repository.ts`), page Offres (`frontend/src/pages/OffersPage.tsx`) et documentation API (`backend/API.md`).

Vérifications réussies : tests backend ciblés (22/22) et complets (153/153), typecheck des deux workspaces, lint et build. **Les tests frontend n’ont pas été lancés**, comme demandé. Les tests d’interface sont ajoutés dans OffersPage.test.tsx (`frontend/tests/OffersPage.test.tsx`).
