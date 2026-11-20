import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Loader2, Mail, Lock, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';
import PasswordStrength from '../../components/forms/PasswordStrength';
import { forgotPassword, resetPassword } from '../../api/auth.api';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/;

const requestSchema = z.object({
  email: z.string().email('Adresse email invalide'),
});

const resetSchema = z
  .object({
    newPassword: z
      .string()
      .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
      .regex(
        passwordRegex,
        'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type RequestForm = z.infer<typeof requestSchema>;
type ResetForm = z.infer<typeof resetSchema>;

type Step = 'request' | 'reset' | 'success-request' | 'success-reset';

const ForgotPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [step, setStep] = useState<Step>(tokenFromUrl ? 'reset' : 'request');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState<string>(tokenFromUrl || '');

  useEffect(() => {
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
      setStep('reset');
    }
  }, [tokenFromUrl]);

  const requestForm = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    mode: 'onTouched',
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const handleRequestSubmit = async (data: RequestForm) => {
    try {
      setSubmitting(true);
      setError(null);
      await forgotPassword(data.email);
      setStep('success-request');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Une erreur est survenue. Réessayez plus tard.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (data: ResetForm) => {
    try {
      setSubmitting(true);
      setError(null);
      await resetPassword(resetToken, data.newPassword);
      setStep('success-reset');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Une erreur est survenue. Vérifiez que votre lien est valide.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderRequestForm = () => (
    <>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 mb-4">
          <Mail className="w-7 h-7 text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Mot de passe oublié
        </h1>
        <p className="text-sm text-neutral-600">
          Saisissez votre email. Un lien de réinitialisation vous sera envoyé.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-danger-500/20 rounded-xl text-sm text-danger-500 flex items-start gap-2">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={requestForm.handleSubmit(handleRequestSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
            Email <span className="text-danger-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-neutral-400" />
            </div>
            <input
              id="email"
              type="email"
              placeholder="candidat@rhconnect.tn"
              {...requestForm.register('email')}
              className={`w-full pl-11 pr-3.5 py-2.5 rounded-lg border text-neutral-800 placeholder:text-neutral-400 transition-colors
                focus:outline-none focus:ring-2 focus:ring-primary-500/20
                ${requestForm.formState.errors.email
                  ? 'border-danger-500 focus:border-danger-500 bg-red-50/50'
                  : 'border-neutral-300 focus:border-primary-500 bg-white hover:border-neutral-400'
                }
              `}
            />
          </div>
          {requestForm.formState.errors.email && (
            <p className="text-sm text-danger-500">{requestForm.formState.errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !requestForm.formState.isValid}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              Envoyer le lien
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>
      </div>
    </>
  );

  const renderSuccessRequest = () => (
    <div className="text-center py-4">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-5">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-3">Email envoyé</h1>
      <p className="text-sm text-neutral-600 mb-2">
        Si un compte correspond à cette adresse, un email contenant un lien de
        réinitialisation a été envoyé.
      </p>
      <p className="text-xs text-neutral-500 mb-6">
        Ce lien est valide 30 minutes. Pensez à vérifier vos spams.
      </p>
      <div className="space-y-3">
        <button
          onClick={() => {
            setStep('request');
            requestForm.reset();
            setError(null);
          }}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 transition-all"
        >
          Essayer une autre adresse
        </button>
        <Link
          to="/auth/login"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>
      </div>
    </div>
  );

  const renderResetForm = () => (
    <>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 mb-4">
          <KeyRound className="w-7 h-7 text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Nouveau mot de passe
        </h1>
        <p className="text-sm text-neutral-600">
          Définissez votre nouveau mot de passe.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-danger-500/20 rounded-xl text-sm text-danger-500 flex items-start gap-2">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {!tokenFromUrl && (
        <div className="mb-5 space-y-1.5">
          <label htmlFor="token" className="block text-sm font-medium text-neutral-700">
            Clé de réinitialisation <span className="text-danger-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <KeyRound className="w-5 h-5 text-neutral-400" />
            </div>
            <input
              id="token"
              type="text"
              placeholder="Collez le code reçu par email"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              className="w-full pl-11 pr-3.5 py-2.5 rounded-lg border border-neutral-300 text-neutral-800 placeholder:text-neutral-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-neutral-400 transition-colors"
            />
          </div>
        </div>
      )}

      <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700">
            Nouveau mot de passe <span className="text-danger-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-neutral-400" />
            </div>
            <input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              {...resetForm.register('newPassword')}
              className={`w-full pl-11 pr-3.5 py-2.5 rounded-lg border text-neutral-800 placeholder:text-neutral-400 transition-colors
                focus:outline-none focus:ring-2 focus:ring-primary-500/20
                ${resetForm.formState.errors.newPassword
                  ? 'border-danger-500 focus:border-danger-500 bg-red-50/50'
                  : 'border-neutral-300 focus:border-primary-500 bg-white hover:border-neutral-400'
                }
              `}
            />
          </div>
          {resetForm.watch('newPassword') && (
            <PasswordStrength password={resetForm.watch('newPassword')} />
          )}
          {resetForm.formState.errors.newPassword && (
            <p className="text-sm text-danger-500">{resetForm.formState.errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
            Confirmer le mot de passe <span className="text-danger-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-neutral-400" />
            </div>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...resetForm.register('confirmPassword')}
              className={`w-full pl-11 pr-3.5 py-2.5 rounded-lg border text-neutral-800 placeholder:text-neutral-400 transition-colors
                focus:outline-none focus:ring-2 focus:ring-primary-500/20
                ${resetForm.formState.errors.confirmPassword
                  ? 'border-danger-500 focus:border-danger-500 bg-red-50/50'
                  : 'border-neutral-300 focus:border-primary-500 bg-white hover:border-neutral-400'
                }
              `}
            />
          </div>
          {resetForm.formState.errors.confirmPassword && (
            <p className="text-sm text-danger-500">{resetForm.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !resetForm.formState.isValid || (!tokenFromUrl && !resetToken)}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Réinitialisation...
            </>
          ) : (
            <>
              Réinitialiser le mot de passe
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>
      </div>
    </>
  );

  const renderSuccessReset = () => (
    <div className="text-center py-4">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-5">
      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-3">
        Mot de passe réinitialisé
      </h1>
      <p className="text-sm text-neutral-600 mb-6">
        Votre mot de passe a été changé avec succès. Toutes vos sessions
        ont été déconnectées.
      </p>
      <Link
        to="/auth/login"
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all"
      >
        Se connecter
        <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center">
      <div className="max-w-lg w-full mx-auto">
        <div className="bg-white rounded-2xl shadow-xl shadow-neutral-900/5 border border-neutral-200 overflow-hidden">
          <div className="p-6 sm:p-8">
            {step === 'request' && renderRequestForm()}
            {step === 'success-request' && renderSuccessRequest()}
            {step === 'reset' && renderResetForm()}
            {step === 'success-reset' && renderSuccessReset()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
