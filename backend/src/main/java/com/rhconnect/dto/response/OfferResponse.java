package com.rhconnect.dto.response;

import com.rhconnect.model.ModerationHistoryEntry;
import com.rhconnect.model.enums.NiveauExperience;
import com.rhconnect.model.enums.OfferStatus;
import com.rhconnect.model.enums.TypeContrat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfferResponse {
    private String id;
    private String companyId;
    private String companyName;
    private String title;
    private String description;
    private List<String> competencesRequises;
    private NiveauExperience niveauExperience;
    private TypeContrat typeContrat;
    private String localisation;
    private Integer salaireMin;
    private Integer salaireMax;
    private LocalDate datePublication;
    private LocalDate dateExpiration;
    private Instant createdAt;
    private Instant updatedAt;
    private OfferStatus statut;
    private List<String> matchingTags;
    private Integer matchingScore;

    // Champs modération admin
    private String moderatorId;
    private String moderatorEmail;
    private String moderatorName;
    private String moderationComment;
    private Instant moderatedAt;
    private List<ModerationHistoryEntry> moderationHistory;

    // Company Details (enrichissement)
    private String companySector;
    private String companyDescription;
    private String companyAddress;
    private String companyLogoFileId;
    private String companyWebsite;

    // Stats
    private Integer viewCount;
    private Integer applyCount;
    private Integer candidatureCount;
}
