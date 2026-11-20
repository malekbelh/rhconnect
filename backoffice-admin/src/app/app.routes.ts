import { Routes } from '@angular/router';
import { adminGuard, adminGuestGuard, adminOnlyGuard } from './core/admin.guard';
import {
  canViewUsers,
  canModerateOffers,
  canViewApplications,
  canViewVerifications,
  canViewReporting,
  canManageSettings,
} from './core/permissions.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [adminGuestGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: '',
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    loadComponent: () => import('./core/layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'users',
        canActivate: [canViewUsers, adminOnlyGuard],
        loadComponent: () => import('./pages/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'offers',
        canActivate: [canModerateOffers],
        loadComponent: () => import('./pages/offers/offers.component').then((m) => m.OffersComponent),
      },
      {
        path: 'applications',
        canActivate: [canViewApplications],
        loadComponent: () => import('./pages/applications/applications.component').then((m) => m.ApplicationsComponent),
      },
      {
        path: 'verifications',
        canActivate: [canViewVerifications],
        loadComponent: () => import('./pages/verifications/verifications.component').then((m) => m.VerificationsComponent),
      },
      {
        path: 'reporting',
        canActivate: [canViewReporting],
        loadComponent: () => import('./pages/reporting/reporting.component').then((m) => m.ReportingComponent),
      },
      {
        path: 'settings',
        canActivate: [canManageSettings, adminOnlyGuard],
        loadComponent: () => import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'notifications',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
