package com.rhconnect.repository;

import com.rhconnect.model.PasswordResetToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends MongoRepository<PasswordResetToken, String> {
    Optional<PasswordResetToken> findByToken(String token);
    Optional<PasswordResetToken> findByTokenAndUsedFalse(String token);

    /**
     * Trouve un token valide (non utilisé + non expiré)
     */
    @Query("{ 'token': ?0, 'used': false, 'expiresAt': { $gte: ?1 } }")
    Optional<PasswordResetToken> findValidToken(String token, LocalDateTime now);

    /**
     * Supprime les tokens expirés ou utilisés
     */
    @Query("{ $or: [ { 'expiresAt': { $lt: ?0 } }, { 'used': true } ] }")
    long deleteExpiredOrUsedTokens(LocalDateTime now);
}
