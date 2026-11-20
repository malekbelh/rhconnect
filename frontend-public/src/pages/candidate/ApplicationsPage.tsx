import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  Trash2,
  AlertCircle,
  Search,
  Clock,
  ArrowUpRight,
  ArrowDownUp,
  X,
} from 'lucide-react';
import { getMyApplications, getApplicationTimeline } from '../../api/candidate.api';
import client from '../../api/client';
import StatusBadge from '../../components/ui/StatusBadge';
import MatchingBadge from '../../components/offer/MatchingBadge';
import TimelineSteps from '../../components/application/TimelineSteps';
import { ApplicationStatus } from '../../types';

const WITHDRAWABLE_STATUSES = ['POSTULE', 'RECU'];

type SortKey = 'date_desc' | 'date_asc' | 'score_desc' | 'company_asc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date_desc', label: 'Date (récent → ancien)' },
  { value: 'date_asc',  label: 'Date (ancien → récent)' },
  { value: 'score_desc', label: 'Score de matching (↓)' },
  { value: 'company_asc', label: 'Entreprise (A → Z)' },
];

const STATUS_CHIPS = [
  { id: 'ALL',         label: 'Toutes'     },
  { id: 'IN_PROGRESS', label: 'En cours'   },
  { id: 'INTERVIEW',   label: 'Entretiens' },
  { id: 'ACCEPTED',    label: 'Acceptées'  },
  { id: 'REJECTED',    label: 'Refusées'   },
] as const;

type StatusChipId = typeof STATUS_CHIPS[number]['id'];

