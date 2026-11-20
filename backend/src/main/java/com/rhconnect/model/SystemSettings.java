package com.rhconnect.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "system_settings")
public class SystemSettings {

    @Id
    private String id;

    // Maintenance
    @Builder.Default
    private Boolean maintenanceMode = false;
    private String maintenanceMessage;
    private LocalDateTime maintenancePlannedUntil;

    // Upload limits
    @Builder.Default
    private Long maxFileSizeMb = 10L;
    @Builder.Default
    private List<String> allowedExtensions = List.of("pdf", "docx", "jpg", "jpeg", "png");

    // Email notifications triggers
    @Builder.Default
    private Boolean notifyOnNewUser = true;
    @Builder.Default
    private Boolean notifyOnNewApplication = false;
    @Builder.Default
    private Boolean notifyOnDisputeOpened = true;
    @Builder.Default
    private Boolean notifyOnVerificationRequest = true;
    private String adminNotificationEmail;

    // Catégories de postes
    @Builder.Default
    private List<String> jobCategories = new ArrayList<>();

    // Référentiels compétences
    @Builder.Default
    private List<String> skillsReferential = new ArrayList<>();

    // Référentiels types de contrat personnalisés (en plus des enums existants)
    @Builder.Default
    private List<String> customContractTypes = new ArrayList<>();

    // Métadonnées
    @LastModifiedDate
    private LocalDateTime updatedAt;
    private String updatedBy;
}
