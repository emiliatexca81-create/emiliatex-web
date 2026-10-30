import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Product, TournamentMatch, Player, Academy, OrderQuotation, AppSettings, OrderStatus, QuinielaEntry, MatchPredictionScore, TournamentCategory, ClientWorkItem, TOURNAMENT_CATEGORIES } from '../types';
import { 
  initialProducts, 
  initialMatches, 
  initialPlayers, 
  initialAcademies, 
  initialOrders, 
  initialSettings,
  initialClientWorks
} from '../data/initialData';

export const initialQuinielas: QuinielaEntry[] = [];

const KEYS = {
  PRODUCTS: 'emiliatex_products_v1',
  MATCHES: 'emiliatex_matches_v1',
  PLAYERS: 'emiliatex_players_v1',
  ACADEMIES: 'emiliatex_academies_v1',
  ORDERS: 'emiliatex_orders_v1',
  SETTINGS: 'emiliatex_settings_v1',
  QUINIELAS: 'emiliatex_quinielas_v1',
  USER_QUINIELA: 'emiliatex_user_quiniela_v1',
  CLIENT_WORKS: 'emiliatex_client_works_v1',
  INITIALIZED_MATCHES: 'emiliatex_matches_initialized_v1',
  INITIALIZED_PRODUCTS: 'emiliatex_products_initialized_v1',
  INITIALIZED_PLAYERS: 'emiliatex_players_initialized_v1',
  INITIALIZED_ACADEMIES: 'emiliatex_academies_initialized_v1',
  INITIALIZED_CLIENT_WORKS: 'emiliatex_client_works_initialized_v1',
  DELETED_MATCH_IDS: 'emiliatex_deleted_match_ids_v1',
  INITIALIZED_QUINIELAS: 'emiliatex_quinielas_initialized_v1',
  DELETED_QUINIELA_IDS: 'emiliatex_deleted_quiniela_ids_v1',
  DELETED_CLIENT_WORK_IDS: 'emiliatex_deleted_client_works_ids_v1',
};

// Safe localStorage accessor
function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
}

function setItem<T>(key: string, value: T, notify: boolean = true): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(value);
    const existing = localStorage.getItem(key);
    // If the content is identical, do not rewrite and do not dispatch notification
    if (existing === serialized) {
      return;
    }
    localStorage.setItem(key, serialized);
    if (notify) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('emiliatex_storage_update', { detail: { key } }));
      }, 0);
    }
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

// Track IDs that have been explicitly deleted so fallback data never resurrects them
export function getDeletedMatchIds(): string[] {
  return getItem<string[]>(KEYS.DELETED_MATCH_IDS, []);
}

export function markMatchAsDeleted(id: string): void {
  const current = getDeletedMatchIds();
  if (!current.includes(id)) {
    setItem(KEYS.DELETED_MATCH_IDS, [...current, id]);
  }
}

export function getDeletedQuinielaIds(): string[] {
  return getItem<string[]>(KEYS.DELETED_QUINIELA_IDS, []);
}

export function markQuinielaAsDeleted(id: string): void {
  const current = getDeletedQuinielaIds();
  if (!current.includes(id)) {
    setItem(KEYS.DELETED_QUINIELA_IDS, [...current, id]);
  }
}

export function getDeletedClientWorkIds(): string[] {
  return getItem<string[]>(KEYS.DELETED_CLIENT_WORK_IDS, []);
}

export function markClientWorkAsDeleted(id: string): void {
  const current = getDeletedClientWorkIds();
  if (!current.includes(id)) {
    setItem(KEYS.DELETED_CLIENT_WORK_IDS, [...current, id]);
  }
}

export function unmarkClientWorkAsDeleted(id: string): void {
  const current = getDeletedClientWorkIds();
  if (current.includes(id)) {
    setItem(KEYS.DELETED_CLIENT_WORK_IDS, current.filter(x => x !== id));
  }
}

// Recursively remove undefined fields so Firestore doesn't reject document writes with "Unsupported field value: undefined"
export function cleanFirestoreData<T>(obj: T): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => cleanFirestoreData(item));
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        const cleanedVal = cleanFirestoreData(v);
        if (cleanedVal !== undefined) {
          clean[k] = cleanedVal;
        }
      }
    }
    return clean;
  }
  return obj;
}

// ---------------- PRODUCTS ----------------

export function getProducts(): Product[] {
  const isInitialized = typeof window !== 'undefined' && localStorage.getItem(KEYS.INITIALIZED_PRODUCTS) === 'true';
  return getItem<Product[]>(KEYS.PRODUCTS, isInitialized ? [] : initialProducts);
}

export async function saveProduct(product: Product): Promise<Product[]> {
  const current = getProducts();
  const existsIndex = current.findIndex(p => p.id === product.id);
  let updated: Product[];
  if (existsIndex >= 0) {
    updated = [...current];
    updated[existsIndex] = product;
  } else {
    updated = [product, ...current];
  }
  setItem(KEYS.PRODUCTS, updated);

  try {
    await setDoc(doc(db, 'products', product.id), cleanFirestoreData(product));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `products/${product.id}`);
  }

  return updated;
}

export async function deleteProduct(id: string): Promise<Product[]> {
  const current = getProducts();
  const updated = current.filter(p => p.id !== id);
  setItem(KEYS.PRODUCTS, updated);

  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
  }

  return updated;
}

// ---------------- MATCHES & JORNADAS ----------------

export function getMatchJornada(match: TournamentMatch): string {
  if (match.jornada !== undefined && match.jornada !== null && String(match.jornada).trim() !== '') {
    const val = String(match.jornada).trim();
    if (!isNaN(Number(val))) {
      return `Jornada ${Number(val)}`;
    }
    return val.toLowerCase().startsWith('jornada') ? val : `Jornada ${val}`;
  }

  // Fallback: extract from phase or stage if mentions "jornada", "fecha", "fecha X"
  const combined = `${match.phase || ''} ${match.stage || ''}`;
  const found = combined.match(/(?:jornada|fecha|round)\s*(\d+)/i);
  if (found) {
    return `Jornada ${found[1]}`;
  }

  // Default to Jornada 1
  return 'Jornada 1';
}

