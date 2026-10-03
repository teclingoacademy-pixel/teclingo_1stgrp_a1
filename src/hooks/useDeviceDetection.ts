/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * useDeviceDetection.ts
 * Detecta el dispositivo, navegador y soporte de PWA/notificaciones.
 */

export interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  isStandalone: boolean;   // PWA instalada
  supportsNotifications: boolean;
  supportsPWA: boolean;
  browser: 'chrome' | 'safari' | 'firefox' | 'edge' | 'unknown';
  iosVersion: number | null; // null si no es iOS
  message: string;          // Mensaje de recomendacion
}

export function useDeviceDetection(): DeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isIOS: false, isAndroid: false, isDesktop: true,
      isStandalone: false, supportsNotifications: false, supportsPWA: false,
      browser: 'unknown', iosVersion: null, message: '',
    };
  }

  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /Android/.test(ua);
  const isDesktop = !isIOS && !isAndroid;

  const isStandalone =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (navigator as any).standalone === true;

  let browser: DeviceInfo['browser'] = 'unknown';
  if (/Edg\//.test(ua)) browser = 'edge';
  else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = 'chrome';
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = 'safari';
  else if (/Firefox\//.test(ua)) browser = 'firefox';

  // Detectar version de iOS
  let iosVersion: number | null = null;
  if (isIOS) {
    const m = ua.match(/OS (\d+)_/);
    if (m) iosVersion = parseInt(m[1], 10);
  }

  const supportsNotifications = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  // Determinar si soporta PWA
  let supportsPWA = supportsNotifications;
  let message = '';

  if (isIOS) {
    if (iosVersion !== null && iosVersion < 16) {
      supportsPWA = false;
      message = 'Tu iPhone tiene iOS ' + iosVersion + '. Actualiza a iOS 16.4+ para recibir notificaciones.';
    } else if (!isStandalone) {
      supportsPWA = true;
      message = 'En iPhone, primero agrega la app a tu pantalla de inicio (Compartir -> Agregar a pantalla de inicio).';
    } else {
      message = 'Listo para activar notificaciones.';
    }
  } else if (isAndroid) {
    if (browser === 'firefox') {
      supportsPWA = false;
      message = 'Firefox no soporta notificaciones push. Usa Chrome.';
    } else {
      message = isStandalone ? 'Listo para activar notificaciones.' : 'Instala la app desde el menu del navegador.';
    }
  } else {
    // Desktop
    if (browser === 'firefox') {
      supportsPWA = false;
      message = 'Firefox no soporta notificaciones push completamente. Usa Chrome o Edge.';
    } else {
      message = isStandalone ? 'Listo para activar notificaciones.' : 'Puedes instalar la app desde el icono de la barra de direcciones.';
    }
  }

  return {
    isIOS, isAndroid, isDesktop,
    isStandalone, supportsNotifications, supportsPWA,
    browser, iosVersion, message,
  };
}
