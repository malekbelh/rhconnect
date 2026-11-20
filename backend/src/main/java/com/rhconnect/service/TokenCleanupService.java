package com.rhconnect.service;

import com.rhconnect.repository.PasswordResetTokenRepository;
import com.rhconnect.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service de nettoyage des tokens expirés ou révoqués.
 * Exécute automatiquement selon un planning pour éviter l'accumulation
 * de données inutiles en base de données.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenCleanupService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    /**
     * Nettoie les tokens expirés ou révoqués.
     * Exécution : Tous les jours à 2h du matin
     * Cron: "0 0 2 * * ?" = 02:00:00 chaque jour
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupExpiredTokens() {
        try {
            LocalDateTime now = LocalDateTime.now();

            long deletedRefresh = refreshTokenRepository.deleteExpiredOrRevokedTokens(now);
            long deletedReset = passwordResetTokenRepository.deleteExpiredOrUsedTokens(now);
            long total = deletedRefresh + deletedReset;

            if (total > 0) {
                log.info("Nettoyage des tokens: {} tokens supprimés (refresh: {}, reset: {})",
                        total, deletedRefresh, deletedReset);
            }
        } catch (Exception e) {
            log.error("Erreur lors du nettoyage des tokens expirés", e);
        }
    }

    /**
     * Nettoie les tokens manuellement (peut être appelé via un endpoint admin)
     */
    public long manualCleanup() {
        try {
            LocalDateTime now = LocalDateTime.now();
            long deletedRefresh = refreshTokenRepository.deleteExpiredOrRevokedTokens(now);
            long deletedReset = passwordResetTokenRepository.deleteExpiredOrUsedTokens(now);
            long total = deletedRefresh + deletedReset;

            log.info("Nettoyage manuel des tokens: {} tokens supprimés (refresh: {}, reset: {})",
                    total, deletedRefresh, deletedReset);
            return total;
        } catch (Exception e) {
            log.error("Erreur lors du nettoyage manuel des tokens", e);
            return 0;
        }
    }

    /**
     * Nettoie tous les tokens d'un utilisateur après logout
     */
    public void cleanupUserTokens(String userId) {
        try {
            refreshTokenRepository.findByUserId(userId).forEach(token -> {
                refreshTokenRepository.delete(token);
            });
            
            log.info("Nettoyage des tokens utilisateur: {}", userId);
        } catch (Exception e) {
            log.error("Erreur lors du nettoyage des tokens de l'utilisateur: {}", userId, e);
        }
    }
}
