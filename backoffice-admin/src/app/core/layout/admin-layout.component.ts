import { Component, DestroyRef, inject, signal, computed, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, AuthUser } from '../../core/auth.service';
import { CanDirective } from '../../core/can.directive';
import { AdminNotificationService } from '../services/admin-notification.service';
import { NotificationPanelComponent } from '../components/notification-panel.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule, CanDirective, NotificationPanelComponent],
  template: `
    <div class="admin-shell"
         [class.sidebar-collapsed]="collapsed()"
         [class.theme-dark]="dark()">

      <!-- ══ IMPERSONATION BANNER ══ -->
      <div class="impersonation-banner" *ngIf="auth.isImpersonating()">
        <div class="impersonation-inner">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path stroke-linecap="round" d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path stroke-linecap="round" d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>
            <strong>Mode impersonation</strong> — Vous êtes actuellement connecté en tant que
            <em>{{ auth.impersonatedUser()?.email ?? '…' }}</em>.
            Vos actions seront journalisées comme étant effectuées par ce compte.
          </span>
          <button class="end-impersonate-btn" (click)="stopImpersonate()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
              <path stroke-linecap="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline stroke-linecap="round" points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke-linecap="round"/>
            </svg>
            Quitter le mode impersonation
          </button>
        </div>
      </div>

      <!-- ══ SIDEBAR - EXACT CANDIDATE DESIGN ══ -->
      <aside [class]="'fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#172A3A] dark:bg-[#0A1520] border-r border-white/10 transition-all duration-300 ease-in-out ' + (collapsed() ? 'w-[74px]' : 'w-[260px]') + ' lg:ml-0 lg:translate-x-0 -translate-x-full lg:translate-x-0'"
              role="navigation" aria-label="Navigation principale">

        <!-- Brand Header -->
        <div class="flex items-center gap-3 px-4 py-5 border-b border-white/[0.08] h-[66px] overflow-hidden whitespace-nowrap">
          <!-- Logo Icon -->
          <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-[#0F766E] shadow-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
               aria-hidden="true">
            <svg viewBox="0 0 44 44" width="26" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 13 11 C 13 10.17 13.67 9.5 14.5 9.5 C 15.33 9.5 16 10.17 16 11 L 16 31 C 16 31.83 15.33 32.5 14.5 32.5 C 13.67 32.5 13 31.83 13 31 Z" fill="#FFFFFF"/>
              <path d="M 15 11.5 H 23.5 C 27.6 11.5 30 14.1 30 17.6 C 30 21.1 27.6 23.7 23.5 23.7 H 15" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M 21.2 23.2 L 28.6 31.6 C 29.1 32.2 30 32.2 30.6 31.7" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M 22.8 17.5 C 24 16 26.5 15 29.5 13.5" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="0.5 2.5"/>
              <circle cx="21.5" cy="17.6" r="2.2" fill="#FFFFFF"/>
              <circle cx="31" cy="12.5" r="2.6" fill="#D4A72C"/>
            </svg>
          </div>

          <!-- Brand Text (not collapsed) -->
          <div [class]="'flex-1 min-w-0 transition-opacity duration-200 ' + (collapsed() ? 'opacity-0 pointer-events-none' : 'opacity-100')">
            <div class="font-bold text-white text-base tracking-tight leading-tight flex items-center gap-1.5">
              RhConnect
            </div>
            <div class="text-[11px] text-white/50 truncate font-medium mt-0.5">
              Back-office Admin
            </div>
          </div>

          <!-- Mobile Close Button -->
          <button type="button" class="lg:hidden ml-auto p-1.5 text-white/60 hover:text-white rounded-lg transition-colors"
                  (click)="collapsed.set(false)" aria-label="Fermer le menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-4 space-y-5 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10">
          
          <!-- Overview Section -->
          <div class="space-y-1">
            <div *ngIf="!collapsed()" class="px-3 text-[10px] font-bold tracking-wider text-white/30 uppercase select-none mb-1">
              Vue d'ensemble
            </div>
            <div *ngIf="collapsed()" class="w-6 h-[1px] bg-white/10 mx-auto my-2"></div>

            <a routerLink="/dashboard" routerLinkActive="active"
               [class]="'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ' + (collapsed() ? 'justify-center px-2' : '') + (collapsed() ? '' : 'hover:bg-white/[0.07] text-white/60 hover:text-white')"
               [title]="collapsed() ? 'Dashboard' : ''"
               [attr.aria-label]="collapsed() ? 'Dashboard' : null">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
                   [class]="'flex-shrink-0 size-[19px] transition-colors text-white/80'"
                   [ngClass]="{'text-[#5EEAD4] text-white/60:!': false}">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              <span class="truncate" *ngIf="!collapsed()">Dashboard</span>
              <div *ngIf="collapsed()" class="fixed left-[84px] px-2.5 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50 whitespace-nowrap">
                Dashboard
              </div>
            </a>

            <a routerLink="/users" routerLinkActive="active"
               [class]="'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ' + (collapsed() ? 'justify-center px-2' : '') + (collapsed() ? '' : 'hover:bg-white/[0.07] text-white/60 hover:text-white')"
               [title]="collapsed() ? 'Utilisateurs' : ''"
               [attr.aria-label]="collapsed() ? 'Utilisateurs' : null">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
                   [class]="'flex-shrink-0 size-[19px] transition-colors text-white/80'">
                <circle cx="9" cy="7" r="4"/><path d="M3 21v-1a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v1"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75M22 21v-1a6 6 0 0 0-4.47-5.79"/>
              </svg>
              <span class="truncate" *ngIf="!collapsed()">Utilisateurs</span>
              <div *ngIf="collapsed()" class="fixed left-[84px] px-2.5 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50 whitespace-nowrap">
                Utilisateurs
              </div>
            </a>

            <a routerLink="/offers" routerLinkActive="active"
               [class]="'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ' + (collapsed() ? 'justify-center px-2' : '') + (collapsed() ? '' : 'hover:bg-white/[0.07] text-white/60 hover:text-white')"
               [title]="collapsed() ? 'Offres' : ''"
               [attr.aria-label]="collapsed() ? 'Offres' : null">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
                   [class]="'flex-shrink-0 size-[19px] transition-colors text-white/80'">
                <rect x="2" y="7" width="20" height="15" rx="2"/>
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M12 12v5M9.5 14.5h5"/>
              </svg>
              <span class="truncate" *ngIf="!collapsed()">Offres</span>
              <div *ngIf="collapsed()" class="fixed left-[84px] px-2.5 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50 whitespace-nowrap">
                Offres
              </div>
            </a>

            <a routerLink="/applications" routerLinkActive="active"
               [class]="'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ' + (collapsed() ? 'justify-center px-2' : '') + (collapsed() ? '' : 'hover:bg-white/[0.07] text-white/60 hover:text-white')"
               [title]="collapsed() ? 'Candidatures' : ''"
               [attr.aria-label]="collapsed() ? 'Candidatures' : null">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
                   [class]="'flex-shrink-0 size-[19px] transition-colors text-white/80'">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/><line x1="9" y1="13" x2="15" y2="13"/>
                <line x1="9" y1="17" x2="13" y2="17"/>
              </svg>
              <span class="truncate" *ngIf="!collapsed()">Candidatures</span>
              <div *ngIf="collapsed()" class="fixed left-[84px] px-2.5 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50 whitespace-nowrap">
                Candidatures
              </div>
            </a>

            <a routerLink="/verifications" routerLinkActive="active"
               [class]="'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ' + (collapsed() ? 'justify-center px-2' : '') + (collapsed() ? '' : 'hover:bg-white/[0.07] text-white/60 hover:text-white')"
               [title]="collapsed() ? 'Vérifications' : ''"
               [attr.aria-label]="collapsed() ? 'Vérifications' : null">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
                   [class]="'flex-shrink-0 size-[19px] transition-colors text-white/80'">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9,12 11,14 15,10"/>
              </svg>
              <span class="truncate" *ngIf="!collapsed()">Vérifications</span>
              <div *ngIf="collapsed()" class="fixed left-[84px] px-2.5 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50 whitespace-nowrap">
                Vérifications
              </div>
            </a>
          </div>

          <!-- Pilotage Section -->
          <div class="space-y-1">
            <div *ngIf="!collapsed()" class="px-3 text-[10px] font-bold tracking-wider text-white/30 uppercase select-none mb-1">
              Pilotage
            </div>
            <div *ngIf="collapsed()" class="w-6 h-[1px] bg-white/10 mx-auto my-2"></div>

            <a routerLink="/reporting" routerLinkActive="active"
               [class]="'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ' + (collapsed() ? 'justify-center px-2' : '') + (collapsed() ? '' : 'hover:bg-white/[0.07] text-white/60 hover:text-white')"
               [title]="collapsed() ? 'Reporting' : ''"
               [attr.aria-label]="collapsed() ? 'Reporting' : null">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
                   [class]="'flex-shrink-0 size-[19px] transition-colors text-white/80'">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
              </svg>
              <span class="truncate" *ngIf="!collapsed()">Reporting</span>
              <div *ngIf="collapsed()" class="fixed left-[84px] px-2.5 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50 whitespace-nowrap">
                Reporting
              </div>
            </a>

            <a routerLink="/notifications" routerLinkActive="active"
               [class]="'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ' + (collapsed() ? 'justify-center px-2' : '') + (collapsed() ? '' : 'hover:bg-white/[0.07] text-white/60 hover:text-white')"
               [title]="collapsed() ? 'Notifications' : ''"
               [attr.aria-label]="collapsed() ? 'Notifications' : null">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
                   [class]="'flex-shrink-0 size-[19px] transition-colors text-white/80'">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span class="truncate" *ngIf="!collapsed()">Notifications</span>
              <div *ngIf="collapsed()" class="fixed left-[84px] px-2.5 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50 whitespace-nowrap">
                Notifications
              </div>
            </a>

            <a routerLink="/settings" routerLinkActive="active"
               [class]="'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ' + (collapsed() ? 'justify-center px-2' : '') + (collapsed() ? '' : 'hover:bg-white/[0.07] text-white/60 hover:text-white')"
               [title]="collapsed() ? 'Paramètres' : ''"
               [attr.aria-label]="collapsed() ? 'Paramètres' : null">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
                   [class]="'flex-shrink-0 size-[19px] transition-colors text-white/80'">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span class="truncate" *ngIf="!collapsed()">Paramètres</span>
              <div *ngIf="collapsed()" class="fixed left-[84px] px-2.5 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50 whitespace-nowrap">
                Paramètres
              </div>
            </a>
          </div>

        </nav>

        <!-- Footer -->
        <div class="p-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/40">
          <button type="button"
                  class="p-2 text-white/50 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors flex items-center justify-center"
                  (click)="toggleSidebar()"
                  [attr.aria-label]="collapsed() ? 'Déplier la sidebar' : 'Réduire la sidebar'">
            <svg *ngIf="!collapsed()" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6" stroke-linecap="round"/>
            </svg>
            <svg *ngIf="collapsed()" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6" stroke-linecap="round"/>
            </svg>
          </button>
          <span class="text-[11px] font-medium text-white/30 pr-1 select-none" *ngIf="!collapsed()">
            v1.0.0
          </span>
        </div>

      </aside>

      <!-- ══ MAIN ══ -->
      <main class="admin-main">
        <!-- Topbar - MATCHING CANDIDATE SPACE NAVBAR EXACTLY -->
        <header class="sticky top-0 z-30 h-[66px] bg-[#F3F6F7]/90 dark:bg-[#0A1520]/90 backdrop-blur-md border-b border-[#E2E8F0] dark:border-white/10 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-colors duration-200">
          <!-- Left section: Search + Mobile Menu -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <!-- Mobile hamburger menu -->
            <button type="button" class="lg:hidden p-2 text-[#475569] hover:text-[#172A3A] dark:text-white/60 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors border border-[#E2E8F0] dark:border-white/10"
                    (click)="toggleSidebar()" aria-label="Ouvrir le menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6" stroke-linecap="round"/><line x1="3" y1="12" x2="21" y2="12" stroke-linecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke-linecap="round"/>
              </svg>
            </button>

            <!-- Quick search form (hidden on mobile) -->
            <form class="relative flex-1 max-w-md hidden sm:block">
              <div class="flex items-center gap-2 px-3.5 h-[38px] bg-white dark:bg-[#152334] border border-[#CBD5E1] dark:border-[#2A3F55] rounded-full text-[#64748B] focus-within:border-[#0F766E] focus-within:ring-2 focus-within:ring-[#0F766E]/20 dark:focus-within:border-[#2DD4BF] dark:focus-within:ring-[#2DD4BF]/20 transition-all shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[#94A3B8] flex-shrink-0" aria-hidden="true">
                  <circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="m20 20-4-4"/>
                </svg>
                <input type="search" placeholder="Rechercher..." 
                       class="w-full bg-transparent border-0 outline-none text-xs text-[#172A3A] dark:text-white placeholder-[#94A3B8] dark:placeholder-white/40" />
              </div>
            </form>
          </div>

          <!-- Right section: Notifications + Theme + Profile + Logout -->
          <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">

            <!-- Notification Bell -->
            <div class="relative" #notificationMenu>
              <button type="button" 
                      class="relative p-2 text-[#64748B] dark:text-white/60 hover:text-[#172A3A] dark:hover:text-white hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors"
                      (click)="notificationMenuOpen = !notificationMenuOpen"
                      [attr.aria-expanded]="notificationMenuOpen"
                      title="Notifications" aria-label="Notifications">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path stroke-linecap="round" d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span class="absolute top-1 right-1 min-w-[16px] h-[16px] px-0.5 bg-[#E11D48] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-[#F3F6F7] dark:ring-[#0A1520] leading-none" *ngIf="pendingCount > 0">
                  {{ pendingCount > 99 ? '99+' : pendingCount }}
                </span>
              </button>

              <!-- Notification Dropdown Panel -->
              <div *ngIf="notificationMenuOpen" 
                   class="absolute right-0 mt-2 w-96 max-h-96 bg-white dark:bg-[#0A1520] border border-[#E2E8F0] dark:border-[#2A3F55] rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col"
                   [@fadeIn]>
                <!-- Header -->
                <div class="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] dark:border-[#2A3F55] bg-[#F9FAFB] dark:bg-[#152334]">
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                  <button type="button" 
                          class="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/10 rounded-lg transition-colors"
                          (click)="notificationMenuOpen = false"
                          aria-label="Fermer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                <!-- Notifications List -->
                <div class="overflow-y-auto flex-1">
                  <app-notification-panel 
                    [notifications]="notificationService.getCurrentNotifications()"
                    (close)="notificationMenuOpen = false">
                  </app-notification-panel>
                </div>
              </div>
            </div>

            <!-- Theme Toggle (Sun/Moon) -->
            <button type="button" class="p-2 text-[#64748B] dark:text-white/60 hover:text-[#172A3A] dark:hover:text-white hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors"
                    (click)="toggleTheme()" [title]="dark() ? 'Mode clair' : 'Mode sombre'" [attr.aria-label]="dark() ? 'Mode clair' : 'Mode sombre'">
              <svg *ngIf="!dark()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="4"/><path stroke-linecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
              <svg *ngIf="dark()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[#D4A72C]">
                <path stroke-linecap="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </button>

            <!-- Vertical Divider -->
            <div class="w-[1px] h-6 bg-[#E2E8F0] dark:bg-white/10 mx-1" aria-hidden="true"></div>

            <!-- User Profile with Dropdown -->
            <div class="relative" #profileMenu>
              <button type="button" 
                      class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border transition-all text-left group"
                      [class]="profileMenuOpen ? 'bg-white dark:bg-[#152334] border-[#CBD5E1] dark:border-[#2A3F55] shadow-xs' : 'border-transparent hover:bg-white dark:hover:bg-white/10 hover:border-[#E2E8F0] dark:hover:border-white/10'"
                      (click)="profileMenuOpen = !profileMenuOpen"
                      [attr.aria-expanded]="profileMenuOpen"
                      aria-haspopup="true">
                <div class="w-9 h-9 rounded-full bg-[#0F766E] dark:bg-[#0F766E] text-white font-bold text-xs flex items-center justify-center shadow-[0_2px_8px_rgba(15,118,110,0.35)] border border-white/20 select-none flex-shrink-0">
                  {{ avatarLetter() }}
                </div>
                <div class="text-left leading-tight">
                  <div class="text-xs font-bold text-[#172A3A] dark:text-white whitespace-nowrap">
                    {{ displayEmail() | slice:0:20 }}{{ (displayEmail() | slice:20).length > 0 ? '...' : '' }}
                  </div>
                </div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     class="text-[#64748B] group-hover:text-[#172A3A] dark:group-hover:text-white transition-transform duration-200 ml-1 flex-shrink-0"
                     [style.transform]="profileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              <!-- Profile Dropdown Menu -->
              <div *ngIf="profileMenuOpen" class="absolute right-0 mt-2 w-60 bg-white dark:bg-[#0A1520] border border-[#E2E8F0] dark:border-[#2A3F55] rounded-2xl shadow-xl py-1.5 z-50"
                   [@fadeIn]>
                <div class="px-4 py-2.5 border-b border-[#F1F5F9] dark:border-[#2A3F55]">
                  <p class="text-xs font-bold text-[#172A3A] dark:text-white break-all mt-0.5">
                    {{ displayEmail() }}
                  </p>
                  <p class="text-xs text-[#64748B] dark:text-white/60 mt-1">
                    {{ displayRole() }}
                  </p>
                </div>

                <div class="py-1">
                  <button type="button" (click)="goToSettings()"
                          class="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#334155] dark:text-white/70 hover:text-[#0F766E] dark:hover:text-[#2DD4BF] hover:bg-[#F0FDFA] dark:hover:bg-[#0F766E]/10 transition-colors text-left">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[#0F766E] dark:text-[#2DD4BF]">
                      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    Paramètres
                  </button>
                </div>

                <div class="pt-1 border-t border-[#F1F5F9] dark:border-[#2A3F55]">
                  <button type="button" (click)="profileMenuOpen = false; logout()"
                          class="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-[#E11D48] dark:text-[#F87171] hover:bg-[#FFF1F2] dark:hover:bg-[#E11D48]/10 transition-colors text-left">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline stroke-linecap="round" points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12" stroke-linecap="round"/>
                    </svg>
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>

            <!-- Logout button (visible on sm+ screens) -->
            <button type="button" (click)="logout()"
                    class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#152334] hover:bg-[#FFF1F2] dark:hover:bg-[#E11D48]/10 border border-[#CBD5E1] dark:border-[#2A3F55] hover:border-[#E11D48] dark:hover:border-[#E11D48] text-[#475569] dark:text-white hover:text-[#E11D48] dark:hover:text-[#F87171] text-xs font-semibold rounded-full transition-all duration-150 shadow-sm"
                    title="Se déconnecter">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline stroke-linecap="round" points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12" stroke-linecap="round"/>
              </svg>
              <span>Déconnexion</span>
            </button>
          </div>
        </header>

        <!-- Page content -->
        <div class="admin-content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: `
    /* Sidebar active state styling */
    aside a.active {
      @apply bg-[#0F766E]/25 text-white shadow-sm font-semibold;
    }
    aside a.active svg {
      @apply text-[#5EEAD4];
    }

    .sidebar-version { font-size: .65rem; color: rgba(255,255,255,.25); font-weight: 500; }
    .topbar-left { display:flex; align-items:center; gap:16px; }
    .admin-session { font-size:.8rem; font-weight:600; color:var(--ink); }
    .admin-role    { font-size:.7rem; color:var(--n-400); }

    .impersonation-banner {
      position: sticky;
      top: 0;
      z-index: 50;
      background: linear-gradient(90deg, #7c2d12 0%, #9a3412 50%, #7c2d12 100%);
      color: #fff7ed;
      border-bottom: 2px solid #fbbf24;
      animation: slide-down .3s ease;
    }
    .impersonation-inner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 24px;
      max-width: 1800px;
      margin: 0 auto;
      font-size: .84rem;
    }
    .impersonation-inner strong { color: #fef3c7; }
    .impersonation-inner em { font-style: normal; font-weight: 700; color: #fde68a; }
    .end-impersonate-btn {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border: 1.5px solid #fbbf24;
      background: #fef3c7;
      color: #78350f;
      border-radius: 8px;
      font-weight: 700;
      font-size: .78rem;
      cursor: pointer;
      transition: background .15s;
    }
    .end-impersonate-btn:hover { background: #fde68a; }
    @keyframes slide-down { from { transform: translateY(-100%); } to { transform: translateY(0); } }
  `
})
export class AdminLayoutComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);
  readonly notificationService = inject(AdminNotificationService);
  private readonly destroyRef = inject(DestroyRef);

  collapsed = signal(false);
  dark = signal(this.loadThemeFromStorage());
  profileMenuOpen = false;
  notificationMenuOpen = false;
  searchQuery = '';
  pendingCount = 0;

  private impersonateSnapshot: { tokens: { accessToken: string; refreshToken: string }; user: AuthUser } | null = null;

  readonly displayEmail = computed(() => {
    const u = this.auth.impersonatedUser() ?? this.auth.user();
    return u?.email ?? 'Non connecté';
  });

  readonly displayRole = computed(() => {
    const u = this.auth.impersonatedUser() ?? this.auth.user();
    if (this.auth.isImpersonating()) return 'Mode impersonation';
    const r = u?.roles?.[0] ?? '—';
    return ({ ADMIN: 'Super Admin', RECRUITER: 'Recruteur', CANDIDATE: 'Candidat', COMPANY: 'Entreprise' } as Record<string, string>)[r] ?? r;
  });

  readonly avatarLetter = computed(() => {
    const email = this.displayEmail();
    return (email?.charAt(0) ?? 'A').toUpperCase();
  });

  ngOnInit(): void {
    this.auth.impersonatedUser();
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {});
    
    // Subscribe to unread notification count
    this.notificationService.unreadCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(count => {
        this.pendingCount = count;
      });
  }

  toggleSidebar(): void { this.collapsed.update(v => !v); }
  toggleTheme(): void {
    this.dark.update(v => {
      const next = !v;
      try {
        localStorage.setItem('rhconnect_admin_theme', next ? 'dark' : 'light');
        // Apply to document
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch {}
      return next;
    });
  }

  private loadThemeFromStorage(): boolean {
    try {
      const isDark = localStorage.getItem('rhconnect_admin_theme') === 'dark';
      // Apply to document on load
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return isDark;
    } catch {
      return false;
    }
  }

  goToSettings(): void {
    this.profileMenuOpen = false;
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.auth.logout();
  }

  stopImpersonate(): void {
    const snap = this.auth.snapshot();
    if (snap) this.impersonateSnapshot = snap;
    this.auth.clearAll();
    if (this.impersonateSnapshot) {
      const { tokens, user } = this.impersonateSnapshot;
      this.auth.stopImpersonation(tokens, user);
    }
    this.impersonateSnapshot = null;
    this.router.navigate(['/dashboard']);
  }
}
