import { Product, TournamentMatch, Player, Academy, OrderQuotation, AppSettings } from '../types';

export const initialSettings: AppSettings = {
  whatsappNumber: '573124567890',
  companyName: 'EMILIATEX Confecciones & Uniformes',
  tournamentName: 'Torneo Élite EMILIATEX 2026',
  emailContact: 'emiliatexca81@gmail.com',
  address: 'Calle Principal de Santa Teresa Vereda 5 Galpón 4-179, San Cristóbal -Edo. Táchira Venezuela'
};

export const initialAcademies: Academy[] = [
  {
    id: 'acad-1',
    name: 'Deportivo Emiliatex FC',
    acronym: 'EMX',
    logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&auto=format&fit=crop&q=80',
    city: 'Medellín',
    coach: 'Carlos Valencia',
    category: 'Sub-15',
    categories: ['Sub-9', 'Sub-11', 'Sub-13', 'Sub-15'],
    played: 5,
    won: 4,
    drawn: 1,
    lost: 0,
    goalsFor: 14,
    goalsAgainst: 4,
    points: 13,
    foundationYear: '2021',
    primaryColor: '#D4AF37'
  },
  {
    id: 'acad-2',
    name: 'Academia Real Élite',
    acronym: 'ARE',
    logo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=150&auto=format&fit=crop&q=80',
    city: 'Bogotá',
    coach: 'Andrés Morales',
    category: 'Sub-15',
    categories: ['Sub-7', 'Sub-11', 'Sub-13', 'Sub-15'],
    played: 5,
    won: 4,
    drawn: 0,
    lost: 1,
    goalsFor: 12,
    goalsAgainst: 5,
    points: 12,
    foundationYear: '2019',
    primaryColor: '#E5C158'
  },
  {
    id: 'acad-3',
    name: 'Atlético Dorado',
    acronym: 'ATD',
    logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80',
    city: 'Cali',
    coach: 'Mauricio Restrepo',
    category: 'Sub-13',
    categories: ['Sub-7', 'Sub-9', 'Sub-11', 'Sub-13'],
    played: 5,
    won: 3,
    drawn: 1,
    lost: 1,
    goalsFor: 9,
    goalsAgainst: 6,
    points: 10,
    foundationYear: '2020',
    primaryColor: '#F59E0B'
  },
  {
    id: 'acad-4',
    name: 'Titanes Sport Academy',
    acronym: 'TSA',
    logo: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=150&auto=format&fit=crop&q=80',
    city: 'Barranquilla',
    coach: 'Harold Cuero',
    category: 'Sub-15',
    categories: ['Sub-9', 'Sub-11', 'Sub-13', 'Sub-15'],
    played: 5,
    won: 2,
    drawn: 1,
    lost: 2,
    goalsFor: 8,
    goalsAgainst: 8,
    points: 7,
    foundationYear: '2022',
    primaryColor: '#3B82F6'
  },
  {
    id: 'acad-5',
    name: 'Sporting Metropolitano',
    acronym: 'SPM',
    logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=150&auto=format&fit=crop&q=80',
    city: 'Bucaramanga',
    coach: 'Guillermo Buitrago',
    category: 'Sub-11',
    categories: ['Sub-7', 'Sub-9', 'Sub-11', 'Sub-13'],
    played: 5,
    won: 2,
    drawn: 0,
    lost: 3,
    goalsFor: 7,
    goalsAgainst: 10,
    points: 6,
    foundationYear: '2021',
    primaryColor: '#10B981'
  },
  {
    id: 'acad-6',
    name: 'Huracán FC Formativo',
    acronym: 'HUR',
    logo: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=150&auto=format&fit=crop&q=80',
    city: 'Pereira',
    coach: 'Nelson Bedoya',
    category: 'Sub-13',
    categories: ['Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15'],
    played: 5,
    won: 1,
    drawn: 1,
    lost: 3,
    goalsFor: 6,
    goalsAgainst: 11,
    points: 4,
    foundationYear: '2023',
    primaryColor: '#EF4444'
  }
];

