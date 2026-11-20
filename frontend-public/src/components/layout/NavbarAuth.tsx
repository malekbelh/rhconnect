import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  LayoutDashboard,
  FileText,
  User,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Building2,
  UserCircle,
  Sparkles,
  Settings,
  FolderOpen,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCandidateProfile } from '../../context/CandidateProfileContext';
import { Logo } from '../common/Logo';

const NavbarAuth: React.FC = () => {
  const { user, logout } = useAuth();
  const { photoBlobUrl } = useCandidateProfile();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userRole = user?.role || (user?.roles && user.roles[0]);
  const isCandidate = userRole === 'CANDIDATE';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
    setMobileOpen(false);
  };

  const displayName = isCandidate
    ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email
    : user?.companyName || user?.email;

  const initials = isCandidate
    ? `${(user?.firstName || '').charAt(0)}${(user?.lastName || '').charAt(0)}`.toUpperCase()
    : `${(user?.companyName || '').charAt(0)}`.toUpperCase();

  const navLinks = isCandidate
    ? [
        { to: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/candidate/offers', label: 'Offres', icon: Briefcase },
        { to: '/candidate/applications', label: 'Candidatures', icon: FileText },
        { to: '/candidate/verification', label: 'Vérification', icon: ShieldCheck },
        { to: '/candidate/ai-assistant', label: 'Assistant IA', icon: Sparkles },
        { to: '/candidate/profile', label: 'Profil', icon: User },
        { to: '/candidate/settings', label: 'Paramètres', icon: Settings },
      ]
    : [
        { to: '/company/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/company/offers', label: 'Offres', icon: Briefcase },
        { to: '/company/applications', label: 'Candidatures', icon: FileText },
        { to: '/company/dossiers', label: 'Dossiers', icon: FolderOpen },
        { to: '/company/ai-assistant', label: 'Assistant IA RH', icon: Sparkles },
        { to: '/company/profile', label: 'Profil', icon: Building2 },
        { to: '/company/settings', label: 'Paramètres', icon: Settings },
      ];

  const primaryLinks = navLinks.slice(0, 5);
  const secondaryLinks = navLinks.slice(5);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
      isActive
        ? 'text-primary-600 bg-primary-50'
        : 'text-neutral-600 hover:text-primary-600 hover:bg-primary-50'
    }`;

  const avatarSizeClass = 'w-8 h-8';
  const avatarContainerClass = `${avatarSizeClass} bg-gradient-to-br from-primary-100 to-secondary-50 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0`;

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo + Primary Nav */}
          <div className="flex items-center gap-6">
            <Link
              to={isCandidate ? '/candidate/dashboard' : '/company/dashboard'}
              className="flex items-center"
              aria-label="RhConnect Dashboard"
            >
              <Logo size="md" variant="light" />
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {primaryLinks.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={linkClass}>
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
              aria-label="Menu mobile"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <div className={avatarContainerClass}>
                  {isCandidate && photoBlobUrl ? (
                    <img
                      src={photoBlobUrl}
                      alt={displayName || 'Photo de profil'}
                      className={`${avatarSizeClass} object-cover rounded-full`}
                    />
                  ) : initials ? (
                    <span
                      className={`text-xs font-bold ${
                        isCandidate ? 'text-primary-600' : 'text-secondary-500'
                      }`}
                    >
                      {initials}
                    </span>
                  ) : isCandidate ? (
                    <UserCircle className="w-5 h-5 text-primary-600" />
                  ) : (
                    <Building2 className="w-5 h-5 text-secondary-500" />
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium text-neutral-700 max-w-[140px] truncate">
                  {displayName || 'Compte'}
                </span>
                <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-neutral-200 rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-3 border-b border-neutral-100 mb-1">
                    <p className="text-sm font-semibold text-neutral-800 truncate">{displayName}</p>
                    <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                    {user?.verified ? (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-success-600 font-medium">
                        <ShieldCheck className="w-3 h-3" />
                        Vérifié
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-amber-500 font-medium">
                        <ShieldCheck className="w-3 h-3" />
                        Non vérifié
                      </span>
                    )}
                  </div>

                  {secondaryLinks.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                          isActive ? 'text-primary-600 bg-primary-50' : 'text-neutral-700 hover:bg-neutral-50'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </NavLink>
                  ))}

                  <div className="border-t border-neutral-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-danger-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile full-nav drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white py-3 px-4 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'text-primary-600 bg-primary-50' : 'text-neutral-700 hover:bg-neutral-50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-danger-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      )}
    </nav>
  );
};

export default NavbarAuth;

