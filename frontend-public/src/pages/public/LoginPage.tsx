import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const loginSchema = z.object({
  email: z.string().min(1, "L'adresse email est requise").email('Adresse email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

type LoginForm = z.infer<typeof loginSchema>;

function translateLoginError(error: any): string {
  const code: string = error?.response?.data?.code ?? '';
  const status: number = error?.response?.status ?? 0;
  const backendMsg: string = error?.response?.data?.message ?? '';

  const codeMap: Record<string, string> = {
    INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
    USER_NOT_FOUND: 'Aucun compte associé à cet email.',
    ACCOUNT_DISABLED: 'Votre compte a été désactivé. Contactez le support.',
    ACCOUNT_LOCKED: 'Votre compte est temporairement bloqué. Réessayez plus tard.',
    BAD_PASSWORD: 'Mot de passe incorrect.',
    EMAIL_NOT_VERIFIED: 'Veuillez verifier votre adresse email avant de vous connecter.',
    MISSING_EMAIL: "L'adresse email est requise.",
    MISSING_PASSWORD: 'Le mot de passe est requis.',
  };

  if (codeMap[code]) return codeMap[code];
  if (status === 401) return 'Email ou mot de passe incorrect.';
  if (status === 403) return "Accès refusé. Votre compte n'est pas autorisé à se connecter.";
  if (status === 429) return 'Trop de tentatives. Veuillez patienter quelques minutes.';
  if (status === 500) return 'Une erreur serveur est survenue. Réessayez plus tard.';
  if (status === 0 || (error as any)?.code === 'ERR_NETWORK')
    return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
  if (backendMsg && !backendMsg.toLowerCase().includes('request failed')) return backendMsg;
  return 'Une erreur est survenue. Veuillez reessayer.';
}

const LoginPage: React.FC = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [credentialError, setCredentialError] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const clearErrors = () => { setServerError(null); setCredentialError(false); };

  const onSubmit = async (data: LoginForm) => {
    try {
      clearErrors();
      const loggedInUser = await login(data);
      const from = (location.state as { from?: Location })?.from?.pathname;
      if (from && from !== '/auth/login' && from !== '/login') { navigate(from, { replace: true }); return; }
      const role = loggedInUser?.role || (loggedInUser?.roles && loggedInUser.roles[0]);
      if (role === 'CANDIDATE') navigate('/candidate/dashboard', { replace: true });
      else if (role === 'COMPANY' || role === 'RECRUITER') navigate('/company/dashboard', { replace: true });
      else if (role === 'ADMIN') window.location.href = 'http://localhost:4200';
      else navigate('/candidate/dashboard', { replace: true });
    } catch (error) {
      setServerError(translateLoginError(error));
      const status = (error as any)?.response?.status;
      if (status === 401 || status === 403) setCredentialError(true);
    }
  };

  const hasErr = (f: 'email' | 'password') => !!(errors[f] || credentialError);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center">
      <div className="max-w-lg w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Bienvenue</h1>
          <p className="text-neutral-600">Connectez-vous pour accéder à votre espace</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl shadow-neutral-900/5 border border-neutral-200 overflow-hidden">
          <div className="p-6 sm:p-8">
            {serverError && (
              <div role="alert" aria-live="assertive" className="mb-6 p-4 bg-red-50 border border-danger-500/30 rounded-xl text-sm text-danger-700 flex items-start gap-3" style={{ animation: 'fadeSlideIn 0.2s ease-out' }}>
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-danger-500" />
                <span className="font-medium">{serverError}</span>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-sm font-medium text-neutral-700">Email <span className="text-danger-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className={`w-5 h-5 ${hasErr('email') ? 'text-danger-400' : 'text-neutral-400'}`} />
                  </div>
                  <input id="login-email" type="email" autoComplete="email" placeholder="candidat@rhconnect.tn"
                    {...register('email', { onChange: clearErrors })}
                    className={`w-full pl-11 pr-3.5 py-2.5 rounded-lg border text-neutral-800 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${hasErr('email') ? 'border-danger-500 focus:border-danger-500 bg-red-50/50' : 'border-neutral-300 focus:border-primary-500 bg-white hover:border-neutral-400'}`} />
                </div>
                {errors.email && <p role="alert" className="text-sm text-danger-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="login-password" className="block text-sm font-medium text-neutral-700">Mot de passe <span className="text-danger-500">*</span></label>
                  <Link to="/auth/forgot-password" className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">Mot de passe oublié ?</Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className={`w-5 h-5 ${hasErr('password') ? 'text-danger-400' : 'text-neutral-400'}`} />
                  </div>
                  <input id="login-password" type="password" autoComplete="current-password" placeholder="••••••••"
                    {...register('password', { onChange: clearErrors })}
                    className={`w-full pl-11 pr-3.5 py-2.5 rounded-lg border text-neutral-800 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${hasErr('password') ? 'border-danger-500 focus:border-danger-500 bg-red-50/50' : 'border-neutral-300 focus:border-primary-500 bg-white hover:border-neutral-400'}`} />
                </div>
                {errors.password && <p role="alert" className="text-sm text-danger-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors.password.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-500 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />Connexion en cours...</>) : (<>Se connecter<ArrowRight className="w-5 h-5" /></>)}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-neutral-600">Pas encore de compte ?{' '}<Link to="/auth/register" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">Créer un compte</Link></p>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeSlideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default LoginPage;
