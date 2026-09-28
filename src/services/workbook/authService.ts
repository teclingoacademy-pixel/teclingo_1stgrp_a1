/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Servicio de Autenticación TecLingo A1
 * Soporta autenticación por email, Google OAuth nativo (GSI) y Acceso Instantáneo DEMO.
 * 100% desacoplado de Firebase: la base de datos es Google Sheets (Datasheet).
 */

import { User } from '@/types/workbook/types';
import { apiV1Service } from './apiV1Service';
import { googleSignIn, googleSignOut } from './googleAuth';
import { 
  checkUserExistsInSheet, 
  registerUserInGoogleSheet 
} from './nativeSheetService';


export const DEMO_USER: User = {
  user_id: 'demo_user_001',
  email: 'demo@teclingo.com',
  nombre: 'Estudiante Demo',
  avatar_url: '🧪',
  tipo_cuenta: 'demo',
  nivel_actual: 'A1_C01',
  xp_total: 350,
  clases_completadas: 0,
  fecha_registro: '2026-09-08T00:00:00.000Z',
  activo: true,
};

// Registrar usuario con email y contraseña (directo en la hoja USUARIOS de Google Sheets)
export const signUpWithEmail = async (email: string, password: string, nombre: string): Promise<User> => {
  if (!email || !email.includes('@')) {
    throw new Error('Por favor ingresa un correo electrónico válido');
  }
  if (!password || password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }
  if (!nombre.trim()) {
    throw new Error('Por favor ingresa tu nombre completo');
  }

  const cleanEmail = email.trim().toLowerCase();
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // 1. Verificar si ya existe en la hoja USUARIOS de Google Sheets
  const sheetCheck = await checkUserExistsInSheet(userId, cleanEmail);
  if (sheetCheck.exists) {
    throw new Error('Ya existe una cuenta con este correo electrónico. Inicia sesión.');
  }

  const newUser: User = {
    user_id: userId,
    email: cleanEmail,
    nombre: nombre.trim(),
    avatar_url: null,
    tipo_cuenta: 'regular',
    nivel_actual: 'A1_C01',
    xp_total: 0,
    clases_completadas: 0,
    fecha_registro: new Date().toISOString(),
    activo: true,
  };

  // 2. Agregar nueva fila en la hoja USUARIOS de Google Sheets
  await registerUserInGoogleSheet({
    user_id: newUser.user_id,
    email: newUser.email,
    nombre: newUser.nombre,
    avatar_url: '',
    fecha_registro: newUser.fecha_registro,
    nivel_actual: 'A1_C01',
    xp_total: 0,
    clases_completadas: 0,
    tipo_cuenta: 'regular',
    activo: true,
  });

  // Guardar en base de datos local
  try {
    await apiV1Service.postUsuario({
      user_id: newUser.user_id,
      email: newUser.email,
      nombre: newUser.nombre,
      avatar_url: '',
      password: password,
      fecha_registro: newUser.fecha_registro,
      nivel_actual: 'A1_C01',
      xp_total: 0,
      clases_completadas: 0,
      tipo_cuenta: 'regular',
      activo: true,
    });
  } catch (err) {
    console.warn('Registro local complementario:', err);
  }

  // Guardar sesión en localStorage
  localStorage.setItem('user', JSON.stringify(newUser));
  localStorage.setItem('isDemo', 'false');

  return newUser;
};

// Iniciar sesión con email y contraseña
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  if (!email || !password) {
    throw new Error('Ingresa tu email y contraseña');
  }

  const cleanEmail = email.trim().toLowerCase();

  // Acceso directo si se usan las credenciales de demo en el formulario estándar
  if (cleanEmail === 'demo@teclingo.com') {
    return signInAsDemo();
  }

  // 1. Buscar usuario en Google Sheets
  const sheetCheck = await checkUserExistsInSheet(cleanEmail, cleanEmail);
  if (sheetCheck.exists && sheetCheck.userData) {
    const u = sheetCheck.userData;
    const authenticatedUser: User = {
      user_id: u.user_id || `usr_${Date.now()}`,
      email: u.email || cleanEmail,
      nombre: u.nombre || cleanEmail.split('@')[0],
      avatar_url: u.avatar_url || null,
      tipo_cuenta: (u.tipo_cuenta as 'regular' | 'demo') || 'regular',
      nivel_actual: u.nivel_actual || 'A1_C01',
      xp_total: Number(u.xp_total) || 0,
      clases_completadas: Number(u.clases_completadas) || 0,
      fecha_registro: u.fecha_registro || new Date().toISOString(),
      activo: u.activo !== false,
    };

    localStorage.setItem('user', JSON.stringify(authenticatedUser));
    localStorage.setItem('isDemo', authenticatedUser.tipo_cuenta === 'demo' ? 'true' : 'false');
    return authenticatedUser;
  }

  // 2. Fallback: Buscar en la base de datos local
  const res = await apiV1Service.getUsuarioById(cleanEmail);
  if (res.data) {
    const userRow = res.data;
    if (userRow.password && userRow.password !== password) {
      throw new Error('Contraseña incorrecta');
    }

    const authenticatedUser: User = {
      user_id: userRow.user_id,
      email: userRow.email,
      nombre: userRow.nombre,
      avatar_url: userRow.avatar_url || null,
      tipo_cuenta: userRow.tipo_cuenta || 'regular',
      nivel_actual: userRow.nivel_actual || 'A1_C01',
      xp_total: userRow.xp_total || 0,
      clases_completadas: userRow.clases_completadas || 0,
      fecha_registro: userRow.fecha_registro,
      activo: userRow.activo,
    };

    localStorage.setItem('user', JSON.stringify(authenticatedUser));
    localStorage.setItem('isDemo', authenticatedUser.tipo_cuenta === 'demo' ? 'true' : 'false');
    return authenticatedUser;
  }

  throw new Error('Email o contraseña incorrectos. Verifica tus datos o crea una cuenta.');
};

