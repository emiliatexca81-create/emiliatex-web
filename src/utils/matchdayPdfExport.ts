import jsPDF from 'jspdf';
import autoTable, { Color } from 'jspdf-autotable';
import { TournamentMatch, Academy, Player, TOURNAMENT_CATEGORIES } from '../types';
import { normalizeCategory, formatMatchTime } from '../services/storage';
import { DEFAULT_EMILIATEX_LOGO_BASE64 } from '../assets/emiliatexDefaultLogo';

export type MatchdayPdfFormat = 'complete' | 'schedule_only' | 'sheets_only';

export interface MatchdayExportOptions {
  jornada: string; // e.g. 'Jornada 1', 'all'
  category?: string; // 'all' or 'Sub-15', etc.
  formatType?: MatchdayPdfFormat;
  tournamentName?: string;
  companyName?: string;
  companyLogoUrl?: string;
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
 * Helper to convert a Blob to Base64 data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Checks if a given image URL corresponds to the official EMILIATEX company logo
 */
function isOfficialEmiliatexLogoUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (clean.includes('/assets/emiliatex-logo.jpg') || clean.includes('emiliatex-logo')) return true;
  if (clean.includes('WhatsApp%20Image%202026-10-11') || clean.includes('0f9b47e3-b545-40e8-9e68-6164e112868d')) {
    return true;
  }
  return false;
}

let isLocalProxyActive = true;

/**
 * Robust asynchronous image preloader and Base64 converter for jsPDF.
 * Built specifically to ensure images and logos load both in local dev (with Node proxy)
 * and in static production deployments (GitHub Pages, custom domains like emiliatex.com).
 * 
 * Strategy:
 * 1. Immediate return for data:image/ URIs.
 * 2. Instant identification of EMILIATEX logo -> returns bundled base64 without network latency.
 * 3. Relative local assets (e.g. /assets/emiliatex-logo.jpg) loaded directly on same-origin.
 * 4. Local proxy (/api/image-proxy) with strict content-type check to skip static 200 HTML fallbacks.
 * 5. High-availability public Cloudflare-backed CORS image proxy (wsrv.nl / images.weserv.nl).
 * 6. Direct fetch with CORS mode.
 * 7. HTML Image + Canvas with cache-busting.
 */
