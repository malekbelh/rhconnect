import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lightbulb,
  Copy,
  Check,
  TrendingUp,
  WifiOff,
  Filter,
} from 'lucide-react';
import { getAIConseilsProfil, getAISuggestionsLettre, getOffers } from '../../api/candidate.api';
import { useCandidateProfile } from '../../context/CandidateProfileContext';
import type { Offer } from '../../types';
import { TypeContrat } from '../../types';

type TabId = 'conseils' | 'lettre';

interface ConseilsResult {
  conseils: string[];
  scoreAmelioration: number;
  isDegraded?: boolean;
}

const CONTRACT_FILTER_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: TypeContrat.CDI, label: 'CDI' },
  { value: TypeContrat.CDD, label: 'CDD' },
  { value: TypeContrat.STAGE, label: 'Stage' },
  { value: TypeContrat.SIVP, label: 'SIVP' },
  { value: TypeContrat.FREELANCE, label: 'Freelance' },
];

const MANUAL_CONSEILS: ConseilsResult = {
  isDegraded: true,
  scoreAmelioration: 15,
  conseils: [
    'Complétez vos coordonnées (téléphone +216, ville tunisienne).',
    'Ajoutez au moins 5 compétences clés pour améliorer votre score de matching.',
    'Rédigez une bio de 3 à 5 phrases résumant vos expertises et objectifs.',
    'Téléversez votre CV au format PDF.',
    'Ajoutez votre profil LinkedIn pour renforcer la crédibilité de votre dossier.',
  ],
};

const PHOTO_ADVICE_PATTERN = /photo|image|portrait|avatar|première impression|apparence/i;

const filterPhotoAdviceIfHasPhoto = (
  conseils: string[],
  hasPhoto: boolean
): string[] => {
  if (!hasPhoto) return conseils;
  const filtered = conseils.filter((c) => !PHOTO_ADVICE_PATTERN.test(c));
  if (filtered.length === 0 && conseils.length > 0) {
    return [
      'Votre profil est bien complété. Continuez à postuler régulièrement et mettez à jour vos expériences au fur et à mesure.',
    ];
  }
  return filtered;
};

