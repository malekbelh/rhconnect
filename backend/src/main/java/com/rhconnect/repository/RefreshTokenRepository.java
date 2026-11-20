package com.rhconnect.repository;

import com.rhconnect.model.RefreshToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends MongoRepository<RefreshToken, String> {
    Optional<RefreshToken> findByToken(String token);
    List<RefreshToken> findByUserId(String userId);
    
    /**
     * Trouve tous les tokens expirés
     */
    List<RefreshToken> findByExpiresAtBefore(LocalDateTime expiresAt);
    
    /**
     * Supprime tous les tokens expirés ou révoqués
     */
    @Query("{ $or: [ { 'expiresAt': { $lt: ?0 } }, { 'revoked': true } ] }")
    long deleteExpiredOrRevokedTokens(LocalDateTime now);
}
