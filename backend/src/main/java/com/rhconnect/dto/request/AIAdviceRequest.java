package com.rhconnect.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIAdviceRequest {
    @NotBlank(message = "Type requis")
    @Pattern(regexp = "^(cv|lettre|profil)$", message = "Type doit être cv, lettre ou profil")
    private String type;

    private String offerId;
}
