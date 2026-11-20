# RhConnect Back-office Admin — Plan d'implémentation

Décomposition en tâches atomiques, ordonnées par dépendances puis par priorité (P0/P1/P2).

## Task 1: Enum OfferStatus étendu + nouveaux champs modération
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Étendre l'enum `OfferStatus` à 6 valeurs : DRAFT, PENDING_MODERATION, ACTIVE, REJECTED, EXPIRED, UNPUBLISHED
  - Ajouter dans `Offer` : `moderatorId:String`, `moderationComment:String`, `moderatedAt:Instant`, `moderationHistory:[{actorId,action,comment,timestamp}]`
  - Offre créée entreprise : statut initial = PENDING_MODERATION ; offre créée ADMIN : statut = DRAFT ou ACTIVE (selon user input)
  - Cron @Scheduled nocturne OFFRE EXPIRED (toutes les 1h par sécurité)
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `rule` TR-1.1: POST /offers depuis un compte entreprise → statut=PENDING_MODERATION vérifié via findById
  - `rule` TR-1.2: Offre avec dateExpiration dépassée, après appel de la méthode scheduled → statut=EXPIRED
  - `rule` TR-1.3: Offre PENDING_MODERATION ABSENTE de GET /offers/public
  - `rubric` TR-1.4: "Rétrocompatibilité"; scale 1-5; anchors 1=offres existantes KO en lecture, 3=lecture OK mais pas de migration, 5=migration DTO tous statuts existants mappés (DRAFT→DRAFT, ACTIVE→ACTIVE, CLOSED→UNPUBLISHED/EXPIRED selon dateExpiration); threshold >= 4; evidence=Vérifier lecture des anciennes offres

## Task 2: Audit logs — Modèle, Repository, Aspect AOP, Endpoints
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Entité `AuditLog` (Document Mongo) avec tous champs
  - `AuditLogRepository` (MongoRepository)
  - `@Audit` annotation et `AuditAspect` AOP autour des méthodes services
  - Service `AuditService.log(action, entityType, entityId, details)` manuel
  - Controller `GET /api/admin/audit` paginé + filtres, `GET /api/admin/audit/export.csv`
  - Appliquer `@Audit` sur méthodes : UserService.toggleStatus/updateRole/delete, OfferService.moderate, VerificationService.validate/reject, SettingsService.save
- **Acceptance Criteria Addressed**: AC-2, AC-8
- **Test Requirements**:
  - `rule` TR-2.1: Exécution toggle-status user → 1 ligne audit_logs écrite
  - `rule` TR-2.2: GET /api/admin/export.csv retourne Content-Type text/csv + BOM UTF-8, entêtes id,actor,action...
  - `rule` TR-2.3: Audit aspect n'échoue jamais (try/catch around aspect body) même si log en erreur (throw uniquement en dev)
  - `rule` TR-2.4: Action ADMIN_LOGIN et ADMIN_LOGOUT sont loggés (login handler/logout handler)

## Task 3: Permissions ADMIN vs RECRUITER — Backend endpoints
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Passer tous endpoints users management, roles, settings, sessions, audit, ai-supervision en `@PreAuthorize("hasRole('ADMIN')")`
  - Offres moderation/applications/verifications/reporting/dashboard `hasAnyRole('ADMIN','RECRUITER')`
  - Controller guard : empêcher ADMIN de modifier/supprimer son propre compte (400)
  - Vérifier SecurityConfig whitelist : retirer `/api/offers/**` permitAll (remplacer par GET publics seulement)
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `rule` TR-3.1: RECRUITER → GET /api/auth/admin/users → 403
  - `rule` TR-3.2: RECRUITER → PATCH /api/admin/offers/{id}/moderate → 200 autorisé
  - `rule` TR-3.3: ADMIN tente de DELETE son propre compte → 400 "Vous ne pouvez pas modifier votre propre compte"

