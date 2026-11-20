package com.rhconnect.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service de rate limiting pour protéger l'API contre les attaques par force brute
 * et les abus (DDoS).
 * 
 * Utilise Bucket4j avec stockage en mémoire (peut être migré vers Redis pour multi-node)
 */
@Service
@Slf4j
public class RateLimitingService {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    // Configurations de rate limiting par endpoint
    private static final Map<String, RateLimitConfig> RATE_LIMIT_CONFIGS = new ConcurrentHashMap<>();

    static {
        // Login: 100 tentatives par 15 minutes (adapté pour dev / tests)
        RATE_LIMIT_CONFIGS.put("login", new RateLimitConfig(100, Duration.ofMinutes(15)));
        
        // Register: 3 inscriptions par heure par IP
        RATE_LIMIT_CONFIGS.put("register", new RateLimitConfig(3, Duration.ofHours(1)));
        
        // File upload: 20 uploads par heure
        RATE_LIMIT_CONFIGS.put("upload", new RateLimitConfig(20, Duration.ofHours(1)));
        
        // API générale: 100 requêtes par minute par utilisateur
        RATE_LIMIT_CONFIGS.put("api_general", new RateLimitConfig(100, Duration.ofMinutes(1)));
        
        // Verification: 50 opérations par heure
        RATE_LIMIT_CONFIGS.put("verification", new RateLimitConfig(50, Duration.ofHours(1)));
        
        // AI endpoints: 30 requêtes par heure
        RATE_LIMIT_CONFIGS.put("ai", new RateLimitConfig(30, Duration.ofHours(1)));
        
        // Password reset: 3 tentatives par 24 heures
        RATE_LIMIT_CONFIGS.put("password_reset", new RateLimitConfig(3, Duration.ofHours(24)));
    }

    /**
     * Vérifie si une requête est autorisée selon le rate limit
     * 
     * @param identifier Identifiant unique (IP, userId, email)
     * @param endpoint Type d'endpoint (login, register, upload, etc.)
     * @return true si la requête est autorisée, false si rate limit dépassé
     */
    public boolean isAllowed(String identifier, String endpoint) {
        if (identifier == null || identifier.isEmpty()) {
            return false;
        }

        String bucketKey = endpoint + ":" + identifier;
        
        RateLimitConfig config = RATE_LIMIT_CONFIGS.getOrDefault(endpoint, 
            new RateLimitConfig(100, Duration.ofMinutes(1))); // Default config
        
        Bucket bucket = buckets.computeIfAbsent(bucketKey, key -> createBucket(config));
        
        boolean allowed = bucket.tryConsume(1);
        
        if (!allowed) {
            log.warn("Rate limit dépassé - Endpoint: {}, Identifier: {}", endpoint, identifier);
        }

        return allowed;
    }

    /**
     * Retourne le nombre de requêtes restantes
     */
    public long getRemainingTokens(String identifier, String endpoint) {
        String bucketKey = endpoint + ":" + identifier;
        Bucket bucket = buckets.get(bucketKey);
        
        if (bucket == null) {
            RateLimitConfig config = RATE_LIMIT_CONFIGS.get(endpoint);
            return config != null ? config.capacity : 100;
        }

        return bucket.getAvailableTokens();
    }

    /**
     * Réinitialise le rate limit pour un utilisateur (ex: après succès login)
     */
    public void reset(String identifier, String endpoint) {
        String bucketKey = endpoint + ":" + identifier;
        buckets.remove(bucketKey);
        log.info("Rate limit réinitialisé - Endpoint: {}, Identifier: {}", endpoint, identifier);
    }

    /**
     * Crée un nouveau bucket avec la configuration spécifiée
     */
    private Bucket createBucket(RateLimitConfig config) {
        Bandwidth bandwidth = Bandwidth.classic(config.capacity, 
            Refill.intervally(config.capacity, config.window));
        return Bucket4j.builder()
            .addLimit(bandwidth)
            .build();
    }

    /**
     * Configuration du rate limiting (capacité et fenêtre temps)
     */
    public static class RateLimitConfig {
        public final long capacity;
        public final Duration window;

        public RateLimitConfig(long capacity, Duration window) {
            this.capacity = capacity;
            this.window = window;
        }
    }
}
