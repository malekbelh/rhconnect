package com.rhconnect.controller;

import com.rhconnect.audit.Audit;
import com.rhconnect.dto.request.SubmitApplicationRequest;
import com.rhconnect.dto.request.UpdateApplicationStatusRequest;
import com.rhconnect.dto.response.ApplicationResponse;
import com.rhconnect.dto.response.TimelineEntryResponse;
import com.rhconnect.exception.BusinessException;
import com.rhconnect.model.AdminNote;
import com.rhconnect.model.enums.ApplicationStatus;
import com.rhconnect.service.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Candidatures", description = "Gestion des candidatures aux offres")
public class ApplicationController {

    private final ApplicationService applicationService;

    @GetMapping("/api/applications/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Mes candidatures", description = "Candidat: liste de ses candidatures avec offre et entreprise.")
    public ResponseEntity<List<ApplicationResponse>> getMyApplications() {
        return ResponseEntity.ok(applicationService.getMyApplications());
    }

    @PostMapping("/api/applications")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Postuler", description = "Candidat: soumettre une candidature. Vérifications dossier complet, matching >= 50, pas de doublon.")
    public ResponseEntity<ApplicationResponse> submitApplication(@Valid @RequestBody SubmitApplicationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(applicationService.submitApplication(request));
    }

    @GetMapping("/api/applications/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Détail candidature", description = "Accès selon rôle: CANDIDATE propriétaire, COMPANY propriétaire offre, ADMIN/RECRUITER tous.")
    public ResponseEntity<ApplicationResponse> getApplicationById(@PathVariable String id) {
        return ResponseEntity.ok(applicationService.getApplicationById(id));
    }

