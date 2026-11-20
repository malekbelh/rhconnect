package com.rhconnect.controller;

import com.rhconnect.dto.response.AIRResponse;
import com.rhconnect.service.AIService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "IA / Assistance", description = "Services d'assistance IA pour l'analyse CV, la génération de lettres et les conseils profil")
@PreAuthorize("isAuthenticated()")
public class AIController {

    private final AIService aiService;

    @PostMapping(value = "/analyze-cv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Analyser un CV", description = "Analyse un fichier CV téléversé et extrait les compétences, expériences, formations et points d'amélioration.")
    public ResponseEntity<AIRResponse> analyzeCv(@RequestParam("cv") MultipartFile cv) throws IOException {
        return ResponseEntity.ok(aiService.analyzeCv(cv));
    }

    @PostMapping("/suggestions-lettre")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Générer une lettre de motivation", description = "Génère une lettre de motivation personnalisée en fonction du profil candidat et de l'offre d'emploi ciblée.")
    public ResponseEntity<AIRResponse> suggestionsLettre(@RequestBody Map<String, String> body) {
        String offerId = body.get("offerId");
        return ResponseEntity.ok(aiService.suggestionsLettre(offerId));
    }

    @GetMapping("/conseils")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Obtenir des conseils de profil", description = "Retourne des conseils personnalisés pour améliorer le profil candidat ainsi qu'un score de complétude.")
    public ResponseEntity<AIRResponse> conseilsProfil() {
        return ResponseEntity.ok(aiService.conseilsProfil());
    }

    // ---- AI RH (Company) ----

    @PostMapping("/rh/analyse-candidatures")
    @PreAuthorize("hasAnyRole('COMPANY','ADMIN','RECRUITER')")
    @Operation(summary = "Analyser les candidatures d'une offre", description = "RH: analyse IA des candidatures reçues pour une offre donnée.")
    public ResponseEntity<AIRResponse> analyserCandidatures(@RequestBody Map<String, String> body) {
        String offerId = body.get("offerId");
        return ResponseEntity.ok(aiService.analyserCandidatures(offerId));
    }

    @PostMapping("/rh/rediger-offre")
    @PreAuthorize("hasAnyRole('COMPANY','ADMIN','RECRUITER')")
    @Operation(summary = "Générer une description d'offre", description = "RH: génère une description d'offre optimisée selon le poste, secteur et compétences fournis.")
    public ResponseEntity<AIRResponse> redigerOffre(@RequestBody Map<String, String> context) {
        return ResponseEntity.ok(aiService.redigerOffre(context));
    }

    @GetMapping("/rh/conseils-offre/{offerId}")
    @PreAuthorize("hasAnyRole('COMPANY','ADMIN','RECRUITER')")
    @Operation(summary = "Conseils pour une offre", description = "RH: retourne des recommandations IA pour optimiser une offre publiée.")
    public ResponseEntity<AIRResponse> conseilsOffre(@PathVariable String offerId) {
        return ResponseEntity.ok(aiService.conseilsOffre(offerId));
    }
}
