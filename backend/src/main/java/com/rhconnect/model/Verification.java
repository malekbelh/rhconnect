package com.rhconnect.model;

import com.rhconnect.model.enums.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "verifications")
public class Verification {
    @Id
    private String id;

    private String candidateId;
    private List<VerificationDoc> pieces;
    private VerificationStatus statut;
    private String validatorId;
    private LocalDateTime validatedAt;
    private String commentaire;

    private String lockedByEmail;
    private LocalDateTime lockedAt;
    private String assignedToEmail;

    @Builder.Default
    private java.util.Map<String, Boolean> checklist = new java.util.HashMap<>();

    private LocalDateTime createdAt;
}
