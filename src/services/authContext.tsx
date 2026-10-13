import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

export const PRIMARY_ADMIN_EMAIL = 'emiliatexca81@gmail.com';

function formatAuthError(err: any): string {
  const code = err?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos. Verifica que los datos coincidan con los registrados en Firebase Authentication.';
    case 'auth/invalid-email':
      return 'El formato de correo no es válido.';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido inhabilitada en Firebase Authentication.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Espera unos momentos o restablece tu contraseña.';
    case 'auth/email-already-in-use':
      return 'Este correo ya se encuentra registrado.';
    case 'auth/weak-password':
      return 'La contraseña debe contener al menos 6 caracteres.';
    case 'auth/popup-closed-by-user':
      return 'Se cerró la ventana emergente antes de completar el inicio de sesión.';
    case 'auth/network-request-failed':
      return 'Error de red. Verifica tu conexión a internet.';
    default:
      return err?.message || 'Error al autenticar en Firebase';
  }
}

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmailPassword: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  sendResetPasswordEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  authError: string | null;
  setAuthError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAdmin: false,
  loading: true,
  loginWithGoogle: async () => {},
  loginWithEmailPassword: async () => ({ success: false }),
  registerWithEmailPassword: async () => ({ success: false }),
  sendResetPasswordEmail: async () => ({ success: false }),
  logout: async () => {},
  authError: null,
  setAuthError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthError(null);

      if (user) {
        // Any user registered and authenticated in Firebase Authentication for this project is an administrator
        setIsAdmin(true);

        // Sync admin document in Firestore
        try {
          const adminDocRef = doc(db, 'admins', user.uid);
          await setDoc(adminDocRef, {
            email: user.email,
            role: 'admin',
            lastLogin: new Date().toISOString(),
          }, { merge: true });
        } catch (err) {
          console.warn('Could not sync admin document in Firestore:', err);
        }
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setIsAdmin(true);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      const msg = formatAuthError(err);
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmailPassword = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (result.user) {
        setIsAdmin(true);
      }
      return { success: true };
    } catch (err: any) {
      console.error('Email/Password Sign In Error:', err);
      const msg = formatAuthError(err);
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmailPassword = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (result.user) {
        setIsAdmin(true);
      }
      return { success: true };
    } catch (err: any) {
      console.error('Register Error:', err);
      const msg = formatAuthError(err);
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const sendResetPasswordEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: any) {
      console.error('Password Reset Error:', err);
      const msg = formatAuthError(err);
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAdmin(false);
      setAuthError(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isAdmin, 
      loading, 
      loginWithGoogle, 
      loginWithEmailPassword,
      registerWithEmailPassword,
      sendResetPasswordEmail,
      logout, 
      authError,
      setAuthError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