export function getAvailableJornadas(matches: TournamentMatch[]): string[] {
  if (!matches || matches.length === 0) return ['Jornada 1'];
  
  const set = new Set<string>();
  for (const m of matches) {
    set.add(getMatchJornada(m));
  }
  
  // Sort jornadas logically: Jornada 1, Jornada 2, etc.
  return Array.from(set).sort((a, b) => {
    const numA = parseInt(a.replace(/[^0-9]/g, ''), 10);
    const numB = parseInt(b.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });
}

export function getActiveOrLatestJornada(matches: TournamentMatch[]): string {
  const jornadas = getAvailableJornadas(matches);
  if (jornadas.length === 0) return 'Jornada 1';

  // 1. Look for a jornada with "live" matches
  const liveMatch = matches.find(m => m.status === 'live');
  if (liveMatch) return getMatchJornada(liveMatch);

  // 2. Look for a jornada with "upcoming" matches
  const upcomingMatch = matches.find(m => m.status === 'upcoming');
  if (upcomingMatch) return getMatchJornada(upcomingMatch);

  // 3. Otherwise return the latest jornada in chronological order
  return jornadas[jornadas.length - 1];
}

export function getMatches(): TournamentMatch[] {
  const isInitialized = typeof window !== 'undefined' && localStorage.getItem(KEYS.INITIALIZED_MATCHES) === 'true';
  const rawList = getItem<TournamentMatch[]>(KEYS.MATCHES, isInitialized ? [] : initialMatches);
  const deletedIds = getDeletedMatchIds();
  if (deletedIds.length === 0) return rawList;
  return rawList.filter(m => !deletedIds.includes(m.id));
}

export async function saveMatch(match: TournamentMatch): Promise<TournamentMatch[]> {
  const current = getMatches();
  const existsIndex = current.findIndex(m => m.id === match.id);
  let updated: TournamentMatch[];
  if (existsIndex >= 0) {
    updated = [...current];
    updated[existsIndex] = match;
  } else {
    updated = [match, ...current];
  }
  
  // If previously marked deleted, unmark
  const deletedIds = getDeletedMatchIds();
  if (deletedIds.includes(match.id)) {
    setItem(KEYS.DELETED_MATCH_IDS, deletedIds.filter(id => id !== match.id));
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.INITIALIZED_MATCHES, 'true');
  }
  setItem(KEYS.MATCHES, updated);

  try {
    await setDoc(doc(db, 'matches', match.id), cleanFirestoreData(match));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `matches/${match.id}`);
  }

  // Automatically recalculate and sync all quiniela participants and tournament standings when a match is saved
  try {
    recalculateAllQuinielas(updated).catch(err => {
      console.warn('Auto recalculate quinielas error:', err);
    });
    const currentAcademies = getAcademies();
    syncAcademyStandingsToStorage(currentAcademies, updated).catch(err => {
      console.warn('Auto sync academy standings error:', err);
    });
  } catch (err) {
    // non-blocking
  }

  return updated;
}

export async function deleteMatch(id: string): Promise<TournamentMatch[]> {
  // Permanently record as deleted
  markMatchAsDeleted(id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.INITIALIZED_MATCHES, 'true');
  }

  const current = getMatches();
  const updated = current.filter(p => p.id !== id);
  setItem(KEYS.MATCHES, updated);

  try {
    await deleteDoc(doc(db, 'matches', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `matches/${id}`);
  }

  // Purge all predictions referencing this deleted match across all participants and drafts
  try {
    purgeMatchPredictionsFromAll(id, updated).catch(err => {
      console.warn('Error auto-purging predictions for deleted match:', err);
    });
  } catch (err) {
    // non-blocking
  }

  return updated;
}

export async function deleteAllMatches(): Promise<TournamentMatch[]> {
  const current = getMatches();
  for (const m of current) {
    markMatchAsDeleted(m.id);
    try {
      await deleteDoc(doc(db, 'matches', m.id));
    } catch (err) {
      console.warn(`Error deleting match ${m.id} in Firestore:`, err);
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.INITIALIZED_MATCHES, 'true');
  }
  setItem(KEYS.MATCHES, []);

  try {
    purgeAllOrphanedPredictions([]).catch(err => {
      console.warn('Error purging all predictions:', err);
    });
  } catch (err) {
    // non-blocking
  }

  return [];
}

// ---------------- PLAYERS ----------------

export function getPlayers(): Player[] {
  const isInitialized = typeof window !== 'undefined' && localStorage.getItem(KEYS.INITIALIZED_PLAYERS) === 'true';
  const stored = getItem<Player[]>(KEYS.PLAYERS, isInitialized ? [] : initialPlayers);
  if (stored && stored.length > 0 && stored.length < initialPlayers.length) {
    const existingIds = new Set(stored.map(p => p.id));
    const merged = [...stored];
    for (const initP of initialPlayers) {
      if (!existingIds.has(initP.id)) {
        merged.push(initP);
      }
    }
    return merged;
  }
  return stored;
}

export async function savePlayer(player: Player): Promise<Player[]> {
  const current = getPlayers();
  const existsIndex = current.findIndex(p => p.id === player.id);
  let updated: Player[];
  if (existsIndex >= 0) {
    updated = [...current];
    updated[existsIndex] = player;
  } else {
    updated = [player, ...current];
  }
  setItem(KEYS.PLAYERS, updated);

  try {
    await setDoc(doc(db, 'players', player.id), cleanFirestoreData(player));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `players/${player.id}`);
  }

  return updated;
}

export async function deletePlayer(id: string): Promise<Player[]> {
  const current = getPlayers();
  const updated = current.filter(p => p.id !== id);
  setItem(KEYS.PLAYERS, updated);

  try {
    await deleteDoc(doc(db, 'players', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `players/${id}`);
  }

  return updated;
}

// ---------------- ACADEMIES ----------------

export function getAcademies(): Academy[] {
  return getItem<Academy[]>(KEYS.ACADEMIES, initialAcademies);
}

export async function saveAcademy(academy: Academy): Promise<Academy[]> {
  const current = getAcademies();
  const existsIndex = current.findIndex(a => a.id === academy.id);
  let updated: Academy[];
  if (existsIndex >= 0) {
    updated = [...current];
    updated[existsIndex] = academy;
  } else {
    updated = [...current, academy];
  }
  setItem(KEYS.ACADEMIES, updated);

  try {
    const cleanData = cleanFirestoreData(academy);
    await setDoc(doc(db, 'academies', academy.id), cleanData);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `academies/${academy.id}`);
  }

  return updated;
}

