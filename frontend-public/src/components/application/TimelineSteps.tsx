import React from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { ApplicationStatus, type ApplicationTimelineEntry } from '../../types';

interface TimelineStepsProps {
  timeline?: ApplicationTimelineEntry[];
  currentStatus: ApplicationStatus;
}

const steps: ApplicationStatus[] = [
  ApplicationStatus.POSTULE,
  ApplicationStatus.RECU,
  ApplicationStatus.EN_VERIFICATION,
  ApplicationStatus.VERIFIE,
  ApplicationStatus.TRANSMIS,
  ApplicationStatus.ENTRETIEN,
];

const stepLabels: Record<ApplicationStatus, string> = {
  [ApplicationStatus.POSTULE]: 'Candidature soumise',
  [ApplicationStatus.RECU]: 'Dossier reçu',
  [ApplicationStatus.EN_VERIFICATION]: 'En vérification',
  [ApplicationStatus.VERIFIE]: 'Dossier vérifié',
  [ApplicationStatus.TRANSMIS]: 'Transmis au recruteur',
  [ApplicationStatus.ENTRETIEN]: 'Entretien planifié',
  [ApplicationStatus.ACCEPTE]: 'Candidature acceptée',
  [ApplicationStatus.REFUSE]: 'Candidature refusée',
};

const stepDescriptions: Partial<Record<ApplicationStatus, string>> = {
  [ApplicationStatus.POSTULE]: 'Votre dossier a bien été enregistré.',
  [ApplicationStatus.RECU]: "L'équipe RHConnect a pris en charge votre dossier.",
  [ApplicationStatus.EN_VERIFICATION]: 'Vos pièces justificatives sont en cours de contrôle.',
  [ApplicationStatus.VERIFIE]: 'Toutes vos pièces ont été validées.',
  [ApplicationStatus.TRANSMIS]: "Votre profil a été présenté à l'entreprise.",
  [ApplicationStatus.ENTRETIEN]: "L'entreprise souhaite vous rencontrer.",
};

const getStepIndex = (status: ApplicationStatus): number => {
  const idx = steps.indexOf(status);
  if (idx !== -1) return idx;
  if (status === ApplicationStatus.ACCEPTE || status === ApplicationStatus.REFUSE) return steps.length;
  return -1;
};

const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const TimelineSteps: React.FC<TimelineStepsProps> = ({ timeline = [], currentStatus }) => {
  const currentIndex = getStepIndex(currentStatus);
  const isTerminal =
    currentStatus === ApplicationStatus.ACCEPTE || currentStatus === ApplicationStatus.REFUSE;

  const getEntryForStep = (status: ApplicationStatus): ApplicationTimelineEntry | undefined =>
    timeline.find((t) => t.status === status);

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const entry = getEntryForStep(step);
        const isCompleted = currentIndex > index;
        const isCurrent = currentIndex === index && !isTerminal;

        return (
          <div key={step} className="relative flex gap-4 min-h-[68px]">
            {/* Connecteur vertical */}
            <div className="flex flex-col items-center">
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  isCompleted
                    ? 'bg-[#059669] text-white ring-4 ring-[#059669]/15'
                    : isCurrent
                    ? 'bg-[#0F766E] text-white ring-4 ring-[#0F766E]/20'
                    : 'bg-white border-2 border-[#E2E8F0] text-[#94A3B8]'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                ) : isCurrent ? (
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                ) : (
                  <span className="text-[10px] font-bold">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 flex-1 min-h-[20px] mt-1 ${
                    isCompleted ? 'bg-[#059669]' : 'bg-[#E2E8F0]'
                  }`}
                />
              )}
            </div>

            {/* Contenu */}
            <div className="flex-1 pb-5 pt-0.5 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold leading-tight ${
                      isCompleted
                        ? 'text-[#059669]'
                        : isCurrent
                        ? 'text-[#172A3A]'
                        : 'text-[#94A3B8]'
                    }`}
                  >
                    {stepLabels[step]}
                  </p>
                  {(isCompleted || isCurrent) && !entry?.commentaire && stepDescriptions[step] && (
                    <p className="text-[10px] text-[#64748B] mt-0.5">{stepDescriptions[step]}</p>
                  )}
                  {entry?.commentaire && (
                    <p className="text-[11px] text-[#475569] italic mt-0.5 leading-snug">{entry.commentaire}</p>
                  )}
                </div>
                {entry?.date && (
                  <p className="text-[10px] text-[#94A3B8] whitespace-nowrap flex-shrink-0 pt-0.5">
                    {formatDate(entry.date)}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Étape terminale (Accepté / Refusé) */}
      {isTerminal && (
        <div className="relative flex gap-4 min-h-[56px]">
          <div className="flex flex-col items-center">
            <div
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-4 ${
                currentStatus === ApplicationStatus.ACCEPTE
                  ? 'bg-[#059669] text-white ring-[#059669]/15'
                  : 'bg-[#E11D48] text-white ring-[#E11D48]/15'
              }`}
            >
              {currentStatus === ApplicationStatus.ACCEPTE ? (
                <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="flex-1 pt-0.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p
                  className={`text-xs font-extrabold ${
                    currentStatus === ApplicationStatus.ACCEPTE ? 'text-[#059669]' : 'text-[#E11D48]'
                  }`}
                >
                  {stepLabels[currentStatus]}
                </p>
                {getEntryForStep(currentStatus)?.commentaire && (
                  <p className="text-[11px] text-[#475569] italic mt-0.5">
                    {getEntryForStep(currentStatus)!.commentaire}
                  </p>
                )}
              </div>
              {getEntryForStep(currentStatus)?.date && (
                <p className="text-[10px] text-[#94A3B8] whitespace-nowrap flex-shrink-0 pt-0.5">
                  {formatDate(getEntryForStep(currentStatus)!.date)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineSteps;
