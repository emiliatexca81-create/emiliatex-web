import React, { useState } from 'react';
import { Product, OrderQuotation } from '../types';
import { X, MessageCircle, CheckCircle2, Shield, Sparkles, AlertCircle, Layers, Tag } from 'lucide-react';
import { formatWhatsAppLink, addOrder, getSettings } from '../services/storage';

interface ProductQuoteModalProps {
  product: Product | null;
  onClose: () => void;
  onQuoteSent?: () => void;
}

export const ProductQuoteModal: React.FC<ProductQuoteModalProps> = ({
  product,
  onClose,
  onQuoteSent
}) => {
  if (!product) return null;

  const settings = getSettings();
  const [selectedImage, setSelectedImage] = useState(product.images[0] || '');
  const [quantity, setQuantity] = useState(product.minQuantity || 10);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [companyOrTeam, setCompanyOrTeam] = useState('');
  const [sizesBreakdown, setSizesBreakdown] = useState('Ej: 5 en M, 10 en L, 5 en XL');
  const [customizationType, setCustomizationType] = useState('Sublimación Total HD con Escudo y Números');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendQuote = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Por favor ingresa tu nombre y número telefónico para poder asesorarte por WhatsApp.');
      return;
    }

    const orderNumber = `EMX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: OrderQuotation = {
      id: `ord-${Date.now()}`,
      orderNumber,
      date: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      companyOrTeam: companyOrTeam.trim() || 'Particular / Sin especificar',
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: Number(quantity),
          sizes: sizesBreakdown,
          customization: customizationType,
        }
      ],
      totalEstimate: `A cotizar (~${quantity} uds)`,
      status: 'pending',
      notes: notes.trim(),
      whatsappMessageSent: true
    };

    // Save into internal order log for admin panel
    addOrder(newOrder);

    // Build WhatsApp message
    const waMessage = 
`🏆 *NUEVA COTIZACIÓN - EMILIATEX* 🏆
Ref. Pedido: *${orderNumber}*

👤 *Cliente:* ${customerName}
📞 *Teléfono:* ${customerPhone}
🏢 *Equipo/Empresa:* ${companyOrTeam || 'No especificado'}

👕 *Prenda Solicitada:*
• *Producto:* ${product.name}
• *Código:* ${product.sku}
• *Cantidad:* ${quantity} unidades
• *Distribución Tallas:* ${sizesBreakdown}
• *Técnica/Acabado:* ${customizationType}
• *Tela Base:* ${product.fabricMaterial}

📝 *Notas adicionales:* ${notes || 'Sin observaciones adicionales'}

