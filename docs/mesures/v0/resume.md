# Synthèse des mesures — `v0-baseline`

Commit `2106a2643b73131429f26b3bb826d80cd95fee56` — généré le 2026-11-23T16:54:25Z.

Fichier généré automatiquement par `infra/analyse/summarize.js`. Les rapports bruts sont dans les sous-dossiers.

## 1. ISO 5055 — SonarQube 10.7 Community (profil « Sonar way »)

| Caractéristique ISO 5055 | Métrique | Valeur |
|---|---|---|
| Taille | Lignes de code (ncloc) / fichiers / classes | 39177 / 222 / 154 |
| Fiabilité | Bugs / note | 29 / E |
| Sécurité | Vulnérabilités / note | 5 / E |
| Sécurité | Security hotspots / note de revue | 20 / E |
| Maintenabilité | Code smells / note | 714 / A |
| Maintenabilité | Dette technique | 4652 min (≈ 9.69 j) — ratio 0.4 % |
| Maintenabilité | Duplication | 3.8 % (59 blocs) |
| Maintenabilité | Complexité cyclomatique / cognitive | 5374 / 3450 |
| Fiabilité | Couverture de tests | 0.0 % |
| Toutes | Violations (bloq./crit./maj./min./info) | 748 (6/152/337/249/4) |

Quality Gate par défaut de l'outil : **OK** (pour information ; le gate du projet sera celui du contrat qualité).

## 2. Pareto des violations (top 15 règles)

| # | Règle | Type | Sévérité | Nb | % cumulé | Exemple de message |
|---|---|---|---|---|---|---|
| 1 | `typescript:S6747` | CODE_SMELL | MAJOR | 123 | 16.44 % | Unknown property 'v\u0010       ' found |
| 2 | `java:S1192` | CODE_SMELL | CRITICAL | 98 | 29.55 % | Define a constant instead of duplicating this literal "degraded" 3 times. |
| 3 | `typescript:S6606` | CODE_SMELL | MINOR | 63 | 37.97 % | Prefer using nullish coalescing operator (`??`) instead of a logical or (`//`), as it is a |
| 4 | `typescript:S3358` | CODE_SMELL | MAJOR | 59 | 45.86 % | Extract this nested ternary operation into an independent statement. |
| 5 | `typescript:S6853` | CODE_SMELL | MINOR | 59 | 53.74 % | A form label must be associated with a control. |
| 6 | `typescript:S3776` | CODE_SMELL | CRITICAL | 18 | 56.15 % | Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed. |
| 7 | `typescript:S6479` | CODE_SMELL | MAJOR | 17 | 58.42 % | Do not use Array index in keys |
| 8 | `java:S1854` | CODE_SMELL | MAJOR | 16 | 60.56 % | Remove this useless assignment to local variable "base64Cv". |
| 9 | `java:S1481` | CODE_SMELL | MINOR | 16 | 62.7 % | Remove this unused "base64Cv" local variable. |
| 10 | `java:S3776` | CODE_SMELL | CRITICAL | 15 | 64.71 % | Refactor this method to reduce its Cognitive Complexity from 20 to the 15 allowed. |
| 11 | `typescript:S6582` | CODE_SMELL | MINOR | 15 | 66.71 % | Prefer using an optional chain expression instead, as it's more concise and easier to read |
| 12 | `java:S6204` | CODE_SMELL | MAJOR | 14 | 68.58 % | Replace this usage of 'Stream.collect(Collectors.toList())' with 'Stream.toList()' and ens |
| 13 | `typescript:S6848` | CODE_SMELL | MINOR | 14 | 70.45 % | Avoid non-native interactive elements. If using native HTML is not possible, add an approp |
| 14 | `typescript:S1082` | BUG | MINOR | 14 | 72.33 % | Visible, non-interactive elements with click handlers must have at least one keyboard list |
| 15 | `java:S1128` | CODE_SMELL | MINOR | 12 | 73.93 % | Remove this unused import 'org.springframework.web.filter.OncePerRequestFilter'. |

Total : 748 violations, 82 règles distinctes. **21 règles (25.61 %) produisent 80 % des violations.**

## 3. Fichiers les plus endettés (candidats « points chauds »)