const CandidateAIAssistantPage: React.FC = () => {
  const { photoFileId } = useCandidateProfile();
  const [activeTab, setActiveTab] = useState<TabId>('conseils');

  const [conseilsLoading, setConseilsLoading] = useState(false);
  const [conseilsResult, setConseilsResult] = useState<ConseilsResult | null>(null);
  const [conseilsError, setConseilsError] = useState<string | null>(null);

  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [offerTypeFilter, setOfferTypeFilter] = useState('');
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [lettreLoading, setLettreLoading] = useState(false);
  const [lettreResult, setLettreResult] = useState<string | null>(null);
  const [lettreError, setLettreError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getOffers({ limit: 50 })
      .then((res) => {
        const data = res.data || [];
        setAllOffers(data);
        if (data.length > 0) setSelectedOfferId(data[0].id);
      })
      .catch(() => { });
  }, []);

  const filteredOffers = offerTypeFilter
    ? allOffers.filter((o) => o.typeContrat === offerTypeFilter)
    : allOffers;

  useEffect(() => {
    if (filteredOffers.length > 0) setSelectedOfferId(filteredOffers[0].id);
    else setSelectedOfferId('');
  }, [offerTypeFilter]); // eslint-disable-line

  const handleGetConseils = async () => {
    try {
      setConseilsLoading(true);
      setConseilsError(null);
      setConseilsResult(null);
      const result = await getAIConseilsProfil();
      const isDegraded =
        result.scoreAmelioration === 0 ||
        result.conseils.some((c) =>
          c.toLowerCase().includes('indisponible') ||
          c.toLowerCase().includes('complétez votre profil')
        );
      const hasPhoto = Boolean(photoFileId);
      const filteredConseils = filterPhotoAdviceIfHasPhoto(result.conseils, hasPhoto);
      setConseilsResult({ ...result, conseils: filteredConseils, isDegraded });
    } catch (err: any) {
      const isNetwork =
        err?.response?.status === 503 ||
        err?.response?.status === 500 ||
        err?.code === 'ECONNREFUSED' ||
        !err?.response;
      setConseilsError(isNetwork ? 'IA_UNAVAILABLE' : (err.message || 'Erreur'));
    } finally {
      setConseilsLoading(false);
    }
  };

  const handleGenererLettre = async () => {
    if (!selectedOfferId) { setLettreError("Sélectionnez une offre."); return; }
    try {
      setLettreLoading(true);
      setLettreError(null);
      const result = await getAISuggestionsLettre(selectedOfferId);
      const found = allOffers.find((o) => o.id === selectedOfferId);
      const isDegradedContent =
        result.contenu?.startsWith('[Mode dégradé]') ||
        result.contenu?.startsWith('[Modèle généré');
      if (result.contenu && !isDegradedContent) {
        setLettreResult(result.contenu);
      } else {
        setLettreResult(
          `Madame, Monsieur,\n\nVivement intéressé(e) par le poste de ${found?.title || 'ce poste'} au sein de ${found?.companyName || 'votre entreprise'} (${found?.localisation || 'Tunisie'}),\n\nFort(e) de mon parcours et de mes compétences, je souhaite mettre mon expertise au service de vos projets.\n\nJe serais ravi(e) d'échanger lors d'un entretien.\n\nDans l'attente de votre retour, je vous prie d'agréer mes salutations distinguées.`
        );
        setLettreError('IA_DEGRADED');
      }
    } catch (err: any) {
      const isNetwork =
        err?.response?.status === 503 ||
        err?.response?.status === 500 ||
        err?.code === 'ECONNREFUSED' ||
        !err?.response;
      const found = allOffers.find((o) => o.id === selectedOfferId);
      if (isNetwork) {
        setLettreResult(
          `Madame, Monsieur,\n\nVivement intéressé(e) par le poste de ${found?.title || 'ce poste'} au sein de ${found?.companyName || 'votre entreprise'},\n\nMon parcours correspond aux exigences du poste. Je serais ravi(e) de mettre mon expertise à votre service.\n\nDans l'attente d'un échange, je vous prie d'agréer mes salutations distinguées.`
        );
        setLettreError('IA_UNAVAILABLE');
      } else {
        setLettreError(err.message || 'Erreur lors de la rédaction assistée');
      }
    } finally {
      setLettreLoading(false);
    }
  };

  const handleCopy = () => {
    if (!lettreResult) return;
    navigator.clipboard.writeText(lettreResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto py-5 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#172A3A]">
            Assistant Carrière IA
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Analysez votre profil et générez des lettres de motivation sur-mesure.
          </p>
        </div>

      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 bg-[#F1F5F9] dark:bg-[#0D1B2A] p-1.5 rounded-2xl w-fit">
        {([
          { id: 'conseils' as TabId, label: 'Optimisation du profil', icon: Lightbulb },
          { id: 'lettre' as TabId, label: 'Générateur de lettre', icon: FileText },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === id
                ? 'bg-white dark:bg-[#14263A] text-[#0F766E] shadow-sm border border-[#E2E8F0] dark:border-white/[0.07]'
                : 'text-[#64748B] dark:text-white/40 hover:text-[#172A3A] dark:hover:text-white'
              }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════ TAB CONSEILS ══════════════ */}
      {activeTab === 'conseils' && (
        <div className="space-y-5">

          {/* Card lancer l'analyse */}
          <div className="bg-white dark:bg-[#14263A] border border-[#E2E8F0] dark:border-white/[0.07] rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#E6F7F5] dark:bg-[#0F766E]/20 flex items-center justify-center">
                    <Sparkles className="w-4.5 h-4.5 text-[#0F766E] dark:text-[#5EEAD4]" />
                  </div>
                  <h2 className="font-display text-base font-bold text-[#172A3A]">
                    Analyser mon attractivité profil
                  </h2>
                </div>
                <p className="text-sm text-[#64748B] leading-relaxed pl-11">
                  L'IA examine vos compétences, expériences et diplômes pour identifier les points d'amélioration et estimer votre score de visibilité.
                </p>
              </div>
              <button
                onClick={handleGetConseils}
                disabled={conseilsLoading}
                className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#0F766E] dark:text-[#5EEAD4] bg-[#F0FDFA] dark:bg-[#0F766E]/15 hover:bg-[#CCF0EB] dark:hover:bg-[#0F766E]/25 border border-[#0F766E]/30 transition-all cursor-pointer disabled:opacity-60 self-start sm:self-center"
              >
                {conseilsLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Sparkles className="w-4 h-4" />}
                {conseilsLoading ? 'Analyse…' : "Lancer l'analyse"}
              </button>
            </div>
          </div>

          {/* Erreur réseau */}
          {conseilsError && (
            <div className={`bg-white dark:bg-[#14263A] border rounded-2xl p-4 flex items-start gap-3 text-sm ${conseilsError === 'IA_UNAVAILABLE'
                ? 'border-[#FDE68A] dark:border-yellow-500/30'
                : 'border-red-200 dark:border-red-500/30'
              }`}>
              <WifiOff className={`w-4 h-4 flex-shrink-0 mt-0.5 ${conseilsError === 'IA_UNAVAILABLE' ? 'text-[#D4A72C]' : 'text-[#E11D48]'
                }`} />
              <div>
                {conseilsError === 'IA_UNAVAILABLE' ? (
                  <>
                    <p className="font-bold text-[#B45309] dark:text-yellow-400">Assistant IA indisponible</p>
                    <p className="text-xs text-[#92400E] dark:text-yellow-200/60 mt-0.5">
                      Ollama ne répond pas. Consultez les conseils généraux ci-dessous.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const hasPhoto = Boolean(photoFileId);
                        const filtered = filterPhotoAdviceIfHasPhoto(MANUAL_CONSEILS.conseils, hasPhoto);
                        setConseilsResult({ ...MANUAL_CONSEILS, conseils: filtered });
                        setConseilsError(null);
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#D4A72C] hover:bg-[#B45309] transition-all cursor-pointer"
                    >
                      Voir les conseils généraux
                    </button>
                  </>
                ) : (
                  <p className="font-medium text-[#E11D48]">{conseilsError}</p>
                )}
              </div>
            </div>
          )}

          {/* Résultats */}
          {conseilsResult && (
            <div className="bg-white dark:bg-[#14263A] border border-[#E2E8F0] dark:border-white/[0.07] rounded-2xl shadow-xs overflow-hidden">
              {/* Header résultats */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] dark:border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <h3 className="font-display font-bold text-base text-[#172A3A]">
                    Recommandations d'optimisation
                  </h3>
                  {conseilsResult.isDegraded && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF8EC] dark:bg-yellow-500/15 text-[#B45309] dark:text-yellow-400 border border-[#FDE68A] dark:border-yellow-500/30">
                      <WifiOff className="w-3 h-3" /> Mode dégradé
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E6F7F5] dark:bg-[#0F766E]/20 border border-[#0F766E]/20 text-[#0F766E] dark:text-[#5EEAD4] text-xs font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +{conseilsResult.scoreAmelioration}% attractivité
                </div>
              </div>

              <div className="p-6 space-y-3">
                {conseilsResult.isDegraded && (
                  <p className="text-xs text-[#64748B] mb-2">
                    Conseils généraux — résultats personnalisés disponibles quand Ollama est actif.
                  </p>
                )}
                {conseilsResult.conseils.map((conseil, i) => (
                  <div
                    key={i}
                    className="flex gap-3.5 p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#1A2F45] border border-[#E2E8F0] dark:border-white/[0.06] hover:border-[#0F766E]/30 dark:hover:border-[#5EEAD4]/30 transition-colors"
                  >
                    <span className="w-6 h-6 bg-[#0F766E] text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-[#334155] leading-relaxed">{conseil}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TAB LETTRE ══════════════ */}
      {activeTab === 'lettre' && (
        <div className="space-y-5">

          {/* Card configuration */}
          <div className="bg-white dark:bg-[#14263A] border border-[#E2E8F0] dark:border-white/[0.07] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#F1F5F9] dark:border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-[#E6F7F5] dark:bg-[#0F766E]/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4.5 h-4.5 text-[#0F766E] dark:text-[#5EEAD4]" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#172A3A]">
                  Générer une lettre sur-mesure
                </h3>
                <p className="text-sm text-[#64748B] mt-0.5">
                  L'IA rédige une lettre calibrée selon la description de l'offre et votre profil.
                </p>
              </div>
            </div>

            {/* Filtres + sélection offre sur une ligne */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="space-y-1.5 flex-shrink-0">
                <label className="block text-sm font-bold text-[#172A3A] flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#0F766E]" /> Type
                </label>
                <select
                  value={offerTypeFilter}
                  onChange={(e) => setOfferTypeFilter(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-sm font-medium text-[#172A3A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                >
                  {CONTRACT_FILTER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 flex-1">
                <label className="block text-sm font-bold text-[#172A3A]">Offre cible</label>
                {filteredOffers.length === 0 ? (
                  <div className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-white/[0.07] text-sm text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#1A2F45]">
                    Aucune offre pour ce type
                  </div>
                ) : (
                  <select
                    value={selectedOfferId}
                    onChange={(e) => setSelectedOfferId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-sm font-medium text-[#172A3A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                  >
                    {filteredOffers.map((offer) => (
                      <option key={offer.id} value={offer.id}>
                        {offer.title} · {offer.companyName} ({offer.localisation}) — {offer.typeContrat}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenererLettre}
              disabled={lettreLoading || !selectedOfferId}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0F766E] hover:bg-[#115E59] shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {lettreLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Sparkles className="w-4 h-4" />}
              {lettreLoading ? 'Rédaction en cours…' : 'Générer la lettre'}
            </button>

            {/* Bannière état IA */}
            {lettreError && lettreError !== 'IA_UNAVAILABLE' && lettreError !== 'IA_DEGRADED' && (
              <div className="flex items-center gap-2 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-[#E11D48] font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{lettreError}
              </div>
            )}
            {(lettreError === 'IA_UNAVAILABLE' || lettreError === 'IA_DEGRADED') && (
              <div className="flex items-start gap-2 p-3.5 bg-[#FDF8EC] dark:bg-yellow-500/10 border border-[#FDE68A] dark:border-yellow-500/30 rounded-xl text-sm text-[#B45309] dark:text-yellow-400 font-medium">
                <WifiOff className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    {lettreError === 'IA_UNAVAILABLE' ? 'IA indisponible' : 'IA en mode dégradé'}
                    {' '}— modèle de lettre généré sans personnalisation
                  </p>
                  <p className="text-xs text-[#92400E] dark:text-yellow-200/60 mt-0.5">
                    Personnalisez le texte ci-dessous avant de l'envoyer.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Résultat lettre */}
          {lettreResult && (
            <div className="bg-white dark:bg-[#14263A] border border-[#E2E8F0] dark:border-white/[0.07] rounded-2xl shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] dark:border-white/[0.06]">
                <div className="flex items-center gap-2 text-sm font-bold text-[#059669]">
                  <CheckCircle2 className="w-4 h-4" /> Lettre générée
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-bold bg-[#F1F5F9] dark:bg-white/[0.07] hover:bg-[#E2E8F0] dark:hover:bg-white/10 text-[#172A3A] transition-colors cursor-pointer"
                >
                  {copied
                    ? <><Check className="w-3.5 h-3.5 text-[#059669]" /> Copié !</>
                    : <><Copy className="w-3.5 h-3.5" /> Copier</>}
                </button>
              </div>
              <div className="p-6">
                <pre className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap font-sans bg-[#F8FAFC] dark:bg-[#0D1B2A] border border-[#E2E8F0] dark:border-white/[0.06] rounded-xl p-5">
                  {lettreResult}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CandidateAIAssistantPage;
