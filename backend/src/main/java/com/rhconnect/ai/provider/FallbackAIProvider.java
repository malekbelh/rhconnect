package com.rhconnect.ai.provider;

import com.rhconnect.ai.AIProvider;
import com.rhconnect.model.CandidateProfile;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "rhconnect.ai.provider", havingValue = "fallback", matchIfMissing = true)
public class FallbackAIProvider implements AIProvider {

    @Override
    public AIRecord analyzeCv(byte[] cvBytes, String fileName) throws Exception {
        Map<String, Object> data = new HashMap<>();
        data.put("fileName", fileName);
        data.put("competences", List.of());
        data.put("experiences", List.of());
        data.put("formations", List.of());
        data.put("langues", List.of());
        data.put("resume", "");
        data.put("niveauExperienceEstime", "NON_DEFINI");
        data.put("pointsForts", List.of());
        data.put("pointsAmeliorer", List.of("Service IA temporairement indisponible"));

        return new AIRecord("degraded", "Service IA indisponible - mode dégradé", data);
    }

    @Override
    public AIRecord generateMotivationLetter(AiContext ctx) throws Exception {
        Map<String, Object> data = new HashMap<>();
        data.put("lettre", "[Mode dégradé] Nous ne pouvons pas générer de lettre automatiquement pour le moment. Merci de rédiger votre lettre manuellement.");
        data.put("offreId", ctx.offre() != null ? ctx.offre().getId() : null);
        data.put("offreTitre", ctx.offre() != null ? ctx.offre().getTitle() : null);

        return new AIRecord("degraded", "Service IA indisponible - mode dégradé", data);
    }

    @Override
    public AIRecord conseilProfil(CandidateProfile candidat) throws Exception {
        Map<String, Object> data = new HashMap<>();
        data.put("conseils", generateDynamicConseils(candidat));
        data.put("scoreProfil", calculateProfileScore(candidat));

        return new AIRecord("degraded", "Service IA indisponible - mode dégradé", data);
    }

    private List<String> generateDynamicConseils(CandidateProfile candidat) {
        List<String> conseils = new java.util.ArrayList<>();

        if (candidat == null) {
            return List.of(
                    "Complétez votre profil avec toutes vos informations personnelles (téléphone, adresse).",
                    "Ajoutez au moins 3 compétences clés correspondant à votre secteur d'activité.",
                    "Téléversez un CV à jour et détaillez vos expériences professionnelles."
            );
        }

        if (candidat.getFirstName() == null || candidat.getFirstName().isEmpty()
                || candidat.getLastName() == null || candidat.getLastName().isEmpty()) {
            conseils.add("Complétez votre nom et prénom dans votre profil pour que les recruteurs puissent vous identifier.");
        }
        if (candidat.getPhone() == null || candidat.getPhone().isEmpty()) {
            conseils.add("Ajoutez votre numéro de téléphone pour que les recruteurs puissent vous contacter rapidement.");
        }
        if (candidat.getAddress() == null || candidat.getAddress().isEmpty()) {
            conseils.add("Indiquez votre ville et votre adresse pour améliorer la pertinence des offres proposées.");
        }
        if (candidat.getBio() == null || candidat.getBio().length() < 50) {
            conseils.add("Rédigez une bio percutante de 3 à 5 phrases résumant vos expertises, vos objectifs et ce qui vous différencie.");
        }
        if (candidat.getPhotoFileId() == null || candidat.getPhotoFileId().isEmpty()) {
            conseils.add("Ajoutez une photo de profil professionnelle pour donner une première impression positive et maximiser votre taux de réponse.");
        }
        if (candidat.getCompetences() == null || candidat.getCompetences().size() < 3) {
            conseils.add("Ajoutez au moins 3 compétences clés correspondant à votre secteur d'activité pour améliorer votre score de matching.");
        }
        if (candidat.getParcours() == null || candidat.getParcours().isEmpty()) {
            conseils.add("Détaillez vos expériences professionnelles (postes, missions, réalisations quantifiées) pour renforcer la crédibilité de votre profil.");
        }
        if (candidat.getFormation() == null || candidat.getFormation().isEmpty()) {
            conseils.add("Ajoutez vos formations et diplômes pour valoriser votre parcours académique.");
        }
        if (candidat.getCvFileId() == null) {
            conseils.add("Téléversez votre CV au format PDF à jour pour permettre aux recruteurs de consulter votre dossier complet.");
        }

        if (conseils.isEmpty()) {
            conseils.add("Votre profil est bien complété. Continuez à postuler régulièrement et mettez à jour vos expériences au fur et à mesure.");
        }

        if (conseils.size() > 5) {
            conseils = conseils.subList(0, 5);
        }

        return conseils;
    }

    private int calculateProfileScore(CandidateProfile candidat) {
        if (candidat == null) return 0;
        int score = 0;
        if (candidat.getFirstName() != null && !candidat.getFirstName().isEmpty()) score += 10;
        if (candidat.getLastName() != null && !candidat.getLastName().isEmpty()) score += 10;
        if (candidat.getPhone() != null && !candidat.getPhone().isEmpty()) score += 10;
        if (candidat.getBio() != null && candidat.getBio().length() > 50) score += 15;
        if (candidat.getCompetences() != null && candidat.getCompetences().size() >= 3) score += 20;
        if (candidat.getParcours() != null && !candidat.getParcours().isEmpty()) score += 20;
        if (candidat.getFormation() != null && !candidat.getFormation().isEmpty()) score += 10;
        if (candidat.getCvFileId() != null) score += 5;
        if (candidat.getPhotoFileId() != null && !candidat.getPhotoFileId().isEmpty()) score += 10;
        return Math.min(score, 100);
    }
}
