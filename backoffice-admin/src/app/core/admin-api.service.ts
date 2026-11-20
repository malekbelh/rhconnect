import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  users: number;
  candidates: number;
  companies: number;
  offers: number;
  applications: number;
  tauxConversion: number;
  tauxAcceptation?: number;
  candidaturesParStatut: Record<string, number>;
  verificationsCount?: number;
  verificationsPending?: number;
  delaiMoyenRecrutementJours?: number;
  topOffers?: Array<{ offerId: string; titre: string; companyId: string; candidatureCount: number; typeContrat?: string }>;
  tendancesInscriptions?: Array<{ month: string; count: number }>;
  tendancesCandidatures?: Array<{ month: string; count: number }>;
}

export interface SystemSettings {
  id?: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  maintenancePlannedUntil?: string;
  maxFileSizeMb: number;
  allowedExtensions: string[];
  notifyOnNewUser: boolean;
  notifyOnNewApplication: boolean;
  notifyOnDisputeOpened: boolean;
  notifyOnVerificationRequest: boolean;
  adminNotificationEmail?: string;
  jobCategories: string[];
  skillsReferential: string[];
  customContractTypes: string[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface AiUsageLog {
  id: string;
  feature: string;
  modelUsed?: string;
  userId?: string;
  entityId?: string;
  entityType?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
  success: boolean;
  errorMessage?: string;
  feedbackScore?: number;
  feedbackComment?: string;
  feedbackAt?: string;
  createdAt: string;
}

export interface TrendPoint {
  date?: string;
  month?: string;
  count: number;
}

export interface AdminUser {
  id: string;
  email: string;
  roles: string[];
  enabled: boolean;
  verified: boolean;
  createdAt?: string;
  lastLogin?: string;
  companyProfile?: Record<string, unknown>;
  candidateProfile?: Record<string, unknown>;
  sessions?: Array<{ id: string; createdAt: string; expiresAt: string; revoked: boolean }>;
}

export interface AdminOffer {
  id: string;
  title: string;
  companyId: string;
  localisation: string;
  typeContrat: string;
  niveauExperience: string;
  statut: string;
  description?: string;
  salaireMin?: number;
  salaireMax?: number;
  competencesRequises?: string[] | string;
  createdAt?: string;
  updatedAt?: string;
  datePublication?: string;
  dateExpiration?: string;
  companyName?: string;
  companySector?: string;
  companyDescription?: string;
  companyAddress?: string;
  companyLogoFileId?: string;
  companyWebsite?: string;
  moderationNote?: string;
  moderationMotif?: string;
  moderatorId?: string;
  moderatorEmail?: string;
  moderatorName?: string;
  moderationComment?: string;
  moderatedAt?: string;
  candidatureCount?: number;
  viewCount?: number;
  stats?: { viewCount?: number; applyCount?: number };
  moderationHistory?: Array<{
    action: string;
    moderatorId: string;
    comment?: string;
    timestamp?: string;
  }>;
}

export interface AdminApplication {
  id: string;
  candidateId: string;
  offerId: string;
  companyId: string;
  statut: string;
  matchingScore?: number;
  lettreMotivation?: string;
  candidatName?: string;
  candidateEmail?: string;
  offerTitle?: string;
  companyName?: string;
  createdAt?: string;
  updatedAt?: string;
  adminNotes?: Array<{ id: string; content: string; authorEmail: string; createdAt: string }>;
  disputeOpen?: boolean;
  disputeMotif?: string;
  disputeOpenedAt?: string;
  disputeResolvedAt?: string;
  dossierIncomplet?: boolean;
  dossierIncompletMotif?: string;
}

export interface AdminVerificationDoc {
  id: string;
  nomFichier: string;
  type?: string;
  uploadedAt?: string;
}

export interface AdminVerification {
  id: string;
  candidateId: string;
  candidatName?: string;
  candidatEmail?: string;
  profileType?: string; // "COMPANY" or "CANDIDATE"
  siret?: string;
  industry?: string;
  size?: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  pieces: AdminVerificationDoc[];
  statut: string; // ATTENTE, VALIDE, REJETE
  commentaire?: string;
  validatorId?: string;
  validatedAt?: string;
  assignedToEmail?: string;
  checklist?: Record<string, boolean>;
  lockedByEmail?: string;
  lockedAt?: string;
  createdAt?: string;
  isLocked?: boolean;
  lockRemainingSeconds?: number;
}

export interface AdminCompanyVerification {
  id: string;
  companyId: string;
  companyName?: string;
  companyEmail?: string;
  siret?: string;
  kbisNumber?: string;
  pieces: AdminVerificationDoc[];
  statut: string; // ATTENTE, VALIDE, REJETE
  commentaire?: string;
  validatorId?: string;
  validatedAt?: string;
  assignedToEmail?: string;
  checklist?: Record<string, boolean>;
  lockedByEmail?: string;
  lockedAt?: string;
  createdAt?: string;
  isLocked?: boolean;
  lockRemainingSeconds?: number;
}

export interface ImpersonateResponse {
  accessToken: string;
  originalAccessToken: string;
  originalRefreshToken: string;
  impersonatedUser: AdminUser;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api';

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/admin/stats/dashboard`);
  }

  getRolesDistribution(): Observable<Array<{ role: string; count: number }>> {
    return this.http.get<Array<{ role: string; count: number }>>(`${this.baseUrl}/admin/stats/roles-distribution`);
  }

  getApplicationsByDay(days = 30): Observable<TrendPoint[]> {
    return this.http.get<TrendPoint[]>(`${this.baseUrl}/admin/stats/applications-by-day?days=${days}`);
  }

  getSignupsByMonth(months = 12): Observable<TrendPoint[]> {
    return this.http.get<TrendPoint[]>(`${this.baseUrl}/admin/stats/signups-by-month?months=${months}`);
  }

  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/auth/admin/users?size=50`);
  }