export async function deleteAcademy(id: string): Promise<Academy[]> {
  const current = getAcademies();
  const updated = current.filter(a => a.id !== id);
  setItem(KEYS.ACADEMIES, updated);

  try {
    await deleteDoc(doc(db, 'academies', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `academies/${id}`);
  }

  return updated;
}

export interface ComputedStandingsAcademy extends Academy {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

/**
 * Computes official standings (PJ, PG, PE, PP, GF, GC, DG, PTS) dynamically
 * from finished and live tournament matches.
 */
export function normalizeTeamName(name?: string): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Normalizes category strings (e.g., 'Sub-15', 'Sub 15', 'sub-15' -> 'sub-15')
 */
export function normalizeCategory(cat?: any): string {
  if (!cat) return '';
  if (Array.isArray(cat)) {
    return cat.length > 0 ? normalizeCategory(cat[0]) : '';
  }
  const str = typeof cat === 'string' ? cat : String(cat);
  return str.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

/**
 * Strict team matching: Matches exclusively by ID or exact normalized name.
 * Avoids dangerous substring collisions (e.g., prevents 'Atlético Los Andes' matching 'Atlético Dorado').
 */
export function isTeamMatch(
  matchTeamId: string | undefined,
  matchTeamName: string | undefined,
  acadId: string,
  acadNormName: string
): boolean {
  if (matchTeamId && acadId && matchTeamId === acadId) return true;
  if (!matchTeamName || !acadNormName) return false;
  return normalizeTeamName(matchTeamName) === acadNormName;
}

/**
 * Computes official standings (PJ, PG, PE, PP, GF, GC, DG, PTS) dynamically
 * from finished and live tournament matches with strict category isolation.
 *
 * CRITICAL AUDIT RULE:
 * If a category is specified (e.g., 'Sub-15'), stats are EXCLUSIVELY computed
 * from matches belonging to that category. If a team has 0 finished matches in
 * that category, its stats in that category MUST BE ZERO (0 PJ, 0 PTS).
 * It will NEVER inherit or mix stats from other categories or fallback values.
 */
export function computeAcademyStandings(
  academies: Academy[],
  matches: TournamentMatch[],
  category?: string
): ComputedStandingsAcademy[] {
  // 1. Build a unified registry of clubs: registered academies + any teams present in matches
  const academyMap = new Map<string, Academy>();

  // Add registered academies
  for (const acad of academies) {
    if (acad && acad.name) {
      academyMap.set(acad.id, acad);
    }
  }

  // Discover and add any teams referenced in matches that might not be in the initial academy list
  for (const m of matches) {
    if (m.homeAcademyName) {
      const homeNorm = normalizeTeamName(m.homeAcademyName);
      const exists = Array.from(academyMap.values()).some(
        a => (m.homeAcademyId && a.id === m.homeAcademyId) || normalizeTeamName(a.name) === homeNorm
      );
      if (!exists) {
        const id = m.homeAcademyId || `acad-${homeNorm.replace(/[^a-z0-9]/g, '-') || Date.now()}`;
        const matchCat = (m.category as TournamentCategory) || 'Sub-15';
        academyMap.set(id, {
          id,
          name: m.homeAcademyName,
          acronym: m.homeAcademyName.slice(0, 3).toUpperCase(),
          logo: m.homeLogo || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&auto=format&fit=crop&q=80',
          city: 'Torneo Élite',
          coach: '',
          category: matchCat,
          categories: [matchCat],
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

    if (m.awayAcademyName) {
      const awayNorm = normalizeTeamName(m.awayAcademyName);
      const exists = Array.from(academyMap.values()).some(
        a => (m.awayAcademyId && a.id === m.awayAcademyId) || normalizeTeamName(a.name) === awayNorm
      );
      if (!exists) {
        const id = m.awayAcademyId || `acad-${awayNorm.replace(/[^a-z0-9]/g, '-') || Date.now()}`;
        const matchCat = (m.category as TournamentCategory) || 'Sub-15';
        academyMap.set(id, {
          id,
          name: m.awayAcademyName,
          acronym: m.awayAcademyName.slice(0, 3).toUpperCase(),
          logo: m.awayLogo || 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=150&auto=format&fit=crop&q=80',
          city: 'Torneo Élite',
          coach: '',
          category: matchCat,
          categories: [matchCat],
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
  }

  const allAcademies = Array.from(academyMap.values());
  const isSpecificCategory = Boolean(category && category !== 'all');
  const targetCategoryNorm = isSpecificCategory ? normalizeCategory(category) : '';

  // 2. Filter academies by category if requested
  const matchingAcademies = allAcademies.filter(acad => {
    if (!isSpecificCategory) return true;

    // Check registered categories
    const acadCats = (acad.categories && acad.categories.length > 0)
      ? acad.categories
      : [acad.category || 'Sub-15'];
    const isRegisteredInCat = acadCats.some(c => normalizeCategory(c) === targetCategoryNorm);

    // Or check if it has any match scheduled/played in this category
    const acadNorm = normalizeTeamName(acad.name);
    const hasMatchInCat = matches.some(m => {
      const mCatNorm = normalizeCategory(m.category || 'Sub-15');
      if (mCatNorm !== targetCategoryNorm) return false;
      return isTeamMatch(m.homeAcademyId, m.homeAcademyName, acad.id, acadNorm) ||
             isTeamMatch(m.awayAcademyId, m.awayAcademyName, acad.id, acadNorm);
    });

    return isRegisteredInCat || hasMatchInCat;
  });

  // 3. Identify all valid finished / live matches strictly for this scope
  const validMatches = matches.filter(m => {
    if (isSpecificCategory) {
      const mCatNorm = normalizeCategory(m.category || 'Sub-15');
      if (mCatNorm !== targetCategoryNorm) {
        return false;
      }
    }
    const status = String(m.status || '').toLowerCase().trim();
    const isFinished = status === 'finished' || status === 'finalizado' || status === 'terminado' || status === 'concluido' || status === 'completado';
    const isLive = status === 'live' || status === 'en vivo' || status === 'en_vivo';
    const hasScores = m.homeScore !== undefined && m.homeScore !== null && 
                      m.awayScore !== undefined && m.awayScore !== null && 
                      !isNaN(Number(m.homeScore)) && !isNaN(Number(m.awayScore));

    return (isFinished || isLive) && hasScores;
  });

  // 4. Compute stats for each matching academy
  const computed: ComputedStandingsAcademy[] = matchingAcademies.map(acad => {
    const acadNormName = normalizeTeamName(acad.name);
    let played = 0;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    for (const m of validMatches) {
      const isHome = isTeamMatch(m.homeAcademyId, m.homeAcademyName, acad.id, acadNormName);
      const isAway = isTeamMatch(m.awayAcademyId, m.awayAcademyName, acad.id, acadNormName);

      if (isHome) {
        played++;
        const h = Number(m.homeScore || 0);
        const a = Number(m.awayScore || 0);
        goalsFor += h;
        goalsAgainst += a;
        if (h > a) won++;
        else if (h === a) drawn++;
        else lost++;
      } else if (isAway) {
        played++;
        const h = Number(m.homeScore || 0);
        const a = Number(m.awayScore || 0);
        goalsFor += a;
        goalsAgainst += h;
        if (a > h) won++;
        else if (a === h) drawn++;
        else lost++;
      }
    }

    // STRICT CATEGORY AUDIT:
    // If a specific category is requested, stats are 100% computed from matches in that category.
    // If the academy hasn't played in this category, played = 0 and points = 0.
    let finalPlayed = played;
    let finalWon = won;
    let finalDrawn = drawn;
    let finalLost = lost;
    let finalGoalsFor = goalsFor;
    let finalGoalsAgainst = goalsAgainst;
    let finalPoints = won * 3 + drawn;

    // Only if general 'all' is requested AND there are literally 0 finished matches in the entire tournament,
    // preserve initial mock demo stats for initial setup preview
    if (!isSpecificCategory && validMatches.length === 0 && played === 0) {
      finalPlayed = acad.played || 0;
      finalWon = acad.won || 0;
      finalDrawn = acad.drawn || 0;
      finalLost = acad.lost || 0;
      finalGoalsFor = acad.goalsFor || 0;
      finalGoalsAgainst = acad.goalsAgainst || 0;
      finalPoints = acad.points || (finalWon * 3 + finalDrawn);
    }

    const finalGoalDiff = finalGoalsFor - finalGoalsAgainst;

    return {
      ...acad,
      played: finalPlayed,
      won: finalWon,
      drawn: finalDrawn,
      lost: finalLost,
      goalsFor: finalGoalsFor,
      goalsAgainst: finalGoalsAgainst,
      goalDiff: finalGoalDiff,
      points: finalPoints
    };
  });

  // 5. Official Sort: Points DESC, GoalDiff DESC, GoalsFor DESC, Won DESC, Name ASC
  computed.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.won !== a.won) return b.won - a.won;
    return a.name.localeCompare(b.name);
  });

  return computed;
}

/**
 * Persist computed standings across all academies to localStorage & Firestore,
 * ensuring each category has its own audited standings and stats breakdown.
 */
export async function syncAcademyStandingsToStorage(
  academies: Academy[],
  matches: TournamentMatch[]
): Promise<Academy[]> {
  // 1. Compute category-specific standings for each tournament category
  const categoryStandingsMap: Record<string, Map<string, ComputedStandingsAcademy>> = {};
  for (const cat of TOURNAMENT_CATEGORIES) {
    const list = computeAcademyStandings(academies, matches, cat);
    const map = new Map<string, ComputedStandingsAcademy>();
    list.forEach(item => map.set(item.id, item));
    categoryStandingsMap[cat] = map;
  }

  // 2. Compute overall standings
  const overallStandings = computeAcademyStandings(academies, matches, 'all');
  const overallMap = new Map<string, ComputedStandingsAcademy>();
  overallStandings.forEach(item => overallMap.set(item.id, item));

  // 3. Update academies with separated per-category stats
  const updated: Academy[] = academies.map(acad => {
    const overall = overallMap.get(acad.id);

    const categoryStats: Record<string, {
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      points: number;
    }> = {};

    for (const cat of TOURNAMENT_CATEGORIES) {
      const catData = categoryStandingsMap[cat]?.get(acad.id);
      if (catData) {
        categoryStats[cat] = {
          played: catData.played,
          won: catData.won,
          drawn: catData.drawn,
          lost: catData.lost,
          goalsFor: catData.goalsFor,
          goalsAgainst: catData.goalsAgainst,
          points: catData.points
        };
      }
    }

    return {
      id: acad.id,
      name: acad.name,
      acronym: acad.acronym,
      logo: acad.logo,
      city: acad.city,
      coach: acad.coach,
      category: acad.category,
      categories: acad.categories,
      played: overall?.played ?? (acad.played || 0),
      won: overall?.won ?? (acad.won || 0),
      drawn: overall?.drawn ?? (acad.drawn || 0),
      lost: overall?.lost ?? (acad.lost || 0),
      goalsFor: overall?.goalsFor ?? (acad.goalsFor || 0),
      goalsAgainst: overall?.goalsAgainst ?? (acad.goalsAgainst || 0),
      points: overall?.points ?? (acad.points || 0),
      foundationYear: acad.foundationYear,
      primaryColor: acad.primaryColor,
      categoryStats
    };
  });

  setItem(KEYS.ACADEMIES, updated);

  for (const acad of updated) {
    try {
      await setDoc(doc(db, 'academies', acad.id), cleanFirestoreData(acad));
    } catch (err) {
      console.warn(`Error updating academy ${acad.id} standings in Firestore:`, err);
    }
  }

  return updated;
}

/**
 * Mark all matches of a specified jornada as finished and sync both tournament & quiniela points
 */
export async function finishJornadaMatches(
  jornada: string,
  matches: TournamentMatch[],
  academies: Academy[]
): Promise<{ updatedMatches: TournamentMatch[]; updatedAcademies: Academy[]; updatedQuinielas: QuinielaEntry[] }> {
  const updatedMatches = matches.map(m => {
    if (getMatchJornada(m) === jornada) {
      return {
        ...m,
        status: 'finished' as const,
        homeScore: Number(m.homeScore ?? 0),
        awayScore: Number(m.awayScore ?? 0)
      };
    }
    return m;
  });

  setItem(KEYS.MATCHES, updatedMatches);

  // Write updated matches to Firestore
  for (const m of updatedMatches) {
    if (getMatchJornada(m) === jornada) {
      try {
        await setDoc(doc(db, 'matches', m.id), cleanFirestoreData(m));
      } catch (err) {
        console.warn(`Error updating match ${m.id} in Firestore:`, err);
      }
    }
  }

  // Sync academy standings
  const updatedAcademies = await syncAcademyStandingsToStorage(academies, updatedMatches);

  // Recalculate Quinielas
  const updatedQuinielas = await recalculateAllQuinielas(updatedMatches);

  return { updatedMatches, updatedAcademies, updatedQuinielas };
}

/**
 * Recalculate and synchronize both tournament academy standings and quinielas in one unified operation
 */
export async function recalculateAllStandingsAndQuinielas(
  matches: TournamentMatch[],
  academies: Academy[]
): Promise<{ updatedAcademies: Academy[]; updatedQuinielas: QuinielaEntry[] }> {
  const updatedAcademies = await syncAcademyStandingsToStorage(academies, matches);
  const updatedQuinielas = await recalculateAllQuinielas(matches);
  return { updatedAcademies, updatedQuinielas };
}

// ---------------- ORDERS & QUOTATIONS ----------------

export function getOrders(): OrderQuotation[] {
  return getItem<OrderQuotation[]>(KEYS.ORDERS, initialOrders);
}

export async function addOrder(order: OrderQuotation): Promise<OrderQuotation[]> {
  const current = getOrders();
  const updated = [order, ...current];
  setItem(KEYS.ORDERS, updated);

  try {
    await setDoc(doc(db, 'orders', order.id), cleanFirestoreData(order));
  } catch (err) {
    // Orders creation is public, catch and report if error
    console.error('Error saving order to Firestore:', err);
  }

  return updated;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<OrderQuotation[]> {
  const current = getOrders();
  const updated = current.map(o => (o.id === id ? { ...o, status } : o));
  setItem(KEYS.ORDERS, updated);

  try {
    await updateDoc(doc(db, 'orders', id), { status });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
  }

  return updated;
}

export async function deleteOrder(id: string): Promise<OrderQuotation[]> {
  const current = getOrders();
  const updated = current.filter(o => o.id !== id);
  setItem(KEYS.ORDERS, updated);

  try {
    await deleteDoc(doc(db, 'orders', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `orders/${id}`);
  }

  return updated;
}

// ---------------- SETTINGS ----------------

export function getSettings(): AppSettings {
  const current = getItem<AppSettings>(KEYS.SETTINGS, initialSettings);
  return {
    ...initialSettings,
    ...current,
    emailContact: current.emailContact && current.emailContact !== 'contacto@emiliatex.com'
      ? current.emailContact
      : initialSettings.emailContact,
    address: current.address && current.address !== 'Zona Industrial Textil, Medellín / Bogotá, Colombia'
      ? current.address
      : initialSettings.address,
    companyLogoUrl: (current.companyLogoUrl && !current.companyLogoUrl.includes('potent-quest-cq6d2'))
      ? current.companyLogoUrl
      : '/assets/emiliatex-logo.jpg'
  };
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  setItem(KEYS.SETTINGS, settings);

  try {
    await setDoc(doc(db, 'settings', 'global'), cleanFirestoreData(settings), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/global');
  }

  return settings;
}

// ---------------- SAMPLE DATA RESET / SEED ----------------

export function resetSampleData(): void {
  setItem(KEYS.PRODUCTS, initialProducts);
  setItem(KEYS.MATCHES, initialMatches);
  setItem(KEYS.PLAYERS, initialPlayers);
  setItem(KEYS.ACADEMIES, initialAcademies);
  setItem(KEYS.ORDERS, initialOrders);
  setItem(KEYS.SETTINGS, initialSettings);
}

// Seed initial data to Firestore if collection is empty AND never seeded before
export async function seedInitialFirestoreData(): Promise<void> {
  // If the user or app already initialized matches, do NOT auto-seed dummy matches!
  const matchesInitialized = typeof window !== 'undefined' && localStorage.getItem(KEYS.INITIALIZED_MATCHES) === 'true';

  try {
    const prodSnap = await getDocs(collection(db, 'products'));
    if (prodSnap.empty && !localStorage.getItem(KEYS.INITIALIZED_PRODUCTS)) {
      console.log('Seeding initial products to Firestore...');
      for (const prod of initialProducts) {
        await setDoc(doc(db, 'products', prod.id), cleanFirestoreData(prod));
      }
      localStorage.setItem(KEYS.INITIALIZED_PRODUCTS, 'true');
    }

    const matchSnap = await getDocs(collection(db, 'matches'));
    if (matchSnap.empty && !matchesInitialized) {
      console.log('Seeding initial matches to Firestore...');
      for (const match of initialMatches) {
        await setDoc(doc(db, 'matches', match.id), cleanFirestoreData(match));
      }
      localStorage.setItem(KEYS.INITIALIZED_MATCHES, 'true');
    }

    const plySnap = await getDocs(collection(db, 'players'));
    if (plySnap.empty && !localStorage.getItem(KEYS.INITIALIZED_PLAYERS)) {
      console.log('Seeding initial players to Firestore...');
      for (const player of initialPlayers) {
        await setDoc(doc(db, 'players', player.id), cleanFirestoreData(player));
      }
      localStorage.setItem(KEYS.INITIALIZED_PLAYERS, 'true');
    }

    const acadSnap = await getDocs(collection(db, 'academies'));
    if (acadSnap.empty && !localStorage.getItem(KEYS.INITIALIZED_ACADEMIES)) {
      console.log('Seeding initial academies to Firestore...');
      for (const acad of initialAcademies) {
        await setDoc(doc(db, 'academies', acad.id), cleanFirestoreData(acad));
      }
      localStorage.setItem(KEYS.INITIALIZED_ACADEMIES, 'true');
    }

    const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
    if (!settingsDoc.exists()) {
      console.log('Seeding settings to Firestore...');
      await setDoc(doc(db, 'settings', 'global'), cleanFirestoreData(initialSettings));
    }
  } catch (err) {
    console.warn('Seed operation skipped or restricted:', err);
  }
}

// ---------------- REALTIME LISTENERS ----------------

export function subscribeProducts(callback: (products: Product[]) => void): () => void {
  const path = 'products';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const prods = snapshot.docs.map(d => d.data() as Product);
      if (typeof window !== 'undefined') {
        localStorage.setItem(KEYS.INITIALIZED_PRODUCTS, 'true');
      }
      setItem(KEYS.PRODUCTS, prods, false);
      callback(prods);
    },
    (error) => {
      console.warn('Product subscription notice:', error.message);
      callback(getProducts());
    }
  );
}

export function subscribeMatches(callback: (matches: TournamentMatch[]) => void): () => void {
  const path = 'matches';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const deletedIds = getDeletedMatchIds();
      const allMatches = snapshot.docs.map(d => d.data() as TournamentMatch);
      // Filter out any matches that were explicitly marked as deleted
      const activeMatches = allMatches.filter(m => !deletedIds.includes(m.id));
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(KEYS.INITIALIZED_MATCHES, 'true');
      }
      setItem(KEYS.MATCHES, activeMatches, false);
      callback(activeMatches);
    },
    (error) => {
      console.warn('Matches subscription notice:', error.message);
      callback(getMatches());
    }
  );
}

export function subscribePlayers(callback: (players: Player[]) => void): () => void {
  const path = 'players';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const players = snapshot.docs.map(d => d.data() as Player);
      if (typeof window !== 'undefined') {
        localStorage.setItem(KEYS.INITIALIZED_PLAYERS, 'true');
      }
      setItem(KEYS.PLAYERS, players, false);
      callback(players);
    },
    (error) => {
      console.warn('Players subscription notice:', error.message);
      callback(getPlayers());
    }
  );
}

export function subscribeAcademies(callback: (academies: Academy[]) => void): () => void {
  const path = 'academies';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const academies = snapshot.docs.map(d => d.data() as Academy);
      if (typeof window !== 'undefined') {
        localStorage.setItem(KEYS.INITIALIZED_ACADEMIES, 'true');
      }
      setItem(KEYS.ACADEMIES, academies, false);
      callback(academies);
    },
    (error) => {
      console.warn('Academies subscription notice:', error.message);
      callback(getAcademies());
    }
  );
}

export function subscribeOrders(callback: (orders: OrderQuotation[]) => void): () => void {
  const path = 'orders';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const orders = snapshot.docs.map(d => d.data() as OrderQuotation);
      setItem(KEYS.ORDERS, orders, false);
      callback(orders);
    },
    (error) => {
      // Non-admins will get permission denied which is expected because orders are private to admins
      console.info('Orders access notice:', error.message);
      callback(getOrders());
    }
  );
}

