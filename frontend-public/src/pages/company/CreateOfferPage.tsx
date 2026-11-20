import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, ShieldAlert, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import client from '../../api/client';
import { getProfile } from '../../api/company.api';
import Alert from '../../components/alert/Alert';

const CreateOfferPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    salary: '',
    location: '',
    jobType: 'CDI', // CDI, CDD, Stage, Freelance
    seniority: 'Confirmé', // Junior, Confirmé, Senior, Expert
    startDate: '',
    contractDuration: '',
  });

  useEffect(() => {
    const checkVerification = async () => {
      try {
        setCheckingProfile(true);
        const profile = await getProfile();
        setIsVerified(Boolean(profile?.verified));
      } catch (err) {
        console.error('Error checking verification:', err);
      } finally {
        setCheckingProfile(false);
      }
    };
    checkVerification();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      setError("Votre entreprise est en cours de vérification. Vous ne pouvez publier d'offres qu'après validation par un administrateur.");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      const response = await client.post('/offers', {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        salary: formData.salary,
        location: formData.location,
        jobType: formData.jobType,
        seniority: formData.seniority,
        startDate: formData.startDate,
        contractDuration: formData.contractDuration,
        status: 'PUBLISHED', // Publier immédiatement
      });

      if (response.status < 400) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/company/offers');
        }, 2000);
      } else {
        setError(response.data?.message || 'Erreur lors de la création de l\'offre');
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err.message || 'Une erreur est survenue';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="max-w-7xl mx-auto py-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#0F766E] animate-spin" />
        <p className="text-xs text-[#64748B]">Vérification du statut entreprise...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-5 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/company/offers')}
            className="p-2 hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#475569]" />
          </button>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#172A3A]">
              Créer une nouvelle offre d'emploi
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Rédigez les détails de votre offre pour recruter vos futurs talents
            </p>
          </div>
        </div>

        {/* Bannière de blocage si entreprise non vérifiée */}
        {!isVerified && (
          <div className="p-6 sm:p-7 rounded-3xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Publication d'offres réservée aux entreprises vérifiées
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl">
                  Votre entreprise est actuellement en cours de vérification. Pour garantir la qualité et la sécurité de notre plateforme, vous pourrez publier des offres d'emploi dès que vos documents (RNE / Statuts) auront été validés par un administrateur.
                </p>
              </div>
            </div>

            <Link
              to="/company/profile?tab=verification"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all whitespace-nowrap self-stretch md:self-center justify-center"
            >
              Vérifier mon entreprise (RNE)
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <Alert 
            type="error" 
            title="Action refusée" 
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {success && (
          <Alert 
            type="success" 
            message="✨ Offre créée avec succès !"
            onClose={() => setSuccess(false)}
            compact={true}
          />
        )}

        {/* Form Card */}
        <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-xs ${!isVerified ? 'opacity-70 pointer-events-none select-none' : ''}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#172A3A] dark:text-white">
                Titre de l'offre *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={!isVerified}
                placeholder="ex: Développeur Full Stack Senior"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-[#172A3A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#172A3A] dark:text-white">
                Description du poste *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                disabled={!isVerified}
                rows={5}
                placeholder="Décrivez les missions principales, l'équipe, les responsabilités et les perspectives d'évolution..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-[#172A3A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>

            {/* Requirements */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#172A3A] dark:text-white">
                Compétences & Profil recherché *
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                required
                disabled={!isVerified}
                rows={3}
                placeholder="ex: React, Node.js, TypeScript, PostgreSQL, Docker, Esprit d'équipe..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-[#172A3A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>

            {/* Grid 2 colonnes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Type de contrat */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-[#172A3A] dark:text-white">
                  Type de contrat *
                </label>
                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  disabled={!isVerified}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-[#172A3A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                >
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="STAGE">Stage</option>
                  <option value="SIVP">SIVP</option>
                  <option value="FREELANCE">Freelance</option>
                  <option value="ALTERNANCE">Alternance</option>
                </select>
              </div>

              {/* Niveau d'expérience */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-[#172A3A] dark:text-white">
                  Niveau d'expérience *
                </label>
                <select
                  name="seniority"
                  value={formData.seniority}
                  onChange={handleChange}
                  disabled={!isVerified}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-[#172A3A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                >
                  <option value="DEBUTANT">Débutant (0-1 an)</option>
                  <option value="JUNIOR">Junior (1-3 ans)</option>
                  <option value="INTERMEDIAIRE">Confirmé (3-5 ans)</option>
                  <option value="SENIOR">Senior (5-8 ans)</option>
                  <option value="EXPERT">Expert (8+ ans)</option>
                </select>
              </div>

              {/* Localisation */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-[#172A3A] dark:text-white">
                  Localisation *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  disabled={!isVerified}
                  placeholder="ex: Tunis, Hybride / Télétravail"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-[#172A3A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>

              {/* Salaire */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-[#172A3A] dark:text-white">
                  Fourchette salariale (TND)
                </label>
                <input
                  type="text"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  disabled={!isVerified}
                  placeholder="ex: 2000 - 3000 DT / mois"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-[#172A3A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-[#172A3A] dark:text-white">
                  Date de début souhaitée
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  disabled={!isVerified}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-[#172A3A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-[#172A3A] dark:text-white">
                  Durée du contrat (si CDD/Stage)
                </label>
                <input
                  type="text"
                  name="contractDuration"
                  value={formData.contractDuration}
                  onChange={handleChange}
                  disabled={!isVerified}
                  placeholder="ex: 6 mois"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-[#172A3A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => navigate('/company/offers')}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-bold text-[#172A3A] dark:text-white hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !isVerified}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-signal dark:bg-cyan-600 hover:bg-[#115E59] text-white rounded-xl font-bold text-sm shadow-md shadow-signal/20 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? 'Création en cours...' : 'Publier l\'offre'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOfferPage;
