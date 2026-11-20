package com.rhconnect.service;

import com.rhconnect.model.CandidateProfile;
import com.rhconnect.model.Offer;
import com.rhconnect.model.enums.NiveauExperience;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MatchingService {

    public int calculate(CandidateProfile c, Offer o) {
        int total = 0;

        total += calculCompetences(c.getCompetences(), o.getCompetencesRequises());
        total += calculNiveauExperience(c, o);
        total += calculLocalisation(c, o);
        total += calculMatchingTags(c.getMatchingTags(), o.getMatchingTags());

        return Math.min(100, Math.max(0, total));
    }

    public boolean isDossierComplet(CandidateProfile c) {
        return c.getFirstName() != null && !c.getFirstName().isBlank()
                && c.getLastName() != null && !c.getLastName().isBlank()
                && c.getPhone() != null && !c.getPhone().isBlank()
                && c.getCompetences() != null && !c.getCompetences().isEmpty();
        // Note: CV is now optional - removed cvFileId check to allow applications without uploaded CV
    }

    private int calculCompetences(List<String> compCand, List<String> compOffre) {
        if (compCand == null) compCand = new ArrayList<>();
        if (compOffre == null) compOffre = new ArrayList<>();
        if (compOffre.isEmpty()) return 0;

        int matches = 0;
        for (String req : compOffre) {
            for (String cand : compCand) {
                if (cand.equalsIgnoreCase(req)) {
                    matches++;
                    break;
                }
            }
        }
        int max = Math.max(compCand.size(), compOffre.size());
        if (max == 0) return 0;
        return (int) Math.round(((double) matches / max) * 40);
    }

    private int calculNiveauExperience(CandidateProfile c, Offer o) {
        NiveauExperience niveauOffre = o.getNiveauExperience();
        if (niveauOffre == null) return 0;

        int niveauCandIndex = estimerNiveauCandidat(c);
        int niveauOffreIndex = niveauOffre.ordinal();

        int diff = Math.abs(niveauCandIndex - niveauOffreIndex);
        if (diff == 0) return 30;
        if (diff == 1) return 15;
        return 0;
    }

    private int estimerNiveauCandidat(CandidateProfile c) {
        if (c.getParcours() == null || c.getParcours().isEmpty()) return 0;
        long moisTotal = 0;
        java.time.LocalDate aujourdhui = java.time.LocalDate.now();
        for (var exp : c.getParcours()) {
            java.time.LocalDate debut = exp.getStartDate();
            java.time.LocalDate fin = exp.getEndDate() != null ? exp.getEndDate() : aujourdhui;
            if (debut != null) {
                moisTotal += java.time.temporal.ChronoUnit.MONTHS.between(debut, fin);
            }
        }
        double anneesTotal = moisTotal / 12.0;
        if (anneesTotal < 1) return 0; // DEBUTANT
        if (anneesTotal < 2) return 1; // JUNIOR
        if (anneesTotal < 3) return 2; // MID
        if (anneesTotal < 5) return 3; // INTERMEDIAIRE
        if (anneesTotal < 10) return 4; // SENIOR
        return 5; // EXPERT
    }

    private int calculLocalisation(CandidateProfile c, Offer o) {
        String locCand = c.getAddress();
        String locOffre = o.getLocalisation();
        if (locCand == null || locOffre == null) return 0;
        return locCand.equalsIgnoreCase(locOffre) ? 10 : 0;
    }

    private int calculMatchingTags(List<String> tagsCand, List<String> tagsOffre) {
        if (tagsCand == null) tagsCand = new ArrayList<>();
        if (tagsOffre == null) tagsOffre = new ArrayList<>();
        if (tagsOffre.isEmpty()) return 20;

        int matches = 0;
        for (String tOffre : tagsOffre) {
            for (String tCand : tagsCand) {
                if (tCand.equalsIgnoreCase(tOffre)) {
                    matches++;
                    break;
                }
            }
        }
        return (int) Math.round(((double) matches / tagsOffre.size()) * 20);
    }
}
