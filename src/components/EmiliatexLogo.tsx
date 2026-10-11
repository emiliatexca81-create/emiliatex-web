import React, { useState, useEffect } from 'react';
import { getSettings } from '../services/storage';

export const DEFAULT_OFFICIAL_LOGO = 'https://firebasestorage.googleapis.com/v0/b/potent-quest-cq6d2.firebasestorage.app/o/WhatsApp%20Image%202026-10-11%20at%202.13.47%20PM.jpeg?alt=media&token=0f9b47e3-b545-40e8-9e68-6164e112868d';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  customLogoUrl?: string;
  onlyImage?: boolean;
}

export const EmiliatexLogo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  customLogoUrl,
  onlyImage = false
}) => {
  const [imgError, setImgError] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string>(() => {
    if (customLogoUrl) return customLogoUrl;
    const settings = getSettings();
    return settings.companyLogoUrl || DEFAULT_OFFICIAL_LOGO;
  });

  useEffect(() => {
    if (customLogoUrl) {
      setLogoSrc(customLogoUrl);
      setImgError(false);
      return;
    }

    const updateLogo = () => {
      const settings = getSettings();
      setLogoSrc(settings.companyLogoUrl || DEFAULT_OFFICIAL_LOGO);
      setImgError(false);
    };

    updateLogo();
    window.addEventListener('emiliatex_storage_update', updateLogo);
    return () => window.removeEventListener('emiliatex_storage_update', updateLogo);
  }, [customLogoUrl]);

  const [aspectRatio, setAspectRatio] = useState<number>(894 / 1600);
  const containerAspect = imgError ? '1 / 1' : `${aspectRatio}`;

  const iconHeights = {
    sm: 'h-8 sm:h-9',
    md: 'h-13 sm:h-16',
    lg: 'h-18 sm:h-22',
    xl: 'h-24 sm:h-32'
  };

  const textSizes = {
    sm: 'text-base tracking-wider',
    md: 'text-xl sm:text-2xl tracking-widest',
    lg: 'text-2xl sm:text-3xl tracking-widest',
    xl: 'text-3xl sm:text-4xl tracking-widest'
  };

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px] sm:text-[11px]',
    lg: 'text-xs sm:text-sm',
    xl: 'text-sm sm:text-base'
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3.5 select-none ${className}`}>
      {/* Official Company Emblem / Shield - elongated portrait ratio to respect original vertical logo */}
      <div 
        className={`relative ${iconHeights[size]} flex items-center justify-center shrink-0 transition-all duration-300`}
        style={{ aspectRatio: containerAspect }}
      >
        {!imgError ? (
          <div className="w-full h-full rounded-xl sm:rounded-2xl overflow-hidden p-0.5 bg-gradient-to-br from-[#FFF2B2] via-[#D4AF37] to-[#8c6710] shadow-[0_2px_14px_rgba(212,175,55,0.45)] flex items-center justify-center">
            <div className="w-full h-full rounded-[9px] sm:rounded-[13px] overflow-hidden bg-white flex items-center justify-center">
              <img
                src={logoSrc}
                alt="EMILIATEX Logo Oficial"
                onLoad={(e) => {
                  const { naturalWidth, naturalHeight } = e.currentTarget;
                  if (naturalWidth && naturalHeight) {
                    setAspectRatio(naturalWidth / naturalHeight);
                  }
                }}
                onError={() => setImgError(true)}
                className="w-full h-full object-contain transform hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        ) : (
          /* High-res SVG Shield Crest Fallback */
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

            {/* 3 Golden Stars */}
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

            {/* Stylized Monogram "E" */}
            <path
              d="M34 38 H64 V44 H43 V51 H60 V56 H43 V65 H65 V71 H34 Z"
              fill="url(#goldGradient)"
            />
            <path
              d="M63 46 L71 38 L68 35 L60 43 Z"
              fill="#FFFFFF"
              opacity="0.9"
            />
            <path
              d="M26 62 Q 50 78 74 62"
              stroke="url(#goldGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        )}
      </div>

      {/* Brand Typography */}
      {!onlyImage && (
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
      )}
    </div>
  );
};
