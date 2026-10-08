export type ProductCategory = 'deportivo' | 'corporativo';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  subcategory: string;
  sku: string;
  description: string;
  images: string[];
  fabricMaterial: string;
  features: string[];
  sizesAvailable: string[];
  minQuantity: number;
  priceEstimate: string;
  isFeatured?: boolean;
  inStock?: boolean;
}

export const TOURNAMENT_CATEGORIES = ['Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15'] as const;
export type TournamentCategory = typeof TOURNAMENT_CATEGORIES[number];

export const MATCH_STAGES = [
  'Fase de Grupos',
  'Octavos de Final',
  'Cuartos de Final',
  'Semifinales',
  'Gran Final'
] as const;
export type MatchStage = typeof MATCH_STAGES[number];

export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface MatchLineupPlayer {
  id?: string;
  name: string;
  number: number;
  position: 'Portero' | 'Defensa' | 'Centrocampista' | 'Delantero' | string;
  isStarter?: boolean;
  photo?: string;
  captain?: boolean;
}

export interface MatchEvent {
  id: string;
  minute: string | number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
  team: 'home' | 'away';
  playerName: string;
  assistantName?: string;
  playerOut?: string;
  detail?: string;
}

export interface MatchLineups {
  homeFormation?: string; // e.g. "4-3-3", "4-4-2", "3-2-1"
  awayFormation?: string;
  homeStarters?: MatchLineupPlayer[];
  homeSubstitutes?: MatchLineupPlayer[];
  awayStarters?: MatchLineupPlayer[];
  awaySubstitutes?: MatchLineupPlayer[];
  homeCoach?: string;
  awayCoach?: string;
}

export interface TournamentMatch {
  id: string;
  tournamentName: string;
  phase: string; // e.g. "Fase de Grupos - Fecha 3", "Semifinales"
  stage?: MatchStage | string; // 'Fase de Grupos' | 'Octavos de Final' | 'Cuartos de Final' | 'Semifinales' | 'Gran Final'
  category?: TournamentCategory | string; // 'Sub-7' | 'Sub-9' | 'Sub-11' | 'Sub-13' | 'Sub-15'
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  stadium: string;
  homeAcademyId: string;
  homeAcademyName: string;
  homeLogo: string;
  homeScore?: number;
  awayAcademyId: string;
  awayAcademyName: string;
  awayLogo: string;
  awayScore?: number;
  status: MatchStatus;
  liveMinute?: string;
  mvp?: string;
  summary?: string;
  referee?: string;
  lineups?: MatchLineups;
  events?: MatchEvent[];
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: 'Portero' | 'Defensa' | 'Centrocampista' | 'Delantero';
  academyId: string;
  academyName: string;
  category?: TournamentCategory | string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  photo: string;
  matchesPlayed: number;
  mvpCount: number;
  age?: number;
}

export interface Academy {
  id: string;
  name: string;
  acronym: string;
  logo: string;
  city: string;
  coach: string;
  category: string;
  categories?: string[];
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  foundationYear?: string;
  primaryColor?: string;
}

export type OrderStatus = 'pending' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  sizes: string;
  customization: string;
}

export interface OrderQuotation {
  id: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  companyOrTeam: string;
  items: OrderItem[];
  totalEstimate: string;
  status: OrderStatus;
  notes?: string;
  whatsappMessageSent: boolean;
}

export interface AppSettings {
  whatsappNumber: string; // e.g. "573105557890"
  companyName: string;
  tournamentName: string;
  emailContact: string;
  address: string;
}

export interface MatchPredictionScore {
  homeScore: number;
  awayScore: number;
}

export interface QuinielaEntry {
  id: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  totalPoints: number;
  exactHitsCount: number;
  outcomeHitsCount: number;
  predictions: Record<string, MatchPredictionScore>; // matchId -> { homeScore, awayScore }
  createdAt: string;
  updatedAt?: string;
}
