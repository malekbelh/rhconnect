package com.rhconnect.service;

import com.rhconnect.dto.response.ApiResponse;
import com.rhconnect.exception.BusinessException;
import com.rhconnect.model.Offer;
import com.rhconnect.model.enums.OfferStatus;
import com.rhconnect.model.ModerationHistoryEntry;
import com.rhconnect.repository.OfferRepository;
import com.rhconnect.service.util.CurrentUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service pour modérer les offres d'emploi avant publication.
 * Workflow: DRAFT → PENDING_MODERATION → APPROVED → ACTIVE
 * ou REJECTED (retour à DRAFT)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OfferModerationService {

    private final OfferRepository offerRepository;

    /**
     * Soumet une offre pour modération
     * Change le statut de DRAFT à PENDING_MODERATION
     */
    @Transactional
    public Offer submitForModeration(String offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new BusinessException("Offre introuvable", "OFFER_NOT_FOUND"));

        if (offer.getStatut() != OfferStatus.DRAFT) {
            throw new BusinessException("Seules les offres en brouillon peuvent être soumises", "INVALID_STATUS");
        }

        offer.setStatut(OfferStatus.PENDING_MODERATION);
        
        // Ajouter à l'historique
        addModerationHistory(offer, "SUBMITTED_FOR_MODERATION", "Offre soumise pour modération", null);
        
        log.info("Offre {} soumise pour modération", offerId);
        return offerRepository.save(offer);
    }

    /**
     * Approuve une offre (admin/modérateur)
     * Change le statut de PENDING_MODERATION à ACTIVE
     */
    @Transactional
    public Offer approveOffer(String offerId, String approvalComment) {
        String moderatorId = CurrentUserService.getCurrentUserId();
        
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new BusinessException("Offre introuvable", "OFFER_NOT_FOUND"));

        if (offer.getStatut() != OfferStatus.PENDING_MODERATION) {
            throw new BusinessException("Seules les offres en attente de modération peuvent être approuvées", "INVALID_STATUS");
        }

        offer.setStatut(OfferStatus.ACTIVE);
        offer.setModeratorId(moderatorId);
        offer.setModerationComment(approvalComment);
        offer.setModeratedAt(Instant.now());
        
        addModerationHistory(offer, "APPROVED", approvalComment != null ? approvalComment : "Offre approuvée", moderatorId);
        
        log.info("Offre {} approuvée par {}", offerId, moderatorId);
        return offerRepository.save(offer);
    }

    /**
     * Rejette une offre (admin/modérateur)
     * Retourne la statut à DRAFT pour correction
     */
    @Transactional
    public Offer rejectOffer(String offerId, String rejectionReason) {
        String moderatorId = CurrentUserService.getCurrentUserId();
        
        if (rejectionReason == null || rejectionReason.isBlank()) {
            throw new BusinessException("La raison du rejet est obligatoire", "MISSING_REJECTION_REASON");
        }

        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new BusinessException("Offre introuvable", "OFFER_NOT_FOUND"));

        if (offer.getStatut() != OfferStatus.PENDING_MODERATION && offer.getStatut() != OfferStatus.ACTIVE) {
            throw new BusinessException("Seules les offres en modération ou publiées peuvent être rejetées", "INVALID_STATUS");
        }

        offer.setStatut(OfferStatus.DRAFT);
        offer.setModeratorId(moderatorId);
        offer.setModerationComment(rejectionReason);
        offer.setModeratedAt(Instant.now());
        
        addModerationHistory(offer, "REJECTED", "Offre rejetée: " + rejectionReason, moderatorId);
        
        log.info("Offre {} rejetée par {}", offerId, moderatorId);
        return offerRepository.save(offer);
    }

    /**
     * Récupère les offres en attente de modération (pour les admins/modérateurs)
     */
    public Page<Offer> getPendingModerations(Pageable pageable) {
        return offerRepository.findByStatut(OfferStatus.PENDING_MODERATION, pageable);
    }

    /**
     * Récupère l'historique de modération d'une offre
     */
    public List<ModerationHistoryEntry> getModerationHistory(String offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new BusinessException("Offre introuvable", "OFFER_NOT_FOUND"));

        return offer.getModerationHistory() != null ? offer.getModerationHistory() : List.of();
    }

    /**
     * Ajoute une entrée à l'historique de modération
     */
    private void addModerationHistory(Offer offer, String action, String comment, String moderatorId) {
        if (offer.getModerationHistory() == null) {
            offer.setModerationHistory(new java.util.ArrayList<>());
        }

        ModerationHistoryEntry entry = ModerationHistoryEntry.builder()
                .action(ModerationHistoryEntry.ModerationAction.valueOf(action))
                .comment(comment)
                .timestamp(Instant.now())
                .build();

        offer.getModerationHistory().add(entry);
    }
}
