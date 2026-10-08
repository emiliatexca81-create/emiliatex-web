import React, { useState, useEffect } from 'react';
import { 
  TournamentMatch, 
  Academy, 
  Player, 
  MatchLineupPlayer, 
  MatchEvent, 
  MatchLineups 
} from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  Users, 
  Shirt, 
  Save, 
  Shield, 
  Activity, 
  Sparkles, 
  ArrowRightLeft, 
  Crown,
  AlertCircle,
  Flag,
  UserCheck,
  Check,
  Clock
} from 'lucide-react';

interface MatchLineupModalProps {
  match: TournamentMatch;
  academies: Academy[];
  players: Player[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedMatch: TournamentMatch) => void;
}

const COMMON_FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '3-4-3', '3-2-1', '3-3-1', '4-1-4-1', '5-3-2'];
const POSITIONS: Array<'Portero' | 'Defensa' | 'Centrocampista' | 'Delantero'> = [
  'Portero',
  'Defensa',
  'Centrocampista',
  'Delantero'
];

export const MatchLineupModal: React.FC<MatchLineupModalProps> = ({
  match,
  academies,
  players,
  isOpen,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'away' | 'events' | 'officials'>('home');

  // Formations & Coaches
  const homeAcademy = academies.find(a => a.id === match.homeAcademyId);
  const awayAcademy = academies.find(a => a.id === match.awayAcademyId);

  const [homeFormation, setHomeFormation] = useState<string>(
    match.lineups?.homeFormation || '4-3-3'
  );
  const [awayFormation, setAwayFormation] = useState<string>(
    match.lineups?.awayFormation || '4-4-2'
  );

  const [homeCoach, setHomeCoach] = useState<string>(
    match.lineups?.homeCoach || homeAcademy?.coach || ''
  );
  const [awayCoach, setAwayCoach] = useState<string>(
    match.lineups?.awayCoach || awayAcademy?.coach || ''
  );
  const [referee, setReferee] = useState<string>(match.referee || '');

  // Players
  const [homeStarters, setHomeStarters] = useState<MatchLineupPlayer[]>(
    match.lineups?.homeStarters || []
  );
  const [homeSubstitutes, setHomeSubstitutes] = useState<MatchLineupPlayer[]>(
    match.lineups?.homeSubstitutes || []
  );

  const [awayStarters, setAwayStarters] = useState<MatchLineupPlayer[]>(
    match.lineups?.awayStarters || []
  );
  const [awaySubstitutes, setAwaySubstitutes] = useState<MatchLineupPlayer[]>(
    match.lineups?.awaySubstitutes || []
  );

  // Events
  const [events, setEvents] = useState<MatchEvent[]>(match.events || []);

  // Quick player add form states
  const [newPlayerTeam, setNewPlayerTeam] = useState<'home' | 'away'>('home');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState<number>(10);
  const [newPlayerPos, setNewPlayerPos] = useState<'Portero' | 'Defensa' | 'Centrocampista' | 'Delantero'>('Delantero');
  const [newPlayerIsStarter, setNewPlayerIsStarter] = useState(true);
  const [newPlayerIsCaptain, setNewPlayerIsCaptain] = useState(false);

  // Quick event add form states
  const [newEventTeam, setNewEventTeam] = useState<'home' | 'away'>('home');
  const [newEventType, setNewEventType] = useState<'goal' | 'yellow_card' | 'red_card' | 'substitution'>('goal');
  const [newEventMinute, setNewEventMinute] = useState<string>("35'");
  const [newEventPlayer, setNewEventPlayer] = useState<string>('');
  const [newEventAssistant, setNewEventAssistant] = useState<string>('');
  const [newEventPlayerOut, setNewEventPlayerOut] = useState<string>('');
  const [newEventDetail, setNewEventDetail] = useState<string>('');

  // Sync state when match changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setHomeFormation(match.lineups?.homeFormation || '4-3-3');
      setAwayFormation(match.lineups?.awayFormation || '4-4-2');
      setHomeCoach(match.lineups?.homeCoach || homeAcademy?.coach || '');
      setAwayCoach(match.lineups?.awayCoach || awayAcademy?.coach || '');
      setReferee(match.referee || '');
      setHomeStarters(match.lineups?.homeStarters || []);
      setHomeSubstitutes(match.lineups?.homeSubstitutes || []);
      setAwayStarters(match.lineups?.awayStarters || []);
      setAwaySubstitutes(match.lineups?.awaySubstitutes || []);
      setEvents(match.events || []);
    }
  }, [isOpen, match, homeAcademy, awayAcademy]);

  if (!isOpen) return null;

  // Registered players of home & away academies for quick selector
  const homeDbPlayers = players.filter(p => 
    p.academyId === match.homeAcademyId || 
    (homeAcademy && p.academyName.toLowerCase() === homeAcademy.name.toLowerCase())
  );
  const awayDbPlayers = players.filter(p => 
    p.academyId === match.awayAcademyId || 
    (awayAcademy && p.academyName.toLowerCase() === awayAcademy.name.toLowerCase())
  );

  // Auto-populate from registered academy squad
  const handleAutoPopulateHome = () => {
    if (homeDbPlayers.length === 0) {
      // Create standard default squad
      const sampleNames = ['Mateo Gómez', 'Santiago Ruiz', 'Alejandro Meza', 'Daniel Rojas', 'Carlos Vargas', 'Juan Ospina', 'Felipe Ortiz', 'Andrés Londoño', 'Samuel Restrepo', 'David Zapata', 'Nicolás Pérez'];
      const starters = sampleNames.map((name, i) => ({
        name,
        number: i === 0 ? 1 : i + 2,
        position: i === 0 ? 'Portero' : i < 5 ? 'Defensa' : i < 9 ? 'Centrocampista' : 'Delantero',
        isStarter: true,
        captain: i === 4
      }));
      setHomeStarters(starters);
      return;
    }

    const starters = homeDbPlayers.slice(0, 11).map((p, idx) => ({
      id: p.id,
      name: p.name,
      number: p.number || (idx + 1),
      position: p.position || 'Delantero',
      photo: p.photo,
      isStarter: true,
      captain: idx === 0 && p.position !== 'Portero'
    }));

    const subs = homeDbPlayers.slice(11).map((p, idx) => ({
      id: p.id,
      name: p.name,
      number: p.number || (12 + idx),
      position: p.position || 'Centrocampista',
      photo: p.photo,
      isStarter: false
    }));

    setHomeStarters(starters);
    setHomeSubstitutes(subs);
  };

  const handleAutoPopulateAway = () => {
    if (awayDbPlayers.length === 0) {
      const sampleNames = ['Lucas Herrera', 'Esteban Silva', 'Gabriel Torres', 'Sebastián Ríos', 'Tomás Morales', 'Matías Cárdenas', 'Jerónimo Cruz', 'Simón Beltrán', 'Emiliano Cano', 'Damián Gil', 'Kevin Suárez'];
      const starters = sampleNames.map((name, i) => ({
        name,
        number: i === 0 ? 1 : i + 2,
        position: i === 0 ? 'Portero' : i < 5 ? 'Defensa' : i < 9 ? 'Centrocampista' : 'Delantero',
        isStarter: true,
        captain: i === 3
      }));
      setAwayStarters(starters);
      return;
    }

    const starters = awayDbPlayers.slice(0, 11).map((p, idx) => ({
      id: p.id,
      name: p.name,
      number: p.number || (idx + 1),
      position: p.position || 'Delantero',
      photo: p.photo,
      isStarter: true,
      captain: idx === 0 && p.position !== 'Portero'
    }));

    const subs = awayDbPlayers.slice(11).map((p, idx) => ({
      id: p.id,
      name: p.name,
      number: p.number || (12 + idx),
      position: p.position || 'Centrocampista',
      photo: p.photo,
      isStarter: false
    }));

    setAwayStarters(starters);
    setAwaySubstitutes(subs);
  };

  // Add custom player to active lineup
  const handleAddPlayer = (team: 'home' | 'away') => {
    if (!newPlayerName.trim()) return;

    const newPly: MatchLineupPlayer = {
      id: `lp-${Date.now()}`,
      name: newPlayerName.trim(),
      number: Number(newPlayerNumber) || 10,
      position: newPlayerPos,
      isStarter: newPlayerIsStarter,
      captain: newPlayerIsCaptain
    };

    if (team === 'home') {
      if (newPlayerIsStarter) {
        setHomeStarters(prev => [...prev, newPly]);
      } else {
        setHomeSubstitutes(prev => [...prev, newPly]);
      }
    } else {
      if (newPlayerIsStarter) {
        setAwayStarters(prev => [...prev, newPly]);
      } else {
        setAwaySubstitutes(prev => [...prev, newPly]);
      }
    }

    setNewPlayerName('');
    setNewPlayerNumber(prev => (prev >= 99 ? 1 : prev + 1));
    setNewPlayerIsCaptain(false);
  };

  // Switch role between Starter & Substitute
  const handleToggleStarter = (team: 'home' | 'away', playerIndex: number, currentlyStarter: boolean) => {
    if (team === 'home') {
      if (currentlyStarter) {
        const player = homeStarters[playerIndex];
        setHomeStarters(prev => prev.filter((_, i) => i !== playerIndex));
        setHomeSubstitutes(prev => [...prev, { ...player, isStarter: false }]);
      } else {
        const player = homeSubstitutes[playerIndex];
        setHomeSubstitutes(prev => prev.filter((_, i) => i !== playerIndex));
        setHomeStarters(prev => [...prev, { ...player, isStarter: true }]);
      }
    } else {
      if (currentlyStarter) {
        const player = awayStarters[playerIndex];
        setAwayStarters(prev => prev.filter((_, i) => i !== playerIndex));
        setAwaySubstitutes(prev => [...prev, { ...player, isStarter: false }]);
      } else {
        const player = awaySubstitutes[playerIndex];
        setAwaySubstitutes(prev => prev.filter((_, i) => i !== playerIndex));
        setAwayStarters(prev => [...prev, { ...player, isStarter: true }]);
      }
    }
  };

  const handleToggleCaptain = (team: 'home' | 'away', playerIndex: number, isStarter: boolean) => {
    if (team === 'home') {
      if (isStarter) {
        setHomeStarters(prev => prev.map((p, idx) => ({
          ...p,
          captain: idx === playerIndex ? !p.captain : false
        })));
      } else {
        setHomeSubstitutes(prev => prev.map((p, idx) => ({
          ...p,
          captain: idx === playerIndex ? !p.captain : false
        })));
      }
    } else {
      if (isStarter) {
        setAwayStarters(prev => prev.map((p, idx) => ({
          ...p,
          captain: idx === playerIndex ? !p.captain : false
        })));
      } else {
        setAwaySubstitutes(prev => prev.map((p, idx) => ({
          ...p,
          captain: idx === playerIndex ? !p.captain : false
        })));
      }
    }
  };

  const handleRemovePlayer = (team: 'home' | 'away', playerIndex: number, isStarter: boolean) => {
    if (team === 'home') {
      if (isStarter) {
        setHomeStarters(prev => prev.filter((_, i) => i !== playerIndex));
      } else {
        setHomeSubstitutes(prev => prev.filter((_, i) => i !== playerIndex));
      }
    } else {
      if (isStarter) {
        setAwayStarters(prev => prev.filter((_, i) => i !== playerIndex));
      } else {
        setAwaySubstitutes(prev => prev.filter((_, i) => i !== playerIndex));
      }
    }
  };

  // Events handler
  const handleAddEvent = () => {
    if (!newEventPlayer.trim()) return;

    const eventItem: MatchEvent = {
      id: `evt-${Date.now()}`,
      team: newEventTeam,
      type: newEventType,
      minute: newEventMinute.trim().includes("'") ? newEventMinute.trim() : `${newEventMinute.trim()}'`,
      playerName: newEventPlayer.trim(),
      assistantName: newEventType === 'goal' && newEventAssistant.trim() ? newEventAssistant.trim() : undefined,
      playerOut: newEventType === 'substitution' && newEventPlayerOut.trim() ? newEventPlayerOut.trim() : undefined,
      detail: newEventDetail.trim() || undefined
    };

    setEvents(prev => [...prev, eventItem]);
    setNewEventPlayer('');
    setNewEventAssistant('');
    setNewEventPlayerOut('');
    setNewEventDetail('');
  };

  const handleRemoveEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  // Final Save
  const handleSaveAll = () => {
    const updatedLineups: MatchLineups = {
      homeFormation,
      awayFormation,
      homeCoach: homeCoach.trim() || undefined,
      awayCoach: awayCoach.trim() || undefined,
      homeStarters,
      homeSubstitutes,
      awayStarters,
      awaySubstitutes
    };

    const updatedMatch: TournamentMatch = {
      ...match,
      referee: referee.trim() || undefined,
      lineups: updatedLineups,
      events
    };

    onSave(updatedMatch);
    onClose();
  };

  const activeLineupPlayers = activeTab === 'home' ? [...homeStarters, ...homeSubstitutes] : [...awayStarters, ...awaySubstitutes];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-[#D4AF37]/50 bg-[#0e1019] text-white shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden">
        
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-[#171927] via-[#121421] to-[#171927] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0 shadow-md">
              <Shirt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold text-[10px] uppercase border border-amber-400/30">
                  {match.category || 'Sub-15'}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {match.phase} • {match.stadium}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white font-cinzel tracking-wide flex items-center gap-2 mt-0.5">
                <span>{match.homeAcademyName}</span>
                <span className="text-[#D4AF37] font-mono text-sm">vs</span>
                <span>{match.awayAcademyName}</span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#090b12] px-4 sm:px-6 gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('home')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'home'
                ? 'border-[#D4AF37] text-amber-300 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Local: {match.homeAcademyName}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px] font-mono">
              {homeStarters.length + homeSubstitutes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('away')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'away'
                ? 'border-[#D4AF37] text-amber-300 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4 text-blue-400" />
            <span>Visitante: {match.awayAcademyName}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px] font-mono">
              {awayStarters.length + awaySubstitutes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'events'
                ? 'border-[#D4AF37] text-amber-300 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Incidencias & Goles</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px] font-mono">
              {events.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('officials')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'officials'
                ? 'border-[#D4AF37] text-amber-300 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Flag className="w-4 h-4 text-yellow-400" />
            <span>DT & Árbitro</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1 & 2: HOME OR AWAY LINEUP */}
          {(activeTab === 'home' || activeTab === 'away') && (
            <div className="space-y-6">
              {/* Quick Formation and Auto Load Header */}
              <div className="p-4 rounded-2xl bg-[#141624] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                    Formación Táctica:
                  </label>
                  <select
                    value={activeTab === 'home' ? homeFormation : awayFormation}
                    onChange={e => {
                      if (activeTab === 'home') setHomeFormation(e.target.value);
                      else setAwayFormation(e.target.value);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#1d2033] border border-[#D4AF37]/50 text-amber-300 font-bold text-xs focus:outline-none"
                  >
                    {COMMON_FORMATIONS.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={activeTab === 'home' ? handleAutoPopulateHome : handleAutoPopulateAway}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-amber-300 border border-[#D4AF37]/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      Cargar Jugadores de {activeTab === 'home' ? match.homeAcademyName : match.awayAcademyName}
                    </span>
                  </button>
                </div>
              </div>

              {/* Quick Add Player Form */}
              <div className="p-4 rounded-2xl bg-[#11131c] border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Añadir Jugador a la Alineación de {activeTab === 'home' ? match.homeAcademyName : match.awayAcademyName}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] text-slate-400 mb-1">Nombre del Jugador:</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newPlayerName}
                        onChange={e => setNewPlayerName(e.target.value)}
                        placeholder="Ej: Daniel Silva"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#1a1c2a] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  {/* Or Pick from registered players */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Dorsal (#):</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={newPlayerNumber}
                      onChange={e => setNewPlayerNumber(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#1a1c2a] border border-white/10 text-white text-xs text-center font-bold focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] text-slate-400 mb-1">Posición:</label>
                    <select
                      value={newPlayerPos}
                      onChange={e => setNewPlayerPos(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#1a1c2a] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    >
                      {POSITIONS.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newPlayerIsStarter}
                          onChange={e => setNewPlayerIsStarter(e.target.checked)}
                          className="accent-[#D4AF37] rounded"
                        />
                        <span className="text-[11px]">Titular</span>
                      </label>
                      <label className="flex items-center gap-1 text-xs text-amber-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newPlayerIsCaptain}
                          onChange={e => setNewPlayerIsCaptain(e.target.checked)}
                          className="accent-[#D4AF37] rounded"
                        />
                        <span className="text-[11px]">Capitán</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddPlayer(activeTab)}
                      className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c49f2e] text-black font-extrabold text-xs uppercase transition-all cursor-pointer shrink-0"
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                {/* Quick picker from existing academy players */}
                {(activeTab === 'home' ? homeDbPlayers : awayDbPlayers).length > 0 && (
                  <div className="pt-2 border-t border-white/5 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      O seleccionar de la plantilla registrada:
                    </span>
                    {(activeTab === 'home' ? homeDbPlayers : awayDbPlayers).slice(0, 8).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setNewPlayerName(p.name);
                          setNewPlayerNumber(p.number || 10);
                          setNewPlayerPos(p.position as any || 'Delantero');
                        }}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-amber-300 border border-white/10 transition-colors cursor-pointer"
                      >
                        #{p.number} {p.name} ({p.position})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* TWO SIDES: TITULARES vs SUPLENTES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* TITULARES */}
                <div className="p-4 rounded-2xl bg-[#12141f] border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">
                        Once Titular ({activeTab === 'home' ? homeStarters.length : awayStarters.length})
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Formación: {activeTab === 'home' ? homeFormation : awayFormation}
                    </span>
                  </div>

                  {(activeTab === 'home' ? homeStarters : awayStarters).length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>No hay titulares asignados todavía.</p>
                      <p className="text-[11px] mt-1 text-slate-600">Usa el botón "Cargar Jugadores" o agrega individualmente.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                      {(activeTab === 'home' ? homeStarters : awayStarters).map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#171927] border border-white/5 hover:border-white/15 transition-all text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-[#D4AF37] text-black font-black font-mono text-[11px] flex items-center justify-center shrink-0 shadow-sm">
                              {p.number}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate flex items-center gap-1.5">
                                <span>{p.name}</span>
                                {p.captain && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider">
                                    C
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400">{p.position}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleCaptain(activeTab, idx, true)}
                              className={`p-1 rounded text-[10px] transition-colors cursor-pointer ${
                                p.captain ? 'text-amber-300 bg-amber-400/20' : 'text-slate-500 hover:text-amber-300'
                              }`}
                              title="Asignar o quitar capitanía"
                            >
                              <Crown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStarter(activeTab, idx, true)}
                              className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-white/5 transition-colors cursor-pointer"
                              title="Mover al banquillo (suplente)"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePlayer(activeTab, idx, true)}
                              className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Eliminar de la lista"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SUPLENTES / BANQUILLO */}
                <div className="p-4 rounded-2xl bg-[#12141f] border border-blue-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">
                        Banquillo de Suplentes ({activeTab === 'home' ? homeSubstitutes.length : awaySubstitutes.length})
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Disponibles para cambio</span>
                  </div>

                  {(activeTab === 'home' ? homeSubstitutes : awaySubstitutes).length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>No hay suplentes en la banca.</p>
                      <p className="text-[11px] mt-1 text-slate-600">Puedes agregar o transferir jugadores aquí.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                      {(activeTab === 'home' ? homeSubstitutes : awaySubstitutes).map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#171927] border border-white/5 hover:border-white/15 transition-all text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-slate-700 text-white font-mono text-[11px] flex items-center justify-center shrink-0">
                              {p.number}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{p.name}</p>
                              <p className="text-[10px] text-slate-400">{p.position}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleStarter(activeTab, idx, false)}
                              className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-colors cursor-pointer"
                              title="Promover a Titular"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePlayer(activeTab, idx, false)}
                              className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Eliminar de la lista"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: EVENTS / INCIDENCIAS */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#11131c] border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Registrar Incidencia / Gol / Tarjeta / Sustitución</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] text-slate-400 mb-1">Equipo:</label>
                    <select
                      value={newEventTeam}
                      onChange={e => setNewEventTeam(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#1a1c2a] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="home">{match.homeAcademyName} (Local)</option>
                      <option value="away">{match.awayAcademyName} (Visitante)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] text-slate-400 mb-1">Tipo de Incidencia:</label>
                    <select
                      value={newEventType}
                      onChange={e => setNewEventType(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#1a1c2a] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="goal">⚽ Gol</option>
                      <option value="yellow_card">🟨 Tarjeta Amarilla</option>
                      <option value="red_card">🟥 Tarjeta Roja</option>
                      <option value="substitution">🔄 Sustitución / Cambio</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Minuto:</label>
                    <input
                      type="text"
                      value={newEventMinute}
                      onChange={e => setNewEventMinute(e.target.value)}
                      placeholder="Ej: 24' o 45'+2"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#1a1c2a] border border-white/10 text-white text-xs text-center font-mono focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {newEventType === 'substitution' ? 'Jugador que ENTRA:' : 'Jugador Protagonista:'}
                    </label>
                    <input
                      type="text"
                      value={newEventPlayer}
                      onChange={e => setNewEventPlayer(e.target.value)}
                      placeholder="Nombre del jugador"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#1a1c2a] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  {newEventType === 'goal' && (
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] text-slate-400 mb-1">Asistencia (opcional):</label>
                      <input
                        type="text"
                        value={newEventAssistant}
                        onChange={e => setNewEventAssistant(e.target.value)}
                        placeholder="Ej: Asistencia de Mateo Cardona"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#1a1c2a] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  )}

                  {newEventType === 'substitution' && (
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] text-slate-400 mb-1">Jugador que SALE:</label>
                      <input
                        type="text"
                        value={newEventPlayerOut}
                        onChange={e => setNewEventPlayerOut(e.target.value)}
                        placeholder="Nombre del jugador sustituido"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#1a1c2a] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] text-slate-400 mb-1">Detalle opcional:</label>
                    <input
                      type="text"
                      value={newEventDetail}
                      onChange={e => setNewEventDetail(e.target.value)}
                      placeholder="Ej: Tiro penal, de cabeza..."
                      className="w-full px-3 py-1.5 rounded-lg bg-[#1a1c2a] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddEvent}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs uppercase transition-all cursor-pointer shadow-md"
                    >
                      Añadir
                    </button>
                  </div>
                </div>
              </div>

              {/* Events timeline list */}
              <div className="p-4 rounded-2xl bg-[#12141f] border border-white/10 space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider border-b border-white/10 pb-2">
                  Incidencias Registradas ({events.length})
                </h4>

                {events.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No se han registrado goles ni tarjetas en este encuentro.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 space-y-1">
                    {events.map(ev => {
                      const isHome = ev.team === 'home';
                      const teamName = isHome ? match.homeAcademyName : match.awayAcademyName;
                      return (
                        <div key={ev.id} className="pt-2.5 pb-2 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-amber-400 text-xs px-2 py-0.5 rounded bg-white/5">
                              {ev.minute}
                            </span>
                            <span className="text-base">
                              {ev.type === 'goal' && '⚽'}
                              {ev.type === 'yellow_card' && '🟨'}
                              {ev.type === 'red_card' && '🟥'}
                              {ev.type === 'substitution' && '🔄'}
                            </span>
                            <div>
                              <p className="font-bold text-white">
                                {ev.playerName}
                                {ev.assistantName && <span className="text-slate-400 font-normal"> (asist. {ev.assistantName})</span>}
                                {ev.playerOut && <span className="text-slate-400 font-normal"> (sale {ev.playerOut})</span>}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {teamName} {ev.detail ? `• ${ev.detail}` : ''}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveEvent(ev.id)}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: OFFICIALS & COACHES */}
          {activeTab === 'officials' && (
            <div className="p-4 sm:p-6 rounded-2xl bg-[#12141f] border border-white/10 space-y-4 max-w-xl mx-auto">
              <h4 className="text-xs font-black text-white uppercase tracking-wider border-b border-white/10 pb-2 flex items-center gap-2">
                <Flag className="w-4 h-4 text-yellow-400" />
                <span>Cuerpo Técnico y Oficiales del Encuentro</span>
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Director Técnico Local ({match.homeAcademyName}):
                </label>
                <input
                  type="text"
                  value={homeCoach}
                  onChange={e => setHomeCoach(e.target.value)}
                  placeholder="Nombre del DT Local"
                  className="w-full px-3 py-2 rounded-xl bg-[#1a1c2a] border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Director Técnico Visitante ({match.awayAcademyName}):
                </label>
                <input
                  type="text"
                  value={awayCoach}
                  onChange={e => setAwayCoach(e.target.value)}
                  placeholder="Nombre del DT Visitante"
                  className="w-full px-3 py-2 rounded-xl bg-[#1a1c2a] border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Árbitro Principal Asignado:
                </label>
                <input
                  type="text"
                  value={referee}
                  onChange={e => setReferee(e.target.value)}
                  placeholder="Ej: Wilmar Roldán / Colegio de Árbitros Élite"
                  className="w-full px-3 py-2 rounded-xl bg-[#1a1c2a] border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-[#0c0e17] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] sm:text-xs text-slate-400">
            <span className="font-semibold text-white">Resumen: </span>
            {homeStarters.length} titulares {match.homeAcademyName} • {awayStarters.length} titulares {match.awayAcademyName} • {events.length} incidencias
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89726] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Alineaciones</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
