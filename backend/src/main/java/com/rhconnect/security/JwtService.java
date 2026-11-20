package com.rhconnect.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.Function;

@Service
public class JwtService {

    private static SecretKey SECRET_KEY;
    private static long ACCESS_TTL;
    private static long REFRESH_TTL;

    @Value("${rhconnect.jwt.secret}")
    public void setSecretKey(String secret) {
        SECRET_KEY = Keys.hmacShaKeyFor(Base64.getDecoder().decode(secret));
    }

    @Value("${rhconnect.jwt.access-token-ttl-seconds}")
    public void setAccessTtl(long ttl) { ACCESS_TTL = ttl; }

    @Value("${rhconnect.jwt.refresh-token-ttl-seconds}")
    public void setRefreshTtl(long ttl) { REFRESH_TTL = ttl; }

    public static String generateAccessToken(String userId, List<String> roles, String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", roles);
        claims.put("email", email);
        claims.put("type", "access");
        return buildToken(claims, userId, ACCESS_TTL);
    }

    public static String generateRefreshToken(String userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        return buildToken(claims, userId, REFRESH_TTL);
    }

    private static String buildToken(Map<String, Object> claims, String subject, long ttlSeconds) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + ttlSeconds * 1000))
                .signWith(SECRET_KEY)
                .compact();
    }

    public static String extractUserId(String token) { return extractClaim(token, Claims::getSubject); }
    public static Date extractExpiration(String token) { return extractClaim(token, Claims::getExpiration); }
    public static boolean isTokenExpired(String token) { return extractExpiration(token).before(new Date()); }
    public static boolean validateToken(String token, String expectedUserId) {
        try {
            String userId = extractUserId(token);
            return userId.equals(expectedUserId) && !isTokenExpired(token);
        } catch (Exception e) { return false; }
    }

    public static <T> T extractClaim(String token, Function<Claims, T> resolver) {
        final Claims claims = extractAllClaims(token);
        return resolver.apply(claims);
    }

    public static Claims extractAllClaims(String token) {
        return Jwts.parser().verifyWith(SECRET_KEY).build().parseSignedClaims(token).getPayload();
    }
}
