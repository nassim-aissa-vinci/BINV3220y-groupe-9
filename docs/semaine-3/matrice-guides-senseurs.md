# Séance « harnais agentique » — matrice des guides et des senseurs

## Lecture de la matrice

- **Feedforward** : consigne ou référence en amont de la production du code.
- **Feedback** : observation d'un code, d'une requête ou d'un comportement après coup.
- **Inférentiel** : interprété par une personne ou une IA ; sa conformité ne découle pas automatiquement du fichier.
- **Computationnel** : règle exécutable qui produit un résultat déterministe (diagnostic, assertion ou rejet).

Un document prescriptif n'est pas un senseur exécutable. À l'inverse, une configuration de linter ne dicte pas l'architecture complète : elle ne vérifie que les règles activées.

## Guides (feedforward)

| Nom / fichier | Nature | Ce qu'il demande ou décrit | Exemple concret | Pendant cette séance |
|---|---|---|---|---|
| Instructions Copilot — `.github/copilot-instructions.md` | Feedforward, **inférentiel** | Conventions données à l'agent : limites entre couches, validation, droits, migrations et commandes de vérification. | « Add schema changes as a new ordered `backend/src/db/migrations/NNN_name.sql` migration; do not edit migrations that have already been applied » (`.github/copilot-instructions.md:73`). | Consignes présentes et consultées/interprétées. Pas une commande et donc pas « exécutées ». |
| README — `README.md` | Feedforward, **inférentiel** | Prérequis et mode d'emploi du dépôt ; recommande notamment le contrôle avant un commit important. | `npm run check` est décrit comme « à lancer avant chaque commit important » (`README.md:61`). | Consulté ; `npm run check` a ensuite été exécuté par nous et réussi. |
| Architecture — `docs/architecture.md` | Feedforward, **inférentiel** | Définit les responsabilités et frontières des couches, le flux des requêtes et la façon de faire évoluer le schéma. | Les services « ne reçoivent jamais `Request` ni `Response` » (`docs/architecture.md:42`) ; les migrations existantes ne doivent pas être modifiées (`docs/architecture.md:60-62`). | Référence examinée ; aucune vérification automatique propre à ce document. |
| Cahier des charges — `docs/cdc_gesta_developpement.md` | Feedforward métier, **inférentiel** | Fixe les objectifs, exigences et règles métier ; précise que « Doit » marque une exigence obligatoire (`docs/cdc_gesta_developpement.md:12-13`). | RG-04 exige qu'à la sélection d'un candidat l'offre soit attribuée, le stage créé et les autres candidatures rejetées (`docs/cdc_gesta_developpement.md:140`). | Référence examinée ; ce texte n'est pas lui-même exécuté ni une preuve que chaque exigence est implémentée. |
| Contrat API — `backend/API.md` | Feedforward, **inférentiel** | Décrit les entrées, statuts et formes de réponses attendus de l'API. | Toute erreur suit `{ "error": { "code", "message" } }` et le tableau associe notamment 403 à `FORBIDDEN` (`backend/API.md:20-34`). | Référence présente ; pas d'exécution directe du document. Des tests backend vérifient certains comportements documentés. |
| Modèle de pull request — `.github/pull_request_template.md` | Feedforward de revue, **inférentiel** | Invite l'auteur à documenter fonctionnalité, changements, vérifications et travail avec l'agent ; propose des cases à cocher. | Une case invite à cocher si `npm run check` passe sans erreur ni avertissement (`.github/pull_request_template.md:9-15`). | Pas de pull request créée pendant la séance : modèle non instancié, cases non vérifiées ici. |
| Protocole E2E — `docs/semaine-2/tests-manuels.md` | Guide de test manuel ; feedback humain, **inférentiel** | Énumère parcours, profils et résultats attendus dans le navigateur ou via l'API. | Le cas 1 est noté `OK`, mais les cas 2 à 13 et 14 à 22 sont notés `Non testé` dans le document (`docs/semaine-2/tests-manuels.md:10-47`). | Aucun parcours navigateur/API manuel exécuté cette séance. Le `OK` du cas 1 est un résultat déjà inscrit dans le document, pas un résultat de cette séance. |

