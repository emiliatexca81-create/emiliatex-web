import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytes, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  StorageReference
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Primary Storage Bucket
export const STORAGE_BUCKET = firebaseConfig.storageBucket || 'potent-quest-cq6d2.firebasestorage.app';
export const storage = getStorage(app, `gs://${STORAGE_BUCKET}`);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Error handling conforming to Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// -------------------------------------------------------------
// FIREBASE STORAGE ARCHITECTURE & UPLOAD PIPELINE
// -------------------------------------------------------------

export type StorageFolder = 'catalog' | 'teams' | 'players' | 'matches' | 'branding' | 'uploads';

export interface StorageUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percent: number;
  status: string;
}

export interface StorageUploadOptions {
  folder?: StorageFolder | string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  onProgress?: (progress: StorageUploadProgress) => void;
  customPrefix?: string;
  timeoutMs?: number;
}

export interface UploadResult {
  url: string;
  storagePath: string;
  source: 'firebase_storage' | 'optimized_fallback';
  contentType: string;
  fileName: string;
  sizeBytes: number;
}

/**
 * Pre-optimizes images client-side before sending to Cloud Storage.
 * Reduces 5MB-15MB camera photos to 100-300KB high-definition WebP/JPEG/PNG,
 * making upload instant and preventing mobile network timeouts.
 */
export async function fileToOptimizedBlob(
  file: File,
  maxWidth: number = 1600,
  maxHeight: number = 1600,
  quality: number = 0.88
): Promise<{ blob: Blob; mimeType: string; dataUrl: string; width: number; height: number }> {
  return new Promise((resolve) => {
    // If not an image or is SVG/GIF (which should not be recompressed), return original file
    if (!file.type || !file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          blob: file,
          mimeType: file.type || 'application/octet-stream',
          dataUrl: (e.target?.result as string) || '',
          width: 0,
          height: 0
        });
      };
      reader.onerror = () => {
        resolve({
          blob: file,
          mimeType: file.type || 'application/octet-stream',
          dataUrl: '',
          width: 0,
          height: 0
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = (e.target?.result as string) || '';
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve({ blob: file, mimeType: file.type, dataUrl: rawDataUrl, width, height });
            return;
          }

          const isPng = file.type === 'image/png';
          // Preserve transparency for PNG logos
          if (!isPng) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }
          ctx.drawImage(img, 0, 0, width, height);

          const targetMime = isPng ? 'image/png' : 'image/jpeg';
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const optimizedDataUrl = canvas.toDataURL(targetMime, quality);
                resolve({ blob, mimeType: targetMime, dataUrl: optimizedDataUrl, width, height });
              } else {
                resolve({ blob: file, mimeType: file.type, dataUrl: rawDataUrl, width, height });
              }
            },
            targetMime,
            quality
          );
        } catch {
          resolve({ blob: file, mimeType: file.type, dataUrl: rawDataUrl, width: img.width, height: img.height });
        }
      };
      img.onerror = () => {
        resolve({ blob: file, mimeType: file.type, dataUrl: rawDataUrl, width: 0, height: 0 });
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      resolve({ blob: file, mimeType: file.type || 'application/octet-stream', dataUrl: '', width: 0, height: 0 });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Helper to convert any image file to an optimized, lightweight Data URL fallback
 */
export async function fileToOptimizedDataUrl(file: File, maxWidth: number = 800, maxHeight: number = 800): Promise<string> {
  const result = await fileToOptimizedBlob(file, maxWidth, maxHeight, 0.85);
  return result.dataUrl;
}

/**
 * Sanitizes a filename for Firebase Storage
 */
function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_+/g, '_');
}

/**
 * Main Firebase Storage upload function for catalog garments, team crests, player photos, etc.
 * Uploads to Firebase Storage with proper MIME metadata, resumable progress tracking,
 * and resilient fallback.
 */
