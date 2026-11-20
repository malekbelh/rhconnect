import client from './client';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterCandidateData {
  role: 'CANDIDATE';
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface RegisterCompanyData {
  role: 'COMPANY';
  email: string;
  password: string;
  companyName: string;
  siret?: string;
  phone?: string;
  address?: string;
}

export type RegisterData = RegisterCandidateData | RegisterCompanyData;

export interface CandidateProfile {
  id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  bio?: string;
  competences?: string[];
  parcours?: any[];
  formation?: any[];
  cvFileId?: string;
  cvFileName?: string;
  photoFileId?: string;
  photoFileName?: string;
  matchingTags?: string[];
}

export interface CompanyProfile {
  id?: string;
  userId?: string;
  companyName?: string;
  siret?: string;
  phone?: string;
  address?: string;
  description?: string;
  sector?: string;
  logo?: string;
  website?: string;
  logoFileId?: string;
  logoFileName?: string;
  logoBase64Data?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'CANDIDATE' | 'COMPANY' | 'ADMIN' | 'RECRUITER';
  roles: string[];
  firstName?: string;
  lastName?: string;
  companyName?: string;
  verified: boolean;
  enabled?: boolean;
  candidateProfile?: CandidateProfile;
  companyProfile?: CompanyProfile;
  createdAt?: string;
  updatedAt?: string;
}

export function normalizeUser(raw: any): User {
  if (!raw) return raw;

  const roles: string[] = Array.isArray(raw.roles)
    ? raw.roles
    : raw.role
    ? [raw.role]
    : [];

  let role: 'CANDIDATE' | 'COMPANY' | 'ADMIN' | 'RECRUITER' = 'CANDIDATE';
  if (roles.includes('ADMIN')) {
    role = 'ADMIN';
  } else if (roles.includes('COMPANY')) {
    role = 'COMPANY';
  } else if (roles.includes('RECRUITER')) {
    role = 'RECRUITER';
  } else if (roles.includes('CANDIDATE')) {
    role = 'CANDIDATE';
  } else if (raw.role) {
    role = raw.role;
  }

  const firstName =
    raw.firstName || raw.candidateProfile?.firstName || '';
  const lastName =
    raw.lastName || raw.candidateProfile?.lastName || '';
  const companyName =
    raw.companyName || raw.companyProfile?.companyName || '';

  return {
    ...raw,
    role,
    roles,
    firstName,
    lastName,
    companyName,
    verified: raw.verified ?? false,
  };
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenData {
  refreshToken: string;
}

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await client.post<any>('/auth/login', data);
  const authData = response.data;
  return {
    ...authData,
    user: normalizeUser(authData.user),
  };
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await client.post<any>('/auth/register', data);
  const authData = response.data;
  return {
    ...authData,
    user: normalizeUser(authData.user),
  };
};

export const refreshToken = async (data: RefreshTokenData): Promise<AuthResponse> => {
  const response = await client.post<any>('/auth/refresh-token', data);
  const authData = response.data;
  return {
    ...authData,
    user: normalizeUser(authData.user),
  };
};

export const logout = async (): Promise<void> => {
  const refreshToken = localStorage.getItem('rhconnect_refresh_token');
  if (refreshToken) {
    try {
      await client.post('/auth/logout', { refreshToken });
    } catch {
    }
  }
};

export const me = async (): Promise<User> => {
  const response = await client.get<any>('/auth/me');
  return normalizeUser(response.data);
};

// ========== PASSWORD RESET (Mot de passe oublié) ==========

export const forgotPassword = async (email: string): Promise<string> => {
  const response = await client.post<any>('/auth/forgot-password', { email });
  return response.data?.message || response.data?.data || 'Un email de réinitialisation a été envoyé.';
};

export const resetPassword = async (token: string, newPassword: string): Promise<string> => {
  const response = await client.post<any>('/auth/reset-password', { token, newPassword });
  return response.data?.message || response.data?.data || 'Mot de passe réinitialisé avec succès.';
};
