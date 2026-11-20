package com.rhconnect.seeder;

import com.rhconnect.model.*;
import com.rhconnect.model.enums.*;
import com.rhconnect.repository.*;
import com.rhconnect.service.MatchingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Component
@Profile("!prod")
@Order(1)
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final OfferRepository offerRepository;
    private final ApplicationRepository applicationRepository;
    private final VerificationRepository verificationRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final MatchingService matchingService;

    @Value("${rhconnect.seed.force:false}")
    private boolean forceSeed;

    @Override
    public void run(String... args) {
        if (!forceSeed && userRepository.count() > 0) {
            ensureDocumentedAdminAccount();
            ensureMarieNotification();
            ensureCandidateProfilesAndVerifications();
            log.info("=== RHCONNECT SEED SKIP: base déjà remplie et force=false ===");
            return;
        }

        log.info("=== RHCONNECT SEED DÉBUT (force={}) ===", forceSeed);

        if (forceSeed) {
            userRepository.deleteAll();
            candidateProfileRepository.deleteAll();
            companyProfileRepository.deleteAll();
            offerRepository.deleteAll();
            applicationRepository.deleteAll();
            verificationRepository.deleteAll();
            refreshTokenRepository.deleteAll();
            userNotificationRepository.deleteAll();
            log.info("Collections nettoyées");
        }

        String rawPassword = "RhConnect2026!";
        String encodedPassword = passwordEncoder.encode(rawPassword);

        // 1. Admin & Recruteur (domaine rhconnect.tn)
        User admin = userRepository.save(User.builder()
                .email("admin@rhconnect.tn")
                .password(encodedPassword)
                .roles(List.of(Role.ADMIN))
                .enabled(true)
                
                .createdAt(LocalDateTime.now().minusDays(30))
                .build());

        User recruiter = userRepository.save(User.builder()
                .email("recruteur@rhconnect.tn")
                .password(encodedPassword)
                .roles(List.of(Role.RECRUITER))
                .enabled(true)
                
                .createdAt(LocalDateTime.now().minusDays(25))
                .build());

        // 2. Utilisateurs Candidats (localisés en Tunisie)
        User marie = userRepository.save(User.builder()
                .email("mariem.gharbi@rhconnect.tn")
                .password(encodedPassword)
                .roles(List.of(Role.CANDIDATE))
                .enabled(true)
                
                .createdAt(LocalDateTime.now().minusDays(20))
                .build());

        User lucas = userRepository.save(User.builder()
                .email("yassine.trabelsi@rhconnect.tn")
                .password(encodedPassword)
                .roles(List.of(Role.CANDIDATE))
                .enabled(true)
                
                .createdAt(LocalDateTime.now().minusDays(18))
                .build());

        User sophie = userRepository.save(User.builder()
                .email("nour.bensalem@rhconnect.tn")
                .password(encodedPassword)
                .roles(List.of(Role.CANDIDATE))
                .enabled(true)
                
                .createdAt(LocalDateTime.now().minusDays(15))
                .build());

        User paul = userRepository.save(User.builder()
                .email("amine.khemir@rhconnect.tn")
                .password(encodedPassword)
                .roles(List.of(Role.CANDIDATE))
                .enabled(true)
                .verified(false)
                .createdAt(LocalDateTime.now().minusDays(10))
                .build());

        // 3. Utilisateurs Entreprises (entreprises phares en Tunisie)
        User instadeepUser = userRepository.save(User.builder()
                .email("contact@instadeep.tn")
                .password(encodedPassword)
                .roles(List.of(Role.COMPANY))
                .enabled(true)
                
                .createdAt(LocalDateTime.now().minusDays(28))
                .build());

        User vermegUser = userRepository.save(User.builder()
                .email("rh@vermeg.tn")
                .password(encodedPassword)
                .roles(List.of(Role.COMPANY))
                .enabled(true)
                
                .createdAt(LocalDateTime.now().minusDays(24))
                .build());

        User telnetUser = userRepository.save(User.builder()
                .email("contact@telnet.tn")
                .password(encodedPassword)
                .roles(List.of(Role.COMPANY))
                .enabled(true)
                
                .createdAt(LocalDateTime.now().minusDays(22))
                .build());

        User jumiaUser = userRepository.save(User.builder()
                .email("contact@jumia.tn")
                .password(encodedPassword)
                .roles(List.of(Role.COMPANY))
                .enabled(true)
                
                .createdAt(LocalDateTime.now().minusDays(19))
                .build());

        long usersCount = userRepository.count();

        // 4. Profils Candidats (format +216, villes: Tunis, Sfax, Sousse, Ariana)
        CandidateProfile marieProfile = candidateProfileRepository.save(CandidateProfile.builder()
                .userId(marie.getId())
                .firstName("Mariem")
                .lastName("Gharbi")
                .address("Centre Urbain Nord, Tunis")
                .bio("Développeuse Fullstack passionnée par Java Spring Boot et Angular/React. 3 ans d'expérience dans le développement web moderne.")
                .competences(List.of("Java", "Spring Boot", "Angular", "React", "TypeScript", "MongoDB", "Docker", "REST"))
                .parcours(List.of(
                        Experience.builder()
                                .title("Développeuse Fullstack")
                                .company("Vermeg Tunis")
                                .startDate(LocalDate.now().minusYears(3))
                                .endDate(LocalDate.now().minusYears(1))
                                .description("Conception et implémentation de microservices bancaires en Spring Boot et Angular.")
                                .build(),
                        Experience.builder()
                                .title("Ingénieure Logiciel")
                                .company("Tech Solutions Tunis")
                                .startDate(LocalDate.now().minusYears(1))
                                .description("Développement de portails clients réactifs et APIs sécurisées.")
                                .build()
                ))
                .formation(List.of(
                        Formation.builder()
                                .diploma("Diplôme National d'Ingénieur en Informatique")
                                .school("INSAT Tunis")
                                .year(2021)
                                .build()
                ))
                .matchingTags(List.of("java", "spring", "fullstack", "angular", "react", "tunis"))
                .cvFileId("cv-mariem-001")
                .cvFileName("CV_Mariem_Gharbi.pdf")
                .build());

        CandidateProfile lucasProfile = candidateProfileRepository.save(CandidateProfile.builder()
                .userId(lucas.getId())
                .firstName("Yassine")
                .lastName("Trabelsi")
                .address("Kantaoui, Sousse")
                .bio("Data Scientist & Ingénieur IA avec 4 ans d'expérience en Machine Learning, Deep Learning et architectures Transformer (NLP/LLM). Passionné par l'industrialisation des modèles IA et le MLOps.")
                .competences(List.of("Python", "TensorFlow", "PyTorch", "NLP", "Machine Learning", "FastAPI", "SQL", "Docker", "MLOps", "Transformers", "Kubernetes"))
                .parcours(List.of(
                        Experience.builder()
                                .title("Lead Data Scientist & IA")
                                .company("IA Innovation Sousse")
                                .startDate(LocalDate.now().minusYears(4))
                                .description("Conception et déploiement de modèles prédictifs et vision par ordinateur. Direction technique d'une équipe de 5 data scientists.")
                                .build(),
                        Experience.builder()
                                .title("Ingénieur Machine Learning")
                                .company("DataTech Labs Tunis")
                                .startDate(LocalDate.now().minusYears(6))
                                .endDate(LocalDate.now().minusYears(4))
                                .description("Développement de pipelines NLP pour l'analyse de sentiment et le traitement automatique de documents.")
                                .build()
                ))
                .formation(List.of(
                        Formation.builder()
                                .diploma("Diplôme National d'Ingénieur en Génie Informatique & Télécoms")
                                .school("ENISO Sousse")
                                .year(2020)
                                .build(),
                        Formation.builder()
                                .diploma("Master Recherche en Intelligence Artificielle & Big Data")
                                .school("Université de Sousse")
                                .year(2021)
                                .build()
                ))
                .matchingTags(List.of("python", "data", "ia", "machine-learning", "sousse", "nlp", "mlops", "deep-learning"))
                .cvFileId("cv-yassine-001")
                .cvFileName("CV_Yassine_Trabelsi.pdf")
                .build());

        CandidateProfile sophieProfile = candidateProfileRepository.save(CandidateProfile.builder()
                .userId(sophie.getId())
                .firstName("Nour")
                .lastName("Ben Salem")
                .address("Route de Téniour, Sfax")
                .bio("Product Manager & Spécialiste Marketing Digital orientée conversion, SEO et gestion de produits SaaS à forte croissance.")
                .competences(List.of("Product Management", "Scrum", "SEO", "Google Analytics", "Growth", "Marketing Digital"))
                .parcours(List.of(
                        Experience.builder()
                                .title("Product Manager")
                                .company("Digital Hub Sfax")
                                .startDate(LocalDate.now().minusYears(3))
                                .description("Gestion du backlog produit, roadmap et coordination des sprints agiles.")
                                .build()
                ))
                .formation(List.of(
                        Formation.builder()
                                .diploma("Master en Commerce & Technologies de l'Information")
                                .school("ENIS Sfax")
                                .year(2021)
                                .build()
                ))
                .matchingTags(List.of("product", "marketing", "seo", "sfax"))
                .cvFileId("cv-nour-001")
                .cvFileName("CV_Nour_Ben_Salem.pdf")
                .build());

        CandidateProfile paulProfile = candidateProfileRepository.save(CandidateProfile.builder()
                .userId(paul.getId())
                .firstName("Amine")
                .lastName("Khemir")
                .address("El Ghazala, Ariana")
                .bio("Jeune diplômé motivé cherchant un premier emploi ou contrat SIVP en développement web Frontend React/Tailwind.")
                .competences(List.of("JavaScript", "TypeScript", "React", "Tailwind CSS", "HTML", "CSS", "Git"))
                .parcours(List.of(
                        Experience.builder()
                                .title("Stagiaire Développeur Web")
                                .company("StartApp Ariana")
                                .startDate(LocalDate.now().minusMonths(6))
                                .endDate(LocalDate.now().minusMonths(1))
                                .description("Création d'interfaces utilisateur modernes et intégration responsive.")
                                .build()
                ))
                .formation(List.of(
                        Formation.builder()
                                .diploma("Licence en Sciences de l'Informatique")
                                .school("ESPRIT Tunis")
                                .year(2024)
                                .build()
                ))
                .matchingTags(List.of("junior", "debutant", "react", "tailwind", "ariana", "sivp"))
                .cvFileId("cv-amine-001")
                .cvFileName("CV_Amine_Khemir.pdf")
                .build());

        long candidatesCount = candidateProfileRepository.count();

        // 5. Profils Entreprises (InstaDeep, Vermeg, Telnet Holding, Jumia Tunisie)
        CompanyProfile instadeepProfile = companyProfileRepository.save(CompanyProfile.builder()
                .userId(instadeepUser.getId())
                .companyName("InstaDeep")
                .siret("1234567M")
                .industry("Intelligence Artificielle & Deep Learning")
                .size("50-200")
                .description("Leader de l'IA décisionnelle en Afrique et à l'international, concevant des solutions d'IA avancées pour l'industrie et la recherche.")
                .address("Rue du Lac Malaren, Les Berges du Lac, Tunis")
                .website("https://instadeep.tn")
                .verifiedStatus(VerificationStatus.VALIDE)
                
                .build());

        CompanyProfile vermegProfile = companyProfileRepository.save(CompanyProfile.builder()
                .userId(vermegUser.getId())
                .companyName("Vermeg")
                .siret("2345678B")
                .industry("Logiciels Financiers & Banque")
                .size("500+")
                .description("Éditeur de solutions logicielles spécialisées dans les services financiers, la gestion de titres et les assurances.")
                .address("Parc Technologique El Ghazala, Ariana")
                .website("https://vermeg.tn")
                .verifiedStatus(VerificationStatus.VALIDE)
                
                .build());

        CompanyProfile telnetProfile = companyProfileRepository.save(CompanyProfile.builder()
                .userId(telnetUser.getId())
                .companyName("Telnet Holding")
                .siret("3456789T")
                .industry("Ingénierie & Hautes Technologies")
                .size("200-500")
                .description("Groupe de conseil en technologies et ingénierie produit, spécialisé dans les télécoms, l'aérospatial et l'automobile.")
                .address("Centre Urbain Nord, Tunis")
                .website("https://telnet.tn")
                .verifiedStatus(VerificationStatus.VALIDE)
                
                .build());

        CompanyProfile jumiaProfile = companyProfileRepository.save(CompanyProfile.builder()
                .userId(jumiaUser.getId())
                .companyName("Jumia Tunisie")
                .siret("4567890J")
                .industry("E-commerce & Logistique")
                .size("200-500")
                .description("Plateforme pionnière du commerce électronique en Tunisie, reliant des millions de consommateurs à des milliers de vendeurs.")
                .address("Avenue Habib Bourguiba, Tunis")
                .website("https://jumia.tn")
                .verifiedStatus(VerificationStatus.VALIDE)
                
                .build());

        long companiesCount = companyProfileRepository.count();

        // 6. Offres d'emploi (types tunisiens: CDI, CDD, STAGE, SIVP - salaires en TND / DT)
        Offer offre1 = offerRepository.save(Offer.builder()
                .companyId(instadeepProfile.getId())
                .title("Ingénieur IA & Deep Learning")
                .description("Rejoignez nos équipes de recherche appliquée pour concevoir et déployer des modèles d'apprentissage profond et de reinforcement learning.")
                .competencesRequises(List.of("Python", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning"))
                .niveauExperience(NiveauExperience.MID)
                .typeContrat(TypeContrat.CDI)
                .localisation("Tunis")
                .salaireMin(3500)
                .salaireMax(5500)
                .datePublication(LocalDate.now().minusDays(14))
                .dateExpiration(LocalDate.now().plusDays(30))
                .statut(OfferStatus.ACTIVE)
                .matchingTags(List.of("python", "data", "ia", "deep learning", "tunis"))
                .build());

        Offer offre2 = offerRepository.save(Offer.builder()
                .companyId(vermegProfile.getId())
                .title("Développeur Fullstack Spring Boot & Angular")
                .description("Au sein de l'équipe Core Banking, vous participerez à l'architecture et au développement des modules de gestion transactionnelle.")
                .competencesRequises(List.of("Java", "Spring Boot", "Angular", "TypeScript", "REST", "Docker"))
                .niveauExperience(NiveauExperience.JUNIOR)
                .typeContrat(TypeContrat.CDI)
                .localisation("Ariana")
                .salaireMin(2200)
                .salaireMax(3200)
                .datePublication(LocalDate.now().minusDays(10))
                .dateExpiration(LocalDate.now().plusDays(45))
                .statut(OfferStatus.ACTIVE)
                .matchingTags(List.of("java", "spring", "angular", "fullstack", "ariana"))
                .build());

        Offer offre3 = offerRepository.save(Offer.builder()
                .companyId(telnetProfile.getId())
                .title("Ingénieur Systèmes Embarqués & IoT")
                .description("Développement de firmwares et couches middleware pour systèmes connectés et projets spatiaux & aéronautiques.")
                .competencesRequises(List.of("C", "C++", "Linux Embarqué", "IoT", "Git"))
                .niveauExperience(NiveauExperience.MID)
                .typeContrat(TypeContrat.CDI)
                .localisation("Sfax")
                .salaireMin(2000)
                .salaireMax(3000)
                .datePublication(LocalDate.now().minusDays(8))
                .dateExpiration(LocalDate.now().plusDays(25))
                .statut(OfferStatus.ACTIVE)
                .matchingTags(List.of("embarque", "iot", "c++", "sfax"))
                .build());

        Offer offre4 = offerRepository.save(Offer.builder()
                .companyId(jumiaProfile.getId())
                .title("Chef de Projet E-commerce & Logistique")
                .description("Pilotage des projets d'optimisation de la chaîne logistique, coordination transverse des équipes produit, opérations et marketing.")
                .competencesRequises(List.of("Product Management", "Scrum", "Logistique", "KPI", "Analytics"))
                .niveauExperience(NiveauExperience.MID)
                .typeContrat(TypeContrat.CDD)
                .localisation("Tunis")
                .salaireMin(1800)
                .salaireMax(2600)
                .datePublication(LocalDate.now().minusDays(7))
                .dateExpiration(LocalDate.now().plusDays(35))
                .statut(OfferStatus.ACTIVE)
                .matchingTags(List.of("product", "ecommerce", "logistique", "tunis"))
                .build());

        Offer offre5 = offerRepository.save(Offer.builder()
                .companyId(vermegProfile.getId())
                .title("Stage PFE - Plateforme RH & Microservices")
                .description("Sujet de fin d'études : conception et réalisation d'une suite de microservices RH sécurisés avec intégration continue.")
                .competencesRequises(List.of("Java", "Spring Boot", "Angular", "Docker", "Git"))
                .niveauExperience(NiveauExperience.JUNIOR)
                .typeContrat(TypeContrat.STAGE)
                .localisation("Ariana")
                .salaireMin(800)
                .salaireMax(1200)
                .datePublication(LocalDate.now().minusDays(5))
                .dateExpiration(LocalDate.now().plusDays(60))
                .statut(OfferStatus.ACTIVE)
                .matchingTags(List.of("stage", "pfe", "java", "spring", "ariana"))
                .build());

        Offer offre6 = offerRepository.save(Offer.builder()
                .companyId(instadeepProfile.getId())
                .title("Développeur Frontend React / Tailwind (Contrat SIVP)")
                .description("Opportunité jeune diplômé éligible SIVP pour intégrer l'équipe Design System et dashboards d'expérimentation IA.")
                .competencesRequises(List.of("JavaScript", "TypeScript", "React", "Tailwind CSS", "Git"))
                .niveauExperience(NiveauExperience.JUNIOR)
                .typeContrat(TypeContrat.SIVP)
                .localisation("Tunis")
                .salaireMin(1200)
                .salaireMax(1600)
                .datePublication(LocalDate.now().minusDays(3))
                .dateExpiration(LocalDate.now().plusDays(40))
                .statut(OfferStatus.ACTIVE)
                .matchingTags(List.of("react", "tailwind", "sivp", "junior", "tunis"))
                .build());

        long offersCount = offerRepository.count();

        // 7. Candidatures
        int score1 = matchingService.calculate(marieProfile, offre2);
        Application app1 = applicationRepository.save(Application.builder()
                .candidateId(marieProfile.getId())
                .offerId(offre2.getId())
                .companyId(vermegProfile.getId())
                .statut(ApplicationStatus.ACCEPTE)
                .matchingScore(score1)
                .lettreMotivation("Passionnée par l'écosystème bancaire et forte de mon expérience en Spring Boot et Angular, je souhaite vivement rejoindre Vermeg.")
                .timeline(buildTimeline(
                        recruiter.getId(),
                        ApplicationStatus.POSTULE, ApplicationStatus.RECU, ApplicationStatus.EN_VERIFICATION,
                        ApplicationStatus.VERIFIE, ApplicationStatus.TRANSMIS, ApplicationStatus.ENTRETIEN, ApplicationStatus.ACCEPTE
                ))
                .build());

        int score2 = matchingService.calculate(marieProfile, offre4);
        Application app2 = applicationRepository.save(Application.builder()
                .candidateId(marieProfile.getId())
                .offerId(offre4.getId())
                .companyId(jumiaProfile.getId())
                .statut(ApplicationStatus.REFUSE)
                .matchingScore(score2)
                .lettreMotivation("Je souhaite orienter ma carrière vers la gestion de projet technique e-commerce.")
                .timeline(buildTimeline(
                        recruiter.getId(),
                        ApplicationStatus.POSTULE, ApplicationStatus.RECU, ApplicationStatus.EN_VERIFICATION,
                        ApplicationStatus.VERIFIE, ApplicationStatus.TRANSMIS, ApplicationStatus.REFUSE
                ))
                .build());

        int score3 = matchingService.calculate(lucasProfile, offre1);
        Application app3 = applicationRepository.save(Application.builder()
                .candidateId(lucasProfile.getId())
                .offerId(offre1.getId())
                .companyId(instadeepProfile.getId())
                .statut(ApplicationStatus.ENTRETIEN)
                .matchingScore(score3)
                .lettreMotivation("Fort de 4 ans de recherche et modélisation en IA, intégrer InstaDeep est l'opportunité idéale pour mettre à profit mes compétences.")
                .timeline(buildTimeline(
                        recruiter.getId(),
                        ApplicationStatus.POSTULE, ApplicationStatus.RECU, ApplicationStatus.EN_VERIFICATION,
                        ApplicationStatus.VERIFIE, ApplicationStatus.TRANSMIS, ApplicationStatus.ENTRETIEN
                ))
                .build());

        int scoreLucasDevOps = matchingService.calculate(lucasProfile, offre3);
        Application appLucas2 = applicationRepository.save(Application.builder()
                .candidateId(lucasProfile.getId())
                .offerId(offre3.getId())
                .companyId(telnetProfile.getId())
                .statut(ApplicationStatus.VERIFIE)
                .matchingScore(scoreLucasDevOps)
                .lettreMotivation("Mon expertise en conteneurisation Docker, pipelines MLOps et architecture cloud me permet de m'intégrer rapidement au sein de l'équipe Telnet.")
                .timeline(buildTimeline(
                        recruiter.getId(),
                        ApplicationStatus.POSTULE, ApplicationStatus.RECU, ApplicationStatus.EN_VERIFICATION,
                        ApplicationStatus.VERIFIE
                ))
                .build());

        int scoreLucasJava = matchingService.calculate(lucasProfile, offre2);
        Application appLucas3 = applicationRepository.save(Application.builder()
                .candidateId(lucasProfile.getId())
                .offerId(offre2.getId())
                .companyId(vermegProfile.getId())
                .statut(ApplicationStatus.ACCEPTE)
                .matchingScore(scoreLucasJava)
                .lettreMotivation("Polyvalent et rigoureux, je souhaite apporter mon savoir-faire en conception logicielle et microservices aux solutions bancaires de Vermeg.")
                .timeline(buildTimeline(
                        recruiter.getId(),
                        ApplicationStatus.POSTULE, ApplicationStatus.RECU, ApplicationStatus.EN_VERIFICATION,
                        ApplicationStatus.VERIFIE, ApplicationStatus.TRANSMIS, ApplicationStatus.ENTRETIEN, ApplicationStatus.ACCEPTE
                ))
                .build());

        int scoreLucasJumia = matchingService.calculate(lucasProfile, offre4);
        Application appLucas4 = applicationRepository.save(Application.builder()
                .candidateId(lucasProfile.getId())
                .offerId(offre4.getId())
                .companyId(jumiaProfile.getId())
                .statut(ApplicationStatus.EN_VERIFICATION)
                .matchingScore(scoreLucasJumia)
                .lettreMotivation("Passionné par l'e-commerce et l'analyse de données transactionnelles, je candidate pour participer aux projets data de Jumia.")
                .timeline(buildTimeline(
                        recruiter.getId(),
                        ApplicationStatus.POSTULE, ApplicationStatus.RECU, ApplicationStatus.EN_VERIFICATION
                ))
                .build());

        int score4 = matchingService.calculate(sophieProfile, offre4);
        Application app4 = applicationRepository.save(Application.builder()
                .candidateId(sophieProfile.getId())
                .offerId(offre4.getId())
                .companyId(jumiaProfile.getId())
                .statut(ApplicationStatus.VERIFIE)
                .matchingScore(score4)
                .lettreMotivation("Mon expérience en management de produit et optimisation de tunnels d'acquisition correspond aux défis de Jumia.")
                .timeline(buildTimeline(
                        recruiter.getId(),
                        ApplicationStatus.POSTULE, ApplicationStatus.RECU, ApplicationStatus.EN_VERIFICATION,
                        ApplicationStatus.VERIFIE
                ))
                .build());

        int score5 = matchingService.calculate(paulProfile, offre6);
        Application app5 = applicationRepository.save(Application.builder()
                .candidateId(paulProfile.getId())
                .offerId(offre6.getId())
                .companyId(instadeepProfile.getId())
                .statut(ApplicationStatus.EN_VERIFICATION)
                .matchingScore(score5)
                .lettreMotivation("Diplômé d'ESPRIT et éligible au contrat SIVP, je souhaite vivement contribuer au frontend des outils d'IA chez InstaDeep.")
                .timeline(buildTimeline(
                        recruiter.getId(),
                        ApplicationStatus.POSTULE, ApplicationStatus.RECU, ApplicationStatus.EN_VERIFICATION
                ))
                .build());

        int score6 = matchingService.calculate(paulProfile, offre5);
        Application app6 = applicationRepository.save(Application.builder()
                .candidateId(paulProfile.getId())
                .offerId(offre5.getId())
                .companyId(vermegProfile.getId())
                .statut(ApplicationStatus.POSTULE)
                .matchingScore(score6)
                .lettreMotivation("À la recherche de mon stage PFE, je serais honoré de contribuer au développement de vos microservices.")
                .timeline(buildTimeline(
                        recruiter.getId(),
                        ApplicationStatus.POSTULE
                ))
                .build());

        long applicationsCount = applicationRepository.count();

        // 8. Vérifications administratives
        verificationRepository.save(Verification.builder()
                .candidateId(marieProfile.getId())
                .pieces(List.of(
                        VerificationDoc.builder()
                                .id("piece1")
                                .nomFichier("CIN_Marie_Dupont.pdf")
                                .type("IDENTITE")
                                .taille(524288L)
                                .fileId("id-marie-001")
                                .uploadedAt(LocalDateTime.now().minusDays(5))
                                .build(),
                        VerificationDoc.builder()
                                .id("piece2")
                                .nomFichier("Diplome_Ingenieur_INSAT.pdf")
                                .type("DIPLOME")
                                .taille(786432L)
                                .fileId("diploma-marie-001")
                                .uploadedAt(LocalDateTime.now().minusDays(5))
                                .build()
                ))
                .statut(VerificationStatus.VALIDE)
                .validatorId(recruiter.getId())
                .validatedAt(LocalDateTime.now().minusDays(2))
                .commentaire("Pièces tunisiennes conformes (CIN + Diplôme INSAT)")
                .build());

        verificationRepository.save(Verification.builder()
                .candidateId(lucasProfile.getId())
                .pieces(List.of(
                        VerificationDoc.builder()
                                .id("piece-lucas-1")
                                .nomFichier("CIN_Lucas_Martin.pdf")
                                .type("IDENTITE")
                                .taille(425000L)
                                .fileId("id-lucas-001")
                                .uploadedAt(LocalDateTime.now().minusDays(10))
                                .build(),
                        VerificationDoc.builder()
                                .id("piece-lucas-2")
                                .nomFichier("Diplome_Ingenieur_ENISO.pdf")
                                .type("DIPLOME")
                                .taille(850000L)
                                .fileId("diploma-lucas-001")
                                .uploadedAt(LocalDateTime.now().minusDays(10))
                                .build(),
                        VerificationDoc.builder()
                                .id("piece-lucas-3")
                                .nomFichier("Attestation_Certification_DeepLearning_AI.pdf")
                                .type("ATTESTATION")
                                .taille(312000L)
                                .fileId("cert-lucas-001")
                                .uploadedAt(LocalDateTime.now().minusDays(6))
                                .build()
                ))
                .statut(VerificationStatus.VALIDE)
                .validatorId(recruiter.getId())
                .validatedAt(LocalDateTime.now().minusDays(1))
                .commentaire("Dossier certifié et validé (CIN tunisienne + Diplôme ENISO conformes)")
                .build());

        verificationRepository.save(Verification.builder()
                .candidateId(paulProfile.getId())
                .pieces(List.of(
                        VerificationDoc.builder()
                                .id("piece3")
                                .nomFichier("Attestation_Inscription_ESPRIT.pdf")
                                .type("DIPLOME")
                                .taille(262144L)
                                .fileId("esprit-paul-001")
                                .uploadedAt(LocalDateTime.now().minusDays(2))
                                .build()
                ))
                .statut(VerificationStatus.EN_ATTENTE)
                .build());

        long verificationsCount = verificationRepository.count();

        log.info("=== RHCONNECT SEED TERMINÉ AVEC SUCCÈS ===");
        log.info("{} Users, {} Candidates, {} Companies, {} Offers, {} Applications, {} Verifications créés.",
                usersCount, candidatesCount, companiesCount, offersCount, applicationsCount, verificationsCount);
    }

    private void ensureDocumentedAdminAccount() {
        String rawPassword = "RhConnect2026!";
        List<String> adminEmails = List.of("admin@rhconnect.tn", "recruteur@rhconnect.tn");

        for (String email : adminEmails) {
            Role targetRole = email.startsWith("recruteur") ? Role.RECRUITER : Role.ADMIN;
            userRepository.findByEmail(email).ifPresentOrElse(user -> {
                user.setPassword(passwordEncoder.encode(rawPassword));
                user.setRoles(List.of(targetRole));
                user.setEnabled(true);
                userRepository.save(user);
            }, () -> userRepository.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .roles(List.of(targetRole))
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build()));
        }

        // Assurer l'existence du profil candidat Yassine Trabelsi
        userRepository.findByEmail("yassine.trabelsi@rhconnect.tn").ifPresentOrElse(u -> {}, () -> {
            User yassine = userRepository.save(User.builder()
                .email("yassine.trabelsi@rhconnect.tn")
                .password(passwordEncoder.encode(rawPassword))
                .roles(List.of(Role.CANDIDATE))
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build());

            if (candidateProfileRepository.findByUserId(yassine.getId()) == null) {
                candidateProfileRepository.save(CandidateProfile.builder()
                    .userId(yassine.getId())
                    .firstName("Yassine")
                    .lastName("Trabelsi")
                    .address("Kantaoui, Sousse")
                    .bio("Data Scientist & Ingénieur IA avec 4 ans d'expérience en Machine Learning.")
                    .competences(List.of("Python", "TensorFlow", "FastAPI", "SQL", "Docker"))
                    .matchingTags(List.of("python", "data", "ia", "sousse"))
                    .cvFileName("CV_Yassine_Trabelsi.pdf")
                    .build());
            }
        });

        // Assurer l'existence du profil candidat Mariem Gharbi
        userRepository.findByEmail("mariem.gharbi@rhconnect.tn").ifPresentOrElse(u -> {}, () -> {
            User mariem = userRepository.save(User.builder()
                .email("mariem.gharbi@rhconnect.tn")
                .password(passwordEncoder.encode(rawPassword))
                .roles(List.of(Role.CANDIDATE))
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build());

            if (candidateProfileRepository.findByUserId(mariem.getId()) == null) {
                candidateProfileRepository.save(CandidateProfile.builder()
                    .userId(mariem.getId())
                    .firstName("Mariem")
                    .lastName("Gharbi")
                    .address("Centre Urbain Nord, Tunis")
                    .bio("Développeuse Fullstack passionnée par Java Spring Boot et Angular/React.")
                    .competences(List.of("Java", "Spring Boot", "Angular", "React", "TypeScript", "REST"))
                    .matchingTags(List.of("java", "spring", "fullstack", "tunis"))
                    .cvFileName("CV_Mariem_Gharbi.pdf")
                    .build());
            }
        });
    }

    private void ensureMarieNotification() {
        User targetUser = userRepository.findByEmail("mariem.gharbi@rhconnect.tn")
            .orElse(null);
        if (targetUser == null) {
            return;
        }

        boolean alreadyExists = userNotificationRepository.findByUserIdOrderByCreatedAtDesc(targetUser.getId())
            .stream()
            .anyMatch(notification -> "PROFILE_INCOMPLETE".equals(notification.getType())
                && "Profil incomplet".equals(notification.getTitle()));

        if (alreadyExists) {
            return;
        }

        userNotificationRepository.save(UserNotification.builder()
            .id(UUID.randomUUID().toString())
            .userId(targetUser.getId())
            .type("PROFILE_INCOMPLETE")
            .title("Profil incomplet")
            .message("Complétez votre profil pour augmenter votre visibilité auprès des recruteurs.")
            .link("/candidate/profile")
            .read(false)
            .createdAt(LocalDateTime.now())
            .build());

        log.info("Notification de test ajoutée pour {}", targetUser.getEmail());
    }

    private List<ApplicationTimelineEntry> buildTimeline(String recruiterId, ApplicationStatus... statuses) {
        List<ApplicationTimelineEntry> timeline = new ArrayList<>();
        LocalDateTime baseDate = LocalDateTime.now().minusDays(30);
        for (int i = 0; i < statuses.length; i++) {
            ApplicationStatus s = statuses[i];
            String commentaire = switch (s) {
                case POSTULE -> "Candidature soumise par le candidat";
                case RECU -> "Candidature reçue par le système";
                case EN_VERIFICATION -> "Candidature en cours de vérification administrative";
                case VERIFIE -> "Candidature vérifiée et conforme";
                case TRANSMIS -> "Candidature transmise au recruteur/entreprise";
                case ENTRETIEN -> "Entretien programmé et réalisé";
                case ACCEPTE -> "Candidature acceptée - Proposition faite et acceptée";
                case REFUSE -> "Candidature refusée après examen du dossier";
            };
            timeline.add(ApplicationTimelineEntry.builder()
                    .statut(s)
                    .date(baseDate.plusDays(i * 2 + 1))
                    .acteurId(recruiterId)
                    .commentaire(commentaire)
                    .build());
        }
        return timeline;
    }

    private void ensureCandidateProfilesAndVerifications() {
        try {
            List<User> candidates = userRepository.findAll().stream()
                    .filter(u -> u.getRoles() != null && u.getRoles().contains(Role.CANDIDATE))
                    .toList();

            for (User u : candidates) {
                CandidateProfile cp = candidateProfileRepository.findByUserId(u.getId()).orElse(null);
                if (cp == null) {
                    String[] names = deriveNamesFromEmail(u.getEmail());
                    candidateProfileRepository.save(CandidateProfile.builder()
                            .userId(u.getId())
                            .firstName(names[0])
                            .lastName(names[1])
                            .phone("+216 20 123 456")
                            .address("Tunis, Tunisie")
                            .build());
                    log.info("Profil candidat généré pour {}: {} {}", u.getEmail(), names[0], names[1]);
                } else if (cp.getFirstName() == null || cp.getFirstName().isBlank() || cp.getLastName() == null || cp.getLastName().isBlank()) {
                    String[] names = deriveNamesFromEmail(u.getEmail());
                    if (cp.getFirstName() == null || cp.getFirstName().isBlank()) cp.setFirstName(names[0]);
                    if (cp.getLastName() == null || cp.getLastName().isBlank()) cp.setLastName(names[1]);
                    candidateProfileRepository.save(cp);
                    log.info("Nom candidat complété pour {}: {} {}", u.getEmail(), cp.getFirstName(), cp.getLastName());
                }
            }

            for (CandidateProfile cp : candidateProfileRepository.findAll()) {
                if (cp.getFirstName() == null || cp.getFirstName().isBlank() || cp.getLastName() == null || cp.getLastName().isBlank()) {
                    String email = cp.getUserId() != null ? userRepository.findById(cp.getUserId()).map(User::getEmail).orElse(null) : null;
                    String[] names = deriveNamesFromEmail(email != null ? email : "yassine.trabelsi@rhconnect.tn");
                    cp.setFirstName(names[0]);
                    cp.setLastName(names[1]);
                    candidateProfileRepository.save(cp);
                }
            }

            List<Verification> verifs = verificationRepository.findAll();
            Set<String> usedCandidateIds = new HashSet<>();
            for (Verification v : verifs) {
                CandidateProfile cp = candidateProfileRepository.findById(v.getCandidateId())
                        .or(() -> candidateProfileRepository.findByUserId(v.getCandidateId()))
                        .orElse(null);

                if (cp == null) {
                    CandidateProfile available = candidateProfileRepository.findAll().stream()
                            .filter(p -> !usedCandidateIds.contains(p.getId()) && !usedCandidateIds.contains(p.getUserId()))
                            .findFirst()
                            .orElse(null);
                    if (available != null) {
                        v.setCandidateId(available.getId());
                        cp = available;
                        usedCandidateIds.add(available.getId());
                    } else {
                        verificationRepository.delete(v);
                        log.info("Dossier orphelin supprimé: {}", v.getId());
                        continue;
                    }
                } else {
                    usedCandidateIds.add(v.getCandidateId());
                }

                String nameSlug = cp.getLastName() != null ? cp.getLastName().toLowerCase().replace(" ", "_") : "dossier";
                v.setPieces(new ArrayList<>(List.of(
                        VerificationDoc.builder()
                                .id(UUID.randomUUID().toString())
                                .nomFichier("CIN_" + nameSlug + ".pdf")
                                .type("IDENTITE")
                                .taille(425000L)
                                .fileId("cin-" + v.getId())
                                .uploadedAt(v.getCreatedAt() != null ? v.getCreatedAt() : LocalDateTime.now().minusDays(1))
                                .build(),
                        VerificationDoc.builder()
                                .id(UUID.randomUUID().toString())
                                .nomFichier("Diplome_Universitaire_" + nameSlug + ".pdf")
                                .type("DIPLOME")
                                .taille(850000L)
                                .fileId("diploma-" + v.getId())
                                .uploadedAt(v.getCreatedAt() != null ? v.getCreatedAt() : LocalDateTime.now().minusDays(1))
                                .build()
                )));
                verificationRepository.save(v);
                log.info("Vérification mise à jour pour candidat: {} {}", cp.getFirstName(), cp.getLastName());
            }
        } catch (Exception ex) {
            log.warn("Notice: ensureCandidateProfilesAndVerifications: {}", ex.getMessage());
        }
    }

    private String[] deriveNamesFromEmail(String email) {
        if (email == null || email.isBlank()) {
            return new String[]{"Candidat", "Inconnu"};
        }
        String prefix = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
        String[] parts = prefix.split("[._-]");
        if (parts.length >= 2) {
            return new String[]{
                    capitalize(parts[0]),
                    capitalize(parts[1])
            };
        } else if (parts.length == 1 && !parts[0].isBlank()) {
            return new String[]{capitalize(parts[0]), "Candidat"};
        }
        return new String[]{"Candidat", "Inconnu"};
    }

    private String capitalize(String str) {
        if (str == null || str.isBlank()) return str;
        return Character.toUpperCase(str.charAt(0)) + (str.length() > 1 ? str.substring(1).toLowerCase() : "");
    }
}
