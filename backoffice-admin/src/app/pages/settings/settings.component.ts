import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService, SystemSettings } from '../../core/admin-api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styles: [`
    :host {
      --spacing-xs: 0.5rem;    /* 8px */
      --spacing-sm: 0.75rem;   /* 12px */
      --spacing-md: 1rem;      /* 16px */
      --spacing-lg: 1.5rem;    /* 24px */
      --spacing-xl: 2rem;      /* 32px */
      --spacing-2xl: 3rem;     /* 48px */
      
      --radius-md: 0.75rem;    /* 12px */
      --radius-lg: 1.5rem;     /* 24px */
      --radius-xl: 1.875rem;   /* 30px */
      
      --border-width: 1px;
      --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
      
      display: block;
    }

    .settings-container {
      max-width: 80rem;
      margin: 0 auto;
      padding: var(--spacing-lg) var(--spacing-md);
      gap: var(--spacing-lg);
    }

    .settings-header {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 1rem 0.25rem;
    }

    .settings-header-top {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      flex: 1;
    }

    .settings-header-top h1 {
      font-size: 1.875rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #1f2937;
      margin: 0;
    }

    .settings-header-top p {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
      margin-top: 0.375rem;
    }

    .settings-header-actions {
      display: flex;
      gap: 0.625rem;
      flex-wrap: wrap;
    }

    @media (min-width: 1024px) {
      .settings-header {
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--spacing-lg);
      }

      .settings-header-top {
        flex: 1;
      }

      .settings-header-actions {
        flex-wrap: nowrap;
        align-self: center;
      }
    }

    .alert {
      padding: var(--spacing-md);
      border-radius: var(--radius-lg);
      border: var(--border-width) solid;
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
      font-size: 0.875rem;
      font-weight: 500;
      animation: fadeIn 0.3s ease-in-out;
    }

    .grid-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-2xl);
    }

    @media (min-width: 1024px) {
      .grid-layout {
        grid-template-columns: 1fr 3fr;
        gap: var(--spacing-2xl);
      }
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      background: white;
      border: var(--border-width) solid #e2e8f0;
      padding: var(--spacing-md);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xs);
      height: fit-content;
    }

    .sidebar button {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md) var(--spacing-md);
      border-radius: var(--radius-lg);
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
    }

    .sidebar button:hover {
      background: #f1f5f9;
      color: #334155;
    }

    .sidebar button.active {
      background: #f0f9ff;
      border: var(--border-width) solid #e0f2fe;
      color: #0d7ea4;
    }

    .content-panel {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .section-card {
      background: white;
      border: var(--border-width) solid #e2e8f0;
      border-radius: var(--radius-xl);
      padding: var(--spacing-lg);
      box-shadow: var(--shadow-xs);
      space: var(--spacing-lg);
    }

    .section-header {
      padding-bottom: var(--spacing-md);
      border-bottom: var(--border-width) solid #e5e7eb;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 700;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .section-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: var(--spacing-sm);
    }

    .toggle-container {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      border-radius: var(--radius-lg);
      background: #f8fafc;
      border: var(--border-width) solid #e2e8f0;
      transition: all 0.3s ease;
    }

    .toggle-container.active {
      background: #ecf9f8;
      border-color: #5eead4;
    }

    .toggle-label {
      flex: 1;
    }

    .toggle-label-text {
      font-size: 0.75rem;
      font-weight: 700;
      color: #1f2937;
    }

    .toggle-description {
      font-size: 0.6875rem;
      color: #64748b;
      margin-top: var(--spacing-xs);
    }

    .toggle-switch {
      position: relative;
      display: inline-flex;
      align-items: center;
      width: 2.75rem;
      height: 1.5rem;
      border-radius: 9999px;
      background: #cbd5e1;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.3s ease;
      border: none;
      padding: 0;
    }

    .toggle-switch.on {
      background: #0d7ea4;
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      background: white;
      left: 0.25rem;
      transition: left 0.3s ease;
      box-shadow: var(--shadow-xs);
    }

    .toggle-switch.on::after {
      left: 1.5rem;
    }

    .section-footer {
      padding-top: var(--spacing-md);
      border-top: var(--border-width) solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
    }

    .btn-save {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md) var(--spacing-lg);
      background: #0d7ea4;
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      font-weight: 700;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: var(--shadow-xs);
    }

    .btn-save:hover {
      background: #0a5f7f;
    }

    .btn-save:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    input[type="email"],
    input[type="text"],
    input[type="range"] {
      padding: var(--spacing-md);
      border-radius: var(--radius-lg);
      border: var(--border-width) solid #cbd5e1;
      font-size: 0.875rem;
    }

    input[type="email"]:focus,
    input[type="text"]:focus {
      outline: none;
      border-color: #0d7ea4;
      box-shadow: 0 0 0 3px rgba(13, 126, 164, 0.1);
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    @media (max-width: 1023px) {
      .grid-layout {
        grid-template-columns: 1fr;
      }

      .sidebar {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: var(--spacing-sm);
      }

      .section-card {
        padding: var(--spacing-md);
      }
    }

    :host.dark-mode .sidebar {
      background: #1e293b;
      border-color: #334155;
      color: #e2e8f0;
    }

    :host.dark-mode .sidebar button {
      color: #94a3b8;
    }

    :host.dark-mode .sidebar button:hover {
      background: #334155;
      color: #f1f5f9;
    }

    :host.dark-mode .sidebar button.active {
      background: #164e63;
      border-color: #0c4a6e;
      color: #06b6d4;
    }

    :host.dark-mode .section-card {
      background: #1e293b;
      border-color: #334155;
    }

    :host.dark-mode .section-header {
      border-bottom-color: #334155;
    }

    :host.dark-mode .section-title {
      color: #f1f5f9;
    }

    :host.dark-mode .section-subtitle {
      color: #cbd5e1;
    }

    :host.dark-mode .toggle-container {
      background: #0f172a;
      border-color: #334155;
    }

    :host.dark-mode .toggle-container.active {
      background: #064e3b;
      border-color: #10b981;
    }

    :host.dark-mode .toggle-label-text {
      color: #f1f5f9;
    }

    :host.dark-mode .toggle-description {
      color: #94a3b8;
    }

    :host.dark-mode input {
      background: #0f172a;
      border-color: #334155;
      color: #f1f5f9;
    }

    :host.dark-mode input::placeholder {
      color: #64748b;
    }

    /* Range slider cross-browser support */
    input[type="range"] {
      width: 100%;
      height: 6px;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background: linear-gradient(to right, #cbd5e1, #94a3b8);
      border: none;
      outline: none;
      border-radius: 9999px;
    }

    /* WebKit (Chrome, Safari, Edge) */
    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0F766E, #06B6D4);
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      border: none;
    }

    input[type="range"]::-webkit-slider-runnable-track {
      background: linear-gradient(to right, #cbd5e1, #94a3b8);
      height: 1px;
      border-radius: 9999px;
    }

    /* Firefox */
    input[type="range"]::-moz-range-thumb {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0F766E, #06B6D4);
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      border: none;
    }

    input[type="range"]::-moz-range-track {
      background: linear-gradient(to right, #cbd5e1, #94a3b8);
      height: 1px;
      border-radius: 9999px;
      border: none;
    }

    input[type="range"]::-moz-range-progress {
      background-color: #0F766E;
    }

    /* Dark mode range slider */
    :host.dark-mode input[type="range"] {
      background: linear-gradient(to right, #475569, #64748b);
    }

    :host.dark-mode input[type="range"]::-webkit-slider-thumb {
      background: linear-gradient(135deg, #2DD4BF, #06B6D4);
    }

    :host.dark-mode input[type="range"]::-webkit-slider-runnable-track {
      background: linear-gradient(to right, #475569, #64748b);
    }

    :host.dark-mode input[type="range"]::-moz-range-thumb {
      background: linear-gradient(135deg, #2DD4BF, #06B6D4);
    }

    :host.dark-mode input[type="range"]::-moz-range-track {
      background: linear-gradient(to right, #475569, #64748b);
    }
  `]
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  settings: SystemSettings | null = null;
  originalSettings: SystemSettings | null = null;
  loading = true;
  error = false;
  dirty = false;
  saving = false;
  savedAt: string | null = null;
  activeSection: 'notifications' | 'uploads' | 'categories' | 'skills' = 'notifications';

  ngOnInit(): void {
    this.api.getSystemSettings().subscribe({
      next: (s) => {
        this.settings = { ...s };
        this.originalSettings = JSON.parse(JSON.stringify(s));
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  toggle(key: keyof SystemSettings): void {
    if (!this.settings) return;
    (this.settings as unknown as Record<string, unknown>)[key] = !(this.settings as unknown as Record<string, unknown>)[key];
    this.dirty = true;
  }

  save(): void {
    if (!this.settings) return;
    
    // Valider email avant save
    if (this.settings.adminNotificationEmail && !this.isValidEmail(this.settings.adminNotificationEmail)) {
      alert('Adresse email invalide. Veuillez entrer une adresse email valide.');
      return;
    }
    
    this.saving = true;
    this.api.patchSystemSettings(this.settings).subscribe({
      next: (s) => {
        this.settings = { ...s };
        this.originalSettings = JSON.parse(JSON.stringify(s));
        this.dirty = false;
        this.saving = false;
        this.savedAt = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        setTimeout(() => this.savedAt = null, 4000);
      },
      error: () => { this.saving = false; }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  reset(): void {
    if (this.originalSettings) {
      this.settings = JSON.parse(JSON.stringify(this.originalSettings));
      this.dirty = false;
    }
  }

  removeExt(ext: string): void {
    if (!this.settings) return;
    this.settings.allowedExtensions = this.settings.allowedExtensions.filter(e => e !== ext);
    this.dirty = true;
  }

  addExt(val: string): void {
    if (!this.settings || !val.trim()) return;
    const ext = val.trim().toLowerCase().replace(/^\./, '');
    if (!this.settings.allowedExtensions.includes(ext)) {
      this.settings.allowedExtensions = [...this.settings.allowedExtensions, ext];
      this.dirty = true;
    }
  }

  addToRef(referential: keyof SystemSettings, val: string): void {
    if (!this.settings || !val.trim()) return;
    const list = this.settings[referential] as string[];
    if (!list.includes(val.trim())) {
      list.push(val.trim());
      this.dirty = true;
    }
  }

  removeFromRef(referential: keyof SystemSettings, val: string): void {
    if (!this.settings) return;
    const key = referential as 'jobCategories' | 'skillsReferential';
    this.settings[key] = (this.settings[key] as string[]).filter(v => v !== val);
    this.dirty = true;
  }
}