export async function uploadFileToStorage(
  file: File, 
  folderOrOptions: string | StorageUploadOptions = 'uploads'
): Promise<string> {
  const options: StorageUploadOptions = typeof folderOrOptions === 'string'
    ? { folder: folderOrOptions }
    : folderOrOptions;

  const folder = options.folder || 'uploads';
  const onProgress = options.onProgress;
  const timeoutMs = options.timeoutMs || 25000;

  // Tailored dimension limits per folder
  let maxW = options.maxWidth || 1600;
  let maxH = options.maxHeight || 1600;
  if (folder === 'teams' || folder === 'branding') {
    maxW = options.maxWidth || 1000;
    maxH = options.maxHeight || 1000;
  } else if (folder === 'players') {
    maxW = options.maxWidth || 900;
    maxH = options.maxHeight || 900;
  }

  onProgress?.({
    bytesTransferred: 0,
    totalBytes: file.size,
    percent: 10,
    status: 'Optimizando imagen para alta velocidad...'
  });

  // Step 1: Pre-optimize client-side
  const optimized = await fileToOptimizedBlob(file, maxW, maxH, options.quality || 0.88);

  const cleanBaseName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ''));
  const fileExt = optimized.mimeType === 'image/png' 
    ? 'png' 
    : optimized.mimeType === 'image/webp' 
      ? 'webp' 
      : 'jpg';
  
  const storagePath = `${folder}/${Date.now()}_${cleanBaseName}.${fileExt}`;

  // Step 2: Attempt Firebase Cloud Storage upload
  const uploadToStorage = async (): Promise<string> => {
    onProgress?.({
      bytesTransferred: 0,
      totalBytes: optimized.blob.size,
      percent: 25,
      status: 'Conectando con Firebase Storage...'
    });

    const fileRef: StorageReference = storageRef(storage, storagePath);
    const metadata = {
      contentType: optimized.mimeType,
      cacheControl: 'public, max-age=31536000',
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        folder,
        app: 'EMILIATEX C.A',
        uploader: auth.currentUser?.email || 'admin'
      }
    };

    const uploadTask = uploadBytesResumable(fileRef, optimized.blob, metadata);

    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progressPercent = Math.round(
            25 + (snapshot.bytesTransferred / (snapshot.totalBytes || 1)) * 70
          );
          onProgress?.({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percent: Math.min(progressPercent, 95),
            status: `Subiendo a Firebase Storage (${Math.round(snapshot.bytesTransferred / 1024)} KB)...`
          });
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            onProgress?.({
              bytesTransferred: optimized.blob.size,
              totalBytes: optimized.blob.size,
              percent: 100,
              status: '¡Imagen cargada exitosamente en Firebase Storage!'
            });
            resolve(downloadUrl);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  };

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Firebase Storage timeout')), timeoutMs);
  });

  try {
    const downloadUrl = await Promise.race([uploadToStorage(), timeoutPromise]);
    console.info(`✓ [Firebase Storage] Archivo subido en ${storagePath}: ${downloadUrl}`);
    return downloadUrl;
  } catch (err: any) {
    console.warn(`[Firebase Storage fallback] Advertencia: ${err?.code || err?.message}. Usando formato optimizado directo.`);
    
    // Fallback to high-res optimized data URL
    if (optimized.dataUrl) {
      onProgress?.({
        bytesTransferred: optimized.blob.size,
        totalBytes: optimized.blob.size,
        percent: 100,
        status: '¡Imagen optimizada y lista!'
      });
      return optimized.dataUrl;
    }
    throw err;
  }
}

/**
 * Upload multiple files to Firebase Storage in parallel or sequentially
 */
export async function uploadMultipleFilesToStorage(
  files: FileList | File[],
  options: StorageUploadOptions = {}
): Promise<string[]> {
  const fileArray = Array.from(files);
  const results: string[] = [];

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    const subProgress = options.onProgress 
      ? (p: StorageUploadProgress) => {
          const overallPercent = Math.round(((i + (p.percent / 100)) / fileArray.length) * 100);
          options.onProgress?.({
            bytesTransferred: p.bytesTransferred,
            totalBytes: p.totalBytes,
            percent: overallPercent,
            status: `Archivo ${i + 1} de ${fileArray.length}: ${p.status}`
          });
        }
      : undefined;

    const url = await uploadFileToStorage(file, { ...options, onProgress: subProgress });
    results.push(url);
  }

  return results;
}

/**
 * Diagnostic tool to verify live connection to Firebase Storage
 */
export async function testStorageConnection(): Promise<{
  success: boolean;
  bucket: string;
  message: string;
  latencyMs: number;
  testUrl?: string;
}> {
  const start = performance.now();
  const testFileName = `_diagnostic/ping_${Date.now()}.txt`;
  const testRef = storageRef(storage, testFileName);

  try {
    const pingBlob = new Blob([`EMILIATEX Storage Ping: ${new Date().toISOString()}`], { type: 'text/plain' });
    const snapshot = await uploadBytes(testRef, pingBlob, {
      contentType: 'text/plain',
      customMetadata: { test: 'true' }
    });
    const url = await getDownloadURL(snapshot.ref);
    const latencyMs = Math.round(performance.now() - start);

    // Clean up test file silently
    try {
      await deleteObject(testRef);
    } catch {
      // ignore deletion error on ping
    }

    return {
      success: true,
      bucket: STORAGE_BUCKET,
      message: `Conexión exitosa a Firebase Storage bucket "${STORAGE_BUCKET}" (${latencyMs}ms)`,
      latencyMs,
      testUrl: url
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      success: false,
      bucket: STORAGE_BUCKET,
      message: `Error conectando con Firebase Storage: ${err?.code || err?.message || 'Error desconocido'}.`,
      latencyMs
    };
  }
}
