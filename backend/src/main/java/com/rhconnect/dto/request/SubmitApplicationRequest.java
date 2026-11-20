package com.rhconnect.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitApplicationRequest {
    @NotBlank(message = "ID de l'offre requis")
    private String offerId;

    private String lettreMotivation;
}
