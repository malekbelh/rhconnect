import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, Observable, of, switchMap, tap, throwError } from 'rxjs';

export interface AuthUser {
  id?: string;
  email: string;
  roles: string[];
  enabled?: boolean;
  verified?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const STORAGE_KEYS = {
  ACCESS: 'rhconnect_access_token',
  REFRESH: 'rhconnect_refresh_token',
  USER: 'rhconnect_user',
  IMPERSONATE: 'rhconnect_impersonate_user',
};

export function decodeJwt(token: string | null): Record<string, any> | null {
  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
    return null;
  }
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null): boolean {
  const payload = decodeJwt(token);
  if (!payload || !payload['exp']) {
    return true;
  }
  return Date.now() >= payload['exp'] * 1000 - 5000;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiBase = 'http://localhost:8080/api';

  private refreshInProgress = false;
  private resolveRefresh: ((t: AuthTokens | null) => void) | null = null;

  readonly user = signal<AuthUser | null>(this.loadUserFromStorage());
  readonly accessToken = signal<string | null>(this.loadFromStorage(STORAGE_KEYS.ACCESS));
  readonly refreshToken = signal<string | null>(this.loadFromStorage(STORAGE_KEYS.REFRESH));

  readonly isAuthenticated = computed(() => this.isAccessTokenValid() && !!this.user());

  readonly impersonatedUser = signal<AuthUser | null>(this.loadImpersonatedFromStorage());
  readonly isImpersonating = computed(() => !!this.impersonatedUser());

  isAccessTokenValid(): boolean {
    const token = this.accessToken();
    return !!token && !isTokenExpired(token);
  }

  hasValidSession(): boolean {
    const u = this.user();
    if (!u) return false;
    const access = this.accessToken();
    if (access && !isTokenExpired(access)) return true;
    const refresh = this.refreshToken();
    if (refresh && !isTokenExpired(refresh)) return true;
    return false;
  }

  hasRole(role: string): boolean {
    const u = this.user();
    if (!u?.roles) return false;
    const cleanRole = role.replace(/^ROLE_/, '');
    return u.roles.some((r) => r === cleanRole || r === `ROLE_${cleanRole}`);
  }

  hasAnyRole(roles: string[]): boolean {
    const u = this.user();
    if (!u?.roles) return false;
    return roles.some((r) => this.hasRole(r));
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isAdminOrRecruiter(): boolean {
    return this.hasAnyRole(['ADMIN', 'RECRUITER']);
  }

  login(email: string, password: string): Observable<AuthUser> {
    return this.http
      .post<{ accessToken: string; refreshToken: string; user: AuthUser; tokenType?: string; expiresIn?: number }>(
        `${this.apiBase}/auth/login`,
        { email, password }
      )
      .pipe(
        tap((resp) => {
          this.setTokens(resp.accessToken, resp.refreshToken);
          this.user.set(resp.user);
          this.saveToStorage(STORAGE_KEYS.USER, JSON.stringify(resp.user));
        }),
        switchMap((resp) => of(resp.user)),
        catchError((err) => throwError(() => err))
      );
  }

  logout(): void {
    const refresh = this.refreshToken();
    if (refresh) {
      this.http.post(`${this.apiBase}/auth/logout`, { refreshToken: refresh }).pipe(catchError(() => of(null))).subscribe();
    }
    this.clearAll();
    this.router.navigate(['/login']);
  }

  clearAll(): void {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.user.set(null);
    this.impersonatedUser.set(null);
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }

  refreshAccessToken(): Observable<AuthTokens | null> {
    if (this.refreshInProgress) {
      return new Observable<AuthTokens | null>((subscriber) => {
        const originalResolve = this.resolveRefresh;
        this.resolveRefresh = (t) => {
          subscriber.next(t);
          subscriber.complete();
          if (originalResolve) originalResolve(t);
        };
      });
    }

    this.refreshInProgress = true;
    const refresh = this.refreshToken();
    if (!refresh || isTokenExpired(refresh)) {
      this.clearAll();
      this.finishRefresh(null);
      return of(null);
    }

    return this.http
      .post<{ accessToken: string; refreshToken: string }>(`${this.apiBase}/auth/refresh-token`, {
        refreshToken: refresh,
      })
      .pipe(
        tap((resp) => {
          this.setTokens(resp.accessToken, resp.refreshToken);
        }),
        switchMap((resp) => {
          const tokens: AuthTokens = { accessToken: resp.accessToken, refreshToken: resp.refreshToken };
          this.finishRefresh(tokens);
          return of(tokens);
        }),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 401 || err.status === 403) {
            this.clearAll();
          }
          this.finishRefresh(null);
          return of(null);
        })
      );
  }

  startImpersonation(user: AuthUser, impersonatedToken: string): void {
    this.saveToStorage(STORAGE_KEYS.IMPERSONATE, JSON.stringify(user));
    this.impersonatedUser.set(user);
    this.saveToStorage(STORAGE_KEYS.ACCESS, impersonatedToken);
    this.accessToken.set(impersonatedToken);
  }

  stopImpersonation(originalTokens: AuthTokens, originalUser: AuthUser): void {
    localStorage.removeItem(STORAGE_KEYS.IMPERSONATE);
    this.impersonatedUser.set(null);
    this.setTokens(originalTokens.accessToken, originalTokens.refreshToken);
    this.user.set(originalUser);
    this.saveToStorage(STORAGE_KEYS.USER, JSON.stringify(originalUser));
  }

  snapshot(): { tokens: AuthTokens; user: AuthUser } | null {
    const at = this.accessToken();
    const rt = this.refreshToken();
    const u = this.user();
    if (!at || !rt || !u) return null;
    return { tokens: { accessToken: at, refreshToken: rt }, user: u };
  }

  private setTokens(access: string, refresh: string): void {
    this.accessToken.set(access);
    this.refreshToken.set(refresh);
    this.saveToStorage(STORAGE_KEYS.ACCESS, access);
    this.saveToStorage(STORAGE_KEYS.REFRESH, refresh);
  }

  private finishRefresh(result: AuthTokens | null): void {
    this.refreshInProgress = false;
    if (this.resolveRefresh) {
      const resolve = this.resolveRefresh;
      this.resolveRefresh = null;
      resolve(result);
    }
  }

  private loadFromStorage(key: string): string | null {
    try {
      const val = localStorage.getItem(key);
      if (!val || val === 'null' || val === 'undefined' || val.trim() === '') {
        return null;
      }
      return val;
    } catch {
      return null;
    }
  }

  private saveToStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
    }
  }

  private loadUserFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      if (!raw || raw === 'null' || raw === 'undefined') return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.roles)) {
        return null;
      }
      return parsed as AuthUser;
    } catch {
      return null;
    }
  }

  private loadImpersonatedFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.IMPERSONATE);
      if (!raw || raw === 'null' || raw === 'undefined') return null;
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
