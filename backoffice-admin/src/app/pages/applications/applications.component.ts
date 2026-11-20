import { Component, OnInit, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService, AdminApplication } from '../../core/admin-api.service';
import { PermissionsService } from '../../core/permissions.service';
import { CanDirective } from '../../core/can.directive';

const PAGE_SIZE = 10;
type DrawerTab = 'dossier' | 'timeline' | 'dispute' | 'notes';
type QuickAppFilter = 'ALL' | 'DISPUTES' | 'INCOMPLETE' | 'EN_VERIFICATION' | 'TRANSMIS' | 'ENTRETIEN' | 'ACCEPTE' | 'REFUSE';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, CanDirective],
  template: `
    <div class="max-w-7xl mx-auto py-5 space-y-5 px-4 sm:px-6 lg:px-8">

      <!-- ══ HEADER ══ -->
      <div class="px-1 py-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div class="flex items-start">
            <div class="flex-1">
              <h1 class="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Candidatures
              </h1>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
                Suivi des dossiers, médiation des litiges, visionneuse de pièces et traçabilité
              </p>
            </div>
          </div>
          <div class="flex gap-2.5">
            <button class="px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#0F766E] dark:bg-cyan-600 hover:bg-[#0d5d57] dark:hover:bg-cyan-700 transition-colors flex items-center gap-2 justify-center"
                    (click)="loadApplications()"
                    [disabled]="loading">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" [class.animate-spin]="loading"><path stroke-linecap="round" d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path stroke-linecap="round" d="M3 3v5h5"/></svg>
              {{ loading ? 'Actualisation…' : 'Actualiser' }}
            </button>
            <button (click)="exportCSV()" [disabled]="filtered.length === 0" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0F766E] dark:bg-cyan-600 hover:bg-[#0d5d57] dark:hover:bg-cyan-700 disabled:opacity-50 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exporter CSV
            </button>
          </div>
        </div>
      </div>

      <!-- ══ BANDEAU D'ALERTE LITIGES ══ -->
      <div *ngIf="countDisputes() > 0" (click)="setQuickFilter('DISPUTES')" class="flex items-center gap-4 px-5 py-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl hover:shadow-md transition-all cursor-pointer">
        <div class="flex-shrink-0 w-10 h-10 bg-amber-500 dark:bg-amber-600 rounded-lg flex items-center justify-center text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-amber-900 dark:text-amber-100 text-sm">{{ countDisputes() }} litige(s) administratif(s) ouvert(s)</div>
          <div class="text-amber-800 dark:text-amber-200/80 text-xs mt-0.5">Des contestations ou blocages nécessitent une médiation administrative.</div>
        </div>
        <button class="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 dark:bg-amber-500 text-white rounded-xl hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors font-bold text-xs whitespace-nowrap">
          Accéder ({{ countDisputes() }})
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>

      <!-- ══ KPIS STRIP ══ -->
      <div *ngIf="!loading" class="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <!-- Total -->
        <div (click)="setQuickFilter('ALL')" class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Total</span>
            <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white">{{ apps.length }}</div>
        </div>

        <!-- Vérification -->
        <div (click)="setQuickFilter('EN_VERIFICATION')" class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Vérification</span>
            <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white">{{ countVerification() }}</div>
        </div>

        <!-- Transmis -->
        <div (click)="setQuickFilter('TRANSMIS')" class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Transmis</span>
            <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white">{{ countByStatus('TRANSMIS') }}</div>
        </div>

        <!-- Entretiens -->
        <div (click)="setQuickFilter('ENTRETIEN')" class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Entretiens</span>
            <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white">{{ countByStatus('ENTRETIEN') }}</div>
        </div>

        <!-- Acceptées -->
        <div (click)="setQuickFilter('ACCEPTE')" class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Acceptées</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white">{{ countByStatus('ACCEPTE') }}</div>
        </div>

        <!-- Litiges -->
        <div (click)="setQuickFilter('DISPUTES')" class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors" [class.ring-2]="countDisputes() > 0" [class.ring-amber-300]="countDisputes() > 0">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Litiges</span>
            <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white">{{ countDisputes() }}</div>
        </div>
      </div>

      <!-- ══ FILTERS ══ -->
      <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div class="flex-1 relative">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="m20 20-4-4"/></svg>
          <input type="text" [(ngModel)]="search" (ngModelChange)="onFilterChange()" placeholder="Rechercher par candidat, email, offre, entreprise…" class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]" />
        </div>
        <select [(ngModel)]="statusFilter" (ngModelChange)="onSelectFilterChange()" class="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]">
          <option value="ALL">Statut : Tous</option>
          <option value="POSTULE">Postulé</option>
          <option value="RECU">Reçu</option>
          <option value="EN_VERIFICATION">En vérification</option>
          <option value="VERIFIE">Vérifié</option>
          <option value="TRANSMIS">Transmis</option>
          <option value="ENTRETIEN">En entretien</option>
          <option value="ACCEPTE">Accepté</option>
          <option value="REFUSE">Refusé</option>
        </select>
        <select [(ngModel)]="sortBy" (ngModelChange)="onFilterChange()" class="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]">
          <option value="recent">Tri : Plus récentes</option>
          <option value="score">Tri : Score matching</option>
          <option value="candidat">Tri : Nom candidat A-Z</option>
        </select>
        <div class="flex items-center justify-center px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {{ filtered.length }} résultat(s)
        </div>
      </div>

      <!-- ══ LOADING STATE ══ -->
      <div *ngIf="loading" class="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
        <div class="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-[#0F766E] dark:border-t-cyan-500 animate-spin mb-4"></div>
        <p class="text-sm font-medium">Chargement des candidatures…</p>
      </div>

      <!-- ══ EMPTY STATE ══ -->
      <div *ngIf="!loading && filtered.length === 0" class="flex flex-col items-center justify-center py-20 px-4">
        <div class="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mb-6 shadow-sm">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-slate-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <h3 class="font-display text-2xl font-bold text-slate-900 dark:text-white mb-2">Aucune candidature trouvée</h3>
        <p class="text-slate-600 dark:text-slate-400 text-center max-w-md mb-6">{{ quickFilter === 'DISPUTES' ? 'Aucun litige ouvert actuellement.' : 'Modifiez vos filtres ou lancez une nouvelle recherche.' }}</p>
        <button *ngIf="quickFilter !== 'ALL' || search || statusFilter !== 'ALL'" (click)="resetFilters()" class="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0d5d57] transition-colors flex items-center gap-2">
          Réinitialiser les filtres
        </button>
      </div>

      <!-- ══ TABLE ══ -->
      <div *ngIf="!loading && filtered.length > 0" class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xs">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50">
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Candidat</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Offre &amp; Entreprise</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Score</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Statut</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Date</th>
                <th class="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of page" class="border-b border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" (click)="openDrawer(a)" role="button" tabindex="0" (keydown.enter)="openDrawer(a)">
                <!-- Candidat -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg overflow-hidden border border-[#243E54] bg-[#172A3A] flex items-center justify-center flex-shrink-0">
                        <img *ngIf="photoCache.get(a.candidateId)" [src]="photoCache.get(a.candidateId)" [alt]="a.candidatName || 'Candidat'" class="w-full h-full object-cover" />
                        <span *ngIf="!photoCache.get(a.candidateId)" class="font-bold text-sm text-amber-500 dark:text-amber-400">{{ (a.candidatName || 'C').charAt(0).toUpperCase() }}</span>
                      </div>
                    <div class="min-w-0">
                      <div class="font-semibold text-sm text-slate-900 dark:text-white truncate">{{ a.candidatName || 'Candidat' }}</div>
                      <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">{{ a.candidateEmail || 'Email non renseigné' }}</div>
                    </div>
                  </div>
                </td>

                <!-- Offre & Entreprise -->
                <td class="px-6 py-4 max-w-[260px]">
                  <div class="font-semibold text-sm text-slate-900 dark:text-white truncate" [title]="a.offerTitle || &quot;Offre d'emploi&quot;">{{ a.offerTitle || "Offre d'emploi" }}</div>
                  <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate" [title]="getDisplayCompany(a)">{{ getDisplayCompany(a) }}</div>
                </td>

                <!-- Score -->
                <td class="px-6 py-4">
                  <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1" [ngClass]="scoreBadge(a.matchingScore ?? 70)">
                    {{ a.matchingScore ?? 70 }}%
                  </span>
                </td>

                <!-- Statut -->
                <td class="px-6 py-4">
                  <span class="inline-flex items-center gap-1.5 text-xs font-semibold" [ngClass]="statusTextClass(a.statut)">
                    {{ statusLabel(a.statut) }}
                  </span>
                  <div *ngIf="a.disputeOpen" class="mt-1"><span class="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">Litige</span></div>
                </td>

                <!-- Date -->
                <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{{ a.createdAt ? (a.createdAt | date:'dd/MM/yyyy') : 'Récemment' }}</td>

                <!-- Actions -->
                <td class="px-6 py-4" (click)="$event.stopPropagation()">
                  <div class="flex items-center justify-end gap-2">
                    <button (click)="openDrawer(a)" title="Voir le dossier" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-teal-100 dark:hover:bg-cyan-500/20 hover:text-[#0F766E] dark:hover:text-cyan-400 transition-all">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-6 py-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
          <span class="text-sm text-slate-600 dark:text-slate-400">{{ (currentPage-1)*pageSize+1 }}–{{ min(currentPage*pageSize, filtered.length) }} sur {{ filtered.length }}</span>
          <div class="flex items-center gap-2">
            <button (click)="goPage(1)" [disabled]="currentPage===1" class="px-3 py-2 rounded text-xs font-semibold border border-slate-200 dark:border-white/10 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">«</button>
            <button (click)="goPage(currentPage-1)" [disabled]="currentPage===1" class="px-3 py-2 rounded text-xs font-semibold border border-slate-200 dark:border-white/10 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">‹</button>
            <button *ngFor="let p of pageNumbers()" (click)="goPage(p)" class="px-3 py-2 rounded text-xs font-semibold border border-slate-200 dark:border-white/10 transition-colors" [ngClass]="p===currentPage ? 'bg-[#0F766E] text-white border-[#0F766E]' : 'hover:bg-slate-50 dark:hover:bg-slate-800'">{{ p }}</button>
            <button (click)="goPage(currentPage+1)" [disabled]="currentPage===totalPages" class="px-3 py-2 rounded text-xs font-semibold border border-slate-200 dark:border-white/10 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">›</button>
            <button (click)="goPage(totalPages)" [disabled]="currentPage===totalPages" class="px-3 py-2 rounded text-xs font-semibold border border-slate-200 dark:border-white/10 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">»</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ DRAWER LATÉRAL (IDENTIQUE OFFRES) ══ -->
    <div class="drawer-overlay" *ngIf="drawer" (click)="closeDrawer()">
      <aside class="drawer-panel" style="max-width:580px;width:100%" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">

        <!-- En-tête du Drawer -->
        <div class="drawer-head">
          <div style="display:flex;align-items:center;gap:10px;min-width:0">
            <span class="badge" [ngClass]="statusBadgeClass(drawer.statut)">{{ statusLabel(drawer.statut) }}</span>
            <span style="font-size:.82rem;color:var(--n-500);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ drawer.candidatName || 'Candidat' }}</span>
          </div>
          <button class="drawer-close" (click)="closeDrawer()" aria-label="Fermer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>

        <!-- Onglets du Drawer -->
        <div class="o-tabs" role="tablist">
          <button type="button" role="tab" [class.active]="activeTab() === 'dossier'" (click)="activeTab.set('dossier')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Dossier
          </button>
          <button type="button" role="tab" [class.active]="activeTab() === 'timeline'" (click)="activeTab.set('timeline')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Chronologie
          </button>
          <button type="button" role="tab" [class.active]="activeTab() === 'dispute'" (click)="activeTab.set('dispute')" style="position:relative">
            <span class="tab-indicator" *ngIf="drawer.disputeOpen"></span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Litiges
          </button>
          <button type="button" role="tab" [class.active]="activeTab() === 'notes'" (click)="activeTab.set('notes')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Notes ({{ drawer.adminNotes?.length || 0 }})
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

          <!-- ════════ ONGLET 1: DOSSIER ════════ -->
          <div *ngIf="activeTab() === 'dossier'">
            <!-- Hero block -->
            <div class="o-hero">
              <div class="o-hero-avatar overflow-hidden" [ngClass]="candidateAvatarClass(drawer.statut)">
                <img *ngIf="photoCache.get(drawer.candidateId)" [src]="photoCache.get(drawer.candidateId)" [alt]="drawer.candidatName || 'Candidat'" class="w-full h-full object-cover" />
                <span *ngIf="!photoCache.get(drawer.candidateId)" class="flex items-center justify-center w-full h-full font-bold text-sm text-amber-500 dark:text-amber-400">{{ (drawer.candidatName || 'C').charAt(0).toUpperCase() }}</span>
              </div>
              <div class="o-hero-title">{{ drawer.candidatName || 'Candidat' }}</div>
              <div class="o-hero-company">{{ drawer.candidateEmail || 'Email non renseigné' }}</div>
              <div class="o-hero-badges">
                <span class="badge" [ngClass]="statusBadgeClass(drawer.statut)">
                  {{ statusLabel(drawer.statut) }}
                </span>
                <span class="badge badge-candidate">{{ drawer.matchingScore ?? 70 }}% match</span>
                <span class="badge badge-dispute" *ngIf="drawer.disputeOpen">Litige ouvert</span>
                <span class="badge badge-incomplete" *ngIf="drawer.dossierIncomplet">Dossier incomplet</span>
              </div>
            </div>

            <!-- Cartes métriques -->
            <div class="metrics-row">
              <div class="metric-card">
                <div class="metric-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                <div class="metric-info">
                  <div class="metric-val">{{ drawer.offerTitle || "Offre d'emploi" }}</div>
                  <div class="metric-label">Offre ciblée</div>
                </div>
              </div>
              <div class="metric-card">
                <div class="metric-icon candidatures"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></div>
                <div class="metric-info">
                  <div class="metric-val">{{ getDisplayCompany(drawer) }}</div>
                  <div class="metric-label">Entreprise</div>
                </div>
              </div>
            </div>

            <!-- Grille d'informations -->
            <div class="o-info-section">
              <div class="section-subtitle">Détails du dossier</div>
              <div class="o-info-grid">
                <div class="o-info-card">
                  <div class="o-info-icon" style="background:#EFF6FF;color:#3B82F6">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div class="o-info-content">
                    <div class="o-info-label">Date soumission</div>
                    <div class="o-info-value">{{ drawer.createdAt ? (drawer.createdAt | date:'dd MMMM yyyy HH:mm') : 'Récemment' }}</div>
                  </div>
                </div>
                <div class="o-info-card">
                  <div class="o-info-icon" style="background:#F5F3FF;color:#7C3AED">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  </div>
                  <div class="o-info-content">
                    <div class="o-info-label">Score matching</div>
                    <div class="o-info-value">{{ drawer.matchingScore != null ? drawer.matchingScore + '%' : '70%' }}</div>
                  </div>
                </div>
                <div class="o-info-card">
                  <div class="o-info-icon" [style.background]="drawer.dossierIncomplet ? '#FFF1F2' : '#ECFDF5'" [style.color]="drawer.dossierIncomplet ? '#E11D48' : '#059669'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  </div>
                  <div class="o-info-content">
                    <div class="o-info-label">État du dossier</div>
                    <div class="o-info-value" [style.color]="drawer.dossierIncomplet ? '#E11D48' : '#059669'">{{ drawer.dossierIncomplet ? 'Incomplet' : 'Complet' }}</div>
                  </div>
                </div>
                <div class="o-info-card" *ngIf="drawer.disputeOpen">
                  <div class="o-info-icon" style="background:#FFFBEB;color:#D97706">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                  </div>
                  <div class="o-info-content">
                    <div class="o-info-label">Litige ouvert</div>
                    <div class="o-info-value">{{ drawer.disputeOpenedAt ? (drawer.disputeOpenedAt | date:'dd MMMM yyyy') : 'En cours' }}</div>
                  </div>
                </div>
              </div>

              <!-- Motif dossier incomplet si présent -->
              <div *ngIf="drawer.dossierIncomplet && drawer.dossierIncompletMotif" style="padding:12px 14px;border-radius:10px;background:#FFF1F2;border:1px solid #FECACA;margin-bottom:14px">
                <div class="section-subtitle" style="color:#9F1239;margin-bottom:4px">Motif : dossier incomplet</div>
                <p style="font-size:.8rem;color:#BE123C;margin:0">{{ drawer.dossierIncompletMotif }}</p>
              </div>

              <!-- Lettre de motivation -->
              <div class="drawer-section-block">
                <div class="section-subtitle">Lettre de motivation</div>
                <div class="offer-description-box">{{ drawer.lettreMotivation || 'Aucune lettre de motivation fournie pour cette candidature.' }}</div>
              </div>

              <!-- Actions CV et statut -->
              <div class="drawer-section-block">
                <div class="section-subtitle">Actions sur les pièces</div>
                <div style="display:flex;gap:10px;flex-wrap:wrap">
                  <button (click)="viewOrDownloadCv(drawer, false)" [disabled]="actionLoading" class="btn-decision approve" style="flex:1;min-width:130px">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/></svg>
                    <span>Télécharger CV</span>
                  </button>
                  <button (click)="viewOrDownloadCv(drawer, true)" [disabled]="actionLoading" class="btn-decision request-edit" style="flex:1;min-width:130px">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <span>Aperçu CV</span>
                  </button>
                  <button (click)="toggleIncomplete(drawer)" [disabled]="actionLoading" class="btn-decision reject" style="flex:1;min-width:130px">
                    <span>{{ drawer.dossierIncomplet ? 'Régulariser dossier' : 'Signaler incomplet' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ════════ ONGLET 2: CHRONOLOGIE ════════ -->
          <div *ngIf="activeTab() === 'timeline'" style="padding:20px 22px">
            <div class="section-subtitle">Historique des étapes et traçabilité</div>
            <div *ngIf="timelineLoading" style="display:flex;align-items:center;gap:10px;padding:16px 0">
              <div style="width:18px;height:18px;border:2px solid #e5e7eb;border-top-color:#0F766E;border-radius:50%;animation:spin 1s linear infinite"></div>
              <span style="font-size:.8rem;color:#6b7280">Chargement de la chronologie…</span>
            </div>
            <div class="timeline-empty" *ngIf="!timelineLoading && timeline.length === 0">Aucune étape enregistrée pour cette candidature.</div>
            <div class="timeline-list" *ngIf="!timelineLoading && timeline.length > 0">
              <div class="timeline-item" *ngFor="let t of timeline">
                <div class="timeline-point" [ngClass]="timelinePointClass(t.statut)"></div>
                <div class="timeline-content">
                  <div class="timeline-action-row">
                    <span class="badge" [ngClass]="statusBadgeClass(t.statut)">{{ statusLabel(t.statut) }}</span>
                    <span class="timeline-date">{{ t.date | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                  <div class="timeline-author" *ngIf="t.acteurName">Par : <strong>{{ t.acteurName }}</strong></div>
                  <div class="timeline-comment" *ngIf="t.commentaire">« {{ t.commentaire }} »</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ════════ ONGLET 3: LITIGES & ARBITRAGE ════════ -->
          <div *ngIf="activeTab() === 'dispute'" style="padding:20px 22px">
            <div *ngIf="drawer.disputeOpen" class="moderation-decision-box">
              <div class="decision-head">
                <div class="decision-title">Litige administratif en cours</div>
                <span class="badge" style="background:#FEF3C7;color:#92400E;border:1px solid #FCD34D">Ouvert</span>
              </div>
              <div style="margin:12px 0;padding:10px 12px;border-radius:8px;background:#FFFBEB;border:1px solid #FDE68A;font-size:.8rem;color:#92400E">
                <strong>Motif :</strong> {{ drawer.disputeMotif }}
              </div>
              <div class="form-group" style="margin-top:12px">
                <label class="form-label" for="resDispute">Résolution administrative</label>
                <textarea id="resDispute" class="form-textarea" rows="3" [(ngModel)]="resolveDisputeComment" placeholder="Décision, accord amiable ou régularisation…"></textarea>
              </div>
              <div class="decision-actions" style="margin-top:12px">
                <button class="btn-decision approve" (click)="resolveDispute(drawer)" [disabled]="actionLoading">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" d="M20 6 9 17l-5-5"/></svg>
                  <span>Résoudre et clôturer le litige</span>
                </button>
              </div>
            </div>

            <div *ngIf="!drawer.disputeOpen" class="moderation-decision-box">
              <div class="decision-head">
                <div class="decision-title">Ouvrir un litige administratif</div>
                <span style="font-size:.72rem;color:var(--n-500)">Aucun litige actif</span>
              </div>
              <div class="form-group" style="margin-top:12px">
                <label class="form-label" for="newDispute">Motif du litige</label>
                <textarea id="newDispute" class="form-textarea" rows="3" [(ngModel)]="newDisputeMotif" placeholder="Désaccord recruteur/candidat, signalement, fraude…"></textarea>
              </div>
              <div class="decision-actions" style="margin-top:12px">
                <button class="btn-decision reject" (click)="openDispute(drawer)" [disabled]="actionLoading || !newDisputeMotif.trim()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  <span>Déclarer un litige</span>
                </button>
              </div>
            </div>

            <!-- Forçage de statut -->
            <div style="margin-top:20px">
              <div class="section-subtitle">Forçage de statut (Arbitrage Admin)</div>
              <div class="moderation-decision-box">
                <div class="form-group">
                  <label class="form-label" for="fStat">Nouveau statut imposé</label>
                  <select id="fStat" class="filter-select" style="width:100%" [(ngModel)]="forcedStatus">
                    <option value="POSTULE">POSTULE (Postulé)</option>
                    <option value="RECU">RECU (Reçu)</option>
                    <option value="EN_VERIFICATION">EN_VERIFICATION (En vérification)</option>
                    <option value="VERIFIE">VERIFIE (Vérifié)</option>
                    <option value="TRANSMIS">TRANSMIS (Transmis)</option>
                    <option value="ENTRETIEN">ENTRETIEN (Entretien)</option>
                    <option value="ACCEPTE">ACCEPTE (Accepté)</option>
                    <option value="REFUSE">REFUSE (Refusé)</option>
                  </select>
                </div>
                <div class="form-group" style="margin-top:12px">
                  <label class="form-label" for="fMotif">Motif d'audit administratif (obligatoire)</label>
                  <input id="fMotif" type="text" class="form-input" [(ngModel)]="forceMotif" placeholder="Justification administrative pour traçabilité…" />
                </div>
                <div class="decision-actions" style="margin-top:12px">
                  <button class="btn-decision approve" (click)="applyForceStatus(drawer)" [disabled]="actionLoading || !forceMotif.trim()">
                    <span>Appliquer le forçage</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ════════ ONGLET 4: NOTES INTERNES ════════ -->
          <div *ngIf="activeTab() === 'notes'" style="padding:20px 22px">
            <div class="section-subtitle">Ajouter une note interne</div>
            <div class="moderation-decision-box">
              <div class="form-group">
                <label class="form-label" for="noteContent">Commentaire ou consigne administrative</label>
                <textarea id="noteContent" class="form-textarea" rows="3" [(ngModel)]="newNoteContent" placeholder="Observations internes, antécédents, alertes…"></textarea>
              </div>
              <div class="decision-actions" style="margin-top:12px">
                <button class="btn-decision approve" (click)="addNote(drawer)" [disabled]="actionLoading || !newNoteContent.trim()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span>Enregistrer la note</span>
                </button>
              </div>
            </div>

            <!-- Liste des notes -->
            <div *ngIf="drawer.adminNotes && drawer.adminNotes.length > 0" style="margin-top:18px">
              <div class="section-subtitle">Historique des notes ({{ drawer.adminNotes.length }})</div>
              <div *ngFor="let n of drawer.adminNotes" style="padding:10px 14px;border:1px solid var(--n-100);border-radius:10px;margin-bottom:10px;background:var(--n-50)">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                  <span style="font-size:.74rem;font-weight:700;color:var(--ink)">{{ n.authorEmail }}</span>
                  <span style="font-size:.7rem;color:var(--n-400)">{{ n.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <p style="font-size:.8rem;color:var(--n-600);margin:0;line-height:1.5">{{ n.content }}</p>
              </div>
            </div>
            <div class="timeline-empty" *ngIf="!drawer.adminNotes || drawer.adminNotes.length === 0">Aucune note interne sur ce dossier pour le moment.</div>
          </div>

        </div>

        <!-- Footer du Drawer -->
        <div class="o-drawer-footer"></div>
      </aside>
    </div>
  `,
  styles: [`
    :host {
      --ink: #0f172a;
      --n-50: #f8fafc;
      --n-100: #f1f5f9;
      --n-200: #e2e8f0;
      --n-400: #94a3b8;
      --n-500: #64748b;
      --n-600: #475569;
      --n-700: #334155;
      --signal: #0F766E;
    }

    /* ── Drawer Overlay & Panel ────────────────────────────────── */
    .drawer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(3px);
      z-index: 1000;
      display: flex;
      justify-content: flex-end;
      animation: fadeIn .18s ease;
    }
    .drawer-panel {
      background: #fff;
      height: 100%;
      display: flex;
      flex-direction: column;
      box-shadow: -8px 0 40px rgba(0,0,0,0.18);
      animation: slideIn .22s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      overflow: hidden;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }

    .drawer-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 22px 14px;
      border-bottom: 1px solid var(--n-100);
      flex-shrink: 0;
    }
    .drawer-close {
      border: 0;
      background: transparent;
      color: var(--n-400);
      cursor: pointer;
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      transition: all .12s;
    }
    .drawer-close:hover { background: var(--n-100); color: var(--ink); }
    .drawer-body { flex: 1; overflow-y: auto; }
    .o-drawer-footer {
      padding: 14px 22px;
      border-top: 1px solid var(--n-100);
      flex-shrink: 0;
      min-height: 14px;
    }

    /* ── Drawer Tabs ───────────────────────────────────────────── */
    .o-tabs {
      display: flex;
      gap: 2px;
      padding: 0 22px;
      border-bottom: 1px solid var(--n-100);
      background: var(--n-50);
      flex-shrink: 0;
    }
    .o-tabs button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px 6px;
      border: 0;
      background: transparent;
      cursor: pointer;
      font-size: .76rem;
      font-weight: 600;
      color: var(--n-500);
      border-bottom: 2px solid transparent;
      transition: all .12s;
    }
    .o-tabs button:hover { color: var(--ink); }
    .o-tabs button.active {
      color: #4F46E5;
      border-bottom-color: #4F46E5;
      background: #fff;
      margin-bottom: -1px;
    }
    .tab-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #F59E0B;
    }

    /* ── Drawer Hero & Badges ──────────────────────────────────── */
    .o-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 22px 18px;
      border-bottom: 1px solid var(--n-100);
      text-align: center;
      background: linear-gradient(160deg, var(--n-50) 0%, #fff 60%);
    }
    .o-hero-avatar {
      width: 58px;
      height: 58px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      flex-shrink: 0;
    }
    .o-hero-avatar.av-verification { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); }
    .o-hero-avatar.av-transmis { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); }
    .o-hero-avatar.av-entretien { background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); }
    .o-hero-avatar.av-accepte { background: linear-gradient(135deg, #10B981 0%, #059669 100%); }
    .o-hero-avatar.av-refuse { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); }
    .o-hero-avatar.av-default { background: linear-gradient(135deg, #475569 0%, #334155 100%); }

    .o-hero-title {
      font-size: .98rem;
      font-weight: 700;
      color: var(--ink);
      letter-spacing: -.01em;
      word-break: break-word;
    }
    .o-hero-company {
      font-size: .76rem;
      color: var(--n-500);
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

    /* ── Metrics Row ───────────────────────────────────────────── */
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
      border: 1.5px solid var(--n-100);
      border-radius: 12px;
      overflow: hidden;
    }
    .metric-icon {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      background: #F1F5F9;
      color: #475569;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .metric-icon.candidatures { background: #EEF2FF; color: #4F46E5; }
    .metric-info { min-width: 0; }
    .metric-val {
      font-size: .88rem;
      font-weight: 700;
      color: var(--ink);
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .metric-label { font-size: .68rem; color: var(--n-500); margin-top: 2px; }

    /* ── Info Grid ─────────────────────────────────────────────── */
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
      border: 1px solid var(--n-100);
      border-radius: 10px;
      background: var(--n-50);
    }
    .o-info-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .o-info-content { min-width: 0; }
    .o-info-label {
      font-size: .64rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: var(--n-400);
      margin-bottom: 2px;
    }
    .o-info-value {
      font-size: .8rem;
      font-weight: 600;
      color: var(--ink);
      word-break: break-word;
    }

    .section-subtitle {
      font-size: .72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: var(--n-500);
      margin-bottom: 8px;
    }
    .drawer-section-block { margin-top: 14px; }
    .offer-description-box {
      padding: 12px 14px;
      border-radius: 10px;
      background: var(--n-50);
      border: 1px solid var(--n-100);
      font-size: .8rem;
      line-height: 1.55;
      color: var(--n-700);
      max-height: 200px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* ── Moderation Decision Box ───────────────────────────────── */
    .moderation-decision-box {
      padding: 16px;
      background: #fff;
      border: 1.5px solid var(--n-200);
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
      color: var(--ink);
    }
    .decision-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* ── Form Inputs ───────────────────────────────────────────── */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-label {
      font-size: .72rem;
      font-weight: 700;
      color: var(--n-600);
      text-transform: uppercase;
      letter-spacing: .04em;
    }
    .form-textarea {
      width: 100%;
      padding: 8px 10px;
      border-radius: 9px;
      border: 1.5px solid var(--n-200);
      background: #fff;
      font-size: .8rem;
      color: var(--ink);
      resize: none;
      font-family: inherit;
      box-sizing: border-box;
      transition: border-color .12s;
    }
    .form-textarea:focus { outline: none; border-color: var(--signal); }
    .form-input {
      width: 100%;
      padding: 8px 10px;
      border-radius: 9px;
      border: 1.5px solid var(--n-200);
      background: #fff;
      font-size: .8rem;
      color: var(--ink);
      font-family: inherit;
      box-sizing: border-box;
      transition: border-color .12s;
    }
    .form-input:focus { outline: none; border-color: var(--signal); }
    .filter-select {
      padding: 8px 10px;
      border-radius: 9px;
      border: 1.5px solid var(--n-200);
      background: #fff;
      font-size: .8rem;
      color: var(--ink);
      transition: border-color .12s;
    }
    .filter-select:focus { outline: none; border-color: var(--signal); }

    /* ── Decision Buttons ──────────────────────────────────────── */
    .btn-decision {
      display: inline-flex;
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
    .btn-decision.approve { background: #059669; color: #fff; }
    .btn-decision.approve:hover:not(:disabled) { background: #047857; }
    .btn-decision.request-edit { background: #FFFBEB; color: #B45309; border: 1.5px solid #FCD34D; }
    .btn-decision.request-edit:hover:not(:disabled) { background: #FEF3C7; }
    .btn-decision.reject { background: #FFF1F2; color: #9F1239; border: 1.5px solid #FECACA; }
    .btn-decision.reject:hover:not(:disabled) { background: #FFE4E6; }

    /* ── Badges ────────────────────────────────────────────────── */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: .7rem;
      font-weight: 700;
    }
    .badge-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
    }
    .badge-dot.pulsing { animation: pulse 1.6s infinite ease-in-out; }
    .badge-candidate { background: #EEF2FF; color: #4338CA; }
    .badge-dispute { background: #FEF3C7; color: #92400E; }
    .badge-incomplete { background: #FFF7ED; color: #C2410C; }
    .badge-accepte { background: #D1FAE5; color: #065F46; }
    .badge-refuse { background: #FFE4E6; color: #9F1239; }
    .badge-transmis { background: #DBEAFE; color: #1E40AF; }
    .badge-entretien { background: #EDE9FE; color: #5B21B6; }
    .badge-pending { background: #FEF3C7; color: #92400E; }
    .badge-default { background: #F1F5F9; color: #475569; }

    /* ── Timeline ──────────────────────────────────────────────── */
    .timeline-empty {
      font-size: .76rem;
      color: var(--n-400);
      font-style: italic;
      padding: 10px 0;
      text-align: center;
    }
    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
      padding-left: 14px;
      border-left: 2px solid var(--n-100);
      margin-left: 6px;
      margin-top: 10px;
    }
    .timeline-item { position: relative; }
    .timeline-point {
      position: absolute;
      left: -19px;
      top: 4px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--n-400);
      border: 2px solid #fff;
    }
    .timeline-point.tp-accepte { background: #059669; }
    .timeline-point.tp-refuse { background: #E11D48; }
    .timeline-point.tp-entretien { background: #8B5CF6; }
    .timeline-point.tp-transmis { background: #3B82F6; }
    .timeline-point.tp-default { background: #94A3B8; }
    .timeline-content {
      background: #fff;
      border: 1px solid var(--n-100);
      border-radius: 8px;
      padding: 9px 12px;
    }
    .timeline-action-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .timeline-date { font-size: .7rem; color: var(--n-400); }
    .timeline-author { font-size: .72rem; color: var(--n-500); margin-top: 4px; }
    .timeline-comment {
      font-size: .76rem;
      color: var(--ink);
      margin-top: 4px;
      font-style: italic;
      background: var(--n-50);
      padding: 4px 8px;
      border-radius: 6px;
    }

    /* ── Feedback ──────────────────────────────────────────────── */
    .o-feedback {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 9px;
      font-size: .78rem;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .o-feedback.ok { background: #D1FAE5; border: 1px solid #A7F3D0; color: #065F46; }
    .o-feedback.err { background: #FEE2E2; border: 1px solid #FECACA; color: #991B1B; }
  `]
})
export class ApplicationsComponent implements OnInit {
  private api = inject(AdminApiService);
  private permissions = inject(PermissionsService);

