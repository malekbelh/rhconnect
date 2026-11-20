import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Award,
  GraduationCap,
  Briefcase,
  FileText,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Phone,
  Download,
  ShieldCheck,
  Tag,
  Link2,
  Settings2,
  Clock,
  XCircle,
  Camera,
  ImagePlus,
} from 'lucide-react';
import {
  getProfile,
  updateProfile,
  uploadCV,
  downloadMyCV,
  uploadPhoto,
  loadMyPhotoBlobUrl,
  getAIConseilsProfil,
  getMyVerification,
} from '../../api/candidate.api';
import type { CandidateProfile, Experience, Formation } from '../../types';
import { TypeContrat, VerificationStatus as _VerificationStatus } from '../../types';
import FileDropZone from '../../components/forms/FileDropZone';
import { useAuth } from '../../context/AuthContext';
import { useCandidateProfile } from '../../context/CandidateProfileContext';

type TabId = 'infos' | 'competences' | 'parcours' | 'formations' | 'cv' | 'liens';

const TUNISIAN_CITIES = [
  'Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana',
  'Gafsa', 'Monastir', 'Ben Arous', 'Nabeul', 'Médenine', 'Kasserine',
  'Hammamet', 'La Marsa', 'Carthage', 'Sidi Bouzid', 'Tozeur', 'Djerba',
];

const CONTRACT_OPTIONS = [
  { value: TypeContrat.CDI, label: 'CDI' },
  { value: TypeContrat.CDD, label: 'CDD' },
  { value: TypeContrat.STAGE, label: 'Stage' },
  { value: TypeContrat.SIVP, label: 'SIVP' },
  { value: TypeContrat.FREELANCE, label: 'Freelance' },
  { value: TypeContrat.ALTERNANCE, label: 'Alternance' },
];

const SECTORS = [
  'Informatique / IT',
  'Intelligence Artificielle / Data',
  'Finance / Banque',
  'Télécommunications',
  'Industrie / Ingénierie',
  'Santé / Pharma',
  'Commerce / Vente',
  'Marketing / Communication',
  'RH / Recrutement',
  'Consulting / Conseil',
  'Enseignement / Formation',
  'Tourisme / Hôtellerie',
  'Autre',
];

