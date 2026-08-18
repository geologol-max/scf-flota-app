const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
require('dotenv').config({ path: '.env.local' });

const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'scf-flota';

initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const auth = getAuth();

async function resetPasswords() {
  const usersToUpdate = [
    { email: 'jovallos@nerachilespa.cl', pass: 'Nera2026!' },
    { email: 'acampos@nerachilespa.cl', pass: 'Nera2026!' },
    { email: 'pcaceres@nerachilespa.cl', pass: 'Nera2026!' },
  ];

  for (const item of usersToUpdate) {
    try {
      const userRecord = await auth.getUserByEmail(item.email);
      await auth.updateUser(userRecord.uid, {
        password: item.pass,
      });
      console.log(`✓ Password updated successfully for: ${item.email} -> ${item.pass}`);
    } catch (err) {
      console.error(`✗ Error updating ${item.email}:`, err.message);
    }
  }
}

resetPasswords().catch(console.error);
