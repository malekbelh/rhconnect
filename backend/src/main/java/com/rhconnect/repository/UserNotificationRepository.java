package com.rhconnect.repository;

import com.rhconnect.model.UserNotification;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface UserNotificationRepository extends MongoRepository<UserNotification, String> {
    List<UserNotification> findByUserIdOrderByCreatedAtDesc(String userId);
    void deleteByUserId(String userId);
}