    @DeleteMapping("/api/applications/{id}")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Retirer une candidature", description = "Candidat: supprime une candidature appartenant à son profil.")
    public ResponseEntity<Void> deleteMyApplication(@PathVariable String id) {
        applicationService.deleteMyApplication(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/applications/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Operation(summary = "Supprimer candidature (Admin)", description = "ADMIN/RECRUITER: suppression administrative d'une candidature ou d'un doublon.")
    public ResponseEntity<Void> deleteApplicationAdmin(@PathVariable String id) {
        applicationService.deleteApplicationAdmin(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/applications/{id}/timeline")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Timeline candidature", description = "Historique détaillé avec nom de l'acteur (email).")
    public ResponseEntity<List<TimelineEntryResponse>> getTimeline(@PathVariable String id) {
        return ResponseEntity.ok(applicationService.getApplicationTimeline(id));
    }

    @GetMapping("/api/applications")
    @PreAuthorize("hasAnyRole('COMPANY','ADMIN','RECRUITER')")
    @Operation(summary = "Lister candidatures (entreprise/admin)", description = "COMPANY: candidatures pour ses offres; ADMIN/RECRUITER: toutes les candidatures.")
    public ResponseEntity<List<ApplicationResponse>> getApplications() {
        return ResponseEntity.ok(applicationService.getApplicationsByCompany());
    }

    @GetMapping("/api/offers/{offerId}/applications")
    @PreAuthorize("hasAnyRole('COMPANY','ADMIN','RECRUITER')")
    @Operation(summary = "Candidatures d'une offre", description = "COMPANY: statut >= VERIFIE; ADMIN/RECRUITER: tous.")
    public ResponseEntity<List<ApplicationResponse>> getApplicationsByOffer(@PathVariable String offerId) {
        return ResponseEntity.ok(applicationService.getApplicationsByOffer(offerId));
    }

    @PatchMapping("/api/applications/{id}/status")
    @PreAuthorize("hasAnyRole('COMPANY','ADMIN','RECRUITER')")
    @Operation(summary = "Mettre à jour statut", description = "Avancement du workflow: COMPANY limité (TRANSMIS→ENTRETIEN→ACCEPTE/REFUSE); ADMIN/RECRUITER libre.")
    public ResponseEntity<ApplicationResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateApplicationStatusRequest request
    ) {
        return ResponseEntity.ok(applicationService.updateApplicationStatus(id, request));
    }

    @PutMapping("/api/applications/{id}")
    @PreAuthorize("hasAnyRole('COMPANY','ADMIN','RECRUITER','CANDIDATE')")
    @Operation(summary = "Mettre à jour candidature", description = "Mettre à jour le statut ou autres champs selon les permissions.")
    public ResponseEntity<ApplicationResponse> updateApplication(
            @PathVariable String id,
            @RequestBody Map<String, Object> updates
    ) {
        if (updates.containsKey("status") || updates.containsKey("statut")) {
            String statusStr = (String) updates.getOrDefault("status", updates.get("statut"));
            ApplicationStatus newStatus = ApplicationStatus.valueOf(statusStr);
            UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
            request.setStatut(newStatus);
            if (updates.containsKey("rejectionReason") || updates.containsKey("motifRejet")) {
                request.setCommentaire((String) updates.getOrDefault("rejectionReason", updates.get("motifRejet")));
            }
            return ResponseEntity.ok(applicationService.updateApplicationStatus(id, request));
        }
        throw new BusinessException("Aucun champ valide pour mise à jour", "INVALID_UPDATE");
    }

    @GetMapping("/api/applications/admin/all")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Operation(summary = "Toutes les candidatures pour admin", description = "ADMIN/RECRUITER: liste globale de toutes les candidatures.")
    public ResponseEntity<List<ApplicationResponse>> getAllApplicationsForAdmin() {
        return ResponseEntity.ok(applicationService.getAllApplicationsForAdmin());
    }

    @PatchMapping("/api/applications/admin/{id}/force-status")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Audit(action = "APPLICATION_FORCE_STATUS", entityType = "Application", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    @Operation(summary = "Forcer statut candidature", description = "ADMIN/RECRUITER: forcer un statut arbitraire avec motif obligatoire.")
    public ResponseEntity<ApplicationResponse> forceStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {
        String statutStr = body.get("statut");
        String motif = body.getOrDefault("motif", "");
        ApplicationStatus newStatut = ApplicationStatus.valueOf(statutStr);
        return ResponseEntity.ok(applicationService.forceStatus(id, newStatut, motif));
    }

    @PostMapping("/api/applications/admin/{id}/notes")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Audit(action = "APPLICATION_NOTE_ADDED", entityType = "Application", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    @Operation(summary = "Ajouter note admin", description = "ADMIN/RECRUITER: ajouter une note interne d'audit ou de suivi sur la candidature.")
    public ResponseEntity<AdminNote> addAdminNote(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {
        String content = body.get("content");
        return ResponseEntity.status(HttpStatus.CREATED).body(applicationService.addAdminNote(id, content));
    }

    @PostMapping("/api/applications/admin/{id}/dispute")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Audit(action = "APPLICATION_DISPUTE_OPENED", entityType = "Application", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    @Operation(summary = "Ouvrir un litige", description = "ADMIN/RECRUITER: déclarer un litige / incident administratif sur la candidature.")
    public ResponseEntity<ApplicationResponse> openDispute(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {
        String motif = body.get("motif");
        return ResponseEntity.ok(applicationService.openDispute(id, motif));
    }

    @PostMapping("/api/applications/admin/{id}/dispute/resolve")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Audit(action = "APPLICATION_DISPUTE_RESOLVED", entityType = "Application", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    @Operation(summary = "Résoudre un litige", description = "ADMIN/RECRUITER: lever le litige administratif sur la candidature.")
    public ResponseEntity<ApplicationResponse> resolveDispute(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String comment = body != null ? body.get("comment") : null;
        return ResponseEntity.ok(applicationService.resolveDispute(id, comment));
    }

    @PatchMapping("/api/applications/admin/{id}/incomplete")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Audit(action = "APPLICATION_INCOMPLETE_TOGGLED", entityType = "Application", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    @Operation(summary = "Marquer dossier incomplet", description = "ADMIN/RECRUITER: signaler ou lever le flag dossier incomplet.")
    public ResponseEntity<ApplicationResponse> toggleDossierIncomplet(
            @PathVariable String id,
            @RequestBody Map<String, Object> body
    ) {
        boolean incomplet = Boolean.TRUE.equals(body.get("incomplet"));
        String motif = body.get("motif") != null ? body.get("motif").toString() : null;
        return ResponseEntity.ok(applicationService.toggleDossierIncomplet(id, incomplet, motif));
    }

}
