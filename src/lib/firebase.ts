/**
 * firebase.ts
 * Inicialización de Firebase App, Firestore y Authentication.
 * Las credenciales se leen desde variables de entorno VITE_* (Vite las inyecta en build time).
 * Nunca hardcodear credenciales aquí.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

/** Base de datos Firestore */
export const db = getFirestore(app);

/** Servicio de autenticación */
export const auth = getAuth(app);
