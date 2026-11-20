package com.rhconnect.repository;

import com.rhconnect.model.CompanyProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyProfileRepository extends MongoRepository<CompanyProfile, String> {
    Optional<CompanyProfile> findByUserId(String userId);
    List<CompanyProfile> findByUserIdIn(Collection<String> userIds);
}

