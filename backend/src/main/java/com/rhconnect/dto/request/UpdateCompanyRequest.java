package com.rhconnect.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCompanyRequest {
    private String companyName;
    private String siret;
    private String sector;
    private String size;
    private String description;
    private String address;
    private String phone;
    private String website;
}
