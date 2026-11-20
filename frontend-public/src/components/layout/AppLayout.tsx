import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  ShieldCheck,
  Sparkles,
  Settings,
  Users,
  FolderOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCandidateProfile } from '../../context/CandidateProfileContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useCompanyNotifications } from '../../context/CompanyNotificationsContext';
import { useTheme } from '../../context/ThemeContext';
import { useLang } from '../../context/LangContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { photoBlobUrl, profile: candidateProfile } = useCandidateProfile();
  const { unreadCount } = useNotifications();
  const { unreadCount: companyUnreadCount } = useCompanyNotifications();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('rhconnect_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  // Load company logo from localStorage and listen for updates
  useEffect(() => {
    if (user?.role === 'COMPANY') {
      const currentLogo = user?.companyProfile?.logoBase64Data || localStorage.getItem('companyLogo');
      setCompanyLogo(currentLogo || null);
    } else {
      setCompanyLogo(null);
    }

    // Listen for logo updates from other tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'companyLogo') {
        setCompanyLogo(e.newValue || null);
      }
    };

    // Also listen for custom event from same tab
    const handleCustomLogoUpdate = (e: any) => {
      setCompanyLogo(e.detail?.logo || null);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('companyLogoUpdated', handleCustomLogoUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('companyLogoUpdated', handleCustomLogoUpdate);
    };
  }, [user]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rhconnect_sidebar_collapsed', String(next));
      } catch { }
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const role = user?.role || (user?.roles && user.roles[0]);
    if (role === 'CANDIDATE') {
      navigate(`/candidate/offers?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/company/offers?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const userRole = user?.role || (user?.roles && user.roles[0]);
  const isCandidate = userRole === 'CANDIDATE';

  const displayName = isCandidate
    ? `${candidateProfile?.firstName || user?.firstName || ''} ${candidateProfile?.lastName || user?.lastName || ''}`.trim() || user?.email || 'Candidat'
    : user?.companyName || user?.email || 'Entreprise';

  const displayRole = isCandidate
    ? 'Espace Candidat'
    : userRole === 'RECRUITER'
      ? 'Espace Recruteur'
      : 'Espace Entreprise';

  const avatarLetter = (
    isCandidate
      ? (candidateProfile?.firstName?.charAt(0) || user?.firstName?.charAt(0) || '') +
        (candidateProfile?.lastName?.charAt(0) || user?.lastName?.charAt(0) || '')
      : displayName.charAt(0)
  ).toUpperCase() || 'U';

  // Navigation sections with i18n
  const candidateSections: NavSection[] = [
    {
      title: t('nav.overview'),
      items: [
        { to: '/candidate/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { to: '/candidate/profile', label: t('nav.myProfile'), icon: User },
      ],
    },
    {
      title: t('nav.recruitment'),
      items: [
        { to: '/candidate/offers', label: t('nav.jobOffers'), icon: Briefcase },
        { to: '/candidate/applications', label: t('nav.myApplications'), icon: FileText },
        { to: '/candidate/verification', label: t('nav.documents'), icon: ShieldCheck },
      ],
    },
    {
      title: t('nav.ai'),
      items: [
        { to: '/candidate/ai-assistant', label: t('nav.aiAssistant'), icon: Sparkles },
      ],
    },
    {
      title: t('nav.system'),
      items: [
        { to: '/candidate/notifications', label: t('nav.notifications'), icon: Bell },
        { to: '/candidate/settings', label: t('nav.settings'), icon: Settings },
      ],
    },
  ];

  const companySections: NavSection[] = [
    {
      title: t('nav.overview'),
      items: [
        { to: '/company/dashboard', label: t('nav.hrDashboard'), icon: LayoutDashboard },
        { to: '/company/profile', label: t('nav.companyProfile'), icon: Building2 },
      ],
    },
    {
      title: t('nav.recruitment'),
      items: [
        { to: '/company/offers', label: t('nav.offerManagement'), icon: Briefcase },
        { to: '/company/applications', label: t('nav.receivedApplications'), icon: Users },
        { to: '/company/dossiers', label: t('nav.fileFolders'), icon: FolderOpen },
        { to: '/company/stats', label: 'Statistiques', icon: LayoutDashboard },
      ],
    },
    {
      title: t('nav.ai'),
      items: [
        { to: '/company/ai-assistant', label: t('nav.aiAssistant'), icon: Sparkles },
      ],
    },
    {
      title: t('nav.teamSystem'),
      items: [
        { to: '/company/notifications', label: t('nav.notifications'), icon: Bell },
        { to: '/company/settings', label: t('nav.settings'), icon: Settings },
      ],
    },
  ];

  const sections = isCandidate ? candidateSections : companySections;

  // Injecte le badge non-lu sur l'item Notifications (candidat et company)
  const badgeCount = isCandidate ? unreadCount : companyUnreadCount;
  const sectionsWithBadge = sections.map((section) => ({
    ...section,
    items: section.items.map((item) =>
      item.to?.includes('/notifications') && badgeCount > 0
        ? { ...item, badge: String(badgeCount > 99 ? '99+' : badgeCount) }
        : item
    ),
  }));

  return (
    <div className={`${isDark ? 'dark ' : ''}min-h-screen flex bg-[#F3F6F7] dark:bg-[#0A1520] text-[#172A3A] dark:text-[#E2E8F0] font-sans antialiased transition-colors duration-200`}>
      {/* ─── MOBILE BACKDROP ─── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ─── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#172A3A] dark:bg-[#0A1520] border-r border-white/10 transition-all duration-300 ease-in-out ${collapsed ? 'w-[74px]' : 'w-[260px]'
          } ${mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
          }`}
        aria-label="Navigation principale"
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.08] h-[66px] overflow-hidden whitespace-nowrap">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#0F766E] shadow-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
            onClick={() => navigate(isCandidate ? '/candidate/dashboard' : '/company/dashboard')}
            title="RhConnect"
          >
            {/* Exact Admin Brand SVG */}
            <svg viewBox="0 0 44 44" width="26" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 13 11 C 13 10.17 13.67 9.5 14.5 9.5 C 15.33 9.5 16 10.17 16 11 L 16 31 C 16 31.83 15.33 32.5 14.5 32.5 C 13.67 32.5 13 31.83 13 31 Z"
                fill="#FFFFFF"
              />
              <path
                d="M 15 11.5 H 23.5 C 27.6 11.5 30 14.1 30 17.6 C 30 21.1 27.6 23.7 23.5 23.7 H 15"
                stroke="#FFFFFF"
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 21.2 23.2 L 28.6 31.6 C 29.1 32.2 30 32.2 30.6 31.7"
                stroke="#FFFFFF"
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 22.8 17.5 C 24 16 26.5 15 29.5 13.5"
                stroke="#FFFFFF"
                strokeOpacity="0.75"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeDasharray="0.5 2.5"
              />
              <circle cx="21.5" cy="17.6" r="2.2" fill="#FFFFFF" />
              <circle cx="31" cy="12.5" r="2.6" fill="#D4A72C" />
            </svg>
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0 transition-opacity duration-200">
              <div className="font-bold text-white text-base tracking-tight leading-tight flex items-center gap-1.5">
                RhConnect
              </div>
              <div className="text-[11px] text-white/50 truncate font-medium mt-0.5">
                {displayRole}
              </div>
            </div>
          )}

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden ml-auto p-1.5 text-white/60 hover:text-white rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav list */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10">
          {sectionsWithBadge.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-[10px] font-bold tracking-wider text-white/30 uppercase select-none mb-1">
                  {section.title}
                </div>
              )}
              {collapsed && (
                <div className="w-6 h-[1px] bg-white/10 mx-auto my-2" />
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative min-w-0 ${collapsed ? 'justify-center px-2' : ''
                      } ${isActive
                        ? 'bg-[#0F766E]/25 text-white shadow-sm font-semibold'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.07]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`flex-shrink-0 min-w-[19px] transition-colors ${isActive
                            ? 'text-[#5EEAD4]'
                            : 'text-white/80'
                            }`}
                          size={19}
                        />
                        {!collapsed && (
                          <span className="truncate min-w-0">{item.label}</span>
                        )}
                        {!collapsed && item.badge && (
                          <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold bg-[#0F766E] text-white rounded-full">
                            {item.badge}
                          </span>
                        )}
                        {/* Tooltip for collapsed view */}
                        {collapsed && (
                          <div className="fixed left-[84px] px-2.5 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50 whitespace-nowrap">
                            {item.label}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/40">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 text-white/50 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors flex items-center justify-center"
            title={collapsed ? 'Déplier la sidebar' : 'Réduire la sidebar'}
            aria-label={collapsed ? 'Déplier la sidebar' : 'Réduire la sidebar'}
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
          {!collapsed && (
            <span className="text-[11px] font-medium text-white/30 pr-1 select-none">
              RhConnect v1.0
            </span>
          )}
        </div>
      </aside>

      {/* ─── MAIN SHELL ─── */}
      <div
        className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-[74px]' : 'lg:ml-[260px]'
          }`}
      >
        {/* Topbar matching Admin Topbar exactly */}
        <header className="sticky top-0 z-30 h-[66px] bg-[#F3F6F7]/90 dark:bg-[#0A1520]/90 backdrop-blur-md border-b border-[#E2E8F0] dark:border-white/10 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-colors duration-200">
          {/* Left section: Mobile menu + Quick Search */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-[#475569] hover:text-[#172A3A] hover:bg-white rounded-xl transition-colors border border-[#E2E8F0]"
              aria-label="Ouvrir le menu"
            >
              <Menu size={20} />
            </button>

            <form
              onSubmit={handleSearchSubmit}
              className="relative flex-1 max-w-md hidden sm:block"
            >
              <div className="flex items-center gap-2 px-3.5 h-[38px] bg-white border border-[#CBD5E1] rounded-full text-[#64748B] focus-within:border-[#0F766E] focus-within:ring-2 focus-within:ring-[#0F766E]/20 transition-all shadow-sm">
                <Search size={16} className="text-[#94A3B8]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isCandidate
                      ? 'Rechercher un poste, une compétence...'
                      : 'Rechercher une offre, une candidature...'
                  }
                  className="w-full bg-transparent border-0 outline-none text-xs text-[#172A3A] placeholder-[#94A3B8]"
                />
              </div>
            </form>
          </div>

          {/* Right section: Profile + Notifications + Logout */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">


            {/* Notification button */}
            <button
              type="button"
              onClick={() => navigate(isCandidate ? '/candidate/notifications' : '/company/settings')}
              className="relative p-2 text-[#64748B] dark:text-white/60 hover:text-[#172A3A] dark:hover:text-white hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors"
              title="Notifications"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-0.5 bg-[#E11D48] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-[#F3F6F7] dark:ring-[#0A1520] leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Toggle thème */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-[#64748B] dark:text-white/60 hover:text-[#172A3A] dark:hover:text-white hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors"
              title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
              aria-label={isDark ? 'Mode clair' : 'Mode sombre'}
            >
              {isDark ? <Sun size={18} className="text-[#D4A72C]" /> : <Moon size={18} />}
            </button>

            <div className="w-[1px] h-6 bg-[#E2E8F0] dark:bg-white/10 mx-1" />

            {/* User Profile Info with Dropdown Button */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border transition-all text-left group ${profileMenuOpen
                  ? 'bg-white border-[#CBD5E1] shadow-xs'
                  : 'border-transparent hover:bg-white hover:border-[#E2E8F0]'
                  }`}
                aria-expanded={profileMenuOpen}
                aria-haspopup="true"
              >
                {companyLogo && !isCandidate ? (
                  <img
                    src={companyLogo}
                    alt="Logo"
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-white/20"
                  />
                ) : isCandidate && photoBlobUrl ? (
                  <img
                    src={photoBlobUrl}
                    alt={displayName || 'Photo de profil'}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-white/20"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full bg-[#0F766E] text-white font-bold text-xs flex items-center justify-center shadow-[0_2px_8px_rgba(15,118,110,0.35)] border border-white/20 select-none flex-shrink-0"
                  >
                    {avatarLetter}
                  </div>
                )}
                <div className="text-left leading-tight">
                  <div className="text-xs font-bold text-[#172A3A] whitespace-nowrap">
                    {displayName}
                  </div>

                </div>
                <ChevronDown
                  size={15}
                  className={`text-[#64748B] group-hover:text-[#172A3A] transition-transform duration-200 ml-1 flex-shrink-0 ${profileMenuOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* Sub-items Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-[#F1F5F9]">
                    <p className="text-xs font-bold text-[#172A3A] break-all mt-0.5">
                      {displayName}
                    </p>
                    {user?.email && (
                      <p className="text-[11px] text-[#64748B] break-all mt-1 font-medium">
                        {user.email}
                      </p>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        navigate(isCandidate ? '/candidate/profile' : '/company/profile');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#334155] hover:text-[#0F766E] hover:bg-[#F0FDFA] transition-colors text-left"
                    >
                      <User size={16} className="text-[#0F766E]" />
                      Modifier mon profil
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        navigate(isCandidate ? '/candidate/settings' : '/company/settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#334155] hover:text-[#0F766E] hover:bg-[#F0FDFA] transition-colors text-left"
                    >
                      <Settings size={16} className="text-[#64748B]" />
                      Paramètres
                    </button>
                  </div>

                  <div className="pt-1 border-t border-[#F1F5F9]">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-[#E11D48] hover:bg-[#FFF1F2] transition-colors text-left"
                    >
                      <LogOut size={16} />
                      {t('common.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logout button styled like admin layout */}
            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FFF1F2] border border-[#CBD5E1] hover:border-[#E11D48] text-[#475569] hover:text-[#E11D48] text-xs font-semibold rounded-full transition-all duration-150 shadow-sm"
              title="Se déconnecter"
            >
              <LogOut size={14} />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </header>

        {/* ─── PAGE CONTENT ─── */}
        <main className="flex-1 min-w-0 px-5 sm:px-8 py-7 overflow-x-hidden bg-[#F3F6F7] dark:bg-[#0A1520] transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
