import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function main() {
  console.log('Connecting to Firebase...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  const email = 'temp-check@nera.cl';
  const password = 'temporaryPassword123!';

  console.log('Signing in...');
  await signInWithEmailAndPassword(auth, email, password);
  console.log('Authenticated.');

  const adminUser = {
    nombre: 'Administrador',
    email: 'admin@nerachilespa.cl',
    rol: 'Administrador',
    activo: true,
    permisos: {
      ver_dashboard: true,
      ver_mapas: true,
      ver_flota: true,
      editar_flota: true,
      ver_documentos: true,
      cargar_documentos: true,
      descargar_documentos: true,
      movimientos_flota: true,
      incidentes_siniestros: true,
      mantenimientos: true,
      gestionar_usuarios: true,
      descargar_auditoria: true,
      carga_masiva: true,
      gestion_supervisores: true,
    },
    _createdAt: serverTimestamp(),
  };

  console.log('Adding Administrator user to Firestore...');
  const docRef = await addDoc(collection(db, 'users'), adminUser);
  console.log('Administrator user added with ID:', docRef.id);
}

main().catch(console.error);
