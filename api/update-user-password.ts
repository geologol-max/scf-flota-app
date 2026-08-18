import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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
    } catch (initErr) {
      console.error('Error al inicializar Firebase Admin:', initErr);
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!getApps().length) {
    return res.status(500).json({
      error: 'firebase-admin-not-configured',
      message: 'Credenciales de Firebase Admin no configuradas en el servidor.',
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado. Token inexistente.' });
  }
  const idToken = authHeader.split(' ')[1];

  const { targetEmail, newPassword } = req.body as {
    targetEmail?: string;
    newPassword?: string;
  };

  if (!targetEmail || !newPassword) {
    return res.status(400).json({ error: 'Faltan parámetros obligatorios: targetEmail, newPassword.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const auth = getAuth();
    const db = getFirestore();

    const decodedToken = await auth.verifyIdToken(idToken);
    const callerEmail = decodedToken.email;

    if (!callerEmail) {
      return res.status(403).json({ error: 'El token no contiene un correo válido.' });
    }

    let usersSnap = await db
      .collection('users')
      .where('email', '==', callerEmail.toLowerCase())
      .limit(1)
      .get();

    if (usersSnap.empty) {
      return res.status(403).json({ error: `Su cuenta (${callerEmail}) no está registrada en la base de datos.` });
    }

    const callerDoc = usersSnap.docs[0].data();
    if (!callerDoc.permisos?.gestionar_usuarios) {
      return res.status(403).json({ error: 'No cuenta con autorización para modificar contraseñas de otros usuarios.' });
    }

    const targetUserRecord = await auth.getUserByEmail(targetEmail.toLowerCase());
    await auth.updateUser(targetUserRecord.uid, {
      password: newPassword,
    });

    return res.status(200).json({
      status: 'success',
      message: `Contraseña para ${targetEmail} actualizada con éxito en Firebase Auth.`,
    });
  } catch (err: any) {
    console.error('Error al actualizar contraseña:', err);
    return res.status(500).json({ error: `Error al actualizar contraseña: ${err.message}` });
  }
}