`docs/seed.md` est un catalogue de données fictives et cite des invariants vérifiés par des tests (`docs/seed.md:79-84`) ; il aide à comprendre les fixtures, mais n'est ni une consigne générale à l'agent ni un capteur autonome. Les bilans et transcriptions présents dans `docs/` sont des traces de séance, pas des configurations exécutables.

## Senseurs (feedback)

| Nom / fichier | Nature | Ce qu'il vérifie | Exemple concret de règle ou résultat | État pendant cette séance |
|---|---|---|---|---|
| Oxlint backend — `backend/.oxlintrc.json` et `backend/package.json` | Feedback, **computationnel** | Analyse statique backend ; `--deny-warnings` fait échouer la commande sur les avertissements. | `typescript/no-explicit-any` et `eqeqeq` sont en erreur (`backend/.oxlintrc.json:8-10`) ; script `oxlint --deny-warnings` (`backend/package.json:12`). | Exécuté par `npm run lint` : succès, code de sortie 0. |
| Oxlint frontend — `frontend/.oxlintrc.json` et `frontend/package.json` | Feedback, **computationnel** | Analyse statique frontend, y compris les règles React activées. | `react/rules-of-hooks` et `react/exhaustive-deps` sont en erreur (`frontend/.oxlintrc.json:6-7`) ; script `oxlint --deny-warnings` (`frontend/package.json:9`). | Exécuté par `npm run lint` : succès, code de sortie 0. |
| TypeScript backend — `backend/tsconfig.json` et `backend/package.json` | Feedback, **computationnel** | Contrôle les types et options du compilateur sur le backend et les tests. | `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals` (`backend/tsconfig.json:9-13`) ; script `tsc --noEmit` (`backend/package.json:13`). | Exécuté par `npm run typecheck` : succès, code de sortie 0. |
| TypeScript frontend — `frontend/tsconfig.app.json`, `frontend/tsconfig.node.json`, `frontend/package.json` | Feedback, **computationnel** | Vérifie les projets TypeScript du frontend via les références de `frontend/tsconfig.json`. | `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals` (`frontend/tsconfig.app.json:13-17`) ; script `tsc -b` (`frontend/package.json:10`). | Exécuté par `npm run typecheck` : succès, code de sortie 0. |
| Vitest backend — `backend/vitest.config.ts`, `backend/package.json`, `backend/tests/` | Feedback, **computationnel** | Exécute les tests backend ; avant chaque fichier, vérifie aussi la version minimale de Node. | Le setup `./tests/helpers/requireSupportedNode.ts` est chargé avant les tests (`backend/vitest.config.ts:4`) et lève une erreur si Node n'est pas pris en charge (`backend/tests/helpers/requireSupportedNode.ts:5-8`). | Exécuté par l'assistant avec `npm run test -w backend` : **10 fichiers et 154 tests réussis** ; également réussi dans le `npm run check` lancé par nous. |
| Vitest frontend — `frontend/vite.config.ts`, `frontend/package.json`, `frontend/tests/` | Feedback, **computationnel** | Tests React/Vitest configurés avec `jsdom` et `tests/setup.ts`. | `environment: "jsdom"` et `setupFiles: ["./tests/setup.ts"]` (`frontend/vite.config.ts:15-16`) ; script `vitest run` (`frontend/package.json:11`). | Le test frontend a été exécuté par nous via `npm run check` : **8 fichiers et 67 tests réussis**. L'assistant ne l'a pas exécuté dans le sandbox. |
| Migrations et contraintes SQLite — `backend/src/db/migrations/001_initial.sql`, `002_applications_active_unique.sql` | Feedback à l'écriture en base, **computationnel** | Applique des contraintes d'intégrité : les données invalides sont rejetées par SQLite. | L'offre a des états autorisés par `CHECK` (`001_initial.sql:108`) ; l'index unique partiel empêche plusieurs candidatures non retirées pour le même couple offre/étudiant (`002_applications_active_unique.sql:1-3`). | Les tests backend exécutés appliquent les migrations sur leur base de test en mémoire ; le test vérifie les deux fichiers appliqués et l'absence de réapplication (`backend/tests/db/migrations.test.ts:15-25`). Ce n'était pas un `db:init` sur la base locale. |
| Build — scripts backend et frontend, relayés par `package.json` | Feedback, **computationnel** | Compile le backend puis copie ses migrations ; compile et construit le bundle frontend. | `tsc -p tsconfig.build.json` côté backend (`backend/package.json:8`), `tsc -b && vite build` côté frontend (`frontend/package.json:7`), relayés par le script racine (`package.json:17`). | Build backend et frontend exécutés par nous via `npm run check` : réussite ; Vite affiche « built ». |
| Scripts npm racine — `package.json` | Orchestration de feedback, pas une règle isolée | Délègue lint, typecheck et tests à tous les workspaces ; `check` enchaîne aussi le build. | Les scripts racine délèguent via `--workspaces` et `check` enchaîne les quatre étapes (`package.json:18-21`). | `npm run lint` et `npm run typecheck` exécutés directement par l'assistant ; `npm run test -w backend` réussi avec 154 tests. `npm run check` exécuté par nous et réussi, avec tests backend/frontend et build. `npm test` séparément n'a pas été lancé. |

