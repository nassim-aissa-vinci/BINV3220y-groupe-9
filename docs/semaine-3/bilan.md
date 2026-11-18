# Bilan — Séance 3 : guides, senseurs et traçabilité des tests

## Inventaire

La [matrice guides/senseurs](matrice-guides-senseurs.md) relève des guides
inférentiels — `.github/copilot-instructions.md`, le README, l'architecture, le
cahier des charges, le contrat API, le modèle de pull request et un protocole E2E
manuel — et des senseurs computationnels configurés : Oxlint, TypeScript, Vitest,
contraintes SQLite, migrations et scripts de build.

Pendant cette séance, `npm run lint`, `npm run typecheck` et les tests backend ont
été lancés. Les tests frontend et le build étaient configurés mais n'avaient pas
encore été exécutés à ce stade ; ils ont ensuite été lancés par nous dans le terminal
(voir « Modifications et vérification »). Aucun workflow CI ni hook Git n'a été repéré.
Les tests E2E du document de semaine 2 restent un protocole, pas un parcours exécuté
pendant cette séance.

## Couverture des exigences

La [matrice de traçabilité](matrice-tracabilite-tests.md) confronte EF-32, EF-33 et
RG-03 aux tests backend et frontend, sans confondre les fixtures, contraintes SQL,
parcours de catalogue et véritables tests des routes de candidature.

Les cas principaux existent : candidature avec ou sans message, retrait en cours,
historique conservé, recandidature après retrait, isolation à la lecture, affichage
des quatre libellés de statut et refus des doublons. Les décisions de séance 7
précisent aussi le tri par date puis identifiant, l'absence de filtre d'année
(EF-72 reporté), les codes HTTP des refus et le fait qu'un stage validé ne bloque pas
une candidature (`docs/semaine-2/bilan.md`, § 1).

Les manques les plus importants identifiés étaient les refus sans vérification
explicite de l'absence d'effet en base, le test des statuts d'offre non publiée un
par un, les rôles supplémentaires et l'absence de session pour le retrait. Les tests
ont été renforcés en conséquence (détails ci-dessous). Des limites subsistent :

- les tests frontend de candidatures utilisent `stubFetch` ; ils vérifient l'interface,
  pas le service backend ni la base ;
- le tri par `applied_at` est exercé avec des dates différentes, mais l'égalité de
  dates et le départage par `id` ne sont pas spécifiquement testés ;
- les quatre libellés sont testés dans l'interface simulée, tandis que le test backend
  de liste vérifie surtout `IN_PROGRESS` ;
- le retour de candidatures de plusieurs années pour un même étudiant n'est pas
  directement vérifié ;
- la décision de ne pas bloquer un étudiant ayant déjà un stage validé n'a pas de test
  dédié.

## Modifications et vérification

Seul `backend/tests/applications.test.ts` a été modifié côté code/tests ; aucun code
applicatif n'a été touché. Un helper snapshot lit toutes les candidatures
(`id`, offre, étudiant, message, statut et date). Les tests de refus concernés
comparent cet état avant et après l'appel, en plus de vérifier statut HTTP et code
d'erreur.

Tests ajoutés ou étendus et défaut détecté :

- Les cas `PENDING`, `ASSIGNED` et `ARCHIVED` ont été ajoutés aux refus
  « candidature à une offre ... (409) ». Chacun échoue si ce statut non publié est
  accepté, retourne un mauvais code/statut ou crée/modifie une candidature.
- Le cas de contact promoteur a été ajouté aux refus de candidature par rôle. Il
  échoue si un contact qui n'est pas étudiant peut créer une candidature.
- Les refus de retrait par contact déposant et promoteur ont été ajoutés aux rôles
  interdits. Ils échouent si un de ces contacts peut retirer la candidature de
  l'étudiant ou si la base est modifiée.
- Le retrait sans session a un nouveau test. Il échoue si la route n'émet pas
  `401 UNAUTHENTICATED` ou si elle change les candidatures.
- Les refus déjà couverts — retrait traité, étudiant tiers, retrait inexistant ou
  identifiant invalide, accès/liste sans session, rôle non autorisé, message/corps
  invalide, offre inexistante/non publiée et doublons `IN_PROGRESS`, `SELECTED` ou
  `REJECTED` — vérifient désormais aussi le code d'erreur attendu et le snapshot de
  base inchangé. Ils échoueraient si le refus modifiait ou ajoutait une ligne.

### Vérifications réellement lancées

| Commande | Qui l'a lancée | Résultat |
|---|---|---|
| `npm run lint` | Assistant | Réussie, code de sortie 0 ; Oxlint backend et frontend. |
| `npm run typecheck` | Assistant | Réussie, code de sortie 0 ; backend et frontend. |
| `npm run test -w backend` | Assistant, après modification des tests | Réussie : 10 fichiers, 154 tests. |
| `npm run check` | Nous, dans le terminal | Réussie : les tests backend passent (10 fichiers, 154 tests), les tests frontend aussi (8 fichiers, 67 tests), puis les builds backend et frontend ; Vite termine avec succès. |
| `npm run test -w backend -- tests/applications.test.ts -t "refuse une candidature à une offre"` | Assistant, avec défaut temporaire | **Échec attendu** : les 3 cas `PENDING`, `ASSIGNED`, `ARCHIVED` ont reçu `201` au lieu de `409` ; 3 tests échoués, 35 réussis dans le fichier. npm a signalé que `-t` était parsé comme option de configuration : Vitest a exécuté les 38 tests du fichier, pas seulement le filtre demandé. |
| Même tentative après restauration du service | Assistant | Réussie : les 38 tests du fichier passent. Comme précédemment, le filtre n'a pas été transmis ; c'est l'exécution du fichier complet. |
| `git diff --check` | Assistant | Réussie, aucun problème d'espacement signalé. |

Le défaut temporaire consistait à refuser uniquement une offre `SUBMITTED` au lieu de
tout statut différent de `PUBLISHED`. Il a provoqué les trois échecs attendus, puis le
fichier applicatif a été restauré avec `git checkout`. La comparaison Git a confirmé
qu'il ne restait pas de diff sur ce fichier. Aucun commit n'a été créé.

## Audit des guides (Web 2)

**Cet audit n'a pas été réalisé**, faute de temps et de supports Web 2 consultés.
Aucune pratique ni recommandation n'est donc attribuée à Web 2 dans ce bilan.

Les constats suivants viennent uniquement de l'inspection du dépôt et de la séance 7,
pas de Web 2 : par exemple, `.github/copilot-instructions.md` répertorie `npm run
check` et en décrit la portée, mais ne demande pas explicitement de lancer cette
commande avant de conclure. Cette observation ne permet pas de tirer de conclusion
sur les pratiques enseignées en Web 2.

La partie optionnelle — un senseur d'architecture — n'a pas été faite.
