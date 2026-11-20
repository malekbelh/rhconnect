import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Briefcase,
  Sparkles,
  UserPlus,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronRight,
  TrendingUp,
  MapPin,
  Building2,
  ArrowUpRight,
  Layers,
  GraduationCap,
  Edit3,
  Info,
  Bell,
  Calendar,
  XCircle,
  ShieldAlert,
} from 'lucide-react';
// import { useNotifications } from '../../context/NotificationsContext';
import {
  getMyApplications,
  getMyVerification,
  getAIConseilsProfil,
  getOffers,
  getProfile,
} from '../../api/candidate.api';
import StatusBadge from '../../components/ui/StatusBadge';
import { ApplicationStatus, VerificationStatus } from '../../types';
import MatchingBadge from '../../components/offer/MatchingBadge';
import { useAuth } from '../../context/AuthContext';
import { useCandidateProfile } from '../../context/CandidateProfileContext';

/* ── helpers ─────────────────────────────────────────────────────────── */
interface CompletionItem {
  label: string;
  done: boolean;
  link: string;
  tab?: string;
}

const buildCompletion = (profile: any): { score: number; items: CompletionItem[] } => {
  const items: CompletionItem[] = [
    {
      label: 'Nom et prénom renseignés',
      done: !!(profile?.firstName && profile?.lastName),
      link: '/candidate/profile',
      tab: 'infos',
    },
    {
      label: 'Numéro de téléphone (+216)',
      done: !!profile?.phone,
      link: '/candidate/profile',
      tab: 'infos',
    },
    {
      label: 'Ville / Localisation',
      done: !!profile?.address,
      link: '/candidate/profile',
      tab: 'infos',
    },
    {
      label: 'Bio / pitch professionnel',
      done: !!profile?.bio,
      link: '/candidate/profile',
      tab: 'infos',
    },
    {
      label: 'Au moins 3 compétences ajoutées',
      done: (profile?.competences?.length ?? 0) >= 3,
      link: '/candidate/profile',
      tab: 'competences',
    },
    {
      label: 'Une expérience professionnelle',
      done: (profile?.parcours?.length ?? 0) >= 1,
      link: '/candidate/profile',
      tab: 'parcours',
    },
    {
      label: 'Une formation / diplôme',
      done: (profile?.formations?.length ?? 0) >= 1,
      link: '/candidate/profile',
      tab: 'formations',
    },
    {
      label: 'CV téléversé (PDF)',
      done: !!profile?.cvFileName,
      link: '/candidate/profile',
      tab: 'cv',
    },
  ];

  const done = items.filter((i) => i.done).length;
  return { score: Math.round((done / items.length) * 100), items };
};

const _getNotifIcon = (type: string) => {
  // Used for future notification rendering if needed
  switch (type) {
    case 'INTERVIEW_SCHEDULED':
      return <Calendar className="w-4 h-4 text-signal dark:text-cyan-400" />;
    case 'APPLICATION_ACCEPTED':
      return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    case 'APPLICATION_REFUSED':
      return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
    case 'VERIFICATION_REJECTED':
      return <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />;
    case 'VERIFICATION_VALIDATED':
      return <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    case 'OFFER_RECOMMENDED':
      return <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
    default:
      return <Bell className="w-4 h-4 text-signal dark:text-cyan-400" />;
  }
};

