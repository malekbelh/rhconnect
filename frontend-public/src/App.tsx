import React, { lazy, Suspense } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import NavbarPublic from './components/layout/NavbarPublic';
import AppLayout from './components/layout/AppLayout';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import NotFoundPage from './pages/404Page';

// Candidate pages
import DashboardCandidat from './pages/candidate/DashboardCandidat';
import ProfilePage from './pages/candidate/ProfilePage';
import OffersPage from './pages/candidate/OffersPage';
import OfferDetailPage from './pages/candidate/OfferDetailPage';
import ApplicationsPage from './pages/candidate/ApplicationsPage';
import VerificationPage from './pages/candidate/VerificationPage';
const CandidateAIAssistantPage = lazy(() => import('./pages/candidate/CandidateAIAssistantPage'));
const CandidateSettingsPage = lazy(() => import('./pages/candidate/CandidateSettingsPage'));
const NotificationsPage = lazy(() => import('./pages/candidate/NotificationsPage'));

// Company pages
import DashboardCompany from './pages/company/DashboardCompany';
import CompanyOffersPage from './pages/company/CompanyOffersPage';
import CreateOfferPage from './pages/company/CreateOfferPage';
import EditOfferPage from './pages/company/EditOfferPage';
import CompanyProfilePage from './pages/company/CompanyProfilePage';
import CompanyApplicationsPage from './pages/company/CompanyApplicationsPage';
const CompanyDossierPage = lazy(() => import('./pages/company/CompanyDossierPage'));
const CompanyStatsPage = lazy(() => import('./pages/company/CompanyStatsPage'));
const CompanyAIAssistantPage = lazy(() => import('./pages/company/CompanyAIAssistantPage'));
const CompanySettingsPage = lazy(() => import('./pages/company/CompanySettingsPage'));
const CompanyVerificationPage = lazy(() => import('./pages/company/CompanyVerificationPage'));
const CompanyNotificationsPage = lazy(() => import('./pages/company/CompanyNotificationsPage'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-neutral-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
  </div>
);

const PublicLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-white">
    <NavbarPublic />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const AuthLayout: React.FC = () => (
  <AppLayout />
);

const App: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Candidate routes */}
        <Route element={<AuthLayout />}>
          <Route
            path="/candidate/dashboard"
            element={
              <ProtectedRoute requireRole="CANDIDATE">
                <DashboardCandidat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/profile"
            element={
              <ProtectedRoute requireRole="CANDIDATE">
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/offers"
            element={
              <ProtectedRoute requireRole="CANDIDATE">
                <OffersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/offers/:id"
            element={
              <ProtectedRoute requireRole="CANDIDATE">
                <OfferDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/applications"
            element={
              <ProtectedRoute requireRole="CANDIDATE">
                <ApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/verification"
            element={
              <ProtectedRoute requireRole="CANDIDATE">
                <VerificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/ai-assistant"
            element={
              <ProtectedRoute requireRole="CANDIDATE">
                <CandidateAIAssistantPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/settings"
            element={
              <ProtectedRoute requireRole="CANDIDATE">
                <CandidateSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/notifications"
            element={
              <ProtectedRoute requireRole="CANDIDATE">
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Company routes */}
        <Route element={<AuthLayout />}>
          <Route
            path="/company/dashboard"
            element={
              <ProtectedRoute requireRole="COMPANY">
                <DashboardCompany />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/offers"
            element={
              <ProtectedRoute requireRole="COMPANY">
                <CompanyOffersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/offers/new"
            element={
              <ProtectedRoute requireRole="COMPANY">
                <CreateOfferPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/offers/:id/edit"
            element={
              <ProtectedRoute requireRole="COMPANY">
                <EditOfferPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/profile"
            element={
              <ProtectedRoute requireRole="COMPANY">
                <CompanyProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/applications"
            element={
              <ProtectedRoute requireRole="COMPANY">
                <CompanyApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/dossiers"
            element={
              <ProtectedRoute requireRole="COMPANY">
                <CompanyDossierPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/stats"
            element={
              <ProtectedRoute requireRole="COMPANY">
                <CompanyStatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/ai-assistant"
            element={
              <ProtectedRoute requireRole="COMPANY">
                <CompanyAIAssistantPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/settings"
            element={
              <ProtectedRoute requireRole="COMPANY">
                <CompanySettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/verification"
            element={
              <ProtectedRoute requireRole="COMPANY">
                <CompanyVerificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/notifications"
            element={
              <ProtectedRoute requireRole="COMPANY">
                <CompanyNotificationsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default App;
