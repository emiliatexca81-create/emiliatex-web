import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  Check, 
  Sparkles, 
  Trophy, 
  Camera, 
  AlertCircle, 
  Shield, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { TournamentPhoto, Academy, TournamentCategory, TOURNAMENT_CATEGORIES, TOURNAMENT_PHOTO_CATEGORIES } from '../types';
import { uploadFileToStorage, StorageUploadProgress } from '../services/firebase';
import { saveTournamentPhoto } from '../services/storage';

interface UploadTournamentPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  academies?: Academy[];
  onSuccess?: (photo: TournamentPhoto) => void;
}

export const UploadTournamentPhotoModal: React.FC<UploadTournamentPhotoModalProps> = ({
  isOpen,
  onClose,
  academies = [],
  onSuccess
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadedStorageUrl, setUploadedStorageUrl] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [category, setCategory] = useState<string>('Sub-15');
  const [jornada, setJornada] = useState<string>('Jornada 1');
  const [teamName, setTeamName] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('#TorneoElite, #PasionFutbolera');
  const [featured, setFeatured] = useState<boolean>(false);

  // Upload progress states
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successSaved, setSuccessSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);
    setUploadedStorageUrl('');
    setSuccessSaved(false);

    // Create local preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Auto-fill title if empty
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  // Upload to Storage & Save to Firestore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !uploadedStorageUrl && !previewUrl) {
      setErrorMessage('Debes seleccionar una imagen para subir.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Por favor escribe un título para la fotografía.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setUploadProgress(0);
    setUploadStatusText('Optimizando y preparando imagen...');

    try {
      let finalImageUrl = uploadedStorageUrl;

      // Upload to Firebase Storage if a file was chosen
      if (selectedFile) {
        setUploadStatusText('Subiendo a Firebase Storage...');
        finalImageUrl = await uploadFileToStorage(selectedFile, {
          folder: 'tournament',
          maxWidth: 1920,
          maxHeight: 1440,
          quality: 0.88,
          onProgress: (p: StorageUploadProgress) => {
            setUploadProgress(p.percent);
            setUploadStatusText(`Subiendo a Storage: ${p.percent}% (${p.bytesTransferred} de ${p.totalBytes} bytes)`);
          }
        });
        setUploadedStorageUrl(finalImageUrl);
      } else if (!finalImageUrl && previewUrl) {
        finalImageUrl = previewUrl;
      }

      setUploadStatusText('Guardando datos en la Galería Oficial...');

      // Parse tags
      const parsedTags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => (t.startsWith('#') ? t : `#${t}`));

      const newPhoto: TournamentPhoto = {
        id: `tp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: title.trim(),
        caption: caption.trim() || undefined,
        imageUrl: finalImageUrl,
        category: category,
        jornada: jornada.trim() || undefined,
        teamName: teamName.trim() || undefined,
        likesCount: 0,
        tags: parsedTags,
        createdAt: new Date().toISOString(),
        featured: featured
      };

      // Save to persistence & Firestore
      await saveTournamentPhoto(newPhoto);

      setSuccessSaved(true);
      setUploadProgress(100);
      setUploadStatusText('¡Foto publicada con éxito en la Galería!');

      if (onSuccess) {
        onSuccess(newPhoto);
      }

      // Reset after short delay
      setTimeout(() => {
        handleReset();
        onClose();
      }, 1400);

    } catch (err: any) {
      console.error('Error uploading tournament photo:', err);
      setErrorMessage(err.message || 'Error al subir la imagen. Verifica tu conexión.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadedStorageUrl('');
    setTitle('');
    setCaption('');
    setTagsInput('#TorneoElite, #PasionFutbolera');
    setFeatured(false);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatusText('');
    setErrorMessage('');
    setSuccessSaved(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-3xl neu-card border border-amber-400/40 bg-[#12131F] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#171824] via-[#211F18] to-[#171824]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-btn-gold text-black flex items-center justify-center font-black">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black font-cinzel text-white flex items-center gap-2">
                Subir Foto a la Galería Oficial
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono border border-amber-400/30">
                  Storage Directo
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Se optimiza automáticamente y se publica en el feed social del torneo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="p-2 rounded-xl neu-btn-dark text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          
          {/* File Dropzone & Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Fotografía del Encuentro / Ceremonia *
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden p-4 text-center ${
                previewUrl 
                  ? 'border-amber-400/50 bg-black/60' 
                  : 'border-white/15 bg-black/30 hover:border-amber-400/60 hover:bg-black/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                <div className="space-y-3">
                  <div className="relative max-h-56 mx-auto rounded-xl overflow-hidden bg-black flex items-center justify-center">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-h-56 w-auto object-contain rounded-lg" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2">
                      <Camera className="w-4 h-4 text-amber-300" />
                      <span>Cambiar imagen</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {selectedFile ? `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)` : 'Imagen seleccionada'}
                  </p>
                </div>
              ) : (
                <div className="py-8 space-y-3">
                  <div className="w-14 h-14 rounded-2xl neu-card-gold text-black flex items-center justify-center mx-auto">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Haz clic para seleccionar o arrastra una fotografía aquí
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Soporta JPG, PNG, WEBP (Se comprime y sube a Firebase Storage)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="rounded-2xl neu-card p-4 space-y-2 border border-amber-400/40 bg-amber-400/5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-amber-300 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>{uploadStatusText}</span>
                </span>
                <span className="font-mono text-white">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-[#D4AF37] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {successSaved && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{uploadStatusText}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Details Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Title */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300">
                Título de la Foto *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Gran Atajada en la Semifinal Sub-15"
                required
                className="w-full neu-input px-3.5 py-2.5 rounded-xl text-xs text-white bg-[#141520] border border-white/10 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">
                Categoría *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full neu-input px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#141520] border border-white/10 focus:border-[#D4AF37] focus:outline-none cursor-pointer"
              >
                {TOURNAMENT_PHOTO_CATEGORIES.filter(c => c !== 'Todos').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Jornada / Etapa */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">
                Fecha / Jornada
              </label>
              <input
                type="text"
                value={jornada}
                onChange={(e) => setJornada(e.target.value)}
                placeholder="Ej: Jornada 1, Semifinales, Gran Final"
                className="w-full neu-input px-3.5 py-2.5 rounded-xl text-xs text-white bg-[#141520] border border-white/10 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            {/* Team / Club Selector */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300">
                Equipo / Academia Asociada (Opcional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full neu-input px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#141520] border border-white/10 focus:border-[#D4AF37] focus:outline-none cursor-pointer"
                >
                  <option value="">Selecciona del torneo...</option>
                  {academies.map(a => (
                    <option key={a.id} value={a.name}>{a.name} ({a.city})</option>
                  ))}
                  <option value="Todas las Delegaciones">Todas las Delegaciones</option>
                  <option value="Tribuna y Familias">Tribuna y Familias</option>
                </select>

                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="O escribe nombre personalizado..."
                  className="w-full neu-input px-3.5 py-2.5 rounded-xl text-xs text-white bg-[#141520] border border-white/10 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>

            {/* Caption / Descripción */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300">
                Descripción / Pie de Foto (Estilo Red Social)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="Cuenta lo que ocurrió en esta jugada o momento especial del torneo..."
                className="w-full neu-input px-3.5 py-2.5 rounded-xl text-xs text-white bg-[#141520] border border-white/10 focus:border-[#D4AF37] focus:outline-none resize-none"
              />
            </div>

            {/* Hashtags */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300">
                Hashtags (separados por coma)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Ej: #TorneoElite, #Sub15, #Golazo, #FairPlay"
                className="w-full neu-input px-3.5 py-2.5 rounded-xl text-xs text-white bg-[#141520] border border-white/10 focus:border-[#D4AF37] focus:outline-none font-mono"
              />
            </div>

            {/* Featured Checkbox */}
            <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-xl neu-pressed bg-black/40 border border-white/5">
              <input
                type="checkbox"
                id="photoFeaturedToggle"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-[#D4AF37] focus:ring-[#D4AF37] bg-[#141520] border-white/20 cursor-pointer"
              />
              <label htmlFor="photoFeaturedToggle" className="text-xs text-slate-300 cursor-pointer flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Marcar como foto Destacada (aparece con insignia dorada en el feed)</span>
              </label>
            </div>

          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl neu-btn-dark text-slate-300 text-xs font-bold hover:text-white cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isUploading || (!selectedFile && !uploadedStorageUrl && !previewUrl)}
              className="px-6 py-2.5 rounded-xl neu-btn-gold text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Subiendo a Storage...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-black" />
                  <span>Publicar en la Galería</span>
                </>
              )}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
};
