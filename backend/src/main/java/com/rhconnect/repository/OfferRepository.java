package com.rhconnect.repository;

import com.rhconnect.model.Offer;
import com.rhconnect.model.enums.OfferStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfferRepository extends MongoRepository<Offer, String>, PagingAndSortingRepository<Offer, String> {
    List<Offer> findByCompanyId(String companyId);
    List<Offer> findByStatut(OfferStatus statut);
    Page<Offer> findByStatut(OfferStatus statut, Pageable pageable);
    long countByStatut(OfferStatus statut);
}
