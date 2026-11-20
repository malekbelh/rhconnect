# RhConnect — Architecture Technique Complète

> Version 1.0 — Étape 1 : Proposition d'architecture
> Document de référence pour l'implémentation A à Z de la plateforme RhConnect

---

## 1. Vue d'ensemble — Architecture 3 tiers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                 │
│  ┌─────────────────────────┐          ┌──────────────────────────┐      │
│  │  Frontend Public        │          │  Back-office Admin       │      │
│  │  React + Vite + Tailwind│          │  Angular 17 + Material   │      │
│  │  Port 5173              │          │  Port 4200               │      │
│  └────────────┬────────────┘          └────────────┬─────────────┘      │
│               │ HTTPS / REST JSON                  │                    │
└───────────────┼────────────────────────────────────┼────────────────────┘
                │                                    │
┌───────────────▼────────────────────────────────────▼────────────────────┐
│                       API GATEWAY (Spring Boot)                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Port 8080                      Spring Security (JWT Stateless) │     │
│  │  Controllers → Services → Repositories → MongoDB               │     │
│  │  Swagger UI :8080/swagger-ui.html                               │     │
│  └────────────┬───────────────────────────────────────────────────┘     │
└───────────────┼─────────────────────────────────────────────────────────┘
                │ Spring Data MongoDB
┌───────────────▼─────────────────────────────────────────────────────────┐
│                        DATA LAYER (MongoDB 6+)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  users   │ │candidate_│ │company_  │ │  offers  │ │applica-  │      │
│  │          │ │profiles  │ │profiles  │ │          │ │tions     │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────────┐                   │
│  │verifica- │ │refresh_  │ │  GridFS (fichiers)     │                   │
│  │tions     │ │tokens    │ │  CV, pièces justif.    │                   │
│  └──────────┘ └──────────┘ └───────────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────────────────┐
│                        SERVICES EXTERNES                                │
│  ┌─────────────────────┐  ┌──────────────────────────────┐              │
│  │  Ollama (IA locale) │  │  (Optionnel) SMTP / emails   │              │
│  │  Port 11434         │  │                               │              │
│  └─────────────────────┘  └──────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Schéma de Données MongoDB (7 collections principales + sous-documents)

### 2.1 Collection `users` — Authentification & Rôles
```typescript
{
  _id: ObjectId,                      // PK
  email: string,                      // UNIQUE indexé
  password: string,                   // bcrypt (strength 12)
  roles: Role[],                      // [CANDIDATE | COMPANY | ADMIN | RECRUITER]
  enabled: boolean,                   // compte activé
  verified: boolean,                  // email vérifié (simulé V1)
  createdAt: ISODate,                 // @CreatedDate
  lastLogin: ISODate | null
}

enum Role { CANDIDATE, COMPANY, ADMIN, RECRUITER }
```
**Contraintes** : ADMIN/RECRUITER créés uniquement manuellement en base (pas via `/register`).

---

### 2.2 Collection `candidate_profiles` — Profil Candidat
```typescript
{
  _id: ObjectId,
  userId: ObjectId,                   // FK → users._id (UNIQUE one-to-one)
  firstName: string,
  lastName: string,
  phone: string,
  address: string,                    // utilisé pour matching localisation
  bio: string,
  competences: string[],              // ex: ["Java","Spring","React"]
  parcours: Experience[],             // expériences pro (sous-doc)
  formation: Formation[],             // diplômes (sous-doc)
  cvFileId: ObjectId | null,          // FK → GridFS._id
  cvFileName: string | null,
  matchingTags: string[]              // tags additionnels pour matching
}

Experience {
  title: string,
  company: string,
  startDate: ISODate,
  endDate: ISODate | null,            // null = en cours
  description: string
}

Formation {
  diploma: string,
  school: string,
  year: number
}
```

---

### 2.3 Collection `company_profiles` — Profil Entreprise
```typescript
{
  _id: ObjectId,
  userId: ObjectId,                   // FK → users._id (UNIQUE one-to-one)
  companyName: string,
  siret: string,
  sector: string,                     // secteur d'activité
  size: string,                       // "1-10", "11-50", "51-200", "201-500", "500+"
  description: string,
  address: string,
  logoFileId: ObjectId | null,        // FK → GridFS
  website: string,
  verifiedStatus: VerificationStatus  // EN_ATTENTE / VALIDE / REJETE
}
```

---