## Task 4: Angular — Intercepteurs JWT + erreurs + refresh token
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Créer `jwt.interceptor.ts` (HttpInterceptor), `error.interceptor.ts`
  - Service `AuthStateService` (signals : user$, accessToken$, isImpersonating$) avec takeUntilDestroyed
  - Mécanisme refresh-token automatique : 401 -> POST /api/auth/refresh si refreshToken présent -> rejouer requête initiale -> sinon redirect login
  - Enregistrer les interceptors dans app.config.ts (provideHttpClient withInterceptors)
  - Ajouter ForbiddenComponent 403 et Unauthorized intercepte
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `rule` TR-4.1: Appel API sans token → Authorization header absent → 401 → redirect login
  - `rule` TR-4.2: Token valide présent → Authorization: Bearer ajouté automatiquement
  - `rule` TR-4.3: Cas 403 → toast "Accès refusé" affiché, pas de redirect
  - `rubric` TR-4.4: "Propreté centralisation headers"; scale 1-5; anchors 1=chaque service ajoute headers manuellement, 3=intercepteur présent mais exceptions non gérées, 5=TOUS services Angular ne gèrent plus le header auth manuellement, error handled; threshold >= 4; evidence=Recherche Grep 'Authorization.*Bearer' dans services Angular = 0 résultat

## Task 5: Angular — PermissionsService, Guard granulaire, Pipe *can
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4 (pour user$)
- **Description**:
  - `PermissionsService.can(permission:string, ...ressources?)` → boolean, basé sur user.roles[]
  - PermissionsMap : ADMIN=true pour tout ; RECRUITER=true pour dashboard,offers:moderate,applications:*,verifications:*,reporting
  - Routes : `UsersGuard.canActivate = can('admin:users')`, `SettingsGuard.canActivate=can('admin:settings')`, `AiSupervisionGuard.canActivate=can('admin:ai-config')`
  - `CanPipe` structural `*can="'admin:users:delete'"` remplace les éléments DOM si non autorisé
  - Mettre à jour le layout sidebar : masquer les entrées non autorisées (Users/Paramètres/Supervision IA pour RECRUITER)
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `rule` TR-5.1: Login RECRUITER → Sidebar n'affiche PAS Users/Paramètres/Supervision IA ; tentative URL directe /admin/users → 403
  - `rule` TR-5.2: Bouton "Supprimer" user → DOM inexistant pour RECRUITER
  - `rubric` TR-5.3: "Couverture masquage UI"; scale 1-5; threshold >= 4; evidence=Inventaire 8 pages 20+ boutons actions masqués selon rôle

## Task 6: Endpoints admin Auth — Détail user, delete, reset, impersonate, sessions
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2 (audit)
- **Description**:
  - GET /api/auth/admin/users/{id}/profile — retourne User + profil lié + candidatures/applications + verificationDocs + loginHistory
  - DELETE /api/auth/admin/users/{id} avec body {reason} ADMIN only
  - POST /api/auth/admin/users/{id}/reset-password — envoi lien reset
  - POST /api/auth/admin/users/{id}/impersonate ADMIN only → JWT avec claim impersonating=true + originalUserId
  - GET /api/admin/sessions (RefreshTokenRepository.findAllValid()) — DELETE /api/admin/sessions/{id} pour logout à distance
- **Acceptance Criteria Addressed**: AC-2, AC-3, AC-5
- **Test Requirements**:
  - `rule` TR-6.1: DELETE user autre que soi + reason → soft delete (enabled=false) ou hard delete selon champ reason ; audit log écrit
  - `rule` TR-6.2: Impersonate retourne JWT ; claim impersonating=true vérifié via GET /auth/me retourne {impersonating:true, originalUser:{email}}
  - `rule` TR-6.3: /sessions retourne la liste ; DELETE session → Mongo RefreshToken.revokedAt renseigné

## Task 7: Angular — Impersonation bandeau + Settings persistés API + UsersDrawer enrichi
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Tasks 4, 5, 6
- **Description**:
  - Bandeau visible global (hors login) quand isImpersonating=true (header tout en haut orange foncé : "MODE IMPERSONATION" + bouton Quitter)
  - SettingsComponent : remplacer localStorage par GET/PATCH /api/admin/settings via admin-api.service.ts ; dirty banner "Modifications non sauvegardées" ; confirmation perte avant navigation
  - Users drawer réorganisé en onglets (TabGroup custom) : Profil / Candidatures ou Offres (selon rôle) / Documents / Vérification / Notes admin / Historique actions
  - Zone Notes admin champ texte + sauvegarde PATCH /api/admin/users/{id}/admin-notes
  - Actions : Activer/Désactiver avec modale motif, Réinitialiser MDP (modal "Lien envoyé à X"), Se connecter en tant que, Supprimer compte (modal saisie email confirmation)
