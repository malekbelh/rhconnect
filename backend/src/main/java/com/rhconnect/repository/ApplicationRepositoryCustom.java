package com.rhconnect.repository;

import com.rhconnect.dto.response.ApplicationResponse;
import java.util.List;

/**
 * Interface personnalisée pour ApplicationRepository.
 * Permet de définir des requêtes complexes avec aggregation MongoDB.
 */
public interface ApplicationRepositoryCustom {

    /**
     * Récupère toutes les applications avec les titres des offres en 1 query (aggregation)
     * @return Liste des applications avec détails enrichis
     */
    List<ApplicationResponse> findAllWithDetails();

    /**
     * Récupère les applications d'une compagnie avec les titres des offres
     * @param companyId ID de la compagnie
     * @return Liste des applications filtrées
     */
    List<ApplicationResponse> findByCompanyIdWithDetails(String companyId);
}