  getUser(userId: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.baseUrl}/auth/admin/users/${userId}`);
  }

  toggleUserStatus(userId: string): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.baseUrl}/auth/admin/users/${userId}/toggle-status`, {});
  }

  toggleUserVerification(userId: string): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.baseUrl}/auth/admin/users/${userId}/toggle-verification`, {});
  }

  updateUserRole(userId: string, role: string): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.baseUrl}/auth/admin/users/${userId}/role`, { role });
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/auth/admin/users/${userId}`);
  }

  resetUserPassword(userId: string, newPassword: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/auth/admin/users/${userId}/reset-password`, { newPassword });
  }

  impersonateUser(userId: string): Observable<ImpersonateResponse> {
    return this.http.post<ImpersonateResponse>(`${this.baseUrl}/auth/admin/users/${userId}/impersonate`, {});
  }

  getUserSessions(userId: string): Observable<Array<{ id: string; createdAt: string; expiresAt: string; revoked: boolean; ip?: string }>> {
    return this.http.get<Array<{ id: string; createdAt: string; expiresAt: string; revoked: boolean; ip?: string }>>(
      `${this.baseUrl}/auth/admin/users/${userId}/sessions`
    );
  }

  getOffers(params?: { statut?: string; keyword?: string }): Observable<AdminOffer[]> {
    const qs = new URLSearchParams();
    if (params?.statut) qs.set('statut', params.statut);
    if (params?.keyword) qs.set('keyword', params.keyword);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return this.http.get<AdminOffer[]>(`${this.baseUrl}/offers/admin/all${suffix}`);
  }

  getOffer(offerId: string): Observable<AdminOffer> {
    return this.http.get<AdminOffer>(`${this.baseUrl}/offers/${offerId}`);
  }

  getOfferStats(): Observable<{
    total: number;
    pending: number;
    active: number;
    rejected: number;
    draft: number;
    expired: number;
    unpublished: number;
  }> {
    return this.http.get<{
      total: number;
      pending: number;
      active: number;
      rejected: number;
      draft: number;
      expired: number;
      unpublished: number;
    }>(`${this.baseUrl}/offers/admin/stats`);
  }

  moderateOffer(offerId: string, action: 'APPROVE' | 'REJECT' | 'REQUEST_EDIT', comment?: string): Observable<AdminOffer> {
    return this.http.patch<AdminOffer>(`${this.baseUrl}/offers/admin/${offerId}/moderate`, { action, comment });
  }

  updateOfferAdmin(offerId: string, body: { statut?: string; moderationMotif?: string; title?: string }): Observable<AdminOffer> {
    return this.http.patch<AdminOffer>(`${this.baseUrl}/offers/admin/${offerId}`, body);
  }

  duplicateOffer(offerId: string): Observable<AdminOffer> {
    return this.http.post<AdminOffer>(`${this.baseUrl}/offers/admin/${offerId}/duplicate`, {});
  }

  getApplications(): Observable<AdminApplication[]> {
    return this.http.get<AdminApplication[]>(`${this.baseUrl}/applications/admin/all`);
  }

  getApplication(applicationId: string): Observable<AdminApplication> {
    return this.http.get<AdminApplication>(`${this.baseUrl}/applications/${applicationId}`);
  }

  getApplicationTimeline(applicationId: string): Observable<Array<{ statut: string; date: string; acteur?: string; commentaire?: string }>> {
    return this.http.get<Array<{ statut: string; date: string; acteur?: string; commentaire?: string }>>(
      `${this.baseUrl}/applications/${applicationId}/timeline`
    );
  }

  forceApplicationStatus(applicationId: string, statut: string, motif: string): Observable<AdminApplication> {
    return this.http.patch<AdminApplication>(`${this.baseUrl}/applications/admin/${applicationId}/force-status`, { statut, motif });
  }

  addApplicationNote(applicationId: string, content: string): Observable<{ id: string; content: string; authorEmail: string; createdAt: string }> {
    return this.http.post<{ id: string; content: string; authorEmail: string; createdAt: string }>(
      `${this.baseUrl}/applications/admin/${applicationId}/notes`,
      { content }
    );
  }

  openDispute(applicationId: string, motif: string): Observable<AdminApplication> {
    return this.http.post<AdminApplication>(`${this.baseUrl}/applications/admin/${applicationId}/dispute`, { motif });
  }

  resolveDispute(applicationId: string, comment?: string): Observable<AdminApplication> {
    return this.http.post<AdminApplication>(`${this.baseUrl}/applications/admin/${applicationId}/dispute/resolve`, { comment });
  }

  toggleDossierIncomplet(applicationId: string, incomplet: boolean, motif?: string): Observable<AdminApplication> {
    return this.http.patch<AdminApplication>(`${this.baseUrl}/applications/admin/${applicationId}/incomplete`, { incomplet, motif });
  }

  downloadCandidateCv(candidateId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/candidates/${candidateId}/cv`, { responseType: 'blob' });
  }

  downloadCandidatePhoto(candidateId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/candidates/${candidateId}/photo`, { responseType: 'blob' });
  }

  getAllVerifications(status?: string): Observable<AdminVerification[]> {
    const params = status && status !== 'ALL' ? `?status=${status}` : '';
    return this.http.get<AdminVerification[]>(`${this.baseUrl}/verifications${params}`);
  }

  getPendingVerifications(): Observable<AdminVerification[]> {
    return this.http.get<AdminVerification[]>(`${this.baseUrl}/verifications/pending`);
  }

  getPendingCompanyVerifications(): Observable<AdminCompanyVerification[]> {
    return this.http.get<AdminCompanyVerification[]>(`${this.baseUrl}/verifications/pending/companies`);
  }

  getVerification(id: string): Observable<AdminVerification> {
    return this.http.get<AdminVerification>(`${this.baseUrl}/verifications/${id}`);
  }

  validateVerification(id: string, statut: 'VALIDE' | 'REJETE', commentaire?: string, assignedToEmail?: string): Observable<AdminVerification> {
    return this.http.patch<AdminVerification>(
      `${this.baseUrl}/verifications/${id}/validate`,
      { 
        statut, 
        commentaire: commentaire || (statut === 'VALIDE' ? 'Dossier validé par admin' : 'Rejeté'),
        assignedToEmail: assignedToEmail || null
      }
    );
  }

  validateCompanyVerification(id: string, statut: 'VALIDE' | 'REJETE', commentaire?: string, assignedToEmail?: string): Observable<AdminCompanyVerification> {
    return this.http.patch<AdminCompanyVerification>(
      `${this.baseUrl}/verifications/companies/${id}/validate`,
      { 
        statut, 
        commentaire: commentaire || (statut === 'VALIDE' ? 'Vérification validée' : 'Rejetée'),
        assignedToEmail: assignedToEmail || null
      }
    );
  }

  lockVerification(id: string): Observable<AdminVerification> {
    return this.http.post<AdminVerification>(`${this.baseUrl}/verifications/${id}/lock`, {});
  }

  unlockVerification(id: string): Observable<AdminVerification> {
    return this.http.post<AdminVerification>(`${this.baseUrl}/verifications/${id}/unlock`, {});
  }

  assignVerification(id: string, assignedToEmail: string): Observable<AdminVerification> {
    return this.http.post<AdminVerification>(`${this.baseUrl}/verifications/${id}/assign`, { assignedToEmail });
  }

  updateVerificationChecklist(id: string, checklist: Record<string, boolean>): Observable<AdminVerification> {
    return this.http.patch<AdminVerification>(`${this.baseUrl}/verifications/${id}/checklist`, checklist);
  }

  downloadVerificationPiece(verificationId: string, pieceId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/verifications/${verificationId}/download/${pieceId}`, { responseType: 'blob' });
  }

  downloadCompanyVerificationPiece(verificationId: string, pieceId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/verifications/companies/${verificationId}/download/${pieceId}`, { responseType: 'blob' });
  }

  // ── System Settings ──────────────────────────────────────────────────────────

  getSystemSettings(): Observable<SystemSettings> {
    return this.http.get<SystemSettings>(`${this.baseUrl}/admin/settings`);
  }

  patchSystemSettings(patches: Partial<SystemSettings>): Observable<SystemSettings> {
    return this.http.patch<SystemSettings>(`${this.baseUrl}/admin/settings`, patches);
  }

  getReferentiels(): Observable<Record<string, string[]>> {
    return this.http.get<Record<string, string[]>>(`${this.baseUrl}/admin/settings/referentiels`);
  }

  addToReferential(referential: string, value: string): Observable<SystemSettings> {
    return this.http.post<SystemSettings>(`${this.baseUrl}/admin/settings/referentiels/${referential}`, { value });
  }

  removeFromReferential(referential: string, value: string): Observable<SystemSettings> {
    return this.http.delete<SystemSettings>(`${this.baseUrl}/admin/settings/referentiels/${referential}`, { body: { value } });
  }

  // ── Stats cross-filtered ─────────────────────────────────────────────────────

  getCrossFilteredStats(params: { startDate?: string; endDate?: string; contractType?: string; status?: string }): Observable<Record<string, unknown>> {
    const qs = new URLSearchParams();
    if (params.startDate) qs.set('startDate', params.startDate);
    if (params.endDate) qs.set('endDate', params.endDate);
    if (params.contractType) qs.set('contractType', params.contractType);
    if (params.status) qs.set('status', params.status);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return this.http.get<Record<string, unknown>>(`${this.baseUrl}/admin/stats/cross-filtered${suffix}`);
  }
}

