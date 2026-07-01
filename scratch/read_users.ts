import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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
  console.log('Connecting to Firebase with project ID:', firebaseConfig.projectId);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  const querySnapshot = await getDocs(collection(db, 'users'));
  console.log(`Found ${querySnapshot.size} users:`);
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`\nDocument ID: ${doc.id}`);
    console.log(`Name: ${data.nombre}`);
    console.log(`Email: ${data.email}`);
    console.log(`Role: ${data.rol}`);
    console.log(`Active: ${data.activo}`);
    console.log(`Permissions:`, JSON.stringify(data.permisos, null, 2));
  });
}

main().catch(console.error);
