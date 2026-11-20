import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Send,
  Briefcase,
  Users,
  Lightbulb,
  RefreshCw,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import {
  getMyOffers,
  aiAnalyserCandidatures,
  aiRedigerOffre,
  aiConseilsOffre,
} from '../../api/company.api';

type TabId = 'analyser' | 'rediger' | 'conseils';

const CompanyAIAssistantPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('analyser');
  const [offers, setOffers] = useState<{ id: string; title: string }[]>([]);

  // Analyser candidatures
  const [analyserOfferId, setAnalyserOfferId] = useState('');
  const [analyserLoading, setAnalyserLoading] = useState(false);
  const [analyserResult, setAnalyserResult] = useState<any>(null);
  const [analyserError, setAnalyserError] = useState<string | null>(null);

  // Rédiger offre
  const [redigerPoste, setRedigerPoste] = useState('');
  const [redigerSecteur, setRedigerSecteur] = useState('');
  const [redigerCompetences, setRedigerCompetences] = useState('');
  const [redigerLoading, setRedigerLoading] = useState(false);
  const [redigerResult, setRedigerResult] = useState<any>(null);
  const [redigerError, setRedigerError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Conseils offre
  const [conseilsOfferId, setConseilsOfferId] = useState('');
  const [conseilsLoading, setConseilsLoading] = useState(false);
  const [conseilsResult, setConseilsResult] = useState<any>(null);
  const [conseilsError, setConseilsError] = useState<string | null>(null);

  useEffect(() => {
    getMyOffers()
      .then((offs) => setOffers(offs.map((o) => ({ id: o.id, title: o.title }))))
      .catch(() => {});
  }, []);

  const handleAnalyser = async () => {
    if (!analyserOfferId) return;
    try {
      setAnalyserLoading(true);
      setAnalyserError(null);
      const res = await aiAnalyserCandidatures(analyserOfferId);
      setAnalyserResult(res.data);
    } catch (err: any) {
      setAnalyserError(err.message || 'Erreur d\'analyse');
    } finally {
      setAnalyserLoading(false);
    }
  };

  const handleRediger = async () => {
    if (!redigerPoste.trim()) {
      setRedigerError('Veuillez indiquer le poste');
      return;
    }
    try {
      setRedigerLoading(true);
      setRedigerError(null);
      const res = await aiRedigerOffre({
        poste: redigerPoste,
        secteur: redigerSecteur,
        competences: redigerCompetences,
      });
      setRedigerResult(res.data);
    } catch (err: any) {
      setRedigerError(err.message || 'Erreur de génération');
    } finally {
      setRedigerLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConseils = async () => {
    if (!conseilsOfferId) return;
    try {
      setConseilsLoading(true);
      setConseilsError(null);
      const res = await aiConseilsOffre(conseilsOfferId);
      setConseilsResult(res.data);
    } catch (err: any) {
      setConseilsError(err.message || 'Erreur');
    } finally {
      setConseilsLoading(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.FC<any> }[] = [
    { id: 'analyser', label: 'Analyser candidatures', icon: Users },
    { id: 'rediger', label: 'Rédiger une offre', icon: Briefcase },
    { id: 'conseils', label: 'Conseils pour offre', icon: Lightbulb },
  ];

  return (
    <div className="max-w-7xl mx-auto py-5 space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#172A3A]">Assistant IA RH</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Optimisez votre processus de recrutement grâce à l'IA : analysez vos candidatures,
          rédigez des offres attractives et obtenez des conseils personnalisés.
        </p>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex flex-col sm:flex-row gap-1 bg-[#F8FAFC] rounded-xl p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-white text-[#0F766E] shadow-sm'
                  : 'text-[#64748B] hover:text-[#172A3A]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{id === 'analyser' ? 'Analyser' : id === 'rediger' ? 'Rédiger' : 'Conseils'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Analyser candidatures */}
      {activeTab === 'analyser' && (
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
          <h2 className="font-display text-base font-bold text-[#172A3A]">Analyser les candidatures d'une offre</h2>
          <p className="text-sm text-[#64748B] mt-1 mb-4">Analysez tous les dossiers reçus pour une offre et obtenez des recommandations basées sur le matching et la vérification.</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#172A3A] mb-1.5">
                  Sélectionnez une offre
                </label>
                <select
                  value={analyserOfferId}
                  onChange={(e) => setAnalyserOfferId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E] bg-white"
                >
                  <option value="">-- Choisir une offre --</option>
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>{o.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAnalyser}
                  disabled={analyserLoading || !analyserOfferId}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0F766E] to-[#0F766E] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-70"
                >
                  {analyserLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Analyser
                </button>
              </div>
            </div>
          </div>

          {analyserError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{analyserError}</p>
            </div>
          )}

          {analyserResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Candidatures', value: analyserResult.totalCandidatures ?? 0, color: 'text-[#172A3A]' },
                  { label: 'Vérifiés', value: analyserResult.candidatsVerifies ?? 0, color: 'text-emerald-600' },
                  { label: 'Score moyen', value: `${analyserResult.scoreMoyenMatching ?? 0}%`, color: 'text-[#0F766E]' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white border border-[#E2E8F0] rounded-xl p-4 text-center">
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-[#64748B] mt-1">{label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <h3 className="font-semibold text-[#172A3A] mb-3 text-sm">Recommandations IA</h3>
                <div className="space-y-2">
                  {(analyserResult.recommandations as string[] || []).map((r: string, i: number) => (
                    <div key={i} className="flex gap-3 p-3 bg-[#E6F7F5]/50 rounded-lg">
                      <span className="w-5 h-5 bg-[#E6F7F5]0 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-sm text-[#172A3A]">{r}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rédiger offre */}
      {activeTab === 'rediger' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
            <h2 className="font-semibold text-[#172A3A] mb-4">Générer une description d'offre</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#172A3A] mb-1.5">
                  Intitulé du poste *
                </label>
                <input
                  type="text"
                  value={redigerPoste}
                  onChange={(e) => setRedigerPoste(e.target.value)}
                  placeholder="ex: Développeur Full-Stack Java/React"
                  className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#172A3A] mb-1.5">
                  Secteur d'activité
                </label>
                <input
                  type="text"
                  value={redigerSecteur}
                  onChange={(e) => setRedigerSecteur(e.target.value)}
                  placeholder="ex: Fintech, Banque, Télécoms"
                  className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#172A3A] mb-1.5">
                  Compétences clés
                </label>
                <input
                  type="text"
                  value={redigerCompetences}
                  onChange={(e) => setRedigerCompetences(e.target.value)}
                  placeholder="ex: Java, Spring Boot, React, MongoDB"
                  className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <button
                onClick={handleRediger}
                disabled={redigerLoading || !redigerPoste.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0F766E] to-[#0F766E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-70"
              >
                {redigerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {redigerLoading ? 'Génération...' : 'Générer la description'}
              </button>
            </div>
          </div>

          {redigerError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{redigerError}</p>
            </div>
          )}

          {redigerResult && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-[#172A3A] text-sm">Description générée</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(redigerResult.descriptionGeneree as string)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] hover:bg-neutral-200 rounded-lg text-xs font-medium text-[#172A3A] transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                  <button
                    onClick={handleRediger}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#0F766E] hover:bg-[#E6F7F5] rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Regénérer
                  </button>
                </div>
              </div>
              <div className="p-5">
                <pre className="text-sm text-[#172A3A] leading-relaxed whitespace-pre-wrap font-sans">
                  {redigerResult.descriptionGeneree as string}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conseils offre */}
      {activeTab === 'conseils' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
            <h2 className="font-semibold text-[#172A3A] mb-4">Obtenir des conseils pour une offre</h2>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#172A3A] mb-1.5">
                  Sélectionnez une offre
                </label>
                <select
                  value={conseilsOfferId}
                  onChange={(e) => setConseilsOfferId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E] bg-white"
                >
                  <option value="">-- Choisir une offre --</option>
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>{o.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleConseils}
                  disabled={conseilsLoading || !conseilsOfferId}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0F766E] to-[#0F766E] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-70"
                >
                  {conseilsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                  Analyser
                </button>
              </div>
            </div>
          </div>

          {conseilsError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{conseilsError}</p>
            </div>
          )}

          {conseilsResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#0F766E]">{conseilsResult.scoreMatchingMoyen ?? 0}%</p>
                  <p className="text-xs text-[#64748B] mt-1">Score matching moyen</p>
                </div>
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#172A3A]">{conseilsResult.nbCandidatures ?? 0}</p>
                  <p className="text-xs text-[#64748B] mt-1">Candidatures reçues</p>
                </div>
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <h3 className="font-semibold text-[#172A3A] mb-3 text-sm">Recommandations</h3>
                <div className="space-y-2">
                  {(conseilsResult.conseils as string[] || []).map((c: string, i: number) => (
                    <div key={i} className="flex gap-3 p-3 bg-amber-50 rounded-lg">
                      <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-[#172A3A]">{c}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyAIAssistantPage;


