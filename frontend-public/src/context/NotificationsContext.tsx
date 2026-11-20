/**
 * NotificationsContext — partage le compteur non-lu en temps réel
 * entre AppLayout (badge) et NotificationsPage (liste complète).
 * Support: Candidat ONLY
 * 
 * Company notifications disabled (causes auth issues on reload)
 * IMPORTANT: Ne doit pas bloquer l'app en cas d'erreur API
 */
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getNotifications, getUnreadCount, type Notification } from '../api/notifications.api';
import { useAuth } from './AuthContext';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  refresh: async () => {},
});

const POLL_INTERVAL_MS = 60_000; // rafraîchissement toutes les 60 s

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const isCandidate =
    user?.role === 'CANDIDATE' ||
    (Array.isArray(user?.roles) && user.roles.includes('CANDIDATE'));

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    if (!isCandidate) return; // Only candidate
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.debug('Notifications refresh failed', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isCandidate]);

  useEffect(() => {
    if (!accessToken) return;
    if (!isCandidate) return;
    
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [accessToken, isCandidate, refresh]);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount: getUnreadCount(notifications), loading, refresh }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
