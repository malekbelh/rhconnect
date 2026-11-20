import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Briefcase,
  ArrowLeft,
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Banknote,
  ShieldCheck,
  Calendar,
  ClipboardCheck,
  UserX,
  FileText as FileTextIcon,
} from 'lucide-react';
import {
  getOffer,
  submitApplication,
  getAISuggestionsLettre,
  getMyApplications,
  getProfile,
} from '../../api/candidate.api';
import MatchingBadge from '../../components/offer/MatchingBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import type { Offer, CandidateProfile } from '../../types';

/* ── Vérification minimale du profil avant soumission ── */
const checkProfile = (p: CandidateProfile | null): { ok: boolean; missing: string[] } => {
  if (!p) return { ok: false, missing: ['Profil introuvable — reconnectez-vous'] };
  const missing: string[] = [];
  if (!p.firstName || !p.lastName) missing.push('Nom et prénom');
  if (!p.phone) missing.push('Numéro de téléphone (+216)');
  if (!p.competences || p.competences.length < 3) missing.push('Au moins 3 compétences');
  if (!p.cvFileName) missing.push('CV (PDF)');
  return { ok: missing.length === 0, missing };
};

const OfferDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [offer, setOffer] = useState<Offer | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lettre, setLettre] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [existingApp, setExistingApp] = useState<any>(null);
  const [showRecap, setShowRecap] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const [offerData, apps, prof] = await Promise.all([
          getOffer(id),
          getMyApplications().catch(() => []),
          getProfile().catch(() => null),
        ]);
        setOffer(offerData);
        setProfile(prof);
        const match = apps.find((a: any) => a.offerId === id);
        if (match) setExistingApp(match);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Offre introuvable.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleGenerateAI = async () => {
    if (!id) return;
    try {
      setAiLoading(true);
      setError(null);
      const res = await getAISuggestionsLettre(id);
      if (res.contenu) {
        setLettre(res.contenu);
      } else {
        setLettre(
          `Madame, Monsieur,\n\nVivement intéressé(e) par le poste de ${offer?.title || 'ce poste'} au sein de ${offer?.companyName || 'votre entreprise'}, je souhaite vous présenter ma candidature.\n\nMon parcours et mes compétences correspondent aux exigences du poste. Rigoureux et motivé, je serais ravi(e) de mettre mon expertise au service de vos projets.\n\nDans l'attente d'un échange, je vous prie d'agréer mes salutations distinguées.`
        );
      }
    } catch {
      setError("L'assistant IA est temporairement indisponible. Vous pouvez saisir votre lettre manuellement.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowRecap(true);
  };

  const handleConfirmSubmit = async () => {
    if (!id) return;
    try {
      setSubmitting(true);
      setError(null);
      const app = await submitApplication(id, lettre);
      setExistingApp(app);
      setSubmittedRef(app.id ? app.id.slice(0, 8).toUpperCase() : id.slice(0, 8).toUpperCase());
      setShowRecap(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi de la candidature.");
      setShowRecap(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-10 h-10 text-[#0F766E] animate-spin" />
        <p className="text-xs text-[#64748B]">Chargement des détails de l'offre...</p>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <AlertCircle className="w-12 h-12 text-[#E11D48] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-[#172A3A]">Offre introuvable</h2>
        <p className="text-xs text-[#64748B] mt-1 mb-5">Cette offre n'existe plus ou a été retirée.</p>
        <Link to="/candidate/offers" className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F766E] text-white rounded-xl text-xs font-bold">
          <ArrowLeft className="w-4 h-4" /> Retour aux offres
        </Link>
      </div>
    );
  }

  const profileCheck = checkProfile(profile);

  return (
    <div className="max-w-7xl mx-auto py-5 space-y-5">
      <div>
        <Link to="/candidate/offers" className="inline-flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#0F766E] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour aux offres d'emploi
        </Link>
      </div>

      {/* Hero */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center flex-shrink-0 shadow-2xs">
              {offer.companyLogoUrl ? (
                <img src={offer.companyLogoUrl} alt={offer.companyName} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <Building2 className="w-8 h-8 text-[#0F766E]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#172A3A]">{offer.title}</h1>
                {offer.matchingScore !== undefined && <MatchingBadge score={offer.matchingScore} size="md" />}
              </div>
              <p className="text-sm font-semibold text-[#0F766E] mt-1">{offer.companyName || 'Entreprise partenaire'}</p>
              <div className="flex items-center gap-3 text-xs text-[#64748B] mt-3 flex-wrap">
                <span className="flex items-center gap-1 bg-[#F1F5F9] px-3 py-1 rounded-full font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />{offer.localisation || 'Tunis, Tunisie'}
                </span>
                <span className="flex items-center gap-1 bg-[#E6F7F5] text-[#0F766E] px-3 py-1 rounded-full font-bold">
                  <Briefcase className="w-3.5 h-3.5" />{offer.typeContrat || 'CDI'}
                </span>
                {offer.salaireMin && (
                  <span className="flex items-center gap-1 bg-[#FDF8EC] text-[#B45309] px-3 py-1 rounded-full font-bold">
                    <Banknote className="w-3.5 h-3.5 text-[#D4A72C]" />{offer.salaireMin} - {offer.salaireMax} TND
                  </span>
                )}
                <span className="flex items-center gap-1 text-[#94A3B8]">
                  <Calendar className="w-3.5 h-3.5" />
                  Publiée le {new Date(offer.createdAt || Date.now()).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Description */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="font-display text-lg font-bold text-[#172A3A] mb-3">Description du poste</h2>
              <div className="text-sm text-[#334155] leading-relaxed whitespace-pre-line">{offer.description}</div>
            </div>

            {offer.competencesRequises && offer.competencesRequises.length > 0 && (
              <div className="pt-6 border-t border-[#F1F5F9]">
                <h3 className="font-display text-sm font-bold text-[#172A3A] mb-3">Compétences attendues</h3>
                <div className="flex flex-wrap gap-2">
                  {offer.competencesRequises.map((skill, index) => {
                    const candidateHas = (profile?.competences || []).some(
                      (c) => c.toLowerCase() === skill.toLowerCase()
                    );
                    return (
                      <span
                        key={index}
                        title={candidateHas ? 'Vous avez cette compétence ✓' : 'Non présente dans votre profil'}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${candidateHas
                            ? 'bg-[#E6F7F5] text-[#0F766E] border-[#0F766E]/20'
                            : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]'
                          }`}
                      >
                        {candidateHas && '✓ '}{skill}
                      </span>
                    );
                  })}
                </div>
                {profile && (
                  <p className="text-[11px] text-[#64748B] mt-2">
                    Vous maîtrisez{' '}
                    <span className="font-bold text-[#0F766E]">
                      {offer.competencesRequises.filter((s) =>
                        (profile?.competences || []).some((c) => c.toLowerCase() === s.toLowerCase())
                      ).length}
                    </span>{' '}
                    sur <span className="font-bold">{offer.competencesRequises.length}</span> compétences requises.
                  </p>
                )}
              </div>
            )}

            <div className="pt-6 border-t border-[#F1F5F9] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-xs font-medium text-[#64748B]">Niveau d'expérience requis</span>
                <p className="text-sm font-bold text-[#172A3A] mt-1">{offer.niveauExperience || 'Non spécifié'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-xs font-medium text-[#64748B]">Type de contrat</span>
                <p className="text-sm font-bold text-[#172A3A] mt-1">{offer.typeContrat || 'CDI'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Application */}
        <div className="space-y-6">
          {/* Confirmation post-envoi avec référence */}
          {submittedRef && (
            <div className="bg-white border border-[#A7F3D0] rounded-3xl p-6 shadow-xs space-y-4 animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#172A3A]">Candidature envoyée !</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Votre dossier a bien été transmis à <strong>{offer.companyName}</strong>.
                </p>
              </div>

              <Link to="/candidate/applications"
                className="w-full py-2.5 text-center block rounded-2xl text-xs font-bold text-white bg-[#0F766E] hover:bg-[#115E59] transition-all shadow-xs">
                Suivre mon dossier →
              </Link>
            </div>
          )}

          {!submittedRef && (existingApp ? (
            /* Déjà postulé */
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#172A3A]">Vous avez déjà postulé</h3>
                <p className="text-sm text-[#64748B] mt-1">Votre candidature est enregistrée et suivie.</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B] font-medium">Statut</span>
                  <StatusBadge status={existingApp.status} size="sm" />
                </div>
                {existingApp.matchingScore !== undefined && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#64748B] font-medium">Score matching</span>
                    <MatchingBadge score={existingApp.matchingScore} size="sm" />
                  </div>
                )}
                {existingApp.status && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#64748B] font-medium">Statut</span>
                    <span className="font-extrabold text-[#0F766E] tracking-wider text-[10px]">
                      En cours
                    </span>
                  </div>
                )}
              </div>
              <Link to="/candidate/applications"
                className="w-full py-3 text-center block rounded-2xl text-xs font-bold text-white bg-[#0F766E] hover:bg-[#115E59] transition-all shadow-xs">
                Suivre mon dossier →
              </Link>
            </div>
          ) : (
            /* Formulaire de candidature */
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#0F766E] uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4" /> Candidature Certifiée
                </div>
                <h3 className="font-display font-bold text-base text-[#172A3A]">Postuler à cette opportunité</h3>
                <p className="text-sm text-[#64748B] mt-1">
                  Votre profil vérifié et vos compétences seront transmis directement à l'équipe de recrutement.
                </p>
              </div>

              {/* Alerte profil incomplet */}
              {!profileCheck.ok && (
                <div className="p-4 bg-[#FDF8EC] border border-[#FDE68A] rounded-2xl">
                  <div className="flex items-start gap-2">
                    <UserX className="w-4 h-4 text-[#B45309] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-[#B45309]">Profil incomplet — candidature bloquée</p>
                      <p className="text-[11px] text-[#92400E] mt-0.5">Complétez ces éléments pour débloquer l'envoi :</p>
                      <ul className="mt-1.5 space-y-0.5">
                        {profileCheck.missing.map((m) => (
                          <li key={m} className="text-[11px] text-[#92400E] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4A72C] flex-shrink-0" />{m}
                          </li>
                        ))}
                      </ul>
                      <Link to="/candidate/profile"
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#0F766E] hover:underline">
                        → Compléter mon profil
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-[#E11D48] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <label className="block text-sm font-bold text-[#172A3A]">Lettre de motivation</label>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] font-semibold">Optionnel</span>
                    </div>
                    <button type="button" onClick={handleGenerateAI} disabled={aiLoading}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F766E] hover:text-[#115E59] cursor-pointer disabled:opacity-60">
                      {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Rédiger avec l'IA
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={lettre}
                    onChange={(e) => setLettre(e.target.value)}
                    placeholder="Optionnel — votre profil certifié sera transmis dans tous les cas. Ajoutez une lettre pour personnaliser votre dossier."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#172A3A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!profileCheck.ok}
                  className="w-full py-3 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] hover:from-[#115E59] hover:to-[#0F766E] text-white text-xs font-bold rounded-2xl shadow-md shadow-[#0F766E]/25 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Vérifier et envoyer ma candidature
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>

      {/* Modal récapitulatif avant envoi */}
      {showRecap && (
        <div className="fixed inset-0 bg-[#172A3A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-[#E2E8F0] animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-[#F1F5F9] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E6F7F5] text-[#0F766E] flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#172A3A]">Récapitulatif avant envoi</h3>
                <p className="text-[11px] text-[#64748B]">Vérifiez les informations avant de confirmer</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
                {[
                  { label: 'Poste', value: offer.title },
                  { label: 'Entreprise', value: offer.companyName || '—' },
                  { label: 'Contrat', value: offer.typeContrat },
                  { label: 'Localisation', value: offer.localisation },
                  { label: 'CV joint', value: profile?.cvFileName || 'Non fourni' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[#64748B] font-medium">{label}</span>
                    <span className="font-bold text-[#172A3A] text-right max-w-[180px] truncate">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B] font-medium">Lettre de motivation</span>
                  <span className={`font-bold ${lettre.trim() ? 'text-[#059669]' : 'text-[#94A3B8]'}`}>
                    {lettre.trim() ? 'Incluse' : 'Non fournie'}
                  </span>
                </div>
              </div>

              {lettre.trim() && (
                <div className="p-3 rounded-xl bg-[#F0FDFA] border border-[#CCF0EB]">
                  <div className="flex items-center gap-1.5 mb-1 text-[#0F766E]">
                    <FileTextIcon className="w-3.5 h-3.5" />
                    <span className="font-bold text-[11px]">Aperçu lettre</span>
                  </div>
                  <p className="text-[11px] text-[#134E4A] line-clamp-3 italic">"{lettre.trim()}"</p>
                </div>
              )}

              <p className="text-[11px] text-[#64748B] leading-relaxed">
                En confirmant, votre profil certifié sera transmis à{' '}
                <strong className="text-[#172A3A]">{offer.companyName}</strong>.
              </p>
            </div>

            <div className="p-4 border-t border-[#F1F5F9] flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowRecap(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-all"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl font-bold text-xs shadow-xs transition-all disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Confirmer l'envoi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferDetailPage;
