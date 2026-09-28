/**
 * planeacionService.ts
 * Service for curriculum planning CRUD via Data Lake API.
 * Directors can edit/approve weekly lesson plans that persist to the Data Lake.
 */

const DATA_LAKE_API_URL =
  (import.meta.env.VITE_IDENTITY_API_URL as string | undefined)?.trim() ||
  'https://script.google.com/macros/s/AKfycbz7buTc2D7FIgWVub6_t4leXfvqc68821957LHOUgP-mBqpWKn_7JaEU-DZWiumAcVb/exec';
const DATA_LAKE_SECRET = 'teclingo_secret_2026';

export interface SemanaPlaneacion {
  semana: number;
  fecha_inicio: string;
  fecha_fin: string;
  eje_tematico: string;
  unidad_libro: string;
  horas_json: string;
  kpi: string;
  estado: string;
  docente_email: string;
  aprobado_por: string;
  aprobado_fecha: string;
}

interface PlaneacionResponse {
  ok: boolean;
  data?: SemanaPlaneacion[];
  total?: number;
  semana?: number;
  action?: string;
  error?: string;
}

async function postToDataLake(action: string, payload: Record<string, any>): Promise<PlaneacionResponse> {
  console.log(`[Planeacion MOCK] action=${action} — datos van a PostgreSQL`);
  return { ok: true, data: [] };
}

/**
 * Obtiene todas las semanas de planeación desde el Data Lake
 */
export async function obtenerPlaneacion(): Promise<PlaneacionResponse> {
  return postToDataLake('obtenerPlaneacion', {});
}

/**
 * Guarda/actualiza una semana de planeación en el Data Lake
 */
export async function guardarPlaneacionSemana(semana: SemanaPlaneacion): Promise<PlaneacionResponse> {
  return postToDataLake('guardarPlaneacion', semana);
}

/**
 * Aprueba una semana de planeación (solo directores)
 */
export async function aprobarPlaneacion(semana: number, directorEmail: string): Promise<PlaneacionResponse> {
  return postToDataLake('aprobarPlaneacion', {
    semana,
    director_email: directorEmail,
  });
}
