import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionsService, PermissionKey } from './permissions.service';
import { AuthService } from './auth.service';

export function createPermissionGuard(requiredPermission: PermissionKey): CanActivateFn {
  return () => {
    const permissions = inject(PermissionsService);
    const router = inject(Router);
    const auth = inject(AuthService);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }
    if (permissions.can(requiredPermission)) {
      return true;
    }
    return router.createUrlTree(['/dashboard']);
  };
}

export const canViewUsers = createPermissionGuard('users:list');
export const canManageUsers = createPermissionGuard('users:update-role');
export const canModerateOffers = createPermissionGuard('offers:moderate');
export const canViewAudit = createPermissionGuard('audit:view');
export const canViewReporting = createPermissionGuard('reporting:view');
export const canManageSettings = createPermissionGuard('settings:manage');
export const canSuperviseAI = createPermissionGuard('ai:supervise');
export const canViewVerifications = createPermissionGuard('verifications:list');
export const canViewApplications = createPermissionGuard('applications:list');
