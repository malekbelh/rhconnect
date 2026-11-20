import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import {
  Briefcase,
  Users,
  TrendingUp,
  Plus,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  AlertTriangle,
  Clock,
  ChevronRight,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  MapPin,
  Layers,
  Edit3,
  Info,
  ArrowUpRight,
  Search,
} from 'lucide-react';
import { getMyOffers, getProfile, getOfferApplications, getNotifications } from '../../api/company.api';
import StatusBadge from '../../components/ui/StatusBadge';
import MatchingBadge from '../../components/offer/MatchingBadge';
import { useLang } from '../../context/LangContext';

const DashboardCompany: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [offersData, profileData] = await Promise.all([
          getMyOffers().catch((err) => {
            console.error('Error loading offers:', err);
            return [];
          }),
          getProfile().catch((err) => {
            console.error('Error loading profile:', err);
            return null;
          }),
        ]);
        setOffers(offersData || []);
        setProfile(profileData);

        // Load company logo from profile data
        if (profileData?.logoBase64Data) {
          setCompanyLogo(profileData.logoBase64Data);
          try {
            localStorage.setItem('companyLogo', profileData.logoBase64Data);
          } catch (e) {
            console.warn('Could not save logo to localStorage:', e);
          }
        } else {
          setCompanyLogo(null);
          try {
            localStorage.removeItem('companyLogo');
          } catch (e) {
            // ignore
          }
        }

        // Load all applications from all offers
        try {
          const allApplications: any[] = [];
          for (const offer of (offersData || [])) {
            const apps = await getOfferApplications(offer.id).catch((err) => {
              console.error('Error loading applications for offer:', offer.id, err);
              return [];
            });
            allApplications.push(
              ...apps.map((app: any) => ({
                ...app,
                offerId: offer.id,
                offerTitle: offer.title,
                companyName: profileData?.companyName || 'Entreprise',
              }))
            );
          }
          allApplications.sort((a, b) => 
            new Date(b.dateSoumission || b.createdAt).getTime() - 
            new Date(a.dateSoumission || a.createdAt).getTime()
          );
          setRecentApplications(allApplications);
        } catch (err) {
          console.error('Error loading applications:', err);
        }

        // Load notifications
        try {
          const notifs = await getNotifications().catch((err) => {
            console.error('Error loading notifications:', err);
            return [];
          });
          setNotifications(notifs || []);
        } catch (err) {
          console.error('Error loading notifications:', err);
        }
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError(err.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    let completed = 0;
    const total = 6;

    if (profile.logoBase64Data || profile.logoFileId || companyLogo) completed++;
    if (profile.description && profile.description.trim().length > 10) completed++;
    if (profile.sector && profile.sector.trim().length > 0) completed++;
    if (profile.size && profile.size.trim().length > 0) completed++;
    if (profile.website && profile.website.trim().length > 3) completed++;
    if (profile.verified) completed++;

    return Math.round((completed / total) * 100);
  };

  const getOldApplications = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return recentApplications.filter((app) => {
      const appDate = new Date(app.dateSoumission || app.createdAt);
      return (
        appDate < sevenDaysAgo &&
        !['ACCEPTE', 'REFUSE', 'ENTRETIEN', 'TRANSMIS'].includes(app.status || app.statut)
      );
    });
  };

  const getStats = () => ({
    total: offers.length,
    active: offers.filter((o) => (o.statut || o.status) === 'ACTIVE').length,
    applications: offers.reduce((sum, o) => sum + (o.applicationCount || 0), 0),
    recent: recentApplications.slice(0, 4).length,
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12">
        <div className="flex flex-col items-center justify-center py-16 gap-2.5">
          <Loader2 className="w-8 h-8 text-signal dark:text-cyan-400 animate-spin" />
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('company.dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const completionScore = calculateProfileCompletion();
  const oldApps = getOldApplications();

  /* Alertes dynamiques */
  const alerts: { icon: React.ReactNode; text: string; link: string; color: string }[] = [];
  if (!profile?.verified) {
    alerts.push({
      icon: <ShieldCheck className="w-4 h-4 flex-shrink-0" />,
      text: 'Compte entreprise en attente de vérification : Vous pourrez publier des offres d\'emploi dès que vos documents (RNE) seront validés par l\'administrateur.',
      link: '/company/profile?tab=verification',
      color: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300',
    });
  }
  if (completionScore < 100) {
    alerts.push({
      icon: <Info className="w-3.5 h-3.5 flex-shrink-0" />,
      text: `${t('company.dashboard.profileCompletion')} ${completionScore}%. ${t('company.dashboard.profileComplete')}`,
      link: '/company/profile',
      color: 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
    });
  }
  if (oldApps.length > 0) {
    alerts.push({
      icon: <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />,
      text: `${oldApps.length} candidature(s) en attente depuis plus de 7 jours. Répondez rapidement pour maintenir l'engagement.`,
      link: '/company/applications',
      color: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-rose-600 dark:text-rose-400',
    });
  }
  if (offers.length === 0 && profile?.verified) {
    alerts.push({
      icon: <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />,
      text: 'Publiez votre première offre d\'emploi pour commencer à recevoir des candidatures.',
      link: '/company/offers/new',
      color: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-signal dark:text-cyan-400',
    });
  }

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto py-5 space-y-5">
        {error && (
        <div className="p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl flex items-start gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
        </div>
      )}

      {/* ── En-tête profil ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative flex-shrink-0">
              {(profile?.logoBase64Data || profile?.logoFileId || companyLogo) ? (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-50 dark:from-emerald-500/10 to-blue-50 dark:to-blue-500/10 border-2 border-signal/20 dark:border-signal/30 shadow-md flex items-center justify-center overflow-hidden">
                  <img
                    src={companyLogo || profile?.logoBase64Data || ''}
                    alt={profile?.companyName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-900 dark:from-slate-800 to-slate-700 dark:to-slate-600 border-2 border-amber-500/40 dark:border-amber-500/30 text-amber-500 dark:text-amber-400 flex items-center justify-center font-display font-extrabold text-3xl shadow-md">
                  {profile?.companyName?.[0] || 'E'}
                </div>
              )}
              {profile?.verified && (
                <div
                  className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-600 dark:from-emerald-500 to-emerald-700 dark:to-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg border-3 border-white dark:border-slate-900"
                  title="Entreprise Vérifiée"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {profile?.companyName || 'Entreprise'}
                </h1>
                {profile?.verified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> Vérifiée
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                    <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> En cours de vérification
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1.5 flex-wrap">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {profile?.description?.split('\n')[0] || 'Complétez votre profil'}
                </span>
                {profile?.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-signal dark:text-cyan-400" />
                    {profile.address}
                  </span>
                )}
                {profile?.sector && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-signal dark:text-cyan-400" />
                    {profile.sector}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-center flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-700 w-full lg:w-auto justify-end">
            <Link
              to="/company/profile"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              {t('company.dashboard.editProfile')}
            </Link>

            {profile?.verified ? (
              <Link
                to="/company/offers/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-signal dark:text-cyan-400 bg-emerald-50 dark:bg-signal/10 hover:bg-emerald-200 dark:hover:bg-signal/20 border border-signal/30 dark:border-signal/40 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('company.dashboard.newOffer')}
              </Link>
            ) : (
              <Link
                to="/company/profile?tab=verification"
                title="Vérification requise pour publier des offres"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                Vérification requise
              </Link>
            )}
          </div>
        </div>

   
      </div>

      {/* ── 4 KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-2xs hover:border-signal/40 dark:hover:border-signal/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t('company.dashboard.activeOffers')}</span>
            <div className="w-8 h-8 bg-[#E6F7F5] text-signal dark:text-cyan-400 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{stats.active}</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{t('company.dashboard.online')}</div>
        </div>

        <div className="bg-white border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-2xs hover:border-[#D4A72C]/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t('company.dashboard.applications')}</span>
            <div className="w-8 h-8 bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{stats.applications}</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{t('company.dashboard.total')}</div>
        </div>

        <div className="bg-white border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-2xs hover:border-[#4F46E5]/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t('company.dashboard.allOffers')}</span>
            <div className="w-8 h-8 bg-[#EEF2FF] text-[#4F46E5] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-[#4F46E5] tracking-tight">{stats.total}</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{t('company.dashboard.published')}</div>
        </div>

        <div className="bg-white border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-2xs hover:border-[#059669]/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t('company.dashboard.recent')}</span>
            <div className="w-8 h-8 bg-[#ECFDF5] text-[#059669] rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-[#059669] tracking-tight">{stats.recent}</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{t('company.dashboard.thisWeek')}</div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-5">
          {/* Candidatures reçues */}
          <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-signal dark:text-cyan-400" />
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">{t('company.dashboard.receivedApplications')}</h2>
              </div>
              <Link
                to="/company/applications"
                className="text-xs font-bold text-signal dark:text-cyan-400 hover:underline flex items-center gap-0.5"
              >
                {t('company.dashboard.management')} ({recentApplications.length}) <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentApplications.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <Users className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{t('company.dashboard.noApplications')}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 mb-3">{t('company.dashboard.createOffer')}</p>
                {profile?.verified ? (
                  <Link
                    to="/company/offers/new"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-signal dark:bg-cyan-600 text-white text-xs font-bold rounded-lg hover:bg-[#115E59] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t('company.dashboard.createOffer')}
                  </Link>
                ) : (
                  <Link
                    to="/company/profile?tab=verification"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-all"
                  >
                    <Lock className="w-3.5 h-3.5" /> Vérifier mon entreprise
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {recentApplications.slice(0, 4).map((app) => (
                  <div
                    key={app.id}
                    onClick={() => navigate('/company/applications')}
                    className="flex items-center justify-between p-3 rounded-xl border border-[#F1F5F9] hover:border-signal dark:border-cyan-600/40 hover:bg-slate-100 dark:bg-slate-800 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-signal dark:text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-signal dark:text-cyan-400 transition-colors truncate">
                          {app.candidateFirstName} {app.candidateLastName}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{app.offerTitle}</span>
                          <span>•</span>
                          <span>{app.dateSoumission ? new Date(app.dateSoumission).toLocaleDateString('fr-FR') : 'Récemment'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {app.matchingScore !== undefined && (
                        <MatchingBadge score={app.matchingScore} size="sm" />
                      )}
                      <StatusBadge status={app.status || app.statut} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Offres actives */}
          <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">{t('company.dashboard.activeOffers')}</h2>
             
              </div>
              <Link
                to="/company/offers"
                className="text-xs font-bold text-signal dark:text-cyan-400 hover:underline flex items-center gap-0.5"
              >
                {t('company.dashboard.management')} <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {offers.filter((o) => (o.statut || o.status) === 'ACTIVE').length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <Search className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{t('company.dashboard.noActiveOffers')}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 mb-3">{t('company.dashboard.createOffer')}</p>
                {profile?.verified ? (
                  <Link
                    to="/company/offers/new"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-signal dark:bg-cyan-600 text-white text-xs font-bold rounded-lg hover:bg-[#115E59] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t('company.dashboard.createOffer')}
                  </Link>
                ) : (
                  <Link
                    to="/company/profile?tab=verification"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-all"
                  >
                    <Lock className="w-3.5 h-3.5" /> Vérifier mon entreprise
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {offers.filter((o) => (o.statut || o.status) === 'ACTIVE').slice(0, 4).map((offer) => (
                  <div
                    key={offer.id}
                    onClick={() => navigate(`/company/offers/${offer.id}/edit`)}
                    className="p-3.5 rounded-xl border border-[#F1F5F9] hover:border-signal dark:border-cyan-600/40 hover:bg-slate-100 dark:bg-slate-800 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E6F7F5] text-signal dark:text-cyan-400">
                          {offer.typeContrat || 'CDI'}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-signal dark:text-cyan-400 transition-colors line-clamp-1">
                        {offer.title}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-600 mt-1.5">
                        <MapPin className="w-3 h-3 text-signal dark:text-cyan-400" />
                        <span>{offer.localisation || 'Tunis'}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        {offer.applicationCount || 0} candidature{(offer.applicationCount || 0) !== 1 ? 's' : ''}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white group-hover:text-signal dark:text-cyan-400 flex items-center gap-0.5">
                        Gérer <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Stats rapides */}
          <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#059669]" />
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">{t('company.dashboard.statistics')}</h3>
              </div>
              <Link
                to="/company/stats"
                className="text-xs font-bold text-signal dark:text-cyan-400 hover:underline"
              >
                Voir plus
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Offres publiées</span>
                <span className="font-bold text-signal dark:text-cyan-400">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Candidatures totales</span>
                <span className="font-bold text-signal dark:text-cyan-400">{stats.applications}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Offres actives</span>
                <span className="font-bold text-signal dark:text-cyan-400">{stats.active}</span>
              </div>
            </div>
          </div>

          {/* Raccourcis */}
          <div className="space-y-2">
            {/* Notifications récentes */}
            {notifications.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    Notifications récentes
                  </h3>
                  <Link to="/company/notifications" className="text-xs font-bold text-signal dark:text-cyan-400 hover:underline">
                    Voir tout
                  </Link>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {notifications.slice(0, 3).map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-signal dark:hover:border-signal/40 transition-colors cursor-pointer group"
                      onClick={() => navigate(notif.link || '/company/applications')}
                    >
                      <div className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5" style={{
                        backgroundColor: notif.read ? '#94a3b8' : '#0f766e'
                      }} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold ${notif.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString('fr-FR', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Link
              to="/company/applications"
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:border-signal dark:border-cyan-600 hover:bg-[#F0FDFA] transition-all group"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-signal dark:text-cyan-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-signal dark:text-cyan-400">Gérer les candidatures</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-signal dark:text-cyan-400" />
            </Link>

            <Link
              to="/company/notifications"
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:border-signal dark:border-cyan-600 hover:bg-[#F0FDFA] transition-all group"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-signal dark:text-cyan-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-signal dark:text-cyan-400">Notifications</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-signal dark:text-cyan-400" />
            </Link>

            <Link
              to="/company/settings"
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:border-signal dark:border-cyan-600 hover:bg-[#F0FDFA] transition-all group"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-signal dark:text-cyan-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-signal dark:text-cyan-400">Paramètres</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-signal dark:text-cyan-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* IA Assistant Card - Full Width */}
  {/* Assistant IA - Full Width */}
<div className="bg-white border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xs">
  <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-[#E6F7F5] text-signal dark:text-cyan-400 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">Assistant IA</h3>
         
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
          Aide à la rédaction d'offres et synthèse de dossiers de candidats.
        </p>
      </div>
    </div>
    <Link
      to="/company/ai-assistant"
      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-signal dark:text-cyan-400 bg-[#F0FDFA] hover:bg-[#CCF0EB] border border-signal dark:border-cyan-600/30 transition-all flex-shrink-0"
    >
      Accéder
      <ChevronRight className="w-3.5 h-3.5" />
    </Link>
  </div>
</div>
      </div>
    </div>
  );
};

export default DashboardCompany;

