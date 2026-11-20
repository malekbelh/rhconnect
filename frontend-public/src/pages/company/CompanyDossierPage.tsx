import React, { useEffect, useState } from 'react';
import {
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { getMyOffers, getOfferApplications, updateApplicationStatus } from '../../api/company.api';
import MatchingBadge from '../../components/offer/MatchingBadge';

interface DossierEntry {
  id: string;
  offerId: string;
  offerTitle: string;
  candidateFirstName?: string;
  candidateLastName?: string;
  candidatName?: string;
  lettreMotivation?: string;
  status?: string;
  statut?: string;
  matchingScore?: number;
  createdAt?: string;
  dateSoumission?: string;
  verificationStatus?: string;
}

const PIPELINE_STATUTS = [
  { key: 'POSTULE', label: 'Postulé', color: 'bg-[#F8FAFC]', textColor: 'text-[#64748B]', icon: FileText },
  { key: 'RECU', label: 'Reçu', color: 'bg-blue-50', textColor: 'text-blue-600', icon: Clock },
  { key: 'EN_VERIFICATION', label: 'En vérif.', color: 'bg-amber-50', textColor: 'text-amber-600', icon: ShieldCheck },
  { key: 'VERIFIE', label: 'Vérifié', color: 'bg-emerald-50', textColor: 'text-emerald-600', icon: CheckCircle2 },
  { key: 'TRANSMIS', label: 'Transmis', color: 'bg-indigo-50', textColor: 'text-indigo-600', icon: Users },
  { key: 'ENTRETIEN', label: 'Entretien', color: 'bg-purple-50', textColor: 'text-purple-600', icon: Users },
  { key: 'ACCEPTE', label: 'Accepté', color: 'bg-emerald-50', textColor: 'text-emerald-600', icon: CheckCircle2 },
  { key: 'REFUSE', label: 'Refusé', color: 'bg-red-50', textColor: 'text-red-600', icon: XCircle },
];

const CompanyDossierPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dossiers, setDossiers] = useState<DossierEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [offerFilter, setOfferFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [offers, setOffers] = useState<{ id: string; title: string }[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const myOffers = await getMyOffers();
      setOffers(myOffers.map((o) => ({ id: o.id, title: o.title })));
      const results = await Promise.all(
        myOffers.map((offer) =>
          getOfferApplications(offer.id)
            .then((apps) =>
              apps.map((app) => ({
                ...app,
                offerId: offer.id,
                offerTitle: offer.title,
              }))
            )
            .catch(() => [])
        )
      );
      setDossiers(results.flat());
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const getCandidateName = (d: DossierEntry) =>
    d.candidatName ||
    `${d.candidateFirstName || ''} ${d.candidateLastName || ''}`.trim() ||
    'Candidat anonyme';

  const getStatus = (d: DossierEntry) => d.statut || d.status || '';

  const filtered = dossiers.filter((d) => {
    const name = getCandidateName(d).toLowerCase();
    const matchSearch = !searchTerm || name.includes(searchTerm.toLowerCase()) || d.offerTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchOffer = !offerFilter || d.offerId === offerFilter;
    const matchStatus = !statusFilter || getStatus(d) === statusFilter;
    return matchSearch && matchOffer && matchStatus;
  });

  const handleAdvance = async (d: DossierEntry) => {
    const currentIdx = PIPELINE_STATUTS.findIndex((s) => s.key === getStatus(d));
    if (currentIdx < 0 || currentIdx >= PIPELINE_STATUTS.length - 2) return;
    const nextStatus = PIPELINE_STATUTS[currentIdx + 1].key;
    try {
      setUpdatingId(d.id);
      await updateApplicationStatus(d.id, nextStatus);
      setDossiers((prev) =>
        prev.map((x) => (x.id === d.id ? { ...x, statut: nextStatus, status: nextStatus } : x))
      );
    } catch {
      setError('Impossible de mettre à jour le statut.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-5">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#0F766E] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-5 space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#172A3A]">Suivi des dossiers</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Visualisez et gérez tous les dossiers candidats reçus pour vos offres.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-sm text-[#E11D48] font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: filtered.length, color: 'text-[#172A3A]' },
          { label: 'En traitement', value: filtered.filter((d) => !['ACCEPTE', 'REFUSE'].includes(getStatus(d))).length, color: 'text-amber-600' },
          { label: 'Acceptés', value: filtered.filter((d) => getStatus(d) === 'ACCEPTE').length, color: 'text-emerald-600' },
          { label: 'Refusés', value: filtered.filter((d) => getStatus(d) === 'REFUSE').length, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-[#E2E8F0] rounded-2xl p-4 text-center shadow-xs">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-[#64748B] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher un candidat ou offre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 pl-10 rounded-xl border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>
          <select
            value={offerFilter}
            onChange={(e) => setOfferFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
          >
            <option value="">Toutes les offres</option>
            {offers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
          >
            <option value="">Tous les statuts</option>
            {PIPELINE_STATUTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dossiers List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center shadow-xs">
          <FileText className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#64748B]">Aucun dossier trouvé</p>
          <p className="text-xs text-[#94A3B8] mt-1">Vérifiez vos filtres ou créez de nouvelles offres</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const status = getStatus(d);
            const isExpanded = expandedId === d.id;

            return (
              <div
                key={d.id}
                className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs hover:border-[#0F766E]/30 transition-colors"
              >
                {/* Header Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : d.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-[#E6F7F5] text-[#0F766E] flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {getCandidateName(d)[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-bold text-[#172A3A] truncate">{getCandidateName(d)}</p>
                      <p className="text-xs text-[#64748B] mt-0.5 truncate">{d.offerTitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {d.matchingScore !== undefined && <MatchingBadge score={d.matchingScore} size="sm" />}
                    <div className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                      PIPELINE_STATUTS.find((s) => s.key === status)?.[status === 'ACCEPTE' ? 'color' : status === 'REFUSE' ? 'color' : 'color'] || 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}>
                      {PIPELINE_STATUTS.find((s) => s.key === status)?.label || status}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-[#64748B]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#64748B]" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-[#F1F5F9] px-6 py-4 bg-[#F8FAFC] space-y-4">
                    {d.lettreMotivation && (
                      <div>
                        <p className="text-xs font-bold text-[#172A3A] mb-2">Lettre de motivation</p>
                        <p className="text-sm text-[#64748B] line-clamp-3">{d.lettreMotivation}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-3">Pipeline</p>
                      <div className="flex flex-wrap gap-2">
                        {PIPELINE_STATUTS.map((s, i) => {
                          const currentIdx = PIPELINE_STATUTS.findIndex((x) => x.key === status);
                          const isPast = i < currentIdx;
                          const isCurrent = i === currentIdx;
                          return (
                            <span
                              key={s.key}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                isCurrent
                                  ? `${s.color} ${s.textColor} ring-2 ring-offset-1 ring-current`
                                  : isPast
                                  ? 'bg-[#F8FAFC] text-[#94A3B8] border-[#E2E8F0]'
                                  : 'bg-white text-neutral-300 border-[#E2E8F0]'
                              }`}
                            >
                              {s.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleAdvance(d)}
                        disabled={
                          updatingId === d.id ||
                          ['ACCEPTE', 'REFUSE'].includes(status)
                        }
                        className="flex items-center gap-2 px-3 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {updatingId === d.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg]" />
                        )}
                        Faire avancer
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm('Refuser ce candidat ?')) return;
                          try {
                            setUpdatingId(d.id);
                            await updateApplicationStatus(d.id, 'REFUSE');
                            setDossiers((prev) =>
                              prev.map((x) => (x.id === d.id ? { ...x, statut: 'REFUSE', status: 'REFUSE' } : x))
                            );
                          } finally {
                            setUpdatingId(null);
                          }
                        }}
                        disabled={updatingId === d.id || status === 'REFUSE'}
                        className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Refuser
                      </button>
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

export default CompanyDossierPage;
