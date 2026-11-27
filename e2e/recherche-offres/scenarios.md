# Recherche d'offres par titre — scénarios E2E

Exigence : **EF-30** (catalogue des offres publiées, recherche par mot-clé).
Règles implémentées à la séance 9 (`docs/semaine-4.md`, § 3) :

- la recherche porte uniquement sur le **titre** ;
- elle ignore la **casse** et les **espaces extérieurs** ;
- plusieurs mots sont cherchés comme une **expression entière** ;
- une recherche vide ne restreint pas la liste ;
- les règles de visibilité restent appliquées : un étudiant ne voit que les offres **publiées**.

## Données utilisées

Aucune donnée n'est créée pour ces scénarios : ils reposent sur le **seed de démonstration**
du projet, recréé avec `npm run db:reset` avant l'exécution. Les tests automatisés
(`recherche-offres.spec.ts`) recréent eux-mêmes ce seed dans une base dédiée
(`backend/data/gesta-e2e.db`, voir `playwright.config.ts`).

- Offres : `backend/src/db/seed/offersData.ts` (identifiants dans `seedIds.ts`, `OFFER.*`)
- Utilisateurs : `backend/src/db/seed/peopleData.ts` (`STUDENT.LUCAS_DUPONT`)
- Description lisible : `docs/seed.md`

Offres du seed utiles ici (année en cours 2026-2027) :

| Offre (`OFFER.*`) | Titre | Statut | Visible pour un étudiant |
|---|---|---|:---:|
| `FLEET_APP` | Application React de gestion de flotte | Publiée | Oui |
| `CLOUD_MIGRATION` | Migration d'une application vers le cloud | Attribuée | Non |
| `E2E_TESTS` | Automatisation des tests de bout en bout | En attente | Non |

Les autres offres publiées (`BILLING_API`, `DATA_QUALITY`, `INTERNAL_CHATBOT`) ne
contiennent ni « application » ni « bout en bout » dans leur titre.

## Scénario 1 — Recherche avec résultat (cas nominal)

**Rôle** : étudiant, **Lucas Dupont**.

**Offres nécessaires** :
- `FLEET_APP` « Application React de gestion de flotte », **publiée** → visible ;
- `CLOUD_MIGRATION` « Migration d'une application vers le cloud », **attribuée** (non
  publiée) → invisible pour un étudiant, bien que son titre contienne le mot cherché.

**Actions** :
1. Ouvrir l'application ; sur « Connexion de démonstration », groupe « Étudiants »,
   cliquer sur **Lucas Dupont**.
2. Cliquer sur le lien **Offres** de la barre de navigation (`/offres`).
3. Laisser « Période » sur « Toutes les périodes ».
4. Dans le champ **« Mot-clé dans le titre »**, saisir `application` (en minuscules).

**Résultat observable attendu** :
- le compteur affiche **« 1 offre »** ;
- le tableau contient une seule ligne, de titre **« Application React de gestion de flotte »**,
  entreprise Lumen Digital, statut Publiée ;
- « Migration d'une application vers le cloud » n'apparaît **pas** ;
- aucun message « Aucune offre… » n'est affiché.

## Scénario 2 — Recherche sans résultat (cas limite)

**Rôle** : étudiant, **Lucas Dupont**.

**Offres nécessaires** :
- `E2E_TESTS` « Automatisation des tests de bout en bout », **en attente** (non publiée)
  → invisible pour un étudiant ;
- aucune offre **publiée** dont le titre contient « bout en bout ».

**Actions** :
1. Se connecter comme **Lucas Dupont** (comme au scénario 1).
2. Cliquer sur **Offres**.
3. Laisser « Période » sur « Toutes les périodes ».
4. Dans **« Mot-clé dans le titre »**, saisir `bout en bout`.

**Résultat observable attendu** :
- le message **« Aucune offre ne correspond à votre recherche. »** est affiché ;
- aucun tableau d'offres ni compteur « N offre(s) » n'est affiché ;
- le message n'est **pas** « Aucune offre à afficher. » (réservé à une recherche vide).

## Justification du choix des deux cas

- **Scénario 1** couvre le parcours principal d'EF-30 : un étudiant trouve une offre par
  un mot de son titre. Le mot saisi en minuscules vérifie au passage l'insensibilité à la
  casse. Le terme « application » est choisi parce qu'il figure aussi dans le titre d'une
  offre attribuée : le scénario prouve que la recherche ne contourne pas la visibilité
  étudiant, ce qu'un test unitaire du filtre seul ne montre pas.
- **Scénario 2** couvre la limite la plus parlante pour l'utilisateur : une recherche qui
  ne renvoie rien doit afficher un message propre à la recherche, distinct de la liste
  vide. L'expression « bout en bout » existe bien en base, mais seulement dans une offre
  non publiée : le cas vérifie à la fois l'expression de plusieurs mots et le fait qu'une
  offre non publiée ne « fuit » pas par la recherche. Un mot absent de toute la base
  (par exemple `blockchain`) donnerait le même affichage, mais prouverait moins.
- Les deux scénarios utilisent le même rôle et le seed tel quel : ils restent
  reproductibles après `npm run db:reset`, sans préparation de données spécifique.
