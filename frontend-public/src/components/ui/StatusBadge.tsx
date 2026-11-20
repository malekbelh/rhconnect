import React from 'react';
import {
  ApplicationStatus,
  OfferStatus,
  VerificationStatus,
  TypePieceVerification,
} from '../../types';

type StatusType =
  | ApplicationStatus
  | OfferStatus
  | VerificationStatus
  | TypePieceVerification
  | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
}

const statusStyles: Record<string, string> = {
  [ApplicationStatus.POSTULE]: 'bg-blue-100 text-blue-700 border-blue-200',
  [ApplicationStatus.RECU]: 'bg-blue-100 text-blue-700 border-blue-200',
  [ApplicationStatus.EN_VERIFICATION]: 'bg-amber-100 text-amber-700 border-amber-200',
  [ApplicationStatus.TRANSMIS]: 'bg-purple-100 text-purple-700 border-purple-200',
  [ApplicationStatus.ENTRETIEN]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  [ApplicationStatus.ACCEPTE]: 'bg-success-100 text-success-600 border-success-500/30',
  [ApplicationStatus.REFUSE]: 'bg-red-100 text-danger-500 border-red-200',

  [OfferStatus.DRAFT]: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  [OfferStatus.ACTIVE]: 'bg-success-100 text-success-600 border-success-500/30',
  [OfferStatus.CLOSED]: 'bg-neutral-100 text-neutral-500 border-neutral-200',

  [VerificationStatus.NON_VERIFIE]: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  [VerificationStatus.EN_COURS]: 'bg-amber-100 text-amber-700 border-amber-200',
  [VerificationStatus.REJETE]: 'bg-red-100 text-danger-500 border-red-200',

  [TypePieceVerification.IDENTITE]: 'bg-blue-100 text-blue-700 border-blue-200',
  [TypePieceVerification.DIPLOME]: 'bg-purple-100 text-purple-700 border-purple-200',
  [TypePieceVerification.ATTESTATION]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [TypePieceVerification.AUTRE]: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

statusStyles[ApplicationStatus.VERIFIE] = 'bg-emerald-100 text-emerald-700 border-emerald-200';
statusStyles[VerificationStatus.VERIFIE] = 'bg-success-100 text-success-600 border-success-500/30';

const statusLabels: Record<string, string> = {
  [ApplicationStatus.POSTULE]: 'Postulé',
  [ApplicationStatus.RECU]: 'Reçu',
  [ApplicationStatus.EN_VERIFICATION]: 'En vérification',
  [ApplicationStatus.TRANSMIS]: 'Transmis',
  [ApplicationStatus.ENTRETIEN]: 'Entretien',
  [ApplicationStatus.ACCEPTE]: 'Accepté',
  [ApplicationStatus.REFUSE]: 'Refusé',

  [OfferStatus.DRAFT]: 'Brouillon',
  [OfferStatus.ACTIVE]: 'Active',
  [OfferStatus.CLOSED]: 'Clôturée',

  [VerificationStatus.NON_VERIFIE]: 'Non vérifié',
  [VerificationStatus.EN_COURS]: 'En cours',
  [VerificationStatus.REJETE]: 'Rejeté',

  [TypePieceVerification.IDENTITE]: 'Identité',
  [TypePieceVerification.DIPLOME]: 'Diplôme',
  [TypePieceVerification.ATTESTATION]: 'Attestation',
  [TypePieceVerification.AUTRE]: 'Autre',
};

statusLabels[ApplicationStatus.VERIFIE] = 'Vérifié';
statusLabels[VerificationStatus.VERIFIE] = 'Vérifié';

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'md' }) => {
  const styles = statusStyles[status] || 'bg-neutral-100 text-neutral-600 border-neutral-200';
  const displayLabel = label || statusLabels[status] || status;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${styles}`}
    >
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
