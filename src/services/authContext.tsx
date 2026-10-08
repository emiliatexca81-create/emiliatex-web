import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from './firebase';

export const PRIMARY_ADMIN_EMAIL = 'emiliatexca81@gmail.com';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAdmin: false,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
  authError: null,
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
        // Check if user is the primary admin or in the /admins collection
        const isPrimaryAdmin = user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();

        if (isPrimaryAdmin) {
          setIsAdmin(true);
          // Ensure admin record in Firestore exists
          try {
            const adminDocRef = doc(db, 'admins', user.uid);
            await setDoc(adminDocRef, {
              email: user.email,
              role: 'admin',
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          } catch (err) {
            console.warn('Could not sync admin document:', err);
          }
        } else {
          // Check in Firestore /admins collection
          try {
            const adminDocRef = doc(db, 'admins', user.uid);
            const adminDocSnap = await getDoc(adminDocRef);
            setIsAdmin(adminDocSnap.exists() && adminDocSnap.data()?.role === 'admin');
          } catch {
            setIsAdmin(false);
          }
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
      const user = result.user;
      const isPrimary = user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
      if (isPrimary) {
        setIsAdmin(true);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setAuthError(err?.message || 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAdmin(false);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAdmin, loading, loginWithGoogle, logout, authError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
