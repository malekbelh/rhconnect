package com.rhconnect.model;

import com.rhconnect.model.enums.NiveauExperience;
import com.rhconnect.model.enums.OfferStatus;
import com.rhconnect.model.enums.TypeContrat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "offers")
public class Offer {
    @Id
    private String id;

    private String companyId;
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

    private OfferStatus statut;

    private List<String> matchingTags;

    private Integer viewCount;

    private String moderatorId;
    private String moderationComment;
    private Instant moderatedAt;
    private Instant createdAt;
    private Instant updatedAt;

    @Builder.Default
    private List<ModerationHistoryEntry> moderationHistory = new ArrayList<>();
}
