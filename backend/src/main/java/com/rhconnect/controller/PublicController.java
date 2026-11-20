package com.rhconnect.controller;

import com.rhconnect.service.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Tag(name = "Public", description = "Endpoints publics (health, info)")
public class PublicController {

    private final StatsService statsService;

    @GetMapping("/health")
    @Operation(summary = "Vérification de santé de l'API", description = "Retourne un statut OK si l'API est opérationnelle.")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "OK",
                "service", "RhConnect API",
                "version", "1.0.0",
                "timestamp", LocalDateTime.now().toString()
        ));
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> info() {
        return ResponseEntity.ok(Map.of(
                "name", "RhConnect",
                "description", "Plateforme RH moderne - Candidats, Entreprises, Recruteurs, Administrateurs",
                "modules", new String[]{"AUTH", "CANDIDATE", "COMPANY", "OFFERS", "APPLICATIONS", "VERIFICATIONS", "AI", "ADMIN"}
        ));
    }

    @GetMapping("/stats")
    @Operation(
        summary = "Statistiques publiques",
        description = "Retourne les métriques anonymisées de la plateforme : offres actives, entreprises, talents accompagnés, taux de mise en relation. Accessible sans authentification."
    )
    public ResponseEntity<Map<String, Object>> publicStats() {
        var stats = statsService.getDashboardStats();
        return ResponseEntity.ok(Map.of(
                "offresActives", stats.getOffers(),
                "entreprisesActives", stats.getCompanies(),
                "talentsAccompagnes", stats.getCandidates(),
                "tauxMiseEnRelation", Math.round(stats.getTauxConversion())
        ));
    }
}