export const initialPlayers: Player[] = [
  {
    id: 'ply-1',
    name: 'Mateo Cardona',
    number: 9,
    position: 'Delantero',
    academyId: 'acad-1',
    academyName: 'Deportivo Emiliatex FC',
    category: 'Sub-15',
    goals: 7,
    assists: 3,
    yellowCards: 1,
    redCards: 0,
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    matchesPlayed: 5,
    mvpCount: 3,
    age: 15
  },
  {
    id: 'ply-2',
    name: 'Santiago Arboleda',
    number: 10,
    position: 'Centrocampista',
    academyId: 'acad-2',
    academyName: 'Academia Real Élite',
    category: 'Sub-15',
    goals: 5,
    assists: 5,
    yellowCards: 0,
    redCards: 0,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    matchesPlayed: 5,
    mvpCount: 2,
    age: 14
  },
  {
    id: 'ply-3',
    name: 'Daniel Riascos',
    number: 11,
    position: 'Delantero',
    academyId: 'acad-3',
    academyName: 'Atlético Dorado',
    category: 'Sub-13',
    goals: 4,
    assists: 2,
    yellowCards: 2,
    redCards: 0,
    photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80',
    matchesPlayed: 5,
    mvpCount: 1,
    age: 13
  },
  {
    id: 'ply-4',
    name: 'Brayan Estupiñán',
    number: 7,
    position: 'Delantero',
    academyId: 'acad-4',
    academyName: 'Titanes Sport Academy',
    category: 'Sub-15',
    goals: 4,
    assists: 1,
    yellowCards: 0,
    redCards: 0,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    matchesPlayed: 5,
    mvpCount: 1,
    age: 15
  },
  {
    id: 'ply-5',
    name: 'Kevin Ospina',
    number: 1,
    position: 'Portero',
    academyId: 'acad-1',
    academyName: 'Deportivo Emiliatex FC',
    category: 'Sub-15',
    goals: 0,
    assists: 1,
    yellowCards: 0,
    redCards: 0,
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
    matchesPlayed: 5,
    mvpCount: 2,
    age: 15
  },
  {
    id: 'ply-6',
    name: 'Juan José Quintero',
    number: 5,
    position: 'Defensa',
    academyId: 'acad-2',
    academyName: 'Academia Real Élite',
    category: 'Sub-13',
    goals: 2,
    assists: 2,
    yellowCards: 1,
    redCards: 0,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    matchesPlayed: 5,
    mvpCount: 1,
    age: 13
  }
];

