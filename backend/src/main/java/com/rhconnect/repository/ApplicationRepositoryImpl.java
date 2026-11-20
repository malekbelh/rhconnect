package com.rhconnect.repository;

import com.rhconnect.dto.response.ApplicationResponse;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

/**
 * Implémentation personnalisée pour ApplicationRepository.
 * Utilise MongoDB aggregation pour optimiser les requêtes avec jointures.
 */
@RequiredArgsConstructor
@Service
public class ApplicationRepositoryImpl implements ApplicationRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    @Override
    public List<ApplicationResponse> findAllWithDetails() {
        List<Document> pipeline = Arrays.asList(
            // Stage 1: Jointure avec candidate_profiles
            new Document("$lookup", new Document()
                .append("from", "candidate_profiles")
                .append("localField", "candidateId")
                .append("foreignField", "userId")
                .append("as", "candidateData")),
            
            // Stage 2: Jointure avec offers
            new Document("$lookup", new Document()
                .append("from", "offers")
                .append("localField", "offerId")
                .append("foreignField", "_id")
                .append("as", "offerData")),
            
            // Stage 3: Jointure avec company_profiles
            new Document("$lookup", new Document()
                .append("from", "company_profiles")
                .append("localField", "companyId")
                .append("foreignField", "_id")
                .append("as", "companyData")),
            
            // Stage 4: Jointure avec users
            new Document("$lookup", new Document()
                .append("from", "users")
                .append("localField", "candidateId")
                .append("foreignField", "_id")
                .append("as", "candidateUserData")),
            
            // Stage 5: Projection avec tous les champs
            new Document("$project", new Document()
                .append("id", "$_id")
                .append("_id", 0)
                .append("candidateId", 1)
                .append("offerId", 1)
                .append("companyId", 1)
                .append("statut", 1)
                .append("timeline", 1)
                .append("matchingScore", 1)
                .append("lettreMotivation", 1)
                .append("createdAt", 1)
                .append("adminNotes", 1)
                .append("disputeOpen", 1)
                .append("disputeMotif", 1)
                .append("disputeOpenedAt", 1)
                .append("disputeResolvedAt", 1)
                .append("dossierIncomplet", 1)
                .append("dossierIncompletMotif", 1)
                .append("candidatName", new Document("$concat", Arrays.asList(
                    new Document("$arrayElemAt", Arrays.asList("$candidateData.firstName", 0)),
                    " ",
                    new Document("$arrayElemAt", Arrays.asList("$candidateData.lastName", 0)))))
                .append("candidateEmail", new Document("$arrayElemAt", Arrays.asList("$candidateUserData.email", 0)))
                .append("offerTitle", new Document("$arrayElemAt", Arrays.asList("$offerData.title", 0)))
                .append("companyName", new Document("$arrayElemAt", Arrays.asList("$companyData.companyName", 0))))
        );

        AggregationResults<ApplicationResponse> results = mongoTemplate.aggregate(
            Aggregation.newAggregation(
                pipeline.stream().map(doc -> new org.springframework.data.mongodb.core.aggregation.AggregationOperation() {
                    @Override
                    public Document toDocument(org.springframework.data.mongodb.core.aggregation.AggregationOperationContext context) {
                        return doc;
                    }
                }).toArray(org.springframework.data.mongodb.core.aggregation.AggregationOperation[]::new)
            ),
            "applications",
            ApplicationResponse.class
        );

        return results.getMappedResults();
    }

    @Override
    public List<ApplicationResponse> findByCompanyIdWithDetails(String companyId) {
        List<Document> pipeline = Arrays.asList(
            // Stage 1: Filtrer par companyId
            new Document("$match", new Document("companyId", companyId)),
            
            // Stage 2: Jointure avec candidate_profiles
            new Document("$lookup", new Document()
                .append("from", "candidate_profiles")
                .append("localField", "candidateId")
                .append("foreignField", "userId")
                .append("as", "candidateData")),
            
            // Stage 3: Jointure avec offers
            new Document("$lookup", new Document()
                .append("from", "offers")
                .append("localField", "offerId")
                .append("foreignField", "_id")
                .append("as", "offerData")),
            
            // Stage 4: Jointure avec company_profiles
            new Document("$lookup", new Document()
                .append("from", "company_profiles")
                .append("localField", "companyId")
                .append("foreignField", "_id")
                .append("as", "companyData")),
            
            // Stage 5: Jointure avec users
            new Document("$lookup", new Document()
                .append("from", "users")
                .append("localField", "candidateId")
                .append("foreignField", "_id")
                .append("as", "candidateUserData")),
            
            // Stage 6: Projection avec tous les champs
            new Document("$project", new Document()
                .append("id", "$_id")
                .append("_id", 0)
                .append("candidateId", 1)
                .append("offerId", 1)
                .append("companyId", 1)
                .append("statut", 1)
                .append("timeline", 1)
                .append("matchingScore", 1)
                .append("lettreMotivation", 1)
                .append("createdAt", 1)
                .append("adminNotes", 1)
                .append("disputeOpen", 1)
                .append("disputeMotif", 1)
                .append("disputeOpenedAt", 1)
                .append("disputeResolvedAt", 1)
                .append("dossierIncomplet", 1)
                .append("dossierIncompletMotif", 1)
                .append("candidatName", new Document("$concat", Arrays.asList(
                    new Document("$arrayElemAt", Arrays.asList("$candidateData.firstName", 0)),
                    " ",
                    new Document("$arrayElemAt", Arrays.asList("$candidateData.lastName", 0)))))
                .append("candidateEmail", new Document("$arrayElemAt", Arrays.asList("$candidateUserData.email", 0)))
                .append("offerTitle", new Document("$arrayElemAt", Arrays.asList("$offerData.title", 0)))
                .append("companyName", new Document("$arrayElemAt", Arrays.asList("$companyData.companyName", 0))))
        );

        AggregationResults<ApplicationResponse> results = mongoTemplate.aggregate(
            Aggregation.newAggregation(
                pipeline.stream().map(doc -> new org.springframework.data.mongodb.core.aggregation.AggregationOperation() {
                    @Override
                    public Document toDocument(org.springframework.data.mongodb.core.aggregation.AggregationOperationContext context) {
                        return doc;
                    }
                }).toArray(org.springframework.data.mongodb.core.aggregation.AggregationOperation[]::new)
            ),
            "applications",
            ApplicationResponse.class
        );

        return results.getMappedResults();
    }
}
