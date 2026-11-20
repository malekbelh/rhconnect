import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminNotification, AdminNotificationService } from '../services/admin-notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-panel-container">
      <!-- Empty State -->
      <div *ngIf="notifications.length === 0" class="empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-slate-300 dark:text-slate-600">
          <path stroke-linecap="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path stroke-linecap="round" d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <p class="empty-state-text">Aucune notification</p>
      </div>

      <!-- Notifications List -->
      <div *ngIf="notifications.length > 0" class="notifications-list">
        <div *ngFor="let notif of notifications" 
             [class]="'notification-item ' + (notif.read ? 'read' : 'unread')">
          <!-- Notification Content -->
          <div class="notification-content" (click)="openNotification(notif)">
            <div class="notification-header">
              <h4 class="notification-title">{{ notif.title }}</h4>
              <span *ngIf="!notif.read" class="unread-badge">Nouveau</span>
            </div>
            <p class="notification-message">{{ notif.message }}</p>
            <span class="notification-date">{{ formatDate(notif.createdAt) }}</span>
          </div>

          <!-- Action Buttons -->
          <div class="notification-actions">
            <button *ngIf="!notif.read" 
                    class="action-btn mark-read"
                    (click)="markAsRead(notif.id).subscribe()"
                    title="Marquer comme lu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
            <button class="action-btn delete"
                    (click)="deleteNotification(notif.id).subscribe()"
                    title="Supprimer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-panel-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
      border-radius: 12px;
      overflow: hidden;
    }

    :host-context(.dark) .notification-panel-container {
      background: #0A1520;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 12px;
      padding: 24px;
      color: #94a3b8;
    }

    .empty-state-text {
      font-size: 14px;
      color: #94a3b8;
    }

    :host-context(.dark) .empty-state-text {
      color: #64748b;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      height: 100%;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      transition: background-color 0.2s;
    }

    :host-context(.dark) .notification-item {
      border-bottom-color: #1e293b;
    }

    .notification-item:hover {
      background-color: #f8fafc;
    }

    :host-context(.dark) .notification-item:hover {
      background-color: #1a2536;
    }

    .notification-item.unread {
      background-color: #f0f9ff;
    }

    :host-context(.dark) .notification-item.unread {
      background-color: #082f49;
    }

    .notification-content {
      flex: 1;
      cursor: pointer;
      min-width: 0;
    }

    .notification-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .notification-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
      flex: 1;
    }

    :host-context(.dark) .notification-title {
      color: #f1f5f9;
    }

    .unread-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      color: white;
      background-color: #e11d48;
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
    }

    .notification-message {
      font-size: 13px;
      color: #64748b;
      margin: 4px 0;
      line-height: 1.4;
    }

    :host-context(.dark) .notification-message {
      color: #cbd5e1;
    }

    .notification-date {
      font-size: 11px;
      color: #94a3b8;
    }

    :host-context(.dark) .notification-date {
      color: #64748b;
    }

    .notification-actions {
      display: flex;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .notification-item:hover .notification-actions {
      opacity: 1;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border: none;
      border-radius: 6px;
      background-color: transparent;
      cursor: pointer;
      color: #64748b;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background-color: #e2e8f0;
      color: #1e293b;
    }

    :host-context(.dark) .action-btn:hover {
      background-color: #1e293b;
      color: #f1f5f9;
    }

    .action-btn.delete:hover {
      background-color: #fee2e2;
      color: #dc2626;
    }

    :host-context(.dark) .action-btn.delete:hover {
      background-color: #7f1d1d;
      color: #fca5a5;
    }
  `]
})
export class NotificationPanelComponent implements OnInit {
  @Input() notifications: AdminNotification[] = [];
  @Output() close = new EventEmitter<void>();

  private notificationService = inject(AdminNotificationService);
  private router = inject(Router);

  ngOnInit(): void {
    // Load notifications
    this.notificationService.getAdminNotifications().subscribe();
  }

  markAsRead(notificationId: string) {
    return this.notificationService.markAsRead(notificationId);
  }

  deleteNotification(notificationId: string) {
    return this.notificationService.deleteNotification(notificationId);
  }

  openNotification(notif: AdminNotification): void {
    if (notif.link) {
      this.notificationService.markAsRead(notif.id).subscribe(() => {
        this.router.navigate([notif.link]);
        this.close.emit();
      });
    }
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'À l\'instant';
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      if (diffHours < 24) return `Il y a ${diffHours}h`;
      if (diffDays < 7) return `Il y a ${diffDays}j`;
      
      return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
    } catch {
      return 'Récemment';
    }
  }
}