export const initialMatches: TournamentMatch[] = [
  {
    id: 'mtc-1',
    tournamentName: 'Torneo Élite EMILIATEX 2026',
    phase: 'Gran Final',
    stage: 'Gran Final',
    category: 'Sub-15',
    date: '2026-09-18',
    time: '18:30',
    stadium: 'Estadio Metropolitano Élite - Cancha 1',
    homeAcademyId: 'acad-1',
    homeAcademyName: 'Deportivo Emiliatex FC',
    homeLogo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&auto=format&fit=crop&q=80',
    homeScore: 2,
    awayAcademyId: 'acad-2',
    awayAcademyName: 'Academia Real Élite',
    awayLogo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=150&auto=format&fit=crop&q=80',
    awayScore: 1,
    status: 'live',
    liveMinute: "68'",
    referee: 'Carlos Betancur (Colegio Antioquia)',
    summary: 'Gran Final vibrante con marco imponente de público y juego táctico de alto nivel en Sub-15.',
    lineups: {
      homeFormation: '4-3-3',
      awayFormation: '4-4-2',
      homeCoach: 'Carlos Mario Restrepo',
      awayCoach: 'David Morales',
      homeStarters: [
        { number: 1, name: 'Kevin Ospina', position: 'Portero', isStarter: true },
        { number: 2, name: 'Samuel Echavarría', position: 'Defensa', isStarter: true },
        { number: 4, name: 'Juan Esteban Vélez', position: 'Defensa', isStarter: true },
        { number: 3, name: 'Felipe Henao', position: 'Defensa', isStarter: true },
        { number: 6, name: 'Tomás Gaviria', position: 'Defensa', isStarter: true },
        { number: 8, name: 'Sebastián Londoño', position: 'Centrocampista', isStarter: true },
        { number: 10, name: 'Camilo Mosquera', position: 'Centrocampista', isStarter: true, captain: true },
        { number: 14, name: 'Julián Perea', position: 'Centrocampista', isStarter: true },
        { number: 7, name: 'Andrés Felipe Gómez', position: 'Delantero', isStarter: true },
        { number: 9, name: 'Mateo Cardona', position: 'Delantero', isStarter: true },
        { number: 11, name: 'Nicolás Murillo', position: 'Delantero', isStarter: true }
      ],
      homeSubstitutes: [
        { number: 12, name: 'Daniel Zapata (PO)', position: 'Portero' },
        { number: 13, name: 'Emilio Bedoya', position: 'Defensa' },
        { number: 15, name: 'Johan Carvajal', position: 'Centrocampista' },
        { number: 17, name: 'David Castaño', position: 'Delantero' }
      ],
      awayStarters: [
        { number: 1, name: 'Luis Fernando Maya', position: 'Portero', isStarter: true },
        { number: 4, name: 'Juan José Quintero', position: 'Defensa', isStarter: true },
        { number: 2, name: 'Cristian Barbosa', position: 'Defensa', isStarter: true },
        { number: 3, name: 'Lucas Benítez', position: 'Defensa', isStarter: true },
        { number: 5, name: 'Jerónimo Salgado', position: 'Defensa', isStarter: true },
        { number: 8, name: 'Esteban Palacios', position: 'Centrocampista', isStarter: true },
        { number: 10, name: 'Santiago Arboleda', position: 'Centrocampista', isStarter: true, captain: true },
        { number: 6, name: 'Maximiliano Díaz', position: 'Centrocampista', isStarter: true },
        { number: 14, name: 'Manuel Villegas', position: 'Centrocampista', isStarter: true },
        { number: 9, name: 'Fabián Castillo', position: 'Delantero', isStarter: true },
        { number: 11, name: 'Álvaro Serna', position: 'Delantero', isStarter: true }
      ],
      awaySubstitutes: [
        { number: 12, name: 'Gabriel Posada (PO)', position: 'Portero' },
        { number: 16, name: 'Tomás Uribe', position: 'Defensa' },
        { number: 18, name: 'Martín Osorio', position: 'Centrocampista' },
        { number: 19, name: 'Isaac Restrepo', position: 'Delantero' }
      ]
    },
    events: [
      { id: 'ev-1', minute: "14'", type: 'goal', team: 'home', playerName: 'Mateo Cardona (#9)', assistantName: 'Camilo Mosquera', detail: 'Definición cruzada al ángulo derecho' },
      { id: 'ev-2', minute: "38'", type: 'yellow_card', team: 'away', playerName: 'Jerónimo Salgado (#5)', detail: 'Infracción reiterada' },
      { id: 'ev-3', minute: "52'", type: 'goal', team: 'away', playerName: 'Santiago Arboleda (#10)', detail: 'Espectacular tiro libre frontal con comba' },
      { id: 'ev-4', minute: "61'", type: 'goal', team: 'home', playerName: 'Mateo Cardona (#9)', assistantName: 'Andrés Felipe Gómez', detail: 'Remate rasante tras desborde por banda' },
      { id: 'ev-5', minute: "66'", type: 'substitution', team: 'away', playerName: 'Martín Osorio (#18)', playerOut: 'Álvaro Serna (#11)', detail: 'Modificación táctica en ataque' }
    ]
  },
  {
    id: 'mtc-2',
    tournamentName: 'Torneo Élite EMILIATEX 2026',
    phase: 'Semifinales',
    stage: 'Semifinales',
    category: 'Sub-13',
    date: '2026-09-19',
    time: '16:00',
    stadium: 'Cancha Panamericana Los Rosales',
    homeAcademyId: 'acad-3',
    homeAcademyName: 'Atlético Dorado',
    homeLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80',
    awayAcademyId: 'acad-4',
    awayAcademyName: 'Titanes Sport Academy',
    awayLogo: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=150&auto=format&fit=crop&q=80',
    status: 'upcoming',
    referee: 'Jhon Alexander Ospina',
    summary: 'Semifinal de ida en Categoría Sub-13 con dos de las escuadras más goleadoras.',
    lineups: {
      homeFormation: '3-2-3-1',
      awayFormation: '4-3-3',
      homeCoach: 'Wilson James Morales',
      awayCoach: 'Hernando Parra',
      homeStarters: [
        { number: 1, name: 'Samuel Agudelo', position: 'Portero', isStarter: true },
        { number: 3, name: 'Martín Barreneche', position: 'Defensa', isStarter: true },
        { number: 4, name: 'Dylan Quiñones', position: 'Defensa', isStarter: true },
        { number: 5, name: 'Julián Cañas', position: 'Defensa', isStarter: true },
        { number: 8, name: 'Jerónimo Marín', position: 'Centrocampista', isStarter: true },
        { number: 10, name: 'Juan Pablo Arango', position: 'Centrocampista', isStarter: true, captain: true },
        { number: 11, name: 'Daniel Riascos', position: 'Delantero', isStarter: true },
        { number: 7, name: 'Samuel Correa', position: 'Delantero', isStarter: true },
        { number: 9, name: 'Emiliano Suárez', position: 'Delantero', isStarter: true }
      ],
      awayStarters: [
        { number: 1, name: 'Alejandro Cárdenas', position: 'Portero', isStarter: true },
        { number: 2, name: 'Matías Lopera', position: 'Defensa', isStarter: true },
        { number: 4, name: 'Simón Echavarría', position: 'Defensa', isStarter: true },
        { number: 3, name: 'Santiago Flórez', position: 'Defensa', isStarter: true },
        { number: 5, name: 'Cristóbal Ríos', position: 'Defensa', isStarter: true },
        { number: 8, name: 'Lucas Villegas', position: 'Centrocampista', isStarter: true },
        { number: 10, name: 'Thiago Valderrama', position: 'Centrocampista', isStarter: true, captain: true },
        { number: 7, name: 'Brayan Estupiñán', position: 'Delantero', isStarter: true },
        { number: 9, name: 'Ian David Morales', position: 'Delantero', isStarter: true }
      ]
    }
  },
  {
    id: 'mtc-3',
    tournamentName: 'Torneo Élite EMILIATEX 2026',
    phase: 'Cuartos de Final',
    stage: 'Cuartos de Final',
    category: 'Sub-11',
    date: '2026-09-19',
    time: '18:15',
    stadium: 'Cancha Sintética Sede Deportiva',
    homeAcademyId: 'acad-5',
    homeAcademyName: 'Sporting Metropolitano',
    homeLogo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=150&auto=format&fit=crop&q=80',
    awayAcademyId: 'acad-6',
    awayAcademyName: 'Huracán FC Formativo',
    awayLogo: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=150&auto=format&fit=crop&q=80',
    status: 'upcoming',
    referee: 'Mauricio Mercado',
    summary: 'Duelo definitorio de eliminación directa en categoría formativa Sub-11.'
  },
  {
    id: 'mtc-4',
    tournamentName: 'Torneo Élite EMILIATEX 2026',
    phase: 'Fase de Grupos - Fecha 5',
    stage: 'Fase de Grupos',
    category: 'Sub-15',
    date: '2026-09-12',
    time: '15:00',
    stadium: 'Estadio Metropolitano Élite - Cancha 1',
    homeAcademyId: 'acad-1',
    homeAcademyName: 'Deportivo Emiliatex FC',
    homeLogo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&auto=format&fit=crop&q=80',
    homeScore: 3,
    awayAcademyId: 'acad-3',
    awayAcademyName: 'Atlético Dorado',
    awayLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80',
    awayScore: 0,
    status: 'finished',
    referee: 'Wilmar Roldán Pérez',
    mvp: 'Mateo Cardona (2 goles)',
    summary: 'Triunfo categórico de Deportivo Emiliatex FC estrenando uniforme conmemorativo edición especial.',
    events: [
      { id: 'ev-11', minute: "12'", type: 'goal', team: 'home', playerName: 'Mateo Cardona (#9)', assistantName: 'Camilo Mosquera', detail: 'Golazo de bolea' },
      { id: 'ev-12', minute: "34'", type: 'goal', team: 'home', playerName: 'Nicolás Murillo (#11)', detail: 'Cabezazo tras tiro de esquina' },
      { id: 'ev-13', minute: "58'", type: 'goal', team: 'home', playerName: 'Mateo Cardona (#9)', detail: 'Definición en mano a mano' }
    ]
  },
  {
    id: 'mtc-5',
    tournamentName: 'Torneo Élite EMILIATEX 2026',
    phase: 'Fase de Grupos - Fecha 5',
    stage: 'Fase de Grupos',
    category: 'Sub-15',
    date: '2026-09-12',
    time: '17:30',
    stadium: 'Cancha Panamericana Los Rosales',
    homeAcademyId: 'acad-2',
    homeAcademyName: 'Academia Real Élite',
    homeLogo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=150&auto=format&fit=crop&q=80',
    homeScore: 2,
    awayAcademyId: 'acad-5',
    awayAcademyName: 'Sporting Metropolitano',
    awayLogo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=150&auto=format&fit=crop&q=80',
    awayScore: 1,
    status: 'finished',
    referee: 'Nicolás Gallo',
    mvp: 'Santiago Arboleda (Gol de tiro libre y asistencia)'
  }
];

