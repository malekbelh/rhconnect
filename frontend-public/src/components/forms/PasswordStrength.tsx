import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

interface Rule {
  label: string;
  test: (p: string) => boolean;
}

const rules: Rule[] = [
  { label: '10 caractères minimum', test: (p) => p.length >= 10 },
  { label: 'Une lettre majuscule', test: (p) => /[A-Z]/.test(p) },
  { label: 'Une lettre minuscule', test: (p) => /[a-z]/.test(p) },
  { label: 'Un chiffre', test: (p) => /[0-9]/.test(p) },
  { label: 'Un caractère spécial', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const strengthColors = [
  'bg-danger-500',
  'bg-danger-500',
  'bg-warning-500',
  'bg-warning-500',
  'bg-success-500',
  'bg-success-500',
];

const strengthLabels = [
  'Très faible',
  'Faible',
  'Moyenne',
  'Bonne',
  'Forte',
  'Excellente',
];

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const passedRules = rules.filter((r) => r.test(password)).length;
  const strengthIndex = password.length === 0 ? 0 : passedRules;
  const progressWidth = password.length === 0 ? 0 : (passedRules / rules.length) * 100;
  const colorClass = strengthColors[strengthIndex];
  const labelText = strengthLabels[strengthIndex];

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-neutral-600">Force du mot de passe</span>
          {password.length > 0 && (
            <span className={`text-xs font-semibold ${
              strengthIndex <= 1 ? 'text-danger-500' :
              strengthIndex <= 3 ? 'text-warning-500' :
              'text-success-600'
            }`}>
              {labelText}
            </span>
          )}
        </div>
        <div className="h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-out rounded-full ${colorClass}`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {rules.map((rule, i) => {
          const passed = rule.test(password);
          return (
            <li
              key={i}
              className={`flex items-center gap-2 text-xs ${
                passed ? 'text-success-600' : 'text-neutral-500'
              }`}
            >
              {passed ? (
                <span className="w-4 h-4 rounded-full bg-success-500/10 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </span>
              ) : (
                <span className="w-4 h-4 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                  <X className="w-3 h-3 text-neutral-400" />
                </span>
              )}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrength;
