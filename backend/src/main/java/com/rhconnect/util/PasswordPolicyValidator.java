package com.rhconnect.util;

import com.rhconnect.exception.BusinessException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Validateur de politique de mot de passe.
 * Enforce les règles de complexité et de longueur.
 */
public class PasswordPolicyValidator {

    // Règles de politique par défaut
    public static final int MIN_LENGTH = 10;
    public static final int MAX_LENGTH = 128;
    
    // Patterns pour les exigences
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_PATTERN = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};:'\",.<>?/\\\\|`~]");
    private static final Pattern WHITESPACE_PATTERN = Pattern.compile("\\s");

    /**
     * Valide un mot de passe contre la politique
     * 
     * @param password Mot de passe à valider
     * @throws BusinessException Si le mot de passe ne respecte pas la politique
     */
    public static void validatePassword(String password) {
        List<String> violations = getViolations(password);
        
        if (!violations.isEmpty()) {
            String message = "Le mot de passe ne respecte pas la politique de sécurité:\n" + 
                           String.join("\n", violations);
            throw new BusinessException(message, "PASSWORD_POLICY_VIOLATION", 400);
        }
    }

    /**
     * Récupère la liste des violations pour un mot de passe
     * 
     * @param password Mot de passe à analyser
     * @return Liste des violations (vide si le mot de passe est valide)
     */
    public static List<String> getViolations(String password) {
        List<String> violations = new ArrayList<>();

        if (password == null || password.isEmpty()) {
            violations.add("Le mot de passe est requis");
            return violations;
        }

        // Vérifier la longueur minimale
        if (password.length() < MIN_LENGTH) {
            violations.add(String.format("Minimum %d caractères (actuellement: %d)", MIN_LENGTH, password.length()));
        }

        // Vérifier la longueur maximale
        if (password.length() > MAX_LENGTH) {
            violations.add(String.format("Maximum %d caractères (actuellement: %d)", MAX_LENGTH, password.length()));
        }

        // Vérifier l'absence d'espaces
        if (WHITESPACE_PATTERN.matcher(password).find()) {
            violations.add("Les espaces ne sont pas autorisés");
        }

        // Vérifier la présence d'au moins une majuscule
        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            violations.add("Au moins une lettre majuscule (A-Z)");
        }

        // Vérifier la présence d'au moins une minuscule
        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            violations.add("Au moins une lettre minuscule (a-z)");
        }

        // Vérifier la présence d'au moins un chiffre
        if (!DIGIT_PATTERN.matcher(password).find()) {
            violations.add("Au moins un chiffre (0-9)");
        }

        // Vérifier la présence d'au moins un caractère spécial
        if (!SPECIAL_PATTERN.matcher(password).find()) {
            violations.add("Au moins un caractère spécial (!@#$%^&*()_+-=[]{};\\'\"<>?,./\\|`~)");
        }

        // Vérifier qu'il ne contient pas de mots courants/faibles
        if (isCommonPassword(password)) {
            violations.add("Mot de passe trop courant ou prévisible");
        }

        return violations;
    }

    /**
     * Vérifie si le mot de passe est dans la liste des mots courants/faibles
     */
    private static boolean isCommonPassword(String password) {
        String[] commonPasswords = {
            "password", "123456", "password123", "admin", "letmein",
            "welcome", "monkey", "dragon", "master", "sunshine",
            "princess", "qwerty", "12345", "1234567", "abc123",
            "password1", "admin123", "aaa", "zzz", "pass"
        };

        String lowerPassword = password.toLowerCase();
        for (String common : commonPasswords) {
            if (lowerPassword.equals(common) || lowerPassword.contains(common)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Retourne un message explicatif de la politique
     */
    public static String getPolicyDescription() {
        return String.format(
            "Politique de mot de passe:\n" +
            "- Longueur: %d à %d caractères\n" +
            "- Au moins 1 majuscule (A-Z)\n" +
            "- Au moins 1 minuscule (a-z)\n" +
            "- Au moins 1 chiffre (0-9)\n" +
            "- Au moins 1 caractère spécial (!@#$%%^&*...)\n" +
            "- Pas d'espaces\n" +
            "- Pas de mots courants",
            MIN_LENGTH, MAX_LENGTH
        );
    }

    /**
     * Calcule la force du mot de passe (0-100)
     */
    public static int calculatePasswordStrength(String password) {
        if (password == null || password.isEmpty()) {
            return 0;
        }

        int strength = 0;

        // Longueur: 0-20 points
        int length = password.length();
        if (length >= MIN_LENGTH && length <= 16) {
            strength += 10;
        } else if (length > 16 && length <= 32) {
            strength += 15;
        } else if (length > 32) {
            strength += 20;
        }

        // Variété de caractères: 0-60 points
        if (UPPERCASE_PATTERN.matcher(password).find()) strength += 15;
        if (LOWERCASE_PATTERN.matcher(password).find()) strength += 15;
        if (DIGIT_PATTERN.matcher(password).find()) strength += 15;
        if (SPECIAL_PATTERN.matcher(password).find()) strength += 15;

        // Pas de motifs courants: 0-20 points
        if (!isCommonPassword(password)) {
            strength += 20;
        }

        return Math.min(strength, 100);
    }

    /**
     * Retourne un label de force (faible, moyen, fort, très fort)
     */
    public static String getStrengthLabel(int strength) {
        if (strength < 25) return "Très faible";
        if (strength < 50) return "Faible";
        if (strength < 75) return "Moyen";
        if (strength < 90) return "Fort";
        return "Très fort";
    }
}
