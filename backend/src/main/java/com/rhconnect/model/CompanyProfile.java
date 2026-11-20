package com.rhconnect.model;

import com.rhconnect.model.enums.VerificationStatus;
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
@Document(collection = "company_profiles")
public class CompanyProfile {
    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private String companyName;
    private String siret;
    private String industry;  // Changed from 'sector' to match MongoDB seed data
    private String size;
    private String description;
    private String address;
    private String phone;
    private String logoFileId;
    private String logoFileName;
    private String website;

    private VerificationStatus verifiedStatus;
}
