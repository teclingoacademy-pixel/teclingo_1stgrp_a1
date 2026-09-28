/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Servicio de Integración Nativa con Google Workspace (Google Sheets API v4)
 * Permite leer y escribir directamente en las hojas de cálculo de TecLingo A1
 * usando OAuth2 y la cuenta de servicio oficial: teclingo-workbook@tecligo-workbook-v1.iam.gserviceaccount.com
 */

import { readSpreadsheetValues, appendSpreadsheetRowDirect, hasWorkspaceToken } from './googleWorkspaceService';
import { apiV1Engine } from './apiV1Service';
import type { SheetProgresoUsuarioRow } from '@/types/workbook/workbookRows';
import {
  guardarProgresoUsuario,
  guardarResumenProgreso,
} from './dataLakeProgressService';

export const DEFAULT_SPREADSHEET_ID = '15VshX6bTGOp0stosoBQlqtU4sLxzZeVzx-3reggpitU';
export const EXAMPLE_SPREADSHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
export const SERVICE_ACCOUNT_EMAIL = 'teclingo-workbook@tecligo-workbook-v1.iam.gserviceaccount.com';

/**
 * Obtener el ID de la hoja de cálculo activa
 */
export const getActiveSpreadsheetId = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('teclingo_spreadsheet_id');
    // Migrar automáticamente si tenía guardado el ID de la hoja de ejemplo generada al inicio
    if (!saved || saved === EXAMPLE_SPREADSHEET_ID) {
      localStorage.setItem('teclingo_spreadsheet_id', DEFAULT_SPREADSHEET_ID);
      return DEFAULT_SPREADSHEET_ID;
    }
    return saved;
  }
  return DEFAULT_SPREADSHEET_ID;
};

/**
 * Establecer un ID personalizado de hoja de cálculo
 */
export const setActiveSpreadsheetId = (id: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('teclingo_spreadsheet_id', id.trim());
  }
};

export interface UserRegistrationData {
  user_id: string; // Firebase UID
  email: string;
  nombre: string;
  avatar_url?: string | null;
  fecha_registro?: string;
  nivel_actual?: string;
  xp_total?: number;
  clases_completadas?: number;
  tipo_cuenta?: 'regular' | 'demo';
  activo?: boolean;
}

export interface ProgressReactionData {
  user_id: string;
  clase_id: string;
  habilidad: string;
  reactivo_id: string;
  respuesta_usuario: string;
  correcto: boolean;
  tiempo_respuesta_seg: number;
  fecha_completado?: string;
  puntaje_obtenido: number;
}

/**
 * PASO 2: Verificar si un usuario ya existe en la hoja USUARIOS de Google Sheets
 */
export const checkUserExistsInSheet = async (
  userId: string,
  email?: string
): Promise<{ exists: boolean; userData?: Partial<UserRegistrationData> | null }> => {
  const spreadsheetId = getActiveSpreadsheetId();
  const tokenActive = await hasWorkspaceToken();

  if (tokenActive) {
    try {
      // Intentar leer la columna A (user_id) y B (email) de la hoja USUARIOS
      const res = await readSpreadsheetValues(spreadsheetId, 'USUARIOS!A2:J500');
      if (res.success && res.values && res.values.length > 0) {
        for (const row of res.values) {
          const rowUserId = String(row[0] || '').trim();
          const rowEmail = String(row[1] || '').trim().toLowerCase();
          const targetEmail = (email || '').trim().toLowerCase();

          if (rowUserId === userId || (targetEmail && rowEmail === targetEmail)) {
            return {
              exists: true,
              userData: {
                user_id: rowUserId || userId,
                email: rowEmail || targetEmail,
                nombre: String(row[2] || ''),
                avatar_url: String(row[3] || ''),
                fecha_registro: String(row[4] || ''),
                nivel_actual: String(row[5] || 'A1_C01'),
                xp_total: Number(row[6]) || 0,
                clases_completadas: Number(row[7]) || 0,
                tipo_cuenta: (row[8] as 'regular' | 'demo') || 'regular',
                activo: String(row[9]).toUpperCase() !== 'FALSE',
              },
            };
          }
        }
      }
    } catch (sheetErr) {
      console.warn('Aviso al consultar hoja USUARIOS en Google Sheets:', sheetErr);
    }
  }

  // Comprobar también en la base de datos local como respaldo
  const localRes = await apiV1Engine.getUsuarioById(email || userId);
  if (localRes.data) {
    return {
      exists: true,
      userData: localRes.data,
    };
  }

  return { exists: false, userData: null };
};

