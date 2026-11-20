package com.rhconnect.service;

import com.rhconnect.model.AiUsageLog;
import com.rhconnect.repository.AiUsageLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiSupervisionService {

    private final AiUsageLogRepository aiUsageLogRepository;

    /**
     * Enregistre un appel IA dans les logs
     */
    public AiUsageLog logAiCall(String feature, String modelUsed, String userId,
                                 String entityId, String entityType,
                                 Integer inputTokens, Integer outputTokens,
                                 Long latencyMs, Boolean success, String errorMessage) {
        AiUsageLog log = AiUsageLog.builder()
                .feature(feature)
                .modelUsed(modelUsed)
                .userId(userId)
                .entityId(entityId)
                .entityType(entityType)
                .inputTokens(inputTokens)
                .outputTokens(outputTokens)
                .totalTokens(inputTokens != null && outputTokens != null ? inputTokens + outputTokens : null)
                .latencyMs(latencyMs)
                .success(success)
                .errorMessage(errorMessage)
                .build();
        return aiUsageLogRepository.save(log);
    }

    /**
     * Retourne les statistiques globales IA
     */
    public Map<String, Object> getAiStats(LocalDateTime from, LocalDateTime to) {
        List<AiUsageLog> logs;
        if (from != null && to != null) {
            logs = aiUsageLogRepository.findByCreatedAtBetween(from, to);
        } else {
            logs = aiUsageLogRepository.findAll();
        }

        long total = logs.size();
        long successes = logs.stream().filter(l -> Boolean.TRUE.equals(l.getSuccess())).count();
        long failures = logs.stream().filter(l -> Boolean.FALSE.equals(l.getSuccess())).count();

        // Tokens totaux
        long totalTokens = logs.stream()
                .filter(l -> l.getTotalTokens() != null)
                .mapToLong(AiUsageLog::getTotalTokens)
                .sum();

        // Latence moyenne
        OptionalDouble avgLatency = logs.stream()
                .filter(l -> l.getLatencyMs() != null)
                .mapToLong(AiUsageLog::getLatencyMs)
                .average();

        // Répartition par feature
        Map<String, Long> byFeature = logs.stream()
                .filter(l -> l.getFeature() != null)
                .collect(Collectors.groupingBy(AiUsageLog::getFeature, Collectors.counting()));

        // Répartition par modèle
        Map<String, Long> byModel = logs.stream()
                .filter(l -> l.getModelUsed() != null)
                .collect(Collectors.groupingBy(AiUsageLog::getModelUsed, Collectors.counting()));

        // Score feedback moyen
        OptionalDouble avgFeedback = logs.stream()
                .filter(l -> l.getFeedbackScore() != null)
                .mapToInt(AiUsageLog::getFeedbackScore)
                .average();

        // Tendance par jour (derniers 30j)
        LocalDateTime last30 = LocalDateTime.now().minusDays(30);
        Map<String, Long> byDay = logs.stream()
                .filter(l -> l.getCreatedAt() != null && l.getCreatedAt().isAfter(last30))
                .collect(Collectors.groupingBy(
                        l -> l.getCreatedAt().toLocalDate().toString(),
                        Collectors.counting()
                ));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", total);
        result.put("successes", successes);
        result.put("failures", failures);
        result.put("successRate", total > 0 ? (double) successes / total * 100 : 0.0);
        result.put("totalTokens", totalTokens);
        result.put("avgLatencyMs", avgLatency.isPresent() ? avgLatency.getAsDouble() : null);
        result.put("avgFeedbackScore", avgFeedback.isPresent() ? avgFeedback.getAsDouble() : null);
        result.put("byFeature", byFeature);
        result.put("byModel", byModel);
        result.put("callsPerDay", byDay);
        return result;
    }

    /**
     * Ajoute un feedback admin sur un log IA
     */
    public AiUsageLog addFeedback(String logId, String adminId, Integer score, String comment) {
        AiUsageLog log = aiUsageLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Log IA introuvable: " + logId));
        log.setFeedbackAdminId(adminId);
        log.setFeedbackScore(score);
        log.setFeedbackComment(comment);
        log.setFeedbackAt(LocalDateTime.now());
        return aiUsageLogRepository.save(log);
    }

    public List<AiUsageLog> getRecentLogs(int limit) {
        return aiUsageLogRepository.findAll().stream()
                .sorted(Comparator.comparing(AiUsageLog::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<AiUsageLog> getFailures() {
        return aiUsageLogRepository.findBySuccessFalse();
    }
}
