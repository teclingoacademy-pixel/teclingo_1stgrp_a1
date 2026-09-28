/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * resumenProgresoService.ts
 * Servicio centralizado para la gestión y sincronización de la hoja RESUMEN_PROGRESO
 * y actualización de xp_total en USUARIOS.
 * 
 * Estructura de RESUMEN_PROGRESO:
 * 1. user_id: string
 * 2. clase_id: string
 * 3. habilidades_completadas: number
 * 4. reactivos_totales_clase: number (50)
 * 5. reactivos_correctos: number
 * 6. puntaje_obtenido: number
 * 7. puntaje_maximo_posible: number (500)
 * 8. porcentaje_avance: number (0-100)
 * 9. xp_ganado: number
 * 10. estado_clase: 'pendiente' | 'en_progreso' | 'completada'
 * 11. ultima_actualizacion: string (ISO)
 */

import {
  SheetResumenProgresoRow,
  loadDatasheetFromStorage,
  saveDatasheetToStorage,
  INITIAL_RESUMEN_PROGRESO,
  INITIAL_CLASES,
} from '@/data/legacy/workbookData';
import {
  readSpreadsheetValues,
  hasWorkspaceToken,
} from './googleWorkspaceService';
import {
  guardarResumenProgreso as guardarResumenProgresoDataLake,
  obtenerResumenProgreso as obtenerResumenProgresoDataLake,
} from './dataLakeProgressService';
import { getActiveSpreadsheetId } from './nativeSheetService';

export type EstadoClase = 'pendiente' | 'en_progreso' | 'completada';

export interface ResumenProgresoParams {
  userId: string;
  claseId: string;
}

export interface ReactivoProgresoParams {
  userId: string;
  claseId: string;
  correcto: boolean;
  puntos?: number;
  reactivoId?: string;
}

export interface SkillProgresoParams {
  userId: string;
  claseId: string;
  habilidad?: string;
}

/**
 * REGLA 1: Al iniciar una clase por primera vez
 * - Verificar si existe una fila en RESUMEN_PROGRESO para ese user_id + clase_id
 * - Si NO existe, crear una nueva fila con los valores por defecto (pendiente)
 * - Si existe, no duplicar.
 */
export function initClaseResumenProgreso(userId: string, claseId: string): SheetResumenProgresoRow {
  const state = loadDatasheetFromStorage();
  const list = state.resumenProgreso || INITIAL_RESUMEN_PROGRESO;

  const existingIndex = list.findIndex(
    (r) => r.user_id === userId && r.clase_id === claseId
  );

  if (existingIndex >= 0) {
    // Ya existe, devolver sin duplicar
    return list[existingIndex];
  }

  // Crear nueva fila inicial
  const now = new Date().toISOString();
  const newRow: SheetResumenProgresoRow = {
    resumen_id: `RES_${userId}_${claseId}`,
    user_id: userId,
    clase_id: claseId,
    habilidades_completadas: 0,
    reactivos_totales_clase: 50,
    reactivos_correctos: 0,
    puntaje_obtenido: 0,
    puntaje_maximo_posible: 500,
    porcentaje_avance: 0,
    xp_ganado: 0,
    estado_clase: 'pendiente',
    ultima_actualizacion: now,
    // Compatibilidad retroactiva
    xp_obtenidos: 0,
    reactivos_resueltos: 0,
  };

  const updatedList = [...list, newRow];
  state.resumenProgreso = updatedList;
  saveDatasheetToStorage(state);

  // Sincronizar en segundo plano con Google Sheets si aplica
  syncResumenProgresoToGoogleSheet(newRow).catch((err) => {
    console.warn('[RESUMEN_PROGRESO] Aviso al sincronizar inicio de clase en Google Sheets:', err);
  });

  return newRow;
}

/**
 * REGLA 2: Al responder un reactivo
 * - Actualizar la fila existente en RESUMEN_PROGRESO:
 *   - Si correcto: sumar 1 a reactivos_correctos y 10 a puntaje_obtenido
 *   - Actualizar porcentaje_avance = (puntaje_obtenido / 500) * 100
 *   - Actualizar xp_ganado = puntaje_obtenido
 *   - Actualizar ultima_actualizacion
 *   - Si habilidades_completadas == 5: cambiar estado_clase a "completada"
 *   - Si habilidades_completadas > 0 y < 5: cambiar estado_clase a "en_progreso"
 */
