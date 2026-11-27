Conversation : [Claude Code — séance 10](./semaine-5/conversation-claude-code.md)

# Bilan de la séance 10 — MCP et tests end-to-end avec Playwright

Fonctionnalité vérifiée : recherche d'offres par titre (EF-30), développée à la séance 9
([bilan](./semaine-4.md), § 3).

## 1. Scénarios

Scénarios décrits dans [e2e/recherche-offres/scenarios.md](../e2e/recherche-offres/scenarios.md),
à partir du seed de démonstration (`backend/src/db/seed/`), rôle étudiant **Lucas Dupont** :

1. **Recherche avec résultat** : saisir `application` → « 1 offre », seule « Application React
   de gestion de flotte » (Lumen Digital, Publiée) est affichée.
2. **Recherche sans résultat** : saisir `bout en bout` → message « Aucune offre ne correspond à
   votre recherche. », ni tableau ni compteur.

Justification du choix :

- Le scénario 1 couvre le parcours principal et l'insensibilité à la casse. Le mot
  « application » figure aussi dans le titre d'une offre **attribuée** : le scénario vérifie
  que la recherche ne contourne pas la visibilité étudiant.
- Le scénario 2 couvre le cas limite le plus visible : le message propre à la recherche,
  distinct de « Aucune offre à afficher. ». L'expression de plusieurs mots existe en base, mais
  seulement dans une offre **en attente** : le cas vérifie aussi qu'une offre non publiée ne
  « fuit » pas par la recherche.

## 2. Exploration avec Playwright MCP

