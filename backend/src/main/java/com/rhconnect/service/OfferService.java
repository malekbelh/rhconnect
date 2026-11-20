package com.rhconnect.service;

import com.rhconnect.dto.request.CreateOfferRequest;
import com.rhconnect.dto.request.UpdateOfferRequest;
import com.rhconnect.dto.response.OfferResponse;
import com.rhconnect.exception.BusinessException;
import com.rhconnect.model.CandidateProfile;
import com.rhconnect.model.CompanyProfile;
import com.rhconnect.model.ModerationHistoryEntry;
import com.rhconnect.model.ModerationHistoryEntry.ModerationAction;
import com.rhconnect.model.Offer;
import com.rhconnect.model.User;
import com.rhconnect.model.enums.NiveauExperience;
import com.rhconnect.model.enums.OfferStatus;
import com.rhconnect.model.enums.Role;
import com.rhconnect.model.enums.TypeContrat;
import com.rhconnect.model.enums.VerificationStatus;
import com.rhconnect.repository.ApplicationRepository;
import com.rhconnect.repository.CompanyProfileRepository;
import com.rhconnect.repository.OfferRepository;
import com.rhconnect.repository.UserRepository;
import com.rhconnect.service.util.CurrentUserService;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;



@Service
@RequiredArgsConstructor
public class OfferService {

    private final OfferRepository offerRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;
    private final MatchingService matchingService;
    private final CandidateService candidateService;
    private final UserNotificationService userNotificationService;

