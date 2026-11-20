package com.rhconnect.controller;

import com.rhconnect.dto.response.NotificationResponse;
import com.rhconnect.service.UserNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Gestion des notifications utilisateur")
public class UserNotificationController {

    private final UserNotificationService userNotificationService;

    @GetMapping("/notifications")
    @PreAuthorize("hasAnyRole('CANDIDATE','COMPANY','RECRUITER')")
    @Operation(summary = "Mes notifications", description = "Retourne la liste des notifications du candidat ou company courant.")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications() {
        return ResponseEntity.ok(userNotificationService.getMyNotifications());
    }

    @PatchMapping("/notifications/read-all")
    @PreAuthorize("hasAnyRole('CANDIDATE','COMPANY','RECRUITER')")
    @Operation(summary = "Tout marquer comme lu", description = "Marque toutes les notifications de l'utilisateur courant comme lues.")
    public ResponseEntity<Void> markAllAsRead() {
        userNotificationService.markAllAsRead();
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/notifications/{id}")
    @PreAuthorize("hasAnyRole('CANDIDATE','COMPANY','RECRUITER')")
    @Operation(summary = "Supprimer une notification", description = "Supprime une notification appartenant à l'utilisateur courant.")
    public ResponseEntity<Void> deleteNotification(@PathVariable String id) {
        userNotificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/notifications")
    @PreAuthorize("hasAnyRole('CANDIDATE','COMPANY','RECRUITER')")
    @Operation(summary = "Supprimer toutes les notifications", description = "Supprime toutes les notifications de l'utilisateur courant.")
    public ResponseEntity<Void> deleteAllNotifications() {
        userNotificationService.deleteAllNotifications();
        return ResponseEntity.noContent().build();
    }

    /**
     * ADMIN ENDPOINTS
     */

    @GetMapping("/admin/notifications")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Notifications admin", description = "Retourne les notifications non lues pour l'admin courant.")
    public ResponseEntity<List<NotificationResponse>> getAdminNotifications() {
        return ResponseEntity.ok(userNotificationService.getAdminNotifications());
    }

    @GetMapping("/admin/notifications/count")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Compte des notifications non lues", description = "Retourne le nombre de notifications non lues pour l'admin courant.")
    public ResponseEntity<Map<String, Long>> getUnreadNotificationCount() {
        long count = userNotificationService.getUnreadNotificationCount();
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PatchMapping("/admin/notifications/{id}/read")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Marquer comme lu", description = "Marque une notification comme lue.")
    public ResponseEntity<Void> markAdminNotificationAsRead(@PathVariable String id) {
        userNotificationService.markNotificationAsRead(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/admin/notifications/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer une notification", description = "Supprime une notification admin.")
    public ResponseEntity<Void> deleteAdminNotification(@PathVariable String id) {
        userNotificationService.deleteAdminNotification(id);
        return ResponseEntity.noContent().build();
    }
}
