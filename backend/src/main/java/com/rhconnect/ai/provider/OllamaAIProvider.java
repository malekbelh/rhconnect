package com.rhconnect.ai.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rhconnect.ai.AIProvider;
import com.rhconnect.model.CandidateProfile;
import com.rhconnect.model.Offer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Primary
@ConditionalOnProperty(name = "rhconnect.ai.provider", havingValue = "ollama")
public class OllamaAIProvider implements AIProvider {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final String baseUrl;
    private final String model;
    private final int timeout;

    public OllamaAIProvider(
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper,
            @Value("${rhconnect.ai.ollama.base-url}") String baseUrl,
            @Value("${rhconnect.ai.ollama.model}") String model,
            @Value("${rhconnect.ai.ollama.timeout-seconds:120}") int timeout) {
        this.webClientBuilder = webClientBuilder;
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl;
        this.model = model;
        this.timeout = timeout;
    }

    @Override
    public AIRecord analyzeCv(byte[] cvBytes, String fileName) throws Exception {
        String base64Cv = cvBytes != null ? Base64.getEncoder().encodeToString(cvBytes) : "";
        String prompt = buildAnalyzeCvPrompt(fileName, cvBytes != null && cvBytes.length > 0);

        String response = callOllama(prompt);
        Map<String, Object> data = parseAnalyzeCvResponse(response, fileName);

        return new AIRecord("available", "Analyse CV effectuée avec succès", data);
    }

    @Override
    public AIRecord generateMotivationLetter(AiContext ctx) throws Exception {
        String prompt = buildMotivationLetterPrompt(ctx.candidat(), ctx.offre());
        String response = callOllama(prompt);

        Map<String, Object> data = new HashMap<>();
        data.put("lettre", response);
        data.put("offreId", ctx.offre() != null ? ctx.offre().getId() : null);
        data.put("offreTitre", ctx.offre() != null ? ctx.offre().getTitle() : null);

        return new AIRecord("available", "Lettre de motivation générée", data);
    }

    @Override
    public AIRecord conseilProfil(CandidateProfile candidat) throws Exception {
        String prompt = buildConseilProfilPrompt(candidat);
        String response = callOllama(prompt);

        Map<String, Object> data = new HashMap<>();
        data.put("conseils", List.of(response.split("\\n- |\\n\\d+\\. ")));
        data.put("scoreProfil", calculateProfileScore(candidat));

        return new AIRecord("available", "Conseils profil générés", data);
    }