export function recordReactivoResumenProgreso(params: ReactivoProgresoParams): SheetResumenProgresoRow {
  const { userId, claseId, correcto } = params;
  const state = loadDatasheetFromStorage();
  const list = [...(state.resumenProgreso || INITIAL_RESUMEN_PROGRESO)];

  let index = list.findIndex(
    (r) => r.user_id === userId && r.clase_id === claseId
  );

  let current: SheetResumenProgresoRow;

  if (index >= 0) {
    current = { ...list[index] };
  } else {
    // Si por alguna razón no existía, inicializarla primero
    current = {
      resumen_id: `RES_${userId}_${claseId}`,
      user_id: userId,
      clase_id: claseId,
      habilidades_completadas: 0,
      reactivos_totales_clase: 50,
      reactivos_correctos: 0,
      puntaje_obtenido: 0,
      puntaje_maximo_posible: 500,
      porcentaje_avance: 0,
      xp_ganado: 0,
      estado_clase: 'pendiente',
      ultima_actualizacion: new Date().toISOString(),
      xp_obtenidos: 0,
      reactivos_resueltos: 0,
    };
    list.push(current);
    index = list.length - 1;
  }

  // Actualizar valores del reactivo
  const puntosSumar = correcto ? (params.puntos !== undefined ? params.puntos : 10) : 0;
  const nuevoReactivosCorrectos = (current.reactivos_correctos || 0) + (correcto ? 1 : 0);
  const nuevoPuntajeObtenido = (current.puntaje_obtenido || 0) + puntosSumar;
  const puntajeMax = current.puntaje_maximo_posible || 500;
  
  // porcentaje_avance = (puntaje_obtenido / 500) * 100
  const nuevoPorcentaje = Math.min(100, Math.round((nuevoPuntajeObtenido / puntajeMax) * 100));
  const nuevoXpGanado = nuevoPuntajeObtenido;
  const now = new Date().toISOString();

  // Determinar estado de la clase según reglas
  let nuevoEstado: EstadoClase = current.estado_clase as EstadoClase;
  if (current.habilidades_completadas >= 5 || nuevoPorcentaje >= 100) {
    nuevoEstado = 'completada';
  } else if (current.habilidades_completadas > 0 || nuevoReactivosCorrectos > 0 || nuevoPuntajeObtenido > 0) {
    nuevoEstado = 'en_progreso';
  } else {
    nuevoEstado = 'pendiente';
  }

  const updatedRow: SheetResumenProgresoRow = {
    ...current,
    reactivos_correctos: nuevoReactivosCorrectos,
    puntaje_obtenido: nuevoPuntajeObtenido,
    porcentaje_avance: nuevoPorcentaje,
    xp_ganado: nuevoXpGanado,
    estado_clase: nuevoEstado,
    ultima_actualizacion: now,
    // Compatibilidad retroactiva
    xp_obtenidos: nuevoXpGanado,
    reactivos_resueltos: (current.reactivos_resueltos || 0) + 1,
  };

  list[index] = updatedRow;
  state.resumenProgreso = list;
  saveDatasheetToStorage(state);

  // Sincronizar en segundo plano con Google Sheets
  syncResumenProgresoToGoogleSheet(updatedRow).catch((err) => {
    console.warn('[RESUMEN_PROGRESO] Aviso sincronizando reactivo en Google Sheets:', err);
  });

  // Actualizar xp_total en USUARIOS
  actualizarXpTotalUsuario(userId).catch((err) => {
    console.warn('[USUARIOS] Aviso actualizando xp_total de usuario:', err);
  });

  return updatedRow;
}

/**
 * REGLA 3: Al completar una habilidad (5 reactivos)
 * - Sumar 1 a habilidades_completadas
 * - Si habilidades_completadas == 5: estado_clase = "completada"
 * - Si habilidades_completadas > 0 y < 5: estado_clase = "en_progreso"
 */