    @Cacheable(value = "offers_search", key = "#keyword + '-' + #competence + '-' + #niveauExperience + '-' + #typeContrat + '-' + #localisation + '-' + #pageable.pageNumber", unless = "#result.isEmpty()")
    public Page<OfferResponse> searchOffers(String keyword, String competence, NiveauExperience niveauExperience,
                                            TypeContrat typeContrat, String localisation, Pageable pageable) {
        Query query = new Query();
        List<Criteria> criteriaList = new ArrayList<>();

        criteriaList.add(Criteria.where("statut").is(OfferStatus.ACTIVE));

        if (keyword != null && !keyword.isBlank()) {
            criteriaList.add(new Criteria().orOperator(
                    Criteria.where("title").regex(keyword, "i"),
                    Criteria.where("description").regex(keyword, "i")
            ));
        }

        if (competence != null && !competence.isBlank()) {
            criteriaList.add(Criteria.where("competencesRequises").regex(competence, "i"));
        }

        if (niveauExperience != null) {
            criteriaList.add(Criteria.where("niveauExperience").is(niveauExperience));
        }

        if (typeContrat != null) {
            criteriaList.add(Criteria.where("typeContrat").is(typeContrat));
        }

        if (localisation != null && !localisation.isBlank()) {
            criteriaList.add(Criteria.where("localisation").regex(localisation, "i"));
        }

        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList));
        }

        long total = mongoTemplate.count(query, Offer.class);
        query.with(pageable);

        List<Offer> offers = mongoTemplate.find(query, Offer.class);
        
        // Batch fetch all companies to avoid N+1 queries
        Map<String, CompanyProfile> companies = fetchCompaniesForOffers(offers);
        
        boolean isCandidate = isCurrentUserCandidate();
        CandidateProfile candidateProfile = isCandidate ? candidateService.getCurrentCandidateProfile() : null;

        List<OfferResponse> responses = offers.stream()
                .map(o -> toResponseWithCompany(o, companies.get(o.getCompanyId()), isCandidate, candidateProfile))
                .toList();

        return new PageImpl<>(responses, pageable, total);
    }

    @Cacheable(value = "offer_by_id", key = "#id")
    public OfferResponse getOfferById(String id) {
        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Offre introuvable", "OFFER_NOT_FOUND"));
        
        // Fetch company details
        CompanyProfile company = offer.getCompanyId() != null 
                ? resolveCompany(offer.getCompanyId())
                : null;
        
        boolean isCandidate = isCurrentUserCandidate();
        CandidateProfile candidateProfile = isCandidate ? candidateService.getCurrentCandidateProfile() : null;
        return toResponseWithCompany(offer, company, isCandidate, candidateProfile);
    }

    @CacheEvict(value = {"offers_search", "my_offers", "admin_offers"}, allEntries = true)
    public OfferResponse createOffer(CreateOfferRequest request, String companyIdFromAdmin) {
        String currentUserId = CurrentUserService.getCurrentUserId();
        boolean isAdmin = isCurrentUserAdmin();

        String companyId;
        if (isAdmin) {
            companyId = companyIdFromAdmin;
            if (companyId == null || companyId.isBlank()) {
                throw new BusinessException("companyId requis pour ADMIN", "COMPANY_ID_REQUIRED");
            }
        } else {
            CompanyProfile companyProfile = companyProfileRepository.findByUserId(currentUserId)
                    .orElseThrow(() -> new BusinessException("Profil entreprise introuvable", "COMPANY_PROFILE_NOT_FOUND"));

            boolean isVerified = companyProfile.getVerifiedStatus() == VerificationStatus.VALIDE;
            if (!isVerified) {
                isVerified = userRepository.findById(currentUserId).map(User::isVerified).orElse(false);
            }
            if (!isVerified) {
                throw new BusinessException(
                    "Votre entreprise est actuellement en cours de vérification. Vous ne pouvez publier d'offres d'emploi qu'une fois votre compte validé par un administrateur.",
                    "COMPANY_NOT_VERIFIED",
                    403
                );
            }

            companyId = companyProfile.getId();
        }

        OfferStatus statut;
        LocalDate datePublication;

        if (isAdmin) {
            statut = request.getStatut() != null ? request.getStatut() : OfferStatus.DRAFT;
            datePublication = (statut == OfferStatus.ACTIVE) ? LocalDate.now() : null;
        } else {
            // Les entreprises créent les offres en DRAFT, puis les soumettent pour modération
            statut = OfferStatus.DRAFT;
            datePublication = null;
        }

        Instant now = Instant.now();
        Offer offer = Offer.builder()
                .companyId(companyId)
                .title(request.getTitle())
                .description(request.getDescription())
                .competencesRequises(request.getCompetencesRequises())
                .niveauExperience(request.getNiveauExperience())
                .typeContrat(request.getTypeContrat())
                .localisation(request.getLocalisation())
                .salaireMin(request.getSalaireMin())
                .salaireMax(request.getSalaireMax())
                .datePublication(datePublication)
                .dateExpiration(request.getDateExpiration())
                .statut(statut)
                .matchingTags(request.getMatchingTags())
                .viewCount(0)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return toResponse(offerRepository.save(offer), false, null);
    }

    @Cacheable(value = "my_offers")
    public List<OfferResponse> getMyOffers() {
        String currentUserId = CurrentUserService.getCurrentUserId();
        CompanyProfile companyProfile = companyProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new BusinessException("Profil entreprise introuvable", "COMPANY_PROFILE_NOT_FOUND"));
        List<Offer> offers = offerRepository.findByCompanyId(companyProfile.getId());
        
        // Company data is always the same for "my offers", so we can pass it directly
        return offers.stream()
                .map(o -> toResponseWithCompany(o, companyProfile, false, null))
                .toList();
    }

    @CacheEvict(value = {"offers_search", "my_offers", "offer_by_id", "admin_offers"}, allEntries = true)
    public OfferResponse updateOffer(String id, UpdateOfferRequest request) {
        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Offre introuvable", "OFFER_NOT_FOUND"));

        checkOwnership(offer);

        if (request.getTitle() != null) offer.setTitle(request.getTitle());
        if (request.getDescription() != null) offer.setDescription(request.getDescription());
        if (request.getCompetencesRequises() != null) offer.setCompetencesRequises(request.getCompetencesRequises());
        if (request.getNiveauExperience() != null) offer.setNiveauExperience(request.getNiveauExperience());
        if (request.getTypeContrat() != null) offer.setTypeContrat(request.getTypeContrat());
        if (request.getLocalisation() != null) offer.setLocalisation(request.getLocalisation());
        if (request.getSalaireMin() != null) offer.setSalaireMin(request.getSalaireMin());
        if (request.getSalaireMax() != null) offer.setSalaireMax(request.getSalaireMax());
        if (request.getDateExpiration() != null) offer.setDateExpiration(request.getDateExpiration());
        if (request.getMatchingTags() != null) offer.setMatchingTags(request.getMatchingTags());
        offer.setUpdatedAt(Instant.now());

        return toResponse(offerRepository.save(offer), false, null);
    }

    @CacheEvict(value = {"offers_search", "my_offers", "offer_by_id", "admin_offers"}, allEntries = true)
    public void deleteOffer(String id) {
        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Offre introuvable", "OFFER_NOT_FOUND"));
        checkOwnership(offer);
        offerRepository.delete(offer);
    }

    // â”€â”€â”€ Admin endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @Cacheable(value = "admin_offers", unless = "#result.isEmpty()")
    public List<OfferResponse> getAllOffersForAdmin() {
        List<Offer> offers = offerRepository.findAll(Sort.by(Sort.Direction.DESC, "datePublication"));
        
        // Batch fetch all companies to avoid N+1 queries
        Map<String, CompanyProfile> companies = fetchCompaniesForOffers(offers);
        
        return offers.stream()
                .map(o -> toResponseWithStatsAndCompany(o, companies.get(o.getCompanyId())))
                .collect(Collectors.toList());
    }

    /**
     * Modérer une offre : APPROVE → ACTIVE, REJECT → REJECTED, REQUEST_EDIT → DRAFT
     */
    @CacheEvict(value = {"offers_search", "admin_offers", "my_offers", "offer_by_id"}, allEntries = true)
    public OfferResponse moderateOffer(String offerId, String action, String comment) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new BusinessException("Offre introuvable", "OFFER_NOT_FOUND"));

        String actorId = CurrentUserService.getCurrentUserId();
        Instant now = Instant.now();

        ModerationAction modAction;
        OfferStatus newStatus;

        switch (action.toUpperCase()) {
            case "APPROVE" -> {
                modAction = ModerationAction.APPROVE;
                newStatus = OfferStatus.ACTIVE;
                LocalDate today = LocalDate.now();
                offer.setDatePublication(today);
                if (offer.getDateExpiration() == null || !offer.getDateExpiration().isAfter(today)) {
                    offer.setDateExpiration(today.plusDays(30));
                }
            }
            case "REJECT" -> {
                modAction = ModerationAction.REJECT;
                newStatus = OfferStatus.REJECTED;
            }
            case "REQUEST_EDIT" -> {
                modAction = ModerationAction.REQUEST_EDIT;
                newStatus = OfferStatus.DRAFT;
            }
            default -> throw new BusinessException("Action de modération invalide. Valeurs: APPROVE, REJECT, REQUEST_EDIT", "INVALID_MODERATION_ACTION");
        }

        offer.setStatut(newStatus);
        offer.setModeratorId(actorId);
        offer.setModerationComment(comment);
        offer.setModeratedAt(now);
        offer.setUpdatedAt(now);

        if (offer.getModerationHistory() == null) {
            offer.setModerationHistory(new ArrayList<>());
        }
        offer.getModerationHistory().add(ModerationHistoryEntry.builder()
                .actorId(actorId)
                .action(modAction)
                .comment(comment)
                .timestamp(now)
                .build());

        Offer saved = offerRepository.save(offer);

        // Send notifications based on moderation action
        try {
            CompanyProfile company = companyProfileRepository.findByUserId(offer.getCompanyId()).orElse(null);
            if (company != null && company.getUserId() != null) {
                switch (action.toUpperCase()) {
                    case "APPROVE" ->
                            userNotificationService.createCandidateNotification(
                                    company.getUserId(),
                                    "OFFER_APPROVED",
                                    "Votre offre a été approuvée",
                                    "L'offre \"" + offer.getTitle() + "\" est maintenant publiée et visible aux candidats.",
                                    "/company/offers/" + offer.getId()
                            );
                    case "REJECT" ->
                            userNotificationService.createCandidateNotification(
                                    company.getUserId(),
                                    "OFFER_REJECTED",
                                    "Votre offre a été rejetée",
                                    "L'offre \"" + offer.getTitle() + "\" a été rejetée. Raison : " + comment,
                                    "/company/offers/" + offer.getId()
                            );
                    case "REQUEST_EDIT" ->
                            userNotificationService.createCandidateNotification(
                                    company.getUserId(),
                                    "OFFER_MODIFICATIONS_REQUESTED",
                                    "Modifications demandées sur votre offre",
                                    "L'offre \"" + offer.getTitle() + "\" nécessite des corrections. Consultez le détail pour les corrections demandées.",
                                    "/company/offers/" + offer.getId()
                            );
                }
            }
        } catch (Exception e) {
            // Log but don't fail the operation
            System.err.println("Erreur lors de la création de la notification de modération: " + e.getMessage());
        }

        return toResponseWithStats(saved);
    }

    /**
     * Mise à jour admin : statut, titre, description, etc.
     */
    @CacheEvict(value = {"offers_search", "admin_offers", "my_offers", "offer_by_id"}, allEntries = true)
    public OfferResponse updateOfferAdmin(String offerId, Map<String, Object> body) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new BusinessException("Offre introuvable", "OFFER_NOT_FOUND"));

        if (body.containsKey("statut")) {
            try {
                offer.setStatut(OfferStatus.valueOf((String) body.get("statut")));
            } catch (IllegalArgumentException e) {
                throw new BusinessException("Statut invalide", "INVALID_STATUS");
            }
        }
        if (body.containsKey("title")) offer.setTitle((String) body.get("title"));
        if (body.containsKey("description")) offer.setDescription((String) body.get("description"));
        if (body.containsKey("moderationComment")) offer.setModerationComment((String) body.get("moderationComment"));
        offer.setUpdatedAt(Instant.now());

        return toResponseWithStats(offerRepository.save(offer));
    }

    /**
     * Dupliquer une offre (clone en DRAFT)
     */
    @CacheEvict(value = {"offers_search", "admin_offers", "my_offers"}, allEntries = true)
    public OfferResponse duplicateOffer(String offerId) {
        Offer source = offerRepository.findById(offerId)
                .orElseThrow(() -> new BusinessException("Offre introuvable", "OFFER_NOT_FOUND"));

        Offer copy = Offer.builder()
                .companyId(source.getCompanyId())
                .title("[Copie] " + source.getTitle())
                .description(source.getDescription())
                .competencesRequises(source.getCompetencesRequises() != null ? new ArrayList<>(source.getCompetencesRequises()) : null)
                .niveauExperience(source.getNiveauExperience())
                .typeContrat(source.getTypeContrat())
                .localisation(source.getLocalisation())
                .salaireMin(source.getSalaireMin())
                .salaireMax(source.getSalaireMax())
                .dateExpiration(source.getDateExpiration())
                .statut(OfferStatus.DRAFT)
                .matchingTags(source.getMatchingTags() != null ? new ArrayList<>(source.getMatchingTags()) : null)
                .viewCount(0)
                .build();

        return toResponseWithStats(offerRepository.save(copy));
    }

    /**
     * Statistiques globales des offres pour le dashboard admin
     */
    @Cacheable(value = "admin_stats", unless = "#result.isEmpty()")
    public Map<String, Object> getAdminStats() {
        List<Offer> allOffers = offerRepository.findAll();
        Map<String, Long> byStatus = allOffers.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getStatut() != null ? o.getStatut().name() : "UNKNOWN",
                        Collectors.counting()));

        long total = allOffers.size();
        long pending = byStatus.getOrDefault(OfferStatus.PENDING_MODERATION.name(), 0L);
        long active = byStatus.getOrDefault(OfferStatus.ACTIVE.name(), 0L);
        long rejected = byStatus.getOrDefault(OfferStatus.REJECTED.name(), 0L);
        long expired = byStatus.getOrDefault(OfferStatus.EXPIRED.name(), 0L);
        long draft = byStatus.getOrDefault(OfferStatus.DRAFT.name(), 0L);
        long unpublished = byStatus.getOrDefault(OfferStatus.UNPUBLISHED.name(), 0L);

        long totalViews = allOffers.stream()
                .mapToLong(o -> o.getViewCount() != null ? o.getViewCount() : 0)
                .sum();
        long totalApplications = applicationRepository.count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("pending", pending);
        stats.put("active", active);
        stats.put("rejected", rejected);
        stats.put("expired", expired);
        stats.put("draft", draft);
        stats.put("unpublished", unpublished);
        stats.put("totalViews", totalViews);
        stats.put("totalApplications", totalApplications);
        return stats;
    }

    // â”€â”€â”€ Private helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private void checkOwnership(Offer offer) {
        if (isCurrentUserAdmin()) return;
        String currentUserId = CurrentUserService.getCurrentUserId();
        CompanyProfile companyProfile = companyProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new BusinessException("Profil entreprise introuvable", "COMPANY_PROFILE_NOT_FOUND"));
        if (!offer.getCompanyId().equals(companyProfile.getId())) {
            throw new BusinessException("AccÃ¨s refusÃ©: vous n'Ãªtes pas propriÃ©taire de cette offre", "FORBIDDEN");
        }
    }

    private boolean isCurrentUserCandidate() {
        return hasRole(Role.CANDIDATE);
    }

    private boolean isCurrentUserAdmin() {
        return hasRole(Role.ADMIN);
    }

    private boolean hasRole(Role role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role.name()));
    }

    private Instant resolveCreatedAt(Offer o) {
        if (o.getCreatedAt() != null) {
            return o.getCreatedAt();
        }
        if (o.getDatePublication() != null) {
            return o.getDatePublication().atStartOfDay(ZoneId.systemDefault()).toInstant();
        }
        return Instant.now();
    }

    private LocalDate resolveDateExpiration(Offer o, LocalDate datePublication) {
        if (o.getDateExpiration() == null) {
            return null;
        }
        if (datePublication != null && !o.getDateExpiration().isAfter(datePublication)) {
            return datePublication.plusDays(30);
        }
        return o.getDateExpiration();
    }

    private CompanyProfile resolveCompany(String companyId) {
        if (companyId == null || companyId.isBlank()) return null;
        return companyProfileRepository.findById(companyId)
                .or(() -> companyProfileRepository.findByUserId(companyId))
                .orElse(null);
    }

    private String resolveCompanyName(String companyId) {
        if (companyId == null || companyId.isBlank()) return null;
        CompanyProfile cp = resolveCompany(companyId);
        if (cp != null && cp.getCompanyName() != null && !cp.getCompanyName().isBlank()) {
            return cp.getCompanyName();
        }
        try {
            return userRepository.findById(companyId)
                    .map(u -> u.getEmail() != null ? u.getEmail() : null)
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private int countApplications(String offerId) {
        return offerId != null ? applicationRepository.findByOfferId(offerId).size() : 0;
    }

    /**
     * Batch fetch all companies for a list of offers to avoid N+1 queries
     */
    private Map<String, CompanyProfile> fetchCompaniesForOffers(List<Offer> offers) {
        if (offers == null || offers.isEmpty()) {
            return new HashMap<>();
        }
        
        Set<String> companyIds = offers.stream()
                .map(Offer::getCompanyId)
                .filter(id -> id != null && !id.isBlank())
                .collect(Collectors.toSet());
        
        if (companyIds.isEmpty()) {
            return new HashMap<>();
        }

        Map<String, CompanyProfile> result = new HashMap<>();

        // 1. By CompanyProfile ID
        List<CompanyProfile> byId = companyProfileRepository.findAllById(companyIds);
        for (CompanyProfile cp : byId) {
            if (cp.getId() != null) result.put(cp.getId(), cp);
            if (cp.getUserId() != null) result.put(cp.getUserId(), cp);
        }

        // 2. By CompanyProfile userId for any remaining IDs
        Set<String> remainingIds = companyIds.stream()
                .filter(id -> !result.containsKey(id))
                .collect(Collectors.toSet());

        if (!remainingIds.isEmpty()) {
            List<CompanyProfile> byUserId = companyProfileRepository.findByUserIdIn(remainingIds);
            for (CompanyProfile cp : byUserId) {
                if (cp.getId() != null) result.put(cp.getId(), cp);
                if (cp.getUserId() != null) result.put(cp.getUserId(), cp);
            }
        }

        return result;
    }

    /**
     * Map Offer to OfferResponse with full company details enrichment
     */
    private OfferResponse toResponseWithCompany(Offer o, CompanyProfile company, boolean addMatching, CandidateProfile candidateProfile) {
        if (company == null && o.getCompanyId() != null) {
            company = resolveCompany(o.getCompanyId());
        }
        String compName = company != null && company.getCompanyName() != null && !company.getCompanyName().isBlank()
                ? company.getCompanyName()
                : resolveCompanyName(o.getCompanyId());

        Integer score = null;
        if (addMatching && candidateProfile != null) {
            score = matchingService.calculate(candidateProfile, o);
        }
        
        return OfferResponse.builder()
                .id(o.getId())
                .companyId(o.getCompanyId())
                .companyName(compName)
                .companySector(company != null ? company.getIndustry() : null)
                .companyDescription(company != null ? company.getDescription() : null)
                .companyAddress(company != null ? company.getAddress() : null)
                .companyLogoFileId(company != null ? company.getLogoFileId() : null)
                .companyWebsite(company != null ? company.getWebsite() : null)
                .title(o.getTitle())
                .description(o.getDescription())
                .competencesRequises(o.getCompetencesRequises())
                .niveauExperience(o.getNiveauExperience())
                .typeContrat(o.getTypeContrat())
                .localisation(o.getLocalisation())
                .salaireMin(o.getSalaireMin())
                .salaireMax(o.getSalaireMax())
                .datePublication(o.getDatePublication())
                .dateExpiration(resolveDateExpiration(o, o.getDatePublication()))
                .createdAt(resolveCreatedAt(o))
                .updatedAt(o.getUpdatedAt() != null ? o.getUpdatedAt() : resolveCreatedAt(o))
                .statut(o.getStatut())
                .moderatorId(o.getModeratorId())
                .moderatorEmail(o.getModeratorId() != null ? resolveModeratorEmail(o.getModeratorId()) : null)
                .moderatorName(o.getModeratorId() != null ? resolveModeratorName(o.getModeratorId()) : null)
                .moderationComment(o.getModerationComment())
                .moderatedAt(o.getModeratedAt())
                .moderationHistory(o.getModerationHistory() != null ? o.getModerationHistory() : new ArrayList<>())
                .matchingTags(o.getMatchingTags())
                .matchingScore(score)
                .viewCount(o.getViewCount())
                .applyCount(countApplications(o.getId()))
                .candidatureCount(countApplications(o.getId()))
                .build();
    }

    private OfferResponse toResponse(Offer o, boolean addMatching, CandidateProfile candidateProfile) {
        Integer score = null;
        if (addMatching && candidateProfile != null) {
            score = matchingService.calculate(candidateProfile, o);
        }
        return OfferResponse.builder()
                .id(o.getId())
                .companyId(o.getCompanyId())
                .companyName(resolveCompanyName(o.getCompanyId()))
                .title(o.getTitle())
                .description(o.getDescription())
                .competencesRequises(o.getCompetencesRequises())
                .niveauExperience(o.getNiveauExperience())
                .typeContrat(o.getTypeContrat())
                .localisation(o.getLocalisation())
                .salaireMin(o.getSalaireMin())
                .salaireMax(o.getSalaireMax())
                .datePublication(o.getDatePublication())
                .dateExpiration(resolveDateExpiration(o, o.getDatePublication()))
                .createdAt(resolveCreatedAt(o))
                .updatedAt(o.getUpdatedAt() != null ? o.getUpdatedAt() : resolveCreatedAt(o))
                .statut(o.getStatut())
                .matchingTags(o.getMatchingTags())
                .matchingScore(score)
                .viewCount(o.getViewCount())
                .build();
    }

    private OfferResponse toResponseWithStats(Offer o) {
        CompanyProfile company = resolveCompany(o.getCompanyId());
        String compName = company != null && company.getCompanyName() != null && !company.getCompanyName().isBlank()
                ? company.getCompanyName()
                : resolveCompanyName(o.getCompanyId());

        return OfferResponse.builder()
                .id(o.getId())
                .companyId(o.getCompanyId())
                .companyName(compName)
                .companySector(company != null ? company.getIndustry() : null)
                .companyDescription(company != null ? company.getDescription() : null)
                .companyAddress(company != null ? company.getAddress() : null)
                .companyLogoFileId(company != null ? company.getLogoFileId() : null)
                .companyWebsite(company != null ? company.getWebsite() : null)
                .title(o.getTitle())
                .description(o.getDescription())
                .competencesRequises(o.getCompetencesRequises())
                .niveauExperience(o.getNiveauExperience())
                .typeContrat(o.getTypeContrat())
                .localisation(o.getLocalisation())
                .salaireMin(o.getSalaireMin())
                .salaireMax(o.getSalaireMax())
                .datePublication(o.getDatePublication())
                .dateExpiration(resolveDateExpiration(o, o.getDatePublication()))
                .createdAt(resolveCreatedAt(o))
                .updatedAt(o.getUpdatedAt() != null ? o.getUpdatedAt() : resolveCreatedAt(o))
                .statut(o.getStatut())
                .matchingTags(o.getMatchingTags())
                .moderatorId(o.getModeratorId())
                .moderatorEmail(resolveModeratorEmail(o.getModeratorId()))
                .moderatorName(resolveModeratorName(o.getModeratorId()))
                .moderationComment(o.getModerationComment())
                .moderatedAt(o.getModeratedAt())
                .moderationHistory(o.getModerationHistory())
                .viewCount(o.getViewCount())
                .candidatureCount(countApplications(o.getId()))
                .build();
    }

    /**
     * Map Offer to OfferResponse with full company details and stats (for admin endpoints)
     */
    private OfferResponse toResponseWithStatsAndCompany(Offer o, CompanyProfile company) {
        if (company == null && o.getCompanyId() != null) {
            company = resolveCompany(o.getCompanyId());
        }
        String compName = company != null && company.getCompanyName() != null && !company.getCompanyName().isBlank()
                ? company.getCompanyName()
                : resolveCompanyName(o.getCompanyId());

        return OfferResponse.builder()
                .id(o.getId())
                .companyId(o.getCompanyId())
                .companyName(compName)
                .companySector(company != null ? company.getIndustry() : null)
                .companyDescription(company != null ? company.getDescription() : null)
                .companyAddress(company != null ? company.getAddress() : null)
                .companyLogoFileId(company != null ? company.getLogoFileId() : null)
                .companyWebsite(company != null ? company.getWebsite() : null)
                .title(o.getTitle())
                .description(o.getDescription())
                .competencesRequises(o.getCompetencesRequises())
                .niveauExperience(o.getNiveauExperience())
                .typeContrat(o.getTypeContrat())
                .localisation(o.getLocalisation())
                .salaireMin(o.getSalaireMin())
                .salaireMax(o.getSalaireMax())
                .datePublication(o.getDatePublication())
                .dateExpiration(resolveDateExpiration(o, o.getDatePublication()))
                .createdAt(resolveCreatedAt(o))
                .updatedAt(o.getUpdatedAt() != null ? o.getUpdatedAt() : resolveCreatedAt(o))
                .statut(o.getStatut())
                .matchingTags(o.getMatchingTags())
                .moderatorId(o.getModeratorId())
                .moderatorEmail(resolveModeratorEmail(o.getModeratorId()))
                .moderatorName(resolveModeratorName(o.getModeratorId()))
                .moderationComment(o.getModerationComment())
                .moderatedAt(o.getModeratedAt())
                .moderationHistory(o.getModerationHistory())
                .viewCount(o.getViewCount())
                .candidatureCount(countApplications(o.getId()))
                .build();
    }

    private String resolveModeratorEmail(String moderatorId) {
        if (moderatorId == null || moderatorId.isBlank()) {
            return null;
        }
        try {
            User moderator = userRepository.findById(moderatorId).orElse(null);
            return moderator != null ? moderator.getEmail() : null;
        } catch (Exception e) {
            System.err.println("Erreur lors de la résolution de l'email du modérateur: " + e.getMessage());
            return null;
        }
    }

    private String resolveModeratorName(String moderatorId) {
        if (moderatorId == null || moderatorId.isBlank()) {
            return null;
        }
        try {
            User moderator = userRepository.findById(moderatorId).orElse(null);
            if (moderator != null) {
                // For now, use email as name since User model doesn't have firstName/lastName
                // Admin's name is stored in email
                return moderator.getEmail() != null ? moderator.getEmail().split("@")[0] : "Admin";
            }
            return null;
        } catch (Exception e) {
            System.err.println("Erreur lors de la résolution du nom du modérateur: " + e.getMessage());
            return null;
        }
    }
}