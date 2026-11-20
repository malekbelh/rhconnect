package com.rhconnect.security;

import com.rhconnect.util.XssSanitizer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.*;

/**
 * Filtre HTTP qui détecte et log les tentatives d'injection XSS.
 * Prévient les attaques XSS simples au niveau du requête.
 * 
 * IMPORTANT: C'est une couche supplémentaire. La sanitization principale
 * se fait dans XssSanitizationAspect au niveau des DTOs.
 */
@Component
@Slf4j
public class XssFilter extends OncePerRequestFilter {

    private static final Set<String> XSS_PATTERNS = new HashSet<>(Arrays.asList(
        "<script", "javascript:", "onerror=", "onload=", "onclick=", 
        "onmouseover=", "onfocus=", "onblur=", "<iframe", "<object",
        "eval(", "expression(", "<img", "alert("
    ));

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        // Vérifier les paramètres de requête pour détecter les tentatives XSS
        Enumeration<String> parameterNames = request.getParameterNames();
        
        while (parameterNames.hasMoreElements()) {
            String paramName = parameterNames.nextElement();
            String paramValue = request.getParameter(paramName);
            
            if (containsXssPattern(paramValue)) {
                log.warn("Tentative XSS détectée - Paramètre: {}, Valeur: {}, IP: {}", 
                    paramName, 
                    truncateForLog(paramValue), 
                    request.getRemoteAddr());
            }
        }

        // Vérifier le header Referer pour détecter les attaques
        String referer = request.getHeader("Referer");
        if (containsXssPattern(referer)) {
            log.warn("Tentative XSS dans Referer header - Valeur: {}, IP: {}", 
                truncateForLog(referer), 
                request.getRemoteAddr());
        }

        // Continuer la chaîne des filtres
        filterChain.doFilter(request, response);
    }

    /**
     * Vérifie si la chaîne contient des patterns XSS connus
     */
    private boolean containsXssPattern(String value) {
        if (value == null || value.isEmpty()) {
            return false;
        }

        String lowerValue = value.toLowerCase();
        for (String pattern : XSS_PATTERNS) {
            if (lowerValue.contains(pattern)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Tronque le texte pour le logging (limiter la taille des logs)
     */
    private String truncateForLog(String value) {
        if (value == null) {
            return "";
        }
        return value.length() > 100 ? value.substring(0, 100) + "..." : value;
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
