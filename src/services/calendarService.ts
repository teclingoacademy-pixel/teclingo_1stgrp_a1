/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * calendarService.ts
 * Servicio de Calendario Institucional — Data Lake (Google Sheets)
 * CRUD completo de eventos institucionales con sincronización opcional a Google Calendar
 */

import { API_BASE } from './apiConfig';

const LOCAL_API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:3000';

/** Identity API (Data Lake) — las acciones del Calendario Institucional viven en
 * el mismo Apps Script de identidad del ecosistema (Code.gs), igual que el resto
 * de los datos del Data Lake. */
const IDENTITY_API_URL =
  (import.meta.env.VITE_IDENTITY_API_URL as string | undefined)?.trim() ||
  'https://script.google.com/macros/s/AKfycbz1OBcF2logEt-r_gaOdpG9MhcjsVkz3_MZiJKf9iSS1T1lpYmAj_MoFtrssCnT7q-k/exec';

export type EventType = 'SCHOOL' | 'HOLIDAY' | 'TECLINGO';
export type EventVisibility = 'GLOBAL' | 'DOCENTE' | 'ALUMNO';

export interface CalendarEvent {
  id: string;
  day: number;
  month: number;
  year: number;
  title: string;
  type: EventType;
  description: string;
  time?: string;
  visibility: EventVisibility[];
  createdBy: string;        // email del director
  createdAt: string;        // ISO timestamp
  updatedAt?: string;
  googleCalendarEventId?: string;  // ID del evento en Google Calendar (si se sincronizó)
}

/* ================================================================
   HELPERS
   ================================================================ */

function generateEventId(): string {
  return 'evt_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
}

function getAuthHeaders(): Record<string, string> {
  const session = localStorage.getItem('tecnolingo_session');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session) {
    try {
      const parsed = JSON.parse(session);
      if (parsed?.email) headers['X-User-Email'] = parsed.email;
      if (parsed?.token) headers['Authorization'] = `Bearer ${parsed.token}`;
    } catch { /* noop */ }
  }
  return headers;
}

/** Email del usuario actual, desde el mismo localStorage que usa el resto de la app. */
function getUserEmail(): string {
  const direct = localStorage.getItem('teclingo_user_email');
  if (direct) return direct;
  const session = localStorage.getItem('tecnolingo_session');
  if (session) {
    try {
      const parsed = JSON.parse(session);
      if (parsed?.email) return parsed.email;
    } catch { /* session puede ser un rol plano ('DIRECTOR', 'ALUMNO', ...) */ }
  }
  return '';
}

/** Google Sheets DESHABILITADO — mock response */
async function postAlCalendario(payload: Record<string, unknown>, timeoutMs = 12000): Promise<any> {
  console.log(`[Calendar MOCK] action=${payload.action} — datos van a PostgreSQL`);
  return { ok: true, eventos: [] };
}

/* ================================================================
   CRUD — DATA LAKE (CALENDAR_EVENTS vía Identity API / Code.gs)
   ================================================================ */

/**
 * Obtiene todos los eventos del calendario institucional.
 * Filtra automáticamente por año/mes si se proporcionan.
 */
export async function fetchCalendarEvents(
  year?: number,
  month?: number
): Promise<CalendarEvent[]> {
  try {
    const params = new URLSearchParams();
    const email = getUserEmail();
    const resp = await fetch(`${LOCAL_API_URL}/api/calendar-events?email=${encodeURIComponent(email)}`);
    const res = await resp.json();
    if (!res?.ok) throw new Error(res?.error || 'Error al obtener eventos');
    let events = (res.events || []).map((row: any) => {
      const rawVis = Array.isArray(row.visibility)
        ? row.visibility.join(',')
        : (row.visibility || 'GLOBAL');
      return {
        id: row.id,
        day: Number(row.day),
        month: Number(row.month),
        year: Number(row.year),
        title: row.title || '',
        type: (row.type || 'SCHOOL') as EventType,
        description: row.description || '',
        time: row.time || '',
        visibility: String(rawVis).split(',').map((v: string) => v.trim()).filter(Boolean) as EventVisibility[],
        createdBy: row.created_by || '',
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at,
        googleCalendarEventId: undefined,
      };
    });
    if (year && month) events = events.filter((e: CalendarEvent) => e.year === year && e.month === month);
    return events;
  } catch (err) {
    console.error('[calendarService] fetchCalendarEvents error:', err);
    const fallback = localStorage.getItem('tecnolingo_calendar_fallback');
    if (fallback) {
      const events = JSON.parse(fallback) as CalendarEvent[];
      if (year && month) return events.filter(e => e.year === year && e.month === month);
      return events;
    }
    return [];
  }
}

/**
 * Crea un nuevo evento institucional.
 * Solo el DIRECTOR puede ejecutar esta función (validado en backend).
 */
export async function createCalendarEvent(
  eventData: Omit<CalendarEvent, 'id' | 'createdBy' | 'createdAt'>
): Promise<CalendarEvent> {
  const email = getUserEmail();

  const newEvent: CalendarEvent = {
    ...eventData,
    id: generateEventId(),
    createdBy: email,
    createdAt: new Date().toISOString(),
  };

  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/calendar-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newEvent.createdBy,
        day: newEvent.day,
        month: newEvent.month,
        year: newEvent.year,
        title: newEvent.title,
        type: newEvent.type,
        description: newEvent.description || '',
        time: newEvent.time || '',
        visibility: Array.isArray(newEvent.visibility) ? newEvent.visibility.join(',') : newEvent.visibility,
      }),
    });
    const res = await resp.json();
    if (!res?.ok) throw new Error(res?.error || 'Error al crear evento');

    const existing = JSON.parse(localStorage.getItem('tecnolingo_calendar_fallback') || '[]');
    existing.push(newEvent);
    localStorage.setItem('tecnolingo_calendar_fallback', JSON.stringify(existing));
    return newEvent;
  } catch (err) {
    console.error('[calendarService] createCalendarEvent error:', err);
    const existing = JSON.parse(localStorage.getItem('tecnolingo_calendar_fallback') || '[]');
    existing.push(newEvent);
    localStorage.setItem('tecnolingo_calendar_fallback', JSON.stringify(existing));
    return newEvent;
  }
}

