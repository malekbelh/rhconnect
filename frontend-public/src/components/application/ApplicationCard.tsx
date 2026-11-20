import React from 'react';
import { Building2, Calendar } from 'lucide-react';
import type { Application } from '../../types';
import StatusBadge from '../ui/StatusBadge';
import MatchingBadge from '../offer/MatchingBadge';

interface ApplicationCardProps {
  application: Application;
  onClick?: () => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onClick }) => {
  const dateSoumission = new Date(application.dateSoumission).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-neutral-200 p-5 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-primary-300' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-neutral-900 truncate">
            {application.offerTitle || 'Offre'}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-neutral-500">
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{application.companyName || 'Entreprise'}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusBadge status={application.status} size="sm" />
          {application.matchingScore !== undefined && (
            <MatchingBadge score={application.matchingScore} size="sm" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-neutral-500 pt-3 border-t border-neutral-100">
        <Calendar className="w-4 h-4" />
        <span>Postulé le {dateSoumission}</span>
      </div>

      {onClick && (
        <div className="mt-3 text-sm font-medium text-primary-600 flex items-center gap-1">
          Voir le suivi
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ApplicationCard;
