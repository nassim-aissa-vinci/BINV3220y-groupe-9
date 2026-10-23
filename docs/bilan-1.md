# Bilan — Séance 6 : Découverte du projet et filtre par période

**1. Qu’est-ce que Copilot vous a aidés à faire ?**
Copilot nous a aidés à initialiser `.github/copilot-instructions.md` via `/init`, à documenter dans `./docs` le flux complet d'une requête `GET /offers` (du composant React jusqu'à la requête SQL `better-sqlite3`), et à implémenter le filtre facultatif par période (`P1`, `P2`, `Autre`) côté frontend et backend avec les tests Vitest/Supertest/Testing Library associés.

**2. Qu’avez-vous vérifié ou corrigé vous-mêmes ?**
Nous avons relu et complété `.github/copilot-instructions.md` en le croisant avec le `README.md` (notamment l'obligation d'utiliser `npm ci` au lieu de `npm install` à cause de `ignore-scripts=true`, l'utilisation de SQL écrit à la main et de type guards manuels). Via la vue *Source Control* (`Ctrl+Shift+G`), nous avons vérifié chaque diff pour nous assurer que les règles de visibilité par profil (admin, étudiant, déposant, contact 403) étaient intactes, puis nous avons validé le projet avec `npm run check` et testé manuellement le filtre en mode démo sur plusieurs profils.

**3. Quelle difficulté ou limite avez-vous rencontrée ?**
Il a fallu veiller à ce que Copilot respecte les conventions strictes du dépôt (pas d'ORM ni de librairie de validation externe, zéro avertissement Oxlint sur le typage et les hooks React) et qu'il combine proprement la clause SQL `WHERE` du filtre `period` avec les conditions existantes liées au rôle de l'utilisateur.

**4. Combien de crédits IA avez-vous consommés pendant la séance ?**
Nous avons consommé [3%] de crédits / requêtes IA pendant la séance (début : [100%], fin : [97%]).