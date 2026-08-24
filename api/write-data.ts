import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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
      console.error('Error initializing Firebase Admin in write-data:', err);
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { action, collection: collName, id, data } = req.body;

    if (!action || !collName) {
      return res.status(400).json({ error: 'Missing action or collection parameter' });
    }

    const db = getFirestore();
    const ref = db.collection(collName);

    if (action === 'add') {
      const docData = {
        ...data,
        _createdAt: FieldValue.serverTimestamp(),
      };
      const docRef = await ref.add(docData);
      return res.status(200).json({ success: true, id: docRef.id });
    }

    if (action === 'update') {
      if (!id) return res.status(400).json({ error: 'Missing ID for update operation' });
      await ref.doc(id).update({
        ...data,
        _updatedAt: FieldValue.serverTimestamp(),
      });
      return res.status(200).json({ success: true });
    }

    if (action === 'delete') {
      if (!id) return res.status(400).json({ error: 'Missing ID for delete operation' });
      await ref.doc(id).delete();
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action specified' });
  } catch (error: any) {
    console.error('Error executing database write:', error);
    return res.status(500).json({
      error: 'internal-error',
      message: error.message || 'Error processing database write',
    });
  }
}
