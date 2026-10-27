import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  X, 
  Check, 
  Layers, 
  Trophy, 
  Calendar, 
  Users, 
  AlertCircle,
  Sparkles,
  Printer,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { TournamentMatch, Academy, TOURNAMENT_CATEGORIES } from '../types';
import { 
  generateConfrontationsPDF, 
  buildCategoryReportData, 
  exportCategoryConfrontationsCSV,
  PDFExportResult 
} from '../utils/pdfExport';
import { normalizeCategory } from '../services/storage';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: TournamentMatch[];
  academies: Academy[];
  defaultCategory?: string;
  onToast?: (msg: string, type: 'success' | 'error') => void;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  matches,
  academies,
  defaultCategory = 'all',
  onToast
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory);
  const [includeStandings, setIncludeStandings] = useState<boolean>(true);
  const [includeMatchHistory, setIncludeMatchHistory] = useState<boolean>(true);
  const [includePendingMatrix, setIncludePendingMatrix] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generationResult, setGenerationResult] = useState<PDFExportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'config' | 'preview'>('config');

  // Available categories that have academies or matches
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    TOURNAMENT_CATEGORIES.forEach(c => set.add(c));
    (matches || []).forEach(m => {
      if (m.category) set.add(m.category as string);
    });
    (academies || []).forEach(a => {
      if (a.categories && Array.isArray(a.categories)) {
        a.categories.forEach(c => set.add(c));
      } else if (a.category) {
        if (Array.isArray(a.category)) (a.category as any).forEach((c: any) => set.add(c));
        else set.add(a.category);
      }
    });
    return Array.from(set);
  }, [matches, academies]);

  // Preview data for the selected category
  const previewData = useMemo(() => {
    try {
      const previewCat = selectedCategory === 'all' 
        ? (availableCategories[0] || 'Sub-15')
        : selectedCategory;
      return buildCategoryReportData(matches || [], academies || [], previewCat);
    } catch (err) {
      console.warn('Error generating preview data:', err);
      return {
        categoryName: selectedCategory,
        normalizedCat: normalizeCategory(selectedCategory),
        academies: [],
        matches: [],
        standings: [],
        teamConfrontations: []
      };
    }
  }, [selectedCategory, availableCategories, matches, academies]);

  if (!isOpen) return null;

  const handleExport = async (openInNewTab: boolean = false) => {
    try {
      setIsGenerating(true);
      setErrorMessage(null);
      setGenerationStep('Analizando fixture y estadísticas...');
      
      await new Promise(r => setTimeout(r, 150));
      setGenerationStep('Construyendo matriz de rivales enfrentados vs pendientes...');
      
      const result = await generateConfrontationsPDF(matches || [], academies || [], {
        category: selectedCategory,
        includeStandings,
        includeMatchHistory,
        includePendingMatrix
      });

      setGenerationStep('¡Documento PDF finalizado exitosamente!');
      setGenerationResult(result);
      setViewMode('preview');

      if (openInNewTab && result.blobUrl) {
        window.open(result.blobUrl, '_blank');
      }

      const catLabel = selectedCategory === 'all' ? 'todas las categorías' : selectedCategory;
      if (onToast) {
        onToast(`¡PDF de cruces e historial generado exitosamente para ${catLabel}!`, 'success');
      }
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      const msg = err.message || 'Error al generar el documento PDF.';
      setErrorMessage(msg);
      if (onToast) {
        onToast(msg, 'error');
      }
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleDownloadAgain = () => {
    if (!generationResult) return;
    try {
      const a = document.createElement('a');
      a.href = generationResult.blobUrl;
      a.download = generationResult.fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          document.body.removeChild(a);
        } catch (e) {}
      }, 500);
      if (onToast) onToast('Descarga iniciada nuevamente', 'success');
    } catch (e) {
      window.open(generationResult.blobUrl, '_blank');
    }
  };

  const handleExportCSV = () => {
    try {
      const res = exportCategoryConfrontationsCSV(matches || [], academies || [], selectedCategory);
      if (onToast) {
        onToast(`¡Archivo Excel/CSV "${res.fileName}" descargado con éxito!`, 'success');
      }
    } catch (err: any) {
      if (onToast) onToast('Error al exportar CSV: ' + (err?.message || ''), 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-3xl bg-gradient-to-b from-[#181924] to-[#0f1016] border border-amber-400/40 rounded-3xl p-5 sm:p-7 shadow-2xl relative max-h-[94vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl neu-card-gold flex items-center justify-center shadow-md shrink-0">
              <FileText className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white font-cinzel tracking-wide">
                  Exportar Historial y Cruces en PDF
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
                  OFICIAL
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Control jornada a jornada y matriz anti-repetición de rivales por categoría
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {generationResult && (
              <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('config')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    viewMode === 'config' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Opciones
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'preview' ? 'neu-btn-gold text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver PDF</span>
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl neu-pressed text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status / Step indicator during generation */}
        {isGenerating && (
          <div className="my-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center gap-3 text-amber-300 text-xs animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            <span className="font-bold">{generationStep || 'Procesando documento PDF oficial...'}</span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="my-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 text-red-300 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => handleExport(false)}
              className="px-3 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 font-bold transition-all cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Success Banner if already generated */}
        {generationResult && (
          <div className="my-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-300">
                  ¡Documento PDF Oficial listo y descargado!
                </p>
                <p className="text-[11px] text-slate-400 font-mono truncate max-w-[280px]">
                  {generationResult.fileName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => window.open(generationResult.blobUrl, '_blank')}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Abrir en pantalla completa o imprimir"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                <span>Abrir en Pestaña</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadAgain}
                className="px-3 py-1.5 rounded-xl neu-btn-gold text-black text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                title="Descargar otra copia del archivo"
              >
                <Download className="w-3.5 h-3.5 text-black" />
                <span>Descargar Archivo</span>
              </button>
            </div>
          </div>
        )}

        {/* Body Content: Config View OR Embedded Preview */}
        {viewMode === 'preview' && generationResult ? (
          <div className="flex-1 min-h-[350px] max-h-[58vh] py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Vista previa interactiva del documento:</span>
              <span className="font-mono text-amber-400 font-bold">{generationResult.fileName}</span>
            </div>
            <div className="flex-1 w-full rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-inner">
              <iframe
                src={generationResult.blobUrl}
                title="Vista previa del documento PDF"
                className="w-full h-full min-h-[340px] rounded-2xl"
              />
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto py-4 space-y-5 pr-1 custom-scrollbar">
            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Selecciona la Categoría a Exportar</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setGenerationResult(null);
                  }}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border ${
                    selectedCategory === 'all'
                      ? 'neu-btn-gold text-black border-amber-400 shadow-md font-black'
                      : 'neu-pressed text-slate-300 border-white/5 hover:border-amber-400/30'
                  }`}
                >
                  <span>Todas</span>
                  <span className="text-[10px] opacity-75 font-mono">Dossier General</span>
                </button>
                {availableCategories.map(cat => {
                  const normCat = normalizeCategory(cat);
                  const count = (matches || []).filter(m => normalizeCategory(m.category) === normCat).length;
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setGenerationResult(null);
                      }}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border ${
                        isSelected
                          ? 'neu-btn-gold text-black border-amber-400 shadow-md font-black'
                          : 'neu-pressed text-slate-300 border-white/5 hover:border-amber-400/30'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="text-[10px] opacity-75 font-mono">{count} partidos</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Included Sections Toggles */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Secciones Incluidas en el Documento</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Standings */}
                <button
                  type="button"
                  onClick={() => setIncludeStandings(!includeStandings)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    includeStandings 
                      ? 'bg-amber-500/10 border-amber-400/40 text-white' 
                      : 'bg-black/30 border-white/5 text-slate-500'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs mt-0.5 shrink-0 ${
                    includeStandings ? 'bg-amber-400 text-black font-bold' : 'bg-white/10 text-transparent'
                  }`}>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tabla de Posiciones</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      PJ, PG, PE, PP, GF, GC, DG y Puntos
                    </p>
                  </div>
                </button>

                {/* Match History */}
                <button
                  type="button"
                  onClick={() => setIncludeMatchHistory(!includeMatchHistory)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    includeMatchHistory 
                      ? 'bg-amber-500/10 border-amber-400/40 text-white' 
                      : 'bg-black/30 border-white/5 text-slate-500'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs mt-0.5 shrink-0 ${
                    includeMatchHistory ? 'bg-amber-400 text-black font-bold' : 'bg-white/10 text-transparent'
                  }`}>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Historial por Jornada</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Resultados, fechas, horas y estados
                    </p>
                  </div>
                </button>

                {/* Pending rivals matrix */}
                <button
                  type="button"
                  onClick={() => setIncludePendingMatrix(!includePendingMatrix)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    includePendingMatrix 
                      ? 'bg-amber-500/10 border-amber-400/40 text-white' 
                      : 'bg-black/30 border-white/5 text-slate-500'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs mt-0.5 shrink-0 ${
                    includePendingMatrix ? 'bg-amber-400 text-black font-bold' : 'bg-white/10 text-transparent'
                  }`}>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>Control de Cruces</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Rivales ya enfrentados vs pendientes
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Report Preview Summary Card */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">
                  Resumen: <span className="text-amber-400 font-bold">{selectedCategory === 'all' ? 'Todas las Categorías' : selectedCategory}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {previewData.academies.length} Equipos Participantes
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white/5">
                  <span className="text-[10px] text-slate-400 block">Total Partidos</span>
                  <span className="text-base font-black text-white font-mono">{previewData.matches.length}</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-300 block">Jugados</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {previewData.matches.filter(m => m.status === 'finished').length}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[10px] text-amber-300 block">Por Jugar</span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    {previewData.matches.filter(m => m.status !== 'finished').length}
                  </span>
                </div>
              </div>

              {/* Sample of pending matchups */}
              {previewData.teamConfrontations.length > 0 && (
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 block">
                    Vista rápida de cruces por club:
                  </span>
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1 text-[11px]">
                    {previewData.teamConfrontations.slice(0, 3).map(tc => (
                      <div key={tc.team.id} className="flex items-center justify-between p-1.5 rounded-lg bg-black/40">
                        <span className="font-bold text-white truncate max-w-[160px]">{tc.team.name}</span>
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-emerald-400">{tc.playedOpponents.length} jugados</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-amber-400 font-bold">{tc.pendingOpponents.length} pendientes</span>
                        </div>
                      </div>
                    ))}
                    {previewData.teamConfrontations.length > 3 && (
                      <p className="text-[10px] text-slate-500 italic text-center">
                        + {previewData.teamConfrontations.length - 3} clubes más en el reporte completo
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl neu-pressed text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer text-center"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-500/20"
              title="Exportar archivo CSV compatible con Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar</span> Excel
            </button>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={isGenerating || (!includeMatchHistory && !includePendingMatrix && !includeStandings)}
              onClick={() => handleExport(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Abrir directamente el PDF en el navegador para ver o imprimir"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
              <span>Ver en Pantalla</span>
            </button>

            <button
              type="button"
              disabled={isGenerating || (!includeMatchHistory && !includePendingMatrix && !includeStandings)}
              onClick={() => handleExport(false)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl neu-btn-gold text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 text-black animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-black" />
                  <span>Descargar PDF Oficial</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
