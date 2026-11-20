import client from './client';
import type {
  CandidateProfile,
  Offer,
  OfferFiltersParams,
  Application,
  ApplicationTimelineEntry,
  Verification,
  AIConseilsProfil,
  AISuggestionLettre,
  PaginatedResponse,
} from '../types';

export const getProfile = async (): Promise<CandidateProfile> => {
  const response = await client.get<any>('/candidates/me');
  const d = response.data || {};
  return {
    id: d.id || '',
    userId: d.userId || '',
    firstName: d.firstName || '',
    lastName: d.lastName || '',
    phone: d.phone || '',
    address: d.address || '',
    bio: d.bio || '',
    linkedin: d.linkedin || '',
    portfolio: d.portfolio || '',
    searchPreferences: d.searchPreferences || { typeContrat: [], secteur: '', localisation: '' },
    competences: d.competences || [],
    formations: (d.formation || d.formations || []).map((f: any) => ({
      id: f.id,
      diplome: f.diplome || f.diploma || '',
      ecole: f.ecole || f.school || '',
      annee: f.annee || (f.year ? String(f.year) : ''),
    })),
    parcours: (d.parcours || []).map((e: any) => ({
      id: e.id,
      titre: e.titre || e.title || '',
      entreprise: e.entreprise || e.company || '',
      dateDebut: e.dateDebut || (e.startDate ? String(e.startDate) : ''),
      dateFin: e.dateFin || (e.endDate ? String(e.endDate) : ''),
      description: e.description || '',
    })),
    cvFileName: d.cvFileName || '',
    cvFileUrl: d.cvFileId ? 'http://localhost:8080/api/candidates/me/cv' : '',
    photoFileId: d.photoFileId || '',
    photoFileName: d.photoFileName || '',
    photoFileUrl: d.photoFileId ? 'http://localhost:8080/api/candidates/me/photo' : '',
    createdAt: d.createdAt || '',
    updatedAt: d.updatedAt || '',
  };
};

export const updateProfile = async (data: Partial<CandidateProfile>): Promise<CandidateProfile> => {
  const payload: any = {
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    address: data.address,
    bio: data.bio,
    linkedin: data.linkedin,
    portfolio: data.portfolio,
    searchPreferences: data.searchPreferences,
    competences: data.competences,
    formation: (data.formations || (data as any).formation || []).map((f: any) => ({
      diploma: f.diplome || f.diploma || '',
      school: f.ecole || f.school || '',
      year: f.annee ? parseInt(String(f.annee), 10) : (f.year ?? null),
    })),
    parcours: (data.parcours || []).map((e: any) => ({
      title: e.titre || e.title || '',
      company: e.entreprise || e.company || '',
      startDate: e.dateDebut || e.startDate || null,
      endDate: e.dateFin || e.endDate || null,
      description: e.description || '',
    })),
    matchingTags: (data as any).matchingTags || (data.competences || []).map((c: string) => c.toLowerCase()),
  };

  await client.put<any>('/candidates/me', payload);
  return getProfile();
};

export const uploadCV = async (file: File): Promise<{ fileName: string; fileUrl: string }> => {
  const formData = new FormData();
  formData.append('cv', file);
  const response = await client.post<any>('/candidates/me/cv', formData);
  return {
    fileName: response.data.cvFileName || file.name,
    fileUrl: 'http://localhost:8080/api/candidates/me/cv',
  };
};

export const uploadPhoto = async (file: File): Promise<{ photoFileId: string; photoFileName: string; photoFileUrl: string }> => {
  const formData = new FormData();
  formData.append('photo', file);
  const response = await client.post<any>('/candidates/me/photo', formData);
  return {
    photoFileId: response.data.photoFileId || '',
    photoFileName: response.data.photoFileName || file.name,
    photoFileUrl: response.data.photoFileId ? 'http://localhost:8080/api/candidates/me/photo' : '',
  };
};

/**
 * Télécharge/prévisualise la photo de profil du candidat connecté.
 */
