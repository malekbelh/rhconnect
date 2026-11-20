package com.rhconnect.util;

import java.util.regex.Pattern;

/**
 * Utilitaire de sanitization pour prévenir les attaques XSS (Cross-Site Scripting).
 * Échappe les caractères dangereux HTML/JavaScript.
 * 
 * IMPORTANT: À utiliser lors de la sérialisation JSON ou affichage de contenu utilisateur.
 */
public class XssSanitizer {

    // Pattern pour détecter les balises HTML/script
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");
    private static final Pattern SCRIPT_PATTERN = Pattern.compile(
        "(?i)<script[^>]*>.*?</script>|" +
        "(?i)javascript:|" +
        "(?i)onerror=|" +
        "(?i)onload=|" +
        "(?i)onclick=|" +
        "(?i)onmouseover=|" +
        "(?i)onfocus=|" +
        "(?i)onblur=|" +
        "(?i)on[a-z]+\\s*="
    );

    /**
     * Échappe les caractères HTML dangereux pour prévenir XSS.
     * Convertit: < > & " ' en entités HTML.
     * 
     * @param input Texte utilisateur à échapper
     * @return Texte sécurisé
     */
    public static String escapeHtml(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }

        return input
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#x27;");
    }

    /**
     * Nettoie le texte en supprimant les balises HTML et les handlers d'événements.
     * Moins restrictif que escapeHtml mais nettoie les tentatives d'injection.
     * 
     * @param input Texte utilisateur à nettoyer
     * @return Texte nettoyé
     */
    public static String stripHtmlAndScripts(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }

        // Supprimer les balises script complètes
        String cleaned = input.replaceAll("(?i)<script[^>]*>.*?</script>", "");
        
        // Supprimer les handlers d'événements (onclick, onerror, etc.)
        cleaned = SCRIPT_PATTERN.matcher(cleaned).replaceAll("");
        
        // Supprimer toutes les autres balises HTML
        cleaned = HTML_TAG_PATTERN.matcher(cleaned).replaceAll("");

        return cleaned.trim();
    }

    /**
     * Valide et nettoie un email pour prévenir les injections.
     * 
     * @param email Email à valider
     * @return true si l'email semble valide
     */
    public static boolean isValidEmail(String email) {
        if (email == null || email.isEmpty()) {
            return false;
        }
        
        // Regex basique pour email (plus de validation devrait être fait au backend)
        String emailPattern = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        return email.matches(emailPattern) && email.length() <= 255;
    }

    /**
     * Nettoie les entrées utilisateur pour un champ texte court (bio, titre, etc.)
     * 
     * @param input Texte utilisateur
     * @param maxLength Longueur maximale
     * @return Texte nettoyé et tronqué
     */
    public static String sanitizeShortText(String input, int maxLength) {
        if (input == null) {
            return "";
        }

        // D'abord, échapper les caractères HTML
        String sanitized = escapeHtml(input);
        
        // Tronquer à la longueur maximale
        if (sanitized.length() > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }

        return sanitized.trim();
    }

    /**
     * Nettoie les entrées utilisateur pour un champ texte long (description, contenu)
     * Autorise les sauts de ligne mais échappe le HTML.
     * 
     * @param input Texte utilisateur
     * @param maxLength Longueur maximale
     * @return Texte nettoyé et tronqué
     */
    public static String sanitizeLongText(String input, int maxLength) {
        if (input == null) {
            return "";
        }

        // D'abord, supprimer les scripts/handlers dangereux
        String cleaned = stripHtmlAndScripts(input);
        
        // Puis, échapper ce qui reste
        String sanitized = escapeHtml(cleaned);
        
        // Tronquer à la longueur maximale
        if (sanitized.length() > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }

        return sanitized.trim();
    }

    /**
     * Nettoie l'URL pour prévenir les attaques javascript:
     * 
     * @param url URL à valider
     * @return true si l'URL semble sûre
     */
    public static boolean isSafeUrl(String url) {
        if (url == null || url.isEmpty()) {
            return false;
        }

        String lowerUrl = url.toLowerCase().trim();
        
        // Interdire javascript:, data:, vbscript:
        if (lowerUrl.startsWith("javascript:") || 
            lowerUrl.startsWith("data:") || 
            lowerUrl.startsWith("vbscript:")) {
            return false;
        }

        // Autoriser http, https, //, et chemins relatifs
        return lowerUrl.startsWith("http://") || 
               lowerUrl.startsWith("https://") || 
               lowerUrl.startsWith("//") || 
               lowerUrl.startsWith("/") || 
               lowerUrl.startsWith(".");
    }

    /**
     * Nettoie une URL de redirection pour prévenir open redirect
     * 
     * @param url URL de redirection proposée
     * @return URL sécurisée ou null si dangereuse
     */
    public static String sanitizeRedirectUrl(String url) {
        if (!isSafeUrl(url)) {
            return null;
        }
        
        // Si c'est une URL externe, la valider contre une whitelist d'hôtes autorisés
        // (À implémenter selon vos besoins)
        
        return url;
    }
}
