package com.rhconnect.service;

import com.rhconnect.exception.BusinessException;
import com.rhconnect.model.RefreshToken;
import com.rhconnect.model.User;
import com.rhconnect.repository.RefreshTokenRepository;
import com.rhconnect.repository.UserRepository;
import com.rhconnect.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Value("${rhconnect.jwt.refresh-token-ttl-seconds:604800}")
    private long refreshTokenTtlSeconds;

    public RefreshToken createRefreshToken(String userId) {
        String token = JwtService.generateRefreshToken(userId);
        RefreshToken refreshToken = RefreshToken.builder()
                .userId(userId)
                .token(token)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenTtlSeconds))
                .revoked(false)
                .build();
        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken findByToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new BusinessException("Invalid refresh token", "INVALID_REFRESH_TOKEN", 401));
    }

    public RefreshToken validateRefreshToken(String token) {
        RefreshToken refreshToken = findByToken(token);
        if (refreshToken.isRevoked()) {
            throw new BusinessException("Refresh token revoked", "REFRESH_TOKEN_REVOKED", 401);
        }
        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Refresh token expired", "REFRESH_TOKEN_EXPIRED", 401);
        }
        String userId = JwtService.extractUserId(token);
        if (!JwtService.validateToken(token, userId)) {
            throw new BusinessException("Invalid refresh token", "INVALID_REFRESH_TOKEN", 401);
        }
        return refreshToken;
    }

    public void revokeRefreshToken(String token) {
        RefreshToken refreshToken = findByToken(token);
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
    }

    public void revokeAllUserRefreshTokens(String userId) {
        List<RefreshToken> tokens = refreshTokenRepository.findByUserId(userId);
        tokens.forEach(t -> t.setRevoked(true));
        refreshTokenRepository.saveAll(tokens);
    }

    public User getUserFromRefreshToken(RefreshToken refreshToken) {
        return userRepository.findById(refreshToken.getUserId())
                .orElseThrow(() -> new BusinessException("User not found", "USER_NOT_FOUND", 401));
    }
}
