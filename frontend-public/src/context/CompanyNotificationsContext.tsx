/**
 * CompanyNotificationsContext — notifications pour l'espace company
 * Charge les notifications réellement générées pour les entreprises.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getNotifications, getUnreadCount, type Notification } from '../api/notifications.api';
import { useAuth } from './AuthContext';

interface CompanyNotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

const CompanyNotificationsContext = createContext<CompanyNotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  refresh: async () => {},
});

const POLL_INTERVAL_MS = 60_000;

export const CompanyNotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const isCompany =
    user?.role === 'COMPANY' ||
    user?.role === 'RECRUITER' ||
    (Array.isArray(user?.roles) && (user.roles.includes('COMPANY') || user.roles.includes('RECRUITER')));

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    if (!isCompany) return;

    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.debug('Company notifications refresh failed', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isCompany]);

  useEffect(() => {
    if (!accessToken) return;
    if (!isCompany) return;

    void refresh();
    const timer = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [accessToken, isCompany, refresh]);

  return (
    <CompanyNotificationsContext.Provider
      value={{ notifications, unreadCount: getUnreadCount(notifications), loading, refresh }}
    >
      {children}
    </CompanyNotificationsContext.Provider>
  );
};

export const useCompanyNotifications = () => useContext(CompanyNotificationsContext);
