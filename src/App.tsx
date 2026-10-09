import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Navbar, NavPage } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { CatalogView } from './views/CatalogView';
import { TournamentView } from './views/TournamentView';
import { AdminView } from './views/AdminView';
import { MatchDetailView } from './views/MatchDetailView';
import { QuinielaView } from './views/QuinielaView';
import { ProductQuoteModal } from './components/ProductQuoteModal';
import { Product, TournamentMatch, Player, Academy, OrderQuotation, AppSettings } from './types';
import { 
  getProducts, 
  getMatches, 
  getPlayers, 
  getAcademies, 
  getOrders, 
  getSettings, 
  formatWhatsAppLink,
  subscribeProducts,
  subscribeMatches,
  subscribePlayers,
  subscribeAcademies,
  subscribeOrders,
  subscribeSettings,
  seedInitialFirestoreData
} from './services/storage';
import { AuthProvider } from './services/authContext';
import { MessageCircle } from 'lucide-react';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<NavPage>(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page') as NavPage;
    if (pageParam && ['home', 'catalog', 'tournament', 'quiniela', 'admin'].includes(pageParam)) {
      return pageParam;
    }
    if (params.get('adminSection')) {
      return 'admin';
    }
    return 'home';
  });

  const [initialAdminSection, setInitialAdminSection] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('adminSection');
  });

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('matchId');
  });

  const [products, setProducts] = useState<Product[]>(getProducts());
  const [matches, setMatches] = useState<TournamentMatch[]>(getMatches());
  const [players, setPlayers] = useState<Player[]>(getPlayers());
  const [academies, setAcademies] = useState<Academy[]>(getAcademies());
  const [orders, setOrders] = useState<OrderQuotation[]>(getOrders());
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [quoteProduct, setQuoteProduct] = useState<Product | null>(null);

  // Active selected match object (if any)
  const selectedMatch = matches.find(m => m.id === selectedMatchId) || null;

  // Load state from local persistence as immediate baseline
  const loadData = () => {
    setProducts(getProducts());
    setMatches(getMatches());
    setPlayers(getPlayers());
    setAcademies(getAcademies());
    setOrders(getOrders());
    setSettings(getSettings());
  };

  useEffect(() => {
    // Initial load
    loadData();

    // Listen to browser navigation (back/forward)
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page') as NavPage;
      const matchIdParam = params.get('matchId');
      
      if (matchIdParam) {
        setSelectedMatchId(matchIdParam);
        setCurrentPage('tournament');
        return;
      }
      setSelectedMatchId(null);

      if (pageParam && ['home', 'catalog', 'tournament', 'admin'].includes(pageParam)) {
        setCurrentPage(pageParam);
      } else if (params.get('adminSection')) {
        setCurrentPage('admin');
        setInitialAdminSection(params.get('adminSection'));
      } else {
        setCurrentPage('home');
      }
    };
    window.addEventListener('popstate', handlePopState);

    // Listen to reactive updates from local storage
    const handleStorageUpdate = () => {
      loadData();
    };
    window.addEventListener('emiliatex_storage_update', handleStorageUpdate);

    // Subscribe to Firestore Realtime updates
    const unsubProducts = subscribeProducts((prods) => setProducts(prods));
    const unsubMatches = subscribeMatches((m) => setMatches(m));
    const unsubPlayers = subscribePlayers((p) => setPlayers(p));
    const unsubAcademies = subscribeAcademies((a) => setAcademies(a));
    const unsubOrders = subscribeOrders((o) => setOrders(o));
    const unsubSettings = subscribeSettings((s) => setSettings(s));

    // Attempt seed to populate Firestore if collections are blank
    seedInitialFirestoreData().catch(() => {});

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('emiliatex_storage_update', handleStorageUpdate);
      unsubProducts();
      unsubMatches();
      unsubPlayers();
      unsubAcademies();
      unsubOrders();
      unsubSettings();
    };
  }, []);

  const handleNavigate = (page: NavPage) => {
    setCurrentPage(page);
    setSelectedMatchId(null);
    const newUrl = page === 'home' ? window.location.pathname : `${window.location.pathname}?page=${page}`;
    window.history.pushState(null, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectMatch = (match: TournamentMatch) => {
    setSelectedMatchId(match.id);
    const newUrl = `${window.location.pathname}?page=tournament&matchId=${match.id}`;
    window.history.pushState(null, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromMatch = () => {
    setSelectedMatchId(null);
    const newUrl = `${window.location.pathname}?page=tournament`;
    window.history.pushState(null, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFloatingWhatsApp = () => {
    const url = formatWhatsAppLink(
      settings.whatsappNumber,
      '¡Hola EMILIATEX! Me comunico desde la plataforma web para cotizar uniformes.'
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const hasLiveMatch = matches.some(m => m.status === 'live');

  return (
    <div className="min-h-screen flex flex-col bg-[#090A0F] text-slate-100 selection:bg-[#D4AF37] selection:text-black">
      
      {/* Top Navigation */}
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Main Content Area - Generous bottom padding on mobile so it clears the Bottom Navigation Dock */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-24 md:pb-12">
        {selectedMatch ? (
          <motion.div
            key={`match-${selectedMatch.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <MatchDetailView
              match={selectedMatch}
              academies={academies}
              players={players}
              onBack={handleBackFromMatch}
              onSelectMatch={handleSelectMatch}
            />
          </motion.div>
        ) : (
          <motion.div
            key={`page-${currentPage}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {currentPage === 'home' && (
              <HomeView
                products={products}
                matches={matches}
                onNavigate={handleNavigate}
                onSelectProduct={(p) => setQuoteProduct(p)}
                onSelectMatch={handleSelectMatch}
              />
            )}

            {currentPage === 'catalog' && (
              <CatalogView
                products={products}
                onSelectProduct={(p) => setQuoteProduct(p)}
              />
            )}

            {currentPage === 'tournament' && (
              <TournamentView
                matches={matches}
                academies={academies}
                players={players}
                onSelectMatch={handleSelectMatch}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'quiniela' && (
              <QuinielaView
                matches={matches}
                onNavigate={handleNavigate}
                onSelectMatch={handleSelectMatch}
              />
            )}

            {currentPage === 'admin' && (
              <AdminView
                products={products}
                matches={matches}
                players={players}
                academies={academies}
                orders={orders}
                settings={settings}
                onRefresh={loadData}
                initialSection={(initialAdminSection as any) || undefined}
              />
            )}
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} settings={settings} />

      {/* Product Quote Modal */}
      {quoteProduct && (
        <ProductQuoteModal
          product={quoteProduct}
          onClose={() => setQuoteProduct(null)}
          onQuoteSent={() => {
            loadData();
          }}
        />
      )}

      {/* Floating WhatsApp Action Pill (Offset above the mobile bottom nav on small screens, bottom-right on desktop) */}
      <aside aria-label="Contacto flotante" className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-30">
        <button
          onClick={handleFloatingWhatsApp}
          className="group flex items-center gap-2.5 p-3.5 sm:px-5 sm:py-3.5 rounded-full bg-[#25D366] hover:bg-[#1ebd59] text-black font-extrabold text-xs sm:text-sm tracking-wide shadow-[0_4px_25px_rgba(37,211,102,0.5)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Hablar por WhatsApp"
        >
          <MessageCircle className="w-5 h-5 fill-current shrink-0" />
          <span className="hidden sm:inline font-bold">Cotizar por WhatsApp</span>
        </button>
      </aside>

      {/* Native-Feeling Mobile Bottom Navigation Dock */}
      <MobileBottomNav
        currentPage={currentPage}
        onNavigate={handleNavigate}
        hasLiveMatch={hasLiveMatch}
        onWhatsAppClick={handleFloatingWhatsApp}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
