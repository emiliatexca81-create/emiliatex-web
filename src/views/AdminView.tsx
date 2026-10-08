import React, { useState, useRef } from 'react';
import { 
  Product, 
  TournamentMatch, 
  Player, 
  Academy, 
  OrderQuotation, 
  OrderStatus, 
  AppSettings,
  TOURNAMENT_CATEGORIES,
  TournamentCategory,
  MATCH_STAGES,
  MatchStage
} from '../types';
import { 
  Shirt, 
  Trophy, 
  Users, 
  Shield, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Edit3, 
  Phone, 
  Settings, 
  CheckCircle, 
  Clock, 
  Truck, 
  CheckCheck, 
  X, 
  MessageCircle, 
  RefreshCw,
  Search,
  ExternalLink,
  Flame,
  Calendar,
  Layers,
  Lock,
  LogIn,
  LogOut,
  UploadCloud,
  Check,
  AlertTriangle,
  Database,
  ArrowLeft,
  Tag,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Building2,
  MapPin,
  User,
  Hash
} from 'lucide-react';
import { 
  saveProduct, 
  deleteProduct, 
  saveMatch, 
  deleteMatch, 
  savePlayer, 
  deletePlayer, 
  saveAcademy, 
  deleteAcademy, 
  updateOrderStatus, 
  deleteOrder, 
  saveSettings,
  resetSampleData,
  seedInitialFirestoreData,
  formatWhatsAppLink 
} from '../services/storage';
import { useAuth, PRIMARY_ADMIN_EMAIL } from '../services/authContext';
import { uploadFileToStorage } from '../services/firebase';
import { MatchLineupModal } from '../components/MatchLineupModal';

export const DEFAULT_ACADEMY_CATEGORIES: TournamentCategory[] = [
  'Sub-7',
  'Sub-9',
  'Sub-11',
  'Sub-13',
  'Sub-15'
];

interface AdminViewProps {
  products: Product[];
  matches: TournamentMatch[];
  players: Player[];
  academies: Academy[];
  orders: OrderQuotation[];
  settings: AppSettings;
  onRefresh: () => void;
  initialSection?: AdminSection;
}

type AdminSection = 'menu' | 'add_product' | 'add_match' | 'add_player' | 'add_academy' | 'view_orders';

