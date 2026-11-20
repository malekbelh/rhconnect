package com.rhconnect.repository;

import com.rhconnect.model.AiUsageLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AiUsageLogRepository extends MongoRepository<AiUsageLog, String> {
    List<AiUsageLog> findByUserId(String userId);
    List<AiUsageLog> findByFeature(String feature);
    List<AiUsageLog> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
    List<AiUsageLog> findBySuccessFalse();
    long countByFeature(String feature);
    long countBySuccess(Boolean success);
}
