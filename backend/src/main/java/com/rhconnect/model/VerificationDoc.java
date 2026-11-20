package com.rhconnect.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationDoc {
    private String id;
    private String nomFichier;
    private String type;
    private Long taille;
    private String fileId;
    private LocalDateTime uploadedAt;
}
