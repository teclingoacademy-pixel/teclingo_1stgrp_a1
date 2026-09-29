/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * useContentKnowledge - Hooks de lectura para la base de conocimiento pedagogico.
 *
 * Patrones:
 *   - Cada hook hace UNA peticion y expone { data, loading, error, refresh }.
 *   - `refresh()` se dispara solo si el componente sigue montado.
 *   - Los errores se exponen como string legible, no como excepcion suelta.
 *   - Ningun hook lanza: un backend caido degrada a data=null sin romper la UI.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ContentApiError,
  askTeacher,
  getBootstrap,
  getGrammarForLesson,
  getLessonBundle,
  getTutorials,
  type AiAnswer,
  type AiHealth,
  type Bootstrap,
  type GrammarForLesson,
  type LessonBundle,
  type SkillCode,
  type SkillTutorial,
  getAiHealth,
} from '../services/contentApi';

/* ================================================================
   UTILIDADES
   ================================================================ */

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function toMessage(error: unknown): string {
  if (error instanceof ContentApiError) {
    if (error.status === 0) return 'Sin conexion con el servidor de contenido';
    if (error.isAiUnavailable) return 'El servicio de IA no esta disponible';
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}

/**
 * Envoltura comun: ejecuta `loader` al montar, cancela si el componente se
 * desmonta o cambia la dependencia, y expone el estado.
 */
function useAsyncResource<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  options: { enabled?: boolean } = {},
): AsyncState<T> {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const mounted = useRef(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const run = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const result = await loaderRef.current(AbortSignal.timeout(25_000));
      if (mounted.current) setData(result);
    } catch (err) {
      // Un abort es cancelación intencional, no un fallo que debamos mostrar.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (mounted.current) {
        setData(null);
        setError(toMessage(err));
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => { void run(); }, [run]);

  return { data, loading, error, refresh: run };
}

/* ================================================================
   BOOTSTRAP — fases, programa, malla, gramática y tutoriales
   ================================================================ */

export function useBootstrap(): AsyncState<Bootstrap> {
  return useAsyncResource((signal) => getBootstrap(signal), []);
}

/* ================================================================
   LECCIÓN COMPLETA
   ================================================================ */

export interface UseLessonBundle extends AsyncState<LessonBundle> {
  lessonId: string | null;
}

/**
 * Payload completo de una clase (teoría, guion, tips, vocabulario, contract,
 * ejercicios). Se pasa `null` como lessonId para no pedir nada, util mientras
 * el alumno todavía no ha elegido clase.
 */
export function useLessonBundle(lessonId: string | null): UseLessonBundle {
  const state = useAsyncResource<LessonBundle>(
    (signal) => getLessonBundle(lessonId!, signal),
    [lessonId],
    { enabled: !!lessonId },
  );
  return { ...state, lessonId };
}

/* ================================================================
   GRAMÁTICA DE LA CLASE
   ================================================================ */

export interface UseGrammarForLesson extends AsyncState<GrammarForLesson> {
  /** Slugs del mapa sin tema catalogado. La UI debe renderizar un fallback. */
  unresolved: string[];
  /** true cuando ya se sabe que la clase no tiene ningún tema resuelto. */
  hasUnresolved: boolean;
}

export function useGrammarForLesson(lessonId: string | null): UseGrammarForLesson {
  const state = useAsyncResource<GrammarForLesson>(
    (signal) => getGrammarForLesson(lessonId!, signal),
    [lessonId],
    { enabled: !!lessonId },
  );
  return {
    ...state,
    unresolved: state.data?.unresolved ?? [],
    hasUnresolved: (state.data?.unresolved.length ?? 0) > 0,
  };
}

/* ================================================================
   TUTORIALES
   ================================================================ */

export function useTutorials(): AsyncState<SkillTutorial[]> {
  return useAsyncResource((signal) => getTutorials(signal), []);
}

/* ================================================================
   TEACHER VIRTUAL
   ================================================================ */

export interface UseAiHealth {
  health: AiHealth | null;
  loading: boolean;
  /** true si Ollama no esta disponible en el servidor. */
  offline: boolean;
}

export function useAiHealth(): UseAiHealth {
  const [health, setHealth] = useState<AiHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await getAiHealth();
      if (active) { setHealth(result); setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  return { health, loading, offline: health !== null && !health.reachable };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface UseTeacherChat {
  messages: ChatMessage[];
  ask: (message: string) => Promise<void>;
  thinking: boolean;
  error: string | null;
  /** Ultimo error por falta de Ollama, para degradar a la teoría persistida. */
  aiUnavailable: boolean;
  reset: () => void;
}

/**
 * Chat del Teacher Virtual. El historial se envia al backend, que lo combina
 * con el contexto de la leccion (teoría + guion + vocabulario) antes de llamar
 * a Ollama.
 *
 * Si Ollama cae se marca aiUnavailable y la UI puede mostrar la teoría de la
 * clase en vez de un error duro.
 */
export function useTeacherChat(lessonId: string | null, level = 'A1'): UseTeacherChat {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Cambiar de clase invalida la conversacion: el contexto ya no aplica.
  useEffect(() => {
    setMessages([]);
    setError(null);
    setAiUnavailable(false);
  }, [lessonId]);

  const ask = useCallback(async (message: string) => {
    const text = message.trim();
    if (!text || thinking) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setThinking(true);
    setError(null);

    try {
      const answer: AiAnswer = await askTeacher({ message: text, lessonId: lessonId ?? undefined, level, history });
      if (mounted.current) {
        setMessages((prev) => [...prev, { role: 'assistant', content: answer.content }]);
        setAiUnavailable(false);
      }
    } catch (err) {
      if (!mounted.current) return;
      if (err instanceof ContentApiError && err.isAiUnavailable) {
        setAiUnavailable(true);
        setError('El profesor virtual esta temporalmente fuera de servicio');
      } else {
        setError(toMessage(err));
      }
      // Se quita la pregunta para que el reintento no duplique el turno.
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      if (mounted.current) setThinking(false);
    }
  }, [messages, thinking, lessonId, level]);

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    setAiUnavailable(false);
  }, []);

  return { messages, ask, thinking, error, aiUnavailable, reset };
}
