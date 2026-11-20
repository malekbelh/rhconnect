package com.rhconnect.audit;

import com.rhconnect.model.enums.Role;
import com.rhconnect.service.util.CurrentUserService;
import io.jsonwebtoken.Claims;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public AuditLog log(String action, String entityType, String entityId, Map<String, Object> details) {
        return log(action, entityType, entityId, details, null);
    }

    @Transactional
    public AuditLog log(String action, String entityType, String entityId, Map<String, Object> details, String ip) {
        try {
            String actorId = CurrentUserService.getCurrentUserId();
            String actorEmail = CurrentUserService.getCurrentUserEmail();
            String actorRole = extractCurrentRole();

            return doLog(actorId, actorEmail, actorRole, action, entityType, entityId, details, ip);
        } catch (Exception e) {
            log.error("Erreur lors de la création du log audit", e);
            return null;
        }
    }

    @Transactional
    public AuditLog logAsUser(String actorId, String actorEmail, List<Role> actorRoles,
                               String action, String entityType, String entityId,
                               Map<String, Object> details, String ip) {
        try {
            String actorRole = actorRoles != null && !actorRoles.isEmpty()
                    ? actorRoles.get(0).name()
                    : null;
            return doLog(actorId, actorEmail, actorRole, action, entityType, entityId, details, ip);
        } catch (Exception e) {
            log.error("Erreur lors de la création du log audit pour user {}", actorId, e);
            return null;
        }
    }

    private AuditLog doLog(String actorId, String actorEmail, String actorRole,
                           String action, String entityType, String entityId,
                           Map<String, Object> details, String ip) {
        AuditLog auditLog = AuditLog.builder()
                .actorId(actorId)
                .actorEmail(actorEmail)
                .actorRole(actorRole)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details != null ? details : new HashMap<>())
                .ip(ip)
                .timestamp(Instant.now())
                .build();

        return auditLogRepository.save(auditLog);
    }

    private String extractCurrentRole() {
        Claims claims = CurrentUserService.getCurrentClaims();
        if (claims != null) {
            Object rolesObj = claims.get("roles");
            if (rolesObj instanceof List<?> rolesList && !rolesList.isEmpty()) {
                Object first = rolesList.get(0);
                if (first instanceof String s) {
                    return s;
                }
            }
        }
        return null;
    }

    public static boolean hasPrivilegedRole(List<Role> roles) {
        if (roles == null) return false;
        return roles.contains(Role.ADMIN) || roles.contains(Role.RECRUITER);
    }
}