export function subscribeSettings(callback: (settings: AppSettings) => void): () => void {
  const path = 'settings';
  return onSnapshot(
    doc(db, path, 'global'),
    (snapshot) => {
      if (snapshot.exists()) {
        const settings = snapshot.data() as AppSettings;
        setItem(KEYS.SETTINGS, settings, false);
        callback(settings);
      } else {
        callback(getSettings());
      }
    },
    (error) => {
      console.warn('Settings subscription notice:', error.message);
      callback(getSettings());
    }
  );
}

// ---------------- QUINIELAS ----------------

export interface MatchPointsResult {
  exactHit: boolean;
  outcomeHit: boolean;
  points: number;
  description: string;
}

export function evaluateMatchPrediction(
  prediction: MatchPredictionScore | undefined,
  actualMatch: TournamentMatch
): MatchPointsResult {
  if (!prediction) {
    return { exactHit: false, outcomeHit: false, points: 0, description: 'Sin pronóstico' };
  }

  // A match is evaluated if it is finished or live with recorded scores
  const homeScoreValid = actualMatch.homeScore !== undefined && actualMatch.homeScore !== null && !isNaN(Number(actualMatch.homeScore));
  const awayScoreValid = actualMatch.awayScore !== undefined && actualMatch.awayScore !== null && !isNaN(Number(actualMatch.awayScore));
  const statusClean = String(actualMatch.status || '').toLowerCase().trim();
  const isFinished = statusClean === 'finished' || statusClean === 'finalizado' || statusClean === 'terminado' || statusClean === 'concluido' || statusClean === 'completado';
  const isLive = statusClean === 'live' || statusClean === 'en vivo' || statusClean === 'en_vivo';
  const isEvaluated = (isFinished || isLive) && homeScoreValid && awayScoreValid;

  if (!isEvaluated || !homeScoreValid || !awayScoreValid) {
    return { exactHit: false, outcomeHit: false, points: 0, description: 'Pendiente' };
  }

  const predHome = Number(prediction.homeScore ?? 0);
  const predAway = Number(prediction.awayScore ?? 0);
  const actualHome = Number(actualMatch.homeScore ?? 0);
  const actualAway = Number(actualMatch.awayScore ?? 0);

  const exact = predHome === actualHome && predAway === actualAway;
  if (exact) {
    return { exactHit: true, outcomeHit: true, points: 5, description: '¡Marcador Exacto (+5 pts)!' };
  }

  const predictedOutcome = Math.sign(predHome - predAway);
  const actualOutcome = Math.sign(actualHome - actualAway);

  if (predictedOutcome === actualOutcome) {
    return { exactHit: false, outcomeHit: true, points: 2, description: '¡Acierto Ganador/Empate (+2 pts)!' };
  }

  return { exactHit: false, outcomeHit: false, points: 0, description: 'Sin acierto (0 pts)' };
}

