package com.rhconnect.service;

import com.rhconnect.dto.request.UpdateCompanyRequest;
import com.rhconnect.dto.response.CompanyProfileResponse;
import com.rhconnect.exception.BusinessException;
import com.rhconnect.model.CompanyProfile;
import com.rhconnect.model.enums.VerificationStatus;
import com.rhconnect.repository.CompanyProfileRepository;
import com.rhconnect.service.util.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.rhconnect.model.User;
import com.rhconnect.repository.UserRepository;
import java.io.IOException;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyProfileRepository companyProfileRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public CompanyProfileResponse getMyProfile() {
        String userId = CurrentUserService.getCurrentUserId();
        CompanyProfile profile = companyProfileRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyProfile(userId));
        return toResponse(profile);
    }

    public CompanyProfileResponse updateMyProfile(UpdateCompanyRequest request) {
        String userId = CurrentUserService.getCurrentUserId();
        CompanyProfile profile = companyProfileRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyProfile(userId));

        if (request.getCompanyName() != null) profile.setCompanyName(request.getCompanyName());
        if (request.getSiret() != null) profile.setSiret(request.getSiret());
        if (request.getSector() != null) profile.setIndustry(request.getSector());
        if (request.getSize() != null) profile.setSize(request.getSize());
        if (request.getDescription() != null) profile.setDescription(request.getDescription());
        if (request.getAddress() != null) profile.setAddress(request.getAddress());
        if (request.getPhone() != null) profile.setPhone(request.getPhone());
        if (request.getWebsite() != null) profile.setWebsite(request.getWebsite());

        return toResponse(companyProfileRepository.save(profile));
    }

    public CompanyProfileResponse uploadLogo(MultipartFile file) throws IOException {
        String userId = CurrentUserService.getCurrentUserId();
        CompanyProfile profile = companyProfileRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyProfile(userId));

        if (profile.getLogoFileId() != null) {
            fileStorageService.deleteFile(profile.getLogoFileId());
        }

        String ext = "";
        String orig = file.getOriginalFilename();
        if (orig != null && orig.contains(".")) {
            ext = orig.substring(orig.lastIndexOf("."));
        }
        String filename = "logo-" + userId + "-" + System.currentTimeMillis() + ext;
        String fileId = fileStorageService.uploadFile(filename, file);
        profile.setLogoFileId(fileId);
        profile.setLogoFileName(file.getOriginalFilename());

        // Encode image to base64 for immediate display
        byte[] imageBytes = file.getBytes();
        String base64Image = java.util.Base64.getEncoder().encodeToString(imageBytes);
        String contentType = file.getContentType() != null ? file.getContentType() : "image/png";
        String logoDataUrl = "data:" + contentType + ";base64," + base64Image;

        CompanyProfileResponse response = toResponse(companyProfileRepository.save(profile));
        response.setLogoBase64Data(logoDataUrl);
        return response;
    }

    public Resource downloadLogo() {
        String userId = CurrentUserService.getCurrentUserId();
        CompanyProfile profile = companyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Profil entreprise introuvable", "PROFILE_NOT_FOUND"));

        if (profile.getLogoFileId() == null) {
            throw new BusinessException("Logo non téléchargé", "LOGO_NOT_FOUND");
        }
        return fileStorageService.downloadFile(profile.getLogoFileId());
    }

    public String getLogoFileName() {
        String userId = CurrentUserService.getCurrentUserId();
        CompanyProfile profile = companyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Profil entreprise introuvable", "PROFILE_NOT_FOUND"));
        return profile.getLogoFileName();
    }

    public CompanyProfile getCurrentCompanyProfile() {
        String userId = CurrentUserService.getCurrentUserId();
        return companyProfileRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyProfile(userId));
    }

    public CompanyProfile getCompanyProfileByUserId(String userId) {
        return companyProfileRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyProfile(userId));
    }

    public CompanyProfile getCompanyProfileById(String companyId) {
        return companyProfileRepository.findById(companyId)
                .orElseThrow(() -> new BusinessException("Profil entreprise introuvable", "PROFILE_NOT_FOUND"));
    }

    private CompanyProfile createEmptyProfile(String userId) {
        CompanyProfile profile = CompanyProfile.builder()
                .userId(userId)
                .verifiedStatus(VerificationStatus.EN_ATTENTE)
                .build();
        return companyProfileRepository.save(profile);
    }

    private CompanyProfileResponse toResponse(CompanyProfile p) {
        String email = null;
        boolean userVerified = false;
        if (p.getUserId() != null) {
            User user = userRepository.findById(p.getUserId()).orElse(null);
            if (user != null) {
                email = user.getEmail();
                userVerified = user.isVerified();
            }
        }
        boolean isVerified = p.getVerifiedStatus() == VerificationStatus.VALIDE || userVerified;

        return CompanyProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .companyName(p.getCompanyName())
                .siret(p.getSiret())
                .sector(p.getIndustry())
                .size(p.getSize())
                .description(p.getDescription())
                .address(p.getAddress())
                .phone(p.getPhone())
                .email(email)
                .website(p.getWebsite())
                .logoFileId(p.getLogoFileId())
                .logoFileName(p.getLogoFileName())
                .verifiedStatus(p.getVerifiedStatus())
                .verified(isVerified)
                .build();
    }
}