### 2.4 Collection `offers` — Offres d'emploi
```typescript
{
  _id: ObjectId,
  companyId: ObjectId,                // FK → company_profiles._id
  title: string,
  description: string,                // texte riche (markdown possible V1)
  competencesRequises: string[],      // ex: ["TypeScript","Angular"]
  niveauExperience: NiveauExperience, // JUNIOR | MID | SENIOR | EXPERT
  typeContrat: TypeContrat,           // CDI | CDD | STAGE | ALTERNANCE | FREELANCE | INTERIM
  localisation: string,
  salaireMin: number | null,          // € brut / an
  salaireMax: number | null,
  datePublication: ISODate,
  dateExpiration: ISODate | null,
  statut: OfferStatus,                // DRAFT | ACTIVE | CLOSED
  matchingTags: string[]
}

enum NiveauExperience { JUNIOR(0-2a), MID(2-5a), SENIOR(5-10a), EXPERT(10a+) }
enum TypeContrat    { CDI, CDD, STAGE, ALTERNANCE, FREELANCE, INTERIM }
enum OfferStatus    { DRAFT, ACTIVE, CLOSED }
```

---

### 2.5 Collection `applications` — Candidatures (workflow 8 statuts)
```typescript
{
  _id: ObjectId,
  candidateId: ObjectId,              // FK → candidate_profiles._id
  offerId: ObjectId,                  // FK → offers._id
  companyId: ObjectId,                // FK → company_profiles._id (dénormalisé)
  statut: ApplicationStatus,          // statut courant du workflow
  timeline: ApplicationTimelineEntry[], // historique ordonné
  matchingScore: number,              // 0..100 (MatchingService)
  lettreMotivation: string,
  createdAt: ISODate
}

ApplicationTimelineEntry {
  statut: ApplicationStatus,
  date: ISODate,
  acteurId: ObjectId | null,          // FK → users._id (null = système)
  acteurEmail: string | null,         // dénormalisé pour affichage
  commentaire: string | null          // motif rejet, remarques entretien...
}

enum ApplicationStatus {
  POSTULE,          // 0 — Candidat a cliqué "Postuler"
  RECU,             // 1 — Accusé réception automatique
  EN_VERIFICATION,  // 2 — Dossier passé à l'équipe vérification
  VERIFIE,          // 3 — Pièces conformes (RECRUITER/ADMIN)
  TRANSMIS,         // 4 — Dossier transmis à l'entreprise
  ENTRETIEN,        // 5 — Entreprise a programmé un entretien
  ACCEPTE,          // 6 — Embauche confirmée
  REFUSE            // 7 — Candidature non retenue (à toute étape)
}
```

---

### 2.6 Collection `verifications` — Vérification administrative
```typescript
{
  _id: ObjectId,
  candidateId: ObjectId,              // FK → candidate_profiles._id (UNIQUE)
  pieces: VerificationDoc[],          // pièces justificatives
  statut: VerificationStatus,         // EN_ATTENTE | VALIDE | REJETE
  validatorId: ObjectId | null,       // FK → users._id (RECRUITER/ADMIN)
  validatedAt: ISODate | null,
  commentaire: string | null          // motif REJETE si applicable
}

VerificationDoc {
  id: string,                         // UUID local à la pièce
  nomFichier: string,                 // nom affiché
  type: string,                       // "IDENTITE" | "DIPLOME" | "ATTESTATION" | "AUTRE"
  fileId: ObjectId,                   // FK → GridFS._id
  uploadedAt: ISODate
}

enum VerificationStatus { EN_ATTENTE, VALIDE, REJETE }
```

---

### 2.7 Collection `refresh_tokens` — JWT Rotation
```typescript
{
  _id: ObjectId,
  userId: ObjectId,                   // FK → users._id
  token: string,                      // UUID (JWT signé ou random)
  expiresAt: ISODate,                 // TTL 7 jours (604800s)
  revoked: boolean                    // révocation lors logout / refresh
}
```

---

