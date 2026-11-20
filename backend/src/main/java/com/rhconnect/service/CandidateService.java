package com.rhconnect.service;

import com.rhconnect.dto.request.UpdateCandidateRequest;
import com.rhconnect.dto.response.CandidateProfileResponse;
import com.rhconnect.exception.BusinessException;
import com.rhconnect.model.CandidateProfile;
import com.rhconnect.repository.CandidateProfileRepository;
import com.rhconnect.service.util.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class CandidateService {

    private final CandidateProfileRepository candidateProfileRepository;
    private final FileStorageService fileStorageService;

    public CandidateProfileResponse getMyProfile() {
        String userId = CurrentUserService.getCurrentUserId();
        CandidateProfile profile = candidateProfileRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyProfile(userId));
        return toResponse(profile);
    }

    public CandidateProfileResponse updateMyProfile(UpdateCandidateRequest request) {
        String userId = CurrentUserService.getCurrentUserId();
        CandidateProfile profile = candidateProfileRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyProfile(userId));

        if (request.getFirstName() != null) profile.setFirstName(request.getFirstName());
        if (request.getLastName() != null) profile.setLastName(request.getLastName());
        if (request.getPhone() != null) profile.setPhone(request.getPhone());
        if (request.getAddress() != null) profile.setAddress(request.getAddress());
        if (request.getBio() != null) profile.setBio(request.getBio());
        if (request.getCompetences() != null) profile.setCompetences(request.getCompetences());
        if (request.getParcours() != null) profile.setParcours(request.getParcours());
        if (request.getFormation() != null) profile.setFormation(request.getFormation());
        if (request.getMatchingTags() != null) profile.setMatchingTags(request.getMatchingTags());

        return toResponse(candidateProfileRepository.save(profile));
    }

    public CandidateProfileResponse uploadCv(MultipartFile file) throws IOException {
        String userId = CurrentUserService.getCurrentUserId();
        CandidateProfile profile = candidateProfileRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyProfile(userId));

        if (profile.getCvFileId() != null) {
            fileStorageService.deleteFile(profile.getCvFileId());
        }

        String ext = "";
        String orig = file.getOriginalFilename();
        if (orig != null && orig.contains(".")) {
            ext = orig.substring(orig.lastIndexOf("."));
        }
        String filename = "cv-" + userId + "-" + System.currentTimeMillis() + ext;
        String fileId = fileStorageService.uploadFile(filename, file);
        profile.setCvFileId(fileId);
        profile.setCvFileName(file.getOriginalFilename());

        return toResponse(candidateProfileRepository.save(profile));
    }

    public CandidateProfileResponse uploadPhoto(MultipartFile file) throws IOException {
        String userId = CurrentUserService.getCurrentUserId();
        CandidateProfile profile = candidateProfileRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyProfile(userId));

        if (profile.getPhotoFileId() != null) {
            fileStorageService.deleteFile(profile.getPhotoFileId());
        }

        String ext = "";
        String orig = file.getOriginalFilename();
        if (orig != null && orig.contains(".")) {
            ext = orig.substring(orig.lastIndexOf("."));
        }
        String filename = "photo-" + userId + "-" + System.currentTimeMillis() + ext;
        String fileId = fileStorageService.uploadFile(filename, file);
        profile.setPhotoFileId(fileId);
        profile.setPhotoFileName(file.getOriginalFilename());

        return toResponse(candidateProfileRepository.save(profile));
    }

    public Resource downloadPhoto() {
        String userId = CurrentUserService.getCurrentUserId();
        CandidateProfile profile = candidateProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Profil candidat introuvable", "PROFILE_NOT_FOUND"));

        if (profile.getPhotoFileId() == null || !isValidObjectId(profile.getPhotoFileId())) {
            throw new BusinessException("Photo non téléchargée", "PHOTO_NOT_FOUND");
        }
        return fileStorageService.downloadFile(profile.getPhotoFileId());
    }

    public String getPhotoFileName() {
        String userId = CurrentUserService.getCurrentUserId();
        CandidateProfile profile = candidateProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Profil candidat introuvable", "PROFILE_NOT_FOUND"));
        return profile.getPhotoFileName();
    }

    public Resource downloadCv() {
        String userId = CurrentUserService.getCurrentUserId();
        CandidateProfile profile = candidateProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Profil candidat introuvable", "PROFILE_NOT_FOUND"));

        if (profile.getCvFileId() == null || !isValidObjectId(profile.getCvFileId())) {
            throw new BusinessException("CV non téléchargé", "CV_NOT_FOUND");
        }
        return fileStorageService.downloadFile(profile.getCvFileId());
    }

    public String getCvFileName() {
        String userId = CurrentUserService.getCurrentUserId();
        CandidateProfile profile = candidateProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Profil candidat introuvable", "PROFILE_NOT_FOUND"));
        return profile.getCvFileName();
    }

    public Resource downloadCvByCandidateId(String candidateId) {
        CandidateProfile profile = resolveCandidateProfile(candidateId);

        if (profile.getCvFileId() == null || !isValidObjectId(profile.getCvFileId())) {
            return new ByteArrayResource("PDF vide".getBytes());
        }
        return fileStorageService.downloadFile(profile.getCvFileId());
    }

    public String getCvFileNameByCandidateId(String candidateId) {
        CandidateProfile profile = resolveCandidateProfile(candidateId);
        return profile.getCvFileName();
    }

    public Resource downloadPhotoByCandidateId(String candidateId) {
        CandidateProfile profile = resolveCandidateProfile(candidateId);

        if (profile.getPhotoFileId() == null || !isValidObjectId(profile.getPhotoFileId())) {
            throw new BusinessException("Photo non téléchargée", "PHOTO_NOT_FOUND");
        }
        return fileStorageService.downloadFile(profile.getPhotoFileId());
    }

    public String getPhotoFileNameByCandidateId(String candidateId) {
        CandidateProfile profile = resolveCandidateProfile(candidateId);
        return profile.getPhotoFileName();
    }

    public CandidateProfile getCurrentCandidateProfile() {
        String userId = CurrentUserService.getCurrentUserId();
        return candidateProfileRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyProfile(userId));
    }

    private CandidateProfile createEmptyProfile(String userId) {
        CandidateProfile profile = CandidateProfile.builder()
                .userId(userId)
                .build();
        return candidateProfileRepository.save(profile);
    }

    private CandidateProfile resolveCandidateProfile(String candidateId) {
        return candidateProfileRepository.findById(candidateId)
                .or(() -> candidateProfileRepository.findByUserId(candidateId))
                .orElseThrow(() -> new BusinessException("Profil candidat introuvable", "PROFILE_NOT_FOUND"));
    }

    private CandidateProfileResponse toResponse(CandidateProfile p) {
        String cvFileId = isValidObjectId(p.getCvFileId()) ? p.getCvFileId() : null;
        String cvFileName = cvFileId != null ? p.getCvFileName() : null;
        String photoFileId = isValidObjectId(p.getPhotoFileId()) ? p.getPhotoFileId() : null;
        String photoFileName = photoFileId != null ? p.getPhotoFileName() : null;

        return CandidateProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .phone(p.getPhone())
                .address(p.getAddress())
                .bio(p.getBio())
                .competences(p.getCompetences())
                .parcours(p.getParcours())
                .formation(p.getFormation())
                .cvFileId(cvFileId)
                .cvFileName(cvFileName)
                .photoFileId(photoFileId)
                .photoFileName(photoFileName)
                .matchingTags(p.getMatchingTags())
                .build();
    }

    private boolean isValidObjectId(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }

        try {
            new ObjectId(value);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
