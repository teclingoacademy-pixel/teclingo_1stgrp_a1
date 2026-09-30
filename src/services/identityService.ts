/**
 * Identity Service — puente al Data Lake TECLINGO_IDENTITY_LAKE_V1.
 *
 * Identidad ÚNICA del ecosistema: un usuario existe UNA vez en el lake
 * (llave = email en minúsculas). Esta app delega en la Identity API.
 *
 * Patrón anti-CORS (probado en FASE 0): POST con body JSON pero
 * Content-Type text/plain;charset=utf-8. NUNCA mode:'no-cors'.
 */

const IDENTITY_API_URL =
  (import.meta.env.VITE_IDENTITY_API_URL as string | undefined)?.trim() ||
  'https://script.google.com/macros/s/AKfycbz1OBcF2logEt-r_gaOdpG9MhcjsVkz3_MZiJKf9iSS1T1lpYmAj_MoFtrssCnT7q-k/exec';

const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const LOCAL_API_URL = rawApiUrl
  ? (rawApiUrl.startsWith('http') ? rawApiUrl : `https://${rawApiUrl}`)
  : (import.meta.env.PROD ? '' : 'http://localhost:3000');

// Allow all origins for cross-origin requests from frontend to backend
const crossOriginOpenerPolicy = "none";

const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ||
  '853891222522-t26sp8ig5kn5vfir05om765vr2i0jsj3.apps.googleusercontent.com';

export interface IdentidadResultado {
  ok: boolean;
  code?: string;
  error?: string;
  email?: string;
  perfil?: Record<string, unknown>;
}

interface LakeResponse {
  ok?: boolean;
  code?: string;
  error?: string;
  exists?: boolean;
  perfil?: Record<string, unknown>;
  hitos?: Array<Record<string, unknown>>;
  asesorias?: Array<Record<string, unknown>>;
  config?: Record<string, unknown>;
  asesoria_id?: string;
  hoja?: string;
}

/** Convierte todos los valores string de un objeto a MAYÚSCULAS (para datos de formulario). */
function toUpperFields<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const k of Object.keys(out)) {
    if (typeof out[k] === 'string' && out[k]) {
      (out as any)[k] = (out[k] as string).toUpperCase().trim();
    }
  }
  return out;
}

/**
 * Versión "segura" de toUpperFields que excluye campos que NO deben convertirse:
 *  - URLs (http://, https://, drive.google.com, etc.)
 *  - Emails
 *  - Imágenes en base64
 *  - JSON serializado (specialties, certifications, etc.)
 *  - IDs (usr_xxx, GRP-xxx, etc.)
 */
const FIELDS_EXCLUDE_FROM_UPPER = new Set([
  'avatar', 'institution_logo', 'inst_email', 'facebook', 'instagram', 'linkedin',
  'email', 'director_email', 'user_id', 'id', 'userId', 'employeeId',
  'institution_code', // ya viene en mayúsculas
  'specialties', 'certifications', 'materias_json', 'horario', 'dias',
  'birth_date', // viene como YYYY-MM-DD
  'curp', // ya viene en mayúsculas con regex
  'student_id', // ya viene en mayúsculas
  'password' // nunca convertir
]);

function toUpperFieldsSafe<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const k of Object.keys(out)) {
    if (FIELDS_EXCLUDE_FROM_UPPER.has(k)) continue;
    if (typeof out[k] === 'string' && out[k]) {
      const s = (out[k] as string).trim();
      // No convertir si parece URL, base64, o JSON
      if (s.startsWith('http://') || s.startsWith('https://')) continue;
      if (s.startsWith('data:') || s.length > 200) continue; // base64 o texto largo
      if (s.startsWith('{') || s.startsWith('[')) continue; // JSON
      if (s.startsWith('usr_') || s.startsWith('GRP-') || s.startsWith('DIR-')) continue;
      (out as any)[k] = s.toUpperCase();
    }
  }
  return out;
}

/**
 * Google Sheets DESHABILITADO — todos los datos se guardan en PostgreSQL.
 * Esta funcion retorna mock responses para mantener compatibilidad con
 * el codigo existente que llama a postAlLake().
 */
async function postAlLake(payload: Record<string, unknown>, timeoutMs = 12000): Promise<LakeResponse> {
  const action = String(payload.action || '');
  console.log(`[Lake MOCK] action=${action} — datos van a PostgreSQL, no a Google Sheets`);

  // Simular respuestas segun la accion
  switch (action) {
    case 'verificarEmail':
      return { ok: true, exists: false };
    case 'obtenerPerfil':
      return { ok: true, perfil: {} };
    case 'guardarPerfil':
      return { ok: true, perfil: {}, hoja: 'PostgreSQL' };
    case 'obtenerMetas':
      return { ok: true, hitos: [] };
    case 'obtenerLogros':
      return { ok: true, hitos: [] };
    case 'obtenerAsesorias':
      return { ok: true, asesorias: [] };
    case 'obtenerConfig':
      return { ok: true, config: {} };
    default:
      return { ok: true };
  }
}

/** Verifica si un email ya existe en el ecosistema */
export async function verificarEmail(email: string): Promise<boolean> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/users/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim() }),
    });
    const res = await resp.json();
    return Boolean(res?.ok && res.exists);
  } catch {
    return false;
  }
}

/**
 * Consulta si el usuario existe en PostgreSQL.
 * Se usa al arrancar la app para evitar sesión fantasma.
 */
export type EstadoIdentidadLake = 'existe' | 'no_existe' | 'indefinido';
export async function consultarIdentidadEnLake(email: string): Promise<EstadoIdentidadLake> {
  try {
    const exists = await verificarEmail(email);
    return exists ? 'existe' : 'no_existe';
  } catch {
    return 'indefinido';
  }
}

/** Registra un usuario nuevo en PostgreSQL via Express local */
export async function registrarUsuario(
  email: string,
  password: string,
  nombre: string,
  rol: string = 'ALUMNO',
  institutionCode: string = ''
): Promise<IdentidadResultado> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nombre.toUpperCase().trim(),
        email: email.toLowerCase().trim(),
        password,
        role: rol,
      }),
    });
    const res = await resp.json();
    if (res?.ok) {
      return { ok: true, code: res.code, email: res.perfil?.email as string, perfil: res.perfil };
    }
    return { ok: false, code: res?.code, error: res?.error };
  } catch (err) {
    console.warn('[Identity] API local no disponible para registro:', err);
    return { ok: false, error: 'identity_unreachable' };
  }
}

