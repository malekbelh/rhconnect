import React from 'react';
import { Search, MapPin, SlidersHorizontal, X } from 'lucide-react';
import { TypeContrat, NiveauExperience } from '../../types';
import type { OfferFiltersParams } from '../../types';

interface OfferFiltersProps {
  filters: OfferFiltersParams;
  onChange: (filters: OfferFiltersParams) => void;
}

const contratOptions: { value: TypeContrat; label: string }[] = [
  { value: TypeContrat.CDI, label: 'CDI' },
  { value: TypeContrat.CDD, label: 'CDD' },
  { value: TypeContrat.STAGE, label: 'Stage' },
  { value: TypeContrat.SIVP, label: 'SIVP' },
  { value: TypeContrat.FREELANCE, label: 'Freelance' },
  { value: TypeContrat.ALTERNANCE, label: 'Alternance' },
  { value: TypeContrat.INTERIM, label: 'Intérim' },
];

const niveauOptions: { value: NiveauExperience; label: string }[] = [
  { value: NiveauExperience.DEBUTANT, label: 'Débutant' },
  { value: NiveauExperience.JUNIOR, label: 'Junior' },
  { value: NiveauExperience.INTERMEDIAIRE, label: 'Intermédiaire' },
  { value: NiveauExperience.SENIOR, label: 'Senior' },
  { value: NiveauExperience.EXPERT, label: 'Expert' },
];

const OfferFilters: React.FC<OfferFiltersProps> = ({ filters, onChange }) => {
  const toggleContrat = (type: TypeContrat) => {
    const current = filters.typeContrat || [];
    const typeValue = type.toString(); // Convert enum to string
    const next = current.includes(typeValue)
      ? current.filter((t) => t !== typeValue)
      : [...current, typeValue];
    onChange({ ...filters, typeContrat: next.length > 0 ? next : undefined });
  };

  const clearFilters = () => onChange({});

  const hasActiveFilters =
    filters.keyword ||
    filters.localisation ||
    filters.niveauExperience ||
    (filters.typeContrat && filters.typeContrat.length > 0);

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#0F766E]" />
          <h3 className="font-bold text-sm text-[#172A3A]">Filtres</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#64748B] hover:text-[#E11D48] transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Effacer tout
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Mots-clés */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#172A3A]">Mots-clés</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={filters.keyword || ''}
              onChange={(e) => onChange({ ...filters, keyword: e.target.value || undefined })}
              placeholder="Poste, compétence, technologie..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#172A3A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all"
            />
          </div>
        </div>

        {/* Localisation */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#172A3A]">Localisation (Tunisie)</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-2.5 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={filters.localisation || ''}
              onChange={(e) => onChange({ ...filters, localisation: e.target.value || undefined })}
              placeholder="Tunis, Sousse, Sfax..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#172A3A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all"
            />
          </div>
        </div>

        {/* Type de contrat */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#172A3A]">Type de contrat</label>
          <div className="grid grid-cols-2 gap-1.5">
            {contratOptions.map(({ value, label }) => {
              const isChecked = (filters.typeContrat || []).includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleContrat(value)}
                  className={`flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-xs'
                      : 'bg-white text-[#334155] border-[#CBD5E1] hover:border-[#0F766E] hover:text-[#0F766E] hover:bg-[#F0FDFA]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Niveau d'expérience */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#172A3A]">Niveau d'expérience</label>
          <select
            value={filters.niveauExperience || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                niveauExperience: e.target.value ? (e.target.value as NiveauExperience) : undefined,
              })
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#172A3A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all"
          >
            <option value="">Tous les niveaux</option>
            {niveauOptions.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Récap filtres actifs */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-[#F1F5F9]">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Filtres actifs</p>
            <div className="flex flex-wrap gap-1.5">
              {filters.keyword && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F7F5] text-[#0F766E] border border-[#0F766E]/20">
                  "{filters.keyword}"
                  <button onClick={() => onChange({ ...filters, keyword: undefined })} className="hover:text-[#E11D48]">✕</button>
                </span>
              )}
              {filters.localisation && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F7F5] text-[#0F766E] border border-[#0F766E]/20">
                  📍 {filters.localisation}
                  <button onClick={() => onChange({ ...filters, localisation: undefined })} className="hover:text-[#E11D48]">✕</button>
                </span>
              )}
              {(filters.typeContrat || []).map((tc) => (
                <span key={tc} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F7F5] text-[#0F766E] border border-[#0F766E]/20">
                  {tc}
                  <button onClick={() => {
                    const current = filters.typeContrat || [];
                    const next = current.filter((t) => t !== tc);
                    onChange({ ...filters, typeContrat: next.length > 0 ? next : undefined });
                  }} className="hover:text-[#E11D48]">✕</button>
                </span>
              ))}
              {filters.niveauExperience && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F7F5] text-[#0F766E] border border-[#0F766E]/20">
                  {filters.niveauExperience}
                  <button onClick={() => onChange({ ...filters, niveauExperience: undefined })} className="hover:text-[#E11D48]">✕</button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferFilters;