    private String callOllama(String prompt) {
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("prompt", prompt);
        body.put("stream", false);

        Map<String, Object> options = new HashMap<>();
        options.put("num_predict", 350);
        options.put("temperature", 0.7);
        body.put("options", options);

        WebClient client = webClientBuilder.baseUrl(baseUrl).build();

        String jsonResponse = client.post()
                .uri("/api/generate")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(timeout))
                .block();

        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode responseNode = root.path("response");
            return responseNode.asText("");
        } catch (Exception e) {
            throw new RuntimeException("Erreur parsing réponse Ollama: " + e.getMessage(), e);
        }
    }

    private String buildAnalyzeCvPrompt(String fileName, boolean hasCv) {
        StringBuilder sb = new StringBuilder();
        sb.append("Tu es un expert RH chargé d'analyser un CV.\n\n");
        if (hasCv) {
            sb.append("Nom du fichier CV: ").append(fileName).append("\n");
            sb.append("Taille du CV (octets): ").append("présent").append("\n\n");
        } else {
            sb.append("AUCUN CV fourni.\n\n");
        }
        sb.append("Réponds UNIQUEMENT en JSON valide avec la structure suivante (sans commentaire, sans markdown):\n");
        sb.append("{\n");
        sb.append("  \"competences\": [\"compétence1\", \"compétence2\"],\n");
        sb.append("  \"experiences\": [\"poste X chez Y (2020-2022)\"],\n");
        sb.append("  \"formations\": [\"Diplôme X, Établissement Y\"],\n");
        sb.append("  \"langues\": [\"Français\", \"Anglais\"],\n");
        sb.append("  \"resume\": \"Résumé professionnel en 2-3 phrases\",\n");
        sb.append("  \"niveauExperienceEstime\": \"DEBUTANT | JUNIOR | INTERMEDIAIRE | SENIOR\",\n");
        sb.append("  \"pointsForts\": [\"point1\", \"point2\"],\n");
        sb.append("  \"pointsAmeliorer\": [\"point1\", \"point2\"]\n");
        sb.append("}\n");
        return sb.toString();
    }

    private Map<String, Object> parseAnalyzeCvResponse(String response, String fileName) {
        Map<String, Object> data = new HashMap<>();
        data.put("fileName", fileName);

        try {
            String jsonStr = extractJson(response);
            JsonNode root = objectMapper.readTree(jsonStr);

            data.put("competences", objectMapper.convertValue(
                    root.path("competences"), objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)));
            data.put("experiences", objectMapper.convertValue(
                    root.path("experiences"), objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)));
            data.put("formations", objectMapper.convertValue(
                    root.path("formations"), objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)));
            data.put("langues", objectMapper.convertValue(
                    root.path("langues"), objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)));
            data.put("resume", root.path("resume").asText(""));
            data.put("niveauExperienceEstime", root.path("niveauExperienceEstime").asText("NON_DEFINI"));
            data.put("pointsForts", objectMapper.convertValue(
                    root.path("pointsForts"), objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)));
            data.put("pointsAmeliorer", objectMapper.convertValue(
                    root.path("pointsAmeliorer"), objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)));
        } catch (Exception e) {
            data.put("competences", List.of());
            data.put("experiences", List.of());
            data.put("formations", List.of());
            data.put("langues", List.of());
            data.put("resume", "Impossible d'extraire les informations structurées. Réponse brute: " + truncate(response, 500));
            data.put("niveauExperienceEstime", "NON_DEFINI");
            data.put("pointsForts", List.of());
            data.put("pointsAmeliorer", List.of("Erreur parsing IA"));
        }
        return data;
    }

    private String buildMotivationLetterPrompt(CandidateProfile candidat, Offer offre) {
        StringBuilder sb = new StringBuilder();
        sb.append("Tu es un coach carrière expert RH. Rédige une lettre de motivation professionnelle et personnalisée en français.\n\n");

        if (candidat != null) {
            sb.append("=== PROFIL CANDIDAT ===\n");
            sb.append("Nom: ").append(candidat.getFirstName() != null ? candidat.getFirstName() : "").append(" ");
            sb.append(candidat.getLastName() != null ? candidat.getLastName() : "").append("\n");
            if (candidat.getBio() != null) sb.append("Bio: ").append(candidat.getBio()).append("\n");
            if (candidat.getCompetences() != null && !candidat.getCompetences().isEmpty())
                sb.append("Compétences: ").append(String.join(", ", candidat.getCompetences())).append("\n");
            if (candidat.getParcours() != null) {
                sb.append("Expériences: ").append(candidat.getParcours().size()).append(" postes\n");
            }
            if (candidat.getFormation() != null) {
                sb.append("Formations: ").append(candidat.getFormation().size()).append(" diplômes\n");
            }
            sb.append("\n");
        }

        if (offre != null) {
            sb.append("=== OFFRE D'EMPLOI ===\n");
            sb.append("Titre: ").append(offre.getTitle()).append("\n");
            if (offre.getDescription() != null) sb.append("Description: ").append(offre.getDescription()).append("\n");
            if (offre.getCompetencesRequises() != null && !offre.getCompetencesRequises().isEmpty())
                sb.append("Compétences requises: ").append(String.join(", ", offre.getCompetencesRequises())).append("\n");
            if (offre.getLocalisation() != null) sb.append("Localisation: ").append(offre.getLocalisation()).append("\n");
            if (offre.getTypeContrat() != null) sb.append("Type contrat: ").append(offre.getTypeContrat()).append("\n");
            sb.append("\n");
        }

        sb.append("Rédige la lettre de motivation (3-4 paragraphes, ton professionnel, met en valeur les points forts du candidat et l'adéquation avec l'offre). Commencer par l'objet.");
        return sb.toString();
    }

    private String buildConseilProfilPrompt(CandidateProfile candidat) {
        StringBuilder sb = new StringBuilder();
        sb.append("Tu es un expert RH coach carrière. Donne 5 conseils CONcrets et PERSONNALISÉS pour améliorer le profil candidat suivant sur une plateforme RH.\n\n");
        sb.append("=== PROFIL ===\n");
        if (candidat != null) {
            boolean hasPhoto = candidat.getPhotoFileId() != null && !candidat.getPhotoFileId().isEmpty();
            sb.append("Prénom: ").append(candidat.getFirstName() != null ? candidat.getFirstName() : "(non renseigné)").append("\n");
            sb.append("Nom: ").append(candidat.getLastName() != null ? candidat.getLastName() : "(non renseigné)").append("\n");
            sb.append("Téléphone: ").append(candidat.getPhone() != null ? candidat.getPhone() : "(non renseigné)").append("\n");
            sb.append("Adresse: ").append(candidat.getAddress() != null ? candidat.getAddress() : "(non renseigné)").append("\n");
            sb.append("Bio: ").append(candidat.getBio() != null ? candidat.getBio() : "(non renseignée)").append("\n");
            sb.append("Compétences: ").append(candidat.getCompetences() != null && !candidat.getCompetences().isEmpty()
                    ? String.join(", ", candidat.getCompetences()) : "(aucune)").append("\n");
            sb.append("Nombre d'expériences: ").append(candidat.getParcours() != null ? candidat.getParcours().size() : 0).append("\n");
            sb.append("Nombre de formations: ").append(candidat.getFormation() != null ? candidat.getFormation().size() : 0).append("\n");
            sb.append("CV téléchargé: ").append(candidat.getCvFileId() != null ? "OUI" : "NON").append("\n");
            sb.append("Photo de profil: ").append(hasPhoto ? "OUI (présente - NE PAS en parler)" : "NON (manquante)").append("\n");
            sb.append("\n=== RÈGLES OBLIGATOIRES ===\n");
            if (hasPhoto) {
                sb.append("⚠️ TRÈS IMPORTANT: Le candidat a déjà une photo de profil. NE JAMAIS recommander d'ajouter une photo, de changer de photo, ou de parler de photo de profil. Ignorez complètement ce sujet.\n");
            } else {
                sb.append("- Le candidat n'a pas de photo: recommander une photo professionnelle est autorisé et encouragé.\n");
            }
            sb.append("- Ne recommandez jamais un élément qui est déjà présent dans le profil.\n");
            sb.append("- Concentrez-vous uniquement sur les champs qui manquent ou qui sont incomplets.\n");
            sb.append("- N'inventez aucune information absente du profil fourni.\n");
        }
        sb.append("\nRéponds sous forme d'une liste numérotée de 5 conseils, chacun sur une nouvelle ligne, sans introduction, sans conclusion, sans autre texte.");
        return sb.toString();
    }

    private String extractJson(String text) {
        int firstBrace = text.indexOf('{');
        int lastBrace = text.lastIndexOf('}');
        if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
            return text.substring(firstBrace, lastBrace + 1);
        }
        return text;
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }

    private int calculateProfileScore(CandidateProfile candidat) {
        if (candidat == null) return 0;
        int score = 0;
        if (candidat.getFirstName() != null && !candidat.getFirstName().isEmpty()) score += 10;
        if (candidat.getLastName() != null && !candidat.getLastName().isEmpty()) score += 10;
        if (candidat.getPhone() != null && !candidat.getPhone().isEmpty()) score += 10;
        if (candidat.getBio() != null && candidat.getBio().length() > 50) score += 15;
        if (candidat.getCompetences() != null && candidat.getCompetences().size() >= 3) score += 20;
        if (candidat.getParcours() != null && !candidat.getParcours().isEmpty()) score += 20;
        if (candidat.getFormation() != null && !candidat.getFormation().isEmpty()) score += 10;
        if (candidat.getCvFileId() != null) score += 5;
        if (candidat.getPhotoFileId() != null && !candidat.getPhotoFileId().isEmpty()) score += 10;
        return Math.min(score, 100);
    }
}
