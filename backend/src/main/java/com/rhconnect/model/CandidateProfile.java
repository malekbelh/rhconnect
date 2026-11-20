package com.rhconnect.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "candidate_profiles")
public class CandidateProfile {
    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private String firstName;
    private String lastName;
    private String phone;
    private String address;
    private String bio;

    private List<String> competences;
    private List<Experience> parcours;
    private List<Formation> formation;

    private String cvFileId;
    private String cvFileName;

    private String photoFileId;
    private String photoFileName;

    private List<String> matchingTags;
}
