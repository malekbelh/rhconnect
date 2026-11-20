package com.rhconnect.audit;

import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface AuditLogRepository extends MongoRepository<AuditLog, String> {

    @Query("{ 'actorId' : ?0 , 'action' : ?1 , 'entityType' : ?2 , 'timestamp' : { $gte : ?3 , $lte : ?4 } }")
    Page<AuditLog> findByFilters(String actorId, String action, String entityType,
                                 Instant dateFrom, Instant dateTo, Pageable pageable);

    Page<AuditLog> findByActorIdAndActionAndEntityTypeAndTimestampBetween(
            String actorId, String action, String entityType, Instant dateFrom, Instant dateTo, Pageable pageable);

    Page<AuditLog> findByActorIdAndActionAndTimestampBetween(
            String actorId, String action, Instant dateFrom, Instant dateTo, Pageable pageable);

    Page<AuditLog> findByActorIdAndEntityTypeAndTimestampBetween(
            String actorId, String entityType, Instant dateFrom, Instant dateTo, Pageable pageable);

    Page<AuditLog> findByActionAndEntityTypeAndTimestampBetween(
            String action, String entityType, Instant dateFrom, Instant dateTo, Pageable pageable);

    Page<AuditLog> findByActorIdAndTimestampBetween(
            String actorId, Instant dateFrom, Instant dateTo, Pageable pageable);

    Page<AuditLog> findByActionAndTimestampBetween(
            String action, Instant dateFrom, Instant dateTo, Pageable pageable);

    Page<AuditLog> findByEntityTypeAndTimestampBetween(
            String entityType, Instant dateFrom, Instant dateTo, Pageable pageable);

    Page<AuditLog> findByTimestampBetween(Instant dateFrom, Instant dateTo, Pageable pageable);
}
