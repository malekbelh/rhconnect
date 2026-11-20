export enum Role {
  CANDIDATE = 'CANDIDATE',
  COMPANY = 'COMPANY',
  ADMIN = 'ADMIN',
  RECRUITER = 'RECRUITER',
}

export enum ApplicationStatus {
  POSTULE = 'POSTULE',
  RECU = 'RECU',
  EN_VERIFICATION = 'EN_VERIFICATION',
  VERIFIE = 'VERIFIE',
  TRANSMIS = 'TRANSMIS',
  ENTRETIEN = 'ENTRETIEN',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
}

export enum OfferStatus {
  DRAFT = 'DRAFT',
  PENDING_MODERATION = 'PENDING_MODERATION',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  UNPUBLISHED = 'UNPUBLISHED',
  CLOSED = 'CLOSED',
}

export enum TypeContrat {
  CDI = 'CDI',
  CDD = 'CDD',
  STAGE = 'STAGE',
  SIVP = 'SIVP',
  ALTERNANCE = 'ALTERNANCE',
  INTERIM = 'INTERIM',
  FREELANCE = 'FREELANCE',
}

export enum NiveauExperience {
  DEBUTANT = 'DEBUTANT',
  JUNIOR = 'JUNIOR',
  INTERMEDIAIRE = 'INTERMEDIAIRE',
  SENIOR = 'SENIOR',
  EXPERT = 'EXPERT',
}

export enum VerificationStatus {
  NON_VERIFIE = 'NON_VERIFIE',
  EN_COURS = 'EN_COURS',
  VERIFIE = 'VERIFIE',
  REJETE = 'REJETE',
}

export enum TypePieceVerification {
  IDENTITE = 'IDENTITE',
  DIPLOME = 'DIPLOME',
  ATTESTATION = 'ATTESTATION',
  AUTRE = 'AUTRE',
}

export interface Experience {
  id?: string;
  titre: string;
  entreprise: string;
  dateDebut: string;
  dateFin?: string;
  description?: string;
}

export interface Formation {
  id?: string;
  diplome: string;
  ecole: string;
  annee: string;
}

export interface SearchPreferences {
  typeContrat?: TypeContrat[];
  secteur?: string;
  localisation?: string;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  bio?: string;
  linkedin?: string;
  portfolio?: string;
  searchPreferences?: SearchPreferences;
  competences: string[];
  parcours: Experience[];
  formations: Formation[];
  cvFileName?: string;
  cvFileUrl?: string;
  photoFileId?: string;
  photoFileName?: string;
  photoFileUrl?: string;
  matchingScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfile {
  id: string;
  userId: string;
  companyName: string;
  siret?: string;
  sector?: string;
  size?: string;
  description?: string;
  address?: string;
  website?: string;
  logoUrl?: string;
  logoFileId?: string;
  logoFileName?: string;
  logoBase64Data?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  companyId: string;
  companyName?: string;
  companyLogoUrl?: string;
  companySector?: string;
  companyDescription?: string;
  companyAddress?: string;
  companyLogoFileId?: string;
  companyWebsite?: string;
  title: string;
  description: string;
  competencesRequises: string[];
  niveauExperience: NiveauExperience;
  typeContrat: TypeContrat;
  localisation: string;
  salaireMin?: number;
  salaireMax?: number;
  dateExpiration?: string;
  statut: OfferStatus;
  moderationComment?: string;
  matchingScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OfferFiltersParams {
  keyword?: string;
  typeContrat?: string[];
  niveauExperience?: NiveauExperience;
  localisation?: string;
  page?: number;
  limit?: number;
}

export interface Application {
  id: string;
  offerId: string;
  candidateId: string;
  offerTitle?: string;
  companyName?: string;
  candidateFirstName?: string;
  candidateLastName?: string;
  lettreMotivation?: string;
  status: ApplicationStatus;
  matchingScore?: number;
  dateSoumission: string;
}

export interface ApplicationTimelineEntry {
  status: ApplicationStatus;
  date: string;
  commentaire?: string;
}

export interface VerificationDoc {
  id: string;
  type: TypePieceVerification;
  nomFichier: string;
  fileUrl: string;
  status: VerificationStatus;
  commentaire?: string;
  uploadedAt: string;
}

export interface Verification {
  id: string;
  candidateId: string;
  statusGlobal: VerificationStatus;
  pieces: VerificationDoc[];
  createdAt: string;
  updatedAt: string;
}

export interface AIConseilsProfil {
  conseils: string[];
  scoreAmelioration: number;
}

export interface AISuggestionLettre {
  contenu: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