/** Login con email y password via Express local */
export async function loginEmail(
  email: string,
  password: string
): Promise<IdentidadResultado> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
    });
    const res = await resp.json();
    if (res?.ok && res.code === 'login_ok') {
      return { ok: true, code: 'login_ok', email: res.perfil?.email as string, perfil: res.perfil };
    }
    return { ok: false, code: res?.code, error: res?.error };
  } catch (err) {
    console.warn('[Identity] API local no disponible para login:', err);
    return { ok: false, error: 'identity_unreachable' };
  }
}

/** Login con token de Google — valida contra Google y persiste en PostgreSQL via Express local */
export async function loginGoogle(token: string, rol: string = 'ALUMNO', institutionCode: string = ''): Promise<IdentidadResultado> {
  if (!token) return { ok: false, error: 'token_requerido' };
  try {
    const tokenInfoResp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if (!tokenInfoResp.ok) {
      return { ok: false, error: 'token_invalido' };
    }
    const tokenInfo = await tokenInfoResp.json();
    const email = tokenInfo.email;
    const name = tokenInfo.name || tokenInfo.given_name || '';

    if (!email) return { ok: false, error: 'email_no_en_token' };

    const resp = await fetch(`${LOCAL_API_URL}/api/users/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, rol, institution_code: institutionCode }),
    });
    const res = await resp.json();
    if (res?.ok) {
      return { ok: true, code: res.code, email: res.perfil?.email as string, perfil: res.perfil };
    }
    return { ok: false, code: res?.code, error: res?.error };
  } catch (err) {
    console.warn('[Identity] API local no disponible para loginGoogle:', err);
    return { ok: false, error: 'identity_unreachable' };
  }
}

/** Completa el registro de un usuario de PRIMERA VEZ que entró con Google */
export async function finalizarRegistroGoogle(
  email: string,
  rol: string,
  institutionCode: string = ''
): Promise<IdentidadResultado> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/users/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: '', rol, institution_code: institutionCode }),
    });
    const res = await resp.json();
    if (res?.ok) {
      return { ok: true, code: res.code, email: res.perfil?.email as string, perfil: res.perfil };
    }
    return { ok: false, code: res?.code, error: res?.error };
  } catch (err) {
    console.warn('[Identity] API local no disponible para finalizarRegistroGoogle:', err);
    return { ok: false, error: 'identity_unreachable' };
  }
}

/** Obtiene el perfil completo de un usuario desde el lake */
export async function obtenerPerfil(email: string): Promise<Record<string, unknown> | null> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/user/${encodeURIComponent(email.toLowerCase().trim())}`);
    const res = await resp.json();
    if (res?.ok && res.user) {
      const u = res.user;
      return {
        id: u.id, email: u.email, name: u.name, rol: u.role,
        avatar: u.avatar, nivel: u.nivel, nikName: u.nikName,
        metodo: u.metodo, active: u.active,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Registra un evento en LOG_ACTIVIDAD_GLOBAL del lake (fire-and-forget) */
export async function logActividadGlobal(
  email: string,
  herramienta: string,
  accion: string,
  detalle: string
): Promise<void> {
  try {
    await postAlLake({
      action: 'registrarActividadGlobal',
      email: email.toLowerCase().trim(),
      app: 'teclingo_v4',
      herramienta,
      accion,
      detalle,
    }, 5000);
  } catch {
    // Fire-and-forget: no bloquea la UI
  }
}

// ============================================================
// PERFIL COMPLETO
// ============================================================
//
// Nueva arquitectura de hojas separadas (reestructuración 2026):
//   - USUARIOS:   datos comunes de acceso + rol + avatar
//   - ALUMNOS:    phone, bio, curp, student_id, birth_date,
//                 student_number, career, shift
//   - DOCENTES:   phone, bio, degree, specialties, certifications
//   - DIRECTORES: phone, bio, institution_name, institution_logo,
//                 slogan, inst_phone, address, inst_email,
//                 facebook, instagram, linkedin, institution_code
//
// El front-end ahora SIEMPRE envía `rol` en cada llamada para que
// el backend (Apps Script) enrute a la hoja correcta.
// La hoja legacy `USERS` está oculta y no debe usarse.

export type RolUsuario = 'ALUMNO' | 'DOCENTE' | 'DIRECTOR';

export interface GuardarPerfilArgs {
  email: string;
  rol: RolUsuario;
  campos: Record<string, string>;
}

export async function guardarPerfil(
  emailOrArgs: string | GuardarPerfilArgs,
  camposLegacy?: Record<string, string>
): Promise<IdentidadResultado & { actualizados?: number; hoja?: string }> {
  // Compatibilidad hacia atrás: signature antigua (email, campos)
  const args: GuardarPerfilArgs = typeof emailOrArgs === 'string'
    ? { email: emailOrArgs, rol: 'ALUMNO', campos: camposLegacy || {} }
    : emailOrArgs;
  try {
    // Uniformar todos los valores string a MAYÚSCULAS (excepto URLs y emails)
    const camposUpper = toUpperFieldsSafe(args.campos);
    const res = await postAlLake({
      action: 'guardarPerfil',
      email: args.email.toLowerCase().trim(),
      rol: args.rol,
      campos: camposUpper,
    }, 15000);
    if (res?.ok) {
      return {
        ok: true,
        perfil: res.perfil,
        actualizados: (res as any).actualizados,
        hoja: (res as any).hoja,
      };
    }
    return { ok: false, code: res?.code, error: res?.error };
  } catch { return { ok: false, error: 'lake_unreachable' }; }
}

export interface ObtenerPerfilCompletoArgs {
  email: string;
  rol?: RolUsuario; // si no se pasa, el backend infiere por USUARIOS
}

// Resuelve el perfil institucional del director vinculado.
// Primero por email del director; si el vínculo no lo trae, cae al código
// institucional distribuido (institution_code), que es la vía real de unión.
async function obtenerDirectorVinculado(
  directorEmail?: string | null,
  institutionCode?: string | null
): Promise<Record<string, any> | null> {
  try {
    if (directorEmail) {
      const r = await fetch(`${LOCAL_API_URL}/api/director-profile/${encodeURIComponent(directorEmail)}`);
      const res = await r.json();
      if (res?.ok && res.profile) return res.profile;
    }
    if (institutionCode) {
      const r = await fetch(`${LOCAL_API_URL}/api/director-by-code/${encodeURIComponent(institutionCode)}`);
      const res = await r.json();
      if (res?.ok && res.profile) return res.profile;
    }
    return null;
  } catch {
    return null;
  }
}

export async function obtenerPerfilCompleto(
  emailOrArgs: string | ObtenerPerfilCompletoArgs
): Promise<Record<string, unknown> | null> {
  const args: ObtenerPerfilCompletoArgs = typeof emailOrArgs === 'string'
    ? { email: emailOrArgs }
    : emailOrArgs;
  try {
    const email = args.email.toLowerCase().trim();
    const rol = args.rol;

    // 1. Obtener datos base del usuario
    const userResp = await fetch(`${LOCAL_API_URL}/api/user/${encodeURIComponent(email)}`);
    const userRes = await userResp.json();
    if (!userRes?.ok || !userRes.user) return null;
    const u = userRes.user;

    // Mapear a formato del frontend (兼容ibilidad con campo 'nombre')
    const perfil: Record<string, unknown> = {
      id: u.id, email: u.email, name: u.name, nombre: u.name,
      rol: u.role, avatar: u.avatar, nivel: u.nivel, nikName: u.nikName,
      metodo: u.metodo, active: u.active,
    };

    // 2. Si es DIRECTOR, enrichir con DirectorProfile
    if (rol === 'DIRECTOR') {
      const dirResp = await fetch(`${LOCAL_API_URL}/api/director-profile/${encodeURIComponent(email)}`);
      const dirRes = await dirResp.json();
      if (dirRes?.ok && dirRes.profile) {
        const d = dirRes.profile;
        perfil.institution_name = d.institutionName || '';
        perfil.institution_code = d.institutionCode || '';
        perfil.institution_logo = d.institutionLogo || '';
        perfil.institution_type = d.institutionType || '';
        perfil.slogan = d.slogan || '';
        perfil.phone = d.phone || '';
        perfil.bio = d.bio || '';
        perfil.curp = d.curp || '';
        perfil.birth_date = d.birthDate || '';
        perfil.degree = d.degree || '';
        perfil.experience_years = d.experienceYears || 0;
        perfil.inst_phone = d.instPhone || '';
        perfil.address = d.address || '';
        perfil.inst_email = d.instEmail || '';
        perfil.facebook = d.facebook || '';
        perfil.instagram = d.instagram || '';
        perfil.linkedin = d.linkedin || '';
        perfil.carrera_1 = d.carrera1 || '';
        perfil.carrera_2 = d.carrera2 || '';
        perfil.carrera_3 = d.carrera3 || '';
        perfil.carrera_4 = d.carrera4 || '';
        perfil.carrera_5 = d.carrera5 || '';
        perfil.carrera_6 = d.carrera6 || '';
        perfil.carrera_7 = d.carrera7 || '';
        perfil.turno_matutino = d.turnoMatutino ? 'TRUE' : '';
        perfil.turno_vespertino = d.turnoVespertino ? 'TRUE' : '';
        perfil.turno_semi_escolarizado = d.turnoSemiEscolarizado ? 'TRUE' : '';
        perfil.turno_sabatino = d.turnoSabatino ? 'TRUE' : '';
        perfil.turno_distancia = d.turnoDistancia ? 'TRUE' : '';
        perfil.modalidad = d.modalidad || '';
        perfil.semestres = d.semestres || '';
      }
    }

    // 3. Si es DOCENTE, enrichir con TeacherProfile
    if (rol === 'DOCENTE') {
      const tResp = await fetch(`${LOCAL_API_URL}/api/teacher-profile/${encodeURIComponent(email)}`);
      const tRes = await tResp.json();
      if (tRes?.ok && tRes.profile) {
        const t = tRes.profile;
        perfil.id_empleado = t.idEmpleado || '';
        perfil.phone = t.phone || '';
        perfil.bio = t.bio || '';
        perfil.curp = t.curp || '';
        perfil.birth_date = t.birthDate || '';
        perfil.degree = t.degree || '';
        perfil.experience_years = t.experienceYears || 0;
        perfil.specialties = t.specialties || '';
        perfil.certifications = t.certifications || '';
        perfil.institution_code = t.institutionCode || '';
        perfil.director_email = t.directorEmail || '';
      }
    }

    // 4. Si es ALUMNO, enrichir con StudentProfile
    if (rol === 'ALUMNO') {
      const sResp = await fetch(`${LOCAL_API_URL}/api/student-profile/${encodeURIComponent(email)}`);
      const sRes = await sResp.json();
      if (sRes?.ok && sRes.profile) {
        const s = sRes.profile;
        perfil.student_id = s.studentId || '';
        perfil.phone = s.phone || '';
        perfil.institution_code = s.institutionCode || '';
        perfil.director_email = s.directorEmail || '';
        perfil.bio = s.bio || '';
        perfil.curp = s.curp || '';
        perfil.birth_date = s.birthDate || '';
        perfil.numero_control = s.numeroControl || '';
        perfil.carrera = s.carrera || '';
        perfil.turno = s.turno || '';
        perfil.semestre = s.semestre || '';
        perfil.modulo_tec = s.moduloTec || '';
        perfil.nivel_ingles = s.nivelIngles || '';

        // Cargar datos del director vinculado (por email o, si falta, por código institucional)
        if (s.directorEmail || s.institutionCode) {
          try {
            const d = await obtenerDirectorVinculado(s.directorEmail, s.institutionCode);
            if (d) {
              perfil.dir_institution_name = d.institutionName || '';
              perfil.dir_institution_type = d.institutionType || '';
              perfil.dir_institution_logo = d.institutionLogo || '';
              perfil.dir_slogan = d.slogan || '';
              perfil.dir_inst_phone = d.instPhone || '';
              perfil.dir_inst_email = d.instEmail || '';
              perfil.dir_address = d.address || '';
              perfil.dir_institution_code = d.institutionCode || '';
              perfil.dir_carreras = [d.carrera1, d.carrera2, d.carrera3, d.carrera4, d.carrera5, d.carrera6, d.carrera7].filter(Boolean);
              perfil.dir_turnos = [
                d.turnoMatutino ? 'MATUTINO' : null,
                d.turnoVespertino ? 'VESPERTINO' : null,
                d.turnoSemiEscolarizado ? 'SEMI-ESCOLARIZADO' : null,
                d.turnoSabatino ? 'SABATINO' : null,
                d.turnoDistancia ? 'DISTANCIA / EN LÍNEA' : null,
              ].filter(Boolean);
              perfil.dir_modalidad = d.modalidad || '';
            }
          } catch { /* director profile not available */ }
        }
      }
    }

    // 5. Si es DOCENTE, enrichir con datos del director vinculado
    if (rol === 'DOCENTE' && (perfil.director_email || perfil.institution_code)) {
      try {
        const d = await obtenerDirectorVinculado(perfil.director_email as string, perfil.institution_code as string);
        if (d) {
          perfil.dir_institution_name = d.institutionName || '';
          perfil.dir_institution_type = d.institutionType || '';
          perfil.dir_institution_logo = d.institutionLogo || '';
          perfil.dir_slogan = d.slogan || '';
          perfil.dir_inst_phone = d.instPhone || '';
          perfil.dir_inst_email = d.instEmail || '';
          perfil.dir_address = d.address || '';
          perfil.dir_institution_code = d.institutionCode || '';
          perfil.dir_carreras = [d.carrera1, d.carrera2, d.carrera3, d.carrera4, d.carrera5, d.carrera6, d.carrera7].filter(Boolean);
          perfil.dir_turnos = [
            d.turnoMatutino ? 'MATUTINO' : null,
            d.turnoVespertino ? 'VESPERTINO' : null,
            d.turnoSemiEscolarizado ? 'SEMI-ESCOLARIZADO' : null,
            d.turnoSabatino ? 'SABATINO' : null,
            d.turnoDistancia ? 'DISTANCIA / EN LÍNEA' : null,
          ].filter(Boolean);
          perfil.dir_modalidad = d.modalidad || '';
        }
      } catch { /* director profile not available */ }
    }

    return perfil;
  } catch { return null; }
}

// ============================================================
// METAS
// ============================================================

export async function registrarMeta(
  email: string, titulo: string, descripcion: string, plazo: string, origen_app: string
): Promise<IdentidadResultado & { id?: string }> {
  try {
    const res = await postAlLake({
      action: 'registrarMeta', email: email.toLowerCase().trim(),
      titulo, descripcion, plazo, origen_app
    });
    if (res?.ok) return { ok: true, id: (res as any).id };
    return { ok: false, code: res?.code, error: res?.error };
  } catch { return { ok: false, error: 'lake_unreachable' }; }
}

export async function obtenerMetas(email: string): Promise<any[]> {
  try {
    const res = await postAlLake({ action: 'obtenerMetas', email: email.toLowerCase().trim() });
    if (res?.ok && (res as any).metas) return (res as any).metas;
    return [];
  } catch { return []; }
}

export async function actualizarMeta(
  email: string, id: string, campos: Record<string, string>
): Promise<IdentidadResultado> {
  try {
    const res = await postAlLake({ action: 'actualizarMeta', email: email.toLowerCase().trim(), id, campos });
    if (res?.ok) return { ok: true };
    return { ok: false, code: res?.code, error: res?.error };
  } catch { return { ok: false, error: 'lake_unreachable' }; }
}

export async function eliminarMeta(email: string, id: string): Promise<IdentidadResultado> {
  try {
    const res = await postAlLake({ action: 'eliminarMeta', email: email.toLowerCase().trim(), id });
    if (res?.ok) return { ok: true };
    return { ok: false, code: res?.code, error: res?.error };
  } catch { return { ok: false, error: 'lake_unreachable' }; }
}

// ============================================================
// LOGROS
// ============================================================

export async function registrarLogro(
  email: string, logro_id: string, app_origen: string, titulo: string, descripcion: string
): Promise<IdentidadResultado & { id?: string }> {
  try {
    const res = await postAlLake({
      action: 'registrarLogro', email: email.toLowerCase().trim(),
      logro_id, app_origen, titulo, descripcion
    });
    if (res?.ok) return { ok: true, id: (res as any).id };
    return { ok: false, code: res?.code, error: res?.error };
  } catch { return { ok: false, error: 'lake_unreachable' }; }
}

export async function obtenerLogros(email: string): Promise<any[]> {
  try {
    const res = await postAlLake({ action: 'obtenerLogros', email: email.toLowerCase().trim() });
    if (res?.ok && (res as any).logros) return (res as any).logros;
    return [];
  } catch { return []; }
}

// ============================================================
// PAGOS Y SUSCRIPCIONES (para consultas desde V4)
// ============================================================

export async function registrarPago(
  email: string, proveedor: string, referencia: string, monto: string,
  moneda: string, estado: string, origen_app: string
): Promise<IdentidadResultado & { id?: string }> {
  try {
    const res = await postAlLake({
      action: 'registrarPago', email: email.toLowerCase().trim(),
      proveedor, referencia, monto, moneda, estado, origen_app
    });
    if (res?.ok) return { ok: true, id: (res as any).id };
    return { ok: false, code: res?.code, error: res?.error };
  } catch { return { ok: false, error: 'lake_unreachable' }; }
}

export async function registrarSuscripcion(
  email: string, plan: string, estado: string, origen_app: string
): Promise<IdentidadResultado & { id?: string }> {
  try {
    const res = await postAlLake({
      action: 'registrarSuscripcion', email: email.toLowerCase().trim(),
      plan, estado, origen_app
    });
    if (res?.ok) return { ok: true, id: (res as any).id };
    return { ok: false, code: res?.code, error: res?.error };
  } catch { return { ok: false, error: 'lake_unreachable' }; }
}

// ============================================================
// EMAIL DE BIENVENIDA
// ============================================================

export async function sendWelcomeEmail(
  email: string, nombre: string, metodo: string
): Promise<void> {
  try {
    const appUrl = window.location.origin;
    await postAlLake({
      action: 'sendWelcomeEmail',
      email: email.toLowerCase().trim(),
      nombre,
      metodo,
      app_url: appUrl,
    }, 5000);
  } catch { /* fire-and-forget */ }
}

// ============================================================
// GOOGLE DRIVE — AVATAR Y ARCHIVOS DE USUARIO
// ============================================================

export interface UploadAvatarResult {
  ok: boolean;
  fileUrl?: string;
  fileId?: string;
  code?: string;
  error?: string;
  /** Origen del archivo: Supabase Storage (primario) o Google Drive (fallback) */
  provider?: 'supabase' | 'drive';
}

/**
 * Sube imagen (base64) para la ID Card institucional.
 * 1) PRIMARIO: Supabase Storage (bucket TECLINGO INGLES IMAGENES) vía backend local.
 * 2) FALLBACK: flujo anterior de Google Drive (Apps Script) si Supabase no está configurado.
 * folder: 'avatars' (foto de usuario) | 'logos' (logo institucional)
 */
export async function uploadAvatar(
  email: string,
  imageBase64: string,
  fileName: string = 'avatar.jpg',
  mimeType: string = 'image/jpeg',
  folder: 'avatars' | 'logos' | 'imagenes' = 'avatars'
): Promise<UploadAvatarResult> {
  let lastSupabaseError = '';

  // 1) PRIMARIO — Supabase Storage vía backend local
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/supabase-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        imageBase64,
        fileName,
        mimeType,
        folder,
      }),
    });
    const res = await resp.json().catch(() => null);
    if (res?.ok && (res as any).fileUrl) {
      return {
        ok: true,
        fileUrl: (res as any).fileUrl,
        fileId: (res as any).fileId,
        provider: 'supabase',
      };
    }
    // Cualquier fallo de Supabase (no configurado, RLS, bucket, red) → fallback a Drive
    console.warn('[Identity] Supabase upload no disponible:', res?.error || resp.status);
    lastSupabaseError = String(res?.error || `http_${resp.status}`);
  } catch (err) {
    // Backend local inalcanzable → fallback a Drive
    console.warn('[Identity] Backend local inalcanzable para Supabase:', err);
    lastSupabaseError = 'backend_local_inalcanzable';
  }

  // 2) FALLBACK — Google Drive vía Apps Script (flujo anterior)
  try {
    const res = await postAlLake({
      action: 'uploadAvatar',
      email: email.toLowerCase().trim(),
      imageBase64,
      fileName,
      mimeType,
    }, 30000); // 30s timeout para archivos grandes
    if (res?.ok) {
      return {
        ok: true,
        fileUrl: (res as any).fileUrl,
        fileId: (res as any).fileId,
        provider: 'drive',
      };
    }
    // Ambos almacenamientos fallaron: se reportan los dos motivos
    const dual = [lastSupabaseError, res?.error || res?.code].filter(Boolean).join(' | ');
    return { ok: false, code: res?.code, error: dual || 'upload_failed', provider: 'drive' };
  } catch (err) {
    console.warn('[Identity] uploadAvatar error:', err);
    const dual = [lastSupabaseError, 'drive_unreachable'].filter(Boolean).join(' | ');
    return { ok: false, error: dual, provider: 'drive' };
  }
}