| Fichier | Dette (min) | Code smells | Complexité | Lignes |
|---|---|---|---|---|
| `frontend-public/src/components/layout/AppLayout.tsx` | 740 | 143 | 107 | 558 |
| `backend/src/main/java/com/rhconnect/seeder/DatabaseSeeder.java` | 276 | 42 | 70 | 805 |
| `backend/src/main/java/com/rhconnect/service/ApplicationService.java` | 183 | 19 | 209 | 676 |
| `backend/src/main/java/com/rhconnect/ai/provider/OllamaAIProvider.java` | 146 | 16 | 68 | 231 |
| `frontend-public/src/pages/candidate/ProfilePage.tsx` | 146 | 26 | 207 | 1188 |
| `backend/src/main/java/com/rhconnect/service/AuthService.java` | 145 | 20 | 107 | 535 |
| `backend/src/main/java/com/rhconnect/service/StatsService.java` | 142 | 15 | 71 | 285 |
| `backend/src/main/java/com/rhconnect/service/VerificationService.java` | 136 | 9 | 160 | 573 |
| `backend/src/main/java/com/rhconnect/service/OfferService.java` | 133 | 16 | 170 | 619 |
| `backend/src/main/java/com/rhconnect/repository/ApplicationRepositoryImpl.java` | 123 | 10 | 6 | 143 |

## 4. Métriques orientées objet — CK 0.7.0 (backend Java)

133 types analysés.

| Métrique | Signification | Moyenne | Médiane | Max |
|---|---|---|---|---|
| CBO | Couplage entre objets | 8.44 | 6 | 43 |
| DIT | Profondeur d'héritage | 1.07 | 1 | 4 |
| NOC | Nombre d'enfants | 0 | 0 | 0 |
| WMC | Complexité pondérée des méthodes | 12.58 | 2 | 180 |
| RFC | Réponse pour une classe | 16.07 | 0 | 182 |
| LCOM | Manque de cohésion (CK) | 6.14 | 0 | 219 |
| LCOM* | Manque de cohésion normalisé (0-1) | 0.24 | 0 | 0.875 |
| LOC | Lignes par classe | 42.92 | 17 | 473 |

Classes les plus complexes (WMC) :

| Classe | WMC | CBO | LCOM | LOC |
|---|---|---|---|---|
| `com.rhconnect.service.ApplicationService` | 180 | 28 | 0 | 473 |
| `com.rhconnect.service.OfferService` | 156 | 33 | 219 | 358 |
| `com.rhconnect.service.VerificationService` | 143 | 26 | 0 | 415 |
| `com.rhconnect.service.AuthService` | 88 | 43 | 17 | 358 |
| `com.rhconnect.ai.provider.OllamaAIProvider` | 70 | 15 | 60 | 193 |
| `com.rhconnect.service.StatsService` | 62 | 17 | 0 | 204 |
| `com.rhconnect.seeder.DatabaseSeeder` | 51 | 27 | 9 | 218 |
| `com.rhconnect.service.CandidateService` | 47 | 14 | 8 | 135 |

## Constructibilité

`npm run build` (frontend-public, tsc + vite) : **ECHEC** — 2 erreur(s) TypeScript.
Pour Lighthouse, le front a été construit avec `vite build` seul (sans vérification de types).

## 5. Couverture — JaCoCo 0.8.12

**0 %** — aucun test exécuté (voir `maven-build.log`).

## 6. Sécurité

| Outil | Portée | Résultat |
|---|---|---|
| Gitleaks 8.21.2 | Historique Git jusqu'à v0-baseline | 0 secret(s) |
| Gitleaks 8.21.2 | Arborescence à v0-baseline | 0 secret(s) potentiel(s) (—) |
| Trivy 0.75.0 | Dépendances (pom, package-lock) | 13 critiques, 76 hautes, 79 moyennes, 18 faibles |
| Trivy 0.75.0 | Secrets / mauvaises configurations | 0 / 0 |
| npm audit | backend | 0 critiques, 0 hautes, 0 moyennes, 0 faibles |
| npm audit | frontend-public | 0 critiques, 4 hautes, 1 moyennes, 0 faibles |
| npm audit | backoffice-admin | 4 critiques, 24 hautes, 36 moyennes, 4 faibles |

## 7. Applications web — Lighthouse 12.2.1 (preset desktop, médiane de 3 passages)

| Page | Performance | Accessibilité | Bonnes pratiques | SEO | FCP (ms) | LCP (ms) | TBT (ms) | CLS |
|---|---|---|---|---|---|---|---|---|
| admin-connexion | 100 | 94 | 100 | 82 | 421 | 517 | 0 | 0.01 |
| public-accueil | 83 | 92 | 100 | 82 | 1816 | 1816 | 0 | 0 |
| public-connexion | 93 | 94 | 100 | 82 | 1236 | 1236 | 0 | 0 |
| public-inscription | 100 | 94 | 100 | 82 | 681 | 681 | 0 | 0 |

## Interprétation

_À compléter par l'équipe : lecture de chaque métrique et conséquences pour le plan d'action._
