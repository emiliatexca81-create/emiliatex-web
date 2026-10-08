import React from 'react';
import { Home, Shirt, Trophy, Shield, MessageCircle } from 'lucide-react';
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
  hasLiveMatch = false,
  onWhatsAppClick
}) => {
  const tabs: {
    id: NavPage;
    label: string;
    icon: any;
    hasLiveBadge?: boolean;
    isAdmin?: boolean;
  }[] = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'catalog', label: 'Catálogo', icon: Shirt },
    { id: 'tournament', label: 'Torneo', icon: Trophy, hasLiveBadge: hasLiveMatch },
    { id: 'admin', label: 'Panel', icon: Shield, isAdmin: true },
  ];

  return (
    <nav
      aria-label="Navegación móvil inferior"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe select-none pointer-events-none"
    >
      <div className="px-3 pb-2 pt-1 pointer-events-auto">
        <div className="neu-card rounded-3xl p-1.5 border border-[#D4AF37]/30 shadow-[0_12px_40px_rgba(0,0,0,0.9)] max-w-md mx-auto grid grid-cols-5 items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentPage === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'neu-pressed-gold text-[#D4AF37]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <span className="absolute top-1 w-6 h-0.5 rounded-full bg-gradient-to-r from-[#FFF2B2] via-[#D4AF37] to-[#AA7C11] shadow-[0_0_8px_rgba(212,175,55,0.9)]" />
                )}

                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110 text-[#D4AF37] stroke-[2.2]' : 'stroke-[1.8]'
                    }`}
                  />

                  {/* Pulsing Live Match Pill Dot */}
                  {tab.hasLiveBadge && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-80" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-black" />
                    </span>
                  )}
                </div>

                <span
                  className={`text-[9px] tracking-wider uppercase font-bold mt-1 truncate max-w-[56px] ${
                    isActive ? 'text-amber-300 font-black' : 'text-slate-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* 5th Button: Quick Direct WhatsApp Quote Action */}
          <button
            onClick={onWhatsAppClick}
            className="relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl neu-pressed text-[#25D366] hover:text-[#1ebd59] active:scale-95 cursor-pointer border border-[#25D366]/30"
            title="Cotizar de inmediato por WhatsApp"
            aria-label="Cotizar vía WhatsApp"
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5 fill-current text-[#25D366]" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <span className="text-[9px] tracking-wider uppercase font-black mt-1 text-[#25D366] truncate">
              WhatsApp
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};