export interface UploadEvidenceResult {
  ok: boolean;
  fileUrl?: string;
  fileId?: string;
  evidenciaId?: string;
  code?: string;
  error?: string;
}

/** Sube imagen de evidencia (retraso, inasistencia, etc.) a la carpeta compartida de Drive */
export async function uploadEvidence(
  email: string,
  imageBase64: string,
  fileName: string = 'evidencia.jpg',
  mimeType: string = 'image/jpeg',
  tipo: string = 'retraso',
  grupoId: string = '',
  fecha: string = ''
): Promise<UploadEvidenceResult> {
  try {
    const today = fecha || new Date().toISOString().slice(0, 10);
    const res = await postAlLake({
      action: 'uploadEvidence',
      email: email.toLowerCase().trim(),
      imageBase64,
      fileName,
      mimeType,
      tipo,
      grupo_id: grupoId,
      fecha: today,
    }, 30000); // 30s timeout para archivos grandes
    if (res?.ok) {
      return {
        ok: true,
        fileUrl: (res as any).fileUrl,
        fileId: (res as any).fileId,
        evidenciaId: (res as any).evidenciaId,
      };
    }
    return { ok: false, code: res?.code, error: res?.error };
  } catch (err) {
    console.warn('[Identity] uploadEvidence error:', err);
    return { ok: false, error: 'drive_unreachable' };
  }
}

