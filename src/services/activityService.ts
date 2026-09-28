/**
 * activityService.ts
 * Servicio para guardar y leer actividades de alumnos en el Data Lake
 */

const ACTIVITY_API_URL = 'https://script.google.com/macros/s/AKfycbz1OBcF2logEt-r_gaOdpG9MhcjsVkz3_MZiJKf9iSS1T1lpYmAj_MoFtrssCnT7q-k/exec';
const ACTIVITY_SECRET = 'teclingo_secret_2026';

interface ActividadAlumno {
  email: string;
  lesson_id: string;
  skill: string;
  exercise_id: string;
  pregunta: string;
  respuesta_alumno: string;
  respuesta_correcta: string;
  es_correcta: boolean;
  fecha?: string;
  tiempo_segundos?: number;
  calificacion_docente?: string;
  retroalimentacion?: string;
  // Metadatos de intentos del alumno (para el análisis final en el Data Lake)
  intentos?: number;       // número de intentos fallidos en el ejercicio
  estado_final?: string;   // 'correct' | 'failed' (2ª oportunidad) | 'blocked' (2 errores)
}

interface ActividadResponse {
  ok: boolean;
  id?: string;
  action?: string;
  error?: string;
}

interface ObtenerActividadesResponse {
  ok: boolean;
  data?: any[];
  total?: number;
  error?: string;
}

/**
 * Google Sheets DESHABILITADO — mock responses
 */
export async function guardarActividadAlumno(actividad: ActividadAlumno): Promise<ActividadResponse> {
  console.log('[Activity MOCK] guardarActividadAlumno — datos van a PostgreSQL');
  return { ok: true, id: 'mock-' + Date.now() };
}

export async function obtenerActividadesAlumno(email: string, lessonId?: string): Promise<ObtenerActividadesResponse> {
  console.log('[Activity MOCK] obtenerActividadesAlumno — datos van a PostgreSQL');
  return { ok: true, data: [], total: 0 };
}

/**
 * Califica una actividad (para docentes)
 */
export async function calificarActividadAlumno(
  email: string,
  exerciseId: string,
  calificacion: string,
  retroalimentacion: string
): Promise<ActividadResponse> {
  console.log('[Activity MOCK] calificarActividadAlumno — datos van a PostgreSQL');
  return { ok: true };
}