  apps: AdminApplication[] = [];
  filtered: AdminApplication[] = [];
  page: AdminApplication[] = [];
  timeline: any[] = [];
  drawer: AdminApplication | null = null;
  activeTab = signal<DrawerTab>('dossier');
  loading = false;
  actionLoading = false;
  timelineLoading = false;
  search = '';
  statusFilter = 'ALL';
  quickFilter: QuickAppFilter = 'ALL';
  sortBy = 'recent';
  currentPage = 1;
  pageSize = PAGE_SIZE;
  totalPages = 1;
  resolveDisputeComment = '';
  newDisputeMotif = '';
  forcedStatus = 'VERIFIE';
  forceMotif = '';
  newNoteContent = '';
  drawerMsg = '';
  drawerOk = '';

  ngOnInit(): void {
    this.loadApplications();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.drawer) this.closeDrawer();
  }

  loadApplications(): void {
    this.loading = true;
    this.api.getApplications().subscribe({
      next: res => {
        const raw = res || [];

        // 1. Enriched scores (companyName vient directement du backend)
        const enriched = raw.map(a => {
          let score = a.matchingScore;
          if (score === undefined || score === null || score <= 0) {
            score = this.deriveDefaultScore(a.statut);
          }
          return { ...a, matchingScore: score };
        });

        // 2. Deduplicate duplicate candidatures for the same candidate and offer
        const seen = new Map<string, AdminApplication>();
        for (const app of enriched) {
          const candKey = (app.candidateEmail || app.candidatName || app.candidateId || '').toLowerCase().trim();
          const offerKey = (app.offerTitle || app.offerId || '').toLowerCase().trim();
          const key = candKey + '###' + offerKey;
          if (!seen.has(key)) {
            seen.set(key, app);
          } else {
            const existing = seen.get(key)!;
            if (existing.statut === 'REFUSE' && app.statut !== 'REFUSE') {
              seen.set(key, app);
            } else if ((app.createdAt || '') > (existing.createdAt || '')) {
              seen.set(key, app);
            }
          }
        }

        this.apps = Array.from(seen.values());
        this.loading = false;
        this.applyFilters();
        // Charger les photos des candidats
        this.apps.forEach(a => {
          if (a.candidateId) this.loadCandidatePhoto(a.candidateId);
        });
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getDisplayCompany(a?: AdminApplication | null): string {
    if (!a) return '—';
    const c = a.companyName;
    if (c && c.trim() && c.trim() !== '-' && c.trim() !== '—') {
      return c.trim();
    }
    return '—';
  }

  deriveDefaultScore(statut?: string): number {
    switch (statut) {
      case 'ACCEPTE':
      case 'VERIFIE':
        return 88;
      case 'ENTRETIEN':
        return 82;
      case 'TRANSMIS':
        return 76;
      case 'EN_VERIFICATION':
      case 'RECU':
        return 68;
      case 'POSTULE':
        return 64;
      case 'REFUSE':
        return 45;
      default:
        return 72;
    }
  }

  setQuickFilter(qf: QuickAppFilter): void {
    this.quickFilter = qf;
    if (qf === 'ALL') {
      this.statusFilter = 'ALL';
    } else if (qf === 'DISPUTES' || qf === 'INCOMPLETE') {
      this.statusFilter = 'ALL';
    } else {
      this.statusFilter = qf;
    }
    this.currentPage = 1;
    this.applyFilters();
  }

  onSelectFilterChange(): void {
    if (this.statusFilter === 'ALL') {
      this.quickFilter = 'ALL';
    } else if (['EN_VERIFICATION', 'TRANSMIS', 'ENTRETIEN', 'ACCEPTE', 'REFUSE'].includes(this.statusFilter)) {
      this.quickFilter = this.statusFilter as QuickAppFilter;
    }
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  resetFilters(): void {
    this.search = '';
    this.quickFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.sortBy = 'recent';
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    const q = this.search.trim().toLowerCase();
    let list = this.apps.filter(a => {
      const ms = !q || (a.candidatName?.toLowerCase().includes(q)) || (a.candidateEmail?.toLowerCase().includes(q)) ||
        (a.offerTitle?.toLowerCase().includes(q)) || (a.companyName?.toLowerCase().includes(q)) || a.id.toLowerCase().includes(q);
      let mf = true;
      if (this.quickFilter === 'DISPUTES') mf = Boolean(a.disputeOpen);
      else if (this.quickFilter === 'INCOMPLETE') mf = Boolean(a.dossierIncomplet);
      else if (this.quickFilter !== 'ALL') mf = a.statut === this.quickFilter;
      else if (this.statusFilter !== 'ALL') mf = a.statut === this.statusFilter;
      return ms && mf;
    });

    if (this.sortBy === 'recent') {
      list = list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } else if (this.sortBy === 'score') {
      list = list.sort((a, b) => (b.matchingScore ?? -1) - (a.matchingScore ?? -1));
    } else if (this.sortBy === 'candidat') {
      list = list.sort((a, b) => (a.candidatName || '').localeCompare(b.candidatName || ''));
    }

    this.filtered = list;
    this.totalPages = Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.slicePage();
  }

  slicePage(): void {
    const s = (this.currentPage - 1) * this.pageSize;
    this.page = this.filtered.slice(s, s + this.pageSize);
  }

  goPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    this.slicePage();
  }

  pageNumbers(): number[] {
    const d = 2;
    const s = Math.max(1, this.currentPage - d);
    const e = Math.min(this.totalPages, this.currentPage + d);
    const r: number[] = [];
    for (let i = s; i <= e; i++) r.push(i);
    return r;
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  openDrawer(a: AdminApplication, tab: DrawerTab = 'dossier'): void {
    this.drawer = { ...a };
    this.activeTab.set(tab);
    this.drawerMsg = '';
    this.drawerOk = '';
    this.resolveDisputeComment = '';
    this.newDisputeMotif = '';
    this.forcedStatus = a.statut;
    this.forceMotif = '';
    this.newNoteContent = '';
    this.loadTimeline(a.id);
    document.body.style.overflow = 'hidden';
  }

  closeDrawer(): void {
    this.drawer = null;
    document.body.style.overflow = 'auto';
  }

  loadTimeline(id: string): void {
    this.timeline = [];
    this.timelineLoading = true;
    this.api.getApplicationTimeline(id).subscribe({
      next: t => {
        this.timeline = t || [];
        this.timelineLoading = false;
      },
      error: () => {
        this.timelineLoading = false;
      }
    });
  }

  viewOrDownloadCv(a: AdminApplication, preview: boolean): void {
    this.actionLoading = true;
    this.drawerMsg = '';
    this.drawerOk = '';
    this.api.downloadCandidateCv(a.candidateId).subscribe({
      next: blob => {
        this.actionLoading = false;
        const url = window.URL.createObjectURL(blob);
        if (preview) {
          window.open(url, '_blank');
        } else {
          const l = document.createElement('a');
          l.href = url;
          l.download = `CV-${(a.candidatName || 'candidat').replace(/\\s+/g, '_')}.pdf`;
          l.click();
          window.URL.revokeObjectURL(url);
        }
      },
      error: () => {
        this.actionLoading = false;
        this.drawerMsg = 'Fichier CV introuvable ou non disponible.';
      }
    });
  }

  toggleIncomplete(a: AdminApplication): void {
    const next = !a.dossierIncomplet;
    let motif = '';
    if (next) {
      const inp = prompt('Motif (ex: CV manquant, justificatif illisible) :');
      if (inp === null) return;
      motif = inp.trim();
    }
    this.actionLoading = true;
    this.drawerMsg = '';
    this.drawerOk = '';
    this.api.toggleDossierIncomplet(a.id, next, motif).subscribe({
      next: u => {
        this.actionLoading = false;
        this.drawer = { ...this.drawer, ...u };
        this.drawerOk = next ? 'Dossier signalé incomplet.' : 'Dossier régularisé.';
        this.updateAppLocally(u);
        this.loadTimeline(a.id);
      },
      error: e => {
        this.actionLoading = false;
        this.drawerMsg = e.error?.message || 'Erreur lors de la mise à jour.';
      }
    });
  }

  openDispute(a: AdminApplication): void {
    if (!this.newDisputeMotif.trim()) return;
    this.actionLoading = true;
    this.drawerMsg = '';
    this.drawerOk = '';
    this.api.openDispute(a.id, this.newDisputeMotif.trim()).subscribe({
      next: u => {
        this.actionLoading = false;
        this.drawer = { ...this.drawer, ...u };
        this.drawerOk = 'Litige ouvert avec succès.';
        this.newDisputeMotif = '';
        this.updateAppLocally(u);
        this.loadTimeline(a.id);
      },
      error: e => {
        this.actionLoading = false;
        this.drawerMsg = e.error?.message || 'Erreur lors de l\'ouverture du litige.';
      }
    });
  }

  resolveDispute(a: AdminApplication): void {
    this.actionLoading = true;
    this.drawerMsg = '';
    this.drawerOk = '';
    this.api.resolveDispute(a.id, this.resolveDisputeComment.trim()).subscribe({
      next: u => {
        this.actionLoading = false;
        this.drawer = { ...this.drawer, ...u };
        this.drawerOk = 'Litige résolu et dossier mis à jour.';
        this.resolveDisputeComment = '';
        this.updateAppLocally(u);
        this.loadTimeline(a.id);
      },
      error: e => {
        this.actionLoading = false;
        this.drawerMsg = e.error?.message || 'Erreur lors de la résolution du litige.';
      }
    });
  }

  applyForceStatus(a: AdminApplication): void {
    if (!this.forceMotif.trim()) {
      this.drawerMsg = 'Le motif d\'audit est obligatoire pour forcer le statut.';
      return;
    }
    this.actionLoading = true;
    this.drawerMsg = '';
    this.drawerOk = '';
    this.api.forceApplicationStatus(a.id, this.forcedStatus, this.forceMotif.trim()).subscribe({
      next: u => {
        this.actionLoading = false;
        this.drawer = { ...this.drawer, ...u };
        this.drawerOk = `Statut forcé à [${this.statusLabel(this.forcedStatus)}].`;
        this.forceMotif = '';
        this.updateAppLocally(u);
        this.loadTimeline(a.id);
      },
      error: e => {
        this.actionLoading = false;
        this.drawerMsg = e.error?.message || 'Erreur lors du forçage de statut.';
      }
    });
  }

  addNote(a: AdminApplication): void {
    if (!this.newNoteContent.trim()) return;
    this.actionLoading = true;
    this.drawerMsg = '';
    this.drawerOk = '';
    this.api.addApplicationNote(a.id, this.newNoteContent.trim()).subscribe({
      next: note => {
        this.actionLoading = false;
        if (!this.drawer!.adminNotes) this.drawer!.adminNotes = [];
        this.drawer!.adminNotes.unshift(note);
        this.newNoteContent = '';
        this.drawerOk = 'Note interne enregistrée.';
        this.updateAppLocally(this.drawer!);
      },
      error: e => {
        this.actionLoading = false;
        this.drawerMsg = e.error?.message || 'Erreur lors de l\'enregistrement de la note.';
      }
    });
  }

  private updateAppLocally(u: AdminApplication): void {
    const i = this.apps.findIndex(x => x.id === u.id);
    if (i !== -1) {
      this.apps[i] = { ...this.apps[i], ...u };
      this.applyFilters();
    }
  }

  exportCSV(): void {
    if (!this.filtered.length) return;
    const h = ['ID', 'Candidat', 'Email', 'Offre', 'ID Offre', 'Entreprise', 'Statut', 'Score (%)', 'Litige', 'Incomplet', 'Date'];
    const r = this.filtered.map(a => [
      `"${a.id}"`,
      `"${(a.candidatName || '').replace(/"/g, '""')}"`,
      `"${(a.candidateEmail || '').replace(/"/g, '""')}"`,
      `"${(a.offerTitle || '').replace(/"/g, '""')}"`,
      `"${a.offerId}"`,
      `"${(this.getDisplayCompany(a)).replace(/"/g, '""')}"`,
      `"${a.statut}"`,
      a.matchingScore ?? '',
      a.disputeOpen ? 'OUI' : 'NON',
      a.dossierIncomplet ? 'OUI' : 'NON',
      `"${a.createdAt || ''}"`
    ]);
    const csv = '\uFEFF' + [h.join(';'), ...r.map(x => x.join(';'))].join('\r\n');
    const b = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const u = URL.createObjectURL(b);
    const l = document.createElement('a');
    l.href = u;
    l.download = `candidatures-${new Date().toISOString().slice(0, 10)}.csv`;
    l.click();
    URL.revokeObjectURL(u);
  }

  countDisputes(): number {
    return this.apps.filter(a => a.disputeOpen).length;
  }

  countIncomplete(): number {
    return this.apps.filter(a => a.dossierIncomplet).length;
  }

  countVerification(): number {
    return this.apps.filter(a => ['EN_VERIFICATION', 'POSTULE', 'RECU'].includes(a.statut)).length;
  }

  countByStatus(s: string): number {
    return this.apps.filter(a => a.statut === s).length;
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = {
      POSTULE: 'Postulé',
      RECU: 'Reçu',
      EN_VERIFICATION: 'En vérification',
      VERIFIE: 'Vérifié',
      TRANSMIS: 'Transmis',
      ENTRETIEN: 'En entretien',
      ACCEPTE: 'Accepté',
      REFUSE: 'Refusé'
    };
    return m[s] || s || 'Inconnu';
  }

  statusTextClass(s: string): string {
    const m: Record<string, string> = {
      ACCEPTE: 'text-emerald-600 dark:text-emerald-400',
      VERIFIE: 'text-emerald-600 dark:text-emerald-400',
      TRANSMIS: 'text-blue-600 dark:text-blue-400',
      ENTRETIEN: 'text-purple-600 dark:text-purple-400',
      REFUSE: 'text-rose-600 dark:text-rose-400',
      EN_VERIFICATION: 'text-amber-600 dark:text-amber-400',
      POSTULE: 'text-slate-600 dark:text-slate-400',
      RECU: 'text-slate-600 dark:text-slate-400'
    };
    return m[s] || 'text-slate-600 dark:text-slate-400';
  }

  statusBadgeClass(s: string): string {
    const m: Record<string, string> = {
      ACCEPTE: 'badge-accepte',
      VERIFIE: 'badge-accepte',
      TRANSMIS: 'badge-transmis',
      ENTRETIEN: 'badge-entretien',
      REFUSE: 'badge-refuse',
      EN_VERIFICATION: 'badge-pending',
      POSTULE: 'badge-default',
      RECU: 'badge-default'
    };
    return m[s] || 'badge-default';
  }

  scoreBadge(score: number): string {
    if (score >= 75) return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 ring-emerald-200';
    if (score >= 50) return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 ring-amber-200';
    return 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 ring-rose-200';
  }

  /** Cache URL blob par candidateId pour afficher les photos avec auth JWT */
  readonly photoCache = new Map<string, string>();

  loadCandidatePhoto(candidateId: string): void {
    if (this.photoCache.has(candidateId)) return;
    this.api.downloadCandidatePhoto(candidateId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.photoCache.set(candidateId, url);
      },
      error: () => {
        // Pas de photo disponible — l'initiale s'affiche
      }
    });
  }

  candidatePhotoUrl(candidateId?: string): string | null {
    if (!candidateId) return null;
    return `http://localhost:8080/api/candidates/${candidateId}/photo`;
  }

  candidateAvatarClass(s: string): string {
    const m: Record<string, string> = {
      ACCEPTE: 'av-accepte',
      VERIFIE: 'av-accepte',
      TRANSMIS: 'av-transmis',
      ENTRETIEN: 'av-entretien',
      REFUSE: 'av-refuse',
      EN_VERIFICATION: 'av-verification'
    };
    return m[s] || 'av-default';
  }

  timelinePointClass(s: string): string {
    const m: Record<string, string> = {
      ACCEPTE: 'tp-accepte',
      REFUSE: 'tp-refuse',
      ENTRETIEN: 'tp-entretien',
      TRANSMIS: 'tp-transmis'
    };
    return m[s] || 'tp-default';
  }
}