export const downloadMyPhoto = async (filename?: string): Promise<void> => {
  await _downloadBlob('/candidates/me/photo', filename || 'photo.png', true);
};

/**
 * Charge la photo de profil en tant qu'URL blob authentifiée (pour balises <img>).
 * Retourne null si aucune photo n'existe.
 * IMPORTANT : Appeler URL.revokeObjectURL() sur le résultat lorsqu'il n'est plus utilisé.
 */
export const loadMyPhotoBlobUrl = async (): Promise<string | null> => {
  try {
    const response = await client.get('/candidates/me/photo', { responseType: 'blob' });
    if (!response.data || (response.data as Blob).size === 0) return null;
    return URL.createObjectURL(response.data as Blob);
  } catch {
    return null;
  }
};

export const getOffers = async (params?: OfferFiltersParams): Promise<PaginatedResponse<Offer>> => {
  const response = await client.get<any>('/offers', { params });
  const raw = response.data;
  if (Array.isArray(raw)) {
    return {
      data: raw,
      total: raw.length,
      page: 0,
      limit: raw.length,
      totalPages: 1,
    };
  }
  return {
    data: raw.content || raw.data || [],
    total: raw.totalElements ?? raw.total ?? (raw.content || []).length,
    page: raw.number ?? raw.page ?? 0,
    limit: raw.size ?? raw.limit ?? 10,
    totalPages: raw.totalPages ?? 1,
  };
};

export const getOffer = async (id: string): Promise<Offer> => {
  const response = await client.get<Offer>(`/offers/${id}`);
  return response.data;
};

export const submitApplication = async (
  offerId: string,
  lettreMotivation: string
): Promise<Application> => {
  const response = await client.post<any>('/applications', { offerId, lettreMotivation });
  const a = response.data;
  return {
    ...a,
    status: a.status || a.statut,
    dateSoumission: a.dateSoumission || a.createdAt,
  };
};

export const getMyApplications = async (): Promise<Application[]> => {
  const response = await client.get<any[]>('/applications/me');
  return (response.data || []).map((a) => ({
    ...a,
    status: a.status || a.statut,
    dateSoumission: a.dateSoumission || a.createdAt,
  }));
};

export const getApplicationTimeline = async (id: string): Promise<ApplicationTimelineEntry[]> => {
  const response = await client.get<any[]>(`/applications/${id}/timeline`);
  return (response.data || []).map((t) => ({
    status: t.status || t.statut,
    date: t.date || t.changedAt || t.createdAt,
    commentaire: t.commentaire || t.actorEmail || t.comment,
  }));
};

export const getMyVerification = async (): Promise<Verification | null> => {
  try {
    const response = await client.get<any>('/verifications/me');
    const d = response.data;
    if (!d) return null;
    return {
      id: d.id,
      candidateId: d.candidateId,
      statusGlobal: d.statusGlobal || d.statut || 'EN_ATTENTE',
      pieces: (d.pieces || []).map((p: any) => ({
        id: p.id,
        type: p.type,
        nomFichier: p.nomFichier,
        fileUrl: p.fileUrl || `http://localhost:8080/api/verifications/${d.id}/download/${p.id}`,
        status: p.status || (d.statut === 'VALIDE' ? 'VERIFIE' : 'EN_COURS'),
        commentaire: p.commentaire,
        uploadedAt: p.uploadedAt,
      })),
      createdAt: d.createdAt || '',
      updatedAt: d.updatedAt || '',
    };
  } catch {
    return null;
  }
};

