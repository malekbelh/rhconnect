package com.rhconnect.audit;

import com.rhconnect.service.util.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditService auditService;

    @Around("@annotation(auditAnnotation)")
    public Object aroundAudit(ProceedingJoinPoint joinPoint, Audit auditAnnotation) throws Throwable {
        Object result = joinPoint.proceed();

        try {
            processAudit(joinPoint, auditAnnotation);
        } catch (Exception e) {
            log.error("Erreur lors du traitement de l'audit pour action={}", auditAnnotation.action(), e);
        }

        return result;
    }

    private void processAudit(ProceedingJoinPoint joinPoint, Audit auditAnnotation) {
        try {
            if (!CurrentUserService.isAuthenticated()) {
                log.debug("Aucun utilisateur authentifié, skip audit pour action={}", auditAnnotation.action());
                return;
            }

            String action = auditAnnotation.action();
            String entityType = auditAnnotation.entityType();
            String entityId = null;

            if (auditAnnotation.captureEntityIdFromArg()) {
                Object[] args = joinPoint.getArgs();
                int idx = auditAnnotation.entityIdArgIndex();
                if (idx >= 0 && idx < args.length && args[idx] != null) {
                    entityId = String.valueOf(args[idx]);
                }
            }

            Map<String, Object> details = buildDetails(joinPoint);

            String ip = extractClientIp();

            auditService.log(action, entityType, entityId, details, ip);

        } catch (Exception e) {
            log.error("Erreur fatale dans processAudit, action={} - on continue sans log",
                    auditAnnotation.action(), e);
        }
    }

    private Map<String, Object> buildDetails(ProceedingJoinPoint joinPoint) {
        Map<String, Object> details = new HashMap<>();
        try {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            String[] paramNames = signature.getParameterNames();
            Object[] args = joinPoint.getArgs();

            details.put("method", signature.getDeclaringTypeName() + "." + signature.getName());

            if (paramNames != null && args != null) {
                Map<String, Object> argsMap = new HashMap<>();
                for (int i = 0; i < paramNames.length; i++) {
                    Object val = args[i];
                    if (isSafeToLog(val)) {
                        argsMap.put(paramNames[i], String.valueOf(val));
                    } else {
                        argsMap.put(paramNames[i], "[REDACTED]");
                    }
                }
                details.put("args", argsMap);
            }
        } catch (Exception e) {
            log.warn("Impossible de construire les details d'audit", e);
        }
        return details;
    }

    private boolean isSafeToLog(Object val) {
        if (val == null) return true;
        String className = val.getClass().getSimpleName().toLowerCase();
        String strVal = String.valueOf(val).toLowerCase();
        return !className.contains("password")
                && !className.contains("secret")
                && !strVal.contains("password");
    }

    private String extractClientIp() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                    return xForwardedFor.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception e) {
            log.debug("Impossible d'extraire l'IP client", e);
        }
        return null;
    }
}