- **Acceptance Criteria Addressed**: AC-5, AC-8
- **Test Requirements**:
  - `rule` TR-7.1: Appel impersonate → bandeau orange "MODE IMPERSONATION" apparaît en haut de chaque page
  - `rule` TR-7.2: Suppression compte → SANS saisir email correct → bouton Confirmer disabled
  - `rule` TR-7.3: Sauvegarde settings → refresh navigateur → settings restaurés depuis API (non localStorage)

## Task 8: Offres — Endpoint moderation + Stats + Update réel
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Tasks 1, 2
- **Description**:
  - PATCH /api/offers/{id}/moderate → {action: APPROVE|REJECT|REQUEST_EDIT, comment?} ADMIN/RECRUITER → met à jour offer.statut + moderationHistory + audit log
  - GET /api/admin/offers/{id}/stats (viewCount, clickCount, applicationCount, conversionRate) — viewCount à initialiser 0 + compteur incrément sur GET public
  - PUT /api/offers/{id} (admin) → update contenu + audit
  - POST /api/offers/{id}/duplicate → clone (id null, statut DRAFT, datePublication null)
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `rule` TR-8.1: Moderate APPROVE une PENDING → statut=ACTIVE + moderationHistory.length incrémenté de 1
  - `rule` TR-8.2: Moderate REJECT sans comment → 400 Bad Request motif obligatoire
  - `rule` TR-8.3: Duplicate offre → ID nvelle offre != offre origine, statut DRAFT, même titre et contenu

## Task 9: Angular — OffersComponent workflow modération réel + drawer enrichi
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Tasks 4, 8
- **Description**:
  - Onglet/file d'attente PENDING_MODERATION avec badge compteur
  - Tableau avec compteur candidatures réelles (pas fake) + compteur vues depuis new endpoint
  - Filtres : secteur catégorie, entreprise, date création, popularité
  - Drawer enrichi : 3 boutons (Valider / Demander modification / Rejeter) avec modale motif obligatoire pour 2 derniers
  - Onglets dans drawer : Détails / Statistiques / Candidatures liées / Modifier contenu / Dupliquer / Dépublier
  - Dépublier → appel PUT réel change statut UNPUBLISHED (plus status = CLOSED local)
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `rule` TR-9.1: Clic Rejeter sans motif → modale erreur motif obligatoire ; avec motif → statut passe REJECT + badge compteur -1
  - `rule` TR-9.2: Onglet Statistiques → viewCount / applicationCount / taux conversion affichés correctement
  - `rule` TR-9.3: Dépublier offre ACTIVE → API PUT /offers/{id} → statut UNPUBLISHED, rechargement liste

## Task 10: Applications — Litiges, force-status, notes admin, visionneuse documents (Backend)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - Modèle Application : notesAdmin[], Dispute embedded (isDisputed, reason, assignedTo, resolutionStatus OPEN/IN_PROGRESS/RESOLVED, resolutionHistory[])
  - PATCH /api/admin/applications/{id}/force-status {newStatus, reason} → contourne workflow + audit log APPLICATION_STATUS_FORCED
  - POST/PATCH /api/admin/applications/{id}/dispute (ouvrir / assigner / résoudre)
  - PATCH /api/admin/applications/{id}/notes {authorId, text} (append note)
  - Indicateur isIncomplete = CV absent ou documents requis manquants
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `rule` TR-10.1: force-status de ACCEPTE → POSTULE (contre workflow) → autorisé avec reason, audit log écrit
  - `rule` TR-10.2: POST dispute {reason,assignedTo} → application.dispute.isDisputed=true + resolutionStatus=OPEN
  - `rule` TR-10.3: PATCH dispute status=RESOLVED → entrée ajoutée dans resolutionHistory

## Task 11: Angular — ApplicationsDrawer enrichi + filtres étendus
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Tasks 4, 10
- **Description**:
  - Drawer Applications + onglets : Détails / Documents (visionneuse iframe/img inline avec endpoint download GridFS) / Timeline / Notes admin / Litige
  - Filtres Applications : dossier incomplet, litiges ouverts, bloquées >7j (calcul date dernier statut < now - 7j), par offre, par entreprise, par candidat
  - Bouton "Forcer statut" → modale motif obligatoire
  - Section Litige : Ouvrir / Assigner à moi / Résoudre avec motif
  - Export CSV liste filtrée
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `rule` TR-11.1: CV PDF existant → onglet Documents affiche iframe avec src=/api/verifications/download/{pieceId} → contenu PDF visible
  - `rule` TR-11.2: Filtre "Litiges ouverts" → retourne uniquement applications.dispute.isDisputed=true
  - `rule` TR-11.3: Export CSV → headers Id, Candidat, Offre, Statut, Date, Dossier

