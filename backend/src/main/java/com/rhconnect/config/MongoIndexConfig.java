package com.rhconnect.config;

import com.rhconnect.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexDefinition;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.stereotype.Component;

/**
 * Configuration des indexes MongoDB pour optimiser les performances.
 * Les indexes sont créés automatiquement au démarrage de l'application.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MongoIndexConfig {

    private final MongoTemplate mongoTemplate;

    /**
     * Crée les indexes lors du démarrage de l'application
     */
    @EventListener(ApplicationReadyEvent.class)
    public void initIndexes() {
        log.info("Initialisation des indexes MongoDB...");

        // Users collection
        createUserIndexes();

        // Candidates collection
        createCandidateIndexes();

        // Companies collection
        createCompanyIndexes();

        // Applications collection
        createApplicationIndexes();

        // Offers collection
        createOfferIndexes();

        // Verifications collection
        createVerificationIndexes();

        // Refresh Tokens collection
        createRefreshTokenIndexes();

        // Notifications collection
        createNotificationIndexes();

        log.info("Indexes MongoDB créés avec succès");
    }

    /**
     * Indexes pour la collection Users
     */
    private void createUserIndexes() {
        // Index sur email (recherche rapide, unique)
        mongoTemplate.indexOps(User.class)
                .ensureIndex(new Index().on("email", org.springframework.data.domain.Sort.Direction.ASC).unique());

        // Index sur createdAt (trier par date création)
        mongoTemplate.indexOps(User.class)
                .ensureIndex(new Index().on("createdAt", org.springframework.data.domain.Sort.Direction.DESC));

        // Index sur lastLogin (identifier utilisateurs inactifs)
        mongoTemplate.indexOps(User.class)
                .ensureIndex(new Index().on("lastLogin", org.springframework.data.domain.Sort.Direction.DESC));

        // Index composé: roles + enabled (filtrer par rôle et statut)
        mongoTemplate.indexOps(User.class)
                .ensureIndex(new Index()
                        .on("roles", org.springframework.data.domain.Sort.Direction.ASC)
                        .on("enabled", org.springframework.data.domain.Sort.Direction.ASC));

        log.debug("Indexes créés pour User collection");
    }

    /**
     * Indexes pour la collection CandidateProfile
     */
    private void createCandidateIndexes() {
        // Index sur userId (lookup rapide du profil candidat)
        mongoTemplate.indexOps(CandidateProfile.class)
                .ensureIndex(new Index().on("userId", org.springframework.data.domain.Sort.Direction.ASC).unique());

        // Index composé: matchingTags + firstName (recherche par tags et nom)
        mongoTemplate.indexOps(CandidateProfile.class)
                .ensureIndex(new Index()
                        .on("matchingTags", org.springframework.data.domain.Sort.Direction.ASC)
                        .on("firstName", org.springframework.data.domain.Sort.Direction.ASC));

        log.debug("Indexes créés pour CandidateProfile collection");
    }

    /**
     * Indexes pour la collection CompanyProfile
     */
    private void createCompanyIndexes() {
        // Index sur userId (lookup rapide)
        mongoTemplate.indexOps(CompanyProfile.class)
                .ensureIndex(new Index().on("userId", org.springframework.data.domain.Sort.Direction.ASC).unique());

        // Index sur SIRET (validation, recherche)
        mongoTemplate.indexOps(CompanyProfile.class)
                .ensureIndex(new Index().on("siret", org.springframework.data.domain.Sort.Direction.ASC));

        // Index sur verifiedStatus (filtrer entreprises vérifiées)
        mongoTemplate.indexOps(CompanyProfile.class)
                .ensureIndex(new Index().on("verifiedStatus", org.springframework.data.domain.Sort.Direction.ASC));

        log.debug("Indexes créés pour CompanyProfile collection");
    }

    /**
     * Indexes pour la collection Application
     */
    private void createApplicationIndexes() {
        // Index composé: candidateId + offerId (check duplicate applications)
        mongoTemplate.indexOps(Application.class)
                .ensureIndex(new Index()
                        .on("candidateId", org.springframework.data.domain.Sort.Direction.ASC)
                        .on("offerId", org.springframework.data.domain.Sort.Direction.ASC));

        // Index sur candidateId (récupérer applications du candidat)
        mongoTemplate.indexOps(Application.class)
                .ensureIndex(new Index().on("candidateId", org.springframework.data.domain.Sort.Direction.ASC));

        // Index sur offerId (applications pour une offre)
        mongoTemplate.indexOps(Application.class)
                .ensureIndex(new Index().on("offerId", org.springframework.data.domain.Sort.Direction.ASC));

        // Index sur companyId (applications pour une entreprise)
        mongoTemplate.indexOps(Application.class)
                .ensureIndex(new Index().on("companyId", org.springframework.data.domain.Sort.Direction.ASC));

        // Index sur statut (filtrer par état)
        mongoTemplate.indexOps(Application.class)
                .ensureIndex(new Index().on("statut", org.springframework.data.domain.Sort.Direction.ASC));

        // Index composé: companyId + statut (applications d'une entreprise par état)
        mongoTemplate.indexOps(Application.class)
                .ensureIndex(new Index()
                        .on("companyId", org.springframework.data.domain.Sort.Direction.ASC)
                        .on("statut", org.springframework.data.domain.Sort.Direction.ASC));

        log.debug("Indexes créés pour Application collection");
    }

    /**
     * Indexes pour la collection Offer
     */
    private void createOfferIndexes() {
        // Index sur companyId (offres d'une entreprise)
        mongoTemplate.indexOps(Offer.class)
                .ensureIndex(new Index().on("companyId", org.springframework.data.domain.Sort.Direction.ASC));

        // Index sur statut (offres publiées, brouillons, etc.)
        mongoTemplate.indexOps(Offer.class)
                .ensureIndex(new Index().on("statut", org.springframework.data.domain.Sort.Direction.ASC));

        // Index sur datePublication (trier les offres récentes)
        mongoTemplate.indexOps(Offer.class)
                .ensureIndex(new Index().on("datePublication", org.springframework.data.domain.Sort.Direction.DESC));

        // Index composé: statut + datePublication (offres actives récentes)
        mongoTemplate.indexOps(Offer.class)
                .ensureIndex(new Index()
                        .on("statut", org.springframework.data.domain.Sort.Direction.ASC)
                        .on("datePublication", org.springframework.data.domain.Sort.Direction.DESC));

        // Index sur matchingTags (recherche par tags)
        mongoTemplate.indexOps(Offer.class)
                .ensureIndex(new Index().on("matchingTags", org.springframework.data.domain.Sort.Direction.ASC));

        log.debug("Indexes créés pour Offer collection");
    }

    /**
     * Indexes pour la collection Verification
     */
    private void createVerificationIndexes() {
        // Index sur candidateId (lookup rapide)
        mongoTemplate.indexOps(Verification.class)
                .ensureIndex(new Index().on("candidateId", org.springframework.data.domain.Sort.Direction.ASC).unique());

        // Index sur statut (vérifications en attente, validées, rejetées)
        mongoTemplate.indexOps(Verification.class)
                .ensureIndex(new Index().on("statut", org.springframework.data.domain.Sort.Direction.ASC));

        // Index sur validatorId (vérifications traitées par un modérateur)
        mongoTemplate.indexOps(Verification.class)
                .ensureIndex(new Index().on("validatorId", org.springframework.data.domain.Sort.Direction.ASC));

        // Index sur createdAt (trier par date)
        mongoTemplate.indexOps(Verification.class)
                .ensureIndex(new Index().on("createdAt", org.springframework.data.domain.Sort.Direction.DESC));

        log.debug("Indexes créés pour Verification collection");
    }

    /**
     * Indexes pour la collection AuditLog
     */
    /*
    private void createAuditLogIndexes() {
        // Index sur actorId (actions d'un utilisateur)
        // mongoTemplate.indexOps(AuditLog.class)
        //         .ensureIndex(new Index().on("actorId", org.springframework.data.domain.Sort.Direction.ASC));

        // Index sur action (logs d'une action spécifique)
        // mongoTemplate.indexOps(AuditLog.class)
        //         .ensureIndex(new Index().on("action", org.springframework.data.domain.Sort.Direction.ASC));

        // Index sur entityType (logs pour un type d'entité)
        // mongoTemplate.indexOps(AuditLog.class)
        //         .ensureIndex(new Index().on("entityType", org.springframework.data.domain.Sort.Direction.ASC));

        // Index sur entityId (historique d'une entité)
        // mongoTemplate.indexOps(AuditLog.class)
        //         .ensureIndex(new Index().on("entityId", org.springframework.data.domain.Sort.Direction.ASC));

        // Index sur timestamp (trier par date, TTL index pour archivage automatique)
        // mongoTemplate.indexOps(AuditLog.class)
        //         .ensureIndex(new Index().on("timestamp", org.springframework.data.domain.Sort.Direction.DESC)
        //                 .expire(365 * 24 * 60 * 60)); // 1 an TTL

        // Index composé: actorId + action + timestamp (requêtes audit complexes)
        // mongoTemplate.indexOps(AuditLog.class)
        //         .ensureIndex(new Index()
        //                 .on("actorId", org.springframework.data.domain.Sort.Direction.ASC)
        //                 .on("action", org.springframework.data.domain.Sort.Direction.ASC)
        //                 .on("timestamp", org.springframework.data.domain.Sort.Direction.DESC));
    }
    // Commented out - AuditLog class doesn't exist
    // private void createAuditLogIndexes() { ... }

    // Audit log indexes removed - class not found

    /**
     * Indexes pour la collection RefreshToken
     */
    private void createRefreshTokenIndexes() {
        // Index sur token (lookup rapide)
        mongoTemplate.indexOps(RefreshToken.class)
                .ensureIndex(new Index().on("token", org.springframework.data.domain.Sort.Direction.ASC).unique());

        // Index sur userId (tous les tokens d'un utilisateur)
        mongoTemplate.indexOps(RefreshToken.class)
                .ensureIndex(new Index().on("userId", org.springframework.data.domain.Sort.Direction.ASC));

        // Index sur expiresAt avec TTL (suppression automatique des tokens expirés)
        mongoTemplate.indexOps(RefreshToken.class)
                .ensureIndex(new Index().on("expiresAt", org.springframework.data.domain.Sort.Direction.ASC)
                        .expire(0)); // TTL automatique

        log.debug("Indexes créés pour RefreshToken collection");
    }

    /**
     * Indexes pour la collection UserNotification
     */
    private void createNotificationIndexes() {
        // Index sur userId (notifications d'un utilisateur)
        mongoTemplate.indexOps(UserNotification.class)
                .ensureIndex(new Index().on("userId", org.springframework.data.domain.Sort.Direction.ASC));

        // Index sur read (filtrer lues/non-lues)
        mongoTemplate.indexOps(UserNotification.class)
                .ensureIndex(new Index().on("read", org.springframework.data.domain.Sort.Direction.ASC));

        // Index composé: userId + read (notifications non-lues d'un utilisateur)
        mongoTemplate.indexOps(UserNotification.class)
                .ensureIndex(new Index()
                        .on("userId", org.springframework.data.domain.Sort.Direction.ASC)
                        .on("read", org.springframework.data.domain.Sort.Direction.ASC));

        // Index sur createdAt (trier par date)
        mongoTemplate.indexOps(UserNotification.class)
                .ensureIndex(new Index().on("createdAt", org.springframework.data.domain.Sort.Direction.DESC));

        log.debug("Indexes créés pour UserNotification collection");
    }
}