export function computeTotalQuinielaStats(
  predictions: Record<string, MatchPredictionScore> | undefined,
  matches: TournamentMatch[]
): { totalPoints: number; exactHitsCount: number; outcomeHitsCount: number } {
  let totalPoints = 0;
  let exactHitsCount = 0;
  let outcomeHitsCount = 0;

  if (!predictions) {
    return { totalPoints: 0, exactHitsCount: 0, outcomeHitsCount: 0 };
  }

  for (const match of matches) {
    const pred = predictions[match.id];
    if (pred) {
      const res = evaluateMatchPrediction(pred, match);
      totalPoints += res.points;
      if (res.exactHit) exactHitsCount++;
      else if (res.outcomeHit) outcomeHitsCount++;
    }
  }

  return { totalPoints, exactHitsCount, outcomeHitsCount };
}

export function getQuinielas(): QuinielaEntry[] {
  const isInitialized = typeof window !== 'undefined' && localStorage.getItem(KEYS.INITIALIZED_QUINIELAS) === 'true';
  const raw = getItem<QuinielaEntry[]>(KEYS.QUINIELAS, isInitialized ? [] : initialQuinielas);
  const deletedIds = getDeletedQuinielaIds();
  const deletedMatchIds = new Set(getDeletedMatchIds());

  const filtered = deletedIds.length === 0 ? raw : raw.filter(q => !deletedIds.includes(q.id));

  // Purge any predictions whose matches were permanently marked deleted
  if (deletedMatchIds.size > 0) {
    return filtered.map(q => {
      if (!q.predictions) return q;
      let hasOrphan = false;
      const cleanPreds: Record<string, MatchPredictionScore> = {};
      for (const [mId, score] of Object.entries(q.predictions)) {
        if (!deletedMatchIds.has(mId)) {
          cleanPreds[mId] = score;
        } else {
          hasOrphan = true;
        }
      }
      return hasOrphan ? { ...q, predictions: cleanPreds } : q;
    });
  }

  return filtered;
}