export function recordSkillCompletedResumenProgreso(params: SkillProgresoParams): SheetResumenProgresoRow {
  const { userId, claseId } = params;
  const state = loadDatasheetFromStorage();
  const list = [...(state.resumenProgreso || INITIAL_RESUMEN_PROGRESO)];

  let index = list.findIndex(
    (r) => r.user_id === userId && r.clase_id === claseId
  );

  let current: SheetResumenProgresoRow;

  if (index >= 0) {
    current = { ...list[index] };
  } else {
    current = initClaseResumenProgreso(userId, claseId);
    list.push(current);
    index = list.length - 1;
  }

  // Sumar 1 a habilidades completadas (máximo 5)
  const prevHabilidades = current.habilidades_completadas || 0;
  const nextHabilidades = Math.min(5, prevHabilidades + 1);

  let nuevoEstado: EstadoClase = current.estado_clase as EstadoClase;
  if (nextHabilidades >= 5 || (current.porcentaje_avance || 0) >= 100) {
    nuevoEstado = 'completada';
  } else if (nextHabilidades > 0) {
    nuevoEstado = 'en_progreso';
  }

  const now = new Date().toISOString();
  const updatedRow: SheetResumenProgresoRow = {
    ...current,
    habilidades_completadas: nextHabilidades,
    estado_clase: nuevoEstado,
    ultima_actualizacion: now,
  };

  list[index] = updatedRow;
  state.resumenProgreso = list;
  saveDatasheetToStorage(state);

  // Sincronizar en segundo plano
  syncResumenProgresoToGoogleSheet(updatedRow).catch((err) => {
    console.warn('[RESUMEN_PROGRESO] Aviso sincronizando habilidad en Google Sheets:', err);
  });

  return updatedRow;
}

/**
 * REGLA 4: Al cargar el índice de clases
 * - Consultar RESUMEN_PROGRESO para el user_id actual
 * - Retorna un mapa clase_id -> SheetResumenProgresoRow
 */
export function getResumenProgresoForUser(userId: string): Map<string, SheetResumenProgresoRow> {
  const state = loadDatasheetFromStorage();
  const list = state.resumenProgreso || INITIAL_RESUMEN_PROGRESO;
  const map = new Map<string, SheetResumenProgresoRow>();

  // Filtrar filas del usuario especificado
  list.forEach((row) => {
    if (row.user_id === userId) {
      map.set(row.clase_id, row);
    }
  });

  return map;
}

/**
 * Helper para obtener una fila específica de un usuario y clase
 */
export function getClaseProgresoRow(userId: string, claseId: string): SheetResumenProgresoRow {
  const state = loadDatasheetFromStorage();
  const list = state.resumenProgreso || INITIAL_RESUMEN_PROGRESO;
  const found = list.find((r) => r.user_id === userId && r.clase_id === claseId);

  if (found) {
    return found;
  }

  // Devolver estructura por defecto sin alterar almacenamiento si solo es lectura
  return {
    resumen_id: `RES_${userId}_${claseId}`,
    user_id: userId,
    clase_id: claseId,
    habilidades_completadas: 0,
    reactivos_totales_clase: 50,
    reactivos_correctos: 0,
    puntaje_obtenido: 0,
    puntaje_maximo_posible: 500,
    porcentaje_avance: 0,
    xp_ganado: 0,
    estado_clase: 'pendiente',
    ultima_actualizacion: new Date().toISOString(),
  };
}

/**
 * REGLA 5: Al cargar el perfil del usuario
 * - Calcular xp_total = SUMA(xp_ganado) de todas las filas del usuario
 * - Actualizar el campo xp_total en la hoja USUARIOS (local y Google Sheets)
 */