¡Quedo atento a la confirmación de la cotización y tiempos de confección!`;

    const waUrl = formatWhatsAppLink(settings.whatsappNumber, waMessage);
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    setIsSuccess(true);
    if (onQuoteSent) onQuoteSent();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-[#11131b] border border-[#D4AF37]/40 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] overflow-hidden my-6 text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4AF37]/20 bg-[#161824]">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
              {product.category === 'deportivo' ? 'Línea Deportiva' : 'Línea Corporativa'}
            </span>
            <span className="text-xs text-slate-400 font-mono">Ref: {product.sku}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 sm:p-12 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold font-cinzel text-white">¡Cotización Enviada con Éxito!</h3>
            <p className="text-slate-300 max-w-md mx-auto text-sm leading-relaxed">
              Hemos abierto la conversación directa con nuestro asesor por WhatsApp. Tu solicitud también ha quedado registrada en nuestro sistema de pedidos para seguimiento prioritario.
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89726] text-black font-bold text-sm tracking-wide hover:brightness-110 cursor-pointer shadow-lg"
              >
                Cerrar y seguir explorando
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[80vh] overflow-y-auto">
            {/* Left Column: Product Showcase */}
            <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-[#D4AF37]/20 bg-[#0c0e15] space-y-4">
              <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-black/60">
                <img
                  src={selectedImage || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded text-xs font-semibold text-amber-300 border border-amber-300/30">
                  {product.subcategory}
                </div>
              </div>

              {/* Gallery Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border transition-all ${
                        selectedImage === img
                          ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50 scale-105'
                          : 'border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div>
                <h2 className="text-lg font-bold text-white font-cinzel tracking-wide">{product.name}</h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{product.description}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#161824] border border-white/5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-semibold">
                  <Layers className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                  <span>Tela: {product.fabricMaterial}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Tag className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                  <span>Pedido Mínimo: {product.minQuantity} unidades</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Precio Ref: {product.priceEstimate}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <p className="font-semibold text-white">Ventajas de Confección EMILIATEX:</p>
                <ul className="space-y-1">
                  {product.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column: Interactive Quotation Form */}
            <form onSubmit={handleSendQuote} className="lg:col-span-7 p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                  <span>Configurar Pedido por WhatsApp</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sin pasarela de pago. Gestionamos tu cotización de forma directa y personalizada vía WhatsApp.
                </p>
              </div>

              {/* Quantity Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Cantidad de prendas (Mínimo {product.minQuantity} uds):
                </label>
                <div className="flex items-center gap-2">
                  {[product.minQuantity, 20, 50, 100].map(qty => (
                    <button
                      type="button"
                      key={qty}
                      onClick={() => setQuantity(qty)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        quantity === qty
                          ? 'bg-[#D4AF37] text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                          : 'bg-[#1a1c26] text-slate-300 hover:bg-[#252838] border border-white/10'
                      }`}
                    >
                      {qty} uds
                    </button>
                  ))}
                  <input
                    type="number"
                    min={product.minQuantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(product.minQuantity, Number(e.target.value)))}
                    className="w-24 px-3 py-1.5 rounded-lg bg-[#1a1c26] border border-white/10 text-white text-xs font-bold focus:border-[#D4AF37] focus:outline-none"
                    placeholder="Otro"
                  />
                </div>
              </div>

              {/* Breakdown of sizes */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Distribución de Tallas estimada:
                </label>
                <input
                  type="text"
                  value={sizesBreakdown}
                  onChange={(e) => setSizesBreakdown(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1c26] border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                  placeholder="Ej: 5 en S, 10 en M, 5 en L"
                />
              </div>

              {/* Customization type */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Técnica de Personalización Deseada:
                </label>
                <select
                  value={customizationType}
                  onChange={(e) => setCustomizationType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1c26] border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="Sublimación Total HD con Escudo y Números">Sublimación Total HD (Sin límite de colores ni desgaste)</option>
                  <option value="Bordado Computarizado Institucional (Pecho y Mangas)">Bordado Computarizado de Alta Definición</option>
                  <option value="Vinilo Textil Deportivo Premium">Vinilo Textil / DTF Deportivo</option>
                  <option value="Prenda sin personalización (Solo confección base)">Prenda base lisa (Sin estampados)</option>
                </select>
              </div>

              {/* Customer Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Tu Nombre o Contacto <span className="text-red-400">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#1a1c26] border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    WhatsApp / Teléfono <span className="text-red-400">*</span>:
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#1a1c26] border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                    placeholder="Ej. 312 456 7890"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Nombre del Equipo / Academia / Empresa:
                </label>
                <input
                  type="text"
                  value={companyOrTeam}
                  onChange={(e) => setCompanyOrTeam(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1c26] border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                  placeholder="Ej. Real Dorado FC o Inversiones S.A.S."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Observaciones / Colores institucionales:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#1a1c26] border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                  placeholder="Ej: Colores negro y dorado con detalles en blanco. Necesitamos entrega en 15 días."
                />
              </div>

              {/* Submit to WhatsApp Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-black font-extrabold text-sm tracking-wide shadow-[0_0_20px_rgba(37,211,102,0.4)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>ENVIAR COTIZACIÓN POR WHATSAPP</span>
                </button>
                <div className="flex items-center justify-center gap-1.5 mt-2 text-[11px] text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Respuesta en menos de 15 minutos por un asesor de confección EMILIATEX</span>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
