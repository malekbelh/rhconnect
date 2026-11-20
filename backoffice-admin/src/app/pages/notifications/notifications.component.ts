import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminNotificationService, AdminNotification } from '../../core/services/admin-notification.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type FilterType = 'ALL' | 'UNREAD' | 'NEW_CANDIDATE' | 'NEW_COMPANY' | 'NEW_APPLICATION' | 'VERIFICATION_SUBMITTED';
type PeriodFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      <!-- Header -->
      <div class="px-1 py-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div class="flex items-start">
            <div class="flex-1">
              <h1 class="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Notifications</h1>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-1.5">Gérez vos notifications de la plateforme RhConnect en temps réel</p>
            </div>
          </div>
          <div class="flex gap-2.5">
            <button *ngIf="unreadCount > 0"
                    (click)="markAllAsRead()"
                    type="button"
                    class="px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#0F766E] dark:bg-cyan-600 hover:bg-[#0d5d57] dark:hover:bg-cyan-700 transition-colors flex items-center gap-2 justify-center disabled:opacity-50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Marquer tout comme lu
            </button>
            <button *ngIf="notifications.length > 0"
                    (click)="deleteAllNotifications()"
                    type="button"
                    class="px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#0F766E] dark:bg-cyan-600 hover:bg-[#0d5d57] dark:hover:bg-cyan-700 transition-colors flex items-center gap-2 justify-center disabled:opacity-50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Supprimer tout
            </button>
          </div>
        </div>
      </div>

      <!-- Filtres type -->
      <div class="flex gap-1.5 overflow-x-auto pb-1">
        <button *ngFor="let f of filterOptions"
                (click)="selectedFilter = f.id"
                type="button"
                [class]="'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ' + 
                  (selectedFilter === f.id 
                    ? 'bg-[#172A3A] dark:bg-slate-700 text-white shadow-xs' 
                    : 'bg-white dark:bg-[#0A1520] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600')">
          {{ f.label }}
          <span *ngIf="getFilterCount(f.id) > 0"
                [class]="'text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ' +
                  (selectedFilter === f.id 
                    ? 'bg-white/20 text-white' 
                    : f.id === 'UNREAD' ? 'bg-[#E11D48] text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white')">
            {{ getFilterCount(f.id) }}
          </span>
        </button>
      </div>

      <!-- Barre de recherche + filtre période -->
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path stroke-linecap="round" d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <input type="text"
                 [(ngModel)]="searchQuery"
                 placeholder="Rechercher dans les notifications..."
                 class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white dark:bg-[#0A1520] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]" />
        </div>
        <div class="flex gap-1.5 flex-shrink-0">
          <button *ngFor="let p of periodOptions"
                  (click)="selectedPeriod = p.id"
                  type="button"
                  [class]="'px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ' +
                    (selectedPeriod === p.id 
                      ? 'bg-[#0F766E] text-white shadow-xs' 
                      : 'bg-white dark:bg-[#0A1520] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-[#0F766E] dark:hover:text-[#5EEAD4] hover:border-[#0F766E]/40 dark:hover:border-[#5EEAD4]/40')">
            {{ p.label }}
          </button>
        </div>
      </div>

      <!-- Récap filtres actifs -->
      <div *ngIf="searchQuery || selectedPeriod !== 'ALL'" class="flex items-center gap-2 text-xs">
        <span class="text-slate-600 dark:text-slate-400">{{ filteredNotifications.length }} résultat{{ filteredNotifications.length > 1 ? 's' : '' }}</span>
        <button (click)="clearFilters()"
                class="text-[#0F766E] font-bold hover:underline dark:text-[#5EEAD4]">
          Effacer les filtres
        </button>
      </div>

      <!-- Contenu -->
      <div *ngIf="loading" class="flex flex-col items-center justify-center py-20 gap-3">
        <svg class="w-8 h-8 text-[#0F766E] animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="7.34" y2="7.34"/><line x1="16.66" y1="16.66" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="7.34" y2="16.66"/><line x1="16.66" y1="7.34" x2="19.78" y2="4.22"/>
        </svg>
        <p class="text-xs text-slate-600 dark:text-slate-400">Chargement des notifications...</p>
      </div>

      <div *ngIf="!loading && filteredNotifications.length === 0" class="bg-white dark:bg-[#0A1520] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-12 text-center">
        <svg class="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path stroke-linecap="round" d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>
        </svg>
        <h3 class="font-bold text-slate-900 dark:text-white text-sm">
          {{ selectedFilter === 'UNREAD' ? 'Tout est à jour !' : 'Aucune notification' }}
        </h3>
        <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {{ selectedFilter === 'UNREAD'
            ? 'Vous avez lu toutes vos notifications.'
            : 'Les mises à jour des candidatures et dossiers apparaîtront ici.' }}
        </p>
      </div>

      <div *ngIf="!loading && filteredNotifications.length > 0" class="space-y-2">
        <div *ngFor="let notif of filteredNotifications"
             [routerLink]="notif.link"
             (click)="markAsRead(notif.id)"
             class="flex items-start gap-4 p-4 rounded-2xl border transition-all hover:shadow-xs group cursor-pointer"
             [class.bg-white='notif.read'
             [class.dark:bg-slate-900='notif.read'
             [class.border-slate-200='notif.read'
             [class.dark:border-slate-800='notif.read'
             [class.hover:border-slate-300='notif.read'
             [class.dark:hover:border-slate-700='notif.read'
             [class.bg-blue-50='!notif.read'
             [class.dark:bg-blue-950='!notif.read'
             [class.border-blue-200='!notif.read'
             [class.dark:border-blue-800='!notif.read'>
          
          <!-- Icône -->
          <div [class]="'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ' +
                 (notif.read 
                   ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' 
                   : 'bg-cyan-100 dark:bg-cyan-900 border-cyan-300 dark:border-cyan-700')">
            <svg *ngIf="notif.type === 'NEW_CANDIDATE'" class="w-5 h-5 text-[#0F766E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <svg *ngIf="notif.type === 'NEW_COMPANY'" class="w-5 h-5 text-[#0F766E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            <svg *ngIf="notif.type === 'NEW_APPLICATION'" class="w-5 h-5 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <svg *ngIf="notif.type === 'VERIFICATION_SUBMITTED'" class="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><polyline points="16 12 12 8 8 12"/>
            </svg>
          </div>

          <!-- Contenu -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <p [class]="'text-xs font-bold ' + (notif.read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white')">
                    {{ notif.title }}
                  </p>
                  <span *ngIf="!notif.read" class="w-2 h-2 rounded-full flex-shrink-0 bg-cyan-600 dark:bg-cyan-400" title="Non lue"></span>
                </div>
                <p [class]="'text-[11px] mt-0.5 leading-relaxed ' + (notif.read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-600 dark:text-slate-300')">
                  {{ notif.message }}
                </p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0 ml-2 pt-0.5">
                <span class="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {{ formatDate(notif.createdAt) }}
                </span>
                <button type="button"
                        (click)="deleteNotification($event, notif.id)"
                        class="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Supprimer cette notification"
                        aria-label="Supprimer cette notification">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </button>
                <svg class="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-[#0F766E] dark:group-hover:text-cyan-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer info -->
      <p *ngIf="notifications.length > 0" class="text-[11px] text-center text-slate-500 dark:text-slate-400">
        Les notifications se mettent à jour en temps réel.
      </p>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  private notificationService = inject(AdminNotificationService);

  notifications: AdminNotification[] = [];
  filteredNotifications: AdminNotification[] = [];
  unreadCount = 0;
  loading = false;
  searchQuery = '';
  selectedFilter: FilterType = 'ALL';
  selectedPeriod: PeriodFilter = 'ALL';

  filterOptions: { id: FilterType; label: string }[] = [
    { id: 'ALL', label: 'Toutes' },
    { id: 'UNREAD', label: 'Non lues' },
    { id: 'NEW_CANDIDATE', label: 'Nouveaux candidats' },
    { id: 'NEW_COMPANY', label: 'Nouvelles entreprises' },
    { id: 'NEW_APPLICATION', label: 'Candidatures' },
    { id: 'VERIFICATION_SUBMITTED', label: 'Vérifications' },
  ];

  periodOptions: { id: PeriodFilter; label: string }[] = [
    { id: 'ALL', label: 'Toutes les dates' },
    { id: 'TODAY', label: 'Aujourd\'hui' },
    { id: 'WEEK', label: '7 derniers jours' },
    { id: 'MONTH', label: '30 derniers jours' },
  ];

  ngOnInit(): void {
    this.loadNotifications();
    this.subscribeToNotifications();
  }

  private subscribeToNotifications(): void {
    this.notificationService.notifications$
      .pipe(takeUntilDestroyed())
      .subscribe(notifs => {
        this.notifications = notifs;
        this.applyFilters();
      });

    this.notificationService.unreadCount$
      .pipe(takeUntilDestroyed())
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  private loadNotifications(): void {
    this.loading = true;
    this.notificationService.getAdminNotifications().subscribe(() => {
      this.loading = false;
    });
  }

  applyFilters(): void {
    this.filteredNotifications = this.notifications.filter(n => {
      let matchType = true;
      if (this.selectedFilter === 'UNREAD') {
        matchType = !n.read;
      } else if (this.selectedFilter !== 'ALL') {
        matchType = n.type === this.selectedFilter;
      }

      const matchPeriod = this.isInPeriod(n.createdAt);
      const q = this.searchQuery.toLowerCase();
      const matchSearch = !q || 
        n.title.toLowerCase().includes(q) || 
        n.message.toLowerCase().includes(q);

      return matchType && matchPeriod && matchSearch;
    });
  }

  private isInPeriod(dateStr: string): boolean {
    if (this.selectedPeriod === 'ALL') return true;
    const date = new Date(dateStr).getTime();
    const now = Date.now();
    if (this.selectedPeriod === 'TODAY') return now - date < 86_400_000;
    if (this.selectedPeriod === 'WEEK') return now - date < 7 * 86_400_000;
    if (this.selectedPeriod === 'MONTH') return now - date < 30 * 86_400_000;
    return true;
  }

  getFilterCount(filter: FilterType): number {
    if (filter === 'ALL') return this.notifications.length;
    if (filter === 'UNREAD') return this.unreadCount;
    return this.notifications.filter(n => n.type === filter).length;
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe();
  }

  deleteNotification(event: Event, id: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.notificationService.deleteNotification(id).subscribe();
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => {
      if (!n.read) {
        this.notificationService.markAsRead(n.id).subscribe();
      }
    });
  }

  deleteAllNotifications(): void {
    if (!confirm('Supprimer toutes les notifications ?')) return;
    this.notifications.forEach(n => {
      this.notificationService.deleteNotification(n.id).subscribe();
    });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedPeriod = 'ALL';
    this.applyFilters();
  }

  formatDate(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "à l'instant";
    if (m < 60) return `il y a ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `il y a ${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `il y a ${d}j`;
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
}
