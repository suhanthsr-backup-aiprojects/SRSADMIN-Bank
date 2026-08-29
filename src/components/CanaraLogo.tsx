import React from 'react';

interface CanaraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  inverted?: boolean;
  className?: string;
}

export const CanaraLogo: React.FC<CanaraLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  inverted = false,
  className = '',
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size];

  const primaryTextSize = {
    sm: 'text-sm',
    md: 'text-base font-bold',
    lg: 'text-xl font-extrabold',
    xl: 'text-2xl font-black',
  }[size];

  const subTextSize = {
    sm: 'text-[10px]',
    md: 'text-xs font-semibold',
    lg: 'text-sm font-semibold',
    xl: 'text-base font-bold',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* SRSADMIN Bank Emblem: Shield & Geometric Interlock */}
      <div className={`relative ${iconDimensions} shrink-0 flex items-center justify-center`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
          <defs>
            <linearGradient id="srsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#004B87" />
              <stop offset="100%" stopColor="#002D54" />
            </linearGradient>
            <linearGradient id="srsGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFC72C" />
              <stop offset="100%" stopColor="#E5A600" />
            </linearGradient>
          </defs>
          {/* Outer Crest */}
          <polygon
            points="50,6 94,84 6,84"
            fill="none"
            stroke="url(#srsGrad)"
            strokeWidth="12"
            strokeLinejoin="round"
          />
          {/* Inner Interlocking Gold Polygon */}
          <polygon
            points="50,94 6,16 94,16"
            fill="none"
            stroke="url(#srsGold)"
            strokeWidth="12"
            strokeLinejoin="round"
          />
          {/* Inner Shield / Diamond */}
          <polygon
            points="50,28 76,74 24,74"
            fill="#004B87"
            opacity="0.95"
          />
          <polygon
            points="50,72 26,26 74,26"
            fill="#FFB800"
            opacity="0.9"
          />
          <circle cx="50" cy="50" r="8" fill="#FFFFFF" />
        </svg>
      </div>

      <div className="flex flex-col leading-tight">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-serif tracking-tight ${subTextSize} ${inverted ? 'text-amber-300' : 'text-[#004B87]'}`}>
            एसआरएसएडमिन बैंक
          </span>
          <span className="text-slate-400 font-light text-xs">/</span>
          <span className={`font-sans tracking-tight uppercase ${primaryTextSize} ${inverted ? 'text-white' : 'text-[#004B87]'}`}>
            SRSADMIN Bank
          </span>
        </div>
        {showSubtitle && (
          <div className="flex items-center gap-1.5 text-[9px] font-medium tracking-tight">
            <span className={`${inverted ? 'text-slate-300' : 'text-slate-600'}`}>
              (Core Banking & Digital Operations)
            </span>
            <span className="text-[#FFB800] font-bold tracking-wider">
              • Trust & Excellence
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const BankLogo = CanaraLogo;