/**
 * PASO 2: Agregar nuevo usuario a la hoja USUARIOS en Google Sheets
 * Columnas: user_id, email, nombre, avatar_url, fecha_registro, nivel_actual, xp_total, clases_completadas, tipo_cuenta, activo
 */
export const registerUserInGoogleSheet = async (
  userData: UserRegistrationData
): Promise<{ success: boolean; error?: string }> => {
  const spreadsheetId = getActiveSpreadsheetId();
  const tokenActive = await hasWorkspaceToken();

  const fechaRegistro = userData.fecha_registro || new Date().toISOString();
  const rowValues: (string | number | boolean)[] = [
    userData.user_id,
    userData.email.trim().toLowerCase(),
    userData.nombre.trim(),
    userData.avatar_url || '',
    fechaRegistro,
    userData.nivel_actual || 'A1_C01',
    userData.xp_total ?? 0,
    userData.clases_completadas ?? 0,
    userData.tipo_cuenta || 'regular',
    userData.activo !== false ? 'TRUE' : 'FALSE',
  ];

  // 1. Guardar en base de datos local y estado global
  try {
    await apiV1Engine.postUsuario({
      user_id: userData.user_id,
      email: userData.email.trim().toLowerCase(),
      nombre: userData.nombre.trim(),
      avatar_url: userData.avatar_url || null,
      fecha_registro: fechaRegistro,
      nivel_actual: userData.nivel_actual || 'A1_C01',
      xp_total: userData.xp_total ?? 0,
      clases_completadas: userData.clases_completadas ?? 0,
      tipo_cuenta: userData.tipo_cuenta || 'regular',
      activo: true,
    });
  } catch (e) {
    console.warn('Registro local guardado con aviso:', e);
  }

  // 2. Si hay token de Google Workspace, escribir directamente en Google Sheets
  if (tokenActive) {
    const sheetRes = await appendSpreadsheetRowDirect(spreadsheetId, 'USUARIOS', rowValues);
    if (!sheetRes.success) {
      if (sheetRes.error?.includes('permission') || sheetRes.error?.includes('403')) {
        console.warn(
          `[TecLingo Sheets] Permiso 403 al escribir en USUARIOS de la hoja ${spreadsheetId}.\n` +
          `CAUSA: La cuenta de Google autenticada no tiene permisos de 'Editor' en la hoja de Google Sheets.\n` +
          `SOLUCIÓN: En Google Drive, abre la hoja -> Clic en 'Compartir' -> Agrega tu cuenta de Google con rol 'Editor', o cambia el Acceso general a 'Cualquier persona con el enlace: Editor'.`
        );
      } else {
        console.warn('Aviso al escribir en Google Sheets USUARIOS:', sheetRes.error);
      }

      // Fallback: Data Lake handles user persistence via activityService
      return { success: true, error: sheetRes.error };
    }
    return { success: true };
  }

  return { success: true };
};

/**
 * PASO 4: Guardar Progreso de Reactivos en Google Sheets
 * - Si es usuario DEMO, NO llama a la API de Google Sheets (solo actualiza el estado local).
 * - Si es usuario REGULAR, agrega una fila a PROGRESO_USUARIO y actualiza RESUMEN_PROGRESO.
 */
