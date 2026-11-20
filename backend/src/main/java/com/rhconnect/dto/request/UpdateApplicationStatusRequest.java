package com.rhconnect.dto.request;

import com.rhconnect.model.enums.ApplicationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateApplicationStatusRequest {
    @NotNull(message = "Statut requis")
    private ApplicationStatus statut;

    private String commentaire;
}
