import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'rhconnect_admin_dark_mode';
  
  isDark = signal(this.getInitialTheme());

  constructor() {
    // Apply theme changes to document class
    effect(() => {
      const isDarkMode = this.isDark();
      const htmlElement = document.documentElement;
      if (isDarkMode) {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
      localStorage.setItem(this.STORAGE_KEY, isDarkMode ? 'true' : 'false');
    });
  }

  private getInitialTheme(): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored !== null) {
        return stored === 'true';
      }
      // Default to system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  }

  toggle(): void {
    this.isDark.update(value => !value);
  }
}
