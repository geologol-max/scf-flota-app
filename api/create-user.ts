import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// 1. Inicialización segura de Firebase Admin SDK
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'scf-flota';

if (!admin.apps.length) {
  if (clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
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
  if (!admin.apps.length) {
    return res.status(500).json({
      error: 'firebase-admin-not-configured',
      message: 'Las credenciales de Cuenta de Servicio (FIREBASE_ADMIN_CLIENT_EMAIL y FIREBASE_ADMIN_PRIVATE_KEY) no están configuradas en las variables de entorno de Vercel.',
    });
  }

  // 3. Extraer el token de autorización
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado. Token inexistente.' });
  }
  const idToken = authHeader.split(' ')[1];

  // 4. Validar los parámetros del body
  const { name, email, password, role } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: 'Administrador' | 'Gestor' | 'Operador';
  };

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Faltan parámetros obligatorios: name, email, password, role.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    // 5. Verificar el token del administrador que llama a la API
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const callerEmail = decodedToken.email;

    if (!callerEmail) {
      return res.status(403).json({ error: 'El token no contiene un correo válido.' });
    }

    // 6. Consultar los permisos del llamador en Firestore
    const usersSnap = await admin
      .firestore()
      .collection('users')
      .where('email', '==', callerEmail.toLowerCase())
      .limit(1)
      .get();

    if (usersSnap.empty) {
      return res.status(403).json({ error: 'Su cuenta no está registrada en la base de datos de perfiles.' });
    }

    const callerDoc = usersSnap.docs[0].data();
    if (!callerDoc.permisos?.gestionar_usuarios) {
      return res.status(403).json({ error: 'No cuenta con autorización para gestionar y crear perfiles de usuario.' });
    }

    // 7. Crear el usuario en Firebase Authentication
    const newUserRecord = await admin.auth().createUser({
      email: email.toLowerCase(),
      password: password,
      displayName: name,
      emailVerified: true,
    });

    console.log(`Usuario creado en Auth con UID: ${newUserRecord.uid}`);

    // Definir permisos por defecto basados en el rol
    const defaultPermissions = {
      ver_dashboard: true,
      ver_mapas: true,
      ver_flota: true,
      editar_flota: role !== 'Operador',
      ver_documentos: true,
      cargar_documentos: role === 'Administrador' || role === 'Gestor',
      descargar_documentos: role === 'Administrador' || role === 'Gestor',
      movimientos_flota: true,
      incidentes_siniestros: true,
      mantenimientos: role !== 'Operador',
      gestionar_usuarios: role === 'Administrador',
      descargar_auditoria: role === 'Administrador' || role === 'Gestor',
      carga_masiva: role === 'Administrador',
      gestion_supervisores: true,
    };

    // 8. Crear el documento del perfil en Firestore (usando el mismo UID de Auth como ID del documento)
    await admin
      .firestore()
      .collection('users')
      .doc(newUserRecord.uid)
      .set({
        nombre: name,
        email: email.toLowerCase(),
        rol: role,
        activo: true,
        permisos: defaultPermissions,
        _createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log(`Perfil creado en Firestore para ${name}`);

    return res.status(200).json({
      status: 'success',
      uid: newUserRecord.uid,
      message: `Usuario ${name} registrado con éxito en Firebase Auth y Firestore.`,
    });

  } catch (err: any) {
    console.error('Error al registrar usuario:', err);
    // Errores comunes de Firebase Auth
    if (err.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado.' });
    }
    if (err.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'El formato de correo ingresado no es válido.' });
    }
    return res.status(500).json({ error: `Error interno al procesar el registro: ${err.message}` });
  }
}
