package com.rhconnect.controller;

import com.rhconnect.model.AiUsageLog;
import com.rhconnect.service.AiSupervisionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/ai")
@RequiredArgsConstructor
@Tag(name = "AI Supervision", description = "Supervision et métriques des appels IA")
@PreAuthorize("hasRole('ADMIN')")
public class AiSupervisionController {

    private final AiSupervisionService aiSupervisionService;

    @GetMapping("/stats")
    @Operation(summary = "Statistiques globales IA",
            description = "KPIs: total appels, succès/erreurs, tokens consommés, latence moyenne, répartition par feature/modèle, feedback moyen, tendance 30j.")
    public ResponseEntity<Map<String, Object>> getStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(aiSupervisionService.getAiStats(from, to));
    }

    @GetMapping("/logs")
    @Operation(summary = "Logs IA récents", description = "Retourne les N derniers logs d'appels IA (défaut: 50).")
    public ResponseEntity<List<AiUsageLog>> getRecentLogs(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(aiSupervisionService.getRecentLogs(limit));
    }

    @GetMapping("/failures")
    @Operation(summary = "Appels IA en erreur", description = "Retourne tous les logs d'appels IA ayant échoué.")
    public ResponseEntity<List<AiUsageLog>> getFailures() {
        return ResponseEntity.ok(aiSupervisionService.getFailures());
    }

    @PostMapping("/logs/{logId}/feedback")
    @Operation(summary = "Donner un feedback sur un appel IA",
            description = "Permet à un admin de noter (1-5) et commenter un appel IA.")
    public ResponseEntity<AiUsageLog> addFeedback(
            @PathVariable String logId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        Integer score = body.containsKey("score") ? ((Number) body.get("score")).intValue() : null;
        String comment = (String) body.get("comment");
        String adminId = auth != null ? auth.getName() : "unknown";
        return ResponseEntity.ok(aiSupervisionService.addFeedback(logId, adminId, score, comment));
    }

    @PostMapping("/log")
    @Operation(summary = "Enregistrer un appel IA",
            description = "Endpoint interne pour logger manuellement un appel IA (utile pour les services qui appellent l'IA directement).")
    public ResponseEntity<AiUsageLog> logCall(@RequestBody Map<String, Object> body, Authentication auth) {
        String userId = auth != null ? auth.getName() : (String) body.get("userId");
        AiUsageLog log = aiSupervisionService.logAiCall(
                (String) body.get("feature"),
                (String) body.get("modelUsed"),
                userId,
                (String) body.get("entityId"),
                (String) body.get("entityType"),
                body.containsKey("inputTokens") ? ((Number) body.get("inputTokens")).intValue() : null,
                body.containsKey("outputTokens") ? ((Number) body.get("outputTokens")).intValue() : null,
                body.containsKey("latencyMs") ? ((Number) body.get("latencyMs")).longValue() : null,
                body.containsKey("success") ? (Boolean) body.get("success") : true,
                (String) body.get("errorMessage")
        );
        return ResponseEntity.ok(log);
    }
}
