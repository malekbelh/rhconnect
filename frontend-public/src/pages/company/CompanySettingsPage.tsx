import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  Globe,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Mail,
  KeyRound,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getSettings, updateSettings } from '../../api/settings.api';
import client from '../../api/client';
import type { UserSettings } from '../../api/settings.api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

type SectionId = 'notifications' | 'langue' | 'securite' | 'compte';

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
      checked ? 'bg-signal dark:bg-cyan-600' : 'bg-[#CBD5E1]'
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

const CompanySettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionId>('notifications');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

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
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (msg: string, ok = true) => {
    if (ok) setSuccess(msg); else setError(msg);
    setTimeout(() => { setSuccess(null); setError(null); }, 4000);
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      setError(null);
      await updateSettings(settings);
      showMsg('Paramètres enregistrés avec succès');
    } catch (err: any) {
      showMsg(err.message || 'Erreur lors de la sauvegarde', false);
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      showMsg('Veuillez entrer une nouvelle adresse email', false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showMsg('Adresse email invalide', false);
      return;
    }
    if (!emailPassword.trim()) {
      showMsg('Veuillez entrer votre mot de passe', false);
      return;
    }
    try {
      setEmailSaving(true);
      setError(null);
      await client.put('/auth/me/email', { newEmail: trimmedEmail, password: emailPassword });
      showMsg('Email changé avec succès. Veuillez vous reconnecter.');
      setNewEmail('');
      setEmailPassword('');
      setTimeout(() => { logout(); navigate('/auth/login'); }, 2000);
    } catch (err: any) {
      showMsg(err.response?.data?.message || 'Erreur lors du changement d\'email', false);
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      showMsg('Les mots de passe ne correspondent pas', false);
      return;
    }
    if (newPwd.length < 10) {
      showMsg('Le mot de passe doit contenir au moins 10 caractères', false);
      return;
    }
    if (!currentPwd.trim()) {
      showMsg('Veuillez entrer votre mot de passe actuel', false);
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
      showMsg('Mot de passe changé avec succès');
    } catch (err: any) {
      showMsg(err.response?.data?.message || 'Le mot de passe actuel est incorrect', false);
    } finally {
      setPwdSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      showMsg('Veuillez taper "SUPPRIMER" pour confirmer', false);
      return;
    }
    if (!deletePassword.trim()) {
      showMsg('Veuillez entrer votre mot de passe', false);
      return;
    }
    try {
      setDeleting(true);
      await client.delete('/auth/me', { data: { password: deletePassword } });
      await logout();
      navigate('/');
    } catch (err: any) {
      showMsg(err.response?.data?.message || 'Erreur lors de la suppression du compte', false);
      setDeleting(false);
    }
  };

  const updateField = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const sections: { id: SectionId; label: string; icon: React.FC<any> }[] = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'langue', label: 'Langue', icon: Globe },
    { id: 'securite', label: 'Sécurité', icon: Lock },
    { id: 'compte', label: 'Compte', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-5">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-signal dark:text-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-5 space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Paramètres</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Gérez vos préférences de notifications, langue, sécurité et compte.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-sm text-rose-600 dark:text-rose-400 font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-sm text-emerald-700 font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <nav className="space-y-1.5 bg-white border border-slate-200 dark:border-slate-700 p-3 rounded-3xl shadow-xs">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeSection === id
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-signal dark:text-cyan-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-5">

          {/* NOTIFICATIONS */}
          {settings && activeSection === 'notifications' && (
            <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="pb-4 border-b border-[#F1F5F9]">
                <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-signal dark:text-cyan-400" /> Notifications
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Configurez vos alertes recrutement</p>
              </div>
              <div className="space-y-4">
                {[
                  { key: 'notifNouvellesCandidatures' as keyof UserSettings, label: 'Nouvelles candidatures', description: 'Alertes quand un candidat postule' },
                  { key: 'notifChangementStatut' as keyof UserSettings, label: 'Changements de statut', description: 'Mises à jour de dossiers' },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-[#F1F5F9]">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{label}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{description}</p>
                    </div>
                    <Toggle checked={!!settings[key]} onChange={(v) => updateField(key, v as any)} />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-signal dark:bg-cyan-600 hover:bg-teal-700 dark:bg-signal text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer
                </button>
              </div>
            </div>
          )}

          {/* LANGUE */}
          {settings && activeSection === 'langue' && (
            <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="pb-4 border-b border-[#F1F5F9]">
                <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-signal dark:text-cyan-400" /> Langue
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Choisissez votre langue</p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-900 dark:text-white">Langue de l'interface</label>
                <select
                  value={settings.langue}
                  onChange={(e) => updateField('langue', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-signal dark:bg-cyan-600 hover:bg-teal-700 dark:bg-signal text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer
                </button>
              </div>
            </div>
          )}

          {/* SÉCURITÉ */}
          {activeSection === 'securite' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-xs">
                <div className="pb-4 border-b border-[#F1F5F9] mb-5">
                  <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-signal dark:text-cyan-400" /> Modifier l'email
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Email actuel : <span className="font-semibold text-slate-900 dark:text-white">{user?.email}</span>
                  </p>
                </div>
                <form onSubmit={handleEmailChange} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-900 dark:text-white">Nouvel email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="nouvel@email.com"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-900 dark:text-white">Mot de passe</label>
                    <input
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder="Confirmez avec votre mot de passe"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={emailSaving || !newEmail || !emailPassword}
                      className="flex items-center gap-2 px-6 py-2.5 bg-signal dark:bg-cyan-600 hover:bg-teal-700 dark:bg-signal text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50">
                      {emailSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Modifier l'email
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-xs">
                <div className="pb-4 border-b border-[#F1F5F9] mb-5">
                  <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-signal dark:text-cyan-400" /> Modifier le mot de passe
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Changez régulièrement pour sécuriser votre compte</p>
                </div>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-900 dark:text-white">Mot de passe actuel</label>
                    <div className="relative">
                      <input
                        type={showCurrentPwd ? 'text' : 'password'}
                        value={currentPwd}
                        onChange={(e) => setCurrentPwd(e.target.value)}
                        placeholder="Entrez votre mot de passe actuel"
                        required
                        className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                      />
                      <button type="button" onClick={() => setShowCurrentPwd((v) => !v)}
                        className="absolute right-3 top-2.5 text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:text-white">
                        {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-900 dark:text-white">Nouveau mot de passe</label>
                      <div className="relative">
                        <input
                          type={showNewPwd ? 'text' : 'password'}
                          value={newPwd}
                          onChange={(e) => setNewPwd(e.target.value)}
                          placeholder="Min. 10 caractères"
                          required
                          minLength={8}
                          className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                        />
                        <button type="button" onClick={() => setShowNewPwd((v) => !v)}
                          className="absolute right-3 top-2.5 text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:text-white">
                          {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-900 dark:text-white">Confirmer</label>
                      <input
                        type="password"
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        placeholder="Confirmez le mot de passe"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-signal dark:border-cyan-600"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={pwdSaving || !currentPwd || !newPwd || !confirmPwd}
                      className="flex items-center gap-2 px-6 py-2.5 bg-signal dark:bg-cyan-600 hover:bg-teal-700 dark:bg-signal text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50">
                      {pwdSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Modifier le mot de passe
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* COMPTE */}
          {activeSection === 'compte' && (
            <div className="bg-white border-2 border-red-200 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="pb-4 border-b border-red-100">
                <h2 className="font-display font-bold text-base text-red-600 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Supprimer le compte
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Cette action est irréversible. Tous vos dossiers, offres et candidatures seront supprimés.
                </p>
              </div>

              {!showDeleteConfirm ? (
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer mon compte
                  </button>
                </div>
              ) : (
                <div className="pt-6 space-y-4 p-4 rounded-2xl bg-red-50 border border-red-200">
                  <p className="text-sm font-bold text-red-600">
                    Confirmez en tapant "SUPPRIMER" ci-dessous
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    placeholder="Tapez SUPPRIMER"
                    className="w-full px-4 py-2.5 rounded-xl border border-red-200 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-500 bg-white"
                  />
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Confirmez avec votre mot de passe"
                    className="w-full px-4 py-2.5 rounded-xl border border-red-200 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-500 bg-white"
                  />
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeletePassword(''); }}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 bg-white border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:bg-slate-800 transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteConfirmText !== 'SUPPRIMER' || !deletePassword}
                      className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Supprimer définitivement
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CompanySettingsPage;