export const AdminView: React.FC<AdminViewProps> = ({
  products,
  matches,
  players,
  academies,
  orders,
  settings,
  onRefresh,
  initialSection
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>(() => {
    if (initialSection) return initialSection;
    const params = new URLSearchParams(window.location.search);
    const sec = params.get('adminSection') as AdminSection;
    if (sec && ['add_product', 'add_match', 'add_player', 'add_academy', 'view_orders'].includes(sec)) {
      return sec;
    }
    return 'menu';
  });

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [waConfigPhone, setWaConfigPhone] = useState(settings.whatsappNumber);

  const { currentUser, isAdmin, loading: authLoading, loginWithGoogle, logout, authError } = useAuth();
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [syncingFirestore, setSyncingFirestore] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Lineups Modal State
  const [lineupModalMatch, setLineupModalMatch] = useState<TournamentMatch | null>(null);

  // In-App Confirmation Modal (solves confirm() blocked in iframe)
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    type: 'academy' | 'match' | 'player' | 'product' | 'order';
    id: string;
    name: string;
    extraInfo?: string;
  } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [isSavingAcademy, setIsSavingAcademy] = useState(false);

  // In-App Toast Notification (solves alert() blocked in iframe)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Section / Form Refs for smooth navigation when editing
  const academyFormRef = useRef<HTMLDivElement>(null);
  const matchFormRef = useRef<HTMLDivElement>(null);
  const playerFormRef = useRef<HTMLDivElement>(null);
  const productFormRef = useRef<HTMLDivElement>(null);

  const handleExecuteDelete = async () => {
    if (!confirmDeleteModal) return;
    const { type, id, name } = confirmDeleteModal;
    setIsDeletingItem(true);
    try {
      if (type === 'academy') {
        await deleteAcademy(id);
        showToast(`Academia "${name}" eliminada correctamente de Firestore y del torneo`, 'success');
      } else if (type === 'match') {
        await deleteMatch(id);
        showToast(`Partido eliminado correctamente`, 'success');
      } else if (type === 'player') {
        await deletePlayer(id);
        showToast(`Jugador "${name}" eliminado`, 'success');
      } else if (type === 'product') {
        await deleteProduct(id);
        showToast(`Prenda "${name}" eliminada del catálogo`, 'success');
      } else if (type === 'order') {
        deleteOrder(id);
        showToast(`Pedido "${name}" eliminado correctamente`, 'success');
      }
      onRefresh();
      setConfirmDeleteModal(null);
    } catch (err: any) {
      console.error('Error al eliminar en Firestore:', err);
      showToast('Error al eliminar en Firestore: ' + (err?.message || 'Error inesperado'), 'error');
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleSaveLineupsFromModal = (updatedMatch: TournamentMatch) => {
    saveMatch(updatedMatch);
    setLineupModalMatch(null);
    onRefresh();
    showToast('¡Alineaciones e incidencias del partido guardadas con éxito!', 'success');
  };

  const handleSelectSection = (sec: AdminSection) => {
    setActiveSection(sec);
    const params = new URLSearchParams(window.location.search);
    if (sec === 'menu') {
      params.delete('adminSection');
    } else {
      params.set('adminSection', sec);
    }
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.pushState(null, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openInNewWindow = (sec: AdminSection) => {
    const url = `${window.location.origin}${window.location.pathname}?page=admin&adminSection=${sec}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'product' | 'matchHome' | 'matchAway' | 'player' | 'academy') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingTarget(target);
      const downloadUrl = await uploadFileToStorage(file, target);
      if (target === 'product') {
        setProductForm(prev => ({ ...prev, images: [downloadUrl, ...(prev.images || []).slice(1)] }));
      } else if (target === 'matchHome') {
        setMatchForm(prev => ({ ...prev, homeLogo: downloadUrl }));
      } else if (target === 'matchAway') {
        setMatchForm(prev => ({ ...prev, awayLogo: downloadUrl }));
      } else if (target === 'player') {
        setPlayerForm(prev => ({ ...prev, photo: downloadUrl }));
      } else if (target === 'academy') {
        setAcademyForm(prev => ({ ...prev, logo: downloadUrl }));
      }
      showToast('¡Imagen procesada y asignada exitosamente!', 'success');
    } catch (err: any) {
      console.error('Error al procesar archivo:', err);
      showToast('Error al procesar archivo: ' + (err?.message || 'Intente con otra imagen'), 'error');
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleSyncFirestore = async () => {
    setSyncingFirestore(true);
    setSyncStatusMsg(null);
    try {
      await seedInitialFirestoreData();
      setSyncStatusMsg('¡Datos sincronizados exitosamente con Cloud Firestore!');
      setTimeout(() => setSyncStatusMsg(null), 5000);
      onRefresh();
    } catch (err: any) {
      setSyncStatusMsg('Error al sincronizar: ' + (err?.message || 'Verifica permisos'));
    } finally {
      setSyncingFirestore(false);
    }
  };

  // Form states
  // 1. Product Form
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    category: 'deportivo',
    subcategory: 'Fútbol',
    sku: `EMX-${Math.floor(100 + Math.random() * 900)}`,
    description: '',
    images: ['https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&auto=format&fit=crop&q=80'],
    fabricMaterial: 'Microfibra Dry-Fit Pro 160g',
    features: ['Sublimación digital HD', 'Secado ultra rápido'],
    sizesAvailable: ['S', 'M', 'L', 'XL'],
    minQuantity: 10,
    priceEstimate: '$45.000 COP / unidad',
    isFeatured: true,
    inStock: true
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // 2. Match Form
  const [matchForm, setMatchForm] = useState<Partial<TournamentMatch>>({
    tournamentName: 'Torneo Élite EMILIATEX 2026',
    stage: 'Fase de Grupos',
    phase: 'Fase de Grupos',
    category: 'Sub-15',
    date: new Date().toISOString().split('T')[0],
    time: '16:00',
    stadium: 'Estadio Metropolitano Élite - Cancha 1',
    homeAcademyId: academies[0]?.id || '',
    homeAcademyName: academies[0]?.name || '',
    homeLogo: academies[0]?.logo || '',
    homeScore: 0,
    awayAcademyId: academies[1]?.id || '',
    awayAcademyName: academies[1]?.name || '',
    awayLogo: academies[1]?.logo || '',
    awayScore: 0,
    status: 'upcoming',
    liveMinute: "10'",
    referee: '',
    mvp: '',
    summary: ''
  });
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  // 3. Player Form
  const [playerForm, setPlayerForm] = useState<Partial<Player>>({
    name: '',
    number: 10,
    position: 'Delantero',
    category: 'Sub-15',
    academyId: academies[0]?.id || '',
    academyName: academies[0]?.name || '',
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    matchesPlayed: 1,
    mvpCount: 0,
    age: 15
  });
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [playerCategoryFilter, setPlayerCategoryFilter] = useState<string>('all');

  // 4. Academy Form
  const [academyForm, setAcademyForm] = useState<Partial<Academy>>({
    name: '',
    acronym: 'CLUB',
    logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&auto=format&fit=crop&q=80',
    city: 'Medellín',
    coach: '',
    category: 'Sub-15',
    categories: ['Sub-13', 'Sub-15'],
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0
  });
  const [editingAcademyId, setEditingAcademyId] = useState<string | null>(null);
  const [academySearch, setAcademySearch] = useState<string>('');

  // Category management functions for Academies
  const toggleCategory = (cat: string) => {
    const current = academyForm.categories || [];
    if (current.includes(cat)) {
      setAcademyForm(prev => ({
        ...prev,
        categories: current.filter(c => c !== cat)
      }));
    } else {
      setAcademyForm(prev => ({
        ...prev,
        categories: [...current, cat]
      }));
    }
  };

  const handleSelectAllCategories = () => {
    setAcademyForm(prev => ({
      ...prev,
      categories: [...DEFAULT_ACADEMY_CATEGORIES]
    }));
  };

  const handleClearCategories = () => {
    setAcademyForm(prev => ({
      ...prev,
      categories: []
    }));
  };

  const handleEditAcademy = (acad: Academy) => {
    setEditingAcademyId(acad.id);
    setAcademyForm({
      name: acad.name,
      acronym: acad.acronym,
      logo: acad.logo,
      city: acad.city,
      coach: acad.coach,
      category: acad.category,
      categories: acad.categories && acad.categories.length > 0 ? acad.categories : [acad.category],
      played: acad.played || 0,
      won: acad.won || 0,
      drawn: acad.drawn || 0,
      lost: acad.lost || 0,
      goalsFor: acad.goalsFor || 0,
      goalsAgainst: acad.goalsAgainst || 0,
      points: acad.points || 0,
      foundationYear: acad.foundationYear || '',
      primaryColor: acad.primaryColor || '#D4AF37'
    });
    setTimeout(() => {
      academyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    showToast(`Cargados datos de "${acad.name}" para edición`, 'info');
  };

  const handleCancelEditAcademy = () => {
    setEditingAcademyId(null);
    setAcademyForm({
      name: '',
      acronym: 'CLUB',
      logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&auto=format&fit=crop&q=80',
      city: 'Medellín',
      coach: '',
      category: 'Sub-15',
      categories: ['Sub-15'],
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0
    });
  };

  const handleEditPlayer = (p: Player) => {
    setEditingPlayerId(p.id);
    setPlayerForm({
      ...p,
      category: p.category || 'Sub-15'
    });
    setTimeout(() => {
      playerFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    showToast(`Cargados datos de "${p.name}" para edición`, 'info');
  };

  const handleCancelEditPlayer = () => {
    setEditingPlayerId(null);
    setPlayerForm({
      name: '',
      number: 10,
      position: 'Delantero',
      category: 'Sub-15',
      academyId: academies[0]?.id || '',
      academyName: academies[0]?.name || '',
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
      matchesPlayed: 1,
      mvpCount: 0,
      age: 15
    });
  };

  // Filter for orders
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Handlers
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name) return;

    const prod: Product = {
      id: editingProductId || `prod-${Date.now()}`,
      name: productForm.name || 'Nueva Prenda',
      category: productForm.category || 'deportivo',
      subcategory: productForm.subcategory || 'General',
      sku: productForm.sku || `EMX-${Date.now().toString().slice(-4)}`,
      description: productForm.description || '',
      images: productForm.images && productForm.images.length ? productForm.images : ['https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&auto=format&fit=crop&q=80'],
      fabricMaterial: productForm.fabricMaterial || 'Tela deportiva',
      features: productForm.features || ['Sublimación digital'],
      sizesAvailable: productForm.sizesAvailable || ['S', 'M', 'L'],
      minQuantity: Number(productForm.minQuantity) || 10,
      priceEstimate: productForm.priceEstimate || '$40.000 COP',
      isFeatured: Boolean(productForm.isFeatured),
      inStock: true
    };

    await saveProduct(prod);
    setEditingProductId(null);
    onRefresh();
    showToast('¡Prenda guardada con éxito en el catálogo!', 'success');
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const home = academies.find(a => a.id === matchForm.homeAcademyId) || academies[0];
    const away = academies.find(a => a.id === matchForm.awayAcademyId) || academies[1];

    const chosenStage = matchForm.stage || 'Fase de Grupos';
    const chosenCategory = matchForm.category || 'Sub-15';

    const match: TournamentMatch = {
      id: editingMatchId || `mtc-${Date.now()}`,
      tournamentName: matchForm.tournamentName || 'Torneo Élite EMILIATEX 2026',
      stage: chosenStage,
      phase: matchForm.phase || chosenStage,
      category: chosenCategory,
      date: matchForm.date || '2026-09-20',
      time: matchForm.time || '16:00',
      stadium: matchForm.stadium || 'Cancha Principal',
      homeAcademyId: home?.id || 'acad-1',
      homeAcademyName: home?.name || 'Equipo Local',
      homeLogo: home?.logo || '',
      homeScore: Number(matchForm.homeScore ?? 0),
      awayAcademyId: away?.id || 'acad-2',
      awayAcademyName: away?.name || 'Equipo Visitante',
      awayLogo: away?.logo || '',
      awayScore: Number(matchForm.awayScore ?? 0),
      status: matchForm.status || 'upcoming',
      liveMinute: matchForm.liveMinute || "1'",
      mvp: matchForm.mvp || '',
      summary: matchForm.summary || '',
      lineups: matchForm.lineups,
      events: matchForm.events,
      referee: matchForm.referee?.trim() || ''
    };

    await saveMatch(match);
    setEditingMatchId(null);
    onRefresh();
    showToast('¡Partido guardado con éxito!', 'success');
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerForm.name) return;

    const academy = academies.find(a => a.id === playerForm.academyId) || academies[0];

    const ply: Player = {
      id: editingPlayerId || `ply-${Date.now()}`,
      name: playerForm.name,
      number: Number(playerForm.number) || 10,
      position: playerForm.position || 'Delantero',
      category: playerForm.category || 'Sub-15',
      academyId: academy?.id || 'acad-1',
      academyName: academy?.name || 'Academia',
      goals: Number(playerForm.goals) || 0,
      assists: Number(playerForm.assists) || 0,
      yellowCards: Number(playerForm.yellowCards) || 0,
      redCards: Number(playerForm.redCards) || 0,
      photo: playerForm.photo || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
      matchesPlayed: Number(playerForm.matchesPlayed) || 1,
      mvpCount: Number(playerForm.mvpCount) || 0,
      age: Number(playerForm.age) || 15
    };

    await savePlayer(ply);
    setEditingPlayerId(null);
    setPlayerForm({
      name: '',
      number: 10,
      position: 'Delantero',
      category: 'Sub-15',
      academyId: academies[0]?.id || '',
      academyName: academies[0]?.name || '',
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
      matchesPlayed: 1,
      mvpCount: 0,
      age: 15
    });
    onRefresh();
    showToast(editingPlayerId ? '¡Jugador actualizado con éxito!' : '¡Jugador registrado con éxito en el torneo!', 'success');
  };

  const handleSaveAcademy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyForm.name?.trim()) {
      showToast('Por favor ingresa el nombre del Club o Academia', 'error');
      return;
    }

    setIsSavingAcademy(true);
    const chosenCategories = (academyForm.categories && academyForm.categories.length > 0)
      ? academyForm.categories
      : [academyForm.category || 'Sub-15'];

    const acad: Academy = {
      id: editingAcademyId || `acad-${Date.now()}`,
      name: academyForm.name.trim(),
      acronym: (academyForm.acronym || 'FC').trim().toUpperCase(),
      logo: academyForm.logo?.trim() || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&auto=format&fit=crop&q=80',
      city: (academyForm.city || 'Medellín').trim(),
      coach: (academyForm.coach || 'Director Técnico').trim(),
      category: chosenCategories[0] || 'Sub-15',
      categories: chosenCategories,
      played: Number(academyForm.played) || 0,
      won: Number(academyForm.won) || 0,
      drawn: Number(academyForm.drawn) || 0,
      lost: Number(academyForm.lost) || 0,
      goalsFor: Number(academyForm.goalsFor) || 0,
      goalsAgainst: Number(academyForm.goalsAgainst) || 0,
      points: Number(academyForm.points) || 0
    };

    if (academyForm.foundationYear?.trim()) {
      acad.foundationYear = academyForm.foundationYear.trim();
    }
    if (academyForm.primaryColor?.trim()) {
      acad.primaryColor = academyForm.primaryColor.trim();
    }

    try {
      await saveAcademy(acad);
      showToast(
        editingAcademyId 
          ? `¡Academia "${acad.name}" actualizada con éxito en Firestore!` 
          : `¡Academia "${acad.name}" registrada con éxito en Firestore!`, 
        'success'
      );
      setEditingAcademyId(null);
      setAcademyForm({
        name: '',
        acronym: 'CLUB',
        logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&auto=format&fit=crop&q=80',
        city: 'Medellín',
        coach: '',
        category: 'Sub-15',
        categories: ['Sub-13', 'Sub-15'],
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      });
      onRefresh();
    } catch (err: any) {
      console.error('Error al guardar academia en Firestore:', err);
      showToast('Error al guardar en Firestore: ' + (err?.message || 'Verifica tu conexión'), 'error');
    } finally {
      setIsSavingAcademy(false);
    }
  };

  const handleSaveConfig = async () => {
    await saveSettings({
      ...settings,
      whatsappNumber: waConfigPhone.trim()
    });
    setShowConfigModal(false);
    onRefresh();
    showToast('Configuración de WhatsApp actualizada', 'success');
  };

  const filteredOrders = orders.filter(o => {
    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchSearch = orderSearch === '' ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerPhone.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.companyOrTeam.toLowerCase().includes(orderSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] text-center p-8 bg-[#0e1017] rounded-3xl border border-[#D4AF37]/20 my-8">
        <div className="w-12 h-12 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mb-4" />
        <h3 className="text-lg font-bold text-white font-cinzel">Verificando Credenciales de Administrador</h3>
        <p className="text-slate-400 text-xs mt-1">Conectando con Firebase Authentication y base de datos...</p>
      </div>
    );
  }

  // If user is not logged in: Show Admin Login Gateway
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 sm:p-10 rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#141624] via-[#0d0e15] to-[#0a0a0f] shadow-[0_0_50px_rgba(0,0,0,0.85)] text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-[#D4AF37]/15 border border-[#D4AF37]/50 flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(212,175,55,0.3)]">
          <Lock className="w-10 h-10 text-[#D4AF37]" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-amber-300 text-xs font-bold uppercase tracking-widest mb-4">
          <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>ÁREA ADMINISTRATIVA RESTRINGIDA</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white font-cinzel tracking-tight mb-3">
          Acceso de Gestión EMILIATEX
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          La web, el catálogo y el Torneo Élite cuentan con sus propias páginas públicas. Para acceder a la creación de productos, marcadores de partidos, jugadores, academias y control de pedidos de WhatsApp, debes iniciar sesión con la cuenta de administrador.
        </p>

        <div className="p-4 rounded-xl bg-[#090a0f] border border-white/10 mb-6 text-left">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
            Administrador Autorizado:
          </span>
          <span className="text-sm font-mono text-amber-300 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {PRIMARY_ADMIN_EMAIL}
          </span>
        </div>

        {authError && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs mb-6 text-left">
            <p className="font-bold flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Aviso de autenticación</span>
            </p>
            <p>{authError}</p>
          </div>
        )}

        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#f3d068] to-[#D4AF37] hover:brightness-110 text-black font-extrabold text-sm tracking-wide shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all cursor-pointer transform hover:scale-[1.02]"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Iniciar Sesión con Google</span>
        </button>

        <p className="text-[11px] text-slate-500 mt-4">
          Conexión segura protegida con Firebase Auth & Cloud Firestore
        </p>
      </div>
    );
  }

  // If user is logged in with a non-admin account
  if (currentUser && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 sm:p-10 rounded-3xl border border-red-500/40 bg-gradient-to-b from-[#1a1215] to-[#0f0d11] shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center animate-in fade-in duration-200">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-5 text-red-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-white font-cinzel mb-2">Acceso No Autorizado</h2>
        <p className="text-sm text-slate-300 mb-6">
          Has iniciado sesión como <strong className="text-amber-300 font-mono">{currentUser.email}</strong>, pero esta cuenta no tiene privilegios de administrador para gestionar el catálogo y torneo de EMILIATEX.
        </p>

        <div className="p-4 rounded-xl bg-black/40 border border-white/10 mb-6 text-xs text-slate-400 text-left">
          <p>Para ingresar al panel de control administrativo, debes usar la cuenta de administrador oficial: <strong className="text-white font-mono">{PRIMARY_ADMIN_EMAIL}</strong>.</p>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión e Intentar con Otra Cuenta</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Bar */}
      {/* TOP APP BAR & HEADER (APK Native Style) */}
      <div className="rounded-3xl neu-card-gold p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-2xl relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neu-pressed-gold text-amber-300 text-[11px] font-extrabold uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>PANEL DE CONTROL • APK ADMIN</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white font-cinzel tracking-tight">
            Gestión EMILIATEX & Torneo
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Consola central optimizada para smartphone. Administra catálogo, partidos, nóminas, clubes y cotizaciones de WhatsApp al instante.
          </p>

          {/* Sync status alert if triggered */}
          {syncStatusMsg && (
            <div className="mt-2 text-xs text-emerald-400 neu-pressed px-3.5 py-2 rounded-xl inline-flex items-center gap-2 border border-emerald-500/30">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold">{syncStatusMsg}</span>
            </div>
          )}
        </div>

        {/* Action buttons & Admin user info */}
        <div className="flex flex-wrap items-center gap-2.5 z-10 w-full sm:w-auto justify-start sm:justify-end">
          {currentUser && (
            <div className="hidden lg:flex flex-col text-right mr-2 neu-pressed px-3 py-1.5 rounded-2xl">
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Admin Conectado
              </span>
              <span className="text-[10px] font-mono text-slate-300 truncate max-w-[180px]">{currentUser.email}</span>
            </div>
          )}

          <button
            onClick={handleSyncFirestore}
            disabled={syncingFirestore}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl neu-btn-dark text-amber-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
            title="Sincronizar base de datos inicial a Cloud Firestore"
          >
            <Database className={`w-4 h-4 text-[#D4AF37] ${syncingFirestore ? 'animate-spin' : ''}`} />
            <span>{syncingFirestore ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>

          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl neu-btn-dark text-amber-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
            title="Ajustes de WhatsApp"
          >
            <Settings className="w-4 h-4 text-[#D4AF37]" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl neu-pressed text-red-400 hover:text-red-300 text-xs font-bold transition-all cursor-pointer active:scale-95 border border-red-500/30"
            title="Cerrar sesión de administrador"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* ICON BUTTONS CONTROL PANEL (APK Mobile-First App Launcher) */}
      {activeSection === 'menu' && (
        <div className="space-y-6">
          <div className="rounded-3xl neu-card p-6 sm:p-8 space-y-6 shadow-2xl border border-[#D4AF37]/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-white flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#D4AF37] shadow-[0_0_12px_#D4AF37]" />
                  <span>Lanzador de Módulos APK</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Toca cualquier tarjeta para abrir directamente el módulo de gestión en pantalla completa.
                </p>
              </div>
              <span className="text-xs text-amber-300 font-mono neu-pressed px-3.5 py-1.5 rounded-full self-start sm:self-auto border border-[#D4AF37]/30 font-bold">
                5 Módulos Nativos
              </span>
            </div>

            {/* 5 Big Native APK Action Buttons with High-Impact Embossed Icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
              
              {/* Card 1: Catálogo */}
              <div 
                onClick={() => handleSelectSection('add_product')}
                className="group relative flex flex-col justify-between p-6 rounded-3xl neu-card hover:border-[#D4AF37] transition-all cursor-pointer active:scale-[0.97] shadow-xl hover:shadow-[0_10px_30px_rgba(212,175,55,0.25)]"
              >
                <div>
                  {/* Big Embossed APK Icon Bubble */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mx-auto flex items-center justify-center mb-4 neu-pressed-gold text-[#D4AF37] group-hover:scale-105 group-hover:bg-[#D4AF37] group-hover:text-black transition-all shadow-inner border border-[#D4AF37]/40">
                    <Shirt className="w-9 h-9 sm:w-11 sm:h-11" />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="font-black text-lg text-white tracking-wide font-cinzel group-hover:text-amber-300 transition-colors">
                      Catálogo
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      Subir prendas, telas, referencias y precios mayoristas.
                    </p>
                    <span className="inline-block mt-3 px-3 py-1 rounded-full neu-pressed text-[11px] font-mono text-amber-300 font-bold">
                      {products.length} productos
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Agregar Partido */}
              <div 
                onClick={() => handleSelectSection('add_match')}
                className="group relative flex flex-col justify-between p-6 rounded-3xl neu-card hover:border-[#D4AF37] transition-all cursor-pointer active:scale-[0.97] shadow-xl hover:shadow-[0_10px_30px_rgba(212,175,55,0.25)]"
              >
                <div>
                  {/* Big Embossed APK Icon Bubble */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mx-auto flex items-center justify-center mb-4 neu-pressed-gold text-[#D4AF37] group-hover:scale-105 group-hover:bg-[#D4AF37] group-hover:text-black transition-all shadow-inner border border-[#D4AF37]/40">
                    <Trophy className="w-9 h-9 sm:w-11 sm:h-11" />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="font-black text-lg text-white tracking-wide font-cinzel group-hover:text-amber-300 transition-colors">
                      Agregar Partido
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      Crear fixture, marcadores en vivo, cronología y cronistas.
                    </p>
                    <span className="inline-block mt-3 px-3 py-1 rounded-full neu-pressed text-[11px] font-mono text-amber-300 font-bold">
                      {matches.length} partidos
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Agregar Jugadores */}
              <div 
                onClick={() => handleSelectSection('add_player')}
                className="group relative flex flex-col justify-between p-6 rounded-3xl neu-card hover:border-[#D4AF37] transition-all cursor-pointer active:scale-[0.97] shadow-xl hover:shadow-[0_10px_30px_rgba(212,175,55,0.25)]"
              >
                <div>
                  {/* Big Embossed APK Icon Bubble */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mx-auto flex items-center justify-center mb-4 neu-pressed-gold text-[#D4AF37] group-hover:scale-105 group-hover:bg-[#D4AF37] group-hover:text-black transition-all shadow-inner border border-[#D4AF37]/40">
                    <Users className="w-9 h-9 sm:w-11 sm:h-11" />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="font-black text-lg text-white tracking-wide font-cinzel group-hover:text-amber-300 transition-colors">
                      Agregar Jugadores
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      Fichaje, dorsales, fotos, goles, asistencias y MVP.
                    </p>
                    <span className="inline-block mt-3 px-3 py-1 rounded-full neu-pressed text-[11px] font-mono text-amber-300 font-bold">
                      {players.length} jugadores
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Agregar Academias */}
              <div 
                onClick={() => handleSelectSection('add_academy')}
                className="group relative flex flex-col justify-between p-6 rounded-3xl neu-card hover:border-[#D4AF37] transition-all cursor-pointer active:scale-[0.97] shadow-xl hover:shadow-[0_10px_30px_rgba(212,175,55,0.25)]"
              >
                <div>
                  {/* Big Embossed APK Icon Bubble */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mx-auto flex items-center justify-center mb-4 neu-pressed-gold text-[#D4AF37] group-hover:scale-105 group-hover:bg-[#D4AF37] group-hover:text-black transition-all shadow-inner border border-[#D4AF37]/40">
                    <Shield className="w-9 h-9 sm:w-11 sm:h-11" />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="font-black text-lg text-white tracking-wide font-cinzel group-hover:text-amber-300 transition-colors">
                      Agregar Academias
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      Inscribir clubes, categorías múltiples, escudos y DT.
                    </p>
                    <span className="inline-block mt-3 px-3 py-1 rounded-full neu-pressed text-[11px] font-mono text-amber-300 font-bold">
                      {academies.length} clubes
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 5: Ver Pedidos Recibidos */}
              <div 
                onClick={() => handleSelectSection('view_orders')}
                className="group relative flex flex-col justify-between p-6 rounded-3xl neu-card-gold border-emerald-500/40 hover:border-emerald-400 transition-all cursor-pointer active:scale-[0.97] shadow-xl hover:shadow-[0_10px_30px_rgba(37,211,102,0.25)]"
              >
                <div>
                  {/* Big Embossed APK Icon Bubble */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mx-auto flex items-center justify-center mb-4 neu-pressed text-emerald-400 group-hover:scale-105 group-hover:bg-[#25D366] group-hover:text-black transition-all shadow-inner border border-emerald-500/40">
                    <ShoppingBag className="w-9 h-9 sm:w-11 sm:h-11" />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="font-black text-lg text-white tracking-wide font-cinzel group-hover:text-emerald-300 transition-colors">
                      Pedidos Recibidos
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      Cotizaciones de WhatsApp con estados y seguimiento.
                    </p>
                    <span className="inline-block mt-3 px-3 py-1 rounded-full neu-pressed text-[11px] font-mono text-emerald-300 font-bold border border-emerald-500/30">
                      {orders.length} pedidos
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* DEDICATED SUBPAGE CONTAINER (Shown when a module is active) */}
      {activeSection !== 'menu' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Subpage Header with Navigation Back to Panel and Open in New Window */}
          <div className="rounded-3xl neu-card-gold p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSelectSection('menu')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl neu-btn-gold text-black text-xs font-black transition-all cursor-pointer shadow-md active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Panel</span>
              </button>
              <div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Panel APK</span>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                  <span className="text-amber-400 font-semibold">
                    {activeSection === 'add_product' && 'Catálogo'}
                    {activeSection === 'add_match' && 'Gestión de Partidos'}
                    {activeSection === 'add_player' && 'Fichaje de Jugadores'}
                    {activeSection === 'add_academy' && 'Gestión de Academias'}
                    {activeSection === 'view_orders' && 'Bandeja de Pedidos'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white font-cinzel">
                  {activeSection === 'add_product' && 'Catálogo'}
                  {activeSection === 'add_match' && 'Gestión de Partidos'}
                  {activeSection === 'add_player' && 'Inscripción de Jugadores'}
                  {activeSection === 'add_academy' && 'Inscripción de Academias y Categorías'}
                  {activeSection === 'view_orders' && 'Bandeja de Pedidos WhatsApp'}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => openInNewWindow(activeSection)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl neu-btn-dark text-amber-300 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow"
                title="Abrir esta página en una ventana o pestaña independiente del navegador"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Nueva Ventana</span>
              </button>

              {/* Module Switcher Tabs - Mobile scrollable in neu-pressed */}
              <div className="flex items-center gap-1 p-1.5 rounded-2xl neu-pressed overflow-x-auto no-scrollbar scroll-smooth w-full sm:w-auto">
                <button
                  onClick={() => handleSelectSection('add_product')}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    activeSection === 'add_product' ? 'neu-btn-gold text-black shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Catálogo
                </button>
                <button
                  onClick={() => handleSelectSection('add_match')}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    activeSection === 'add_match' ? 'neu-btn-gold text-black shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Partidos
                </button>
                <button
                  onClick={() => handleSelectSection('add_player')}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    activeSection === 'add_player' ? 'neu-btn-gold text-black shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Jugadores
                </button>
                <button
                  onClick={() => handleSelectSection('add_academy')}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    activeSection === 'add_academy' ? 'neu-btn-gold text-black shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Academias
                </button>
                <button
                  onClick={() => handleSelectSection('view_orders')}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    activeSection === 'view_orders' ? 'bg-gradient-to-r from-[#25D366] to-[#1eb956] text-black shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pedidos ({orders.length})
                </button>
              </div>
            </div>
          </div>

      {/* SECTION 1: AGREGAR / GESTIONAR PRODUCTO */}
      {activeSection === 'add_product' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div ref={productFormRef} className="rounded-3xl neu-card-gold p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg sm:text-xl font-bold text-white font-cinzel flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl neu-pressed-gold text-[#D4AF37] flex items-center justify-center shrink-0">
                  <Shirt className="w-5 h-5" />
                </div>
                <span>{editingProductId ? 'Editar Prenda del Catálogo' : 'Subir Nueva Prenda al Catálogo'}</span>
              </h3>
              {editingProductId && (
                <span className="px-3 py-1 rounded-full bg-[#D4AF37] text-black text-xs font-black uppercase tracking-wider animate-pulse">
                  Modo Edición
                </span>
              )}
            </div>

            <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Nombre de la Prenda:</label>
                <input
                  type="text"
                  required
                  value={productForm.name || ''}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ej: Uniforme de Fútbol Élite Golden"
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Código / Referencia (SKU):</label>
                <input
                  type="text"
                  required
                  value={productForm.sku || ''}
                  onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                  placeholder="Ej: EMX-FUT-05"
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-mono font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Línea:</label>
                <select
                  value={productForm.category || 'deportivo'}
                  onChange={e => setProductForm({ ...productForm, category: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                >
                  <option value="deportivo" className="bg-[#12141f]">Línea Deportiva</option>
                  <option value="corporativo" className="bg-[#12141f]">Línea Corporativa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Subcategoría:</label>
                <input
                  type="text"
                  value={productForm.subcategory || ''}
                  onChange={e => setProductForm({ ...productForm, subcategory: e.target.value })}
                  placeholder="Ej: Fútbol, Baloncesto, Polo, Chaleco, etc."
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Tela / Material:</label>
                <input
                  type="text"
                  value={productForm.fabricMaterial || ''}
                  onChange={e => setProductForm({ ...productForm, fabricMaterial: e.target.value })}
                  placeholder="Ej: Microfibra Dry-Fit Pro 160g"
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Pedido Mínimo & Precio Est.:</label>
                <div className="flex gap-2.5">
                  <input
                    type="number"
                    min="1"
                    value={productForm.minQuantity || 10}
                    onChange={e => setProductForm({ ...productForm, minQuantity: Number(e.target.value) })}
                    placeholder="Min"
                    className="w-24 px-3.5 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-mono font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all text-center"
                  />
                  <input
                    type="text"
                    value={productForm.priceEstimate || ''}
                    onChange={e => setProductForm({ ...productForm, priceEstimate: e.target.value })}
                    placeholder="Ej: $48.000 COP / unidad"
                    className="flex-1 px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Imagen de la Prenda:</label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="url"
                    required
                    value={productForm.images?.[0] || ''}
                    onChange={e => setProductForm({ ...productForm, images: [e.target.value] })}
                    placeholder="https://images.unsplash.com/... o sube a Storage"
                    className="flex-1 px-4 py-3 rounded-2xl neu-pressed text-white text-xs font-mono border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                  />
                  <label className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl neu-btn-gold text-black text-xs font-extrabold uppercase tracking-wider cursor-pointer shrink-0 shadow-md active:scale-95">
                    <UploadCloud className="w-4 h-4" />
                    <span>{uploadingTarget === 'product' ? 'Subiendo...' : 'Subir a Storage'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingTarget === 'product'}
                      className="hidden"
                      onChange={e => handleFileUpload(e, 'product')}
                    />
                  </label>
                </div>
                {productForm.images?.[0] && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl neu-pressed border border-white/5">
                    <img src={productForm.images[0]} alt="Vista previa" className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow" />
                    <span className="text-xs text-slate-400 truncate flex-1 font-mono">{productForm.images[0]}</span>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Descripción de la prenda:</label>
                <textarea
                  rows={2}
                  value={productForm.description || ''}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Detalles sobre costuras, acabados, transpirabilidad..."
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                />
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3">
                {editingProductId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProductId(null);
                      setProductForm({
                        name: '',
                        category: 'deportivo',
                        subcategory: 'Fútbol',
                        sku: `EMX-${Math.floor(100 + Math.random() * 900)}`,
                        description: '',
                        images: ['https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&auto=format&fit=crop&q=80'],
                        fabricMaterial: 'Microfibra Dry-Fit Pro 160g',
                        minQuantity: 10,
                        priceEstimate: '$45.000 COP / unidad',
                      });
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl neu-btn-dark text-xs text-slate-300 font-bold uppercase tracking-wider active:scale-95 text-center cursor-pointer"
                  >
                    Cancelar Edición
                  </button>
                )}
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-2xl neu-btn-gold text-black font-black text-xs uppercase tracking-wider shadow-xl active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Shirt className="w-4 h-4" />
                  <span>{editingProductId ? 'Actualizar Prenda' : 'Guardar y Publicar en Catálogo'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of current products */}
          <div className="rounded-3xl neu-card p-6 sm:p-8 space-y-4 shadow-xl border border-white/10">
            <h4 className="text-sm font-black text-white uppercase tracking-wider font-cinzel flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
              <span>Prendas Actualmente en el Catálogo ({products.length})</span>
            </h4>
            <div className="space-y-3">
              {products.map(p => (
                <div key={p.id} className="p-3.5 sm:p-4 rounded-2xl neu-pressed flex items-center justify-between gap-4 border border-white/5 hover:border-[#D4AF37]/30 transition-all">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img src={p.images[0]} alt={p.name} className="w-14 h-14 rounded-xl object-cover bg-black shrink-0 border border-white/10 shadow-md" />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white truncate font-cinzel">{p.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{p.sku} • {p.subcategory} • <span className="text-amber-300 font-semibold">{p.priceEstimate}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingProductId(p.id);
                        setProductForm(p);
                        setTimeout(() => productFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
                        showToast(`Editando prenda "${p.name}"`, 'info');
                      }}
                      className="p-2.5 rounded-xl neu-btn-dark text-amber-300 hover:text-white cursor-pointer active:scale-95 shadow"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setConfirmDeleteModal({
                          type: 'product',
                          id: p.id,
                          name: p.name,
                          extraInfo: `${p.subcategory} • ${p.priceEstimate}`
                        });
                      }}
                      className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-400 cursor-pointer active:scale-95 transition-colors border border-red-500/20"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: AGREGAR / CREAR PARTIDO */}
      {activeSection === 'add_match' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div ref={matchFormRef} className="rounded-3xl neu-card-gold p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <h3 className="text-lg sm:text-xl font-bold text-white font-cinzel flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl neu-pressed-gold text-[#D4AF37] flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <span>{editingMatchId ? 'Actualizar Marcador y Datos del Partido' : 'Programar Nuevo Partido del Torneo'}</span>
              </h3>

              {editingMatchId && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const curMatch = matches.find(m => m.id === editingMatchId);
                      if (curMatch) setLineupModalMatch(curMatch);
                    }}
                    className="px-4 py-2 rounded-2xl neu-btn-gold text-black text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    <Shirt className="w-4 h-4" />
                    <span>Alineaciones e Incidencias</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMatchId(null);
                      setMatchForm({
                        stage: 'Fase de Grupos',
                        phase: 'Fase de Grupos',
                        category: 'Sub-15',
                        tournamentName: 'Torneo Élite EMILIATEX 2026',
                        date: '2026-09-20',
                        time: '16:00',
                        stadium: 'Cancha Principal',
                        homeScore: 0,
                        awayScore: 0,
                        status: 'upcoming',
                        liveMinute: "1'",
                        mvp: '',
                        summary: ''
                      });
                    }}
                    className="px-4 py-2 rounded-2xl neu-btn-dark text-slate-300 text-xs font-bold active:scale-95 cursor-pointer"
                  >
                    Cancelar Edición
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveMatch} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* Instancia / Etapa del Partido (partido de grupo, 8vos, 4tos, semis y final) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Instancia / Tipo de Partido: <span className="text-amber-400">*</span>
                </label>
                <select
                  value={matchForm.stage || 'Fase de Grupos'}
                  onChange={e => {
                    const chosen = e.target.value as MatchStage;
                    setMatchForm(prev => ({
                      ...prev,
                      stage: chosen,
                      phase: (!prev.phase || MATCH_STAGES.includes(prev.phase as any)) ? chosen : prev.phase
                    }));
                  }}
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-amber-300 font-bold text-xs sm:text-sm border border-[#D4AF37]/50 focus:border-[#D4AF37] focus:outline-none transition-all"
                >
                  <option value="Fase de Grupos" className="bg-[#12141f]">Fase de Grupos (Partido de Grupo)</option>
                  <option value="Octavos de Final" className="bg-[#12141f]">Octavos de Final (8vos)</option>
                  <option value="Cuartos de Final" className="bg-[#12141f]">Cuartos de Final (4tos)</option>
                  <option value="Semifinales" className="bg-[#12141f]">Semifinales (Semis)</option>
                  <option value="Gran Final" className="bg-[#12141f]">Gran Final (Final)</option>
                </select>
              </div>

              {/* Categoría del Torneo (Sub-7, Sub-9, Sub-11, Sub-13, Sub-15) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Categoría del Partido: <span className="text-amber-400">*</span>
                </label>
                <select
                  value={matchForm.category || 'Sub-15'}
                  onChange={e => setMatchForm({ ...matchForm, category: e.target.value as TournamentCategory })}
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-amber-300 font-bold text-xs sm:text-sm border border-[#D4AF37]/50 focus:border-[#D4AF37] focus:outline-none transition-all"
                >
                  {TOURNAMENT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-[#12141f]">{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Detalle de Fase / Jornada:</label>
                <input
                  type="text"
                  required
                  value={matchForm.phase || ''}
                  onChange={e => setMatchForm({ ...matchForm, phase: e.target.value })}
                  placeholder="Ej: Fase de Grupos - Jornada 3 o Gran Final"
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Estado del Partido:</label>
                <select
                  value={matchForm.status || 'upcoming'}
                  onChange={e => setMatchForm({ ...matchForm, status: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                >
                  <option value="upcoming" className="bg-[#12141f]">Próximo / Programado</option>
                  <option value="live" className="bg-[#12141f]">🔴 En Vivo (Jugándose ahora)</option>
                  <option value="finished" className="bg-[#12141f]">Finalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Equipo Local:</label>
                <select
                  value={matchForm.homeAcademyId}
                  onChange={e => {
                    const acad = academies.find(a => a.id === e.target.value);
                    setMatchForm({
                      ...matchForm,
                      homeAcademyId: e.target.value,
                      homeAcademyName: acad?.name || '',
                      homeLogo: acad?.logo || ''
                    });
                  }}
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                >
                  {academies.map(a => (
                    <option key={a.id} value={a.id} className="bg-[#12141f]">{a.name} ({a.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Equipo Visitante:</label>
                <select
                  value={matchForm.awayAcademyId}
                  onChange={e => {
                    const acad = academies.find(a => a.id === e.target.value);
                    setMatchForm({
                      ...matchForm,
                      awayAcademyId: e.target.value,
                      awayAcademyName: acad?.name || '',
                      awayLogo: acad?.logo || ''
                    });
                  }}
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                >
                  {academies.map(a => (
                    <option key={a.id} value={a.id} className="bg-[#12141f]">{a.name} ({a.city})</option>
                  ))}
                </select>
              </div>

              {/* Marcador */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Goles Local:</label>
                <input
                  type="number"
                  min="0"
                  value={matchForm.homeScore ?? 0}
                  onChange={e => setMatchForm({ ...matchForm, homeScore: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white font-mono font-bold text-base text-center border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Goles Visitante:</label>
                <input
                  type="number"
                  min="0"
                  value={matchForm.awayScore ?? 0}
                  onChange={e => setMatchForm({ ...matchForm, awayScore: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white font-mono font-bold text-base text-center border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Fecha & Hora:</label>
                <div className="flex gap-2.5">
                  <input
                    type="date"
                    value={matchForm.date}
                    onChange={e => setMatchForm({ ...matchForm, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                  />
                  <input
                    type="time"
                    value={matchForm.time}
                    onChange={e => setMatchForm({ ...matchForm, time: e.target.value })}
                    className="w-36 px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-mono font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Estadio / Cancha:</label>
                <input
                  type="text"
                  value={matchForm.stadium || ''}
                  onChange={e => setMatchForm({ ...matchForm, stadium: e.target.value })}
                  placeholder="Ej: Estadio Metropolitano - Cancha 1"
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                />
              </div>

              {matchForm.status === 'live' && (
                <div>
                  <label className="block text-xs font-bold text-red-400 uppercase tracking-wider mb-1.5">Minuto en Vivo:</label>
                  <input
                    type="text"
                    value={matchForm.liveMinute || "65'"}
                    onChange={e => setMatchForm({ ...matchForm, liveMinute: e.target.value })}
                    placeholder="Ej: 75' o Entretiempo"
                    className="w-full px-4 py-3 rounded-2xl neu-pressed text-white font-mono font-bold text-xs sm:text-sm border border-red-500/50 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Árbitro Principal (opcional):</label>
                <input
                  type="text"
                  value={matchForm.referee || ''}
                  onChange={e => setMatchForm({ ...matchForm, referee: e.target.value })}
                  placeholder="Ej: Wilmar Roldán Pérez"
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Jugador MVP / Destacado (opcional):</label>
                <input
                  type="text"
                  value={matchForm.mvp || ''}
                  onChange={e => setMatchForm({ ...matchForm, mvp: e.target.value })}
                  placeholder="Ej: Mateo Cardona (2 goles)"
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-3">
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-2xl neu-btn-gold text-black font-black text-xs uppercase tracking-wider shadow-xl active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  <span>{editingMatchId ? 'Actualizar Marcador y Partido' : 'Crear y Publicar Partido'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Existing Matches table */}
          <div className="rounded-3xl neu-card p-6 sm:p-8 space-y-4 shadow-xl border border-white/10">
            <h4 className="text-sm font-black text-white uppercase tracking-wider font-cinzel flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
              <span>Partidos del Torneo ({matches.length})</span>
            </h4>
            <div className="space-y-3">
              {matches.map(m => (
                <div key={m.id} className="p-4 sm:p-5 rounded-2xl neu-pressed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/5 hover:border-[#D4AF37]/30 transition-all">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full neu-pressed-gold text-amber-300 text-[10px] font-mono font-bold">
                        {m.category || 'Sub-15'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full neu-pressed text-blue-300 text-[10px] font-semibold">
                        {m.stage || 'Fase de Grupos'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                        {m.phase} • {m.date} {m.time}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base font-black text-white font-cinzel tracking-wide">
                      {m.homeAcademyName} <span className="text-amber-300 font-mono">({m.homeScore ?? '-'})</span> vs <span className="text-amber-300 font-mono">({m.awayScore ?? '-'})</span> {m.awayAcademyName}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>{m.stadium}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-300">Estado: {m.status === 'live' ? '🔴 En Vivo' : m.status === 'finished' ? 'Finalizado' : 'Próximo'}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => setLineupModalMatch(m)}
                      className="px-3.5 py-2 rounded-xl neu-btn-gold text-black text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow active:scale-95"
                      title="Gestionar alineaciones, titulares, suplentes e incidencias"
                    >
                      <Shirt className="w-3.5 h-3.5" />
                      <span>Alineaciones {m.lineups?.homeStarters?.length ? `(${m.lineups.homeStarters.length}v${m.lineups.awayStarters?.length || 0})` : ''}</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingMatchId(m.id);
                        setMatchForm({
                          ...m,
                          referee: m.referee || '',
                          mvp: m.mvp || '',
                          summary: m.summary || ''
                        });
                        setTimeout(() => matchFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
                        showToast(`Editando partido ${m.homeAcademyName} vs ${m.awayAcademyName}`, 'info');
                      }}
                      className="px-3.5 py-2 rounded-xl neu-btn-dark text-amber-300 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      Editar Marcador
                    </button>
                    <button
                      onClick={() => {
                        setConfirmDeleteModal({
                          type: 'match',
                          id: m.id,
                          name: `${m.homeAcademyName} vs ${m.awayAcademyName}`,
                          extraInfo: `${m.category || 'Sub-15'} • ${m.phase} • ${m.date}`
                        });
                      }}
                      className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/25 transition-all cursor-pointer active:scale-95 border border-red-500/20"
                      title="Eliminar partido"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: AGREGAR JUGADORES */}
      {activeSection === 'add_player' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div ref={playerFormRef} className="rounded-3xl neu-card-gold p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg sm:text-xl font-bold text-white font-cinzel flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl neu-pressed-gold text-[#D4AF37] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <span>{editingPlayerId ? 'Editar Jugador del Torneo' : 'Fichar / Registrar Jugador'}</span>
              </h3>
              {editingPlayerId && (
                <button
                  type="button"
                  onClick={handleCancelEditPlayer}
                  className="px-4 py-2 rounded-2xl neu-btn-dark text-slate-300 text-xs font-bold active:scale-95 cursor-pointer"
                >
                  Cancelar Edición
                </button>
              )}
            </div>

            <form onSubmit={handleSavePlayer} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Nombre Completo del Jugador:</label>
                <input
                  type="text"
                  required
                  value={playerForm.name || ''}
                  onChange={e => setPlayerForm({ ...playerForm, name: e.target.value })}
                  placeholder="Ej: David Silva"
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Club / Academia:</label>
                <select
                  value={playerForm.academyId}
                  onChange={e => {
                    const acad = academies.find(a => a.id === e.target.value);
                    setPlayerForm({
                      ...playerForm,
                      academyId: e.target.value,
                      academyName: acad?.name || ''
                    });
                  }}
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                >
                  {academies.map(a => (
                    <option key={a.id} value={a.id} className="bg-[#12141f]">{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Categoría Única Permitida: Sub-7, Sub-9, Sub-11, Sub-13, Sub-15 */}
              <div className="md:col-span-2 p-4 sm:p-5 rounded-2xl neu-pressed space-y-3">
                <label className="block text-xs font-black text-white uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#D4AF37]" />
                    <span>Categoría del Jugador:</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full neu-pressed text-amber-300 text-[11px] font-mono font-bold border border-[#D4AF37]/30">
                    Seleccionada: {playerForm.category || 'Sub-15'}
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {TOURNAMENT_CATEGORIES.map(cat => {
                    const isSelected = (playerForm.category || 'Sub-15') === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setPlayerForm({ ...playerForm, category: cat })}
                        className={`min-h-[44px] px-3 py-2 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                          isSelected
                            ? 'neu-btn-gold text-black shadow-md'
                            : 'neu-btn-dark text-slate-300 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-black stroke-[3]" />}
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Posición en Cancha:</label>
                <select
                  value={playerForm.position || 'Delantero'}
                  onChange={e => setPlayerForm({ ...playerForm, position: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                >
                  <option value="Portero" className="bg-[#12141f]">Portero</option>
                  <option value="Defensa" className="bg-[#12141f]">Defensa</option>
                  <option value="Centrocampista" className="bg-[#12141f]">Centrocampista</option>
                  <option value="Delantero" className="bg-[#12141f]">Delantero</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Número de Camiseta (Dorsal):</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={playerForm.number || 10}
                  onChange={e => setPlayerForm({ ...playerForm, number: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white font-mono font-bold text-sm border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Goles Anotados en el Torneo:</label>
                <input
                  type="number"
                  min="0"
                  value={playerForm.goals || 0}
                  onChange={e => setPlayerForm({ ...playerForm, goals: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl neu-pressed text-white font-mono font-bold text-sm border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Asistencias & Premios MVP:</label>
                <div className="flex gap-2.5">
                  <input
                    type="number"
                    min="0"
                    value={playerForm.assists || 0}
                    onChange={e => setPlayerForm({ ...playerForm, assists: Number(e.target.value) })}
                    placeholder="Asistencias"
                    className="w-full px-4 py-3 rounded-2xl neu-pressed text-white font-mono font-bold text-sm border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all text-center"
                  />
                  <input
                    type="number"
                    min="0"
                    value={playerForm.mvpCount || 0}
                    onChange={e => setPlayerForm({ ...playerForm, mvpCount: Number(e.target.value) })}
                    placeholder="MVPs"
                    className="w-full px-4 py-3 rounded-2xl neu-pressed text-amber-300 font-mono font-bold text-sm border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all text-center"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Foto del Jugador:</label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="url"
                    value={playerForm.photo || ''}
                    onChange={e => setPlayerForm({ ...playerForm, photo: e.target.value })}
                    placeholder="https://images.unsplash.com/... o sube a Storage"
                    className="flex-1 px-4 py-3 rounded-2xl neu-pressed text-white text-xs font-mono border border-white/10 focus:border-[#D4AF37] focus:outline-none transition-all"
                  />
                  <label className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl neu-btn-gold text-black text-xs font-extrabold uppercase tracking-wider cursor-pointer shrink-0 shadow-md active:scale-95">
                    <UploadCloud className="w-4 h-4" />
                    <span>{uploadingTarget === 'player' ? 'Subiendo...' : 'Subir a Storage'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingTarget === 'player'}
                      className="hidden"
                      onChange={e => handleFileUpload(e, 'player')}
                    />
                  </label>
                </div>
                {playerForm.photo && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl neu-pressed border border-white/5">
                    <img src={playerForm.photo} alt="Foto jugador" className="w-12 h-12 rounded-full object-cover border border-[#D4AF37] shadow" />
                    <span className="text-xs text-slate-400 truncate flex-1 font-mono">{playerForm.photo}</span>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3">
                {editingPlayerId && (
                  <button
                    type="button"
                    onClick={handleCancelEditPlayer}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl neu-btn-dark text-slate-300 font-bold text-xs uppercase tracking-wider cursor-pointer active:scale-95 text-center"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-2xl neu-btn-gold text-black font-black text-xs uppercase tracking-wider cursor-pointer shadow-xl active:scale-95 flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>{editingPlayerId ? 'Guardar Cambios del Jugador' : 'Registrar Jugador'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Existing Players List */}
          <div className="rounded-3xl neu-card p-6 sm:p-8 space-y-4 shadow-xl border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
              <h4 className="text-sm font-black text-white uppercase tracking-wider font-cinzel flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                <span>Jugadores Inscritos ({players.length})</span>
              </h4>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-400 mr-1">Filtrar:</span>
                <button
                  onClick={() => setPlayerCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer active:scale-95 ${
                    playerCategoryFilter === 'all'
                      ? 'neu-btn-gold text-black shadow'
                      : 'neu-btn-dark text-slate-300 hover:text-white'
                  }`}
                >
                  Todas
                </button>
                {TOURNAMENT_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setPlayerCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer active:scale-95 ${
                      playerCategoryFilter === cat
                        ? 'neu-btn-gold text-black shadow'
                        : 'neu-btn-dark text-slate-300 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {players
                .filter(p => playerCategoryFilter === 'all' || (p.category || 'Sub-15') === playerCategoryFilter)
                .map(p => (
                  <div key={p.id} className="p-3.5 rounded-2xl neu-pressed border border-white/5 hover:border-[#D4AF37]/30 flex items-center justify-between gap-3 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.photo} alt={p.name} className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/50 shrink-0 shadow" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs sm:text-sm font-bold text-white truncate">#{p.number} {p.name}</p>
                          <span className="px-2 py-0.5 rounded-full neu-pressed-gold text-amber-300 text-[9px] font-mono font-extrabold">
                            {p.category || 'Sub-15'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{p.academyName} • <span className="text-amber-300 font-semibold">{p.goals} goles</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEditPlayer(p)}
                        className="p-2 rounded-xl neu-btn-dark text-amber-300 hover:text-white cursor-pointer active:scale-95 shadow"
                        title="Editar jugador"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDeleteModal({
                            type: 'player',
                            id: p.id,
                            name: p.name,
                            extraInfo: `Academia: ${p.academyName} • Dorsal: #${p.number} • Categoría: ${p.category || 'Sub-15'}`
                          });
                        }}
                        className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/25 transition-all cursor-pointer active:scale-95 border border-red-500/20"
                        title="Eliminar jugador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: AGREGAR ACADEMIAS - Luxury Neumorphic Dribbble Mobile-First Design */}
      {activeSection === 'add_academy' && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neu-pressed text-[11px] text-amber-300 font-bold uppercase tracking-wider mb-2">
                <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Torneo Élite EMILIATEX • Módulo Oficial</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-white font-cinzel tracking-tight flex items-center gap-2.5">
                <span>Inscripción & Gestión de Clubes</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Registra los clubes y academias oficiales, asigna sus categorías formativas habilitadas y gestiona sus estadísticas en la tabla de posiciones.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="px-3.5 py-1.5 rounded-xl neu-pressed text-xs font-mono text-amber-300 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {academies.length} {academies.length === 1 ? 'Club Inscrito' : 'Clubes Inscritos'}
              </span>
            </div>
          </div>

          {/* Edit Mode Alert Banner */}
          {editingAcademyId && (
            <div className="p-4 rounded-2xl neu-card-gold flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl neu-pressed flex items-center justify-center shrink-0 border border-[#D4AF37]/40">
                  <Edit3 className="w-5 h-5 text-[#D4AF37] animate-pulse" />
                </div>
                <div>
                  <span className="font-extrabold uppercase tracking-wider text-[11px] text-amber-300 block">Modo Edición Activo</span>
                  <p className="text-white text-sm font-semibold">
                    Actualizando datos del club: <span className="text-[#D4AF37] font-bold">{academyForm.name || 'Sin nombre'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelEditAcademy}
                className="self-end sm:self-center px-4 py-2 rounded-xl neu-btn-dark text-slate-200 font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancelar Edición
              </button>
            </div>
          )}

          {/* Main Neumorphic Form Card */}
          <div 
            ref={academyFormRef} 
            className={`rounded-3xl neu-card p-5 sm:p-8 space-y-6 transition-all ${
              editingAcademyId ? 'ring-2 ring-[#D4AF37]/60 shadow-[0_0_35px_rgba(212,175,55,0.25)]' : ''
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl neu-pressed flex items-center justify-center text-[#D4AF37] shrink-0">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-black text-white font-cinzel">
                    {editingAcademyId ? 'Actualizar Ficha de Academia' : 'Inscribir Nuevo Club / Academia'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Ingresa los datos institucionales, cuerpo técnico y escudo del equipo.
                  </p>
                </div>
              </div>
              {editingAcademyId && (
                <button
                  type="button"
                  onClick={handleCancelEditAcademy}
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-xl neu-btn-dark text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSaveAcademy} className="space-y-6">
              {/* Basic Details Grid - 1 Col on mobile, 2 Cols on md */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Academy Name */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-300">
                    Nombre Oficial del Club / Academia <span className="text-[#D4AF37]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Building2 className="w-4 h-4 text-[#D4AF37]/80" />
                    </div>
                    <input
                      type="text"
                      required
                      value={academyForm.name || ''}
                      onChange={e => setAcademyForm({ ...academyForm, name: e.target.value })}
                      placeholder="Ej: Academia Deportivo Cali Bogotá"
                      className="w-full pl-10 pr-4 py-3 sm:py-3.5 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                  </div>
                </div>

                {/* Acronym */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-300">
                    Siglas / Acrónimo (3 o 4 Letras)
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Hash className="w-4 h-4 text-[#D4AF37]/80" />
                    </div>
                    <input
                      type="text"
                      maxLength={4}
                      value={academyForm.acronym || ''}
                      onChange={e => setAcademyForm({ ...academyForm, acronym: e.target.value.toUpperCase() })}
                      placeholder="Ej: DCB"
                      className="w-full pl-10 pr-4 py-3 sm:py-3.5 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-mono font-bold uppercase placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                  </div>
                </div>

                {/* City / Sede */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-300">
                    Ciudad / Sede Deportiva
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <MapPin className="w-4 h-4 text-[#D4AF37]/80" />
                    </div>
                    <input
                      type="text"
                      value={academyForm.city || ''}
                      onChange={e => setAcademyForm({ ...academyForm, city: e.target.value })}
                      placeholder="Ej: Bogotá D.C. / Medellín / Cali"
                      className="w-full pl-10 pr-4 py-3 sm:py-3.5 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                  </div>
                </div>

                {/* Coach / DT */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-300">
                    Director Técnico / Entrenador Principal
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <User className="w-4 h-4 text-[#D4AF37]/80" />
                    </div>
                    <input
                      type="text"
                      value={academyForm.coach || ''}
                      onChange={e => setAcademyForm({ ...academyForm, coach: e.target.value })}
                      placeholder="Ej: Prof. Carlos Valderrama"
                      className="w-full pl-10 pr-4 py-3 sm:py-3.5 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Club Badge / Logo Section - Neumorphic Visual Preview */}
              <div className="p-4 sm:p-5 rounded-2xl neu-pressed space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#D4AF37]" />
                    <span>Escudo / Emblema Oficial del Club</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">PNG / JPG Recomendado</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Neumorphic Squircle Preview */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl neu-card flex items-center justify-center p-2 shrink-0 border border-[#D4AF37]/30 shadow-lg relative group">
                    {academyForm.logo ? (
                      <img
                        src={academyForm.logo}
                        alt="Escudo de academia"
                        className="w-full h-full object-contain rounded-xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                      />
                    ) : (
                      <Shield className="w-10 h-10 text-slate-600" />
                    )}
                    <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[#D4AF37] text-black text-[9px] font-black uppercase tracking-wider shadow">
                      {academyForm.acronym || 'ESCUDO'}
                    </span>
                  </div>

                  {/* Actions / Inputs */}
                  <div className="flex-1 w-full space-y-2.5">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          value={academyForm.logo || ''}
                          onChange={e => setAcademyForm({ ...academyForm, logo: e.target.value })}
                          placeholder="https://images.unsplash.com/... o sube archivo"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl neu-btn-gold text-black text-xs font-extrabold uppercase tracking-wider cursor-pointer shrink-0">
                        <UploadCloud className="w-4 h-4" />
                        <span>{uploadingTarget === 'academy' ? 'Subiendo...' : 'Subir Escudo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingTarget === 'academy'}
                          className="hidden"
                          onChange={e => handleFileUpload(e, 'academy')}
                        />
                      </label>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Sube la insignia en alta resolución o ingresa un enlace directo. Se sincronizará automáticamente con las tablas de posiciones y los partidos del torneo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Multi-Selection Panel - Mobile First Touch Buttons */}
              <div className="p-4 sm:p-6 rounded-2xl neu-card-gold space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/5 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
                        Categorías Formativas Habilitadas
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full neu-pressed text-[#D4AF37] text-[11px] font-mono font-black border border-[#D4AF37]/30">
                        {(academyForm.categories || []).length} / {DEFAULT_ACADEMY_CATEGORIES.length} Seleccionadas
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Toca sobre cada categoría para activar o desactivar la participación de este club:
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={handleSelectAllCategories}
                      className="px-3 py-1.5 rounded-xl neu-btn-dark text-amber-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      Todas
                    </button>
                    <button
                      type="button"
                      onClick={handleClearCategories}
                      className="px-3 py-1.5 rounded-xl neu-btn-dark text-slate-400 hover:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                {/* Categories Grid - Strictly Sub-7, Sub-9, Sub-11, Sub-13, Sub-15 with Ergonomic Touch Feedback */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
                  {DEFAULT_ACADEMY_CATEGORIES.map(cat => {
                    const isSelected = (academyForm.categories || []).includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`min-h-[46px] flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                          isSelected
                            ? 'neu-btn-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                            : 'neu-btn-dark text-slate-300 hover:text-white'
                        }`}
                      >
                        <span className="tracking-wide">{cat}</span>
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                            <Plus className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tournament Standings Statistics - Editable Neumorphic Panel */}
              <div className="p-4 sm:p-6 rounded-2xl neu-pressed space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg neu-card flex items-center justify-center text-[#D4AF37]">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider block">
                        Estadísticas en Tabla de Posiciones
                      </span>
                      <span className="text-[10px] text-slate-400">Valores computados oficialmente en el torneo</span>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl neu-card-gold flex items-center gap-2 self-start sm:self-center">
                    <span className="text-[10px] uppercase font-bold text-slate-300">Puntos Calculados:</span>
                    <span className="font-cinzel text-base font-black text-amber-300">
                      {(Number(academyForm.won || 0) * 3) + Number(academyForm.drawn || 0)} pts
                    </span>
                  </div>
                </div>

                {/* Stats Input Grid - Highly Responsive */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                  <div className="p-2.5 rounded-xl neu-card space-y-1 text-center">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">PJ (Jugados)</label>
                    <input
                      type="number"
                      min={0}
                      value={academyForm.played ?? 0}
                      onChange={e => setAcademyForm({ ...academyForm, played: parseInt(e.target.value) || 0 })}
                      className="w-full py-1.5 px-1 rounded-lg neu-pressed text-white font-mono text-sm font-bold text-center focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl neu-card space-y-1 text-center">
                    <label className="block text-[10px] text-emerald-400 font-bold uppercase tracking-wider">PG (Ganados)</label>
                    <input
                      type="number"
                      min={0}
                      value={academyForm.won ?? 0}
                      onChange={e => {
                        const w = parseInt(e.target.value) || 0;
                        const d = Number(academyForm.drawn || 0);
                        setAcademyForm({ ...academyForm, won: w, points: w * 3 + d });
                      }}
                      className="w-full py-1.5 px-1 rounded-lg neu-pressed text-emerald-300 font-mono text-sm font-bold text-center focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl neu-card space-y-1 text-center">
                    <label className="block text-[10px] text-amber-300 font-bold uppercase tracking-wider">PE (Empates)</label>
                    <input
                      type="number"
                      min={0}
                      value={academyForm.drawn ?? 0}
                      onChange={e => {
                        const d = parseInt(e.target.value) || 0;
                        const w = Number(academyForm.won || 0);
                        setAcademyForm({ ...academyForm, drawn: d, points: w * 3 + d });
                      }}
                      className="w-full py-1.5 px-1 rounded-lg neu-pressed text-amber-200 font-mono text-sm font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-300"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl neu-card space-y-1 text-center">
                    <label className="block text-[10px] text-red-400 font-bold uppercase tracking-wider">PP (Perdidos)</label>
                    <input
                      type="number"
                      min={0}
                      value={academyForm.lost ?? 0}
                      onChange={e => setAcademyForm({ ...academyForm, lost: parseInt(e.target.value) || 0 })}
                      className="w-full py-1.5 px-1 rounded-lg neu-pressed text-red-300 font-mono text-sm font-bold text-center focus:outline-none focus:ring-1 focus:ring-red-400"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl neu-card space-y-1 text-center">
                    <label className="block text-[10px] text-slate-300 font-bold uppercase tracking-wider">GF (A Favor)</label>
                    <input
                      type="number"
                      min={0}
                      value={academyForm.goalsFor ?? 0}
                      onChange={e => setAcademyForm({ ...academyForm, goalsFor: parseInt(e.target.value) || 0 })}
                      className="w-full py-1.5 px-1 rounded-lg neu-pressed text-white font-mono text-sm font-bold text-center focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl neu-card space-y-1 text-center">
                    <label className="block text-[10px] text-slate-300 font-bold uppercase tracking-wider">GC (En Contra)</label>
                    <input
                      type="number"
                      min={0}
                      value={academyForm.goalsAgainst ?? 0}
                      onChange={e => setAcademyForm({ ...academyForm, goalsAgainst: parseInt(e.target.value) || 0 })}
                      className="w-full py-1.5 px-1 rounded-lg neu-pressed text-white font-mono text-sm font-bold text-center focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl neu-card-gold space-y-1 text-center col-span-2 sm:col-span-1">
                    <label className="block text-[10px] text-amber-300 font-black uppercase tracking-wider">PTS (Puntos)</label>
                    <input
                      type="number"
                      min={0}
                      value={academyForm.points ?? 0}
                      onChange={e => setAcademyForm({ ...academyForm, points: parseInt(e.target.value) || 0 })}
                      className="w-full py-1.5 px-1 rounded-lg neu-pressed-gold text-amber-300 font-mono text-base font-black text-center focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions - Mobile First Full Width Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                {editingAcademyId && (
                  <button
                    type="button"
                    disabled={isSavingAcademy}
                    onClick={handleCancelEditAcademy}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl neu-btn-dark text-slate-300 font-bold text-xs uppercase tracking-wider cursor-pointer text-center"
                  >
                    Cancelar Edición
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSavingAcademy}
                  className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-2xl neu-btn-gold text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-lg flex items-center justify-center gap-2.5 transition-all disabled:opacity-60"
                >
                  {isSavingAcademy ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>{editingAcademyId ? 'Guardando Cambios...' : 'Inscribiendo en Torneo...'}</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 text-black" />
                      <span>{editingAcademyId ? 'Guardar Cambios de Academia' : 'Inscribir Academia al Torneo'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* List of Registered Academies - Dribbble Style Mobile Cards */}
          <div className="rounded-3xl neu-card p-5 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-base sm:text-xl font-black text-white font-cinzel flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#D4AF37]" />
                  <span>Clubes y Academias Afiliadas</span>
                  <span className="px-2.5 py-0.5 rounded-full neu-pressed text-amber-300 font-mono text-xs font-bold">
                    {academies.length}
                  </span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  Directorio de instituciones activas en las categorías del torneo.
                </p>
              </div>

              {/* Instant Search Bar for Mobile */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={academySearch}
                  onChange={e => setAcademySearch(e.target.value)}
                  placeholder="Buscar club, sede o DT..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl neu-pressed text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            {/* Academies Grid */}
            {academies.filter(a => {
              if (!academySearch.trim()) return true;
              const q = academySearch.toLowerCase();
              return (
                a.name.toLowerCase().includes(q) ||
                a.acronym.toLowerCase().includes(q) ||
                (a.city && a.city.toLowerCase().includes(q)) ||
                (a.coach && a.coach.toLowerCase().includes(q)) ||
                (a.categories && a.categories.some(c => c.toLowerCase().includes(q)))
              );
            }).length === 0 ? (
              <div className="py-12 text-center rounded-2xl neu-pressed space-y-2">
                <Shield className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No se encontraron academias registradas con ese criterio.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {academies
                  .filter(a => {
                    if (!academySearch.trim()) return true;
                    const q = academySearch.toLowerCase();
                    return (
                      a.name.toLowerCase().includes(q) ||
                      a.acronym.toLowerCase().includes(q) ||
                      (a.city && a.city.toLowerCase().includes(q)) ||
                      (a.coach && a.coach.toLowerCase().includes(q)) ||
                      (a.categories && a.categories.some(c => c.toLowerCase().includes(q)))
                    );
                  })
                  .map(a => {
                    const isCurrentlyEditing = editingAcademyId === a.id;
                    return (
                      <div
                        key={a.id}
                        className={`rounded-2xl p-4 sm:p-5 transition-all space-y-3.5 relative overflow-hidden ${
                          isCurrentlyEditing ? 'neu-card-gold ring-2 ring-[#D4AF37]' : 'neu-card'
                        }`}
                      >
                        {/* Top Info Row */}
                        <div className="flex items-start gap-3.5">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl neu-pressed p-1.5 shrink-0 flex items-center justify-center border border-[#D4AF37]/30 shadow-md">
                            <img
                              src={a.logo}
                              alt={a.name}
                              className="w-full h-full object-contain rounded-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm sm:text-base font-extrabold text-white truncate font-cinzel">
                                {a.name}
                              </h4>
                              <span className="px-2 py-0.5 rounded-md neu-pressed text-[10px] font-mono text-amber-300 font-bold uppercase">
                                {a.acronym}
                              </span>
                              {isCurrentlyEditing && (
                                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-black text-[9px] font-black uppercase tracking-wider animate-pulse">
                                  Editando
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-slate-400 mt-1">
                              {a.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-[#D4AF37]" />
                                  <span className="truncate">{a.city}</span>
                                </span>
                              )}
                              {a.coach && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3 text-slate-400" />
                                  <span className="truncate">DT: {a.coach}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Standings Summary Pill */}
                        <div className="flex items-center justify-between px-3 py-2 rounded-xl neu-pressed text-xs">
                          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-300">
                            <span>PJ: <strong className="text-white">{a.played || 0}</strong></span>
                            <span>PG: <strong className="text-emerald-400">{a.won || 0}</strong></span>
                            <span>PE: <strong className="text-amber-300">{a.drawn || 0}</strong></span>
                            <span>PP: <strong className="text-red-400">{a.lost || 0}</strong></span>
                          </div>
                          <div className="font-mono font-black text-amber-300 text-xs">
                            {a.points || 0} PTS
                          </div>
                        </div>

                        {/* Categories Chips */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {a.categories && a.categories.length > 0 ? (
                            a.categories.map(c => (
                              <span
                                key={c}
                                className="px-2.5 py-0.5 rounded-lg neu-pressed text-[#D4AF37] border border-[#D4AF37]/20 text-[10px] font-bold"
                              >
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-lg neu-pressed text-[#D4AF37] border border-[#D4AF37]/20 text-[10px] font-bold">
                              {a.category || 'Sub-15'}
                            </span>
                          )}
                        </div>

                        {/* Bottom Actions Bar */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                          <button
                            onClick={() => handleEditAcademy(a)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isCurrentlyEditing
                                ? 'neu-btn-gold text-black shadow-md'
                                : 'neu-btn-dark text-amber-300'
                            }`}
                            title="Editar datos y categorías"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isCurrentlyEditing ? 'En Edición' : 'Editar Ficha'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDeleteModal({
                                type: 'academy',
                                id: a.id,
                                name: a.name,
                                extraInfo: `Sede: ${a.city} • DT: ${a.coach || 'No asignado'} • Categorías: ${(a.categories || [a.category]).join(', ')}`
                              });
                            }}
                            className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer"
                            title="Eliminar academia"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: VER PEDIDOS RECIBIDOS (Organized list of WhatsApp orders) */}
      {activeSection === 'view_orders' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-3xl neu-card-gold p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white font-cinzel flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl neu-pressed text-[#25D366] flex items-center justify-center shrink-0 border border-[#25D366]/30">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span>Bandeja de Pedidos y Cotizaciones WhatsApp</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Control de solicitudes recibidas desde el catálogo y la web oficial.
                </p>
              </div>

              {/* Status Filters */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl neu-pressed">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'pending', label: 'Pendientes' },
                  { id: 'in_production', label: 'En Producción' },
                  { id: 'shipped', label: 'Enviados' },
                  { id: 'delivered', label: 'Entregados' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setOrderStatusFilter(f.id as any)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                      orderStatusFilter === f.id
                        ? 'neu-btn-gold text-black shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input for orders */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                placeholder="Buscar por cliente, teléfono o ref..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl neu-pressed text-white text-xs sm:text-sm font-medium border border-white/10 focus:border-[#25D366] focus:outline-none transition-all"
              />
            </div>

            {/* Orders Cards / Table */}
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs rounded-2xl neu-pressed border border-white/5">
                No hay pedidos en esta categoría o búsqueda.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map(order => (
                  <div
                    key={order.id}
                    className="p-5 sm:p-6 rounded-3xl neu-card space-y-4 border border-white/10 hover:border-[#D4AF37]/40 shadow-xl transition-all"
                  >
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-black text-amber-300">{order.orderNumber}</span>
                        <span className="text-xs text-slate-400">• {order.date}</span>
                      </div>

                      {/* Status Tag Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado:</span>
                        <select
                          value={order.status}
                          onChange={e => {
                            updateOrderStatus(order.id, e.target.value as OrderStatus);
                            onRefresh();
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border focus:outline-none cursor-pointer ${
                            order.status === 'pending' ? 'neu-pressed text-amber-300 border-amber-400/30' :
                            order.status === 'in_production' ? 'neu-pressed text-blue-300 border-blue-500/30' :
                            order.status === 'shipped' ? 'neu-pressed text-purple-300 border-purple-500/30' :
                            order.status === 'delivered' ? 'neu-pressed text-emerald-300 border-emerald-500/30' :
                            'neu-pressed text-red-300 border-red-500/30'
                          }`}
                        >
                          <option value="pending" className="bg-[#12141f]">⏳ Pendiente</option>
                          <option value="in_production" className="bg-[#12141f]">🧵 En Confección</option>
                          <option value="shipped" className="bg-[#12141f]">🚚 Enviado</option>
                          <option value="delivered" className="bg-[#12141f]">✅ Entregado</option>
                          <option value="cancelled" className="bg-[#12141f]">❌ Cancelado</option>
                        </select>
                      </div>
                    </div>

                    {/* Customer info & Product Items */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-4 rounded-2xl neu-pressed space-y-1 border border-white/5">
                        <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Cliente / Contacto:</span>
                        <p className="font-black text-white text-sm mt-0.5">{order.customerName}</p>
                        <p className="text-slate-300 flex items-center gap-1.5 mt-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                          <span>{order.customerPhone}</span>
                        </p>
                        <p className="text-amber-300 text-[11px] font-semibold mt-1">Club/Empresa: {order.companyOrTeam}</p>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Prendas Solicitadas:</span>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="p-3.5 rounded-2xl neu-pressed border border-white/5 space-y-1">
                            <div className="flex justify-between font-bold text-white text-xs sm:text-sm">
                              <span>{item.productName}</span>
                              <span className="text-amber-300 font-mono font-bold">{item.quantity} unidades</span>
                            </div>
                            <p className="text-xs text-slate-300">Tallas: <span className="font-semibold text-white">{item.sizes}</span></p>
                            <p className="text-xs text-[#D4AF37]">Personalización: {item.customization}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="p-3.5 rounded-2xl neu-pressed text-xs text-slate-300 border border-white/5">
                        <span className="font-bold text-white uppercase tracking-wider">Observaciones: </span>
                        {order.notes}
                      </div>
                    )}

                    {/* Actions Footer */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/5 text-xs">
                      <button
                        onClick={() => {
                          const url = formatWhatsAppLink(
                            order.customerPhone,
                            `Hola ${order.customerName}, te escribimos de EMILIATEX respecto a tu cotización ${order.orderNumber}.`
                          );
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl neu-btn-dark border border-[#25D366]/40 text-[#25D366] font-black uppercase tracking-wider hover:bg-[#25D366]/20 transition-all active:scale-95 cursor-pointer shadow-md"
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                        <span>Abrir Chat de WhatsApp</span>
                      </button>

                      <button
                        onClick={() => {
                          setConfirmDeleteModal({
                            type: 'order',
                            id: order.id,
                            name: order.orderNumber,
                            extraInfo: `Cliente: ${order.customerName} • Celular: ${order.customerPhone}`
                          });
                        }}
                        className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/25 border border-red-500/20 font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                        title="Eliminar orden"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar Pedido</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

        </div>
      )}

      {/* WHATSAPP CONFIG MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#151722] border border-[#D4AF37]/40 rounded-2xl p-6 w-full max-w-md space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-cinzel text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                <span>Configuración de WhatsApp</span>
              </h3>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Ingresa el número de WhatsApp oficial (con indicativo de país sin signos ni espacios, ej: <code>573124567890</code>) al cual llegarán los pedidos y cotizaciones.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Número de WhatsApp receptor:</label>
              <input
                type="text"
                value={waConfigPhone}
                onChange={e => setWaConfigPhone(e.target.value)}
                placeholder="573124567890"
                className="w-full px-3 py-2 rounded-lg bg-[#1c1f2e] border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-lg bg-white/10 text-xs font-semibold text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-5 py-2 rounded-lg bg-[#25D366] text-black font-extrabold text-xs tracking-wide"
              >
                Guardar Número
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MATCH LINEUP AND EVENTS MODAL */}
      {lineupModalMatch && (
        <MatchLineupModal
          isOpen={true}
          match={lineupModalMatch}
          academies={academies}
          players={players}
          onClose={() => setLineupModalMatch(null)}
          onSave={handleSaveLineupsFromModal}
        />
      )}

      {/* CONFIRM DELETE MODAL (In-app modal replacing unreliable native confirm) */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#151722] border border-red-500/40 rounded-2xl p-6 w-full max-w-md space-y-4 text-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Confirmar Eliminación?</h3>
                <p className="text-xs text-red-400 font-semibold uppercase tracking-wider">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1c1f2e] border border-white/5 space-y-1">
              <p className="text-xs text-slate-400">Elemento a eliminar:</p>
              <p className="text-sm font-bold text-white break-words">{confirmDeleteModal.name}</p>
              {confirmDeleteModal.extraInfo && (
                <p className="text-xs text-slate-400">{confirmDeleteModal.extraInfo}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingItem}
                onClick={() => setConfirmDeleteModal(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingItem}
                onClick={handleExecuteDelete}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-red-500/20 flex items-center gap-2 disabled:opacity-60"
              >
                {isDeletingItem ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Eliminando de Firestore...</span>
                  </>
                ) : (
                  <span>Sí, Eliminar Definitivamente</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-200">
          <div className={`p-4 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
            toast.type === 'success'
              ? 'bg-[#121f17]/95 border-emerald-500/50 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-[#2a1315]/95 border-red-500/50 text-red-200'
              : 'bg-[#151928]/95 border-[#D4AF37]/50 text-amber-200'
          }`}>
            <div className="shrink-0">
              {toast.type === 'success' && <Check className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
              {toast.type === 'info' && <Sparkles className="w-5 h-5 text-amber-400" />}
            </div>
            <p className="text-xs font-semibold flex-1 leading-snug">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white shrink-0 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
