import jsPDF from 'jspdf';
import autoTable, { Color } from 'jspdf-autotable';
import { TournamentMatch, Academy, Player, TOURNAMENT_CATEGORIES } from '../types';
import { normalizeCategory, formatMatchTime } from '../services/storage';

export type MatchdayPdfFormat = 'complete' | 'schedule_only' | 'sheets_only';

export interface MatchdayExportOptions {
  jornada: string; // e.g. 'Jornada 1', 'all'
  category?: string; // 'all' or 'Sub-15', etc.
  formatType?: MatchdayPdfFormat;
  tournamentName?: string;
  companyName?: string;
  dateFilter?: string; // optional specific date
}

export interface MatchdayPDFExportResult {
  success: boolean;
  fileName: string;
  blob: Blob;
  blobUrl: string;
  dataUri?: string;
  totalMatches: number;
  jornadaName: string;
}

/**
 * Robust instantiation of jsPDF across diverse bundler environments
 */
function createJsPdfDoc(options: any): any {
  let DocConstructor: any = jsPDF;
  if (typeof DocConstructor !== 'function') {
    if ((jsPDF as any)?.default && typeof (jsPDF as any).default === 'function') {
      DocConstructor = (jsPDF as any).default;
    } else if ((jsPDF as any)?.jsPDF && typeof (jsPDF as any).jsPDF === 'function') {
      DocConstructor = (jsPDF as any).jsPDF;
    }
  }
  return new DocConstructor(options);
}

/**
 * Robust execution of autoTable plugin
 */
function runAutoTable(doc: any, options: any): void {
  if (typeof autoTable === 'function') {
    autoTable(doc, options);
    return;
  }
  if ((autoTable as any)?.default && typeof (autoTable as any).default === 'function') {
    (autoTable as any).default(doc, options);
    return;
  }
  if (typeof doc.autoTable === 'function') {
    doc.autoTable(options);
    return;
  }
  console.warn('autoTable not detected directly, attempting plugin call');
}

/**
 * Filter and sort matches for a given matchday and optional category
 */
export function getMatchesForMatchday(
  allMatches: TournamentMatch[],
  jornada: string,
  category: string = 'all'
): TournamentMatch[] {
  let filtered = [...(allMatches || [])];

  if (jornada && jornada !== 'all') {
    filtered = filtered.filter(m => {
      const matchJ = String(m.jornada || '').trim();
      return matchJ.toLowerCase() === jornada.toLowerCase() ||
        matchJ === jornada.replace('Jornada ', '') ||
        String(m.phase || '').toLowerCase().includes(jornada.toLowerCase());
    });
  }

  if (category && category !== 'all') {
    const norm = normalizeCategory(category);
    filtered = filtered.filter(m => normalizeCategory(m.category as string) === norm);
  }

  // Sort by date, then time, then stadium
  return filtered.sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    const timeA = a.time || '';
    const timeB = b.time || '';
    if (timeA !== timeB) return timeA.localeCompare(timeB);
    return (a.stadium || '').localeCompare(b.stadium || '');
  });
}

/**
 * Retrieve team squad / roster players for a match
 */
function getTeamRosterForMatch(
  academyId: string,
  academyName: string,
  category: string | undefined,
  match: TournamentMatch,
  isHome: boolean,
  allPlayers: Player[]
): { number: number | string; name: string; position: string; isStarter: boolean }[] {
  const lineups = match.lineups;
  const starters = isHome ? lineups?.homeStarters : lineups?.awayStarters;
  const substitutes = isHome ? lineups?.homeSubstitutes : lineups?.awaySubstitutes;

  if (starters && starters.length > 0) {
    const roster: { number: number | string; name: string; position: string; isStarter: boolean }[] = [];
    starters.forEach(p => {
      roster.push({
        number: p.number ?? '',
        name: p.name || 'Jugador Titular',
        position: p.position || 'Titular',
        isStarter: true
      });
    });
    (substitutes || []).forEach(p => {
      roster.push({
        number: p.number ?? '',
        name: p.name || 'Jugador Suplente',
        position: p.position || 'Suplente',
        isStarter: false
      });
    });
    return roster;
  }

  // Lookup in general players list by academy and category
  const normCat = category ? normalizeCategory(category) : '';
  const registered = (allPlayers || []).filter(p => {
    const matchesAcad = (p.academyId && p.academyId === academyId) ||
      (p.academyName && p.academyName.toLowerCase() === academyName.toLowerCase());
    if (!matchesAcad) return false;
    if (normCat && p.category) {
      return normalizeCategory(p.category) === normCat;
    }
    return true;
  });

  if (registered.length > 0) {
    return registered.map((p, idx) => ({
      number: p.number ?? (idx + 1),
      name: p.name,
      position: p.position || 'Jugador',
      isStarter: idx < 11
    }));
  }

  return [];
}

