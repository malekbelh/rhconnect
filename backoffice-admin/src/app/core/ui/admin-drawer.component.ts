import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';

/**
 * Generic slide-in drawer used by pages that still rely on the shared component.
 * Pages rewritten with inline drawers (Users, Offers, Applications, Verifications, Settings)
 * no longer import this component but it stays for backward compatibility.
 */
@Component({
  selector: 'app-admin-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="open">
      <!-- Overlay -->
      <div class="drawer-overlay" (click)="close()" aria-hidden="true"></div>

      <!-- Panel -->
      <aside
        #drawer
        class="drawer-panel"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title"
        tabindex="-1"
        (click)="$event.stopPropagation()"
      >
        <!-- Head -->
        <div class="drawer-head">
          <div>
            <div class="drawer-eyebrow" *ngIf="eyebrow">{{ eyebrow }}</div>
            <h2 class="drawer-title">{{ title }}</h2>
          </div>
          <button class="drawer-close" type="button" aria-label="Fermer" (click)="close()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="drawer-body">
          <ng-content select="[drawer-body]"></ng-content>
        </div>

        <!-- Footer -->
        <div class="drawer-footer">
          <ng-content select="[drawer-actions]"></ng-content>
        </div>
      </aside>
    </ng-container>
  `,
  styles: [`
    /* These styles mirror shared-admin.css drawer vars for standalone usage */
    .drawer-overlay {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(13,27,42,.4);
      backdrop-filter: blur(2px);
      animation: fade-in .18s ease;
    }
    .drawer-panel {
      position: fixed; top: 0; right: 0; z-index: 201;
      width: min(480px, 96vw); height: 100vh;
      display: flex; flex-direction: column;
      background: #fff;
      border-left: 1.5px solid #E2E8F0;
      box-shadow: -20px 0 60px rgba(13,27,42,.14);
      animation: slide-in .22s cubic-bezier(.22,1,.36,1);
      outline: none;
    }
    .drawer-head {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
      padding: 24px 26px 20px;
      border-bottom: 1.5px solid #F1F5F9;
    }
    .drawer-eyebrow {
      font-size: .7rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
      color: #6C63FF; margin-bottom: 5px;
    }
    .drawer-title { font-family: 'Sora','Inter',sans-serif; font-size: 1.15rem; font-weight: 800; color: #0D1B2A; margin: 0; word-break: break-all; }
    .drawer-close {
      display: grid; place-items: center; width: 32px; height: 32px;
      border: 1.5px solid #E2E8F0; border-radius: 8px; background: #fff; color: #64748B;
      cursor: pointer; flex-shrink: 0; transition: all .12s;
    }
    .drawer-close:hover { border-color: #6C63FF; color: #6C63FF; }
    .drawer-body  { flex: 1; overflow-y: auto; padding: 24px 26px; }
    .drawer-footer {
      padding: 16px 26px 24px;
      border-top: 1.5px solid #F1F5F9;
      display: flex; flex-direction: column; gap: 8px;
    }
    :host ::ng-deep .drawer-footer > div { display: flex; flex-direction: column; gap: 8px; }
    :host ::ng-deep .drawer-footer button { width: 100%; }
    :host ::ng-deep .detail-list { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
    :host ::ng-deep .detail-list dt { color: #64748B; font-size: .8rem; }
    :host ::ng-deep .detail-list dd { margin: 0; color: #0D1B2A; font-weight: 700; font-size: .85rem; text-align: right; word-break: break-word; }
    :host ::ng-deep .timeline { border-left: 2px solid #6C63FF40; margin-top: 14px; padding-left: 16px; }
    :host ::ng-deep .timeline > div { position: relative; display: flex; flex-direction: column; gap: 4px; padding: 0 0 16px; }
    :host ::ng-deep .timeline > div::before { content:''; position: absolute; left:-22px; top:4px; width:8px; height:8px; border-radius:50%; background:#6C63FF; }
    :host ::ng-deep .timeline b { font-size:.83rem; color:#0D1B2A; }
    :host ::ng-deep .timeline span, :host ::ng-deep .timeline small, :host ::ng-deep .muted { color:#64748B; font-size:.78rem; }
    :host ::ng-deep .btn-action { display:flex; align-items:center; gap:7px; padding:9px 16px; border-radius:10px; font-size:.84rem; font-weight:600; cursor:pointer; transition:all .12s; width:100%; justify-content:center; }
    :host ::ng-deep .btn-deactivate { background:#FFF1F3; border:1.5px solid #FECDD3; color:#9F1239; }
    :host ::ng-deep .btn-activate   { background:#ECFDF5; border:1.5px solid #A7F3D0; color:#065F46; }
    :host ::ng-deep .role-badge { display:inline-flex; align-items:center; padding:3px 10px; border-radius:999px; font-size:.72rem; font-weight:700; }

    @keyframes fade-in  { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @media (prefers-reduced-motion: reduce) {
      .drawer-overlay, .drawer-panel { animation: none; }
    }
  `]
})
export class AdminDrawerComponent implements OnChanges {
  @Input() open = false;
  @Input() title = '';
  @Input() eyebrow = '';
  @Output() closed = new EventEmitter<void>();
  @ViewChild('drawer') drawer?: ElementRef<HTMLElement>;

  ngOnChanges(c: SimpleChanges): void {
    if (c['open']?.currentValue) setTimeout(() => this.drawer?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.open) this.close(); }

  close(): void { this.closed.emit(); }
}
