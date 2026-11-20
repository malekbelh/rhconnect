package com.rhconnect.controller;

import com.rhconnect.dto.response.ApiResponse;
import com.rhconnect.model.Offer;
import com.rhconnect.model.ModerationHistoryEntry;
import com.rhconnect.service.OfferModerationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Endpoints pour la modération des offres d'emploi (admin/recruiter)
 */
@RestController
@RequestMapping("/api/offers")
@RequiredArgsConstructor
@Tag(name = "Offer Moderation", description = "Endpoints de modération des offres (admin/recruiter)")
public class OfferModerationController {

    private final OfferModerationService offerModerationService;

    /**
     * Soumettre une offre pour modération
     * Passe le statut de DRAFT à PENDING_MODERATION
     */
    @PostMapping("/{id}/submit-for-moderation")
    @PreAuthorize("hasAnyRole('COMPANY', 'ADMIN')")
    @Operation(summary = "Soumettre une offre pour modération", 
               description = "Permet à une entreprise de soumettre son offre (brouillon) pour modération avant publication.")
    public ResponseEntity<ApiResponse<Offer>> submitForModeration(@PathVariable String id) {
        Offer offer = offerModerationService.submitForModeration(id);
        return ResponseEntity.ok(ApiResponse.success(offer, "Offre soumise pour modération"));
    }

    /**
     * Approuver une offre (admin/modérateur)
     * Passe le statut de PENDING_MODERATION à ACTIVE
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    @Operation(summary = "Approuver une offre", 
               description = "Admin/Recruiter - Approuve une offre en attente de modération et la publie.")
    public ResponseEntity<ApiResponse<Offer>> approveOffer(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        String approvalComment = request.get("comment");
        Offer offer = offerModerationService.approveOffer(id, approvalComment);
        return ResponseEntity.ok(ApiResponse.success(offer, "Offre approuvée et publiée"));
    }

    /**
     * Rejeter une offre (admin/modérateur)
     * Retourne le statut à DRAFT pour correction
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    @Operation(summary = "Rejeter une offre", 
               description = "Admin/Recruiter - Rejette une offre et la retourne au brouillon pour correction.")
    public ResponseEntity<ApiResponse<Offer>> rejectOffer(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        String rejectionReason = request.get("reason");
        Offer offer = offerModerationService.rejectOffer(id, rejectionReason);
        return ResponseEntity.ok(ApiResponse.success(offer, "Offre rejetée - Retournée au brouillon"));
    }

    /**
     * Récupère les offres en attente de modération
     */
    @GetMapping("/moderation/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    @Operation(summary = "Offres en attente de modération", 
               description = "Admin/Recruiter - Liste les offres qui attendent une validation avant publication.")
    public ResponseEntity<Page<Offer>> getPendingModerations(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<Offer> offers = offerModerationService.getPendingModerations(pageable);
        return ResponseEntity.ok(offers);
    }

    /**
     * Récupère l'historique de modération d'une offre
     */
    @GetMapping("/{id}/moderation-history")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Historique de modération d'une offre", 
               description = "Retourne l'historique complet des actions de modération pour une offre.")
    public ResponseEntity<List<ModerationHistoryEntry>> getModerationHistory(@PathVariable String id) {
        List<ModerationHistoryEntry> history = offerModerationService.getModerationHistory(id);
        return ResponseEntity.ok(history);
    }
}