## Vue 2 × 2 — feedforward / feedback et interprétation

|  | Guide (feedforward) | Senseur (feedback) |
|---|---|---|
| **Inférentiel** | Guides présents : instructions Copilot, README, architecture, cahier des charges, contrat API, PR template et protocole manuel. Leur application exige une interprétation. | **Aucun senseur inférentiel n'est configuré dans le dépôt.** La revue ou interprétation humaine/IA de ces guides n'est pas un capteur automatisé livré avec le projet. |
| **Computationnel** | Pas de guide computationnel autonome de génération ou d'architecture relevé. `package.json` donne toutefois un enchaînement exécutable de vérifications via `npm run check` ; cette orchestration est un cas limite, car elle lance surtout des senseurs. | Senseurs configurés : Oxlint, TypeScript, Vitest, contraintes/migrations SQLite et build. Le script `npm run check` les orchestre. |

## Résultats finaux de la séance

| Vérification | Résultat observé |
|---|---|
| `npm run lint` | Réussie (code 0) ; lint backend et frontend. |
| `npm run typecheck` | Réussie (code 0) ; backend et frontend. |
| `npm run test -w backend` | Réussie : **10 fichiers, 154 tests**. |
| Tests frontend via `npm run check` | Réussis : **8 fichiers, 67 tests**. |
| Build backend et frontend via `npm run check` | Réussi ; la sortie frontend Vite confirme « built ». |
| `npm run check` lancé par nous | **Réussi** ; les étapes lint, typecheck, tests backend/frontend et build terminent sans erreur. |

## Éléments absents ou non activés

- **CI** : aucun workflow trouvé sous `.github/workflows/` ; `.github/` ne contient que les instructions Copilot et le modèle de pull request. Il n'y a donc pas de senseur CI configuré ou exécuté dans le dépôt.
- **Hooks Git** : aucun répertoire `.husky` ni script de hook npm repéré. Pas de senseur de pré-commit configuré ; la recommandation du README et la case du modèle de PR restent des consignes, pas un hook automatique.
- **Tests manuels** : procédure écrite, mais pas de retour manuel produit pendant cette séance.
- **Senseur d'architecture optionnel** : non réalisé ; aucun senseur de ce type n'est
  ajouté ou évalué ici.

## Couverture des bonnes pratiques Web 2

L'audit des bonnes pratiques Web 2 **n'a pas été réalisé** : aucun support Web 2 n'a
été consulté. Aucune pratique ou recommandation n'est donc attribuée à Web 2. Les
constats ci-dessus se limitent au contenu du dépôt et aux vérifications de la séance.

À titre de constat sur le dépôt et la séance 7 seulement (et non comme pratique Web 2),
`.github/copilot-instructions.md` cite `npm run check` et décrit ce qu'il exécute, mais
ne demande pas explicitement de le lancer avant de conclure.
