import React from 'react';
import { EmiliatexLogo } from './EmiliatexLogo';
import { MessageCircle, Trophy, Shirt, Shield, MapPin, Mail, Phone, Heart } from 'lucide-react';
import { NavPage } from './Navbar';
import { formatWhatsAppLink, getSettings } from '../services/storage';

interface FooterProps {
  onNavigate: (page: NavPage) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const settings = getSettings();

  const handleWhatsApp = () => {
    const url = formatWhatsAppLink(
      settings.whatsappNumber,
      '¡Hola EMILIATEX! Me comunico desde el sitio web oficial para una consulta.'
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="border-t border-[#D4AF37]/20 bg-[#07080b] text-slate-300 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#D4AF37]/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* Brand & About */}
          <div className="space-y-4">
            <EmiliatexLogo size="md" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Empresa líder en diseño y fabricación de uniformes deportivos de alta competencia y dotaciones corporativas con sublimación digital HD y bordado computarizado.
            </p>
            <div className="pt-2">
              <button
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl neu-card text-[#25D366] text-xs font-black tracking-wider uppercase hover:border-[#25D366]/60 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>WhatsApp: +{settings.whatsappNumber}</span>
              </button>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-cinzel flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span>Navegación Rápida</span>
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-2 text-slate-400"
                >
                  <span className="text-[#D4AF37] font-bold">›</span> Inicio
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('catalog')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-2 text-slate-400"
                >
                  <span className="text-[#D4AF37] font-bold">›</span> Catálogo
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('tournament')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-2 text-slate-400"
                >
                  <span className="text-[#D4AF37] font-bold">›</span> Torneo Élite EMILIATEX
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-2 text-slate-400"
                >
                  <span className="text-[#D4AF37] font-bold">›</span> Panel de Control Admin
                </button>
              </li>
            </ul>
          </div>

          {/* Torneo Élite Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-cinzel flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Torneo Élite</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plataforma deportiva formativa que reúne a las mejores academias del país. Fixture oficial, tablas clasificatorias por categoría y estadísticas.
            </p>
            <div className="p-2.5 rounded-xl neu-pressed text-[11px] text-amber-300/90 font-mono border border-[#D4AF37]/20">
              Categorías Sub-7, Sub-9, Sub-11, Sub-13 y Sub-15 • Temporada 2026
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-cinzel flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span>Contacto Directo</span>
            </h3>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2 p-2 rounded-xl neu-pressed">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl neu-pressed">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>{settings.emailContact}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl neu-pressed">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>+{settings.whatsappNumber}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} EMILIATEX. Confección Textil Deportiva & Corporativa de Alta Precisión.</p>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="px-2.5 py-1 rounded-lg neu-pressed text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/30">
              Estilo Neumórfico Neo-Futuro
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
