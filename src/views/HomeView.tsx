import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Product, TournamentMatch } from '../types';
import { NavPage } from '../components/Navbar';
import { MessageCircle, Trophy, Shirt, ArrowRight, ShieldCheck, Sparkles, Flame, Clock, MapPin, CheckCircle, ChevronRight, Eye } from 'lucide-react';
import { formatWhatsAppLink, getSettings } from '../services/storage';

interface HomeViewProps {
  products: Product[];
  matches: TournamentMatch[];
  onNavigate: (page: NavPage) => void;
  onSelectProduct: (product: Product) => void;
  onSelectMatch?: (match: TournamentMatch) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  matches,
  onNavigate,
  onSelectProduct,
  onSelectMatch,
}) => {
  const settings = getSettings();
  const liveMatch = matches.find(m => m.status === 'live');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming').slice(0, 2);
  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 4);

  const handleGeneralWhatsApp = () => {
    const url = formatWhatsAppLink(
      settings.whatsappNumber,
      '¡Hola EMILIATEX! Deseo información general sobre uniformes deportivos y corporativos para mi proyecto.'
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      
      {/* 1. HERO SECTION: Neo-Futuristic Dribbble Sports & Corporate Apparel */}
      <section className="relative min-h-[580px] sm:min-h-[640px] flex items-center justify-center overflow-hidden rounded-3xl neu-card-gold cyber-grid px-6 sm:px-12 py-16">
        {/* Ambient Gold Glow & Background Accents */}
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#D4AF37]/15 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-[#AA7C11]/20 blur-[100px] pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px hologram-line" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          
          {/* Live Tournament Ticker Pill / HUD Status */}
          {liveMatch ? (
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full neu-pressed border border-red-500/50 text-red-300 text-xs sm:text-sm font-semibold shadow-[0_0_20px_rgba(239,68,68,0.35)] animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-mono uppercase font-bold text-[11px] tracking-wider">HUD // EN VIVO:</span>
              <span className="font-bold text-white">{liveMatch.homeAcademyName} ({liveMatch.homeScore}) vs ({liveMatch.awayScore}) {liveMatch.awayAcademyName}</span>
              <button
                onClick={() => onNavigate('tournament')}
                className="underline text-amber-300 ml-1 hover:text-white cursor-pointer font-bold"
              >
                Ver Marcador →
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full hud-badge text-amber-300 text-xs sm:text-sm font-bold tracking-widest uppercase">
              <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" />
              <span>EMILIATEX C.A</span>
            </div>
          )}

          {/* Main Display Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white font-cinzel leading-none">
              UNIFORMES DE <span className="bg-gradient-to-r from-[#FFF2B2] via-[#D4AF37] to-[#AA7C11] bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(212,175,55,0.4)]">CAMPEONES</span>
            </h1>
            <p className="text-base sm:text-xl text-slate-300 font-medium max-w-3xl mx-auto leading-relaxed">
              Diseño de vanguardia, sublimación digital HD y confección de alto rendimiento para academias deportivas, clubes profesionales y dotaciones corporativas.
            </p>
          </div>

          {/* Dual Action Buttons - Neumorphic Touch Friendly */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('catalog')}
              className="w-full sm:w-auto min-h-[52px] flex items-center justify-center gap-3 px-8 py-4 rounded-2xl neu-btn-gold text-black font-extrabold text-sm uppercase tracking-wider cursor-pointer"
            >
              <Shirt className="w-5 h-5 text-black" />
              <span>Explorar Catálogo</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>

            <button
              onClick={() => onNavigate('tournament')}
              className="w-full sm:w-auto min-h-[52px] flex items-center justify-center gap-3 px-8 py-4 rounded-2xl neu-btn-dark text-white font-extrabold text-sm uppercase tracking-wider cursor-pointer border border-[#D4AF37]/40"
            >
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Torneo Élite EMILIATEX</span>
            </button>

            <button
              onClick={handleGeneralWhatsApp}
              className="w-full sm:w-auto min-h-[52px] flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl neu-pressed text-[#25D366] font-extrabold text-sm tracking-wide border border-[#25D366]/40 hover:bg-[#25D366]/10 active:scale-98 transition-all cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>WhatsApp Directo</span>
            </button>
          </div>

          {/* Trust Badges - Neumorphic Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-6 border-t border-white/10 text-left">
            <div className="p-3 rounded-2xl neu-pressed flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl neu-card flex items-center justify-center shrink-0 text-[#D4AF37]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-white">Sin Intermediarios</p>
                <p className="text-[11px] text-slate-400">Taller y estampación directa</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl neu-pressed flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl neu-card flex items-center justify-center shrink-0 text-[#D4AF37]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-white">Sublimación HD</p>
                <p className="text-[11px] text-slate-400">Fijación molecular de color</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl neu-pressed flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl neu-card flex items-center justify-center shrink-0 text-[#25D366]">
                <MessageCircle className="w-5 h-5 fill-current" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-white">Atención Rápida</p>
                <p className="text-[11px] text-slate-400">Cotizaciones al instante</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl neu-pressed flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl neu-card flex items-center justify-center shrink-0 text-[#D4AF37]">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-white">Torneo Élite</p>
                <p className="text-[11px] text-slate-400">Cantera & fútbol formativo</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. TOURNAMENT RADAR / LIVE WIDGET */}
      <section className="rounded-3xl neu-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neu-pressed text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>CENTRO DE PARTIDOS & RADAR</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-cinzel text-white">
              Torneo Élite EMILIATEX 2026
            </h2>
          </div>
          <button
            onClick={() => onNavigate('tournament')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl neu-btn-dark text-amber-300 text-xs font-bold transition-all cursor-pointer"
          >
            <span>Ver Fixture & Tabla</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Matches mini cards with NeoFuturo entrance transitions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.slice(0, 3).map((match, idx) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: idx * 0.08,
                ease: [0.16, 1, 0.3, 1]
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => {
                if (onSelectMatch) {
                  onSelectMatch(match);
                } else {
                  onNavigate('tournament');
                }
              }}
              className={`p-4 sm:p-5 rounded-2xl transition-all cursor-pointer group ${
                match.status === 'live'
                  ? 'neu-card-gold ring-1 ring-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                  : 'neu-card hover:border-[#D4AF37]/50'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">{match.phase}</span>
                {match.status === 'live' ? (
                  <span className="px-2.5 py-1 rounded-full bg-red-600 text-white font-black text-[10px] uppercase flex items-center gap-1.5 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    EN VIVO {match.liveMinute}
                  </span>
                ) : match.status === 'finished' ? (
                  <span className="px-2.5 py-0.5 rounded-md neu-pressed text-slate-300 font-semibold text-[10px]">
                    FINALIZADO
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full neu-pressed text-amber-300 font-semibold text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#D4AF37]" />
                    {match.date} • {match.time}
                  </span>
                )}
              </div>

              {/* Match Opponents Confrontation */}
              <div className="space-y-2.5 p-3 rounded-xl neu-pressed">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg neu-card p-1 flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                      <img src={match.homeLogo} alt={match.homeAcademyName} className="w-full h-full object-contain rounded" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-[170px]">{match.homeAcademyName}</span>
                  </div>
                  <span className="text-lg font-black font-cinzel text-amber-300">
                    {match.homeScore !== undefined ? match.homeScore : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg neu-card p-1 flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                      <img src={match.awayLogo} alt={match.awayAcademyName} className="w-full h-full object-contain rounded" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-[170px]">{match.awayAcademyName}</span>
                  </div>
                  <span className="text-lg font-black font-cinzel text-amber-300">
                    {match.awayScore !== undefined ? match.awayScore : '-'}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="truncate">{match.stadium}</span>
                </div>
                <span className="text-amber-400 group-hover:text-amber-300 font-bold flex items-center gap-1 text-[11px]">
                  <span>Ficha Táctica</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS: High Quality Sportswear & Corporate Catalog */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neu-pressed text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Shirt className="w-3.5 h-3.5" />
              <span>CATÁLOGO DIGITAL & PRENDAS OFICIALES</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-cinzel text-white">
              Colección & Confección Textil
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Personalización con tecnología Dry-Fit, sublimación HD y corte ergonómico de alta resistencia.
            </p>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl neu-btn-gold text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer"
          >
            <span>Catálogo Completo</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* Product Cards Grid - Dribbble Neumorphic 3D with NeoFuturo entrance transitions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: idx * 0.07,
                ease: [0.16, 1, 0.3, 1]
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative flex flex-col justify-between rounded-3xl neu-card overflow-hidden transition-all duration-300 hover:border-[#D4AF37]/50"
            >
              {/* Product Image Stage */}
              <div className="relative aspect-[4/3] w-full overflow-hidden p-2">
                <div className="w-full h-full rounded-2xl neu-pressed overflow-hidden relative">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5 hud-badge px-2.5 py-0.5 rounded-lg text-[9px] font-bold tracking-wider text-amber-300 uppercase">
                    {product.category === 'deportivo' ? 'Sport Tech' : 'Corp Line'}
                  </div>
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md neu-pressed text-[9px] font-mono text-slate-300 font-bold">
                    {product.sku}
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                    // {product.subcategory}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-[#D4AF37] transition-colors line-clamp-1 font-cinzel">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl neu-pressed">
                    <span className="text-[11px] text-slate-400">Min: <strong className="text-white">{product.minQuantity} u.</strong></span>
                    <span className="font-mono text-xs font-black text-amber-300">{product.priceEstimate}</span>
                  </div>

                  {/* Cotizar por WhatsApp Button - Ergonomic Touch Target */}
                  <button
                    onClick={() => onSelectProduct(product)}
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#1eb757] text-black font-black text-xs tracking-wider uppercase shadow-[0_4px_15px_rgba(37,211,102,0.3)] hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-current text-black" />
                    <span>COTIZAR EN WHATSAPP</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. MANUFACTURING CAPABILITIES & PROCESS - Neumorphic Cards */}
      <section className="rounded-3xl neu-card-gold p-6 sm:p-12 space-y-8">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neu-pressed text-amber-300 text-[10px] font-bold tracking-widest uppercase">
            ESTÁNDAR DE INGENIERÍA TEXTIL
          </div>
          <h2 className="text-2xl sm:text-4xl font-black font-cinzel text-white">
            ¿Por qué elegir EMILIATEX?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
            Control de calidad integral: diseño vectorial milimétrico, sublimación térmica de alta fidelidad y confección deportiva de impacto.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl neu-card space-y-3.5">
            <div className="w-12 h-12 rounded-2xl neu-pressed flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-white font-cinzel">Sublimación Digital HD</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tintas importadas integradas molecularmente a la fibra. Resistencia extrema al sudor y lavados continuos sin decoloración.
            </p>
          </div>

          <div className="p-6 rounded-2xl neu-card space-y-3.5">
            <div className="w-12 h-12 rounded-2xl neu-pressed flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-white font-cinzel">Bordados Matriciales</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Puntadas computarizadas de alta densidad para escudos de clubes, sponsors y detalles heráldicos de máxima definición.
            </p>
          </div>

          <div className="p-6 rounded-2xl neu-card space-y-3.5">
            <div className="w-12 h-12 rounded-2xl neu-pressed flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/30">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-white font-cinzel">Tejidos Dry-Tech Pro</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Microfibra antitranspirante con transpirabilidad biomecánica y protección UV para alto rendimiento en cancha y oficina.
            </p>
          </div>
        </div>
      </section>

      {/* 5. DIRECT CALL TO ACTION BANNER */}
      <section className="relative rounded-3xl neu-card p-6 sm:p-10 overflow-hidden border border-[#25D366]/30">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#25D366]/50 to-transparent" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="px-3 py-1 rounded-full neu-pressed text-[#25D366] text-[10px] font-bold uppercase tracking-wider inline-block">
              // Canales de Atención Directa
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-white font-cinzel">
              ¿Listo para vestir a tu equipo o empresa?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Envíanos tu boceto o requerimiento y te responderemos con muestra digital 3D y cotización formal por WhatsApp de inmediato.
            </p>
          </div>
          <button
            onClick={handleGeneralWhatsApp}
            className="w-full sm:w-auto min-h-[50px] shrink-0 flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#1ebd59] text-black font-black text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(37,211,102,0.4)] active:scale-98 transition-all cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Chatear con Asesor WhatsApp</span>
          </button>
        </div>
      </section>

    </div>
  );
};