export function getUserSavedQuiniela(): { userName: string; userPhone: string; predictions: Record<string, MatchPredictionScore> } | null {
  const data = getItem<{ userName: string; userPhone: string; predictions: Record<string, MatchPredictionScore> } | null>(KEYS.USER_QUINIELA, null);
  if (!data || !data.predictions) return data;
  const deletedMatchIds = new Set(getDeletedMatchIds());
  if (deletedMatchIds.size > 0) {
    let hasOrphan = false;
    const cleanPreds: Record<string, MatchPredictionScore> = {};
    for (const [mId, score] of Object.entries(data.predictions)) {
      if (!deletedMatchIds.has(mId)) {
        cleanPreds[mId] = score;
      } else {
        hasOrphan = true;
      }
    }
    if (hasOrphan) {
      data.predictions = cleanPreds;
    }
  }
  return data;
}

export function saveUserLocalQuiniela(data: { userName: string; userPhone: string; predictions: Record<string, MatchPredictionScore> }): void {
  // Strip deleted matches before saving local draft
  const deletedMatchIds = new Set(getDeletedMatchIds());
  if (data.predictions && deletedMatchIds.size > 0) {
    const cleanPreds: Record<string, MatchPredictionScore> = {};
    for (const [mId, score] of Object.entries(data.predictions)) {
      if (!deletedMatchIds.has(mId)) {
        cleanPreds[mId] = score;
      }
    }
    data.predictions = cleanPreds;
  }
  setItem(KEYS.USER_QUINIELA, data);
}