// Iniciar sesión con Google (OAuth nativo con permisos de Google Workspace)
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const googleResult = await googleSignIn();
    const gUser = googleResult.user;
    const userId = gUser.uid;
    const googleEmail = (googleResult.email || gUser.email || '').toLowerCase();
    const googleName = googleResult.displayName || gUser.displayName || googleEmail.split('@')[0] || 'Estudiante Google';
    const photoUrl = googleResult.photoURL || gUser.photoURL || null;

    // Verificar si el usuario ya existe en la hoja USUARIOS de Google Sheets
    const { exists, userData } = await checkUserExistsInSheet(userId, googleEmail);

    let authenticatedUser: User;

    if (exists && userData) {
      // Usuario existente: cargar sus datos y progreso
      authenticatedUser = {
        user_id: userData.user_id || userId,
        email: userData.email || googleEmail,
        nombre: userData.nombre || googleName,
        avatar_url: photoUrl || userData.avatar_url || null,
        tipo_cuenta: (userData.tipo_cuenta as 'regular' | 'demo') || 'regular',
        nivel_actual: userData.nivel_actual || 'A1_C01',
        xp_total: Number(userData.xp_total) || 0,
        clases_completadas: Number(userData.clases_completadas) || 0,
        fecha_registro: userData.fecha_registro || new Date().toISOString(),
        activo: userData.activo !== false,
      };
    } else {
      // Si NO existe, agregar nueva fila en la hoja USUARIOS de Google Sheets
      authenticatedUser = {
        user_id: userId,
        email: googleEmail,
        nombre: googleName,
        avatar_url: photoUrl,
        fecha_registro: new Date().toISOString(),
        nivel_actual: 'A1_C01',
        xp_total: 0,
        clases_completadas: 0,
        tipo_cuenta: 'regular',
        activo: true,
      };

      await registerUserInGoogleSheet({
        user_id: authenticatedUser.user_id,
        email: authenticatedUser.email,
        nombre: authenticatedUser.nombre,
        avatar_url: authenticatedUser.avatar_url || '',
        fecha_registro: authenticatedUser.fecha_registro,
        nivel_actual: 'A1_C01',
        xp_total: 0,
        clases_completadas: 0,
        tipo_cuenta: 'regular',
        activo: true,
      });
    }

    // Guardar la sesión en el estado global / localStorage
    localStorage.setItem('user', JSON.stringify(authenticatedUser));
    localStorage.setItem('isDemo', 'false');

    return authenticatedUser;
  } catch (error: unknown) {
    console.warn('Aviso en Google Auth:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes('closed') || errMsg.includes('cancel') || errMsg.includes('popup_closed')) {
      throw new Error('Ventana de inicio de Google cerrada por el usuario.');
    }
    throw new Error(`Error al iniciar sesión con Google: ${errMsg}`);
  }
};

// Iniciar sesión como usuario DEMO (Acceso instantáneo para pruebas)
export const signInAsDemo = (): User => {
  localStorage.setItem('user', JSON.stringify(DEMO_USER));
  localStorage.setItem('isDemo', 'true');
  return DEMO_USER;
};

// Cerrar sesión
export const signOutUser = async (): Promise<void> => {
  const isDemo = localStorage.getItem('isDemo') === 'true';

  try {
    await googleSignOut();
  } catch (e) {
    console.warn('Aviso al cerrar sesión Google:', e);
  }

  if (isDemo) {
    // TODO 2026-09-26: Reset demo de progresión real via API cuando aplique.
    // Ej: await fetch('/api/users/demo/reset', { method: 'POST' });
    // El progreso real vive en Prisma (Submission + UserProgress),
    // no en localStorage. El reset anterior (datasheet) fue eliminado.
    console.log('[authService] Demo logout — reset real pendiente de endpoint');
  }

  localStorage.removeItem('user');
  localStorage.removeItem('isDemo');
};

// Obtener usuario actualmente almacenado
export const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

// Saber si está en modo demo
export const isDemoMode = (): boolean => {
  return localStorage.getItem('isDemo') === 'true';
};