export const initialProducts: Product[] = [
  // Deportivos
  {
    id: 'prod-1',
    name: 'Uniforme Completo de Fútbol Élite Pro',
    category: 'deportivo',
    subcategory: 'Fútbol',
    sku: 'EMX-FUT-01',
    description: 'Conjunto completo (Camiseta, Pantaloneta y Medias) con tecnología Dry-Fit de secado ultra rápido, sublimación digital en alta definición total sin límite de colores y números/escudos termosellados.',
    images: [
      'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80'
    ],
    fabricMaterial: 'Microfibra Dry-Fit Pro 160g con microperforaciones laterales',
    features: [
      'Sublimación digital HD indeleble',
      'Protección UV solar UPF 30+',
      'Costuras planas reforzadas antifricción',
      'Incluye numeración y nombres de jugadores'
    ],
    sizesAvailable: ['6 a 16 Niños', 'XS', 'S', 'M', 'L', 'XL', '2XL'],
    minQuantity: 10,
    priceEstimate: '$48.000 COP / conjunto',
    isFeatured: true,
    inStock: true
  },
  {
    id: 'prod-2',
    name: 'Uniforme de Baloncesto Street & Tournament',
    category: 'deportivo',
    subcategory: 'Baloncesto',
    sku: 'EMX-BSK-02',
    description: 'Camisilla amplia con cuello en V reforzado y bermuda con elástico grueso ajustable. Malla calada de ventilación térmica y diseño ergonómico para saltos y amortiguación.',
    images: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=800&auto=format&fit=crop&q=80'
    ],
    fabricMaterial: 'Poliéster Eyelet respirable con malla Mesh transpirable',
    features: [
      'Corte ergonómico holgado tipo FIBA',
      'Costuras de remate con hilo de alta resistencia',
      'Personalización de dorsales en vinilo textil o sublimado'
    ],
    sizesAvailable: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    minQuantity: 8,
    priceEstimate: '$52.000 COP / conjunto',
    isFeatured: true,
    inStock: true
  },
  {
    id: 'prod-3',
    name: 'Jersey de Ciclismo Aero Performance',
    category: 'deportivo',
    subcategory: 'Ciclismo',
    sku: 'EMX-CYC-03',
    description: 'Chaqueta/Jersey aerodinámico con cremallera frontal completa, 3 bolsillos traseros con reflectivo de seguridad y banda de silicona antideslizante en la cintura.',
    images: [
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&auto=format&fit=crop&q=80'
    ],
    fabricMaterial: 'Licra Spandex bidireccional con paneles laterales transpirables',
    features: [
      'Cremallera invisible YKK de recorrido total',
      'Bolsillos elásticos traseros con refuerzo',
      'Bandas reflectivas para rodadas nocturnas'
    ],
    sizesAvailable: ['XS', 'S', 'M', 'L', 'XL'],
    minQuantity: 6,
    priceEstimate: '$68.000 COP / unidad',
    isFeatured: false,
    inStock: true
  },
  {
    id: 'prod-4',
    name: 'Chándal y Sudadera de Presentación Deportiva',
    category: 'deportivo',
    subcategory: 'Entrenamiento',
    sku: 'EMX-TRA-04',
    description: 'Conjunto de chaqueta con cremallera y pantalón jogger con bolsillos seguros. Ideal para delegaciones de torneos, viajes de equipo y cuerpo técnico.',
    images: [
      'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80'
    ],
    fabricMaterial: 'Acetato perchado antifluido térmico / Poliéster peinado',
    features: [
      'Bordado computarizado de escudo del club',
      'Cremalleras reforzadas en bolsillos y tobillos',
      'Resistente al viento y llovizna ligera'
    ],
    sizesAvailable: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    minQuantity: 10,
    priceEstimate: '$85.000 COP / conjunto',
    isFeatured: true,
    inStock: true
  },

  // Corporativos
  {
    id: 'prod-5',
    name: 'Camisa Tipo Polo Ejecutiva Dry-Comfort',
    category: 'corporativo',
    subcategory: 'Camisas Polo',
    sku: 'EMX-CORP-01',
    description: 'Camiseta polo de corte elegante para empresas, ejecutivos, asesores comerciales y dotaciones de servicio. Cuello tejido que no se deforma y botones al tono.',
    images: [
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
    ],
    fabricMaterial: 'Piqué 65% Poliéster / 35% Algodón peinado de 220g',
    features: [
      'Bordado computarizado de logotipo corporativo en pecho',
      'Tratamiento antipilling (evita motas)',
      'Cuello y puños tejidos de alta densidad',
      'Disponible en más de 20 colores institucionales'
    ],
    sizesAvailable: ['Dama XS-XL', 'Caballero S-3XL'],
    minQuantity: 12,
    priceEstimate: '$34.000 COP / unidad',
    isFeatured: true,
    inStock: true
  },
  {
    id: 'prod-6',
    name: 'Camisa Ejecutiva Formal Oxford / Popelina',
    category: 'corporativo',
    subcategory: 'Camisas Ejecutivas',
    sku: 'EMX-CORP-02',
    description: 'Camisa manga larga o corta para personal administrativo, gerencial y de ventas. Confección sastre impecable, fácil planchado y tacto suave.',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80'
    ],
    fabricMaterial: 'Oxford 60% Algodón / 40% Poliéster con acabado Easy-Iron',
    features: [
      'Corte Slim Fit y Classic Fit disponibles',
      'Bordado fino de alta definición en pecho o puño',
      'Costura francesa en laterales'
    ],
    sizesAvailable: ['Cuello 14 a 18 (Caballero)', 'Tallas 6 a 16 (Dama)'],
    minQuantity: 10,
    priceEstimate: '$49.000 COP / unidad',
    isFeatured: false,
    inStock: true
  },
  {
    id: 'prod-7',
    name: 'Chaqueta Rompevientos Corporativa Térmica',
    category: 'corporativo',
    subcategory: 'Chaquetas & Abrigos',
    sku: 'EMX-CORP-03',
    description: 'Chaqueta acolchada o impermeable con forro térmico interno, capota removible y bolsillos internos de seguridad. Protección para exteriores e identidad corporativa.',
    images: [
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80'
    ],
    fabricMaterial: 'Nylon Taslan repelente al agua con forro de fleece térmico',
    features: [
      '100% impermeable con costuras selladas',
      'Bordado de marca en pecho y espalda',
      'Ajuste en puños con velcro y elástico en cintura'
    ],
    sizesAvailable: ['S', 'M', 'L', 'XL', '2XL'],
    minQuantity: 10,
    priceEstimate: '$78.000 COP / unidad',
    isFeatured: true,
    inStock: true
  },
  {
    id: 'prod-8',
    name: 'Chaleco Acolchado Institucional con Bordado',
    category: 'corporativo',
    subcategory: 'Chalecos',
    sku: 'EMX-CORP-04',
    description: 'Chaleco liviano capitonado ideal para supervisores, logística y eventos empresariales. Comodidad térmica y aspecto premium en cualquier ambiente.',
    images: [
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80'
    ],
    fabricMaterial: 'Microfibra semi-mate acolchada con guata térmica siliconada',
    features: [
      'Cremallera frontal con solapa protectora',
      'Cuello alto térmico acolchado',
      'Bolsillos laterales invisibles'
    ],
    sizesAvailable: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    minQuantity: 10,
    priceEstimate: '$58.000 COP / unidad',
    isFeatured: false,
    inStock: true
  }
];