export const saveProgressToGoogleSheet = async (
  progress: ProgressReactionData
): Promise<{ success: boolean; isDemo?: boolean; error?: string; id?: string; action?: string }> => {
  // PASO 4.1: Regla DEMO - Verificar si el usuario es demo
  const isDemo =
    typeof window !== 'undefined' &&
    (localStorage.getItem('isDemo') === 'true' || progress.user_id === 'demo_user_001');

  if (isDemo) {
    // Modo DEMO: solo actualizar almacenamiento y estado local, NUNCA llamar a la API
    return { success: true, isDemo: true };
  }

  const fechaCompletado = progress.fecha_completado || new Date().toISOString();

  // Guardar progreso en API (persiste en Prisma)
  try {
    await apiV1Engine.postUserProgress(progress.user_id, {
      clase_id: progress.clase_id,
      habilidad: progress.habilidad,
      reactivo_id: progress.reactivo_id,
      respuesta_usuario: progress.respuesta_usuario,
      correcto: progress.correcto,
      tiempo_respuesta_seg: progress.tiempo_respuesta_seg,
      puntaje_obtenido: progress.puntaje_obtenido,
    });
  } catch (localErr) {
    console.warn('Aviso guardando progreso:', localErr);
  }

  // NUEVO (2026-09-25): Guardar en Prisma vía /api/progress/submission
  try {
    // NUEVO: Resolver el email real (Prisma usa email, no user_id mangleado)
    const resolvePrismaEmail = (): string => {
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const u = JSON.parse(raw);
          if (u && u.email) return String(u.email);
        }
      } catch {}
      return progress.user_id;
    };
    const prismaEmail = resolvePrismaEmail();

    const resp = await fetch('/api/progress/submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: prismaEmail,
        lessonId: progress.clase_id,
        exerciseId: progress.reactivo_id,
        userAnswer: progress.respuesta_usuario,
        isCorrect: progress.correcto,
        timeSpentSec: progress.tiempo_respuesta_seg,
        puntos: progress.puntaje_obtenido,
      }),
    });
    if (resp.ok) {
      console.log('[progress] Submission guardada en Prisma');
    } else {
      console.warn('[progress] Prisma respondió', resp.status);
    }
  } catch (e) {
    console.warn('[progress] fetch a Prisma falló:', e);
  }

  // PASO 4.2: Si es usuario regular, escribir en el Data Lake
  const tokenActive = await hasWorkspaceToken();

  if (tokenActive) {
    try {
      // Guardar respuesta individual en PROGRESO_USUARIO del Data Lake
      const res = await guardarProgresoUsuario({
        user_id: progress.user_id,
        email: progress.user_id, // user_id is email in this context
        clase_id: progress.clase_id,
        habilidad: progress.habilidad,
        reactivo_id: progress.reactivo_id,
        respuesta_usuario: progress.respuesta_usuario,
        correcto: progress.correcto,
        tiempo_respuesta_seg: progress.tiempo_respuesta_seg,
        puntaje_obtenido: progress.puntaje_obtenido,
        fecha_registro: fechaCompletado,
      });

      // Actualizar RESUMEN_PROGRESO del Data Lake en segundo plano
      if (res.ok && progress.correcto) {
        guardarResumenProgreso({
          user_id: progress.user_id,
          email: progress.user_id,
          clase_id: progress.clase_id,
          reactivos_correctos: 1,
          puntaje_obtenido: progress.puntaje_obtenido,
          xp_ganado: progress.puntaje_obtenido,
          estado_clase: 'en_progreso',
        }).catch((e: any) =>
          console.warn('Aviso actualizando RESUMEN_PROGRESO en Data Lake:', e)
        );
      }

      return { success: res.ok, id: res.id, action: res.action };
    } catch (sheetErr: unknown) {
      const msg = sheetErr instanceof Error ? sheetErr.message : String(sheetErr);
      console.warn('Aviso guardando fila en Data Lake PROGRESO_USUARIO:', msg);
      return { success: false, error: msg };
    }
  }

  return { success: true };
};

