import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Share2, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Sparkles, 
  Trophy, 
  Flame, 
  Camera, 
  Grid3X3, 
  Smartphone, 
  Search, 
  Filter, 
  Check, 
  Users, 
  Tag, 
  Calendar, 
  Shield, 
  ExternalLink,
  MessageCircle,
  Plus
} from 'lucide-react';
import { TournamentPhoto, TOURNAMENT_PHOTO_CATEGORIES } from '../types';
import { toggleLikeTournamentPhoto, getLikedTournamentPhotoIds, formatWhatsAppLink } from '../services/storage';

interface TournamentSocialGalleryProps {
  photos: TournamentPhoto[];
  onUploadClick?: () => void;
  isAdmin?: boolean;
}

export const TournamentSocialGallery: React.FC<TournamentSocialGalleryProps> = ({
  photos,
  onUploadClick,
  isAdmin = false
}) => {
  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedJornada, setSelectedJornada] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('feed');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [likedPhotoIds, setLikedPhotoIds] = useState<string[]>(() => getLikedTournamentPhotoIds());
  const [localPhotoLikes, setLocalPhotoLikes] = useState<Record<string, number>>({});
  const [doubleTapAnimationId, setDoubleTapAnimationId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Sync liked IDs on storage update
  useEffect(() => {
    const handleStorage = () => {
      setLikedPhotoIds(getLikedTournamentPhotoIds());
    };
    window.addEventListener('emiliatex_storage_update', handleStorage);
    return () => window.removeEventListener('emiliatex_storage_update', handleStorage);
  }, []);

  // Available Jornadas derived from photos
  const availableJornadas = useMemo(() => {
    const set = new Set<string>();
    photos.forEach(p => {
      if (p.jornada && p.jornada.trim()) {
        set.add(p.jornada.trim());
      }
    });
    return Array.from(set);
  }, [photos]);

  // Filtered photos
  const filteredPhotos = useMemo(() => {
    return photos.filter(p => {
      // Category filter
      if (selectedCategory !== 'Todos') {
        const cat = p.category || 'General';
        if (cat.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Jornada filter
      if (selectedJornada !== 'all') {
        if (!p.jornada || p.jornada.toLowerCase() !== selectedJornada.toLowerCase()) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const text = `${p.title} ${p.caption || ''} ${p.teamName || ''} ${p.category} ${p.jornada || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        if (!text.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [photos, selectedCategory, selectedJornada, searchQuery]);

  // Story / Highlight categories with representative icon & thumbnail
  const storyHighlights = useMemo(() => {
    return [
      { id: 'Todos', label: 'Todos', icon: Sparkles, count: photos.length },
      { id: 'Sub-15', label: 'Sub-15', icon: Shield, count: photos.filter(p => p.category === 'Sub-15').length },
      { id: 'Sub-13', label: 'Sub-13', icon: Shield, count: photos.filter(p => p.category === 'Sub-13').length },
      { id: 'Sub-11', label: 'Sub-11', icon: Shield, count: photos.filter(p => p.category === 'Sub-11').length },
      { id: 'Sub-9', label: 'Sub-9', icon: Shield, count: photos.filter(p => p.category === 'Sub-9').length },
      { id: 'Premiación', label: 'Premiación', icon: Trophy, count: photos.filter(p => p.category === 'Premiación').length },
      { id: 'Mejores Momentos', label: 'Goles & Jugadas', icon: Flame, count: photos.filter(p => p.category === 'Mejores Momentos').length },
      { id: 'Inauguración', label: 'Inauguración', icon: Camera, count: photos.filter(p => p.category === 'Inauguración').length },
      { id: 'Hinchada y Familias', label: 'Familias', icon: Users, count: photos.filter(p => p.category === 'Hinchada y Familias').length },
    ];
  }, [photos]);

  // Handle Like Toggle
  const handleLike = async (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const res = await toggleLikeTournamentPhoto(photoId);
    setLikedPhotoIds(getLikedTournamentPhotoIds());
    setLocalPhotoLikes(prev => ({
      ...prev,
      [photoId]: res.count
    }));
  };

  // Handle Double Tap to like (Instagram style)
  const handleDoubleTap = (photoId: string) => {
    setDoubleTapAnimationId(photoId);
    setTimeout(() => {
      setDoubleTapAnimationId(null);
    }, 900);

    // If not liked yet, trigger like
    if (!likedPhotoIds.includes(photoId)) {
      handleLike(photoId);
    }
  };

  // Get like count for photo (combining stored & local state)
  const getLikesCount = (photo: TournamentPhoto) => {
    if (localPhotoLikes[photo.id] !== undefined) {
      return localPhotoLikes[photo.id];
    }
    return photo.likesCount || 0;
  };

  // Lightbox navigation
  const currentLightboxPhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  const handlePrevPhoto = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxIndex !== null && filteredPhotos.length > 0) {
      setLightboxIndex((lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
    }
  }, [lightboxIndex, filteredPhotos.length]);

  const handleNextPhoto = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxIndex !== null && filteredPhotos.length > 0) {
      setLightboxIndex((lightboxIndex + 1) % filteredPhotos.length);
    }
  }, [lightboxIndex, filteredPhotos.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'ArrowRight') handleNextPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handlePrevPhoto, handleNextPhoto]);

  // Format relative date / date string
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Reciente';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'Reciente';
    }
  };

  // WhatsApp share helper
  const handleShareWhatsApp = (photo: TournamentPhoto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareText = `¡Mira esta foto del Torneo Oficial EMILIATEX! ⚽🏆\n"${photo.title}" - ${photo.category} (${photo.jornada || 'Fecha Oficial'})\n${photo.imageUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Copy link
  const handleCopyLink = (photo: TournamentPhoto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(photo.imageUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Social Media Stories / Highlights Bar */}
      <div className="relative rounded-3xl neu-card p-4 sm:p-5 border border-amber-400/30 overflow-hidden bg-gradient-to-r from-[#12131C] via-[#1A181C] to-[#12131C] shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-[#D4AF37] animate-pulse" />
            <h3 className="text-xs font-black tracking-wider uppercase text-amber-300 font-cinzel">
              Momentos & Historias Destacadas
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {photos.length} fotos oficiales
          </span>
        </div>

        {/* Horizontal scrollable stories ring */}
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {storyHighlights.map((hl) => {
            const Icon = hl.icon;
            const isSelected = selectedCategory.toLowerCase() === hl.id.toLowerCase();
            return (
              <button
                key={hl.id}
                type="button"
                onClick={() => setSelectedCategory(hl.id)}
                className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none cursor-pointer snap-start transition-transform active:scale-95"
              >
                {/* Animated Gold Ring */}
                <div className={`p-0.5 rounded-full transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-tr from-amber-400 via-[#FFE17D] to-[#D4AF37] shadow-[0_0_18px_rgba(212,175,55,0.6)] scale-105'
                    : 'bg-white/10 group-hover:bg-gradient-to-tr group-hover:from-amber-400/50 group-hover:to-amber-600/50'
                }`}>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#181924] p-1 flex flex-col items-center justify-center border-2 border-[#090A0F] group-hover:brightness-110 transition-all">
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                      isSelected ? 'text-[#D4AF37]' : 'text-slate-400 group-hover:text-amber-300'
                    }`} />
                    <span className="text-[9px] font-bold font-mono text-slate-400 mt-0.5">
                      {hl.count}
                    </span>
                  </div>
                </div>

                <span className={`text-[11px] font-medium tracking-tight truncate max-w-[70px] text-center ${
                  isSelected ? 'text-amber-300 font-black' : 'text-slate-400 group-hover:text-slate-200'
                }`}>
                  {hl.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Bar: View Mode, Jornada, Search, Upload CTA */}
      <div className="rounded-2xl neu-card p-4 border border-white/5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Left: View Mode Toggle (Feed vs Grid) & Category Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl neu-pressed bg-black/40 border border-white/5">
            <button
              type="button"
              onClick={() => setViewMode('feed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'feed'
                  ? 'neu-btn-gold text-black shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Social (Feed vertical estilo Instagram)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Feed Social</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'neu-btn-gold text-black shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Cuadrícula / Mosaico"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Mosaico</span>
            </button>
          </div>

          {selectedCategory !== 'Todos' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('Todos')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold hover:bg-amber-400/20 transition-colors"
            >
              <span>{selectedCategory}</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Center/Right: Filters & Search */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* Jornada Selector */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedJornada}
              onChange={(e) => setSelectedJornada(e.target.value)}
              className="w-full sm:w-auto appearance-none neu-input px-3.5 py-2 pr-8 rounded-xl text-xs font-bold text-white bg-[#14151F] border border-white/10 focus:border-[#D4AF37] focus:outline-none cursor-pointer"
            >
              <option value="all">Todas las Fechas</option>
              {availableJornadas.map(j => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por equipo, gol, #tag..."
              className="w-full neu-input pl-8 pr-3 py-2 rounded-xl text-xs text-white placeholder-slate-500 bg-[#14151F] border border-white/10 focus:border-[#D4AF37] focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Upload Button Shortcut (for Admin / Organizer) */}
          {onUploadClick && (
            <button
              type="button"
              onClick={onUploadClick}
              className="px-3.5 py-2 rounded-xl neu-btn-gold text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Subir fotos a Firebase Storage"
            >
              <Plus className="w-3.5 h-3.5 text-black" />
              <span className="hidden sm:inline">Subir Foto a Storage</span>
              <span className="sm:hidden">Subir</span>
            </button>
          )}

        </div>
      </div>

      {/* Empty State */}
      {filteredPhotos.length === 0 && (
        <div className="rounded-3xl neu-card p-12 text-center space-y-4 border border-white/5">
          <div className="w-16 h-16 rounded-2xl neu-card-gold text-[#D4AF37] flex items-center justify-center mx-auto">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white font-cinzel">No hay fotos para este filtro</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Intenta seleccionar otra categoría, fecha o limpia la búsqueda para ver todas las postales del torneo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('Todos');
              setSelectedJornada('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl neu-btn-gold text-black font-black text-xs cursor-pointer"
          >
            Ver Todas las Fotos
          </button>
        </div>
      )}

      {/* FEED SOCIAL VIEW (Instagram Style Cards) */}
      {viewMode === 'feed' && filteredPhotos.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-7">
          {filteredPhotos.map((photo, index) => {
            const isLiked = likedPhotoIds.includes(photo.id);
            const likesCount = getLikesCount(photo);
            const isAnimatingHeart = doubleTapAnimationId === photo.id;

            return (
              <motion.article
                key={photo.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.3) }}
                className="rounded-3xl neu-card border border-white/10 overflow-hidden bg-[#12131D] shadow-2xl relative"
              >
                {/* Header (Author / Tournament profile) */}
                <div className="p-4 flex items-center justify-between border-b border-white/5 bg-[#171824]/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 to-[#D4AF37] shrink-0">
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-amber-300" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white hover:text-amber-300 transition-colors">
                          Torneo Élite EMILIATEX
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                          {photo.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        {photo.teamName && (
                          <span className="font-medium text-slate-300">{photo.teamName}</span>
                        )}
                        {photo.jornada && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-amber-400/80">{photo.jornada}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDate(photo.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {photo.featured && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Destacada</span>
                    </span>
                  )}
                </div>

                {/* Main Photo with Double-Tap to Like */}
                <div 
                  className="relative bg-black flex items-center justify-center overflow-hidden cursor-pointer select-none group min-h-[360px] max-h-[580px]"
                  onDoubleClick={() => handleDoubleTap(photo.id)}
                  onClick={() => setLightboxIndex(index)}
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    loading="lazy"
                    className="w-full h-auto max-h-[580px] object-contain transition-transform duration-500 group-hover:scale-[1.01]"
                  />

                  {/* Gradient shadow overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity" />

                  {/* Double Tap Floating Heart Animation */}
                  <AnimatePresence>
                    {isAnimatingHeart && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0.9] }}
                        exit={{ scale: 1.6, opacity: 0 }}
                        transition={{ duration: 0.65, ease: 'easeOut' }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                      >
                        <Heart className="w-28 h-28 text-red-500 fill-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.9)]" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Quick Expand Hint */}
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pointer-events-none">
                    <Camera className="w-3 h-3 text-amber-400" />
                    <span>Click para pantalla completa</span>
                  </div>
                </div>

                {/* Actions Bar (Like, WhatsApp Share, Fullscreen, Likes Count) */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      
                      {/* Like Button */}
                      <button
                        type="button"
                        onClick={(e) => handleLike(photo.id, e)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          isLiked
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'neu-pressed text-slate-300 hover:text-white hover:bg-white/10'
                        }`}
                        title="Me gusta (Doble tap en la foto)"
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500 animate-bounce' : ''}`} />
                        <span className="font-mono font-black">{likesCount}</span>
                      </button>

                      {/* WhatsApp Share Button */}
                      <button
                        type="button"
                        onClick={(e) => handleShareWhatsApp(photo, e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-pressed text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 text-xs font-bold transition-all cursor-pointer"
                        title="Compartir en WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        <span>Compartir</span>
                      </button>

                      {/* Copy Link */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(photo, e)}
                        className="p-2 rounded-xl neu-pressed text-slate-400 hover:text-white transition-all cursor-pointer"
                        title="Copiar enlace de imagen"
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLightboxIndex(index)}
                      className="text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver Completa</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title & Caption */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white font-cinzel leading-snug">
                      {photo.title}
                    </h4>
                    {photo.caption && (
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {photo.caption}
                      </p>
                    )}
                  </div>

                  {/* Hashtags Chips */}
                  {photo.tags && photo.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {photo.tags.map((tag, tIdx) => (
                        <button
                          key={tIdx}
                          type="button"
                          onClick={() => setSearchQuery(tag.replace('#', ''))}
                          className="text-[11px] font-medium text-amber-400/90 hover:text-amber-300 transition-colors"
                        >
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* GRID / MOSAIC VIEW */}
      {viewMode === 'grid' && filteredPhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredPhotos.map((photo, index) => {
            const isLiked = likedPhotoIds.includes(photo.id);
            const likesCount = getLikesCount(photo);

            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.25) }}
                onClick={() => setLightboxIndex(index)}
                className="group relative rounded-2xl overflow-hidden neu-card border border-white/5 aspect-square cursor-pointer bg-black/60 shadow-lg"
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Category Pill at top */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[9px] font-black text-amber-300 border border-amber-400/30">
                    {photo.category}
                  </span>
                </div>

                {/* Featured Badge */}
                {photo.featured && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="w-5 h-5 rounded-full bg-amber-400/90 flex items-center justify-center text-black">
                      <Sparkles className="w-3 h-3" />
                    </span>
                  </div>
                )}

                {/* Dark Hover Overlay with Meta & Like */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 z-10">
                  <p className="text-xs font-black text-white font-cinzel line-clamp-1">
                    {photo.title}
                  </p>
                  <p className="text-[10px] text-slate-300 truncate">
                    {photo.teamName || photo.jornada || 'Torneo Oficial'}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-red-400">
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500' : ''}`} />
                      <span>{likesCount}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {formatDate(photo.createdAt)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      <AnimatePresence>
        {currentLightboxPhoto && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 select-none"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top Bar */}
            <div 
              className="w-full max-w-5xl flex items-center justify-between px-2 py-2 text-white z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full neu-btn-gold text-black text-xs font-black">
                  {currentLightboxPhoto.category}
                </span>
                {currentLightboxPhoto.jornada && (
                  <span className="text-xs font-mono text-amber-300">
                    {currentLightboxPhoto.jornada}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  {lightboxIndex + 1} de {filteredPhotos.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleShareWhatsApp(currentLightboxPhoto, e)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                <a
                  href={currentLightboxPhoto.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-xl neu-btn-dark text-slate-300 hover:text-white transition-colors"
                  title="Abrir imagen en alta resolución"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="p-2 rounded-xl neu-btn-dark text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Cerrar (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Central Stage with Next / Prev Controls */}
            <div 
              className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-2 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Prev Button */}
              {filteredPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-2 sm:left-4 z-20 w-11 h-11 rounded-2xl bg-black/60 hover:bg-black/90 text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                  title="Anterior (Flecha izquierda)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Main Lightbox Photo */}
              <motion.img
                key={currentLightboxPhoto.id}
                src={currentLightboxPhoto.imageUrl}
                alt={currentLightboxPhoto.title}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                onDoubleClick={() => handleDoubleTap(currentLightboxPhoto.id)}
                className="max-h-[72vh] max-w-full object-contain rounded-2xl shadow-2xl cursor-pointer"
              />

              {/* Next Button */}
              {filteredPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-2 sm:right-4 z-20 w-11 h-11 rounded-2xl bg-black/60 hover:bg-black/90 text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                  title="Siguiente (Flecha derecha)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom Caption Drawer */}
            <div 
              className="w-full max-w-3xl rounded-2xl neu-card p-4 border border-white/10 bg-[#12131F]/90 backdrop-blur-md space-y-2 z-20 mb-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black font-cinzel text-white">
                    {currentLightboxPhoto.title}
                  </h3>
                  {currentLightboxPhoto.teamName && (
                    <span className="text-xs text-amber-300 font-bold">
                      {currentLightboxPhoto.teamName}
                    </span>
                  )}
                </div>

                {/* Like Button inside Lightbox */}
                <button
                  type="button"
                  onClick={(e) => handleLike(currentLightboxPhoto.id, e)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    likedPhotoIds.includes(currentLightboxPhoto.id)
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'neu-pressed text-slate-300 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${likedPhotoIds.includes(currentLightboxPhoto.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  <span className="font-mono font-black">{getLikesCount(currentLightboxPhoto)}</span>
                </button>
              </div>

              {currentLightboxPhoto.caption && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentLightboxPhoto.caption}
                </p>
              )}

              {/* Tags */}
              {currentLightboxPhoto.tags && currentLightboxPhoto.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {currentLightboxPhoto.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
