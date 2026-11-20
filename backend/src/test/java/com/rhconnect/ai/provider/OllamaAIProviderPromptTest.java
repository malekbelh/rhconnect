package com.rhconnect.ai.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rhconnect.model.CandidateProfile;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertTrue;

class OllamaAIProviderPromptTest {

    @Test
    void buildConseilProfilPrompt_mentions_photo_when_available() throws Exception {
        OllamaAIProvider provider = new OllamaAIProvider(
                WebClient.builder(),
                new ObjectMapper(),
                "http://localhost:11434",
                "llama3",
                30
        );

        CandidateProfile candidat = CandidateProfile.builder()
                .firstName("Amel")
                .lastName("Ben Ali")
                .phone("+21622334455")
                .address("Tunis")
                .bio("Développeuse backend expérimentée")
                .photoFileId("64dfe123456789abcdef0123")
                .build();

        Method method = OllamaAIProvider.class.getDeclaredMethod("buildConseilProfilPrompt", CandidateProfile.class);
        method.setAccessible(true);

        String prompt = (String) method.invoke(provider, candidat);

        assertTrue(prompt.contains("Photo de profil: OUI"), "Le prompt IA doit inclure l'état de la photo de profil.");
        assertTrue(prompt.contains("Ne recommandez pas d'ajouter une photo si elle est déjà présente"),
                "Le prompt IA doit empêcher la recommandation inutile de photo lorsqu'elle existe déjà.");
    }
}