### 2.8 Contraintes d'unicité & Index recommandés
| Collection | Champ(s) | Type index |
|---|---|---|
| users | email | UNIQUE |
| candidate_profiles | userId | UNIQUE |
| company_profiles | userId | UNIQUE |
| offers | companyId, statut | COMPOUND (filtrer offres actives par entreprise) |
| applications | candidateId + offerId | UNIQUE COMPOUND (éviter doubles candidatures) |
| applications | companyId, statut | COMPOUND (accès entreprise) |
| verifications | candidateId | UNIQUE |
| verifications | statut | (file d'attente RECRUITER) |
| refresh_tokens | token | UNIQUE |

---

## 3. Endpoints API REST — Inventaire complet (base `/api/`)

### 3.1 Module Public (`/public`) — pas d'authentification
| Méthode | Path | Description | HTTP Codes |
|---|---|---|---|
| GET | `/public/health` | Santé API + timestamp | 200 |
| GET | `/public/info` | Nom projet + modules | 200 |

### 3.2 Module Authentification (`/auth`)
| Méthode | Path | Rôles | Description |
|---|---|---|---|
| POST | `/auth/register` | ALL | Inscription CANDIDATE\|COMPANY + création profil vide |
| POST | `/auth/login` | ALL | Email+password → accessToken (15min) + refreshToken (7j) |
| POST | `/auth/refresh-token` | ALL | Rotation tokens (valide refresh → nouveau couple) |
| POST | `/auth/logout` | AUTH | Révoque le refreshToken fourni |
| GET | `/auth/me` | AUTH | Utilisateur courant + profil détaillé |
| GET | `/auth/admin/users?page&size` | ADMIN | Liste paginée de tous les utilisateurs |

### 3.3 Module Candidats (`/candidates`) — rôle CANDIDATE
| Méthode | Path | Description |
|---|---|---|
| GET | `/candidates/me` | Récupérer mon profil candidat |
| PUT | `/candidates/me` | Éditer mon profil (infos, compétences, parcours, formation) |
| POST | `/candidates/me/cv` (multipart) | Upload CV (PDF/DOC/DOCX → GridFS) |
| GET | `/candidates/me/cv` | Télécharger mon CV (attachment) |

### 3.4 Module Entreprises (`/companies`) — rôle COMPANY (⚠️ MANQUANT actuellement)
| Méthode | Path | Description |
|---|---|---|
| GET | `/companies/me` | Mon profil entreprise |
| PUT | `/companies/me` | Éditer profil (nom, SIRET, secteur, description…) |
| POST | `/companies/me/logo` (multipart) | Upload logo |
| GET | `/companies/me/logo` | Récupérer logo |

### 3.5 Module Offres (`/offers`)
| Méthode | Path | Rôles | Description |
|---|---|---|---|
| GET | `/offers?keyword&competence&niveau&typeContrat&localisation&page&size` | AUTH | Recherche/filtrage + matchingScore si CANDIDATE |
| GET | `/offers/{id}` | AUTH | Détail d'une offre (+ matchingScore si CANDIDATE) |
| POST | `/offers` | COMPANY, ADMIN | Créer une offre (COMPANY liée à son userId; ADMIN peut préciser companyId) |
| GET | `/offers/my` | COMPANY | Mes offres publiées |
| PUT | `/offers/{id}` | COMPANY, ADMIN | Modifier offre (ownership check si COMPANY) |
| DELETE | `/offers/{id}` | COMPANY, ADMIN | Supprimer offre (ownership check si COMPANY) |

### 3.6 Module Candidatures (`/applications`)
| Méthode | Path | Rôles | Description |
|---|---|---|---|
| GET | `/applications/me` | CANDIDATE | Mes candidatures (avec offre + entreprise) |
| POST | `/applications` | CANDIDATE | Postuler → checks : dossier complet + matching≥50 + pas de doublon |
| GET | `/applications/{id}` | AUTH | Détail (CANDIDATE owner / COMPANY owner offre / ADMIN-RECRUITER tous) |
| GET | `/applications/{id}/timeline` | AUTH | Timeline détaillée (acteurs + dates + commentaires) |
| GET | `/offers/{offerId}/applications` | COMPANY, ADMIN, RECRUITER | Candidatures d'une offre (COMPANY voit ≥VERIFIE) |
| PATCH | `/applications/{id}/status` | COMPANY, ADMIN, RECRUITER | Changer statut (+ commentaire, selon workflow rôle) |

### 3.7 Module Vérifications (`/verifications`)
| Méthode | Path | Rôles | Description |
|---|---|---|---|
| GET | `/verifications/me` | CANDIDATE | Ma vérification (statut + pièces) |
| POST | `/verifications/upload-piece` (multipart) | CANDIDATE | Ajouter une pièce justificative |
| GET | `/verifications/pending` | ADMIN, RECRUITER | File d'attente EN_ATTENTE |
| GET | `/verifications/{id}` | ADMIN, RECRUITER | Détail d'une vérification |
| GET | `/verifications/{id}/download/{pieceId}` | AUTH | Télécharger une pièce (owner + équipe) |
| PATCH | `/verifications/{id}/validate` | ADMIN, RECRUITER | Valider (VALIDE) ou rejeter (REJETE) avec motif → Propage VERIFIE→TRANSMIS sur candidatures du candidat |

### 3.8 Module IA (`/ai`) — (⚠️ MANQUANT actuellement)
| Méthode | Path | Rôles | Description |
|---|---|---|---|
| POST | `/ai/analyze-cv` (multipart) | AUTH | Analyse un CV → compétences, points forts, suggestions |
| POST | `/ai/suggestions-lettre` | CANDIDATE | Body {offerId} → suggestions pour lettre motivation |
| GET | `/ai/conseils` | CANDIDATE | Conseils personnalisés pour améliorer le profil |

### 3.9 Module Admin Stats (`/admin/stats`) — (⚠️ MANQUANT actuellement)
| Méthode | Path | Rôles | Description |
|---|---|---|---|
| GET | `/admin/stats/dashboard` | ADMIN, RECRUITER | KPIs : users, inscriptions 7j, offres, candidatures, taux vérification, taux conversion |
| GET | `/admin/stats/applications-by-day?days=30` | ADMIN, RECRUITER | Tableau [date, count] pour graphique barres |
| GET | `/admin/stats/roles-distribution` | ADMIN, RECRUITER | Compte par rôle (graphique camembert) |
| GET | `/admin/stats/signups-by-month?months=12` | ADMIN, RECRUITER | Inscriptions mensuelles (courbe) |

---

## 4. Workflows métier & Règles de gestion

### 4.1 Workflow de candidature (8 statuts)
```
Candidat postule
    │
    ▼
POSTULE ──────────────────────────────────────────────────────────────┐
    │  (auto : accusé réception immédiat)                              │
    ▼                                                                  │
RECU                                                                 │
    │  (auto : si candidat a vérification VALIDE → saute à VERIFIE)    │
    │  (auto : sinon → EN_VERIFICATION)                                │
    ▼                                                                  │
EN_VERIFICATION  ◄────────── nouveau document uploadé (reset)         │
    │  (RECRUITER/ADMIN valide la vérification)                        │
    ▼                                                                  │
VERIFIE ◄──┐                                                          │
    │      │  (patch /validate → si VALIDE, appliqué en masse)        │
    │      │                                                           │
    ▼      │                                                           │
TRANSMIS ──┘  (auto : immédiatement après VERIFIE)                    │
    │         ▲ L'entreprise voit enfin la candidature                 │
    │  (COMPANY : invite à entretien)                                  │
    ▼                                                                  │
ENTRETIEN                                                             │
    │                                                                  │
    ├───────────────────────────────────────────► REFUSE  (entreprise) │
    ▼                                                                  │
ACCEPTE                                                               │
                                                                       │
                        À TOUT MOMENT : REFUSE possible par ADMIN ─────┘
```

### 4.2 Matching Score — Algorithme pondéré (0..100)
Le score est calculé par le `MatchingService` :

| Critère | Pondération | Méthode |
|---|---|---|
| Compétences | 40% | `(matches / max(cand, offre)) × 40` (insensitive case) |
| Niveau Expérience | 30% | match exact = 30, ±1 cran = 15, ≥2 crans = 0 |
| Localisation | 10% | adresse identique = 10 sinon 0 (→ V2: géocoding distance) |
| Matching Tags | 20% | `(matches tags_offre / tags_offre) × 20` |

**Règle métier** : `POST /applications` renvoie `422 MATCHING_REQUIREMENTS_NOT_MET` si score < 50.

### 4.3 Définition "Dossier Complet"
Pour postuler, un candidat doit satisfaire `MatchingService.isDossierComplet()` :
- `firstName`, `lastName`, `phone` non vides
- `competences` ≥ 1 élément
- `cvFileId` renseigné (CV uploadé)

→ Si incomplet : `422 INCOMPLETE_PROFILE`.

### 4.4 Transmission à l'entreprise (règle FR-VERIF-5)
- Une `COMPANY` **ne voit jamais** une candidature tant que `statut < TRANSMIS`.
- `GET /offers/{offerId}/applications` filtre `WHERE statut >= TRANSMIS` pour le rôle COMPANY.
- Les statuts `POSTULE, RECU, EN_VERIFICATION, VERIFIE` sont internes à la plateforme + candidat + ADMIN/RECRUITER.

---

## 5. Couche Sécurité — JWT + Spring Security

### 5.1 Cycle de vie des tokens
```
                    login(email+password)
Client ───────────────────────────────────────────────► Backend
       ◄──────── accessToken(JWT, 15min) + refreshToken(7j)
       
                    Request X (Authorization: Bearer access)
Client ───────────────────────────────────────────────► Backend
       ◄──────────── 200 données / 401 si expiré
       
                    access expiré → POST /refresh-token {refreshToken}
Client ───────────────────────────────────────────────► Backend
       ◄─── NOUVEAU access(15min) + NOUVEAU refresh(7j) ★ ROTATION ★
       (ancien refresh révoqué en base: revoked=true)
```
- **Access token** : JWT signé HMAC-SHA256, claims : `sub(userId)`, `roles[]`, `iat`, `exp` (900s)
- **Refresh token** : JWT + stocké en base MongoDB (`refresh_tokens`) avec TTL index MongoDB
- **BCrypt strength** : 12 (`PasswordEncoder` bean)
- **CORS** : Origins autorisées : `http://localhost:5173` (React) + `http://localhost:4200` (Angular)

### 5.2 Matrice d'accès par rôle
| Endpoint / Feature | CANDIDATE | COMPANY | RECRUITER | ADMIN |
|---|---|---|---|---|
| Register / Login | ✅ | ✅ | ❌ | ❌ |
| Gérer son profil | ✅ | ✅ | ❌ profil dédié | ✅ tous |
| Voir les offres (+ matching) | ✅ | ✅ ses offres | ✅ | ✅ |
| Poster une offre | ❌ | ✅ ses propres | ❌ | ✅ toutes |
| Postuler à une offre | ✅ matching≥50 | ❌ | ❌ | ❌ |
| Voir ses propres candidatures | ✅ timeline | ✅ reçu (≥TRANSMIS) | ✅ toutes | ✅ toutes |
| Avancer statut → ENTRETIEN/ACCEPTE/REFUSE | ❌ | ✅ (sur TRANSMIS) | ❌ | ✅ forcé |
| Upload pièces vérification | ✅ | ❌ | ❌ | ❌ |
| Valider une vérification | ❌ | ❌ | ✅ | ✅ |
| Modifier rôle d'un user | ❌ | ❌ | ❌ | ✅ |
| Stats dashboard | ❌ | ❌ (V2 optionnel) | ✅ | ✅ |
| Module IA : conseils profil | ✅ | ❌ | ❌ | ❌ |

---

## 6. Couche IA — Architecture avec abstraction (Ollama + Fallback)

### 6.1 Pattern : Strategy via Interface Spring
```
                    ┌───────────────────────────┐
                    │   AIController (REST)     │
                    └────────────┬──────────────┘
                                 │ utilise
                    ┌────────────▼──────────────┐
                    │      AIService            │  orchestration, fallback timeout 5s
                    └────────────┬──────────────┘
                                 │ @Qualifier + @Profile
          ┌──────────────────────┴────────────────────────┐
          │                                               │
┌─────────▼───────────┐                      ┌────────────▼──────────────┐
│  OllamaAIProvider   │                      │   FallbackAIProvider      │
│  (ai.provider=ollama)│                     │   (ai.provider=fallback)   │
│  HTTP POST :11434   │                      │   stub réponses prédéfinies│
│  model llama3:8b    │                      │   + flag serviceStatus=    │
│  timeout 5s WebFlux │                      │   "degraded"               │
└─────────────────────┘                      └────────────────────────────┘
```

### 6.2 Contrat `AIProvider`
```java
public interface AIProvider {
    AIResponse analyzeCv(byte[] cvBytes, String fileName);
    AIResponse generateMotivationLetterSuggestions(CandidateProfile profile, Offer offer);
    AIResponse getProfileAdvice(CandidateProfile profile);
    boolean isAvailable();  // healthcheck → FallbackAIProvider: false
}
```

### 6.3 Format de réponse standard (mode dégradé possible)
```json
{
  "serviceStatus": "available" | "degraded",
  "durationMs": 2184,
  "competences": ["TypeScript", "Angular", "RxJS"],
  "pointsForts": ["Bonnes expériences longues (>2a)", "Projets full stack"],
  "suggestions": ["Ajouter 3 compétences Cloud (AWS, Docker)", "Réduire CV à 1 page"],
  "rawText": null,
  "errorMessage": null
}
```
**Règle** : Jamais de 5xx sur `/ai/**`. Si Ollama timeout/down → Fallback 200 + `serviceStatus:"degraded"`.

---

## 7. Frontend Public — React + Vite + Tailwind (arborescence)

### 7.1 Structure du projet `frontend-public/`
```
frontend-public/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/                    # Couche API + Axios
│   │   ├── client.ts           # Axios instance + interceptors JWT/refresh
│   │   ├── auth.api.ts         # register/login/refresh/me
│   │   ├── candidate.api.ts    # profil, CV, offres, candidatures
│   │   ├── company.api.ts      # profil entreprise, offres
│   │   ├── verification.api.ts # pièces, statut
│   │   └── ai.api.ts           # analyze CV, conseils, suggestions lettre
│   ├── components/             # Composants réutilisables
│   │   ├── layout/
│   │   │   ├── NavbarPublic.tsx     # Logo + Connexion/Inscription
│   │   │   ├── NavbarAuth.tsx       # Tableau de bord, onglets, menu user
│   │   │   ├── Footer.tsx
│   │   │   └── ProtectedRoute.tsx   # Guard : redirect login sans token
│   │   ├── forms/
│   │   │   ├── PasswordStrength.tsx # barre 4 couleurs + règles
│   │   │   ├── FileDropZone.tsx     # drag-drop CV / pièces
│   │   │   ├── CompetenceChips.tsx  # input tags
│   │   │   └── FormField.tsx        # label + input + error inline
│   │   ├── offer/
│   │   │   ├── OfferCard.tsx        # grille cards + matching score badge
│   │   │   ├── OfferFilters.tsx     # barre filtres multi
│   │   │   └── MatchingBadge.tsx    # vert ≥70, orange 50-70, rouge <50
│   │   ├── application/
│   │   │   ├── ApplicationCard.tsx  # statut badge
│   │   │   └── TimelineSteps.tsx    # 8 étapes verticales
│   │   └── ui/                      # atom Tailwind (Button, Badge, Card, Toast)
│   ├── context/
│   │   └── AuthContext.tsx          # user, tokens, login, logout (Provider)
│   ├── pages/                       # Pages routées par React Router
│   │   ├── public/
│   │   │   ├── LandingPage.tsx      # HERO + Features + Stats + Témoignages + FAQ + CTA
│   │   │   ├── RegisterPage.tsx     # onglets Candidat / Entreprise + validation
│   │   │   └── LoginPage.tsx
│   │   ├── candidate/
│   │   │   ├── DashboardCandidat.tsx   # sommaire (nb candidatures, vérif, conseils)
│   │   │   ├── ProfilePage.tsx         # tabs infos/compétences/parcours/formation/CV
│   │   │   ├── OffersPage.tsx          # recherche + filtres + grille
│   │   │   ├── OfferDetailPage.tsx     # détail + lettre motivation + bouton postuler
│   │   │   ├── MyApplicationsPage.tsx  # liste + timeline par clic
│   │   │   └── VerificationPage.tsx    # pièces upload + statut vérif
│   │   ├── company/
│   │   │   ├── DashboardEntreprise.tsx
│   │   │   ├── CompanyProfilePage.tsx
│   │   │   ├── MyOffersPage.tsx           # CRUD offres
│   │   │   ├── OfferEditorPage.tsx
│   │   │   └── OfferApplicationsPage.tsx  # candidatures reçues (≥TRANSMIS)
│   │   └── 404Page.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useFetch.ts
│   │   └── useDebounce.ts
│   ├── types/                      # Types TypeScript
│   │   ├── auth.types.ts
│   │   ├── candidate.types.ts
│   │   ├── offer.types.ts
│   │   ├── application.types.ts
│   │   └── verification.types.ts
│   ├── utils/
│   │   ├── role.utils.ts
│   │   ├── date.utils.ts
│   │   └── matching-color.utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                    # Tailwind directives + fonts Inter
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js               # palette RH moderne
├── postcss.config.js
├── tsconfig.json
└── README.md
```

### 7.2 Design System — Palette Tailwind
```js
// tailwind.config.js
{
  theme: {
    extend: {
      colors: {
        primary:   { 50:'#eff6ff', 500:'#3b82f6', 700:'#1d4ed8', 900:'#1e3a8a' }, // bleu profond RH
        accent:    { 50:'#fff7ed', 500:'#f97316', 600:'#ea580c' },                 // orange action
        secondary: { 50:'#f5f3ff', 500:'#8b5cf6', 700:'#7c3aed' },                 // violet premium
        success:   { 500:'#10b981', 600:'#059669' },  // vert validé
        warning:   { 500:'#f59e0b' },                 // orange en attente
        danger:    { 500:'#dc2626' },                 // rouge rejeté
        neutral:   { 50:'#f8fafc', 200:'#e2e8f0', 800:'#1e293b', 900:'#0f172a' } // bleu-gris texte
      },
      fontFamily: { sans: ['Inter','ui-sans-serif','system-ui'] }
    }
  }
}
```

### 7.3 Routes (React Router v6)
| Path | Page | Guard |
|---|---|---|
| `/` | LandingPage | - |
| `/auth/register` | RegisterPage | Guest only |
| `/auth/login` | LoginPage | Guest only |
| `/candidate/dashboard` | DashboardCandidat | +role=CANDIDATE |
| `/candidate/profile` | ProfilePage | +role=CANDIDATE |
| `/offers` | OffersPage | AUTH (tous) |
| `/offers/:id` | OfferDetailPage | AUTH |
| `/candidate/applications` | MyApplicationsPage | +role=CANDIDATE |
| `/candidate/verification` | VerificationPage | +role=CANDIDATE |
| `/company/dashboard` | DashboardEntreprise | +role=COMPANY |
| `/company/profile` | CompanyProfilePage | +role=COMPANY |
| `/company/offers` | MyOffersPage | +role=COMPANY |
| `/company/offers/new` | OfferEditorPage | +role=COMPANY |
| `/company/offers/:id/applications` | OfferApplicationsPage | +role=COMPANY owner |
| `*` | 404Page | - |

---

## 8. Back-office Admin — Angular 17 + Angular Material (arborescence)

### 8.1 Structure du projet `backoffice-admin/`
```
backoffice-admin/
├── src/
│   ├── app/
│   │   ├── core/                              # Services + Interceptors + Guards
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   ├── offers.service.ts
│   │   │   │   ├── applications.service.ts
│   │   │   │   ├── verifications.service.ts
│   │   │   │   └── stats.service.ts
│   │   │   ├── interceptors/
│   │   │   │   └── jwt.interceptor.ts         # +Authorization header + 401 → refresh
│   │   │   └── guards/
│   │   │       ├── auth.guard.ts              # token valide
│   │   │       └── role.guard.ts              # hasRole(ADMIN|RECRUITER)
│   │   ├── layout/
│   │   │   ├── admin-layout.component.*       # sidenav + toolbar
│   │   │   └── login-layout.component.*
│   │   ├── pages/
│   │   │   ├── login/
│   │   │   │   └── login.component.*          # reactive forms email/mdp
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.*      # 6 KPI cards
│   │   │   │   ├── kpi-card.component.*
│   │   │   │   ├── roles-chart.component.*    # doughnut (ng2-charts)
│   │   │   │   ├── apps-bar-chart.component.* # barres 30j
│   │   │   │   └── signups-line-chart.component.* # courbe 12 mois
│   │   │   ├── users/
│   │   │   │   ├── users-list.component.*     # mat-table paginator+sort+filter
│   │   │   │   └── user-edit-dialog.component.* # mat-dialog change roles/suspend
│   │   │   ├── offers/
│   │   │   │   ├── offers-list.component.*    # mat-table + statut filter
│   │   │   │   └── offer-edit.component.*
│   │   │   ├── applications/
│   │   │   │   ├── applications-list.component.*
│   │   │   │   └── application-detail-modal.component.*
│   │   │   └── verifications/
│   │   │       ├── verifications-pending.component.* # file d'attente EN_ATTENTE
│   │   │       └── verify-dialog.component.*  # Valider/Rejeter + motif
│   │   ├── shared/
│   │   │   ├── pipes/
│   │   │   │   ├── status-color.pipe.ts       # ApplicationStatus → couleur Material
│   │   │   │   ├── matching-score.pipe.ts
│   │   │   │   └── date-fr.pipe.ts
│   │   │   └── components/
│   │   │       ├── status-badge.component.*
│   │   │       └── confirm-dialog.component.*
│   │   ├── models/                            # interfaces TS
│   │   │   ├── user.model.ts
│   │   │   ├── offer.model.ts
│   │   │   ├── application.model.ts
│   │   │   └── verification.model.ts
│   │   ├── environments/
│   │   │   ├── environment.ts                  # apiUrl: http://localhost:8080/api
│   │   │   └── environment.prod.ts
│   │   ├── app.routes.ts
│   │   ├── app.config.ts                       # providers Material, Chart, HttpClient
│   │   └── app.component.ts
│   ├── assets/
│   ├── index.html
│   ├── main.ts
│   └── styles.scss                             # Material theme custom primary/accent/warn
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

### 8.2 Routes Angular (standalone components)
| Path (préfixe `/admin`) | Component | Guard |
|---|---|---|
| `/login` | LoginComponent | - |
| `/dashboard` | DashboardComponent | auth + role(ADMIN\|RECRUITER) |
| `/users` | UsersListComponent | auth + role(ADMIN) |
| `/offers` | OffersListComponent | auth + role(ADMIN\|RECRUITER) |
| `/applications` | ApplicationsListComponent | auth + role(ADMIN\|RECRUITER) |
| `/verifications` | VerificationsPendingComponent | auth + role(ADMIN\|RECRUITER) |
| `**` | redirect `/admin/dashboard` | |

### 8.3 Thème Material palette
```scss
$rhconnect-primary: mat.define-palette(mat.$blue-palette, 900);   // #1e3a8a
$rhconnect-accent:  mat.define-palette(mat.$orange-palette, 500); // #f97316
$rhconnect-warn:    mat.define-palette(mat.$red-palette, 600);    // #dc2626
```

---

## 9. Observations sur l'existant & Écarts à combler (Backlog)

### 9.1 Backend Spring Boot — Ce qui est DÉJÀ codé ✅
- Tous les modèles (collections + enums + sous-documents) + index `email:unique`
- Tous les Repositories Spring Data
- `SecurityConfig` : whitelist, BCrypt 12, `@EnableMethodSecurity`
- `JwtService` + `JwtAuthFilter` fonctionnels (compilation OK)
- Controllers : Auth, Candidate, Offer, Application, Verification, Public → compilent
- Services : Auth, Candidate, Offer, Application, Verification, Matching, FileStorage, RefreshToken, CurrentUser
- `MatchingService` : 4 critères pondérés (40/30/10/20) + dossier complet
- `AIProvider` interface + `OllamaAIProvider` WebFlux (stub)
- `DatabaseSeeder` composant présent
- DTOs Request/Response tous annotés `@Valid`
- `GlobalExceptionHandler` + exceptions custom `BusinessException`, `EntityNotFoundException`
- Configs : `WebConfig` CORS, `OpenApiConfig` Swagger
- `application.properties` : variables ENV + profiles + defaults raisonnables

### 9.2 Backend — Ce qui est MANQUANT ⚠️ (à coder)
| # | Élément | Issue |
|---|---|---|
| B1 | **CompanyController + CompanyService** | Gestion profil entreprise (GET/PUT `/companies/me`, logo upload) |
| B2 | **AIController + AIService** | Endpoints `/api/ai/analyze-cv`, `/suggestions-lettre`, `/conseils` + orchestration fallback 5s |
| B3 | **StatsController + StatsService** | KPIs dashboard admin (3 endpoints `/admin/stats/*`) |
| B4 | **RefreshTokenRepository TTL index** : `expiresAt` (MongoDB index expireAfter) + révocation |
| B5 | **`CurrentUserService.getCurrentUserId()`** : doit récupérer depuis `SecurityContextHolder` (vérifier l'impl) |
| B6 | **Validation mot de passe côté serveur** : `RegisterRequest` → regex complexité (min 8, maj, chiffre, spécial) |
| B7 | **Swagger annotations** : schéma auth Bearer sur endpoints protégés, tags groupés |
| B8 | **Tests unitaires** src/test/java (aucun actuellement) |

### 9.3 Frontend — Rien de démarré
- **frontend-public/** : dossier vide → créer from scratch (Task 11-14)
- **backoffice-admin/** : dossier vide → créer from scratch (Task 15-17)

### 9.4 Documentation
- docs/ : vide → `architecture.md` (ce fichier) + autres à venir

---

## 10. Hypothèses & Choix techniques (confirmés ou proposés)
| Sujet | Décision | Statut |
|---|---|---|
| Java / Spring Boot | Java 17, Spring Boot 3.2.5, Maven | ✅ confirmé (pom.xml) |
| Base | MongoDB 6+ via Spring Data MongoDB, GridFS pour fichiers | ✅ confirmé |
| JWT | HMAC-SHA256, access 15min, refresh 7j, rotation | ✅ confirmé |
| Roles à l'inscription | CANDIDATE \| COMPANY seulement (ADMIN/RECRUITER en base) | ✅ confirmé (code) |
| Types de contrat | CDI, CDD, STAGE, ALTERNANCE, FREELANCE, INTERIM (6) | ✅ confirmé enum |
| Niveaux expérience | JUNIOR(0-2a), MID(2-5a), SENIOR(5-10a), EXPERT(10a+) | ✅ confirmé enum |
| Matching seuil | 50/100 minimum pour postuler | ✅ confirmé MatchingService |
| Statuts candidature | 8 : POSTULE→RECU→EN_VERIFICATION→VERIFIE→TRANSMIS→ENTRETIEN→ACCEPTE/REFUSE | ✅ confirmé enum |
| Vérification pièces | PDF, JPG, PNG, max 10Mo (config spring.servlet.multipart) | ✅ 10Mo confirmé |
| Upload fichiers | GridFS MongoDB (via FileStorageService) | ✅ en cours |
| IA provider | Ollama (http://localhost:11434) + Fallback (stubs) par profile Spring | ✅ interface écrite |
| Notifications email | Simulées par logs / console en V1 | ✅ hypothèse |
| Front React | Vite + TypeScript + Tailwind + Axios + React Router v6 + react-hook-form | Proposé |
| Front Admin | Angular 17 standalone + Angular Material + ng2-charts | Proposé |
| Responsive | Mobile-first : Tailwind breakpoints + Material responsive | Proposé |
| Hébergement fichiers statiques | Build servis par Spring (V2) ou Nginx | Proposé V2 |

---

## 11. Prochaines étapes recommandées (après approbation architecture)
Ordre séquentiel suivant le `tasks.md` existant :
1. **Finaliser backend** — corriger points B1→B8 (CompanyController, AI, Stats, validations)
2. **Démarrer frontend-public React** — Vite + Tailwind + routing + pages auth
3. **Démarrer backoffice Angular** — CLI 17 + Material + layout sidenav
4. **Intégrer IA UI** — boutons dans profils et offres
5. **E2E manuel** — scénario complet inscription→candidature→embauche
6. **Documentation READMEs + seeds finalisés**
