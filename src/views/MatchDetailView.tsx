import React, { useState } from 'react';
import { TournamentMatch, Academy, Player, MatchLineupPlayer, MatchEvent } from '../types';
import { 
  ArrowLeft, 
  Trophy, 
  MapPin, 
  Calendar, 
  Clock, 
  UserCheck, 
  Star, 
  Share2, 
  Shield, 
  Flame, 
  CheckCircle,
  FileText,
  Activity,
  Award
} from 'lucide-react';

interface MatchDetailViewProps {
  match: TournamentMatch;
  academies: Academy[];
  players: Player[];
  onBack: () => void;
  onSelectMatch?: (match: TournamentMatch) => void;
}

export const MatchDetailView: React.FC<MatchDetailViewProps> = ({
  match,
  academies,
  players,
  onBack,
  onSelectMatch
}) => {
  const [activeTab, setActiveTab] = useState<'lineups' | 'events' | 'info'>('lineups');
  const [copySuccess, setCopySuccess] = useState(false);

  const homeAcademy = academies.find(a => a.id === match.homeAcademyId);
  const awayAcademy = academies.find(a => a.id === match.awayAcademyId);

  // Home and away registered players in DB
  const homeDbPlayers = players.filter(p => p.academyId === match.homeAcademyId);
  const awayDbPlayers = players.filter(p => p.academyId === match.awayAcademyId);

  // Lineup starters & subs
  const homeStarters: MatchLineupPlayer[] = match.lineups?.homeStarters && match.lineups.homeStarters.length > 0
    ? match.lineups.homeStarters
    : homeDbPlayers.slice(0, 11).map(p => ({
        id: p.id,
        name: p.name,
        number: p.number,
        position: p.position,
        photo: p.photo,
        isStarter: true
      }));

  const homeSubs: MatchLineupPlayer[] = match.lineups?.homeSubstitutes && match.lineups.homeSubstitutes.length > 0
    ? match.lineups.homeSubstitutes
    : homeDbPlayers.slice(11).map(p => ({
        id: p.id,
        name: p.name,
        number: p.number,
        position: p.position,
        photo: p.photo,
        isStarter: false
      }));

  const awayStarters: MatchLineupPlayer[] = match.lineups?.awayStarters && match.lineups.awayStarters.length > 0
    ? match.lineups.awayStarters
    : awayDbPlayers.slice(0, 11).map(p => ({
        id: p.id,
        name: p.name,
        number: p.number,
        position: p.position,
        photo: p.photo,
        isStarter: true
      }));

  const awaySubs: MatchLineupPlayer[] = match.lineups?.awaySubstitutes && match.lineups.awaySubstitutes.length > 0
    ? match.lineups.awaySubstitutes
    : awayDbPlayers.slice(11).map(p => ({
        id: p.id,
        name: p.name,
        number: p.number,
        position: p.position,
        photo: p.photo,
        isStarter: false
      }));

  const hasLineupData = homeStarters.length > 0 || awayStarters.length > 0;

  const homeCoach = match.lineups?.homeCoach || homeAcademy?.coach || 'Cuerpo Técnico Oficial';
  const awayCoach = match.lineups?.awayCoach || awayAcademy?.coach || 'Cuerpo Técnico Oficial';

  const homeFormation = match.lineups?.homeFormation || (match.category === 'Sub-7' || match.category === 'Sub-9' ? '3-2-1' : '4-3-3');
  const awayFormation = match.lineups?.awayFormation || (match.category === 'Sub-7' || match.category === 'Sub-9' ? '3-2-1' : '4-4-2');

  const events: MatchEvent[] = match.events || [];

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}?page=match-detail&matchId=${match.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  // Group players by line for pitch visualization
  const groupPlayersByLine = (playersList: MatchLineupPlayer[]) => {
    const gk = playersList.filter(p => p.position.toLowerCase().includes('port') || p.position.toLowerCase().includes('arqu'));
    const df = playersList.filter(p => p.position.toLowerCase().includes('def'));
    const mf = playersList.filter(p => p.position.toLowerCase().includes('cen') || p.position.toLowerCase().includes('vol'));
    const fw = playersList.filter(p => p.position.toLowerCase().includes('del') || p.position.toLowerCase().includes('ata') || p.position.toLowerCase().includes('ext'));

    // If positions aren't explicitly typed, distribute evenly
    if (gk.length === 0 && df.length === 0 && mf.length === 0 && fw.length === 0 && playersList.length > 0) {
      return {
        gk: [playersList[0]],
        df: playersList.slice(1, 5),
        mf: playersList.slice(5, 8),
        fw: playersList.slice(8, 11)
      };
    }

    return {
      gk: gk.length ? gk : (playersList[0] ? [playersList[0]] : []),
      df,
      mf,
      fw
    };
  };

  const homeLines = groupPlayersByLine(homeStarters);
  const awayLines = groupPlayersByLine(awayStarters);

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl neu-btn-dark hover:border-[#D4AF37]/50 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
          >
            <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
            <span>Volver a Partidos</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>Torneo Élite EMILIATEX</span>
            <span>•</span>
            <span className="text-[#D4AF37] font-bold">{match.category || 'Sub-15'}</span>
            <span>•</span>
            <span className="text-slate-300">{match.stage || match.phase}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {copySuccess && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 animate-pulse">
              <CheckCircle className="w-3.5 h-3.5" />
              ¡Enlace copiado!
            </span>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl neu-btn-dark hover:border-[#D4AF37]/50 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
            title="Compartir partido"
          >
            <Share2 className="w-4 h-4 text-[#D4AF37]" />
            <span>Compartir Ficha</span>
          </button>
        </div>
      </div>

      {/* Main Scoreboard / Match Hero Banner */}
      <div className="rounded-3xl neu-card-gold overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.8)]">
        {/* Top bar of Scoreboard */}
        <div className="px-6 py-3.5 border-b border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#F5E59B] via-[#D4AF37] to-[#A67C11] text-black font-black uppercase text-[10px] tracking-wider shadow-sm">
              {match.category || 'Sub-15'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold text-[10px] uppercase">
              {match.stage || match.phase}
            </span>
            <span className="text-slate-400 font-medium">
              {match.tournamentName || 'Torneo Élite EMILIATEX 2026'}
            </span>
          </div>

          <div>
            {match.status === 'live' ? (
              <span className="px-3.5 py-1 rounded-full bg-red-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                EN VIVO • {match.liveMinute || "En juego"}
              </span>
            ) : match.status === 'finished' ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs uppercase tracking-wider">
                Partido Finalizado
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full neu-pressed text-amber-300 border border-amber-400/30 font-bold text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                Programado: {match.date} • {match.time} hrs
              </span>
            )}
          </div>
        </div>

        {/* Center Teams & Score - Optimized for side-by-side confrontation on all screen sizes */}
        <div className="p-4 sm:p-10">
          <div className="grid grid-cols-7 items-center gap-1.5 sm:gap-6 text-center">
            {/* Home Team */}
            <div className="col-span-3 flex flex-col items-center space-y-2 sm:space-y-3">
              <div className="relative group">
                <div className="w-14 h-14 sm:w-28 sm:h-28 rounded-full p-0.5 sm:p-1 bg-gradient-to-tr from-[#D4AF37] to-amber-200 shadow-xl overflow-hidden">
                  <img
                    src={match.homeLogo}
                    alt={match.homeAcademyName}
                    className="w-full h-full object-cover rounded-full bg-black"
                  />
                </div>
                <span className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2 px-1.5 sm:px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-black font-extrabold text-[8px] sm:text-[10px] tracking-wider uppercase shadow">
                  LOCAL
                </span>
              </div>

              <div className="space-y-0.5 sm:space-y-1">
                <h2 className="text-xs sm:text-2xl font-black font-cinzel text-white leading-tight line-clamp-2">
                  {match.homeAcademyName}
                </h2>
                {homeAcademy?.city && (
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium">{homeAcademy.city}</p>
                )}
                <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] sm:text-[11px] text-amber-300">
                  <UserCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="truncate max-w-[80px] sm:max-w-none">DT: {homeCoach}</span>
                </div>
              </div>
            </div>

            {/* Scoreboard Middle */}
            <div className="col-span-1 flex flex-col items-center justify-center space-y-1 sm:space-y-2 py-2 sm:py-4">
              {match.status === 'upcoming' ? (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-2xl neu-pressed-gold text-amber-300 font-cinzel font-black text-lg sm:text-3xl shadow-inner">
                    VS
                  </div>
                  <p className="text-[9px] sm:text-[11px] text-slate-400 font-mono whitespace-nowrap">{match.time} hrs</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-3 px-2.5 sm:px-6 py-1.5 sm:py-3 rounded-2xl neu-pressed-gold shadow-inner border border-[#D4AF37]/50">
                    <span className="font-cinzel text-xl sm:text-5xl font-black text-amber-300 drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]">
                      {match.homeScore ?? 0}
                    </span>
                    <span className="text-sm sm:text-2xl font-black text-[#D4AF37]/70">:</span>
                    <span className="font-cinzel text-xl sm:text-5xl font-black text-amber-300 drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]">
                      {match.awayScore ?? 0}
                    </span>
                  </div>
                  {match.status === 'live' && (
                    <span className="text-[9px] sm:text-[11px] text-red-400 font-bold uppercase tracking-wider block animate-pulse">
                      Min {match.liveMinute}'
                    </span>
                  )}
                  {match.status === 'finished' && (
                    <span className="text-[8px] sm:text-[10px] text-slate-400 uppercase font-semibold block whitespace-nowrap">
                      Final
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="col-span-3 flex flex-col items-center space-y-2 sm:space-y-3">
              <div className="relative group">
                <div className="w-14 h-14 sm:w-28 sm:h-28 rounded-full p-0.5 sm:p-1 bg-gradient-to-tr from-slate-400 to-slate-100 shadow-xl overflow-hidden">
                  <img
                    src={match.awayLogo}
                    alt={match.awayAcademyName}
                    className="w-full h-full object-cover rounded-full bg-black"
                  />
                </div>
                <span className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2 px-1.5 sm:px-2.5 py-0.5 rounded-full bg-slate-200 text-black font-extrabold text-[8px] sm:text-[10px] tracking-wider uppercase shadow">
                  VISITANTE
                </span>
              </div>

              <div className="space-y-0.5 sm:space-y-1">
                <h2 className="text-xs sm:text-2xl font-black font-cinzel text-white leading-tight line-clamp-2">
                  {match.awayAcademyName}
                </h2>
                {awayAcademy?.city && (
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium">{awayAcademy.city}</p>
                )}
                <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg neu-pressed text-[9px] sm:text-[11px] text-slate-300">
                  <UserCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="truncate max-w-[80px] sm:max-w-none">DT: {awayCoach}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stadium, Date & Referee Meta Bar */}
        <div className="px-6 py-3.5 neu-pressed border-t border-white/10 flex flex-wrap items-center justify-around gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-semibold text-white">{match.stadium}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            <span>{match.date} • {match.time} hrs</span>
          </div>

          {match.referee && (
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#D4AF37]" />
              <span>Árbitro: <strong className="text-white">{match.referee}</strong></span>
            </div>
          )}

          {match.mvp && (
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Star className="w-4 h-4 fill-current text-amber-400" />
              <span>MVP: {match.mvp}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary / Chronicle Quote if provided */}
      {match.summary && (
        <div className="rounded-3xl neu-card p-5 sm:p-6 flex items-start gap-4 border border-[#D4AF37]/20">
          <FileText className="w-6 h-6 text-[#D4AF37] shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-cinzel">
              Crónica & Resumen Oficial del Encuentro
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {match.summary}
            </p>
          </div>
        </div>
      )}

      {/* Sub Navigation for Match Details - APK segmented mobile bar */}
      <div className="p-1.5 rounded-2xl neu-pressed flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => setActiveTab('lineups')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
            activeTab === 'lineups'
              ? 'neu-btn-gold text-black shadow-md'
              : 'neu-btn-dark text-slate-300 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span className="sm:hidden">Alineaciones</span>
          <span className="hidden sm:inline">Alineaciones & Convocados</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
            activeTab === 'events'
              ? 'neu-btn-gold text-black shadow-md'
              : 'neu-btn-dark text-slate-300 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span className="sm:hidden">Goles ({events.length})</span>
          <span className="hidden sm:inline">Incidencias & Goles ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
            activeTab === 'info'
              ? 'neu-btn-gold text-black shadow-md'
              : 'neu-btn-dark text-slate-300 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span className="sm:hidden">Ficha</span>
          <span className="hidden sm:inline">Ficha Técnica & Clubes</span>
        </button>
      </div>

      {/* TAB 1: ALINEACIONES (Requested feature: si la tiene alineaciones) */}
      {activeTab === 'lineups' && (
        <div className="space-y-8">
          {!hasLineupData ? (
            <div className="p-12 text-center rounded-3xl neu-card text-slate-400 text-xs space-y-3">
              <Shield className="w-12 h-12 text-[#D4AF37] mx-auto opacity-80" />
              <h3 className="text-base font-bold text-white font-cinzel">Alineaciones Pendientes por Confirmar</h3>
              <p className="max-w-md mx-auto text-slate-300 leading-relaxed">
                Los cuerpos técnicos de <strong>{match.homeAcademyName}</strong> y <strong>{match.awayAcademyName}</strong> confirmarán las nóminas iniciales 30 minutos antes del inicio del encuentro.
              </p>
              <p className="text-[11px] text-amber-300/80">
                Torneo Élite EMILIATEX • Categoría {match.category || 'Sub-15'}
              </p>
            </div>
          ) : (
            <>
              {/* Formations Header banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl neu-card-gold flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={match.homeLogo} alt={match.homeAcademyName} className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]" />
                    <div>
                      <h4 className="text-sm font-bold text-white font-cinzel">{match.homeAcademyName}</h4>
                      <p className="text-[11px] text-amber-300">DT: {homeCoach}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-lg neu-pressed-gold text-amber-300 font-mono font-bold text-xs">
                    {homeFormation}
                  </span>
                </div>

                <div className="p-4 rounded-2xl neu-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={match.awayLogo} alt={match.awayAcademyName} className="w-10 h-10 rounded-full object-cover border border-slate-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white font-cinzel">{match.awayAcademyName}</h4>
                      <p className="text-[11px] text-slate-300">DT: {awayCoach}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-lg neu-pressed text-slate-200 font-mono font-bold text-xs">
                    {awayFormation}
                  </span>
                </div>
              </div>

              {/* TACTICAL SOCCER PITCH DISPLAY */}
              <div className="rounded-3xl border-2 border-emerald-600/40 bg-gradient-to-b from-[#14532d] via-[#166534] to-[#14532d] p-4 sm:p-8 relative overflow-hidden shadow-2xl">
                {/* Field markings */}
                <div className="absolute inset-0 pointer-events-none opacity-25">
                  {/* Grass Stripes */}
                  <div className="w-full h-full grid grid-rows-6">
                    <div className="bg-black/10" />
                    <div className="bg-white/5" />
                    <div className="bg-black/10" />
                    <div className="bg-white/5" />
                    <div className="bg-black/10" />
                    <div className="bg-white/5" />
                  </div>
                </div>

                {/* Pitch outline & lines */}
                <div className="relative border-2 border-white/30 rounded-2xl min-h-[520px] flex flex-col justify-between p-4 sm:p-6 overflow-hidden bg-emerald-900/40 backdrop-blur-xs">
                  {/* Halfway line & Center Circle */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -translate-y-1/2" />
                  <div className="absolute top-1/2 left-1/2 w-28 h-28 border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/60 rounded-full -translate-x-1/2 -translate-y-1/2" />

                  {/* Top Goal Box (Home half) */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 border-2 border-t-0 border-white/30 rounded-b-xl" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-8 border-2 border-t-0 border-white/30" />

                  {/* Bottom Goal Box (Away half) */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-16 border-2 border-b-0 border-white/30 rounded-t-xl" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-8 border-2 border-b-0 border-white/30" />

                  {/* TOP TEAM FORMATION (HOME) */}
                  <div className="space-y-4 relative z-10">
                    <div className="text-center">
                      <span className="px-3 py-0.5 rounded-full bg-black/60 text-[#D4AF37] font-bold text-[11px] uppercase tracking-wider border border-[#D4AF37]/40 shadow">
                        {match.homeAcademyName} ({homeFormation})
                      </span>
                    </div>

                    {/* GK */}
                    <div className="flex justify-center">
                      {homeLines.gk.map((p, idx) => (
                        <div key={idx} className="flex flex-col items-center group cursor-pointer">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-400 text-black font-black flex items-center justify-center text-xs shadow-lg border-2 border-black group-hover:scale-110 transition-transform">
                            {p.number}
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold text-white bg-black/80 px-1.5 py-0.5 rounded mt-1 shadow truncate max-w-[85px]">
                            {p.name.split(' ').slice(-1)[0]}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Defensas */}
                    <div className="flex justify-around items-center px-4">
                      {homeLines.df.map((p, idx) => (
                        <div key={idx} className="flex flex-col items-center group cursor-pointer">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#D4AF37] text-black font-black flex items-center justify-center text-xs shadow-lg border-2 border-black group-hover:scale-110 transition-transform">
                            {p.number}
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold text-white bg-black/80 px-1.5 py-0.5 rounded mt-1 shadow truncate max-w-[85px]">
                            {p.name.split(' ').slice(-1)[0]}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Centrocampistas */}
                    <div className="flex justify-around items-center px-6">
                      {homeLines.mf.map((p, idx) => (
                        <div key={idx} className="flex flex-col items-center group cursor-pointer">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#D4AF37] text-black font-black flex items-center justify-center text-xs shadow-lg border-2 border-black group-hover:scale-110 transition-transform">
                            {p.number}
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold text-white bg-black/80 px-1.5 py-0.5 rounded mt-1 shadow truncate max-w-[85px]">
                            {p.name.split(' ').slice(-1)[0]}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Delanteros */}
                    <div className="flex justify-around items-center px-8">
                      {homeLines.fw.map((p, idx) => (
                        <div key={idx} className="flex flex-col items-center group cursor-pointer">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-300 text-black font-black flex items-center justify-center text-xs shadow-lg border-2 border-black group-hover:scale-110 transition-transform">
                            {p.number}
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold text-white bg-black/80 px-1.5 py-0.5 rounded mt-1 shadow truncate max-w-[85px]">
                            {p.name.split(' ').slice(-1)[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* BOTTOM TEAM FORMATION (AWAY) */}
                  <div className="space-y-4 relative z-10 pt-8">
                    {/* Delanteros */}
                    <div className="flex justify-around items-center px-8">
                      {awayLines.fw.map((p, idx) => (
                        <div key={idx} className="flex flex-col items-center group cursor-pointer">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-sky-200 text-black font-black flex items-center justify-center text-xs shadow-lg border-2 border-black group-hover:scale-110 transition-transform">
                            {p.number}
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold text-white bg-black/80 px-1.5 py-0.5 rounded mt-1 shadow truncate max-w-[85px]">
                            {p.name.split(' ').slice(-1)[0]}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Centrocampistas */}
                    <div className="flex justify-around items-center px-6">
                      {awayLines.mf.map((p, idx) => (
                        <div key={idx} className="flex flex-col items-center group cursor-pointer">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-black font-black flex items-center justify-center text-xs shadow-lg border-2 border-black group-hover:scale-110 transition-transform">
                            {p.number}
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold text-white bg-black/80 px-1.5 py-0.5 rounded mt-1 shadow truncate max-w-[85px]">
                            {p.name.split(' ').slice(-1)[0]}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Defensas */}
                    <div className="flex justify-around items-center px-4">
                      {awayLines.df.map((p, idx) => (
                        <div key={idx} className="flex flex-col items-center group cursor-pointer">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-black font-black flex items-center justify-center text-xs shadow-lg border-2 border-black group-hover:scale-110 transition-transform">
                            {p.number}
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold text-white bg-black/80 px-1.5 py-0.5 rounded mt-1 shadow truncate max-w-[85px]">
                            {p.name.split(' ').slice(-1)[0]}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* GK */}
                    <div className="flex justify-center">
                      {awayLines.gk.map((p, idx) => (
                        <div key={idx} className="flex flex-col items-center group cursor-pointer">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-400 text-black font-black flex items-center justify-center text-xs shadow-lg border-2 border-black group-hover:scale-110 transition-transform">
                            {p.number}
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold text-white bg-black/80 px-1.5 py-0.5 rounded mt-1 shadow truncate max-w-[85px]">
                            {p.name.split(' ').slice(-1)[0]}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="text-center pt-2">
                      <span className="px-3 py-0.5 rounded-full bg-black/60 text-slate-200 font-bold text-[11px] uppercase tracking-wider border border-white/30 shadow">
                        {match.awayAcademyName} ({awayFormation})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DETAILED SQUAD LISTS: TITULARES Y SUPLENTES */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* HOME TEAM SQUAD */}
                <div className="rounded-3xl neu-card-gold overflow-hidden shadow-xl">
                  <div className="px-5 py-4 bg-black/40 border-b border-[#D4AF37]/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={match.homeLogo} alt={match.homeAcademyName} className="w-9 h-9 rounded-full object-cover border border-[#D4AF37]" />
                      <div>
                        <h3 className="text-sm font-bold text-white font-cinzel">{match.homeAcademyName}</h3>
                        <p className="text-[11px] text-amber-300">DT: {homeCoach}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full neu-pressed-gold text-[10px] font-extrabold text-[#D4AF37] uppercase">Local</span>
                  </div>

                  <div className="p-4 sm:p-5 space-y-5">
                    {/* Starters */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Alineación Inicial ({homeStarters.length})</span>
                      </h4>
                      <div className="divide-y divide-white/5 neu-pressed rounded-2xl p-2">
                        {homeStarters.map((p, idx) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between text-xs hover:bg-white/5 px-2.5 rounded-xl transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-xl neu-btn-gold text-black font-extrabold flex items-center justify-center text-xs shadow-sm">
                                {p.number}
                              </span>
                              <div>
                                <span className="font-bold text-white flex items-center gap-1.5">
                                  {p.name}
                                  {p.captain && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-black">
                                      C
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-slate-400 block">{p.position}</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10">Titular</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Substitutes */}
                    {homeSubs.length > 0 && (
                      <div className="pt-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-500" />
                          <span>Banca de Suplentes ({homeSubs.length})</span>
                        </h4>
                        <div className="divide-y divide-white/5 neu-pressed rounded-2xl p-2">
                          {homeSubs.map((p, idx) => (
                            <div key={idx} className="py-2 flex items-center justify-between text-xs hover:bg-white/5 px-2.5 rounded-xl transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg neu-btn-dark text-slate-300 font-bold flex items-center justify-center text-[11px]">
                                  {p.number}
                                </span>
                                <div>
                                  <span className="font-semibold text-slate-200">{p.name}</span>
                                  <span className="text-[10px] text-slate-400 block">{p.position}</span>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-500">Suplente</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AWAY TEAM SQUAD */}
                <div className="rounded-3xl neu-card overflow-hidden shadow-xl">
                  <div className="px-5 py-4 bg-black/40 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={match.awayLogo} alt={match.awayAcademyName} className="w-9 h-9 rounded-full object-cover border border-slate-400" />
                      <div>
                        <h3 className="text-sm font-bold text-white font-cinzel">{match.awayAcademyName}</h3>
                        <p className="text-[11px] text-slate-300">DT: {awayCoach}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full neu-pressed text-[10px] font-extrabold text-slate-400 uppercase">Visitante</span>
                  </div>

                  <div className="p-4 sm:p-5 space-y-5">
                    {/* Starters */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Alineación Inicial ({awayStarters.length})</span>
                      </h4>
                      <div className="divide-y divide-white/5 neu-pressed rounded-2xl p-2">
                        {awayStarters.map((p, idx) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between text-xs hover:bg-white/5 px-2.5 rounded-xl transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-xl bg-slate-200 text-black font-extrabold flex items-center justify-center text-xs shadow-sm">
                                {p.number}
                              </span>
                              <div>
                                <span className="font-bold text-white flex items-center gap-1.5">
                                  {p.name}
                                  {p.captain && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-black">
                                      C
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-slate-400 block">{p.position}</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10">Titular</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Substitutes */}
                    {awaySubs.length > 0 && (
                      <div className="pt-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-500" />
                          <span>Banca de Suplentes ({awaySubs.length})</span>
                        </h4>
                        <div className="divide-y divide-white/5 neu-pressed rounded-2xl p-2">
                          {awaySubs.map((p, idx) => (
                            <div key={idx} className="py-2 flex items-center justify-between text-xs hover:bg-white/5 px-2.5 rounded-xl transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg neu-btn-dark text-slate-300 font-bold flex items-center justify-center text-[11px]">
                                  {p.number}
                                </span>
                                <div>
                                  <span className="font-semibold text-slate-200">{p.name}</span>
                                  <span className="text-[10px] text-slate-400 block">{p.position}</span>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-500">Suplente</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: EVENTS & INCIDENCIAS */}
      {activeTab === 'events' && (
        <div className="rounded-3xl neu-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-base font-bold font-cinzel text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>Cronología & Minuto a Minuto</span>
            </h3>
            <span className="text-xs text-amber-300 font-mono px-3 py-1 rounded-full neu-pressed">
              {match.status === 'live' ? `En vivo • ${match.liveMinute}` : 'Registro oficial'}
            </span>
          </div>

          {events.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-3 neu-pressed rounded-2xl">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-bold text-white text-sm">Sin incidencias registradas aún</p>
              <p className="text-slate-400 max-w-sm mx-auto">
                {match.status === 'upcoming' 
                  ? 'Las incidencias y goles se reportarán en tiempo real una vez ruede el balón.' 
                  : 'No se reportaron tarjetas ni goles extraordinarios en este cotejo.'}
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-[#D4AF37]/30 ml-4 pl-6 space-y-6">
              {events.map(ev => {
                const isHome = ev.team === 'home';
                return (
                  <div key={ev.id} className="relative group">
                    {/* Minute Circle Pin */}
                    <div className="absolute -left-[35px] top-0 w-7 h-7 rounded-full neu-btn-gold text-black font-black text-[11px] flex items-center justify-center shadow-md">
                      {ev.minute}
                    </div>

                    <div className={`p-4 rounded-2xl transition-all ${
                      isHome 
                        ? 'neu-card-gold' 
                        : 'neu-card'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {ev.type === 'goal' && (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1">
                              ⚽ GOL
                            </span>
                          )}
                          {ev.type === 'yellow_card' && (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-extrabold flex items-center gap-1">
                              🟨 Tarjeta Amarilla
                            </span>
                          )}
                          {ev.type === 'red_card' && (
                            <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-extrabold flex items-center gap-1">
                              🟥 Tarjeta Roja
                            </span>
                          )}
                          {ev.type === 'substitution' && (
                            <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-extrabold flex items-center gap-1">
                              🔄 Sustitución
                            </span>
                          )}

                          <span className="text-xs sm:text-sm font-bold text-white">
                            {ev.playerName}
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-400 font-semibold">
                          {isHome ? match.homeAcademyName : match.awayAcademyName}
                        </span>
                      </div>

                      {ev.detail && (
                        <p className="text-xs text-slate-300 mt-2 pl-1 leading-relaxed">
                          {ev.detail}
                        </p>
                      )}

                      {ev.assistantName && (
                        <p className="text-[11px] text-[#D4AF37] mt-1 pl-1 font-semibold">
                          Asistencia: {ev.assistantName}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FICHA TÉCNICA & CLUBES */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Match Venue Card */}
          <div className="rounded-3xl neu-card p-6 space-y-4">
            <h3 className="text-base font-bold font-cinzel text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#D4AF37]" />
              <span>Sede & Escenario Deportivo</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between py-2.5 border-b border-white/5">
                <span className="text-slate-400">Escenario:</span>
                <span className="font-bold text-white">{match.stadium}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-white/5">
                <span className="text-slate-400">Torneo:</span>
                <span className="font-bold text-[#D4AF37]">{match.tournamentName}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-white/5">
                <span className="text-slate-400">Categoría:</span>
                <span className="font-bold text-amber-300">{match.category || 'Sub-15'}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-white/5">
                <span className="text-slate-400">Fase / Instancia:</span>
                <span className="font-bold text-white">{match.stage || match.phase}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-white/5">
                <span className="text-slate-400">Árbitro Central:</span>
                <span className="font-bold text-white">{match.referee || 'Designación Oficial'}</span>
              </div>
            </div>
          </div>

          {/* Academies Record Comparison */}
          <div className="rounded-3xl neu-card p-6 space-y-4">
            <h3 className="text-base font-bold font-cinzel text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#D4AF37]" />
              <span>Historial & Estadísticas de los Clubes</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 rounded-2xl neu-pressed-gold space-y-2">
                <img src={match.homeLogo} alt={match.homeAcademyName} className="w-12 h-12 rounded-full mx-auto object-cover border border-[#D4AF37]" />
                <h4 className="text-xs font-bold text-white truncate font-cinzel">{match.homeAcademyName}</h4>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <p>Puntos: <strong className="text-amber-300">{homeAcademy?.points ?? 0}</strong></p>
                  <p>PJ: {homeAcademy?.played ?? 0} | PG: {homeAcademy?.won ?? 0}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl neu-pressed space-y-2">
                <img src={match.awayLogo} alt={match.awayAcademyName} className="w-12 h-12 rounded-full mx-auto object-cover border border-slate-400" />
                <h4 className="text-xs font-bold text-white truncate font-cinzel">{match.awayAcademyName}</h4>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <p>Puntos: <strong className="text-amber-300">{awayAcademy?.points ?? 0}</strong></p>
                  <p>PJ: {awayAcademy?.played ?? 0} | PG: {awayAcademy?.won ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl neu-pressed-gold text-xs text-amber-300 leading-relaxed flex items-center gap-3">
              <Award className="w-6 h-6 text-[#D4AF37] shrink-0" />
              <span>
                Indumentaria oficial de competencia diseñada y confeccionada por <strong>EMILIATEX</strong>.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
