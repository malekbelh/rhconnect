package com.rhconnect.controller;

import com.rhconnect.model.SystemSettings;
import com.rhconnect.service.SystemSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
@Tag(name = "System Settings", description = "Paramètres système globaux de la plateforme")
@PreAuthorize("hasRole('ADMIN')")
public class SystemSettingsController {

    private final SystemSettingsService systemSettingsService;

    @GetMapping
    @Operation(summary = "Lire les paramètres système",
            description = "Retourne les paramètres globaux (maintenance, uploads, notifications, référentiels).")
    public ResponseEntity<SystemSettings> getSettings() {
        return ResponseEntity.ok(systemSettingsService.getSettings());
    }

    @PatchMapping
    @Operation(summary = "Mettre à jour les paramètres",
            description = "Mise à jour partielle des paramètres. Seuls les champs présents dans le body sont modifiés.")
    public ResponseEntity<SystemSettings> patchSettings(
            @RequestBody Map<String, Object> patches,
            Authentication auth) {
        String updatedBy = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(systemSettingsService.patchSettings(patches, updatedBy));
    }

    @GetMapping("/referentiels")
    @Operation(summary = "Lister les référentiels",
            description = "Retourne tous les référentiels : jobCategories, skillsReferential, customContractTypes, allowedExtensions.")
    public ResponseEntity<Map<String, List<String>>> getReferentiels() {
        SystemSettings s = systemSettingsService.getSettings();
        Map<String, List<String>> result = Map.of(
                "jobCategories", s.getJobCategories(),
                "skillsReferential", s.getSkillsReferential(),
                "customContractTypes", s.getCustomContractTypes(),
                "allowedExtensions", s.getAllowedExtensions()
        );
        return ResponseEntity.ok(result);
    }

    @PostMapping("/referentiels/{referential}")
    @Operation(summary = "Ajouter une valeur à un référentiel")
    public ResponseEntity<SystemSettings> addToReferential(
            @PathVariable String referential,
            @RequestBody Map<String, String> body) {
        String value = body.get("value");
        if (value == null || value.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(systemSettingsService.addToReferential(referential, value.trim()));
    }

    @DeleteMapping("/referentiels/{referential}")
    @Operation(summary = "Supprimer une valeur d'un référentiel")
    public ResponseEntity<SystemSettings> removeFromReferential(
            @PathVariable String referential,
            @RequestBody Map<String, String> body) {
        String value = body.get("value");
        if (value == null || value.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(systemSettingsService.removeFromReferential(referential, value.trim()));
    }
}
