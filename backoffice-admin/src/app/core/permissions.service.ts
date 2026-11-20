import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

export type PermissionKey =
  | 'dashboard:view'
  | 'users:list'
  | 'users:view'
  | 'users:toggle-status'
  | 'users:update-role'
  | 'users:delete'
  | 'users:reset-password'
  | 'users:impersonate'
  | 'audit:view'
  | 'audit:export'
  | 'offers:list'
  | 'offers:view'
  | 'offers:moderate'
  | 'offers:update'
  | 'offers:duplicate'
  | 'offers:delete'
  | 'applications:list'
  | 'applications:view'
  | 'applications:update-status'
  | 'applications:force-status'
  | 'applications:add-note'
  | 'applications:dispute'
  | 'verifications:list'
  | 'verifications:view'
  | 'verifications:validate'
  | 'verifications:lock'
  | 'verifications:assign'
  | 'reporting:view'
  | 'settings:view'
  | 'settings:manage'
  | 'system:maintenance'
  | 'ai:supervise';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly auth = inject(AuthService);

  can(permission: PermissionKey): boolean {
    const isAdmin = this.auth.isAdmin();
    const isRecruiter = this.auth.hasRole('RECRUITER');
    if (!isAdmin && !isRecruiter) return false;

    switch (permission) {
      case 'dashboard:view':
      case 'offers:list':
      case 'offers:view':
      case 'applications:list':
      case 'applications:view':
      case 'applications:update-status':
      case 'verifications:list':
      case 'verifications:view':
      case 'verifications:validate':
      case 'reporting:view':
      case 'settings:view':
      case 'offers:moderate':
      case 'offers:update':
      case 'offers:duplicate':
      case 'applications:force-status':
      case 'applications:add-note':
      case 'applications:dispute':
        return isAdmin || isRecruiter;

      case 'users:list':
      case 'users:view':
      case 'users:toggle-status':
      case 'users:update-role':
      case 'users:delete':
      case 'users:reset-password':
      case 'users:impersonate':
      case 'audit:view':
      case 'audit:export':
      case 'offers:delete':
      case 'verifications:lock':
      case 'verifications:assign':
      case 'settings:manage':
      case 'system:maintenance':
      case 'ai:supervise':
        return isAdmin;

      default:
        return false;
    }
  }

  canAny(permissions: PermissionKey[]): boolean {
    return permissions.some((p) => this.can(p));
  }

  canAll(permissions: PermissionKey[]): boolean {
    return permissions.every((p) => this.can(p));
  }
}