Serveur lancé à la racine : `npx -y @playwright/mcp@latest --port 8931` (sans l'option
`--isolated` demandée), déclaré dans [.mcp.json](../.mcp.json) en `http` sur
`http://localhost:8931/mcp`. Backend (`:3000`) et frontend (`:5173`) lancés avec `npm run dev`.
Agent utilisé : Claude Code à la place de GitHub Copilot (autorisé par l'enseignant), qui a
appelé les outils du serveur Playwright MCP.

**Scénario exécuté : 1 — réussi, aucun écart.** Après saisie de `application`, la page affichait
« 1 offre » et une seule ligne « Application React de gestion de flotte / Lumen Digital /
2026-2027 / P2 / Publiée » ; « Migration d'une application vers le cloud » n'apparaissait pas ;
aucune erreur dans la console. Capture : [semaine-5/scenario1-mcp.png](./semaine-5/scenario1-mcp.png).

Appels d'outils observés :

| Outil | Arguments | Ce qu'il a renvoyé à l'agent |
|---|---|---|
| `browser_navigate` | `http://localhost:5173` | Code exécuté `await page.goto('http://localhost:5173')`, URL et titre de page « Gesta », lien vers l'instantané |
| `browser_snapshot` | — | Arbre d'accessibilité YAML : titre « Connexion de démonstration », groupe « Étudiants », `button [ref=e33]` « Lucas Dupont » |
| `browser_click` | `target: e33` | `await page.getByRole('button', { name: 'Lucas Dupont' }).click()` |
| `browser_click` | `target: e124` | `await page.getByRole('link', { name: 'Offres' }).click()` |
| `browser_snapshot` | — | `searchbox "Mot-clé dans le titre" [ref=e141]`, « Toutes les périodes » sélectionné, « 4 offres » |
| `browser_type` | `target: e141`, `application` | `await page.getByRole('searchbox', { name: 'Mot-clé dans le titre' }).fill('application')` |
| `browser_snapshot` | — | « 1 offre » et une seule ligne de tableau, celle de l'offre attendue |
| `browser_console_messages` | `level: error` | 3 messages, 0 erreur |

Les références (`e33`, `e141`…) viennent de l'instantané : l'agent doit lire la page avant
d'agir. Un premier `browser_click` a été refusé (`expected string, received undefined → at
target`) : le paramètre avait été passé sous le nom `ref` au lieu de `target`.

Le serveur MCP a été arrêté à la fin de l'exploration. Ses fichiers de travail
(`.playwright-mcp/`) sont ignorés par git.

## 3. Tests automatisés avec Playwright Test

Fichiers :

- [playwright.config.ts](../playwright.config.ts) : `testDir: "./e2e"`, Chromium seul,
  `baseURL` sur le frontend. `webServer` démarre une **pile dédiée** aux tests : API sur le
  port 3100 avec la base `backend/data/gesta-e2e.db` **recréée depuis le seed** à chaque
  lancement (`npm run db:reset`), frontend Vite sur le port 5174 dont le proxy pointe vers
  cette API. Le `JWT_SECRET` est généré à chaque exécution. La base de développement
  `gesta.db` n'est pas touchée.
- [e2e/recherche-offres/recherche-offres.spec.ts](../e2e/recherche-offres/recherche-offres.spec.ts) :
  un test par scénario, numéro dans le nom du test.
- `package.json` : script `npm run test:e2e` (`playwright test`).
- [.github/workflows/playwright.yml](../.github/workflows/playwright.yml) : exécution des tests
  E2E en CI sur les PR et les push vers `main`.
- Supprimé : l'exemple `tests/example.spec.ts` généré par `npm init playwright`.

Données maîtrisées : les tests ne font que lire, sur une base recréée depuis le seed au
démarrage. Chaque test se connecte lui-même dans un contexte de navigateur isolé : aucun
nettoyage n'est nécessaire et l'ordre d'exécution n'a pas d'importance (exécution en parallèle).

Principales assertions (sélecteurs par rôle et nom accessible) :

- Commun (état initial) : connexion confirmée par le titre « Bonjour Lucas », URL `/offres`,
  période vide, **« 4 offres »** avant toute recherche.
- Scénario 1 : « 1 offre » visible ; **1 ligne** de tableau ; cellules titre = « Application
  React de gestion de flotte », entreprise = « Lumen Digital », statut = « Publiée » ;
  « Migration d'une application vers le cloud » absent ; aucun des deux messages vides.
- Scénario 2 : « Aucune offre ne correspond à votre recherche. » visible ; aucun tableau ;
  aucun compteur `N offre(s)` ; « Aucune offre à afficher. » absent ; « Automatisation des
  tests de bout en bout » absent.

Résultats :

- `npx playwright test`, 1re exécution : **2 passed (6.0s)**.
- `npx playwright test`, 2e exécution : **2 passed (5.9s)**.
- `npm run check` : **réussi** — lint backend et frontend sans avertissement, typecheck
  réussi, tests backend 160/160, tests frontend 69/69, build réussi. `check` ne lance pas les
  tests E2E (ils demandent un navigateur et deux serveurs) : ils restent lancés explicitement
  avec `npm run test:e2e`. Les deux fichiers E2E passent `tsc --strict` et `oxlint`.

## 4. Vérification : les tests détectent-ils un défaut ?

Défaut temporaire dans `backend/src/repositories/offers.repository.ts` : le filtre de recherche
`instr(lower(o.title), lower(@search)) > 0` a été remplacé par une condition toujours vraie.

- Avec le défaut : **2 failed**. Scénario 1 : `getByText('1 offre', { exact: true })` introuvable
  (les 4 offres restent affichées). Scénario 2 : message « Aucune offre ne correspond à votre
  recherche. » introuvable. Les deux échecs viennent du défaut, pas de la configuration : la
  connexion et l'état initial « 4 offres » ont été vérifiés avant.
- Code restauré (aucune différence avec le commit, hors fins de ligne) : **2 passed (5.9s)**.

## 5. Comparaison

1. **Playwright MCP** donne à l'agent des outils pour piloter un vrai navigateur pendant la
   conversation : il lit l'état de la page (arbre d'accessibilité) puis agit dessus. Action vue
   passer par un outil MCP : `browser_type` sur le champ « Mot-clé dans le titre » avec
   `application`, traduit en `page.getByRole('searchbox', …).fill('application')`.
2. **Les scripts Playwright Test** sont versionnés, réexécutables sans agent et déterministes :
   les mêmes actions et les mêmes assertions à chaque lancement, en CI comme en local, avec un
   verdict binaire. Le compte rendu MCP est une interprétation ponctuelle de l'agent, qu'il faut
   vérifier soi-même, et qui ne protège pas contre une régression future.
3. **Exploration MCP** : pour découvrir une page, vérifier rapidement une fonctionnalité qui vient
   d'être codée, reproduire un bug signalé ou trouver les bons sélecteurs avant d'écrire un test.
   **Test automatisé** : pour tout comportement qui doit rester vrai (règles métier comme la
   visibilité des offres), avant chaque fusion de PR et en CI.

## Limites et points ouverts

- Le serveur MCP a été lancé sans l'option `--isolated` : le profil du navigateur n'était pas
  isolé (sans conséquence ici, l'application utilise une connexion de démonstration).
- Seul le scénario 1 a été exécuté par MCP ; les deux scénarios sont couverts par Playwright Test.
- Observation hors scénario : le bouton « Candidater » est affiché sur l'offre flotte alors que
  le seed contient une candidature en cours de Lucas sur cette offre. Non analysé.