export interface Evidencia {
  id: string;
  user_id: string;
  email: string;
  nombre: string;
  tipo: string;
  grupo_id: string;
  fecha: string;
  file_name: string;
  file_url: string;
  file_id: string;
  mime_type: string;
  created_at: string;
}

/** Obtiene evidencias filtradas por grupo_id (para el docente) */
export async function fetchEvidenciasPorGrupo(
  email: string,
  grupoId: string,
  fecha?: string
): Promise<{ ok: boolean; evidencias?: Evidencia[]; error?: string }> {
  try {
    const res = await postAlLake({
      action: 'obtenerEvidenciasPorGrupo',
      email: email.toLowerCase().trim(),
      grupo_id: grupoId,
      fecha: fecha || '',
    }, 15000);
    if (res?.ok) {
      return { ok: true, evidencias: (res as any).evidencias || [] };
    }
    return { ok: false, error: res?.error || 'fetch_failed' };
  } catch (err) {
    console.warn('[Identity] fetchEvidenciasPorGrupo error:', err);
    return { ok: false, error: 'network_error' };
  }
}

export interface UploadCertificationResult {
  ok: boolean;
  fileUrl?: string;
  fileId?: string;
  error?: string;
}

/**
 * Sube un documento de certificación (PDF, imagen, etc.) al Google Drive
 * en la carpeta designada para certificaciones.
 *
 * @param email      Email del usuario propietario
 * @param fileBase64 Contenido del archivo en base64 (data URL o raw base64)
 * @param fileName   Nombre original del archivo
 * @param mimeType   Tipo MIME del archivo
 * @param role       Rol del usuario ('DOCENTE' | 'ALUMNO' | 'DIRECTOR')
 *                   para determinar la carpeta de destino en Drive
 */
