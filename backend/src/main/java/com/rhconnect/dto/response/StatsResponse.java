package com.rhconnect.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatsResponse {
    // Compteurs principaux
    private Long users;
    private Long candidates;
    private Long companies;
    private Long offers;
    private Long applications;

    // Taux
    private Double tauxConversion;
    private Double tauxAcceptation;

    // Répartition par statut
    private Map<String, Long> candidaturesParStatut;

    // Vérifications
    private Long verificationsCount;
    private Long verificationsPending;

    // Délais recrutement (en jours)
    private Double delaiMoyenRecrutementJours;

    // Top offres par volume de candidatures
    private List<TopOfferStats> topOffers;

    // Tendances mensuelles
    private List<Map<String, Object>> tendancesInscriptions;
    private List<Map<String, Object>> tendancesCandidatures;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopOfferStats {
        private String offerId;
        private String titre;
        private String companyId;
        private Long candidatureCount;
        private String typeContrat;
    }
}
