import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService, AdminVerification, AdminVerificationDoc } from '../../core/admin-api.service';
import { CanDirective } from '../../core/can.directive';
import { AuthService } from '../../core/auth.service';

type StatusFilter = 'ALL' | 'EN_ATTENTE' | 'REJETE' | 'VALIDE';
type RoleTypeFilter = 'ALL' | 'COMPANY' | 'CANDIDATE';

@Component({
  selector: 'app-verifications',
  standalone: true,
  imports: [CommonModule, FormsModule, CanDirective],
  template: `
    <div class="max-w-7xl mx-auto py-5 space-y-5 px-4 sm:px-6 lg:px-8">

      <!-- ════════════════════════════════════════════════════════════
           ══ VUE 1 : INSPECTION DÉTAILLÉE DU DOSSIER (STRUCTURE CAPTURE) ══
           ════════════════════════════════════════════════════════════ -->
      <div *ngIf="inspectedVerification() as item" class="space-y-5">
        
        <!-- Breadcrumb & Bouton retour -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span class="hover:text-[#0F766E] dark:hover:text-cyan-400 cursor-pointer" (click)="closeInspection()">Vérifications</span>
            <span>›</span>
            <span class="text-slate-900 dark:text-white font-medium">Détail du compte</span>
          </div>

          <button 
            type="button"
            (click)="closeInspection()"
            class="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-[#0F766E] dark:hover:text-cyan-400 transition-colors cursor-pointer group"
          >
            <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
            </svg>
            Retour à la liste
          </button>
        </div>

        <!-- ── En-tête profil (Thème RHConnect) ── -->
        <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xs">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div class="flex items-start sm:items-center gap-4">
              <!-- Avatar Initiales stylé RHConnect -->
              <div class="w-16 h-16 rounded-xl overflow-hidden border border-[#243E54] bg-[#172A3A] flex items-center justify-center flex-shrink-0 text-xl font-bold text-amber-500 dark:text-amber-400 shadow-xs">
                {{ getInitials(item.candidatName, item.candidatEmail) }}
              </div>

              <div class="space-y-1.5">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {{ isCompany(item) ? 'Entreprise' : 'Candidat' }}
                  </span>

                  <span 
                    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1"
                    [ngClass]="getStatusBadgeClass(item.statut)"
                  >
                    <svg *ngIf="item.statut === 'VALIDE'" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                    <svg *ngIf="item.statut === 'REJETE'" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <svg *ngIf="item.statut !== 'VALIDE' && item.statut !== 'REJETE'" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
                    {{ getStatusLabel(item.statut) }}
                  </span>
                </div>

                <h1 class="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {{ item.candidatName || 'Compte' }}
                </h1>

                <p class="text-xs text-slate-600 dark:text-slate-400">
                  <span class="font-medium text-slate-800 dark:text-slate-200">{{ item.candidatEmail }}</span>
                  <span class="mx-2">•</span>
                  <span>Soumis le {{ formatSubmissionDate(item.createdAt) }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Cartes métriques récapitulatives ── -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Documents -->
          <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Documents justificatifs</span>
              <div class="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-500/20 text-[#0F766E] dark:text-cyan-400 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
            </div>
            <div class="font-display text-2xl font-bold text-slate-900 dark:text-white">{{ item.pieces.length || 0 }}</div>
          </div>

          <!-- Métrique 2 : RNE (Entreprise) OU Profil (Candidat) -->
          <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {{ isCompany(item) ? 'Matricule Fiscal / RNE' : 'Type de profil' }}
              </span>
              <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <svg *ngIf="isCompany(item)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                <svg *ngIf="!isCompany(item)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
            </div>
            <div class="font-display text-xl font-bold text-slate-900 dark:text-white truncate">
              {{ isCompany(item) ? (item.siret || 'Non spécifié') : 'Candidat certifié' }}
            </div>
          </div>

          <!-- Métrique 3 : Secteur (Entreprise) OU Statut (Candidat) -->
          <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {{ isCompany(item) ? 'Secteur d\'activité' : 'Statut examen' }}
              </span>
              <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
            </div>
            <div class="font-display text-xl font-bold text-slate-900 dark:text-white truncate">
              {{ isCompany(item) ? (item.industry || 'Non renseigné') : getStatusLabel(item.statut) }}
            </div>
          </div>
        </div>

        <!-- ── Contenu 2 Colonnes (Pièces & Infos / Décision) ── -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          <!-- COLONNE GAUCHE (8 COLS) -->
          <div class="lg:col-span-8 space-y-5">
            
            <!-- Carte Documents Justificatifs -->
            <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-2xs space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-white/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[#0F766E] dark:text-cyan-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div>
                  <h2 class="text-sm font-bold text-slate-900 dark:text-white">Documents justificatifs</h2>
                  <p class="text-xs text-slate-600 dark:text-slate-400">{{ item.pieces.length || 0 }} pièce(s) justificative(s) déposée(s)</p>
                </div>
              </div>

              <!-- Liste des pièces -->
              <div *ngIf="item.pieces && item.pieces.length > 0; else noPieces" class="space-y-2.5 pt-1">
                <div 
                  *ngFor="let piece of item.pieces"
                  class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 hover:border-[#0F766E] dark:hover:border-cyan-600/40 transition-colors"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-500/20 text-[#0F766E] dark:text-cyan-400 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                      {{ (piece.type || 'DOC').substring(0, 3) }}
                    </div>
                    <div class="min-w-0">
                      <div class="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {{ piece.type === 'RNE' || piece.type === 'RCA' ? 'Registre National des Entreprises (RNE)' : (piece.type || 'Document officiel') }}
                      </div>
                      <div class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {{ piece.nomFichier || 'piece.pdf' }}
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button 
                      type="button"
                      (click)="previewPiece(piece)"
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0F766E] dark:text-cyan-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-[#0F766E] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      Ouvrir le fichier
                    </button>
                    <button 
                      type="button"
                      (click)="downloadPiece(piece)"
                      class="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Télécharger"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              <ng-template #noPieces>
                <div class="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
                  Aucun document joint à ce dossier.
                </div>
              </ng-template>
            </div>

            <!-- ── SEULEMENT POUR LES ENTREPRISES : Informations sur l'entreprise ── -->
            <div *ngIf="isCompany(item)" class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-2xs space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-white/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[#0F766E] dark:text-cyan-400"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                <h2 class="text-sm font-bold text-slate-900 dark:text-white">Informations sur l'entreprise</h2>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Matricule Fiscal / RNE</div>
                  <div class="font-bold text-slate-900 dark:text-white">{{ item.siret || 'Non renseigné' }}</div>
                </div>

                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Raison Sociale</div>
                  <div class="font-bold text-slate-900 dark:text-white">{{ item.candidatName || 'Non renseigné' }}</div>
                </div>

                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Secteur d'activité</div>
                  <div class="font-semibold text-slate-800 dark:text-slate-200">{{ item.industry || 'Non renseigné' }}</div>
                </div>

                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Taille de l'entreprise</div>
                  <div class="font-semibold text-slate-800 dark:text-slate-200">{{ item.size || 'Non renseigné' }}</div>
                </div>

                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Adresse postale</div>
                  <div class="font-semibold text-slate-800 dark:text-slate-200">{{ item.address || 'Non renseignée' }}</div>
                </div>

                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Téléphone</div>
                  <div class="font-semibold text-slate-800 dark:text-slate-200">{{ item.phone || 'Non renseigné' }}</div>
                </div>

                <div class="sm:col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Site internet</div>
                  <div class="font-semibold text-[#0F766E] dark:text-cyan-400">
                    <a *ngIf="item.website" [href]="item.website.startsWith('http') ? item.website : 'https://' + item.website" target="_blank" class="hover:underline">
                      {{ item.website }}
                    </a>
                    <span *ngIf="!item.website" class="text-slate-500 dark:text-slate-400 font-normal">Non renseigné</span>
                  </div>
                </div>

                <div *ngIf="item.description" class="sm:col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Description / Présentation</div>
                  <p class="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">{{ item.description }}</p>
                </div>
              </div>
            </div>

            <!-- ── SEULEMENT POUR LES CANDIDATS : Informations sur le candidat ── -->
            <div *ngIf="!isCompany(item)" class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-2xs space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-white/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[#0F766E] dark:text-cyan-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <h2 class="text-sm font-bold text-slate-900 dark:text-white">Informations sur le candidat</h2>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Nom complet</div>
                  <div class="font-bold text-slate-900 dark:text-white">{{ item.candidatName || 'Non renseigné' }}</div>
                </div>

                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Email du compte</div>
                  <div class="font-semibold text-slate-800 dark:text-slate-200">{{ item.candidatEmail || 'Non renseigné' }}</div>
                </div>

                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Téléphone</div>
                  <div class="font-semibold text-slate-800 dark:text-slate-200">{{ item.phone || 'Non renseigné' }}</div>
                </div>

                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Adresse / Ville</div>
                  <div class="font-semibold text-slate-800 dark:text-slate-200">{{ item.address || 'Non renseignée' }}</div>
                </div>

                <div *ngIf="item.description" class="sm:col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Bio / Présentation</div>
                  <p class="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">{{ item.description }}</p>
                </div>
              </div>
            </div>

          </div>

          <!-- COLONNE DROITE (4 COLS) : Panneau Décision -->
          <div class="lg:col-span-4 space-y-4">
            <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-2xs space-y-4 sticky top-6">
              <div>
                <h2 class="text-sm font-bold text-slate-900 dark:text-white">Décision administrative</h2>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {{ isCompany(item) 
                    ? 'La validation débloque immédiatement la publication d\\'offres d\\'emploi pour cette entreprise.' 
                    : 'La validation certifie le profil et les documents académiques/professionnels du candidat.' }}
                </p>
              </div>

              <!-- Zone de feedback -->
              <div class="space-y-1.5">
                <label for="feedback" class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Feedback pour {{ isCompany(item) ? 'l\\'entreprise' : 'le candidat' }}
                </label>
                <textarea
                  id="feedback"
                  rows="4"
                  [(ngModel)]="decisionFeedback"
                  [placeholder]="isCompany(item) ? 'Documents vérifiés et conformes (RNE).' : 'Pièces justificatives vérifiées et conformes.'"
                  class="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] resize-none"
                ></textarea>
              </div>

              <!-- Messages d'état -->
              <div *ngIf="decisionSuccess" class="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                <span>{{ decisionSuccess }}</span>
              </div>

              <div *ngIf="decisionError" class="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
                <span>{{ decisionError }}</span>
              </div>

              <!-- Boutons de décision -->
              <div class="space-y-2 pt-1">
                <button
                  type="button"
                  (click)="validateAccount('VALIDE')"
                  [disabled]="actionLoading()"
                  class="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0d5d57] dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <svg *ngIf="!actionLoading()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                  <svg *ngIf="actionLoading()" width="14" height="14" class="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
                  <span>Valider le compte</span>
                </button>

                <button
                  type="button"
                  (click)="validateAccount('REJETE')"
                  [disabled]="actionLoading()"
                  class="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  <span>Rejeter</span>
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

      <!-- ════════════════════════════════════════════════════════════
           ══ VUE 2 : LISTE DES VÉRIFICATIONS (COHÉRENTE AVEC LA PLATEFORME) ══
           ════════════════════════════════════════════════════════════ -->
      <div *ngIf="!inspectedVerification()" class="space-y-5">
        
        <!-- En-tête de la page -->
        <div class="px-1 py-2">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">
                {{ todayFormatted }}
              </div>
              <h1 class="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Vérification des comptes
              </h1>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Dossiers entreprises et candidats en attente d'examen et comptes à certifier
              </p>
            </div>

            <button 
              type="button"
              (click)="loadAllData()"
              [disabled]="loading()"
              class="px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#0F766E] dark:bg-cyan-600 hover:bg-[#0d5d57] dark:hover:bg-cyan-700 transition-colors flex items-center gap-2 justify-center cursor-pointer disabled:opacity-60 shadow-2xs self-start lg:self-auto"
            >
              <svg width="14" height="14" [class.animate-spin]="loading()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path stroke-linecap="round" d="M3 3v5h5"/>
              </svg>
              <span>{{ loading() ? 'Actualisation…' : 'Actualiser' }}</span>
            </button>
          </div>
        </div>

        <!-- ── Barre de filtres (Pills de statut + Filtre type + Recherche) ── -->
        <div class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <!-- Filtres de Statut (Pills) -->
          <div class="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full">
            <button
              type="button"
              (click)="setStatusTab('ALL')"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              [ngClass]="statusTab() === 'ALL' ? 'bg-white dark:bg-[#0A1520] text-slate-900 dark:text-white shadow-2xs ring-1 ring-slate-200 dark:ring-white/10' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
            >
              <span>Tous</span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {{ allVerifications.length }}
              </span>
            </button>

            <button
              type="button"
              (click)="setStatusTab('EN_ATTENTE')"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              [ngClass]="statusTab() === 'EN_ATTENTE' ? 'bg-white dark:bg-[#0A1520] text-amber-700 dark:text-amber-400 shadow-2xs ring-1 ring-amber-200 dark:ring-amber-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
            >
              <span>En attente</span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
                {{ countByStatus('EN_ATTENTE') }}
              </span>
            </button>

            <button
              type="button"
              (click)="setStatusTab('REJETE')"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              [ngClass]="statusTab() === 'REJETE' ? 'bg-white dark:bg-[#0A1520] text-rose-700 dark:text-rose-400 shadow-2xs ring-1 ring-rose-200 dark:ring-rose-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
            >
              <span>Rejetés</span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400">
                {{ countByStatus('REJETE') }}
              </span>
            </button>

            <button
              type="button"
              (click)="setStatusTab('VALIDE')"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              [ngClass]="statusTab() === 'VALIDE' ? 'bg-white dark:bg-[#0A1520] text-emerald-700 dark:text-emerald-400 shadow-2xs ring-1 ring-emerald-200 dark:ring-emerald-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
            >
              <span>Validés</span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                {{ countByStatus('VALIDE') }}
              </span>
            </button>
          </div>

          <!-- Filtre par rôle & Barre de recherche -->
          <div class="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center w-full md:w-auto">
            <select
              [(ngModel)]="roleTypeFilter"
              (ngModelChange)="applyFilters()"
              class="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            >
              <option value="ALL">Tous types (Entreprises & Candidats)</option>
              <option value="COMPANY">Entreprises uniquement</option>
              <option value="CANDIDATE">Candidats uniquement</option>
            </select>

            <div class="relative w-full sm:w-64">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="m20 20-4-4"/></svg>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="applyFilters()"
                placeholder="Rechercher un compte, RNE…"
                class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>
          </div>
        </div>

        <!-- ── État Chargement ── -->
        <div *ngIf="loading()" class="py-16 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
          <div class="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-[#0F766E] dark:border-t-cyan-500 animate-spin mb-3"></div>
          <p class="text-xs font-medium">Chargement des dossiers de vérification…</p>
        </div>

        <!-- ── État Vide ── -->
        <div *ngIf="!loading() && filteredVerifications.length === 0" class="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl">
          <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="m20 20-4-4"/></svg>
          </div>
          <h3 class="font-display text-xl font-bold text-slate-900 dark:text-white mb-1">Aucun dossier trouvé</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 text-center max-w-sm mb-4">
            Aucun compte ne correspond aux filtres actuels.
          </p>
          <button (click)="resetFilters()" class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0F766E] dark:bg-cyan-600 hover:bg-[#0d5d57] transition-colors">
            Réinitialiser les filtres
          </button>
        </div>

        <!-- ── Tableau des comptes (Style RHConnect) ── -->
        <div *ngIf="!loading() && filteredVerifications.length > 0" class="bg-white dark:bg-[#0A1520] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xs">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50">
                  <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Compte</th>
                  <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Type de profil</th>
                  <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Justificatifs</th>
                  <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Statut</th>
                  <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Date soumission</th>
                  <th class="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  *ngFor="let v of paginatedVerifications; trackBy: trackById"
                  class="border-b border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <!-- Compte (Avatar + Nom + Email) -->
                  <td class="px-6 py-3.5">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg overflow-hidden border border-[#243E54] bg-[#172A3A] flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-500 dark:text-amber-400">
                        {{ getInitials(v.candidatName, v.candidatEmail) }}
                      </div>
                      <div class="min-w-0">
                        <div class="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {{ v.candidatName || 'Compte' }}
                        </div>
                        <div class="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                          {{ v.candidatEmail }}
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Type de profil -->
                  <td class="px-6 py-3.5">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                      {{ isCompany(v) ? (v.industry ? v.industry : 'Entreprise') : 'Candidat' }}
                    </span>
                  </td>

                  <!-- Justificatifs -->
                  <td class="px-6 py-3.5">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <ng-container *ngIf="v.pieces && v.pieces.length > 0; else noDoc">
                        <span 
                          *ngFor="let p of v.pieces.slice(0, 2)"
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          {{ p.type === 'RCA' ? 'RNE' : (p.type || 'DOC') }}
                        </span>
                        <span *ngIf="v.pieces.length > 2" class="text-[10px] text-slate-500 font-bold">
                          +{{ v.pieces.length - 2 }}
                        </span>
                      </ng-container>
                      <ng-template #noDoc>
                        <span class="text-slate-400 text-[11px] italic">Aucun document</span>
                      </ng-template>
                    </div>
                  </td>

                  <!-- Statut -->
                  <td class="px-6 py-3.5">
                    <span 
                      class="inline-flex items-center gap-1 text-xs font-semibold"
                      [ngClass]="getStatusTextClass(v.statut)"
                    >
                      <span *ngIf="v.statut === 'VALIDE'">✓ Validé</span>
                      <span *ngIf="v.statut === 'REJETE'">✕ Rejeté</span>
                      <span *ngIf="v.statut !== 'VALIDE' && v.statut !== 'REJETE'" class="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-500"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
                        En attente
                      </span>
                    </span>
                  </td>

                  <!-- Date soumission -->
                  <td class="px-6 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                    {{ formatSubmissionDate(v.createdAt) }}
                  </td>

                  <!-- Action : Bouton Inspecter -->
                  <td class="px-6 py-3.5 text-right">
                    <button
                      type="button"
                      (click)="inspectVerification(v)"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0F766E] dark:bg-cyan-600 hover:bg-[#0d5d57] dark:hover:bg-cyan-700 transition-colors shadow-2xs cursor-pointer"
                    >
                      <span>Inspecter</span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination RHConnect -->
          <div class="px-6 py-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div>
              {{ (currentPage - 1) * pageSize + 1 }} – {{ min(currentPage * pageSize, filteredVerifications.length) }} sur {{ filteredVerifications.length }} dossier(s)
            </div>

            <div class="flex items-center gap-4">
              <select 
                [(ngModel)]="pageSize" 
                (ngModelChange)="onPageSizeChange()"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none"
              >
                <option [value]="5">5 par page</option>
                <option [value]="10">10 par page</option>
                <option [value]="25">25 par page</option>
              </select>

              <div class="flex items-center gap-1">
                <button 
                  type="button" 
                  (click)="setPage(currentPage - 1)" 
                  [disabled]="currentPage === 1"
                  class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  ‹
                </button>
                <span class="px-3 py-1.5 rounded-lg font-bold bg-[#0F766E] text-white text-xs">
                  {{ currentPage }}
                </span>
                <button 
                  type="button" 
                  (click)="setPage(currentPage + 1)" 
                  [disabled]="currentPage >= totalPages"
                  class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class VerificationsComponent implements OnInit {
  private api = inject(AdminApiService);
  private auth = inject(AuthService);

  // Signaux d'état
  loading = signal(false);
  actionLoading = signal(false);
  inspectedVerification = signal<AdminVerification | null>(null);
  statusTab = signal<StatusFilter>('ALL');
  roleTypeFilter: RoleTypeFilter = 'ALL';

  // Données
  allVerifications: AdminVerification[] = [];
  filteredVerifications: AdminVerification[] = [];
  paginatedVerifications: AdminVerification[] = [];

  // Filtres & Pagination
  searchQuery = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  // Formulaire de décision
  decisionFeedback = '';
  decisionSuccess = '';
  decisionError = '';

  // Date du jour formatée
  todayFormatted = '';

  ngOnInit(): void {
    const now = new Date();
    this.todayFormatted = now.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).replace(/^\w/, (c) => c.toUpperCase());

    this.loadAllData();
  }

  loadAllData(): void {
    this.loading.set(true);
    this.api.getAllVerifications().subscribe({
      next: (data) => {
        this.allVerifications = data || [];
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        console.warn('Erreur getAllVerifications, fallback sur getPendingVerifications:', err);
        this.api.getPendingVerifications().subscribe({
          next: (pending) => {
            this.allVerifications = pending || [];
            this.applyFilters();
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      }
    });
  }

  setStatusTab(tab: StatusFilter): void {
    this.statusTab.set(tab);
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    const tab = this.statusTab();
    const roleType = this.roleTypeFilter;
    const q = this.searchQuery.trim().toLowerCase();

    this.filteredVerifications = this.allVerifications.filter((v) => {
      // Filtre statut
      if (tab === 'EN_ATTENTE') {
        const isPending = v.statut !== 'VALIDE' && v.statut !== 'REJETE';
        if (!isPending) return false;
      } else if (tab === 'REJETE') {
        if (v.statut !== 'REJETE') return false;
      } else if (tab === 'VALIDE') {
        if (v.statut !== 'VALIDE') return false;
      }

      // Filtre type (Entreprise vs Candidat)
      if (roleType === 'COMPANY' && !this.isCompany(v)) {
        return false;
      } else if (roleType === 'CANDIDATE' && this.isCompany(v)) {
        return false;
      }

      // Filtre recherche
      if (q) {
        const matchName = v.candidatName?.toLowerCase().includes(q);
        const matchEmail = v.candidatEmail?.toLowerCase().includes(q);
        const matchSiret = v.siret?.toLowerCase().includes(q);
        const matchIndustry = v.industry?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchSiret && !matchIndustry) {
          return false;
        }
      }

      return true;
    });

    this.totalPages = Math.max(1, Math.ceil(this.filteredVerifications.length / this.pageSize));
    this.updatePagination();
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedVerifications = this.filteredVerifications.slice(start, start + this.pageSize);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.totalPages = Math.max(1, Math.ceil(this.filteredVerifications.length / this.pageSize));
    this.updatePagination();
  }

  resetFilters(): void {
    this.statusTab.set('ALL');
    this.roleTypeFilter = 'ALL';
    this.searchQuery = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  inspectVerification(v: AdminVerification): void {
    this.inspectedVerification.set(v);
    this.decisionFeedback = v.commentaire || '';
    this.decisionSuccess = '';
    this.decisionError = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeInspection(): void {
    this.inspectedVerification.set(null);
    this.decisionSuccess = '';
    this.decisionError = '';
  }

  validateAccount(statut: 'VALIDE' | 'REJETE'): void {
    const current = this.inspectedVerification();
    if (!current) return;

    this.actionLoading.set(true);
    this.decisionSuccess = '';
    this.decisionError = '';

    const isComp = this.isCompany(current);
    const feedback = this.decisionFeedback.trim() || 
      (statut === 'VALIDE' 
        ? (isComp ? 'Documents d\'entreprise vérifiés et conformes (RNE).' : 'Documents d\'identité et attestations vérifiés et conformes.') 
        : (isComp ? 'Dossier d\'entreprise incomplet ou pièces RNE non conformes.' : 'Pièces justificatives rejetées. Veuillez déposer des documents conformes.'));

    const adminEmail = this.auth.user()?.email || '';

    this.api.validateVerification(current.id, statut, feedback, adminEmail).subscribe({
      next: (updated) => {
        this.actionLoading.set(false);
        this.decisionSuccess = statut === 'VALIDE' 
          ? (isComp ? 'Entreprise validée avec succès ! Le compte a été débloqué.' : 'Candidat certifié et validé avec succès !')
          : 'Le compte a été marqué comme rejeté.';

        // Mettre à jour l'élément inspecté et la liste
        current.statut = statut;
        current.commentaire = feedback;
        this.inspectedVerification.set({ ...current });

        const idx = this.allVerifications.findIndex(x => x.id === current.id);
        if (idx >= 0) {
          this.allVerifications[idx].statut = statut;
          this.allVerifications[idx].commentaire = feedback;
        }
        this.applyFilters();

        setTimeout(() => {
          this.closeInspection();
        }, 1200);
      },
      error: (err) => {
        this.actionLoading.set(false);
        console.error('Erreur validation:', err);
        this.decisionError = err?.error?.message || 'Une erreur est survenue lors de la validation.';
      }
    });
  }

  previewPiece(p: AdminVerificationDoc): void {
    const v = this.inspectedVerification();
    if (!v || !p?.id) return;
    const url = `http://localhost:8080/api/verifications/${v.id}/download/${p.id}`;
    window.open(url, '_blank');
  }

  downloadPiece(p: AdminVerificationDoc): void {
    const v = this.inspectedVerification();
    if (!v || !p?.id) return;
    this.api.downloadVerificationPiece(v.id, p.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = p.nomFichier || 'document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Erreur téléchargement pièce:', err)
    });
  }

  isCompany(v: AdminVerification): boolean {
    if (v.profileType === 'COMPANY') return true;
    if (v.profileType === 'CANDIDATE') return false;
    return !!v.siret || !!v.industry;
  }

  getInitials(name?: string, email?: string): string {
    const target = name || email || 'CO';
    const parts = target.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return target.substring(0, 2).toUpperCase();
  }

  formatSubmissionDate(dateStr?: string): string {
    if (!dateStr) return 'Date non renseignée';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  getStatusLabel(s?: string): string {
    if (s === 'VALIDE') return 'Validé';
    if (s === 'REJETE') return 'Rejeté';
    return 'En attente';
  }

  getStatusBadgeClass(s?: string): string {
    if (s === 'VALIDE') return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20';
    if (s === 'REJETE') return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-rose-200 dark:ring-rose-500/20';
    return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-500/20';
  }

  getStatusTextClass(s?: string): string {
    if (s === 'VALIDE') return 'text-emerald-600 dark:text-emerald-400';
    if (s === 'REJETE') return 'text-rose-600 dark:text-rose-400';
    return 'text-amber-600 dark:text-amber-400';
  }

  countByStatus(status: 'EN_ATTENTE' | 'REJETE' | 'VALIDE'): number {
    return this.allVerifications.filter((v) => {
      if (status === 'EN_ATTENTE') return v.statut !== 'VALIDE' && v.statut !== 'REJETE';
      return v.statut === status;
    }).length;
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  trackById(_index: number, item: AdminVerification): string {
    return item.id;
  }
}
