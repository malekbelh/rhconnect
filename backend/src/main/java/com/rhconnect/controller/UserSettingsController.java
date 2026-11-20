package com.rhconnect.controller;

import com.rhconnect.model.UserSettings;
import com.rhconnect.service.UserSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Tag(name = "Paramètres", description = "Gestion des préférences utilisateur")
@PreAuthorize("isAuthenticated()")
public class UserSettingsController {

    private final UserSettingsService userSettingsService;

    @GetMapping("/me")
    @Operation(summary = "Obtenir mes paramètres", description = "Retourne les préférences de l'utilisateur connecté.")
    public ResponseEntity<UserSettings> getMySettings() {
        return ResponseEntity.ok(userSettingsService.getMySettings());
    }

    @PatchMapping("/me")
    @Operation(summary = "Mettre à jour mes paramètres", description = "Met à jour partiellement les préférences de l'utilisateur connecté.")
    public ResponseEntity<UserSettings> updateMySettings(@RequestBody Map<String, Object> patch) {
        return ResponseEntity.ok(userSettingsService.updateMySettings(patch));
    }
}
