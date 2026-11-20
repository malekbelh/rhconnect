package com.rhconnect.controller;

import com.rhconnect.dto.request.UpdateCompanyRequest;
import com.rhconnect.dto.response.CompanyProfileResponse;
import com.rhconnect.service.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@Tag(name = "Entreprises", description = "Gestion des profils entreprises")
@PreAuthorize("hasRole('COMPANY')")
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping("/me")
    @Operation(summary = "Récupérer mon profil entreprise", description = "Retourne le profil de l'entreprise authentifiée.")
    public ResponseEntity<CompanyProfileResponse> getMyProfile() {
        return ResponseEntity.ok(companyService.getMyProfile());
    }

    @PutMapping("/me")
    @Operation(summary = "Mettre à jour mon profil", description = "Modifie les informations du profil entreprise.")
    public ResponseEntity<CompanyProfileResponse> updateMyProfile(@Valid @RequestBody UpdateCompanyRequest request) {
        return ResponseEntity.ok(companyService.updateMyProfile(request));
    }

    @PostMapping(value = "/me/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Téléverser mon logo", description = "Stocke le logo de l'entreprise dans GridFS et met à jour la référence.")
    public ResponseEntity<CompanyProfileResponse> uploadLogo(@RequestParam("logo") MultipartFile logo) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED).body(companyService.uploadLogo(logo));
    }

    @GetMapping("/me/logo")
    @Operation(summary = "Télécharger mon logo", description = "Récupère le fichier logo.")
    public ResponseEntity<Resource> downloadLogo() {
        Resource resource = companyService.downloadLogo();
        String filename = companyService.getLogoFileName();
        if (filename == null) filename = "logo.png";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }
}
