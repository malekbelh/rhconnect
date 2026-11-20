package com.rhconnect.service;

import com.rhconnect.dto.response.StatsResponse;
import com.rhconnect.model.Application;
import com.rhconnect.model.ApplicationTimelineEntry;
import com.rhconnect.model.Offer;
import com.rhconnect.model.User;
import com.rhconnect.model.enums.ApplicationStatus;
import com.rhconnect.model.enums.OfferStatus;
import com.rhconnect.model.enums.Role;
import com.rhconnect.model.enums.TypeContrat;
import com.rhconnect.model.enums.VerificationStatus;
import com.rhconnect.repository.ApplicationRepository;
import com.rhconnect.repository.CandidateProfileRepository;
import com.rhconnect.repository.CompanyProfileRepository;
import com.rhconnect.repository.OfferRepository;
import com.rhconnect.repository.UserRepository;
import com.rhconnect.repository.VerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final UserRepository userRepository;
    private final OfferRepository offerRepository;
    private final ApplicationRepository applicationRepository;
    private final VerificationRepository verificationRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final CompanyProfileRepository companyProfileRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    public StatsResponse getDashboardStats() {
        try {
            long users = userRepository.count();
            long candidates = candidateProfileRepository.count();
            long companies = companyProfileRepository.count();
            long offers = offerRepository.count();
            long applications = applicationRepository.count();
            
            // Utiliser une approche alternative si countByStatut ne fonctionne pas
            long countAcceptees = 0;
            long countRefusees = 0;
            
            try {
                countAcceptees = applicationRepository.countByStatut(ApplicationStatus.ACCEPTE);
                countRefusees = applicationRepository.countByStatut(ApplicationStatus.REFUSE);
            } catch (Exception e) {
                System.out.println("⚠️  countByStatut échoué, utilisant fallback...");
                // Fallback: compter manuellement
                List<Application> apps = applicationRepository.findAll();
                countAcceptees = apps.stream().filter(a -> a.getStatut() == ApplicationStatus.ACCEPTE).count();
                countRefusees = apps.stream().filter(a -> a.getStatut() == ApplicationStatus.REFUSE).count();
            }
            
            long verificationsCount = verificationRepository.count();
            long verificationsPending = verificationRepository.findByStatut(VerificationStatus.EN_ATTENTE).size();

            double tauxConversion = (applications > 0) ? ((double) countAcceptees / applications * 100) : 0.0;
            long decided = countAcceptees + countRefusees;
            double tauxAcceptation = (decided > 0) ? ((double) countAcceptees / decided * 100) : 0.0;

            Map<String, Long> candidaturesParStatut = new LinkedHashMap<>();
            try {
                for (ApplicationStatus status : ApplicationStatus.values()) {
                    candidaturesParStatut.put(status.name(), applicationRepository.countByStatut(status));
                }
            } catch (Exception e) {
                System.out.println("⚠️  Boucle countByStatut échouée, utilisant fallback...");
                // Fallback: compter manuellement
                List<Application> apps = applicationRepository.findAll();
                for (ApplicationStatus status : ApplicationStatus.values()) {
                    long count = apps.stream().filter(a -> a.getStatut() == status).count();
                    candidaturesParStatut.put(status.name(), count);
                }
            }

            // Délai moyen de recrutement
            double delaiMoyen = computeDelaiMoyenRecrutement(applicationRepository.findAll());

            // Top 5 offres par volume candidatures
            List<StatsResponse.TopOfferStats> topOffers = computeTopOffers(5);

            // Tendances 6 derniers mois
            List<Map<String, Object>> tendancesInscriptions = getSignupsByMonth(6);
            List<Map<String, Object>> tendancesCandidatures = getApplicationsByMonth(6);

            return StatsResponse.builder()
                    .users(users)
                    .candidates(candidates)
                    .companies(companies)
                    .offers(offers)
                    .applications(applications)
                    .tauxConversion(tauxConversion)
                    .tauxAcceptation(tauxAcceptation)
                    .candidaturesParStatut(candidaturesParStatut)
                    .verificationsCount(verificationsCount)
                    .verificationsPending(verificationsPending)
                    .delaiMoyenRecrutementJours(delaiMoyen)
                    .topOffers(topOffers)
                    .tendancesInscriptions(tendancesInscriptions)
                    .tendancesCandidatures(tendancesCandidatures)
                    .build();
        } catch (Exception e) {
            System.err.println("❌ ERREUR dans getDashboardStats:");
            e.printStackTrace();
            throw new RuntimeException("Erreur lors du calcul des statistiques dashboard", e);
        }
    }

    /**
     * Calcule le délai moyen entre le dépôt (POSTULE) et la décision finale (ACCEPTE/REFUSE)
     */
    private double computeDelaiMoyenRecrutement(List<Application> apps) {
        List<Long> delays = new ArrayList<>();
        for (Application app : apps) {
            if (app.getTimeline() == null || app.getTimeline().isEmpty()) continue;

            LocalDateTime datePostule = null;
            LocalDateTime dateDecision = null;

            for (ApplicationTimelineEntry entry : app.getTimeline()) {
                if (entry.getStatut() == ApplicationStatus.POSTULE && datePostule == null) {
                    datePostule = entry.getDate();
                }
                if (entry.getStatut() == ApplicationStatus.ACCEPTE || entry.getStatut() == ApplicationStatus.REFUSE) {
                    dateDecision = entry.getDate();
                }
            }

            if (datePostule != null && dateDecision != null && dateDecision.isAfter(datePostule)) {
                delays.add(ChronoUnit.DAYS.between(datePostule, dateDecision));
            }
        }

        if (delays.isEmpty()) return 0.0;
        return delays.stream().mapToLong(Long::longValue).average().orElse(0.0);
    }

    /**
     * Top N offres par nombre de candidatures
     */
    private List<StatsResponse.TopOfferStats> computeTopOffers(int limit) {
        List<Application> allApps = applicationRepository.findAll();

        Map<String, Long> countByOffer = allApps.stream()
                .collect(Collectors.groupingBy(Application::getOfferId, Collectors.counting()));

        return countByOffer.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    String offerId = entry.getKey();
                    Offer offer = offerRepository.findById(offerId).orElse(null);
                    return StatsResponse.TopOfferStats.builder()
                            .offerId(offerId)
                            .titre(offer != null ? offer.getTitle() : "Offre supprimée")
                            .companyId(offer != null ? offer.getCompanyId() : null)
                            .typeContrat(offer != null && offer.getTypeContrat() != null ? offer.getTypeContrat().name() : null)
                            .candidatureCount(entry.getValue())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Endpoint cross-filtré : stats avec filtres startDate, endDate, contractType, status
     */
    public Map<String, Object> getCrossFilteredStats(
            LocalDate startDate,
            LocalDate endDate,
            String contractType,
            String status) {

        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime end = endDate != null ? endDate.plusDays(1).atStartOfDay() : LocalDateTime.now().plusDays(1);

        List<Application> apps = applicationRepository.findAll().stream()
                .filter(a -> a.getCreatedAt() != null
                        && !a.getCreatedAt().isBefore(start)
                        && a.getCreatedAt().isBefore(end))
                .filter(a -> {
                    if (status == null || status.isBlank()) return true;
                    try {
                        return a.getStatut() == ApplicationStatus.valueOf(status);
                    } catch (IllegalArgumentException e) {
                        return true;
                    }
                })
                .collect(Collectors.toList());

        // Filtrer aussi par contrat (via offres)
        if (contractType != null && !contractType.isBlank()) {
            try {
                TypeContrat tc = TypeContrat.valueOf(contractType);
                Set<String> offerIds = offerRepository.findAll().stream()
                        .filter(o -> tc.equals(o.getTypeContrat()))
                        .map(Offer::getId)
                        .collect(Collectors.toSet());
                apps = apps.stream().filter(a -> offerIds.contains(a.getOfferId())).collect(Collectors.toList());
            } catch (IllegalArgumentException ignored) { }
        }

        long total = apps.size();
        long accepted = apps.stream().filter(a -> a.getStatut() == ApplicationStatus.ACCEPTE).count();
        long refused = apps.stream().filter(a -> a.getStatut() == ApplicationStatus.REFUSE).count();

        Map<String, Long> byStatut = new LinkedHashMap<>();
        for (ApplicationStatus s : ApplicationStatus.values()) {
            final ApplicationStatus fs = s;
            byStatut.put(s.name(), apps.stream().filter(a -> a.getStatut() == fs).count());
        }

        double delai = computeDelaiMoyenRecrutement(apps);

        // Candidatures par jour dans la période
        Map<String, Long> byDay = apps.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getCreatedAt().toLocalDate().format(DATE_FORMATTER),
                        Collectors.counting()));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalCandidatures", total);
        result.put("acceptees", accepted);
        result.put("refusees", refused);
        result.put("tauxAcceptation", (accepted + refused > 0) ? ((double) accepted / (accepted + refused) * 100) : 0.0);
        result.put("candidaturesParStatut", byStatut);
        result.put("delaiMoyenRecrutementJours", delai);
        result.put("candidaturesParJour", byDay);
        result.put("filtres", Map.of(
                "startDate", startDate != null ? startDate.format(DATE_FORMATTER) : "",
                "endDate", endDate != null ? endDate.format(DATE_FORMATTER) : "",
                "contractType", contractType != null ? contractType : "",
                "status", status != null ? status : ""
        ));
        return result;
    }

    public List<Map<String, Object>> getApplicationsByDay(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<Application> allApps = applicationRepository.findAll();

        Map<String, Long> countsByDate = allApps.stream()
                .filter(app -> app.getCreatedAt() != null && !app.getCreatedAt().isBefore(startDate))
                .collect(Collectors.groupingBy(
                        app -> app.getCreatedAt().toLocalDate().format(DATE_FORMATTER),
                        Collectors.counting()
                ));

        List<Map<String, Object>> result = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            String dateStr = date.format(DATE_FORMATTER);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date", dateStr);
            entry.put("count", countsByDate.getOrDefault(dateStr, 0L));
            result.add(entry);
        }
        return result;
    }

    private List<Map<String, Object>> getApplicationsByMonth(int months) {
        LocalDateTime startMonth = LocalDateTime.now().minusMonths(months);
        List<Application> allApps = applicationRepository.findAll();

        Map<String, Long> countsByMonth = allApps.stream()
                .filter(app -> app.getCreatedAt() != null && !app.getCreatedAt().isBefore(startMonth))
                .collect(Collectors.groupingBy(
                        app -> YearMonth.from(app.getCreatedAt()).format(MONTH_FORMATTER),
                        Collectors.counting()
                ));

        List<Map<String, Object>> result = new ArrayList<>();
        YearMonth currentMonth = YearMonth.now();
        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = currentMonth.minusMonths(i);
            String monthStr = ym.format(MONTH_FORMATTER);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("month", monthStr);
            entry.put("count", countsByMonth.getOrDefault(monthStr, 0L));
            result.add(entry);
        }
        return result;
    }

    public List<Map<String, Object>> getRolesDistribution() {
        List<User> allUsers = userRepository.findAll();
        Map<Role, Long> roleCounts = new HashMap<>();

        for (Role role : Role.values()) {
            roleCounts.put(role, 0L);
        }

        for (User user : allUsers) {
            if (user.getRoles() != null) {
                for (Role role : user.getRoles()) {
                    roleCounts.merge(role, 1L, Long::sum);
                }
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Role role : Role.values()) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("role", role.name());
            entry.put("count", roleCounts.get(role));
            result.add(entry);
        }
        return result;
    }

    public List<Map<String, Object>> getSignupsByMonth(int months) {
        LocalDateTime startMonth = LocalDateTime.now().minusMonths(months);
        List<User> allUsers = userRepository.findAll();

        Map<String, Long> countsByMonth = allUsers.stream()
                .filter(user -> user.getCreatedAt() != null && !user.getCreatedAt().isBefore(startMonth))
                .collect(Collectors.groupingBy(
                        user -> YearMonth.from(user.getCreatedAt()).format(MONTH_FORMATTER),
                        Collectors.counting()
                ));

        List<Map<String, Object>> result = new ArrayList<>();
        YearMonth currentMonth = YearMonth.now();
        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = currentMonth.minusMonths(i);
            String monthStr = ym.format(MONTH_FORMATTER);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("month", monthStr);
            entry.put("count", countsByMonth.getOrDefault(monthStr, 0L));
            result.add(entry);
        }
        return result;
    }
}
