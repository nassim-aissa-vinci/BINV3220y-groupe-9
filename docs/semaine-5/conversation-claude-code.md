# Conversation Claude Code — séance 10 (MCP et tests E2E Playwright)

Agent : Claude Code (modèle Claude Opus 5.5), utilisé à la place de GitHub Copilot avec l'accord
de l'enseignant. Date : 2026-11-27. Branche : `semaine-10`.

Ce fichier a été rédigé par l'agent à partir de la conversation : les demandes sont reproduites
telles quelles, les réponses sont résumées et les appels d'outils les plus importants sont cités
avec ce qu'ils ont renvoyé. Les sorties longues sont abrégées.

---

## 1. Lancer le backend

**Demande**

> lance le backend de ce dossier

**Réponse de l'agent**

- Lecture de `backend/package.json` : script `dev` = `tsx watch src/main.ts` ; `backend/.env`
  présent.
- Lancement en arrière-plan de `npm run dev` dans `backend/`.
- Sortie : `API Gesta démarrée sur http://localhost:3000` puis `Mode démo actif : connexion sans
  mot de passe, réservée au développement local`.

---

## 2. Vérifier les trois premières étapes de la séance

**Demande** : vérifier si les trois demandes suivantes ont bien été réalisées.

> Lis docs/semaine-4.md et les règles de recherche d'offres par titre de la semaine 9 (EF-30).
> Ne modifie pas le code applicatif.
> Crée e2e/recherche-offres/scenarios.md avec deux scénarios numérotés :
> - Scénario 1 : recherche avec résultat (cas nominal).
> - Scénario 2 : recherche sans résultat (cas limite).
> Pour chacun, indique : le rôle utilisé, les offres nécessaires (titre, statut publiée ou non,
> visibilité), les actions dans l'interface et le résultat observable attendu.
> Base-toi sur les données de test ou le seed existants du projet et dis-moi lesquels.
> Justifie le choix des deux cas en quelques lignes. Ne génère aucun test pour l'instant.

> Crée ou complète le fichier .mcp.json à la racine du projet (pas dans frontend/ ni .vscode/)
> avec une entrée "playwright" de type http, url http://localhost:8931/mcp, tools ["*"].
> Si le fichier existe, ajoute l'entrée sans supprimer les autres serveurs. Ne touche pas à
> .vscode/mcp.json.
> Vérifie que le JSON est valide et dis-moi comment vérifier que le serveur playwright apparaît
> dans le chat.

> Utilise les outils du serveur Playwright MCP pour exécuter le scénario 1 décrit dans
> e2e/recherche-offres/scenarios.md. […] Ne modifie pas le code de l'application et ne génère
> pas de script de test. […]

**Vérifications effectuées par l'agent**

- `scenarios.md` : comparé au seed (`offersData.ts`, `peopleData.ts`, `companiesData.ts`) et au
  frontend (`OffersPage.tsx`, `LoginPage.tsx`, `NavBar.tsx`, `labels.ts`). Titres, statuts,
  entreprise, libellés et messages de l'interface correspondent. Le filtre backend
  (`instr(lower(o.title), lower(@search))`) confirme les résultats attendus.
- `.mcp.json` : contenu conforme, `JSON.parse` réussi ; `.vscode/mcp.json` absent.
- Code applicatif : `git diff --ignore-cr-at-eol` vide sur `frontend/src` et `backend/src` — les
  fichiers marqués modifiés ne diffèrent que par leurs fins de ligne.
- Étape 3 : aucune trace de l'exécution dans le dépôt, et le serveur MCP ne répondait pas sur
  le port 8931 (`curl` → code `000`).

**Conclusion** : étapes 1 et 2 faites ; étape 3 non vérifiable. Remarque : `tests/example.spec.ts`
et `playwright.config.ts` sont les fichiers par défaut de `npm init playwright`.

---

## 3. Lancer le serveur Playwright MCP

**Demande**

> lance le serveur playwright MCP sur le port 8931

**Réponse de l'agent**

