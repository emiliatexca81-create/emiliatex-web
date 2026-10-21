import React from 'react';
import { Home, Shirt, Trophy, Shield, Camera, Award } from 'lucide-react';
import { NavPage } from './Navbar';

interface MobileBottomNavProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  hasLiveMatch?: boolean;
  onWhatsAppClick: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPage,
  onNavigate,
  hasLiveMatch = false
}) => {
  const tabs: {
    id: NavPage;
    label: string;
    icon: any;
    hasLiveBadge?: boolean;
    isAdmin?: boolean;
    badge?: string;
  }[] = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'catalog', label: 'Catálogo', icon: Shirt },
    { id: 'gallery', label: 'Galería', icon: Camera },
    { id: 'tournament', label: 'Torneo', icon: Trophy, hasLiveBadge: hasLiveMatch },
    { id: 'quiniela', label: 'Quiniela', icon: Award, badge: 'PTS' },
    { id: 'admin', label: 'Panel', icon: Shield, isAdmin: true },
  ];

  return (
    <nav
      aria-label="Navegación móvil inferior agrupada"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe select-none pointer-events-none"
    >
      <div className="px-2 pb-2 pt-1 pointer-events-auto">
        <div className="neu-card rounded-3xl p-1 sm:p-1.5 border border-[#D4AF37]/30 shadow-[0_12px_40px_rgba(0,0,0,0.95)] max-w-lg mx-auto grid grid-cols-6 items-center gap-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentPage === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl sm:rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'neu-pressed-gold text-[#D4AF37]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-current={isActive ? 'page' : undefined}
                title={tab.label}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <span className="absolute top-0.5 w-5 h-0.5 rounded-full bg-gradient-to-r from-[#FFF2B2] via-[#D4AF37] to-[#AA7C11] shadow-[0_0_8px_rgba(212,175,55,0.9)]" />
                )}

                <div className="relative">
                  <Icon
                    className={`w-4 h-4 xs:w-4.5 xs:h-4.5 transition-transform ${
                      isActive ? 'scale-110 text-[#D4AF37] stroke-[2.2]' : 'stroke-[1.8]'
                    }`}
                  />

                  {/* Pulsing Live Match Pill Dot */}
                  {tab.hasLiveBadge && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-80" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-black" />
                    </span>
                  )}

                  {/* Quiniela PTS badge dot */}
                  {tab.badge && !tab.hasLiveBadge && (
                    <span className="absolute -top-0.5 -right-1.5 px-1 rounded-full bg-[#D4AF37] text-black text-[7px] font-black leading-tight shadow-sm scale-90">
                      {tab.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[8px] xs:text-[9px] tracking-tight uppercase font-bold mt-1 truncate max-w-full text-center ${
                    isActive ? 'text-amber-300 font-black' : 'text-slate-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