export async function uploadCertificationDocument(
  email: string,
  fileBase64: string,
  fileName: string,
  mimeType: string,
  role: string = 'DOCENTE'
): Promise<UploadCertificationResult> {
  try {
    // Sube el documento al endpoint real de Supabase Storage.
    // El backend acepta imágenes + PDFs + Office (ver /api/supabase-upload).
    const resp = await fetch(`${LOCAL_API_URL}/api/supabase-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        imageBase64: fileBase64,
        fileName,
        mimeType,
        folder: 'docs', // bucket path: docs/<email>/...
      }),
    });
    const res = await resp.json().catch(() => ({}));
    if (res?.ok && res.fileUrl) {
      return { ok: true, fileUrl: res.fileUrl, fileId: res.fileId };
    }
    return { ok: false, error: res?.error || `http_${resp.status}` };
  } catch (err) {
    console.warn('[Identity] uploadCertificationDocument error:', err);
    return { ok: false, error: 'supabase_unreachable' };
  }
}

// ============================================================
// MENSAJERÍA
// ============================================================

export async function registrarChat(
  email: string, chatId: string, name: string, type: string,
  participants: string[], lastMessage?: string
): Promise<IdentidadResultado & { chat_id?: string }> {
  try {
    const res = await postAlLake({
      action: 'registrarChat', email: email.toLowerCase().trim(),
      chat_id: chatId, name, type, participants, last_message: lastMessage || ''
    });
    if (res?.ok) return { ok: true, chat_id: (res as any).chat_id };
    return { ok: false, code: res?.code, error: res?.error };
  } catch { return { ok: false, error: 'lake_unreachable' }; }
}

export async function registrarMensaje(
  email: string, chatId: string, content: string,
  senderName: string, senderRole: string, isDirector?: boolean
): Promise<IdentidadResultado & { msg_id?: string }> {
  try {
    const res = await postAlLake({
      action: 'registrarMensaje', email: email.toLowerCase().trim(),
      chat_id: chatId, content, sender_name: senderName,
      sender_role: senderRole, is_director: isDirector || false
    });
    if (res?.ok) return { ok: true, msg_id: (res as any).msg_id };
    return { ok: false, code: res?.code, error: res?.error };
  } catch { return { ok: false, error: 'lake_unreachable' }; }
}

export async function obtenerMensajes(
  chatId: string, limit?: number
): Promise<any[]> {
  try {
    const res = await postAlLake({
      action: 'obtenerMensajes', chat_id: chatId, limit: limit || 100
    });
    if (res?.ok && (res as any).mensajes) return (res as any).mensajes;
    return [];
  } catch { return []; }
}

export async function obtenerChats(
  email: string
): Promise<any[]> {
  try {
    const res = await postAlLake({
      action: 'obtenerChats', email: email.toLowerCase().trim()
    });
    if (res?.ok && (res as any).chats) return (res as any).chats;
    return [];
  } catch { return []; }
}

// ============================================================
// COMUNIDAD TECNOLINGO — LISTADO DE USUARIOS
// ============================================================

export interface UsuarioComunidad {
  id: string;
  email: string;
  nombre: string;
  rol: 'ALUMNO' | 'DOCENTE' | 'DIRECTOR';
  avatar: string;
  status: 'ACTIVE' | 'SUSPENDED';
  phone: string;
  curp: string;
  controlNumber: string;
  id_empleado: string;
  location: string;
  nivel: string;
  joinDate: string;
  hoja: string;
}

/**
 * Lista usuarios del Data Lake para la vista Comunidad Tecnolingo.
 * Une USUARIOS + ALUMNOS/DOCENTES/DIRECTORES por user_id.
 * Filtros: TODOS / DOCENTE / ALUMNO / DIRECTOR
 * Búsqueda: case-insensitive en nombre o email
 */
export async function listarUsuarios(
  filtro: 'TODOS' | 'DOCENTE' | 'ALUMNO' | 'DIRECTOR' = 'TODOS',
  buscar: string = ''
): Promise<UsuarioComunidad[]> {
  try {
    const params = new URLSearchParams();
    if (filtro !== 'TODOS') params.set('filtro', filtro);
    if (buscar) params.set('buscar', buscar);
    const qs = params.toString();
    const resp = await fetch(`${LOCAL_API_URL}/api/users-list${qs ? '?' + qs : ''}`);
    const res = await resp.json();
    if (res?.ok && Array.isArray(res.usuarios)) {
      return res.usuarios as UsuarioComunidad[];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Repara una hoja del Data Lake (corrige headers desalineados y migra datos).
 * @param nombreHoja - Nombre de la hoja a reparar (ej: 'DOCENTES', 'ALUMNOS')
 */
export async function repararHojaRol(
  nombreHoja: string
): Promise<{ ok: boolean; filasReparadas?: number; error?: string }> {
  try {
    const res = await postAlLake({
      action: 'repararHojaRol',
      nombreHoja
    }, 30000);
    return res as any;
  } catch {
    return { ok: false, error: 'error_conexion' };
  }
}

// ============================================================
// GRUPOS ACADÉMICOS
// ============================================================

export interface GrupoAcademico {
  grupo_id: string;
  director_email: string;
  institution_code: string;
  carrera: string;
  grado: string;
  seccion: string;
  turno: string;
  modalidad: string;
  materias: any[];
  horario: Record<string, string>;
  dias: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export async function listarGrupos(email: string): Promise<GrupoAcademico[]> {
  try {
    const res = await postAlLake({
      action: 'listarGrupos',
      email: email.toLowerCase().trim()
    }, 15000);
    if (res?.ok && Array.isArray((res as any).grupos)) {
      return (res as any).grupos as GrupoAcademico[];
    }
    return [];
  } catch {
    return [];
  }
}

export async function crearGrupo(
  email: string,
  grupo: {
    carrera: string;
    grado: string;
    seccion: string;
    turno: string;
    modalidad?: string;
    materias?: any[];
    horario?: Record<string, string>;
    dias?: string;
  }
): Promise<IdentidadResultado & { grupo_id?: string }> {
  try {
    const res = await postAlLake({
      action: 'crearGrupo',
      email: email.toLowerCase().trim(),
      ...grupo,
      modalidad: grupo.modalidad || 'PRESENCIAL',
      dias: grupo.dias || 'LUN,MAR,MIÉ,JUE,VIE'
    }, 15000);
    if (res?.ok) {
      return { ok: true, grupo_id: (res as any).grupo_id };
    }
    return { ok: false, error: (res as any).error };
  } catch {
    return { ok: false, error: 'lake_unreachable' };
  }
}

export async function eliminarGrupo(email: string, grupoId: string): Promise<IdentidadResultado> {
  try {
    const res = await postAlLake({
      action: 'eliminarGrupo',
      email: email.toLowerCase().trim(),
      grupo_id: grupoId
    }, 15000);
    if (res?.ok) return { ok: true };
    return { ok: false, error: (res as any).error };
  } catch {
    return { ok: false, error: 'lake_unreachable' };
  }
}

export async function obtenerConfigAcademica(
  args: { email: string; director_email?: string }
): Promise<{ ok: boolean; institution_type?: string; carreras?: string[]; turnos?: string[]; modalidad?: string; defaults?: boolean; error?: string }> {
  try {
    const directorEmail = args.director_email?.toLowerCase().trim() || args.email.toLowerCase().trim();
    const resp = await fetch(`${LOCAL_API_URL}/api/director-profile/${encodeURIComponent(directorEmail)}`);
    const res = await resp.json();
    if (res?.ok && res.profile) {
      const d = res.profile;
      const turnos: string[] = [];
      if (d.turnoMatutino) turnos.push('MATUTINO');
      if (d.turnoVespertino) turnos.push('VESPERTINO');
      if (d.turnoSemiEscolarizado) turnos.push('SEMI-ESCOLARIZADO');
      if (d.turnoSabatino) turnos.push('SABATINO');
      if (d.turnoDistancia) turnos.push('DISTANCIA / EN LÍNEA');

      const carreras = [d.carrera1, d.carrera2, d.carrera3, d.carrera4, d.carrera5, d.carrera6, d.carrera7].filter(Boolean);

      return {
        ok: true,
        institution_type: d.institutionType || undefined,
        carreras,
        turnos,
        modalidad: d.modalidad || undefined,
        defaults: false,
      };
    }
    return { ok: false, error: 'director_not_found' };
  } catch {
    return { ok: false, error: 'api_unreachable' };
  }
}

// ============================================================
// GRUPOS DE INGLÉS (CLE)
// ============================================================

export interface SesionHorario {
  id?: string;
  horaInicio: string;
  horaFin: string;
  dias: string;
  orden?: number;
}

export interface GrupoIngles {
  grupo_id: string;
  code_id?: string;
  nombre: string;
  grupo: string;
  nivel: string;
  carrera: string;
  turno: string;
  docente_id: string;
  docente_email: string;
  director_email?: string;
  capacidad: number;
  alumnos_inscritos: number;
  status: string;
  created_at: string;
  updated_at: string;
  sesiones?: SesionHorario[];
}

export interface MiembroGrupo {
  asignacion_id: string;
  grupo_id: string;
  user_id: string;
  email: string;
  nombre: string;
  rol_en_grupo: string;
  fecha_asignacion: string;
  asignado_por: string;
  activo: string;
  // REGLA UNIVERSAL: imagen y datos académicos del usuario (credenciales visuales)
  avatar?: string | null;
  numero_control?: string | null;
  nivel_ingles?: string | null;
  carrera?: string | null;
  semestre?: string | null;
}

export async function crearGrupoIngles(
  email: string,
  data: { nombre: string; grupo?: string; nivel: string; carrera?: string; turno?: string; sesiones?: SesionHorario[]; horario?: string; dias?: string; capacidad?: number }
): Promise<IdentidadResultado & { grupo_id?: string; code_id?: string }> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/english-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim(), ...data }),
    });
    const res = await resp.json();
    if (res?.ok) {
      return { ok: true, grupo_id: res.grupo_id, code_id: res.code_id };
    }
    return { ok: false, error: res?.error };
  } catch {
    return { ok: false, error: 'api_unreachable' };
  }
}

export async function listarGruposIngles(email: string): Promise<GrupoIngles[]> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/english-groups/${encodeURIComponent(email.toLowerCase().trim())}`);
    const res = await resp.json();
    if (res?.ok && Array.isArray(res.grupos)) {
      return res.grupos as GrupoIngles[];
    }
    return [];
  } catch {
    return [];
  }
}

