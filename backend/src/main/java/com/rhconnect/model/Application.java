package com.rhconnect.model;

import com.rhconnect.model.enums.ApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "applications")
public class Application {
    @Id
    private String id;

    private String candidateId;
    private String offerId;
    private String companyId;

    private ApplicationStatus statut;
    private List<ApplicationTimelineEntry> timeline;
    private Integer matchingScore;
    private String lettreMotivation;

    @Builder.Default
    private List<AdminNote> adminNotes = new java.util.ArrayList<>();

    @Builder.Default
    private Boolean disputeOpen = false;
    private String disputeMotif;
    private LocalDateTime disputeOpenedAt;
    private String disputeOpenedBy;
    private LocalDateTime disputeResolvedAt;
    private String disputeResolvedBy;

    @Builder.Default
    private Boolean dossierIncomplet = false;
    private String dossierIncompletMotif;

    @CreatedDate
    private LocalDateTime createdAt;
}
