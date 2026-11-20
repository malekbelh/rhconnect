import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import client from '../../api/client';
import Alert from '../../components/alert/Alert';

const EditOfferPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    competencesRequises: '',
    salaireMin: '',
    salaireMax: '',
    localisation: '',
    typeContrat: 'CDI',
    niveauExperience: 'JUNIOR',
    dateExpiration: '',
    statut: 'ACTIVE',
  });

  // Charger l'offre existante
  useEffect(() => {
    const loadOffer = async () => {
      try {
        setLoading(true);
        console.log('[EditOfferPage] Loading offer with id:', id);
        const response = await client.get(`/api/offers/${id}`);
        console.log('[EditOfferPage] API Response:', response.data);
        
        if (response.status < 400 && response.data) {
          setFormData({
            title: response.data.title || '',
            description: response.data.description || '',
            competencesRequises: (response.data.competencesRequises || []).join(', '),
            salaireMin: response.data.salaireMin || '',
            salaireMax: response.data.salaireMax || '',
            localisation: response.data.localisation || '',
            typeContrat: response.data.typeContrat || 'CDI',
            niveauExperience: response.data.niveauExperience || 'JUNIOR',
            dateExpiration: response.data.dateExpiration || '',
            statut: response.data.statut || 'ACTIVE',
          });
        } else {
          setError('Offre non trouvée');
        }
      } catch (err: any) {
        console.error('[EditOfferPage] Error loading offer:', err);
        setError(err.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    if (id) loadOffer();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      const competences = formData.competencesRequises
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const response = await client.put(`/api/offers/${id}`, {
        title: formData.title,
        description: formData.description,
        competencesRequises: competences,
        salaireMin: formData.salaireMin ? parseInt(formData.salaireMin) : null,
        salaireMax: formData.salaireMax ? parseInt(formData.salaireMax) : null,
        localisation: formData.localisation,
        typeContrat: formData.typeContrat,
        niveauExperience: formData.niveauExperience,
        dateExpiration: formData.dateExpiration || null,
        statut: formData.statut,
      });

      if (response.status < 400) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/company/offers');
        }, 2000);
      } else {
        setError(response.data?.message || 'Erreur lors de la mise à jour');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto py-5 space-y-5">
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
            <p className="text-xs text-[#64748B]">Chargement de l'offre...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto py-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/company/offers')}
          className="p-2 hover:bg-[#F1F5F9] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#475569]" />
        </button>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#172A3A]">
            Modifier l'offre
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Mettez à jour les détails de votre offre
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert 
          type="error" 
          title="Erreur" 
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {success && (
        <Alert 
          type="success" 
          message="✨ Offre mise à jour avec succès!"
          onClose={() => setSuccess(false)}
          compact={true}
        />
      )}

      {/* Form Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#172A3A]">
              Titre de l'offre *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="ex: Développeur React Senior"
              className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#172A3A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#172A3A]">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              placeholder="Décrivez le poste, les responsabilités, l'environnement de travail..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#172A3A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>

          {/* Requirements */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#172A3A]">
              Compétences requises (séparées par des virgules) *
            </label>
            <textarea
              name="competencesRequises"
              value={formData.competencesRequises}
              onChange={handleChange}
              required
              rows={3}
              placeholder="ex: React, TypeScript, Node.js, SQL, 5+ ans d'expérience"
              className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#172A3A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>

          {/* Grid: Salary Min & Max */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Salary Min */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#172A3A]">
                Salaire minimum (TND)
              </label>
              <input
                type="number"
                name="salaireMin"
                value={formData.salaireMin}
                onChange={handleChange}
                placeholder="ex: 3000"
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#172A3A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>

            {/* Salary Max */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#172A3A]">
                Salaire maximum (TND)
              </label>
              <input
                type="number"
                name="salaireMax"
                value={formData.salaireMax}
                onChange={handleChange}
                placeholder="ex: 4500"
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#172A3A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>
          </div>

          {/* Localisation */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#172A3A]">
              Localisation *
            </label>
            <input
              type="text"
              name="localisation"
              value={formData.localisation}
              onChange={handleChange}
              required
              placeholder="ex: Tunis"
              className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#172A3A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>

          {/* Grid: Type Contrat & Niveau Expérience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Type Contrat */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#172A3A]">
                Type de contrat *
              </label>
              <select
                name="typeContrat"
                value={formData.typeContrat}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#172A3A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-white"
              >
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="STAGE">Stage</option>
                <option value="SIVP">SIVP</option>
                <option value="FREELANCE">Freelance</option>
                <option value="ALTERNANCE">Alternance</option>
                <option value="INTERIM">Intérim</option>
              </select>
            </div>

            {/* Niveau Expérience */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#172A3A]">
                Niveau d'expérience *
              </label>
              <select
                name="niveauExperience"
                value={formData.niveauExperience}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#172A3A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-white"
              >
                <option value="DEBUTANT">Débutant</option>
                <option value="JUNIOR">Junior</option>
                <option value="INTERMEDIAIRE">Intermédiaire</option>
                <option value="SENIOR">Senior</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>
          </div>

          {/* Date Expiration */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#172A3A]">
              Date d'expiration de l'offre
            </label>
            <input
              type="date"
              name="dateExpiration"
              value={formData.dateExpiration}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#172A3A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>

          {/* Statut */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#172A3A]">
              Statut de l'offre *
            </label>
            <select
              name="statut"
              value={formData.statut}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#172A3A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-white"
            >
              <option value="ACTIVE">Publiée</option>
              <option value="DRAFT">Brouillon</option>
              <option value="PENDING_MODERATION">En attente de modération</option>
              <option value="CLOSED">Clôturée</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={() => navigate('/company/offers')}
              className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm font-bold text-[#172A3A] hover:bg-[#F8FAFC] transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl font-bold text-sm shadow-md shadow-[#0F766E]/20 transition-all disabled:opacity-70"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Mise à jour en cours...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
};

export default EditOfferPage;
