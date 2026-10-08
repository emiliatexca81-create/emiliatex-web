import React, { useState, useEffect } from 'react';
import { EmiliatexLogo } from './EmiliatexLogo';
import { MessageCircle, Menu, X, Shield, Trophy, Shirt, Home, PhoneCall, Award } from 'lucide-react';
import { formatWhatsAppLink, getSettings, getMatches } from '../services/storage';

export type NavPage = 'home' | 'catalog' | 'tournament' | 'quiniela' | 'admin';

interface NavbarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasLiveMatch, setHasLiveMatch] = useState(false);
  const [settings, setSettings] = useState(getSettings());

  useEffect(() => {
    const checkLive = () => {
      const matches = getMatches();
      setHasLiveMatch(matches.some(m => m.status === 'live'));
      setSettings(getSettings());
    };
    checkLive();

    const handler = () => checkLive();
    window.addEventListener('emiliatex_storage_update', handler);
    return () => window.removeEventListener('emiliatex_storage_update', handler);
  }, []);

  const navItems: { id: NavPage; label: string; icon: any; isSpecial?: boolean; badge?: string }[] = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'catalog', label: 'Catálogo', icon: Shirt },
    { id: 'tournament', label: 'Torneo', icon: Trophy },
    { id: 'quiniela', label: 'Quiniela C.A', icon: Award, badge: 'PUNTOS' },
    { id: 'admin', label: 'Panel Admin', icon: Shield, isSpecial: true },
  ];

  const handleWhatsAppQuick = () => {
    const url = formatWhatsAppLink(
      settings.whatsappNumber,
      `¡Hola EMILIATEX! Me gustaría cotizar uniformes deportivos / corporativos para mi equipo o empresa.`
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#D4AF37]/20 bg-[#090A0F]/95 backdrop-blur-md pt-safe">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center cursor-pointer transition-transform hover:scale-[1.02] focus:outline-none shrink-0"
            aria-label="Ir a Inicio"
          >
            <EmiliatexLogo size="md" />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? item.isSpecial
                        ? 'neu-btn-gold text-black'
                        : 'neu-pressed-gold text-[#D4AF37]'
                      : item.isSpecial
                        ? 'neu-card text-[#D4AF37] hover:brightness-125 border border-[#D4AF37]/30'
                        : 'neu-btn-dark text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive && item.isSpecial ? 'text-black' : 'text-[#D4AF37]'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action: WhatsApp Direct Contact */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={handleWhatsAppQuick}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#25D366] to-[#1eb757] text-black text-xs font-black tracking-wider uppercase transition-all cursor-pointer shadow-[0_2px_15px_rgba(37,211,102,0.3)] hover:brightness-110 active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current text-black" />
              <span>Pedir por WhatsApp</span>
            </button>
          </div>

          {/* Mobile Actions Container */}
          <div className="flex md:hidden items-center gap-2">
            {/* Direct Live indicator on mobile header if a match is on */}
            {hasLiveMatch && (
              <button
                onClick={() => onNavigate('tournament')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-600/20 border border-red-500/50 text-red-400 text-[10px] font-black uppercase tracking-wider animate-pulse active:scale-95"
                title="Ver partido en directo"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,1)]" />
                <span>VIVO</span>
              </button>
            )}

            <button
              onClick={handleWhatsAppQuick}
              className="p-2.5 rounded-xl neu-card text-[#25D366] active:scale-95 transition-transform"
              aria-label="Pedir por WhatsApp"
              title="Pedir por WhatsApp"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl neu-card text-[#D4AF37] active:scale-95 transition-transform"
              aria-label="Abrir menú de navegación"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#D4AF37]" /> : <Menu className="w-6 h-6 text-[#D4AF37]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#D4AF37]/20 bg-[#090A0F]/98 backdrop-blur-2xl px-4 pt-4 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] ${
                    isActive
                      ? item.isSpecial
                        ? 'neu-btn-gold text-black font-black shadow-lg'
                        : 'neu-pressed-gold text-[#D4AF37]'
                      : item.isSpecial
                        ? 'neu-card text-[#D4AF37] border border-[#D4AF37]/30'
                        : 'neu-card text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive && item.isSpecial ? 'text-black' : 'text-[#D4AF37]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'tournament' && hasLiveMatch && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white animate-pulse">
                      EN VIVO
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Direct Actions in Mobile Menu */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <button
              onClick={() => {
                handleWhatsAppQuick();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#1eb757] text-black font-black text-xs tracking-wider uppercase shadow-[0_4px_15px_rgba(37,211,102,0.3)] cursor-pointer active:scale-95 transition-transform"
            >
              <MessageCircle className="w-4 h-4 fill-current text-black" />
              <span>Cotizar por WhatsApp (+{settings.whatsappNumber})</span>
            </button>

            <a
              href={`tel:${settings.contactPhone}`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl neu-card text-slate-300 text-xs font-semibold"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Llamar a Asesor: {settings.contactPhone}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
