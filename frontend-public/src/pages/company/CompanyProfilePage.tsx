import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Save,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Briefcase,
  Globe,
  Users,
  ShieldCheck,
  FileCheck,
  Lock,
  Sparkles,
  Phone,
  Mail,
  FileText,
} from 'lucide-react';
import { getProfile, updateProfile, uploadLogo } from '../../api/company.api';
import client from '../../api/client';
import FileDropZone from '../../components/forms/FileDropZone';
import { useLang } from '../../context/LangContext';

type TabId = 'completion' | 'verification' | 'account';

const getPIECE_TYPES = (t: any) => [
  { value: 'RCA', label: t('company.verification.rca') || 'Registre de commerce / RNE' },
  { value: 'STATUTS', label: t('company.verification.statuts') || 'Statuts de l’entreprise' },
  { value: 'CERTIFICATION', label: t('company.verification.certification') || 'Attestation / Certification fiscale' },
  { value: 'AUTRE', label: t('company.verification.otherDocument') || 'Autre document officiel' },
] as const;

const STATUS_ICON: Record<string, React.ReactNode> = {
  VERIFIE: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
  REJETE: <XCircle className="w-4 h-4 text-rose-500" />,
  EN_COURS: <Clock className="w-4 h-4 text-amber-500" />,
  NON_VERIFIE: <Clock className="w-4 h-4 text-slate-400" />,
};

const CompanyProfilePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabId) || 'completion';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Verification state
  const [verification, setVerification] = useState<any>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [pieceType, setPieceType] = useState<string>('RCA');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docMessage, setDocMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const { t } = useLang();
  const [profile, setProfile] = useState<any>({
    companyName: '',
    siret: '',
    description: '',
    sector: '',
    size: '',
    address: '',
    website: '',
    email: '',
    phone: '',
    logoUrl: '',
  });

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabId;
    if (tabParam && ['completion', 'verification', 'account'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const loadVerification = async () => {
    try {
      const res = await client.get('/verifications/company/me');
      setVerification(res.data);
    } catch {
      setVerification(null);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [profileData] = await Promise.all([
        getProfile().catch((err) => {
          console.error('Profile fetch error:', err);
          return null;
        }),
        loadVerification(),
      ]);

      if (profileData) {
        setProfile(profileData);
        if (profileData.logoBase64Data) {
          setLogoBase64(profileData.logoBase64Data);
          try {
            localStorage.setItem('companyLogo', profileData.logoBase64Data);
          } catch (e) {
            console.warn('Could not save logo to localStorage:', e);
          }
        } else {
          setLogoBase64(null);
          try {
            localStorage.removeItem('companyLogo');
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (err: any) {
      setError(err.message || t('company.profile.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const updated = await updateProfile(profile);
      setProfile((prev: any) => ({ ...prev, ...updated }));
      setSuccess('Modifications enregistrées avec succès !');
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || t('company.profile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      setError(null);
      const updatedProfile = await uploadLogo(file);
      setProfile((prev: any) => ({ ...prev, ...updatedProfile }));
      if (updatedProfile.logoBase64Data) {
        setLogoBase64(updatedProfile.logoBase64Data);
        try {
          localStorage.setItem('companyLogo', updatedProfile.logoBase64Data);
          window.dispatchEvent(
            new CustomEvent('companyLogoUpdated', {
              detail: { logo: updatedProfile.logoBase64Data },
            })
          );
        } catch (e) {
          console.warn('Could not save logo to localStorage:', e);
        }
      }
      setSuccess(t('company.profile.logoUploaded') || 'Logo mis à jour avec succès');
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || t('company.profile.uploadError'));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!docFile) return;
    try {
      setUploadingDoc(true);
      setDocMessage(null);

      const formData = new FormData();
      formData.append('type', pieceType);
      formData.append('nomFichier', docFile.name);
      formData.append('fichier', docFile);

      await client.post('/verifications/company/upload-piece', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setDocFile(null);
      setDocMessage({
        text: t('company.verification.uploadSuccess') || 'Document envoyé avec succès pour vérification',
        ok: true,
      });
      await loadVerification();
      setTimeout(() => setDocMessage(null), 4000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        t('company.verification.uploadError') ||
        "Erreur lors du téléversement du document";
      setDocMessage({
        text: msg,
        ok: false,
      });
    } finally {
      setUploadingDoc(false);
    }
  };

  // Profile completion based only on supplemental fields and verification
  const calculateCompletion = () => {
    let completedSteps = 0;
    const totalSteps = 6;

    const hasLogo = Boolean(logoBase64 || profile.logoFileId || profile.logoUrl);
    const hasDesc = Boolean(profile.description && profile.description.trim().length > 10);
    const hasSector = Boolean(profile.sector && profile.sector.trim().length > 0);
    const hasSize = Boolean(profile.size && profile.size.trim().length > 0);
    const hasWebsite = Boolean(profile.website && profile.website.trim().length > 3);
    const hasDocs = Boolean(
      profile.verified ||
      (verification?.pieces && verification.pieces.length > 0) ||
      verification?.statusGlobal === 'VERIFIE'
    );

    if (hasLogo) completedSteps++;
    if (hasDesc) completedSteps++;
    if (hasSector) completedSteps++;
    if (hasSize) completedSteps++;
    if (hasWebsite) completedSteps++;
    if (hasDocs) completedSteps++;

    const percent = Math.round((completedSteps / totalSteps) * 100);
    return {
      percent,
      completedSteps,
      totalSteps,
      items: [
        { label: 'Logo de l’entreprise', done: hasLogo, tab: 'completion' as TabId },
        { label: 'Description / Présentation', done: hasDesc, tab: 'completion' as TabId },
        { label: 'Secteur d’activité', done: hasSector, tab: 'completion' as TabId },
        { label: 'Taille de l’entreprise', done: hasSize, tab: 'completion' as TabId },
        { label: 'Site web officiel', done: hasWebsite, tab: 'completion' as TabId },
        { label: 'Documents de vérification (RNE)', done: hasDocs, tab: 'verification' as TabId },
      ],
    };
  };

  const pieces: any[] = verification?.pieces ?? [];
  const globalStatus: string = profile.verified
    ? 'VERIFIE'
    : verification?.statusGlobal ?? 'NON_VERIFIE';
  const isVerified = globalStatus === 'VERIFIE' || profile.verified;
  const completionData = calculateCompletion();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12">
        <div className="flex flex-col items-center justify-center py-16 gap-2.5">
          <Loader2 className="w-8 h-8 text-signal dark:text-cyan-400 animate-spin" />
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('company.profile.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-5 space-y-6">
      {/* Messages d'alerte */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-start gap-3 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{success}</p>
        </div>
      )}

      {/* Header Profil Entreprise */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {/* Logo */}
            <div className="relative flex-shrink-0">
              {logoBase64 || profile.logoUrl ? (
                <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-signal/20 dark:border-signal/30 shadow-md flex items-center justify-center overflow-hidden">
                  <img
                    src={logoBase64 || profile.logoUrl}
                    alt={profile.companyName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-800 dark:to-slate-700 border-2 border-amber-500/40 text-amber-500 dark:text-amber-400 flex items-center justify-center font-display font-extrabold text-3xl shadow-md">
                  {profile.companyName?.[0] || 'E'}
                </div>
              )}

              {isVerified && (
                <div
                  className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900"
                  title="Entreprise Vérifiée"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Infos clés créées à l'inscription */}
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {profile.companyName || 'Mon Entreprise'}
                </h1>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> Vérifiée RNE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                    <Clock className="w-3.5 h-3.5" />
                    {pieces.length > 0 ? 'Examen RNE en cours' : 'Vérification RNE en attente'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3.5 text-xs text-slate-600 dark:text-slate-400 mt-2 flex-wrap">
                {profile.siret && (
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    RNE / Matricule : <span className="font-mono">{profile.siret}</span>
                  </span>
                )}
                {profile.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-signal dark:text-cyan-400" />
                    {profile.address}
                  </span>
                )}
                {profile.sector && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-signal dark:text-cyan-400" />
                    {profile.sector}
                  </span>
                )}
                {profile.website && (
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-signal dark:text-cyan-400 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center flex-shrink-0">
            <button
              onClick={handleSubmitProfile}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-signal dark:bg-cyan-600 hover:bg-[#115E59] text-white rounded-xl font-bold text-xs shadow-md shadow-signal/20 transition-all disabled:opacity-60 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Enregistrement...' : 'Enregistrer le profil'}
            </button>
          </div>
        </div>

        {/* Barre de complétude du profil */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-signal dark:text-cyan-400" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                Complétude du profil entreprise :
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({completionData.completedSteps}/{completionData.totalSteps} éléments complétés)
              </span>
            </div>
            <span
              className={`text-xs font-extrabold ${
                completionData.percent === 100
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : completionData.percent >= 60
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {completionData.percent}%
            </span>
          </div>

          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completionData.percent === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : completionData.percent >= 60
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-rose-500 to-red-400'
              }`}
              style={{ width: `${completionData.percent}%` }}
            />
          </div>

          {/* Checklist interactive */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
            {completionData.items.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTabChange(item.tab)}
                className={`p-2 rounded-xl text-left border text-[11px] font-semibold transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                  item.done
                    ? 'bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-signal/40'
                }`}
              >
                <span className="truncate">{item.label}</span>
                {item.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation par Onglets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xs overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto bg-slate-50 dark:bg-slate-800/60 p-2 gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('completion')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'completion'
                ? 'bg-white dark:bg-slate-900 text-signal dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Complétion du profil
            <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-signal/10 dark:bg-cyan-400/10 text-signal dark:text-cyan-400">
              Infos requises
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('verification')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'verification'
                ? 'bg-white dark:bg-slate-900 text-signal dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Vérification des documents (RNE)
            {isVerified ? (
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                Vérifié
              </span>
            ) : pieces.length > 0 ? (
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">
                En cours ({pieces.length})
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('account')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'bg-white dark:bg-slate-900 text-signal dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Informations de base (Inscription)
          </button>
        </div>

        {/* CONTENU ONGLETS */}
        <div className="p-6 sm:p-8">
          {/* ══════════════ 1. ONGLET COMPLÉTION DU PROFIL ══════════════ */}
          {activeTab === 'completion' && (
            <form onSubmit={handleSubmitProfile} className="space-y-8">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Informations complémentaires de l’entreprise
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Renseignez ces détails pour valoriser votre marque employeur auprès des candidats qualifiés.
                </p>
              </div>

              {/* 1. Logo Section */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Upload className="w-4 h-4 text-signal dark:text-cyan-400" />
                      Logo officiel de l’entreprise
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Formats acceptés : PNG, JPG, JPEG, WEBP (Max 5 Mo).
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-signal dark:bg-cyan-600 hover:bg-[#115E59] text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-all disabled:opacity-60">
                    {uploadingLogo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {uploadingLogo ? 'Téléversement...' : 'Changer le logo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  {logoBase64 || profile.logoUrl ? (
                    <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center overflow-hidden shadow-2xs">
                      <img
                        src={logoBase64 || profile.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <Building2 className="w-6 h-6 mb-1 text-slate-300 dark:text-slate-600" />
                      <span className="text-[10px]">Aucun logo</span>
                    </div>
                  )}

                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {logoBase64 || profile.logoUrl ? '✓ Logo configuré' : '⚠️ Aucun logo sélectionné'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Le logo apparaîtra sur vos offres d’emploi et le tableau de bord des candidats.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Description / Présentation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white">
                    Description / Présentation de l’entreprise
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {profile.description?.length || 0} caractères
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={profile.description || ''}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  placeholder="Présentez votre entreprise, votre mission, vos valeurs, vos projets innovants et votre culture d’entreprise..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal dark:border-cyan-600 transition-all"
                />
              </div>

              {/* 3. Secteur d'activité, Taille & Site Web */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Secteur d'activité */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-signal dark:text-cyan-400" />
                    Secteur d’activité
                  </label>
                  <select
                    value={profile.sector || ''}
                    onChange={(e) => setProfile({ ...profile, sector: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal dark:border-cyan-600"
                  >
                    <option value="">Sélectionnez un secteur</option>
                    <option value="Informatique / IT">Informatique / IT & Logiciel</option>
                    <option value="IA & Data">IA & Data Science</option>
                    <option value="Finance">Finance / Banque / Fintech</option>
                    <option value="Telecom">Télécommunications</option>
                    <option value="Industrie">Industrie / Ingénierie</option>
                    <option value="Santé">Santé / Pharmacie / Biotech</option>
                    <option value="Commerce">Commerce / E-commerce</option>
                    <option value="Marketing">Marketing / Communication</option>
                    <option value="RH">Ressources Humaines / Recrutement</option>
                    <option value="Énergie">Énergie & Environnement</option>
                    <option value="Autre">Autre secteur</option>
                  </select>
                </div>

                {/* Taille de l'entreprise */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-signal dark:text-cyan-400" />
                    Taille de l’entreprise
                  </label>
                  <select
                    value={profile.size || ''}
                    onChange={(e) => setProfile({ ...profile, size: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal dark:border-cyan-600"
                  >
                    <option value="">Sélectionnez la taille</option>
                    <option value="1-10">1 à 10 employés (Startup / TPE)</option>
                    <option value="11-50">11 à 50 employés (PME en croissance)</option>
                    <option value="51-200">51 à 200 employés (Entreprise moyenne)</option>
                    <option value="201-500">201 à 500 employés (Grande entreprise)</option>
                    <option value="500+">500+ employés (Groupe / Multinationale)</option>
                  </select>
                </div>

                {/* Site web */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-signal dark:text-cyan-400" />
                    Site web officiel
                  </label>
                  <input
                    type="url"
                    value={profile.website || ''}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    placeholder="https://entreprise.tn"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal dark:border-cyan-600"
                  />
                </div>
              </div>

              {/* Bouton de sauvegarde */}
              <div className="flex justify-end pt-5 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-signal dark:bg-cyan-600 hover:bg-[#115E59] text-white rounded-xl font-bold text-sm shadow-md shadow-signal/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Enregistrement en cours...' : 'Enregistrer les informations'}
                </button>
              </div>
            </form>
          )}

          {/* ══════════════ 2. ONGLET VÉRIFICATION DES DOCS (RNE) ══════════════ */}
          {activeTab === 'verification' && (
            <div className="space-y-8">
              {/* Message de confirmation de téléversement */}
              {docMessage && (
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm font-medium ${
                    docMessage.ok
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {docMessage.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    )}
                    <span>{docMessage.text}</span>
                  </div>
                  <button
                    onClick={() => setDocMessage(null)}
                    className="font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Status Banner */}
              <div
                className={`p-6 sm:p-8 rounded-3xl border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                  isVerified
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                    : pieces.length > 0
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                      isVerified
                        ? 'bg-emerald-600 text-white'
                        : pieces.length > 0
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                      {isVerified
                        ? 'Entreprise certifiée & vérifiée (RNE)'
                        : pieces.length > 0
                        ? 'Documents en cours d’examen par l’équipe de conformité'
                        : 'Vérification légale de l’entreprise en attente'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl">
                      {isVerified
                        ? 'Votre compte entreprise a été validé avec succès sur la base de vos documents légaux (RNE / Registre de commerce). Votre badge de vérification est actif.'
                        : pieces.length > 0
                        ? 'Vos pièces justificatives ont bien été transmises. Notre équipe procède à la vérification dans un délai de 24 à 48 heures ouvrées.'
                        : 'Déposez votre extrait du Registre National des Entreprises (RNE) ou vos statuts légaux pour débloquer le badge Entreprise Vérifiée et maximiser la confiance des candidats.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Document Form */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs space-y-5">
                <div>
                  <h4 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    Déposer une nouvelle pièce justificative
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Sélectionnez le type de document puis déposez votre fichier (PDF, JPEG, PNG jusqu’à 10 Mo).
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                      Type de pièce légale
                    </label>
                    <select
                      value={pieceType}
                      onChange={(e) => setPieceType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal dark:border-cyan-600"
                    >
                      {getPIECE_TYPES(t).map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FileDropZone
                      selectedFile={docFile}
                      onFileSelect={setDocFile}
                      onFileRemove={() => setDocFile(null)}
                      acceptedTypes=".pdf,.jpg,.jpeg,.png"
                      label="Glissez-déposez votre document ici ou cliquez pour parcourir"
                      hint="PDF, JPEG, PNG (Taille max 10 Mo)"
                    />
                  </div>
                </div>

                {docFile && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleUploadDocument}
                      disabled={uploadingDoc}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-signal dark:bg-cyan-600 hover:bg-[#115E59] text-white rounded-xl font-bold text-xs shadow-md shadow-signal/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {uploadingDoc ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {uploadingDoc ? 'Envoi en cours...' : 'Transmettre pour vérification'}
                    </button>
                  </div>
                )}
              </div>

              {/* Historique des pièces transmises */}
              {pieces.length > 0 && (
                <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-signal dark:text-cyan-400" />
                      Documents enregistrés ({pieces.length})
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {pieces.map((piece: any, index: number) => {
                      const pieceStatus = piece.status || 'NON_VERIFIE';
                      const isRejected = pieceStatus === 'REJETE';
                      const isPieceVerified = pieceStatus === 'VERIFIE';

                      return (
                        <div
                          key={piece.id || index}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-3 ${
                            isRejected
                              ? 'border-red-200 bg-red-50/50 dark:bg-red-500/10'
                              : isPieceVerified
                              ? 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-500/10'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs border ${
                                isRejected
                                  ? 'bg-red-100 dark:bg-red-500/20 border-red-200 text-rose-600'
                                  : isPieceVerified
                                  ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 text-emerald-700'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 text-signal dark:text-cyan-400'
                              }`}
                            >
                              <FileText className="w-5 h-5" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {piece.nomFichier}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                  {piece.type}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Déposé le{' '}
                                {piece.uploadedAt
                                  ? new Date(piece.uploadedAt).toLocaleDateString('fr-FR')
                                  : 'Récemment'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                              {STATUS_ICON[pieceStatus]}
                              <span
                                className={
                                  isRejected
                                    ? 'text-rose-600'
                                    : isPieceVerified
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-slate-700 dark:text-slate-300'
                                }
                              >
                                {pieceStatus === 'VERIFIE' && 'Validé'}
                                {pieceStatus === 'REJETE' && 'Rejeté'}
                                {pieceStatus === 'EN_COURS' && 'En cours'}
                                {pieceStatus === 'NON_VERIFIE' && 'En attente'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notice confidentialité */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
                <Lock className="w-4 h-4 text-signal dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Vos documents d’entreprise et extraits RNE sont chiffrés et traités de manière strictement confidentielle. Ils ne sont jamais partagés avec des tiers et servent uniquement à authentifier votre structure sur la plateforme RhConnect.
                </p>
              </div>
            </div>
          )}

          {/* ══════════════ 3. ONGLET INFORMATIONS DE BASE (INSCRIPTION) ══════════════ */}
          {activeTab === 'account' && (
            <form onSubmit={handleSubmitProfile} className="space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Informations saisies lors de la création du compte
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Ces coordonnées ont été enregistrées à votre inscription. Vous pouvez les consulter ou les mettre à jour si vos informations légales changent.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enregistré à l’inscription
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                {/* Nom entreprise */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white">
                    Nom de l’entreprise *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.companyName || ''}
                    onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                    placeholder="ex: TechCorp Tunisia"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal dark:border-cyan-600"
                  />
                </div>

                {/* Matricule Fiscal / RNE */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white">
                    Matricule Fiscal / RNE *
                  </label>
                  <input
                    type="text"
                    value={profile.siret || ''}
                    onChange={(e) => setProfile({ ...profile, siret: e.target.value })}
                    placeholder="ex: 1234567M"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal dark:border-cyan-600"
                  />
                </div>

                {/* Email de contact */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-signal dark:text-cyan-400" />
                    Email de contact
                  </label>
                  <input
                    type="email"
                    value={profile.email || ''}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="contact@entreprise.tn"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal dark:border-cyan-600"
                  />
                </div>

                {/* Téléphone */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-signal dark:text-cyan-400" />
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+216 71 123 456"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal dark:border-cyan-600"
                  />
                </div>
              </div>

              {/* Adresse complète */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-signal dark:text-cyan-400" />
                  Adresse du siège social
                </label>
                <input
                  type="text"
                  value={profile.address || ''}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="ex: Les Berges du Lac 2, Tunis 1053"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal dark:border-cyan-600"
                />
              </div>

              <div className="flex justify-end pt-5 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-signal dark:bg-cyan-600 hover:bg-[#115E59] text-white rounded-xl font-bold text-sm shadow-md shadow-signal/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Enregistrement...' : 'Mettre à jour les coordonnées'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyProfilePage;
