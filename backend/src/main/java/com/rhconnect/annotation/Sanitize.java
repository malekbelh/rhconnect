package com.rhconnect.annotation;

import java.lang.annotation.*;

/**
 * Annotation pour marquer les champs String qui doivent être sanitizés
 * avant le traitement pour prévenir XSS.
 * 
 * Utilisée par XssSanitizationAspect pour identifier les champs à nettoyer.
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Sanitize {
    /**
     * Type de sanitization à appliquer
     */
    SanitizeType value() default SanitizeType.SHORT_TEXT;

    enum SanitizeType {
        SHORT_TEXT,    // Bio, titre (max 1000 chars)
        LONG_TEXT,     // Description, motivation (max 5000 chars)
        EMAIL,         // Validation email
        URL,           // Validation URL sécurisée
        PHONE          // Format téléphone
    }
}
