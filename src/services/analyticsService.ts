/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * analyticsService.ts
 * Cliente de los endpoints de analytics (sesiones y eventos).
 */

import { apiUrl } from './apiConfig';

export interface UserSessionData {
  id: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number;
  device: string | null;
}

let currentSessionId: string | null = null;

export function getCurrentSessionId(): string | null {
  return currentSessionId;
}

export async function startSession(userId: string): Promise<string | null> {
  try {
    const device = typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop';
    const res = await fetch(apiUrl('/api/analytics/session/start'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, device }),
    });
    const json = await res.json();
    if (json?.success && json?.data?.id) {
      currentSessionId = json.data.id;
      return currentSessionId;
    }
    return null;
  } catch (e) {
    console.warn('[analytics] Error starting session:', e);
    return null;
  }
}

export async function endSession(): Promise<void> {
  if (!currentSessionId) return;
  try {
    const sid = currentSessionId;
    currentSessionId = null;
    // Usar sendBeacon para que funcione incluso al cerrar la pestaña
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ sessionId: sid })], { type: 'application/json' });
      navigator.sendBeacon(apiUrl('/api/analytics/session/end'), blob);
    } else {
      await fetch(apiUrl('/api/analytics/session/end'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid }),
        keepalive: true,
      });
    }
  } catch (e) {
    console.warn('[analytics] Error ending session:', e);
  }
}

export async function trackEvent(
  userId: string,
  eventType: 'page_view' | 'tool_open' | string,
  eventData?: Record<string, unknown>
): Promise<void> {
  try {
    await fetch(apiUrl('/api/analytics/event'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        sessionId: currentSessionId,
        eventType,
        eventData: eventData || null,
      }),
    });
  } catch (e) {
    console.warn('[analytics] Error tracking event:', e);
  }
}
