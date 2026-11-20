package com.rhconnect.controller;

import com.rhconnect.audit.Audit;
import com.rhconnect.dto.request.CreateOfferRequest;
import com.rhconnect.dto.request.UpdateOfferRequest;
import com.rhconnect.dto.response.OfferResponse;
import com.rhconnect.model.enums.NiveauExperience;
import com.rhconnect.model.enums.TypeContrat;
import com.rhconnect.service.OfferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/offers")
@RequiredArgsConstructor
@Tag(name = "Offres", description = "Gestion des offres d'emploi")
public class OfferController {

    private final OfferService offerService;

    @GetMapping
    @Operation(summary = "Rechercher des offres", description = "Liste paginÃ©e des offres actives avec filtres. Si candidat, ajoute le matchingScore.")
    public ResponseEntity<Page<OfferResponse>> searchOffers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String competence,
            @RequestParam(required = false) NiveauExperience niveauExperience,
            @RequestParam(required = false) TypeContrat typeContrat,
            @RequestParam(required = false) String localisation,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "datePublication"));
        return ResponseEntity.ok(offerService.searchOffers(keyword, competence, niveauExperience, typeContrat, localisation, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "DÃ©tail d'une offre", description = "Retourne une offre par son ID. Si candidat, ajoute le matchingScore.")
    public ResponseEntity<OfferResponse> getOfferById(@PathVariable String id) {
        return ResponseEntity.ok(offerService.getOfferById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COMPANY','ADMIN')")
    @Operation(summary = "CrÃ©er une offre", description = "CrÃ©e une nouvelle offre. Entreprise -> son profil; Admin -> companyId requis.")
    public ResponseEntity<OfferResponse> createOffer(
            @Valid @RequestBody CreateOfferRequest request,
            @RequestParam(required = false) String companyId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(offerService.createOffer(request, companyId));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('COMPANY')")
    @Operation(summary = "Mes offres", description = "Liste des offres publiÃ©es par l'entreprise connectÃ©e.")
    public ResponseEntity<List<OfferResponse>> getMyOffers() {
        return ResponseEntity.ok(offerService.getMyOffers());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPANY','ADMIN')")
    @Operation(summary = "Modifier une offre", description = "Modifie une offre. VÃ©rification de la propriÃ©tÃ© si COMPANY.")
    public ResponseEntity<OfferResponse> updateOffer(@PathVariable String id, @Valid @RequestBody UpdateOfferRequest request) {
        return ResponseEntity.ok(offerService.updateOffer(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPANY','ADMIN')")
    @Operation(summary = "Supprimer une offre", description = "Supprime une offre. VÃ©rification de la propriÃ©tÃ© si COMPANY.")
    public ResponseEntity<Void> deleteOffer(@PathVariable String id) {
        offerService.deleteOffer(id);
        return ResponseEntity.noContent().build();
    }

    // â”€â”€â”€ Endpoints Admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @GetMapping("/admin/all")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Operation(summary = "Toutes les offres pour admin", description = "ADMIN/RECRUITER: liste complÃ¨te de toutes les offres avec stats (vues, candidatures, infos modÃ©ration).")
    public ResponseEntity<List<OfferResponse>> getAllOffersForAdmin() {
        return ResponseEntity.ok(offerService.getAllOffersForAdmin());
    }

    @GetMapping("/admin/stats")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Operation(summary = "Statistiques globales des offres", description = "ADMIN/RECRUITER: total, par statut, vues totales, candidatures totales.")
    public ResponseEntity<Map<String, Object>> getAdminStats() {
        return ResponseEntity.ok(offerService.getAdminStats());
    }

    @PatchMapping("/admin/{id}/moderate")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Audit(action = "OFFER_MODERATED", entityType = "Offer", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    @Operation(summary = "ModÃ©rer une offre", description = "ADMIN/RECRUITER: APPROVE â†’ ACTIVE, REJECT â†’ REJECTED, REQUEST_EDIT â†’ DRAFT. Historique de modÃ©ration conservÃ©.")
    public ResponseEntity<OfferResponse> moderateOffer(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {
        String action = body.get("action");
        String comment = body.getOrDefault("comment", "");
        return ResponseEntity.ok(offerService.moderateOffer(id, action, comment));
    }

    @PatchMapping("/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Audit(action = "OFFER_ADMIN_UPDATE", entityType = "Offer", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    @Operation(summary = "Mise Ã  jour admin d'une offre", description = "ADMIN/RECRUITER: modifier statut, titre, description, note modÃ©ration.")
    public ResponseEntity<OfferResponse> updateOfferAdmin(
            @PathVariable String id,
            @RequestBody Map<String, Object> body
    ) {
        return ResponseEntity.ok(offerService.updateOfferAdmin(id, body));
    }

    @PostMapping("/admin/{id}/duplicate")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Audit(action = "OFFER_DUPLICATED", entityType = "Offer", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    @Operation(summary = "Dupliquer une offre", description = "ADMIN/RECRUITER: clone une offre en DRAFT avec le prÃ©fixe [Copie].")
    public ResponseEntity<OfferResponse> duplicateOffer(@PathVariable String id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(offerService.duplicateOffer(id));
    }
}

