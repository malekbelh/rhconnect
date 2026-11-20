package com.rhconnect.service;

import com.rhconnect.model.UserSettings;
import com.rhconnect.repository.UserSettingsRepository;
import com.rhconnect.service.util.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserSettingsService {

    private final UserSettingsRepository userSettingsRepository;

    public UserSettings getMySettings() {
        String userId = CurrentUserService.getCurrentUserId();
        return userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> createDefaults(userId));
    }

    public UserSettings updateMySettings(Map<String, Object> patch) {
        String userId = CurrentUserService.getCurrentUserId();
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> createDefaults(userId));

        patch.forEach((key, value) -> {
            switch (key) {
                case "emailCandidatures" -> settings.setEmailCandidatures(toBool(value));
                case "emailOffres" -> settings.setEmailOffres(toBool(value));
                case "emailMessages" -> settings.setEmailMessages(toBool(value));
                case "notifPush" -> settings.setNotifPush(toBool(value));
                case "langue" -> settings.setLangue(String.valueOf(value));
                case "profilPublic" -> settings.setProfilPublic(toBool(value));
                case "cvPublic" -> settings.setCvPublic(toBool(value));
                case "notifNouvellesCandidatures" -> settings.setNotifNouvellesCandidatures(toBool(value));
                case "notifChangementStatut" -> settings.setNotifChangementStatut(toBool(value));
                case "emailRapportHebdo" -> settings.setEmailRapportHebdo(toBool(value));
            }
        });

        return userSettingsRepository.save(settings);
    }

    private UserSettings createDefaults(String userId) {
        UserSettings s = UserSettings.builder().userId(userId).build();
        return userSettingsRepository.save(s);
    }

    private Boolean toBool(Object v) {
        if (v instanceof Boolean b) return b;
        return Boolean.parseBoolean(String.valueOf(v));
    }
}