/** Lista TODOS los grupos disponibles (para alumnos — sin filtro por director) */
export async function listarGruposDisponibles(): Promise<GrupoIngles[]> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/english-groups-available`);
    const res = await resp.json();
    if (res?.ok && Array.isArray(res.grupos)) {
      return res.grupos as GrupoIngles[];
    }
    return [];
  } catch {
    return [];
  }
}

export async function asignarDocenteAGrupo(
  email: string, grupoId: string, docenteEmail: string
): Promise<IdentidadResultado> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/english-groups/${grupoId}/assign-teacher`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docente_email: docenteEmail.toLowerCase().trim() }),
    });
    const res = await resp.json();
    if (res?.ok) return { ok: true };
    return { ok: false, error: res?.error };
  } catch {
    return { ok: false, error: 'api_unreachable' };
  }
}

export async function unirseAGrupo(
  email: string, codeId: string
): Promise<IdentidadResultado & { grupo_id?: string; nombre?: string; mensaje?: string }> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/english-groups/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim(), code_id: codeId.trim() }),
    });
    const res = await resp.json();
    if (res?.ok) {
      return { ok: true, grupo_id: res.grupo_id, nombre: res.nombre };
    }
    return { ok: false, error: res?.error, mensaje: res?.error };
  } catch {
    return { ok: false, error: 'api_unreachable' };
  }
}

