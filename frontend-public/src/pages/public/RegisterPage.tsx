import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm, type FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Briefcase, Building2, ArrowRight, Loader2 } from 'lucide-react';
import FormField from '../../components/forms/FormField';
import PasswordStrength from '../../components/forms/PasswordStrength';
import Alert from '../../components/alert/Alert';
import { useAuth } from '../../context/AuthContext';

type Role = 'CANDIDATE' | 'COMPANY';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/;

const candidateSchema = z
  .object({
    firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Adresse email invalide'),
    phone: z.string().optional(),
    password: z
      .string()
      .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
      .regex(
        passwordRegex,
        'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

const companySchema = z
  .object({
    companyName: z.string().min(2, "Le nom de l'entreprise doit contenir au moins 2 caractères"),
    siret: z.string().optional(),
    email: z.string().email('Adresse email invalide'),
    phone: z.string().optional(),
    address: z.string().optional(),
    password: z
      .string()
      .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
      .regex(
        passwordRegex,
        'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type CandidateForm = z.infer<typeof candidateSchema>;
type CompanyForm = z.infer<typeof companySchema>;

const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<Role>('CANDIDATE');
  const { register: registerAuth, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const candidateForm = useForm<CandidateForm>({
    resolver: zodResolver(candidateSchema),
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const companyForm = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    mode: 'onTouched',
    defaultValues: {
      companyName: '',
      siret: '',
      email: '',
      phone: '',
      address: '',
      password: '',
      confirmPassword: '',
    },
  });

  const candidatePassword = candidateForm.watch('password');
  const companyPassword = companyForm.watch('password');

  const candidateRootError = candidateForm.formState.errors.root as FieldError | undefined;
  const companyRootError = companyForm.formState.errors.root as FieldError | undefined;
  const rootError = role === 'CANDIDATE' ? candidateRootError : companyRootError;

  const onSubmitCandidate = async (data: CandidateForm) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await registerAuth({
        role: 'CANDIDATE',
        ...registerData,
      });
      const from = (location.state as { from?: Location })?.from?.pathname || '/candidate/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Une erreur est survenue lors de l'inscription";
      candidateForm.setError('root', { type: 'server', message });
    }
  };

  const onSubmitCompany = async (data: CompanyForm) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await registerAuth({
        role: 'COMPANY',
        ...registerData,
      });
      const from = (location.state as { from?: Location })?.from?.pathname || '/company/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Une erreur est survenue lors de l'inscription";
      companyForm.setError('root', { type: 'server', message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#F1F5F9] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#172A3A] mb-3">Créer votre compte</h1>
          <p className="text-[#64748B] text-lg">Rejoignez RhConnect et commencez votre voyage</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] overflow-hidden backdrop-blur-sm">
          {/* Role Tabs */}
          <div className="grid grid-cols-2 bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] border-b border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setRole('CANDIDATE')}
              className={`flex items-center justify-center gap-2 px-4 py-4 text-sm font-bold transition-all relative ${
                role === 'CANDIDATE'
                  ? 'text-[#0F766E] bg-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#475569] hover:bg-white/40'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              Candidat
              {role === 'CANDIDATE' && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0F766E] to-[#06B6D4] rounded-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setRole('COMPANY')}
              className={`flex items-center justify-center gap-2 px-4 py-4 text-sm font-bold transition-all relative ${
                role === 'COMPANY'
                  ? 'text-[#0F766E] bg-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#475569] hover:bg-white/40'
              }`}
            >
              <Building2 className="w-5 h-5" />
              Entreprise
              {role === 'COMPANY' && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0F766E] to-[#06B6D4] rounded-full" />
              )}
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8">
            {rootError?.message && (
              <div className="mb-6">
                <Alert 
                  type="error" 
                  title="Erreur d'inscription" 
                  message={rootError.message}
                  closeable={false}
                />
              </div>
            )}

            {role === 'CANDIDATE' ? (
              <form onSubmit={candidateForm.handleSubmit(onSubmitCandidate)} className="space-y-5">
                {/* Name Row */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Prénom"
                    id="firstName"
                    placeholder="Mohamed"
                    register={candidateForm.register('firstName')}
                    error={candidateForm.formState.errors.firstName}
                    required
                  />
                  <FormField
                    label="Nom"
                    id="lastName"
                    placeholder="Ben Salem"
                    register={candidateForm.register('lastName')}
                    error={candidateForm.formState.errors.lastName}
                    required
                  />
                </div>

                {/* Phone */}
                <FormField
                  label="Téléphone"
                  id="phone"
                  type="tel"
                  placeholder="+216 20 123 456"
                  register={candidateForm.register('phone')}
                  error={candidateForm.formState.errors.phone}
                />

                {/* Email */}
                <FormField
                  label="Email"
                  id="email"
                  type="email"
                  placeholder="exemple@email.tn"
                  register={candidateForm.register('email')}
                  error={candidateForm.formState.errors.email}
                  required
                />

                {/* Password */}
                <div className="space-y-5">
                  <FormField
                    label="Mot de passe"
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    register={candidateForm.register('password')}
                    error={candidateForm.formState.errors.password}
                    required
                  />
                  {candidatePassword && <PasswordStrength password={candidatePassword} />}
                </div>

                {/* Confirm Password */}
                <FormField
                  label="Confirmer le mot de passe"
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  register={candidateForm.register('confirmPassword')}
                  error={candidateForm.formState.errors.confirmPassword}
                  required
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !candidateForm.formState.isValid}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#0F766E] to-[#115E59] hover:from-[#115E59] hover:to-[#0D5048] text-white font-bold rounded-xl shadow-lg shadow-[#0F766E]/25 hover:shadow-xl hover:shadow-[#0F766E]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Inscription en cours...
                    </>
                  ) : (
                    <>
                      Créer mon compte
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} className="space-y-5">
                {/* Company Name */}
                <FormField
                  label="Nom de l'entreprise"
                  id="companyName"
                  placeholder="Mon Entreprise SARL"
                  register={companyForm.register('companyName')}
                  error={companyForm.formState.errors.companyName}
                  required
                />

                {/* SIRET & Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Matricule / RNE"
                    id="siret"
                    placeholder="1234567M"
                    register={companyForm.register('siret')}
                    error={companyForm.formState.errors.siret}
                  />
                  <FormField
                    label="Téléphone"
                    id="phone"
                    type="tel"
                    placeholder="+216 71 123 456"
                    register={companyForm.register('phone')}
                    error={companyForm.formState.errors.phone}
                  />
                </div>

                {/* Address */}
                <FormField
                  label="Adresse"
                  id="address"
                  placeholder="Les Berges du Lac 2, Tunis"
                  register={companyForm.register('address')}
                  error={companyForm.formState.errors.address}
                />

                {/* Email */}
                <FormField
                  label="Email"
                  id="email"
                  type="email"
                  placeholder="contact@entreprise.tn"
                  register={companyForm.register('email')}
                  error={companyForm.formState.errors.email}
                  required
                />

                {/* Password */}
                <div className="space-y-5">
                  <FormField
                    label="Mot de passe"
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    register={companyForm.register('password')}
                    error={companyForm.formState.errors.password}
                    required
                  />
                  {companyPassword && <PasswordStrength password={companyPassword} />}
                </div>

                {/* Confirm Password */}
                <FormField
                  label="Confirmer le mot de passe"
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  register={companyForm.register('confirmPassword')}
                  error={companyForm.formState.errors.confirmPassword}
                  required
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !companyForm.formState.isValid}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#0F766E] to-[#115E59] hover:from-[#115E59] hover:to-[#0D5048] text-white font-bold rounded-xl shadow-lg shadow-[#0F766E]/25 hover:shadow-xl hover:shadow-[#0F766E]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Inscription en cours...
                    </>
                  ) : (
                    <>
                      Créer mon compte
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Login Link */}
            <p className="mt-6 text-center text-sm text-[#64748B]">
              Vous avez déjà un compte ?{' '}
              <Link
                to="/auth/login"
                className="font-bold text-[#0F766E] hover:text-[#115E59] transition-colors"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
