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

export const initialQuinielas: QuinielaEntry[] = [
  {
    id: 'quiniela-dt-ramirez',
    userName: 'Prof. Carlos Ramírez',
    userPhone: '+58 412 8901234',
    totalPoints: 24,
    exactHitsCount: 4,
    outcomeHitsCount: 2,
    predictions: {
      'match-1': { homeScore: 2, awayScore: 1 },
      'match-2': { homeScore: 3, awayScore: 0 },
      'match-3': { homeScore: 1, awayScore: 1 },
      'match-4': { homeScore: 2, awayScore: 0 }
    },
    createdAt: '2026-09-21T14:30:00Z'
  },
  {
    id: 'quiniela-marcos-fan',
    userName: 'Marcos "El Goleador"',
    userPhone: '+58 424 5567890',
    totalPoints: 19,
    exactHitsCount: 3,
    outcomeHitsCount: 2,
    predictions: {
      'match-1': { homeScore: 2, awayScore: 1 },
      'match-2': { homeScore: 2, awayScore: 1 },
      'match-3': { homeScore: 0, awayScore: 0 }
    },
    createdAt: '2026-09-22T09:15:00Z'
  },
  {
    id: 'quiniela-laura-academia',
    userName: 'Laura Méndez (Academia Central)',
    userPhone: '+58 414 1122334',
    totalPoints: 16,
    exactHitsCount: 2,
    outcomeHitsCount: 3,
    predictions: {
      'match-1': { homeScore: 3, awayScore: 1 },
      'match-2': { homeScore: 3, awayScore: 0 }
    },
    createdAt: '2026-09-22T16:45:00Z'
  },
  {
    id: 'quiniela-valencia-cf',
    userName: 'Fanáticos Valencia FC',
    userPhone: '+58 416 9988776',
    totalPoints: 14,
    exactHitsCount: 2,
    outcomeHitsCount: 2,
    predictions: {
      'match-1': { homeScore: 1, awayScore: 0 },
      'match-4': { homeScore: 2, awayScore: 1 }
    },
    createdAt: '2026-09-23T08:00:00Z'
  }
];

const KEYS = {
  PRODUCTS: 'emiliatex_products_v1',
  MATCHES: 'emiliatex_matches_v1',
  PLAYERS: 'emiliatex_players_v1',
  ACADEMIES: 'emiliatex_academies_v1',
  ORDERS: 'emiliatex_orders_v1',
  SETTINGS: 'emiliatex_settings_v1',
  QUINIELAS: 'emiliatex_quinielas_v1',
  USER_QUINIELA: 'emiliatex_user_quiniela_v1',
};

// Safe localStorage accessor
function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
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
  return getItem<Product[]>(KEYS.PRODUCTS, initialProducts);
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

// ---------------- MATCHES ----------------

export function getMatches(): TournamentMatch[] {
  return getItem<TournamentMatch[]>(KEYS.MATCHES, initialMatches);
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
  setItem(KEYS.MATCHES, updated);

  try {
    await setDoc(doc(db, 'matches', match.id), cleanFirestoreData(match));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `matches/${match.id}`);
  }

  return updated;
}

