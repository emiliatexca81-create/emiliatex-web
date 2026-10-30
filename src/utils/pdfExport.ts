import jsPDF from 'jspdf';
import autoTable, { Color } from 'jspdf-autotable';
import { TournamentMatch, Academy, TOURNAMENT_CATEGORIES } from '../types';
import { normalizeCategory, computeAcademyStandings, formatMatchTime } from '../services/storage';
import { DEFAULT_EMILIATEX_LOGO_BASE64 } from '../assets/emiliatexDefaultLogo';

export interface PDFExportOptions {
  category: string;
  tournamentName?: string;
  includeStandings?: boolean;
  includeMatchHistory?: boolean;
  includePendingMatrix?: boolean;
}

export interface PDFExportResult {
  success: boolean;
  fileName: string;
  blob: Blob;
  blobUrl: string;
  dataUri?: string;
}

interface TeamOpponentStatus {
  opponentId: string;
  opponentName: string;
  hasPlayed: boolean;
  hasScheduled: boolean;
  matches: {
    jornada: string;
    status: 'upcoming' | 'live' | 'finished';
    scoreText: string;
    date: string;
    time: string;
  }[];
}

interface CategoryReportData {
  categoryName: string;
  normalizedCat: string;
  academies: Academy[];
  matches: TournamentMatch[];
  standings: {
    rank: number;
    name: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDiff: number;
    points: number;
  }[];
  teamConfrontations: {
    team: Academy;
    playedOpponents: TeamOpponentStatus[];
    pendingOpponents: TeamOpponentStatus[];
  }[];
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

function parseJornadaNum(jornadaVal?: string | number): number {
  if (jornadaVal === undefined || jornadaVal === null) return 999;
  const str = String(jornadaVal);
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999;
}

function isSameTeam(idA: string, nameA: string, idB: string, nameB: string): boolean {
  if (idA && idB && idA === idB) return true;
  const normA = (nameA || '').trim().toLowerCase();
  const normB = (nameB || '').trim().toLowerCase();
  return normA.length > 0 && normA === normB;
}

export function buildCategoryReportData(
  allMatches: TournamentMatch[],
  allAcademies: Academy[],
  categoryName: string
): CategoryReportData {
  const normCat = normalizeCategory(categoryName);

  const catMatches = (allMatches || [])
    .filter(m => normalizeCategory(m.category as string) === normCat)
    .sort((a, b) => {
      const jA = parseJornadaNum(a.jornada);
      const jB = parseJornadaNum(b.jornada);
      if (jA !== jB) return jA - jB;
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.time || '').localeCompare(b.time || '');
    });

  const participatingAcademiesMap = new Map<string, Academy>();

  (allAcademies || []).forEach(acad => {
    let belongs = false;
    if (acad.categories && Array.isArray(acad.categories)) {
      belongs = acad.categories.some(c => normalizeCategory(c) === normCat);
    } else if (acad.category) {
      if (Array.isArray(acad.category)) {
        belongs = (acad.category as any).some((c: any) => normalizeCategory(c) === normCat);
      } else {
        belongs = normalizeCategory(acad.category) === normCat;
      }
    }

    if (belongs) {
      participatingAcademiesMap.set(acad.id, acad);
    }
  });

  catMatches.forEach(m => {
    if (m.homeAcademyId && !participatingAcademiesMap.has(m.homeAcademyId)) {
      const found = (allAcademies || []).find(a => a.id === m.homeAcademyId);
      if (found) participatingAcademiesMap.set(found.id, found);
      else {
        participatingAcademiesMap.set(m.homeAcademyId, {
          id: m.homeAcademyId,
          name: m.homeAcademyName || 'Equipo Local',
          category: categoryName,
          acronym: (m.homeAcademyName || 'LOC').slice(0, 3).toUpperCase(),
          logo: m.homeLogo || '',
          city: '',
          coach: '',
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0
        });
      }
    }
    if (m.awayAcademyId && !participatingAcademiesMap.has(m.awayAcademyId)) {
      const found = (allAcademies || []).find(a => a.id === m.awayAcademyId);
      if (found) participatingAcademiesMap.set(found.id, found);
      else {
        participatingAcademiesMap.set(m.awayAcademyId, {
          id: m.awayAcademyId,
          name: m.awayAcademyName || 'Equipo Visitante',
          category: categoryName,
          acronym: (m.awayAcademyName || 'VIS').slice(0, 3).toUpperCase(),
          logo: m.awayLogo || '',
          city: '',
          coach: '',
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0
        });
      }
    }
  });