/**
 * Actualiza un evento existente.
 */
export async function updateCalendarEvent(
  id: string,
  updates: Partial<Omit<CalendarEvent, 'id' | 'createdBy' | 'createdAt'>>
): Promise<CalendarEvent | null> {
  try {
    const updateData: Record<string, unknown> = { ...updates, email: getUserEmail() };
    if (Array.isArray(updateData.visibility)) {
      updateData.visibility = updateData.visibility.join(',');
    }
    const resp = await fetch(`${LOCAL_API_URL}/api/calendar-events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    const res = await resp.json();
    if (!res?.ok) throw new Error(res?.error || 'Error al actualizar evento');

    const existing = JSON.parse(localStorage.getItem('tecnolingo_calendar_fallback') || '[]');
    const idx = existing.findIndex((e: CalendarEvent) => e.id === id);
    if (idx !== -1) {
      existing[idx] = { ...existing[idx], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem('tecnolingo_calendar_fallback', JSON.stringify(existing));
      return existing[idx];
    }
    return null;
  } catch (err) {
    console.error('[calendarService] updateCalendarEvent error:', err);
    const existing = JSON.parse(localStorage.getItem('tecnolingo_calendar_fallback') || '[]');
    const idx = existing.findIndex((e: CalendarEvent) => e.id === id);
    if (idx !== -1) {
      existing[idx] = { ...existing[idx], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem('tecnolingo_calendar_fallback', JSON.stringify(existing));
      return existing[idx];
    }
    return null;
  }
}

/**
 * Elimina un evento institucional.
 */
export async function deleteCalendarEvent(id: string): Promise<boolean> {
  try {
    const resp = await fetch(`${LOCAL_API_URL}/api/calendar-events/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: getUserEmail() }),
    });
    const res = await resp.json();
    if (!res?.ok) throw new Error(res?.error || 'Error al eliminar evento');

    const existing = JSON.parse(localStorage.getItem('tecnolingo_calendar_fallback') || '[]');
    const filtered = existing.filter((e: CalendarEvent) => e.id !== id);
    localStorage.setItem('tecnolingo_calendar_fallback', JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('[calendarService] deleteCalendarEvent error:', err);
    const existing = JSON.parse(localStorage.getItem('tecnolingo_calendar_fallback') || '[]');
    const filtered = existing.filter((e: CalendarEvent) => e.id !== id);
    localStorage.setItem('tecnolingo_calendar_fallback', JSON.stringify(filtered));
    return true;
  }
}

/* ================================================================
   SINCRONIZACIÓN CON GOOGLE CALENDAR (Opcional)
   ================================================================ */

/**
 * Crea un evento en Google Calendar vinculado al evento institucional.
 * Requiere que el usuario haya autorizado OAuth2 con scope de Calendar.
 */
export async function syncToGoogleCalendar(
  event: CalendarEvent,
  accessToken: string
): Promise<string | null> {
  try {
    const dateStr = `${event.year}-${String(event.month).padStart(2, '0')}-${String(event.day).padStart(2, '0')}`;
    const hasTime = event.time && event.time.includes(':');

    // Parsear hora si existe
    let startDateTime = dateStr;
    let endDateTime = dateStr;

    if (hasTime) {
      const [timePart, meridian] = event.time!.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (meridian?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (meridian?.toUpperCase() === 'AM' && hours === 12) hours = 0;
      startDateTime = `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      endDateTime = `${dateStr}T${String(hours + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    }

    const googleEvent = {
      summary: `[TECLINGO] ${event.title}`,
      description: event.description + `\n\nTipo: ${event.type}\nVisibilidad: ${event.visibility.join(', ')}\nID: ${event.id}`,
      start: hasTime
        ? { dateTime: startDateTime, timeZone: 'America/Mexico_City' }
        : { date: dateStr, timeZone: 'America/Mexico_City' },
      end: hasTime
        ? { dateTime: endDateTime, timeZone: 'America/Mexico_City' }
        : { date: dateStr, timeZone: 'America/Mexico_City' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'email', minutes: 1440 },
        ],
      },
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    });

    if (!res.ok) throw new Error(`Google Calendar HTTP ${res.status}`);
    const data = await res.json();

    // Guardar el ID de Google Calendar en el evento
    await updateCalendarEvent(event.id, { googleCalendarEventId: data.id });

    return data.id;
  } catch (err) {
    console.error('[calendarService] syncToGoogleCalendar error:', err);
    return null;
  }
}

/**
 * Elimina un evento de Google Calendar.
 */
export async function deleteFromGoogleCalendar(
  googleEventId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return res.ok || res.status === 410; // 410 = already deleted
  } catch (err) {
    console.error('[calendarService] deleteFromGoogleCalendar error:', err);
    return false;
  }
}

/**
 * Obtiene el token de acceso de Google Calendar desde el backend.
 * El backend debe tener el refresh token almacenado para el director.
 */
export async function getGoogleCalendarToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/google-calendar-token`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.accessToken || null;
  } catch {
    return null;
  }
}