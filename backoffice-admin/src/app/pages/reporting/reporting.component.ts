import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminApiService, DashboardStats, TrendPoint } from '../../core/admin-api.service';

@Component({
  selector: 'app-reporting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      <!-- Header -->
      <div class="px-1 py-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div class="flex items-start">
            <div class="flex-1">
              <h1 class="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Reporting</h1>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-1.5">Volumes, conversion, tendances et filtres croisés de la plateforme RhConnect</p>
            </div>
          </div>
          <div class="flex gap-2.5">
            <button (click)="loadData()" [disabled]="loading" class="px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#0F766E] dark:bg-cyan-600 hover:bg-[#0d5d57] dark:hover:bg-cyan-700 transition-colors flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [class.animate-spin]="loading"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 6v6m0 0v0"/><path stroke-linecap="round" d="M12 12h6m0 0v0"/></svg>
              {{ loading ? 'Actualisation…' : 'Actualiser' }}
            </button>
            <button (click)="exportCsv()" [disabled]="loading" class="px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#0F766E] dark:bg-cyan-600 hover:bg-[#0d5d57] dark:hover:bg-cyan-700 transition-colors flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/></svg>
              Exporter CSV
            </button>
          </div>
        </div>
      </div>

      <!-- Maintenance banner -->
      <div *ngIf="maintenanceMode" class="flex items-center gap-3 px-4 py-3 rounded-lg border bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
        <div><strong class="font-semibold">Mode maintenance actif</strong> — La plateforme est actuellement inaccessible aux utilisateurs.</div>
      </div>

      <!-- Error alert -->
      <div *ngIf="error" class="flex items-center gap-3 px-4 py-3 rounded-lg border bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 8v4M12 16h.01"/></svg>
        <div class="font-semibold">Données de reporting non disponibles. Vérifiez la connexion au backend.</div>
      </div>

      <!-- Loading state -->
      <div *ngIf="loading" class="flex flex-col items-center justify-center py-16">
        <div class="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-[#0F766E] dark:border-t-cyan-500 animate-spin mb-4"></div>
        <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement des données…</p>
      </div>

      <ng-container *ngIf="!loading && !error">
        <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl p-6">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-teal-100 dark:bg-cyan-500/20 flex items-center justify-center text-[#0F766E] dark:text-cyan-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46"/>
                </svg>
              </div>
              <div>
                <h2 class="font-bold text-slate-900 dark:text-white">Filtres croisés multidimensionnels</h2>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Combinez les critères temporels, contractuels et de statut pour une analyse ciblée.</p>
              </div>
            </div>
         
          </div>

          <!-- Filter grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-6 mb-6">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Date début</label>
              <input type="date" [(ngModel)]="filterStart" (ngModelChange)="applyCrossFilter()" class="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 dark:focus:ring-cyan-500/20 focus:border-[#0F766E] dark:focus:border-cyan-500"/>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Date fin</label>
              <input type="date" [(ngModel)]="filterEnd" (ngModelChange)="applyCrossFilter()" class="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 dark:focus:ring-cyan-500/20 focus:border-[#0F766E] dark:focus:border-cyan-500"/>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Type de contrat</label>
              <select [(ngModel)]="filterContractType" (ngModelChange)="applyCrossFilter()" class="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 dark:focus:ring-cyan-500/20 focus:border-[#0F766E] dark:focus:border-cyan-500">
                <option value="">Tous les contrats</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="STAGE">Stage</option>
                <option value="FREELANCE">Freelance</option>
                <option value="ALTERNANCE">Alternance</option>
              </select>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Statut candidature</label>
              <select [(ngModel)]="filterStatus" (ngModelChange)="applyCrossFilter()" class="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 dark:focus:ring-cyan-500/20 focus:border-[#0F766E] dark:focus:border-cyan-500">
                <option value="">Tous les statuts</option>
                <option value="POSTULE">Postulé</option>
                <option value="EN_VERIFICATION">En vérification</option>
                <option value="TRANSMIS">Transmis</option>
                <option value="ENTRETIEN">Entretien</option>
                <option value="ACCEPTE">Accepté</option>
                <option value="REFUSE">Refusé</option>
              </select>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">&nbsp;</label>
              <button (click)="clearFilters()" [disabled]="!hasActiveFilters()" class="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 font-semibold text-sm hover:border-[#0F766E] dark:hover:border-cyan-600/40 hover:text-[#0F766E] dark:hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path stroke-linecap="round" d="M3 3v5h5"/></svg>
                <span class="hidden sm:inline">Réinitialiser</span>
              </button>
            </div>
          </div>

          <!-- Cross-filter results -->
          <div *ngIf="crossStats" class="pt-6 border-t border-slate-200 dark:border-white/10">
            <div class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-4">Métriques de la sélection filtrée :</div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
                <div class="text-lg font-bold text-[#0F766E] dark:text-cyan-400 font-display">{{ crossStats['totalCandidatures'] }}</div>
                <div class="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">Candidatures</div>
              </div>
              <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 hover:border-emerald-600/40 dark:hover:border-emerald-500/40 transition-colors">
                <div class="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-display">{{ crossStats['acceptees'] }}</div>
                <div class="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">Acceptées</div>
              </div>
              <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 hover:border-rose-600/40 dark:hover:border-rose-500/40 transition-colors">
                <div class="text-lg font-bold text-rose-600 dark:text-rose-400 font-display">{{ crossStats['refusees'] }}</div>
                <div class="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">Refusées</div>
              </div>
              <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
                <div class="text-lg font-bold text-[#0F766E] dark:text-cyan-400 font-display">{{ asNumber(crossStats['tauxAcceptation']) | number:'1.0-1' }}%</div>
                <div class="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">Taux acceptation</div>
              </div>
              <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
                <div class="text-lg font-bold text-[#0F766E] dark:text-cyan-400 font-display">{{ asNumber(crossStats['delaiMoyenRecrutementJours']) | number:'1.0-1' }}j</div>
                <div class="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">Délai moyen</div>
              </div>
            </div>
          </div>
        </div>

        <!-- KPI strip -->
        <div class="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-8 h-8 rounded-lg bg-teal-100 dark:bg-cyan-500/20 text-[#0F766E] dark:text-cyan-400 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-1a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v1"/><path d="M16 3.13a4 4 0 0 1 0 7.75M22 21v-1a6 6 0 0 0-4.47-5.79"/></svg>
              </div>
              <div class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Utilisateurs</div>
            </div>
            <div class="font-display font-bold text-lg text-slate-900 dark:text-white">{{ stats?.users ?? '—' }}</div>
          </div>

          <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              </div>
              <div class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Offres</div>
            </div>
            <div class="font-display font-bold text-lg text-slate-900 dark:text-white">{{ stats?.offers ?? '—' }}</div>
          </div>

          <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
              </div>
              <div class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Candidatures</div>
            </div>
            <div class="font-display font-bold text-lg text-slate-900 dark:text-white">{{ stats?.applications ?? '—' }}</div>
          </div>

          <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-8 h-8 rounded-lg bg-teal-100 dark:bg-cyan-500/20 text-[#0F766E] dark:text-cyan-400 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/></svg>
              </div>
              <div class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Conversion</div>
            </div>
            <div class="font-display font-bold text-lg text-slate-900 dark:text-white">{{ (stats?.tauxConversion ?? 0) | number:'1.0-1' }}%</div>
          </div>

          <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Vérifications</div>
            </div>
            <div class="font-display font-bold text-lg text-slate-900 dark:text-white">{{ stats?.verificationsCount ?? '—' }}</div>
          </div>

          <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Délai moyen</div>
            </div>
            <div class="font-display font-bold text-lg text-slate-900 dark:text-white">{{ stats?.delaiMoyenRecrutementJours !== null && stats?.delaiMoyenRecrutementJours !== undefined ? ((stats?.delaiMoyenRecrutementJours ?? 0) | number:'1.0-1') + 'j' : '—' }}</div>
          </div>
        </div>

        <!-- Charts grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- Inscriptions chart -->
          <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-lg p-6">
            <div class="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-white/10 mb-6">
              <div class="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
              </div>
              <h3 class="font-semibold text-slate-900 dark:text-white flex-1">Inscriptions par mois (12 derniers mois)</h3>
              <span class="text-sm font-semibold text-slate-600 dark:text-slate-400">{{ signupTotal }} total</span>
            </div>
            <div *ngIf="signups.length > 0" class="flex items-end gap-1 h-40 px-2 py-4 border-b border-slate-200 dark:border-white/10">
              <div class="flex-1 flex flex-col items-center gap-2" *ngFor="let pt of signups">
                <div class="w-full flex items-end justify-center h-32">
                  <div class="w-full max-w-[20px] rounded-t bg-gradient-to-t from-[#0F766E] to-cyan-400 dark:from-cyan-500 dark:to-cyan-400 transition-all hover:opacity-90" [style.height.%]="barHeight(pt.count, signupMax)" [title]="(pt.month || '') + ' : ' + pt.count">
                    <span class="text-[10px] font-bold text-white flex items-end justify-center h-full pb-1">{{ pt.count > 0 ? pt.count : '' }}</span>
                  </div>
                </div>
                <span class="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{{ pt.month?.slice(5) }}</span>
              </div>
            </div>
            <p *ngIf="signups.length === 0" class="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">Aucune donnée disponible.</p>
          </div>

          <!-- Role distribution -->
          <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-lg p-6">
            <div class="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-white/10 mb-6">
              <div class="w-8 h-8 rounded-lg bg-teal-100 dark:bg-cyan-500/20 text-[#0F766E] dark:text-cyan-400 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-1a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v1"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 class="font-semibold text-slate-900 dark:text-white">Répartition des rôles</h3>
            </div>
            <div *ngIf="roles.length > 0" class="space-y-3">
              <div class="flex items-center gap-3" *ngFor="let r of roles">
                <span class="text-sm font-semibold text-slate-700 dark:text-slate-300 min-w-[80px]">{{ r.role }}</span>
                <div class="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all" [ngClass]="roleFillClass(r.role)" [style.width.%]="roleWidth(r.count)"></div>
                </div>
                <strong class="text-sm font-semibold text-slate-900 dark:text-white min-w-[35px] text-right">{{ r.count }}</strong>
              </div>
            </div>
            <p *ngIf="roles.length === 0" class="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">Aucune donnée disponible.</p>
          </div>
        </div>

        <!-- Funnel and Top Offers -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Funnel -->
          <div class="lg:col-span-2 bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-lg p-6">
            <div class="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-white/10 mb-6">
              <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/></svg>
              </div>
              <h3 class="font-semibold text-slate-900 dark:text-white">Funnel de conversion</h3>
            </div>
            <div class="flex items-center justify-between gap-2 flex-wrap mb-6">
              <div class="flex items-center gap-2 flex-wrap flex-1">
                <div *ngFor="let s of funnelSteps; let last = last" class="flex items-center gap-2">
                  <div class="px-4 py-3 rounded-lg text-center min-w-24 font-semibold text-white text-sm" [style.background]="s.bg" [style.color]="s.color">
                    <div class="font-bold text-lg">{{ s.value }}</div>
                    <div class="text-xs opacity-90">{{ s.label }}</div>
                  </div>
                  <div *ngIf="!last" class="flex flex-col items-center text-slate-600 dark:text-slate-400 text-xs font-semibold">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M9 18l6-6-6-6"/></svg>
                    <span>{{ s.rate }}</span>
                  </div>
                </div>
              </div>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Un taux de conversion &gt; 15% est considéré excellent pour une plateforme RH. Délai moyen : <strong class="font-semibold text-slate-900 dark:text-white">{{ (stats?.delaiMoyenRecrutementJours ?? 0) | number:'1.0-1' }} jours</strong>.
            </p>
          </div>

          <!-- Top Offers -->
          <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-lg p-6">
            <div class="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-white/10 mb-6">
              <div class="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
              </div>
              <h3 class="font-semibold text-slate-900 dark:text-white">Top 5 offres</h3>
            </div>
            <div *ngIf="stats?.topOffers?.length; else noTopOffers" class="space-y-2">
              <div class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/10 hover:border-[#0F766E] dark:hover:border-cyan-600 transition-colors" *ngFor="let off of stats!.topOffers; let i = index">
                <span class="text-xs font-bold min-w-6 text-center" [ngClass]="i === 0 ? 'text-amber-600 dark:text-amber-400' : i === 1 ? 'text-gray-500 dark:text-gray-400' : i === 2 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'">#{{ i+1 }}</span>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-xs text-slate-900 dark:text-white truncate">{{ off.titre }}</div>
                  <div class="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">{{ off.typeContrat || '—' }}</div>
                </div>
                <span class="text-xs font-bold px-2 py-1 rounded bg-teal-100 dark:bg-cyan-500/20 text-[#0F766E] dark:text-cyan-400 whitespace-nowrap">{{ off.candidatureCount }}</span>
              </div>
            </div>
            <ng-template #noTopOffers>
              <p class="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">Aucune donnée disponible.</p>
            </ng-template>
          </div>
        </div>

        <!-- Status distribution -->
        <div *ngIf="stats?.candidaturesParStatut" class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-lg p-6">
          <div class="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-white/10 mb-6">
            <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
            </div>
            <h3 class="font-semibold text-slate-900 dark:text-white flex-1">Distribution des candidatures par statut</h3>
            <span class="text-sm font-semibold text-slate-600 dark:text-slate-400">{{ stats?.applications ?? 0 }} total</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div class="p-3 rounded-lg border border-slate-200 dark:border-white/10 hover:border-[#0F766E] dark:hover:border-cyan-600 transition-colors" *ngFor="let entry of statusEntries()">
              <div class="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">{{ entry.key }}</div>
              <div class="text-lg font-bold text-slate-900 dark:text-white mt-1">{{ entry.value }}</div>
              <div class="text-xs text-slate-600 dark:text-slate-400 mt-1">{{ statusPct(entry.value) | number:'1.0-1' }}%</div>
            </div>
          </div>
        </div>

      </ng-container>
    </div>
  `,
  styles: []
})
export class ReportingComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  stats: DashboardStats | null = null;
  signups: TrendPoint[] = [];
  roles: Array<{ role: string; count: number }> = [];
  loading = true;
  error = false;
  signupTotal = 0;
  maintenanceMode = false;
  crossStats: Record<string, unknown> | null = null;

  filterStart = '';
  filterEnd = '';
  filterContractType = '';
  filterStatus = '';

  funnelSteps: Array<{ label: string; value: string | number; bg: string; color: string; rate: string }> = [];

  ngOnInit(): void {
    forkJoin({
      stats: this.api.getDashboardStats(),
      signups: this.api.getSignupsByMonth(12),
      roles: this.api.getRolesDistribution(),
    }).subscribe({
      next: ({ stats, signups, roles }) => {
        this.stats = stats;
        this.signups = signups;
        this.roles = roles;
        this.signupTotal = signups.reduce((s, t) => s + t.count, 0);
        this.buildFunnel(stats);
        this.loading = false;
      },
      error: () => { this.error = true; this.loading = false; }
    });

    this.api.getSystemSettings().subscribe({
      next: (s) => { this.maintenanceMode = s.maintenanceMode; },
      error: () => { }
    });
  }

  applyCrossFilter(): void {
    const params: Record<string, string> = {};
    if (this.filterStart) params['startDate'] = this.filterStart;
    if (this.filterEnd) params['endDate'] = this.filterEnd;
    if (this.filterContractType) params['contractType'] = this.filterContractType;
    if (this.filterStatus) params['status'] = this.filterStatus;
    if (Object.keys(params).length === 0) { this.crossStats = null; return; }

    this.api.getCrossFilteredStats(params).subscribe({
      next: (r) => this.crossStats = r,
      error: () => { }
    });
  }

  clearFilters(): void {
    this.filterStart = '';
    this.filterEnd = '';
    this.filterContractType = '';
    this.filterStatus = '';
    this.crossStats = null;
  }

  hasActiveFilters(): boolean {
    return Boolean(this.filterStart || this.filterEnd || this.filterContractType || this.filterStatus);
  }

  private buildFunnel(s: DashboardStats): void {
    const total = s.applications || 1;
    const accepted = s.candidaturesParStatut?.['ACCEPTE'] ?? 0;
    const interview = s.candidaturesParStatut?.['ENTRETIEN'] ?? 0;
    const convRate = ((accepted / total) * 100).toFixed(1) + '%';
    const intRate = ((interview / total) * 100).toFixed(1) + '%';
    this.funnelSteps = [
      { label: 'Inscriptions', value: s.users, bg: '#E6F7F5', color: '#0F766E', rate: '' },
      { label: 'Candidatures', value: s.applications, bg: '#E6F7F5', color: '#0F766E', rate: intRate },
      { label: 'Entretiens', value: interview, bg: '#E6F7F5', color: '#0F766E', rate: convRate },
      { label: 'Embauches', value: accepted, bg: '#E6F7F5', color: '#0F766E', rate: '' },
    ];
  }

  get signupMax(): number { return Math.max(1, ...this.signups.map(s => s.count)); }
  barHeight(v: number, max: number): number { return Math.max(3, Math.round((v / max) * 100)); }
  roleWidth(v: number): number { const max = Math.max(1, ...this.roles.map(r => r.count)); return Math.max(3, Math.round((v / max) * 100)); }

  roleFillClass(role: string): string {
    const m: Record<string, string> = { ADMIN: 'bg-gradient-to-r from-teal-500 to-cyan-600', RECRUITER: 'bg-gradient-to-r from-cyan-500 to-emerald-500', CANDIDATE: 'bg-gradient-to-r from-slate-600 to-teal-500', COMPANY: 'bg-gradient-to-r from-emerald-500 to-emerald-600' };
    return m[role] || 'bg-gradient-to-r from-teal-500 to-cyan-600';
  }

  statusEntries(): Array<{ key: string; value: number }> {
    if (!this.stats?.candidaturesParStatut) return [];
    return Object.entries(this.stats.candidaturesParStatut)
      .map(([key, value]) => ({ key, value: value as number }))
      .filter(e => e.value > 0)
      .sort((a, b) => b.value - a.value);
  }

  asNumber(val: unknown): number {
    return typeof val === 'number' ? val : (Number(val) || 0);
  }

  statusPct(v: number): number {
    const total = this.stats?.applications || 1;
    return (v / total) * 100;
  }

  exportCsv(): void {
    const rows = [
      ['Indicateur', 'Valeur'],
      ['Utilisateurs', String(this.stats?.users ?? '')],
      ['Candidats', String(this.stats?.candidates ?? '')],
      ['Entreprises', String(this.stats?.companies ?? '')],
      ['Offres', String(this.stats?.offers ?? '')],
      ['Candidatures', String(this.stats?.applications ?? '')],
      ['Taux de conversion (%)', String((this.stats?.tauxConversion ?? 0).toFixed(2))],
      ['Taux d\'acceptation (%)', String((this.stats?.tauxAcceptation ?? 0).toFixed(2))],
      ['Délai moyen recrutement (jours)', String((this.stats?.delaiMoyenRecrutementJours ?? 0).toFixed(1))],
      ['Vérifications totales', String(this.stats?.verificationsCount ?? '')],
      ['Vérifications en attente', String(this.stats?.verificationsPending ?? '')],
      ['Inscriptions 12 mois', String(this.signupTotal)],
      ...this.roles.map(r => [`Rôle: ${r.role}`, String(r.count)]),
    ];
    if (this.stats?.topOffers) {
      this.stats.topOffers.forEach((o, i) => rows.push([`Top ${i + 1}: ${o.titre}`, `${o.candidatureCount} candidatures`]));
    }
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `rhconnect-reporting-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      stats: this.api.getDashboardStats(),
      signups: this.api.getSignupsByMonth(12),
      roles: this.api.getRolesDistribution(),
    }).subscribe({
      next: ({ stats, signups, roles }) => {
        this.stats = stats;
        this.signups = signups;
        this.roles = roles;
        this.signupTotal = signups.reduce((s, t) => s + t.count, 0);
        this.buildFunnel(stats);
        this.loading = false;
      },
      error: () => { this.error = true; this.loading = false; }
    });
  }
}
