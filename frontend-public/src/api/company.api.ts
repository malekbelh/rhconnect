import client from './client';
import type {
  CompanyProfile,
  Offer,
  Application,
} from '../types';

export const getProfile = async (): Promise<CompanyProfile> => {
  const response = await client.get<CompanyProfile>('/companies/me');
  return response.data;
};

export const updateProfile = async (data: Partial<CompanyProfile>): Promise<CompanyProfile> => {
  const response = await client.put<CompanyProfile>('/companies/me', data);
  return response.data;
};

export const uploadLogo = async (file: File): Promise<CompanyProfile> => {
  const formData = new FormData();
  formData.append('logo', file);
  const response = await client.post<CompanyProfile>(
    '/companies/me/logo',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const getMyOffers = async (): Promise<Offer[]> => {
  const response = await client.get<Offer[]>('/offers/my');
  return response.data;
};

export const createOffer = async (data: any): Promise<Offer> => {
  const response = await client.post<Offer>('/offers', data);
  return response.data;
};

export const updateOffer = async (
  id: string,
  data: any
): Promise<Offer> => {
  const response = await client.put<Offer>(`/offers/${id}`, data);
  return response.data;
};

export const deleteOffer = async (id: string): Promise<void> => {
  await client.delete(`/offers/${id}`);
};

export const getOfferApplications = async (offerId: string): Promise<Application[]> => {
  const response = await client.get<Application[]>(`/offers/${offerId}/applications`);
  return response.data;
};

export const updateApplicationStatus = async (
  id: string,
  statut: string,
  commentaire?: string
): Promise<Application> => {
  const response = await client.patch<Application>(`/applications/${id}/status`, {
    statut,
    commentaire,
  });
  return response.data;
};

// ---- AI RH ----
export interface AIRResponse {
  status: string;
  message: string;
  data: Record<string, unknown>;
}

export const aiAnalyserCandidatures = async (offerId: string): Promise<AIRResponse> => {
  const response = await client.post<AIRResponse>('/ai/rh/analyse-candidatures', { offerId });
  return response.data;
};

export const aiRedigerOffre = async (context: {
  poste: string;
  secteur: string;
  competences: string;
}): Promise<AIRResponse> => {
  const response = await client.post<AIRResponse>('/ai/rh/rediger-offre', context);
  return response.data;
};

export const aiConseilsOffre = async (offerId: string): Promise<AIRResponse> => {
  const response = await client.get<AIRResponse>(`/ai/rh/conseils-offre/${offerId}`);
  return response.data;
};

// ---- Notifications ----
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  createdAt: string;
  read: boolean;
}

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await client.get<Notification[]>('/notifications');
  return response.data || [];
};