async function loadAndConvertImageToBase64(url?: string): Promise<string | null> {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return null;
  }
  const cleanUrl = url.trim();

  // Tier 0: Direct Data URL
  if (cleanUrl.startsWith('data:image/')) return cleanUrl;

  // Tier 1: Instant match for official EMILIATEX company logo
  if (isOfficialEmiliatexLogoUrl(cleanUrl)) {
    return DEFAULT_EMILIATEX_LOGO_BASE64;
  }

  // Tier 2: Relative or same-origin URL (e.g. /assets/... or ./assets/...)
  if (cleanUrl.startsWith('/') || cleanUrl.startsWith('./') || cleanUrl.startsWith('assets/')) {
    try {
      const res = await fetch(cleanUrl);
      const cType = res.headers.get('content-type') || '';
      if (res.ok && (cType.includes('image/') || cType.includes('application/octet-stream'))) {
        const blob = await res.blob();
        if (blob && blob.size > 0) {
          const dataUrl = await blobToDataUrl(blob);
          if (dataUrl && dataUrl.startsWith('data:image/')) {
            return dataUrl;
          }
        }
      }
    } catch {
      // continue to next tiers
    }
  }

  // Tier 3: Same-origin backend proxy (/api/image-proxy)
  // Only valid if the server actually returned an image (not SPA index.html from static host)
  if (isLocalProxyActive) {
    try {
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(cleanUrl)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      const cType = res.headers.get('content-type') || '';
      if (res.ok && (cType.includes('image/') || cType.includes('application/octet-stream'))) {
        const blob = await res.blob();
        if (blob && blob.size > 0) {
          const dataUrl = await blobToDataUrl(blob);
          if (dataUrl && dataUrl.startsWith('data:image/')) {
            return dataUrl;
          }
        }
      } else {
        // If 404 or text/html returned, we're on a static host (emiliatex.com). Disable local proxy.
        isLocalProxyActive = false;
      }
    } catch {
      isLocalProxyActive = false;
    }
  }

  // Tier 4: Public Cloudflare-backed CORS image proxy (wsrv.nl)
  // CRITICAL for static deployments (emiliatex.com): delivers the image with Access-Control-Allow-Origin: *
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    try {
      const proxyCdnUrl = `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&w=250&output=png`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(proxyCdnUrl, { mode: 'cors', signal: controller.signal });
      clearTimeout(timeoutId);

      const cType = res.headers.get('content-type') || '';
      if (res.ok && (cType.includes('image/') || cType.includes('application/octet-stream'))) {
        const blob = await res.blob();
        if (blob && blob.size > 0) {
          const dataUrl = await blobToDataUrl(blob);
          if (dataUrl && dataUrl.startsWith('data:image/')) {
            return dataUrl;
          }
        }
      }
    } catch {
      // wsrv.nl failed or blocked
    }

    // Tier 5: Secondary CORS proxy mirror (images.weserv.nl)
    try {
      const mirrorUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=250&output=png`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(mirrorUrl, { mode: 'cors', signal: controller.signal });
      clearTimeout(timeoutId);

      const cType = res.headers.get('content-type') || '';
      if (res.ok && (cType.includes('image/') || cType.includes('application/octet-stream'))) {
        const blob = await res.blob();
        if (blob && blob.size > 0) {
          const dataUrl = await blobToDataUrl(blob);
          if (dataUrl && dataUrl.startsWith('data:image/')) {
            return dataUrl;
          }
        }
      }
    } catch {
      // mirror failed
    }

    // Tier 6: Direct fetch with CORS mode
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(cleanUrl, { mode: 'cors', signal: controller.signal });
      clearTimeout(timeoutId);

      const cType = res.headers.get('content-type') || '';
      if (res.ok && (cType.includes('image/') || cType.includes('application/octet-stream'))) {
        const blob = await res.blob();
        if (blob && blob.size > 0) {
          const dataUrl = await blobToDataUrl(blob);
          if (dataUrl && dataUrl.startsWith('data:image/')) {
            return dataUrl;
          }
        }
      }
    } catch {
      // direct fetch blocked by CORS
    }
  }

  // Tier 7: Offscreen Image element + Canvas with cache-busting timestamp
  try {
    return await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const timer = setTimeout(() => resolve(null), 3000);

      img.onload = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 250;
          let w = img.naturalWidth || img.width || 120;
          let h = img.naturalHeight || img.height || 120;

          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          canvas.width = Math.max(w, 1);
          canvas.height = Math.max(h, 1);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } catch (err) {
          console.warn('Canvas export tainted for image:', cleanUrl, err);
          resolve(null);
        }
      };

      img.onerror = () => {
        clearTimeout(timer);
        resolve(null);
      };

      // Cache buster prevents browser from reusing non-CORS cached responses
      if (cleanUrl.startsWith('http')) {
        const sep = cleanUrl.includes('?') ? '&' : '?';
        img.src = `${cleanUrl}${sep}_pdf_cb=${Date.now()}`;
      } else {
        img.src = cleanUrl;
      }
    });
  } catch (err) {
    console.warn('Error loading image for PDF:', err);
    return null;
  }
}

/**
 * Draw a team shield / crest badge onto the jsPDF document.
 * If image is available, renders it with a gold-bordered backing card.
 * If image is not available, renders an official vector monogram crest.
 */
function drawTeamShieldBadge(
  doc: any,
  logoBase64: string | null | undefined,
  teamName: string,
  x: number,
  y: number,
  size: number = 20,
  accentColor: [number, number, number] = [212, 175, 55]
): void {
  // Circular or rounded rectangular card background
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, size, size, 2.5, 2.5, 'F');

  // Gold accent border
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(0.65);
  doc.roundedRect(x, y, size, size, 2.5, 2.5, 'S');

  // Automatic fallback to official EMILIATEX crest if team is Emiliatex
  let effectiveLogo = logoBase64;
  if (!effectiveLogo && /emiliatex/i.test(teamName)) {
    effectiveLogo = DEFAULT_EMILIATEX_LOGO_BASE64;
  }

  let renderedImage = false;
  if (effectiveLogo) {
    try {
      let fmt = 'PNG';
      if (effectiveLogo.startsWith('data:image/jpeg') || effectiveLogo.startsWith('data:image/jpg')) {
        fmt = 'JPEG';
      } else if (effectiveLogo.startsWith('data:image/webp')) {
        fmt = 'WEBP';
      }

      const pad = 1.0;
      const innerSize = size - (pad * 2);
      doc.addImage(
        effectiveLogo,
        fmt,
        x + pad,
        y + pad,
        innerSize,
        innerSize,
        undefined,
        'FAST'
      );
      renderedImage = true;
    } catch (e) {
      console.warn('doc.addImage failed, falling back to vector shield monogram', e);
      renderedImage = false;
    }
  }

  // Fallback monogram if image could not be rendered
  if (!renderedImage) {
    doc.setFillColor(13, 20, 36);
    doc.roundedRect(x + 1.2, y + 1.2, size - 2.4, size - 2.4, 2, 2, 'F');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFont('helvetica', 'bold');

    const initials = teamName
      .replace(/^(club|academia|deportivo|atletico|escuela)\s+/i, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 3)
      .map(w => w[0].toUpperCase())
      .join('');

    doc.setFontSize(size > 16 ? 9 : (size > 10 ? 7 : 5.5));
    doc.text(
      initials || teamName.slice(0, 3).toUpperCase(),
      x + (size / 2),
      y + (size / 2) + (size > 16 ? 3 : (size > 10 ? 2.5 : 2)),
      { align: 'center' }
    );
  }
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
 * Renders team crests on every match sheet, in the scoreboard hero box, and on the roster technical tables!
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
    companyName = 'EMILIATEX Confecciones & Uniformes',
    companyLogoUrl
  } = options;

  const matches = getMatchesForMatchday(allMatches, jornada, category);

  // -------------------------------------------------------------
  // PRE-FETCH & CONVERT TEAM LOGOS & CRESTS TO BASE64
  // -------------------------------------------------------------
  const logoCache = new Map<string, string | null>();
  const urlsToFetch = new Set<string>();

  if (companyLogoUrl) {
    urlsToFetch.add(companyLogoUrl);
  }

  matches.forEach(m => {
    const homeAcad = (allAcademies || []).find(a => 
      (a.id && m.homeAcademyId && a.id === m.homeAcademyId) ||
      (a.name && m.homeAcademyName && a.name.trim().toLowerCase() === m.homeAcademyName.trim().toLowerCase())
    );
    const awayAcad = (allAcademies || []).find(a => 
      (a.id && m.awayAcademyId && a.id === m.awayAcademyId) ||
      (a.name && m.awayAcademyName && a.name.trim().toLowerCase() === m.awayAcademyName.trim().toLowerCase())
    );
    const hLogo = m.homeLogo || homeAcad?.logo;
    const aLogo = m.awayLogo || awayAcad?.logo;
    if (hLogo) urlsToFetch.add(hLogo);
    if (aLogo) urlsToFetch.add(aLogo);
  });

  // Load all images in parallel with timeouts to keep generation snappy
  await Promise.all(
    Array.from(urlsToFetch).map(async (url) => {
      const base64 = await loadAndConvertImageToBase64(url);
      logoCache.set(url, base64);
    })
  );

  const doc = createJsPdfDoc({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - (marginX * 2);

  // Official color palette for field-print readability
  const primaryNavy: Color = [13, 20, 36];
  const goldAccent: [number, number, number] = [212, 175, 55];

  const jornadaLabel = jornada === 'all' ? 'Todas las Jornadas' : jornada;
  const categoryLabel = category === 'all' ? 'Todas las Categorías' : category;

  // ==========================================
  // SECCIÓN 1: CRONOGRAMA DE LA JORNADA (Si formatType es complete o schedule_only)
  // ==========================================
  if (formatType === 'complete' || formatType === 'schedule_only' || matches.length === 0) {
    // Encabezado institucional
    doc.setFillColor(13, 20, 36);
    doc.roundedRect(marginX, 12, contentWidth, 25, 3, 3, 'F');

    // Borde dorado superior
    doc.setFillColor(212, 175, 55);
    doc.rect(marginX, 12, contentWidth, 2.2, 'F');

    // Logo oficial de la empresa en encabezado si está disponible
    const compLogoBase64 = (companyLogoUrl ? logoCache.get(companyLogoUrl) : null) || DEFAULT_EMILIATEX_LOGO_BASE64;
    let headerTextX = marginX + 6;

    if (compLogoBase64) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(marginX + 5, 15, 17, 17, 2, 2, 'F');
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(0.4);
        doc.roundedRect(marginX + 5, 15, 17, 17, 2, 2, 'S');
        let fmt = compLogoBase64.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
        doc.addImage(compLogoBase64, fmt, marginX + 6, 16, 15, 15, undefined, 'FAST');
        headerTextX = marginX + 26;
      } catch (e) {
        headerTextX = marginX + 6;
      }
    }

    doc.setTextColor(212, 175, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.text(tournamentName.toUpperCase(), headerTextX, 20);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`PLANILLA OFICIAL DE CAMPO • ${companyName.toUpperCase()}`, headerTextX, 26);

    doc.setFontSize(7.5);
    doc.setTextColor(200, 210, 230);
    const nowStr = new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Emisión: ${nowStr} • Mesa Técnica & Cuerpo Arbitral`, headerTextX, 31);

    // Badge derecha
    doc.setFillColor(212, 175, 55);
    doc.roundedRect(pageWidth - marginX - 55, 16.5, 50, 15, 2, 2, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(jornadaLabel.toUpperCase(), pageWidth - marginX - 30, 23, { align: 'center' });
    doc.setFontSize(7.5);
    doc.text(`${matches.length} PARTIDOS PROGRAMADOS`, pageWidth - marginX - 30, 28, { align: 'center' });

    // Sub-banner de parámetros de filtro
    let currentY = 42;
    doc.setFillColor(242, 245, 250);
    doc.setDrawColor(210, 215, 225);
    doc.roundedRect(marginX, currentY, contentWidth, 11, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setTextColor(50, 60, 80);
    doc.setFont('helvetica', 'bold');
    doc.text('CARTELERA GENERAL DE PARTIDOS PARA LA JORNADA', marginX + 4, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.text(`Categoría: ${categoryLabel}   |   Con Escudos Oficiales de Clubes`, pageWidth - marginX - 4, currentY + 7, { align: 'right' });

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
          `    ${m.homeAcademyName}\n    vs\n    ${m.awayAcademyName}`,
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
        margin: { left: marginX, right: marginX },
        didDrawCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 4) {
            const m = matches[data.row.index];
            if (!m) return;
            const homeAcad = (allAcademies || []).find(a => 
              (a.id && m.homeAcademyId && a.id === m.homeAcademyId) ||
              (a.name && m.homeAcademyName && a.name.trim().toLowerCase() === m.homeAcademyName.trim().toLowerCase())
            );
            const awayAcad = (allAcademies || []).find(a => 
              (a.id && m.awayAcademyId && a.id === m.awayAcademyId) ||
              (a.name && m.awayAcademyName && a.name.trim().toLowerCase() === m.awayAcademyName.trim().toLowerCase())
            );
            const hLogoUrl = m.homeLogo || homeAcad?.logo;
            const aLogoUrl = m.awayLogo || awayAcad?.logo;
            const hLogo = hLogoUrl ? logoCache.get(hLogoUrl) : null;
            const aLogo = aLogoUrl ? logoCache.get(aLogoUrl) : null;

            const iconSize = 4.2;
            const iconX = data.cell.x + 1.2;

            if (hLogo) {
              try {
                let fmt = hLogo.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
                doc.addImage(hLogo, fmt, iconX, data.cell.y + 1.6, iconSize, iconSize, undefined, 'FAST');
              } catch {}
            }
            if (aLogo) {
              try {
                let fmt = aLogo.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
                doc.addImage(aLogo, fmt, iconX, data.cell.y + data.cell.height - iconSize - 1.6, iconSize, iconSize, undefined, 'FAST');
              } catch {}
            }
          }
        }
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
  // Cada partido tiene su propia hoja lista para imprimir con LOS ESCUDOS DE AMBOS EQUIPOS
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

      // Rescatar escudo del equipo local y visitante con fallback por ID o nombre
      const homeAcad = (allAcademies || []).find(a => 
        (a.id && m.homeAcademyId && a.id === m.homeAcademyId) ||
        (a.name && m.homeAcademyName && a.name.trim().toLowerCase() === m.homeAcademyName.trim().toLowerCase())
      );
      const awayAcad = (allAcademies || []).find(a => 
        (a.id && m.awayAcademyId && a.id === m.awayAcademyId) ||
        (a.name && m.awayAcademyName && a.name.trim().toLowerCase() === m.awayAcademyName.trim().toLowerCase())
      );
      const homeLogoUrl = m.homeLogo || homeAcad?.logo;
      const awayLogoUrl = m.awayLogo || awayAcad?.logo;

      const homeLogoBase64 = homeLogoUrl ? logoCache.get(homeLogoUrl) : null;
      const awayLogoBase64 = awayLogoUrl ? logoCache.get(awayLogoUrl) : null;

      // ENCABEZADO DE LA PLANILLA DE PARTIDO
      doc.setFillColor(13, 20, 36);
      doc.roundedRect(marginX, 9, contentWidth, 20, 2, 2, 'F');
      doc.setFillColor(212, 175, 55);
      doc.rect(marginX, 9, contentWidth, 1.8, 'F');

      // Logo oficial de EMILIATEX en el encabezado de cada planilla de partido
      const compLogoBase64Match = (companyLogoUrl ? logoCache.get(companyLogoUrl) : null) || DEFAULT_EMILIATEX_LOGO_BASE64;
      let matchHeaderTextX = marginX + 5;

      if (compLogoBase64Match) {
        try {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(marginX + 3.5, 11, 15.5, 15.5, 1.5, 1.5, 'F');
          doc.setDrawColor(212, 175, 55);
          doc.setLineWidth(0.4);
          doc.roundedRect(marginX + 3.5, 11, 15.5, 15.5, 1.5, 1.5, 'S');
          let fmt = compLogoBase64Match.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
          doc.addImage(compLogoBase64Match, fmt, marginX + 4.2, 11.7, 14.1, 14.1, undefined, 'FAST');
          matchHeaderTextX = marginX + 22;
        } catch {
          matchHeaderTextX = marginX + 5;
        }
      }

      doc.setTextColor(212, 175, 55);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(`${tournamentName.toUpperCase()} • ACTA OFICIAL DE PARTIDO`, matchHeaderTextX, 15.5);

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`PLANILLA DE CAMPO Y CONTROL DE ARBITRAJE • ENCUENTRO N° ${matchIdx + 1}`, matchHeaderTextX, 20.8);
      doc.text(`${matchJornadaStr.toUpperCase()}  |  CATEGORÍA: ${matchCat.toUpperCase()}`, matchHeaderTextX, 25.5);

      // Badge fecha y hora en el encabezado
      doc.setFillColor(212, 175, 55);
      doc.roundedRect(pageWidth - marginX - 58, 12.5, 54, 13.5, 2, 2, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`${matchDateStr} • ${matchTimeStr}`, pageWidth - marginX - 31, 18.5, { align: 'center' });
      doc.setFontSize(7.5);
      doc.text(matchStadium.toUpperCase(), pageWidth - marginX - 31, 23, { align: 'center' });

      // ==============================================================
      // TABLERO DE RESULTADO Y EQUIPOS ENFRENTADOS CON ESCUDOS OFICIALES
      // ==============================================================
      let currentY = 32;
      const heroHeight = 30; // Altura optimizada para que nombres largos salgan en 2 líneas sin montarse
      doc.setFillColor(248, 250, 254);
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.65);
      doc.roundedRect(marginX, currentY, contentWidth, heroHeight, 2.5, 2.5, 'FD');

      const shieldSize = 19; // Escudo oficial destacado de 19mm x 19mm
      const maxTeamNameWidth = 45; // Ancho máximo seguro para no chocar con el marcador central

      // 1. ESCUDO Y DATOS EQUIPO LOCAL
      const homeShieldX = marginX + 3.5;
      const homeShieldY = currentY + 4;
      drawTeamShieldBadge(doc, homeLogoBase64, m.homeAcademyName, homeShieldX, homeShieldY, shieldSize, goldAccent);

      doc.setFont('helvetica', 'bold');
      const homeRawName = m.homeAcademyName.toUpperCase();
      const homeFontSize = homeRawName.length > 26 ? 8 : (homeRawName.length > 18 ? 8.5 : 9.5);
      doc.setFontSize(homeFontSize);
      doc.setTextColor(13, 20, 36);

      // Partir nombre largo en 2 líneas si sobrepasa el ancho permitido
      const homeLines: string[] = doc.splitTextToSize(homeRawName, maxTeamNameWidth);
      if (homeLines.length === 1) {
        doc.text(homeLines[0], marginX + 25, currentY + 9.5);
      } else {
        doc.text(homeLines[0], marginX + 25, currentY + 7.5);
        doc.text(homeLines[1], marginX + 25, currentY + 11.8);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 110, 125);
      const homeLabelY = homeLines.length > 1 ? currentY + 17 : currentY + 16;
      doc.text('EQUIPO LOCAL', marginX + 25, homeLabelY);
      
      const homeCoachName = m.lineups?.homeCoach || homeAcad?.coach || 'No registrado';
      doc.text(`DT: ${homeCoachName.slice(0, 24)}`, marginX + 25, currentY + 23);

      // 2. MARCADOR CENTRAL (HERO SCORE BOX - COMPACTO Y SIN COLISIÓN)
      const scoreBoxW = 38;
      const scoreBoxX = (pageWidth / 2) - (scoreBoxW / 2);
      doc.setFillColor(13, 20, 36);
      doc.roundedRect(scoreBoxX, currentY + 3.5, scoreBoxW, 23, 2, 2, 'F');
      
      doc.setTextColor(212, 175, 55);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('MARCADOR FINAL', pageWidth / 2, currentY + 8, { align: 'center' });

      // Casilleros para escribir resultado en cancha
      const currentScoreHome = m.homeScore !== undefined && m.status === 'finished' ? String(m.homeScore) : '  ';
      const currentScoreAway = m.awayScore !== undefined && m.status === 'finished' ? String(m.awayScore) : '  ';

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(pageWidth / 2 - 15.5, currentY + 10.5, 12.5, 11, 1.2, 1.2, 'F');
      doc.roundedRect(pageWidth / 2 + 3, currentY + 10.5, 12.5, 11, 1.2, 1.2, 'F');
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(currentScoreHome, pageWidth / 2 - 9.25, currentY + 18.5, { align: 'center' });
      doc.text(currentScoreAway, pageWidth / 2 + 9.25, currentY + 18.5, { align: 'center' });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text('-', pageWidth / 2, currentY + 18, { align: 'center' });

      // 3. ESCUDO Y DATOS EQUIPO VISITANTE
      const awayShieldX = pageWidth - marginX - shieldSize - 3.5;
      const awayShieldY = currentY + 4;
      drawTeamShieldBadge(doc, awayLogoBase64, m.awayAcademyName, awayShieldX, awayShieldY, shieldSize, goldAccent);

      doc.setFont('helvetica', 'bold');
      const awayRawName = m.awayAcademyName.toUpperCase();
      const awayFontSize = awayRawName.length > 26 ? 8 : (awayRawName.length > 18 ? 8.5 : 9.5);
      doc.setFontSize(awayFontSize);
      doc.setTextColor(13, 20, 36);

      const awayTextRightX = pageWidth - marginX - 25;
      const awayLines: string[] = doc.splitTextToSize(awayRawName, maxTeamNameWidth);
      if (awayLines.length === 1) {
        doc.text(awayLines[0], awayTextRightX, currentY + 9.5, { align: 'right' });
      } else {
        doc.text(awayLines[0], awayTextRightX, currentY + 7.5, { align: 'right' });
        doc.text(awayLines[1], awayTextRightX, currentY + 11.8, { align: 'right' });
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 110, 125);
      const awayLabelY = awayLines.length > 1 ? currentY + 17 : currentY + 16;
      doc.text('EQUIPO VISITANTE', awayTextRightX, awayLabelY, { align: 'right' });
      
      const awayCoachName = m.lineups?.awayCoach || awayAcad?.coach || 'No registrado';
      doc.text(`DT: ${awayCoachName.slice(0, 24)}`, awayTextRightX, currentY + 23, { align: 'right' });

      // BARRA DE DATOS ARBITRALES
      currentY += heroHeight + 3;
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

      // ==============================================================
      // NÓMINAS DE JUGADORES PARA MESA TÉCNICA CON MINI-ESCUDOS Y 2 LÍNEAS
      // ==============================================================
      currentY += 10.5;
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

      // Mini-escudos y banners de cabecera con soporte para 2 líneas
      const tableShieldSize = 8;
      const tableHeaderHeight = 12;
      
      // Header Local Mesa Técnica
      doc.setFillColor(13, 20, 36);
      doc.roundedRect(marginX, currentY, halfWidth, tableHeaderHeight, 1.5, 1.5, 'F');
      drawTeamShieldBadge(doc, homeLogoBase64, m.homeAcademyName, marginX + 1.5, currentY + 2, tableShieldSize, goldAccent);
      doc.setTextColor(212, 175, 55);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const localTableLines: string[] = doc.splitTextToSize(`LOCAL: ${m.homeAcademyName.toUpperCase()}`, halfWidth - 14);
      if (localTableLines.length === 1) {
        doc.text(localTableLines[0], marginX + 11.5, currentY + 7.5);
      } else {
        doc.text(localTableLines[0], marginX + 11.5, currentY + 5.2);
        doc.text(localTableLines[1], marginX + 11.5, currentY + 9.5);
      }

      // Header Visitante Mesa Técnica
      doc.setFillColor(25, 34, 52);
      doc.roundedRect(marginX + halfWidth + 4, currentY, halfWidth, tableHeaderHeight, 1.5, 1.5, 'F');
      drawTeamShieldBadge(doc, awayLogoBase64, m.awayAcademyName, marginX + halfWidth + 5.5, currentY + 2, tableShieldSize, goldAccent);
      doc.setTextColor(212, 175, 55);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const awayTableLines: string[] = doc.splitTextToSize(`VISITANTE: ${m.awayAcademyName.toUpperCase()}`, halfWidth - 14);
      if (awayTableLines.length === 1) {
        doc.text(awayTableLines[0], marginX + halfWidth + 15.5, currentY + 7.5);
      } else {
        doc.text(awayTableLines[0], marginX + halfWidth + 15.5, currentY + 5.2);
        doc.text(awayTableLines[1], marginX + halfWidth + 15.5, currentY + 9.5);
      }

      currentY += tableHeaderHeight + 1;

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
          `Jugador (Local)`,
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
          cellPadding: 1.35,
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
          `Jugador (Visitante)`,
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
          cellPadding: 1.35,
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
        { title: 'Firma Capitán Local', sub: m.homeAcademyName },
        { title: 'Firma Capitán Visitante', sub: m.awayAcademyName },
        { title: 'Firma Árbitro Principal', sub: refereeName },
        { title: 'Firma Delegado de Mesa', sub: 'Mesa de Control Oficial' }
      ];

      signatures.forEach((sig, idx) => {
        const xPos = marginX + (idx * sigColWidth);
        doc.setDrawColor(120, 130, 145);
        doc.setLineWidth(0.4);
        doc.line(xPos + 4, sigY + 8.5, xPos + sigColWidth - 4, sigY + 8.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(20, 30, 45);
        doc.text(sig.title, xPos + (sigColWidth / 2), sigY + 12, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.8);
        doc.setTextColor(90, 100, 115);
        const subLines: string[] = doc.splitTextToSize(sig.sub, sigColWidth - 6);
        if (subLines.length === 1) {
          doc.text(subLines[0], xPos + (sigColWidth / 2), sigY + 15.5, { align: 'center' });
        } else {
          doc.text(subLines[0], xPos + (sigColWidth / 2), sigY + 15, { align: 'center' });
          doc.text(subLines[1], xPos + (sigColWidth / 2), sigY + 17.8, { align: 'center' });
        }
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
      `Torneo Élite EMILIATEX • ${jornadaLabel} (${categoryLabel}) • Impreso para uso en Cancha con Escudos Oficiales`,
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
