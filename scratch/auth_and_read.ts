import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
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

  console.log('Attempting login...');
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log('Signed in successfully.');
  } catch (e: any) {
    if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
      console.log('User not found. Attempting to create temporary auth account...');
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('Auth account created and signed in.');
      } catch (createErr) {
        console.error('Failed to create auth account:', createErr);
        return;
      }
    } else {
      console.error('Failed to sign in:', e);
      return;
    }
  }

  // Fetch users collection
  const querySnapshot = await getDocs(collection(db, 'users'));
  console.log(`\nFound ${querySnapshot.size} user documents in Firestore:`);
  querySnapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    console.log(`- ID: ${docSnapshot.id} | Name: ${data.nombre} | Email: ${data.email} | Role: ${data.rol} | Active: ${data.activo}`);
    console.log(`  Permissions:`, JSON.stringify(data.permisos));
  });
}

main().catch(console.error);
