package com.rhconnect.dto.request;

import com.rhconnect.model.enums.NiveauExperience;
import com.rhconnect.model.enums.OfferStatus;
import com.rhconnect.model.enums.TypeContrat;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOfferRequest {
    @NotBlank(message = "Titre requis")
    private String title;

    private String description;
    private List<String> competencesRequises;
    private NiveauExperience niveauExperience;
    private TypeContrat typeContrat;
    private String localisation;
    private Integer salaireMin;
    private Integer salaireMax;
    private LocalDate dateExpiration;
    private List<String> matchingTags;
    private OfferStatus statut;
}
