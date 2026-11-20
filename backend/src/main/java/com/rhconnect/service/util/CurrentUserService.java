package com.rhconnect.service.util;

import io.jsonwebtoken.Claims;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CurrentUserService {

    public static String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof String) {
            return (String) principal;
        }
        return null;
    }

    public static Optional<String> getCurrentUserIdSafe() {
        return Optional.ofNullable(getCurrentUserId());
    }

    public static Claims getCurrentClaims() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object details = authentication.getDetails();
        if (details instanceof Claims) {
            return (Claims) details;
        }
        return null;
    }

    public static String getCurrentUserEmail() {
        Claims claims = getCurrentClaims();
        if (claims != null) {
            return claims.get("email", String.class);
        }
        return null;
    }

    public static boolean isAuthenticated() {
        return getCurrentUserId() != null;
    }
}
