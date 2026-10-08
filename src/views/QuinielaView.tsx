import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { TournamentMatch, MatchPredictionScore, QuinielaEntry } from '../types';
import { NavPage } from '../components/Navbar';
import { 
  Trophy, 
  ArrowLeft, 
  CheckCircle2, 
  Send, 
  Share2, 
  Sparkles, 
  Clock, 
  Calendar, 
  MapPin, 
  User, 
  Phone, 
  Award, 
  Flame, 
  ShieldCheck, 
  ChevronRight, 
  HelpCircle, 
  TrendingUp, 
  Medal,
  RefreshCw
} from 'lucide-react';
import { 
  getQuinielas, 
  saveQuiniela, 
  getUserSavedQuiniela, 
  saveUserLocalQuiniela, 
  subscribeQuinielas, 
  evaluateMatchPrediction, 
  computeTotalQuinielaStats, 
  formatWhatsAppLink, 
  getSettings 
} from '../services/storage';

interface QuinielaViewProps {
  matches: TournamentMatch[];
  onNavigate: (page: NavPage) => void;
  onSelectMatch?: (match: TournamentMatch) => void;
}

export const QuinielaView: React.FC<QuinielaViewProps> = ({
  matches,
  onNavigate,
  onSelectMatch
}) => {
  const settings = getSettings();
  const [activeTab, setActiveTab] = useState<'predict' | 'leaderboard'>('predict');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'finished'>('all');
  
  // User Profile
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  
  // Predictions state: matchId -> { homeScore, awayScore }
  const [predictions, setPredictions] = useState<Record<string, MatchPredictionScore>>({});
  
  // Global Quiniela Leaderboard
  const [leaderboard, setLeaderboard] = useState<QuinielaEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize from local storage and subscribe to real-time updates
  useEffect(() => {
    const savedUser = getUserSavedQuiniela();
    if (savedUser) {
      setUserName(savedUser.userName || '');
      setUserPhone(savedUser.userPhone || '');
      if (savedUser.predictions && Object.keys(savedUser.predictions).length > 0) {
        setPredictions(savedUser.predictions);
      }
    }

    setLeaderboard(getQuinielas());
    const unsubscribe = subscribeQuinielas((updatedList) => {
      setLeaderboard(updatedList);
    });

    return () => unsubscribe();
  }, []);

  // Compute live user stats based on their predictions & current match states
  const userLiveStats = useMemo(() => {
    return computeTotalQuinielaStats(predictions, matches);
  }, [predictions, matches]);

  // Matches filtered for display
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'upcoming') return m.status === 'upcoming' || m.status === 'live';
      if (statusFilter === 'finished') return m.status === 'finished';
      return true;
    });
  }, [matches, statusFilter]);

  // Handle score change
  const handleScoreChange = (matchId: string, team: 'home' | 'away', delta: number) => {
    setPredictions(prev => {
      const current = prev[matchId] || { homeScore: 0, awayScore: 0 };
      const currentVal = team === 'home' ? current.homeScore : current.awayScore;
      const nextVal = Math.max(0, Math.min(15, currentVal + delta));

      const updated = {
        ...prev,
        [matchId]: {
          homeScore: team === 'home' ? nextVal : current.homeScore,
          awayScore: team === 'away' ? nextVal : current.awayScore,
        }
      };

      // Save locally as draft
      if (userName || userPhone) {
        saveUserLocalQuiniela({
          userName,
          userPhone,
          predictions: updated
        });
      }

      return updated;
    });
  };

  // Set quick score
  const setQuickScore = (matchId: string, home: number, away: number) => {
    setPredictions(prev => {
      const updated = {
        ...prev,
        [matchId]: { homeScore: home, awayScore: away }
      };

      if (userName || userPhone) {
        saveUserLocalQuiniela({
          userName,
          userPhone,
          predictions: updated
        });
      }

      return updated;
    });
  };

  // Save quiniela
  const handleSubmitQuiniela = async () => {
    setValidationError(null);

    if (!userName.trim()) {
      setValidationError('Por favor ingresa tu Nombre o Alias deportivo para participar en la Quiniela.');
      return;
    }

    if (!userPhone.trim()) {
      setValidationError('Por favor ingresa tu número de WhatsApp para confirmar tu puntaje.');
      return;
    }

    const predictedCount = Object.keys(predictions).length;
    if (predictedCount === 0) {
      setValidationError('Ingresa al menos 1 pronóstico de partido para registrar tu Quiniela.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate final points & stats
      const stats = computeTotalQuinielaStats(predictions, matches);

      const quinielaId = userPhone.replace(/[^0-9]/g, '') || `quiniela-${Date.now()}`;
      const entry: QuinielaEntry = {
        id: `quiniela-${quinielaId}`,
        userName: userName.trim(),
        userPhone: userPhone.trim(),
        totalPoints: stats.totalPoints,
        exactHitsCount: stats.exactHitsCount,
        outcomeHitsCount: stats.outcomeHitsCount,
        predictions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save locally
      saveUserLocalQuiniela({
        userName: entry.userName,
        userPhone: entry.userPhone,
        predictions: entry.predictions
      });

      // Save to Firestore and state
      const updatedList = await saveQuiniela(entry);
      setLeaderboard(updatedList);

      setSubmittedSuccess(true);
      setTimeout(() => setSubmittedSuccess(false), 6000);
    } catch (err) {
      console.error('Error saving quiniela:', err);
      setValidationError('Ocurrió un error al guardar tu quiniela. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp share
  const handleShareWhatsApp = () => {
    if (!userName.trim()) {
      alert('Por favor escribe tu nombre primero.');
      return;
    }

    const stats = computeTotalQuinielaStats(predictions, matches);

    let message = `🏆 *QUINIELA EMILIATEX C.A 2026* ⚽\n\n`;
    message += `👤 *Participante:* ${userName}\n`;
    message += `📱 *WhatsApp:* ${userPhone || 'No especificado'}\n`;
    message += `⭐ *Puntaje Actual:* ${stats.totalPoints} Pts (${stats.exactHitsCount} exactos, ${stats.outcomeHitsCount} simples)\n\n`;
    message += `📋 *MIS PRONÓSTICOS REGISTRADOS:*\n`;

    matches.forEach(m => {
      const pred = predictions[m.id];
      if (pred) {
        const cat = m.category ? `[${m.category}] ` : '';
        message += `• ${cat}${m.homeAcademyName} *${pred.homeScore} - ${pred.awayScore}* ${m.awayAcademyName}\n`;
      }
    });

    message += `\n_¡Enviado desde la Quiniela Oficial EMILIATEX C.A!_`;

    const url = formatWhatsAppLink(settings.whatsappNumber, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const totalMatchesAvailable = matches.length;
  const totalPredictedCount = Object.keys(predictions).length;

  return (
    <div className="space-y-8 pb-16">
      
      {/* 1. TOP HERO BANNER: QUINIELA EMILIATEX C.A */}
      <div className="relative rounded-3xl neu-card-gold cyber-grid p-6 sm:p-10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 inset-x-0 h-px hologram-line" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          <div className="space-y-3 max-w-2xl">
            <button
              onClick={() => onNavigate('tournament')}
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la Página del Torneo</span>
            </button>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neu-pressed text-amber-300 text-xs font-bold uppercase tracking-widest">
              <Trophy className="w-4 h-4 text-[#D4AF37]" />
              <span>COMPETICIÓN OFICIAL DE PRONÓSTICOS</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white font-cinzel tracking-tight leading-none">
              QUINIELA <span className="bg-gradient-to-r from-[#FFF2B2] via-[#D4AF37] to-[#AA7C11] bg-clip-text text-transparent">EMILIATEX C.A</span>
            </h1>

            <p className="text-xs sm:text-base text-slate-300 leading-relaxed">
              ¡Demuestra tus conocimientos futbolísticos! Pronostica los marcadores de los partidos del Torneo Élite EMILIATEX 2026, acumula puntos en cada fecha y compite por premios en dotaciones deportivas oficiales.
            </p>

            {/* Rules Quick Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="p-2.5 rounded-xl neu-pressed flex items-center gap-2 border border-amber-400/20">
                <span className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-black text-xs shrink-0 font-cinzel">
                  +5
                </span>
                <div className="text-[11px]">
                  <p className="font-bold text-white leading-tight">Marcador Exacto</p>
                  <p className="text-slate-400 text-[10px]">Acierto goles exactos</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl neu-pressed flex items-center gap-2 border border-emerald-500/20">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0 font-cinzel">
                  +2
                </span>
                <div className="text-[11px]">
                  <p className="font-bold text-white leading-tight">Acierto Ganador / Empate</p>
                  <p className="text-slate-400 text-[10px]">Signo del resultado</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl neu-pressed flex items-center gap-2 border border-slate-700/50">
                <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center font-black text-xs shrink-0 font-cinzel">
                  0
                </span>
                <div className="text-[11px]">
                  <p className="font-bold text-white leading-tight">Sin Acierto</p>
                  <p className="text-slate-400 text-[10px]">No suma puntos</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Live Summary Card */}
          <div className="w-full lg:w-80 p-5 rounded-2xl neu-card-gold ring-1 ring-amber-400/40 shadow-2xl space-y-4 shrink-0">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Medal className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white">Mi Rendimiento</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold">
                EN VIVO
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl neu-pressed">
                <span className="text-2xl sm:text-3xl font-black font-cinzel text-amber-300 block">
                  {userLiveStats.totalPoints}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Puntos Acumulados</span>
              </div>

              <div className="p-3 rounded-xl neu-pressed">
                <span className="text-2xl sm:text-3xl font-black font-cinzel text-white block">
                  {totalPredictedCount}/{totalMatchesAvailable}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pronosticados</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs px-2 text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Exactos: <strong>{userLiveStats.exactHitsCount}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simples: <strong>{userLiveStats.outcomeHitsCount}</strong></span>
              </span>
            </div>

            <button
              onClick={handleShareWhatsApp}
              className="w-full py-2.5 px-4 rounded-xl neu-pressed text-[#25D366] font-bold text-xs flex items-center justify-center gap-2 border border-[#25D366]/40 hover:bg-[#25D366]/10 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir por WhatsApp</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl neu-pressed w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('predict')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'predict'
                ? 'neu-btn-gold text-black shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Llenar Mi Quiniela ({totalPredictedCount}/{totalMatchesAvailable})</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'neu-btn-gold text-black shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Tabla de Posiciones ({leaderboard.length})</span>
          </button>
        </div>

        {activeTab === 'predict' && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-400 font-semibold hidden md:inline">Filtrar:</span>
            <div className="flex items-center gap-1.5 p-1 rounded-xl neu-pressed">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-amber-400/20 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({matches.length})
              </button>
              <button
                onClick={() => setStatusFilter('upcoming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'upcoming' ? 'bg-amber-400/20 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Abiertos
              </button>
              <button
                onClick={() => setStatusFilter('finished')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'finished' ? 'bg-amber-400/20 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Finalizados
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. TAB CONTENT */}
      {activeTab === 'predict' ? (
        <div className="space-y-8">

          {/* Participant Profile Form Box */}
          <div className="rounded-3xl neu-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl neu-btn-gold text-black flex items-center justify-center font-black">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black font-cinzel text-white">Datos del Participante</h3>
                  <p className="text-xs text-slate-400">Tus datos permitirán registrar tu posición en el Leaderboard oficial de EMILIATEX C.A.</p>
                </div>
              </div>

              {submittedSuccess && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-pulse">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Quiniela guardada exitosamente!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nombre Completo o Alias Deportivo *</span>
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ej. Carlos Martínez (Academia Valencia)"
                  className="w-full px-4 py-3 rounded-xl neu-pressed bg-transparent border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>WhatsApp / Teléfono Móvil *</span>
                </label>
                <input
                  type="tel"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="Ej. +58 412 1234567"
                  className="w-full px-4 py-3 rounded-xl neu-pressed bg-transparent border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#25D366]/50"
                />
              </div>
            </div>

            {validationError && (
              <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-2">
                <span>⚠️ {validationError}</span>
              </div>
            )}
          </div>

          {/* List of Matches to Predict */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-black font-cinzel text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span>Partidos de la Jornada</span>
              </h2>
              <span className="text-xs text-slate-400">
                Ajusta los marcadores usando los botones <strong>-</strong> y <strong>+</strong> o los atajos rápidos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMatches.map(match => {
                const pred = predictions[match.id] || { homeScore: 0, awayScore: 0 };
                const isPredicted = predictions[match.id] !== undefined;
                const evalResult = evaluateMatchPrediction(predictions[match.id], match);

                return (
                  <div
                    key={match.id}
                    className={`rounded-3xl neu-card p-5 space-y-4 transition-all border ${
                      isPredicted ? 'border-amber-400/30' : 'border-white/5'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/5 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold uppercase font-mono">
                          {match.category || 'Sub-15'}
                        </span>
                        <span>{match.phase || match.stage}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{match.date} • {match.time}</span>
                      </div>
                    </div>

                    {/* Match Scoreboard / Prediction Controls */}
                    <div className="grid grid-cols-3 items-center gap-2 py-1">
                      {/* Home Team */}
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl neu-card p-1.5 flex items-center justify-center border border-amber-400/30">
                          <img src={match.homeLogo} alt={match.homeAcademyName} className="w-full h-full object-contain rounded" />
                        </div>
                        <span className="text-xs font-extrabold text-white line-clamp-2 max-w-[110px] leading-tight">
                          {match.homeAcademyName}
                        </span>

                        {/* Home Score Counter */}
                        {match.status !== 'finished' ? (
                          <div className="flex items-center gap-1 neu-pressed px-2 py-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleScoreChange(match.id, 'home', -1)}
                              className="w-6 h-6 rounded-lg bg-black/40 hover:bg-black/60 text-white font-black text-sm flex items-center justify-center active:scale-90 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-black font-cinzel text-lg text-amber-300">
                              {pred.homeScore}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleScoreChange(match.id, 'home', 1)}
                              className="w-6 h-6 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-black text-sm flex items-center justify-center active:scale-90 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <div className="font-mono text-xs text-slate-400">
                            Real: <strong className="text-white text-sm font-cinzel">{match.homeScore}</strong>
                          </div>
                        )}
                      </div>

                      {/* VS & Result Evaluation */}
                      <div className="flex flex-col items-center justify-center text-center space-y-2">
                        {match.status === 'live' ? (
                          <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-black uppercase animate-pulse">
                            EN VIVO ({match.homeScore} - {match.awayScore})
                          </span>
                        ) : match.status === 'finished' ? (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Finalizado
                            </span>
                            <div className="text-base font-black font-cinzel text-white">
                              {match.homeScore} - {match.awayScore}
                            </div>
                            <div className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                              evalResult.exactHit
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                : evalResult.outcomeHit
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              {evalResult.description}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-xs font-black font-cinzel text-amber-400/80">VS</span>
                            <span className="text-[10px] text-slate-500 block">Tu Pronóstico</span>
                            <div className="text-sm font-black font-cinzel text-amber-300">
                              {pred.homeScore} - {pred.awayScore}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl neu-card p-1.5 flex items-center justify-center border border-amber-400/30">
                          <img src={match.awayLogo} alt={match.awayAcademyName} className="w-full h-full object-contain rounded" />
                        </div>
                        <span className="text-xs font-extrabold text-white line-clamp-2 max-w-[110px] leading-tight">
                          {match.awayAcademyName}
                        </span>

                        {/* Away Score Counter */}
                        {match.status !== 'finished' ? (
                          <div className="flex items-center gap-1 neu-pressed px-2 py-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleScoreChange(match.id, 'away', -1)}
                              className="w-6 h-6 rounded-lg bg-black/40 hover:bg-black/60 text-white font-black text-sm flex items-center justify-center active:scale-90 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-black font-cinzel text-lg text-amber-300">
                              {pred.awayScore}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleScoreChange(match.id, 'away', 1)}
                              className="w-6 h-6 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-black text-sm flex items-center justify-center active:scale-90 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <div className="font-mono text-xs text-slate-400">
                            Real: <strong className="text-white text-sm font-cinzel">{match.awayScore}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Pronóstico Chips for upcoming matches */}
                    {match.status !== 'finished' && (
                      <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Atajos:</span>
                        {[
                          { label: '1 - 0', h: 1, a: 0 },
                          { label: '2 - 1', h: 2, a: 1 },
                          { label: '2 - 0', h: 2, a: 0 },
                          { label: '1 - 1', h: 1, a: 1 },
                          { label: '0 - 0', h: 0, a: 0 },
                          { label: '0 - 1', h: 0, a: 1 },
                          { label: '1 - 2', h: 1, a: 2 },
                        ].map((chip) => {
                          const isSelected = pred.homeScore === chip.h && pred.awayScore === chip.a;
                          return (
                            <button
                              key={chip.label}
                              type="button"
                              onClick={() => setQuickScore(match.id, chip.h, chip.a)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-400 text-black font-black shadow-sm'
                                  : 'neu-pressed text-slate-400 hover:text-white hover:border-amber-400/30'
                              }`}
                            >
                              {chip.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Footer match details */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <div className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3 h-3 text-[#D4AF37]" />
                        <span className="truncate">{match.stadium}</span>
                      </div>
                      {onSelectMatch && (
                        <button
                          type="button"
                          onClick={() => onSelectMatch(match)}
                          className="text-amber-300 hover:text-white flex items-center gap-0.5 font-bold cursor-pointer"
                        >
                          <span>Ver Ficha</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Bottom Bar with Action Button */}
          <div className="sticky bottom-4 z-30 p-4 rounded-2xl neu-card-gold ring-1 ring-amber-400/50 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl neu-pressed flex items-center justify-center text-amber-300 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-white">
                  {totalPredictedCount} de {totalMatchesAvailable} partidos pronosticados
                </p>
                <p className="text-[11px] text-slate-400">
                  {userName ? `Participante: ${userName}` : 'Ingresa tu nombre para registrar tu Quiniela'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSubmitQuiniela}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none min-h-[48px] px-8 py-3 rounded-xl neu-btn-gold text-black font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-black" />
                    <span>Registrar Mi Quiniela</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="min-h-[48px] px-4 py-3 rounded-xl neu-pressed text-[#25D366] font-bold text-xs uppercase tracking-wider border border-[#25D366]/40 hover:bg-[#25D366]/10 active:scale-98 transition-all cursor-pointer flex items-center gap-2"
                title="Compartir pronósticos por WhatsApp"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* 4. LEADERBOARD / TABLA DE POSICIONES DE LA QUINIELA */
        <div className="space-y-8">
          
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 2nd Place */}
            {leaderboard[1] && (
              <div className="order-2 md:order-1 rounded-3xl neu-card p-6 border border-slate-400/30 text-center space-y-3 relative overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-slate-300 text-black mx-auto flex items-center justify-center font-black text-lg font-cinzel shadow-lg">
                  2°
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-white text-base truncate">{leaderboard[1].userName}</h4>
                  <p className="text-[11px] text-slate-400">{leaderboard[1].userPhone ? leaderboard[1].userPhone.slice(-4) + '****' : 'Participante'}</p>
                </div>
                <div className="p-3 rounded-xl neu-pressed">
                  <span className="text-3xl font-black font-cinzel text-slate-200">{leaderboard[1].totalPoints}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">PUNTOS</span>
                </div>
                <p className="text-[11px] text-slate-400">{leaderboard[1].exactHitsCount} exactos • {leaderboard[1].outcomeHitsCount} simples</p>
              </div>
            )}

            {/* 1st Place - Golden Spotlight */}
            {leaderboard[0] && (
              <div className="order-1 md:order-2 rounded-3xl neu-card-gold p-7 ring-2 ring-[#D4AF37] text-center space-y-3 relative overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.3)]">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-black font-black text-[10px] uppercase tracking-widest">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>LÍDER DE LA QUINIELA</span>
                </div>

                <div className="w-16 h-16 rounded-full neu-btn-gold text-black mx-auto flex items-center justify-center font-black text-2xl font-cinzel shadow-2xl border-2 border-white">
                  1°
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-white text-lg truncate font-cinzel">{leaderboard[0].userName}</h4>
                  <p className="text-xs text-amber-300/80 font-medium">{leaderboard[0].userPhone ? leaderboard[0].userPhone.slice(-4) + '****' : 'Participante'}</p>
                </div>
                <div className="p-4 rounded-xl neu-pressed border border-amber-400/30">
                  <span className="text-4xl font-black font-cinzel text-amber-300">{leaderboard[0].totalPoints}</span>
                  <span className="text-[11px] text-amber-300/80 font-extrabold uppercase block tracking-wider">PUNTOS OFICIALES</span>
                </div>
                <p className="text-xs text-slate-300 font-semibold">{leaderboard[0].exactHitsCount} aciertos exactos (+5 pts)</p>
              </div>
            )}

            {/* 3rd Place */}
            {leaderboard[2] && (
              <div className="order-3 md:order-3 rounded-3xl neu-card p-6 border border-amber-800/50 text-center space-y-3 relative overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-amber-800 text-white mx-auto flex items-center justify-center font-black text-lg font-cinzel shadow-lg">
                  3°
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-white text-base truncate">{leaderboard[2].userName}</h4>
                  <p className="text-[11px] text-slate-400">{leaderboard[2].userPhone ? leaderboard[2].userPhone.slice(-4) + '****' : 'Participante'}</p>
                </div>
                <div className="p-3 rounded-xl neu-pressed">
                  <span className="text-3xl font-black font-cinzel text-amber-500">{leaderboard[2].totalPoints}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">PUNTOS</span>
                </div>
                <p className="text-[11px] text-slate-400">{leaderboard[2].exactHitsCount} exactos • {leaderboard[2].outcomeHitsCount} simples</p>
              </div>
            )}
          </div>

          {/* Complete Ranking Table */}
          <div className="rounded-3xl neu-card overflow-hidden shadow-2xl space-y-0">
            <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#171926] via-[#12141f] to-[#171926] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black font-cinzel text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Clasificación General de la Quiniela EMILIATEX C.A</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {leaderboard.length} participantes registrados • Puntuación actualizada en tiempo real
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('predict')}
                className="px-4 py-2 rounded-xl neu-btn-gold text-black text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                + Llenar Mi Quiniela
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-black/40 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                    <th className="py-3.5 px-4 text-center">Pos</th>
                    <th className="py-3.5 px-4">Participante</th>
                    <th className="py-3.5 px-4 text-center">Pronósticos</th>
                    <th className="py-3.5 px-4 text-center">Exactos (+5)</th>
                    <th className="py-3.5 px-4 text-center">Simples (+2)</th>
                    <th className="py-3.5 px-4 text-center font-black text-amber-300">TOTAL PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leaderboard.map((entry, idx) => {
                    const isCurrentUser = userName && entry.userName.toLowerCase() === userName.toLowerCase();
                    const predCount = entry.predictions ? Object.keys(entry.predictions).length : 0;

                    return (
                      <tr
                        key={entry.id}
                        className={`hover:bg-white/5 transition-colors ${
                          isCurrentUser ? 'bg-amber-400/10 border-l-4 border-amber-400' : ''
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
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold">{entry.userName}</span>
                            {isCurrentUser && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black uppercase">
                                Tú
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Registrado: {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-300 font-mono">
                          {predCount}
                        </td>
                        <td className="py-3.5 px-4 text-center text-amber-400 font-mono font-bold">
                          {entry.exactHitsCount || 0}
                        </td>
                        <td className="py-3.5 px-4 text-center text-emerald-400 font-mono font-bold">
                          {entry.outcomeHitsCount || 0}
                        </td>
                        <td className="py-3.5 px-4 text-center font-black font-cinzel text-amber-300 text-lg">
                          {entry.totalPoints}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-black/40 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Puntuación auditada y regulada por EMILIATEX C.A</span>
              </span>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="text-[#25D366] font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Consultar bases y premios de la Quiniela</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
