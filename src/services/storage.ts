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
import { Product, TournamentMatch, Player, Academy, OrderQuotation, AppSettings, OrderStatus, QuinielaEntry, MatchPredictionScore } from '../types';
import { 
  initialProducts, 
  initialMatches, 
  initialPlayers, 
  initialAcademies, 
  initialOrders, 
  initialSettings 
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
  INITIALIZED_MATCHES: 'emiliatex_matches_initialized_v1',
  INITIALIZED_PRODUCTS: 'emiliatex_products_initialized_v1',
  INITIALIZED_PLAYERS: 'emiliatex_players_initialized_v1',
  INITIALIZED_ACADEMIES: 'emiliatex_academies_initialized_v1',
  DELETED_MATCH_IDS: 'emiliatex_deleted_match_ids_v1',
  INITIALIZED_QUINIELAS: 'emiliatex_quinielas_initialized_v1',
  DELETED_QUINIELA_IDS: 'emiliatex_deleted_quiniela_ids_v1',
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

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('emiliatex_storage_update', { detail: { key } }));
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

  // Automatically recalculate and sync all quiniela participants when a match is saved
  try {
    recalculateAllQuinielas(updated).catch(err => {
      console.warn('Auto recalculate quinielas error:', err);
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
  return [];
}

// ---------------- PLAYERS ----------------

export function getPlayers(): Player[] {
  const isInitialized = typeof window !== 'undefined' && localStorage.getItem(KEYS.INITIALIZED_PLAYERS) === 'true';
  return getItem<Player[]>(KEYS.PLAYERS, isInitialized ? [] : initialPlayers);
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
  let changed = false;
  if (!current.emailContact || current.emailContact === 'contacto@emiliatex.com') {
    current.emailContact = 'emiliatexca81@gmail.com';
    changed = true;
  }
  if (!current.address || current.address === 'Zona Industrial Textil, Medellín / Bogotá, Colombia') {
    current.address = 'Calle Principal de Santa Teresa Vereda 5 Galpón 4-179, San Cristóbal -Edo. Táchira Venezuela';
    changed = true;
  }
  if (!current.companyLogoUrl) {
    current.companyLogoUrl = 'https://firebasestorage.googleapis.com/v0/b/potent-quest-cq6d2.firebasestorage.app/o/WhatsApp%20Image%202026-10-11%20at%202.13.47%20PM.jpeg?alt=media&token=0f9b47e3-b545-40e8-9e68-6164e112868d';
    changed = true;
  }
  if (changed) {
    setItem(KEYS.SETTINGS, current);
  }
  return current;
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
      setItem(KEYS.PRODUCTS, prods);
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
      setItem(KEYS.MATCHES, activeMatches);
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
      setItem(KEYS.PLAYERS, players);
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
      setItem(KEYS.ACADEMIES, academies);
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
      setItem(KEYS.ORDERS, orders);
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
        setItem(KEYS.SETTINGS, settings);
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
  const isFinished = actualMatch.status === 'finished';
  const isEvaluated = isFinished || (actualMatch.status === 'live' && homeScoreValid && awayScoreValid);

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
  if (deletedIds.length === 0) return raw;
  return raw.filter(q => !deletedIds.includes(q.id));
}

export function getUserSavedQuiniela(): { userName: string; userPhone: string; predictions: Record<string, MatchPredictionScore> } | null {
  return getItem(KEYS.USER_QUINIELA, null);
}

export function saveUserLocalQuiniela(data: { userName: string; userPhone: string; predictions: Record<string, MatchPredictionScore> }): void {
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

  const updated = sourceEntries.map(entry => {
    const stats = computeTotalQuinielaStats(entry.predictions, matches);
    return {
      ...entry,
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

export function subscribeQuinielas(callback: (quinielas: QuinielaEntry[]) => void): () => void {
  const path = 'quinielas';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const deletedIds = getDeletedQuinielaIds();
      if (!snapshot.empty) {
        const list = snapshot.docs
          .map(d => ({ ...d.data(), id: d.id } as QuinielaEntry))
          .filter(q => !deletedIds.includes(q.id));
        list.sort((a, b) => b.totalPoints - a.totalPoints || b.exactHitsCount - a.exactHitsCount);
        if (typeof window !== 'undefined') {
          localStorage.setItem(KEYS.INITIALIZED_QUINIELAS, 'true');
        }
        setItem(KEYS.QUINIELAS, list);
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

// ---------------- WHATSAPP HELPER ----------------
export function formatWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
