/**
 * firebase.ts
 * Inicialización de Firebase App, Firestore y Authentication.
 * Las credenciales se leen desde variables de entorno VITE_* (Vite las inyecta en build time).
 * Nunca hardcodear credenciales aquí.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/** Base de datos Firestore con conexión directa y sincronización en tiempo real */
export const db = getFirestore(app);

/** Servicio de autenticación */
export const auth = getAuth(app);

