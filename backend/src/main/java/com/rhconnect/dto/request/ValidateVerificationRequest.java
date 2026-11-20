package com.rhconnect.dto.request;

import com.rhconnect.model.enums.VerificationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidateVerificationRequest {
    @NotNull(message = "Statut requis")
    private VerificationStatus statut;

    private String commentaire;
}
