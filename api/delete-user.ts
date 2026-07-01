import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// 1. Inicialización de Firebase Admin SDK
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'scf-flota';

if (!getApps().length) {
  if (clientEmail && privateKey) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin SDK inicializado exitosamente.');
    } catch (initErr) {
      console.error('Error al inicializar Firebase Admin:', initErr);
    }
  } else {
    console.warn('Firebase Admin no inicializado: Faltan credenciales de cuenta de servicio.');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir solicitudes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Validar que la cuenta de servicio esté configurada en el servidor
  if (!getApps().length) {
    return res.status(500).json({
      error: 'firebase-admin-not-configured',
      message: 'Las credenciales de Cuenta de Servicio no están configuradas en las variables de entorno de Vercel.',
    });
  }

  // 3. Extraer el token de autorización
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado. Token inexistente.' });
  }
  const idToken = authHeader.split(' ')[1];

  // 4. Validar los parámetros del body
  const { uid } = req.body as { uid?: string };

  if (!uid) {
    return res.status(400).json({ error: 'El parámetro uid es requerido en el cuerpo de la solicitud.' });
  }

  try {
    const auth = getAuth();
    const db = getFirestore();

    // 5. Verificar el token del administrador que llama a la API
    const decodedToken = await auth.verifyIdToken(idToken);
    const callerEmail = decodedToken.email;
    const callerUid = decodedToken.uid;

    if (!callerEmail) {
      return res.status(403).json({ error: 'El token no contiene un correo válido.' });
    }

    // Seguridad: Impedir que un administrador se elimine a sí mismo
    if (uid === callerUid) {
      return res.status(400).json({ error: 'No se permite la auto-eliminación de la cuenta de administrador activa.' });
    }

    // 6. Consultar los permisos del llamador en Firestore
    const usersSnap = await db
      .collection('users')
      .where('email', '==', callerEmail.toLowerCase())
      .limit(1)
      .get();

    if (usersSnap.empty) {
      return res.status(403).json({ error: 'Su cuenta no está registrada en la base de datos de perfiles.' });
    }

    const callerDoc = usersSnap.docs[0].data();
    if (!callerDoc.permisos?.gestionar_usuarios) {
      return res.status(403).json({ error: 'No cuenta con autorización para eliminar perfiles de usuario.' });
    }

    // 7. Eliminar el usuario en Firebase Authentication
    console.log(`Eliminando usuario de Auth con UID: ${uid}`);
    try {
      await auth.deleteUser(uid);
    } catch (authErr: any) {
      // Si no existe en Auth (por ejemplo si fue creado manualmente en Firestore), proceder con borrar en Firestore
      if (authErr.code !== 'auth/user-not-found') {
        throw authErr;
      }
      console.warn(`El usuario ${uid} no existía en Firebase Auth. Procediendo con el documento en Firestore.`);
    }

    // 8. Eliminar el documento del perfil en Firestore
    await db.collection('users').doc(uid).delete();
    console.log(`Documento de perfil eliminado en Firestore para UID: ${uid}`);

    return res.status(200).json({
      status: 'success',
      message: 'Usuario eliminado permanentemente de Firebase Auth y Firestore con éxito.',
    });

  } catch (err: any) {
    console.error('Error al eliminar usuario:', err);
    return res.status(500).json({ error: `Error interno al eliminar el usuario: ${err.message}` });
  }
}
