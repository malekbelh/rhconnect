package com.rhconnect.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "ai_usage_logs")
public class AiUsageLog {

    @Id
    private String id;

    // Contexte de l'appel
    private String feature;          // ex: "matching", "cv_analysis", "job_suggestion"
    private String modelUsed;        // ex: "gemini-pro", "gpt-4"
    private String userId;           // qui a déclenché l'appel
    private String entityId;         // offerId, applicationId, candidateId concerné
    private String entityType;       // "offer", "application", "candidate"

    // Métriques
    private Integer inputTokens;
    private Integer outputTokens;
    private Integer totalTokens;
    private Long latencyMs;

    // Résultat
    private Boolean success;
    private String errorMessage;     // si erreur

    // Feedback admin
    private String feedbackAdminId;
    private Integer feedbackScore;   // 1-5
    private String feedbackComment;
    private LocalDateTime feedbackAt;

    @CreatedDate
    private LocalDateTime createdAt;
}
