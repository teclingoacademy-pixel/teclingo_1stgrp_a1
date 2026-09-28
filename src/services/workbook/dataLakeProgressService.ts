/**
 * dataLakeProgressService.ts
 * Bridge service: sends workbook progress data to the Data Lake API.
 * Replaces direct Google Sheets writes from nativeSheetService.ts
 */

const DATA_LAKE_API_URL =
  (import.meta.env.VITE_IDENTITY_API_URL as string | undefined)?.trim() ||
  'https://script.google.com/macros/s/AKfycbz7buTc2D7FIgWVub6_t4leXfvqc68821957LHOUgP-mBqpWKn_7JaEU-DZWiumAcVb/exec';
const DATA_LAKE_SECRET = 'teclingo_secret_2026';

interface ProgresoUsuario {
  user_id: string;
  email: string;
  clase_id: string;
  habilidad: string;
  reactivo_id: string;
  respuesta_usuario: string;
  correcto: boolean;
  tiempo_respuesta_seg: number;
  puntaje_obtenido: number;
  fecha_registro?: string;
}

interface ResumenProgreso {
  user_id: string;
  email: string;
  clase_id: string;
  habilidades_completadas?: number;
  reactivos_totales_clase?: number;
  reactivos_correctos?: number;
  puntaje_obtenido?: number;
  puntaje_maximo_posible?: number;
  porcentaje_avance?: number;
  xp_ganado?: number;
  estado_clase?: string;
}

interface DataLakeResponse {
  ok: boolean;
  id?: string;
  action?: string;
  data?: any[];
  total?: number;
  error?: string;
}

async function postToDataLake(action: string, payload: Record<string, any>): Promise<DataLakeResponse> {
  console.log(`[DataLake MOCK] action=${action} — datos van a PostgreSQL`);
  return { ok: true };
}

/**
 * Guarda una respuesta del alumno en PROGRESO_USUARIO del Data Lake
 */
export async function guardarProgresoUsuario(p: ProgresoUsuario): Promise<DataLakeResponse> {
  return postToDataLake('guardarProgresoUsuario', {
    ...p,
    email: p.email,
    fecha_registro: p.fecha_registro || new Date().toISOString(),
  });
}

/**
 * Obtiene el progreso de un alumno desde PROGRESO_USUARIO del Data Lake
 */
export async function obtenerProgresoUsuario(email: string, claseId?: string): Promise<DataLakeResponse> {
  return postToDataLake('obtenerProgresoUsuario', {
    email,
    clase_id: claseId || '',
  });
}

/**
 * Guarda/actualiza el resumen de progreso por clase en RESUMEN_PROGRESO del Data Lake
 */
export async function guardarResumenProgreso(p: ResumenProgreso): Promise<DataLakeResponse> {
  return postToDataLake('guardarResumenProgreso', p);
}

/**
 * Obtiene el resumen de progreso de un alumno desde RESUMEN_PROGRESO del Data Lake
 */
export async function obtenerResumenProgreso(email: string): Promise<DataLakeResponse> {
  return postToDataLake('obtenerResumenProgreso', { email });
}
