/**
 * useAuth.ts
 * Hook de autenticación Firebase.
 * Expone el usuario actual, estado de carga, y funciones signIn / signOut.
 */
import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Escucha cambios de sesión en tiempo real
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      // Mensajes de error amigables en español
      const errorMessages: Record<string, string> = {
        'auth/user-not-found': 'No existe un usuario con ese correo.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/invalid-email': 'El formato del correo no es válido.',
        'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
        'auth/invalid-credential': 'Credenciales inválidas. Verifica tu correo y contraseña.',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
      };
      const code = firebaseError.code ?? '';
      setError(errorMessages[code] ?? 'Error al iniciar sesión. Intenta nuevamente.');
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
  };

  return { user, loading, error, signIn, signOut };
}
