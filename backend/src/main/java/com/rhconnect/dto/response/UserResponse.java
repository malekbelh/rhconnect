package com.rhconnect.dto.response;

import com.rhconnect.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private String id;
    private String email;
    private List<Role> roles;
    private boolean enabled;
    private boolean verified;
    private LocalDateTime createdAt;
    private CandidateProfileResponse candidateProfile;
    private CompanyProfileResponse companyProfile;
}
