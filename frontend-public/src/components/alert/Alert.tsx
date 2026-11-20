import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  closeable?: boolean;
  compact?: boolean;
}

const alertConfig = {
  success: {
    bg: 'bg-[#F0FDF4]',
    border: 'border-[#86EFAC]',
    accent: 'bg-[#22C55E]',
    title: 'text-[#166534]',
    message: 'text-[#15803D]',
    icon: <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />,
  },
  error: {
    bg: 'bg-[#FEF2F2]',
    border: 'border-[#FECACA]',
    accent: 'bg-[#EF4444]',
    title: 'text-[#991B1B]',
    message: 'text-[#B91C1C]',
    icon: <AlertCircle className="w-5 h-5 text-[#EF4444]" />,
  },
  warning: {
    bg: 'bg-[#FFFBEB]',
    border: 'border-[#FED7AA]',
    accent: 'bg-[#F59E0B]',
    title: 'text-[#92400E]',
    message: 'text-[#B45309]',
    icon: <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />,
  },
  info: {
    bg: 'bg-[#EFF6FF]',
    border: 'border-[#BFDBFE]',
    accent: 'bg-[#3B82F6]',
    title: 'text-[#1E40AF]',
    message: 'text-[#1E3A8A]',
    icon: <Info className="w-5 h-5 text-[#3B82F6]" />,
  },
};

const Alert: React.FC<AlertProps> = ({ 
  type, 
  title, 
  message, 
  onClose, 
  closeable = true,
  compact = false
}) => {
  const config = alertConfig[type];

  return (
    <div className={`${config.bg} border-l-4 ${config.border} rounded-lg p-4 shadow-md backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300`}>
      <div className={`flex items-${compact ? 'center' : 'start'} gap-3`}>
        {/* Left Accent Bar */}
        <div className={`w-1 h-8 ${config.accent} rounded-full flex-shrink-0`} />
        
        {/* Icon */}
        <div className={`flex-shrink-0 ${compact ? '' : 'mt-0.5'}`}>
          {config.icon}
        </div>

        {/* Content */}
        <div className={`flex-1 min-w-0 ${compact ? '' : ''}`}>
          {title && (
            <h4 className={`${config.title} ${compact ? 'text-sm' : 'text-sm'} font-bold ${compact ? '' : 'mb-1'}`}>
              {title}
            </h4>
          )}
          <p className={`${config.message} ${compact ? 'text-sm' : 'text-sm'} font-medium ${compact ? '' : 'leading-relaxed'}`}>
            {message}
          </p>
        </div>

        {/* Close Button */}
        {closeable && onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 p-1.5 hover:bg-white/60 rounded-lg transition-all duration-200 ${config.message} hover:scale-110`}
            aria-label="Fermer l'alerte"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
