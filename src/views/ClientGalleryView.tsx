import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClientWorkItem, ClientWorkCategory } from '../types';
import { NavPage } from '../components/Navbar';
import { 
  Camera, 
  Shirt, 
  Trophy, 
  Sparkles, 
  Filter, 
  Search, 
  X, 
  MessageCircle, 
  ExternalLink, 
  Shield, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Tag,
  Eye,
  Layers,
  ArrowRight
} from 'lucide-react';
import { formatWhatsAppLink, getSettings } from '../services/storage';

interface ClientGalleryViewProps {
  works: ClientWorkItem[];
  onNavigate?: (page: NavPage) => void;
  onSelectProduct?: (productName: string) => void;
}

const CATEGORY_TABS: { id: 'all' | ClientWorkCategory; label: string; icon: any }[] = [
  { id: 'all', label: 'Todos los Trabajos', icon: Sparkles },
  { id: 'futbol', label: 'Fútbol & Competición', icon: Trophy },
  { id: 'academias', label: 'Academias & Torneo', icon: Shield },
  { id: 'baloncesto', label: 'Baloncesto & Voleibol', icon: Shirt },
  { id: 'polos', label: 'Polos & Presentación', icon: Tag },
  { id: 'chaquetas', label: 'Chaquetas & Sudaderas', icon: Layers },
  { id: 'corporativo', label: 'Línea Corporativa', icon: CheckCircle2 }
];

