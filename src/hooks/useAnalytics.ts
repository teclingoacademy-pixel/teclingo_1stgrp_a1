/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * useAnalytics.ts
 * Hook que registra automaticamente:
 * - Inicio y fin de sesion
 * - Cambios de pagina (page_view)
 * - Apertura de herramientas (tool_open)
 */

import { useEffect, useRef } from 'react';
import { startSession, endSession, trackEvent, getCurrentSessionId } from '../services/analyticsService';

// Detectar la herramienta segun el path
function detectTool(path: string): string | null {
  const lower = path.toLowerCase();
  if (lower.includes('ai-support') || lower.includes('ai-tutor')) return 'AI Tutor';
  if (lower.includes('bridge')) return 'The Bridge';
  if (lower.includes('presentation') || lower.includes('presentacion')) return 'Mi Presentacion';
  if (lower.includes('grammar')) return 'Grammar Fixer';
  if (lower.includes('listening')) return 'Listening Lab';
  if (lower.includes('test-maker')) return 'Test Maker';
  if (lower.includes('avatar')) return 'Avatar Matrix';
  if (lower.includes('ar-portal')) return 'AR Portal';
  if (lower.includes('libro-virtual')) return 'Libro Virtual';
  if (lower.includes('progress-map')) return 'Progress Map';
  if (lower.includes('pdp')) return 'PDP';
  if (lower.includes('calendario')) return 'Calendario';
  if (lower.includes('mensajes')) return 'Mensajes';
  if (lower.includes('logros')) return 'Logros';
  return null;
}

export function useAnalytics(userId: string | null | undefined): void {
  const startedRef = useRef(false);
  const lastPathRef = useRef<string>('');

  // Iniciar sesion cuando hay userId
  useEffect(() => {
    if (!userId || startedRef.current) return;
    startedRef.current = true;
    startSession(userId).then((sid) => {
      if (sid) {
        console.log('[analytics] Sesion iniciada:', sid);
        // Registrar page_view inicial
        trackEvent(userId, 'page_view', { path: window.location.pathname });
      }
    });

    // Cerrar sesion al salir
    const handleBeforeUnload = () => { endSession(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId]);

  // Rastrear cambios de path (page_view + tool_open)
  useEffect(() => {
    if (!userId || !getCurrentSessionId()) return;
    const checkPath = () => {
      const currentPath = window.location.pathname;
      if (currentPath !== lastPathRef.current) {
        lastPathRef.current = currentPath;
        trackEvent(userId, 'page_view', { path: currentPath });
        const tool = detectTool(currentPath);
        if (tool) {
          trackEvent(userId, 'tool_open', { toolName: tool, path: currentPath });
        }
      }
    };
    // Chequear cada 1 segundo si cambio el path (para SPA)
    checkPath();
    const interval = window.setInterval(checkPath, 1000);
    return () => window.clearInterval(interval);
  }, [userId]);
}
