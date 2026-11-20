import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, computed, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminApiService, DashboardStats, TrendPoint, AdminVerification } from '../../core/admin-api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto py-5 space-y-5 px-4 sm:px-6 lg:px-8">

      <!-- ═══ HEADER SECTION ═══ -->
      <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-2xs">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <!-- Left: Avatar + Info -->
          <div class="flex items-start gap-4">
            <!-- Avatar -->
            <div class="relative flex-shrink-0">
              <div class="w-14 h-14 bg-[#172A3A] dark:bg-[#172A3A] rounded-2xl border border-[#243E54] flex items-center justify-center shadow-xs font-display font-extrabold text-xl text-amber-500 dark:text-amber-400">
                {{ avatarLetter() }}
              </div>
              <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-600 dark:bg-emerald-500 text-white border-2 border-white rounded-full flex items-center justify-center shadow-xs text-[10px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            </div>

            <!-- Profile Info -->
            <div class="flex-1">
              <h1 class="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Tableau de bord Administrateur
              </h1>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
                Vue d'ensemble en temps réel · {{ today | date:'dd MMMM yyyy' }}
              </p>
            </div>
          </div>

        
        </div>

        <!-- Completion Progress (Admin system health) -->
        <div class="mt-5 pt-5 border-t border-[#F1F5F9] dark:border-white/10">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Santé du système</span>
            <span class="text-xs font-extrabold text-[#059669]">{{ systemHealth || 100 }}%</span>
          </div>
          <div class="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-[#059669] to-[#34D399] rounded-full transition-all duration-700" [style.width.%]="systemHealth || 100"></div>
          </div>
        </div>
      </div>

      <!-- ═══ KPI GRID ═══ -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <!-- Total Users -->
        <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-2xs hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Utilisateurs</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-[#0F766E] dark:text-cyan-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{{ stats?.users ?? '—' }}</div>
          <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Inscrits</div>
        </div>

        <!-- Total Offers -->
        <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-2xs hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Offres</span>
            <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{{ stats?.offers ?? '—' }}</div>
          <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Publiées</div>
        </div>

        <!-- Total Applications -->
        <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-2xs hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Candidatures</span>
            <div class="w-8 h-8 rounded-lg bg-[#EEF2FF] dark:bg-indigo-500/20 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight text-[#4F46E5]">{{ stats?.applications ?? '—' }}</div>
          <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Totales</div>
        </div>

        <!-- Conversion Rate -->
        <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-2xs hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Taux acceptation</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-[#059669] dark:text-emerald-400 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            </div>
          </div>
          <div class="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight text-[#059669]">{{ (stats?.tauxAcceptation ?? 0) | number:'1.0-0' }}%</div>
          <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Acceptées</div>
        </div>
      </div>

      <!-- ═══ ALERTS & WARNINGS ═══ -->
      <div *ngIf="error || pendingCount > 0" class="space-y-2">
        <!-- Error Alert -->
        <div *ngIf="error" class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:opacity-90 transition-opacity">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12" stroke-linecap="round"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>
          <span class="text-xs font-semibold">Impossible de charger les données du backend.</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ml-auto flex-shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        <!-- Pending Verifications Alert -->
        <div *ngIf="pendingCount > 0" class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 hover:opacity-90 transition-opacity cursor-pointer group"
             (click)="scrollToPendingQueue()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="flex-shrink-0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span class="text-xs font-semibold flex-1">{{ pendingCount }} dossier(s) en attente de traitement</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ml-auto flex-shrink-0 group-hover:translate-x-1 transition-transform"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>

      <!-- ═══ MAIN CONTENT GRID ═══ -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">

        <!-- LEFT COLUMN -->
        <div class="lg:col-span-7 space-y-5">

          <!-- Applications Trend Chart - ULTRA SIMPLE -->
          <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-2xs">
            <div class="flex justify-between items-start mb-6">
              <div>
                <h3 class="font-display text-base font-bold text-slate-900 dark:text-white">Rythme des candidatures</h3>
                <p class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Total: {{ applicationsTotal }} candidatures (30 jours)</p>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[#0F766E]">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
              </svg>
            </div>

            <!-- Chart Bars -->
            <div class="flex items-end gap-1 h-40 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
              <ng-container *ngFor="let pt of applicationsTrend">
                <div class="flex-1 flex flex-col items-center">
                  <!-- Bar -->
                  <div [style.height.px]="barHeight(pt.count) * 1.5"
                       [ngClass]="pt.count === 0 ? 'bg-slate-300 dark:bg-slate-600' : 'bg-[#0F766E] dark:bg-cyan-500'"
                       class="w-full min-h-1 rounded-t hover:opacity-70 transition-opacity"
                       [title]="pt.date + ': ' + pt.count + ' cand.'">
                  </div>
                </div>
              </ng-container>
            </div>

            <!-- Legend -->
            <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-6 text-xs text-slate-600 dark:text-slate-400">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600"></div>
                <span>Zéro candidature</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded bg-[#0F766E] dark:bg-cyan-500"></div>
                <span>Avec candidatures</span>
              </div>
            </div>
          </div>

          <!-- Status Breakdown -->
          <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <h3 class="font-display text-base font-bold text-slate-900 dark:text-white mb-4">Statut des candidatures</h3>
            <div class="space-y-4">
              <div *ngFor="let s of statusBreakdown" class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-700 dark:text-slate-300">{{ s.label }}</span>
                  <span class="text-xs font-bold text-slate-900 dark:text-white">{{ s.pct | number:'1.0-0' }}%</span>
                </div>
                <div class="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500" [style.backgroundColor]="s.color" [style.width.%]="s.pct"></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- RIGHT COLUMN -->
        <div class="lg:col-span-5 space-y-5">

          <!-- Pending Queue -->
          <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xs"
               #pendingQueueSection>
            <div class="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#F1F5F9] dark:border-white/10">
              <div>
                <h3 class="font-display text-base font-bold text-slate-900 dark:text-white">File de vérification</h3>
                <p class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">À traiter en priorité</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[#0F766E] dark:text-cyan-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>

            <!-- Queue Items -->
            <div class="space-y-2 max-h-80 overflow-y-auto">
              <div *ngIf="pendingItems.length === 0" class="text-center py-8 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-400">Aucun dossier en attente</p>
              </div>

              <a *ngFor="let item of pendingItems | slice:0:6; let i = index"
                 [routerLink]="['/verifications', item.id]"
                 class="flex items-center justify-between p-3 rounded-xl border border-[#F1F5F9] dark:border-white/10 hover:border-[#0F766E] dark:hover:border-cyan-600/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group">
                <div class="flex items-center gap-2.5 flex-1 min-w-0">
                  <div class="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F766E] dark:text-cyan-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    {{ i + 1 }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#0F766E] dark:group-hover:text-cyan-400 transition-colors truncate capitalize">{{ item.candidatName || (item.candidatEmail ? (item.candidatEmail.split('@')[0]) : 'Dossier #' + (item.id | slice:0:6)) }}</div>
                    <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">{{ item.pieces.length }} document(s) à vérifier</div>
                  </div>
                </div>
                <div class="flex items-center gap-2 ml-auto flex-shrink-0">
                  <span class="px-1.5 py-0.5 text-[10px] font-semibold bg-[#0F766E] dark:bg-cyan-600 text-white rounded-full">{{ item.pieces.length }}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-400 group-hover:text-[#0F766E] dark:group-hover:text-cyan-400 transition-colors"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </a>
            </div>

            <a routerLink="/verifications" class="mt-3 block w-full py-2 text-center rounded-xl text-xs font-bold text-[#0F766E] dark:text-cyan-400 bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors">
              Voir tous les dossiers
            </a>
          </div>

          <!-- System Health & Key Metrics -->
          <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <h3 class="font-display text-base font-bold text-slate-900 dark:text-white mb-3">Métriques clés</h3>
            <div class="grid grid-cols-2 gap-2.5">
              <!-- Metric 1 -->
              <div class="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#0F766E] dark:hover:border-cyan-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-[#0F766E] dark:text-cyan-400 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-bold text-slate-900 dark:text-white truncate">{{ stats?.candidates ?? 0 }}</div>
                  <div class="text-[10px] text-slate-600 dark:text-slate-400 truncate">Candidats</div>
                </div>
              </div>

              <!-- Metric 2 -->
              <div class="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#0F766E] dark:hover:border-cyan-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-bold text-slate-900 dark:text-white truncate">{{ stats?.companies ?? 0 }}</div>
                  <div class="text-[10px] text-slate-600 dark:text-slate-400 truncate">Entreprises</div>
                </div>
              </div>

              <!-- Metric 3 -->
              <div class="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#0F766E] dark:hover:border-cyan-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-bold text-slate-900 dark:text-white truncate">{{ applicationsTotal }}</div>
                  <div class="text-[10px] text-slate-600 dark:text-slate-400 truncate">30 jours</div>
                </div>
              </div>

              <!-- Metric 4 -->
              <div [class]="'flex items-center gap-2.5 p-2.5 rounded-xl border hover:border-[#0F766E] dark:hover:border-cyan-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all ' + (pendingCount > 0 ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5' : 'border-slate-200 dark:border-white/10')">
                <div [class]="'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ' + (pendingCount > 0 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-bold text-slate-900 dark:text-white truncate">{{ pendingCount }}</div>
                  <div class="text-[10px] text-slate-600 dark:text-slate-400 truncate">Dossiers</div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- ═══ TOP 5 OFFRES (PLEINE LARGEUR) ═══ -->
      <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xs"
           *ngIf="stats && stats.topOffers && stats.topOffers.length > 0">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#F1F5F9] dark:border-white/10">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-display text-base font-bold text-slate-900 dark:text-white">Top 5 offres les plus attractives</h3>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">En forte demande</span>
            </div>
            <p class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Offres ayant reçu le plus grand volume de candidatures</p>
          </div>
          <a routerLink="/offers" class="text-xs font-bold text-[#0F766E] dark:text-cyan-400 hover:text-[#0d5d57] dark:hover:text-cyan-300 flex items-center gap-1.5 transition-colors">
            <span>Voir toutes les offres</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <a *ngFor="let offer of stats.topOffers!; let i = index"
             routerLink="/offers"
             class="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#0F766E] dark:hover:border-cyan-600/50 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer">
            <div>
              <div class="flex items-center justify-between mb-2.5">
                <span class="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shadow-2xs"
                      [ngClass]="i === 0 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30' : i === 1 ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200' : i === 2 ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'">
                  #{{ i + 1 }}
                </span>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-cyan-500/10 text-[#0F766E] dark:text-cyan-400 border border-teal-200/60 dark:border-cyan-500/20 whitespace-nowrap">
                  {{ offer.candidatureCount }} cand.
                </span>
              </div>
              <div class="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#0F766E] dark:group-hover:text-cyan-400 transition-colors line-clamp-2 leading-relaxed mb-2" [title]="offer.titre">
                {{ offer.titre }}
              </div>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 text-[11px]">
              <span class="font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                {{ offer.typeContrat || 'CDI' }}
              </span>
              <span class="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-[#0F766E] dark:group-hover:text-cyan-400 transition-colors flex items-center gap-0.5 font-semibold">
                Détails →
              </span>
            </div>
          </a>
        </div>
      </div>

    </div>
  `,
  styles: `
    @keyframes pulse-highlight {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(15, 118, 110, 0.4);
      }
      50% {
        box-shadow: 0 0 0 8px rgba(15, 118, 110, 0);
      }
    }

    :host ::ng-deep .animate-pulse-highlight {
      animation: pulse-highlight 0.6s ease-in-out 2;
      background: linear-gradient(90deg, 
        rgba(15, 118, 110, 0.05) 0%, 
        rgba(45, 212, 191, 0.05) 50%, 
        rgba(15, 118, 110, 0.05) 100%);
    }
  `
})
export class DashboardComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  @ViewChild('pendingQueueSection') pendingQueueSection!: ElementRef;

  today = new Date();
  stats: DashboardStats | null = null;
  pendingItems: AdminVerification[] = [];
  applicationsTrend: TrendPoint[] = []; // Vide au départ
  error = false;
  applicationsTotal = 0;
  pendingCount = 0;
  systemHealth = 100;

  statusBreakdown: Array<{ label: string; pct: number; color: string }> = [];

  hoveredBar = -1;

  readonly avatarLetter = computed(() => {
    const email = this.auth.user()?.email ?? 'A';
    return (email.charAt(0) ?? 'A').toUpperCase();
  });

  ngOnInit(): void {
    forkJoin({
      stats: this.adminApi.getDashboardStats(),
      pending: this.adminApi.getPendingVerifications(),
      trends: this.adminApi.getApplicationsByDay(30),
    }).subscribe({
      next: ({ stats, pending, trends }) => {
        this.stats = stats;
        this.pendingItems = pending;
        this.pendingCount = pending.length;
        this.applicationsTrend = trends;
        this.applicationsTotal = trends.reduce((s, t) => s + t.count, 0);
        this.systemHealth = 100 - Math.min(pending.length * 5, 30);
        this.buildStatusBreakdown(stats);
        
        console.log('Dashboard loaded:', {
          stats, pending, trends,
          applicationsTotal: this.applicationsTotal
        });
      },
      error: (err: HttpErrorResponse) => {
        this.error = true;
        this.systemHealth = 70;
        console.error('Dashboard error:', err);
        
        // Fallback data for testing if API fails
        if (!this.applicationsTrend || this.applicationsTrend.length === 0) {
          this.applicationsTrend = this.generateMockTrendData();
          this.applicationsTotal = this.applicationsTrend.reduce((s, t) => s + t.count, 0);
        }
        
        if (err.status === 401 || err.status === 403) {
          this.auth.clearAll();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  private generateMockTrendData(): TrendPoint[] {
    const data: TrendPoint[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      data.push({
        date: dateStr,
        count: Math.floor(Math.random() * 20) + 5
      });
    }
    return data;
  }

  scrollToPendingQueue(): void {
    // Smooth scroll to the pending queue section
    if (this.pendingQueueSection) {
      this.pendingQueueSection.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      // Add highlight animation to the section
      const element = this.pendingQueueSection.nativeElement;
      element.classList.add('animate-pulse-highlight');

      // Remove animation class after 2 seconds
      setTimeout(() => {
        element.classList.remove('animate-pulse-highlight');
      }, 2000);
    }
  }

  barHeight(value: number): number {
    const max = Math.max(1, ...this.applicationsTrend.map(t => t.count));
    // Minimum height 20% pour que les barres soient visibles, maximum 100%
    return Math.max(20, Math.round((value / max) * 100));
  }

  shouldShowLabel(index: number): boolean {
    const total = this.applicationsTrend.length;
    if (total <= 7) return true;
    if (total <= 14) return index % 2 === 0;
    return index % 5 === 0 || index === total - 1;
  }

  getMaxApplications(): number {
    if (this.applicationsTrend.length === 0) return 0;
    return Math.max(...this.applicationsTrend.map(t => t.count));
  }

  private buildStatusBreakdown(stats: DashboardStats): void {
    const total = stats.applications || 1;
    const byStatus = stats.candidaturesParStatut || {};
    const accepted = byStatus['ACCEPTE'] ?? 0;
    const interview = byStatus['ENTRETIEN'] ?? 0;
    const inProgress = (byStatus['EN_VERIFICATION'] ?? 0) + (byStatus['VERIFIE'] ?? 0) + (byStatus['TRANSMIS'] ?? 0);
    const refused = byStatus['REFUSE'] ?? 0;
    this.statusBreakdown = [
      { label: 'Acceptées', pct: (accepted / total) * 100, color: '#059669' },
      { label: 'En entretien', pct: (interview / total) * 100, color: '#0F766E' },
      { label: 'En cours', pct: (inProgress / total) * 100, color: '#D4A72C' },
      { label: 'Refusées', pct: (refused / total) * 100, color: '#E11D48' },
    ].filter(s => s.pct > 0);
  }
}
