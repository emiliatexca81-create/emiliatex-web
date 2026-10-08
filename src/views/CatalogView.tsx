import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Product, ProductCategory } from '../types';
import { Search, Filter, MessageCircle, Sparkles, Shirt, Building2, Layers, Check, ArrowUpDown } from 'lucide-react';

interface CatalogViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  onSelectProduct
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | ProductCategory>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'name' | 'minQty'>('featured');

  // Compute unique subcategories for current main category
  const availableSubcategories = useMemo(() => {
    const relevant = activeCategory === 'all' 
      ? products 
      : products.filter(p => p.category === activeCategory);
    const set = new Set<string>();
    relevant.forEach(p => set.add(p.subcategory));
    return Array.from(set);
  }, [products, activeCategory]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchSubcategory = activeSubcategory === 'all' || p.subcategory === activeSubcategory;
      const matchSearch = searchTerm === '' || 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.fabricMaterial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.subcategory.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSubcategory && matchSearch;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'minQty') return a.minQuantity - b.minQuantity;
      // Default: featured first
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [products, activeCategory, activeSubcategory, searchTerm, sortBy]);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner - Neo-Futuristic Dribbble */}
      <div className="rounded-3xl neu-card-gold cyber-grid p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px hologram-line" />
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neu-pressed text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
            <Shirt className="w-3.5 h-3.5" />
            <span>Colección Deportiva & Dotación Corporativa</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-cinzel tracking-tight">
            Catálogo Élite & Confección
          </h1>
          <p className="text-xs sm:text-base text-slate-300 leading-relaxed">
            Fabricamos uniformes para torneos, clubes, academias y empresas con materiales de primera línea. Recuerda que no requerimos pasarela de pago: eliges tu diseño y coordinamos la orden directamente por WhatsApp.
          </p>
        </div>

        {/* Informative WhatsApp banner */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl neu-pressed text-xs border border-[#25D366]/30">
          <div className="flex items-center gap-3 text-slate-200">
            <div className="p-2 rounded-xl neu-card text-[#25D366] shrink-0">
              <MessageCircle className="w-4 h-4 fill-current" />
            </div>
            <span>
              <strong className="text-white">Flujo Directo Sin Fricción:</strong> 1. Elige una prenda → 2. Configura tallas y técnica → 3. Se genera un mensaje estructurado para cotizar en tiempo real con nuestro equipo técnico.
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0 px-2.5 py-1 rounded-full neu-card">
            ● ASESORÍA EN VIVO
          </span>
        </div>
      </div>

      {/* Filter and Search Controls - Neumorphic Controls */}
      <div className="space-y-4">
        {/* Main Category Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
            <button
              onClick={() => {
                setActiveCategory('all');
                setActiveSubcategory('all');
              }}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'neu-btn-gold text-black'
                  : 'neu-btn-dark text-slate-300 hover:text-white'
              }`}
            >
              <span>Todos ({products.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveCategory('deportivo');
                setActiveSubcategory('all');
              }}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer ${
                activeCategory === 'deportivo'
                  ? 'neu-btn-gold text-black'
                  : 'neu-btn-dark text-slate-300 hover:text-white'
              }`}
            >
              <Shirt className="w-4 h-4" />
              <span className="sm:hidden">Deportiva ({products.filter(p => p.category === 'deportivo').length})</span>
              <span className="hidden sm:inline">Línea Deportiva ({products.filter(p => p.category === 'deportivo').length})</span>
            </button>

            <button
              onClick={() => {
                setActiveCategory('corporativo');
                setActiveSubcategory('all');
              }}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer ${
                activeCategory === 'corporativo'
                  ? 'neu-btn-gold text-black'
                  : 'neu-btn-dark text-slate-300 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="sm:hidden">Corporativa ({products.filter(p => p.category === 'corporativo').length})</span>
              <span className="hidden sm:inline">Línea Corporativa ({products.filter(p => p.category === 'corporativo').length})</span>
            </button>
          </div>

          {/* Sort selector */}
          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="neu-pressed text-white rounded-xl px-3 py-2 text-xs focus:border-[#D4AF37] focus:outline-none cursor-pointer"
            >
              <option value="featured" className="bg-[#0e1017]">Destacados</option>
              <option value="name" className="bg-[#0e1017]">Nombre (A-Z)</option>
              <option value="minQty" className="bg-[#0e1017]">Menor pedido mínimo</option>
            </select>
          </div>
        </div>

        {/* Subcategory Pills & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Subcategories */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
            <button
              onClick={() => setActiveSubcategory('all')}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeSubcategory === 'all'
                  ? 'neu-pressed-gold text-[#D4AF37]'
                  : 'neu-card text-slate-400 hover:text-white'
              }`}
            >
              Todas las prendas
            </button>
            {availableSubcategories.map(sub => (
              <button
                key={sub}
                onClick={() => setActiveSubcategory(sub)}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeSubcategory === sub
                    ? 'neu-pressed-gold text-[#D4AF37]'
                    : 'neu-card text-slate-400 hover:text-white'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]" />
            <input
              type="text"
              placeholder="Buscar prenda, tela, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl neu-pressed text-white text-xs placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Products Grid - Neumorphic Cards with NeoFuturo entrance transitions */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl neu-card space-y-4">
          <Shirt className="w-12 h-12 mx-auto text-slate-500" />
          <h3 className="text-lg font-bold text-white font-cinzel">No se encontraron prendas</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Prueba ajustando los filtros de categoría o el término de búsqueda.
          </p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setActiveSubcategory('all');
              setSearchTerm('');
            }}
            className="px-5 py-2.5 rounded-xl neu-btn-gold text-black font-extrabold text-xs cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.35, 
                delay: Math.min(idx * 0.04, 0.25), 
                ease: [0.16, 1, 0.3, 1] 
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative flex flex-col justify-between rounded-3xl neu-card overflow-hidden transition-all duration-300 hover:border-[#D4AF37]/50"
            >
              {/* Product Card Image Stage */}
              <div className="relative aspect-[4/3] w-full overflow-hidden p-2">
                <div className="w-full h-full rounded-2xl neu-pressed overflow-hidden relative">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="hud-badge px-2 py-0.5 rounded-md text-[9px] font-mono font-bold text-amber-300 uppercase">
                      {product.subcategory}
                    </span>
                    {product.isFeatured && (
                      <span className="bg-[#D4AF37] text-black px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-sm">
                        TOP ÉLITE
                      </span>
                    )}
                  </div>

                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md neu-pressed text-[9px] font-mono text-slate-300 font-bold">
                    {product.sku}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-[#D4AF37] transition-colors leading-snug font-cinzel">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                  
                  {/* Fabric badge */}
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 font-medium px-2.5 py-1 rounded-lg neu-pressed">
                    <Layers className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                    <span className="truncate">{product.fabricMaterial}</span>
                  </div>
                </div>

                {/* Specs & WhatsApp Action */}
                <div className="pt-3 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl neu-pressed">
                    <span className="text-[11px] text-slate-400">Min. pedido: <strong className="text-white">{product.minQuantity} u.</strong></span>
                    <span className="font-mono text-xs font-black text-amber-300">{product.priceEstimate}</span>
                  </div>

                  <button
                    onClick={() => onSelectProduct(product)}
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#1eb757] text-black font-black text-xs tracking-wider uppercase shadow-[0_4px_15px_rgba(37,211,102,0.3)] hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-current text-black" />
                    <span>COTIZAR EN WHATSAPP</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

    </div>
  );
};
