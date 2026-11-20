package com.rhconnect.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Configuration des headers de sécurité HTTP.
 * Ajoute les headers pour prévenir MIME sniffing, clickjacking, et forcer HTTPS.
 */
@Configuration
public class HttpHeadersConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new SecurityHeadersInterceptor());
    }

    /**
     * Interceptor qui ajoute les headers de sécurité à toutes les réponses
     */
    public static class SecurityHeadersInterceptor implements HandlerInterceptor {

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
            // HSTS: Force HTTPS pendant 1 an (31536000 secondes)
            // max-age: Durée pendant laquelle le navigateur doit utiliser HTTPS
            // includeSubDomains: S'applique aussi aux sous-domaines
            // preload: Permet d'être inscrit sur la liste HSTS preload
            response.setHeader("Strict-Transport-Security", 
                "max-age=31536000; includeSubDomains; preload");

            // X-Content-Type-Options: Prévient MIME sniffing
            // nosniff: Le navigateur doit respecter le Content-Type déclaré
            response.setHeader("X-Content-Type-Options", "nosniff");

            // X-Frame-Options: Prévient le clickjacking
            // DENY: La page ne peut pas être iframée
            response.setHeader("X-Frame-Options", "DENY");

            // X-XSS-Protection: Protection XSS du navigateur (héritage)
            // 1; mode=block: Active la protection et bloque la page si détection XSS
            response.setHeader("X-XSS-Protection", "1; mode=block");

            // Referrer-Policy: Contrôle l'en-tête Referer
            // strict-origin-when-cross-origin: Envoyer l'origin seulement pour les requêtes HTTPS
            response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

            // Content-Security-Policy: Prévient l'injection de scripts
            // default-src 'self': Autoriser uniquement les ressources du même domaine
            // script-src 'self': Les scripts doivent venir du même domaine
            // style-src 'self' 'unsafe-inline': CSS du même domaine + inline (car Tailwind/framework)
            // img-src 'self' data: https:: Images locales, data URIs, et HTTPS
            // font-src 'self': Fonts locales
            response.setHeader("Content-Security-Policy", 
                "default-src 'self'; " +
                "script-src 'self'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "font-src 'self'; " +
                "connect-src 'self' https:; " +
                "frame-ancestors 'none'; " +
                "base-uri 'self'; " +
                "form-action 'self'");

            // Permissions-Policy (anciennement Feature-Policy)
            // Désactiver les APIs dangereuses
            response.setHeader("Permissions-Policy",
                "accelerometer=(), " +
                "ambient-light-sensor=(), " +
                "autoplay=(), " +
                "camera=(), " +
                "display-capture=(), " +
                "document-domain=(), " +
                "encrypted-media=(), " +
                "fullscreen=(), " +
                "geolocation=(), " +
                "gyroscope=(), " +
                "magnetometer=(), " +
                "microphone=(), " +
                "midi=(), " +
                "payment=(), " +
                "picture-in-picture=(), " +
                "sync-xhr=(), " +
                "usb=(), " +
                "xr-spatial-tracking=()");

            return true;
        }
    }
}