export async function deleteMatch(id: string): Promise<TournamentMatch[]> {
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

// ---------------- PLAYERS ----------------

export function getPlayers(): Player[] {
  return getItem<Player[]>(KEYS.PLAYERS, initialPlayers);
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
  return getItem<AppSettings>(KEYS.SETTINGS, initialSettings);
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

// Seed initial data to Firestore if collection is empty
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    const prodSnap = await getDocs(collection(db, 'products'));
    if (prodSnap.empty) {
      console.log('Seeding initial products to Firestore...');
      for (const prod of initialProducts) {
        await setDoc(doc(db, 'products', prod.id), cleanFirestoreData(prod));
      }
    }

    const matchSnap = await getDocs(collection(db, 'matches'));
    if (matchSnap.empty) {
      console.log('Seeding initial matches to Firestore...');
      for (const match of initialMatches) {
        await setDoc(doc(db, 'matches', match.id), cleanFirestoreData(match));
      }
    }

    const plySnap = await getDocs(collection(db, 'players'));
    if (plySnap.empty) {
      console.log('Seeding initial players to Firestore...');
      for (const player of initialPlayers) {
        await setDoc(doc(db, 'players', player.id), cleanFirestoreData(player));
      }
    }

    const acadSnap = await getDocs(collection(db, 'academies'));
    if (acadSnap.empty) {
      console.log('Seeding initial academies to Firestore...');
      for (const acad of initialAcademies) {
        await setDoc(doc(db, 'academies', acad.id), cleanFirestoreData(acad));
      }
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
      if (!snapshot.empty) {
        const prods = snapshot.docs.map(d => d.data() as Product);
        setItem(KEYS.PRODUCTS, prods);
        callback(prods);
      } else {
        callback(getProducts());
      }
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
      if (!snapshot.empty) {
        const matches = snapshot.docs.map(d => d.data() as TournamentMatch);
        setItem(KEYS.MATCHES, matches);
        callback(matches);
      } else {
        callback(getMatches());
      }
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
      if (!snapshot.empty) {
        const players = snapshot.docs.map(d => d.data() as Player);
        setItem(KEYS.PLAYERS, players);
        callback(players);
      } else {
        callback(getPlayers());
      }
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
      if (!snapshot.empty) {
        const academies = snapshot.docs.map(d => d.data() as Academy);
        setItem(KEYS.ACADEMIES, academies);
        callback(academies);
      } else {
        callback(getAcademies());
      }
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
  if (!prediction || actualMatch.status !== 'finished' || actualMatch.homeScore === undefined || actualMatch.awayScore === undefined) {
    return { exactHit: false, outcomeHit: false, points: 0, description: 'Pendiente' };
  }

  const exact = prediction.homeScore === actualMatch.homeScore && prediction.awayScore === actualMatch.awayScore;
  if (exact) {
    return { exactHit: true, outcomeHit: true, points: 5, description: '¡Marcador Exacto (+5 pts)!' };
  }

  const predictedOutcome = Math.sign(prediction.homeScore - prediction.awayScore);
  const actualOutcome = Math.sign(actualMatch.homeScore - actualMatch.awayScore);

  if (predictedOutcome === actualOutcome) {
    return { exactHit: false, outcomeHit: true, points: 2, description: '¡Acierto Ganador/Empate (+2 pts)!' };
  }

  return { exactHit: false, outcomeHit: false, points: 0, description: 'Sin acierto (0 pts)' };
}

export function computeTotalQuinielaStats(
  predictions: Record<string, MatchPredictionScore>,
  matches: TournamentMatch[]
): { totalPoints: number; exactHitsCount: number; outcomeHitsCount: number } {
  let totalPoints = 0;
  let exactHitsCount = 0;
  let outcomeHitsCount = 0;

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
  return getItem<QuinielaEntry[]>(KEYS.QUINIELAS, initialQuinielas);
}

export function getUserSavedQuiniela(): { userName: string; userPhone: string; predictions: Record<string, MatchPredictionScore> } | null {
  return getItem(KEYS.USER_QUINIELA, null);
}

export function saveUserLocalQuiniela(data: { userName: string; userPhone: string; predictions: Record<string, MatchPredictionScore> }): void {
  setItem(KEYS.USER_QUINIELA, data);
}

export async function saveQuiniela(entry: QuinielaEntry): Promise<QuinielaEntry[]> {
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

export function subscribeQuinielas(callback: (quinielas: QuinielaEntry[]) => void): () => void {
  const path = 'quinielas';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as QuinielaEntry));
        list.sort((a, b) => b.totalPoints - a.totalPoints || b.exactHitsCount - a.exactHitsCount);
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
