import React from 'react';

export interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'light',
  size = 'md',
  showWordmark = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 34, text: 'text-xl' },
    md: { icon: 40, text: 'text-2xl' },
    lg: { icon: 48, text: 'text-3xl' },
    xl: { icon: 56, text: 'text-4xl' },
  };

  const dim = sizeMap[size];
  const isDark = variant === 'dark';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Icon Emblem - Solid colors without degradation/gradients */}
      <div
        className="relative shrink-0 transition-transform duration-200 hover:scale-105"
        style={{ width: dim.icon, height: dim.icon }}
      >
        <svg
          viewBox="0 0 44 44"
          width={dim.icon}
          height={dim.icon}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-hidden="true"
        >
          {/* Solid Squircle Badge - sans dégradation */}
          <rect
            x="2"
            y="2"
            width="40"
            height="40"
            rx="10"
            fill={isDark ? '#0F766E' : '#172A3A'}
          />

          {/* --- Vector Emblem : Stylized 'R' + Connection Node --- */}
          {/* Vertical Pillar */}
          <path
            d="M 13 11 C 13 10.17 13.67 9.5 14.5 9.5 C 15.33 9.5 16 10.17 16 11 L 16 30 C 16 30.83 15.33 31.5 14.5 31.5 C 13.67 31.5 13 30.83 13 30 Z"
            fill="#FFFFFF"
          />

          {/* Upper Loop of R */}
          <path
            d="M 15 11.5 H 23.5 C 27.6 11.5 30 14.1 30 17.6 C 30 21.1 27.6 23.7 23.5 23.7 H 15"
            stroke="#FFFFFF"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Diagonal Leg of R */}
          <path
            d="M 21.2 23.2 L 28.6 30.6 C 29.1 31.2 30 31.2 30.6 30.7"
            stroke="#FFFFFF"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Connection Arc */}
          <path
            d="M 22.8 17.5 C 24 16 26.5 15 29.5 13.5"
            stroke="#FFFFFF"
            strokeOpacity="0.75"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="0.5 2.5"
          />

          {/* Connection Nodes in Solid White and Initial Yellow #D4A72C */}
          <circle cx="21.5" cy="17.6" r="2.2" fill="#FFFFFF" />
          <circle cx="31" cy="12.5" r="2.6" fill="#D4A72C" />
        </svg>
      </div>

      {/* Wordmark Typography - Solid colors, sans dégradation, sans point final */}
      {showWordmark && (
        <div className="flex items-baseline font-display font-extrabold tracking-tight">
          <span
            className={`${dim.text} transition-colors ${
              isDark ? 'text-white' : 'text-[#172A3A]'
            }`}
          >
            Rh
          </span>
          <span
            className={`${dim.text} font-black ml-0.5 ${
              isDark ? 'text-[#D4A72C]' : 'text-[#0F766E]'
            }`}
          >
            Connect
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
