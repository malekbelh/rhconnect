package com.rhconnect.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "user_settings")
public class UserSettings {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    // Notifications
    @Builder.Default
    private Boolean emailCandidatures = true;
    @Builder.Default
    private Boolean emailOffres = true;
    @Builder.Default
    private Boolean emailMessages = true;
    @Builder.Default
    private Boolean notifPush = false;

    // Préférences profil
    @Builder.Default
    private String langue = "fr";
    @Builder.Default
    private Boolean profilPublic = true;
    @Builder.Default
    private Boolean cvPublic = false;

    // Paramètres entreprise
    @Builder.Default
    private Boolean notifNouvellesCandidatures = true;
    @Builder.Default
    private Boolean notifChangementStatut = true;
    @Builder.Default
    private Boolean emailRapportHebdo = false;
}
