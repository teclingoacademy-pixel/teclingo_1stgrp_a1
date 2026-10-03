/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * usePushNotifications.ts
 * Hook para gestionar permisos, suscripcion push y preferencias.
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../services/apiConfig';

export interface NotificationPrefs {
  enabled: boolean;
  daysOfWeek: number[];  // 0=Domingo, 1=Lunes, ..., 6=Sabado
  hour: number;          // 0-23
  minute: number;        // 0-59
  timezone: string;
}

export interface UsePushNotificationsResult {
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  loading: boolean;
  error: string | null;
  prefs: NotificationPrefs | null;
  requestPermission: () => Promise<boolean>;
  subscribe: (userId: string, prefs: NotificationPrefs) => Promise<boolean>;
  savePreferences: (userId: string, prefs: NotificationPrefs) => Promise<boolean>;
  unsubscribe: (userId: string) => Promise<boolean>;
  loadPreferences: (userId: string) => Promise<NotificationPrefs | null>;
  sendTest: (userId: string) => Promise<boolean>;
}

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  daysOfWeek: [1, 2, 3, 4, 5],
  hour: 20,
  minute: 0,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Mexico_City',
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  // Verificar si ya esta suscrito
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!('serviceWorker' in navigator)) return;
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setIsSubscribed(!!sub);
      } catch (e) {
        console.warn('[push] check subscription error', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof Notification === 'undefined') {
      setError('Este navegador no soporta notificaciones');
      return false;
    }
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al pedir permiso');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribe = useCallback(async (userId: string, newPrefs: NotificationPrefs): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // 1. Asegurar service worker activo
      const reg = await navigator.serviceWorker.register('/service-worker.js');
      await navigator.serviceWorker.ready;

      // 2. Obtener VAPID public key del backend
      const keyRes = await fetch(apiUrl('/api/notifications/vapid-public-key'));
      const keyJson = await keyRes.json();
      if (!keyJson?.success || !keyJson.publicKey) {
        throw new Error('No se pudo obtener la clave publica VAPID');
      }

      // 3. Suscribirse al push manager
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyJson.publicKey),
      });

      // 4. Enviar la suscripcion al backend
      const subRes = await fetch(apiUrl('/api/notifications/subscribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscription: sub.toJSON() }),
      });
      const subJson = await subRes.json();
      if (!subJson?.success) throw new Error(subJson?.error || 'Error al guardar suscripcion');

      // 5. Guardar preferencias
      const prefRes = await fetch(apiUrl('/api/notifications/preferences'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...newPrefs }),
      });
      const prefJson = await prefRes.json();
      if (!prefJson?.success) throw new Error(prefJson?.error || 'Error al guardar preferencias');

      setIsSubscribed(true);
      setPrefs(newPrefs);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al suscribirse');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const savePreferences = useCallback(async (userId: string, newPrefs: NotificationPrefs): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/notifications/preferences'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...newPrefs }),
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || 'Error al guardar');
      setPrefs(newPrefs);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async (userId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      const res = await fetch(apiUrl('/api/notifications/preferences'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, enabled: false, daysOfWeek: [], hour: 20, minute: 0 }),
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || 'Error al desactivar');
      setIsSubscribed(false);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al desactivar');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPreferences = useCallback(async (userId: string): Promise<NotificationPrefs | null> => {
    try {
      const res = await fetch(apiUrl('/api/notifications/preferences/' + encodeURIComponent(userId)));
      const json = await res.json();
      if (json?.success && json.data) {
        const p: NotificationPrefs = {
          enabled: json.data.enabled,
          daysOfWeek: json.data.daysOfWeek || [],
          hour: json.data.hour,
          minute: json.data.minute,
          timezone: json.data.timezone,
        };
        setPrefs(p);
        return p;
      }
      setPrefs(DEFAULT_PREFS);
      return DEFAULT_PREFS;
    } catch {
      setPrefs(DEFAULT_PREFS);
      return DEFAULT_PREFS;
    }
  }, []);

  const sendTest = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const res = await fetch(apiUrl('/api/notifications/test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      return !!json?.success;
    } catch {
      return false;
    }
  }, []);

  return {
    permission, isSubscribed, loading, error, prefs,
    requestPermission, subscribe, savePreferences, unsubscribe, loadPreferences, sendTest,
  };
}