export const ClientGalleryView: React.FC<ClientGalleryViewProps> = ({
  works,
  onNavigate
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | ClientWorkCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkModal, setSelectedWorkModal] = useState<ClientWorkItem | null>(null);
  const settings = getSettings();

  // Filtered client works
  const filteredWorks = useMemo(() => {
    return works.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const text = `${item.title} ${item.clientName} ${item.description} ${item.technique || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [works, selectedCategory, searchQuery]);

  // Modal navigation (next/prev)
  const currentModalIndex = useMemo(() => {
    if (!selectedWorkModal) return -1;
    return filteredWorks.findIndex(w => w.id === selectedWorkModal.id);
  }, [selectedWorkModal, filteredWorks]);

  const handleNextModal = () => {
    if (currentModalIndex >= 0 && currentModalIndex < filteredWorks.length - 1) {
      setSelectedWorkModal(filteredWorks[currentModalIndex + 1]);
    } else if (filteredWorks.length > 0) {
      setSelectedWorkModal(filteredWorks[0]);
    }
  };

  const handlePrevModal = () => {
    if (currentModalIndex > 0) {
      setSelectedWorkModal(filteredWorks[currentModalIndex - 1]);
    } else if (filteredWorks.length > 0) {
      setSelectedWorkModal(filteredWorks[filteredWorks.length - 1]);
    }
  };

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedWorkModal) return;
      if (e.key === 'Escape') setSelectedWorkModal(null);
      if (e.key === 'ArrowRight') handleNextModal();
      if (e.key === 'ArrowLeft') handlePrevModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWorkModal, currentModalIndex, filteredWorks]);

  // WhatsApp Quote Link generator
  const getWhatsAppQuoteUrl = (item: ClientWorkItem) => {
    const msg = `¡Hola EMILIATEX! Vi en su galería el trabajo realizado para "${item.clientName}" (${item.title}) y me gustaría cotizar una confección similar para mi club/empresa.`;
    return formatWhatsAppLink(settings.whatsappNumber, msg);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* HERO BANNER - LUXURY ATELIER SHOWCASE */}
      <section className="relative rounded-3xl neu-card-gold p-6 sm:p-10 border border-[#D4AF37]/50 shadow-2xl overflow-hidden">
        {/* Subtle decorative radial gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neu-pressed-gold text-amber-300 text-xs font-mono font-black border border-[#D4AF37]/30 tracking-wider uppercase">
            <Camera className="w-3.5 h-3.5" />
            <span>Lookbook Oficial • Galería</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-cinzel text-white tracking-tight leading-tight">
            Galería de <span className="bg-gradient-to-r from-[#FFF2B2] via-[#D4AF37] to-[#AA7C11] bg-clip-text text-transparent">Nuestros Trabajos</span> & Clientes
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Muestrario fotográfico real de indumentaria deportiva de alta competencia, uniformes de academias del Torneo y dotación corporativa confeccionada con tecnología Dry-Fit y sublimación digital HD.
          </p>

          {/* Quick value badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <div className="p-3 rounded-2xl neu-pressed text-center">
              <span className="block text-base sm:text-lg font-black font-cinzel text-amber-300">HQ</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Muestrario Real</span>
            </div>
            <div className="p-3 rounded-2xl neu-pressed text-center">
              <span className="block text-base sm:text-lg font-black font-cinzel text-white">+50</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Clubes Vestidos</span>
            </div>
            <div className="p-3 rounded-2xl neu-pressed text-center">
              <span className="block text-base sm:text-lg font-black font-cinzel text-amber-300">100%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sublimación HD</span>
            </div>
            <div className="p-3 rounded-2xl neu-pressed text-center">
              <span className="block text-base sm:text-lg font-black font-cinzel text-white">5 Hilos</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Costura Reforzada</span>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH BAR */}
      <section className="space-y-4">
        {/* Category Tabs */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 pb-1">
          {CATEGORY_TABS.map(tab => {
            const Icon = tab.icon;
            const isSelected = selectedCategory === tab.id;
            const count = tab.id === 'all' 
              ? works.length 
              : works.filter(w => w.category === tab.id).length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'neu-btn-gold text-black shadow-lg font-extrabold'
                    : 'neu-btn-dark text-slate-300 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-black' : 'text-amber-400'}`} />
                <span className="truncate">{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 ${
                  isSelected ? 'bg-black/20 text-black font-black' : 'bg-white/10 text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input and active filter badge */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, club, técnica o tela..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl neu-pressed text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] border border-white/5 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Mostrando <strong className="text-amber-300">{filteredWorks.length}</strong> de {works.length} fotos</span>
          </div>
        </div>
      </section>

      {/* 4:5 GALLERY GRID */}
      {filteredWorks.length === 0 ? (
        <div className="p-12 rounded-3xl neu-card text-center space-y-4 border border-white/10">
          <Camera className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white font-cinzel">No se encontraron trabajos con los filtros actuales</h3>
            <p className="text-xs text-slate-400">Intenta cambiar la categoría o limpiar el término de búsqueda.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-5 py-2.5 rounded-2xl neu-btn-gold text-black text-xs font-bold cursor-pointer active:scale-95"
          >
            Ver Todos los Trabajos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
          {filteredWorks.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              onClick={() => setSelectedWorkModal(item)}
              className="group relative rounded-3xl neu-card overflow-hidden border border-white/10 hover:border-[#D4AF37]/60 transition-all duration-300 shadow-xl cursor-pointer hover:-translate-y-1.5 flex flex-col"
            >
              {/* IMAGE CONTAINER STRICTLY 4:5 ASPECT RATIO */}
              <div className="relative w-full aspect-[4/5] overflow-hidden bg-black/60">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                  loading="lazy"
                />

                {/* Top Overlay Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-10">
                  <span className="px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-amber-300 border border-amber-400/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                    {item.clientName}
                  </span>
                  {item.featured && (
                    <span className="px-2 py-0.5 rounded-lg neu-btn-gold text-black text-[9px] font-mono font-black uppercase tracking-wider shadow">
                      Destacado
                    </span>
                  )}
                </div>

                {/* Hover Quick Action Pill */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 z-10">
                  <span className="px-4 py-2 rounded-2xl neu-btn-gold text-black text-xs font-black uppercase tracking-wider shadow-2xl flex items-center gap-1.5 transform scale-90 group-hover:scale-100 transition-transform">
                    <Eye className="w-3.5 h-3.5 text-black" />
                    <span>Ver Ficha</span>
                  </span>
                </div>

                {/* Bottom Shadow Gradient */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#090A0F] via-[#090A0F]/80 to-transparent pointer-events-none" />
                
                {/* Brand Indicator watermark */}
                <span className="absolute bottom-3 right-3 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-slate-400 text-[9px] font-mono pointer-events-none">
                  EMILIATEX
                </span>
              </div>

              {/* CARD INFO FOOTER */}
              <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between bg-[#11131c]">
                <div>
                  <h4 className="text-sm font-black font-cinzel text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Technique & Tags */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  {item.technique && (
                    <p className="text-[10px] font-mono text-amber-400/90 truncate flex items-center gap-1">
                      <Sparkles className="w-3 h-3 shrink-0 text-amber-400" />
                      <span className="truncate">{item.technique}</span>
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>{item.yearOrDate || 'EMILIATEX'}</span>
                    <span className="text-amber-400 font-bold group-hover:underline flex items-center gap-1">
                      <span>Cotizar similar</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CTA BOTTOM BANNER */}
      <section className="rounded-3xl neu-card p-6 sm:p-8 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/20">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Asesoría Directa por WhatsApp</span>
          </div>
          <h3 className="text-lg sm:text-2xl font-black font-cinzel text-white">
            ¿Deseas confeccionar uniformes para tu academia o empresa?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Enviamos muestras físicas, realizamos diseños 3D personalizados sin costo adicional y garantizamos entregas puntuales para torneos y eventos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
          <a
            href={formatWhatsAppLink(settings.whatsappNumber, '¡Hola EMILIATEX! Me comunico desde la Galería de Clientes y quiero cotizar uniformes personalizados para mi club / empresa.')}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#1ebd59] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Cotizar por WhatsApp</span>
          </a>

          {onNavigate && (
            <button
              onClick={() => onNavigate('catalog')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl neu-btn-gold text-black font-bold text-xs sm:text-sm uppercase tracking-wider active:scale-95 cursor-pointer shadow-md text-center"
            >
              Ver Catálogo Completo
            </button>
          )}
        </div>
      </section>

      {/* 4:5 HIGH RESOLUTION LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedWorkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl neu-card-gold p-5 sm:p-7 border border-[#D4AF37]/60 shadow-2xl space-y-6"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl neu-btn-gold text-black font-black text-xs font-mono uppercase">
                    Galería Oficial
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {currentModalIndex + 1} de {filteredWorks.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevModal}
                    className="p-2 rounded-xl neu-pressed text-slate-300 hover:text-white cursor-pointer active:scale-95"
                    title="Anterior (Flecha izquierda)"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextModal}
                    className="p-2 rounded-xl neu-pressed text-slate-300 hover:text-white cursor-pointer active:scale-95"
                    title="Siguiente (Flecha derecha)"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWorkModal(null)}
                    className="p-2 rounded-xl neu-btn-dark text-slate-400 hover:text-white cursor-pointer active:scale-95 ml-2"
                    title="Cerrar (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Left 4:5 Image, Right Detail specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                
                {/* 4:5 Photo Frame */}
                <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden neu-card border-2 border-amber-400/40 shadow-2xl bg-black">
                  <img
                    src={selectedWorkModal.imageUrl}
                    alt={selectedWorkModal.title}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md text-amber-300 font-mono text-xs font-bold border border-amber-400/30">
                    Galería de Clientes
                  </div>
                </div>

                {/* Specifications & Details */}
                <div className="space-y-4">
                  <div>
                    <span className="px-3 py-1 rounded-full neu-pressed text-amber-300 font-mono text-xs font-bold border border-amber-400/20">
                      Cliente Oficial: {selectedWorkModal.clientName}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black font-cinzel text-white mt-2">
                      {selectedWorkModal.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {selectedWorkModal.yearOrDate || 'Edición Oficial EMILIATEX'}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    {selectedWorkModal.description}
                  </p>

                  {/* Tech Specs */}
                  {selectedWorkModal.technique && (
                    <div className="p-3.5 rounded-2xl neu-pressed space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Tecnología & Confección Aplicada:</span>
                      </span>
                      <p className="text-xs text-white font-medium">
                        {selectedWorkModal.technique}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedWorkModal.tags && selectedWorkModal.tags.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Características del Producto:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedWorkModal.tags.map(t => (
                          <span key={t} className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[11px] font-medium">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <a
                      href={getWhatsAppQuoteUrl(selectedWorkModal)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#1ebd59] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>Cotizar Este Trabajo por WhatsApp</span>
                    </a>

                    <p className="text-center text-[10px] text-slate-400 font-mono">
                      Te respondemos de inmediato con cotización y tallajes disponibles.
                    </p>
                  </div>

                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
