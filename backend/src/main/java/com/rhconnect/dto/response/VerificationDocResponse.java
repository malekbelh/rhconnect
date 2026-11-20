package com.rhconnect.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationDocResponse {
    private String id;
    private String nomFichier;
    private String type;
    private Long taille;
    private LocalDateTime uploadedAt;
}
