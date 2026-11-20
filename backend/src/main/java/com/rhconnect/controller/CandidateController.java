package com.rhconnect.controller;

import com.rhconnect.dto.request.UpdateCandidateRequest;
import com.rhconnect.dto.response.CandidateProfileResponse;
import com.rhconnect.service.CandidateService;
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
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
@Tag(name = "Candidats", description = "Gestion des profils candidats")
public class CandidateController {

    private final CandidateService candidateService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Récupérer mon profil candidat", description = "Retourne le profil du candidat authentifié.")
    public ResponseEntity<CandidateProfileResponse> getMyProfile() {
        return ResponseEntity.ok(candidateService.getMyProfile());
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Mettre à jour mon profil", description = "Modifie les informations du profil candidat.")
    public ResponseEntity<CandidateProfileResponse> updateMyProfile(@Valid @RequestBody UpdateCandidateRequest request) {
        return ResponseEntity.ok(candidateService.updateMyProfile(request));
    }

    @PostMapping(value = "/me/cv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Téléverser mon CV", description = "Stocke le CV du candidat dans GridFS et met à jour la référence.")
    public ResponseEntity<CandidateProfileResponse> uploadCv(@RequestParam("cv") MultipartFile cv) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.uploadCv(cv));
    }

    @GetMapping("/me/cv")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Télécharger mon CV", description = "Récupère le fichier CV — inline pour PDF, attachment pour autres formats.")
    public ResponseEntity<Resource> downloadCv() {
        Resource resource = candidateService.downloadCv();
        String filename = candidateService.getCvFileName();
        if (filename == null) filename = "cv.pdf";
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");

        // Détecter le type MIME pour permettre la prévisualisation PDF dans le navigateur
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        String disposition = "attachment";
        if (filename.toLowerCase().endsWith(".pdf")) {
            mediaType = MediaType.APPLICATION_PDF;
            disposition = "inline";
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + filename + "\"; filename*=UTF-8''" + encodedFilename)
                .header("Access-Control-Expose-Headers", HttpHeaders.CONTENT_DISPOSITION)
                .body(resource);
    }

    @PostMapping(value = "/me/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Téléverser ma photo de profil", description = "Stocke la photo du candidat dans GridFS et met à jour la référence.")
    public ResponseEntity<CandidateProfileResponse> uploadPhoto(@RequestParam("photo") MultipartFile photo) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.uploadPhoto(photo));
    }

    @GetMapping("/me/photo")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Télécharger ma photo de profil", description = "Récupère le fichier photo — affichage inline dans le navigateur.")
    public ResponseEntity<Resource> downloadPhoto() {
        Resource resource = candidateService.downloadPhoto();
        String filename = candidateService.getPhotoFileName();
        if (filename == null) filename = "photo.png";
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) mediaType = MediaType.IMAGE_PNG;
        else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) mediaType = MediaType.IMAGE_JPEG;
        else if (lower.endsWith(".gif")) mediaType = MediaType.IMAGE_GIF;

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"; filename*=UTF-8''" + encodedFilename)
                .header("Access-Control-Expose-Headers", HttpHeaders.CONTENT_DISPOSITION)
                .body(resource);
    }

    @GetMapping("/{candidateId}/cv")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER','COMPANY')")
    @Operation(summary = "Télécharger le CV d'un candidat", description = "ADMIN/RECRUITER/COMPANY: Télécharge le CV d'un candidat par son ID.")
    public ResponseEntity<Resource> downloadCandidateCv(@PathVariable String candidateId) {
        Resource resource = candidateService.downloadCvByCandidateId(candidateId);
        String filename = candidateService.getCvFileNameByCandidateId(candidateId);
        if (filename == null) filename = "cv.pdf";
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        String disposition = "attachment";
        if (filename.toLowerCase().endsWith(".pdf")) {
            mediaType = MediaType.APPLICATION_PDF;
            disposition = "inline";
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + filename + "\"; filename*=UTF-8''" + encodedFilename)
                .header("Access-Control-Expose-Headers", HttpHeaders.CONTENT_DISPOSITION)
                .body(resource);
    }

    @GetMapping("/{candidateId}/photo")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER','COMPANY')")
    @Operation(summary = "Télécharger la photo d'un candidat", description = "ADMIN/RECRUITER/COMPANY: Récupère la photo du candidat par son ID ou son userId.")
    public ResponseEntity<Resource> downloadCandidatePhoto(@PathVariable String candidateId) {
        Resource resource = candidateService.downloadPhotoByCandidateId(candidateId);
        String filename = candidateService.getPhotoFileNameByCandidateId(candidateId);
        if (filename == null) filename = "photo.png";
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) mediaType = MediaType.IMAGE_PNG;
        else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) mediaType = MediaType.IMAGE_JPEG;
        else if (lower.endsWith(".gif")) mediaType = MediaType.IMAGE_GIF;

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"; filename*=UTF-8''" + encodedFilename)
                .header("Access-Control-Expose-Headers", HttpHeaders.CONTENT_DISPOSITION)
                .body(resource);
    }
}

