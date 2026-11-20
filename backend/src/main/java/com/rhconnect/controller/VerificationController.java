package com.rhconnect.controller;

import com.rhconnect.audit.Audit;
import com.rhconnect.dto.request.ValidateVerificationRequest;
import com.rhconnect.dto.response.VerificationResponse;
import com.rhconnect.service.VerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/verifications")
@RequiredArgsConstructor
@Tag(name = "Vérifications", description = "Vérification administrative des profils candidats")
public class VerificationController {

    private final VerificationService verificationService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Ma vérification", description = "Candidat: statut et pièces de sa propre vérification.")
    public ResponseEntity<VerificationResponse> getMyVerification() {
        return ResponseEntity.ok(verificationService.getMyVerification());
    }

    @PostMapping(value = "/upload-piece", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Téléverser une pièce", description = "Candidat: ajoute une pièce justificative. Si statut VALIDE, reste VALIDE sinon EN_ATTENTE.")
    public ResponseEntity<VerificationResponse> uploadPiece(
            @RequestParam("fichier") MultipartFile fichier,
            @RequestParam("nomFichier") String nomFichier,
            @RequestParam("type") String type
    ) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(verificationService.uploadPiece(fichier, nomFichier, type));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Operation(summary = "Toutes les vérifications", description = "ADMIN/RECRUITER: liste de toutes les vérifications (avec filtre optionnel de statut).")
    public ResponseEntity<List<VerificationResponse>> getAll(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(verificationService.getAllVerifications(status));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Operation(summary = "Vérifications en attente", description = "ADMIN/RECRUITER: liste des vérifications EN_ATTENTE triées par date.")
    public ResponseEntity<List<VerificationResponse>> getPending() {
        return ResponseEntity.ok(verificationService.getPendingVerifications());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Operation(summary = "Détail vérification", description = "ADMIN/RECRUITER: consultation d'une vérification par ID.")
    public ResponseEntity<VerificationResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(verificationService.getVerificationById(id));
    }

    @GetMapping("/{id}/download/{pieceId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Télécharger une pièce", description = "Candidat owner ou ADMIN/RECRUITER: récupère le fichier pièce.")
    public ResponseEntity<Resource> downloadPiece(
            @PathVariable String id,
            @PathVariable String pieceId
    ) {
        Resource resource = verificationService.downloadPiece(id, pieceId);
        String filename = verificationService.getPieceFileName(id, pieceId);
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");

        // Détecter le type MIME pour permettre prévisualisation PDF/images
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        String disposition = "attachment";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) {
            mediaType = MediaType.APPLICATION_PDF;
            disposition = "inline";
        } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            mediaType = MediaType.IMAGE_JPEG;
            disposition = "inline";
        } else if (lower.endsWith(".png")) {
            mediaType = MediaType.IMAGE_PNG;
            disposition = "inline";
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + filename + "\"; filename*=UTF-8''" + encodedFilename)
                .header("Access-Control-Expose-Headers", HttpHeaders.CONTENT_DISPOSITION)
                .body(resource);
    }

    @PatchMapping("/{id}/validate")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Audit(action = "VERIFICATION_VALIDATED", entityType = "Verification", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    @Operation(summary = "Valider / Rejeter vérification", description = "ADMIN/RECRUITER: statut VALIDE ou REJETE. Si VALIDE, propage VERIFIE→TRANSMIS sur candidatures EN_VERIFICATION du candidat.")
    public ResponseEntity<VerificationResponse> validate(
            @PathVariable String id,
            @Valid @RequestBody ValidateVerificationRequest request
    ) {
        return ResponseEntity.ok(verificationService.validateVerification(id, request));
    }

    @PostMapping("/{id}/lock")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Audit(action = "VERIFICATION_LOCKED", entityType = "Verification", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    @Operation(summary = "Verrouiller une vérification (TTL 15 min)", description = "ADMIN/RECRUITER: prend possession du dossier pour éviter les conflits d'édition.")
    public ResponseEntity<VerificationResponse> lock(@PathVariable String id) {
        return ResponseEntity.ok(verificationService.lockVerification(id));
    }

    @PostMapping("/{id}/unlock")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Audit(action = "VERIFICATION_UNLOCKED", entityType = "Verification", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    @Operation(summary = "Libérer le verrou d'une vérification", description = "ADMIN/RECRUITER: libère le dossier pour les autres modérateurs.")
    public ResponseEntity<VerificationResponse> unlock(@PathVariable String id) {
        return ResponseEntity.ok(verificationService.unlockVerification(id));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Audit(action = "VERIFICATION_ASSIGNED", entityType = "Verification", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    @Operation(summary = "Attribuer une vérification", description = "ADMIN/RECRUITER: assigner le dossier à un modérateur précis.")
    public ResponseEntity<VerificationResponse> assign(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {
        String email = body.get("assignedToEmail");
        return ResponseEntity.ok(verificationService.assignVerification(id, email));
    }

    @PatchMapping("/{id}/checklist")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    @Audit(action = "VERIFICATION_CHECKLIST_UPDATED", entityType = "Verification", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    @Operation(summary = "Mettre à jour la checklist", description = "ADMIN/RECRUITER: enregistre l'état des points de conformité de la checklist.")
    public ResponseEntity<VerificationResponse> updateChecklist(
            @PathVariable String id,
            @RequestBody Map<String, Boolean> checklist
    ) {
        return ResponseEntity.ok(verificationService.updateChecklist(id, checklist));
    }

    // ---- Company verification ----

    @GetMapping("/company/me")
    @PreAuthorize("hasRole('COMPANY')")
    @Operation(summary = "Vérification entreprise", description = "COMPANY: statut et pièces de vérification de l'entreprise connectée.")
    public ResponseEntity<VerificationResponse> getCompanyVerification() {
        return ResponseEntity.ok(verificationService.getCompanyVerification());
    }

    @PostMapping(value = "/company/upload-piece", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('COMPANY')")
    @Operation(summary = "Téléverser une pièce entreprise", description = "COMPANY: ajoute un document officiel (RNE, statuts, certification).")
    public ResponseEntity<VerificationResponse> uploadCompanyPiece(
            @RequestParam("fichier") MultipartFile fichier,
            @RequestParam("nomFichier") String nomFichier,
            @RequestParam("type") String type
    ) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(verificationService.uploadCompanyPiece(fichier, nomFichier, type));
    }
}


