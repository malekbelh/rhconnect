import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  me as apiMe,
  normalizeUser,
} from '../api/auth.api';
import type { LoginData, RegisterData, User } from '../api/auth.api';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  login: (data: LoginData) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('rhconnect_user');
      return stored ? normalizeUser(JSON.parse(stored)) : null;
    } catch {
      return null;
    }
  });
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem('rhconnect_access_token')
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(() =>
    localStorage.getItem('rhconnect_refresh_token')
  );
  const [loading, setLoading] = useState(false);

  const persistAuth = useCallback(
    (newAccessToken: string, newRefreshToken: string, newUser: User) => {
      const normalized = normalizeUser(newUser);
      localStorage.setItem('rhconnect_access_token', newAccessToken);
      localStorage.setItem('rhconnect_refresh_token', newRefreshToken);
      localStorage.setItem('rhconnect_user', JSON.stringify(normalized));
      
      const logo = normalized?.companyProfile?.logoBase64Data;
      if (logo) {
        localStorage.setItem('companyLogo', logo);
        window.dispatchEvent(
          new CustomEvent('companyLogoUpdated', { detail: { logo } })
        );
      } else {
        localStorage.removeItem('companyLogo');
        window.dispatchEvent(
          new CustomEvent('companyLogoUpdated', { detail: { logo: null } })
        );
      }

      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setUser(normalized);
    },
    []
  );

  const clearAuth = useCallback(() => {
    localStorage.removeItem('rhconnect_access_token');
    localStorage.removeItem('rhconnect_refresh_token');
    localStorage.removeItem('rhconnect_user');
    localStorage.removeItem('companyLogo');
    window.dispatchEvent(
      new CustomEvent('companyLogoUpdated', { detail: { logo: null } })
    );
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    async (data: LoginData) => {
      setLoading(true);
      try {
        const response = await apiLogin(data);
        persistAuth(response.accessToken, response.refreshToken, response.user);
        return response.user;
      } finally {
        setLoading(false);
      }
    },
    [persistAuth]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      setLoading(true);
      try {
        const response = await apiRegister(data);
        persistAuth(response.accessToken, response.refreshToken, response.user);
        return response.user;
      } finally {
        setLoading(false);
      }
    },
    [persistAuth]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await apiLogout();
    } finally {
      clearAuth();
      setLoading(false);
    }
  }, [clearAuth]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await apiMe();
      setUser(currentUser);
      localStorage.setItem('rhconnect_user', JSON.stringify(currentUser));
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        loading,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
