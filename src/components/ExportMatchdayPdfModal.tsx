import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Download,
  X,
  Printer,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  Clock,
  Shield,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { TournamentMatch, Academy, Player, TOURNAMENT_CATEGORIES } from '../types';
import {
  generateMatchdayPDF,
  exportMatchdayCSV,
  getMatchesForMatchday,
  MatchdayPdfFormat,
  MatchdayPDFExportResult
} from '../utils/matchdayPdfExport';
import { getAvailableJornadas, formatMatchTime, getSettings } from '../services/storage';

interface ExportMatchdayPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: TournamentMatch[];
  academies: Academy[];
  players: Player[];
  defaultJornada?: string;
  defaultCategory?: string;
  onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ExportMatchdayPdfModal: React.FC<ExportMatchdayPdfModalProps> = ({
  isOpen,
  onClose,
  matches,
  academies,
  players,
  defaultJornada,
  defaultCategory = 'all',
  onToast
}) => {
  const availableJornadas = useMemo(() => {
    const list = getAvailableJornadas(matches || []);
    return list.length > 0 ? list : ['Jornada 1', 'Jornada 2', 'Jornada 3'];
  }, [matches]);

  const [selectedJornada, setSelectedJornada] = useState<string>(() => {
    return defaultJornada && availableJornadas.includes(defaultJornada)
      ? defaultJornada
      : (availableJornadas[0] || 'Jornada 1');
  });

  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory);
  const [formatType, setFormatType] = useState<MatchdayPdfFormat>('complete');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generationResult, setGenerationResult] = useState<MatchdayPDFExportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'config' | 'preview'>('config');

  // Update default jornada if prop changes
  useEffect(() => {
    if (defaultJornada && defaultJornada !== 'all') {
      setSelectedJornada(defaultJornada);
    }
  }, [defaultJornada]);

  // Clean up blob url on unmount or new generation
  useEffect(() => {
    return () => {
      if (generationResult?.blobUrl) {
        URL.revokeObjectURL(generationResult.blobUrl);
      }
    };
  }, [generationResult]);

  // Preview matches list for selected filters
  const previewMatches = useMemo(() => {
    return getMatchesForMatchday(matches || [], selectedJornada, selectedCategory);
  }, [matches, selectedJornada, selectedCategory]);

  const stadiumsCount = useMemo(() => {
    const set = new Set<string>();
    previewMatches.forEach(m => {
      if (m.stadium) set.add(m.stadium);
    });
    return set.size;
  }, [previewMatches]);

  if (!isOpen) return null;

  const handleExport = async (openInNewTab: boolean = false) => {
    try {
      setIsGenerating(true);
      setErrorMessage(null);
      setGenerationStep('Preparando partidos y nóminas de cancha...');

      if (previewMatches.length === 0) {
        throw new Error(`No hay partidos registrados para ${selectedJornada} en la categoría seleccionada.`);
      }

      const appSettings = getSettings();
      setGenerationStep('Cargando escudos oficiales de los clubes...');
      await new Promise(r => setTimeout(r, 60)); // smooth UI update

      const result = await generateMatchdayPDF(
        matches || [],
        academies || [],
        players || [],
        {
          jornada: selectedJornada,
          category: selectedCategory,
          formatType,
          tournamentName: appSettings.tournamentName || 'TORNEO ÉLITE EMILIATEX 2026',
          companyName: appSettings.companyName || 'EMILIATEX Confecciones & Uniformes',
          companyLogoUrl: appSettings.companyLogoUrl
        }
      );

      setGenerationResult(result);
      setGenerationStep('¡Planilla con escudos generada con éxito!');

      if (openInNewTab) {
        // Open in new tab for direct browser printing
        window.open(result.blobUrl, '_blank');
        onToast?.('Planilla abierta en pestaña nueva para imprimir o compartir', 'success');
      } else {
        // Trigger file download
        const link = document.createElement('a');
        link.href = result.blobUrl;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        onToast?.(`¡Planilla descargada con éxito! (${result.fileName})`, 'success');
      }

      setViewMode('preview');
    } catch (err: any) {
      console.error('Error al generar planilla de jornada:', err);
      const msg = err?.message || 'Ocurrió un error inesperado al compilar el PDF de la jornada.';
      setErrorMessage(msg);
      onToast?.(msg, 'error');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleExportCSV = () => {
    try {
      exportMatchdayCSV(matches || [], selectedJornada, selectedCategory);
      onToast?.('Partidos de la jornada exportados a archivo CSV / Excel', 'success');
    } catch (err: any) {
      onToast?.('Error al exportar CSV: ' + (err?.message || 'Error'), 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl neu-card-gold border border-[#D4AF37]/50 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col bg-[#0c0e17]">
        
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between gap-4 bg-gradient-to-r from-[#141624] via-[#1b1c2b] to-[#12141f]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl neu-pressed-gold text-[#D4AF37] flex items-center justify-center shrink-0 shadow-md border border-[#D4AF37]/40">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-black uppercase font-mono tracking-wider">
                  Mesa de Control & Árbitros
                </span>
                <span className="text-xs text-amber-300 font-mono font-bold">
                  PDF Cancha
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black font-cinzel text-white tracking-wide mt-0.5">
                Planilla de Campo / Partidos de la Jornada
              </h2>
              <p className="text-xs text-slate-300">
                Lleva a la cancha el cronograma y las actas de juego oficiales para registro de goles, tarjetas y firmas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl neu-pressed text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 border border-white/10"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="px-6 pt-3 pb-1 bg-black/40 border-b border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('config')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'config'
                  ? 'neu-btn-gold text-black font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>1. Configurar Planilla</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!generationResult) {
                  handleExport(false);
                } else {
                  setViewMode('preview');
                }
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'preview'
                  ? 'neu-btn-gold text-black font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>2. Vista Previa del PDF</span>
              {generationResult && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>

          {previewMatches.length > 0 && (
            <span className="text-[11px] font-mono text-amber-300 font-bold hidden sm:inline">
              {previewMatches.length} partidos listos para cancha
            </span>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* Error notice if any */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-red-300">No se pudo exportar la planilla:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* VIEW MODE: CONFIGURATION */}
          {viewMode === 'config' && (
            <div className="space-y-6">
              
              {/* Selector 1: Jornada */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-300 font-cinzel flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>1. Seleccionar Jornada a Exportar:</span>
                </label>
                
                <div className="flex flex-wrap items-center gap-2">
                  {availableJornadas.map(j => {
                    const count = (matches || []).filter(m => {
                      const matchJ = String(m.jornada || '').trim();
                      return matchJ.toLowerCase() === j.toLowerCase() ||
                        matchJ === j.replace('Jornada ', '');
                    }).length;

                    return (
                      <button
                        key={j}
                        type="button"
                        onClick={() => setSelectedJornada(j)}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                          selectedJornada === j
                            ? 'neu-btn-gold text-black font-black shadow-md scale-102 border border-[#D4AF37]'
                            : 'neu-pressed text-slate-300 hover:text-white border border-white/5'
                        }`}
                      >
                        <span>{j}</span>
                        <span className="text-[10px] opacity-75 font-mono px-1.5 py-0.5 rounded-full bg-black/30">
                          {count}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setSelectedJornada('all')}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      selectedJornada === 'all'
                        ? 'neu-btn-gold text-black font-black shadow-md scale-102 border border-[#D4AF37]'
                        : 'neu-pressed text-slate-300 hover:text-white border border-white/5'
                    }`}
                  >
                    <span>Todas las Jornadas</span>
                    <span className="text-[10px] opacity-75 font-mono px-1.5 py-0.5 rounded-full bg-black/30">
                      {matches.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Selector 2: Categoría */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-300 font-cinzel flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>2. Filtrar por Categoría (Opcional):</span>
                </label>
                
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'neu-btn-gold text-black font-black shadow'
                        : 'neu-pressed text-slate-300 hover:text-white'
                    }`}
                  >
                    Todas las Categorías (General)
                  </button>
                  {TOURNAMENT_CATEGORIES.map(cat => {
                    const countInCat = (matches || []).filter(m => {
                      const matchJ = String(m.jornada || '').trim();
                      const matchesJornada = selectedJornada === 'all' || 
                        matchJ.toLowerCase() === selectedJornada.toLowerCase() ||
                        matchJ === selectedJornada.replace('Jornada ', '');
                      return matchesJornada && m.category === cat;
                    }).length;

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          selectedCategory === cat
                            ? 'neu-btn-gold text-black font-black shadow'
                            : 'neu-pressed text-slate-300 hover:text-white'
                        }`}
                      >
                        <span>{cat}</span>
                        {countInCat > 0 && (
                          <span className="text-[10px] font-mono opacity-80">({countInCat})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector 3: Formato / Contenido para Cancha */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-300 font-cinzel flex items-center gap-2">
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>3. Tipo de Formato para Cancha:</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Option 1: Complete Package */}
                  <div
                    onClick={() => setFormatType('complete')}
                    className={`p-4 rounded-2xl neu-pressed cursor-pointer transition-all border ${
                      formatType === 'complete'
                        ? 'border-[#D4AF37] bg-[#1a1b29] shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                        : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-white font-cinzel">Paquete Completo</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold uppercase font-mono">
                        Recomendado
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Cronograma general de la fecha + 1 acta oficial por cada partido con nóminas y firmas.
                    </p>
                  </div>

                  {/* Option 2: Schedule only */}
                  <div
                    onClick={() => setFormatType('schedule_only')}
                    className={`p-4 rounded-2xl neu-pressed cursor-pointer transition-all border ${
                      formatType === 'schedule_only'
                        ? 'border-[#D4AF37] bg-[#1a1b29] shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                        : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-white font-cinzel">Solo Cronograma</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold uppercase font-mono">
                        1 Página
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Cartelera compacta para pegar en la entrada de la cancha con horas AM/PM y sedes.
                    </p>
                  </div>

                  {/* Option 3: Match sheets only */}
                  <div
                    onClick={() => setFormatType('sheets_only')}
                    className={`p-4 rounded-2xl neu-pressed cursor-pointer transition-all border ${
                      formatType === 'sheets_only'
                        ? 'border-[#D4AF37] bg-[#1a1b29] shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                        : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-white font-cinzel">Solo Planillas de Juego</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[9px] font-bold uppercase font-mono">
                        Para Árbitros
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Hojas individuales para la mesa técnica y árbitro central de cada partido.
                    </p>
                  </div>

                </div>
              </div>

              {/* Matchday Summary Card & Match Preview Table */}
              <div className="p-4 sm:p-5 rounded-2xl neu-card-gold border border-[#D4AF37]/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl neu-pressed-gold text-[#D4AF37] flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-cinzel">
                        Resumen de Partidos a Exportar
                      </h4>
                      <p className="text-xs text-slate-300">
                        {selectedJornada === 'all' ? 'Todas las jornadas' : selectedJornada} • {selectedCategory === 'all' ? 'Todas las categorías' : selectedCategory}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full neu-pressed text-amber-300 text-xs font-bold font-mono">
                      {previewMatches.length} Partidos
                    </span>
                    <span className="px-3 py-1 rounded-full neu-pressed text-slate-300 text-xs font-mono">
                      {stadiumsCount} Canchas
                    </span>
                  </div>
                </div>

                {previewMatches.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No se encontraron partidos para los filtros seleccionados.
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                    {previewMatches.map((m, idx) => {
                      const homeAcad = (academies || []).find(a => a.id === m.homeAcademyId || a.name === m.homeAcademyName);
                      const awayAcad = (academies || []).find(a => a.id === m.awayAcademyId || a.name === m.awayAcademyName);
                      const homeLogo = m.homeLogo || homeAcad?.logo;
                      const awayLogo = m.awayLogo || awayAcad?.logo;

                      return (
                        <div
                          key={m.id || idx}
                          className="p-2.5 rounded-xl neu-pressed flex items-center justify-between gap-3 text-xs border border-white/5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                              {homeLogo ? (
                                <img src={homeLogo} alt={m.homeAcademyName} className="w-5 h-5 rounded-md object-contain bg-white/10 p-0.5 border border-[#D4AF37]/40" />
                              ) : (
                                <div className="w-5 h-5 rounded-md bg-[#131724] border border-[#D4AF37]/40 flex items-center justify-center text-[8px] font-bold text-amber-300">
                                  {m.homeAcademyName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="font-bold text-white max-w-[90px] sm:max-w-[130px] truncate">
                                {m.homeAcademyName}
                              </span>
                              <span className="text-amber-300 font-bold font-cinzel text-[11px]">vs</span>
                              {awayLogo ? (
                                <img src={awayLogo} alt={m.awayAcademyName} className="w-5 h-5 rounded-md object-contain bg-white/10 p-0.5 border border-[#D4AF37]/40" />
                              ) : (
                                <div className="w-5 h-5 rounded-md bg-[#131724] border border-[#D4AF37]/40 flex items-center justify-center text-[8px] font-bold text-amber-300">
                                  {m.awayAcademyName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="font-bold text-white max-w-[90px] sm:max-w-[130px] truncate">
                                {m.awayAcademyName}
                              </span>
                            </div>

                            <span className="text-[10px] text-slate-400 hidden md:inline ml-2">
                              {m.category || 'Sub-15'} • {m.date || 'Fecha'} • {formatMatchTime(m.time || '')}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="px-2 py-0.5 rounded-md bg-black/40 text-amber-300 font-mono text-[10px] font-bold">
                              {m.referee ? `Árb: ${m.referee}` : 'Árb. por asignar'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* VIEW MODE: PDF PREVIEW */}
          {viewMode === 'preview' && (
            <div className="space-y-4">
              {generationResult?.blobUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl neu-pressed text-xs">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Planilla generada: {generationResult.fileName}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleExport(true)}
                      className="text-amber-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir en Pestaña Completa</span>
                    </button>
                  </div>

                  <div className="w-full h-[540px] rounded-2xl overflow-hidden border border-[#D4AF37]/40 shadow-inner bg-slate-900">
                    <iframe
                      src={generationResult.blobUrl}
                      title="Vista Previa de Planilla de Cancha"
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center neu-pressed rounded-3xl border border-white/10 space-y-4">
                  <div className="w-14 h-14 rounded-2xl neu-pressed-gold text-[#D4AF37] flex items-center justify-center mx-auto">
                    <Printer className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white font-cinzel">
                      Genera la vista previa del documento
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      Haz clic en "Descargar PDF" o "Abrir para Imprimir" para compilar el archivo con las actas de juego y el cronograma de {selectedJornada}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExport(false)}
                    disabled={isGenerating || previewMatches.length === 0}
                    className="px-6 py-3 rounded-2xl neu-btn-gold text-black font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg active:scale-95 transition-all inline-flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4 text-black" />
                    <span>Compilar y Ver Planilla</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Bottom Actions Bar */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-gradient-to-t from-[#0e101a] to-[#121422] flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={previewMatches.length === 0}
              className="px-3.5 py-2.5 rounded-2xl neu-btn-dark text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-40"
              title="Exportar listado a Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Exportar en CSV</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {isGenerating && (
              <span className="text-xs text-amber-300 font-mono flex items-center gap-1.5 animate-pulse mr-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                {generationStep}
              </span>
            )}

            <button
              type="button"
              onClick={() => handleExport(true)}
              disabled={isGenerating || previewMatches.length === 0}
              className="px-4 py-2.5 rounded-2xl neu-btn-dark border border-[#D4AF37]/50 text-amber-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Abrir en pestaña nueva para mandar a imprimir directamente en la impresora"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>Imprimir / Abrir</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport(false)}
              disabled={isGenerating || previewMatches.length === 0}
              className="px-5 py-2.5 rounded-2xl neu-btn-gold text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50 border border-[#D4AF37]"
              title="Descargar archivo PDF completo a tu teléfono o computadora"
            >
              <Download className="w-4 h-4 text-black" />
              <span>{isGenerating ? 'Compilando...' : 'Descargar PDF para Cancha'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
