package com.rhconnect.service;

import com.rhconnect.model.SystemSettings;
import com.rhconnect.repository.SystemSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SystemSettingsService {

    private final SystemSettingsRepository systemSettingsRepository;

    private static final String SINGLETON_ID = "global";

    /**
     * Retourne les settings globaux (crée un doc par défaut s'il n'existe pas).
     */
    public SystemSettings getSettings() {
        return systemSettingsRepository.findById(SINGLETON_ID)
                .orElseGet(() -> {
                    SystemSettings defaults = SystemSettings.builder()
                            .id(SINGLETON_ID)
                            .maintenanceMode(false)
                            .maxFileSizeMb(10L)
                            .allowedExtensions(new ArrayList<>(List.of("pdf", "docx", "jpg", "jpeg", "png")))
                            .notifyOnNewUser(true)
                            .notifyOnNewApplication(false)
                            .notifyOnDisputeOpened(true)
                            .notifyOnVerificationRequest(true)
                            .jobCategories(new ArrayList<>(List.of(
                                    "Informatique", "Finance", "Marketing", "RH", "Vente",
                                    "Logistique", "Santé", "Éducation", "BTP", "Autre"
                            )))
                            .skillsReferential(new ArrayList<>(List.of(
                                    "Java", "Python", "JavaScript", "Angular", "React",
                                    "Spring Boot", "MongoDB", "SQL", "Docker", "Kubernetes",
                                    "Gestion de projet", "Communication", "Leadership"
                            )))
                            .customContractTypes(new ArrayList<>())
                            .build();
                    return systemSettingsRepository.save(defaults);
                });
    }

    /**
     * Met à jour partiellement les settings via un Map de champs.
     */
    public SystemSettings patchSettings(Map<String, Object> patches, String updatedBy) {
        SystemSettings settings = getSettings();

        patches.forEach((key, value) -> {
            switch (key) {
                case "maintenanceMode" -> settings.setMaintenanceMode((Boolean) value);
                case "maintenanceMessage" -> settings.setMaintenanceMessage((String) value);
                case "maxFileSizeMb" -> settings.setMaxFileSizeMb(((Number) value).longValue());
                case "allowedExtensions" -> settings.setAllowedExtensions(castToStringList(value));
                case "notifyOnNewUser" -> settings.setNotifyOnNewUser((Boolean) value);
                case "notifyOnNewApplication" -> settings.setNotifyOnNewApplication((Boolean) value);
                case "notifyOnDisputeOpened" -> settings.setNotifyOnDisputeOpened((Boolean) value);
                case "notifyOnVerificationRequest" -> settings.setNotifyOnVerificationRequest((Boolean) value);
                case "adminNotificationEmail" -> settings.setAdminNotificationEmail((String) value);
                case "jobCategories" -> settings.setJobCategories(castToStringList(value));
                case "skillsReferential" -> settings.setSkillsReferential(castToStringList(value));
                case "customContractTypes" -> settings.setCustomContractTypes(castToStringList(value));
            }
        });

        settings.setUpdatedAt(LocalDateTime.now());
        settings.setUpdatedBy(updatedBy);
        return systemSettingsRepository.save(settings);
    }

    /** Ajoute une valeur à un référentiel (jobCategories, skillsReferential, etc.) */
    public SystemSettings addToReferential(String referential, String value) {
        SystemSettings settings = getSettings();
        List<String> list = getReferentialList(settings, referential);
        if (!list.contains(value)) {
            list.add(value);
        }
        return systemSettingsRepository.save(settings);
    }

    /** Supprime une valeur d'un référentiel */
    public SystemSettings removeFromReferential(String referential, String value) {
        SystemSettings settings = getSettings();
        List<String> list = getReferentialList(settings, referential);
        list.remove(value);
        return systemSettingsRepository.save(settings);
    }

    private List<String> getReferentialList(SystemSettings settings, String referential) {
        return switch (referential) {
            case "jobCategories" -> settings.getJobCategories();
            case "skillsReferential" -> settings.getSkillsReferential();
            case "customContractTypes" -> settings.getCustomContractTypes();
            case "allowedExtensions" -> settings.getAllowedExtensions();
            default -> throw new IllegalArgumentException("Référentiel inconnu: " + referential);
        };
    }

    @SuppressWarnings("unchecked")
    private List<String> castToStringList(Object value) {
        return (List<String>) value;
    }
}
