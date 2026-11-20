package com.rhconnect.dto.response;

import com.rhconnect.model.enums.ApplicationStatus;
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
public class ApplicationResponse {
    private String id;
    private String candidateId;
    private String offerId;
    private String companyId;
    private ApplicationStatus statut;
    private List<TimelineEntryResponse> timeline;
    private Integer matchingScore;
    private String lettreMotivation;
    private LocalDateTime createdAt;
    private String candidatName;
    private String candidateEmail;
    private String offerTitle;
    private String companyName;
    private List<com.rhconnect.model.AdminNote> adminNotes;
    private Boolean disputeOpen;
    private String disputeMotif;
    private LocalDateTime disputeOpenedAt;
    private LocalDateTime disputeResolvedAt;
    private Boolean dossierIncomplet;
    private String dossierIncompletMotif;
}