/**
 * Consulta genérica para obtener datos de cualquier hoja de Google Sheets
 * Usa Google Sheets API si hay token activo, o fallback al endpoint público gviz JSON
 */
export const getSheetData = async (
  sheetName: string,
  spreadsheetId: string = getActiveSpreadsheetId()
): Promise<any[]> => {
  try {
    // 1. Intentar leer directo de Google Sheets gviz JSON (público / tiempo real)
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
    const res = await fetch(gvizUrl);
    if (res.ok) {
      const text = await res.text();
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const json = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
        const cols = (json.table?.cols || []).map((c: any) => c.label || c.id);
        const rows = json.table?.rows || [];
        return rows.map((r: any) => {
          const rowObj: Record<string, any> = {};
          (r.c || []).forEach((cell: any, idx: number) => {
            const key = cols[idx] || `col_${idx}`;
            if (key) {
              rowObj[key] = cell ? cell.v : '';
            }
          });
          return rowObj;
        });
      }
    }
  } catch (err) {
    console.warn(`[nativeSheetService] Error consultando hoja ${sheetName} en Google Sheets:`, err);
  }

  return [];
};

/**
 * Consultar dinámicamente la hoja TEXTOS_BASE para una clase específica
 */
export const getTextoBaseFromGoogleSheet = async (
  claseId: string,
  spreadsheetId: string = getActiveSpreadsheetId()
): Promise<{ success: boolean; texto: any | null; error?: string }> => {
  try {
    const sheetData = await getSheetData('TEXTOS_BASE', spreadsheetId);
    const target = claseId.trim().toUpperCase();
    const found = sheetData.find(
      (r) => String(r.clase_id || '').trim().toUpperCase() === target
    );

    if (found && found.contenido_texto) {
      const palabras = Number(found.palabras_count) || String(found.contenido_texto).trim().split(/\s+/).length;
      return {
        success: true,
        texto: {
          texto_id: String(found.texto_id || `TXT_${target}`),
          clase_id: target,
          titulo_texto: String(found.titulo_texto || found.titulo || 'My Classroom'),
          titulo: String(found.titulo_texto || found.titulo || 'My Classroom'),
          contenido_texto: String(found.contenido_texto),
          contenido: String(found.contenido_texto),
          palabras_count: palabras,
          dificultad: Number(found.dificultad) || 1,
          vocabulario_usado_json: String(found.vocabulario_usado_json || '[]'),
          verbos_usados_json: String(found.verbos_usados_json || '[]'),
          audio_tts_url: String(found.audio_tts_url || ''),
          tiempo_audio_seg: Number(found.tiempo_audio_seg) || Math.max(15, Math.round(palabras * 0.6)),
          tipo_texto: String(found.tipo_texto || 'descriptivo'),
          activo: String(found.activo).toUpperCase() !== 'FALSE',
        },
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[nativeSheetService] Error al obtener texto base dinámico:', msg);
  }

  // Fallback: consultar Prisma vía /api/v1/textos-base
  try {
    const res = await fetch(`/api/v1/textos-base?clase_id=${encodeURIComponent(claseId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data;
        return {
          success: true,
          texto: {
            texto_id: `TXT_${claseId}`,
            clase_id: claseId,
            titulo_texto: String(data.titulo_texto || data.titulo || ''),
            titulo: String(data.titulo || data.titulo_texto || ''),
            contenido_texto: String(data.contenido_texto || data.contenido || ''),
            contenido: String(data.contenido || data.contenido_texto || ''),
            palabras_count: Number(data.word_count) || 0,
            dificultad: Number(data.difficulty) || 1,
            vocabulario_usado_json: '[]',
            verbos_usados_json: '[]',
            audio_tts_url: '',
            tiempo_audio_seg: Number(data.estimated_sec) || 20,
            tipo_texto: 'descriptivo',
            activo: true,
          },
        };
      }
    }
  } catch (e) {
    console.warn('[nativeSheetService] Error fetching texto base desde API:', e);
  }

  return { success: false, texto: null };
};