  const catAcademies = Array.from(participatingAcademiesMap.values()).sort((a, b) => 
    (a.name || '').localeCompare(b.name || '')
  );

  let standingsRaw: any[] = [];
  try {
    standingsRaw = computeAcademyStandings(catAcademies, allMatches || [], categoryName);
  } catch (err) {
    console.warn('Error calculating standings for report, using fallback:', err);
    standingsRaw = catAcademies.map(a => ({
      ...a,
      goalDiff: (a.goalsFor || 0) - (a.goalsAgainst || 0)
    }));
  }

  const standings = standingsRaw.map((st, idx) => ({
    rank: idx + 1,
    name: st.name || 'Club',
    played: st.played || 0,
    won: st.won || 0,
    drawn: st.drawn || 0,
    lost: st.lost || 0,
    goalsFor: st.goalsFor || 0,
    goalsAgainst: st.goalsAgainst || 0,
    goalDiff: (st.goalDiff !== undefined ? st.goalDiff : (st.goalsFor || 0) - (st.goalsAgainst || 0)),
    points: st.points || 0
  }));

  const teamConfrontations = catAcademies.map(team => {
    const playedOpponents: TeamOpponentStatus[] = [];
    const pendingOpponents: TeamOpponentStatus[] = [];

    const otherTeams = catAcademies.filter(other => other.id !== team.id);

    otherTeams.forEach(opponent => {
      const headToHeadMatches = catMatches.filter(m => {
        const homeIsTeam = isSameTeam(m.homeAcademyId, m.homeAcademyName, team.id, team.name);
        const awayIsTeam = isSameTeam(m.awayAcademyId, m.awayAcademyName, team.id, team.name);
        const homeIsOpp = isSameTeam(m.homeAcademyId, m.homeAcademyName, opponent.id, opponent.name);
        const awayIsOpp = isSameTeam(m.awayAcademyId, m.awayAcademyName, opponent.id, opponent.name);

        return (homeIsTeam && awayIsOpp) || (awayIsTeam && homeIsOpp);
      });

      const hasPlayed = headToHeadMatches.some(m => m.status === 'finished');
      const hasScheduled = headToHeadMatches.length > 0;

      const formattedMatches = headToHeadMatches.map(m => {
        const homeIsTeam = isSameTeam(m.homeAcademyId, m.homeAcademyName, team.id, team.name);
        const teamScore = homeIsTeam ? m.homeScore : m.awayScore;
        const oppScore = homeIsTeam ? m.awayScore : m.homeScore;
        const scoreText = m.status === 'finished' 
          ? `${teamScore ?? 0} - ${oppScore ?? 0}`
          : 'Por jugar';

        return {
          jornada: String(m.jornada || 'Jornada'),
          status: (m.status === 'live' ? 'live' : m.status === 'finished' ? 'finished' : 'upcoming') as 'upcoming' | 'live' | 'finished',
          scoreText,
          date: m.date || 'Pendiente',
          time: m.time ? formatMatchTime(m.time) : ''
        };
      });

      const statusObj: TeamOpponentStatus = {
        opponentId: opponent.id,
        opponentName: opponent.name,
        hasPlayed,
        hasScheduled,
        matches: formattedMatches
      };

      if (hasPlayed) {
        playedOpponents.push(statusObj);
      } else {
        pendingOpponents.push(statusObj);
      }
    });

    return {
      team,
      playedOpponents,
      pendingOpponents
    };
  });

  return {
    categoryName,
    normalizedCat: normCat,
    academies: catAcademies,
    matches: catMatches,
    standings,
    teamConfrontations
  };
}

/**
 * Trigger file download via simulated link with support for blob URLs
 */
function triggerBrowserDownload(blob: Blob, fileName: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (e) {
        // cleanup ignore
      }
    }, 1500);
  } catch (err) {
    console.error('Error triggering browser download:', err);
  }
}

