import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of, map, catchError } from 'rxjs';

/**
 * Protects admin/backoffice routes:
 * - If not logged in (no active or refreshable session) -> redirects to /login.
 * - If user does not have ADMIN or RECRUITER role -> clears session and redirects to /login.
 * - If access token is expired but refresh token is valid -> attempts refresh before allowing access.
 */
export const adminGuard: CanActivateFn = (): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // No valid session (neither access token nor refresh token are valid, or no user)
  if (!auth.hasValidSession()) {
    auth.clearAll();
    return router.createUrlTree(['/login']);
  }

  // Active access token exists
  if (auth.isAccessTokenValid()) {
    if (auth.isAdminOrRecruiter()) {
      return true;
    }
    auth.clearAll();
    return router.createUrlTree(['/login']);
  }

  // Access token expired, but valid refresh token exists -> attempt refresh
  return auth.refreshAccessToken().pipe(
    map((tokens) => {
      if (tokens && auth.isAdminOrRecruiter()) {
        return true;
      }
      auth.clearAll();
      return router.createUrlTree(['/login']);
    }),
    catchError(() => {
      auth.clearAll();
      return of(router.createUrlTree(['/login']));
    })
  );
};

/**
 * Prevents already authenticated admins/recruiters from accessing /login:
 * - If authenticated -> redirects directly to /dashboard.
 * - If not authenticated -> allows access to /login.
 */
export const adminGuestGuard: CanActivateFn = (): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // If already logged in with valid token and proper role
  if (auth.isAccessTokenValid() && auth.isAdminOrRecruiter()) {
    return router.createUrlTree(['/dashboard']);
  }

  // If access token expired but session might still be active via refresh token
  if (auth.hasValidSession()) {
    return auth.refreshAccessToken().pipe(
      map((tokens) => {
        if (tokens && auth.isAdminOrRecruiter()) {
          return router.createUrlTree(['/dashboard']);
        }
        return true; // refresh failed -> allow login
      }),
      catchError(() => of(true))
    );
  }

  // Not connected -> can enter /login
  return true;
};

export const guestGuard = adminGuestGuard;

export const adminOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  if (auth.isAdmin()) {
    return true;
  }
  return router.createUrlTree(['/dashboard']);
};