export const initialOrders: OrderQuotation[] = [
  {
    id: 'ord-101',
    orderNumber: 'EMX-2026-0042',
    date: '2026-09-14 10:25',
    customerName: 'Juan Pablo Restrepo',
    customerPhone: '+57 311 987 6543',
    companyOrTeam: 'Club Atlético Los Sauces',
    items: [
      {
        productId: 'prod-1',
        productName: 'Uniforme Completo de Fútbol Élite Pro',
        quantity: 22,
        sizes: '8 M, 10 L, 4 XL',
        customization: 'Sublimado completo en dorado y negro con escudo y dorsales 1 al 22'
      }
    ],
    totalEstimate: '$1.056.000 COP',
    status: 'in_production',
    notes: 'Requiere entrega prioritaria antes de la semifinal del Torneo.',
    whatsappMessageSent: true
  },
  {
    id: 'ord-102',
    orderNumber: 'EMX-2026-0043',
    date: '2026-09-14 14:10',
    customerName: 'Dra. Marcela Gómez',
    customerPhone: '+57 315 222 8899',
    companyOrTeam: 'Constructora Bolívar & Asociados',
    items: [
      {
        productId: 'prod-5',
        productName: 'Camisa Tipo Polo Ejecutiva Dry-Comfort',
        quantity: 35,
        sizes: '15 Dama M, 10 Cab M, 10 Cab L',
        customization: 'Bordado logo azul rey en pecho izquierdo y bandera Colombia en manga'
      },
      {
        productId: 'prod-7',
        productName: 'Chaqueta Rompevientos Corporativa Térmica',
        quantity: 15,
        sizes: '5 S, 6 M, 4 L',
        customization: 'Bordado frontal y estampado reflectivo en espalda'
      }
    ],
    totalEstimate: '$2.360.000 COP',
    status: 'pending',
    notes: 'Cliente solicitó muestra física previa para aprobación de color institucional.',
    whatsappMessageSent: true
  },
  {
    id: 'ord-103',
    orderNumber: 'EMX-2026-0044',
    date: '2026-09-15 09:30',
    customerName: 'Prof. Jhon Jairo Arrieta',
    customerPhone: '+57 320 444 1122',
    companyOrTeam: 'Academia Halcones de Oro',
    items: [
      {
        productId: 'prod-4',
        productName: 'Chándal y Sudadera de Presentación Deportiva',
        quantity: 18,
        sizes: '12 M, 6 L',
        customization: 'Bordado institucional Halcones dorado sobre tela negra'
      }
    ],
    totalEstimate: '$1.530.000 COP',
    status: 'shipped',
    notes: 'Guía de despacho Envía #98234710 enviada por WhatsApp al cliente.',
    whatsappMessageSent: true
  }
];
