import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'scf-flota';

if (!getApps().length) {
  if (clientEmail && privateKey) {
    try {
      const processedKey = privateKey.replace(/\\n/g, '\n');
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: processedKey,
        }),
      });
    } catch (err) {
      console.error('Error initializing Firebase Admin in sync-data:', err);
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const db = getFirestore();

    const [vSnap, mSnap, movSnap, incSnap, uSnap, sSnap, wSnap] = await Promise.all([
      db.collection('vehicles').get(),
      db.collection('maintenanceLogs').get(),
      db.collection('movementLogs').get(),
      db.collection('incidents').get(),
      db.collection('users').get(),
      db.collection('supervisorLogs').get(),
      db.collection('workshopLogs').get(),
    ]);

    const vehicles = vSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const maintenanceLogs = mSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const movementLogs = movSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const incidents = incSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const users = uSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const supervisorLogs = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const workshopLogs = wSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return res.status(200).json({
      success: true,
      data: {
        vehicles,
        maintenanceLogs,
        movementLogs,
        incidents,
        users,
        supervisorLogs,
        workshopLogs,
      },
    });
  } catch (error: any) {
    console.error('Error fetching fleet data in sync-data:', error);
    return res.status(500).json({
      error: 'internal-error',
      message: error.message || 'Error fetching data from Firestore',
    });
  }
}
