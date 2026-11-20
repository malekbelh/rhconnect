import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="login-page">
      <!-- ══ LEFT PANEL: LOGIN CARD ══ -->
      <section class="login-panel" aria-labelledby="login-title">
        <div class="login-card">
          <!-- Official RhConnect Brand -->
          <div class="brand-header">
            <div class="brand-row">
              <div class="logo-mark" aria-hidden="true">
                <svg viewBox="0 0 44 44" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- Squircle Badge in Ink Navy -->
                  <rect x="2" y="2" width="40" height="40" rx="10" fill="#172A3A" />
                  <!-- Initial Solid Yellow Accent Bar -->
                  <rect x="11" y="37" width="22" height="2.5" rx="1.25" fill="#D4A72C" />
                  <!-- Vector 'R' Emblem -->
                  <path d="M 13 11 C 13 10.17 13.67 9.5 14.5 9.5 C 15.33 9.5 16 10.17 16 11 L 16 30 C 16 30.83 15.33 31.5 14.5 31.5 C 13.67 31.5 13 30.83 13 30 Z" fill="#FFFFFF" />
                  <path d="M 15 11.5 H 23.5 C 27.6 11.5 30 14.1 30 17.6 C 30 21.1 27.6 23.7 23.5 23.7 H 15" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M 21.2 23.2 L 28.6 30.6 C 29.1 31.2 30 31.2 30.6 30.7" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M 22.8 17.5 C 24 16 26.5 15 29.5 13.5" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="0.5 2.5" />
                  <circle cx="21.5" cy="17.6" r="2.2" fill="#FFFFFF" />
                  <circle cx="31" cy="12.5" r="2.6" fill="#D4A72C" />
                </svg>
              </div>
              <div class="brand-text">
                <span class="wordmark-rh">Rh</span><span class="wordmark-connect">Connect</span>
              </div>
            </div>
          </div>

          <div class="card-intro">
            <h1 id="login-title">Connexion administration</h1>
            <p>Accédez à la console de supervision et de gestion RhConnect.</p>
          </div>

          <!-- Error Alert -->
          <div class="error-alert" *ngIf="error" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{{ error }}</span>
          </div>

          <!-- Login Form -->
          <form (ngSubmit)="submit()" #loginForm="ngForm" novalidate class="login-form">
            <div class="form-group">
              <label for="email">Adresse email administrateur</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  id="email"
                  name="email"
                  type="email"
                  [(ngModel)]="email"
                  required
                  autocomplete="username"
                  placeholder="admin@rhconnect.tn"
                  [disabled]="loading"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="password">Mot de passe</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type="password"
                  [(ngModel)]="password"
                  required
                  autocomplete="current-password"
                  placeholder="Votre mot de passe"
                  [disabled]="loading"
                />
              </div>
            </div>

            <button type="submit" class="submit-btn" [disabled]="loginForm.invalid || loading">
              <span *ngIf="!loading">Se connecter à la console</span>
              <span *ngIf="loading" class="btn-loading">
                <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Connexion en cours...
              </span>
            </button>
          </form>

      
        </div>
      </section>

      <!-- ══ RIGHT PANEL: SHOWCASE ASIDE (MATCHING 5173 HOMEPAGE) ══ -->
      <aside class="login-aside">
        <div class="aside-inner">
        

          <h2 class="aside-title">
            Une vue claire sur les décisions qui comptent.
          </h2>

          <p class="aside-desc">
            Supervisez les talents, validez les offres et garantissez un recrutement transparent et équitable sur toute la Tunisie.
          </p>

       
          <!-- Feature Bullets matching homepage tone -->
          <div class="feature-pills">
            <div class="feature-item">
              <span class="check-icon">✓</span>
              <span>Traçabilité intégrale des candidatures & audits</span>
            </div>
            <div class="feature-item">
              <span class="check-icon">✓</span>
              <span>Supervision du scoring IA éthique et explicable</span>
            </div>
            <div class="feature-item">
              <span class="check-icon">✓</span>
              <span>Vérification documentaire certifiée</span>
            </div>
          </div>

          <!-- Footer brand note -->
          <div class="aside-footer">
            <span>© {{ currentYear }} RhConnect • Console de supervision back-office</span>
          </div>
        </div>
      </aside>
    </main>
  `,
  styles: `
    .login-page {
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(420px, 46vw) 1fr;
      background: #F3F6F7;
      font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #172A3A;
    }

    /* ══ LEFT LOGIN PANEL ══ */
    .login-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: clamp(24px, 4vw, 56px);
      background: #F3F6F7;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: clamp(28px, 4vw, 40px);
      box-shadow: 0 10px 30px -10px rgba(23, 42, 58, 0.08);
    }

    /* Brand Header */
    .brand-header {
      margin-bottom: 28px;
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-mark {
      width: 36px;
      height: 36px;
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }

    .logo-mark:hover {
      transform: scale(1.05);
    }

    .brand-text {
      font-family: 'Manrope', sans-serif;
      font-weight: 800;
      font-size: 1.35rem;
      letter-spacing: -0.03em;
      line-height: 1;
    }

    .wordmark-rh {
      color: #172A3A;
    }

    .wordmark-connect {
      color: #0F766E;
      font-weight: 900;
      margin-left: 2px;
    }

    .badge-pill {
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 0.72rem;
      font-weight: 700;
      color: #0F766E;
      background: rgba(15, 118, 110, 0.08);
      border: 1px solid rgba(15, 118, 110, 0.2);
      padding: 3px 8px;
      border-radius: 9999px;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    /* Card Intro */
    .card-intro h1 {
      font-family: 'Manrope', sans-serif;
      font-size: 1.65rem;
      font-weight: 800;
      color: #172A3A;
      letter-spacing: -0.02em;
      margin: 0 0 6px 0;
    }

    .card-intro p {
      font-size: 0.92rem;
      color: #64748B;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }

    /* Error Alert */
    .error-alert {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #FEF2F2;
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #DC2626;
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 500;
      margin-bottom: 20px;
    }

    .error-alert svg {
      flex-shrink: 0;
    }

    /* Form */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #172A3A;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      color: #94A3B8;
      pointer-events: none;
    }

    .input-wrapper input {
      width: 100%;
      height: 44px;
      padding: 0 14px 0 42px;
      border: 1.5px solid #CBD5E1;
      border-radius: 10px;
      background: #FFFFFF;
      color: #172A3A;
      font-size: 0.92rem;
      font-family: inherit;
      outline: none;
      transition: all 0.2s ease;
    }

    .input-wrapper input::placeholder {
      color: #94A3B8;
    }

    .input-wrapper input:hover {
      border-color: #94A3B8;
    }

    .input-wrapper input:focus {
      border-color: #0F766E;
      box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15);
    }

    .input-wrapper input:disabled {
      background: #F1F5F9;
      cursor: not-allowed;
    }

    /* Submit Button */
    .submit-btn {
      height: 46px;
      margin-top: 8px;
      border: none;
      border-radius: 10px;
      background: #0F766E;
      color: #FFFFFF;
      font-family: 'Manrope', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(15, 118, 110, 0.25);
      transition: all 0.2s ease;
    }

    .submit-btn:hover:not(:disabled) {
      background: #0B5B55;
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(15, 118, 110, 0.3);
    }

    .submit-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .submit-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      box-shadow: none;
    }

    .btn-loading {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .spinner {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Security Note */
    .security-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid #F1F5F9;
      color: #64748B;
      font-size: 0.78rem;
    }

    .security-footer svg {
      color: #0F766E;
      flex-shrink: 0;
    }

    /* ══ RIGHT SHOWCASE ASIDE ══ */
    .login-aside {
      background: #172A3A;
      color: #FFFFFF;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: clamp(40px, 6vw, 96px);
      position: relative;
    }

    .aside-inner {
      max-width: 540px;
    }

    .kicker-wrapper {
      margin-bottom: 20px;
    }

    .kicker-tag {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #5EEAD4;
      background: rgba(94, 234, 212, 0.1);
      border: 1px solid rgba(94, 234, 212, 0.2);
      padding: 5px 12px;
      border-radius: 9999px;
    }

    .aside-title {
      font-family: 'Manrope', sans-serif;
      font-size: clamp(2rem, 3.2vw, 2.75rem);
      font-weight: 800;
      line-height: 1.18;
      letter-spacing: -0.02em;
      color: #FFFFFF;
      margin: 0 0 18px 0;
    }

    .aside-desc {
      font-size: 1.05rem;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.75);
      margin: 0 0 36px 0;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding: 24px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      margin-bottom: 32px;
    }

    .metric-card {
      display: flex;
      flex-direction: column;
    }

    .metric-num {
      font-family: 'Manrope', sans-serif;
      font-size: 1.85rem;
      font-weight: 800;
      color: #D4A72C; /* Initial Solid Yellow without degradation */
      line-height: 1;
      margin-bottom: 6px;
    }

    .metric-label {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.35;
    }

    /* Feature Pills */
    .feature-pills {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 40px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.85);
    }

    .check-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(15, 118, 110, 0.35);
      color: #5EEAD4;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 800;
      flex-shrink: 0;
    }

    .aside-footer {
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.45);
    }

    /* Responsive */
    @media (max-width: 900px) {
      .login-page {
        grid-template-columns: 1fr;
      }

      .login-aside {
        order: -1;
        padding: 48px 24px 36px;
      }

      .metrics-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
    }

    @media (max-width: 520px) {
      .metrics-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .login-card {
        padding: 24px 18px;
        box-shadow: none;
        border: none;
        background: transparent;
      }

      .login-panel {
        padding: 12px;
      }
    }
  `,
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  email = '';
  password = '';
  loading = false;
  error = '';
  readonly currentYear = new Date().getFullYear();

  ngOnInit(): void {
    if (this.auth.isAccessTokenValid() && this.auth.isAdminOrRecruiter()) {
      this.router.navigate(['/dashboard']);
    }
  }

  submit(): void {
    const email = this.email.trim();
    if (!email || !this.password) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth
      .login(email, this.password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading = false;
          if (!this.auth.isAdminOrRecruiter()) {
            this.error = 'Ce compte ne possède pas les droits administrateur ou recruteur.';
            this.auth.clearAll();
            return;
          }
          this.router.navigate(['/dashboard']);
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          if (err.status === 401) {
            this.error = 'Email ou mot de passe incorrect.';
          } else if (err.status === 0) {
            this.error = 'Impossible de contacter le serveur backend sur localhost:8080.';
          } else {
            this.error = 'Une erreur est survenue lors de la connexion.';
          }
        },
      });
  }
}
