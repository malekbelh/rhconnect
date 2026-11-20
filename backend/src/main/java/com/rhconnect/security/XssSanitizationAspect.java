package com.rhconnect.security;

import com.rhconnect.util.XssSanitizer;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;

/**
 * Aspect AOP qui sanitize automatiquement les champs utilisateur
 * annotés avec @Sanitize avant leur traitement.
 * 
 * IMPORTANT: Applique la sanitization à tous les DTOs qui passent par
 * les contrôleurs @RestController.
 */
@Aspect
@Component
@Slf4j
public class XssSanitizationAspect {

    /**
     * Intercepte les appels aux contrôleurs et sanitize les DTOs
     */
    @Before("execution(* com.rhconnect.controller.*.*(..)) && args(..,arg)")
    public void sanitizeControllerInput(JoinPoint joinPoint, Object arg) {
        if (arg == null) {
            return;
        }

        try {
            sanitizeObject(arg);
        } catch (Exception e) {
            log.warn("Erreur lors de la sanitization XSS", e);
            // Ne pas bloquer le requête, seulement logger
        }
    }

    /**
     * Sanitize récursivement tous les champs String d'un objet
     */
    private void sanitizeObject(Object obj) throws IllegalAccessException {
        if (obj == null) {
            return;
        }

        Class<?> clazz = obj.getClass();

        // Parcourir tous les champs de la classe
        for (Field field : clazz.getDeclaredFields()) {
            // Ignorer les champs statiques et finaux
            if (java.lang.reflect.Modifier.isStatic(field.getModifiers()) ||
                java.lang.reflect.Modifier.isFinal(field.getModifiers())) {
                continue;
            }

            field.setAccessible(true);

            Object value = field.get(obj);

            // Si c'est un String, le sanitizer
            if (value instanceof String) {
                String stringValue = (String) value;
                
                // Appliquer la sanitization selon le nom du champ
                String sanitized = sanitizeField(field.getName(), stringValue);
                
                if (!stringValue.equals(sanitized)) {
                    field.set(obj, sanitized);
                    log.debug("Champ sanitizé: {}.{}", clazz.getSimpleName(), field.getName());
                }
            } 
            // Si c'est un objet, sanitize récursivement
            else if (value != null && isCustomObject(value.getClass())) {
                sanitizeObject(value);
            }
        }
    }

    /**
     * Sanitize un champ spécifique selon son contexte
     */
    private String sanitizeField(String fieldName, String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }

        String lowerFieldName = fieldName.toLowerCase();

        // Champs qui permettent du contenu long (descriptions, bios)
        if (lowerFieldName.contains("description") || 
            lowerFieldName.contains("bio") || 
            lowerFieldName.contains("content") ||
            lowerFieldName.contains("lettre") ||
            lowerFieldName.contains("motivation") ||
            lowerFieldName.contains("commentaire") ||
            lowerFieldName.contains("note")) {
            return XssSanitizer.sanitizeLongText(value, 5000);
        }

        // Champs d'URL/lien
        if (lowerFieldName.contains("url") || 
            lowerFieldName.contains("website") ||
            lowerFieldName.contains("link")) {
            if (!XssSanitizer.isSafeUrl(value)) {
                return ""; // Bloquer les URLs dangereuses
            }
            return value;
        }

        // Champs d'email
        if (lowerFieldName.contains("email")) {
            if (!XssSanitizer.isValidEmail(value)) {
                return ""; // Email invalide
            }
            return value.toLowerCase().trim();
        }

        // Par défaut: texte court
        return XssSanitizer.sanitizeShortText(value, 1000);
    }

    /**
     * Vérifie si une classe est un objet personnalisé (DTO)
     */
    private boolean isCustomObject(Class<?> clazz) {
        // Ignorer les types primitifs, String, collections, etc.
        if (clazz.isPrimitive() || 
            clazz == String.class || 
            clazz == Boolean.class ||
            clazz == Integer.class ||
            clazz == Long.class ||
            clazz == Double.class ||
            clazz == Float.class ||
            java.util.Collection.class.isAssignableFrom(clazz) ||
            java.util.Map.class.isAssignableFrom(clazz)) {
            return false;
        }

        // Vérifier si c'est une classe du package com.rhconnect
        return clazz.getPackageName().startsWith("com.rhconnect");
    }
}