export async function obtenerMiembrosDeGrupo(
  email: string, grupoId: string
): Promise<MiembroGrupo[]> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/english-groups/${grupoId}/members`);
    const res = await resp.json();
    if (res?.ok && Array.isArray(res.miembros)) {
      return res.miembros as MiembroGrupo[];
    }
    return [];
  } catch {
    return [];
  }
}

export async function eliminarGrupoIngles(
  email: string, grupoId: string
): Promise<IdentidadResultado> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/english-groups/${grupoId}`, {
      method: 'DELETE',
    });
    const res = await resp.json();
    if (res?.ok) return { ok: true };
    return { ok: false, error: res?.error };
  } catch {
    return { ok: false, error: 'api_unreachable' };
  }
}

export async function misGruposIngles(email: string): Promise<GrupoIngles[]> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/my-english-groups/${encodeURIComponent(email.toLowerCase().trim())}`);
    const res = await resp.json();
    if (res?.ok && Array.isArray(res.grupos)) {
      return res.grupos as GrupoIngles[];
    }
    return [];
  } catch {
    return [];
  }
}

// ============================================================
// ASISTENCIAS
// ============================================================

export interface RegistroAsistencia {
  user_id: string;
  email: string;
  nombre: string;
  estado: 'PRESENTE' | 'AUSENTE' | 'RETRASO' | 'JUSTIFICADO';
}

export interface RegistroAsistenciaBackend {
  id: string;
  grupo_id: string;
  user_id: string;
  email: string;
  nombre: string;
  fecha: string;
  estado: string;
  docente_email: string;
  created_at: string;
}

export async function registrarAsistencia(
  email: string, grupoId: string, registros: RegistroAsistencia[], fecha?: string
): Promise<IdentidadResultado & { registrados?: number }> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        grupo_id: grupoId,
        registros,
        fecha: fecha || new Date().toISOString().slice(0, 10),
      }),
    });
    const res = await resp.json();
    if (res?.ok) {
      return { ok: true, registrados: res.registrados };
    }
    return { ok: false, error: res?.error };
  } catch {
    return { ok: false, error: 'server_unreachable' };
  }
}

export async function obtenerAsistenciaGrupo(
  email: string, grupoId: string, fecha?: string
): Promise<RegistroAsistenciaBackend[]> {
  try {
    const params = new URLSearchParams();
    if (fecha) params.set('fecha', fecha);
    const qs = params.toString();
    const resp = await fetch(`${LOCAL_API_URL}/api/attendance/${encodeURIComponent(grupoId)}${qs ? '?' + qs : ''}`);
    const res = await resp.json();
    if (res?.ok && Array.isArray(res.asistencias)) {
      return res.asistencias as RegistroAsistenciaBackend[];
    }
    return [];
  } catch {
    return [];
  }
}

/** Obtiene datos de la credencial DINER desde PostgreSQL */
export async function obtenerCredencial(email: string): Promise<Record<string, unknown> | null> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/credential/${encodeURIComponent(email)}`);
    const res = await resp.json();
    if (res?.ok && res.credential) return res.credential;
    return null;
  } catch {
    return null;
  }
}

