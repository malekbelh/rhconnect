import { Component, OnInit, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService, AdminOffer } from '../../core/admin-api.service';
import { PermissionsService } from '../../core/permissions.service';
import { CanDirective } from '../../core/can.directive';

const PAGE_SIZE = 10;

type DrawerTab = 'details' | 'moderation' | 'edit';
type QuickStatusFilter = 'ALL' | 'PENDING_MODERATION' | 'ACTIVE' | 'DRAFT' | 'REJECTED' | 'OTHER';

@Component({
  selector: 'app-offers',
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
                Offres d'emploi
              </h1>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
                File de modération, gestion des statuts et contrôle qualité des publications
              </p>
            </div>
          </div>
          <button class="px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#0F766E] dark:bg-cyan-600 hover:bg-[#0d5d57] dark:hover:bg-cyan-700 transition-colors flex items-center gap-2 justify-center"
                  (click)="loadAllData()"
                  [disabled]="loading">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" [class.animate-spin]="loading"><path stroke-linecap="round" d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path stroke-linecap="round" d="M3 3v5h5"/></svg>
            {{ loading ? 'Actualisation…' : 'Actualiser' }}
          </button>
        </div>
      </div>

      <!-- ══ BANDEAU D'ALERTE MODÉRATION ══ -->
      <div *ngIf="stats.pending > 0" (click)="setQuickFilter('PENDING_MODERATION')" class="flex items-center gap-4 px-5 py-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl hover:shadow-md transition-all cursor-pointer">
        <div class="flex-shrink-0 w-10 h-10 bg-amber-500 dark:bg-amber-600 rounded-lg flex items-center justify-center text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-amber-900 dark:text-amber-100 text-sm">{{ stats.pending }} offre(s) en attente de modération</div>
          <div class="text-amber-800 dark:text-amber-200/80 text-xs mt-0.5">Des entreprises ont soumis des offres nécessitant validation avant publication publique.</div>
        </div>
        <button class="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 dark:bg-amber-500 text-white rounded-xl hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors font-bold text-xs whitespace-nowrap">
          Accéder ({{ stats.pending }})
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>

      <!-- ══ KPIS STRIP ══ -->
      <div *ngIf="!loading" class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <!-- Total -->
        <div (click)="setQuickFilter('ALL')"class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
        
        <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Total offres</span>
            <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white">{{ stats.total }}</div>
        </div>

        <!-- À modérer -->
        <div (click)="setQuickFilter('PENDING_MODERATION')" [class.ring-2]="stats.pending > 0" [class.ring-amber-300]="stats.pending > 0" class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">À modérer</span>
            <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white">{{ stats.pending }}</div>
        </div>

        <!-- Actives -->
        <div (click)="setQuickFilter('ACTIVE')" class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Actives</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white">{{ stats.active }}</div>
        </div>

        <!-- Rejetées -->
        <div (click)="setQuickFilter('REJECTED')" class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Rejetées</span>
            <div class="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15" stroke-linecap="round"/><line x1="15" y1="9" x2="9" y2="15" stroke-linecap="round"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white">{{ stats.rejected }}</div>
        </div>

        <!-- Brouillons -->
        <div (click)="setQuickFilter('DRAFT')" class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Brouillons</span>
            <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white">{{ stats.draft }}</div>
        </div>
      </div>

      <!-- ══ FILTERS ══ -->
      <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div class="flex-1 relative">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="m20 20-4-4"/></svg>
          <input type="text" [(ngModel)]="search" (ngModelChange)="onFilterChange()" placeholder="Rechercher par titre, entreprise ou ville…" class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]" />
        </div>
        <select [(ngModel)]="statusFilter" (ngModelChange)="onSelectFilterChange()" class="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]">
          <option value="ALL">Statut : Tous</option>
          <option value="PENDING_MODERATION">En attente modération</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Brouillon</option>
          <option value="REJECTED">Rejetée</option>
          <option value="EXPIRED">Expirée</option>
          <option value="UNPUBLISHED">Dépubliée / Clôturée</option>
        </select>
        <select [(ngModel)]="contractFilter" (ngModelChange)="onFilterChange()" class="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]">
          <option value="ALL">Contrat : Tous</option>
          <option value="CDI">CDI</option>
          <option value="CDD">CDD</option>
          <option value="STAGE">Stage</option>
          <option value="SIVP">SIVP</option>
          <option value="FREELANCE">Freelance</option>
          <option value="ALTERNANCE">Alternance</option>
        </select>
        <select [(ngModel)]="sortBy" (ngModelChange)="onFilterChange()" class="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]">
          <option value="recent">Tri : Plus récentes</option>
          <option value="title">Tri : Titre alphabétique</option>
          <option value="candidates">Tri : Plus de candidatures</option>
          <option value="views">Tri : Plus de vues</option>
        </select>
        <div class="flex items-center justify-center px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {{ filtered.length }} résultat(s)
        </div>
      </div>

      <!-- ══ LOADING STATE ══ -->
      <div *ngIf="loading" class="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
        <div class="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-[#0F766E] dark:border-t-cyan-500 animate-spin mb-4"></div>
        <p class="text-sm font-medium">Chargement des offres et des données de modération…</p>
      </div>

      <!-- ══ EMPTY STATE ══ -->
      <div *ngIf="!loading && filtered.length === 0" class="flex flex-col items-center justify-center py-20 px-4">
        <div class="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mb-6 shadow-sm">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-slate-400 dark:text-slate-600"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
        </div>
        <h3 class="font-display text-2xl font-bold text-slate-900 dark:text-white mb-2">Aucune offre ne correspond aux critères</h3>
        <p class="text-slate-600 dark:text-slate-400 text-center max-w-md mb-6">
          {{ quickFilter === 'PENDING_MODERATION' ? 'La file de modération est actuellement vide ! Toutes les offres ont été traitées.' : 'Modifiez vos critères de recherche ou réinitialisez les filtres.' }}
        </p>
        <button *ngIf="quickFilter !== 'ALL' || search || contractFilter !== 'ALL'" (click)="resetFilters()" class="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0F766E] dark:bg-cyan-600 hover:bg-[#0d5d57] dark:hover:bg-cyan-700 transition-colors flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64M3.51 15A9 9 0 0 0 18.36 18.36"/></svg>
          Réinitialiser les filtres
        </button>
      </div>

      <!-- ══ TABLE ══ -->
      <div *ngIf="!loading && filtered.length > 0" class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xs">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50">
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Offre & Entreprise</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Localisation</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Contrat</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Expérience</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Statut</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Date</th>
                <th class="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let o of page; trackBy: trackByOfferId" class="border-b border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" (click)="openDrawer(o)">
                
                <!-- Titre & Entreprise -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-[#172A3A] border border-[#243E54] flex items-center justify-center font-bold text-sm text-amber-500 dark:text-amber-400">
                      {{ (o.title || 'O').charAt(0).toUpperCase() }}
                    </div>
                    <div class="min-w-0">
                      <div class="font-semibold text-sm text-slate-900 dark:text-white truncate">{{ o.title || 'Sans titre' }}</div>
                      <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        {{ o.companyName || 'Entreprise non renseignée' }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Localisation -->
                <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  <div class="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {{ o.localisation || 'Non précisé' }}
                  </div>
                </td>

                <!-- Contrat -->
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {{ o.typeContrat }}
                  </span>
                </td>

                <!-- Expérience -->
                <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{{ o.niveauExperience || 'Tous profils' }}</td>

                <!-- Statut -->
                <td class="px-6 py-4">
                  <span class="inline-flex items-center gap-1.5 text-xs font-semibold" [ngClass]="statusTextClass(o.statut)">
                    <svg width="6" height="6" viewBox="0 0 24 24" fill="currentColor" [class]="o.statut === 'PENDING_MODERATION' ? 'animate-pulse' : ''"><circle cx="12" cy="12" r="10"/></svg>
                    {{ statusLabel(o.statut) }}
                  </span>
                </td>

                <!-- Date -->
                <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {{ (o.createdAt || o.datePublication) ? ((o.createdAt || o.datePublication) | date:'dd/MM/yyyy') : 'Non datée' }}
                </td>

                <!-- Actions -->
                <td class="px-6 py-4" (click)="$event.stopPropagation()">
                  <div class="flex items-center justify-end gap-2">
                    <!-- Quick actions if PENDING_MODERATION -->
                    <ng-container *ngIf="o.statut === 'PENDING_MODERATION'">
                      <button (click)="quickModerate(o, 'APPROVE')" title="Valider l'offre" class="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all" [disabled]="actionLoading">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" d="M20 6 9 17l-5-5"/></svg>
                      </button>
                      <button (click)="openDrawer(o, 'moderation')" title="Refuser/Modifier" class="w-8 h-8 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all" [disabled]="actionLoading">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round"/></svg>
                      </button>
                    </ng-container>

                    <!-- Details button -->
                    <button (click)="openDrawer(o)" title="Voir les détails" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-teal-100 dark:hover:bg-cyan-500/20 hover:text-[#0F766E] dark:hover:text-cyan-400 transition-all">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="m20 20-4-4"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-6 py-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
          <span class="text-sm text-slate-600 dark:text-slate-400">
            {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filtered.length) }} sur {{ filtered.length }} offres
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
         ══ DRAWER — Fiche Offre Enrichie avec 3 Onglets ══
         ════════════════════════════════════════════════════════════ -->
    <div class="drawer-overlay" *ngIf="drawer" (click)="closeDrawer()">
        <aside class="drawer-panel" style="max-width:560px;width:100%" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" [attr.aria-label]="'Détail de ' + drawer.title">

          <!-- Header Drawer -->
          <div class="drawer-head" style="padding:18px 22px 14px;border-bottom:1px solid var(--n-100)">
            <div>
              <div style="font-size:.95rem;font-weight:700;color:var(--ink);max-width:420px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ drawer.title }}</div>
            </div>
            <button class="drawer-close" (click)="closeDrawer()" aria-label="Fermer le détail" style="border:0;background:transparent;color:var(--n-400);cursor:pointer;display:grid;place-items:center;width:28px;height:28px;border-radius:6px">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Onglets du Drawer -->
          <div class="o-tabs" role="tablist">
            <button type="button" role="tab" [class.active]="activeTab() === 'details'" (click)="activeTab.set('details')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Détails & Contenu
            </button>
            <button type="button" role="tab" [class.active]="activeTab() === 'moderation'" (click)="activeTab.set('moderation')">
              <span class="tab-indicator" *ngIf="drawer.statut === 'PENDING_MODERATION'"></span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              Modération & Historique
            </button>
            <button type="button" role="tab" [class.active]="activeTab() === 'edit'" (click)="activeTab.set('edit')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Édition Admin
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

            <!-- ════════ ONGLET 1: DÉTAILS & CONTENU ════════ -->
            <div *ngIf="activeTab() === 'details'">
              <!-- Hero block -->
              <div class="o-hero">
                <div class="o-hero-avatar" [ngClass]="offerAvatarClass(drawer.statut)">
                  {{ (drawer.title || 'O').charAt(0).toUpperCase() }}
                </div>
                <div class="o-hero-title">{{ drawer.title || 'Offre sans titre' }}</div>
                <div class="o-hero-company">
                  Publiée par <strong>{{ drawer.companyName || 'Entreprise partenaire' }}</strong>
                </div>
                <div class="o-hero-badges">
                  <span class="badge" [ngClass]="statusBadgeClass(drawer.statut)">
                    <span class="badge-dot" [class.pulsing]="drawer.statut === 'PENDING_MODERATION'"></span>
                    {{ statusLabel(drawer.statut) }}
                  </span>
                  <span class="badge badge-candidate" *ngIf="drawer.typeContrat">{{ drawer.typeContrat }}</span>
                  <span class="badge badge-verified" *ngIf="drawer.niveauExperience">{{ drawer.niveauExperience }}</span>
                  <span class="badge" style="background:#F1F5F9;color:#475569" *ngIf="drawer.localisation">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;margin-right:3px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {{ drawer.localisation }}
                  </span>
                </div>
              </div>

              <!-- Cartes métriques -->
              <div class="metrics-row">
                <div class="metric-card">
                  <div class="metric-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div>
                  <div class="metric-info">
                    <div class="metric-val">{{ drawer.viewCount || (drawer.stats?.viewCount) || 0 }}</div>
                    <div class="metric-label">Vues enregistrées</div>
                  </div>
                </div>
                <div class="metric-card">
                  <div class="metric-icon candidatures"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg></div>
                  <div class="metric-info">
                    <div class="metric-val">{{ drawer.candidatureCount || (drawer.stats?.applyCount) || 0 }}</div>
                    <div class="metric-label">Candidatures reçues</div>
                  </div>
                </div>
              </div>

              <!-- Grille d'informations clés du poste (sans cartes inutiles ou avec '-') -->
              <div class="o-info-section">
                <div class="section-subtitle">Modalités & Publication</div>
                <div class="o-info-grid">
                  <!-- Localisation -->
                  <div class="o-info-card">
                    <div class="o-info-icon" style="background:#EEF2FF;color:#4F46E5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    </div>
                    <div class="o-info-content">
                      <div class="o-info-label">Localisation</div>
                      <div class="o-info-value">{{ drawer.localisation || 'Non précisée' }}</div>
                    </div>
                  </div>

                  <!-- Rémunération -->
                  <div class="o-info-card">
                    <div class="o-info-icon" style="background:#F0FDF4;color:#16A34A">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <div class="o-info-content">
                      <div class="o-info-label">Rémunération</div>
                      <div class="o-info-value">{{ formatSalary(drawer.salaireMin, drawer.salaireMax) }}</div>
                    </div>
                  </div>

                  <!-- Date de publication -->
                  <div class="o-info-card">
                    <div class="o-info-icon" style="background:#EFF6FF;color:#3B82F6">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <div class="o-info-content">
                      <div class="o-info-label">Date de publication</div>
                      <div class="o-info-value">{{ (drawer.createdAt || drawer.datePublication) ? ((drawer.createdAt || drawer.datePublication) | date:'dd MMMM yyyy') : 'Non datée' }}</div>
                    </div>
                  </div>

                  <!-- Date d'expiration (affichée uniquement si renseignée et cohérente) -->
                  <div class="o-info-card" *ngIf="isExpirationValid(drawer)">
                    <div class="o-info-icon" style="background:#FFF1F2;color:#E11D48">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div class="o-info-content">
                      <div class="o-info-label">Date limite (expiration)</div>
                      <div class="o-info-value">{{ drawer.dateExpiration | date:'dd MMMM yyyy' }}</div>
                    </div>
                  </div>
                </div>

                <!-- Compétences requises -->
                <div class="drawer-section-block" *ngIf="getSkillsList(drawer.competencesRequises).length > 0">
                  <div class="section-subtitle">Compétences attendues</div>
                  <div class="skills-chips">
                    <span class="skill-chip" *ngFor="let s of getSkillsList(drawer.competencesRequises)">{{ s }}</span>
                  </div>
                </div>

                <!-- Description complète -->
                <div class="drawer-section-block">
                  <div class="section-subtitle">Description du poste</div>
                  <div class="offer-description-box">
                    {{ drawer.description || 'Aucune description textuelle fournie pour cette offre.' }}
                  </div>
                </div>

                <!-- Section Entreprise (affichée proprement sans champs '-' inutiles) -->
                <div class="drawer-section-block">
                  <div class="section-subtitle">Entreprise recruteuse</div>
                  <div class="company-card-block">
                    <div class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-teal-600"><path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 11h2M13 11h2M9 15h2M13 15h2"/></svg>
                      {{ drawer.companyName || 'Entreprise partenaire' }}
                    </div>

                    <p *ngIf="drawer.companyDescription" class="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      {{ drawer.companyDescription }}
                    </p>

                    <div class="flex flex-wrap gap-2 mt-3" *ngIf="hasCompanyInfo(drawer)">
                      <span *ngIf="drawer.companySector" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                        {{ drawer.companySector }}
                      </span>
                      <span *ngIf="drawer.companyAddress" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {{ drawer.companyAddress }}
                      </span>
                      <a *ngIf="drawer.companyWebsite" [href]="drawer.companyWebsite" target="_blank" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        Site web
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- ════════ ONGLET 2: MODÉRATION & HISTORIQUE ════════ -->
            <div *ngIf="activeTab() === 'moderation'" style="padding:20px 22px">

              <!-- Box d'action de modération -->
              <div class="moderation-decision-box">
                <div class="decision-head">
                  <div class="decision-title">Décision de modération</div>
                  <span class="badge" [ngClass]="statusBadgeClass(drawer.statut)">{{ statusLabel(drawer.statut) }}</span>
                </div>

                <div class="form-group" style="margin-top:14px">
                  <label class="form-label" for="modComment">Commentaire / Motif (requis pour refus ou demande de modif) :</label>
                  <textarea id="modComment" class="form-textarea" rows="3" [(ngModel)]="moderationComment"
                            placeholder="Indiquez le motif de rejet ou les corrections demandées à l'entreprise…"></textarea>
                </div>

                <!-- Actions de modération -->
                <div class="decision-actions">
                  <button class="btn-decision approve" (click)="moderate(drawer, 'APPROVE')" [disabled]="actionLoading">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" d="M20 6 9 17l-5-5"/></svg>
                    <span>Approuver & Publier</span>
                  </button>

                  <button class="btn-decision request-edit" (click)="moderate(drawer, 'REQUEST_EDIT')" [disabled]="actionLoading">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <span>Demander modifications</span>
                  </button>

                  <button class="btn-decision reject" (click)="moderate(drawer, 'REJECT')" [disabled]="actionLoading">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    <span>Rejeter l'offre</span>
                  </button>
                </div>

                <!-- Action Dépublier si Active -->
                <div style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--n-200)" *ngIf="drawer.statut === 'ACTIVE'">
                  <button class="btn-secondary" style="width:100%;color:#991B1B;border-color:#FECACA;background:#FFF1F2"
                          (click)="depublish(drawer)" [disabled]="actionLoading">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    Dépublier cette offre (retirer du catalogue)
                  </button>
                </div>
              </div>

              <!-- Dernier état de modération -->
              <div class="moderation-info-summary" *ngIf="drawer.moderatedAt || drawer.moderatorId">
                <div class="section-subtitle">Dernière décision enregistrée</div>
                <div class="last-mod-card">
                  <div><strong>Modérateur :</strong> {{ drawer.moderatorName || drawer.moderatorEmail || drawer.moderatorId || 'Admin RH' }}</div>
                  <div *ngIf="drawer.moderatorEmail"><strong>Email :</strong> {{ drawer.moderatorEmail }}</div>
                  <div><strong>Date :</strong> {{ drawer.moderatedAt | date:'dd/MM/yyyy HH:mm' }}</div>
                  <div *ngIf="drawer.moderationComment"><strong>Motif :</strong> « {{ drawer.moderationComment }} »</div>
                </div>
              </div>

              <!-- Historique complet -->
              <div class="timeline-section" style="margin-top:22px">
                <div class="section-subtitle">Journal d'audit & modération de l'offre</div>
                
                <div class="timeline-empty" *ngIf="!drawer.moderationHistory || drawer.moderationHistory.length === 0">
                  Aucun historique antérieur de modération sur cette offre.
                </div>

                <div class="timeline-list" *ngIf="drawer.moderationHistory && drawer.moderationHistory.length > 0">
                  <div class="timeline-item" *ngFor="let h of drawer.moderationHistory">
                    <div class="timeline-point" [ngClass]="historyActionClass(h.action)"></div>
                    <div class="timeline-content">
                      <div class="timeline-action-row">
                        <span class="badge" [ngClass]="historyActionClass(h.action)">{{ historyActionLabel(h.action) }}</span>
                        <span class="timeline-date">{{ h.timestamp | date:'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                      <div class="timeline-author" *ngIf="h.moderatorId">Par : {{ h.moderatorId }}</div>
                      <div class="timeline-comment" *ngIf="h.comment">« {{ h.comment }} »</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ════════ ONGLET 3: ÉDITION ADMIN ════════ -->
            <div *ngIf="activeTab() === 'edit'" style="padding:20px 22px">
              <div class="section-subtitle">Mise à jour directe de la fiche</div>
              
              <div class="form-group">
                <label class="form-label" for="editTitle">Titre de l'offre</label>
                <input id="editTitle" type="text" class="form-input" [(ngModel)]="editOfferTitle" />
              </div>

              <div class="form-group" style="margin-top:14px">
                <label class="form-label" for="editStatut">Statut d'affichage</label>
                <select id="editStatut" class="filter-select" style="width:100%" [(ngModel)]="editOfferStatus">
                  <option value="ACTIVE">ACTIVE (En ligne)</option>
                  <option value="PENDING_MODERATION">PENDING_MODERATION (En attente)</option>
                  <option value="DRAFT">DRAFT (Brouillon)</option>
                  <option value="REJECTED">REJECTED (Rejetée)</option>
                  <option value="UNPUBLISHED">UNPUBLISHED (Dépubliée)</option>
                  <option value="EXPIRED">EXPIRED (Expirée)</option>
                </select>
              </div>

              <div class="form-group" style="margin-top:14px">
                <label class="form-label" for="editMotif">Note / Motif administratif interne</label>
                <textarea id="editMotif" class="form-textarea" rows="3" [(ngModel)]="editOfferMotif"
                          placeholder="Note interne réservée aux recruteurs et administrateurs…"></textarea>
              </div>

              <div style="margin-top:20px;display:flex;gap:10px">
                <button class="btn-primary" style="flex:1" (click)="saveAdminEdit(drawer)" [disabled]="actionLoading">
                  <span *ngIf="actionLoading">Enregistrement…</span>
                  <span *ngIf="!actionLoading">Enregistrer les modifications</span>
                </button>
              </div>
            </div>

          </div>

          <!-- Footer du Drawer -->
          <div class="o-drawer-footer">
          </div>

        </aside>
    </div>
  `,
  styles: [`
    /* ── Banner alerte modération ───────────────────────────────── */
    .moderation-alert-banner {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 20px;
      background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
      border: 1.5px solid #FCD34D;
      border-radius: 14px;
      margin-bottom: 22px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(217, 119, 6, 0.08);
      transition: all .15s ease-in-out;
    }
    .moderation-alert-banner:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(217, 119, 6, 0.14);
      border-color: #F59E0B;
    }
    .moderation-alert-icon {
      width: 40px; height: 40px;
      border-radius: 10px;
      background: #F59E0B;
      color: #fff;
      display: grid; place-items: center;
      flex-shrink: 0;
    }
    .moderation-alert-body { flex: 1; }
    .moderation-alert-title { font-size: .88rem; color: #92400E; margin-bottom: 2px; }
    .moderation-alert-desc { font-size: .78rem; color: #B45309; }
    .btn-alert-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 9px;
      background: #D97706;
      color: #fff;
      font-size: .78rem;
      font-weight: 700;
      border: 0;
      cursor: pointer;
      white-space: nowrap;
      transition: background .12s;
    }
    .btn-alert-action:hover { background: #B45309; }

    /* ── Quick filter tabs ─────────────────────────────────────── */
    .quick-filter-tabs {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      margin-bottom: 18px;
      padding-bottom: 4px;
    }
    .qf-tab {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: #fff;
      border: 1.5px solid var(--n-200);
      border-radius: 999px;
      font-size: .78rem;
      font-weight: 600;
      color: var(--n-600);
      cursor: pointer;
      white-space: nowrap;
      transition: all .12s;
    }
    .qf-tab:hover { border-color: var(--signal); color: var(--signal); background: var(--signal-light); }
    .qf-tab.active { background: var(--ink); border-color: var(--ink); color: #fff; }
    .qf-tab.qf-tab-pending.active { background: #D97706; border-color: #D97706; color: #fff; }
    .qf-count {
      display: inline-grid; place-items: center;
      padding: 1px 7px;
      border-radius: 999px;
      font-size: .7rem;
      font-weight: 700;
      background: var(--n-100);
      color: var(--n-600);
    }
    .qf-tab.active .qf-count { background: rgba(255,255,255,0.22); color: #fff; }
    .pending-count { background: #FEF3C7; color: #92400E; }
    .pulse-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #F59E0B;
      animation: pulse 1.6s infinite ease-in-out;
    }
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }

    /* ── Highlight Pending KPI ─────────────────────────────────── */
    .kpi-mini.highlight-pending {
      border-color: #FCD34D;
      background: #FFFDF5;
      box-shadow: 0 0 0 1px #FCD34D, 0 4px 12px rgba(245, 158, 11, 0.12);
    }

    /* ── Table enhancements ────────────────────────────────────── */
    .company-tag {
      font-weight: 600;
      color: var(--ink);
    }
    .stats-cell {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .stat-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 7px;
      border-radius: 6px;
      background: var(--n-50);
      border: 1px solid var(--n-100);
      font-size: .72rem;
      font-weight: 600;
      color: var(--n-600);
    }
    .stat-pill.candidatures {
      background: #EEF2FF;
      border-color: #E0E7FF;
      color: #4F46E5;
    }

    /* ── Quick Action Buttons ──────────────────────────────────── */
    .btn-quick-approve {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 9px;
      border-radius: 7px;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      color: #065F46;
      font-size: .72rem;
      font-weight: 700;
      cursor: pointer;
      transition: all .12s;
    }
    .btn-quick-approve:hover:not(:disabled) { background: #10B981; color: #fff; border-color: #10B981; }

    .btn-quick-reject {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 9px;
      border-radius: 7px;
      background: #FFF1F2;
      border: 1px solid #FECACA;
      color: #9F1239;
      font-size: .72rem;
      font-weight: 700;
      cursor: pointer;
      transition: all .12s;
    }
    .btn-quick-reject:hover:not(:disabled) { background: #F43F5E; color: #fff; border-color: #F43F5E; }

    /* ── Drawer Tabs ───────────────────────────────────────────── */
    .o-tabs {
      display: flex;
      gap: 2px;
      padding: 0 22px;
      border-bottom: 1px solid var(--n-100);
      background: var(--n-50);
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
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #F59E0B;
    }

    /* ── Drawer Hero & Sections ────────────────────────────────── */
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
      border: 1.5px solid var(--n-100);
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
    .metric-val { font-size: 1.15rem; font-weight: 800; color: var(--ink); line-height: 1; }
    .metric-label { font-size: .68rem; color: var(--n-500); margin-top: 2px; }

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
      border: 1px solid var(--n-100);
      border-radius: 10px;
      background: var(--n-50);
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
      color: var(--n-400);
      margin-bottom: 2px;
    }
    .o-info-value {
      font-size: .8rem;
      font-weight: 600;
      color: var(--ink);
      word-break: break-word;
    }

    .drawer-section-block {
      margin-top: 14px;
    }
    .company-card-block {
      padding: 14px;
      border-radius: 12px;
      background: var(--n-50);
      border: 1px solid var(--n-100);
    }
    .section-subtitle {
      font-size: .72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: var(--n-500);
      margin-bottom: 8px;
    }
    .skills-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .skill-chip {
      padding: 3px 9px;
      border-radius: 999px;
      background: #EEF2FF;
      color: #4F46E5;
      font-size: .72rem;
      font-weight: 600;
      border: 1px solid #E0E7FF;
    }
    .offer-description-box {
      padding: 12px 14px;
      border-radius: 10px;
      background: var(--n-50);
      border: 1px solid var(--n-100);
      font-size: .8rem;
      line-height: 1.55;
      color: var(--n-700);
      white-space: pre-wrap;
      max-height: 220px;
      overflow-y: auto;
    }

    /* ── Décision de modération ────────────────────────────────── */
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
      flex-direction: column;
      gap: 8px;
      margin-top: 14px;
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
      background: var(--n-50);
      border: 1px solid var(--n-100);
      border-radius: 8px;
      font-size: .76rem;
      color: var(--n-600);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    /* ── Timeline ──────────────────────────────────────────────── */
    .timeline-empty {
      font-size: .76rem;
      color: var(--n-400);
      font-style: italic;
      padding: 6px 0;
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
    .timeline-item {
      position: relative;
    }
    .timeline-point {
      position: absolute;
      left: -19px;
      top: 4px;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--n-400);
      border: 2px solid #fff;
    }
    .timeline-point.badge-valide { background: #059669; }
    .timeline-point.badge-rejete { background: #E11D48; }
    .timeline-point.badge-pending { background: #D97706; }
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

    /* ── Form Inputs ───────────────────────────────────────────── */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-label {
      font-size: .74rem;
      font-weight: 700;
      color: var(--ink);
    }
    .form-input, .form-textarea {
      padding: 9px 12px;
      border: 1.5px solid var(--n-200);
      border-radius: 8px;
      font-size: .8rem;
      color: var(--ink);
      background: #fff;
      font-family: inherit;
    }
    .form-input:focus, .form-textarea:focus {
      outline: 0;
      border-color: #4F46E5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    /* ── Footer Drawer ─────────────────────────────────────────── */
    .o-drawer-footer {
      padding: 14px 22px 18px;
      border-top: 1px solid var(--n-100);
      background: #fff;
    }

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

    /* ── Avatar colors ─────────────────────────────────────────── */
    .avatar-active { background: linear-gradient(135deg, #059669, #10B981); }
    .avatar-pending { background: linear-gradient(135deg, #D97706, #F59E0B); }
    .avatar-rejected { background: linear-gradient(135deg, #E11D48, #FB7185); }
    .avatar-draft { background: linear-gradient(135deg, #64748B, #94A3B8); }
    .avatar-other { background: linear-gradient(135deg, #475569, #64748B); }

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
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `]
})
export class OffersComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  readonly permissions = inject(PermissionsService);

  offers: AdminOffer[] = [];
  filtered: AdminOffer[] = [];
  page: AdminOffer[] = [];

  stats = {
    total: 0,
    pending: 0,
    active: 0,
    rejected: 0,
    draft: 0,
    expired: 0,
    unpublished: 0
  };

  loading = true;
  actionLoading = false;

  // Filtres
  search = '';
  quickFilter: QuickStatusFilter = 'ALL';
  statusFilter = 'ALL';
  contractFilter = 'ALL';
  sortBy = 'recent';

  // Pagination
  currentPage = 1;
  pageSize = PAGE_SIZE;
  totalPages = 1;

  // Drawer
  drawer: AdminOffer | null = null;
  activeTab = signal<DrawerTab>('details');
  moderationComment = '';
  drawerMsg = '';
  drawerOk = '';

  // Édition Admin
  editOfferTitle = '';
  editOfferStatus = 'ACTIVE';
  editOfferMotif = '';

  readonly Math = Math;

  trackByOfferId(index: number, offer: AdminOffer): string {
    return offer.id;
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.drawer) this.closeDrawer();
  }

  loadAllData(): void {
    this.loading = true;
    this.api.getOfferStats().subscribe({
      next: (s) => {
        this.stats = {
          total: s.total || 0,
          pending: s.pending || 0,
          active: s.active || 0,
          rejected: s.rejected || 0,
          draft: s.draft || 0,
          expired: s.expired || 0,
          unpublished: s.unpublished || 0
        };
      },
      error: () => { }
    });

    this.api.getOffers().subscribe({
      next: (res) => {
        this.offers = res || [];
        this.loading = false;
        this.applyFilters();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  setQuickFilter(qf: QuickStatusFilter): void {
    this.quickFilter = qf;
    if (qf === 'ALL') {
      this.statusFilter = 'ALL';
    } else if (qf === 'OTHER') {
      this.statusFilter = 'ALL'; // Custom handled in applyFilters
    } else {
      this.statusFilter = qf;
    }
    this.currentPage = 1;
    this.applyFilters();
  }

  onSelectFilterChange(): void {
    if (this.statusFilter === 'ALL') {
      this.quickFilter = 'ALL';
    } else if (this.statusFilter === 'PENDING_MODERATION' || this.statusFilter === 'ACTIVE' || this.statusFilter === 'DRAFT' || this.statusFilter === 'REJECTED') {
      this.quickFilter = this.statusFilter as QuickStatusFilter;
    } else {
      this.quickFilter = 'OTHER';
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
    this.contractFilter = 'ALL';
    this.sortBy = 'recent';
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    const q = this.search.trim().toLowerCase();

    let list = this.offers.filter((o) => {
      const matchSearch =
        !q ||
        (o.title && o.title.toLowerCase().includes(q)) ||
        (o.localisation && o.localisation.toLowerCase().includes(q)) ||
        (o.companyName && o.companyName.toLowerCase().includes(q)) ||
        (o.id && o.id.toLowerCase().includes(q));

      const matchContract = this.contractFilter === 'ALL' || o.typeContrat === this.contractFilter;

      let matchStatus = true;
      if (this.quickFilter === 'ALL') {
        matchStatus = this.statusFilter === 'ALL' || o.statut === this.statusFilter;
      } else if (this.quickFilter === 'OTHER') {
        matchStatus = o.statut === 'EXPIRED' || o.statut === 'UNPUBLISHED' || o.statut === 'CLOSED';
      } else {
        matchStatus = o.statut === this.quickFilter;
      }

      return matchSearch && matchContract && matchStatus;
    });

    // Tri
    if (this.sortBy === 'recent') {
      list = list.sort((a, b) => {
        const da = a.createdAt || a.datePublication || '';
        const db = b.createdAt || b.datePublication || '';
        return db.localeCompare(da);
      });
    } else if (this.sortBy === 'title') {
      list = list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (this.sortBy === 'candidates') {
      list = list.sort((a, b) => (b.candidatureCount || 0) - (a.candidatureCount || 0));
    } else if (this.sortBy === 'views') {
      list = list.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
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
    const delta = 2;
    const start = Math.max(1, this.currentPage - delta);
    const end = Math.min(this.totalPages, this.currentPage + delta);
    const r: number[] = [];
    for (let i = start; i <= end; i++) r.push(i);
    return r;
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  openDrawer(o: AdminOffer, tab: DrawerTab = 'details'): void {
    this.drawer = { ...o };
    this.activeTab.set(tab);
    this.moderationComment = '';
    this.drawerMsg = '';
    this.drawerOk = '';
    this.editOfferTitle = o.title;
    this.editOfferStatus = o.statut;
    this.editOfferMotif = o.moderationNote || '';

    if (o.id) {
      this.api.getOffer(o.id).subscribe({
        next: (full) => {
          if (this.drawer && this.drawer.id === o.id) {
            this.drawer = { ...this.drawer, ...full };
          }
        },
        error: () => { }
      });
    }
  }

  closeDrawer(): void {
    this.drawer = null;
  }

  // ── Actions de modération ────────────────────────────────────

  quickModerate(o: AdminOffer, action: 'APPROVE' | 'REJECT'): void {
    if (action === 'REJECT') {
      this.openDrawer(o, 'moderation');
      return;
    }
    this.actionLoading = true;
    this.api.moderateOffer(o.id, 'APPROVE', 'Validation rapide depuis la liste').subscribe({
      next: (updated) => {
        this.actionLoading = false;
        this.updateOfferLocally(updated);
        this.loadAllData();
      },
      error: (err) => {
        this.actionLoading = false;
        alert(err.error?.message || 'Erreur lors de la validation.');
      }
    });
  }

  moderate(o: AdminOffer, action: 'APPROVE' | 'REJECT' | 'REQUEST_EDIT'): void {
    if ((action === 'REJECT' || action === 'REQUEST_EDIT') && !this.moderationComment.trim()) {
      this.drawerMsg = 'Un commentaire explicatif est requis pour un rejet ou une demande de modification.';
      return;
    }

    this.actionLoading = true;
    this.drawerMsg = '';
    this.drawerOk = '';

    this.api.moderateOffer(o.id, action, this.moderationComment.trim()).subscribe({
      next: (updated) => {
        this.actionLoading = false;
        this.drawer = { ...this.drawer, ...updated };
        this.drawerOk =
          action === 'APPROVE'
            ? 'Offre approuvée et publiée avec succès !'
            : action === 'REQUEST_EDIT'
              ? 'Demande de modification envoyée à l\'entreprise.'
              : 'Offre rejetée.';
        this.updateOfferLocally(updated);
        this.loadAllData();
      },
      error: (err) => {
        this.actionLoading = false;
        this.drawerMsg = err.error?.message || 'Erreur lors du traitement de la modération.';
      }
    });
  }

  depublish(o: AdminOffer): void {
    this.actionLoading = true;
    this.drawerMsg = '';
    this.drawerOk = '';

    this.api.updateOfferAdmin(o.id, { statut: 'UNPUBLISHED' }).subscribe({
      next: (updated) => {
        this.actionLoading = false;
        this.drawer = { ...this.drawer, ...updated };
        this.drawerOk = 'Offre retirée de la publication (UNPUBLISHED).';
        this.updateOfferLocally(updated);
        this.loadAllData();
      },
      error: (err) => {
        this.actionLoading = false;
        this.drawerMsg = err.error?.message || 'Erreur lors de la dépublication.';
      }
    });
  }

  saveAdminEdit(o: AdminOffer): void {
    this.actionLoading = true;
    this.drawerMsg = '';
    this.drawerOk = '';

    this.api.updateOfferAdmin(o.id, {
      title: this.editOfferTitle.trim(),
      statut: this.editOfferStatus,
      moderationMotif: this.editOfferMotif.trim()
    }).subscribe({
      next: (updated) => {
        this.actionLoading = false;
        this.drawer = { ...this.drawer, ...updated };
        this.drawerOk = 'Modifications enregistrées avec succès.';
        this.updateOfferLocally(updated);
        this.loadAllData();
      },
      error: (err) => {
        this.actionLoading = false;
        this.drawerMsg = err.error?.message || 'Erreur lors de la mise à jour.';
      }
    });
  }

  private updateOfferLocally(updated: AdminOffer): void {
    const idx = this.offers.findIndex((x) => x.id === updated.id);
    if (idx !== -1) {
      this.offers[idx] = { ...this.offers[idx], ...updated };
      this.applyFilters();
    }
  }

  // ── Helpers UI & Labels ──────────────────────────────────────

  statusLabel(statut: string): string {
    switch (statut) {
      case 'ACTIVE':
        return 'Active';
      case 'PENDING_MODERATION':
        return 'En attente modération';
      case 'DRAFT':
        return 'Brouillon';
      case 'REJECTED':
        return 'Rejetée';
      case 'EXPIRED':
        return 'Expirée';
      case 'UNPUBLISHED':
      case 'CLOSED':
        return 'Clôturée / Dépubliée';
      default:
        return statut || 'Inconnu';
    }
  }

  statusBadgeClass(statut: string): string {
    switch (statut) {
      case 'ACTIVE':
        return 'badge-active';
      case 'PENDING_MODERATION':
        return 'badge-pending';
      case 'REJECTED':
        return 'badge-rejete';
      case 'DRAFT':
        return 'badge-verified';
      default:
        return 'badge-inactive';
    }
  }

  statusTextClass(statut: string): string {
    switch (statut) {
      case 'ACTIVE':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'PENDING_MODERATION':
        return 'text-amber-600 dark:text-amber-400';
      case 'REJECTED':
        return 'text-rose-600 dark:text-rose-400';
      case 'DRAFT':
        return 'text-slate-500 dark:text-slate-400';
      case 'EXPIRED':
        return 'text-slate-400 dark:text-slate-500';
      case 'UNPUBLISHED':
      case 'CLOSED':
        return 'text-slate-500 dark:text-slate-400';
      default:
        return 'text-slate-500 dark:text-slate-400';
    }
  }

  offerAvatarClass(statut: string): string {
    switch (statut) {
      case 'ACTIVE':
        return 'avatar-active';
      case 'PENDING_MODERATION':
        return 'avatar-pending';
      case 'REJECTED':
        return 'avatar-rejected';
      case 'DRAFT':
        return 'avatar-draft';
      default:
        return 'avatar-other';
    }
  }

  historyActionLabel(action: string): string {
    switch (action) {
      case 'APPROVE':
        return 'Validation / Approbation';
      case 'REJECT':
        return 'Rejet de l\'offre';
      case 'REQUEST_EDIT':
        return 'Demande de modification';
      case 'CREATE':
        return 'Création de l\'offre';
      case 'UPDATE':
        return 'Mise à jour';
      default:
        return action;
    }
  }

  historyActionClass(action: string): string {
    switch (action) {
      case 'APPROVE':
        return 'badge-valide';
      case 'REJECT':
        return 'badge-rejete';
      case 'REQUEST_EDIT':
        return 'badge-pending';
      default:
        return 'badge-verified';
    }
  }

  formatSalary(min?: number, max?: number): string {
    if (min && max) return `${min.toLocaleString('fr-FR')} – ${max.toLocaleString('fr-FR')} DT`;
    if (min) return `À partir de ${min.toLocaleString('fr-FR')} DT`;
    if (max) return `Jusqu'à ${max.toLocaleString('fr-FR')} DT`;
    return 'Non communiquée';
  }

  getSkillsList(competences: any): string[] {
    if (!competences) return [];
    if (Array.isArray(competences)) {
      return competences
        .flatMap((c: any) => typeof c === 'string' ? c.split(',') : [])
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
    }
    if (typeof competences === 'string') {
      return competences
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
    }
    return [];
  }

  hasCompanyInfo(d: AdminOffer | null): boolean {
    if (!d) return false;
    return !!(d.companySector || d.companyAddress || d.companyWebsite || d.companyDescription);
  }

  isExpirationValid(d: AdminOffer | null): boolean {
    if (!d || !d.dateExpiration) return false;
    const pub = d.datePublication || d.createdAt;
    if (pub) {
      const expTime = new Date(d.dateExpiration).getTime();
      const pubTime = new Date(pub).getTime();
      return expTime >= pubTime;
    }
    return true;
  }
}
