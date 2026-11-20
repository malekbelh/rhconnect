# RhConnect - Implementation Plan

## Task 1: Initialisation du monorepo et structure + PROGRESS.md + git
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Création de la structure racine: frontend-public/, backoffice-admin/, backend/, docs/
  - Initialisation git (git init, .gitignore pour node_modules, target, .env, uploads/, build)
  - Création PROGRESS.md vide avec en-tête et sections par module
  - Ajout README.md temporaire racine avec arborescence
- **Acceptance Criteria Addressed**: AC-12
- **Test Requirements**:
  - `rule` TR-1.1: `ls -la` affiche frontend-public, backoffice-admin, backend, docs, PROGRESS.md ; `git status` fonctionne
  - `rubric` TR-1.2: Propreté et complétude de la structure + .gitignore exhaustif ; scale 1-5 ; anchors 1=3 dossiers seulement, 3=structure + .gitignore moyen, 5=structure + PROGRESS structuré + README squelette ; threshold >= 4 ; evidence: tree output

## Task 2: Backend Spring Boot - Squelette (pom.xml, config, application.properties, Swagger, Security basique)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - Création backend/ Spring Boot 3.2+ (Java 17) avec Maven
  - Dépendances: Spring Web, Spring Data MongoDB, Spring Security, springdoc-openapi-starter-webmvc-ui (Swagger), JJWT (jwt-api, jjwt-impl, jjwt-jackson), Lombok, BCrypt, spring-boot-starter-validation
  - application.properties: connexion MongoDB (mongodb://localhost:27017/rhconnect), port 8080, config JWT secret + TTL access/refresh, max upload file, profile dev
  - Classes: `SecurityConfig` (permitAll auth + Swagger, reste authenticated), `WebConfig` (CORS allow frontend :5173 et backoffice :4200), `OpenApiConfig`
  - Exemple endpoint /public/health 200 "OK"
- **Acceptance Criteria Addressed**: AC-1, AC-7, NFR-3, NFR-4
- **Test Requirements**:
  - `rule` TR-2.1: Démarrage backend sans erreur, curl GET /api/public/health → 200 "OK"
  - `rule` TR-2.2: GET /v3/api-docs → 200 + contient "openapi":"3." + GET /swagger-ui.html → 200 HTML
  - `rule` TR-2.3: Endpoint non exposé (ex: /api/users) retourne 401/403 sans token
  - `rubric` TR-2.4: Propreté configuration modulaire ; scale 1-5 ; anchors 1=tout dans application.properties, 3=classes config séparées, 5=configs + CORS + Security + Swagger configurés proprement avec profils ; threshold >= 4 ; evidence: code sources + capture démarrage

## Task 3: Backend - Modèles MongoDB (User, CandidateProfile, CompanyProfile, Offer, Application, Verification, VerificationDoc, RefreshToken) + DTOs
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - Collection `users`: id, email (unique), password (bcrypt), roles [CANDIDATE|COMPANY|ADMIN|RECRUITER], enabled, verified, createdAt, lastLogin
  - Collection `candidate_profiles`: userId, firstName, lastName, phone, address, bio, competences[], parcours[{title,company,startDate,endDate,description}], formation[{diploma,school,year}], cvFileId, cvFileName, matchingTags[]
  - Collection `company_profiles`: userId, companyName, siret, sector, size, description, address, logoFileId, website, verifiedStatus
  - Collection `offers`: id, companyId, title, description, competencesRequises[], niveauExperience (JUNIOR/MID/SENIOR/EXPERT), typeContrat (CDI/CDD/STAGE/ALTERNANCE/FREELANCE/INTERIM), localisation, salaireMin, salaireMax, datePublication, dateExpiration, statut (ACTIVE/CLOSED/DRAFT), matchingTags[]
  - Collection `applications`: id, candidateId, offerId, companyId, statut workflow (POSTULE,RECU,EN_VERIFICATION,VERIFIE,TRANSMIS,ENTRETIEN,ACCEPTE,REFUSE), timeline[{statut,date,acteurId,commentaire}], matchingScore, lettreMotivation, createdAt
  - Collection `verifications`: id, candidateId, pieces[{id,nomFichier,type,uploadedAt}], statut (EN_ATTENTE/VALIDE/REJETE), validatorId, validatedAt, commentaire
  - Collection `refresh_tokens`: id, userId, token, expiresAt, revoked
  - Tous les DTOs de requête/réponse avec @Valid (@NotBlank, @Email, @Size etc)
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4, AC-5
- **Test Requirements**:
  - `rule` TR-3.1: `UserRepository.existsByEmail("test@test.com")` fonctionne + UniqueIndex email sur users
  - `rule` TR-3.2: DTO RegisterRequest avec @Valid password min 8, maj, chiffre, spécial renvoie 400 si invalide (test via endpoint Task 4)
  - `rubric` TR-3.3: Richesse modèle et cohérence métier ; scale 1-5 ; anchors 1=3 models basiques, 3=6 modèles avec champs, 5=8 modèles complets + indexes + enums + DTOs validés ; threshold >= 4 ; evidence: code sources modèles

## Task 4: Backend - Module Auth (Register/Login/Refresh/Logout/Me) + JWT Token Service
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3
- **Description**:
  - `JwtService`: generateAccessToken, generateRefreshToken, validateToken, extractClaims, extractUserId
  - `AuthController`: POST /api/auth/register (role CANDIDATE|COMPANY + DTO), POST /api/auth/login (email+password), POST /api/auth/refresh-token, POST /api/auth/logout, GET /api/auth/me
  - `AuthService`: register → save User + crée CandidateProfile ou CompanyProfile vide ; login → check mdp BCrypt + génère access+refresh ; refresh → valide + rotation
  - `JwtAuthFilter` ajouté dans SecurityConfig
  - Règles: ADMIN/RECRUITER non créables via register (inspect code rejette)
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `rule` TR-4.1: Scénario AC-1 curl: /login → 200 tokens + /me → 200 infos
  - `rule` TR-4.2: Scénario AC-2: mdp faible → 400, mdp correct → 201 + role=CANDIDATE
  - `rule` TR-4.3: Tentative register role=ADMIN → 403/400 refus
  - `rubric` TR-4.4: Sécurité JWT (BCrypt, TTL courts, rotation refresh) ; scale 1-5 ; anchors 1=JWT simple sans refresh, 3=access+refresh sans rotation, 5=rotation, révocation, filtre sécurisé ; threshold >= 4 ; evidence: code JwtService + SecurityConfig

## Task 5: Backend - Module Candidats (CRUD profil + CV upload + search offre + postuler + suivi)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4
- **Description**:
  - `CandidateController`: GET /api/candidates/me (profil), PUT /api/candidates/me (maj profil), POST /api/candidates/me/cv (upload multipart CV → stockage MongoDB GridFS), GET /api/offers (recherche/filtre: keyword, competence, niveau, typeContrat, localisation, pageable)
  - `ApplicationController`: POST /api/applications (postuler → vérif matching >=50, vérif dossier complet, sinon 422), GET /api/applications/me (liste + statuts), GET /api/applications/{id}/timeline
  - `MatchingService`: calcule score heuristique pondéré (compétences: 40%, niveau: 30%, localisation: 10%, tags: 20%)
  - Dossier complet = profil firstName/lastName/phone remplis + au moins 1 compétence + CV uploadé (sinon candidature refusée)
- **Acceptance Criteria Addressed**: AC-3, AC-4, AC-6
- **Test Requirements**:
  - `rule` TR-5.1: POST /api/candidates/me/cv (PDF) → 201 ; GET download → 200 fichier
  - `rule` TR-5.2: Scénario AC-6: matching insuffisant → 422 MATCHING_REQUIREMENTS_NOT_MET
  - `rule` TR-5.3: Candidature autorisée + dossier complet → statut POSTULÉ en base, timeline 1 entrée
  - `rubric` TR-5.4: Qualité matching + filtres offres ; scale 1-5 ; anchors 1=score random, 3=poids simple 2 critères, 5=4 critères pondérés + filtres multi-pageable ; threshold >= 4 ; evidence: code MatchingService + exemple réponse /api/offres

## Task 6: Backend - Module Entreprises (CRUD profil + CRUD offres + gestion candidatures)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4
- **Description**:
  - `CompanyController`: GET/PUT /api/companies/me profil entreprise, POST/PUT logo upload
  - `OfferController` (rôle COMPANY): POST /api/offers → lié companyId de l'auth ; GET /api/offers/my ; PUT/DELETE /api/offers/{id} → 403 si pas propriétaire
  - `ApplicationController` (rôle COMPANY): GET /api/offers/{offerId}/applications → uniquement candidatures statut>=TRANSMIS ; PATCH /api/applications/{id}/status (par compagnie: TRANSMIS→ENTRETIEN→ACCEPTE|REFUSE) avec commentaire
- **Acceptance Criteria Addressed**: AC-3, AC-4
- **Test Requirements**:
  - `rule` TR-6.1: CRUD offres 201/200/200/204 + GET autre company → 403 (AC-3)
  - `rule` TR-6.2: Company voit uniquement candidatures >= VERIFIE, pas EN_VERIFICATION
  - `rubric` TR-6.3: Sécurité inter-entreprise (propriété) ; scale 1-5 ; anchors 1=aucun contrôle ownership, 3=vérif ownership sur offres seulement, 5=ownership offres + candidatures + filtres statut transmission ; threshold >= 4 ; evidence: code OfferService + ApplicationService

## Task 7: Backend - Module Vérifications (upload documents + validation RECRUITER/ADMIN)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 5
- **Description**:
  - `VerificationController`: POST /api/verifications/upload-piece (candidate: upload pdf/jpg pièce → ajout à sa vérification) ; GET /api/verifications/me statut
  - `VerificationController` (role RECRUITER/ADMIN): GET /api/verifications/pending queue ; PATCH /api/verifications/{id}/validate (statut → VALIDE/REJETE + commentaire) ; GET /api/verifications/{id}/download/{pieceId}
  - Workflow: Lorsque RECRUITER valide une vérification, toutes les candidatures EN_VERIFICATION du candidat passent → VERIFIE → puis TRANSMIS automatiquement à la compagnie
- **Acceptance Criteria Addressed**: AC-5, AC-4 (statut VERIFIE/TRANSMIS)
- **Test Requirements**:
  - `rule` TR-7.1: Upload pièce + validate → statut VALIDE, validatorId, date renseignés (AC-5)
  - `rule` TR-7.2: Après validation d'une vérification → les applications EN_VERIFICATION → VERIFIE → TRANSMIS dans la même minute
  - `rule` TR-7.3: Unauthorized (CANDIDATE tente /pending) → 403
  - `rubric` TR-7.4: Traçabilité complète vérifications ; scale 1-5 ; anchors 1=1 champ statut seul, 3=statut + validator, 5=pièces multiple + timeline validation + auto-transmission aux entreprises ; threshold >= 4 ; evidence: code VerificationService + DB extrait après scénario

## Task 8: Backend - Module IA (couche abstraction + Ollama impl + fallback) + Endpoints
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 6
- **Description**:
  - Interface `AIProvider` + méthodes `analyzeCv(bytes)`, `generateMotivationLetterPrompt(cv,offre)`, `conseilProfil(candidat)` ; implémentation `OllamaAIProvider` (POST http://localhost:11434/api/generate model=llama3:8b) + `FallbackAIProvider` (résultats stubs + warning flag service_disabled=true)
  - `AIService` + Qualifier + profile spring: si ollama.url conf → Ollama sinon Fallback (toujours 200)
  - `AIController` (authentifié): POST /api/ai/analyze-cv (multipart), POST /api/ai/suggestions-lettre (body candidateId+offerId), GET /api/ai/conseils
  - Mode dégradé: si Ollama indisponible → timeout 5s → catch exception → Fallback réponses vides + message "Service IA temporairement indisponible"
- **Acceptance Criteria Addressed**: AC-10
- **Test Requirements**:
  - `rule` TR-8.1: Sans Ollama (URL bidon), POST /api/ai/analyze-cv → 200 + champ serviceStatus:"degraded" (AC-10)
  - `rule` TR-8.2: (Si Ollama dispo) même endpoint → 200 + {competences:[...], pointsForts:[...]} non vide
  - `rubric` TR-8.3: Couche abstraction qualité ; scale 1-5 ; anchors 1=code direct sans interface, 3=interface+1 impl, 5=interface+2 impl+profil spring+timeout fallback 5s ; threshold >= 4 ; evidence: code AIProvider + configurations

## Task 9: Backend - Seeds MongoDB (CommandLineRunner) + Données démo
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 8
- **Description**:
  - `DatabaseSeeder` @Component @Profile("!prod") exécute au démarrage si base vide (ou flag seed.force=true)
  - Crée 1 ADMIN, 1 RECRUITER, 3 CANDIDATE profils complets avec CV simulés, 2 COMPANY, 5 OFFERS variées, 6 APPLICATIONS réparties sur les 8 statuts, 2 Vérifications (1 VALIDE, 1 EN_ATTENTE)
  - Logs console: "Seeded X users, Y offers, Z applications..."
- **Acceptance Criteria Addressed**: AC-11
- **Test Requirements**:
  - `rule` TR-9.1: Démarrage avec seed.force=true → counts DB >= minimums AC-11
  - `rule` TR-9.2: 1 CANDIDATE a bien application en statut ACCEPTE, une en REFUSE (statuts variés)
  - `rubric` TR-9.3: Réalisme données démo (noms, entreprises plausibles FR) ; scale 1-5 ; anchors 1=utilisateurs "user1 user2", 3=données francophones basiques, 5=prénoms/noms/entreprises réalistes (ex: "Société Tech Services", "Dupont Martin") + offres détaillées + CV avec compétences réelles ; threshold >= 4 ; evidence: output seeder + extrait DB

## Task 10: Backend - Tests unitaires et integration (JUnit5 + Mockito + Testcontainers Mongo optionnel)
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 9
- **Description**:
  - `AuthServiceTest`: register, login, refresh token, erreur mdp
  - `MatchingServiceTest`: 3 cas matching >=70, 30-50, <30
  - `VerificationServiceTest`: valider → auto-transmission candidature
  - Package src/test/java minimal ≥ 80% coverage sur services critères (Jacoco optionnel)
- **Acceptance Criteria Addressed**: Tous les AC (règles) via couverture
- **Test Requirements**:
  - `rule` TR-10.1: `mvn test` → BUILD SUCCESS, 0 échecs, ≥ 12 tests verts
  - `rubric` TR-10.2: Pertinence cas tests edge (matching 0, matching 50 exact) ; scale 1-5 ; anchors 1=2 tests happy path, 3=tests OK/KO par service, 5=tests edge cases + erreurs métier ; threshold >= 3 ; evidence: output mvn test

## Task 11: Frontend-public React + Vite + Tailwind - Setup + routing + layout
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 10
- **Description**:
  - frontend-public/: `npm create vite@latest . -- --template react` → install, tailwindcss, postcss, autoprefixer, react-router-dom, axios, react-hook-form + zod, lucide-react
  - tailwind.config.js: palette RH moderne: primary:#1e3a8a (bleu profond), accent:#f97316 (orange), secondary:#7c3aed (violet), bg:#f8fafc, text:#0f172a ; responsive breakpoints ; fonts Inter
  - Routing React Router: "/" Landing, "/auth/register" RegisterPage, "/auth/login" LoginPage, "/candidate/dashboard" protected + ProfilePage, OffersPage, OfferDetailPage, MyApplicationsPage, UploadVerificationPage, 404
  - Layout: Navbar public (Logo RhConnect, Connexion/Inscription) + Navbar authentifié (tableau de bord Candidat)
- **Acceptance Criteria Addressed**: AC-8, NFR-1, NFR-9
- **Test Requirements**:
  - `rule` TR-11.1: `npm run dev` (port 5173) → démarre sans erreur ; GET "/" 200
  - `rule` TR-11.2: Routes protégées (dashboard) sans token → redirect "/auth/login"
  - `rubric` TR-11.3: Charte visuelle + structure layout ; scale 1-5 ; anchors 1=CSS de base, 3=Tailwind + palette, 5=layout professionnel responsive + design premium ; threshold >= 4 ; evidence: capture 3 tailles écran (mobile/tablette/desktop)

## Task 12: Frontend-public - Pages Auth (Register/Login) + Axios API client avec JWT intercepteur
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 11
- **Description**:
  - `api/client.ts`: axios baseURL=http://localhost:8080/api ; request interceptor ajoute Authorization Bearer depuis localStorage.accessToken ; response interceptor 401 → tente refresh token (POST /auth/refresh-token) → retry requête sinon logout
  - RegisterPage: formulaire 2 onglets (Candidat / Entreprise) avec role radio, email, mdp, confirm mdp, validation zxcvbn/complexité visuelle (force bar 4 couleurs)
  - LoginPage: email + mdp, bouton "Se souvenir" (stockage localStorage)
  - Toast notifications (react-hot-toast) sur succès/erreur
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `rule` TR-12.1: Register formulaire CANDIDATE mdp "RhConnect2026!" → redirige /candidate/dashboard + profile vide
  - `rule` TR-12.2: mdp trop faible → errors visibles, submit bloqué, 0 requête HTTP envoyée
  - `rubric` TR-12.3: UX formulaires (validation temps réel, feedback, ergonomie) ; scale 1-5 ; anchors 1=formulaires html nus, 3=validation basique, 5=UX premium (force password, onglets, toasts, erreurs inline) ; threshold >= 4 ; evidence: captures écrans

## Task 13: Frontend-public - Espace Candidat (profil éditable + CV upload + recherche offres + postuler + candidatures timeline)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 12
- **Description**:
  - ProfilePage: formulaire tabs (Infos perso, Compétences chips input, Parcours pro tableau edit/delete, Formation, CV upload drag-drop) avec PUT /api/candidates/me au submit
  - OffersPage: barre recherche keyword, filters multi-sélect (typeContrat, niveau, localisation), cards grille responsive. Chaque card: titre, entreprise, compétences tags, salaire, matching score badge (couleur vert/orange/rouge). Bouton "Postuler" disabled si score<50 ou dossier incomplet (tooltip)
  - OfferDetailPage: description complète, compétences, infos entreprise, formulaire lettre motivation, bouton POST candidature (gestion 422 AC-6)
  - MyApplicationsPage: liste cards avec statut badge coloré, date, titre offre. Timeline verticale (step component) avec 8 statuts possibles, celui en cours surligné
  - UploadVerificationPage: liste pièces upload, drag-drop nouveau fichier, statut verification (EN_ATTENTE=bleu, VALIDE=vert, REJETE=rouge motif)
- **Acceptance Criteria Addressed**: AC-4, AC-5, AC-6, AC-8
- **Test Requirements**:
  - `rule` TR-13.1: Upload CV drag-drop → toast succès + nom fichier affiché (TR-5.1 via backend)
  - `rule` TR-13.2: Offre matching<50 → bouton disabled + tooltip affiché (AC-6 vérif UI)
  - `rule` TR-13.3: Page candidature timeline: statut affiché dans la bonne couleur + ordre
  - `rubric` TR-13.4: Profondeur UX espace candidat ; scale 1-5 ; anchors 1=1 seule page liste, 3=3 pages simples, 5=6 pages complètes + composants riches (chips, timeline, drag-drop, filters) ; threshold >= 4 ; evidence: captures 5 pages

## Task 14: Frontend-public - Landing Page premium (héros, features, témoignages, CTA)
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 13
- **Description**:
  - Landing components: Hero (titre "La plateforme RH qui connecte talents et entreprises", sous-titre, 2 CTA: "Je cherche un emploi"/"Je recrute"), features 3 cartes (Profils vérifiés, Matching intelligent, Suivi en temps réel), stats bandeau (ex: +10k candidats, +2k entreprises, +5k offres), témoignages 3 cards, FAQ accordéon, CTA final, footer légal/contact/réseaux
  - Images: placeholder via unsplash-like (service fourni dans prompt: text_to_image API si disponible, sinon dégradé images locales SVG)
- **Acceptance Criteria Addressed**: AC-8
- **Test Requirements**:
  - `rule` TR-14.1: Landing scrollable sans bug mobile 375px x 812px
  - `rubric` TR-14.2: Attractivité landing premium ; scale 1-5 ; anchors 1=texte brut, 3=structure sections + couleurs, 5=hero impactant + animations subtiles (fade up on scroll via tailwind animate) + responsive parfait ; threshold >= 4 ; evidence: captures complètes landing desktop + mobile

## Task 15: Backoffice-admin Angular 17 - Setup + routing + Angular Material layout
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 10
- **Description**:
  - backoffice-admin/: `npm install -g @angular/cli@17` → `ng new rhconnect-admin --style=scss --standalone --routing` dans le dossier
  - Install @angular/material, chart.js + ng2-charts, @auth/angular-jwt (ou custom interceptor)
  - Palette Material: primary blue #1e3a8a, accent orange #f97316, warn #dc2626
  - Layout admin: sidenav gauche logo RhConnect Admin + items menu (Dashboard, Utilisateurs, Offres, Candidatures, Vérifications), toolbar top avec infos user et logout
  - Guard auth: vérification token admin/recruiter sinon redirect login
  - Routing: /admin/login, /admin/dashboard, /admin/users, /admin/offers, /admin/applications, /admin/verifications
- **Acceptance Criteria Addressed**: AC-9
- **Test Requirements**:
  - `rule` TR-15.1: `ng serve --port 4200` → démarre OK ; login admin → sidenav visible
  - `rule` TR-15.2: URL /admin/dashboard sans token → redirect /admin/login
  - `rubric` TR-15.3: Layout admin professionnel Material ; scale 1-5 ; anchors 1=menu HTML, 3=sidenav + toolbar basic, 5=Material Design strict, responsive, icons, animations subtiles ; threshold >= 4 ; evidence: captures layout

## Task 16: Backoffice-admin - Module Auth + Gestion Utilisateurs + CRUD Offres
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 15
- **Description**:
  - Login page: email/mdp, connexion + stockage token
  - Users list page: Material mat-table (pagination, tri, filtre global), columns: id,email,roles,verified,enabled, actions (edit role, suspend/activate, delete confirm dialog)
  - User edit dialog: mat-dialog select roles multiples [CANDIDATE,COMPANY,ADMIN,RECRUITER], bouton save
  - Offers list page: mat-table + filtre statut (ACTIVE/CLOSED), colonnes: title,company,publication,statut, actions (view/edit/delete/moderate)
  - Offer edit page: reactive forms tous champs
- **Acceptance Criteria Addressed**: AC-9 (FR-ADMIN 1,2)
- **Test Requirements**:
  - `rule` TR-16.1: Liste users affiche ≥5 utilisateurs (seed) + pagination fonctionne (prev/next)
  - `rule` TR-16.2: Changer rôle user COMPANY → ADMIN + save → GET backend confirme
  - `rubric` TR-16.3: Ergonomie CRUD tables + dialogs ; scale 1-5 ; anchors 1=table simple, 3=table with pagination, 5=tables Material complete (tri, filtre, pagination, dialogs confirmations, inline status badges) ; threshold >= 4 ; evidence: captures 2 pages + dialog

## Task 17: Backoffice-admin - Candidatures + Supervision vérifications + Dashboard KPIs et Graphiques
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 16
- **Description**:
  - Applications list page: filtre global + filtre statut (select 8 statuts), colonnes: candidat, offre, entreprise, statut, matching, date, action (view détail modal + PATCH statut forcé)
  - Verifications supervision page: file d'attente EN_ATTENTE prioritaires, boutons Valider / Rejeter (modal motif), téléchargement pièce
  - Dashboard page: cards KPI (Total users, new users 7j, Total offres, candidatures en cours, % complets vérifications, Taux conversion candidature→embauche)
  - Dashboard graphiques (ng2-charts + canvas): camembert répartition rôles users, barres nb candidatures par jour 30j, courbe évolution inscriptions mensuelles
- **Acceptance Criteria Addressed**: AC-9 (tous FR-ADMIN)
- **Test Requirements**:
  - `rule` TR-17.1: Dashboard s'affiche sans erreur JS console, tous 6 KPI numériques > 0 (seed)
  - `rule` TR-17.2: Graphiques: canvas DOM rendu (3 canvas) sans erreurs
  - `rule` TR-17.3: Vérification page pending: bouton Valider → statut backend VALIDE confirmation
  - `rubric` TR-17.4: Richesse dashboard + data viz ; scale 1-5 ; anchors 1=2 KPI texte, 3=5 KPI + 1 graphique, 5=6+ KPI + 3 graphiques + couleurs dashboard professionnel ; threshold >= 4 ; evidence: captures dashboard + verifications + applications

## Task 18: Module IA UI côté frontend (Candidat: assistant CV, suggestions lettre)
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 13, Task 17
- **Description**:
  - Candidat: sur profile page bouton "💡 Conseils IA pour mon profil" → appel GET /api/ai/conseils → affichage cartes conseils
  - Sur Offre détail page: avant de poster, bouton "Aide IA à la lettre de motivation" → POST /api/ai/suggestions-lettre → retour généré dans textarea lettre motivation (pré-rempli modifiable par candidat)
  - Indicateur badge "IA disponible" ou "IA dégradée - fonctionnalités limitées" selon retour backend champ serviceStatus
- **Acceptance Criteria Addressed**: AC-10, AC-8
- **Test Requirements**:
  - `rule` TR-18.1: Si backend retourne degraded → badge orange "Mode dégradé" affiché (pas d'erreur UI)
  - `rule` TR-18.2: Conseils IA → carte conseil affichée (3 minimums retour)
  - `rubric` TR-18.3: Intégration transparente IA dans UX ; scale 1-5 ; anchors 1=page isolée IA, 3=2 boutons dans pages, 5=intégré naturellement dans profil/offre avec pré-remplissage intelligent + état service ; threshold >= 3 ; evidence: captures 2 intégrations

## Task 19: Documentation - READMEs racine + frontend + backend + backoffice + docs/ architecture
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 18
- **Description**:
  - Racine README.md: résumé projet, stack, architecture 3 tiers, arborescence fichiers, prérequis (Java17, Node20, MongoDB6+ ou Docker compose)
  - backend/README.md: `mvn clean install`, `mvn spring-boot:run`, profiles (dev, prod), variables env (JWT_SECRET, MONGO_URI, OLLAMA_URL), Swagger URL, endpoints principaux, comment seed
  - frontend-public/README.md: `npm install`, `npm run dev` (port 5173), build, variables VITE_API_URL
  - backoffice-admin/README.md: `npm install -g @angular/cli@17`, `npm install`, `ng serve --port 4200`, build
  - docs/architecture.md: schéma texte ASCII des composants, MongoDB collections diagram, endpoints list auth/candidat/company/admin/verif/ai, workflow statuts candidature 8 étapes avec diagramme
- **Acceptance Criteria Addressed**: NFR-4 (via README), tous modules utilisation
- **Test Requirements**:
  - `rule` TR-19.1: Les 4 README existent + docs/architecture.md, liens relatifs corrects
  - `rubric` TR-19.2: Clarté et exhaustivité documentation ; scale 1-5 ; anchors 1=1 fichier sparse, 3=3 README basiques, 5=5 fichiers détaillés + diagrammes ASCII + troubleshooting ; threshold >= 4 ; evidence: fichiers sources

## Task 20: Finalisation - Intégration bout en bout, ajustements PROGRESS.md, git commits finaux
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 19
- **Description**:
  - Mise à jour PROGRESS.md avec toutes étapes réalisées, dates, modules, AC validés
  - Revue cross-cutting: CORS headers tous OK, 404, gestion erreur globale Spring (@RestControllerAdvice) + React ErrorBoundary, Angular ErrorHandler
  - Tests manuels bout en bout: inscript candidat → complète profil → CV upload → upload pièce → candidat postule → recruteur valide vérif → compagnie voit candidature → compagnie passe entretien → accepte → candidat voit statut final
  - Commits atomiques: minimum 15 commits regroupés par module (Task1 init, Task2 backend config, Task3 models, Task4 auth, Task5 candidat, Task6 entreprise, Task7 vérif, Task8 AI, Task9 seed, Task10 tests, Task11 react setup, Task12 auth react, Task13 espace candidat, Task14 landing, Task15 angular setup, Task16 CRUD admin, Task17 dashboard admin, Task18 UI IA, Task19 docs, Task20 final)
- **Acceptance Criteria Addressed**: AC-12, tous AC via E2E scénario
- **Test Requirements**:
  - `rule` TR-20.1: `git log --oneline | wc -l` ≥ 15 commits
  - `rule` TR-20.2: Scénario E2E complet ci-dessus chaque étape fonctionne (status HTTP 2xx + UI affiche correctement)
  - `rubric` TR-20.3: PROGRESS.md qualité ; scale 1-5 ; anchors 1=2 lignes, 3=étapes sans dates, 5=détaillé par module avec AC correspondants cochés, bugs résolus, hypothèses précisées, instructions de démarrage ; threshold >= 4 ; evidence: contenu PROGRESS.md + git log
