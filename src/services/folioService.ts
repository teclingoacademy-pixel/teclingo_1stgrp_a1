/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * folioService.ts
 * Servicio de Folios — Data Lake (Google Sheets)
 * CRUD completo de folios institucionales con firmas digitales
 */

/* ================================================================
   CONFIG
   ================================================================ */

const IDENTITY_API_URL =
  (import.meta.env.VITE_IDENTITY_API_URL as string | undefined)?.trim() ||
  'https://script.google.com/macros/s/AKfycbz1OBcF2logEt-r_gaOdpG9MhcjsVkz3_MZiJKf9iSS1T1lpYmAj_MoFtrssCnT7q-k/exec';

export type FolioStatus = 'PENDING' | 'COMPLETED';

export interface FolioData {
  id: string;
  title: string;
  subject: string;
  content: string;
  date: string;
  sender_name: string;
  sender_email: string;
  assigned_to_ids: string;
  status: FolioStatus;
  created_at: string;
  updated_at: string;
}

export interface FolioFirma {
  id: string;
  folio_id: string;
  teacher_id: string;
  teacher_name: string;
  signature_url: string;
  timestamp: string;
  ip_address: string;
  device: string;
}

export interface CrearFolioResult {
  ok: boolean;
  folio_id?: string;
  folio?: FolioData;
  error?: string;
  mensaje?: string;
}

export interface ObtenerFoliosResult {
  ok: boolean;
  folios: FolioData[];
  count: number;
  error?: string;
}

export interface FirmarFolioResult {
  ok: boolean;
  firma_id?: string;
  folio_id?: string;
  error?: string;
  mensaje?: string;
}

/* ================================================================
   HELPERS
   ================================================================ */

function getUserEmail(): string {
  const direct = localStorage.getItem('teclingo_user_email');
  if (direct) return direct;
  const session = localStorage.getItem('tecnolingo_session');
  if (session) {
    try {
      const parsed = JSON.parse(session);
      if (parsed?.email) return parsed.email;
    } catch { /* noop */ }
  }
  return '';
}

async function postAlFolio(payload: Record<string, unknown>, timeoutMs = 12000): Promise<any> {
  console.log(`[Folio MOCK] action=${payload.action} — datos van a PostgreSQL`);
  return { ok: true, folios: [] };
}

/* ================================================================
   CRUD — DATA LAKE
   ================================================================ */

/**
 * Crear un nuevo folio.
 */
export async function crearFolio(data: {
  title: string;
  subject: string;
  content: string;
  date?: string;
  assigned_to_ids: string[];
}): Promise<CrearFolioResult> {
  const email = getUserEmail();
  try {
    const res = await postAlFolio({
      action: 'crearFolio',
      email,
      title: data.title,
      subject: data.subject,
      content: data.content,
      date: data.date || new Date().toLocaleDateString('es-MX'),
      assigned_to_ids: data.assigned_to_ids,
    });
    return res;
  } catch (err) {
    console.error('[folioService] crearFolio error:', err);
    return { ok: false, error: 'network_error', mensaje: 'Error de conexión al crear folio' };
  }
}

/**
 * Obtener folios filtrados.
 */
export async function obtenerFolios(filters?: {
  status?: string;
  search?: string;
  rol?: string;
}): Promise<ObtenerFoliosResult> {
  const email = getUserEmail();
  try {
    const res = await postAlFolio({
      action: 'obtenerFolios',
      email,
      rol: filters?.rol || '',
      status: filters?.status || '',
      search: filters?.search || '',
    });
    return res;
  } catch (err) {
    console.error('[folioService] obtenerFolios error:', err);
    return { ok: false, folios: [], count: 0, error: 'network_error' };
  }
}

/**
 * Firmar un folio (docente).
 */
export async function firmarFolio(data: {
  folio_id: string;
  teacher_name: string;
  signature_url: string;
}): Promise<FirmarFolioResult> {
  const email = getUserEmail();
  try {
    const res = await postAlFolio({
      action: 'firmarFolio',
      email,
      folio_id: data.folio_id,
      teacher_name: data.teacher_name,
      signature_url: data.signature_url,
    });
    return res;
  } catch (err) {
    console.error('[folioService] firmarFolio error:', err);
    return { ok: false, error: 'network_error', mensaje: 'Error de conexión al firmar' };
  }
}

/**
 * Completar un folio (director).
 */
export async function completarFolio(folioId: string): Promise<{ ok: boolean; error?: string }> {
  const email = getUserEmail();
  try {
    const res = await postAlFolio({
      action: 'completarFolio',
      email,
      folio_id: folioId,
    });
    return res;
  } catch (err) {
    console.error('[folioService] completarFolio error:', err);
    return { ok: false, error: 'network_error' };
  }
}

/**
 * Obtener firmas de un folio.
 */
export async function obtenerFirmas(folioId: string): Promise<{ ok: boolean; firmas: FolioFirma[]; count: number }> {
  try {
    const res = await postAlFolio({
      action: 'obtenerFirmas',
      folio_id: folioId,
    });
    return res;
  } catch (err) {
    console.error('[folioService] obtenerFirmas error:', err);
    return { ok: false, firmas: [], count: 0 };
  }
}
