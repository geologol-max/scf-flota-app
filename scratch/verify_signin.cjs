const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function verify() {
  const testUsers = [
    'jovallos@nerachilespa.cl',
    'acampos@nerachilespa.cl',
    'pcaceres@nerachilespa.cl'
  ];

  for (const email of testUsers) {
    try {
      await signInWithEmailAndPassword(auth, email, 'Nera2026!');
      console.log(`SUCCESS: ${email} authenticated cleanly!`);
    } catch (err) {
      console.error(`FAIL: ${email} -> ${err.message}`);
    }
  }
}

verify().catch(console.error);
