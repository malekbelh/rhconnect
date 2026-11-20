import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, SlidersHorizontal, X, Briefcase } from 'lucide-react';
import { getOffers } from '../../api/candidate.api';
import OfferCard from '../../components/offer/OfferCard';
import OfferFilters from '../../components/offer/OfferFilters';
import type { Offer, OfferFiltersParams } from '../../types';

const PAGE_SIZE = 10;

const OffersPage: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filters, setFilters] = useState<OfferFiltersParams>({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadOffers = useCallback(async (currentFilters: OfferFiltersParams, currentPage: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOffers({
        ...currentFilters,
        page: currentPage,
        limit: PAGE_SIZE,
      });
      const items: Offer[] = response.data || [];
      const totalItems = response.total || items.length;
      const pages = response.totalPages || Math.ceil(totalItems / PAGE_SIZE) || 1;
      setOffers(items);
      setTotal(totalItems);
      setTotalPages(pages);
    } catch {
      setError('Impossible de charger les offres pour le moment.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOffers(filters, page);
  }, [filters, page, loadOffers]);

  const handleFiltersChange = (newFilters: OfferFiltersParams) => {
    setFilters(newFilters);
    setPage(0);
  };

  const activeFilterCount =
    (filters.keyword ? 1 : 0) +
    (filters.localisation ? 1 : 0) +
    (filters.niveauExperience ? 1 : 0) +
    ((filters.typeContrat?.length ?? 0) > 0 ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto py-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#172A3A]">
            Offres d'emploi en Tunisie
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {total > 0
              ? `${total} opportunité${total > 1 ? 's' : ''} active${total > 1 ? 's' : ''} ordonnée${total > 1 ? 's' : ''} selon votre affinité de profil.`
              : 'Trouvez l’offre qui correspond exactement à vos compétences et ambitions.'}
          </p>
        </div>

        {/* Mobile Filter toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 border border-[#E2E8F0] rounded-2xl bg-white hover:bg-neutral-50 transition-colors text-xs font-bold text-[#172A3A] lg:hidden shadow-xs"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 bg-[#0F766E] text-white rounded-full text-[10px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm font-medium shadow-xs">
          <X className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside
          className={`lg:w-80 shrink-0 ${showFilters ? 'block' : 'hidden'} lg:block`}
        >
          <div className="sticky top-24">
            <OfferFilters filters={filters} onChange={handleFiltersChange} />
          </div>
        </aside>

        {/* Offers Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
              <p className="text-xs text-[#64748B]">Recherche des meilleures offres...</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-[#E2E8F0] rounded-3xl p-12 text-center">
              <Briefcase className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
              <h3 className="font-bold text-[#172A3A] text-base">Aucune offre trouvée</h3>
              <p className="text-xs text-[#64748B] mt-1 mb-4">
                Essayez d'élargir vos critères de filtres ou de recherche.
              </p>
              <button
                onClick={() => handleFiltersChange({})}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] bg-[#E6F7F5] px-4 py-2 rounded-xl hover:bg-[#CCF0EB] transition-colors"
              >
                Réinitialiser tous les filtres
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {offers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <p className="text-xs text-[#64748B] font-medium">
                    Page <span className="font-bold text-[#172A3A]">{page + 1}</span> sur <span className="font-bold text-[#172A3A]">{totalPages}</span> ({total} offres)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-3.5 py-1.5 rounded-xl border border-[#CBD5E1] bg-white text-xs font-bold text-[#172A3A] hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Précédent
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${pageNum === page
                                ? 'bg-[#0F766E] text-white shadow-xs'
                                : 'border border-[#CBD5E1] bg-white text-[#64748B] hover:bg-neutral-50'
                              }`}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-3.5 py-1.5 rounded-xl border border-[#CBD5E1] bg-white text-xs font-bold text-[#172A3A] hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OffersPage;
