package com.rhconnect.repository;

import com.rhconnect.model.Verification;
import com.rhconnect.model.enums.VerificationStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VerificationRepository extends MongoRepository<Verification, String> {
    Optional<Verification> findByCandidateId(String candidateId);
    List<Verification> findByStatut(VerificationStatus statut);
}
