package com.rhconnect.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.HashMap;
import java.util.Map;

/**
 * Service pour envoyer des emails.
 * Supporte les emails texte simple et HTML.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@rhconnect.tn}")
    private String fromEmail;

    @Value("${app.mail.from-name:RhConnect}")
    private String fromName;

    /**
     * Envoie un email simple (texte)
     */
    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);

            mailSender.send(message);
            log.info("Email texte envoyé à: {}", to);
        } catch (Exception e) {
            log.error("[SMTP] Échec d'envoi email texte à: {} - Cause: {}", to, e.getMessage(), e);
            // Ne pas bloquer le flux métier, mais loguer l'erreur complète
        }
    }

    /**
     * Envoie un email HTML
     */
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            try {
                helper.setFrom(fromEmail, fromName);
            } catch (Exception e) {
                helper.setFrom(fromEmail);
            }
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true = HTML

            mailSender.send(message);
            log.info("Email HTML envoyé à: {}", to);
        } catch (MessagingException e) {
            log.error("[SMTP] Échec d'envoi email HTML à: {} - Cause: {}", to, e.getMessage(), e);
        } catch (Exception e) {
            log.error("[SMTP] Erreur inattendue lors de l'envoi email HTML à: {} - Cause: {}", to, e.getMessage(), e);
        }
    }

    /**
     * Envoie un email avec pièces jointes
     */
    public void sendEmailWithAttachment(String to, String subject, String htmlContent, String attachmentPath, String attachmentName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            try {
                helper.setFrom(fromEmail, fromName);
            } catch (Exception e) {
                helper.setFrom(fromEmail);
            }
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            // Ajouter la pièce jointe
            org.springframework.core.io.FileSystemResource file = 
                new org.springframework.core.io.FileSystemResource(attachmentPath);
            helper.addAttachment(attachmentName, file);

            mailSender.send(message);
            log.info("Email avec pièce jointe envoyé à: {}", to);
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email avec pièce jointe à: {}", to, e);
        }
    }

    // === Templates d'emails métier ===

    /**
     * Email de confirmation d'inscription (CANDIDATE)
     */
    public void sendCandidateWelcomeEmail(String email, String firstName) {
        String subject = "Bienvenue sur RhConnect - Complétez votre profil";
        String htmlContent = buildCandidateWelcomeTemplate(firstName);
        sendHtmlEmail(email, subject, htmlContent);
    }

    /**
     * Email de confirmation d'inscription (COMPANY)
     */
    public void sendCompanyWelcomeEmail(String email, String companyName) {
        String subject = "Bienvenue sur RhConnect - Publiez vos offres d'emploi";
        String htmlContent = buildCompanyWelcomeTemplate(companyName);
        sendHtmlEmail(email, subject, htmlContent);
    }

    /**
     * Email de notification : nouvelle candidature reçue
     */
    public void sendNewApplicationNotification(String recipientEmail, String candidateName, String offerTitle) {
        String subject = "Nouvelle candidature reçue: " + offerTitle;
        String htmlContent = buildNewApplicationTemplate(candidateName, offerTitle);
        sendHtmlEmail(recipientEmail, subject, htmlContent);
    }

    /**
     * Email de notification : statut de candidature mis à jour
     */
    public void sendApplicationStatusUpdateNotification(String recipientEmail, String offerTitle, String status, String statusLabel) {
        String subject = "Mise à jour de votre candidature: " + offerTitle;
        String htmlContent = buildApplicationStatusUpdateTemplate(offerTitle, statusLabel);
        sendHtmlEmail(recipientEmail, subject, htmlContent);
    }

    /**
     * Email de notification : dossier demandé pour vérification
     */
    public void sendVerificationRequestedNotification(String recipientEmail, String userName) {
        String subject = "Vérification de votre dossier demandée";
        String htmlContent = buildVerificationRequestTemplate(userName);
        sendHtmlEmail(recipientEmail, subject, htmlContent);
    }

    /**
     * Email de notification : dossier vérifié
     */
    public void sendVerificationApprovedNotification(String recipientEmail, String userName) {
        String subject = "Votre dossier a été vérifié et approuvé";
        String htmlContent = buildVerificationApprovedTemplate(userName);
        sendHtmlEmail(recipientEmail, subject, htmlContent);
    }

    /**
     * Email de notification : dossier rejeté
     */
    public void sendVerificationRejectedNotification(String recipientEmail, String userName, String reason) {
        String subject = "Votre dossier a été rejeté";
        String htmlContent = buildVerificationRejectedTemplate(userName, reason);
        sendHtmlEmail(recipientEmail, subject, htmlContent);
    }

    /**
     * Email de réinitialisation de mot de passe
     */
    public void sendPasswordResetEmail(String email, String resetLink) {
        String subject = "Réinitialiser votre mot de passe RhConnect";
        String htmlContent = buildPasswordResetTemplate(resetLink);
        sendHtmlEmail(email, subject, htmlContent);
    }

    // === Templates HTML ===

    private String buildCandidateWelcomeTemplate(String firstName) {
        return """
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Bienvenue sur RhConnect, %s!</h2>
                <p>Votre compte candidat a été créé avec succès.</p>
                <p>Pour commencer, complétez votre profil :</p>
                <ul>
                    <li>Téléchargez votre CV</li>
                    <li>Décrivez vos expériences professionnelles</li>
                    <li>Listez vos formations</li>
                    <li>Indiquez vos compétences</li>
                </ul>
                <p>Plus votre profil est complet, mieux les entreprises pourront vous trouver!</p>
                <a href="https://rhconnect.tn/candidate/profile" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Complétez votre profil</a>
                <hr>
                <p><small>RhConnect - Plateforme de recrutement en Tunisie</small></p>
            </body>
            </html>
            """.formatted(firstName);
    }

    private String buildCompanyWelcomeTemplate(String companyName) {
        return """
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Bienvenue sur RhConnect, %s!</h2>
                <p>Votre compte entreprise a été créé avec succès.</p>
                <p>Vous pouvez maintenant :</p>
                <ul>
                    <li>Publier vos offres d'emploi</li>
                    <li>Recevoir des candidatures</li>
                    <li>Suivre le statut de vos recrutements</li>
                    <li>Vérifier les profils des candidats</li>
                </ul>
                <a href="https://rhconnect.tn/company/dashboard" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accédez au tableau de bord</a>
                <hr>
                <p><small>RhConnect - Plateforme de recrutement en Tunisie</small></p>
            </body>
            </html>
            """.formatted(companyName);
    }

    private String buildNewApplicationTemplate(String candidateName, String offerTitle) {
        return """
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Nouvelle candidature reçue!</h2>
                <p><strong>Candidat:</strong> %s</p>
                <p><strong>Offre:</strong> %s</p>
                <p>Consultez la candidature et décidez de l'étape suivante.</p>
                <a href="https://rhconnect.tn/company/applications" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Voir les candidatures</a>
                <hr>
                <p><small>RhConnect - Plateforme de recrutement en Tunisie</small></p>
            </body>
            </html>
            """.formatted(candidateName, offerTitle);
    }

    private String buildApplicationStatusUpdateTemplate(String offerTitle, String statusLabel) {
        return """
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Mise à jour de votre candidature</h2>
                <p><strong>Offre:</strong> %s</p>
                <p><strong>Nouveau statut:</strong> %s</p>
                <p>Connectez-vous pour plus de détails.</p>
                <a href="https://rhconnect.tn/candidate/applications" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Voir mes candidatures</a>
                <hr>
                <p><small>RhConnect - Plateforme de recrutement en Tunisie</small></p>
            </body>
            </html>
            """.formatted(offerTitle, statusLabel);
    }

    private String buildVerificationRequestTemplate(String userName) {
        return """
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Vérification de dossier demandée</h2>
                <p>Bonjour %s,</p>
                <p>Nous avons besoin de vérifier votre dossier avant de pouvoir continuer.</p>
                <p>Connectez-vous et uploades les pièces demandées (CIN, diplômes, etc.).</p>
                <a href="https://rhconnect.tn/candidate/verification" style="background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Vérifier mon dossier</a>
                <hr>
                <p><small>RhConnect - Plateforme de recrutement en Tunisie</small></p>
            </body>
            </html>
            """.formatted(userName);
    }

    private String buildVerificationApprovedTemplate(String userName) {
        return """
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Dossier vérifié et approuvé!</h2>
                <p>Bonjour %s,</p>
                <p>Votre dossier a été vérifié et approuvé. Vous pouvez maintenant candidater à toutes les offres!</p>
                <a href="https://rhconnect.tn/candidate/offers" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Voir les offres</a>
                <hr>
                <p><small>RhConnect - Plateforme de recrutement en Tunisie</small></p>
            </body>
            </html>
            """.formatted(userName);
    }

    private String buildVerificationRejectedTemplate(String userName, String reason) {
        return """
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Dossier rejeté</h2>
                <p>Bonjour %s,</p>
                <p><strong>Raison:</strong> %s</p>
                <p>Veuillez corriger votre dossier et réessayer.</p>
                <a href="https://rhconnect.tn/candidate/verification" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Corriger mon dossier</a>
                <hr>
                <p><small>RhConnect - Plateforme de recrutement en Tunisie</small></p>
            </body>
            </html>
            """.formatted(userName, reason != null ? reason : "Non spécifiée");
    }

    private String buildPasswordResetTemplate(String resetLink) {
        return """
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Réinitialiser votre mot de passe</h2>
                <p>Vous avez demandé une réinitialisation de mot de passe.</p>
                <p>Cliquez sur le lien ci-dessous (valide 24h):</p>
                <a href="%s" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a>
                <p>Si vous n'avez pas demandé cela, ignorez ce message.</p>
                <hr>
                <p><small>RhConnect - Plateforme de recrutement en Tunisie</small></p>
            </body>
            </html>
            """.formatted(resetLink);
    }
}