export async function actualizarXpTotalUsuario(
  userId: string
): Promise<{ xp_total: number; clases_completadas: number }> {
  const state = loadDatasheetFromStorage();
  const list = state.resumenProgreso || INITIAL_RESUMEN_PROGRESO;

  // Filtrar todas las filas del usuario
  const userRows = list.filter((r) => r.user_id === userId);

  // Calcular xp_total = SUMA(xp_ganado)
  const xpTotal = userRows.reduce((acc, r) => acc + (r.xp_ganado || r.puntaje_obtenido || 0), 0);
  const clasesCompletadas = userRows.filter(
    (r) => r.estado_clase === 'completada' || (r.porcentaje_avance || 0) >= 100
  ).length;

  // 1. Actualizar en almacenamiento local state.usuarios
  if (state.usuarios) {
    const uIdx = state.usuarios.findIndex((u) => u.user_id === userId);
    if (uIdx >= 0) {
      state.usuarios[uIdx] = {
        ...state.usuarios[uIdx],
        xp_total: xpTotal,
        clases_completadas: clasesCompletadas,
      };
      saveDatasheetToStorage(state);
    }
  }

  // 2. Actualizar sesión activa en localStorage si coincide
  try {
    if (typeof window !== 'undefined') {
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u.user_id === userId) {
          u.xp_total = xpTotal;
          u.clases_completadas = clasesCompletadas;
          localStorage.setItem('user', JSON.stringify(u));
        }
      }
    }
  } catch (e) {
    console.warn('Aviso actualizando usuario en localStorage:', e);
  }

  // 3. Si el usuario es regular y hay token de Google Sheets, actualizar hoja USUARIOS
  syncUserXpTotalToGoogleSheet(userId, xpTotal, clasesCompletadas).catch((err) => {
    console.warn('[USUARIOS] Aviso al sincronizar xp_total en Google Sheets:', err);
  });

  return { xp_total: xpTotal, clases_completadas: clasesCompletadas };
}

/**
 * SINCRONIZACIÓN DATA LAKE: RESUMEN_PROGRESO
 * Guarda/actualiza el resumen de progreso por clase en el Data Lake
 */
export async function syncResumenProgresoToGoogleSheet(
  row: SheetResumenProgresoRow
): Promise<{ success: boolean; updated?: boolean; appended?: boolean; error?: string }> {
  const isDemo =
    typeof window !== 'undefined' &&
    (localStorage.getItem('isDemo') === 'true' || row.user_id === 'demo_user_001');

  if (isDemo) {
    return { success: true };
  }

  try {
    const res = await guardarResumenProgresoDataLake({
      user_id: row.user_id,
      email: row.user_id,
      clase_id: row.clase_id,
      habilidades_completadas: row.habilidades_completadas,
      reactivos_totales_clase: row.reactivos_totales_clase,
      reactivos_correctos: row.reactivos_correctos,
      puntaje_obtenido: row.puntaje_obtenido,
      puntaje_maximo_posible: row.puntaje_maximo_posible,
      porcentaje_avance: row.porcentaje_avance,
      xp_ganado: row.xp_ganado,
      estado_clase: row.estado_clase,
    });

    return { success: res.ok, updated: res.action === 'updated', appended: res.action === 'created' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[RESUMEN_PROGRESO] Error sincronizando con Data Lake:', msg);
    return { success: false, error: msg };
  }
}

/**
 * SINCRONIZACIÓN DATA LAKE: Actualizar xp_total y clases_completadas en USUARIOS
 */
export async function syncUserXpTotalToGoogleSheet(
  userId: string,
  xpTotal: number,
  clasesCompletadas?: number
): Promise<{ success: boolean; error?: string }> {
  const isDemo =
    typeof window !== 'undefined' &&
    (localStorage.getItem('isDemo') === 'true' || userId === 'demo_user_001');

  if (isDemo) {
    return { success: true };
  }

  // XP sync is handled by the Data Lake's guardarResumenProgreso action
  // No separate call needed — the resumen already contains xp_ganado
  return { success: true };
}


/**
 * NUEVO (2026-09-25): Trae el resumen de progreso desde Prisma vía endpoint
 * y lo guarda en el storage local para que getResumenProgresoForUser lo use.
 */
export async function hydrateResumenProgresoFromPrisma(userId: string): Promise<void> {
  try {
    const resp = await fetch(`/api/progress/${encodeURIComponent(userId)}`);
    if (!resp.ok) return;
    const json = await resp.json();
    if (!json.ok || !json.data?.resumen) return;

    const state = loadDatasheetFromStorage();
    const existing = state.resumenProgreso || [];
    const fromPrisma = json.data.resumen as any[];

    // Fusionar: priorizar datos de Prisma
    const map = new Map<string, any>();
    existing.forEach((r: any) => map.set(`${r.user_id}|${r.clase_id}`, r));
    fromPrisma.forEach((r: any) => map.set(`${r.user_id}|${r.clase_id}`, r));

    state.resumenProgreso = Array.from(map.values());
    saveDatasheetToStorage(state);
    console.log(`[resumenProgreso] Hidratado desde Prisma: ${fromPrisma.length} filas`);
  } catch (e) {
    console.warn('[resumenProgreso] No se pudo hidratar desde Prisma:', e);
  }
}
