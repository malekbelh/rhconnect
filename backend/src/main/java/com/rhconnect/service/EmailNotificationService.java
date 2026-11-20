package com.rhconnect.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service pour envoyer les notifications email de manière asynchrone.
 * Les emails ne bloquent pas le flux métier principal.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService {

    private final EmailService emailService;

    // === CANDIDATE ===

    @Async
    public void sendCandidateWelcomeEmailAsync(String email, String firstName) {
        try {
            emailService.sendCandidateWelcomeEmail(email, firstName);
        } catch (Exception e) {
            log.error("Erreur envoi email bienvenue candidat", e);
        }
    }

    @Async
    public void sendApplicationStatusUpdateAsync(String email, String offerTitle, String status, String statusLabel) {
        try {
            emailService.sendApplicationStatusUpdateNotification(email, offerTitle, status, statusLabel);
        } catch (Exception e) {
            log.error("Erreur envoi email mise à jour candidature", e);
        }
    }

    @Async
    public void sendVerificationRequestedAsync(String email, String userName) {
        try {
            emailService.sendVerificationRequestedNotification(email, userName);
        } catch (Exception e) {
            log.error("Erreur envoi email vérification demandée", e);
        }
    }

    @Async
    public void sendVerificationApprovedAsync(String email, String userName) {
        try {
            emailService.sendVerificationApprovedNotification(email, userName);
        } catch (Exception e) {
            log.error("Erreur envoi email vérification approuvée", e);
        }
    }

    @Async
    public void sendVerificationRejectedAsync(String email, String userName, String reason) {
        try {
            emailService.sendVerificationRejectedNotification(email, userName, reason);
        } catch (Exception e) {
            log.error("Erreur envoi email vérification rejetée", e);
        }
    }

    // === COMPANY ===

    @Async
    public void sendCompanyWelcomeEmailAsync(String email, String companyName) {
        try {
            emailService.sendCompanyWelcomeEmail(email, companyName);
        } catch (Exception e) {
            log.error("Erreur envoi email bienvenue entreprise", e);
        }
    }

    @Async
    public void sendNewApplicationNotificationAsync(String email, String candidateName, String offerTitle) {
        try {
            emailService.sendNewApplicationNotification(email, candidateName, offerTitle);
        } catch (Exception e) {
            log.error("Erreur envoi email nouvelle candidature", e);
        }
    }

    // === PASSWORD RESET ===

    @Async
    public void sendPasswordResetEmailAsync(String email, String resetLink) {
        try {
            emailService.sendPasswordResetEmail(email, resetLink);
        } catch (Exception e) {
            log.error("Erreur envoi email réinitialisation mot de passe", e);
        }
    }
}
