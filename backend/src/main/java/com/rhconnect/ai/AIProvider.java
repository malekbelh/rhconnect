package com.rhconnect.ai;

import com.rhconnect.model.CandidateProfile;
import com.rhconnect.model.Offer;

import java.util.Map;

public interface AIProvider {

    AIRecord analyzeCv(byte[] cvBytes, String fileName) throws Exception;

    AIRecord generateMotivationLetter(AiContext ctx) throws Exception;

    AIRecord conseilProfil(CandidateProfile candidat) throws Exception;

    record AIRecord(String status, String message, Map<String, Object> data) {
        public AIRecord {
            if (status == null) status = "available";
        }
    }

    record AiContext(CandidateProfile candidat, Offer offre) {}
}
