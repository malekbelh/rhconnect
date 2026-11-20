package com.rhconnect.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.*;

/**
 * Filtre HTTP qui applique le rate limiting sur les endpoints critiques.
 * Retourne 429 Too Many Requests si dépassé.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    private final RateLimitingService rateLimitingService;

    // Endpoints soumis au rate limiting
    private static final Map<String, String> RATE_LIMITED_ENDPOINTS = new HashMap<>();

    static {
        RATE_LIMITED_ENDPOINTS.put("/api/auth/login", "login");
        RATE_LIMITED_ENDPOINTS.put("/api/auth/register", "register");
        RATE_LIMITED_ENDPOINTS.put("/api/verifications/upload-piece", "upload");
        RATE_LIMITED_ENDPOINTS.put("/api/candidates/profile/upload-cv", "upload");
        RATE_LIMITED_ENDPOINTS.put("/api/companies/profile/upload-logo", "upload");
        RATE_LIMITED_ENDPOINTS.put("/api/ai", "ai");
        RATE_LIMITED_ENDPOINTS.put("/api/auth/refresh-token", "api_general");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        String path = request.getServletPath();
        String endpoint = null;

        // Trouver l'endpoint correspondant
        for (Map.Entry<String, String> entry : RATE_LIMITED_ENDPOINTS.entrySet()) {
            if (path.startsWith(entry.getKey())) {
                endpoint = entry.getValue();
                break;
            }
        }

        // Si c'est un endpoint rate-limited, vérifier le rate limit
        if (endpoint != null) {
            String identifier = getIdentifier(request);
            
            if (!rateLimitingService.isAllowed(identifier, endpoint)) {
                // Rate limit dépassé
                long remainingTokens = rateLimitingService.getRemainingTokens(identifier, endpoint);
                
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setHeader("Retry-After", "60");
                response.setHeader("X-RateLimit-Remaining", String.valueOf(remainingTokens));
                response.getWriter().write("{\"error\":\"Trop de requêtes. Veuillez réessayer plus tard.\",\"code\":\"RATE_LIMIT_EXCEEDED\"}");
                
                log.warn("Rate limit triggered - IP: {}, Endpoint: {}, User: {}", 
                    request.getRemoteAddr(), endpoint, identifier);
                return;
            }

            // Ajouter les headers de rate limit
            long remaining = rateLimitingService.getRemainingTokens(identifier, endpoint);
            response.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Récupère l'identifiant unique pour le rate limiting (IP ou userId si authentifié)
     */
    private String getIdentifier(HttpServletRequest request) {
        // Si l'utilisateur est authentifié, utiliser son ID
        String userIdHeader = request.getHeader("X-User-Id");
        if (userIdHeader != null && !userIdHeader.isEmpty()) {
            return "user:" + userIdHeader;
        }

        // Sinon, utiliser l'adresse IP (avec support X-Forwarded-For pour load balancer)
        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isEmpty()) {
            clientIp = request.getRemoteAddr();
        } else {
            // X-Forwarded-For peut contenir plusieurs IPs séparées par des virgules
            clientIp = clientIp.split(",")[0].trim();
        }

        return "ip:" + clientIp;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        // Ne pas filtrer les requêtes static/health check
        String path = request.getServletPath();
        return path.startsWith("/swagger-ui") || 
               path.startsWith("/v3/api-docs") ||
               path.startsWith("/actuator/health") ||
               path.startsWith("/static");
    }
}