/** Guardar perfil de Director en PostgreSQL */
export async function guardarDirectorProfile(email: string, data: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/director-profile/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const res = await resp.json();
    return { ok: Boolean(res?.ok), error: res?.error };
  } catch { return { ok: false, error: 'api_unreachable' }; }
}

/** Guardar perfil de Docente en PostgreSQL */
export async function guardarTeacherProfile(email: string, data: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/teacher-profile/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const res = await resp.json();
    return { ok: Boolean(res?.ok), error: res?.error };
  } catch { return { ok: false, error: 'api_unreachable' }; }
}

/** Guardar perfil de Estudiante en PostgreSQL */
export async function guardarStudentProfile(email: string, data: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/student-profile/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const res = await resp.json();
    return { ok: Boolean(res?.ok), error: res?.error };
  } catch { return { ok: false, error: 'api_unreachable' }; }
}

/** Obtener perfil de Director desde PostgreSQL */
export async function obtenerDirectorProfile(email: string): Promise<Record<string, unknown> | null> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/director-profile/${encodeURIComponent(email)}`);
    const res = await resp.json();
    if (res?.ok && res.profile) return res.profile;
    return null;
  } catch { return null; }
}

/** Obtener perfil de Docente desde PostgreSQL */
export async function obtenerTeacherProfile(email: string): Promise<Record<string, unknown> | null> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/teacher-profile/${encodeURIComponent(email)}`);
    const res = await resp.json();
    if (res?.ok && res.profile) return res.profile;
    return null;
  } catch { return null; }
}

const identityService = {
  verificarEmail,
  consultarIdentidadEnLake,
  registrarUsuario,
  loginEmail,
  loginGoogle,
  finalizarRegistroGoogle,
  obtenerPerfil,
  obtenerCredencial,
  guardarDirectorProfile,
  guardarTeacherProfile,
  guardarStudentProfile,
  obtenerDirectorProfile,
  obtenerTeacherProfile,
  logActividadGlobal,
  registrarMeta,
  obtenerMetas,
  actualizarMeta,
  eliminarMeta,
  registrarLogro,
  obtenerLogros,
  registrarPago,
  registrarSuscripcion,
  sendWelcomeEmail,
  guardarPerfil,
  obtenerPerfilCompleto,
  uploadAvatar,
  uploadEvidence,
  registrarChat,
  registrarMensaje,
  obtenerMensajes,
  obtenerChats,
  listarUsuarios,
  listarGrupos,
  crearGrupo,
  eliminarGrupo,
  obtenerConfigAcademica,
  crearGrupoIngles,
  listarGruposIngles,
  asignarDocenteAGrupo,
  unirseAGrupo,
  obtenerMiembrosDeGrupo,
  eliminarGrupoIngles,
  misGruposIngles,
  registrarAsistencia,
  obtenerAsistenciaGrupo,
  repararHojaRol,
  listarHorariosDisponiblesDocente,
};

/**
 * Lista horarios disponibles de asesoría para un docente específico.
 * Retorna solo los slots con estado AVAILABLE.
 */
export async function listarHorariosDisponiblesDocente(docenteEmail: string): Promise<Array<{
  asesoria_id: string;
  dia: string;
  hora: string;
  plataforma: string;
  lugar: string;
  duracion_minutos: number;
  max_alumnos_por_slot: number;
  anticipacion_horas_min: number;
  estado: string;
}>> {
  try {
    const res = await postAlLake({
      action: 'listarHitosAsesoria',
      email: docenteEmail.toLowerCase().trim(),
      solo_disponibles: true,
    }, 10000);
    if (res?.ok && Array.isArray(res.hitos)) {
      return res.hitos as Array<{
        asesoria_id: string;
        dia: string;
        hora: string;
        plataforma: string;
        lugar: string;
        duracion_minutos: number;
        max_alumnos_por_slot: number;
        anticipacion_horas_min: number;
        estado: string;
      }>;
    }
    return [];
  } catch (err) {
    console.warn('[Identity] Error listando horarios disponibles:', err);
    return [];
  }
}

/**
 * Crea un nuevo hito de disponibilidad de asesoría.
 */
export async function crearHitoAsesoria(data: {
  email: string;
  dia: string;
  hora: string;
  plataforma: string;
  lugar: string;
  duracion_minutos?: number;
  max_alumnos_por_slot?: number;
  anticipacion_horas_min?: number;
}): Promise<{ ok: boolean; asesoria_id?: string; error?: string }> {
  try {
    const res = await postAlLake({
      action: 'crearHitoAsesoria',
      ...data,
    }, 10000);
    if (res?.ok) {
      return { ok: true, asesoria_id: res.asesoria_id as string };
    }
    return { ok: false, error: res?.error || 'error_desconocido' };
  } catch (err) {
    console.warn('[Identity] Error creando hito de asesoría:', err);
    return { ok: false, error: 'api_unreachable' };
  }
}

/**
 * Elimina un hito de disponibilidad de asesoría.
 */
export async function eliminarHitoAsesoria(
  email: string,
  asesoriaId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await postAlLake({
      action: 'eliminarHitoAsesoria',
      email,
      asesoria_id: asesoriaId,
    }, 10000);
    return { ok: Boolean(res?.ok), error: res?.error };
  } catch (err) {
    console.warn('[Identity] Error eliminando hito:', err);
    return { ok: false, error: 'api_unreachable' };
  }
}

export default identityService;
