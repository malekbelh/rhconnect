import { Component, OnInit, HostListener, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService, AdminUser } from '../../core/admin-api.service';
import { AuthService } from '../../core/auth.service';
import { CanDirective } from '../../core/can.directive';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

interface RoleOption {
  value: string;
  label: string;
  color: string;
}

type DrawerTab = 'profil' | 'sessions' | 'securite';
type PendingAction = 'toggle' | 'delete' | null;

interface UserSession {
  id: string;
  createdAt: string;
  expiresAt: string;
  revoked: boolean;
  ip?: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, CanDirective],
  template: `
    <div class="max-w-7xl mx-auto py-5 space-y-5 px-4 sm:px-6 lg:px-8">

      <!-- ═══ HEADER SECTION ═══ -->
      <div class=" px-1 py-4 ">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div class="flex items-start ">
            
            <div class="flex-1">
              <h1 class="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Utilisateurs
              </h1>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
                Gestion des comptes candidats, entreprises, recruteurs et administrateurs
              </p>
            </div>
          </div>
        
        </div>
      </div>

      <!-- ═══ ERROR ALERT ═══ -->
      <div *ngIf="loadError" class="flex items-center gap-3 px-4 py-3 rounded-xl border bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12" stroke-linecap="round"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>
        <span class="text-sm font-semibold flex-1">Impossible de charger les utilisateurs.</span>
        <button class="px-3 py-1.5 rounded text-xs font-semibold bg-rose-100 dark:bg-rose-500/20 hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-colors" (click)="loadUsers()">Réessayer</button>
      </div>

      <!-- ═══ KPI STRIP ═══ -->
      <div *ngIf="!loading" class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Total comptes</span>
            <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-1a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v1"/><path d="M23 21v-1a6 6 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white">{{ users.length }}</div>
          <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Inscrits</div>
        </div>

        <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Candidats</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white">{{ countByRole('CANDIDATE') }}</div>
          <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Actifs</div>
        </div>

        <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Entreprises</span>
            <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white">{{ countByRole('COMPANY') }}</div>
          <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Actives</div>
        </div>

        <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Vérifiés</span>
            <div class="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-500/20 text-[#0F766E] dark:text-cyan-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white">{{ countVerified() }}</div>
          <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Confirmés</div>
        </div>

        <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Désactivés</span>
            <div class="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white">{{ countInactive() }}</div>
          <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Comptes</div>
        </div>
      </div>

      <!-- ═══ FILTERS & SEARCH ═══ -->
      <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div class="flex-1 relative">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="m20 20-4-4"/></svg>
          <input type="text" [(ngModel)]="search" (ngModelChange)="onSearchChange()" placeholder="Rechercher par email…" class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]" />
        </div>
        <select [(ngModel)]="roleFilter" (ngModelChange)="onFilterChange()" class="px-2.5 py-1.5 rounded text-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E] dark:focus:ring-cyan-500">
          <option value="ALL">Tous rôles</option>
          <option value="CANDIDATE">Candidat</option>
          <option value="COMPANY">Entreprise</option>
          <option value="RECRUITER">Recruteur</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()" class="px-2.5 py-1.5 rounded text-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E] dark:focus:ring-cyan-500">
          <option value="ALL">Tous statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="INACTIVE">Inactif</option>
        </select>
        <div class="flex items-center justify-center px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {{ filtered.length }} résultat(s)
        </div>
      </div>

      <!-- ═══ LOADING STATE ═══ -->
      <div *ngIf="loading" class="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
        <div class="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-[#0F766E] dark:border-t-cyan-500 animate-spin mb-4"></div>
        <p class="text-sm font-medium">Chargement des utilisateurs…</p>
      </div>

      <!-- ═══ EMPTY STATE ═══ -->
      <div *ngIf="!loading && !loadError && filtered.length === 0" class="flex flex-col items-center justify-center py-20 px-4">
        <div class="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mb-6 shadow-sm">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-slate-400 dark:text-slate-600"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="m20 20-4-4"/></svg>
        </div>
        <h3 class="font-display text-2xl font-bold text-slate-900 dark:text-white mb-2">Aucun utilisateur trouvé</h3>
        <p class="text-slate-600 dark:text-slate-400 text-center max-w-md mb-6">
          {{ hasActiveFilters() ? 'Aucun résultat ne correspond à vos critères de recherche. Modifiez les filtres pour continuer.' : 'Aucun compte n\'a encore été créé. Les nouveaux utilisateurs apparaîtront ici.' }}
        </p>
        <button *ngIf="hasActiveFilters()" (click)="resetFilters()" class="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0F766E] dark:bg-cyan-600 hover:bg-[#0d5d57] dark:hover:bg-cyan-700 transition-colors flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64M3.51 15A9 9 0 0 0 18.36 18.36"/></svg>
          Réinitialiser les filtres
        </button>
      </div>

      <!-- ═══ USERS TABLE ═══ -->
      <div *ngIf="!loading && filtered.length > 0" class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xs">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50">
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Utilisateur</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Rôle</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Statut</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Vérification</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of page; trackBy: trackByUserId" class="border-b border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" (click)="openDrawer(u)">
                <td class="px-6 py-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg overflow-hidden border border-[#243E54] bg-[#172A3A] flex items-center justify-center flex-shrink-0">
                      <img *ngIf="photoCache.get(u.id)" [src]="photoCache.get(u.id)" [alt]="u.email || 'Utilisateur'" class="w-full h-full object-cover" />
                      <span *ngIf="!photoCache.get(u.id)" class="font-bold text-xs text-amber-500 dark:text-amber-400">{{ (u.email || 'U').charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="min-w-0">
                      <div class="font-semibold text-xs text-slate-900 dark:text-white truncate">{{ u.email || '—' }}</div>
                      <div class="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                        {{ u.createdAt ? (u.createdAt | date:'dd/MM/yyyy') : 'Date inconnue' }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-3">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                    {{ roleLabel(u) }}
                  </span>
                </td>
                <td class="px-6 py-3">
                  <span class="text-xs font-semibold" [ngClass]="u.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
                    {{ u.enabled ? 'Actif' : 'Désactivé' }}
                  </span>
                </td>
                <td class="px-6 py-3">
                  <span class="inline-flex items-center gap-1 text-[10px] font-semibold" [class]="u.verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" [class]="u.verified ? '' : 'opacity-40'"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>
                    {{ u.verified ? 'Vérifiée' : 'Non vérifiée' }}
                  </span>
                </td>
                <td class="px-6 py-3" (click)="$event.stopPropagation()">
                  <button (click)="openDrawer(u)" 
                          title="Voir les détails"
                          class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-teal-100 dark:hover:bg-cyan-500/20 hover:text-[#0F766E] dark:hover:text-cyan-400 transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="m20 20-4-4"/></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-6 py-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
          <span class="text-sm text-slate-600 dark:text-slate-400">
            {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filtered.length) }} sur {{ filtered.length }} utilisateurs
          </span>
          <div class="flex items-center gap-2">
            <button (click)="goPage(1)" [disabled]="currentPage === 1" class="px-3 py-2 rounded text-xs font-semibold border border-slate-200 dark:border-white/10 disabled:opacity-50">«</button>
            <button (click)="goPage(currentPage - 1)" [disabled]="currentPage === 1" class="px-3 py-2 rounded text-xs font-semibold border border-slate-200 dark:border-white/10 disabled:opacity-50">‹</button>
            <button *ngFor="let p of pageNumbers()" (click)="goPage(p)" [class.bg-[#0F766E] dark:bg-cyan-600 text-white]="p === currentPage" class="px-3 py-2 rounded text-xs font-semibold border border-slate-200 dark:border-white/10">{{ p }}</button>
            <button (click)="goPage(currentPage + 1)" [disabled]="currentPage === totalPages" class="px-3 py-2 rounded text-xs font-semibold border border-slate-200 dark:border-white/10 disabled:opacity-50">›</button>
            <button (click)="goPage(totalPages)" [disabled]="currentPage === totalPages" class="px-3 py-2 rounded text-xs font-semibold border border-slate-200 dark:border-white/10 disabled:opacity-50">»</button>
          </div>
        </div>
      </div>

    </div>

    <!-- ════════════════════════════════════════════════════════════
         ══ DRAWER — Fiche Utilisateur Enrichie (Style OfferDetails) ══
         ════════════════════════════════════════════════════════════ -->
    <div class="drawer-overlay" *ngIf="drawer" (click)="closeDrawer()">
        <aside class="drawer-panel" style="max-width:560px;width:100%" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" [attr.aria-label]="'Détail utilisateur ' + drawer.email">

          <!-- Header Drawer -->
          <div class="drawer-head" style="padding:18px 22px 14px;border-bottom:1px solid var(--n-100, #e5e7eb)">
            <div>
              <div style="font-size:.95rem;font-weight:700;color:var(--ink, #0f172a);max-width:420px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ drawer.email }}</div>
              <div style="font-size:.76rem;color:var(--n-500, #64748b);margin-top:2px">Fiche profil utilisateur · RHConnect</div>
            </div>
            <button class="drawer-close" (click)="closeDrawer()" aria-label="Fermer le détail" style="border:0;background:transparent;color:var(--n-400, #94a3b8);cursor:pointer;display:grid;place-items:center;width:28px;height:28px;border-radius:6px">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Onglets du Drawer -->
          <div class="o-tabs" role="tablist">
            <button type="button" role="tab" [class.active]="drawerTab() === 'profil'" (click)="setTab('profil')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6"/></svg>
              Profil & Informations
            </button>
            <button type="button" role="tab" [class.active]="drawerTab() === 'sessions'" (click)="setTab('sessions')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Sessions actives ({{ sessions().length }})
            </button>
            <button type="button" role="tab" [class.active]="drawerTab() === 'securite'" (click)="setTab('securite')">
              <span class="tab-indicator" *ngIf="!drawer.enabled"></span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z"/></svg>
              Sécurité & Rôles
            </button>
          </div>

          <!-- Feedback messages -->
          <div style="padding:12px 22px 0" *ngIf="drawerOk || drawerMsg">
            <div class="o-feedback ok" *ngIf="drawerOk" role="status">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              {{ drawerOk }}
            </div>
            <div class="o-feedback err" *ngIf="drawerMsg" role="alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
              {{ drawerMsg }}
            </div>
          </div>

          <!-- Corps du Drawer -->
          <div class="drawer-body" style="padding:0;overflow-y:auto;flex:1">

            <!-- ════════ ONGLET 1: PROFIL & INFORMATIONS ════════ -->
            <div *ngIf="drawerTab() === 'profil'">
              <!-- Hero block -->
              <div class="o-hero">
                <div class="o-hero-avatar overflow-hidden" [style.background]="userAvatarGradient(drawer)">
                  <img *ngIf="photoCache.get(drawer.id)" [src]="photoCache.get(drawer.id)" [alt]="drawer.email || 'Utilisateur'" class="w-full h-full object-cover" />
                  <span *ngIf="!photoCache.get(drawer.id)">{{ (drawer.email || 'U').charAt(0).toUpperCase() }}</span>
                </div>
                <div class="o-hero-title">{{ drawer.email }}</div>
                <div class="o-hero-company">
                  Inscrit le <strong>{{ drawer.createdAt ? (drawer.createdAt | date:'dd MMMM yyyy à HH:mm') : 'Date inconnue' }}</strong>
                </div>
                <div class="o-hero-badges">
                  <span class="badge" [ngClass]="drawer.enabled ? 'badge-valide' : 'badge-rejete'">
                    {{ drawer.enabled ? 'Compte Actif' : 'Compte Désactivé' }}
                  </span>
                  <span class="badge" [ngClass]="roleBadge(drawer)">
                    {{ roleLabel(drawer) }}
                  </span>
                  <span class="badge" [ngClass]="drawer.verified ? 'badge-verified' : 'badge-pending'">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>
                    {{ drawer.verified ? 'Email Confirmé' : 'Non confirmé' }}
                  </span>
                </div>
              </div>

              <!-- Cartes métriques -->
              <div class="metrics-row">
                <div class="metric-card">
                  <div class="metric-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>
                  </div>
                  <div class="metric-info">
                    <div class="metric-val">{{ roleLabel(drawer) }}</div>
                    <div class="metric-label">Rôle attribué</div>
                  </div>
                </div>
                <div class="metric-card">
                  <div class="metric-icon candidatures">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <div class="metric-info">
                    <div class="metric-val">{{ sessions().length }}</div>
                    <div class="metric-label">Sessions actives</div>
                  </div>
                </div>
              </div>

              <!-- Grille d'informations -->
              <div class="o-info-section">
                <div class="o-info-grid">
                  <div class="o-info-card">
                    <div class="o-info-icon" style="background:#EEF2FF;color:#4F46E5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>
                    </div>
                    <div class="o-info-content">
                      <div class="o-info-label">Adresse Email</div>
                      <div class="o-info-value truncate" [title]="drawer.email">{{ drawer.email }}</div>
                    </div>
                  </div>

               

                  <div class="o-info-card">
                    <div class="o-info-icon" style="background:#FFFBEB;color:#D97706">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div class="o-info-content">
                      <div class="o-info-label">Date d'inscription</div>
                      <div class="o-info-value">{{ drawer.createdAt ? (drawer.createdAt | date:'dd/MM/yyyy HH:mm') : '—' }}</div>
                    </div>
                  </div>

                

                  <div class="o-info-card">
                    <div class="o-info-icon" style="background:#EFF6FF;color:#3B82F6">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    </div>
                    <div class="o-info-content">
                      <div class="o-info-label">Statut du compte</div>
                      <div class="o-info-value flex items-center gap-1.5" [class.text-emerald-600]="drawer.enabled" [class.text-rose-600]="!drawer.enabled">
                        <span class="w-1.5 h-1.5 rounded-full" [class.bg-emerald-500]="drawer.enabled" [class.bg-rose-500]="!drawer.enabled"></span>
                        {{ drawer.enabled ? 'Actif (Autorisé)' : 'Désactivé (Bloqué)' }}
                      </div>
                    </div>
                  </div>

                  <div class="o-info-card">
                    <div class="o-info-icon" style="background:#F5F3FF;color:#7C3AED">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    </div>
                    <div class="o-info-content">
                      <div class="o-info-label">Rôles système</div>
                      <div class="o-info-value">{{ drawer.roles.join(', ') || 'CANDIDATE' }}</div>
                    </div>
                  </div>
                </div>

                <!-- Profil Candidat additionnel si présent -->
                <div class="drawer-section-block" *ngIf="drawer.candidateProfile">
                  <div class="section-subtitle">Détails profil candidat</div>
                  <div class="last-mod-card">
                    <div *ngIf="drawer.candidateProfile['titreProfessionnel'] || drawer.candidateProfile['title']">
                      <strong>Titre :</strong> {{ drawer.candidateProfile['titreProfessionnel'] || drawer.candidateProfile['title'] }}
                    </div>
                    <div *ngIf="drawer.candidateProfile['telephone'] || drawer.candidateProfile['phone']">
                      <strong>Téléphone :</strong> {{ drawer.candidateProfile['telephone'] || drawer.candidateProfile['phone'] }}
                    </div>
                    <div *ngIf="drawer.candidateProfile['ville'] || drawer.candidateProfile['localisation']">
                      <strong>Localisation :</strong> {{ drawer.candidateProfile['ville'] || drawer.candidateProfile['localisation'] }}
                    </div>
                    <div *ngIf="drawer.candidateProfile['niveauExperience'] || drawer.candidateProfile['experience']">
                      <strong>Expérience :</strong> {{ drawer.candidateProfile['niveauExperience'] || drawer.candidateProfile['experience'] }}
                    </div>
                  </div>
                </div>

                <!-- Profil Entreprise additionnel si présent -->
                <div class="drawer-section-block" *ngIf="drawer.companyProfile">
                  <div class="section-subtitle">Détails entreprise partenaire</div>
                  <div class="last-mod-card">
                    <div *ngIf="drawer.companyProfile['nom'] || drawer.companyProfile['companyName']">
                      <strong>Raison sociale :</strong> {{ drawer.companyProfile['nom'] || drawer.companyProfile['companyName'] }}
                    </div>
                    <div *ngIf="drawer.companyProfile['secteurActivite'] || drawer.companyProfile['sector']">
                      <strong>Secteur :</strong> {{ drawer.companyProfile['secteurActivite'] || drawer.companyProfile['sector'] }}
                    </div>
                    <div *ngIf="drawer.companyProfile['siteWeb'] || drawer.companyProfile['website']">
                      <strong>Site web :</strong> <a [href]="drawer.companyProfile['siteWeb'] || drawer.companyProfile['website']" target="_blank" class="text-teal-600 hover:underline">{{ drawer.companyProfile['siteWeb'] || drawer.companyProfile['website'] }}</a>
                    </div>
                    <div *ngIf="drawer.companyProfile['adresse'] || drawer.companyProfile['address']">
                      <strong>Adresse :</strong> {{ drawer.companyProfile['adresse'] || drawer.companyProfile['address'] }}
                    </div>
                  </div>
                </div>

             

              </div>
            </div>

            <!-- ════════ ONGLET 2: SESSIONS ACTIVES ════════ -->
            <div *ngIf="drawerTab() === 'sessions'" style="padding:20px 22px">
              <div class="section-subtitle">Journal des sessions d'authentification</div>

              <div *ngIf="sessionsLoading()" style="display:flex;align-items:center;justify-content:center;padding:32px" class="text-slate-500">
                <div class="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-[#0F766E] animate-spin mr-3"></div>
                <span class="text-sm font-medium">Chargement des sessions de l'utilisateur…</span>
              </div>

              <div *ngIf="!sessionsLoading() && sessions().length === 0" class="timeline-empty" style="text-align:center;padding:32px 16px;background:var(--n-50, #f9fafb);border-radius:12px;border:1px dashed var(--n-200, #e2e8f0)">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-slate-400 mx-auto mb-2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <div class="font-semibold text-slate-700 dark:text-slate-300 text-sm">Aucune session active</div>
                <div class="text-xs text-slate-500 mt-1">L'utilisateur n'a actuellement aucun token de session actif enregistré.</div>
              </div>

              <div *ngIf="!sessionsLoading() && sessions().length > 0" class="timeline-list">
                <div class="timeline-item" *ngFor="let s of sessions()">
                  <div class="timeline-point" [ngClass]="s.revoked ? 'badge-rejete' : 'badge-valide'"></div>
                  <div class="timeline-content">
                    <div class="timeline-action-row">
                      <span class="badge" [ngClass]="s.revoked ? 'badge-rejete' : 'badge-valide'">
                        <span class="badge-dot" [class.pulsing]="!s.revoked"></span>
                        {{ s.revoked ? 'Session révoquée' : 'Session active' }}
                      </span>
                      <span class="timeline-date">{{ s.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                    <div class="timeline-author" style="margin-top:6px">
                      <div><strong>Créée le :</strong> {{ s.createdAt | date:'dd/MM/yyyy à HH:mm' }}</div>
                      <div><strong>Expire le :</strong> {{ s.expiresAt | date:'dd/MM/yyyy à HH:mm' }}</div>
                      <div *ngIf="s.ip"><strong>Adresse IP :</strong> <span class="font-mono text-xs">{{ s.ip }}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ════════ ONGLET 3: SÉCURITÉ & RÔLES ════════ -->
            <div *ngIf="drawerTab() === 'securite'" style="padding:20px 22px">

              <!-- Box Statut & Rôle -->
              <div class="moderation-decision-box">
                <div class="decision-head">
                  <div class="decision-title">Changement de Rôle Système</div>
                  <span class="badge" [ngClass]="roleBadge(drawer)">{{ roleLabel(drawer) }}</span>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  Attribuer un nouveau rôle ou privilège à cet utilisateur sur la plateforme RHConnect.
                </p>

                <div class="form-group" style="margin-top:14px">
                  <label class="form-label" for="userRoleSelect">Nouveau rôle assigné :</label>
                  <select id="userRoleSelect" class="form-input" [(ngModel)]="newRole" [disabled]="isSelf()">
                    <option *ngFor="let opt of roleOptions" [value]="opt.value">{{ opt.label }} ({{ opt.value }})</option>
                  </select>
                </div>

                <div style="margin-top:14px">
                  <button class="btn-decision approve" style="width:100%" (click)="saveRoleChange(drawer)" [disabled]="actionLoading || newRole === (drawer.roles[0] || 'CANDIDATE') || isSelf()">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" d="M20 6 9 17l-5-5"/></svg>
                    <span>Appliquer la modification de rôle</span>
                  </button>
                </div>
                <p *ngIf="isSelf()" class="text-[11px] text-amber-600 mt-2">Vous ne pouvez pas modifier votre propre rôle administratif.</p>
              </div>

              <!-- Bascule vérification d'email -->
              <div class="moderation-decision-box" style="margin-top:16px">
                <div class="decision-head">
                  <div class="decision-title">État de la Vérification Email</div>
                  <span class="badge" [ngClass]="drawer.verified ? 'badge-verified' : 'badge-pending'">
                    {{ drawer.verified ? 'Vérifié' : 'Non vérifié' }}
                  </span>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  Forcer ou révoquer manuellement le statut de vérification d'adresse email du compte.
                </p>
                <div style="margin-top:14px">
                  <button class="btn-decision request-edit" style="width:100%" (click)="toggleVerification(drawer)" [disabled]="actionLoading">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>
                    <span>{{ drawer.verified ? 'Marquer comme non vérifié' : 'Marquer comme email vérifié' }}</span>
                  </button>
                </div>
              </div>

              <!-- Zone de Danger Suppression -->
              <div class="moderation-decision-box" style="margin-top:18px;border-color:#FECACA;background:#FFF1F2">
                <div class="decision-head">
                  <div class="decision-title" style="color:#9F1239">Zone Sensible — Suppression définitive</div>
                  <span class="badge badge-rejete">Irréversible</span>
                </div>
                <p class="text-xs text-rose-700 mt-2 leading-relaxed">
                  La suppression d'un compte utilisateur efface définitivement toutes ses données associées (profil, sessions, candidatures et offres liées). Cette action est immédiate et irréversible.
                </p>

                <div style="margin-top:14px">
                  <button *ngIf="pendingAction !== 'delete'" (click)="pendingAction = 'delete'" [disabled]="actionLoading || isSelf()"
                          class="btn-decision reject" style="width:100%">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    <span>Supprimer définitivement ce compte</span>
                  </button>

                  <div *ngIf="pendingAction === 'delete'" class="p-3.5 rounded-lg bg-white border border-rose-300 space-y-2.5 mt-2">
                    <p class="text-xs font-bold text-rose-900">
                      Êtes-vous absolument certain de vouloir supprimer le compte {{ drawer.email }} ?
                    </p>
                    <div style="display:flex;gap:8px">
                      <button (click)="pendingAction = null" class="btn-decision" style="flex:1;background:#f3f4f6;color:#374151;border:1px solid #e5e7eb">
                        Annuler
                      </button>
                      <button (click)="confirmDelete()" [disabled]="actionLoading" class="btn-decision reject" style="flex:1">
                        <span *ngIf="actionLoading">Suppression…</span>
                        <span *ngIf="!actionLoading">Oui, supprimer</span>
                      </button>
                    </div>
                  </div>

                  <p *ngIf="isSelf()" class="text-xs text-rose-600 font-semibold mt-2">Vous ne pouvez pas supprimer votre propre compte connecté.</p>
                </div>
              </div>

            </div>

          </div>

          <!-- Footer du Drawer -->
          <div class="o-drawer-footer">
            <button class="btn-decision" style="width:100%;background:#F1F5F9;color:#475569;border:1px solid #E2E8F0" (click)="closeDrawer()">
              Fermer la fiche utilisateur
            </button>
          </div>

        </aside>
    </div>
  `,
  styles: [`
    /* ── Drawer Overlay & Panel ────────────────────────────────── */
    .drawer-overlay {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      display: flex;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .drawer-panel {
      position: fixed;
      right: 0;
      top: 0;
      bottom: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: white;
      box-shadow: -4px 0 16px rgba(0, 0, 0, 0.12);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
      overflow: hidden;
    }
    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .drawer-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .drawer-body {
      flex: 1;
      overflow-y: auto;
    }
    .drawer-close {
      border: 0;
      background: transparent;
      color: #9ca3af;
      cursor: pointer;
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      transition: all 0.15s;
    }
    .drawer-close:hover {
      background: #f3f4f6;
      color: #4b5563;
    }

    /* ── Drawer Tabs ───────────────────────────────────────────── */
    .o-tabs {
      display: flex;
      gap: 0;
      padding: 0;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
      flex-shrink: 0;
    }
    .o-tabs button {
      flex: 1;
      border: 0;
      background: transparent;
      color: #6b7280;
      padding: 12px 14px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      white-space: nowrap;
      position: relative;
    }
    .o-tabs button:hover {
      color: #374151;
      background: #fff;
    }
    .o-tabs button.active {
      color: #0F766E;
      border-bottom-color: #0F766E;
      background: #fff;
    }
    .tab-indicator {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 6px;
      height: 6px;
      background: #f97316;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
    }

    /* ── Drawer Hero & Sections ────────────────────────────────── */
    .o-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 22px 18px;
      border-bottom: 1px solid #e5e7eb;
      text-align: center;
      background: linear-gradient(160deg, #f9fafb 0%, #fff 60%);
    }
    .o-hero-avatar {
      width: 58px; height: 58px;
      border-radius: 14px;
      display: grid; place-items: center;
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      flex-shrink: 0;
    }
    .o-hero-title {
      font-size: .98rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -.01em;
      word-break: break-word;
    }
    .o-hero-company {
      font-size: .76rem;
      color: #64748b;
      margin-top: 4px;
    }
    .o-hero-badges {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 10px;
    }

    /* ── Metrics row ───────────────────────────────────────────── */
    .metrics-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      padding: 16px 22px 4px;
    }
    .metric-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: #fff;
      border: 1.5px solid #e5e7eb;
      border-radius: 12px;
    }
    .metric-icon {
      width: 34px; height: 34px;
      border-radius: 9px;
      background: #F1F5F9;
      color: #475569;
      display: grid; place-items: center;
      flex-shrink: 0;
    }
    .metric-icon.candidatures {
      background: #EEF2FF;
      color: #4F46E5;
    }
    .metric-val { font-size: 1.15rem; font-weight: 800; color: #0f172a; line-height: 1; }
    .metric-label { font-size: .68rem; color: #64748b; margin-top: 2px; }

    /* ── Info grid ─────────────────────────────────────────────── */
    .o-info-section { padding: 14px 22px; }
    .o-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }
    .o-info-card {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #f9fafb;
    }
    .o-info-icon {
      width: 28px; height: 28px;
      border-radius: 8px;
      display: grid; place-items: center;
      flex-shrink: 0;
    }
    .o-info-content { min-width: 0; }
    .o-info-label {
      font-size: .64rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: #94a3b8;
      margin-bottom: 2px;
    }
    .o-info-value {
      font-size: .8rem;
      font-weight: 600;
      color: #0f172a;
      word-break: break-word;
    }

    .drawer-section-block {
      margin-top: 14px;
    }
    .section-subtitle {
      font-size: .72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: #64748b;
      margin-bottom: 8px;
    }

    /* ── Moderation Decision Box ───────────────────────────────── */
    .moderation-decision-box {
      padding: 16px;
      background: #fff;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.03);
    }
    .decision-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .decision-title {
      font-size: .85rem;
      font-weight: 700;
      color: #0f172a;
    }
    .btn-decision {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 9px;
      font-size: .8rem;
      font-weight: 700;
      border: 0;
      cursor: pointer;
      transition: all .12s;
    }
    .btn-decision:disabled { opacity: .45; cursor: not-allowed; }
    .btn-decision.approve {
      background: #059669;
      color: #fff;
    }
    .btn-decision.approve:hover:not(:disabled) { background: #047857; }
    .btn-decision.request-edit {
      background: #FFFBEB;
      color: #B45309;
      border: 1.5px solid #FCD34D;
    }
    .btn-decision.request-edit:hover:not(:disabled) { background: #FEF3C7; }
    .btn-decision.reject {
      background: #FFF1F2;
      color: #9F1239;
      border: 1.5px solid #FECACA;
    }
    .btn-decision.reject:hover:not(:disabled) { background: #FFE4E6; }

    .last-mod-card {
      padding: 10px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: .76rem;
      color: #475569;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    /* ── Timeline ──────────────────────────────────────────────── */
    .timeline-empty {
      font-size: .76rem;
      color: #94a3b8;
      font-style: italic;
      padding: 6px 0;
    }
    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
      padding-left: 14px;
      border-left: 2px solid #e2e8f0;
      margin-left: 6px;
      margin-top: 10px;
    }
    .timeline-item { position: relative; }
    .timeline-point {
      position: absolute;
      left: -19px;
      top: 4px;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #94a3b8;
      border: 2px solid #fff;
    }
    .timeline-point.badge-valide { background: #059669; }
    .timeline-point.badge-rejete { background: #E11D48; }
    .timeline-content {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 9px 12px;
    }
    .timeline-action-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .timeline-date { font-size: .7rem; color: #94a3b8; }
    .timeline-author { font-size: .72rem; color: #64748b; margin-top: 4px; }

    /* ── Form Inputs ───────────────────────────────────────────── */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-label {
      font-size: .74rem;
      font-weight: 700;
      color: #0f172a;
    }
    .form-input {
      padding: 9px 12px;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      font-size: .8rem;
      color: #0f172a;
      background: #fff;
      font-family: inherit;
    }
    .form-input:focus {
      outline: 0;
      border-color: #0F766E;
      box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
    }

    /* ── Badges ────────────────────────────────────────────────── */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: .72rem;
      font-weight: 700;
      white-space: nowrap;
    }
    .badge-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
    }
    .badge-dot.pulsing {
      animation: pulse 1.6s infinite ease-in-out;
      background: #10B981;
    }
    .badge-valide { background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; }
    .badge-rejete { background: #FFF1F2; color: #9F1239; border: 1px solid #FECACA; }
    .badge-pending { background: #FFFBEB; color: #92400E; border: 1px solid #FCD34D; }
    .badge-verified { background: #EEF2FF; color: #4338CA; border: 1px solid #C7D2FE; }
    .badge-candidate,
    .badge-company,
    .badge-recruiter,
    .badge-admin,
    .badge-role { background: #F1F5F9; color: #334155; border: 1px solid #CBD5E1; }

    /* ── Feedbacks ─────────────────────────────────────────────── */
    .o-feedback {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 12px;
      border-radius: 8px;
      font-size: .78rem;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .o-feedback.ok  { background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; }
    .o-feedback.err { background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; }

    /* ── Footer Drawer ─────────────────────────────────────────── */
    .o-drawer-footer {
      padding: 14px 22px 18px;
      border-top: 1px solid #e5e7eb;
      background: #fff;
    }

    /* ── Dark mode overrides ───────────────────────────────────── */
    :host-context(.dark) .drawer-panel,
    :host-context(.theme-dark) .drawer-panel {
      background: #0A1520;
      color: #f8fafc;
      border-left: 1px solid rgba(255, 255, 255, 0.1);
    }
    :host-context(.dark) .drawer-head,
    :host-context(.theme-dark) .drawer-head {
      background: #0A1520;
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }
    :host-context(.dark) .drawer-head div:first-child > div:first-child {
      color: #f8fafc;
    }
    :host-context(.dark) .o-tabs,
    :host-context(.theme-dark) .o-tabs {
      background: #081119;
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }
    :host-context(.dark) .o-tabs button,
    :host-context(.theme-dark) .o-tabs button {
      color: #94a3b8;
    }
    :host-context(.dark) .o-tabs button:hover,
    :host-context(.theme-dark) .o-tabs button:hover {
      background: #0e1e2d;
      color: #fff;
    }
    :host-context(.dark) .o-tabs button.active,
    :host-context(.theme-dark) .o-tabs button.active {
      background: #0A1520;
      color: #06b6d4;
      border-bottom-color: #06b6d4;
    }
    :host-context(.dark) .o-hero,
    :host-context(.theme-dark) .o-hero {
      background: linear-gradient(160deg, #0d1b2a 0%, #0A1520 60%);
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }
    :host-context(.dark) .o-hero-title,
    :host-context(.theme-dark) .o-hero-title {
      color: #fff;
    }
    :host-context(.dark) .o-hero-company,
    :host-context(.theme-dark) .o-hero-company {
      color: #94a3b8;
    }
    :host-context(.dark) .metric-card,
    :host-context(.theme-dark) .metric-card {
      background: #0e1e2d;
      border-color: rgba(255, 255, 255, 0.1);
    }
    :host-context(.dark) .metric-val,
    :host-context(.theme-dark) .metric-val {
      color: #fff;
    }
    :host-context(.dark) .metric-label,
    :host-context(.theme-dark) .metric-label {
      color: #94a3b8;
    }
    :host-context(.dark) .o-info-card,
    :host-context(.theme-dark) .o-info-card {
      background: #0e1e2d;
      border-color: rgba(255, 255, 255, 0.08);
    }
    :host-context(.dark) .o-info-value,
    :host-context(.theme-dark) .o-info-value {
      color: #fff;
    }
    :host-context(.dark) .moderation-decision-box,
    :host-context(.theme-dark) .moderation-decision-box {
      background: #0e1e2d;
      border-color: rgba(255, 255, 255, 0.1);
    }
    :host-context(.dark) .decision-title,
    :host-context(.theme-dark) .decision-title {
      color: #fff;
    }
    :host-context(.dark) .last-mod-card,
    :host-context(.theme-dark) .last-mod-card {
      background: #09141f;
      border-color: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
    }
    :host-context(.dark) .timeline-content,
    :host-context(.theme-dark) .timeline-content {
      background: #0e1e2d;
      border-color: rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
    }
    :host-context(.dark) .form-input,
    :host-context(.theme-dark) .form-input {
      background: #09141f;
      border-color: rgba(255, 255, 255, 0.15);
      color: #fff;
    }
    :host-context(.dark) .o-drawer-footer,
    :host-context(.theme-dark) .o-drawer-footer {
      background: #0A1520;
      border-top-color: rgba(255, 255, 255, 0.1);
    }
    :host-context(.dark) .badge-candidate,
    :host-context(.dark) .badge-company,
    :host-context(.dark) .badge-recruiter,
    :host-context(.dark) .badge-admin,
    :host-context(.dark) .badge-role,
    :host-context(.theme-dark) .badge-candidate,
    :host-context(.theme-dark) .badge-company,
    :host-context(.theme-dark) .badge-recruiter,
    :host-context(.theme-dark) .badge-admin,
    :host-context(.theme-dark) .badge-role {
      background: #1E293B;
      color: #CBD5E1;
      border-color: rgba(255, 255, 255, 0.12);
    }

    .Math { display: none; }
  `]
})
export class UsersComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly auth = inject(AuthService);

  readonly Math = Math;

  users: AdminUser[] = [];
  filtered: AdminUser[] = [];
  page: AdminUser[] = [];

  search = '';
  roleFilter = 'ALL';
  statusFilter = 'ALL';

  currentPage = 1;
  pageSize = PAGE_SIZE;
  totalPages = 1;

  loading = false;
  loadError = false;
  actionLoading = false;

  drawer: AdminUser | null = null;
  drawerTab = signal<DrawerTab>('profil');

  newRole = 'CANDIDATE';
  pendingAction: PendingAction = null;

  drawerOk = '';
  drawerMsg = '';

  sessions = signal<UserSession[]>([]);
  sessionsLoading = signal(false);

  private searchTimeout: any;

  roleOptions: RoleOption[] = [
    { value: 'CANDIDATE', label: 'Candidat', color: '#0F766E' },
    { value: 'COMPANY', label: 'Entreprise', color: '#D97706' },
    { value: 'RECRUITER', label: 'Recruteur', color: '#7C3AED' },
    { value: 'ADMIN', label: 'Administrateur', color: '#DC2626' }
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.drawer) this.closeDrawer();
  }

  loadUsers(): void {
    this.loading = true;
    this.loadError = false;
    this.adminApi.getUsers().subscribe({
      next: (data) => {
        const users = Array.isArray(data) ? data : (data?.content || data?.users || []);
        this.users = users;
        this.applyFilters();
        this.loading = false;
        // Charger les photos des candidats qui en ont une
        users.forEach((u: AdminUser) => {
          const photoFileId = u?.candidateProfile?.['photoFileId'] as string | undefined;
          if (photoFileId) {
            this.loadCandidatePhoto(u.id);
          }
        });
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loadError = true;
        this.loading = false;
      }
    });
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.applyFilters();
    }, SEARCH_DEBOUNCE_MS);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filtered = this.users.filter(u => {
      const matchSearch = u.email.toLowerCase().includes(this.search.toLowerCase());
      const matchRole = this.roleFilter === 'ALL' || u.roles?.includes(this.roleFilter);
      const matchStatus = this.statusFilter === 'ALL' || (this.statusFilter === 'ACTIVE' ? u.enabled : !u.enabled);
      return matchSearch && matchRole && matchStatus;
    });
    this.totalPages = Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
    this.goPage(1);
  }

  goPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    const start = (p - 1) * this.pageSize;
    this.page = this.filtered.slice(start, start + this.pageSize);
  }

  pageNumbers(): number[] {
    const max = Math.min(5, this.totalPages);
    const arr = [];
    for (let i = Math.max(1, this.currentPage - 2); i <= Math.min(this.totalPages, i + max - 1); i++) {
      arr.push(i);
    }
    return arr;
  }

  hasActiveFilters(): boolean {
    return this.search !== '' || this.roleFilter !== 'ALL' || this.statusFilter !== 'ALL';
  }

  resetFilters(): void {
    this.search = '';
    this.roleFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.applyFilters();
  }

  countByRole(role: string): number {
    return this.users.filter(u => u.roles?.includes(role)).length;
  }

  countInactive(): number {
    return this.users.filter(u => !u.enabled).length;
  }

  countVerified(): number {
    return this.users.filter(u => u.verified).length;
  }

  roleLabel(u: AdminUser): string {
    const role = u.roles?.[0] || 'CANDIDATE';
    const opt = this.roleOptions.find(r => r.value === role);
    return opt?.label || role;
  }

  roleBadge(u: AdminUser): string {
    const role = u.roles?.[0] || 'CANDIDATE';
    const badges: Record<string, string> = {
      CANDIDATE: 'badge-candidate',
      COMPANY: 'badge-company',
      RECRUITER: 'badge-recruiter',
      ADMIN: 'badge-admin'
    };
    return badges[role] || 'badge-candidate';
  }

  /** Cache URL blob par userId pour afficher les photos sans problème d'auth */
  readonly photoCache = new Map<string, string>();

  loadCandidatePhoto(userId: string): void {
    if (this.photoCache.has(userId)) return;
    this.adminApi.downloadCandidatePhoto(userId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.photoCache.set(userId, url);
      },
      error: () => {
        // Pas de photo — le cache reste vide, l'initiale s'affiche
      }
    });
  }

  candidatePhotoUrl(u: AdminUser | null): string | null {
    const candidatePhotoId = u?.candidateProfile?.['photoFileId'] as string | undefined;
    if (!u || !candidatePhotoId) return null;
    return `http://localhost:8080/api/candidates/${u.id}/photo`;
  }

  userAvatarGradient(u: AdminUser | null): string {
    if (!u) return 'linear-gradient(135deg, #0F766E, #14B8A6)';
    if (!u.enabled) return 'linear-gradient(135deg, #64748B, #94A3B8)';
    const role = u.roles?.[0] || 'CANDIDATE';
    switch (role) {
      case 'ADMIN': return 'linear-gradient(135deg, #DC2626, #EF4444)';
      case 'COMPANY': return 'linear-gradient(135deg, #D97706, #F59E0B)';
      case 'RECRUITER': return 'linear-gradient(135deg, #7C3AED, #8B5CF6)';
      default: return 'linear-gradient(135deg, #0F766E, #14B8A6)';
    }
  }

  openDrawer(u: AdminUser, tab: DrawerTab = 'profil'): void {
    this.drawer = u;
    this.drawerTab.set(tab);
    this.newRole = u.roles?.[0] || 'CANDIDATE';
    this.drawerOk = '';
    this.drawerMsg = '';
    this.pendingAction = null;
    this.loadSessions(u.id);
  }

  closeDrawer(): void {
    this.drawer = null;
    this.setTab('profil');
  }

  setTab(tab: DrawerTab): void {
    this.drawerTab.set(tab);
    this.drawerOk = '';
    this.drawerMsg = '';
  }

  requestToggle(): void {
    this.pendingAction = 'toggle';
  }

  toggleStatus(u: AdminUser): void {
    this.actionLoading = true;
    this.adminApi.toggleUserStatus(u.id).subscribe({
      next: () => {
        u.enabled = !u.enabled;
        this.drawerOk = `Compte ${u.enabled ? 'réactivé' : 'désactivé'} avec succès.`;
        this.pendingAction = null;
        this.actionLoading = false;
        setTimeout(() => (this.drawerOk = ''), 4000);
      },
      error: () => {
        this.drawerMsg = 'Erreur lors de la modification.';
        this.actionLoading = false;
        this.pendingAction = null;
      }
    });
  }

  toggleVerification(u: AdminUser): void {
    if (!u) return;
    this.actionLoading = true;
    this.adminApi.toggleUserVerification(u.id).subscribe({
      next: (updated) => {
        u.verified = updated.verified;
        this.drawerOk = `Statut de vérification mis à jour (${u.verified ? 'Email vérifié' : 'Email non vérifié'}).`;
        this.actionLoading = false;
        setTimeout(() => (this.drawerOk = ''), 4000);
      },
      error: () => {
        this.drawerMsg = 'Erreur lors de la mise à jour de la vérification.';
        this.actionLoading = false;
      }
    });
  }

  saveRoleChange(u: AdminUser): void {
    if (!u || this.isSelf() || this.newRole === (u.roles?.[0] || 'CANDIDATE')) return;
    this.actionLoading = true;
    this.adminApi.updateUserRole(u.id, this.newRole).subscribe({
      next: (updated) => {
        u.roles = updated.roles || [this.newRole];
        this.drawerOk = `Rôle mis à jour avec succès : ${this.roleLabel(u)}.`;
        this.actionLoading = false;
        setTimeout(() => (this.drawerOk = ''), 4000);
      },
      error: () => {
        this.drawerMsg = 'Erreur lors de la mise à jour du rôle.';
        this.actionLoading = false;
      }
    });
  }

  confirmDelete(): void {
    if (!this.drawer || this.isSelf()) return;
    this.actionLoading = true;
    this.adminApi.deleteUser(this.drawer.id).subscribe({
      next: () => {
        const deletedId = this.drawer!.id;
        this.users = this.users.filter(u => u.id !== deletedId);
        this.applyFilters();
        this.closeDrawer();
        this.actionLoading = false;
      },
      error: () => {
        this.drawerMsg = 'Erreur lors de la suppression.';
        this.actionLoading = false;
        this.pendingAction = null;
      }
    });
  }

  loadSessions(userId: string): void {
    this.sessionsLoading.set(true);
    this.adminApi.getUserSessions(userId).subscribe({
      next: (s) => {
        this.sessions.set(s || []);
        this.sessionsLoading.set(false);
      },
      error: () => this.sessionsLoading.set(false)
    });
  }

  isSelf(): boolean {
    return this.drawer?.id === this.auth.user()?.id;
  }

  trackByUserId(_: number, u: AdminUser): string {
    return u.id;
  }
}