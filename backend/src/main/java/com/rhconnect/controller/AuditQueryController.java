package com.rhconnect.controller;

import com.rhconnect.audit.AuditLog;
import com.rhconnect.dto.response.ApiResponse;
import com.rhconnect.service.AuditQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Endpoints pour interroger les logs d'audit (admin uniquement)
 */
@RestController
@RequestMapping("/api/admin/audit-query")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Audit", description = "Endpoints de consultation des logs d'audit (admin)")
public class AuditQueryController {

    private final AuditQueryService auditQueryService;

    /**
     * Récupère les logs d'audit avec filtres optionnels
     */
    @GetMapping("/logs")
    @Operation(summary = "Consulter les logs d'audit",
               description = "Récupère les logs d'audit avec filtres optionnels (acteur, action, type entité, période)")
    public ResponseEntity<Page<AuditLog>> queryAuditLogs(
            @Parameter(description = "ID de l'utilisateur qui a effectué l'action")
            @RequestParam(required = false) String actorId,
            
            @Parameter(description = "Type d'action (LOGIN_SUCCESS, USER_CREATE, OFFER_APPROVED, etc.)")
            @RequestParam(required = false) String action,
            
            @Parameter(description = "Type d'entité (User, Offer, Application, Verification)")
            @RequestParam(required = false) String entityType,
            
            @Parameter(description = "Nombre de jours à remonter (défaut: 30)")
            @RequestParam(required = false, defaultValue = "30") Integer daysBack,
            
            @PageableDefault(size = 50) Pageable pageable) {
        
        Page<AuditLog> logs = auditQueryService.queryAuditLogs(actorId, action, entityType, daysBack, pageable);
        return ResponseEntity.ok(logs);
    }

    /**
     * Récupère les logs d'audit d'un utilisateur spécifique
     */
    @GetMapping("/user/{userId}")
    @Operation(summary = "Logs d'audit d'un utilisateur",
               description = "Récupère tous les logs d'audit générés par un utilisateur spécifique")
    public ResponseEntity<Page<AuditLog>> getUserAuditLogs(
            @PathVariable String userId,
            @PageableDefault(size = 50) Pageable pageable) {
        
        Page<AuditLog> logs = auditQueryService.getAuditLogsForUser(userId, pageable);
        return ResponseEntity.ok(logs);
    }

    /**
     * Récupère les logs d'audit pour une action spécifique
     */
    @GetMapping("/action/{action}")
    @Operation(summary = "Logs pour une action spécifique",
               description = "Récupère tous les logs pour une action donnée (ex: LOGIN_SUCCESS, USER_DELETE)")
    public ResponseEntity<Page<AuditLog>> getActionAuditLogs(
            @PathVariable String action,
            @PageableDefault(size = 50) Pageable pageable) {
        
        Page<AuditLog> logs = auditQueryService.getAuditLogsForAction(action, pageable);
        return ResponseEntity.ok(logs);
    }

    /**
     * Récupère les logs d'audit pour un type d'entité
     */
    @GetMapping("/entity-type/{entityType}")
    @Operation(summary = "Logs pour un type d'entité",
               description = "Récupère tous les logs pour un type d'entité donné (User, Offer, Application, etc.)")
    public ResponseEntity<Page<AuditLog>> getEntityTypeAuditLogs(
            @PathVariable String entityType,
            @PageableDefault(size = 50) Pageable pageable) {
        
        Page<AuditLog> logs = auditQueryService.getAuditLogsForEntityType(entityType, pageable);
        return ResponseEntity.ok(logs);
    }

    /**
     * Récupère l'historique complet d'une entité spécifique
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    @Operation(summary = "Historique d'une entité",
               description = "Récupère tous les changements effectués sur une entité spécifique (user, offer, application, etc.)")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getEntityHistory(
            @PathVariable String entityType,
            @PathVariable String entityId) {
        
        List<AuditLog> logs = auditQueryService.getAuditLogsForEntity(entityType, entityId);
        return ResponseEntity.ok(ApiResponse.success(logs, "Historique de l'entité " + entityType + "#" + entityId));
    }

    /**
     * Récupère les logs des 7 derniers jours (activité récente)
     */
    @GetMapping("/recent")
    @Operation(summary = "Activité récente",
               description = "Récupère tous les logs des 7 derniers jours")
    public ResponseEntity<Page<AuditLog>> getRecentActivityLogs(
            @RequestParam(required = false, defaultValue = "7") Integer daysBack,
            @PageableDefault(size = 50) Pageable pageable) {
        
        Page<AuditLog> logs = auditQueryService.getRecentAuditLogs(daysBack, pageable);
        return ResponseEntity.ok(logs);
    }

    /**
     * Récupère les actions suspectes (tentatives échouées, modifications admin, etc.)
     */
    @GetMapping("/suspicious")
    @Operation(summary = "Activités suspectes",
               description = "Récupère les logs potentiellement suspects (LOGIN_FAILURE, PERMISSION_DENIED, etc.)")
    public ResponseEntity<Page<AuditLog>> getSuspiciousActivityLogs(
            @PageableDefault(size = 50) Pageable pageable) {
        
        Page<AuditLog> logs = auditQueryService.getSuspiciousActivities(pageable);
        return ResponseEntity.ok(logs);
    }

    /**
     * Récupère les actions d'un utilisateur dans les dernières 24h
     */
    @GetMapping("/user/{userId}/last-24h")
    @Operation(summary = "Activité utilisateur (24h)",
               description = "Récupère toutes les actions d'un utilisateur dans les dernières 24 heures")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getUserActivity24Hours(
            @PathVariable String userId) {
        
        List<AuditLog> logs = auditQueryService.getUserActivityLast24Hours(userId);
        return ResponseEntity.ok(ApiResponse.success(logs, "Activité de " + userId + " (dernières 24h)"));
    }

    /**
     * Récupère les statistiques d'audit (compte des actions)
     */
    @GetMapping("/stats")
    @Operation(summary = "Statistiques d'audit",
               description = "Récupère des statistiques sur les actions auditées")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getAuditStats(
            @RequestParam(required = false, defaultValue = "30") Integer daysBack) {
        
        // Exemples d'actions à compter
        String[] actions = {
            "LOGIN_SUCCESS", "LOGIN_FAILURE", 
            "USER_CREATE", "USER_DELETE", "USER_UPDATE_ROLE",
            "OFFER_APPROVED", "OFFER_REJECTED",
            "APPLICATION_STATUS_CHANGED",
            "VERIFICATION_VALIDATED", "VERIFICATION_REJECTED"
        };

        Map<String, Long> stats = new java.util.HashMap<>();
        for (String action : actions) {
            long count = auditQueryService.countLogsForAction(action, daysBack);
            if (count > 0) {
                stats.put(action, count);
            }
        }

        return ResponseEntity.ok(ApiResponse.success(stats, "Statistiques d'audit (derniers " + daysBack + " jours)"));
    }

    /**
     * Récupère les logs d'audit (endpoint générique)
     */
    @GetMapping
    @Operation(summary = "Tous les logs d'audit",
               description = "Récupère tous les logs d'audit (derniers 30 jours)")
    public ResponseEntity<Page<AuditLog>> getAllAuditLogs(
            @PageableDefault(size = 50) Pageable pageable) {
        
        Page<AuditLog> logs = auditQueryService.getRecentAuditLogs(30, pageable);
        return ResponseEntity.ok(logs);
    }
}