const POPULAR_SKILLS = [
  'Python',
  'TensorFlow',
  'PyTorch',
  'NLP',
  'Machine Learning',
  'Deep Learning',
  'FastAPI',
  'Docker',
  'MLOps',
  'Kubernetes',
  'SQL',
  'Java',
  'Spring Boot',
  'TypeScript',
  'React',
  'Node.js',
  'Git',
  'Scrum',
  'PostgreSQL',
  'AWS',
];

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const { refreshProfile, setPhotoFileId } = useCandidateProfile();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>((searchParams.get('tab') as TabId) || 'infos');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<CandidateProfile | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loadedPhotoBlobUrl, setLoadedPhotoBlobUrl] = useState<string | null>(null);
  const [showAIConseils, setShowAIConseils] = useState(false);
  const [aiConseils, setAiConseils] = useState<any>(null);
  const [newSkill, setNewSkill] = useState('');
  const [verification, setVerification] = useState<any>(null);

  useEffect(() => {
    loadProfile();
    return () => {
      if (loadedPhotoBlobUrl) URL.revokeObjectURL(loadedPhotoBlobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loadedPhotoBlobUrl) URL.revokeObjectURL(loadedPhotoBlobUrl);
    setLoadedPhotoBlobUrl(null);
    if (formData?.photoFileId) {
      loadMyPhotoBlobUrl().then((url) => {
        if (url) setLoadedPhotoBlobUrl(url);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.photoFileId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, verif] = await Promise.all([
        getProfile(),
        getMyVerification().catch(() => null),
      ]);
      setFormData(data);
      setVerification(verif);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setError('SESSION_EXPIRED');
      } else if (!err?.response) {
        setError('SERVER_UNREACHABLE');
      } else {
        setError(err.message || 'Erreur lors du chargement de votre profil');
      }
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.FC<any>; count?: number }[] = [
    { id: 'infos', label: 'Coordonnées & Bio', icon: User },
    { id: 'competences', label: 'Compétences & Tags', icon: Award, count: formData?.competences?.length },
    { id: 'parcours', label: 'Parcours Pro', icon: Briefcase, count: formData?.parcours?.length },
    { id: 'formations', label: 'Formations', icon: GraduationCap, count: formData?.formations?.length },
    { id: 'cv', label: 'CV & Documents', icon: FileText },
    { id: 'liens', label: 'Liens & Préférences', icon: Link2 },
  ];

  const updateForm = (patch: Partial<CandidateProfile>) => {
    if (!formData) return;
    setFormData({ ...formData, ...patch });
  };

  const calculateCompletion = (): number => {
    if (!formData) return 0;
    let score = 0;
    if (formData.firstName && formData.lastName) score += 15;
    if (formData.photoFileId || formData.photoFileUrl) score += 10;
    if (formData.bio) score += 15;
    if (formData.phone && formData.address) score += 15;
    if (formData.competences && formData.competences.length >= 3) score += 20;
    if (formData.parcours && formData.parcours.length >= 1) score += 12;
    if (formData.formations && formData.formations.length >= 1) score += 13;
    return Math.min(score, 100);
  };

  const toggleSearchContrat = (val: TypeContrat) => {
    if (!formData) return;
    const current = formData.searchPreferences?.typeContrat || [];
    const next = current.includes(val) ? current.filter((c) => c !== val) : [...current, val];
    updateForm({ searchPreferences: { ...(formData.searchPreferences || {}), typeContrat: next } });
  };

  const globalVerifStatus: string =
    verification?.statusGlobal || verification?.statut || 'NON_VERIFIE';
  const isVerified = globalVerifStatus === 'VERIFIE' || globalVerifStatus === 'VALIDE';
  const isVerifRejected = globalVerifStatus === 'REJETE';
  const isVerifPending = !isVerified && !isVerifRejected && globalVerifStatus !== 'NON_VERIFIE';

  const handleSave = async () => {
    if (!formData) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await updateProfile(formData);
      setFormData(updated);
      setSuccess('Profil mis à jour avec succès !');
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadCV = async () => {
    if (!cvFile) return;
    try {
      setCvUploading(true);
      setError(null);
      const result = await uploadCV(cvFile);
      if (formData) {
        setFormData({
          ...formData,
          cvFileName: result.fileName,
          cvFileUrl: result.fileUrl,
        });
      }
      setCvFile(null);
      setSuccess('Votre CV a été téléversé avec succès.');
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'upload du CV");
    } finally {
      setCvUploading(false);
    }
  };

  const handlePhotoSelect = (file: File) => {
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return;
    try {
      setPhotoUploading(true);
      setError(null);
      const result = await uploadPhoto(photoFile);
      if (formData) {
        setFormData({
          ...formData,
          photoFileId: result.photoFileId,
          photoFileName: result.photoFileName,
          photoFileUrl: result.photoFileUrl,
        });
      }
      setPhotoFileId(result.photoFileId);
      await refreshProfile();
      setPhotoFile(null);
      setPhotoPreview(null);
      setSuccess('Votre photo de profil a été téléversée avec succès.');
      setTimeout(() => setSuccess(null), 3500);
      try {
        await refresh();
      } catch {
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'upload de la photo");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleCancelPhotoSelect = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleAIConseils = async () => {
    try {
      setAiLoading(true);
      const conseils = await getAIConseilsProfil();
      setAiConseils(conseils);
      setShowAIConseils(true);
    } catch (err: any) {
      setError(err.message || 'Erreur IA');
    } finally {
      setAiLoading(false);
    }
  };

  // Compétences management
  const addSkill = (skill: string) => {
    if (!formData || !skill.trim()) return;
    const trimmed = skill.trim();
    if (!formData.competences.includes(trimmed)) {
      updateForm({ competences: [...formData.competences, trimmed] });
    }
    setNewSkill('');
  };

  const removeSkill = (skillToRemove: string) => {
    if (!formData) return;
    updateForm({
      competences: formData.competences.filter((c) => c !== skillToRemove),
    });
  };

  // Parcours management
  const addExperience = () => {
    if (!formData) return;
    const newExp: Experience = {
      titre: '',
      entreprise: '',
      dateDebut: '',
      dateFin: '',
      description: '',
    };
    updateForm({ parcours: [newExp, ...formData.parcours] });
  };

  const updateExperience = (index: number, patch: Partial<Experience>) => {
    if (!formData) return;
    const updated = [...formData.parcours];
    updated[index] = { ...updated[index], ...patch };
    updateForm({ parcours: updated });
  };

  const removeExperience = (index: number) => {
    if (!formData) return;

    const experience = formData.parcours[index];
    const label = experience?.titre?.trim() || `l’expérience n°${index + 1}`;

    const confirmed = window.confirm(`Voulez-vous vraiment supprimer ${label} ?`);
    if (!confirmed) return;

    updateForm({ parcours: formData.parcours.filter((_, i) => i !== index) });
  };

  // Formations management
  const addFormation = () => {
    if (!formData) return;
    const newForm: Formation = { diplome: '', ecole: '', annee: '' };
    updateForm({ formations: [newForm, ...formData.formations] });
  };

  const updateFormation = (index: number, patch: Partial<Formation>) => {
    if (!formData) return;
    const updated = [...formData.formations];
    updated[index] = { ...updated[index], ...patch };
    updateForm({ formations: updated });
  };

  const removeFormation = (index: number) => {
    if (!formData) return;

    const formation = formData.formations[index];
    const label = formation?.diplome?.trim() || `la formation n°${index + 1}`;

    const confirmed = window.confirm(`Voulez-vous vraiment supprimer ${label} ?`);
    if (!confirmed) return;

    updateForm({ formations: formData.formations.filter((_, i) => i !== index) });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-10 h-10 text-signal dark:text-cyan-400 animate-spin" />
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Chargement de votre profil...</p>
      </div>
    );
  }

  if (!formData) {
    const isAuthError = error === 'SESSION_EXPIRED';
    const isNetworkError = error === 'SERVER_UNREACHABLE';
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${
          isAuthError ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
        }`}>
          <AlertCircle className={`w-8 h-8 ${isAuthError ? 'text-amber-400' : 'text-red-400'}`} />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {isAuthError ? 'Session expirée' : isNetworkError ? 'Serveur inaccessible' : 'Profil introuvable'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
            {isAuthError
              ? 'Votre session a expiré ou vous n\'avez pas les droits nécessaires. Veuillez vous reconnecter avec vos identifiants candidat.'
              : isNetworkError
              ? 'Impossible de joindre le serveur. Vérifiez que le backend est bien démarré sur le port 8080.'
              : 'Une erreur inattendue est survenue lors du chargement de votre profil.'}
          </p>
          {isAuthError && (
            <p className="text-xs font-semibold text-signal dark:text-cyan-400 mt-2">
              Identifiants : yassine.trabelsi@rhconnect.tn / RhConnect2026!
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isAuthError ? (
            <button
              onClick={() => navigate('/auth/login')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-signal dark:bg-cyan-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 dark:bg-signal transition-all"
            >
              Se reconnecter
            </button>
          ) : (
            <button
              onClick={loadProfile}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-signal dark:bg-cyan-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 dark:bg-signal transition-all"
            >
              <Loader2 className="w-3.5 h-3.5" /> Réessayer
            </button>
          )}
        </div>
      </div>
    );
  }
  const completion = calculateCompletion();

  return (
    <div className="max-w-7xl mx-auto py-5 space-y-5">
      {/* Messages */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-danger-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-danger-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-emerald-700">{success}</p>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                {(photoPreview || loadedPhotoBlobUrl) ? (
                  <img
                    src={photoPreview || loadedPhotoBlobUrl || ''}
                    alt="Photo de profil"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#243E54] shadow-xs"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[#172A3A] border-2 border-[#243E54] text-amber-500 dark:text-amber-400 flex items-center justify-center font-display text-2xl font-bold shadow-xs">
                    {formData.firstName?.[0] || 'C'}
                    {formData.lastName?.[0] || 'V'}
                  </div>
                )}

                <label className="absolute bottom-0 right-0 w-7 h-7 bg-signal dark:bg-cyan-600 hover:bg-teal-700 dark:bg-signal text-white rounded-full flex items-center justify-center cursor-pointer shadow-xs border-2 border-white dark:border-slate-900 transition-all group-hover:scale-110">
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhotoSelect(f);
                      e.target.value = '';
                    }}
                  />
                </label>

                {isVerified && (
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xs border-2 border-white" title="Dossier certifié conforme">
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                )}
                {isVerifRejected && (
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-[#E11D48] text-white rounded-full flex items-center justify-center shadow-xs border-2 border-white" title="Document rejeté — action requise">
                    <XCircle className="w-3 h-3" />
                  </div>
                )}
                {isVerifPending && !isVerified && !isVerifRejected && (
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-amber-500 dark:bg-amber-500 text-white rounded-full flex items-center justify-center shadow-xs border-2 border-white" title="Vérification en cours">
                    <Clock className="w-3 h-3" />
                  </div>
                )}
              </div>

              {photoFile && (
                <div className="flex gap-1.5 items-center">
                  <button
                    onClick={handleUploadPhoto}
                    disabled={photoUploading}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-signal dark:bg-cyan-600 hover:bg-teal-700 dark:bg-signal text-white rounded-lg text-[10px] font-bold shadow-xs transition-all disabled:opacity-70"
                  >
                    {photoUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
                    Valider
                  </button>
                  <button
                    onClick={handleCancelPhotoSelect}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {formData.firstName} {formData.lastName}
                </h1>
                {isVerified && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-[#059669] border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Dossier Certifié
                  </span>
                )}
                {isVerifRejected && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-rose-600 dark:text-rose-400 border border-red-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Document rejeté
                  </span>
                )}
                {isVerifPending && !isVerified && !isVerifRejected && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Vérification en cours
                  </span>
                )}
                {!isVerified && !isVerifRejected && !isVerifPending && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Non vérifié
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-xl">
                {formData.bio || 'Complétez votre bio pour vous présenter aux recruteurs'}
              </p>

              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-2 flex-wrap">
                {formData.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-signal dark:text-cyan-400" />
                    {formData.address}
                  </span>
                )}
                {formData.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-signal dark:text-cyan-400" />
                    {formData.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            <button
              onClick={handleAIConseils}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-signal/10 hover:bg-emerald-200 dark:bg-emerald-500/30 text-signal dark:text-cyan-400 border border-signal dark:border-cyan-600/30 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Conseils IA
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-signal dark:bg-cyan-600 hover:bg-teal-700 dark:bg-signal text-white rounded-xl font-bold text-xs shadow-xs transition-all disabled:opacity-70 cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Sauvegarder
            </button>
          </div>
        </div>

        {/* Completion Bar */}
        <div className="mt-4 pt-3.5 border-t border-[#F1F5F9]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-900 dark:text-white">Complétion du profil</span>
            <span className="font-bold text-signal dark:text-cyan-400">{completion}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0F766E] to-[#14B8A6] rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xs overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto bg-slate-100 dark:bg-slate-800 p-2 gap-1.5">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === id
                  ? 'bg-white dark:bg-slate-900 text-signal dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-white dark:bg-slate-900/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {count !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    activeTab === id ? 'bg-emerald-100 dark:bg-emerald-500/20 text-signal dark:text-cyan-400' : 'bg-[#E2E8F0] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8">
          {/* TAB 1: INFOS */}
          {activeTab === 'infos' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white">Prénom</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateForm({ firstName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white">Nom de famille</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateForm({ lastName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white">Numéro de téléphone (+216...)</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => updateForm({ phone: e.target.value })}
                    placeholder="+216 20 123 456"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white">Localisation / Ville</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => updateForm({ address: e.target.value })}
                    placeholder="Ex: Kantaoui, Sousse, Tunisie"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white">Bio & Synthèse de profil</label>
                  <textarea
                    value={formData.bio || ''}
                    onChange={(e) => updateForm({ bio: e.target.value })}
                    rows={4}
                    placeholder="Présentez brièvement vos expertises, vos réalisations clés et vos objectifs de carrière..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600 resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-signal dark:bg-cyan-600 text-white rounded-xl font-bold text-xs hover:bg-teal-700 dark:bg-signal transition-all shadow-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: COMPETENCES */}
          {activeTab === 'competences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Mes compétences techniques & clés</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Ces compétences sont utilisées par notre moteur de matching pour calculer la compatibilité avec les offres.</p>
              </div>

              {/* Add custom skill input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-slate-400 dark:text-slate-600 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill(newSkill);
                      }
                    }}
                    placeholder="Ajouter une compétence (ex: PyTorch, Docker, Spring Boot)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addSkill(newSkill)}
                  className="px-5 py-2.5 bg-signal dark:bg-cyan-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 dark:bg-signal transition-all cursor-pointer"
                >
                  Ajouter
                </button>
              </div>

              {/* Current Active Skills */}
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-3">
                  Compétences actives ({formData.competences.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {formData.competences.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-signal dark:text-cyan-400 border border-signal dark:border-cyan-600/30 shadow-2xs group"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-signal dark:text-cyan-400/60 hover:text-danger-500 font-bold ml-0.5 cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-3">
                  Suggestions populaires
                </span>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SKILLS.filter((s) => !formData.competences.includes(s)).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-signal dark:border-cyan-600 hover:text-signal dark:text-cyan-400 hover:bg-emerald-50 dark:bg-signal/10 transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-signal dark:text-cyan-400" /> {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-signal dark:bg-cyan-600 text-white rounded-xl font-bold text-xs hover:bg-teal-700 dark:bg-signal transition-all shadow-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer les compétences
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PARCOURS */}
          {activeTab === 'parcours' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Expériences professionnelles</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Détaillez vos postes précédents, projets phares et technologies utilisées.</p>
                </div>
                <button
                  type="button"
                  onClick={addExperience}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-100 dark:bg-emerald-500/20 text-signal dark:text-cyan-400 hover:bg-emerald-200 dark:bg-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Ajouter une expérience
                </button>
              </div>

              <div className="space-y-4">
                {formData.parcours.map((exp, index) => (
                  <div
                    key={index}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-signal dark:border-cyan-600/40 transition-all shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                      <div className="flex items-center gap-2 text-xs font-bold text-signal dark:text-cyan-400">
                        <Briefcase className="w-4 h-4" /> Expérience #{index + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExperience(index)}
                        className="p-1.5 text-neutral-400 hover:text-danger-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Supprimer cette expérience"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Intitulé du poste</label>
                        <input
                          type="text"
                          value={exp.titre}
                          onChange={(e) => updateExperience(index, { titre: e.target.value })}
                          placeholder="Ex: Lead Data Scientist"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Entreprise & Ville</label>
                        <input
                          type="text"
                          value={exp.entreprise}
                          onChange={(e) => updateExperience(index, { entreprise: e.target.value })}
                          placeholder="Ex: IA Innovation Sousse"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Date de début</label>
                        <input
                          type="date"
                          value={exp.dateDebut}
                          onChange={(e) => updateExperience(index, { dateDebut: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Date de fin (laisser vide si en poste)</label>
                        <input
                          type="date"
                          value={exp.dateFin || ''}
                          onChange={(e) => updateExperience(index, { dateFin: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Missions & Réalisations</label>
                        <textarea
                          rows={3}
                          value={exp.description || ''}
                          onChange={(e) => updateExperience(index, { description: e.target.value })}
                          placeholder="Décrivez vos missions, architectures déployées, stack technique..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-signal dark:bg-cyan-600 text-white rounded-xl font-bold text-xs hover:bg-teal-700 dark:bg-signal transition-all shadow-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer les expériences
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: FORMATIONS */}
          {activeTab === 'formations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Formations & Diplômes</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Indiquez vos cursus d'ingénieur, universités et certifications.</p>
                </div>
                <button
                  type="button"
                  onClick={addFormation}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-100 dark:bg-emerald-500/20 text-signal dark:text-cyan-400 hover:bg-emerald-200 dark:bg-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Ajouter une formation
                </button>
              </div>

              <div className="space-y-4">
                {formData.formations.map((form, index) => (
                  <div
                    key={index}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-signal dark:border-cyan-600/40 transition-all shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                      <div className="flex items-center gap-2 text-xs font-bold text-signal dark:text-cyan-400">
                        <GraduationCap className="w-4 h-4" /> Formation #{index + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFormation(index)}
                        className="p-1.5 text-neutral-400 hover:text-danger-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Supprimer cette formation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Diplôme obtenu</label>
                        <input
                          type="text"
                          value={form.diplome}
                          onChange={(e) => updateFormation(index, { diplome: e.target.value })}
                          placeholder="Ex: Diplôme National d'Ingénieur en Informatique"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Année d'obtention</label>
                        <input
                          type="text"
                          value={form.annee}
                          onChange={(e) => updateFormation(index, { annee: e.target.value })}
                          placeholder="Ex: 2021"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-3">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">École / Université</label>
                        <input
                          type="text"
                          value={form.ecole}
                          onChange={(e) => updateFormation(index, { ecole: e.target.value })}
                          placeholder="Ex: ENISO Sousse / INSAT Tunis / ESPRIT"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-signal dark:bg-cyan-600 text-white rounded-xl font-bold text-xs hover:bg-teal-700 dark:bg-signal transition-all shadow-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer les formations
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: CV */}
          {activeTab === 'cv' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Curriculum Vitae (PDF)</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Votre CV est transmis aux recruteurs lors de vos candidatures certifiées.</p>
              </div>

              {formData.cvFileName && !cvFile && (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-signal/10 dark:bg-signal dark:bg-cyan-600/10 border border-[#CCF0EB] dark:border-signal dark:border-cyan-600/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-signal dark:bg-cyan-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#134E4A]">{formData.cvFileName}</h4>
                      <p className="text-xs text-signal dark:text-cyan-400 dark:text-[#5EEAD4] font-medium mt-0.5">CV principal actif</p>
                    </div>
                  </div>
                  {formData.cvFileName && (
                    <button
                      type="button"
                      onClick={() => downloadMyCV(formData.cvFileName)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-white dark:bg-slate-900/[0.07] text-signal dark:text-cyan-400 dark:text-[#5EEAD4] font-bold text-xs rounded-xl border border-signal dark:border-cyan-600/30 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:hover:bg-signal dark:bg-cyan-600/20 transition-all self-start sm:self-center"
                    >
                      <Download className="w-4 h-4" /> Télécharger / Visualiser
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900 dark:text-white">
                  {formData.cvFileName ? 'Remplacer mon CV par un nouveau fichier' : 'Déposer mon CV'}
                </label>
                <FileDropZone
                  selectedFile={cvFile}
                  onFileSelect={setCvFile}
                  onFileRemove={() => setCvFile(null)}
                  acceptedTypes=".pdf,.doc,.docx"
                  label="Déposez votre CV ici ou cliquez pour parcourir"
                  hint="Format PDF recommandé (max 10MB)"
                />
              </div>

              {cvFile && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleUploadCV}
                    disabled={cvUploading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-signal dark:bg-cyan-600 text-white rounded-xl font-bold text-xs hover:bg-teal-700 dark:bg-signal transition-all shadow-sm"
                  >
                    {cvUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Confirmer et téléverser le CV
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: LIENS & PRÉFÉRENCES */}
          {activeTab === 'liens' && (
            <div className="space-y-8">
              {/* Liens complémentaires */}
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-signal dark:text-cyan-400" /> Liens professionnels
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Ces liens sont affichés sur votre profil public et transmis aux recruteurs.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-900 dark:text-white">Profil LinkedIn</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-600 dark:text-slate-400 text-xs font-semibold select-none">linkedin.com/in/</span>
                      <input
                        type="text"
                        value={(formData.linkedin || '').replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '')}
                        onChange={(e) => updateForm({ linkedin: e.target.value ? `https://linkedin.com/in/${e.target.value}` : '' })}
                        placeholder="votre-profil"
                        className="w-full pl-[120px] pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-900 dark:text-white">Portfolio / Site web</label>
                    <input
                      type="url"
                      value={formData.portfolio || ''}
                      onChange={(e) => updateForm({ portfolio: e.target.value })}
                      placeholder="https://monportfolio.tn"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                    />
                  </div>
                </div>
              </div>

              {/* Séparateur */}
              <div className="border-t border-[#F1F5F9]" />

              {/* Préférences de recherche */}
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-signal dark:text-cyan-400" /> Préférences de recherche d'emploi
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Utilisées pour personnaliser vos recommandations d'offres et alertes emails.
                  </p>
                </div>

                {/* Types de contrat */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white">Types de contrat souhaités</label>
                  <div className="flex flex-wrap gap-2">
                    {CONTRACT_OPTIONS.map(({ value, label }) => {
                      const active = (formData.searchPreferences?.typeContrat || []).includes(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleSearchContrat(value)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            active
                              ? 'bg-signal dark:bg-cyan-600 text-white border-signal dark:border-cyan-600 shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-signal dark:border-cyan-600 hover:text-signal dark:text-cyan-400'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Secteur */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white">Secteur d'activité préféré</label>
                  <select
                    value={formData.searchPreferences?.secteur || ''}
                    onChange={(e) =>
                      updateForm({
                        searchPreferences: {
                          ...(formData.searchPreferences || {}),
                          secteur: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                  >
                    <option value="">Tous les secteurs</option>
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Localisation souhaitée */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white">Localisation souhaitée</label>
                  <select
                    value={formData.searchPreferences?.localisation || ''}
                    onChange={(e) =>
                      updateForm({
                        searchPreferences: {
                          ...(formData.searchPreferences || {}),
                          localisation: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                  >
                    <option value="">Toute la Tunisie</option>
                    {TUNISIAN_CITIES.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                    <option value="Remote">Télétravail / Remote</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-signal dark:bg-cyan-600 text-white rounded-xl font-bold text-xs hover:bg-teal-700 dark:bg-signal transition-all shadow-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer les préférences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Tips Modal */}
      {showAIConseils && aiConseils && (
        <div className="fixed inset-0 bg-[#172A3A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-[#F1F5F9] flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0F766E] to-[#14B8A6] rounded-xl flex items-center justify-center shadow-md shadow-[#0F766E]/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Recommandations IA pour votre profil</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Score de visibilité potentiel : <span className="font-bold text-signal dark:text-cyan-400">+{aiConseils.scoreAmelioration}%</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAIConseils(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-3.5">
              {aiConseils.conseils.map((c: string, i: number) => (
                <div key={i} className="flex gap-3.5 p-4 bg-emerald-50 dark:bg-signal/10 border border-[#CCF0EB] rounded-2xl">
                  <span className="w-6 h-6 bg-signal dark:bg-cyan-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-[#134E4A] leading-relaxed font-medium">{c}</p>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-[#F1F5F9] bg-slate-100 dark:bg-slate-800 rounded-b-3xl flex justify-end">
              <button
                onClick={() => setShowAIConseils(false)}
                className="px-5 py-2.5 bg-[#172A3A] text-white text-xs font-bold rounded-xl hover:bg-[#1E3A52] transition-colors"
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

export default ProfilePage;

