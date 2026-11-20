package com.rhconnect.service;

import com.rhconnect.dto.response.NotificationResponse;
import com.rhconnect.model.CandidateProfile;
import com.rhconnect.model.User;
import com.rhconnect.model.UserNotification;
import com.rhconnect.model.enums.Role;
import com.rhconnect.repository.CandidateProfileRepository;
import com.rhconnect.repository.UserNotificationRepository;
import com.rhconnect.repository.UserRepository;
import com.rhconnect.service.util.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserNotificationService {

    private final UserNotificationRepository userNotificationRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final UserRepository userRepository;

    public List<NotificationResponse> getMyNotifications() {
        String userId = CurrentUserService.getCurrentUserId();
        if (userId == null || userId.isBlank()) {
            return List.of();
        }

        return userNotificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public void markAllAsRead() {
        String userId = CurrentUserService.getCurrentUserId();
        if (userId == null || userId.isBlank()) {
            return;
        }

        List<UserNotification> notifications = userNotificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        notifications.forEach(n -> n.setRead(true));
        userNotificationRepository.saveAll(notifications);
    }

    public void deleteNotification(String notificationId) {
        String userId = CurrentUserService.getCurrentUserId();
        if (userId == null || userId.isBlank()) {
            return;
        }

        userNotificationRepository.findById(notificationId)
                .ifPresent(notification -> {
                    if (notification.getUserId().equals(userId)) {
                        userNotificationRepository.delete(notification);
                    }
                });
    }

    public void deleteAllNotifications() {
        String userId = CurrentUserService.getCurrentUserId();
        if (userId == null || userId.isBlank()) {
            return;
        }

        userNotificationRepository.deleteByUserId(userId);
    }

    public void createCandidateNotification(String userId, String type, String title, String message, String link) {
        if (userId == null || userId.isBlank()) {
            return;
        }

        UserNotification notification = UserNotification.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        userNotificationRepository.save(notification);
    }

    public void createCandidateNotificationsForProfile(String userId) {
        CandidateProfile profile = candidateProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            return;
        }

        boolean incomplete = profile.getBio() == null || profile.getBio().isBlank()
                || profile.getPhone() == null || profile.getPhone().isBlank()
                || profile.getCompetences() == null || profile.getCompetences().size() < 3
                || profile.getCvFileName() == null || profile.getCvFileName().isBlank();

        if (incomplete) {
            createCandidateNotification(
                    userId,
                    "PROFILE_INCOMPLETE",
                    "Profil incomplet",
                    "Complétez votre profil pour augmenter votre visibilité auprès des recruteurs.",
                    "/candidate/profile"
            );
        }
    }

    /**
     * Crée une notification pour une entreprise (recruiter/company)
     */
    public void createCompanyNotification(String userId, String type, String title, String message, String link) {
        if (userId == null || userId.isBlank()) {
            return;
        }

        UserNotification notification = UserNotification.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        userNotificationRepository.save(notification);
    }

    /**
     * Crée une notification pour TOUS les administrateurs
     */
    public void createAdminNotification(String type, String title, String message, String link) {
        List<User> admins = userRepository.findByRolesContaining(Role.ADMIN);
        
        for (User admin : admins) {
            UserNotification notification = UserNotification.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(admin.getId())
                    .type(type)
                    .title(title)
                    .message(message)
                    .link(link)
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            
            userNotificationRepository.save(notification);
        }
    }

    /**
     * Récupère les notifications non lues pour l'admin courant
     */
    public List<NotificationResponse> getAdminNotifications() {
        String userId = CurrentUserService.getCurrentUserId();
        if (userId == null || userId.isBlank()) {
            return List.of();
        }

        return userNotificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(n -> !n.isRead())
                .map(this::toResponse)
                .toList();
    }

    /**
     * Compte les notifications non lues pour l'admin courant
     */
    public long getUnreadNotificationCount() {
        String userId = CurrentUserService.getCurrentUserId();
        if (userId == null || userId.isBlank()) {
            return 0;
        }

        return userNotificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(n -> !n.isRead())
                .count();
    }

    /**
     * Marque une notification comme lue
     */
    public void markNotificationAsRead(String notificationId) {
        userNotificationRepository.findById(notificationId)
                .ifPresent(notification -> {
                    notification.setRead(true);
                    userNotificationRepository.save(notification);
                });
    }

    /**
     * Supprime une notification admin
     */
    public void deleteAdminNotification(String notificationId) {
        String userId = CurrentUserService.getCurrentUserId();
        if (userId == null || userId.isBlank()) {
            return;
        }

        userNotificationRepository.findById(notificationId)
                .ifPresent(notification -> {
                    if (notification.getUserId().equals(userId)) {
                        userNotificationRepository.delete(notification);
                    }
                });
    }

    private NotificationResponse toResponse(UserNotification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .link(n.getLink())
                .createdAt(n.getCreatedAt())
                .read(n.isRead())
                .build();
    }
}
