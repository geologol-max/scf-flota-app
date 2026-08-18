const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'scf-flota';

if (!clientEmail || !privateKey) {
  console.error('Missing Firebase Admin credentials in .env.local');
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const auth = getAuth();
const db = getFirestore();

async function main() {
  console.log('--- FIREBASE AUTH USERS ---');
  const listUsersResult = await auth.listUsers();
  listUsersResult.users.forEach((userRecord) => {
    console.log(`- UID: ${userRecord.uid} | Email: ${userRecord.email} | Disabled: ${userRecord.disabled}`);
  });

  console.log('\n--- FIRESTORE PROFILE USERS ---');
  const snapshot = await db.collection('users').get();
  snapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`- DocID: ${doc.id} | Name: ${data.nombre} | Email: ${data.email} | Role: ${data.rol}`);
  });
}

main().catch(console.error);
