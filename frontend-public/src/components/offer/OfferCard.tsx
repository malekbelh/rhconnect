import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Building2, Clock, ArrowUpRight, Banknote } from 'lucide-react';
import type { Offer } from '../../types';
import MatchingBadge from './MatchingBadge';
import { TypeContrat } from '../../types';

interface OfferCardProps {
  offer: Offer;
  linkTo?: 'candidate' | 'company';
}

const contratLabels: Record<TypeContrat, string> = {
  [TypeContrat.CDI]: 'CDI',
  [TypeContrat.CDD]: 'CDD',
  [TypeContrat.STAGE]: 'Stage',
  [TypeContrat.ALTERNANCE]: 'Alternance',
  [TypeContrat.INTERIM]: 'Intérim',
  [TypeContrat.FREELANCE]: 'Freelance',
  [TypeContrat.SIVP]: 'SIVP',
};

const formatSalaire = (min?: number, max?: number): string => {
  if (min && max) {
    return `${min.toLocaleString('fr-FR')} - ${max.toLocaleString('fr-FR')} TND`;
  }
  if (min) {
    return `Dès ${min.toLocaleString('fr-FR')} TND`;
  }
  if (max) {
    return `Jusqu'à ${max.toLocaleString('fr-FR')} TND`;
  }
  return 'Salaire non spécifié';
};

const OfferCard: React.FC<OfferCardProps> = ({ offer, linkTo = 'candidate' }) => {
  const publishedDate = new Date(offer.createdAt || Date.now()).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });

  // Determine the link based on context
  const getOfferLink = () => {
    if (linkTo === 'company') {
      return `/company/offers/${offer.id}/edit`;
    }
    return `/candidate/offers/${offer.id}`;
  };

  // Status colors
  const getStatusColor = (status: string, hasComment?: boolean) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return ' text-emerald-700 border-emerald-200';
      case 'PENDING_MODERATION': return ' text-amber-700 border-amber-200';
      case 'DRAFT': 
        return hasComment 
          ? ' text-orange-700 border-orange-200'  // Draft with modifications requested
          : ' text-slate-700 border-slate-200';     // Regular draft
      case 'REJECTED': return ' text-red-700 border-red-200';
      case 'EXPIRED': return ' text-slate-700 border-slate-200';
      case 'UNPUBLISHED': return ' text-slate-700 border-slate-200';
      default: return ' text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: string, hasComment?: boolean) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'Publiée';
      case 'PENDING_MODERATION': return ' En attente de modération';
      case 'DRAFT': 
        return hasComment 
          ? ' Corrections demandées'
          : ' Brouillon';
      case 'REJECTED': return ' Rejetée';
      case 'EXPIRED': return ' Expirée';
      case 'UNPUBLISHED': return ' Dépubliée';
      default: return status;
    }
  };

  return (
    <Link
      to={getOfferLink()}
      className="bg-white rounded-3xl border border-[#E2E8F0] p-6 hover:shadow-lg hover:border-[#0F766E]/40 transition-all duration-200 group flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] border border-[#E2E8F0] rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs group-hover:border-[#0F766E]/30">
              {offer.companyLogoUrl ? (
                <img
                  src={offer.companyLogoUrl}
                  alt={offer.companyName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-6 h-6 text-[#0F766E]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold text-base text-[#172A3A] group-hover:text-[#0F766E] transition-colors truncate">
                {offer.title}
              </h3>
              <p className="text-xs font-semibold text-[#64748B] truncate mt-0.5">{offer.companyName}</p>
            </div>
          </div>
          {offer.matchingScore !== undefined && (
            <MatchingBadge score={offer.matchingScore} size="sm" />
          )}
        </div>

        {/* Status Badge Alert */}
        {offer.statut && (
          <div className={`mb-4 px-3 py-2 rounded-lg border text-xs font-semibold ${getStatusColor(offer.statut, !!offer.moderationComment)}`}>
            {getStatusLabel(offer.statut, !!offer.moderationComment)}
          </div>
        )}

        {/* Moderation Comment Alert */}
        {offer.moderationComment && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-800 mb-1">💬 Commentaire de l'admin:</p>
            <p className="text-xs text-amber-700">{offer.moderationComment}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          <span className="px-3 py-1 rounded-full font-bold bg-[#E6F7F5] text-[#0F766E] border border-[#0F766E]/20">
            {contratLabels[offer.typeContrat] || offer.typeContrat || 'CDI'}
          </span>
          <span className="flex items-center gap-1 text-[#64748B] bg-[#F1F5F9] px-3 py-1 rounded-full font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
            {offer.localisation || 'Tunis'}
          </span>
          <span className="flex items-center gap-1 text-[#334155] bg-[#F8FAFC] px-3 py-1 rounded-full font-semibold border border-[#E2E8F0]">
            <Banknote className="w-3.5 h-3.5 text-[#D4A72C]" />
            {formatSalaire(offer.salaireMin, offer.salaireMax)}
          </span>
        </div>

        {offer.competencesRequises && offer.competencesRequises.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {offer.competencesRequises.slice(0, 4).map((comp, index) => (
              <span
                key={index}
                className="px-2.5 py-0.5 bg-neutral-100 hover:bg-[#E6F7F5] text-[#475569] hover:text-[#0F766E] text-[11px] rounded-lg font-medium transition-colors"
              >
                {comp}
              </span>
            ))}
            {offer.competencesRequises.length > 4 && (
              <span className="px-2 py-0.5 bg-neutral-100 text-[#64748B] text-[11px] rounded-lg font-bold">
                +{offer.competencesRequises.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9]">
        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <Clock className="w-3.5 h-3.5" />
          <span>Publié le {publishedDate}</span>
        </div>
        {linkTo === 'candidate' ? (
          <span className="text-xs font-bold text-[#0F766E] group-hover:text-[#115E59] flex items-center gap-1">
            Postuler <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        ) : (
          <span className="text-xs font-bold text-[#0F766E] group-hover:text-[#115E59] flex items-center gap-1">
            Modifier <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        )}
      </div>
    </Link>
  );
};

export default OfferCard;
