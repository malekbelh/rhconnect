package com.rhconnect.dto.response;

import com.rhconnect.model.Experience;
import com.rhconnect.model.Formation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateProfileResponse {
    private String id;
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
