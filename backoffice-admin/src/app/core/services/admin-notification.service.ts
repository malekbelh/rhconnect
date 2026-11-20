import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  read: boolean;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminNotificationService {

  private notificationsSubject = new BehaviorSubject<AdminNotification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.startPolling();
  }

  /**
   * Récupère les notifications non lues pour l'admin
   */
  getAdminNotifications(): Observable<AdminNotification[]> {
    return this.http.get<AdminNotification[]>('/api/admin/notifications')
      .pipe(
        tap(notifications => this.notificationsSubject.next(notifications)),
        catchError(error => {
          console.error('Erreur lors de la récupération des notifications:', error);
          return of([]);
        })
      );
  }

  /**
   * Récupère le nombre de notifications non lues
   */
  getUnreadCount(): Observable<number> {
    return this.http.get<UnreadCountResponse>('/api/admin/notifications/count')
      .pipe(
        map(response => response.unreadCount),
        tap(count => this.unreadCountSubject.next(count)),
        catchError(error => {
          console.error('Erreur lors de la récupération du nombre de notifications:', error);
          return of(0);
        })
      );
  }

  /**
   * Marque une notification comme lue
   */
  markAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(`/api/admin/notifications/${notificationId}/read`, {})
      .pipe(
        tap(() => {
          const notifications = this.notificationsSubject.value;
          const updated = notifications.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          );
          this.notificationsSubject.next(updated);
          // Mettre à jour le nombre de notifications non lues
          const unreadCount = this.unreadCountSubject.value - 1;
          this.unreadCountSubject.next(Math.max(0, unreadCount));
        }),
        catchError(error => {
          console.error('Erreur lors du marquage comme lu:', error);
          return of(undefined);
        })
      );
  }

  /**
   * Supprime une notification
   */
  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/notifications/${notificationId}`)
      .pipe(
        tap(() => {
          const notifications = this.notificationsSubject.value
            .filter(n => n.id !== notificationId);
          this.notificationsSubject.next(notifications);
          // Mettre à jour le nombre de notifications non lues
          const unreadCount = this.unreadCountSubject.value - 1;
          this.unreadCountSubject.next(Math.max(0, unreadCount));
        }),
        catchError(error => {
          console.error('Erreur lors de la suppression:', error);
          return of(undefined);
        })
      );
  }

  /**
   * Lance le polling des notifications toutes les 30 secondes
   */
  private startPolling(): void {
    // Charge les notifications au démarrage
    this.loadNotifications();

    // Puis poll toutes les 30 secondes
    interval(30000)
      .pipe(
        switchMap(() => this.getUnreadCount())
      )
      .subscribe({
        next: (count) => {
          // Si le nombre a changé, recharger les notifications
          if (count > this.unreadCountSubject.value) {
            this.loadNotifications();
          }
        },
        error: (error) => console.error('Erreur dans le polling:', error)
      });
  }

  /**
   * Charge les notifications et met à jour les observables
   */
  private loadNotifications(): void {
    this.getAdminNotifications().subscribe();
    this.getUnreadCount().subscribe();
  }

  /**
   * Retourne les notifications actuelles
   */
  getCurrentNotifications(): AdminNotification[] {
    return this.notificationsSubject.value;
  }

  /**
   * Retourne le nombre actuel de notifications non lues
   */
  getCurrentUnreadCount(): number {
    return this.unreadCountSubject.value;
  }
}
