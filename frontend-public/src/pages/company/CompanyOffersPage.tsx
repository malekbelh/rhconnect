import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2,
  SlidersHorizontal,
  Briefcase,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { getMyOffers, deleteOffer, getProfile } from '../../api/company.api';
import OfferCard from '../../components/offer/OfferCard';
import OfferFilters from '../../components/offer/OfferFilters';
import Alert from '../../components/alert/Alert';
import ConfirmDialog from '../../components/dialog/ConfirmDialog';
import type { Offer, OfferFiltersParams } from '../../types';
import { Lock, ArrowRight } from 'lucide-react';

const CompanyOffersPage: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [filters, setFilters] = useState<OfferFiltersParams>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [items, profileData] = await Promise.all([
        getMyOffers().catch(() => []),
        getProfile().catch(() => null),
      ]);
      setOffers(items || []);
      setProfile(profileData);
    } catch (err) {
      setError('Impossible de charger vos offres pour le moment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleFiltersChange = (newFilters: OfferFiltersParams) => {
    setFilters(newFilters);
  };

  // Apply filters to offers
  const getFilteredOffers = () => {
    return offers.filter((offer) => {
      // Filter by keyword (title, description, company)
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        const matchesKeyword =
          offer.title?.toLowerCase().includes(keyword) ||
          offer.description?.toLowerCase().includes(keyword) ||
          offer.companyName?.toLowerCase().includes(keyword) ||
          offer.competencesRequises?.some((c) => c.toLowerCase().includes(keyword));
        if (!matchesKeyword) return false;
      }

      // Filter by location
      if (filters.localisation) {
        const location = filters.localisation.toLowerCase();
        if (!offer.localisation?.toLowerCase().includes(location)) return false;
      }

      // Filter by contract type
      if (filters.typeContrat && filters.typeContrat.length > 0) {
        if (!filters.typeContrat.includes(offer.typeContrat)) return false;
      }

      // Filter by experience level
      if (filters.niveauExperience) {
        if (offer.niveauExperience !== filters.niveauExperience) return false;
      }

      return true;
    });
  };

  const handleDelete = async (id: string) => {
    setOfferToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!offerToDelete) return;
    try {
      await deleteOffer(offerToDelete);
      setOffers(offers.filter((o) => o.id !== offerToDelete));
      setSuccess('Offre supprimée avec succès.');
      setTimeout(() => setSuccess(null), 4000);
      setDeleteDialogOpen(false);
      setOfferToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression.');
      setDeleteDialogOpen(false);
      setOfferToDelete(null);
    }
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
            Mes offres d'emploi
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {offers.length > 0
              ? `${offers.length} offre${offers.length > 1 ? 's' : ''} publiée${offers.length > 1 ? 's' : ''}.`
              : 'Créez votre première offre pour commencer à recevoir des candidatures.'}
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

        {profile && !profile.verified ? (
          <Link
            to="/company/profile?tab=verification"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-sm transition-all shadow-xs"
          >
            <Lock className="w-4 h-4" />
            Vérification requise
          </Link>
        ) : (
          <Link
            to="/company/offers/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-2xl font-bold text-sm transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Nouvelle offre
          </Link>
        )}
      </div>

      {profile && !profile.verified && (
        <div className="p-4 sm:p-5 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Publication verrouillée — Vérification d'entreprise en cours
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Vous pourrez publier vos offres dès que l'administrateur aura validé vos documents d'entreprise (RNE).
              </p>
            </div>
          </div>
          <Link
            to="/company/profile?tab=verification"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all whitespace-nowrap self-end sm:self-center"
          >
            Vérifier mon entreprise <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {error && (
        <Alert 
          type="error" 
          title="Erreur" 
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {success && (
        <Alert 
          type="success" 
          message={success}
          onClose={() => setSuccess(null)}
          compact={true}
        />
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

        {/* Offers Grid + Management */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
              <p className="text-xs text-[#64748B]">Chargement de vos offres...</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-[#E2E8F0] rounded-3xl p-12 text-center">
              <Briefcase className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
              <h3 className="font-bold text-[#172A3A] text-base">Aucune offre trouvée</h3>
              <p className="text-xs text-[#64748B] mt-1 mb-4">
                Essayez d'élargir vos critères de filtres ou de recherche.
              </p>
              <Link
                to="/company/offers/new"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] bg-[#E6F7F5] px-4 py-2 rounded-xl hover:bg-[#CCF0EB] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Créer une offre
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {getFilteredOffers().map((offer) => (
                  <div key={offer.id} className="relative group">
                    <OfferCard offer={offer} linkTo="company" />
                    {/* Management actions overlay */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        to={`/company/offers/${offer.id}/edit`}
                        className="p-1.5 bg-white rounded-lg border border-[#E2E8F0] text-[#64748B] hover:text-[#0F766E] hover:border-[#0F766E] transition-colors shadow-xs"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(offer.id)}
                        className="p-1.5 bg-white rounded-lg border border-[#E2E8F0] text-[#64748B] hover:text-red-600 hover:border-red-200 transition-colors shadow-xs"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Supprimer cette offre ?"
        message="Cette action est irréversible. L'offre sera supprimée définitivement et tous les candidats associés seront notifiés."
        confirmText="Supprimer"
        cancelText="Annuler"
        isDangerous={true}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setOfferToDelete(null);
        }}
      />
    </div>
  );
};

export default CompanyOffersPage;
