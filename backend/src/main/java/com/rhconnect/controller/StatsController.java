package com.rhconnect.controller;

import com.rhconnect.dto.response.StatsResponse;
import com.rhconnect.service.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
@Tag(name = "Admin Stats", description = "KPIs dashboard administrateur")
@PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/dashboard")
    @Operation(summary = "Statistiques dashboard enrichies",
            description = "Retourne les KPIs principaux + tendances mensuelles + délai moyen recrutement + top offres + taux d'acceptation.")
    public ResponseEntity<StatsResponse> getDashboard() {
        return ResponseEntity.ok(statsService.getDashboardStats());
    }

    @GetMapping("/applications-by-day")
    @Operation(summary = "Candidatures par jour",
            description = "Nombre de candidatures créées par jour sur une période glissante de N jours (défaut: 30).")
    public List<Map<String, Object>> getApplicationsByDay(@RequestParam(defaultValue = "30") int days) {
        return statsService.getApplicationsByDay(days);
    }

    @GetMapping("/roles-distribution")
    @Operation(summary = "Distribution des rôles",
            description = "Répartition du nombre d'utilisateurs par rôle.")
    public List<Map<String, Object>> getRolesDistribution() {
        return statsService.getRolesDistribution();
    }

    @GetMapping("/signups-by-month")
    @Operation(summary = "Inscriptions par mois",
            description = "Nombre de nouveaux utilisateurs inscrits par mois sur N mois (défaut: 12).")
    public List<Map<String, Object>> getSignupsByMonth(@RequestParam(defaultValue = "12") int months) {
        return statsService.getSignupsByMonth(months);
    }

    @GetMapping("/cross-filtered")
    @Operation(summary = "Stats filtrées croisées",
            description = "Statistiques de candidatures filtrées par période, type de contrat et statut. Retourne totaux, répartition par statut, délai moyen, candidatures/jour.")
    public ResponseEntity<Map<String, Object>> getCrossFiltered(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String contractType,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(statsService.getCrossFilteredStats(startDate, endDate, contractType, status));
    }
}
