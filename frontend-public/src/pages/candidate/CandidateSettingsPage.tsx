import React, { useState, useEffect } from 'react';
import {
  Bell,
  Globe,
  Eye,
  Lock,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Mail,
  Trash2,
  ShieldAlert,
  EyeOff,
  Check,
  X,
  ShieldCheck,
  UserCheck,
  HelpCircle,
} from 'lucide-react';
import { getSettings, updateSettings } from '../../api/settings.api';
import client from '../../api/client';
import type { UserSettings } from '../../api/settings.api';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { useNavigate } from 'react-router-dom';

type SectionId = 'notifications' | 'confidentialite' | 'langue' | 'securite' | 'compte';

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
      checked ? 'bg-signal dark:bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    aria-checked={checked}
    role="switch"
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const CandidateSettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useLang();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<SectionId>('notifications');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  // Password change
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  // Account deletion
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (msg: string, ok = true) => {
    if (ok) {
      setSuccess(msg);
      setError(null);
    } else {
      setError(msg);
      setSuccess(null);
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 4500);
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      setError(null);
      const updatedSettings = await updateSettings(settings);

      // If language changed, update the global lang context
      if (updatedSettings.langue && updatedSettings.langue !== locale) {
        setLocale(updatedSettings.langue as any);
      }

      setHasUnsavedChanges(false);
      showMsg(t('common.success'));
    } catch (err: any) {
      showMsg(err.response?.data?.message || err.message || t('settings.err_update_failed'), false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleChange = async (key: keyof UserSettings, value: boolean) => {
    if (key === 'notifPush' && value) {
      if ('Notification' in window) {
        try {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            showMsg(
              locale === 'en'
                ? 'Browser notification permission was denied in your browser settings.'
                : 'Les notifications du navigateur sont bloquées par votre navigateur.',
              false
            );
            return;
          }
        } catch (e) {
          console.warn('Could not request notification permission', e);
        }
      }
    }
    updateField(key, value);
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = newEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      showMsg(t('settings.err_email_required'), false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showMsg(t('settings.err_email_invalid'), false);
      return;
    }

    if (trimmedEmail === user?.email?.toLowerCase()) {
      showMsg(
        locale === 'en'
          ? 'The new email must be different from your current email.'
          : 'Le nouvel email doit être différent de l\'email actuel.',
        false
      );
      return;
    }

    if (!emailPassword.trim()) {
      showMsg(t('settings.err_password_required'), false);
      return;
    }

    try {
      setEmailSaving(true);
      setError(null);
      await client.put('/auth/me/email', { newEmail: trimmedEmail, password: emailPassword });
      showMsg(t('settings.sec_email_success'));
      setNewEmail('');
      setEmailPassword('');
      setTimeout(() => {
        logout();
        navigate('/auth/login');
      }, 2000);
    } catch (err: any) {
      showMsg(err.response?.data?.message || t('settings.err_update_failed'), false);
    } finally {
      setEmailSaving(false);
    }
  };

  // Password policy criteria check (aligned with backend PasswordPolicyValidator: MIN 10 chars)
  const passwordCriteria = {
    length: newPwd.length >= 10,
    hasUpper: /[A-Z]/.test(newPwd),
    hasLower: /[a-z]/.test(newPwd),
    hasDigit: /[0-9]/.test(newPwd),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(newPwd),
    noSpaces: !/\s/.test(newPwd) && newPwd.length > 0,
  };

  const isPasswordPolicyValid =
    passwordCriteria.length &&
    passwordCriteria.hasUpper &&
    passwordCriteria.hasLower &&
    passwordCriteria.hasDigit &&
    passwordCriteria.hasSpecial &&
    passwordCriteria.noSpaces;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPwd.trim()) {
      showMsg(t('settings.err_password_required'), false);
      return;
    }

    if (!isPasswordPolicyValid) {
      showMsg(t('settings.sec_password_minlength'), false);
      return;
    }

    if (newPwd !== confirmPwd) {
      showMsg(t('settings.sec_password_mismatch'), false);
      return;
    }

    try {
      setPwdSaving(true);
      setError(null);
      await client.put('/auth/me/password', { currentPassword: currentPwd, newPassword: newPwd });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setShowCurrentPwd(false);
      setShowNewPwd(false);
      showMsg(t('settings.sec_password_success'));
    } catch (err: any) {
      const respMsg = err.response?.data?.message;
      showMsg(respMsg || t('settings.err_current_password_wrong'), false);
    } finally {
      setPwdSaving(false);
    }
  };

  const isDeleteConfirmationValid = (text: string): boolean => {
    const clean = text.trim().toUpperCase();
    return clean === 'SUPPRIMER' || clean === 'DELETE';
  };

  const handleDeleteAccount = async () => {
    if (!isDeleteConfirmationValid(deleteConfirmText)) {
      showMsg(t('settings.err_delete_confirm_mismatch'), false);
      return;
    }

    if (!deletePassword.trim()) {
      showMsg(t('settings.err_password_required'), false);
      return;
    }

    try {
      setDeleting(true);
      await client.delete('/auth/me', { data: { password: deletePassword } });
      await logout();
      navigate('/');
    } catch (err: any) {
      showMsg(err.response?.data?.message || t('settings.err_update_failed'), false);
      setDeleting(false);
    }
  };

  const updateField = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
    setHasUnsavedChanges(true);
  };

  const sections: { id: SectionId; label: string; icon: React.FC<any> }[] = [
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'confidentialite', label: t('settings.confidentiality'), icon: Eye },
    { id: 'securite', label: t('settings.security'), icon: Lock },
    { id: 'langue', label: t('settings.language'), icon: Globe },
    { id: 'compte', label: t('settings.account'), icon: ShieldAlert },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4">
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-9 h-9 text-signal dark:text-cyan-400 animate-spin" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('settings.title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t('settings.subtitle')}
          </p>
        </div>

        {hasUnsavedChanges && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs font-semibold animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{t('settings.unsaved_changes')}</span>
          </div>
        )}
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-3 text-sm text-red-700 dark:text-red-400 font-medium animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <span className="whitespace-pre-line">{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-start gap-3 text-sm text-emerald-800 dark:text-emerald-300 font-medium animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <nav className="space-y-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-3xl shadow-xs">
            {sections.map(({ id, label, icon: Icon }) => {
              const active = activeSection === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                    active
                      ? 'bg-teal-50 dark:bg-teal-950/50 text-signal dark:text-cyan-400 shadow-xs border border-teal-100 dark:border-teal-800/40'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-signal dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3 space-y-6">

          {/* SECTION 1: NOTIFICATIONS */}
          {settings && activeSection === 'notifications' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
                <div>
                  <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-signal dark:text-cyan-400" /> {t('settings.notif_title')}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t('settings.notif_subtitle')}</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {[
                  {
                    key: 'emailCandidatures' as keyof UserSettings,
                    label: t('settings.notif_applications'),
                    description: t('settings.notif_applications_desc'),
                  },
                  {
                    key: 'emailOffres' as keyof UserSettings,
                    label: t('settings.notif_offers'),
                    description: t('settings.notif_offers_desc'),
                  },
                  {
                    key: 'emailMessages' as keyof UserSettings,
                    label: t('settings.notif_messages'),
                    description: t('settings.notif_messages_desc'),
                  },
                  {
                    key: 'notifPush' as keyof UserSettings,
                    label: t('settings.notif_push'),
                    description: t('settings.notif_push_desc'),
                  },
                ].map(({ key, label, description }) => (
                  <div
                    key={key}
                    className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{label}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{description}</p>
                    </div>
                    <Toggle
                      checked={!!settings[key]}
                      onChange={(v) => handleToggleChange(key, v)}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-signal hover:bg-signal-dark dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t('common.save')}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 2: CONFIDENTIALITÉ */}
          {settings && activeSection === 'confidentialite' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-signal dark:text-cyan-400" /> {t('settings.conf_title')}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t('settings.conf_subtitle')}</p>
              </div>

              <div className="space-y-3.5">
                {[
                  {
                    key: 'profilPublic' as keyof UserSettings,
                    label: t('settings.conf_profile'),
                    description: t('settings.conf_profile_desc'),
                  },
                  {
                    key: 'cvPublic' as keyof UserSettings,
                    label: t('settings.conf_cv'),
                    description: t('settings.conf_cv_desc'),
                  },
                ].map(({ key, label, description }) => (
                  <div
                    key={key}
                    className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{label}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{description}</p>
                    </div>
                    <Toggle
                      checked={!!settings[key]}
                      onChange={(v) => updateField(key, v)}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-signal hover:bg-signal-dark dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t('common.save')}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 3: SÉCURITÉ */}
          {activeSection === 'securite' && (
            <div className="space-y-6">
              {/* Modification email */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                  <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-signal dark:text-cyan-400" /> {t('settings.sec_email_title')}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {t('settings.sec_email_current')} :{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">{user?.email}</span>
                  </p>
                </div>

                <form onSubmit={handleEmailChange} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-900 dark:text-white">
                      {t('settings.sec_email_new')}
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder={t('settings.sec_email_new_placeholder')}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-signal/20 dark:focus:ring-cyan-500/20 focus:border-signal dark:focus:border-cyan-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-900 dark:text-white">
                      {t('settings.sec_email_password')}
                    </label>
                    <input
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder={t('settings.sec_email_password_placeholder')}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-signal/20 dark:focus:ring-cyan-500/20 focus:border-signal dark:focus:border-cyan-500 transition-all"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={emailSaving || !newEmail || !emailPassword}
                      className="flex items-center gap-2 px-6 py-2.5 bg-signal hover:bg-signal-dark dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {emailSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {t('settings.sec_email_button')}
                    </button>
                  </div>
                </form>
              </div>

              {/* Modification mot de passe avec politique à 10 caractères et checklist dynamique */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                  <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-signal dark:text-cyan-400" /> {t('settings.sec_password_title')}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {t('settings.sec_password_subtitle')}
                  </p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {/* Mot de passe actuel */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-900 dark:text-white">
                      {t('settings.sec_password_current')}
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPwd ? 'text' : 'password'}
                        value={currentPwd}
                        onChange={(e) => setCurrentPwd(e.target.value)}
                        placeholder={t('settings.sec_password_current_placeholder')}
                        required
                        className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-signal/20 dark:focus:ring-cyan-500/20 focus:border-signal dark:focus:border-cyan-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPwd((v) => !v)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                      >
                        {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Nouveau mot de passe et Confirmation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-900 dark:text-white">
                        {t('settings.sec_password_new')}
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPwd ? 'text' : 'password'}
                          value={newPwd}
                          onChange={(e) => setNewPwd(e.target.value)}
                          placeholder={t('settings.sec_password_new_placeholder')}
                          required
                          minLength={10}
                          className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-signal/20 dark:focus:ring-cyan-500/20 focus:border-signal dark:focus:border-cyan-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPwd((v) => !v)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                        >
                          {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-900 dark:text-white">
                        {t('settings.sec_password_confirm')}
                      </label>
                      <input
                        type="password"
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        placeholder={t('settings.sec_password_confirm_placeholder')}
                        required
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-signal/20 dark:focus:ring-cyan-500/20 focus:border-signal dark:focus:border-cyan-500 transition-all ${
                          confirmPwd && confirmPwd !== newPwd
                            ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-950/20'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                      />
                      {confirmPwd && confirmPwd !== newPwd && (
                        <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                          {t('settings.sec_password_mismatch')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Checklist des exigences de sécurité en temps réel */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {t('settings.sec_password_policy_desc')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {[
                        { label: locale === 'en' ? 'At least 10 characters' : 'Au moins 10 caractères', ok: passwordCriteria.length },
                        { label: locale === 'en' ? 'Uppercase letter (A-Z)' : 'Lettre majuscule (A-Z)', ok: passwordCriteria.hasUpper },
                        { label: locale === 'en' ? 'Lowercase letter (a-z)' : 'Lettre minuscule (a-z)', ok: passwordCriteria.hasLower },
                        { label: locale === 'en' ? 'Digit (0-9)' : 'Au moins un chiffre (0-9)', ok: passwordCriteria.hasDigit },
                        { label: locale === 'en' ? 'Special symbol (!@#$...)' : 'Caractère spécial (!@#$...)', ok: passwordCriteria.hasSpecial },
                        { label: locale === 'en' ? 'No spaces' : 'Aucun espace', ok: passwordCriteria.noSpaces },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-1.5 transition-colors ${
                            item.ok
                              ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {item.ok ? (
                            <Check className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <X className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                          )}
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={
                        pwdSaving ||
                        !currentPwd ||
                        !newPwd ||
                        !isPasswordPolicyValid ||
                        newPwd !== confirmPwd
                      }
                      className="flex items-center gap-2 px-6 py-2.5 bg-signal hover:bg-signal-dark dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pwdSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                      {t('settings.sec_password_button')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SECTION 4: LANGUE */}
          {settings && activeSection === 'langue' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-signal dark:text-cyan-400" /> {t('settings.lang_title')}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t('settings.lang_subtitle')}</p>
              </div>

              <div className="space-y-2 max-w-md">
                <label className="block text-xs font-bold text-slate-900 dark:text-white">
                  {t('settings.lang_preferred')}
                </label>
                <select
                  value={settings.langue}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    updateField('langue', newLang);
                    setLocale(newLang as any);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-signal/20 dark:focus:ring-cyan-500/20 focus:border-signal dark:focus:border-cyan-500 transition-all"
                >
                  <option value="fr">{t('settings.lang_french')}</option>
                  <option value="en">{t('settings.lang_english')}</option>
                </select>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-signal hover:bg-signal-dark dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t('common.save')}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 5: COMPTE & SUPPRESSION */}
          {activeSection === 'compte' && (
            <div className="space-y-6">
              {/* Informations détaillées du compte */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-signal dark:text-cyan-400" /> {t('settings.acc_info_title')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{t('settings.acc_email_label')}</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-1 break-all">{user?.email}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{t('settings.acc_role_label')}</p>
                    <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-900 dark:text-white">
                      <UserCheck className="w-4 h-4 text-signal dark:text-cyan-400" />
                      <span>{t('settings.acc_role_candidate')}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Statut du compte</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {user?.verified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                          <ShieldCheck className="w-4 h-4" /> Certifié Conforme
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold">
                          <HelpCircle className="w-4 h-4" /> En vérification
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone de danger — Suppression du compte */}
              <div className="bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-900/50 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="pb-4 border-b border-red-100 dark:border-red-900/40">
                  <h2 className="font-display font-bold text-base text-red-600 dark:text-red-400 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" /> {t('settings.acc_delete_title')}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {t('settings.acc_delete_subtitle')}
                  </p>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> {t('settings.acc_delete_button')}
                  </button>
                ) : (
                  <div className="space-y-4 p-5 rounded-2xl bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                    <p className="text-xs font-bold text-red-700 dark:text-red-400">
                      {t('settings.acc_delete_confirm')}
                    </p>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder={t('settings.acc_delete_confirm_placeholder')}
                        className="w-full px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/60 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-500"
                      />
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder={t('settings.acc_delete_password_placeholder')}
                        className="w-full px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/60 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-500"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                          setDeletePassword('');
                        }}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                      >
                        {t('settings.acc_delete_cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deleting || !isDeleteConfirmationValid(deleteConfirmText) || !deletePassword}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        {t('settings.acc_delete_final')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateSettingsPage;
