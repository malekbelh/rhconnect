import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Loader2,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  User,
  Calendar,
  ChevronRight,
  BellOff,
  CheckCircle2,
  XCircle,
  Trash2,
} from 'lucide-react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
  type Notification,
  type NotifType,
} from '../../api/notifications.api';

/* ── Icônes et styles par type ── */
const NOTIF_CONFIG: Record<
  NotifType,
  { icon: React.ReactNode; bg: string; border: string; dot: string }
> = {
  APPLICATION_STATUS: {
    icon: <Briefcase className="w-4 h-4 text-[#4F46E5]" />,
    bg: 'bg-[#EEF2FF]',
    border: 'border-[#C7D2FE]',
    dot: 'bg-[#4F46E5]',
  },
  INTERVIEW_SCHEDULED: {
    icon: <Calendar className="w-4 h-4 text-[#0F766E]" />,
    bg: 'bg-[#E6F7F5]',
    border: 'border-[#99F6E4]',
    dot: 'bg-[#0F766E]',
  },
  APPLICATION_ACCEPTED: {
    icon: <CheckCircle2 className="w-4 h-4 text-[#059669]" />,
    bg: 'bg-[#ECFDF5]',
    border: 'border-[#A7F3D0]',
    dot: 'bg-[#059669]',
  },
  APPLICATION_REFUSED: {
    icon: <XCircle className="w-4 h-4 text-[#E11D48]" />,
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-[#E11D48]',
  },
  VERIFICATION_REJECTED: {
    icon: <ShieldAlert className="w-4 h-4 text-[#E11D48]" />,
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-[#E11D48]',
  },
  VERIFICATION_VALIDATED: {
    icon: <ShieldCheck className="w-4 h-4 text-[#059669]" />,
    bg: 'bg-[#ECFDF5]',
    border: 'border-[#A7F3D0]',
    dot: 'bg-[#059669]',
  },
  OFFER_RECOMMENDED: {
    icon: <Sparkles className="w-4 h-4 text-[#D4A72C]" />,
    bg: 'bg-[#FDF8EC]',
    border: 'border-[#FDE68A]',
    dot: 'bg-[#D4A72C]',
  },
  PROFILE_INCOMPLETE: {
    icon: <User className="w-4 h-4 text-[#B45309]" />,
    bg: 'bg-[#FDF8EC]',
    border: 'border-[#FDE68A]',
    dot: 'bg-[#D4A72C]',
  },
};

const DEFAULT_CONFIG = {
  icon: <Bell className="w-4 h-4 text-[#64748B]" />,
  bg: 'bg-[#F8FAFC]',
  border: 'border-[#E2E8F0]',
  dot: 'bg-[#64748B]',
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

type Filter = 'ALL' | 'UNREAD' | NotifType;
type PeriodFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';

const FILTER_LABELS: { id: Filter; label: string }[] = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'UNREAD', label: 'Non lues' },
  { id: 'APPLICATION_STATUS', label: 'Candidatures' },
  { id: 'INTERVIEW_SCHEDULED', label: 'Entretiens' },
  { id: 'VERIFICATION_REJECTED', label: 'Vérification' },
  { id: 'OFFER_RECOMMENDED', label: 'Offres' },
];

const PERIOD_LABELS: { id: PeriodFilter; label: string }[] = [
  { id: 'ALL', label: 'Toutes les dates' },
  { id: 'TODAY', label: "Aujourd'hui" },
  { id: 'WEEK', label: '7 derniers jours' },
  { id: 'MONTH', label: '30 derniers jours' },
];

function isInPeriod(dateStr: string, period: PeriodFilter): boolean {
  if (period === 'ALL') return true;
  const date = new Date(dateStr).getTime();
  const now = Date.now();
  if (period === 'TODAY') return now - date < 86_400_000;
  if (period === 'WEEK') return now - date < 7 * 86_400_000;
  if (period === 'MONTH') return now - date < 30 * 86_400_000;
  return true;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [period, setPeriod] = useState<PeriodFilter>('ALL');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleMarkRead = (id: string) => {
    markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAll = async () => {
    await markAllAsRead(notifications);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Supprimer toutes les notifications ?')) return;
    await deleteAllNotifications(notifications);
    setNotifications([]);
  };

  const filtered = notifications.filter((n) => {
    // Filtre type
    let matchType = true;
    if (filter === 'UNREAD') matchType = !n.read;
    else if (filter === 'APPLICATION_STATUS')
      matchType = ['APPLICATION_STATUS', 'INTERVIEW_SCHEDULED', 'APPLICATION_ACCEPTED', 'APPLICATION_REFUSED'].includes(n.type);
    else if (filter === 'VERIFICATION_REJECTED')
      matchType = ['VERIFICATION_REJECTED', 'VERIFICATION_VALIDATED'].includes(n.type);
    else if (filter !== 'ALL') matchType = n.type === filter;

    // Filtre période
    const matchPeriod = isInPeriod(n.createdAt, period);

    // Filtre recherche texte
    const q = search.toLowerCase();
    const matchSearch = !q || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);

    return matchType && matchPeriod && matchSearch;
  });

  const unreadCount = getUnreadCount(notifications);

  return (
    <div className="max-w-7xl mx-auto py-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#172A3A]">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#E11D48] text-white text-[11px] font-extrabold shadow-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-[#64748B] mt-1">
            {notifications.length === 0
              ? 'Aucune notification pour le moment.'
              : `${notifications.length} notification${notifications.length > 1 ? 's' : ''}${unreadCount > 0 ? `, ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#0F766E] bg-[#E6F7F5] hover:bg-[#CCF0EB] border border-[#0F766E]/20 transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              Tout marquer comme lu
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer tout
            </button>
          )}
        </div>
      </div>

      {/* Filtres type */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTER_LABELS.map(({ id, label }) => {
          const count =
            id === 'ALL'
              ? notifications.length
              : id === 'UNREAD'
              ? unreadCount
              : id === 'APPLICATION_STATUS'
              ? notifications.filter((n) =>
                  ['APPLICATION_STATUS', 'INTERVIEW_SCHEDULED', 'APPLICATION_ACCEPTED', 'APPLICATION_REFUSED'].includes(n.type)
                ).length
              : id === 'VERIFICATION_REJECTED'
              ? notifications.filter((n) =>
                  ['VERIFICATION_REJECTED', 'VERIFICATION_VALIDATED'].includes(n.type)
                ).length
              : notifications.filter((n) => n.type === id).length;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filter === id
                  ? 'bg-[#172A3A] text-white shadow-xs'
                  : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:text-[#172A3A] hover:border-[#CBD5E1]'
              }`}
            >
              {label}
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    filter === id
                      ? 'bg-white/20 text-white'
                      : id === 'UNREAD'
                      ? 'bg-[#E11D48] text-white'
                      : 'bg-[#E2E8F0] text-[#64748B]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Barre de recherche + filtre période */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Bell className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans les notifications..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm font-medium text-[#172A3A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
          />
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {PERIOD_LABELS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPeriod(id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                period === id
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:text-[#0F766E] hover:border-[#0F766E]/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Récap filtres actifs */}
      {(search || period !== 'ALL') && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#64748B]">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
          <button
            onClick={() => { setSearch(''); setPeriod('ALL'); }}
            className="text-[#0F766E] font-bold hover:underline"
          >
            Effacer les filtres
          </button>
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-[#0F766E] animate-spin" />
          <p className="text-xs text-[#64748B]">Chargement des notifications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#E2E8F0] rounded-3xl p-12 text-center">
          <BellOff className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
          <h3 className="font-bold text-[#172A3A] text-sm">
            {filter === 'UNREAD' ? 'Tout est à jour !' : 'Aucune notification'}
          </h3>
          <p className="text-sm text-[#64748B] mt-1">
            {filter === 'UNREAD'
              ? 'Vous avez lu toutes vos notifications.'
              : 'Les mises à jour de vos candidatures et dossiers apparaîtront ici.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const cfg = NOTIF_CONFIG[notif.type] ?? DEFAULT_CONFIG;
            return (
              <Link
                key={notif.id}
                to={notif.link}
                onClick={() => handleMarkRead(notif.id)}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all hover:shadow-xs group ${
                  notif.read
                    ? 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                    : `${cfg.bg} ${cfg.border} hover:shadow-sm`
                }`}
              >
                {/* Icône */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                    notif.read ? 'bg-[#F8FAFC] border-[#E2E8F0]' : `${cfg.bg} ${cfg.border}`
                  }`}
                >
                  {cfg.icon}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-xs font-bold ${notif.read ? 'text-[#334155]' : 'text-[#172A3A]'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} title="Non lue" />
                        )}
                      </div>
                      <p className={`text-[11px] mt-0.5 leading-relaxed ${notif.read ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
                        {notif.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2 pt-0.5">
                      <span className="text-[10px] text-[#94A3B8] whitespace-nowrap">
                        {relativeTime(notif.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(notif.id);
                        }}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Supprimer cette notification"
                        aria-label="Supprimer cette notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] group-hover:text-[#0F766E] transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

     
    </div>
  );
};

export default NotificationsPage;
