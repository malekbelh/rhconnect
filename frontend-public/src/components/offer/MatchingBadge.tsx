import React from 'react';

interface MatchingBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const MatchingBadge: React.FC<MatchingBadgeProps> = ({ score, size = 'md' }) => {
  const roundedScore = Math.round(score);

  let colorClasses = '';
  if (roundedScore >= 70) {
    colorClasses = 'bg-success-500 text-white';
  } else if (roundedScore >= 50) {
    colorClasses = 'bg-warning-500 text-white';
  } else {
    colorClasses = 'bg-danger-500 text-white';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full ${sizeClasses} ${colorClasses}`}
    >
      {roundedScore}%
    </span>
  );
};

export default MatchingBadge;
