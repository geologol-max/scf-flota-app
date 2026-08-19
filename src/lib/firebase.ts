/**
 * firebase.ts
 * Inicialización de Firebase App, Firestore y Authentication.
 * Las credenciales se leen desde variables de entorno VITE_* (Vite las inyecta en build time).
 * Nunca hardcodear credenciales aquí.
 */
import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const cleanEnv = (val?: string): string => (val || '').replace(/^["']|["']$/g, '').trim();

const firebaseConfig = {
  apiKey: cleanEnv(import.meta.env.VITE_FIREBASE_API_KEY) || "AIzaSyBQGTWzfWyOKZGdwyoij3OcSNN34YTiyqA",
  authDomain: cleanEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || "scf-flota.firebaseapp.com",
  projectId: cleanEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID) || "scf-flota",
  storageBucket: cleanEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || "scf-flota.firebasestorage.app",
  messagingSenderId: cleanEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || "837756260280",
  appId: cleanEnv(import.meta.env.VITE_FIREBASE_APP_ID) || "1:837756260280:web:036dd797e36ae0a574094d",
};

const app = initializeApp(firebaseConfig);

/** Base de datos Firestore con persistencia local (IndexedDB) para carga ultrarrápida */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

/** Servicio de autenticación */
export const auth = getAuth(app);
