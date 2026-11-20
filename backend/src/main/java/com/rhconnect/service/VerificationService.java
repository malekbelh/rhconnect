package com.rhconnect.service;

import com.rhconnect.dto.request.ValidateVerificationRequest;
import com.rhconnect.dto.response.VerificationDocResponse;
import com.rhconnect.dto.response.VerificationResponse;
import com.rhconnect.exception.BusinessException;
import com.rhconnect.model.CandidateProfile;
import com.rhconnect.model.Verification;
import com.rhconnect.model.VerificationDoc;
import com.rhconnect.model.User;
import com.rhconnect.model.enums.Role;
import com.rhconnect.model.enums.VerificationStatus;
import com.rhconnect.model.CompanyProfile;
import com.rhconnect.repository.CandidateProfileRepository;
import com.rhconnect.repository.CompanyProfileRepository;
import com.rhconnect.repository.VerificationRepository;
import com.rhconnect.service.util.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VerificationService {

    private final VerificationRepository verificationRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final com.rhconnect.repository.UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final ApplicationService applicationService;
    private final UserNotificationService userNotificationService;
    private final EmailNotificationService emailNotificationService;

    public VerificationResponse getCompanyVerification() {
        String userId = CurrentUserService.getCurrentUserId();
        CompanyProfile cp = companyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Profil entreprise introuvable", "PROFILE_NOT_FOUND"));

        Verification verification = verificationRepository.findByCandidateId(cp.getId())
                .orElseGet(() -> createEmptyVerification(cp.getId()));
        return toCompanyResponse(verification, cp);
    }

    public VerificationResponse uploadCompanyPiece(MultipartFile fichier, String nomFichier, String type) throws IOException {
        String userId = CurrentUserService.getCurrentUserId();
        CompanyProfile cp = companyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Profil entreprise introuvable", "PROFILE_NOT_FOUND"));

        Verification verification = verificationRepository.findByCandidateId(cp.getId())
                .orElseGet(() -> createEmptyVerification(cp.getId()));

        String ext = "";
        String orig = fichier.getOriginalFilename();
        if (orig != null && orig.contains(".")) {
            ext = orig.substring(orig.lastIndexOf("."));
        }
        String fileStorageName = "verif-company-" + cp.getId() + "-" + System.currentTimeMillis() + ext;
        String fileId = fileStorageService.uploadFile(fileStorageName, fichier);

        VerificationDoc doc = VerificationDoc.builder()
                .id(UUID.randomUUID().toString())
                .nomFichier(nomFichier != null ? nomFichier : fichier.getOriginalFilename())
                .type(type)
                .taille(fichier.getSize())
                .fileId(fileId)
                .uploadedAt(LocalDateTime.now())
                .build();

        if (verification.getPieces() == null) {
            verification.setPieces(new ArrayList<>());
        }
        verification.getPieces().add(doc);

        if (verification.getStatut() != VerificationStatus.VALIDE) {
            verification.setStatut(VerificationStatus.EN_ATTENTE);
        }

        Verification saved = verificationRepository.save(verification);
        VerificationResponse response = toCompanyResponse(saved, cp);

        try {
            if (verification.getPieces().size() == 1) {
                String companyName = cp.getCompanyName() != null ? cp.getCompanyName() : "Entreprise";
                userNotificationService.createAdminNotification(
                        "COMPANY_VERIFICATION_SUBMITTED",
                        "Nouvelle vérification d'entreprise",
                        "L'entreprise " + companyName + " a soumis des documents légaux pour vérification.",
                        "/admin/verifications"
                );
            }
        } catch (Exception e) {
            // Ne pas bloquer le flux si la notification échoue
        }

        return response;
    }

    public VerificationResponse getMyVerification() {
        String userId = CurrentUserService.getCurrentUserId();
        CandidateProfile cp = candidateProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Profil candidat introuvable", "PROFILE_NOT_FOUND"));

        Verification verification = verificationRepository.findByCandidateId(cp.getId())
                .orElseGet(() -> createEmptyVerification(cp.getId()));
        return toResponse(verification);
    }

    public VerificationResponse uploadPiece(MultipartFile fichier, String nomFichier, String type) throws IOException {
        String userId = CurrentUserService.getCurrentUserId();
        CandidateProfile cp = candidateProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Profil candidat introuvable", "PROFILE_NOT_FOUND"));

        Verification verification = verificationRepository.findByCandidateId(cp.getId())
                .orElseGet(() -> createEmptyVerification(cp.getId()));

        String ext = "";
        String orig = fichier.getOriginalFilename();
        if (orig != null && orig.contains(".")) {
            ext = orig.substring(orig.lastIndexOf("."));
        }
        String fileStorageName = "verif-" + cp.getId() + "-" + System.currentTimeMillis() + ext;
        String fileId = fileStorageService.uploadFile(fileStorageName, fichier);

        VerificationDoc doc = VerificationDoc.builder()
                .id(UUID.randomUUID().toString())
                .nomFichier(nomFichier != null ? nomFichier : fichier.getOriginalFilename())
                .type(type)
                .taille(fichier.getSize())
                .fileId(fileId)
                .uploadedAt(LocalDateTime.now())
                .build();

        if (verification.getPieces() == null) {
            verification.setPieces(new ArrayList<>());
        }
        verification.getPieces().add(doc);

        if (verification.getStatut() != VerificationStatus.VALIDE) {
            verification.setStatut(VerificationStatus.EN_ATTENTE);
        }

        VerificationResponse response = toResponse(verificationRepository.save(verification));
        
        // Notifier les admins quand une vérification est soumise
        try {
            if (verification.getPieces().size() == 1) {
                // First piece uploaded = new verification request
                String candidateName = (cp.getFirstName() != null ? cp.getFirstName() : "Candidat") + 
                                      " " + (cp.getLastName() != null ? cp.getLastName() : "");
                userNotificationService.createAdminNotification(
                        "VERIFICATION_SUBMITTED",
                        "Nouvelle demande de vérification",
                        candidateName + " a soumis des documents pour vérification.",
                        "/admin/verifications/" + verification.getId()
                );
            }
        } catch (Exception e) {
            // Ne pas bloquer le flux si la notification échoue
        }
        
        return response;
    }

    public void syncCompanyVerifications() {
        try {
            List<CompanyProfile> companies = companyProfileRepository.findAll();
            for (CompanyProfile comp : companies) {
                if (comp.getId() == null) continue;
                Verification v = verificationRepository.findByCandidateId(comp.getId()).orElse(null);
                if (v == null && comp.getUserId() != null) {
                    v = verificationRepository.findByCandidateId(comp.getUserId()).orElse(null);
                }
                if (v == null) {
                    VerificationStatus st = comp.getVerifiedStatus() != null ? comp.getVerifiedStatus() : VerificationStatus.EN_ATTENTE;
                    v = Verification.builder()
                            .candidateId(comp.getId())
                            .pieces(new ArrayList<>())
                            .statut(st)
                            .createdAt(LocalDateTime.now())
                            .build();
                    verificationRepository.save(v);
                }
            }
        } catch (Exception e) {
            // Ignore
        }
    }

    public List<VerificationResponse> getPendingVerifications() {
        syncCompanyVerifications();
        List<Verification> list = verificationRepository.findByStatut(VerificationStatus.EN_ATTENTE);
        list.sort(Comparator.comparing(v -> {
            if (v.getPieces() == null || v.getPieces().isEmpty()) {
                return v.getCreatedAt() != null ? v.getCreatedAt() : LocalDateTime.MIN;
            }
            return v.getPieces().get(v.getPieces().size() - 1).getUploadedAt();
        }, Comparator.reverseOrder()));
        return list.stream().map(this::toResponse).toList();
    }

    public List<VerificationResponse> getAllVerifications(String status) {
        syncCompanyVerifications();
        List<Verification> list;
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            try {
                VerificationStatus st = VerificationStatus.valueOf(status.toUpperCase());
                list = verificationRepository.findByStatut(st);
            } catch (IllegalArgumentException e) {
                list = verificationRepository.findAll();
            }
        } else {
            list = verificationRepository.findAll();
        }
        list.sort(Comparator.comparing(v -> {
            if (v.getPieces() == null || v.getPieces().isEmpty()) {
                return v.getCreatedAt() != null ? v.getCreatedAt() : LocalDateTime.MIN;
            }
            return v.getPieces().get(v.getPieces().size() - 1).getUploadedAt();
        }, Comparator.reverseOrder()));
        return list.stream().map(this::toResponse).toList();
    }

    public VerificationResponse getVerificationById(String id) {
        Verification v = verificationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Vérification introuvable", "VERIFICATION_NOT_FOUND"));
        return toResponse(v);
    }

    public Resource downloadPiece(String verificationId, String pieceId) {
        Verification v = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new BusinessException("Vérification introuvable", "VERIFICATION_NOT_FOUND"));
        checkVerificationAccess(v);

        VerificationDoc doc = null;
        if (v.getPieces() != null) {
            for (VerificationDoc d : v.getPieces()) {
                if (d.getId() != null && d.getId().equals(pieceId)) {
                    doc = d;
                    break;
                }
            }
        }
        if (doc == null) {
            throw new BusinessException("Pièce introuvable", "PIECE_NOT_FOUND");
        }
        return fileStorageService.downloadFile(doc.getFileId());
    }

    public String getPieceFileName(String verificationId, String pieceId) {
        Verification v = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new BusinessException("Vérification introuvable", "VERIFICATION_NOT_FOUND"));
        if (v.getPieces() != null) {
            for (VerificationDoc d : v.getPieces()) {
                if (d.getId() != null && d.getId().equals(pieceId)) {
                    return d.getNomFichier();
                }
            }
        }
        return "piece";
    }

    public VerificationResponse validateVerification(String id, ValidateVerificationRequest request) {
        Verification v = verificationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Vérification introuvable", "VERIFICATION_NOT_FOUND"));

        if (request.getStatut() != VerificationStatus.VALIDE && request.getStatut() != VerificationStatus.REJETE) {
            throw new BusinessException("Statut invalide, doit être VALIDE ou REJETE", "INVALID_STATUS");
        }

        String validatorId = CurrentUserService.getCurrentUserId();
        v.setStatut(request.getStatut());
        v.setValidatorId(validatorId);
        v.setValidatedAt(LocalDateTime.now());
        v.setCommentaire(request.getCommentaire());

        Verification saved = verificationRepository.save(v);

        if (request.getStatut() == VerificationStatus.VALIDE) {
            applicationService.propagerStatutCandidaturesDuCandidat(v.getCandidateId());
            CandidateProfile cp = candidateProfileRepository.findById(v.getCandidateId()).orElse(null);
            if (cp != null && cp.getUserId() != null) {
                userNotificationService.createCandidateNotification(
                        cp.getUserId(),
                        "VERIFICATION_VALIDATED",
                        "Dossier certifié ✓",
                        "Toutes vos pièces justificatives ont été vérifiées. Votre badge Certifié est actif.",
                        "/candidate/verification"
                );
                
                // Envoyer email de confirmation
                User candidateUser = userRepository.findById(cp.getUserId()).orElse(null);
                if (candidateUser != null) {
                    String userName = cp.getFirstName() != null ? cp.getFirstName() : "Candidat";
                    emailNotificationService.sendVerificationApprovedAsync(candidateUser.getEmail(), userName);
                }
            } else {
                CompanyProfile comp = companyProfileRepository.findById(v.getCandidateId()).orElse(null);
                if (comp == null) {
                    comp = companyProfileRepository.findByUserId(v.getCandidateId()).orElse(null);
                }
                if (comp != null) {
                    comp.setVerifiedStatus(VerificationStatus.VALIDE);
                    companyProfileRepository.save(comp);
                    if (comp.getUserId() != null) {
                        userRepository.findById(comp.getUserId()).ifPresent(u -> {
                            u.setVerified(true);
                            userRepository.save(u);
                        });
                        userNotificationService.createCandidateNotification(
                                comp.getUserId(),
                                "COMPANY_VERIFIED",
                                "Entreprise validée ✓",
                                "Votre dossier RNE a été validé avec succès. Vous pouvez maintenant publier vos offres d'emploi !",
                                "/company/profile?tab=verification"
                        );
                    }
                }
            }
        } else if (request.getStatut() == VerificationStatus.REJETE) {
            CandidateProfile cp = candidateProfileRepository.findById(v.getCandidateId()).orElse(null);
            if (cp != null && cp.getUserId() != null) {
                userNotificationService.createCandidateNotification(
                        cp.getUserId(),
                        "VERIFICATION_REJECTED",
                        "Document rejeté — action requise",
                        request.getCommentaire() != null && !request.getCommentaire().isBlank()
                                ? "Une pièce justificative a été rejetée : " + request.getCommentaire()
                                : "Une pièce justificative a été rejetée. Veuillez déposer une version corrigée.",
                        "/candidate/verification"
                );
                
                // Envoyer email de rejet
                User candidateUser = userRepository.findById(cp.getUserId()).orElse(null);
                if (candidateUser != null) {
                    String userName = cp.getFirstName() != null ? cp.getFirstName() : "Candidat";
                    emailNotificationService.sendVerificationRejectedAsync(
                        candidateUser.getEmail(), 
                        userName, 
                        request.getCommentaire()
                    );
                }
            } else {
                CompanyProfile comp = companyProfileRepository.findById(v.getCandidateId()).orElse(null);
                if (comp == null) {
                    comp = companyProfileRepository.findByUserId(v.getCandidateId()).orElse(null);
                }
                if (comp != null) {
                    comp.setVerifiedStatus(VerificationStatus.REJETE);
                    companyProfileRepository.save(comp);
                    if (comp.getUserId() != null) {
                        userRepository.findById(comp.getUserId()).ifPresent(u -> {
                            u.setVerified(false);
                            userRepository.save(u);
                        });
                        userNotificationService.createCandidateNotification(
                                comp.getUserId(),
                                "COMPANY_VERIFICATION_REJECTED",
                                "Documents d'entreprise rejetés",
                                request.getCommentaire() != null && !request.getCommentaire().isBlank()
                                        ? "Votre dossier RNE a été rejeté : " + request.getCommentaire()
                                        : "Votre dossier RNE a été rejeté. Veuillez soumettre de nouvelles pièces justificatives.",
                                "/company/profile?tab=verification"
                        );
                    }
                }
            }
        }

        return toResponse(saved);
    }

    public VerificationResponse lockVerification(String id) {
        Verification v = verificationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Vérification introuvable", "VERIFICATION_NOT_FOUND"));

        String currentUserId = CurrentUserService.getCurrentUserId();
        String currentUserEmail = userRepository.findById(currentUserId).map(com.rhconnect.model.User::getEmail).orElse("Modérateur");

        boolean currentlyLocked = v.getLockedAt() != null && v.getLockedAt().plusMinutes(15).isAfter(LocalDateTime.now());
        if (currentlyLocked && !currentUserEmail.equalsIgnoreCase(v.getLockedByEmail())) {
            throw new BusinessException("Ce dossier est actuellement verrouillé par " + v.getLockedByEmail(), "VERIFICATION_LOCKED");
        }

        v.setLockedByEmail(currentUserEmail);
        v.setLockedAt(LocalDateTime.now());
        return toResponse(verificationRepository.save(v));
    }

    public VerificationResponse unlockVerification(String id) {
        Verification v = verificationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Vérification introuvable", "VERIFICATION_NOT_FOUND"));

        String currentUserId = CurrentUserService.getCurrentUserId();
        String currentUserEmail = userRepository.findById(currentUserId).map(com.rhconnect.model.User::getEmail).orElse("Modérateur");

        if (v.getLockedByEmail() != null) {
            boolean isAdmin = hasRole(Role.ADMIN);
            if (!isAdmin && !currentUserEmail.equalsIgnoreCase(v.getLockedByEmail())) {
                throw new BusinessException("Vous ne pouvez pas déverrouiller un dossier pris en charge par un autre modérateur", "FORBIDDEN");
            }
            v.setLockedByEmail(null);
            v.setLockedAt(null);
            v = verificationRepository.save(v);
        }
        return toResponse(v);
    }

    public VerificationResponse assignVerification(String id, String assignedToEmail) {
        Verification v = verificationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Vérification introuvable", "VERIFICATION_NOT_FOUND"));

        v.setAssignedToEmail(assignedToEmail != null ? assignedToEmail.trim() : null);
        return toResponse(verificationRepository.save(v));
    }

    public VerificationResponse updateChecklist(String id, java.util.Map<String, Boolean> checklist) {
        Verification v = verificationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Vérification introuvable", "VERIFICATION_NOT_FOUND"));

        if (v.getChecklist() == null) {
            v.setChecklist(new java.util.HashMap<>());
        }
        if (checklist != null) {
            v.getChecklist().putAll(checklist);
        }
        return toResponse(verificationRepository.save(v));
    }

    private void checkVerificationAccess(Verification v) {
        if (hasRole(Role.ADMIN) || hasRole(Role.RECRUITER)) return;
        if (hasRole(Role.CANDIDATE)) {
            String userId = CurrentUserService.getCurrentUserId();
            CandidateProfile cp = candidateProfileRepository.findByUserId(userId).orElse(null);
            if (cp != null && v.getCandidateId().equals(cp.getId())) return;
        }
        if (hasRole(Role.COMPANY)) {
            String userId = CurrentUserService.getCurrentUserId();
            CompanyProfile cp = companyProfileRepository.findByUserId(userId).orElse(null);
            if (cp != null && v.getCandidateId().equals(cp.getId())) return;
        }
        throw new BusinessException("Accès refusé", "FORBIDDEN");
    }

    private boolean hasRole(Role role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role.name()));
    }

    private Verification createEmptyVerification(String candidateId) {
        Verification v = Verification.builder()
                .candidateId(candidateId)
                .pieces(new ArrayList<>())
                .statut(VerificationStatus.EN_ATTENTE)
                .createdAt(LocalDateTime.now())
                .build();
        return verificationRepository.save(v);
    }

    private VerificationResponse toCompanyResponse(Verification v, CompanyProfile cp) {
        List<VerificationDocResponse> piecesResp = new ArrayList<>();
        if (v.getPieces() != null) {
            for (VerificationDoc d : v.getPieces()) {
                piecesResp.add(VerificationDocResponse.builder()
                        .id(d.getId())
                        .nomFichier(d.getNomFichier())
                        .type(d.getType())
                        .taille(d.getTaille())
                        .uploadedAt(d.getUploadedAt())
                        .build());
            }
        }

        String companyEmail = cp.getUserId() != null
                ? userRepository.findById(cp.getUserId()).map(com.rhconnect.model.User::getEmail).orElse(null)
                : null;

        return VerificationResponse.builder()
                .id(v.getId())
                .candidateId(cp.getId())
                .pieces(piecesResp)
                .statut(v.getStatut())
                .validatorId(v.getValidatorId())
                .validatedAt(v.getValidatedAt())
                .commentaire(v.getCommentaire())
                .candidatName(cp.getCompanyName() != null ? cp.getCompanyName() : "Entreprise")
                .candidatEmail(companyEmail)
                .profileType("COMPANY")
                .siret(cp.getSiret())
                .industry(cp.getIndustry())
                .size(cp.getSize())
                .description(cp.getDescription())
                .address(cp.getAddress())
                .phone(cp.getPhone())
                .website(cp.getWebsite())
                .createdAt(v.getCreatedAt())
                .build();
    }

    private VerificationResponse toResponse(Verification v) {
        List<VerificationDocResponse> piecesResp = new ArrayList<>();
        if (v.getPieces() != null) {
            for (VerificationDoc d : v.getPieces()) {
                piecesResp.add(VerificationDocResponse.builder()
                        .id(d.getId())
                        .nomFichier(d.getNomFichier())
                        .type(d.getType())
                        .taille(d.getTaille())
                        .uploadedAt(d.getUploadedAt())
                        .build());
            }
        }

        String candidatName = null;
        String candidatEmail = null;
        String profileType = "CANDIDATE";
        String siret = null;
        String industry = null;
        String size = null;
        String description = null;
        String address = null;
        String phone = null;
        String website = null;

        CompanyProfile comp = companyProfileRepository.findById(v.getCandidateId()).orElse(null);
        if (comp == null) {
            comp = companyProfileRepository.findByUserId(v.getCandidateId()).orElse(null);
        }

        if (comp != null) {
            profileType = "COMPANY";
            candidatName = comp.getCompanyName();
            siret = comp.getSiret();
            industry = comp.getIndustry();
            size = comp.getSize();
            description = comp.getDescription();
            address = comp.getAddress();
            phone = comp.getPhone();
            website = comp.getWebsite();
            if (comp.getUserId() != null) {
                candidatEmail = userRepository.findById(comp.getUserId()).map(com.rhconnect.model.User::getEmail).orElse(null);
            }
        } else {
            CandidateProfile cp = candidateProfileRepository.findById(v.getCandidateId()).orElse(null);
            if (cp == null) {
                cp = candidateProfileRepository.findByUserId(v.getCandidateId()).orElse(null);
            }
            if (cp != null) {
                profileType = "CANDIDATE";
                String fn = cp.getFirstName() != null ? cp.getFirstName() : "";
                String ln = cp.getLastName() != null ? cp.getLastName() : "";
                if (!fn.isBlank() || !ln.isBlank()) {
                    candidatName = (fn + " " + ln).trim();
                }
                phone = cp.getPhone();
                address = cp.getAddress();
                description = cp.getBio();
                if (cp.getUserId() != null) {
                    candidatEmail = userRepository.findById(cp.getUserId()).map(com.rhconnect.model.User::getEmail).orElse(null);
                }
            } else {
                User u = userRepository.findById(v.getCandidateId()).orElse(null);
                if (u != null && u.getRoles() != null && u.getRoles().contains(Role.COMPANY)) {
                    profileType = "COMPANY";
                }
            }
        }

        if (candidatEmail == null) {
            candidatEmail = userRepository.findById(v.getCandidateId()).map(com.rhconnect.model.User::getEmail).orElse(null);
        }

        candidatName = formatOrDeriveName(candidatName, candidatEmail);

        boolean isLocked = v.getLockedAt() != null && v.getLockedAt().plusMinutes(15).isAfter(LocalDateTime.now());
        long remaining = isLocked ? java.time.Duration.between(LocalDateTime.now(), v.getLockedAt().plusMinutes(15)).getSeconds() : 0L;

        return VerificationResponse.builder()
                .id(v.getId())
                .candidateId(v.getCandidateId())
                .pieces(piecesResp)
                .statut(v.getStatut())
                .validatorId(v.getValidatorId())
                .validatedAt(v.getValidatedAt())
                .commentaire(v.getCommentaire())
                .candidatName(candidatName)
                .candidatEmail(candidatEmail)
                .profileType(profileType)
                .siret(siret)
                .industry(industry)
                .size(size)
                .description(description)
                .address(address)
                .phone(phone)
                .website(website)
                .assignedToEmail(v.getAssignedToEmail())
                .checklist(v.getChecklist() != null ? v.getChecklist() : new java.util.HashMap<>())
                .lockedByEmail(isLocked ? v.getLockedByEmail() : null)
                .lockedAt(isLocked ? v.getLockedAt() : null)
                .createdAt(v.getCreatedAt())
                .isLocked(isLocked)
                .lockRemainingSeconds(remaining)
                .build();
    }

    private String formatOrDeriveName(String rawName, String email) {
        if (rawName != null && !rawName.isBlank() && !"Candidat".equalsIgnoreCase(rawName.trim())) {
            return toTitleCase(rawName.trim());
        }
        if (email != null && !email.isBlank()) {
            String prefix = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
            String cleaned = prefix.replace('.', ' ').replace('_', ' ').replace('-', ' ').trim();
            if (!cleaned.isBlank()) {
                return toTitleCase(cleaned);
            }
            return email;
        }
        return "Yassine Trabelsi";
    }

    private String toTitleCase(String text) {
        if (text == null || text.isBlank()) return text;
        String[] words = text.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isBlank()) {
                sb.append(Character.toUpperCase(w.charAt(0)));
                if (w.length() > 1) {
                    sb.append(w.substring(1).toLowerCase());
                }
                sb.append(" ");
            }
        }
        return sb.toString().trim();
    }
}

