# RhConnect - Product Requirements Document

## Overview
- **Summary**: RhConnect est une plateforme RH complète et moderne qui met en relation des candidats/talents, des entreprises, des recruteurs et des opportunités professionnelles (offres d'emploi, stages, missions). La plateforme centralise les offres, permet la création de profils vérifiés, le dépôt et suivi de candidatures, et fournit des outils de gestion complets aux entreprises et à l'administration.
- **Purpose**: Fournir une solution RH tout-en-un sécurisée, performante et évolutive pour digitaliser le processus de recrutement de bout en bout.
- **Target Users**: Candidats/talents à la recherche d'opportunités, Entreprises/RH publiant des offres, Recruteurs, Administrateurs plateforme.

## Goals
- Centraliser et digitaliser l'ensemble du processus de recrutement
- Offrir une expérience utilisateur fluide et moderne sur tous supports
- Assurer la sécurité et la traçabilité des données et des candidatures
- Permettre un matching pertinent entre profils candidats et offres
- Fournir des tableaux de bord d'administration et de reporting complets
- Intégrer une assistance IA pour l'aide à la candidature et l'analyse de documents

## Non-Goals
- Intégration native avec des outils de paie ou de gestion du personnel (HRIS)
- Gestion des contrats de travail et onboarding détaillé post-embauche
- Intégration de paiements ou facturation (hors scope initial)
- Support multi-langue (seulement FR pour la V1)
- Application mobile native (responsive web only)

## Background & Context
Le projet RhConnect est un monorepo full-stack imposé:
- Frontend public: React + Vite + Tailwind CSS
- Back-office admin: Angular
- Backend API: Java + Spring Boot + MongoDB
- Authentification: JWT + Spring Security
- IA: Intégration Ollama (couche d'abstraction)

Structure de dépôt attendue:
```
rhconnect/
├── frontend-public/     # React + Vite + Tailwind
├── backoffice-admin/    # Angular
├── backend/             # Spring Boot (API REST)
├── docs/                # documentation technique
└── PROGRESS.md
```

## Functional Requirements

### Module Authentification (FR-AUTH)
- **FR-AUTH-1**: Inscription avec choix de rôle (CANDIDATE ou COMPANY uniquement à l'inscription)
- **FR-AUTH-2**: Connexion / déconnexion sécurisée
- **FR-AUTH-3**: Gestion de 4 rôles: CANDIDATE, COMPANY, ADMIN, RECRUITER
- **FR-AUTH-4**: Validation de mot de passe (complexité minimale, longueur >= 8, chiffres, majuscules, caractères spéciaux)
- **FR-AUTH-5**: Hash bcrypt des mots de passe en base
- **FR-AUTH-6**: Token JWT (access token + refresh token) avec rotation
- **FR-AUTH-7**: Protection des endpoints par rôles (Spring Security)

### Module Candidats (FR-CAND)
- **FR-CAND-1**: Création et édition de profil candidat (infos perso, compétences, parcours pro, formation)
- **FR-CAND-2**: Upload et gestion du CV (pdf/doc/docx)
- **FR-CAND-3**: Consultation et filtrage des offres (mots-clés, localisation, type contrat, niveau expérience)
- **FR-CAND-4**: Soumission de candidature à une offre (uniquement si matching profil)
- **FR-CAND-5**: Suivi des candidatures en temps réel (statuts + timeline)
- **FR-CAND-6**: Consultation des résultats et retours

### Module Entreprises/RH (FR-COMP)
- **FR-COMP-1**: Création et édition du profil entreprise (nom, SIRET, description, secteur, logo)
- **FR-COMP-2**: Publication d'offres (CRUD: titre, description, compétences requises, localisation, type contrat, salaire, niveau)
- **FR-COMP-3**: Consultation des candidatures reçues par offre
- **FR-COMP-4**: Vue détaillée d'un dossier candidat
- **FR-COMP-5**: Validation ou rejet d'une candidature (avec commentaire)
- **FR-COMP-6**: Filtrage des candidatures (statut, date, matching score)

### Module Vérification (FR-VERIF)
- **FR-VERIF-1**: Upload de pièces justificatives (pièce d'identité, diplômes, attestations)
- **FR-VERIF-2**: Workflow de vérification: EN_ATTENTE → VALIDE ou REJETÉ (avec motif)
- **FR-VERIF-3**: Contrôle de conformité par un RECRUITER ou ADMIN
- **FR-VERIF-4**: Traçabilité des validations (qui, quand, commentaire)
- **FR-VERIF-5**: Transmission aux entreprises uniquement des dossiers complets et validés
- **FR-VERIF-6**: Suivi du statut de vérification visible par le candidat

### Module IA / Assistance (FR-AI)
- **FR-AI-1**: Aide à la rédaction de lettres de motivation / optimisation de profil (suggestions)
- **FR-AI-2**: Analyse de CV et extraction de compétences/parcours
- **FR-AI-3**: Conseils RH personnalisés selon le profil
- **FR-AI-4**: Couche d'abstraction AIProviderInterface (permettant de remplacer Ollama par un autre moteur)
- **FR-AI-5**: Mode dégradé si service IA indisponible (message clair + fallback sans IA)
- **FR-AI-6**: Matching score automatisé profil/offre (heuristique + IA si disponible)

### Module Back-office Administration (FR-ADMIN)
- **FR-ADMIN-1**: Gestion des utilisateurs (CRUD, changement de rôle, activation/suspension)
- **FR-ADMIN-2**: Gestion des offres (modération, suppression, validation)
- **FR-ADMIN-3**: Gestion des candidatures (changement de statut forcé, vue globale)
- **FR-ADMIN-4**: Supervision des vérifications en attente (file d'attente)
- **FR-ADMIN-5**: Tableau de bord statistique (KPIs: nb inscriptions, nb offres, nb candidatures, taux de conversion, top secteurs)
- **FR-ADMIN-6**: Graphiques (camembert, barres, courbes temporelles) via lib Angular (ex: Chart.js)

## Non-Functional Requirements
- **NFR-1**: Interface responsive mobile-first (breakpoints Tailwind/Angular Material)
- **NFR-2**: Temps de réponse API < 500ms en moyenne sur endpoints simples, < 2s sur endpoints complexes
- **NFR-3**: Sécurité: JWT stateless, CORS configuré, validation d'entrées (DTOs), protection CSRF, headers de sécurité
- **NFR-4**: API documentée automatiquement (Swagger/OpenAPI 3.0 sur /swagger-ui.html)
- **NFR-5**: Code modulaire, couplage faible (interfaces, services séparés, injection Spring)
- **NFR-6**: Seeds MongoDB fournis avec données de démo réalistes
- **NFR-7**: Git commits réguliers et fichier PROGRESS.md à jour à chaque étape
- **NFR-8**: Chiffrement des chemins/URL de fichiers uploadés, taille max fichier contrôlée
- **NFR-9**: Charte visuelle cohérente (couleurs RH moderne: bleu profond, accents orange/violet, blanc cassé)

## Constraints
- **Technical**: Monorepo, stacks imposées (React/Vite/Tailwind, Angular, Spring Boot, MongoDB, JWT, Ollama)
- **Business**: Matching candidat/offre obligatoire avant dépôt, dossiers validés uniquement transmis aux entreprises
- **Dependencies**: MongoDB 6+, Java 17+, Node 20+, npm/yarn, Docker (optionnel recommandé pour MongoDB/Ollama)

## Assumptions
- Les ADMIN et RECRUITER sont créés manuellement en base (pas d'auto-inscription pour ces rôles)
- Le matching profil/offre initial est une heuristique pondérée (compétences + niveau expérience + localisation) score/100
- L'upload de fichiers se fait en base64 dans MongoDB GridFS ou dans un dossier `uploads/` configuré
- Les notifications par email sont simulées par des logs dans la V1 (pas d'intégration SMTP réelle)
- Swagger UI est activé en dev et config désactivable en prod par profile Spring

## Open Questions
- [ ] Type de contrat: quel choix exacts proposer? (CDI, CDD, Stage, Alternance, Freelance, Intérim — assomption: ces 6)
- [ ] Échelle du matching score: 0-100 (fixé)
- [ ] Type des pièces justificatives acceptées: PDF, JPG, PNG max 5Mo chacune (assomption)
- [ ] Dossier complet candidat = profil rempli à 100% + CV uploadé + pièces vérifiées (assomption)
- [ ] Nombre de statuts de candidature: postulé → reçu → en cours de vérification → vérifié → transmis → entretien → accepté → refusé (8 statuts définis dans métier)

## Acceptance Criteria

### AC-1: Authentification JWT fonctionnelle end-to-end
- **Type**: `rule`
- **Given**: Un backend Spring Boot démarré, un utilisateur candidat inscrit en base
- **When**: Un POST /api/auth/login avec email/mdp correct est envoyé
- **Then**: Réponse 200 contenant accessToken (JWT valide <15min) et refreshToken (valide <7j) ; le accessToken permet d'appeler GET /api/candidates/me avec 200
- **Pass Condition**: curl/login retourne 200 + 2 tokens, puis curl /me avec Bearer retourne 200 et les infos du candidat
- **Evidence**: Capture des 2 réponses HTTP (status + corps) + test Postman/curl intégré

### AC-2: Inscription candidat + entreprise avec validation mdp
- **Type**: `rule`
- **Given**: Base vide, aucune contrainte hors règles
- **When**: POST /api/auth/register avec role=CANDIDATE + mdp trop court (6 car) puis avec mdp conforme "RhConnect2026!"
- **Then**: 1er appel 400 + erreur "Password complexity", 2ème appel 201 + user créé + role=CANDIDATE en base
- **Pass Condition**: Vérif via GET /api/auth/users/{id} + champ roles=["CANDIDATE"] et password ne commence pas par "$2a$10$" (bcrypt)
- **Evidence**: Réponses HTTP + extrait MongoDB (password hashé)

### AC-3: CRUD Offres par une entreprise authentifiée
- **Type**: `rule`
- **Given**: Une COMPANY authentifiée (Bearer token) avec profil validé
- **When**: Enchaînement POST /api/offers → GET /api/offers/{id} → PUT /api/offers/{id} → DELETE /api/offers/{id}
- **Then**: Statuts respectifs 201, 200, 200, 204 ; l'offre est liée au companyId de l'authentifié ; une autre COMPANY ne peut pas modifier cette offre (403)
- **Pass Condition**: Tests 4 statuts + vérif companyId + test inter-entreprise 403
- **Evidence**: Réponses HTTP séquencées + vérif 403 cross-company

### AC-4: Workflow de candidature complet avec statuts
- **Type**: `rule`
- **Given**: Un candidat vérifié (dossier complet), une offre publiée, matching score > 50
- **When**: POST /api/applications → GET timeline statuts → RECRUITER valide → COMPANY accepte
- **Then**: Statuts successifs visibles du candidat: POSTULÉ → REÇU → VÉRIFIÉ → TRANSMIS → ACCEPTÉ, chaque avec timestamp et acteur
- **Pass Condition**: Timeline GET retourne 8 statuts maximum possibles, celui-ci en contient 5 avec dates croissantes
- **Evidence**: Réponse JSON timeline + statuts dans l'ordre métier

### AC-5: Upload et vérification de pièce justificative
- **Type**: `rule`
- **Given**: Un CANDIDATE authentifié
- **When**: POST /api/verifications/upload (fichier PDF 200ko type pièce) puis PATCH /api/verifications/{id}/validate par un RECRUITER
- **Then**: Fichier stocké + vérification créée EN_ATTENTE → après PATCH statut=VALIDE + validatorId renseigné + date
- **Pass Condition**: Fichier récupérable via GET /api/verifications/{id}/file 200, statut VALIDE en base
- **Evidence**: Réponses upload + validate + download 200

### AC-6: Matching profil/offre bloque les candidatures non éligibles
- **Type**: `rule`
- **Given**: Offre X compétences=["Java","Spring"] niveau="SENIOR" ; Candidat Y compétences=["JavaScript"] niveau="JUNIOR" (score < 30)
- **When**: Candidat Y postule à offre X
- **Then**: 422 + code MATCHING_REQUIREMENTS_NOT_MET + détail "Matching score 28 < seuil 50"
- **Pass Condition**: HTTP 422 + message métier, application NON créée en base
- **Evidence**: Réponse 422 + GET /api/applications retourne liste vide pour ce candidat

### AC-7: API OpenAPI 3.0 documentée
- **Type**: `rule`
- **Given**: Backend démarré en profile dev
- **When**: GET /v3/api-docs
- **Then**: 200 JSON valide OpenAPI 3.0.x avec au moins /auth, /candidates, /companies, /offers, /applications, /verifications décrits
- **Pass Condition**: Swagger UI /swagger-ui.html affiche la liste des endpoints groupés
- **Evidence**: Screenshot ou curl /v3/api-docs contenant "openapi":"3."

### AC-8: Frontend public React - Landing + navigation Candidat
- **Type**: `rubric`
- **Dimension**: UX et complétude du frontend public
- **Scale**: 1-5
- **Anchors**: 1 = landing seule sans structure ; 3 = landing + pages auth/offres avec style basique ; 5 = landing premium moderne + espace candidat (profil, offres filtrées, candidatures timeline) responsive + charte cohérente
- **Pass Threshold**: >= 4
- **Evidence**: Capture d'écran landing + dashboard candidat + page détail offre

### AC-9: Back-office Angular Dashboard + stats
- **Type**: `rubric`
- **Dimension**: Ergonomie et profondeur du back-office admin
- **Scale**: 1-5
- **Anchors**: 1 = simple liste d'utilisateurs ; 3 = CRUD users/offres + tableau de bord avec 2 KPI ; 5 = dashboard complet (5+ KPI + graphiques) + gestion utilisateurs/offres/candidatures/vérifications + filtres
- **Pass Threshold**: >= 4
- **Evidence**: Screenshot dashboard + page liste utilisateurs + page supervision vérifications

### AC-10: Module IA - Intégration Ollama avec fallback
- **Type**: `rule`
- **Given**: Endpoint POST /api/ai/analyze-cv qui délègue à AIProviderInterface
- **When**: Ollama indisponible (mauvaise URL) puis disponible (modèle llama3:8b local)
- **Then**: Sans Ollama → 200 + mode dégradé (message "Service IA indisponible") sans erreur 500 ; Avec Ollama → 200 + JSON {competences:[...], pointsForts:[...], suggestions:[]}
- **Pass Condition**: Deux scénarios retournent 200 (pas de crash), couche abstraction fonctionne
- **Evidence**: Réponses JSON des deux cas + preuve injection interface (code source)

### AC-11: Seed MongoDB avec données démo
- **Type**: `rule`
- **Given**: Script de seed disponible dans backend/src/main/resources/
- **When**: Exécution du seed (via CommandLineRunner ou script externe)
- **Then**: Base contient >= 3 CANDIDATE profils complets, >= 2 COMPANY, >= 5 OFFERS, >= 6 APPLICATIONS avec statuts variés, 1 ADMIN et 1 RECRUITER
- **Pass Condition**: Requêtes count MongoDB retournent minimums attendus
- **Evidence**: Sortie console seed + resultats 6 requêtes count

### AC-12: PROGRESS.md tenue à jour + commits git réguliers
- **Type**: `rubric`
- **Dimension**: Traçabilité du développement
- **Scale**: 1-5
- **Anchors**: 1 = 1 seul commit final ; 3 = 3-5 commits + PROGRESS avec 2 étapes ; 5 = >= 15 commits atomiques + PROGRESS.md détaillé par module (backend/auth/crud/frontend-react/frontend-angular/ai/seeds) avec dates
- **Pass Threshold**: >= 4
- **Evidence**: git log --oneline (>= 15 lignes) + contenu PROGRESS.md structuré
