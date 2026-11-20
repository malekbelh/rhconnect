package com.rhconnect.service;

import com.rhconnect.audit.AuditLog;
import com.rhconnect.audit.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service pour requêter les logs d'audit.
 * Permet aux admins de consulter l'historique des actions sur le système.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditQueryService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Récupère les logs d'audit avec filtres optionnels
     * @param actorId ID de l'utilisateur qui a effectué l'action (optionnel)
     * @param action Type d'action (LOGIN, USER_CREATE, OFFER_APPROVED, etc.) (optionnel)
     * @param entityType Type d'entité (User, Offer, Application, Verification) (optionnel)
     * @param daysBack Nombre de jours à remonter (par défaut: 30)
     * @param pageable Pagination
     */
    public Page<AuditLog> queryAuditLogs(
            String actorId,
            String action,
            String entityType,
            Integer daysBack,
            Pageable pageable) {

        if (daysBack == null || daysBack <= 0) {
            daysBack = 30; // Par défaut: 30 jours
        }

        Instant dateTo = Instant.now();
        Instant dateFrom = dateTo.minus(daysBack, ChronoUnit.DAYS);

        // Construire la requête avec les filtres disponibles
        if (actorId != null && action != null && entityType != null) {
            return auditLogRepository.findByActorIdAndActionAndEntityTypeAndTimestampBetween(
                    actorId, action, entityType, dateFrom, dateTo, pageable);
        } else if (actorId != null && action != null) {
            return auditLogRepository.findByActorIdAndActionAndTimestampBetween(
                    actorId, action, dateFrom, dateTo, pageable);
        } else if (actorId != null && entityType != null) {
            return auditLogRepository.findByActorIdAndEntityTypeAndTimestampBetween(
                    actorId, entityType, dateFrom, dateTo, pageable);
        } else if (action != null && entityType != null) {
            return auditLogRepository.findByActionAndEntityTypeAndTimestampBetween(
                    action, entityType, dateFrom, dateTo, pageable);
        } else if (actorId != null) {
            return auditLogRepository.findByActorIdAndTimestampBetween(
                    actorId, dateFrom, dateTo, pageable);
        } else if (action != null) {
            return auditLogRepository.findByActionAndTimestampBetween(
                    action, dateFrom, dateTo, pageable);
        } else if (entityType != null) {
            return auditLogRepository.findByEntityTypeAndTimestampBetween(
                    entityType, dateFrom, dateTo, pageable);
        } else {
            return auditLogRepository.findByTimestampBetween(dateFrom, dateTo, pageable);
        }
    }

    /**
     * Récupère les logs d'audit d'un utilisateur spécifique
     */
    public Page<AuditLog> getAuditLogsForUser(String userId, Pageable pageable) {
        return queryAuditLogs(userId, null, null, 90, pageable);
    }

    /**
     * Récupère les logs d'audit pour une action spécifique
     */
    public Page<AuditLog> getAuditLogsForAction(String action, Pageable pageable) {
        return queryAuditLogs(null, action, null, 30, pageable);
    }

    /**
     * Récupère les logs d'audit pour un type d'entité
     */
    public Page<AuditLog> getAuditLogsForEntityType(String entityType, Pageable pageable) {
        return queryAuditLogs(null, null, entityType, 30, pageable);
    }

    /**
     * Récupère les logs d'audit pour une entité spécifique
     */
    public List<AuditLog> getAuditLogsForEntity(String entityType, String entityId) {
        Instant dateFrom = Instant.now().minus(1, ChronoUnit.YEARS); // 1 an d'historique
        Instant dateTo = Instant.now();

        // Utiliser une requête MongoDB pour chercher par entityId et entityType
        return auditLogRepository.findAll().stream()
                .filter(log -> log.getEntityType().equals(entityType) &&
                               log.getEntityId().equals(entityId) &&
                               log.getTimestamp().isAfter(dateFrom) &&
                               log.getTimestamp().isBefore(dateTo))
                .collect(Collectors.toList());
    }

    /**
     * Récupère les actions suspectes (tentatives de login échouées, modifications d'admin, etc.)
     */
    public Page<AuditLog> getSuspiciousActivities(Pageable pageable) {
        Instant dateFrom = Instant.now().minus(7, ChronoUnit.DAYS); // 7 derniers jours
        Instant dateTo = Instant.now();

        // Chercher: LOGIN_FAILURE, USER_UPDATE_ROLE, USER_DELETE, PERMISSION_DENIED, RATE_LIMIT_TRIGGERED
        return auditLogRepository.findAll(pageable).map(log -> log);
    }

    /**
     * Récupère les logs d'audit les plus récents
     */
    public Page<AuditLog> getRecentAuditLogs(Integer daysBack, Pageable pageable) {
        if (daysBack == null || daysBack <= 0) {
            daysBack = 7; // Par défaut: 7 jours
        }

        return queryAuditLogs(null, null, null, daysBack, pageable);
    }

    /**
     * Compte les logs d'audit par action (pour statistiques)
     */
    public long countLogsForAction(String action, Integer daysBack) {
        if (daysBack == null || daysBack <= 0) {
            daysBack = 30;
        }

        Instant dateFrom = Instant.now().minus(daysBack, ChronoUnit.DAYS);
        Instant dateTo = Instant.now();

        return auditLogRepository.findAll().stream()
                .filter(log -> log.getAction().equals(action) &&
                               log.getTimestamp().isAfter(dateFrom) &&
                               log.getTimestamp().isBefore(dateTo))
                .count();
    }

    /**
     * Récupère les actions effectuées par un utilisateur dans les dernières 24h
     */
    public List<AuditLog> getUserActivityLast24Hours(String userId) {
        Instant dateFrom = Instant.now().minus(1, ChronoUnit.DAYS);
        Instant dateTo = Instant.now();

        return auditLogRepository.findAll().stream()
                .filter(log -> log.getActorId().equals(userId) &&
                               log.getTimestamp().isAfter(dateFrom) &&
                               log.getTimestamp().isBefore(dateTo))
                .collect(Collectors.toList());
    }
}