- Lancement en arrière-plan : `npx -y @playwright/mcp@latest --port 8931` (sans `--isolated`).
- Sortie : `Listening on http://localhost:8931`. Un `GET /mcp` répond `400`, ce qui est normal
  (le point d'accès attend une session MCP).
- Backend (`:3000`), frontend (`:5173`) et serveur MCP (`:8931`) sont actifs.

---

## 4. Exécuter le scénario 1 avec Playwright MCP

**Demande**

> exécute le scénario 1 avec Playwright MCP

**Démarche** : le serveur ayant démarré après la session, ses outils n'étaient pas chargés dans
l'agent. L'agent a écrit un petit client MCP (JSON-RPC sur HTTP, hors du dépôt) pour appeler
directement les outils du serveur Playwright MCP. `tools/list` a renvoyé 25 outils, dont
`browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_wait_for`,
`browser_take_screenshot` et `browser_console_messages`.

**Appels d'outils et retours**

1. `browser_navigate` `{"url":"http://localhost:5173"}`
   ```
   await page.goto('http://localhost:5173');
   - Page URL: http://localhost:5173/
   - Page Title: Gesta
   ```
2. `browser_snapshot` → page de connexion :
   ```yaml
   - heading "Connexion de démonstration" [level=1] [ref=e8]
   - heading "Étudiants" [level=2] [ref=e15]
   - button [ref=e33]:
       - strong [ref=e34]: Lucas Dupont
   ```
3. `browser_click` `{"element":"Bouton Lucas Dupont","ref":"e33"}` → refusé :
   `Invalid input: expected string, received undefined → at target` (mauvais nom de paramètre).
4. `browser_click` `{"element":"Bouton Lucas Dupont","target":"e33"}`
   ```
   await page.getByRole('button', { name: 'Lucas Dupont' }).click();
   ```
   `browser_snapshot` : `heading "Bonjour Lucas"`, navigation avec `link "Offres" [ref=e124]`.
5. `browser_click` `{"element":"Lien Offres","target":"e124"}`
   ```
   await page.getByRole('link', { name: 'Offres' }).click();
   ```
   `browser_snapshot` : `searchbox "Mot-clé dans le titre" [ref=e141]`,
   `option "Toutes les périodes" [selected]`, `paragraph: 4 offres`.
6. `browser_type` `{"element":"Champ Mot-clé dans le titre","target":"e141","text":"application"}`
   ```
   await page.getByRole('searchbox', { name: 'Mot-clé dans le titre' }).fill('application');
   ```
7. `browser_wait_for` `{"time":1}` → `Waited for 1 seconds` (la recherche attend 300 ms).
8. `browser_snapshot` :
   ```yaml
   - searchbox "Mot-clé dans le titre" [active] [ref=e141]: application
   - paragraph [ref=e192]: 1 offre
   - row [ref=e204]:
       - cell "Application React de gestion de flotte"
       - cell "Lumen Digital"
       - cell "2026-2027"
       - cell "P2"
       - cell "Publiée"
   ```
9. `browser_take_screenshot` → capture enregistrée
   ([scenario1-mcp.png](./scenario1-mcp.png)).
10. `browser_console_messages` `{"level":"error"}` → `Total messages: 3 (Errors: 0, Warnings: 0)`.

**Compte rendu de l'agent** : scénario 1 réussi, aucun écart. « 1 offre », une seule ligne
(l'offre flotte, publiée), « Migration d'une application vers le cloud » absente, aucun message
« Aucune offre… ». Remarques : le serveur MCP crée `scenario1-resultat.png` et `.playwright-mcp/`
à la racine (à ignorer dans git) ; le bouton « Candidater » apparaît sur l'offre flotte alors que
Lucas y a déjà une candidature en cours dans le seed (hors scénario, non analysé).

---

## 5. Vérifier tout l'énoncé de la semaine 10

**Demande**

> Pour faire plus simple, vérifie que tout ce qui est demandé dans
> "C:\Users\…\Downloads\semaine-10-mcp-playwright.pdf" est respecté, Tiens le pptx du prof si tu
> en as besoin : "C:\Users\…\Downloads\MCP_agents_codage_HE_Vinci.pptx"

**Constat de l'agent** (à partir du PDF)

- Section 1 (scénarios) : fait.
- Section 2 (MCP) : fait, mais serveur lancé sans `--isolated` et pas encore arrêté.
- Section 3 (Playwright Test) : non fait — `testDir: './tests'` au lieu de `./e2e`, `baseURL`
  commenté et pointant sur `:3000`, `webServer` commenté, trois navigateurs ; pas de
  `recherche-offres.spec.ts` ; pas d'exécutions ni de `npm run check`.
- Section 4 (défaut volontaire, comparaison) : non fait.
- Section 5 (`docs/semaine-5.md`, conversations, PR) : non fait.
- À corriger : `.playwright-mcp/` non ignoré ; workflow CI généré qui lancerait les tests sans
  backend ni frontend.

---

## 6. Réaliser la suite

**Demande**

> vas-y fais toute la suite

**Actions de l'agent**

1. Arrêt du serveur Playwright MCP.
2. `playwright.config.ts` réécrit : `testDir: "./e2e"`, Chromium seul, `baseURL`
   `http://localhost:5174`, deux `webServer` :
   - API : `npm run db:reset -w backend && npm exec -w backend -- tsx src/main.ts` avec
     `API_PORT=3100`, `DATABASE_PATH=data/gesta-e2e.db`, `DEMO_AUTH_ENABLED=true` et un
     `JWT_SECRET` aléatoire généré à chaque exécution ;
   - frontend : `npm run dev -w frontend -- --port 5174` avec `API_PORT=3100`.
3. `e2e/recherche-offres/recherche-offres.spec.ts` créé : un test par scénario, sélecteurs par
   rôle (`getByRole("button", { name: "Lucas Dupont" })`, `getByRole("searchbox", { name:
   "Mot-clé dans le titre" })`…), état initial « 4 offres » vérifié avant la recherche.
   `tests/example.spec.ts` supprimé.
4. Exécutions :
   ```
   npx playwright test   →  2 passed (6.0s)
   npx playwright test   →  2 passed (5.9s)
   ```
   `backend/data/gesta.db` inchangé (date du 9 novembre), `gesta-e2e.db` recréé.
5. Défaut volontaire dans `offers.repository.ts` : filtre remplacé par
   `(@search IS NULL OR @search IS NOT NULL)`.
   ```
   ✘ scénario 1 … getByText('1 offre', { exact: true }) — element(s) not found
   ✘ scénario 2 … getByText('Aucune offre ne correspond à votre recherche.') — element(s) not found
   2 failed
   ```
   Code restauré (`git diff --ignore-cr-at-eol` vide), puis `2 passed (5.9s)`.
6. `package.json` : script `test:e2e`. `.gitignore` : `/.playwright-mcp/`. Workflow
   `.github/workflows/playwright.yml` adapté (Node 22, Chromium, `npm run test:e2e`).
7. `npm run check` : réussi — lint sans avertissement, typecheck, tests backend 160/160,
   frontend 69/69, build. Fichiers E2E vérifiés en plus avec `tsc --strict` et `oxlint` (0
   erreur).
8. `docs/semaine-5.md` rédigé ; capture déplacée dans `docs/semaine-5/scenario1-mcp.png`.
9. Branche `semaine-10` créée, commit local `636ab86` avec les seuls fichiers de la séance (les
   fichiers modifiés uniquement par les fins de ligne sont exclus). Aucun push.

---

## 7. Conversation exportée

**Demande**

> Le prof a dit qu'on pouvait utiliser d'autres ia que copilot mais ce serait à nos frais, donc
> tu peux generer toi meme un fichier md de nos conversations

**Réponse de l'agent** : création de ce fichier et mise à jour de `docs/semaine-5.md` (lien vers
la conversation, retrait de la limite « Claude Code au lieu de Copilot »).
