import client from './client';

export interface UserSettings {
  id?: string;
  userId?: string;
  // Candidat
  emailCandidatures: boolean;
  emailOffres: boolean;
  emailMessages: boolean;
  notifPush: boolean;
  langue: string;
  profilPublic: boolean;
  cvPublic: boolean;
  // Entreprise
  notifNouvellesCandidatures: boolean;
  notifChangementStatut: boolean;
  emailRapportHebdo: boolean;
}

export const getSettings = async (): Promise<UserSettings> => {
  const response = await client.get<UserSettings>('/settings/me');
  return response.data;
};

export const updateSettings = async (
  patch: Partial<UserSettings>
): Promise<UserSettings> => {
  const response = await client.patch<UserSettings>('/settings/me', patch);
  return response.data;
};
