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
public class UploadPieceRequest {
    @NotBlank(message = "Nom du fichier requis")
    private String nomFichier;

    @NotBlank(message = "Type de fichier requis")
    private String type;
}
