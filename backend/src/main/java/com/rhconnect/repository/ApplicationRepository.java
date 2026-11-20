package com.rhconnect.repository;

import com.rhconnect.model.Application;
import com.rhconnect.model.enums.ApplicationStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends MongoRepository<Application, String>, ApplicationRepositoryCustom {
    List<Application> findByCandidateId(String candidateId);
    List<Application> findByOfferId(String offerId);
    List<Application> findByCompanyId(String companyId);
    long countByStatut(ApplicationStatus statut);
}