export const uploadVerificationPiece = async (
  type: string,
  nomFichier: string,
  file: File
): Promise<Verification> => {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('nomFichier', nomFichier);
  formData.append('fichier', file);
  const response = await client.post<any>('/verifications/upload-piece', formData);
  const d = response.data;
  return {
    id: d.id,
    candidateId: d.candidateId,
    statusGlobal: d.statusGlobal || d.statut || 'EN_ATTENTE',
    pieces: (d.pieces || []).map((p: any) => ({
      id: p.id,
      type: p.type,
      nomFichier: p.nomFichier,
      fileUrl: p.fileUrl || `http://localhost:8080/api/verifications/${d.id}/download/${p.id}`,
      status: p.status || (d.statut === 'VALIDE' ? 'VERIFIE' : 'EN_COURS'),
      commentaire: p.commentaire,
      uploadedAt: p.uploadedAt,
    })),
    createdAt: d.createdAt || '',
    updatedAt: d.updatedAt || '',
  };
};

export const getAIConseilsProfil = async (): Promise<AIConseilsProfil> => {
  const response = await client.get<any>('/ai/conseils');
  const d = response.data;
  const conseils = d?.data?.conseils || d?.conseils || [
    "Ajoutez des mots-clés spécifiques comme 'MLOps', 'Docker' et 'Kubernetes' pour booster votre score de matching.",
    "Précisez l'impact quantifié de vos réalisations précédentes (ex: réduction de 30% de la latence).",
    "Téléversez votre dernier certificat pour compléter votre dossier de confiance."
  ];
  const score = d?.data?.scoreProfil ?? d?.scoreAmelioration ?? 18;
  return {
    conseils,
    scoreAmelioration: score,
  };
};

export const getAISuggestionsLettre = async (offerId: string): Promise<AISuggestionLettre> => {
  const response = await client.post<any>('/ai/suggestions-lettre', { offerId });
  const d = response.data;
  const content = d?.data?.lettre || d?.contenu || d?.lettre || '';
  return { contenu: content };
};

// ─── Téléchargement authentifié des fichiers ────────────────────────────────
// Utilise axios (qui injecte le JWT Bearer automatiquement) au lieu d'un
// simple <a href> qui ne transmet pas les headers d'authentification.

/** Helper interne : fetch binaire via axios → blob URL → déclenchement download/ouverture */
const _downloadBlob = async (
  url: string,
  fallbackFilename: string,
  openInTab = false
): Promise<void> => {
  const response = await client.get(url, { responseType: 'blob' });

  // Récupérer le nom de fichier depuis Content-Disposition si présent
  const disposition: string = response.headers['content-disposition'] || '';
  let filename = fallbackFilename;
  const match =
    disposition.match(/filename\*=UTF-8''([^;]+)/i) ||
    disposition.match(/filename="?([^";]+)"?/i);
  if (match?.[1]) {
    filename = decodeURIComponent(match[1]);
  }

  const blobUrl = URL.createObjectURL(response.data as Blob);

  if (openInTab) {
    // Ouvrir dans un nouvel onglet (prévisualisation PDF/image)
    const win = window.open(blobUrl, '_blank');
    if (!win) {
      // Popup bloqué → fallback download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.click();
    }
    // Révoquer après 60s pour laisser le temps au navigateur de charger
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } else {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5_000);
  }
};

/**
 * Télécharge/prévisualise le CV du candidat connecté.
 * Les PDF s'ouvrent dans un nouvel onglet, les autres formats déclenchent un download.
 */
export const downloadMyCV = async (filename?: string): Promise<void> => {
  const isPdf = !filename || filename.toLowerCase().endsWith('.pdf');
  await _downloadBlob('/candidates/me/cv', filename || 'cv.pdf', isPdf);
};

/**
 * Télécharge/prévisualise une pièce de vérification.
 * @param verificationId  ID de la vérification
 * @param pieceId         ID de la pièce
 * @param filename        Nom de fichier original pour le fallback
 */
export const downloadVerificationPiece = async (
  verificationId: string,
  pieceId: string,
  filename?: string
): Promise<void> => {
  const name = filename || 'document';
  const lower = name.toLowerCase();
  const openInTab = lower.endsWith('.pdf') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png');
  await _downloadBlob(`/verifications/${verificationId}/download/${pieceId}`, name, openInTab);
};
