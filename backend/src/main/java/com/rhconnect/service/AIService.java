package com.rhconnect.service;

import com.rhconnect.ai.AIProvider;
import com.rhconnect.ai.provider.FallbackAIProvider;
import com.rhconnect.dto.response.AIRResponse;
import com.rhconnect.exception.BusinessException;
import com.rhconnect.model.Application;
import com.rhconnect.model.CandidateProfile;
import com.rhconnect.model.Offer;
import com.rhconnect.repository.ApplicationRepository;
import com.rhconnect.repository.CandidateProfileRepository;
import com.rhconnect.repository.OfferRepository;
import com.rhconnect.service.util.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AIService {

    private final AIProvider aiProvider;
    private final OfferRepository offerRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final ApplicationRepository applicationRepository;
    private final FallbackAIProvider fallbackProvider = new FallbackAIProvider();

    public AIRResponse analyzeCv(MultipartFile file) throws IOException {
        AIProvider.AIRecord record;
        try {
            record = aiProvider.analyzeCv(file.getBytes(), file.getOriginalFilename());
        } catch (Exception e) {
            try {
                record = fallbackProvider.analyzeCv(file.getBytes(), file.getOriginalFilename());
            } catch (Exception ex) {
                return degradedResponse();
            }
        }
        return toResponse(record);
    }

    public AIRResponse suggestionsLettre(String offerId) {
        AIProvider.AIRecord record;
        try {
            Offer offer = offerRepository.findById(offerId)
                    .orElseThrow(() -> new BusinessException("Offre non trouvée", "OFFER_NOT_FOUND", 404));

            String userId = CurrentUserService.getCurrentUserIdSafe()
                    .orElseThrow(() -> new BusinessException("Utilisateur non authentifié", "UNAUTHORIZED", 401));

            CandidateProfile candidat = candidateProfileRepository.findByUserId(userId)
                    .orElseThrow(() -> new BusinessException("Profil candidat non trouvé", "CANDIDATE_NOT_FOUND", 404));

            AIProvider.AiContext ctx = new AIProvider.AiContext(candidat, offer);

            try {
                record = aiProvider.generateMotivationLetter(ctx);
            } catch (Exception e) {
                record = fallbackProvider.generateMotivationLetter(ctx);
            }
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            return degradedResponse();
        }
        return toResponse(record);
    }

    public AIRResponse conseilsProfil() {
        AIProvider.AIRecord record;
        try {
            String userId = CurrentUserService.getCurrentUserIdSafe()
                    .orElseThrow(() -> new BusinessException("Utilisateur non authentifié", "UNAUTHORIZED", 401));

            CandidateProfile candidat = candidateProfileRepository.findByUserId(userId)
                    .orElseThrow(() -> new BusinessException("Profil candidat non trouvé", "CANDIDATE_NOT_FOUND", 404));

            try {
                record = aiProvider.conseilProfil(candidat);
            } catch (Exception e) {
                record = fallbackProvider.conseilProfil(candidat);
            }
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            return degradedResponse();
        }
        return toResponse(record);
    }

    private AIRResponse toResponse(AIProvider.AIRecord r) {
        return AIRResponse.builder()
                .status(r.status())
                .message(r.message())
                .data(r.data())
                .build();
    }

    // ---- AI RH (Company) ----

    public AIRResponse analyserCandidatures(String offerId) {
        try {
            Offer offer = offerRepository.findById(offerId)
                    .orElseThrow(() -> new BusinessException("Offre non trouvée", "OFFER_NOT_FOUND", 404));

            List<Application> apps = applicationRepository.findByOfferId(offerId);
            List<String> candidateIds = apps.stream().map(Application::getCandidateId).collect(Collectors.toList());

            long total = apps.size();
            long verifies = apps.stream()
                    .filter(a -> a.getStatut() != null && a.getStatut().name().startsWith("VERIFIE"))
                    .count();

            double avgMatching = apps.stream()
                    .filter(a -> a.getMatchingScore() != null)
                    .mapToInt(Application::getMatchingScore)
                    .average()
                    .orElse(0);

            Map<String, Object> data = Map.of(
                    "totalCandidatures", total,
                    "candidatsVerifies", verifies,
                    "scoreMoyenMatching", Math.round(avgMatching),
                    "recommandations", List.of(
                            total == 0 ? "Aucun candidat n'a encore postulé à cette offre." :
                                    "Vous avez reçu " + total + " candidature(s). Concentrez-vous sur les candidats avec un score de matching > 70%.",
                            "Priorisez les dossiers complets et vérifiés pour maximiser la qualité du recrutement.",
                            "Un entretien rapide avec les meilleurs profils améliorera votre taux de conversion."
                    )
            );
            return AIRResponse.builder().status("available").message("Analyse des candidatures").data(data).build();
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            return degradedResponse();
        }
    }

    public AIRResponse redigerOffre(Map<String, String> context) {
        try {
            String poste = context.getOrDefault("poste", "ce poste");
            String secteur = context.getOrDefault("secteur", "votre secteur");
            String competences = context.getOrDefault("competences", "compétences techniques");

            String description = "Nous recherchons un(e) " + poste + " passionné(e) pour rejoindre notre équipe dans le secteur " + secteur + ".\n\n" +
                    "Vous interviendrez sur des projets stimulants et ferez partie d'une équipe dynamique.\n\n" +
                    "Profil recherché :\n" +
                    "- Maîtrise de : " + competences + "\n" +
                    "- Esprit d'équipe et rigueur\n" +
                    "- Capacité d'adaptation et curiosité intellectuelle\n\n" +
                    "Ce que nous offrons :\n" +
                    "- Un environnement de travail stimulant\n" +
                    "- Des opportunités d'évolution\n" +
                    "- Une rémunération attractive selon profil";

            Map<String, Object> data = Map.of(
                    "descriptionGeneree", description,
                    "tags", List.of(poste, secteur),
                    "conseils", List.of(
                            "Personnalisez la description avec les spécificités de votre entreprise.",
                            "Ajoutez des informations sur la culture d'entreprise pour attirer les bons profils."
                    )
            );
            return AIRResponse.builder().status("available").message("Description d'offre générée").data(data).build();
        } catch (Exception e) {
            return degradedResponse();
        }
    }

    public AIRResponse conseilsOffre(String offerId) {
        try {
            Offer offer = offerRepository.findById(offerId)
                    .orElseThrow(() -> new BusinessException("Offre non trouvée", "OFFER_NOT_FOUND", 404));

            List<Application> apps = applicationRepository.findByOfferId(offerId);
            double avgScore = apps.stream()
                    .filter(a -> a.getMatchingScore() != null)
                    .mapToInt(Application::getMatchingScore)
                    .average().orElse(0);

            List<String> conseils = new java.util.ArrayList<>();
            if (offer.getCompetencesRequises() == null || offer.getCompetencesRequises().isEmpty()) {
                conseils.add("Ajoutez des compétences requises précises pour améliorer le matching automatique.");
            }
            if (avgScore < 50) {
                conseils.add("Le score de matching moyen est faible. Vérifiez que les compétences requises correspondent au marché.");
            }
            if (offer.getDescription() != null && offer.getDescription().length() < 200) {
                conseils.add("Enrichissez la description de l'offre pour attirer plus de candidats qualifiés.");
            }
            if (conseils.isEmpty()) {
                conseils.add("Votre offre est bien configurée. Continuez à suivre les candidatures reçues.");
            }

            Map<String, Object> data = Map.of(
                    "scoreMatchingMoyen", Math.round(avgScore),
                    "nbCandidatures", apps.size(),
                    "conseils", conseils
            );
            return AIRResponse.builder().status("available").message("Conseils pour l'offre").data(data).build();
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            return degradedResponse();
        }
    }

    private AIRResponse degradedResponse() {
        return AIRResponse.builder()
                .status("degraded")
                .message("Service IA indisponible - mode dégradé")
                .data(java.util.Map.of())
                .build();
    }
}