## Task 12: Verification — Vérifications entreprises, verrou, attribution, checklist (Backend)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - Étendre Verification model : companyId, assignedTo, lockedBy, lockedAt, resubmissionCount, checklistItems[], requesterDecisionComment
  - Nouveaux DocumentTypes entreprise : KBIS, SIRET_ATTESTATION, TVA_ATTESTATION, IDENTITE_DIRIGEANT
  - PATCH /api/verifications/{id}/assign {recruiterId} (admin/recruteur peut s'auto-assigner)
  - PATCH /api/verifications/{id}/lock, unlock → TTL lockedAt 10min index Mongo (auto expire)
  - PATCH /api/verifications/{id}/checklist → sauvegarder checklist validée
  - GET /api/admin/verifications/stats → {tauxValidationGlobal, tauxValidationParType, delaiMoyenTraitementMinutes, volumeParVerificateur:[{verificateur,count}]}
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `rule` TR-12.1: 2 verrous simultanés → second 409 Conflict
  - `rule` TR-12.2: Verrou lockedAt + 11min → lock expiré auto (Mongo TTL index), unlock forcé
  - `rule` TR-12.3: GET stats retourne délai moyen ≥ 0 et taux validation 0..1

## Task 13: Angular — VerificationsComponent visionneuse réelle + onglets Candidats/Entreprises + stats
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Tasks 4, 12
- **Description**:
  - 2 onglets Candidats / Entreprises
  - Visionneuse PDF/image avec : `<iframe>` pour PDF, `<img>` pour jpg/png, boutons zoom +/- et plein écran natif
  - Liste de motifs de rejet prédéfinis (dropdown) + champ complémentaire libre
  - Checklist cliquable (checkboxes) persisté à chaque clic
  - Boutons S'attribuer / Libérer / Vérrouillage automatique à l'ouverture du drawer
  - Raccourcis clavier Alt+V valider, Alt+R rejeter focus sur motif
  - KPIs stats conformité affichés en haut page
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `rule` TR-13.1: Pièce PDF → iframe visible + document s'affiche dans drawer; image JPG → img affichée
  - `rule` TR-13.2: Alt+V → status passe VALIDE sans souris (keydown listener)
  - `rule` TR-13.3: Vérificateur 1 ouvre drawer → dossier locké ; Vérificateur 2 tente ouvrir même dossier → toast "Dossier en cours par X"

## Task 14: StatsResponse étendu + Reporting backend filtres croisés
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 1 (enum cohérent)
- **Description**:
  - Enrichir StatsResponse : tauxCroissanceInscriptions%, trends:{usersTrend,offersTrend,applicationsTrend}, delaiMoyenTraitementJours, topOffresByViews:[{offerTitle,viewCount}], tempsMoyenPremiereReponseHeures, tauxAbandonCandidature%
  - Nouvel endpoint GET /api/stats/advanced?period=MONTH&from=&to=&sectorId= → filtres croisés
  - GET /api/stats/export/{format:CSV|EXCEL} → export multi-KPI
- **Acceptance Criteria Addressed**: AC-10
- **Test Requirements**:
  - `rule` TR-14.1: Stats response contient tauxCroissance (0 ou positif si aucune période précédente)
  - `rule` TR-14.2: Filtres croisés period + date → stats retour filtré par période

## Task 15: System settings — Collection, endpoints, CRUD catégories/compétences
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 2
- **Description**:
  - Collection system_settings (clé unique / valeur)
  - SettingsController GET/PATCH /api/admin/settings
  - CRUD /api/admin/categories + /api/admin/skills référentiel (entity, repository, controller)
  - Maintenance mode : Security filter retourne HTTP 503 pour /api/auth/register + /api/public/** quand maintenance.mode=true
  - Clés initiales : verification.requiredPieces.candidate, verification.requiredPieces.company, verification.allowedRejectionReasons, offer.defaultExpirationDays=30, ai.enabled=true, ai.provider=ollama, maintenance.mode=false
- **Acceptance Criteria Addressed**: AC-8
- **Test Requirements**:
  - `rule` TR-15.1: PATCH settings key → GET retourne valeur persistée Mongo
  - `rule` TR-15.2: maintenance.mode=true → POST /api/auth/register retourne 503 Service Unavailable "Maintenance en cours"
  - `rule` TR-15.3: CRUD catégories → POST→GET→PUT→DELETE 4 endpoints fonctionnels

## Task 16: Angular — Reporting enrichi + Maintenance mode banner + Settings CRUD référentiels
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Tasks 4, 14, 15
- **Description**:
  - Reporting : sélecteur période 7j/30j/90j/Custom (daterange picker custom), comparaison % vs précédente sur les KPIs, export CSV+Excel (SheetJS/xlsx importé)
  - Maintenance mode : si maintenance.mode=true → bandeau rouge "Mode maintenance activé, inscriptions bloquées" visible sur AdminLayout quand ADMIN connecté
  - SettingsComponent réorganisé en onglets : Général / Critères vérification / Référentiels (Catégories, Compétences) / IA / Notifications / Logs (50 derniers audit logs paginés)
  - CRUD catégories + compétences dans onglet Référentiels (mini tableau + boutons ajouter/éditer/supprimer)
- **Acceptance Criteria Addressed**: AC-8, AC-10
- **Test Requirements**:
  - `rule` TR-16.1: Sélecteur 7j → Dashboard charges 7j derniers depuis API filtre date
  - `rule` TR-16.2: Maintenance.mode=true → bannière rouge visible immédiatement après chargement settings
  - `rule` TR-16.3: Export Excel reporting → téléchargement de .xlsx valide (peut être ouvert par Excel)

## Task 17: AI Supervision — Backend logs + stats endpoints
- **Status**: `pending`
- **Priority**: low
- **Depends On**: Task 2
- **Description**:
  - Collection ai_usage_logs
  - AIService existant (Ollama + Fallback) → insère log à chaque appel
  - POST /ai/logs/{id}/feedback {rating, comment} accessible user et admin
  - GET /api/admin/ai/stats → {totalUses, byAction:{CV_ANALYZE:X}, avgRating, adoptionRate%, alertsBelowRating:X}
  - GET /api/admin/ai/logs → liste paginée avec filtre rating < threshold
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `rule` TR-17.1: Appel /api/ai/analyse-cv → ai_usage_logs.count augmente de 1
  - `rule` TR-17.2: Feedback rating=1 → alertsBelowRating incrementé stats

## Task 18: Angular — Page Supervision IA + UX transverses (Task 18 final)
- **Status**: `pending`
- **Priority**: low
- **Depends On**: Tasks 4, 5, 17, 16
- **Description**:
  - Créer page standalone ai-supervision + route /admin/ai-supervision (canActivate can('admin:ai-config'))
  - KPIs AI : utilisations totales, note moyenne, adoption%, alertes
  - Graphique barres usages 30j (svg custom comme dashboard)
  - Tableau derniers logs + like/dislike
  - UX Transverses: Breadcrumb dynamique sur layout (signaux), Skeleton components (3 directives pour cards/tableaux), Notifications cloche dropdown fonctionnelle (polling toutes 30s /api/admin/notifications/unread), Barre de recherche globale debounce 400ms avec résultats (users/offres/applications), ConfirmationService unique pour modale destructive
- **Acceptance Criteria Addressed**: AC-9, AC-10
- **Test Requirements**:
  - `rule` TR-18.1: Supervision IA → RECRUITER 403 ; ADMIN affiche KPIs + graphique 30j
  - `rule` TR-18.2: Chargement initial Dashboard → Skeleton cards visibles pendant <1s puis KPI cards réelles
  - `rule` TR-18.3: Breadcrumb "Utilisateurs › Détail › John DOE" affiché quand drawer user ouvert
  - `rubric` TR-18.4: "Cohérence design final"; scale 1-5; threshold >= 4; evidence=Visuel inspection 8 pages, modales, toasts cohérents

## Task 19: Run tests + build final
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Tasks 1-18 terminés
- **Description**:
  - Exécuter `mvn clean verify` backend
  - Exécuter `npm install && ng build --configuration production --base-href /admin/` backoffice-admin
  - Corriger les éventuelles erreurs compilation/lint restantes
  - Vérifier diagnostics TypeScript = 0 erreur
  - Mettre à jour PROGRESS.md étape 7 + list AC
- **Acceptance Criteria Addressed**: AC-10
- **Test Requirements**:
  - `rule` TR-19.1: `mvn clean verify` exit code 0
  - `rule` TR-19.2: `ng build --configuration production` exit code 0
  - `rule` TR-19.3: GetDiagnostics VSCode = 0 erreur TS