/**
 * Generate official Matchday PDF for field use (Planilla de Campo / Partidos de la Jornada)
 */
export async function generateMatchdayPDF(
  allMatches: TournamentMatch[],
  allAcademies: Academy[],
  allPlayers: Player[],
  options: MatchdayExportOptions
): Promise<MatchdayPDFExportResult> {
  const {
    jornada,
    category = 'all',
    formatType = 'complete',
    tournamentName = 'TORNEO ÉLITE EMILIATEX 2026',
    companyName = 'EMILIATEX Confecciones & Uniformes'
  } = options;

  const matches = getMatchesForMatchday(allMatches, jornada, category);

  const doc = createJsPdfDoc({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - (marginX * 2);

  // Paleta de colores oficial para impresión de alta legibilidad en cancha
  const primaryNavy: Color = [13, 20, 36];
  const goldHeader: Color = [212, 175, 55];
  const goldAccent: Color = [180, 140, 30];
  const fieldGreen: Color = [16, 120, 70];
  const grayLight: Color = [245, 247, 250];
  const grayBorder: Color = [200, 205, 215];
  const darkText = '#111827';

  const jornadaLabel = jornada === 'all' ? 'Todas las Jornadas' : jornada;
  const categoryLabel = category === 'all' ? 'Todas las Categorías' : category;

  // ==========================================
  // SECCIÓN 1: CRONOGRAMA DE LA JORNADA (Si formatType es complete o schedule_only)
  // ==========================================
  if (formatType === 'complete' || formatType === 'schedule_only' || matches.length === 0) {
    // Encabezado institucional
    doc.setFillColor(13, 20, 36);
    doc.roundedRect(marginX, 12, contentWidth, 24, 3, 3, 'F');

    // Borde dorado superior
    doc.setFillColor(212, 175, 55);
    doc.rect(marginX, 12, contentWidth, 2, 'F');

    doc.setTextColor(212, 175, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(tournamentName.toUpperCase(), marginX + 6, 20);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`PLANILLA OFICIAL DE CAMPO • ${companyName.toUpperCase()}`, marginX + 6, 26);

    doc.setFontSize(8);
    doc.setTextColor(200, 210, 230);
    const nowStr = new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Generado: ${nowStr} • Mesa de Control & Árbitros`, marginX + 6, 31);

    // Badge derecha
    doc.setFillColor(212, 175, 55);
    doc.roundedRect(pageWidth - marginX - 55, 17, 50, 14, 2, 2, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(jornadaLabel.toUpperCase(), pageWidth - marginX - 30, 23.5, { align: 'center' });
    doc.setFontSize(7.5);
    doc.text(`${matches.length} PARTIDOS PROGRAMADOS`, pageWidth - marginX - 30, 28, { align: 'center' });

    // Sub-banner de parámetros de filtro
    let currentY = 41;
    doc.setFillColor(242, 245, 250);
    doc.setDrawColor(210, 215, 225);
    doc.roundedRect(marginX, currentY, contentWidth, 11, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setTextColor(50, 60, 80);
    doc.setFont('helvetica', 'bold');
    doc.text('CARTELERA GENERAL DE PARTIDOS PARA LA JORNADA', marginX + 4, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.text(`Categoría: ${categoryLabel}   |   Uso: Planilla de Cancha, Árbitros y Delegados`, pageWidth - marginX - 4, currentY + 7, { align: 'right' });

    currentY += 15;

    if (matches.length === 0) {
      doc.setFontSize(11);
      doc.setTextColor(150, 50, 50);
      doc.text(`No se encontraron partidos registrados para "${jornadaLabel}" y categoría "${categoryLabel}".`, marginX + 5, currentY + 15);
    } else {
      // Tabla Master de Partidos de la Jornada
      const scheduleRows = matches.map((m, idx) => {
        const timeFormatted = formatMatchTime(m.time || '');
        const dateFormatted = m.date || 'Por definir';
        const cat = m.category || 'Sub-15';
        const stadium = m.stadium || 'Cancha Principal';
        const referee = m.referee ? m.referee : 'Por designar';
        const statusText = m.status === 'finished' 
          ? `Finalizado (${m.homeScore ?? 0} - ${m.awayScore ?? 0})` 
          : (m.status === 'live' ? `🔴 En Vivo (${m.homeScore ?? 0} - ${m.awayScore ?? 0})` : 'Próximo');
        
        return [
          String(idx + 1),
          `${dateFormatted}\n${timeFormatted}`,
          stadium,
          cat,
          `${m.homeAcademyName}\nvs\n${m.awayAcademyName}`,
          referee,
          statusText,
          '[   ] - [   ]' // Casilla para anotar en cancha
        ];
      });

      runAutoTable(doc, {
        startY: currentY,
        head: [[
          'N°',
          'Fecha / Hora',
          'Cancha / Sede',
          'Cat.',
          'Encuentro (Local vs Visitante)',
          'Árbitro Designado',
          'Estado',
          'Resultado Cancha'
        ]],
        body: scheduleRows,
        theme: 'grid',
        headStyles: {
          fillColor: primaryNavy,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
          valign: 'middle'
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [20, 25, 35],
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 24, halign: 'center' },
          2: { cellWidth: 28 },
          3: { cellWidth: 16, halign: 'center', fontStyle: 'bold', textColor: [180, 120, 20] },
          4: { cellWidth: 46, fontStyle: 'bold' },
          5: { cellWidth: 26 },
          6: { cellWidth: 20, halign: 'center' },
          7: { cellWidth: 22, halign: 'center', fontStyle: 'bold', textColor: [30, 40, 60] }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { left: marginX, right: marginX }
      });

      // Tabla de Instrucciones y Protocolo de Cancha al final del cronograma
      const finalY = (doc as any).lastAutoTable?.finalY || currentY + 60;
      if (finalY < pageHeight - 45) {
        doc.setFillColor(245, 247, 250);
        doc.setDrawColor(212, 175, 55);
        doc.roundedRect(marginX, finalY + 5, contentWidth, 26, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(13, 20, 36);
        doc.text('INSTRUCCIONES PARA LA MESA TÉCNICA Y ÁRBITROS EN CANCHA:', marginX + 4, finalY + 11);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(60, 70, 85);
        doc.text('1. Verificar cédulas/documentos de identidad y números dorsales antes del pitazo inicial.', marginX + 4, finalY + 16);
        doc.text('2. Anotar en los casilleros de esta planilla los goles, minutos, y tarjetas amarillas/rojas inmediatamente ocurran.', marginX + 4, finalY + 20);
        doc.text('3. Al finalizar cada encuentro, exigir la firma de los capitanes de ambos equipos y entregar el acta a la organización.', marginX + 4, finalY + 24);
        doc.text('4. En caso de reclamo o incidencia grave, redactar detalladamente en el anverso de la planilla individual.', marginX + 4, finalY + 28);
      }
    }
  }

  // ==========================================
  // SECCIÓN 2: PLANILLAS INDIVIDUALES DE PARTIDO (ACTAS DE JUEGO)
  // Cada partido tiene su propia hoja lista para imprimir y llevar a la cancha
  // ==========================================
  if (formatType === 'complete' || formatType === 'sheets_only') {
    matches.forEach((m, matchIdx) => {
      // Si ya teníamos el cronograma o no es el primer partido, agregamos nueva página
      if (formatType === 'complete' || matchIdx > 0) {
        doc.addPage();
      }

      const matchDateStr = m.date || 'Fecha por definir';
      const matchTimeStr = formatMatchTime(m.time || '');
      const matchCat = m.category || 'Sub-15';
      const matchJornadaStr = m.jornada ? `Jornada ${String(m.jornada).replace(/jornada/i, '').trim()}` : jornadaLabel;
      const matchStadium = m.stadium || 'Cancha Principal';
      const refereeName = m.referee ? m.referee : 'Por designar';

      // ENCABEZADO DE LA PLANILLA DE PARTIDO
      doc.setFillColor(13, 20, 36);
      doc.roundedRect(marginX, 10, contentWidth, 20, 2, 2, 'F');
      doc.setFillColor(212, 175, 55);
      doc.rect(marginX, 10, contentWidth, 1.8, 'F');

      doc.setTextColor(212, 175, 55);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${tournamentName.toUpperCase()} • ACTA OFICIAL DE PARTIDO`, marginX + 5, 17);

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`PLANILLA DE CAMPO Y CONTROL DE ARBITRAJE • ENCUENTRO N° ${matchIdx + 1}`, marginX + 5, 23);
      doc.text(`${matchJornadaStr.toUpperCase()}  |  CATEGORÍA: ${matchCat.toUpperCase()}`, marginX + 5, 27.5);

      // Badge fecha y hora en el encabezado
      doc.setFillColor(212, 175, 55);
      doc.roundedRect(pageWidth - marginX - 58, 14, 54, 13, 2, 2, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`${matchDateStr} • ${matchTimeStr}`, pageWidth - marginX - 31, 20, { align: 'center' });
      doc.setFontSize(7.5);
      doc.text(matchStadium.toUpperCase(), pageWidth - marginX - 31, 24.5, { align: 'center' });

      // TABLERO DE RESULTADO Y EQUIPOS ENFRENTADOS (CENTRAL HERO BOX)
      let currentY = 33;
      doc.setFillColor(248, 250, 253);
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.6);
      doc.roundedRect(marginX, currentY, contentWidth, 24, 2, 2, 'FD');

      // Columna Local
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(13, 20, 36);
      doc.text(m.homeAcademyName.toUpperCase(), marginX + 8, currentY + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 110, 125);
      doc.text('EQUIPO LOCAL', marginX + 8, currentY + 13);
      doc.text(`DT: ${(m.lineups?.homeCoach || 'No especificado')}`, marginX + 8, currentY + 18);

      // Marcador Box central
      doc.setFillColor(13, 20, 36);
      doc.roundedRect(pageWidth / 2 - 28, currentY + 4, 56, 16, 2, 2, 'F');
      doc.setTextColor(212, 175, 55);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('MARCADOR FINAL', pageWidth / 2, currentY + 8.5, { align: 'center' });

      // Casilleros para escribir resultado en cancha
      const currentScoreHome = m.homeScore !== undefined && m.status === 'finished' ? String(m.homeScore) : '  ';
      const currentScoreAway = m.awayScore !== undefined && m.status === 'finished' ? String(m.awayScore) : '  ';

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(pageWidth / 2 - 20, currentY + 10.5, 16, 8, 1, 1, 'F');
      doc.roundedRect(pageWidth / 2 + 4, currentY + 10.5, 16, 8, 1, 1, 'F');
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(currentScoreHome, pageWidth / 2 - 12, currentY + 16.5, { align: 'center' });
      doc.text(currentScoreAway, pageWidth / 2 + 12, currentY + 16.5, { align: 'center' });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text('-', pageWidth / 2, currentY + 16, { align: 'center' });

      // Columna Visitante
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(13, 20, 36);
      doc.text(m.awayAcademyName.toUpperCase(), pageWidth - marginX - 8, currentY + 8, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 110, 125);
      doc.text('EQUIPO VISITANTE', pageWidth - marginX - 8, currentY + 13, { align: 'right' });
      doc.text(`DT: ${(m.lineups?.awayCoach || 'No especificado')}`, pageWidth - marginX - 8, currentY + 18, { align: 'right' });

      // BARRA DE DATOS ARBITRALES
      currentY += 27;
      doc.setFillColor(240, 243, 248);
      doc.setDrawColor(200, 205, 215);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, currentY, contentWidth, 8, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 40, 60);
      doc.text(`Árbitro Central: ${refereeName}`, marginX + 4, currentY + 5.5);
      doc.text('Asistente 1: _____________________', marginX + 65, currentY + 5.5);
      doc.text('Asistente 2: _____________________', marginX + 115, currentY + 5.5);

      // NÓMINAS DE JUGADORES (LOCAL Y VISITANTE LADO A LADO)
      currentY += 11;
      const halfWidth = (contentWidth - 4) / 2;

      // Obtener nóminas pre-cargadas o generar filas en blanco
      const homeRoster = getTeamRosterForMatch(
        m.homeAcademyId,
        m.homeAcademyName,
        m.category,
        m,
        true,
        allPlayers
      );

      const awayRoster = getTeamRosterForMatch(
        m.awayAcademyId,
        m.awayAcademyName,
        m.category,
        m,
        false,
        allPlayers
      );

      // Asegurar 16 filas para que el árbitro/mesa tenga espacio suficiente en cancha
      const targetRows = 16;
      const buildRosterTableRows = (roster: any[]) => {
        const rows: any[] = [];
        for (let i = 0; i < targetRows; i++) {
          const p = roster[i];
          rows.push([
            p ? String(p.number) : String(i + 1),
            p ? p.name : '',
            p ? (p.isStarter ? 'TIT' : 'SUP') : (i < 11 ? 'TIT' : 'SUP'),
            '', // Goles
            '', // Tarjeta Amarilla
            '', // Tarjeta Roja
            ''  // Firma
          ]);
        }
        return rows;
      };

      const homeRows = buildRosterTableRows(homeRoster);
      const awayRows = buildRosterTableRows(awayRoster);

      // Tabla Equipo Local
      runAutoTable(doc, {
        startY: currentY,
        head: [[
          'N°',
          `Local: ${m.homeAcademyName.slice(0, 18)}`,
          'T/S',
          'G',
          'TA',
          'TR',
          'Firma'
        ]],
        body: homeRows,
        theme: 'grid',
        tableWidth: halfWidth,
        margin: { left: marginX },
        headStyles: {
          fillColor: primaryNavy,
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 1.5
        },
        bodyStyles: {
          fontSize: 6.5,
          textColor: [20, 25, 35],
          cellPadding: 1.4,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 7, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: halfWidth - 7 - 9 - 6 - 6 - 6 - 15 },
          2: { cellWidth: 9, halign: 'center', fontStyle: 'bold' },
          3: { cellWidth: 6, halign: 'center' },
          4: { cellWidth: 6, halign: 'center' },
          5: { cellWidth: 6, halign: 'center' },
          6: { cellWidth: 15, halign: 'center' }
        },
        alternateRowStyles: {
          fillColor: [250, 251, 253]
        }
      });

      // Tabla Equipo Visitante
      runAutoTable(doc, {
        startY: currentY,
        head: [[
          'N°',
          `Vis: ${m.awayAcademyName.slice(0, 18)}`,
          'T/S',
          'G',
          'TA',
          'TR',
          'Firma'
        ]],
        body: awayRows,
        theme: 'grid',
        tableWidth: halfWidth,
        margin: { left: marginX + halfWidth + 4 },
        headStyles: {
          fillColor: [30, 40, 60],
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 1.5
        },
        bodyStyles: {
          fontSize: 6.5,
          textColor: [20, 25, 35],
          cellPadding: 1.4,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 7, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: halfWidth - 7 - 9 - 6 - 6 - 6 - 15 },
          2: { cellWidth: 9, halign: 'center', fontStyle: 'bold' },
          3: { cellWidth: 6, halign: 'center' },
          4: { cellWidth: 6, halign: 'center' },
          5: { cellWidth: 6, halign: 'center' },
          6: { cellWidth: 15, halign: 'center' }
        },
        alternateRowStyles: {
          fillColor: [250, 251, 253]
        }
      });

      const afterTablesY = Math.max(
        (doc as any).lastAutoTable?.finalY || 0,
        currentY + 68
      );

      // CUADRO DE INCIDENCIAS, GOLES Y SUSTITUCIONES
      let incidentsY = afterTablesY + 3;
      doc.setFillColor(242, 245, 250);
      doc.setDrawColor(200, 205, 215);
      doc.roundedRect(marginX, incidentsY, contentWidth, 18, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(13, 20, 36);
      doc.text('INCIDENCIAS DEL PARTIDO (Minuto, Dorsal, Tipo: Gol, TA, TR o Sustitución):', marginX + 3, incidentsY + 4.5);

      // Si el partido ya tiene eventos guardados, listarlos brevemente
      if (m.events && m.events.length > 0) {
        const eventsText = m.events.slice(0, 4).map(e => {
          const typeStr = e.type === 'goal' ? 'GOL' : e.type === 'yellow_card' ? 'TA' : e.type === 'red_card' ? 'TR' : 'CAMBIO';
          return `${e.minute}' [${typeStr}] ${e.playerName} (${e.team === 'home' ? m.homeAcademyName : m.awayAcademyName})`;
        }).join('  |  ');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(40, 50, 65);
        doc.text(eventsText, marginX + 3, incidentsY + 9);
      } else {
        // Líneas en blanco para rellenar a mano
        doc.setDrawColor(215, 220, 230);
        doc.line(marginX + 3, incidentsY + 9, pageWidth - marginX - 3, incidentsY + 9);
        doc.line(marginX + 3, incidentsY + 14, pageWidth - marginX - 3, incidentsY + 14);
      }

      // OBSERVACIONES DEL ÁRBITRO
      let obsY = incidentsY + 20;
      doc.setFillColor(248, 250, 253);
      doc.setDrawColor(200, 205, 215);
      doc.roundedRect(marginX, obsY, contentWidth, 14, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(13, 20, 36);
      doc.text('OBSERVACIONES GENERALES / CONDUCTA / FIRMA DEL VEEDOR:', marginX + 3, obsY + 4.5);

      if (m.summary) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(50, 60, 75);
        doc.text(m.summary.slice(0, 160), marginX + 3, obsY + 9.5);
      } else {
        doc.setDrawColor(215, 220, 230);
        doc.line(marginX + 3, obsY + 8.5, pageWidth - marginX - 3, obsY + 8.5);
        doc.line(marginX + 3, obsY + 12, pageWidth - marginX - 3, obsY + 12);
      }

      // FIRMAS OFICIALES AL PIE DE PÁGINA
      let sigY = obsY + 17;
      const sigColWidth = contentWidth / 4;

      const signatures = [
        { title: 'Firma Capitán Local', sub: m.homeAcademyName.slice(0, 20) },
        { title: 'Firma Capitán Visitante', sub: m.awayAcademyName.slice(0, 20) },
        { title: 'Firma Árbitro Principal', sub: refereeName },
        { title: 'Firma Delegado de Mesa', sub: 'Mesa de Control Oficial' }
      ];

      signatures.forEach((sig, idx) => {
        const xPos = marginX + (idx * sigColWidth);
        doc.setDrawColor(120, 130, 145);
        doc.setLineWidth(0.4);
        doc.line(xPos + 4, sigY + 10, xPos + sigColWidth - 4, sigY + 10);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(20, 30, 45);
        doc.text(sig.title, xPos + (sigColWidth / 2), sigY + 13.5, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(100, 110, 125);
        doc.text(sig.sub, xPos + (sigColWidth / 2), sigY + 17, { align: 'center' });
      });
    });
  }

  // ==========================================
  // PIE DE PÁGINA GLOBAL CON NUMERACIÓN
  // ==========================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(130, 140, 155);

    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 9, pageWidth - marginX, pageHeight - 9);

    doc.text(
      `Torneo Élite EMILIATEX • ${jornadaLabel} (${categoryLabel}) • Impreso para uso en Cancha`,
      marginX,
      pageHeight - 5
    );

    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 5,
      { align: 'right' }
    );
  }

  const cleanFileName = `Planilla_Cancha_${jornadaLabel.replace(/\s+/g, '_')}_${categoryLabel.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  let dataUri: string | undefined;
  try {
    dataUri = doc.output('datauristring');
  } catch (e) {
    // ignore
  }

  return {
    success: true,
    fileName: cleanFileName,
    blob,
    blobUrl,
    dataUri,
    totalMatches: matches.length,
    jornadaName: jornadaLabel
  };
}

/**
 * Export matchday schedule to CSV for spreadsheet programs
 */
export function exportMatchdayCSV(
  allMatches: TournamentMatch[],
  jornada: string,
  category: string = 'all'
): void {
  const matches = getMatchesForMatchday(allMatches, jornada, category);
  const rows: string[] = [];

  rows.push(['N°', 'Jornada', 'Fecha', 'Hora', 'Cancha', 'Categoría', 'Equipo Local', 'Goles Local', 'Goles Visitante', 'Equipo Visitante', 'Árbitro', 'Estado'].map(c => `"${c}"`).join(','));

  matches.forEach((m, idx) => {
    rows.push([
      String(idx + 1),
      m.jornada || jornada,
      m.date || '',
      formatMatchTime(m.time || ''),
      m.stadium || '',
      m.category || 'Sub-15',
      m.homeAcademyName || '',
      m.homeScore !== undefined ? String(m.homeScore) : '',
      m.awayScore !== undefined ? String(m.awayScore) : '',
      m.awayAcademyName || '',
      m.referee || '',
      m.status || ''
    ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));
  });

  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Partidos_Cancha_${jornada.replace(/\s+/g, '_')}_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