// Helper to format timestamps - used for future notification timestamps if needed
const _formatTimeAgo = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} j`;
  } catch {
    return '';
  }
};

/* ── component ───────────────────────────────────────────────────────── */
const DashboardCandidat: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { photoBlobUrl, profile: ctxProfile, refreshProfile } = useCandidateProfile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [verification, setVerification] = useState<any>(null);
  const [recommendedOffers, setRecommendedOffers] = useState<any[]>([]);
  const [showAIConseils, setShowAIConseils] = useState(false);
  const [aiConseils, setAiConseils] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAllMissing, setShowAllMissing] = useState(false);

  const fallbackFirstName = (profile?.firstName || ctxProfile?.firstName || user?.firstName || '');
  const fallbackLastName = (profile?.lastName || ctxProfile?.lastName || user?.lastName || '');
  const displayFullName = `${fallbackFirstName} ${fallbackLastName}`.trim();
  const initials = `${fallbackFirstName.charAt(0)}${fallbackLastName.charAt(0)}`.toUpperCase() || 'CV';

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [prof, apps, verif, offersRes] = await Promise.all([
          getProfile().catch(() => null),
          getMyApplications().catch(() => []),
          getMyVerification().catch(() => null),
          getOffers({ limit: 4 }).catch(() => ({ data: [] })),
        ]);
        setProfile(prof);
        setApplications(apps);
        setVerification(verif);
        setRecommendedOffers(offersRes.data || []);
        if (prof) refreshProfile();
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement de votre tableau de bord');
      } finally {
        setLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusCounts = () => {
    const total = applications.length;
    const enCours = applications.filter(
      (a) =>
        a.status === ApplicationStatus.POSTULE ||
        a.status === ApplicationStatus.RECU ||
        a.status === ApplicationStatus.EN_VERIFICATION ||
        a.status === ApplicationStatus.VERIFIE ||
        a.status === ApplicationStatus.TRANSMIS
    ).length;
    const entretien = applications.filter((a) => a.status === ApplicationStatus.ENTRETIEN).length;
    const accepte = applications.filter((a) => a.status === ApplicationStatus.ACCEPTE).length;
    return { total, enCours, entretien, accepte };
  };

  const handleAIConseils = async () => {
    try {
      setAiLoading(true);
      const conseils = await getAIConseilsProfil();
      setAiConseils(conseils);
      setShowAIConseils(true);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération des conseils IA');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12">
        <div className="flex flex-col items-center justify-center py-16 gap-2.5">
          <Loader2 className="w-8 h-8 text-signal dark:text-cyan-400 animate-spin" />
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  const counts = getStatusCounts();
  const isVerified =
    verification?.statusGlobal === 'VALIDE' ||
    verification?.statusGlobal === 'VERIFIE' ||
    verification?.statut === 'VALIDE' ||
    verification?.statut === 'VERIFIE' ||
    verification?.statusGlobal === VerificationStatus.VERIFIE;

  const isVerifRejected =
    verification?.statusGlobal === 'REJETE' || verification?.statusGlobal === VerificationStatus.REJETE;

  const { score: completionScore, items: completionItems } = buildCompletion(profile);
  const missingItems = completionItems.filter((i) => !i.done);
  const visibleMissing = showAllMissing ? missingItems : missingItems.slice(0, 3);

  /* Alertes dynamiques */
  const alerts: { icon: React.ReactNode; text: string; link: string; color: string }[] = [];
  if (completionScore < 100) {
    alerts.push({
      icon: <Info className="w-3.5 h-3.5 flex-shrink-0" />,
      text: `Votre profil est complété à ${completionScore}%. Un profil complet est 3× plus visible.`,
      link: '/candidate/profile',
      color: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400',
    });
  }
  if (isVerifRejected) {
    alerts.push({
      icon: <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />,
      text: 'Une pièce de votre dossier a été rejetée. Consultez la section Vérification pour la corriger.',
      link: '/candidate/verification',
      color: 'bg-red-50 border-red-200 text-rose-600 dark:text-rose-400',
    });
  }
  if (!isVerified && !isVerifRejected) {
    alerts.push({
      icon: <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />,
      text: 'Obtenez le badge Certifié en déposant vos pièces justificatives.',
      link: '/candidate/verification',
      color: 'bg-emerald-50 dark:bg-signal/10 border-emerald-200 dark:border-signal/30 text-signal dark:text-cyan-400',
    });
  }

  return (
    <div className="max-w-7xl mx-auto py-5 space-y-5">
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
        </div>
      )}

      {/* ── Alertes dynamiques ── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <Link
              key={i}
              to={a.link}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold ${a.color} hover:opacity-90 transition-opacity`}
            >
              {a.icon}
              <span>{a.text}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-auto flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* ── En-tête profil ── */}
      <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-[#172A3A] border border-[#243E54] text-amber-500 dark:text-amber-400 flex items-center justify-center font-display font-extrabold text-xl shadow-xs overflow-hidden">
                {photoBlobUrl ? (
                  <img
                    src={photoBlobUrl}
                    alt={displayFullName || 'Photo de profil'}
                    className="w-14 h-14 object-cover rounded-2xl"
                  />
                ) : (
                  <>{initials.charAt(0) || 'C'}{initials.charAt(1) || 'V'}</>
                )}
              </div>
              {isVerified && (
                <div
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xs border-2 border-white"
                  title="Dossier Certifié Conforme"
                >
                  <ShieldCheck className="w-3 h-3" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {displayFullName || 'Candidat'}
                </h1>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-[#059669] border border-emerald-200 dark:border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> Dossier Certifié Conforme
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                    <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> En cours de vérification
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1.5 flex-wrap">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {profile?.bio?.split('•')[0] || 'Complétez votre profil'}
                </span>
                {profile?.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-signal dark:text-cyan-400" />
                    {profile.address}
                  </span>
                )}
                {profile?.formations?.[0]?.ecole && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-signal dark:text-cyan-400" />
                    {profile.formations[0].ecole}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-center flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#F1F5F9] w-full lg:w-auto justify-end">
            <Link
              to="/candidate/profile"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              Modifier mon profil
            </Link>

            <button
              onClick={handleAIConseils}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-signal dark:text-cyan-400 bg-emerald-50 dark:bg-signal/10 hover:bg-emerald-200 dark:bg-emerald-500/30 border border-signal dark:border-cyan-600/30 transition-all cursor-pointer disabled:opacity-70"
            >
              {aiLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Conseils IA
            </button>
          </div>
        </div>

        {/* ── Indicateur de complétude ── */}
        <div className="mt-4 pt-3.5 border-t border-[#F1F5F9]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Complétion du profil
            </span>
            <span
              className={`text-xs font-extrabold ${completionScore === 100 ? 'text-[#059669]' : completionScore >= 60 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                }`}
            >
              {completionScore}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${completionScore === 100
                ? 'bg-gradient-to-r from-[#059669] to-[#34D399]'
                : completionScore >= 60
                  ? 'bg-gradient-to-r from-[#D4A72C] to-[#FBBF24]'
                  : 'bg-gradient-to-r from-[#E11D48] to-[#FB7185]'
                }`}
              style={{ width: `${completionScore}%` }}
            />
          </div>

          {missingItems.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Éléments manquants ({missingItems.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {visibleMissing.map((item) => (
                  <Link
                    key={item.label}
                    to={`${item.link}${item.tab ? `?tab=${item.tab}` : ''}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:border-signal dark:border-cyan-600 hover:bg-emerald-50 dark:bg-signal/10 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-signal dark:text-cyan-400 transition-all"
                  >
                    <AlertCircle className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                    {item.label}
                  </Link>
                ))}
                {missingItems.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllMissing((v) => !v)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-signal dark:text-cyan-400 hover:border-signal dark:border-cyan-600 transition-all"
                  >
                    {showAllMissing ? 'Masquer' : `+${missingItems.length - 3} de plus`}
                  </button>
                )}
              </div>
            </div>
          )}

          {completionScore === 100 && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#059669] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Profil 100% complété — Vous êtes prioritaire dans les résultats de recherche.
            </div>
          )}
        </div>
      </div>

      {/* ── 4 KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-2xs hover:border-signal dark:border-cyan-600/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Total Postulé</span>
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 text-signal dark:text-cyan-400 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{counts.total}</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Candidatures actives</div>
        </div>

        <div className="bg-white border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-2xs hover:border-[#D4A72C]/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">En cours</span>
            <div className="w-8 h-8 bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{counts.enCours}</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">En cours de traitement</div>
        </div>

        <div className="bg-white border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-2xs hover:border-[#4F46E5]/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Entretiens</span>
            <div className="w-8 h-8 bg-[#EEF2FF] text-[#4F46E5] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-[#4F46E5] tracking-tight">{counts.entretien}</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Entretiens prévus</div>
        </div>

        <div className="bg-white border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-2xs hover:border-[#059669]/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Acceptées</span>
            <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 text-[#059669] rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-[#059669] tracking-tight">{counts.accepte}</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Offres confirmées</div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-5">
          {/* Candidatures récentes */}
          <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-signal dark:text-cyan-400" />
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">Mes candidatures récentes</h2>
              </div>
              <Link
                to="/candidate/applications"
                className="text-xs font-bold text-signal dark:text-cyan-400 hover:underline flex items-center gap-0.5"
              >
                Tout afficher ({applications.length}) <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <Briefcase className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Aucune candidature soumise</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 mb-3">Découvrez les offres actives adaptées à votre profil.</p>
                <Link
                  to="/candidate/offers"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-signal dark:bg-cyan-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 dark:bg-signal transition-all"
                >
                  <Search className="w-3.5 h-3.5" /> Voir les offres
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {applications.slice(0, 4).map((app) => (
                  <div
                    key={app.id}
                    onClick={() => navigate('/candidate/applications')}
                    className="flex items-center justify-between p-3 rounded-xl border border-[#F1F5F9] hover:border-signal dark:border-cyan-600/40 hover:bg-slate-100 dark:bg-slate-800 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-signal dark:text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-signal dark:text-cyan-400 transition-colors truncate">
                          {app.offerTitle || "Offre d'emploi"}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{app.companyName}</span>
                          <span>•</span>
                          <span>{app.dateSoumission ? new Date(app.dateSoumission).toLocaleDateString('fr-FR') : 'Récemment'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {app.matchingScore !== undefined && (
                        <MatchingBadge score={app.matchingScore} size="sm" />
                      )}
                      <StatusBadge status={app.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Opportunités recommandées */}
          <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">Opportunités recommandées</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-500/30">
                  Basées sur votre profil
                </span>
              </div>
              <Link
                to="/candidate/offers"
                className="text-xs font-bold text-signal dark:text-cyan-400 hover:underline flex items-center gap-0.5"
              >
                Toutes les offres <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recommendedOffers.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <Search className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Aucune offre disponible</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 mb-3">Complétez votre profil pour obtenir des recommandations personnalisées.</p>
                <Link
                  to="/candidate/offers"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-signal dark:bg-cyan-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 dark:bg-signal transition-all"
                >
                  <Search className="w-3.5 h-3.5" /> Explorer les offres
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendedOffers.slice(0, 4).map((offer) => (
                  <div
                    key={offer.id}
                    onClick={() => navigate(`/candidate/offers/${offer.id}`)}
                    className="p-3.5 rounded-xl border border-[#F1F5F9] hover:border-signal dark:border-cyan-600/40 hover:bg-slate-100 dark:bg-slate-800 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-signal dark:text-cyan-400">
                          {offer.typeContrat || 'CDI'}
                        </span>
                        {offer.matchingScore !== undefined && (
                          <MatchingBadge score={offer.matchingScore} size="sm" />
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-signal dark:text-cyan-400 transition-colors line-clamp-1">
                        {offer.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">{offer.companyName}</p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-600 mt-1.5">
                        <MapPin className="w-3 h-3 text-signal dark:text-cyan-400" />
                        <span>{offer.localisation || 'Tunis'}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-signal dark:text-cyan-400">
                        {offer.salaireMin && offer.salaireMax
                          ? `${offer.salaireMin} - ${offer.salaireMax} TND`
                          : 'Salaire attractif'}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white group-hover:text-signal dark:text-cyan-400 flex items-center gap-0.5">
                        Postuler <ArrowUpRight className="w-3 h-3" />
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
          {/* Dossier de confiance */}
          <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#059669]" />
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">Dossier de confiance</h3>
              </div>
              <StatusBadge
                status={verification?.statusGlobal || verification?.statut || VerificationStatus.NON_VERIFIE}
                size="sm"
              />
            </div>

            <div className="p-3 rounded-xl bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] border border-slate-200 dark:border-slate-700 mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isVerified ? 'bg-emerald-50 dark:bg-emerald-500/10 text-[#059669]' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400'
                    }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    {isVerified ? 'Dossier 100% Certifié' : 'Dossier en attente de pièces'}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-tight">
                    {isVerified
                      ? 'Pièces officielles vérifiées. Candidatures prioritaires.'
                      : 'Téléversez vos pièces pour obtenir le badge vérifié.'}
                  </p>
                </div>
              </div>
            </div>

            {verification?.pieces && verification.pieces.length > 0 ? (
              <div className="space-y-1.5 text-xs">
                {verification.pieces.slice(0, 3).map((p: any, i: number) => {
                  const ok = p.status === 'VERIFIE' || p.status === 'VALIDE';
                  const rejected = p.status === 'REJETE';
                  return (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 text-[11px]">
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{p.nomFichier || p.type}</span>
                      {ok ? (
                        <span className="text-[#059669] font-bold flex items-center gap-1 flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Validé
                        </span>
                      ) : rejected ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 flex-shrink-0">
                          <AlertCircle className="w-3 h-3" /> Rejeté
                        </span>
                      ) : (
                        <span className="text-amber-500 dark:text-amber-400 font-bold flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-3 h-3" /> En attente
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1.5 text-xs">
                {[
                  "Pièce d'identité (CIN/Passeport)",
                  'Diplôme le plus élevé',
                  'Certification professionnelle',
                ].map((label) => (
                  <div key={label} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 text-[11px]">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{label}</span>
                    <span className="text-slate-400 dark:text-slate-600 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> À déposer
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/candidate/verification"
              className="mt-3 w-full py-2 text-center block rounded-xl text-xs font-bold text-signal dark:text-cyan-400 bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:bg-emerald-500/30 transition-colors"
            >
              Gérer mes pièces →
            </Link>
          </div>

          {/* Accès rapides */}
          <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-3">Accès rapides</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { to: '/candidate/profile', icon: UserPlus, label: 'Mon Profil', sub: 'CV & Infos', color: 'bg-emerald-100 dark:bg-emerald-500/20 text-signal dark:text-cyan-400' },
                { to: '/candidate/offers', icon: Search, label: 'Offres', sub: 'Rechercher', color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400' },
                { to: '/candidate/applications', icon: Briefcase, label: 'Suivi', sub: 'Candidatures', color: 'bg-[#EEF2FF] text-[#4F46E5]' },
                { to: '/candidate/ai-assistant', icon: Sparkles, label: 'IA Coach', sub: 'Lettre & Tips', color: 'bg-emerald-50 dark:bg-emerald-500/10 text-[#059669]' },
              ].map(({ to, icon: Icon, label, sub, color }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-signal dark:border-cyan-600 hover:bg-emerald-50 dark:bg-signal/10 transition-all group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{label}</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">{sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal IA ── */}
      {showAIConseils && aiConseils && (
        <div className="fixed inset-0 bg-[#172A3A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-[#F1F5F9] flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-[#0F766E] to-[#14B8A6] rounded-lg flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Conseils IA Personnalisés</h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Impact potentiel :{' '}
                    <span className="font-bold text-signal dark:text-cyan-400">+{aiConseils.scoreAmelioration}%</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAIConseils(false)}
                className="w-7 h-7 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-2.5">
              {aiConseils.conseils.map((c: string, i: number) => (
                <div key={i} className="flex gap-3 p-3 bg-emerald-50 dark:bg-signal/10 border border-[#CCF0EB] rounded-xl">
                  <span className="w-5 h-5 bg-signal dark:bg-cyan-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-[#134E4A] leading-relaxed font-medium">{c}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-[#F1F5F9] bg-slate-100 dark:bg-slate-800 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setShowAIConseils(false)}
                className="px-4 py-2 bg-[#172A3A] text-white text-xs font-bold rounded-lg hover:bg-[#1E3A52] transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export helper functions for use in other components
export { _getNotifIcon as getNotifIcon, _formatTimeAgo as formatTimeAgo };

export default DashboardCandidat;

