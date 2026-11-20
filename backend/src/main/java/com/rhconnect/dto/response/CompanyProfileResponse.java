package com.rhconnect.dto.response;

import com.rhconnect.model.enums.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyProfileResponse {
    private String id;
    private String userId;
    private String companyName;
    private String siret;
    private String sector;
    private String size;
    private String description;
    private String address;
    private String phone;
    private String email;
    private String website;
    private String logoFileId;
    private String logoFileName;
    private String logoBase64Data;
    private VerificationStatus verifiedStatus;
    private boolean verified;
}
