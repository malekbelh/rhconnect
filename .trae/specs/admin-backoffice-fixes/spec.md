# RhConnect Back-office Admin — Corrections & Mise à niveau vers spécification 9 sections

## Overview
- **Summary**: Mettre à niveau l'intégralité du back-office administrateur (interface Angular + APIs backend Spring Boot) pour qu'il soit 100% conforme à la spécification 9 sections fournie (Dashboard, Users, Offers, Applications, Verifications, Reporting, AI Supervision, System Settings, Transverse UX/UI).
- **Purpose**: Supprimer les risques métier (absence de modération des offres, absence d'audit log, droits admin/recruteur mélangés), compléter les fonctionnalités métier (fiches détail, litiges, vérifications entreprises, supervision IA), et élever le niveau UX/UI (breadcrumb, skeletons, permissions UI, intercepteurs).
- **Target Users**: Administrateurs RhConnect (ADMIN) et Modérateurs (RECRUITER) qui utilisent le back-office quotidiennement.

## Goals
- G-1: Instaurer un workflow de modération obligatoire pour TOUTES les offres avant publication
- G-2: Mettre en place une journalisation d'audit complète et exportable de TOUTES actions sensibles
- G-3: Séparer strictement les droits ADMIN (users, roles, system) des droits RECRUITER (offers, apps, verifications)
- G-4: Généraliser l'intercepteur HTTP Angular pour JWT, refresh-token, gestion d'erreurs
- G-5: Compléter les 8 pages Angular avec toutes les fonctionnalités métier manquantes
- G-6: Ajouter modules absents : litiges candidatures, vérifications entreprises, supervision IA
- G-7: Persister les paramètres système en base MongoDB (plus localStorage uniquement)
- G-8: Élever le niveau transverse UX (breadcrumb, skeletons, breadcrumb, permissions UI)

## Non-Goals
- NG-1: Migration de framework UI (garder composants custom Angular standalone, NI Angular Material, NI lib externe)
- NG-2: Refonte complète des modèles MongoDB existants autres que ceux requis par la spec
- NG-3: Implémentation d'un module de messagerie temps réel candidat↔recruteur hors contexte admin (hors notes internes admin)
- NG-4: Export PDF natif (dans P2 seulement, P0/P1 = CSV+Excel uniquement)
- NG-5: Internationalisation / multi-langues

## Background & Context
- Monorepo existant c:\Users\MSI\Desktop\rhconnect : backend/ (Spring Boot 3.2.5 + MongoDB + GridFS + 9 controllers), frontend-public/ (React+Vite+Tailwind), backoffice-admin/ (Angular 17 standalone, 8 pages, pas de NgModules, custom design system).
- Audit du 10/09/2026 : ~30% de la spec 9 sections implémenté. Nombreuses UI placeholder, nombreux endpoints backend manquants, localStorage au lieu de persistance pour settings, pas de workflow modération, pas d'audit log, pas de séparation ADMIN/RECRUITER.
- Risques actuels listés dans l'audit : offre PUBLIÉE SANS MODÉRATION (bloquant), aucune trace des actions admin (risque RGPD pour données RH sensibles), RECRUITER a accès aux users management (hors spec), pas de 401/403 centralisé.
- Enum actuel OfferStatus = DRAFT/ACTIVE/CLOSED. DOIT être étendu.
- Modèles existants à étendre : Offer (modération), User (notes admin, lastLoginIP), Application (litiges, notes admin), Verification (attribution, verrouillage, entreprise).

## Functional Requirements

### FR-P0 — Workflow modération offres
- FR-P0.1: Enum OfferStatus étendu à : DRAFT, PENDING_MODERATION, ACTIVE, REJECTED, EXPIRED, UNPUBLISHED
- FR-P0.2: Toute offre créée par une entreprise (POST /offers) passe systématiquement en PENDING_MODERATION, jamais ACTIVE directement
- FR-P0.3: Endpoint PATCH /api/offers/{id}/moderate ADMIN/RECRUITER avec action = APPROVE | REJECT | REQUEST_EDIT et motif obligatoire pour REJECT/REQUEST_EDIT
- FR-P0.4: Historique de modération persisté : moderatorId, action, comment, timestamp
- FR-P0.5: Cron @Scheduled nocturne pour passer ACTIVE → EXPIRED quand dateExpiration < now
- FR-P0.6: Angular OffersComponent : onglet/file d'attente PENDING_MODERATION avec compteur, actions valider/rejeter/demander modif avec modale motif

### FR-P0 — Audit Log obligatoire
- FR-P0.7: Collection MongoDB audit_logs {actorId, actorEmail, role, action:String, entityType, entityId, details:Document, ip, timestamp}
- FR-P0.8: Aspect AOP Spring `@Audit(action="USER_ROLE_UPDATED")` avec auto-logging sur méthodes de service annotées
- FR-P0.9: Endpoints GET /api/admin/audit (filtres actorId, action, entityType, dateFrom/dateTo, paginé) + GET /api/admin/audit/export (CSV)
- FR-P0.10: Actions MINIMUM auditables : User status toggle, role update, delete, Offer moderate, Application status change, Verification decision, Settings update, Admin login/logout

### FR-P0 — Séparation stricte ADMIN vs RECRUITER
- FR-P0.11: Matrice d'accès UI : ADMIN → tout ; RECRUITER → Dashboard, Offers moderation, Applications, Verifications, Reporting seulement. RECRUITER INTERDIT → Users, Roles, System Settings, AI Supervision config
- FR-P0.12: Angular : routes.canActivate granular avec `PermissionsGuard.can('admin:users','admin:roles','admin:settings','admin:ai-config')` sinon forbidden 403
- FR-P0.13: Angular `PermissionsService.can(permission)` avec pipe `*can="'admin:users:delete'"` pour masquer les boutons/actions non autorisées (backend garde @PreAuthorize en double sécurité)
- FR-P0.14: AdminGuard mis à jour : accepte ADMIN et RECRUITER (portes d'entrée)
- FR-P0.15: Backend endpoints users/roles/settings → @PreAuthorize("hasRole('ADMIN')") EXCLUSIVEMENT
- FR-P0.16: Empêcher un ADMIN de supprimer/suspendre son PROPRE compte via backend guard (throw 400)

### FR-P0 — HTTP Interceptors Angular centralisés
- FR-P0.17: JwtInterceptor : ajoute Authorization: Bearer <accessToken> sur toutes les requêtes sauf whitelist (/auth/login, assets/)
- FR-P0.18: ErrorInterceptor : intercepte 401 → refresh token automatique via RefreshTokenService, si échec → redirect login avec queryParam returnUrl ; intercepte 403 → toast "Accès refusé" ; intercepte 5xx → toast erreur + bouton réessayer
- FR-P0.19: Refresh token automatique (access 15min JWT, refresh 7j rotation)

### FR-P0 — Sécurité Admin complémentaire
- FR-P0.20: Endpoint POST /api/auth/admin/users/{id}/impersonate ADMIN only → retourne un accessToken JWT impersonné + champ impersonating: true
- FR-P0.21: Angular Bandeau visible "MODE IMPERSONATION - Identité: X" si token comporte impersonating=true, bouton "Quitter impersonation"
- FR-P0.22: Endpoint DELETE /api/auth/admin/users/{id} ADMIN only, motif obligatoire dans request body ; double confirmation côté UI (saisie du email du user à supprimer)
- FR-P0.23: Endpoint POST /api/auth/admin/users/{id}/reset-password ADMIN only → envoi email avec lien reset
- FR-P0.24: RefreshTokenRepository + endpoint GET /api/admin/sessions (ADMIN only) + DELETE /api/admin/sessions/{tokenId} (déconnexion à distance)

### FR-P1 — Fiches détail utilisateur enrichies
- FR-P1.1: Endpoints GET /api/admin/users/{id}/profile (retourne User + CandidateProfile ou CompanyProfile lié + verificationDocs + candidatures/applications + historique connexion)
- FR-P1.2: Angular Users drawer enrichi : onglets "Profil", "Candidatures/Offres", "Documents", "Vérification", "Notes admin", "Historique"
- FR-P1.3: Zone "Notes internes admin" : champ texte multi-lignes persisté via PATCH /api/admin/users/{id}/admin-notes ADMIN only
- FR-P1.4: Actions drawer : Activer/Désactiver avec motif obligatoire modale, Réinitialiser mot de passe, Se connecter en tant que..., Supprimer compte
- FR-P1.5: Séparation des listes "Candidats" et "Entreprises" (2 onglets ou 2 vues séparées) avec filtres spécifiques (secteur, nb offres publiées pour entreprises ; compétences, localisation pour candidats)
- FR-P1.6: Sélection multiple users + actions groupées (suspendre en masse, exporter CSV/Excel)

### FR-P1 — Offres avancées
- FR-P1.7: Endpoint GET /api/admin/offers/{id}/stats → {viewCount, clickCount, applicationCount, conversionRate}
- FR-P1.8: Vue détail offre enrichie : stats détaillées, liste des candidatures liées, modifier contenu, dupliquer, dépublier avec appel API PUT réel
- FR-P1.9: Filtres offres par catégorie/secteur, entreprise, date création, popularité, nb candidatures
- FR-P1.10: Tri colonnes sur tableau offers (date, nb candidatures, vues, popularité)

### FR-P1 — Candidatures & Litiges
- FR-P1.11: Modèle Application enrichi : notesAdmin:[{authorId, text, timestamp}], dispute:{isDisputed:boolean, reason, assignedTo, resolutionStatus:OPEN|IN_PROGRESS|RESOLVED, resolutionHistory:[{actorId, text, timestamp}]}, isIncomplete:boolean (calculé si CV manquant etc)
- FR-P1.12: Endpoint PATCH /api/admin/applications/{id}/force-status ADMIN/RECRUITER, nouveauStatut + motif obligatoire (contournement workflow)
- FR-P1.13: Endpoint POST/PATCH /api/admin/applications/{id}/dispute (ouvrir / mettre à jour / résoudre litige)
- FR-P1.14: Applications drawer enrichi : Visionneuse documents joints (CV PDF/image via download endpoint avec iframe/img inline), zone messages (read-only si existants), Notes admin éditables, Timeline statuts, Bouton forcer statut (modale motif), Section Litige si en litige
- FR-P1.15: Filtre "dossier incomplet", "litiges ouverts", "bloquées depuis > 7j"
- FR-P1.16: Export CSV liste applications filtrées

### FR-P1 — Vérifications avancées & Entreprises
- FR-P1.17: Modèle Verification étendu : companyId (nullable, soit candidateId soit companyId renseigné), assignedTo (recruiterId), lockedBy, lockedAt (TTL 10min), resubmissionCount, checklistItems:[{key,label,passed:boolean}], motifsPredefinis:String[] (configurable)
- FR-P1.18: Nouveaux types pièces entreprise : KBIS, SIRET_ATTESTATION, TVA_ATTESTATION, IDENTITE_DIRIGEANT
- FR-P1.19: Endpoint PATCH /api/verifications/{id}/assign → attribution dossier ; PATCH /api/verifications/{id}/lock / unlock (ping renew lock toutes 30s frontend)
- FR-P1.20: Angular Verifications : 2 onglets "Candidats" / "Entreprises", Visionneuse PDF/image réelle (iframe + img + zoom via HTML), liste motifs prédéfinis + champ libre, checklist cliquable persistée, raccourcis clavier V=valider R=rejeter, stats conformité (KPIs taux validation, délai moyen traitement, volume par vérificateur)
- FR-P1.21: Historique re-soumissions visible sur fiche vérification

### FR-P1 — Reporting + Statistiques enrichies
- FR-P1.22: StatsResponse étendu : trends (vs periode précédente), tauxCroissance, delaiMoyenTraitement, tauxValidationVerification, top 10 offres plus consultées, tempsMoyenPremiereReponse, tauxAbandonCandidature
- FR-P1.23: Endpoint GET /api/stats/advanced/{period} (day/week/month/quarter/year) et filtres croisés sectorId + dateFrom/dateTo
- FR-P1.24: Angular Reporting : sélecteur plage dates 7j/30j/90j/personnalisé, comparaison période précédente (%), filtres croisés secteur×période, export CSV + Excel (xlsx via SheetJS ou similaire)

### FR-P1 — System Settings persistés
- FR-P1.25: Collection system_settings MongoDB {key:String unique, value:Mixed, updatedBy, updatedAt}
- FR-P1.26: Endpoints GET /api/admin/settings (toutes les clés), PATCH /api/admin/settings (update multiple clés), ADMIN only
- FR-P1.27: Clés MINIMUM : verification.requiredPieces.candidate[], verification.requiredPieces.company[], verification.allowedRejectionReasons[], offer.defaultExpirationDays, ai.enabled, ai.provider, ai.autoValidateThreshold, maintenance.mode (boolean), maintenance.message
- FR-P1.28: Angular SettingsComponent : tous toggle/slider/champ → PATCH /api/admin/settings, plus localStorage, dirty banner sauvegarde, affichage des logs d'activité récents (audit_logs 50 dernières lignes)
- FR-P1.29: CRUD Catégories offres : collection offer_categories + GET/PUT/PATCH/DELETE /api/admin/categories ADMIN only + UI dans Settings onglet "Référentiels"
- FR-P1.30: CRUD Compétences référentiel : collection skills_referentiel + endpoints + UI, dédoublonnage/synonymes

### FR-P2 — IA Supervision (section 7 spec)
- FR-P2.1: Collection ai_usage_logs {userId, action:CV_ANALYZE|SUGGESTION|..., prompt, response, tokens, latencyMs, feedbackRating(1-5), feedbackText, timestamp}
- FR-P2.2: AIService existant → log chaque appel dans ai_usage_logs ; endpoints POST /ai/logs/{id}/feedback (user et admin)
- FR-P2.3: Endpoints GET /api/admin/ai/stats → {totalUses, byAction, avgRating, adoptionRate%, alertsCount}
- FR-P2.4: Nouvelle page Angular "Supervision IA" (ADMIN only) : 4 KPIs, graphique usages 30j, derniers logs + like/dislike affichage, alertes répétées rating < 2
- FR-P2.5: Config prompts (settings AI) dans SettingsComponent onglet "IA" (clés settings ai.systemPrompt, ai.temperature, etc.)

### FR-P2 — UX/UI Transverse
- FR-P2.6: Breadcrumb dynamique sur AdminLayout (ex : Dashboard › Utilisateurs › Détail : M. Dupont)
- FR-P2.7: Skeleton loader components (KpiCardSkeleton, TableSkeleton, DrawerSkeleton) remplaçant spinners pendant chargement initial
- FR-P2.8: Notifications admin topbar cloche fonctionnelle : WebSocket ou polling 30s /api/admin/notifications/unread-count → {pendingVerifications, pendingModerations, openDisputes}, dropdown liste 10 dernières
- FR-P2.9: Barre recherche globale header fonctionnelle : debounce 400ms, cherche dans users (email/nom), offres (titre), applications (candidat/offre), boutons résultats rapides
- FR-P2.10: Confirmation modale système unique (ConfirmationService Angular) pour toute action destructive, plus confirm() navigateur
- FR-P2.11: Maintenance mode → backend SecurityConfig intercepte /api/public/** et /api/auth/register (sauf ADMIN login) si maintenance.mode=true

## Non-Functional Requirements
- **NFR-1 Sécurité**: Toutes les modifications sensibles auditables. Double vérification UI+backend sur permissions. JWT access ≤15min, refresh rotation. Aucun secret client-side.
- **NFR-2 Performance**: Tableaux paginés backend-side (pas front-only) ; max 100 items/page. Dashboard réponse API < 500ms.
- **NFR-3 Compatibilité navigateurs**: Chrome 120+, Firefox 120+, Edge 120+ (pas de polyfills anciens).
- **NFR-4 UX Responsive**: ≥ 900px = bureau complet, 560-900px = tablette (sidebar auto collapse), <560px = mobile (minimal mais fonctionnel).
- **NFR-5 Build**: `mvn clean verify` backend SUCCESS, `ng build --configuration production` Angular SUCCESS, aucune erreur TS, aucun diagnostic TS marqué erreur.
- **NFR-6 Robustesse**: Tous les subscribe Angular avec takeUntilDestroyed(). Pas de fuites mémoire. Error handling sur chaque appel HTTP (toast et état vide).

## Constraints
- **Technical**: Architecture monorepo 3 tiers imposée. Angular standalone composants, composants UI custom gardés (pas de migration vers lib UI). MongoDB + GridFS pour fichiers. Spring Boot 3.2.5, Java 17, Maven.
- **Business**: Workflow candidature 8 statuts POSTULE→RECU→EN_VERIFICATION→VERIFIE→TRANSMIS→ENTRETIEN→ACCEPTE/REFUSE préservé. Matching score 40/30/10/20 préservé.
- **Dependencies**: Ajouts autorisés si compatible : Angular cdk overlay, SheetJS (xlsx) pour Excel export, Spring Boot Starter AOP, Spring Boot Starter Quartz si besoin (actuellement scheduling de base). PAS d'autres dépendances lourdes sans justification.

## Assumptions
- A-1: Service email sera branché plus tard (endpoints POST reset-password etc retournent 200 OK "email simulé" + log console en attendant)
- A-2: Les 4 rôles CANDIDATE/COMPANY/RECRUITER/ADMIN sont figés, rôles personnalisés = P2 ultérieur hors scope
- A-3: 2FA admin est considéré comme P2 ultérieur (pas dans cette mise à niveau, session active + refresh seulement)
- A-4: L'emailer réel (SMTP) existe déjà dans backend via JavaMailSender sinon simulé

## Acceptance Criteria

### AC-1: Workflow modération offres — règle
- **Type**: `rule`
- **Given**: Une entreprise connectée crée une nouvelle offre via POST /api/offers
- **When**: L'offre est persistée
- **Then**: (a) statut = PENDING_MODERATION, (b) une entrée audit_logs est écrite avec action = OFFER_CREATED, (c) elle N'EST PAS visible sur GET /api/offers/public avant modération APPROVE
- **Pass Condition**: 3 assertions (a)(b)(c) vérifiées en base + via API avec 2 comptes entreprise différents
- **Evidence**: Test d'intégration Spring + cURL reproduit + capture Mongo compass enum

### AC-2: Audit log complet — règle
- **Type**: `rule`
- **Given**: Un admin connecté effectue les actions : toggle un user, update un rôle, valide une offre, rejette une vérification, modifie un paramètre système
- **When**: Chaque action aboutit en HTTP 200/204
- **Then**: Une ligne audit_logs est créée par action avec actorId, action, entityType, entityId, timestamp non vides
- **Pass Condition**: 5 actions → ≥ 5 audit logs distincts, tous champs remplis, export CSV contient ces lignes
- **Evidence**: GET /api/admin/audit count, contenu CSV exporté, capture AOP aspect

### AC-3: Séparation ADMIN/RECRUITER stricte — règle
- **Type**: `rule`
- **Given**: Un utilisateur RECRUITER authentifié
- **When**: Il tente d'accéder à /admin/users, /admin/settings, /admin/ai-supervision (UI) ou appelle GET/PATCH sur /api/auth/admin/users/**, /api/admin/settings (API)
- **Then**: UI → guard refuse ; backend → 403 Forbidden ; audit_log action RECRUITER_FORBIDDEN_ACCESS
- **Pass Condition**: 403 sur 3 endpoints API + guard UI redirect 403 component
- **Evidence**: Appel API 403 + capture routing Angular avec permissions insuffisantes

### AC-4: Intercepteurs Angular & refresh token — règle
- **Type**: `rule`
- **Given**: Un admin connecté depuis >15min (access token expiré, refresh token encore valide)
- **When**: Il déclenche un appel API quelconque
- **Then**: (a) premier appel retourne 401 → ErrorInterceptor déclenche refresh-token automatique ; (b) nouvelle paire access/refresh reçue ; (c) appel original rejoué transparente avec nouveau token
- **Pass Condition**: E2E : 0 redirection login malgré access expiré, refresh token rotation observable (ancien refreshToken = REVOKED)
- **Evidence**: DevTools Network : 401 → refresh → replay, capture Mongo refresh_tokens revoked

### AC-5: Fiche détail user enrichie + notes admin persistées — règle
- **Type**: `rule`
- **Given**: Un candidat existant avec un profile + des candidatures + une vérification en attente, et un admin ADMIN authentifié
- **When**: Admin ouvre drawer détail du candidat et saisit "Note interne test" dans zone Notes admin puis enregistre
- **Then**: GET /api/admin/users/{id} retourne les notes mises à jour, audit_log USER_ADMIN_NOTE_UPDATED, liste des candidatures du user présente dans l'onglet "Candidatures"
- **Pass Condition**: Réponse API notes="Note interne test" + 1 audit log + UI affiche candidatures liées
- **Evidence**: Response body PATCH notes, capture UI drawer 4 onglets

### AC-6: Litige candidature cycle de vie complet — règle
- **Type**: `rule`
- **Given**: Une candidature existante en statut TRANSMIS ; un RECRUITER authentifié
- **When**: RECRUITER marque la candidature en litige via POST /api/admin/applications/{id}/dispute (raison = "CV frauduleux"), puis un ADMIN la résout avec motif "CV validé auprès école"
- **Then**: application.dispute.isDisputed=true, historique contient 2 entrées, statut résolution = RESOLVED, audit logs APPLICATION_DISPUTE_OPENED et APPLICATION_DISPUTE_RESOLVED
- **Pass Condition**: 2 events dans history + 2 audit logs + applications filter "en litige" retourne 1 ligne avant résolution
- **Evidence**: PATCH response body applications, filtre litige = 1 / 0 selon phase

### AC-7: Vérification entreprise + verrou dossier — règle
- **Type**: `rule`
- **Given**: Un RECRUITER a ouvert une vérification entreprise et a acquis le lock dessus
- **When**: Un second RECRUITER tente de prendre le même dossier
- **Then**: Second RECRUITER reçoit 409 Conflict + notification "Dossier en cours de traitement par X" ; first RECRUITER peut renouveler lock par ping 30s ; vérification validée → libération auto du lock
- **Pass Condition**: 2 sessions RECRUITER simultanées, 409 sur 2e, validé après 2 pings renouvellement succès
- **Evidence**: Mongo verification.lockedBy={id1}, second API retour 409

### AC-8: System Settings persistés en base — règle
- **Type**: `rule`
- **Given**: Un ADMIN configure SettingsComponent Angular (toggles verification pièces + offer.defaultExpirationDays = 45 + sauvegarde)
- **When**: ADMIN se déconnecte, ouvre un autre navigateur, se reconnecte, ouvre Settings
- **Then**: offer.defaultExpirationDays = 45, tous toggles identiques, audit log SETTINGS_UPDATED, 0 lecture localStorage faite à l'open
- **Pass Condition**: Mongo system_settings contient la clé ; GET /api/admin/settings retourne identique avant/après relog
- **Evidence**: Capture Compass system_settings, réponse GET identique 2 navigateurs

### AC-9: Design cohérent & responsive — rubrique
- **Type**: `rubric`
- **Dimension**: Qualité UX transverse (breadcrumb, skeletons, états vides, responsive, permissions UI)
- **Scale**: 1-5
- **Anchors**: 1 = aucune de ces fonctionnalités ; 3 = responsive ok, états vides présents, autres partiels ; 5 = breadcrumb sur tous les drawers, skeletons sur 8 pages chargement initial, responsive breakpoints 1200/900/560 tous testés sans scroll horizontal, icônes ont aria-label, actions non autorisées invisible
- **Pass Threshold**: >= 4
- **Evidence**: Capture manuelle des 8 pages chargement (skeletons), screenshot breadcrumbs, Chrome DevTools device toolbar tablette/mobile, audit quick a11y axe-devtools ≥ 90/100

### AC-10: Build & tests verts — règle
- **Type**: `rule`
- **Given**: Code final commité (ou en l'état)
- **When**: On exécute `mvn clean verify` (backend) et `ng build --configuration production --base-href /admin/` (backoffice-admin)
- **Then**: Les deux build finissent avec code 0, 0 erreur compilation TS, tests unitaires Spring verts (≥ 9 existants), pas d'erreur lint diagnostic
- **Pass Condition**: exit code 0 ×2, 0 diagnostic type error TS, tests Spring ≥ 9 verts
- **Evidence**: Logs console build, sortie de ng build "Initial chunk files..." sans erreur

## Open Questions
- [ ] Aucune pour l'instant. Options retenues par défaut : export Excel via SheetJS (xlsx) autorisé ; messagerie candidat↔recruteur en lecture seule côté admin (pas de chat bi-directionnel dans ce scope) ; 2FA hors scope.
