package com.rhconnect.dto.response;

import com.rhconnect.model.enums.ApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimelineEntryResponse {
    private ApplicationStatus statut;
    private LocalDateTime date;
    private String acteurId;
    private String acteurName;
    private String commentaire;
}