const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [timelines, setTimelines] = useState<Record<string, any[]>>({});
  const [loadingTimeline, setLoadingTimeline] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Filtres
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusChipId>('ALL');
  const [companyFilter, setCompanyFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date_desc');

  useEffect(() => {
    getMyApplications()
      .then(setApplications)
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (appId: string) => {
    if (expandedId === appId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(appId);
    if (!timelines[appId]) {
      try {
        setLoadingTimeline(appId);
        const t = await getApplicationTimeline(appId);
        setTimelines((prev) => ({ ...prev, [appId]: t }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTimeline(null);
      }
    }
  };

  const handleWithdraw = async (appId: string) => {
    if (!window.confirm('Retirer cette candidature ? Cette action est irréversible.')) return;
    try {
      setWithdrawingId(appId);
      setWithdrawError(null);
      await client.delete(`/applications/${appId}`);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      if (expandedId === appId) setExpandedId(null);
    } catch (err: any) {
      setWithdrawError(
        err.response?.data?.message || 'Impossible de retirer la candidature pour le moment.'
      );
    } finally {
      setWithdrawingId(null);
    }
  };

  // Liste des entreprises uniques pour le filtre
  const companies = useMemo(
    () => [...new Set(applications.map((a) => a.companyName).filter(Boolean))].sort(),
    [applications]
  );

  // Compteurs par chip
  const statusCounts = useMemo(() => {
    const inProgress = (a: any) =>
      [ApplicationStatus.POSTULE, ApplicationStatus.RECU, ApplicationStatus.EN_VERIFICATION,
       ApplicationStatus.VERIFIE, ApplicationStatus.TRANSMIS].includes(a.status);
    return {
      ALL: applications.length,
      IN_PROGRESS: applications.filter(inProgress).length,
      INTERVIEW: applications.filter((a) => a.status === ApplicationStatus.ENTRETIEN).length,
      ACCEPTED: applications.filter((a) => a.status === ApplicationStatus.ACCEPTE).length,
      REJECTED: applications.filter((a) => a.status === ApplicationStatus.REFUSE).length,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const q = search.toLowerCase();

    let result = applications.filter((app) => {
      // Recherche texte
      const matchSearch =
        (app.offerTitle || '').toLowerCase().includes(q) ||
        (app.companyName || '').toLowerCase().includes(q);
      if (!matchSearch) return false;

      // Filtre entreprise
      if (companyFilter && app.companyName !== companyFilter) return false;

      // Filtre statut
      if (statusFilter === 'IN_PROGRESS')
        return [ApplicationStatus.POSTULE, ApplicationStatus.RECU,
                ApplicationStatus.EN_VERIFICATION, ApplicationStatus.VERIFIE,
                ApplicationStatus.TRANSMIS].includes(app.status);
      if (statusFilter === 'INTERVIEW') return app.status === ApplicationStatus.ENTRETIEN;
      if (statusFilter === 'ACCEPTED')  return app.status === ApplicationStatus.ACCEPTE;
      if (statusFilter === 'REJECTED')  return app.status === ApplicationStatus.REFUSE;

      return true;
    });

    // Tri
    result = [...result].sort((a, b) => {
      if (sortKey === 'date_desc')
        return new Date(b.dateSoumission || 0).getTime() - new Date(a.dateSoumission || 0).getTime();
      if (sortKey === 'date_asc')
        return new Date(a.dateSoumission || 0).getTime() - new Date(b.dateSoumission || 0).getTime();
      if (sortKey === 'score_desc')
        return (b.matchingScore ?? 0) - (a.matchingScore ?? 0);
      if (sortKey === 'company_asc')
        return (a.companyName || '').localeCompare(b.companyName || '');
      return 0;
    });

    return result;
  }, [applications, search, statusFilter, companyFilter, sortKey]);

  const hasActiveFilters = search || statusFilter !== 'ALL' || companyFilter;

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setCompanyFilter('');
    setSortKey('date_desc');
  };

  return (
    <div className="max-w-7xl mx-auto py-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#172A3A]">
            Mes candidatures ({applications.length})
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Suivez l'avancée de vos dossiers en temps réel. Cliquez sur une candidature pour voir la timeline détaillée.
          </p>
        </div>
        <Link
          to="/candidate/offers"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl font-bold text-xs shadow-xs transition-all self-start md:self-center"
        >
          <Search className="w-4 h-4" /> Parcourir les offres
        </Link>
      </div>

      {/* Error alert */}
      {withdrawError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-sm text-danger-600">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{withdrawError}</span>
          </div>
          <button
            className="text-danger-400 hover:text-danger-600 font-bold"
            onClick={() => setWithdrawError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Barre de filtres ── */}
      {/* ── Barre de filtres — tout sur une ligne ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-3 flex flex-wrap items-center gap-2">

        {/* Recherche */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Poste ou entreprise..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#CBD5E1] text-sm font-medium text-[#172A3A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
          />
        </div>

        {/* Séparateur */}
        <div className="w-px h-7 bg-[#E2E8F0] hidden sm:block" />

        {/* Chips statut */}
        {STATUS_CHIPS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setStatusFilter(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === id
                ? 'bg-[#172A3A] text-white shadow-xs'
                : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#172A3A] hover:bg-[#E2E8F0]'
            }`}
          >
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold leading-none ${
              statusFilter === id ? 'bg-white/20 text-white' : 'bg-[#E2E8F0] text-[#64748B]'
            }`}>
              {statusCounts[id]}
            </span>
          </button>
        ))}

        {/* Séparateur */}
        <div className="w-px h-7 bg-[#E2E8F0] hidden sm:block" />

        {/* Tri */}
        <div className="relative">
          <ArrowDownUp className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="pl-8 pr-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#172A3A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Entreprise */}
        <div className="relative">
          <Building2 className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#172A3A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] appearance-none cursor-pointer"
          >
            <option value="">Toutes les entreprises</option>
            {companies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Reset — visible si filtre actif */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#E11D48] bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer whitespace-nowrap"
          >
            <X className="w-3.5 h-3.5" />
            Effacer ({filteredApplications.length}/{applications.length})
          </button>
        )}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
          <p className="text-xs text-[#64748B]">Chargement de vos candidatures...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#E2E8F0] rounded-3xl p-12 text-center">
          <FileText className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="font-bold text-[#172A3A] text-base">Aucune candidature trouvée</h3>
          <p className="text-xs text-[#64748B] mt-1 mb-5">
            {search || statusFilter !== 'ALL'
              ? 'Modifiez vos critères de recherche pour afficher des résultats.'
              : 'Vous n’avez pas encore postulé à une offre. Consultez les opportunités disponibles dès maintenant.'}
          </p>
          <Link
            to="/candidate/offers"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F766E] text-white text-xs font-bold rounded-xl hover:bg-[#115E59] transition-all shadow-xs"
          >
            <Search className="w-4 h-4" /> Découvrir les offres
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const isExpanded = expandedId === app.id;
            const canWithdraw = WITHDRAWABLE_STATUSES.includes(app.status);

            return (
              <div
                key={app.id}
                className="bg-white border border-[#E2E8F0] rounded-3xl shadow-xs hover:border-[#0F766E]/40 transition-all overflow-hidden"
              >
                {/* Application Main Row */}
                <div
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                  onClick={() => toggleExpand(app.id)}
                >
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] border border-[#E2E8F0] text-[#0F766E] flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <Building2 className="w-6 h-6" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-display font-bold text-base text-[#172A3A] truncate hover:text-[#0F766E] transition-colors">
                          {app.offerTitle || 'Offre d\'emploi'}
                        </h3>
                        {app.matchingScore !== undefined && (
                          <MatchingBadge score={app.matchingScore} size="sm" />
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#64748B] flex-wrap">
                        <span className="font-semibold text-[#334155]">{app.companyName || 'Entreprise'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Postulé le {app.dateSoumission ? new Date(app.dateSoumission).toLocaleDateString('fr-FR') : 'Récemment'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                    <StatusBadge status={app.status} />
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B] transition-colors"
                      title={isExpanded ? 'Réduire' : 'Afficher les détails'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="border-t border-[#F1F5F9] bg-[#F8FAFC] p-6 sm:p-7 space-y-6 animate-in fade-in duration-200">
                    {/* Timeline */}
                    <div>
                      <h4 className="text-xs font-bold text-[#172A3A] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#0F766E]" />
                        Progression du dossier
                      </h4>

                      {loadingTimeline === app.id ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-[#0F766E]" />
                        </div>
                      ) : (
                        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
                          <TimelineSteps
                            currentStatus={app.status}
                            timeline={timelines[app.id]}
                          />
                        </div>
                      )}
                    </div>

                    {/* Motivation letter snippet */}
                    {app.lettreMotivation && (
                      <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0]">
                        <h4 className="text-xs font-bold text-[#172A3A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-[#0F766E]" />
                          Lettre de motivation transmise
                        </h4>
                        <p className="text-xs text-[#334155] leading-relaxed whitespace-pre-line italic bg-[#F8FAFC] p-4 rounded-xl border border-[#F1F5F9]">
                          "{app.lettreMotivation}"
                        </p>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <Link
                        to={`/candidate/offers/${app.offerId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
                      >
                        Consulter la fiche de l'offre <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>

                      {canWithdraw && (
                        <button
                          onClick={() => handleWithdraw(app.id)}
                          disabled={withdrawingId === app.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-danger-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {withdrawingId === app.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Retirer ma candidature
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;
