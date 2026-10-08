import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { TournamentMatch, Academy, Player, TOURNAMENT_CATEGORIES, TournamentCategory, MATCH_STAGES, MatchStage } from '../types';
import { NavPage } from '../components/Navbar';
import { Trophy, Flame, Calendar, MapPin, Award, Users, Shield, Star, ChevronRight, Activity, Filter, CheckCircle, Sparkles } from 'lucide-react';

interface TournamentViewProps {
  matches: TournamentMatch[];
  academies: Academy[];
  players: Player[];
  onSelectMatch?: (match: TournamentMatch) => void;
  onNavigate?: (page: NavPage) => void;
}

export const TournamentView: React.FC<TournamentViewProps> = ({
  matches,
  academies,
  players,
  onSelectMatch,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'scorers' | 'academies'>('matches');
  
  // Standings state
  const [standingsCategory, setStandingsCategory] = useState<'all' | TournamentCategory>('all');

  // Match filters state
  const [matchStatusFilter, setMatchStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');
  const [matchCategoryFilter, setMatchCategoryFilter] = useState<'all' | TournamentCategory>('all');
  const [matchStageFilter, setMatchStageFilter] = useState<'all' | MatchStage>('all');

  // Scorers & Academies filters
  const [scorerCategoryFilter, setScorerCategoryFilter] = useState<'all' | TournamentCategory>('all');
  const [academyCategoryFilter, setAcademyCategoryFilter] = useState<'all' | TournamentCategory>('all');

  const liveMatch = matches.find(m => m.status === 'live');

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      // Status filter
      if (matchStatusFilter !== 'all' && m.status !== matchStatusFilter) return false;
      // Category filter
      if (matchCategoryFilter !== 'all') {
        const matchCat = m.category || 'Sub-15';
        if (matchCat !== matchCategoryFilter) return false;
      }
      // Stage filter
      if (matchStageFilter !== 'all') {
        const stage = m.stage || m.phase;
        if (stage !== matchStageFilter && !stage.includes(matchStageFilter)) return false;
      }
      return true;
    });
  }, [matches, matchStatusFilter, matchCategoryFilter, matchStageFilter]);

  // Filtered top scorers
  const filteredScorers = useMemo(() => {
    const list = scorerCategoryFilter === 'all'
      ? players
      : players.filter(p => (p.category || 'Sub-15') === scorerCategoryFilter);
    return [...list].sort((a, b) => b.goals - a.goals);
  }, [players, scorerCategoryFilter]);

  // Filtered academies for academies tab
  const filteredAcademies = useMemo(() => {
    if (academyCategoryFilter === 'all') return academies;
    return academies.filter(acad => {
      const cats = (acad.categories && acad.categories.length > 0) ? acad.categories : [acad.category || 'Sub-15'];
      return cats.includes(academyCategoryFilter);
    });
  }, [academies, academyCategoryFilter]);

  // Helper to get academies for a specific category, sorted by points & goal difference
  const getStandingsForCategory = (cat: TournamentCategory) => {
    const matching = academies.filter(acad => {
      const cats = (acad.categories && acad.categories.length > 0) ? acad.categories : [acad.category || 'Sub-15'];
      return cats.includes(cat);
    });

    return [...matching].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const diffB = b.goalsFor - b.goalsAgainst;
      const diffA = a.goalsFor - a.goalsAgainst;
      if (diffB !== diffA) return diffB - diffA;
      return b.goalsFor - a.goalsFor;
    });
  };

  // Stage badge color helper
  const getStageBadgeColor = (stage?: string) => {
    if (!stage) return 'bg-slate-800 text-slate-300 border-slate-700';
    if (stage.includes('Gran Final')) return 'bg-amber-400/20 text-amber-300 border-amber-400/40';
    if (stage.includes('Semifinal')) return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    if (stage.includes('Cuartos')) return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    if (stage.includes('Octavos')) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  };

  // Render a standings table for a specific category
  const renderCategoryStandingsTable = (category: TournamentCategory) => {
    const list = getStandingsForCategory(category);

    return (
      <div key={category} className="rounded-3xl neu-card overflow-hidden shadow-2xl space-y-0">
        {/* Table Header with Category Banner */}
        <div className="px-5 sm:px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#171926] via-[#12141f] to-[#171926] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl neu-btn-gold text-black font-black text-xs tracking-wider uppercase">
              {category}
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black font-cinzel text-white flex items-center gap-2">
                <span>Tabla Oficial de Posiciones</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {list.length} {list.length === 1 ? 'club registrado' : 'clubes en competencia'} en Categoría {category}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-amber-300 hud-badge px-3 py-1 rounded-full uppercase tracking-wider">
              Sistema Puntos (PG×3 + PE)
            </span>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <Shield className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-semibold text-white">No hay academias registradas aún en {category}</p>
            <p className="text-slate-500">Inscribe o asigna esta categoría a las academias desde el Panel de Control Administrativo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4 text-center">Pos</th>
                  <th className="py-3.5 px-4">Club / Academia</th>
                  <th className="py-3.5 px-3 text-center">PJ</th>
                  <th className="py-3.5 px-3 text-center">PG</th>
                  <th className="py-3.5 px-3 text-center">PE</th>
                  <th className="py-3.5 px-3 text-center">PP</th>
                  <th className="py-3.5 px-3 text-center">GF</th>
                  <th className="py-3.5 px-3 text-center">GC</th>
                  <th className="py-3.5 px-3 text-center">DG</th>
                  <th className="py-3.5 px-4 text-center font-black text-amber-300">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {list.map((acad, idx) => {
                  const dg = acad.goalsFor - acad.goalsAgainst;
                  const isTopTwo = idx < 2;
                  return (
                    <tr
                      key={acad.id}
                      className={`hover:bg-white/5 transition-colors ${
                        isTopTwo ? 'bg-amber-400/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl text-xs ${
                          idx === 0 ? 'neu-btn-gold text-black font-black' :
                          idx === 1 ? 'bg-slate-300 text-black font-black neu-card' :
                          idx === 2 ? 'bg-amber-800 text-white font-black neu-card' :
                          'neu-pressed text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl neu-card p-1 flex items-center justify-center shrink-0 border border-amber-400/30">
                          <img src={acad.logo} alt={acad.name} className="w-full h-full object-contain rounded" />
                        </div>
                        <div>
                          <span className="font-extrabold">{acad.name}</span>
                          <span className="block text-[10px] text-slate-400 font-normal">{acad.city}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-300 font-mono">{acad.played}</td>
                      <td className="py-3.5 px-3 text-center text-emerald-400 font-mono font-bold">{acad.won}</td>
                      <td className="py-3.5 px-3 text-center text-slate-300 font-mono">{acad.drawn}</td>
                      <td className="py-3.5 px-3 text-center text-red-400 font-mono">{acad.lost}</td>
                      <td className="py-3.5 px-3 text-center text-slate-300 font-mono">{acad.goalsFor}</td>
                      <td className="py-3.5 px-3 text-center text-slate-300 font-mono">{acad.goalsAgainst}</td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-200">
                        {dg > 0 ? `+${dg}` : dg}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black font-cinzel text-amber-300 text-base">
                        {acad.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3.5 bg-black/40 border-t border-white/5 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            1° y 2° Lugar clasifican a rondas finales de {category}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            Fase regular / reclasificación
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Tournament Top Banner - Neo-Futuristic Dribbble */}
      <div className="relative rounded-3xl neu-card-gold cyber-grid p-6 sm:p-12 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 inset-x-0 h-px hologram-line" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neu-pressed text-amber-300 text-xs font-bold uppercase tracking-widest">
              <Trophy className="w-4 h-4 text-[#D4AF37]" />
              <span>EDICIÓN NACIONAL 2026 • FÚTBOL FORMATIVO Y ÉLITE</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white font-cinzel tracking-tight leading-none">
              TORNEO ÉLITE <span className="bg-gradient-to-r from-[#FFF2B2] via-[#D4AF37] to-[#AA7C11] bg-clip-text text-transparent">EMILIATEX</span>
            </h1>
            <p className="text-xs sm:text-base text-slate-300 leading-relaxed">
              El certamen deportivo de mayor nivel formativo con las mejores academias del país. Seguimiento de marcadores en tiempo real, tablas divididas por categoría, estadísticas de goleadores y fixture oficial.
            </p>

            {/* Allowed Categories Banner */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-bold text-slate-400">Categorías:</span>
              {TOURNAMENT_CATEGORIES.map(cat => (
                <span key={cat} className="px-2.5 py-1 rounded-xl neu-pressed text-amber-300 font-bold text-xs border border-[#D4AF37]/30">
                  {cat}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                <span>Complejo Deportivo Metropolitano</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#D4AF37]" />
                <span>Torneo Oficial en Desarrollo</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Award className="w-4 h-4" />
                <span>Dotación Deportiva EMILIATEX</span>
              </div>
            </div>

            {/* Main Action: Quiniela EMILIATEX C.A */}
            {onNavigate && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('quiniela')}
                  className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-2xl neu-btn-gold text-black font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                >
                  <Trophy className="w-5 h-5 text-black" />
                  <span>Quiniela EMILIATEX C.A</span>
                  <span className="px-2 py-0.5 rounded-full bg-black text-amber-300 text-[10px] font-mono font-bold">
                    SUMA PUNTOS
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Match Live Status Box */}
          {liveMatch ? (
            <div 
              onClick={() => onSelectMatch?.(liveMatch)}
              className="w-full lg:w-auto p-5 rounded-2xl neu-card-gold ring-1 ring-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.25)] space-y-3 shrink-0 cursor-pointer group transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  EN VIVO • {liveMatch.category || 'Sub-15'} • {liveMatch.liveMinute}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectMatch) {
                      onSelectMatch(liveMatch);
                    } else {
                      setActiveTab('matches');
                    }
                  }}
                  className="px-2.5 py-1 rounded-md bg-red-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-red-600 transition-colors cursor-pointer"
                >
                  <Activity className="w-3 h-3" />
                  <span>Ficha Táctica</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-6 text-center p-3 rounded-xl neu-pressed">
                <div className="flex flex-col items-center">
                  <img src={liveMatch.homeLogo} alt={liveMatch.homeAcademyName} className="w-10 h-10 rounded-full object-cover border border-amber-400/40" />
                  <span className="text-xs font-bold text-white mt-1 max-w-[90px] truncate">{liveMatch.homeAcademyName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black font-cinzel text-white">{liveMatch.homeScore}</span>
                  <span className="text-sm font-bold text-slate-500">:</span>
                  <span className="text-2xl font-black font-cinzel text-white">{liveMatch.awayScore}</span>
                </div>
                <div className="flex flex-col items-center">
                  <img src={liveMatch.awayLogo} alt={liveMatch.awayAcademyName} className="w-10 h-10 rounded-full object-cover border border-amber-400/40" />
                  <span className="text-xs font-bold text-white mt-1 max-w-[90px] truncate">{liveMatch.awayAcademyName}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl neu-card text-center space-y-2 shrink-0 border border-[#D4AF37]/30">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-300">
                <Calendar className="w-4 h-4 text-[#D4AF37]" />
                <span>Próxima Jornada Oficial</span>
              </div>
              <p className="text-xs text-slate-300">Cancha Principal • Categorías Sub-7 a Sub-15</p>
              <button
                onClick={() => setActiveTab('matches')}
                className="w-full py-2.5 px-4 rounded-xl neu-btn-gold text-black font-black text-xs cursor-pointer"
              >
                Ver Fixture de Partidos
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Quiniela EMILIATEX C.A Spotlight Banner */}
      {onNavigate && (
        <div className="rounded-3xl neu-card p-5 sm:p-6 border border-amber-400/40 bg-gradient-to-r from-[#181924] via-[#241F14] to-[#181924] flex flex-col md:flex-row items-center justify-between gap-5 shadow-xl">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl neu-btn-gold text-black flex items-center justify-center shrink-0 shadow-lg border border-white/20">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-base sm:text-lg font-black font-cinzel text-white">
                  ¿Acertarás los resultados de la fecha?
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider font-mono">
                  +5 PTS EXACTO • +2 PTS GANADOR
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Participa gratis en la Quiniela oficial de EMILIATEX C.A, pronostica los partidos y acumula puntos en la tabla general.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('quiniela')}
            className="w-full md:w-auto px-6 py-3 rounded-xl neu-btn-gold text-black font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shrink-0 cursor-pointer shadow-lg hover:brightness-110 active:scale-98 transition-all"
          >
            <Trophy className="w-4 h-4 text-black" />
            <span>Quiniela EMILIATEX C.A</span>
            <ChevronRight className="w-4 h-4 text-black" />
          </button>
        </div>
      )}

      {/* Primary Sub Navigation Tabs - Neumorphic Pill Dock */}
      <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto no-scrollbar scroll-smooth -mx-3 px-3 sm:mx-0 sm:px-0 pb-2">
        {onNavigate && (
          <button
            onClick={() => onNavigate('quiniela')}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black neu-btn-gold text-black shadow-md cursor-pointer transition-transform hover:scale-105"
          >
            <Trophy className="w-4 h-4 text-black" />
            <span>Quiniela EMILIATEX C.A</span>
            <span className="w-2 h-2 rounded-full bg-black animate-ping" />
          </button>
        )}

        <button
          onClick={() => setActiveTab('standings')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'standings'
              ? 'neu-btn-gold text-black'
              : 'neu-btn-dark text-slate-300 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="sm:hidden">Posiciones</span>
          <span className="hidden sm:inline">Tablas de Posiciones por Categoría</span>
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'matches'
              ? 'neu-btn-gold text-black'
              : 'neu-btn-dark text-slate-300 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="sm:hidden">Partidos ({matches.length})</span>
          <span className="hidden sm:inline">Partidos & Fixture ({matches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('scorers')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'scorers'
              ? 'neu-btn-gold text-black'
              : 'neu-btn-dark text-slate-300 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400" />
          <span className="sm:hidden">Goleadores ({players.length})</span>
          <span className="hidden sm:inline">Goleadores & Figuras ({players.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('academies')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'academies'
              ? 'neu-btn-gold text-black'
              : 'neu-btn-dark text-slate-300 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span className="sm:hidden">Clubes ({academies.length})</span>
          <span className="hidden sm:inline">Academias ({academies.length})</span>
        </button>
      </div>

      {/* TAB 1: STANDINGS TABLES DIVIDED BY CATEGORY */}
      {activeTab === 'standings' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="p-3 sm:p-4 rounded-2xl neu-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Filter className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-extrabold text-white uppercase text-[11px] tracking-wider">Filtrar Categoría:</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap">
              <button
                onClick={() => setStandingsCategory('all')}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  standingsCategory === 'all'
                    ? 'neu-btn-gold text-black'
                    : 'neu-pressed text-slate-400 hover:text-white'
                }`}
              >
                Todas las Categorías
              </button>

              {TOURNAMENT_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setStandingsCategory(cat)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    standingsCategory === cat
                      ? 'neu-btn-gold text-black'
                      : 'neu-pressed text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Render Standings: Either All Category Tables stacked, or single chosen Category */}
          {standingsCategory === 'all' ? (
            <div className="space-y-8">
              {TOURNAMENT_CATEGORIES.map(cat => renderCategoryStandingsTable(cat))}
            </div>
          ) : (
            <div>
              {renderCategoryStandingsTable(standingsCategory)}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MATCHES & FIXTURE */}
      {activeTab === 'matches' && (
        <div className="space-y-6">
          {/* Match Multi-Level Filters */}
          <div className="p-4 sm:p-5 rounded-3xl neu-card space-y-4">
            {/* Status Filter */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado de los Partidos:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'live', label: 'En Vivo' },
                  { id: 'upcoming', label: 'Próximos' },
                  { id: 'finished', label: 'Finalizados' },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setMatchStatusFilter(filter.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      matchStatusFilter === filter.id
                        ? 'neu-pressed-gold text-[#D4AF37]'
                        : 'neu-card text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category & Stage Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 shrink-0">Categoría:</span>
                <select
                  value={matchCategoryFilter}
                  onChange={e => setMatchCategoryFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl neu-pressed text-amber-300 text-xs font-bold focus:border-[#D4AF37] focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#0e1017]">Todas las Categorías (Sub-7 a Sub-15)</option>
                  {TOURNAMENT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-[#0e1017]">{cat}</option>
                  ))}
                </select>
              </div>

              {/* Stage Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 shrink-0">Fase:</span>
                <select
                  value={matchStageFilter}
                  onChange={e => setMatchStageFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl neu-pressed text-white text-xs font-bold focus:border-[#D4AF37] focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#0e1017]">Todas las Fases (Grupos a Final)</option>
                  {MATCH_STAGES.map(stg => (
                    <option key={stg} value={stg} className="bg-[#0e1017]">{stg}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="p-12 text-center rounded-3xl neu-card text-slate-400 text-xs space-y-2">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-bold text-white font-cinzel">No se encontraron partidos con los filtros seleccionados</p>
              <p className="text-slate-500">Prueba cambiando la categoría, fase o estado del partido.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredMatches.map((match, idx) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(idx * 0.05, 0.3),
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => onSelectMatch?.(match)}
                  className={`rounded-3xl p-5 sm:p-6 transition-all cursor-pointer group hover:border-[#D4AF37]/60 ${
                    match.status === 'live'
                      ? 'neu-card-gold ring-1 ring-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.2)]'
                      : 'neu-card'
                  }`}
                >
                    {/* Top Bar: Category & Stage Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg neu-pressed text-amber-300 font-black text-[10px] uppercase border border-[#D4AF37]/30">
                          {match.category || 'Sub-15'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${getStageBadgeColor(match.stage || match.phase)}`}>
                          {match.stage || match.phase}
                        </span>
                      </div>

                      {match.status === 'live' ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-500 text-white font-black text-[10px] uppercase flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          EN VIVO • {match.liveMinute}
                        </span>
                      ) : match.status === 'finished' ? (
                        <span className="px-2.5 py-1 rounded-xl neu-pressed text-emerald-400 text-[10px] font-bold">
                          FINALIZADO
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl neu-pressed text-amber-300 text-[10px] font-bold">
                          {match.date} • {match.time}
                        </span>
                      )}
                    </div>

                    {/* Teams & Score Display */}
                    <div className="py-5 grid grid-cols-7 items-center">
                      {/* Home Team */}
                      <div className="col-span-3 flex flex-col items-center text-center space-y-2">
                        <div className="w-14 h-14 rounded-2xl neu-card p-1.5 flex items-center justify-center border border-amber-400/30 group-hover:scale-105 transition-transform">
                          <img
                            src={match.homeLogo}
                            alt={match.homeAcademyName}
                            className="w-full h-full object-contain rounded-xl"
                          />
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-white leading-tight line-clamp-2">
                          {match.homeAcademyName}
                        </span>
                      </div>

                      {/* Score or VS */}
                      <div className="col-span-1 flex flex-col items-center justify-center">
                        {match.status === 'upcoming' ? (
                          <span className="px-2.5 py-1 rounded-xl neu-pressed text-amber-400 font-black text-xs">
                            VS
                          </span>
                        ) : (
                          <div className="px-3 py-1.5 rounded-2xl neu-pressed flex items-center gap-2 font-cinzel text-xl sm:text-2xl font-black text-amber-300">
                            <span>{match.homeScore ?? 0}</span>
                            <span className="text-slate-500">:</span>
                            <span>{match.awayScore ?? 0}</span>
                          </div>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="col-span-3 flex flex-col items-center text-center space-y-2">
                        <div className="w-14 h-14 rounded-2xl neu-card p-1.5 flex items-center justify-center border border-amber-400/30 group-hover:scale-105 transition-transform">
                          <img
                            src={match.awayLogo}
                            alt={match.awayAcademyName}
                            className="w-full h-full object-contain rounded-xl"
                          />
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-white leading-tight line-clamp-2">
                          {match.awayAcademyName}
                        </span>
                      </div>
                    </div>

                    {/* Match Details Footer */}
                    <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="truncate">{match.stadium}</span>
                      </div>

                      {match.mvp && (
                        <div className="flex items-center gap-1 text-amber-300 font-bold text-[11px] px-2 py-0.5 rounded-lg neu-pressed">
                          <Star className="w-3 h-3 fill-current text-[#D4AF37]" />
                          <span>MVP: {match.mvp}</span>
                        </div>
                      )}

                      {match.status === 'live' && (
                        <span className="text-red-400 font-bold flex items-center gap-1.5 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                          <span>En disputa ahora</span>
                        </span>
                      )}
                    </div>

                    {/* Click CTA for Details & Lineups */}
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-[#D4AF37] font-extrabold group-hover:text-amber-200 flex items-center gap-1">
                        <span>Ficha Táctica, Incidencias & Alineaciones</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <span className="text-[10px] text-slate-400 neu-pressed px-2.5 py-1 rounded-lg">
                        {match.lineups?.homeStarters?.length ? 'Alineación disponible' : 'Ficha completa'}
                      </span>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TOP SCORERS & PLAYERS */}
      {activeTab === 'scorers' && (
        <div className="space-y-6">
          {/* Category Filter for Scorers */}
          <div className="p-4 rounded-2xl neu-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Filter className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-extrabold text-white uppercase text-[11px] tracking-wider">Goleadores por Categoría:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setScorerCategoryFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  scorerCategoryFilter === 'all'
                    ? 'neu-btn-gold text-black'
                    : 'neu-pressed text-slate-400 hover:text-white'
                }`}
              >
                Todas ({players.length})
              </button>

              {TOURNAMENT_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setScorerCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    scorerCategoryFilter === cat
                      ? 'neu-btn-gold text-black'
                      : 'neu-pressed text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredScorers.length === 0 ? (
            <div className="p-12 text-center rounded-3xl neu-card text-slate-400 text-xs">
              No hay jugadores registrados en la categoría {scorerCategoryFilter}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredScorers.map((player, idx) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(idx * 0.04, 0.25),
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="relative rounded-3xl neu-card p-5 space-y-4 transition-all hover:border-[#D4AF37]/50"
                >
                  {/* Ranking Medal */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase ${
                      idx === 0 ? 'neu-btn-gold text-black' :
                      idx === 1 ? 'bg-slate-300 text-black neu-card' :
                      'neu-pressed text-amber-400'
                    }`}>
                      {idx === 0 ? '🏆 Bota de Oro' : `#${idx + 1} Goleador`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg neu-pressed text-[#D4AF37] text-[10px] font-bold border border-[#D4AF37]/30">
                        {player.category || 'Sub-15'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Dorsal #{player.number}</span>
                    </div>
                  </div>

                  {/* Player Profile */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden neu-pressed p-1 shrink-0 border border-[#D4AF37]/60">
                      <img src={player.photo} alt={player.name} className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold text-white font-cinzel">{player.name}</h4>
                      <p className="text-xs text-amber-300 font-medium">{player.academyName}</p>
                      <span className="inline-block text-[10px] font-semibold text-slate-400 neu-pressed px-2.5 py-0.5 rounded-lg">
                        {player.position}
                      </span>
                    </div>
                  </div>

                  {/* Stats Breakdown */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                    <div className="p-2.5 rounded-xl neu-pressed">
                      <span className="block text-xl font-black font-cinzel text-amber-300">{player.goals}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Goles</span>
                    </div>
                    <div className="p-2.5 rounded-xl neu-pressed">
                      <span className="block text-xl font-black font-cinzel text-white">{player.assists}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Asistencias</span>
                    </div>
                    <div className="p-2.5 rounded-xl neu-pressed">
                      <span className="block text-xl font-black font-cinzel text-[#D4AF37]">{player.mvpCount}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">MVP</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACADEMIES */}
      {activeTab === 'academies' && (
        <div className="space-y-6">
          {/* Category Filter for Academies */}
          <div className="p-4 rounded-2xl neu-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Filter className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-extrabold text-white uppercase text-[11px] tracking-wider">Filtrar por Categoría Inscrita:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setAcademyCategoryFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  academyCategoryFilter === 'all'
                    ? 'neu-btn-gold text-black'
                    : 'neu-pressed text-slate-400 hover:text-white'
                }`}
              >
                Todas ({academies.length})
              </button>

              {TOURNAMENT_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setAcademyCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    academyCategoryFilter === cat
                      ? 'neu-btn-gold text-black'
                      : 'neu-pressed text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAcademies.map((acad, idx) => (
              <motion.div
                key={acad.id}
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(idx * 0.04, 0.25),
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="rounded-3xl neu-card p-6 space-y-4 transition-all hover:border-[#D4AF37]/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl neu-card p-1.5 flex items-center justify-center border border-amber-400/30 shrink-0">
                    <img
                      src={acad.logo}
                      alt={acad.name}
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white font-cinzel">{acad.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{acad.city}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300 pt-3 border-t border-white/5">
                  <div className="flex justify-between px-3 py-2 rounded-xl neu-pressed">
                    <span className="text-slate-400">Director Técnico:</span>
                    <span className="font-extrabold text-white">{acad.coach}</span>
                  </div>
                  <div className="flex justify-between px-3 py-2 rounded-xl neu-pressed">
                    <span className="text-slate-400">Puntaje Oficial:</span>
                    <span className="font-black text-amber-300 font-cinzel text-sm">{acad.points} PTS</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-400 block mb-1 text-[11px] font-bold uppercase tracking-wider">Categorías Inscritas:</span>
                    <div className="flex flex-wrap gap-1">
                      {(acad.categories && acad.categories.length > 0 ? acad.categories : [acad.category || 'Sub-15']).map(cat => (
                        <span key={cat} className="px-2.5 py-1 rounded-lg neu-pressed text-[#D4AF37] text-[10px] font-bold border border-[#D4AF37]/20">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
