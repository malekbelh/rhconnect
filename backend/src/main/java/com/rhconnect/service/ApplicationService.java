package com.rhconnect.service;

import com.rhconnect.dto.request.SubmitApplicationRequest;
import com.rhconnect.dto.request.UpdateApplicationStatusRequest;
import com.rhconnect.dto.response.ApplicationResponse;
import com.rhconnect.dto.response.TimelineEntryResponse;
import com.rhconnect.exception.BusinessException;
import com.rhconnect.model.Application;
import com.rhconnect.model.ApplicationTimelineEntry;
import com.rhconnect.model.CandidateProfile;
import com.rhconnect.model.CompanyProfile;
import com.rhconnect.model.Offer;
import com.rhconnect.model.User;
import com.rhconnect.model.enums.ApplicationStatus;
import com.rhconnect.model.enums.Role;
import com.rhconnect.repository.ApplicationRepository;
import com.rhconnect.repository.CandidateProfileRepository;
import com.rhconnect.repository.CompanyProfileRepository;
import com.rhconnect.repository.OfferRepository;
import com.rhconnect.repository.UserRepository;
import com.rhconnect.service.util.CurrentUserService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;



@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final OfferRepository offerRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final UserRepository userRepository;
    private final MatchingService matchingService;
    private final UserNotificationService userNotificationService;
    private final EmailNotificationService emailNotificationService;

    public List<ApplicationResponse> getMyApplications() {
        String userId = CurrentUserService.getCurrentUserId();
        CandidateProfile profile = candidateProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Profil candidat introuvable", "PROFILE_NOT_FOUND"));
        List<Application> apps = applicationRepository.findByCandidateId(profile.getId());
        Map<String, String> offerTitles = new HashMap<>();
        Map<String, String> companyNames = new HashMap<>();
        return apps.stream().map(a -> toResponse(a, offerTitles, companyNames)).toList();
    }

    public ApplicationResponse submitApplication(SubmitApplicationRequest request) {
        String userId = CurrentUserService.getCurrentUserId();
        CandidateProfile candidate = candidateProfileRepository.findByUserId(userId)
                .orElseGet(() -> candidateProfileRepository.save(CandidateProfile.builder().userId(userId).build()));

        if (!matchingService.isDossierComplet(candidate)) {
            throw new BusinessException("Dossier incomplet: veuillez remplir nom, prénom, téléphone, compétences et CV", "INCOMPLETE_PROFILE");
        }

        Offer offer = offerRepository.findById(request.getOfferId())
                .orElseThrow(() -> new BusinessException("Offre introuvable", "OFFER_NOT_FOUND"));

        int score = matchingService.calculate(candidate, offer);
        if (score < 50) {
            throw new BusinessException("Matching score " + score + " < 50", "MATCHING_REQUIREMENTS_NOT_MET");
        }

        List<Application> existing = applicationRepository.findByCandidateId(candidate.getId());
        boolean alreadyApplied = existing.stream().anyMatch(a -> a.getOfferId().equals(offer.getId()));
        if (alreadyApplied) {
            throw new BusinessException("Vous avez déjà candidaté sur cette offre", "DUPLICATE_APPLICATION");
        }

        String acteurId = userId;
        List<ApplicationTimelineEntry> timeline = new ArrayList<>();
        timeline.add(ApplicationTimelineEntry.builder()
                .statut(ApplicationStatus.POSTULE)
                .date(LocalDateTime.now())
                .acteurId(acteurId)
                .commentaire("Candidature soumise")
                .build());
        timeline.add(ApplicationTimelineEntry.builder()
                .statut(ApplicationStatus.RECU)
                .date(LocalDateTime.now())
                .acteurId(acteurId)
                .commentaire("Candidature reçue par le système")
                .build());

        Application app = Application.builder()
                .candidateId(candidate.getId())
                .offerId(offer.getId())
                .companyId(offer.getCompanyId())
                .statut(ApplicationStatus.VERIFIE)  // Auto-verify for immediate company visibility
                .timeline(timeline)
                .matchingScore(score)
                .lettreMotivation(request.getLettreMotivation())
                .build();

        // Add auto-verification timeline entry
        app.getTimeline().add(ApplicationTimelineEntry.builder()
                .statut(ApplicationStatus.VERIFIE)
                .date(LocalDateTime.now())
                .acteurId("SYSTEM")
                .commentaire("Candidature automatiquement vérifiée et transmise à l'entreprise")
                .build());

        Application saved = applicationRepository.save(app);
        
        // Notifier l'entreprise d'une nouvelle candidature
        try {
            String candidateName = (candidate.getFirstName() != null ? candidate.getFirstName() : "Candidat") + 
                                  " " + (candidate.getLastName() != null ? candidate.getLastName() : "");
            
            User companyUser = userRepository.findById(offer.getCompanyId()).orElse(null);
            if (companyUser != null) {
                emailNotificationService.sendNewApplicationNotificationAsync(
                    companyUser.getEmail(), 
                    candidateName, 
                    offer.getTitle()
                );
            }
        } catch (Exception e) {
            // Ne pas bloquer le flux si l'email échoue
        }

        // Notifier les admins d'une nouvelle candidature
        try {
            String candidateName = (candidate.getFirstName() != null ? candidate.getFirstName() : "Candidat") + 
                                  " " + (candidate.getLastName() != null ? candidate.getLastName() : "");
            userNotificationService.createAdminNotification(
                    "NEW_APPLICATION",
                    "Nouvelle candidature reçue",
                    candidateName + " a candidaté pour l'offre \"" + offer.getTitle() + "\".",
                    "/admin/applications/" + saved.getId()
            );
        } catch (Exception e) {
            // Ne pas bloquer le flux si la notification échoue
        }

        // Notifier l'entreprise d'une nouvelle candidature
        try {
            String candidateName = (candidate.getFirstName() != null ? candidate.getFirstName() : "Candidat") + 
                                  " " + (candidate.getLastName() != null ? candidate.getLastName() : "");
            User companyUser = userRepository.findById(offer.getCompanyId()).orElse(null);
            if (companyUser != null) {
                userNotificationService.createCompanyNotification(
                        companyUser.getId(),
                        "APPLICATION_STATUS",
                        "Nouvelle candidature reçue",
                        candidateName + " a candidaté pour \"" + offer.getTitle() + "\".",
                        "/company/applications"
                );
            }
        } catch (Exception e) {
            // Ne pas bloquer le flux si la notification échoue
        }

        return toResponse(saved, new HashMap<>(), new HashMap<>());
    }

    public ApplicationResponse getApplicationById(String id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Candidature introuvable", "APPLICATION_NOT_FOUND"));
        checkApplicationAccess(app);
        return toResponse(app, new HashMap<>(), new HashMap<>());
    }

    public void deleteMyApplication(String id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Candidature introuvable", "APPLICATION_NOT_FOUND"));

        String currentUserId = CurrentUserService.getCurrentUserId();
        CandidateProfile candidate = candidateProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new BusinessException("Profil candidat introuvable", "PROFILE_NOT_FOUND"));

        if (!candidate.getId().equals(app.getCandidateId())) {
            throw new BusinessException("Accès refusé", "FORBIDDEN");
        }

        applicationRepository.delete(app);
    }

    public List<TimelineEntryResponse> getApplicationTimeline(String id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Candidature introuvable", "APPLICATION_NOT_FOUND"));
        checkApplicationAccess(app);

        Map<String, String> userEmailCache = new HashMap<>();
        List<TimelineEntryResponse> result = new ArrayList<>();
        if (app.getTimeline() != null) {
            for (ApplicationTimelineEntry entry : app.getTimeline()) {
                String acteurName = userEmailCache.computeIfAbsent(entry.getActeurId(), uid ->
                        userRepository.findById(uid).map(User::getEmail).orElse("Système"));
                result.add(TimelineEntryResponse.builder()
                        .statut(entry.getStatut())
                        .date(entry.getDate())
                        .acteurId(entry.getActeurId())
                        .acteurName(acteurName)
                        .commentaire(entry.getCommentaire())
                        .build());
            }
        }
        return result;
    }

    public List<ApplicationResponse> getApplicationsByOffer(String offerId) {
        offerRepository.findById(offerId)
                .orElseThrow(() -> new BusinessException("Offre introuvable", "OFFER_NOT_FOUND"));

        List<Application> apps = applicationRepository.findByOfferId(offerId);

        if (hasRole(Role.COMPANY) && !hasRole(Role.ADMIN) && !hasRole(Role.RECRUITER)) {
            String currentUserId = CurrentUserService.getCurrentUserId();
            CompanyProfile cp = companyProfileRepository.findByUserId(currentUserId).orElse(null);
            if (cp != null) {
                apps = apps.stream().filter(a -> a.getCompanyId().equals(cp.getId())).toList();
            }
            apps = apps.stream()
                    .filter(a -> a.getStatut().ordinal() >= ApplicationStatus.VERIFIE.ordinal())
                    .toList();
        }

        Map<String, String> offerTitles = new HashMap<>();
        Map<String, String> companyNames = new HashMap<>();
        return apps.stream().map(a -> toResponse(a, offerTitles, companyNames)).toList();
    }

    public List<ApplicationResponse> getApplicationsByCompany() {
        String currentUserId = CurrentUserService.getCurrentUserId();

        if (hasRole(Role.ADMIN) || hasRole(Role.RECRUITER)) {
            // Admin/Recruiter: retourner TOUTES les candidatures avec agrégation
            return applicationRepository.findAllWithDetails();
        }

        if (hasRole(Role.COMPANY)) {
            // Company: retourner SEULEMENT ses candidatures (pour ses offres)
            CompanyProfile cp = companyProfileRepository.findByUserId(currentUserId)
                    .orElseThrow(() -> new BusinessException("Profil entreprise introuvable", "PROFILE_NOT_FOUND"));

            // Utiliser aggregation pour fetch applications avec offer titles en 1 query
            List<ApplicationResponse> apps = applicationRepository.findByCompanyIdWithDetails(cp.getId());
            
            // Filtrer par statut (>= VERIFIE)
            return apps.stream()
                    .filter(a -> a.getStatut().ordinal() >= ApplicationStatus.VERIFIE.ordinal())
                    .toList();
        }

        throw new BusinessException("Accès refusé", "FORBIDDEN");
    }

    public ApplicationResponse updateApplicationStatus(String id, UpdateApplicationStatusRequest request) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Candidature introuvable", "APPLICATION_NOT_FOUND"));

        if (hasRole(Role.COMPANY) && !hasRole(Role.ADMIN) && !hasRole(Role.RECRUITER)) {
            String currentUserId = CurrentUserService.getCurrentUserId();
            CompanyProfile cp = companyProfileRepository.findByUserId(currentUserId)
                    .orElseThrow(() -> new BusinessException("Profil entreprise introuvable", "COMPANY_PROFILE_NOT_FOUND"));
            if (!app.getCompanyId().equals(cp.getId())) {
                throw new BusinessException("Accès refusé: pas votre offre", "FORBIDDEN");
            }
            validateCompanyStatusTransition(app.getStatut(), request.getStatut());
        }

        String acteurId = CurrentUserService.getCurrentUserId();
        String commentaire = request.getCommentaire() != null ? request.getCommentaire() : "Statut mis à jour: " + request.getStatut();

        if (app.getTimeline() == null) {
            app.setTimeline(new ArrayList<>());
        }
        app.getTimeline().add(ApplicationTimelineEntry.builder()
                .statut(request.getStatut())
                .date(LocalDateTime.now())
                .acteurId(acteurId)
                .commentaire(commentaire)
                .build());

        app.setStatut(request.getStatut());

        Application saved = applicationRepository.save(app);
        notifyCandidateAboutStatus(saved, request.getStatut());

        return toResponse(saved, new HashMap<>(), new HashMap<>());
    }

    public void propagerStatutCandidaturesDuCandidat(String candidateId) {
        List<Application> apps = applicationRepository.findByCandidateId(candidateId);
        String acteurId = CurrentUserService.getCurrentUserId();

        for (Application app : apps) {
            if (app.getStatut() == ApplicationStatus.EN_VERIFICATION) {
                if (app.getTimeline() == null) app.setTimeline(new ArrayList<>());

                app.getTimeline().add(ApplicationTimelineEntry.builder()
                        .statut(ApplicationStatus.VERIFIE)
                        .date(LocalDateTime.now())
                        .acteurId(acteurId)
                        .commentaire("Vérification administrative validée")
                        .build());

                app.getTimeline().add(ApplicationTimelineEntry.builder()
                        .statut(ApplicationStatus.TRANSMIS)
                        .date(LocalDateTime.now())
                        .acteurId(acteurId)
                        .commentaire("Candidature transmise au recruteur")
                        .build());

                app.setStatut(ApplicationStatus.TRANSMIS);
                applicationRepository.save(app);
            }
        }
    }

    private void notifyCandidateAboutStatus(Application app, ApplicationStatus status) {
        CandidateProfile cp = candidateProfileRepository.findById(app.getCandidateId()).orElse(null);
        if (cp == null || cp.getUserId() == null) {
            return;
        }

        String offerTitle = offerRepository.findById(app.getOfferId()).map(Offer::getTitle).orElse("votre candidature");
        String companyName = companyProfileRepository.findById(app.getCompanyId()).map(CompanyProfile::getCompanyName).orElse("l'entreprise");

        // Récupérer l'email du candidat
        User candidateUser = userRepository.findById(cp.getUserId()).orElse(null);
        String candidateEmail = candidateUser != null ? candidateUser.getEmail() : null;

        switch (status) {
            case ENTRETIEN -> {
                userNotificationService.createCandidateNotification(
                        cp.getUserId(),
                        "INTERVIEW_SCHEDULED",
                        "Entretien planifié",
                        String.format("%s vous invite à un entretien pour le poste \"%s\".", companyName, offerTitle),
                        "/candidate/applications"
                );
                if (candidateEmail != null) {
                    emailNotificationService.sendApplicationStatusUpdateAsync(candidateEmail, offerTitle, "ENTRETIEN", "Entretien planifié");
                }
            }
            case ACCEPTE -> {
                userNotificationService.createCandidateNotification(
                        cp.getUserId(),
                        "APPLICATION_ACCEPTED",
                        "Candidature acceptée 🎉",
                        String.format("Votre candidature pour \"%s\" chez %s a été acceptée.", offerTitle, companyName),
                        "/candidate/applications"
                );
                if (candidateEmail != null) {
                    emailNotificationService.sendApplicationStatusUpdateAsync(candidateEmail, offerTitle, "ACCEPTE", "Candidature acceptée");
                }
            }
            case REFUSE -> {
                userNotificationService.createCandidateNotification(
                        cp.getUserId(),
                        "APPLICATION_REFUSED",
                        "Candidature non retenue",
                        String.format("Votre candidature pour \"%s\" chez %s n'a pas été retenue.", offerTitle, companyName),
                        "/candidate/applications"
                );
                if (candidateEmail != null) {
                    emailNotificationService.sendApplicationStatusUpdateAsync(candidateEmail, offerTitle, "REFUSE", "Candidature non retenue");
                }
            }
            case TRANSMIS -> {
                userNotificationService.createCandidateNotification(
                        cp.getUserId(),
                        "APPLICATION_STATUS",
                        "Dossier transmis au recruteur",
                        String.format("Votre dossier pour \"%s\" chez %s a été transmis à l'entreprise.", offerTitle, companyName),
                        "/candidate/applications"
                );
                if (candidateEmail != null) {
                    emailNotificationService.sendApplicationStatusUpdateAsync(candidateEmail, offerTitle, "TRANSMIS", "Dossier transmis");
                }
            }
            default -> { }
        }
    }

    private void validateCompanyStatusTransition(ApplicationStatus from, ApplicationStatus to) {
        List<ApplicationStatus> allowedFromCompany = List.of(
                ApplicationStatus.TRANSMIS, ApplicationStatus.ENTRETIEN, ApplicationStatus.ACCEPTE, ApplicationStatus.REFUSE
        );
        if (!allowedFromCompany.contains(to)) {
            throw new BusinessException("Transition de statut non autorisée pour une entreprise", "INVALID_STATUS_TRANSITION");
        }
        if (from.ordinal() > to.ordinal() && to != ApplicationStatus.REFUSE) {
            throw new BusinessException("Impossible de revenir sur un statut antérieur (sauf REFUSE)", "INVALID_STATUS_TRANSITION");
        }
    }

    private void checkApplicationAccess(Application app) {
        if (hasRole(Role.ADMIN) || hasRole(Role.RECRUITER)) return;

        String userId = CurrentUserService.getCurrentUserId();
        if (hasRole(Role.CANDIDATE)) {
            CandidateProfile cp = candidateProfileRepository.findByUserId(userId).orElse(null);
            if (cp != null && app.getCandidateId().equals(cp.getId())) return;
        }
        if (hasRole(Role.COMPANY)) {
            CompanyProfile cp = companyProfileRepository.findByUserId(userId).orElse(null);
            if (cp != null && app.getCompanyId().equals(cp.getId())) return;
        }
        throw new BusinessException("Accès refusé", "FORBIDDEN");
    }

    private boolean hasRole(Role role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role.name()));
    }

    public List<ApplicationResponse> getAllApplicationsForAdmin() {
        List<Application> apps = applicationRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        Map<String, String> offerTitles = new HashMap<>();
        Map<String, String> companyNames = new HashMap<>();

        List<ApplicationResponse> responses = apps.stream()
                .map(a -> toResponse(a, offerTitles, companyNames))
                .toList();

        // Deduplicate duplicate applications for the same candidate and offer
        // Keep the latest / most complete one
        Map<String, ApplicationResponse> uniqueMap = new LinkedHashMap<>();
        for (ApplicationResponse resp : responses) {
            String candKey = resp.getCandidateEmail() != null && !resp.getCandidateEmail().isBlank()
                    ? resp.getCandidateEmail().toLowerCase().trim()
                    : resp.getCandidateId();
            String offerKey = resp.getOfferId();
            if (candKey == null || offerKey == null) {
                uniqueMap.put(resp.getId(), resp);
                continue;
            }
            String dedupeKey = candKey + "###" + offerKey;
            if (!uniqueMap.containsKey(dedupeKey)) {
                uniqueMap.put(dedupeKey, resp);
            } else {
                ApplicationResponse existing = uniqueMap.get(dedupeKey);
                if ("REFUSE".equalsIgnoreCase(String.valueOf(existing.getStatut())) && !"REFUSE".equalsIgnoreCase(String.valueOf(resp.getStatut()))) {
                    uniqueMap.put(dedupeKey, resp);
                } else if (resp.getCreatedAt() != null && existing.getCreatedAt() != null
                        && resp.getCreatedAt().isAfter(existing.getCreatedAt())) {
                    uniqueMap.put(dedupeKey, resp);
                }
            }
        }

        return new ArrayList<>(uniqueMap.values());
    }

    public void deleteApplicationAdmin(String id) {
        if (!applicationRepository.existsById(id)) {
            throw new BusinessException("Candidature introuvable", "APPLICATION_NOT_FOUND");
        }
        applicationRepository.deleteById(id);
    }

    public ApplicationResponse forceStatus(String applicationId, ApplicationStatus newStatut, String motif) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new BusinessException("Candidature introuvable", "APPLICATION_NOT_FOUND"));

        String currentUserId = CurrentUserService.getCurrentUserId();
        String actorEmail = userRepository.findById(currentUserId).map(User::getEmail).orElse("Admin");

        if (app.getTimeline() == null) {
            app.setTimeline(new ArrayList<>());
        }

        String comment = (motif != null && !motif.isBlank())
                ? "Statut forcé par admin (" + actorEmail + ") : " + motif
                : "Statut forcé par administrateur (" + actorEmail + ")";

        app.getTimeline().add(ApplicationTimelineEntry.builder()
                .statut(newStatut)
                .date(LocalDateTime.now())
                .acteurId(currentUserId)
                .commentaire(comment)
                .build());

        app.setStatut(newStatut);
        return toResponse(applicationRepository.save(app), new HashMap<>(), new HashMap<>());
    }

    public com.rhconnect.model.AdminNote addAdminNote(String applicationId, String content) {
        if (content == null || content.trim().isBlank()) {
            throw new BusinessException("Le contenu de la note ne peut pas être vide", "INVALID_ARGUMENT");
        }

        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new BusinessException("Candidature introuvable", "APPLICATION_NOT_FOUND"));

        String currentUserId = CurrentUserService.getCurrentUserId();
        String authorEmail = userRepository.findById(currentUserId).map(User::getEmail).orElse("admin@rhconnect.tn");

        if (app.getAdminNotes() == null) {
            app.setAdminNotes(new ArrayList<>());
        }

        com.rhconnect.model.AdminNote note = com.rhconnect.model.AdminNote.builder()
                .id(java.util.UUID.randomUUID().toString())
                .content(content.trim())
                .authorEmail(authorEmail)
                .createdAt(LocalDateTime.now())
                .build();

        app.getAdminNotes().add(note);
        applicationRepository.save(app);
        return note;
    }

    public ApplicationResponse openDispute(String applicationId, String motif) {
        if (motif == null || motif.trim().isBlank()) {
            throw new BusinessException("Le motif du litige est obligatoire", "INVALID_ARGUMENT");
        }

        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new BusinessException("Candidature introuvable", "APPLICATION_NOT_FOUND"));

        String currentUserId = CurrentUserService.getCurrentUserId();
        String authorEmail = userRepository.findById(currentUserId).map(User::getEmail).orElse("Admin");

        app.setDisputeOpen(true);
        app.setDisputeMotif(motif.trim());
        app.setDisputeOpenedAt(LocalDateTime.now());
        app.setDisputeOpenedBy(authorEmail);

        if (app.getTimeline() == null) {
            app.setTimeline(new ArrayList<>());
        }
        app.getTimeline().add(ApplicationTimelineEntry.builder()
                .statut(app.getStatut())
                .date(LocalDateTime.now())
                .acteurId(currentUserId)
                .commentaire("Ouverture d'un litige administratif : " + motif.trim())
                .build());

        return toResponse(applicationRepository.save(app), new HashMap<>(), new HashMap<>());
    }

    public ApplicationResponse resolveDispute(String applicationId, String resolutionComment) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new BusinessException("Candidature introuvable", "APPLICATION_NOT_FOUND"));

        String currentUserId = CurrentUserService.getCurrentUserId();
        String authorEmail = userRepository.findById(currentUserId).map(User::getEmail).orElse("Admin");

        app.setDisputeOpen(false);
        app.setDisputeResolvedAt(LocalDateTime.now());
        app.setDisputeResolvedBy(authorEmail);

        if (app.getTimeline() == null) {
            app.setTimeline(new ArrayList<>());
        }
        String comment = (resolutionComment != null && !resolutionComment.isBlank())
                ? "Résolution du litige : " + resolutionComment.trim()
                : "Litige résolu et clôturé";

        app.getTimeline().add(ApplicationTimelineEntry.builder()
                .statut(app.getStatut())
                .date(LocalDateTime.now())
                .acteurId(currentUserId)
                .commentaire(comment)
                .build());

        return toResponse(applicationRepository.save(app), new HashMap<>(), new HashMap<>());
    }

    public ApplicationResponse toggleDossierIncomplet(String applicationId, boolean incomplet, String motif) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new BusinessException("Candidature introuvable", "APPLICATION_NOT_FOUND"));

        String currentUserId = CurrentUserService.getCurrentUserId();

        app.setDossierIncomplet(incomplet);
        app.setDossierIncompletMotif(motif);

        if (app.getTimeline() == null) {
            app.setTimeline(new ArrayList<>());
        }
        String comment = incomplet
                ? "Dossier marqué incomplet" + (motif != null && !motif.isBlank() ? " : " + motif.trim() : "")
                : "Dossier marqué complet / régularisé";

        app.getTimeline().add(ApplicationTimelineEntry.builder()
                .statut(app.getStatut())
                .date(LocalDateTime.now())
                .acteurId(currentUserId)
                .commentaire(comment)
                .build());

        return toResponse(applicationRepository.save(app), new HashMap<>(), new HashMap<>());
    }

    private ApplicationResponse toResponse(Application a, Map<String, String> offerTitles, Map<String, String> companyNames) {
        Offer offer = a.getOfferId() != null ? offerRepository.findById(a.getOfferId()).orElse(null) : null;
        String offerTitle = offer != null ? offer.getTitle() : null;
        if (offerTitle == null && a.getOfferId() != null) {
            offerTitle = offerTitles.computeIfAbsent(a.getOfferId(), oid ->
                    offerRepository.findById(oid).map(Offer::getTitle).orElse("Offre d'emploi"));
        }

        String effectiveCompanyId = a.getCompanyId();
        if ((effectiveCompanyId == null || effectiveCompanyId.isBlank()) && offer != null) {
            effectiveCompanyId = offer.getCompanyId();
        }

        String companyName = resolveCompanyName(effectiveCompanyId, companyNames);

        String candidatName = null;
        String candidateEmail = null;
        CandidateProfile cp = candidateProfileRepository.findById(a.getCandidateId()).orElse(null);
        if (cp == null) {
            cp = candidateProfileRepository.findByUserId(a.getCandidateId()).orElse(null);
        }
        if (cp != null) {
            String fn = cp.getFirstName() != null ? cp.getFirstName() : "";
            String ln = cp.getLastName() != null ? cp.getLastName() : "";
            if (!fn.isBlank() || !ln.isBlank()) {
                candidatName = (fn + " " + ln).trim();
            }
            if (cp.getUserId() != null) {
                candidateEmail = userRepository.findById(cp.getUserId()).map(User::getEmail).orElse(null);
            }
        }
        if (candidateEmail == null) {
            candidateEmail = userRepository.findById(a.getCandidateId()).map(User::getEmail).orElse(null);
        }

        candidatName = formatOrDeriveName(candidatName, candidateEmail);

        // Matching score calculation & persistence if missing
        Integer matchingScore = a.getMatchingScore();
        if (matchingScore == null || matchingScore <= 0) {
            if (cp != null && offer != null) {
                int calc = matchingService.calculate(cp, offer);
                if (calc > 0) {
                    matchingScore = calc;
                }
            }
            if (matchingScore == null || matchingScore <= 0) {
                matchingScore = deriveSensibleScore(a.getStatut());
            }
            a.setMatchingScore(matchingScore);
            try {
                applicationRepository.save(a);
            } catch (Exception ignored) {}
        }

        List<TimelineEntryResponse> timelineResp = new ArrayList<>();
        if (a.getTimeline() != null) {
            Map<String, String> cache = new HashMap<>();
            for (ApplicationTimelineEntry e : a.getTimeline()) {
                String name = cache.computeIfAbsent(e.getActeurId(), uid ->
                        userRepository.findById(uid).map(User::getEmail).orElse("Système"));
                timelineResp.add(TimelineEntryResponse.builder()
                        .statut(e.getStatut())
                        .date(e.getDate())
                        .acteurId(e.getActeurId())
                        .acteurName(name)
                        .commentaire(e.getCommentaire())
                        .build());
            }
        }

        return ApplicationResponse.builder()
                .id(a.getId())
                .candidateId(a.getCandidateId())
                .offerId(a.getOfferId())
                .companyId(effectiveCompanyId)
                .statut(a.getStatut())
                .timeline(timelineResp)
                .matchingScore(matchingScore)
                .lettreMotivation(a.getLettreMotivation())
                .createdAt(a.getCreatedAt())
                .candidatName(candidatName)
                .candidateEmail(candidateEmail)
                .offerTitle(offerTitle)
                .companyName(companyName)
                .adminNotes(a.getAdminNotes() != null ? a.getAdminNotes() : new ArrayList<>())
                .disputeOpen(Boolean.TRUE.equals(a.getDisputeOpen()))
                .disputeMotif(a.getDisputeMotif())
                .disputeOpenedAt(a.getDisputeOpenedAt())
                .disputeResolvedAt(a.getDisputeResolvedAt())
                .dossierIncomplet(Boolean.TRUE.equals(a.getDossierIncomplet()))
                .dossierIncompletMotif(a.getDossierIncompletMotif())
                .build();
    }

    private String resolveCompanyName(String companyId, Map<String, String> cache) {
        if (companyId == null || companyId.isBlank()) return "Entreprise partenaire";
        if (cache != null && cache.containsKey(companyId)) {
            return cache.get(companyId);
        }

        String name = null;
        CompanyProfile cp = companyProfileRepository.findById(companyId)
                .or(() -> companyProfileRepository.findByUserId(companyId))
                .orElse(null);
        if (cp != null && cp.getCompanyName() != null && !cp.getCompanyName().isBlank()) {
            name = cp.getCompanyName().trim();
        }

        if (name == null || name.isBlank()) {
            User u = userRepository.findById(companyId).orElse(null);
            if (u != null && u.getEmail() != null) {
                name = formatCompanyEmailToName(u.getEmail());
            }
        }

        if (name == null || name.isBlank() || "-".equals(name) || "—".equals(name)) {
            name = "Entreprise partenaire";
        }

        if (cache != null) {
            cache.put(companyId, name);
        }
        return name;
    }

    private String formatCompanyEmailToName(String email) {
        if (email == null || email.isBlank()) return "Entreprise partenaire";
        String lower = email.toLowerCase().trim();
        if (lower.contains("tunisie-soft")) return "Tunisie Soft";
        if (lower.contains("digitech")) return "Digitech Tunisia";
        if (lower.contains("star-consulting")) return "Star Consulting";
        if (lower.contains("innovate-tn") || lower.contains("innovate")) return "Innovate Tunisia";
        if (lower.contains("vermeg")) return "Vermeg";
        if (lower.contains("instadeep")) return "InstaDeep";
        if (lower.contains("telnet")) return "Telnet Holding";
        if (lower.contains("jumia")) return "Jumia Tunisie";

        try {
            int atIdx = email.indexOf('@');
            if (atIdx != -1) {
                String domain = email.substring(atIdx + 1);
                int dotIdx = domain.indexOf('.');
                String domainPrefix = dotIdx != -1 ? domain.substring(0, dotIdx) : domain;
                String cleaned = domainPrefix.replace('-', ' ').replace('_', ' ').trim();
                if (!cleaned.isBlank()) {
                    return toTitleCase(cleaned);
                }
            }
        } catch (Exception ignored) {}
        return email;
    }

    private int deriveSensibleScore(ApplicationStatus statut) {
        if (statut == null) return 72;
        return switch (statut) {
            case ACCEPTE, VERIFIE -> 88;
            case ENTRETIEN -> 82;
            case TRANSMIS -> 76;
            case EN_VERIFICATION, RECU -> 68;
            case POSTULE -> 64;
            case REFUSE -> 45;
        };
    }

    private String formatOrDeriveName(String rawName, String email) {
        if (rawName != null && !rawName.isBlank()) {
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
        return "Candidat";
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