export async function saveQuiniela(entry: QuinielaEntry): Promise<QuinielaEntry[]> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.INITIALIZED_QUINIELAS, 'true');
  }

  // If was previously marked deleted, unmark
  const deletedIds = getDeletedQuinielaIds();
  if (deletedIds.includes(entry.id)) {
    setItem(KEYS.DELETED_QUINIELA_IDS, deletedIds.filter(id => id !== entry.id));
  }

  // Strip deleted matches and non-existent matches from predictions before persisting
  const currentMatches = getMatches();
  const validMatchIds = new Set(currentMatches.map(m => m.id));
  const deletedMatchIds = new Set(getDeletedMatchIds());

  if (entry.predictions) {
    const clean: Record<string, MatchPredictionScore> = {};
    for (const [mId, score] of Object.entries(entry.predictions)) {
      if (validMatchIds.has(mId) && !deletedMatchIds.has(mId)) {
        clean[mId] = score;
      }
    }
    entry.predictions = clean;
  }

  // Recalculate stats based on clean predictions
  const stats = computeTotalQuinielaStats(entry.predictions, currentMatches);
  entry.totalPoints = stats.totalPoints;
  entry.exactHitsCount = stats.exactHitsCount;
  entry.outcomeHitsCount = stats.outcomeHitsCount;

  const current = getQuinielas();
  const existsIndex = current.findIndex(q => q.id === entry.id || (q.userPhone && q.userPhone === entry.userPhone));
  let updated: QuinielaEntry[];
  if (existsIndex >= 0) {
    updated = [...current];
    updated[existsIndex] = { ...updated[existsIndex], ...entry, updatedAt: new Date().toISOString() };
  } else {
    updated = [entry, ...current];
  }

  // Sort by points descending
  updated.sort((a, b) => b.totalPoints - a.totalPoints || b.exactHitsCount - a.exactHitsCount);
  setItem(KEYS.QUINIELAS, updated);

  try {
    await setDoc(doc(db, 'quinielas', entry.id), cleanFirestoreData(entry));
  } catch (err) {
    console.warn('Firestore Quiniela write notice:', err);
  }

  return updated;
}

export async function deleteQuiniela(id: string): Promise<QuinielaEntry[]> {
  // Mark permanently as deleted
  markQuinielaAsDeleted(id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.INITIALIZED_QUINIELAS, 'true');
  }

  const current = getQuinielas();
  const updated = current.filter(q => q.id !== id);
  setItem(KEYS.QUINIELAS, updated);

  try {
    await deleteDoc(doc(db, 'quinielas', id));
  } catch (err) {
    console.warn('Firestore Quiniela delete notice:', err);
  }

  return updated;
}

export async function deleteAllQuinielas(): Promise<QuinielaEntry[]> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.INITIALIZED_QUINIELAS, 'true');
  }

  const current = getQuinielas();
  current.forEach(q => markQuinielaAsDeleted(q.id));
  setItem(KEYS.QUINIELAS, []);

  for (const q of current) {
    try {
      await deleteDoc(doc(db, 'quinielas', q.id));
    } catch (err) {
      console.warn('Firestore Quiniela delete notice:', err);
    }
  }

  return [];
}

export async function deleteSampleQuinielas(): Promise<QuinielaEntry[]> {
  const sampleIds = ['quiniela-dt-ramirez', 'quiniela-marcos-fan', 'quiniela-laura-academia', 'quiniela-valencia-cf'];
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.INITIALIZED_QUINIELAS, 'true');
  }

  sampleIds.forEach(id => markQuinielaAsDeleted(id));
  const current = getQuinielas();
  const updated = current.filter(q => !sampleIds.includes(q.id));
  setItem(KEYS.QUINIELAS, updated);

  for (const id of sampleIds) {
    try {
      await deleteDoc(doc(db, 'quinielas', id));
    } catch (err) {
      // ignore
    }
  }

  return updated;
}

/**
 * Recalculates all participants' scores, simultaneously pruning any orphaned predictions
 * for matches that were deleted from the tournament.
 */
export async function recalculateAllQuinielas(
  matches: TournamentMatch[],
  entriesList?: QuinielaEntry[]
): Promise<QuinielaEntry[]> {
  let sourceEntries = entriesList && entriesList.length > 0 ? [...entriesList] : getQuinielas();

  // If online, fetch from Firestore to guarantee every remote participant is recalculated
  try {
    const snap = await getDocs(collection(db, 'quinielas'));
    if (!snap.empty) {
      const firestoreList = snap.docs.map(d => ({ ...d.data(), id: d.id } as QuinielaEntry));
      const deletedIds = getDeletedQuinielaIds();
      const map = new Map<string, QuinielaEntry>();
      firestoreList.filter(q => !deletedIds.includes(q.id)).forEach(q => map.set(q.id, q));
      sourceEntries.filter(q => !deletedIds.includes(q.id)).forEach(q => map.set(q.id, q));
      sourceEntries = Array.from(map.values());
    }
  } catch (err) {
    console.warn('Could not fetch remote quinielas during recalculate:', err);
  }

  const validMatchIds = new Set(matches.map(m => m.id));
  const deletedMatchIds = new Set(getDeletedMatchIds());

  // Also clean local user draft predictions if needed
  const userSaved = getUserSavedQuiniela();
  if (userSaved && userSaved.predictions) {
    let hadOrphans = false;
    const cleanPreds: Record<string, MatchPredictionScore> = {};
    for (const [mId, score] of Object.entries(userSaved.predictions)) {
      if (validMatchIds.has(mId) && !deletedMatchIds.has(mId)) {
        cleanPreds[mId] = score;
      } else {
        hadOrphans = true;
      }
    }
    if (hadOrphans) {
      saveUserLocalQuiniela({ ...userSaved, predictions: cleanPreds });
    }
  }

  const updated = sourceEntries.map(entry => {
    // Purge any predictions for matches that were deleted or no longer exist
    let cleanPreds = entry.predictions || {};
    if (entry.predictions) {
      const sanitized: Record<string, MatchPredictionScore> = {};
      for (const [mId, pred] of Object.entries(entry.predictions)) {
        if (validMatchIds.has(mId) && !deletedMatchIds.has(mId)) {
          sanitized[mId] = pred;
        }
      }
      cleanPreds = sanitized;
    }

    const stats = computeTotalQuinielaStats(cleanPreds, matches);
    return {
      ...entry,
      predictions: cleanPreds,
      totalPoints: stats.totalPoints,
      exactHitsCount: stats.exactHitsCount,
      outcomeHitsCount: stats.outcomeHitsCount,
      updatedAt: new Date().toISOString()
    };
  });

  updated.sort((a, b) => 
    b.totalPoints - a.totalPoints || 
    b.exactHitsCount - a.exactHitsCount || 
    b.outcomeHitsCount - a.outcomeHitsCount ||
    a.userName.localeCompare(b.userName)
  );

  setItem(KEYS.QUINIELAS, updated);

  for (const entry of updated) {
    try {
      await setDoc(doc(db, 'quinielas', entry.id), cleanFirestoreData(entry));
    } catch (err) {
      console.warn('Firestore Quiniela recalculate write notice:', err);
    }
  }

  return updated;
}