export async function generateConfrontationsPDF(
  allMatches: TournamentMatch[],
  allAcademies: Academy[],
  options: PDFExportOptions
): Promise<PDFExportResult> {
  const {
    category,
    tournamentName = 'TORNEO OFICIAL EMILIATEX UNIFORMES',
    includeStandings = true,
    includeMatchHistory = true,
    includePendingMatrix = true
  } = options;

  let targetCategories: string[] = [];

  if (category === 'all') {
    const catSet = new Set<string>();
    TOURNAMENT_CATEGORIES.forEach(c => catSet.add(c));
    (allMatches || []).forEach(m => { if (m.category) catSet.add(m.category as string); });
    targetCategories = Array.from(catSet);
  } else {
    targetCategories = [category];
  }

  let reportsData: CategoryReportData[] = targetCategories
    .map(cat => buildCategoryReportData(allMatches || [], allAcademies || [], cat));

  // If filtered for 'all', keep only categories that have clubs or matches
  if (category === 'all') {
    const activeOnly = reportsData.filter(rep => rep.academies.length > 0 || rep.matches.length > 0);
    if (activeOnly.length > 0) {
      reportsData = activeOnly;
    }
  }

  // If still completely empty, create at least 1 report page for selected category
  if (reportsData.length === 0) {
    reportsData = [buildCategoryReportData(allMatches || [], allAcademies || [], category || 'Sub-15')];
  }

  const doc = createJsPdfDoc({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const darkNavyColor: Color = [15, 23, 42];
  const charcoalColor: Color = [30, 41, 59];
  const lightBgColor: Color = [248, 250, 252];

  const nowFormatted = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }) + ' - ' + new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  reportsData.forEach((rep, repIndex) => {
    if (repIndex > 0) {
      doc.addPage();
    }

    let currentY = margin;

    // Header banner
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 3, 3, 'F');

    doc.setFillColor(212, 175, 55);
    doc.rect(margin, currentY, pageWidth - margin * 2, 2.5, 'F');

    let headerTextX = margin + 6;
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin + 4, currentY + 4, 16, 16, 1.5, 1.5, 'F');
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin + 4, currentY + 4, 16, 16, 1.5, 1.5, 'S');
      doc.addImage(DEFAULT_EMILIATEX_LOGO_BASE64, 'JPEG', margin + 4.8, currentY + 4.8, 14.4, 14.4, undefined, 'FAST');
      headerTextX = margin + 24;
    } catch {
      headerTextX = margin + 6;
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.text((tournamentName || 'TORNEO OFICIAL').toUpperCase(), headerTextX, currentY + 11);

    doc.setTextColor(212, 175, 55);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRO DE ENFRENTAMIENTOS JORNADA A JORNADA Y CRUCES PENDIENTES', headerTextX, currentY + 17);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Emisión: ${nowFormatted}`, pageWidth - margin - 6, currentY + 14, { align: 'right' });

    currentY += 28;

    // Category summary badge
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 2, 2, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`CATEGORÍA: ${rep.categoryName.toUpperCase()}`, margin + 5, currentY + 9);

    const totalMatches = rep.matches.length;
    const finishedMatches = rep.matches.filter(m => m.status === 'finished').length;
    const pendingMatches = totalMatches - finishedMatches;
    const totalClubs = rep.academies.length;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Equipos: ${totalClubs}  |  Jugados: ${finishedMatches}  |  Por Jugar: ${pendingMatches}  |  Total: ${totalMatches}`,
      pageWidth - margin - 5,
      currentY + 9,
      { align: 'right' }
    );

    currentY += 18;

    // 1. Standings Table
    if (includeStandings && rep.standings.length > 0) {
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`1. TABLA DE POSICIONES OFICIAL (${rep.categoryName})`, margin, currentY);
      currentY += 3;

      const standingsRows = rep.standings.map(st => [
        st.rank.toString(),
        st.name,
        st.played.toString(),
        st.won.toString(),
        st.drawn.toString(),
        st.lost.toString(),
        st.goalsFor.toString(),
        st.goalsAgainst.toString(),
        (st.goalDiff > 0 ? `+${st.goalDiff}` : st.goalDiff.toString()),
        st.points.toString()
      ]);

      runAutoTable(doc, {
        startY: currentY,
        head: [['Pos', 'Club / Academia', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'PTS']],
        body: standingsRows,
        margin: { left: margin, right: margin },
        theme: 'grid',
        headStyles: {
          fillColor: darkNavyColor,
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 2
        },
        styles: {
          fontSize: 7,
          cellPadding: 1.8,
          textColor: charcoalColor,
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 10, fontStyle: 'bold' },
          1: { cellWidth: 'auto', halign: 'left', fontStyle: 'bold' },
          2: { cellWidth: 10 },
          3: { cellWidth: 10 },
          4: { cellWidth: 10 },
          5: { cellWidth: 10 },
          6: { cellWidth: 10 },
          7: { cellWidth: 10 },
          8: { cellWidth: 11 },
          9: { cellWidth: 12, fontStyle: 'bold', textColor: [180, 83, 9] }
        },
        alternateRowStyles: {
          fillColor: lightBgColor
        }
      });

      const nextY = (doc as any).lastAutoTable?.finalY;
      currentY = (typeof nextY === 'number' ? nextY : currentY + 30) + 8;
    }

    // 2. Matches History
    if (includeMatchHistory && rep.matches.length > 0) {
      if (currentY > pageHeight - 55) {
        doc.addPage();
        currentY = margin;
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`2. HISTORIAL DE PARTIDOS JORNADA A JORNADA (${rep.categoryName})`, margin, currentY);
      currentY += 3;

      const matchesRows = rep.matches.map(m => {
        const score = m.status === 'finished'
          ? `${m.homeScore ?? 0} - ${m.awayScore ?? 0}`
          : 'VS';
        const formattedTime = m.time ? formatMatchTime(m.time) : '';
        const dateTimeStr = [m.date, formattedTime].filter(Boolean).join(' ');
        const statusLabel = m.status === 'finished' 
          ? 'Finalizado' 
          : (m.status === 'live' ? 'En Vivo' : 'Programado');

        return [
          String(m.jornada || 'Jornada'),
          dateTimeStr || 'Por definir',
          m.homeAcademyName || 'Local',
          score,
          m.awayAcademyName || 'Visitante',
          statusLabel,
          m.stadium || 'Principal'
        ];
      });

      runAutoTable(doc, {
        startY: currentY,
        head: [['Jornada', 'Fecha & Hora', 'Equipo Local', 'Res.', 'Equipo Visitante', 'Estado', 'Cancha']],
        body: matchesRows,
        margin: { left: margin, right: margin },
        theme: 'striped',
        headStyles: {
          fillColor: darkNavyColor,
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 2
        },
        styles: {
          fontSize: 7,
          cellPadding: 1.8,
          textColor: charcoalColor
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 28, halign: 'center' },
          2: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
          3: { cellWidth: 16, halign: 'center', fontStyle: 'bold', textColor: [180, 83, 9] },
          4: { cellWidth: 'auto', halign: 'left', fontStyle: 'bold' },
          5: { cellWidth: 20, halign: 'center' },
          6: { cellWidth: 20, halign: 'center' }
        },
        alternateRowStyles: {
          fillColor: lightBgColor
        },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 5) {
            const val = data.cell.raw;
            if (val === 'Finalizado') {
              data.cell.styles.textColor = [16, 149, 100];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'Programado') {
              data.cell.styles.textColor = [100, 116, 139];
            }
          }
        }
      });

      const nextY = (doc as any).lastAutoTable?.finalY;
      currentY = (typeof nextY === 'number' ? nextY : currentY + 30) + 8;
    }

    // 3. Pending Rivals Matrix
    if (includePendingMatrix && rep.teamConfrontations.length > 0) {
      if (currentY > pageHeight - 65) {
        doc.addPage();
        currentY = margin;
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`3. CONTROL DE CRUCES Y RIVALES PENDIENTES (${rep.categoryName})`, margin, currentY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Herramienta oficial: identifica con quién ya jugó cada club y qué rivales están PENDIENTES para no repetir juegos.',
        margin,
        currentY + 4
      );
      currentY += 7;

      const confrontationRows = rep.teamConfrontations.map(tc => {
        const playedText = tc.playedOpponents.length > 0
          ? tc.playedOpponents.map(p => {
              const matchDetails = p.matches
                .filter(m => m.status === 'finished')
                .map(m => `${m.jornada} (${m.scoreText})`)
                .join(', ');
              return `${p.opponentName} [${matchDetails || 'Jugado'}]`;
            }).join('\n')
          : 'Ninguno aún';

        const pendingText = tc.pendingOpponents.length > 0
          ? tc.pendingOpponents.map(p => {
              if (p.hasScheduled) {
                const sched = p.matches.map(m => `${m.jornada} (Prog.)`).join(', ');
                return `${p.opponentName} [${sched}]`;
              }
              return `• ${p.opponentName} (Sin programar)`;
            }).join('\n')
          : '¡Ya jugó contra todos los rivales!';

        return [
          tc.team.name,
          `${tc.playedOpponents.length} rivales`,
          playedText,
          `${tc.pendingOpponents.length} rivales`,
          pendingText
        ];
      });

      runAutoTable(doc, {
        startY: currentY,
        head: [['Club / Academia', 'PJ vs', 'Rivales Ya Enfrentados (Historial)', 'Pend.', 'Rivales Pendientes (Aún no se enfrentan)']],
        body: confrontationRows,
        margin: { left: margin, right: margin },
        theme: 'grid',
        headStyles: {
          fillColor: darkNavyColor,
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 2.2
        },
        styles: {
          fontSize: 6.8,
          cellPadding: 2,
          textColor: charcoalColor,
          valign: 'top'
        },
        columnStyles: {
          0: { cellWidth: 36, fontStyle: 'bold' },
          1: { cellWidth: 14, halign: 'center', fontStyle: 'bold', textColor: [16, 149, 100] },
          2: { cellWidth: 62 },
          3: { cellWidth: 14, halign: 'center', fontStyle: 'bold', textColor: [220, 38, 38] },
          4: { cellWidth: 'auto', fontStyle: 'bold', textColor: [180, 83, 9] }
        },
        alternateRowStyles: {
          fillColor: lightBgColor
        }
      });
    }
  });

  // Footer on all pages
  const pageCount = (doc.internal as any).getNumberOfPages 
    ? (doc.internal as any).getNumberOfPages() 
    : 1;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);

    doc.text(
      'EMILIATEX Uniformes Deportivos • Sistema Oficial de Gestión de Torneo y Control de Cruces',
      margin,
      pageHeight - 5
    );

    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - margin,
      pageHeight - 5,
      { align: 'right' }
    );
  }

  const cleanCatName = category === 'all' ? 'Todas_Las_Categorias' : category.replace(/[\s/]+/g, '_');
  const fileName = `Cruces_y_Programacion_${cleanCatName}_${new Date().toISOString().slice(0, 10)}.pdf`;

  // Generate Blob & Data URI
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  let dataUri = '';
  try {
    dataUri = doc.output('datauristring');
  } catch (e1) {
    try {
      dataUri = (doc as any).output('dataurlstring');
    } catch (e2) {}
  }

  // Try direct doc.save first
  try {
    doc.save(fileName);
  } catch (err) {
    console.warn('doc.save intercepted or not permitted, applying simulated download:', err);
    triggerBrowserDownload(blob, fileName);
  }

  // Fallback anchor trigger with target="_blank"
  try {
    triggerBrowserDownload(blob, fileName);
  } catch (e) {
    // fallback
  }

  return {
    success: true,
    fileName,
    blob,
    blobUrl,
    dataUri
  };
}

/**
 * Export confrontations and pending matches directly to CSV format (compatible with Excel)
 */
export function exportCategoryConfrontationsCSV(
  allMatches: TournamentMatch[],
  allAcademies: Academy[],
  categoryName: string
): { fileName: string; content: string } {
  const normCat = normalizeCategory(categoryName);
  const categoriesToProcess = categoryName === 'all'
    ? TOURNAMENT_CATEGORIES
    : [categoryName];

  let csvRows: string[] = [];
  csvRows.push('TORNEO EMILIATEX - REPORTE OFICIAL DE CRUCES Y RIVALES PENDIENTES');
  csvRows.push(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`);
  csvRows.push('');

  categoriesToProcess.forEach(cat => {
    const report = buildCategoryReportData(allMatches, allAcademies, cat);
    csvRows.push(`=== CATEGORÍA: ${cat.toUpperCase()} ===`);
    csvRows.push('Club,Rivales Ya Enfrentados (Historial),Cant. Enfrentados,Rivales Pendientes (Sin Enfrentar),Cant. Pendientes');

    report.teamConfrontations.forEach(tc => {
      const playedStr = tc.playedOpponents.map(p => {
        const matchesDetail = p.matches.map(m => `${m.jornada} (${m.scoreText})`).join('; ');
        return `${p.opponentName} [${matchesDetail}]`;
      }).join(' | ') || 'Ninguno';

      const pendingStr = tc.pendingOpponents.map(p => {
        return p.hasScheduled
          ? `${p.opponentName} (Programado)`
          : `${p.opponentName} (Sin programar)`;
      }).join(' | ') || 'Todos enfrentados';

      const escape = (text: string) => `"${text.replace(/"/g, '""')}"`;
      csvRows.push(`${escape(tc.team.name)},${escape(playedStr)},${tc.playedOpponents.length},${escape(pendingStr)},${tc.pendingOpponents.length}`);
    });

    csvRows.push('');
  });

  const csvString = csvRows.join('\r\n');
  const cleanCat = categoryName === 'all' ? 'Todas_Las_Categorias' : categoryName.replace(/[\s/]+/g, '_');
  const fileName = `Cruces_${cleanCat}_${new Date().toISOString().slice(0, 10)}.csv`;

  // Trigger CSV download
  try {
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1500);
  } catch (e) {
    console.error('Error triggering CSV download:', e);
  }

  return { fileName, content: csvString };
}

