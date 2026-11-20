package com.rhconnect.dto.response;

import com.rhconnect.model.enums.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationResponse {
    private String id;
    private String candidateId;
    private List<VerificationDocResponse> pieces;
    private VerificationStatus statut;
    private String validatorId;
    private LocalDateTime validatedAt;
    private String commentaire;

    private String candidatName;
    private String candidatEmail;
    private String profileType; // "COMPANY" or "CANDIDATE"
    private String siret; // RNE / Matricule fiscal
    private String industry; // Secteur d'activité
    private String size; // Taille de l'entreprise
    private String description;
    private String address;
    private String phone;
    private String website;

    private String assignedToEmail;
    private java.util.Map<String, Boolean> checklist;
    private String lockedByEmail;
    private LocalDateTime lockedAt;
    private LocalDateTime createdAt;
    private Boolean isLocked;
    private Long lockRemainingSeconds;
}