/**
 * Purge predictions for a single deleted match from all participants across Firestore & localStorage
 */
export async function purgeMatchPredictionsFromAll(
  deletedMatchId: string,
  updatedMatches: TournamentMatch[]
): Promise<QuinielaEntry[]> {
  // Purge from local user draft if present
  const userSaved = getUserSavedQuiniela();
  if (userSaved && userSaved.predictions && userSaved.predictions[deletedMatchId]) {
    const updatedUserPreds = { ...userSaved.predictions };
    delete updatedUserPreds[deletedMatchId];
    saveUserLocalQuiniela({
      ...userSaved,
      predictions: updatedUserPreds
    });
  }

  // Recalculating with the updatedMatches automatically strips all predictions for deletedMatchId
  return await recalculateAllQuinielas(updatedMatches);
}

/**
 * Scan all quinielas and strip any prediction for matches that are not in currentMatches
 */
export async function purgeAllOrphanedPredictions(
  currentMatches: TournamentMatch[]
): Promise<QuinielaEntry[]> {
  return await recalculateAllQuinielas(currentMatches);
}

export function subscribeQuinielas(callback: (quinielas: QuinielaEntry[]) => void): () => void {
  const path = 'quinielas';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const deletedIds = getDeletedQuinielaIds();
      const currentMatches = getMatches();
      const validMatchIds = new Set(currentMatches.map(m => m.id));
      const deletedMatchIds = new Set(getDeletedMatchIds());

      if (!snapshot.empty) {
        const list = snapshot.docs
          .map(d => {
            const entry = { ...d.data(), id: d.id } as QuinielaEntry;
            if (entry.predictions) {
              const cleanPreds: Record<string, MatchPredictionScore> = {};
              let hasOrphan = false;
              for (const [mId, score] of Object.entries(entry.predictions)) {
                if (validMatchIds.has(mId) && !deletedMatchIds.has(mId)) {
                  cleanPreds[mId] = score;
                } else {
                  hasOrphan = true;
                }
              }
              if (hasOrphan) {
                entry.predictions = cleanPreds;
              }
            }
            return entry;
          })
          .filter(q => !deletedIds.includes(q.id));

        list.sort((a, b) => b.totalPoints - a.totalPoints || b.exactHitsCount - a.exactHitsCount);
        if (typeof window !== 'undefined') {
          localStorage.setItem(KEYS.INITIALIZED_QUINIELAS, 'true');
        }
        setItem(KEYS.QUINIELAS, list, false);
        callback(list);
      } else {
        callback(getQuinielas());
      }
    },
    (error) => {
      console.warn('Quinielas subscription notice:', error.message);
      callback(getQuinielas());
    }
  );
}

// ---------------- CLIENT WORKS GALLERY ----------------
export function getClientWorks(): ClientWorkItem[] {
  const isInitialized = typeof window !== 'undefined' && localStorage.getItem(KEYS.INITIALIZED_CLIENT_WORKS) === 'true';
  const stored = getItem<ClientWorkItem[]>(KEYS.CLIENT_WORKS, isInitialized ? [] : initialClientWorks);
  const deletedIds = getDeletedClientWorkIds();
  if (deletedIds.length === 0) return stored;
  return stored.filter(item => !deletedIds.includes(item.id));
}

export async function saveClientWork(item: ClientWorkItem): Promise<ClientWorkItem[]> {
  unmarkClientWorkAsDeleted(item.id);
  const current = getClientWorks();
  const existsIdx = current.findIndex(w => w.id === item.id);
  let updated: ClientWorkItem[];
  if (existsIdx >= 0) {
    updated = [...current];
    updated[existsIdx] = item;
  } else {
    updated = [item, ...current];
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.INITIALIZED_CLIENT_WORKS, 'true');
  }
  setItem(KEYS.CLIENT_WORKS, updated);

  try {
    await setDoc(doc(db, 'client_works', item.id), cleanFirestoreData(item));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `client_works/${item.id}`);
  }
  return updated;
}

export async function deleteClientWork(id: string): Promise<ClientWorkItem[]> {
  markClientWorkAsDeleted(id);
  const current = getClientWorks();
  const updated = current.filter(w => w.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.INITIALIZED_CLIENT_WORKS, 'true');
  }
  setItem(KEYS.CLIENT_WORKS, updated);

  try {
    await deleteDoc(doc(db, 'client_works', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `client_works/${id}`);
  }
  try {
    await deleteDoc(doc(db, 'clientWorks', id));
  } catch {
    // Ignore alias if absent
  }
  return updated;
}

export function subscribeClientWorks(callback: (items: ClientWorkItem[]) => void): () => void {
  const path = 'client_works';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const deletedIds = getDeletedClientWorkIds();
      if (!snapshot.empty) {
        const list = snapshot.docs
          .map(d => ({ ...d.data(), id: d.id } as ClientWorkItem))
          .filter(w => !deletedIds.includes(w.id));
        if (typeof window !== 'undefined') {
          localStorage.setItem(KEYS.INITIALIZED_CLIENT_WORKS, 'true');
        }
        setItem(KEYS.CLIENT_WORKS, list, false);
        callback(list);
      } else {
        const fallbackList = getClientWorks().filter(w => !deletedIds.includes(w.id));
        callback(fallbackList);
      }
    },
    (error) => {
      console.warn('Client works subscription notice:', error.message);
      const deletedIds = getDeletedClientWorkIds();
      callback(getClientWorks().filter(w => !deletedIds.includes(w.id)));
    }
  );
}

// ---------------- WHATSAPP HELPER ----------------
export function formatWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

// ---------------- TIME FORMATTER (12-Hour AM/PM) ----------------
export function formatMatchTime(timeStr?: string): string {
  if (!timeStr) return '';
  const clean = timeStr.replace(/\s*hrs\.?/i, '').replace(/\s*horas?/i, '').trim();
  if (!clean) return '';

  // If already formatted with AM/PM
  if (/am|pm/i.test(clean)) {
    return clean.toUpperCase();
  }

  // Check for 24-hour military pattern "HH:mm" or "H:mm"
  const match = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    if (!isNaN(hours)) {
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
      return `${hours}:${minutes} ${period}`;
    }
  }

  return clean;
}
