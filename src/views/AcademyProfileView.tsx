import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Academy, Player, TournamentMatch, TOURNAMENT_CATEGORIES, TournamentCategory } from '../types';
import { 
  ArrowLeft, 
  Shield, 
  MapPin, 
  UserCheck, 
  Calendar, 
  Trophy, 
  Flame, 
  Star, 
  Search, 
  Filter, 
  Award, 
  Activity, 
  Share2, 
  CheckCircle, 
  ExternalLink,
  ChevronRight,
  Users,
  Clock,
  Sparkles,
  X
} from 'lucide-react';

interface AcademyProfileViewProps {
  academy: Academy;
  allAcademies: Academy[];
  players: Player[];
  matches: TournamentMatch[];
  onBack: () => void;
  onSelectPlayer?: (player: Player) => void;
  onSelectMatch?: (match: TournamentMatch) => void;
  onSelectAcademy?: (academy: Academy) => void;
}

export const AcademyProfileView: React.FC<AcademyProfileViewProps> = ({
  academy,
  allAcademies,
  players,
  matches,
  onBack,
  onSelectMatch,
  onSelectAcademy
}) => {
  // Categories available for this academy
  const availableCategories = useMemo(() => {
    if (academy.categories && academy.categories.length > 0) {
      return academy.categories;
    }
    return [academy.category || 'Sub-15'];
  }, [academy]);

  // Selected category state - default to first available category
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return availableCategories[0] || 'Sub-15';
  });

  // Search and position filter in gallery
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<'all' | 'Portero' | 'Defensa' | 'Centrocampista' | 'Delantero'>('all');
  const [sortBy, setSortBy] = useState<'number' | 'goals' | 'assists' | 'mvp' | 'name'>('number');
  
  // Active player for detail modal
  const [selectedPlayerModal, setSelectedPlayerModal] = useState<Player | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // All players for this academy
  const academyPlayers = useMemo(() => {
    return players.filter(p => p.academyId === academy.id || p.academyName === academy.name);
  }, [players, academy]);

  // Filter players by selected category
  const categoryPlayers = useMemo(() => {
    if (selectedCategory === 'all') return academyPlayers;
    return academyPlayers.filter(p => (p.category || 'Sub-15') === selectedCategory);
  }, [academyPlayers, selectedCategory]);

  // Further filter by search, position, and sort
  const filteredAndSortedPlayers = useMemo(() => {
    let result = categoryPlayers.filter(p => {
      const matchSearch = searchQuery.trim() === '' || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.number).includes(searchQuery.trim());
      
      const matchPos = positionFilter === 'all' || p.position === positionFilter;
      return matchSearch && matchPos;
    });

    result.sort((a, b) => {
      if (sortBy === 'goals') return b.goals - a.goals;
      if (sortBy === 'assists') return b.assists - a.assists;
      if (sortBy === 'mvp') return b.mvpCount - a.mvpCount;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.number - b.number;
    });

    return result;
  }, [categoryPlayers, searchQuery, positionFilter, sortBy]);

  // Matches involving this academy
  const academyMatches = useMemo(() => {
    return matches.filter(m => 
      m.homeAcademyId === academy.id || 
      m.awayAcademyId === academy.id ||
      m.homeAcademyName === academy.name ||
      m.awayAcademyName === academy.name
    );
  }, [matches, academy]);

  // Share profile handler
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  // Helper for position badges
  const getPositionBadge = (pos: string) => {
    switch (pos) {
      case 'Portero':
        return { text: 'POR', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'Defensa':
        return { text: 'DEF', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'Centrocampista':
        return { text: 'MED', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'Delantero':
        return { text: 'DEL', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      default:
        return { text: pos.slice(0, 3).toUpperCase(), bg: 'bg-slate-500/20 text-slate-300 border-slate-500/40' };
    }
  };

  // Fallback player portrait generator if photo fails to load
  const getPlayerInitial = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl neu-btn text-xs sm:text-sm font-bold text-slate-200 hover:text-white transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 text-[#D4AF37] group-hover:-translate-x-1 transition-transform" />
          <span>Volver al Listado de Academias</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl neu-btn text-xs font-bold text-amber-400 hover:text-amber-300 transition-all cursor-pointer"
            title="Compartir perfil"
          >
            {copySuccess ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">¡Enlace copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compartir</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* HERO BANNER: ACADEMY OFFICIAL PROFILE */}
      <div className="relative rounded-3xl neu-card-gold p-6 sm:p-8 overflow-hidden border border-[#D4AF37]/50 shadow-2xl">
        {/* Ambient subtle glow based on academy color */}
        <div 
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: academy.primaryColor || '#D4AF37' }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
          {/* Big Official Shield / Logo */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl neu-card p-3 flex items-center justify-center border-2 border-[#D4AF37]/60 shadow-2xl bg-black/40 backdrop-blur-md">
              <img
                src={academy.logo}
                alt={academy.name}
                className="w-full h-full object-contain drop-shadow-md rounded-2xl"
              />
            </div>
            {academy.acronym && (
              <span className="absolute -bottom-2 -right-2 px-3 py-1 rounded-xl neu-btn-gold text-black font-cinzel font-black text-xs shadow-lg tracking-wider border border-black/30">
                {academy.acronym}
              </span>
            )}
          </div>

          {/* Academy Info & Details */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full neu-pressed text-[#D4AF37] font-mono text-xs font-bold uppercase tracking-wider border border-[#D4AF37]/30">
                Club Deportivo Oficial
              </span>
              {academy.foundationYear && (
                <span className="px-3 py-1 rounded-full neu-pressed text-slate-300 font-mono text-xs">
                  Fundación: {academy.foundationYear}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-cinzel text-white tracking-tight drop-shadow-sm">
              {academy.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs sm:text-sm text-slate-300 pt-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{academy.city}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <UserCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="text-slate-400">DT:</span>
                <span className="font-bold text-white">{academy.coach}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Users className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-white">{academyPlayers.length}</span>
                <span className="text-slate-400">jugadores inscritos</span>
              </div>
            </div>

            {/* Official Categories Participated */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Categorías:</span>
              {availableCategories.map(cat => (
                <span
                  key={cat}
                  className="px-2.5 py-0.5 rounded-lg neu-pressed text-amber-300 text-xs font-bold border border-amber-400/20"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Official Standings Quick Strip */}
          <div className="w-full md:w-auto shrink-0 bg-black/40 rounded-3xl p-4 sm:p-5 border border-white/10 space-y-3 backdrop-blur-md">
            <div className="text-center md:text-right">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Puntaje en Torneo</span>
              <div className="flex items-baseline justify-center md:justify-end gap-1.5">
                <span className="text-3xl sm:text-4xl font-black font-cinzel text-amber-300">{academy.points}</span>
                <span className="text-xs font-bold text-amber-400/80">PTS</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2 border-t border-white/10">
              <div className="p-1.5 rounded-xl neu-pressed">
                <span className="block font-black text-white font-mono">{academy.played}</span>
                <span className="text-[9px] text-slate-400 uppercase font-bold">PJ</span>
              </div>
              <div className="p-1.5 rounded-xl neu-pressed">
                <span className="block font-black text-emerald-400 font-mono">{academy.won}</span>
                <span className="text-[9px] text-slate-400 uppercase font-bold">PG</span>
              </div>
              <div className="p-1.5 rounded-xl neu-pressed">
                <span className="block font-black text-amber-400 font-mono">{academy.drawn}</span>
                <span className="text-[9px] text-slate-400 uppercase font-bold">PE</span>
              </div>
              <div className="p-1.5 rounded-xl neu-pressed">
                <span className="block font-black text-rose-400 font-mono">{academy.lost}</span>
                <span className="text-[9px] text-slate-400 uppercase font-bold">PP</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 px-1 pt-1 font-mono">
              <span>Goles: <strong className="text-white">{academy.goalsFor}</strong> / <strong className="text-rose-300">{academy.goalsAgainst}</strong></span>
              <span>DIF: <strong className={academy.goalsFor - academy.goalsAgainst >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {academy.goalsFor - academy.goalsAgainst > 0 ? `+${academy.goalsFor - academy.goalsAgainst}` : academy.goalsFor - academy.goalsAgainst}
              </strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY SELECTOR TABS: Central interactive hub requested by user */}
      <div className="rounded-3xl neu-card p-4 sm:p-5 space-y-3 border border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider">
              Seleccionar Categoría del Plantel
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Explora la nómina oficial y los perfiles de los jugadores por categoría
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth -mx-2 px-2 sm:mx-0 sm:px-0 flex-nowrap sm:flex-wrap pt-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'neu-btn-gold text-black shadow-lg scale-105'
                : 'neu-pressed text-slate-300 hover:text-white'
            }`}
          >
            <span>Todos los Planteles</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
              selectedCategory === 'all' ? 'bg-black/20 text-black' : 'bg-white/10 text-amber-400'
            }`}>
              {academyPlayers.length}
            </span>
          </button>

          {availableCategories.map(cat => {
            const countInCat = academyPlayers.filter(p => (p.category || 'Sub-15') === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'neu-btn-gold text-black shadow-lg scale-105'
                    : 'neu-pressed text-slate-300 hover:text-white'
                }`}
              >
                <span>{cat}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                  isSelected ? 'bg-black/20 text-black' : 'bg-white/10 text-amber-400'
                }`}>
                  {countInCat}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PLAYER GALLERY SECTION ("Galería con los Jugadores") */}
      <div className="space-y-4">
        {/* Controls Bar: Search, Position Filter, Sort */}
        <div className="rounded-3xl neu-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-white/5">
          {/* Title and Category indicator */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-pressed-gold text-[#D4AF37] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black font-cinzel text-white flex items-center gap-2">
                <span>Galería de Jugadores</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono text-xs font-bold">
                  {selectedCategory === 'all' ? 'Plantel General' : selectedCategory}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Mostrando {filteredAndSortedPlayers.length} de {categoryPlayers.length} jugadores inscritos
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o dorsal..."
                className="w-full pl-10 pr-4 py-2 rounded-2xl neu-input text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Position Filter */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {(['all', 'Portero', 'Defensa', 'Centrocampista', 'Delantero'] as const).map(pos => (
                <button
                  key={pos}
                  onClick={() => setPositionFilter(pos)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    positionFilter === pos
                      ? 'neu-btn-gold text-black'
                      : 'neu-pressed text-slate-400 hover:text-white'
                  }`}
                >
                  {pos === 'all' ? 'Todos' : pos}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-2xl neu-input text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
            >
              <option value="number" className="bg-[#12131A] text-white">Ordenar por Dorsal #</option>
              <option value="goals" className="bg-[#12131A] text-white">Más Goles</option>
              <option value="assists" className="bg-[#12131A] text-white">Más Asistencias</option>
              <option value="mvp" className="bg-[#12131A] text-white">Más Premios MVP</option>
              <option value="name" className="bg-[#12131A] text-white">Nombre A-Z</option>
            </select>
          </div>
        </div>

        {/* THE GALLERY GRID */}
        {filteredAndSortedPlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredAndSortedPlayers.map((player, idx) => {
              const posBadge = getPositionBadge(player.position);
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                  whileHover={{ y: -4, transition: { duration: 0.18 } }}
                  onClick={() => setSelectedPlayerModal(player)}
                  className="group rounded-3xl neu-card overflow-hidden border border-white/5 hover:border-[#D4AF37]/60 transition-all cursor-pointer flex flex-col shadow-lg relative"
                >
                  {/* Top Bar inside card */}
                  <div className="p-3.5 pb-2 flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl neu-btn-gold text-black font-cinzel font-black text-sm flex items-center justify-center shadow-md">
                      #{player.number}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      {player.mvpCount > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{player.mvpCount} MVP</span>
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${posBadge.bg}`}>
                        {posBadge.text}
                      </span>
                    </div>
                  </div>

                  {/* Player Photo Frame */}
                  <div className="relative mx-4 my-2 aspect-[4/4] rounded-2xl overflow-hidden neu-pressed border border-white/10 group-hover:border-[#D4AF37]/40 transition-colors">
                    {player.photo ? (
                      <img
                        src={player.photo}
                        alt={player.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to placeholder avatar
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                    
                    {/* Fallback avatar if no photo */}
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-[#12131A] text-slate-400">
                      <span className="text-2xl font-black font-cinzel text-[#D4AF37]">
                        {getPlayerInitial(player.name)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono mt-1">Dorsal #{player.number}</span>
                    </div>

                    {/* Gradient Overlay for photo bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                    {/* Category pill on photo */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                      <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-amber-300 text-[10px] font-mono font-bold border border-white/10">
                        {player.category || 'Sub-15'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-slate-300 text-[10px] font-mono font-bold">
                        {player.position}
                      </span>
                    </div>
                  </div>

                  {/* Player Name and Quick Info */}
                  <div className="p-4 pt-2 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="text-sm font-black text-white font-cinzel group-hover:text-amber-300 transition-colors line-clamp-1">
                        {player.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">
                        {player.position}
                      </p>
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs pt-2 border-t border-white/5">
                      <div className="p-1.5 rounded-xl neu-pressed">
                        <span className="block font-black text-amber-300 font-cinzel text-sm">{player.goals}</span>
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Goles</span>
                      </div>
                      <div className="p-1.5 rounded-xl neu-pressed">
                        <span className="block font-black text-white font-cinzel text-sm">{player.assists}</span>
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Asist.</span>
                      </div>
                      <div className="p-1.5 rounded-xl neu-pressed">
                        <span className="block font-black text-slate-300 font-cinzel text-sm">{player.matchesPlayed || 0}</span>
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">PJ</span>
                      </div>
                    </div>

                    {/* View Profile CTA */}
                    <div className="w-full py-1.5 rounded-xl neu-pressed text-[11px] font-bold text-center text-amber-400 group-hover:text-black group-hover:bg-[#D4AF37] transition-all flex items-center justify-center gap-1">
                      <span>Ver Ficha Técnica</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Empty state for category */
          <div className="rounded-3xl neu-card p-10 text-center space-y-4 border border-dashed border-white/10">
            <div className="w-16 h-16 rounded-3xl neu-pressed text-[#D4AF37] flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black font-cinzel text-white">
                No hay jugadores registrados en {selectedCategory === 'all' ? 'esta academia' : selectedCategory}
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {searchQuery || positionFilter !== 'all' 
                  ? 'No se encontraron jugadores que coincidan con los filtros de búsqueda aplicados.' 
                  : `Aún no se han inscrito jugadores para la categoría ${selectedCategory} de ${academy.name}. Puedes inscribirlos desde el Panel Administrativo.`}
              </p>
            </div>
            {(searchQuery || positionFilter !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setPositionFilter('all'); }}
                className="px-4 py-2 rounded-2xl neu-btn-gold text-black text-xs font-bold cursor-pointer"
              >
                Limpiar Filtros de Búsqueda
              </button>
            )}
          </div>
        )}
      </div>

      {/* MATCHES & FIXTURE OF THE ACADEMY */}
      {academyMatches.length > 0 && (
        <div className="rounded-3xl neu-card p-6 space-y-4 border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-base sm:text-lg font-black font-cinzel text-white">
                Partidos & Fixture de {academy.name}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {academyMatches.length} partidos programados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {academyMatches.map(m => {
              const isHome = m.homeAcademyId === academy.id || m.homeAcademyName === academy.name;
              const isFinished = m.status === 'finished';
              const isLive = m.status === 'live';

              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMatch && onSelectMatch(m)}
                  className="rounded-2xl neu-card p-4 space-y-3 border border-white/5 hover:border-[#D4AF37]/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/5 pb-2">
                    <span className="font-mono text-amber-300 font-bold">{m.category || 'Sub-15'} • {m.phase}</span>
                    <div className="flex items-center gap-2">
                      {isLive && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold animate-pulse">
                          EN VIVO
                        </span>
                      )}
                      {isFinished && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          Finalizado
                        </span>
                      )}
                      {!isLive && !isFinished && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 text-[10px] font-bold">
                          Próximo
                        </span>
                      )}
                      <span>{m.date}</span>
                    </div>
                  </div>

                  {/* Teams and score */}
                  <div className="flex items-center justify-between gap-3">
                    {/* Home */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <img src={m.homeLogo} alt={m.homeAcademyName} className="w-8 h-8 rounded-xl object-contain neu-card p-1 shrink-0" />
                      <span className={`text-xs font-bold truncate ${isHome ? 'text-amber-300 font-black' : 'text-white'}`}>
                        {m.homeAcademyName}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="px-3 py-1.5 rounded-xl neu-pressed text-center font-cinzel font-black text-sm shrink-0">
                      {isFinished || isLive ? (
                        <span className="text-white">
                          <span className={isHome ? 'text-amber-300' : 'text-white'}>{m.homeScore ?? 0}</span>
                          {' - '}
                          <span className={!isHome ? 'text-amber-300' : 'text-white'}>{m.awayScore ?? 0}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-mono">{m.time || 'VS'}</span>
                      )}
                    </div>

                    {/* Away */}
                    <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0">
                      <span className={`text-xs font-bold truncate text-right ${!isHome ? 'text-amber-300 font-black' : 'text-white'}`}>
                        {m.awayAcademyName}
                      </span>
                      <img src={m.awayLogo} alt={m.awayAcademyName} className="w-8 h-8 rounded-xl object-contain neu-card p-1 shrink-0" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span className="truncate">{m.stadium}</span>
                    <span className="text-amber-400 group-hover:underline flex items-center gap-1">
                      <span>Ver detalles</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PLAYER MODAL (Ficha Técnica Oficial del Jugador) */}
      <AnimatePresence>
        {selectedPlayerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg rounded-3xl neu-card-gold p-6 sm:p-7 space-y-5 border border-[#D4AF37]/60 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPlayerModal(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-2xl neu-pressed text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Player Header in Modal */}
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl neu-card overflow-hidden border-2 border-amber-400/50 neu-pressed">
                    {selectedPlayerModal.photo ? (
                      <img
                        src={selectedPlayerModal.photo}
                        alt={selectedPlayerModal.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                        <span className="text-3xl font-black font-cinzel text-[#D4AF37]">
                          {getPlayerInitial(selectedPlayerModal.name)}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl neu-btn-gold text-black font-cinzel font-black text-sm flex items-center justify-center shadow-lg border border-black/30">
                    #{selectedPlayerModal.number}
                  </span>
                </div>

                <div className="space-y-1.5 flex-1 min-w-0 pr-6">
                  <span className="px-2.5 py-0.5 rounded-full neu-pressed text-amber-300 font-mono text-[10px] font-bold border border-amber-400/20">
                    {selectedPlayerModal.category || 'Sub-15'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black font-cinzel text-white tracking-tight">
                    {selectedPlayerModal.name}
                  </h3>
                  <p className="text-xs font-bold text-amber-400">
                    {selectedPlayerModal.position}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                    <img src={academy.logo} alt={academy.name} className="w-4 h-4 object-contain" />
                    <span className="font-semibold text-slate-300">{academy.name}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Stats Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Estadísticas Oficiales en el Torneo</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-2xl neu-pressed text-center">
                    <span className="block text-2xl font-black font-cinzel text-amber-300">
                      {selectedPlayerModal.goals}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Goles</span>
                  </div>
                  <div className="p-3 rounded-2xl neu-pressed text-center">
                    <span className="block text-2xl font-black font-cinzel text-white">
                      {selectedPlayerModal.assists}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Asistencias</span>
                  </div>
                  <div className="p-3 rounded-2xl neu-pressed text-center">
                    <span className="block text-2xl font-black font-cinzel text-[#D4AF37]">
                      {selectedPlayerModal.matchesPlayed || 0}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Partidos</span>
                  </div>
                  <div className="p-3 rounded-2xl neu-pressed text-center">
                    <span className="block text-2xl font-black font-cinzel text-amber-400">
                      {selectedPlayerModal.mvpCount || 0}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Premios MVP</span>
                  </div>
                </div>
              </div>

              {/* Disciplinary & Fair Play Data */}
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-3 rounded-2xl neu-pressed text-center border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Tarjetas Amarillas</span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    {selectedPlayerModal.yellowCards || 0}
                  </span>
                </div>
                <div className="p-3 rounded-2xl neu-pressed text-center border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Tarjetas Rojas</span>
                  <span className="text-base font-black text-rose-400 font-mono">
                    {selectedPlayerModal.redCards || 0}
                  </span>
                </div>
              </div>

              {/* Fair Play & Academy Badge */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-slate-300 font-medium">Torneo Formativo Oficial EMILIATEX</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                  Jugador Habilitado
                </span>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedPlayerModal(null)}
                  className="w-full py-2.5 rounded-2xl neu-btn-gold text-black text-xs font-black font-cinzel cursor-pointer hover:shadow-lg transition-all"
                >
                  Cerrar Ficha Técnica
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
