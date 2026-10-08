import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const EmiliatexLogo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const textSizes = {
    sm: 'text-base tracking-wider',
    md: 'text-xl tracking-widest',
    lg: 'text-2xl tracking-widest',
    xl: 'text-3xl tracking-widest'
  };

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm'
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3.5 select-none ${className}`}>
      {/* Gold Shield SVG Crest */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(212,175,55,0.4)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2B2" />
              <stop offset="35%" stopColor="#D4AF37" />
              <stop offset="70%" stopColor="#AA7C11" />
              <stop offset="100%" stopColor="#F5D77F" />
            </linearGradient>
            <linearGradient id="shieldBg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E1F29" />
              <stop offset="100%" stopColor="#0B0C10" />
            </linearGradient>
          </defs>

          {/* Shield Outline */}
          <path
            d="M50 5 L88 20 C88 56 68 84 50 95 C32 84 12 56 12 20 Z"
            fill="url(#shieldBg)"
            stroke="url(#goldGradient)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Inner Golden Border */}
          <path
            d="M50 12 L80 24 C80 52 64 76 50 86 C36 76 20 52 20 24 Z"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="1.2"
            strokeDasharray="3 2"
            opacity="0.8"
          />

          {/* 3 Golden Stars on top */}
          <path
            d="M50 18 L51.5 22 L56 22 L52.5 24.5 L54 28.5 L50 26 L46 28.5 L47.5 24.5 L44 22 L48.5 22 Z"
            fill="url(#goldGradient)"
          />
          <path
            d="M37 23 L38 25.5 L41 25.5 L38.5 27 L39.5 29.5 L37 28 L34.5 29.5 L35.5 27 L33 25.5 L36 25.5 Z"
            fill="url(#goldGradient)"
            opacity="0.9"
          />
          <path
            d="M63 23 L64 25.5 L67 25.5 L64.5 27 L65.5 29.5 L63 28 L60.5 29.5 L61.5 27 L59 25.5 L62 25.5 Z"
            fill="url(#goldGradient)"
            opacity="0.9"
          />

          {/* Stylized Monogram "E" with athletic slash */}
          <path
            d="M34 38 H64 V44 H43 V51 H60 V56 H43 V65 H65 V71 H34 Z"
            fill="url(#goldGradient)"
          />
          {/* Dynamic athletic gold slash */}
          <path
            d="M63 46 L71 38 L68 35 L60 43 Z"
            fill="#FFFFFF"
            opacity="0.9"
          />
          {/* Needle / Thread curve motif */}
          <path
            d="M26 62 Q 50 78 74 62"
            stroke="url(#goldGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span className={`font-black uppercase text-white font-cinzel ${textSizes[size]} drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]`}>
            EMILIA<span className="bg-gradient-to-r from-[#FFF2B2] via-[#D4AF37] to-[#AA7C11] bg-clip-text text-transparent">TEX</span>
          </span>
        </div>
        {showSubtitle && (
          <div className="flex items-center gap-1">
            <span className={`uppercase font-semibold tracking-wider text-amber-300/90 ${subSizes[size]}`}>
              Uniformes & Torneo Élite
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
