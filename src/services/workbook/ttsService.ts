/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * src/services/workbook/ttsService.ts
 * TTS bilingüe: detecta tramos en inglés (entre comillas) y español (resto).
 * Backend /api/tts con lang correcto → fallback Web Speech API con voz por idioma.
 */

import { apiUrl } from '@/services/apiConfig';

export interface PlayAudioOptions {
  forceLang?: 'en-US' | 'es-MX';
  rate?: number;
  pitch?: number;
  lang?: string;
  voiceGender?: 'male' | 'female';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: unknown) => void;
}

interface BilingualSegment {
  text: string;
  lang: 'en-US' | 'es-MX';
}

let longSpeechKeepAlive: NodeJS.Timeout | null = null;
let pendingAutoplay: { text: string; options?: PlayAudioOptions | (() => void) } | null = null;
let hasUserInteracted = false;
let currentAudioElement: HTMLAudioElement | null = null;
let playGeneration = 0;
// FIX 2026-09-30: fetch del backend en vuelo. Si el usuario cambia de página
// mientras la petición viaja, stopAudio() aborta el fetch para que NUNCA llegue
// a crearse ni a reproducirse el Audio() en la vista nueva.
let currentTtsAbort: AbortController | null = null;

// ─────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────

const clearSpeechKeepAlive = () => {
  if (longSpeechKeepAlive) {
    clearInterval(longSpeechKeepAlive);
    longSpeechKeepAlive = null;
  }
};

const stopCurrentAudioElement = () => {
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.src = '';
    } catch {}
    currentAudioElement = null;
  }
};

/**
 * Limpia el texto: quita marcas de worksheet que no se deben leer.
 */
const cleanSegment = (s: string): string =>
  s
    .replace(/\[\.\.\.\]/g, '')
    .replace(/_{1,}(?:\s*_{1,})*/g, '')
    .replace(/\/[^/]+\//g, '')
    .replace(/\*\*/g, '') // quita bold markdown **...**
    .trim();

/**
 * Divide el texto en tramos bilingües:
 *  - Lo que va entre comillas rectas ("...") o tipográficas (“...”) → inglés
 *  - El resto → español
 * Si el texto no tiene comillas y es puro inglés sin acentos ni ¿¡,
 * se considera inglés completo (retrocompatible con llamadas puras).
 */
export const splitBilingual = (text: string, forceLang?: 'en-US' | 'es-MX'): BilingualSegment[] => {
  if (!text) return [];

  // REGLA forceLang: si el caller declara idioma, se respeta sin discutir.
  if (forceLang) {
    const cleanedForce = cleanSegment(text);
    if (!cleanedForce) return [];
    return [{ text: cleanedForce, lang: forceLang }];
  }

  // SIN forceLang: regla binaria - comillas = ingles, resto = espanol.
  const segments: BilingualSegment[] = [];
  const quoteRegex = /[""]([^""]+)[""]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let foundQuote = false;

  while ((match = quoteRegex.exec(text)) !== null) {
    foundQuote = true;
    if (match.index > lastIndex) {
      const spanishPart = cleanSegment(text.slice(lastIndex, match.index));
      if (spanishPart) segments.push({ text: spanishPart, lang: 'es-MX' });
    }
    const englishPart = cleanSegment(match[1]);
    if (englishPart) segments.push({ text: englishPart, lang: 'en-US' });
    lastIndex = match.index + match[0].length;
  }

  if (foundQuote && lastIndex < text.length) {
    const tail = cleanSegment(text.slice(lastIndex));
    if (tail) segments.push({ text: tail, lang: 'es-MX' });
  }

  // Sin comillas y sin forceLang -> TODO es espanol (regla estricta).
  if (segments.length === 0) {
    const cleaned = cleanSegment(text);
    if (!cleaned) return [];
    segments.push({ text: cleaned, lang: 'es-MX' });
  }

  return segments;
};

// ─────────────────────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────────────────────

export const unlockAndPlayPendingAudio = (): void => {
  hasUserInteracted = true;
  if (
    currentAudioElement ||
    (typeof window !== 'undefined' && window.speechSynthesis?.speaking)
  ) {
    pendingAutoplay = null;
    return;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    } catch {}
  }
  if (pendingAutoplay) {
    const item = pendingAutoplay;
    pendingAutoplay = null;
    playAudio(item.text, item.options);
  }
};

if (typeof window !== 'undefined') {
  const onInteraction = () => unlockAndPlayPendingAudio();
  ['pointerdown', 'click', 'keydown', 'touchstart'].forEach((evt) => {
    window.addEventListener(evt, onInteraction, { capture: true, passive: true });
  });
}

export const stopAudio = (): void => {
  playGeneration++;
  pendingAutoplay = null;
  clearSpeechKeepAlive();
  // Aborta el fetch del backend para que no se cree un Audio() "fantasma"
  // que arranque a sonar después de cambiar de página.
  if (currentTtsAbort) {
    try { currentTtsAbort.abort(); } catch { /* ya abortado */ }
    currentTtsAbort = null;
  }
  stopCurrentAudioElement();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    } catch (e) {
      console.warn('Error cancelando síntesis de voz:', e);
    }
  }
};

/**
 * Compat: usada por componentes legacy para decidir si algo es inglés.
 * Ahora es más permisiva: sólo devuelve true si CLARAMENTE es instrucción
 * en español (contiene acentos + palabras típicas de consigna).
 */
export const isSpanishInstruction = (text: string): boolean => {
  if (!text) return false;
  const lower = text.toLowerCase();
  const spanishMarkers = [
    'el plural de', 'el singular de', 'el pronombre para',
    'escribe en inglés', 'escribe la oración', 'escribe el pronombre',
    'traduce:', 'ordena las', 'selecciona la', 'cuál es', 'cuál de',
    'qué significa', 'según el texto', 'en la oración', 'de acuerdo a',
    'la regla general', 'recuerda:', 'completa la',
  ];
  if (spanishMarkers.some((m) => lower.includes(m))) return true;
  if (text.includes('¿') || text.includes('¡')) return true;
  if (/[áéíóúÁÉÍÓÚñÑ]/.test(text)) return true;
  return false;
};

export const isValidEnglishForTTS = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  if (!/[a-zA-Z]/.test(trimmed)) return false;
  // Si tiene acentos o signos ¿¡, no es inglés puro
  if (/[áéíóúÁÉÍÓÚñÑ¿¡]/.test(trimmed)) return false;
  return true;
};

// ─────────────────────────────────────────────────────────────
// Backend TTS
// ─────────────────────────────────────────────────────────────

const tryBackendTTS = async (
  cleanText: string,
  lang: string,
  opts: PlayAudioOptions,
  isCurrent: () => boolean
): Promise<boolean> => {
  const controller = new AbortController();
  currentTtsAbort = controller;
  try {
    const res = await fetch(apiUrl('/api/tts'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText,
        gender: opts.voiceGender || 'female',
        lang, // ← ahora respeta el idioma del segmento
      }),
      signal: controller.signal,
    });

    if (!res.ok) return false;

    const blob = await res.blob();

    // FIX 2026-09-30: el usuario cambió de página (o lanzó otro TTS) mientras
    // el fetch viajaba. No se reproduce nada.
    if (!isCurrent()) return false;

    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    currentAudioElement = audio;
    audio.playbackRate = opts.rate ?? 0.9;

    return new Promise<boolean>((resolve) => {
      let finished = false;
      let safetyTimer: ReturnType<typeof setTimeout> | null = null;

      const finish = (ok: boolean) => {
        if (finished) return;
        finished = true;
        if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
        try { URL.revokeObjectURL(audioUrl); } catch {}
        if (currentAudioElement === audio) currentAudioElement = null;
        if (currentTtsAbort === controller) currentTtsAbort = null;
        opts.onEnd?.();
        resolve(ok);
      };

      const armSafety = (ms: number) => {
        if (safetyTimer) clearTimeout(safetyTimer);
        safetyTimer = setTimeout(() => finish(true), ms);
      };

      audio.onended = () => finish(true);
      audio.onerror = () => finish(false);
      audio.onloadedmetadata = () => {
        const dur = audio.duration;
        const ms = isFinite(dur) && dur > 0 ? Math.max(3000, (dur + 3) * 1000) : 30000;
        armSafety(ms);
      };
      armSafety(30000);

      // Última barrera: si stopAudio() corrió entre la creación y el play(),
      // no se reproduce (el elemento ya habría sido pausado/limpiado).
      if (!isCurrent()) {
        finish(false);
        return;
      }

      audio.play()
        .then(() => { opts.onStart?.(); })
        .catch(() => finish(false));
    });
  } catch {
    return false;
  } finally {
    if (currentTtsAbort === controller) currentTtsAbort = null;
  }
};

// ─────────────────────────────────────────────────────────────
// Web Speech fallback
// ─────────────────────────────────────────────────────────────

const pickVoice = (
  voices: SpeechSynthesisVoice[],
  lang: string,
  gender: 'male' | 'female'
): SpeechSynthesisVoice | undefined => {
  const isSpanish = lang.toLowerCase().startsWith('es');
  const targetPrefix = isSpanish ? 'es' : 'en';

  const candidates = voices.filter((v) => v.lang.toLowerCase().startsWith(targetPrefix));
  if (candidates.length === 0) return undefined;

  if (isSpanish) {
    // Nombres típicos de voces en español
    const spanishPreferred =
      gender === 'male'
        ? ['Jorge', 'Diego', 'Carlos', 'Juan', 'Google español']
        : ['Monica', 'Mónica', 'Paulina', 'Sabina', 'Helena', 'Google español'];
    for (const name of spanishPreferred) {
      const hit = candidates.find((v) => v.name.includes(name));
      if (hit) return hit;
    }
    return candidates.find((v) => v.lang === 'es-MX') || candidates[0];
  }

  // Inglés (comportamiento previo)
  if (gender === 'male') {
    return (
      candidates.find(
        (v) =>
          v.name.includes('Google UK English Male') ||
          v.name.includes('Microsoft David') ||
          v.name.includes('Microsoft Mark') ||
          v.name.includes('Daniel') ||
          v.name.includes('Alex') ||
          v.name.toLowerCase().includes('male')
      ) || candidates.find((v) => v.lang === 'en-US') || candidates[0]
    );
  }

  return (
    candidates.find(
      (v) =>
        v.name.includes('Google US English') ||
        v.name.includes('Microsoft Zira') ||
        v.name.includes('Samantha') ||
        v.name.includes('Jenny') ||
        v.name.toLowerCase().includes('female')
    ) ||
    candidates.find((v) => v.lang === 'en-US') ||
    candidates[0]
  );
};

const speakSegment = (
  segment: BilingualSegment,
  opts: PlayAudioOptions,
  isLast: boolean,
  isCurrent: () => boolean
): Promise<void> => {
  return new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(segment.text);
    utterance.lang = segment.lang;
    utterance.rate = opts.rate ?? 0.9;
    utterance.pitch =
      opts.pitch ?? (opts.voiceGender === 'male' ? 0.8 : segment.lang === 'es-MX' ? 1.0 : 1.1);

    const selectAndSpeak = () => {
      // FIX 2026-09-30: la espera de voces (hasta 300 ms) puede sobrevivir a un
      // cambio de página. Si ya no es la reproducción vigente, no se habla.
      if (!isCurrent()) {
        resolve();
        return;
      }
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const voice = pickVoice(voices, segment.lang, opts.voiceGender || 'female');
        if (voice) utterance.voice = voice;
      }

      utterance.onstart = () => {
        if (isLast) opts.onStart?.();
      };
      utterance.onend = () => {
        clearSpeechKeepAlive();
        if (isLast) opts.onEnd?.();
        resolve();
      };
      utterance.onerror = (e) => {
        clearSpeechKeepAlive();
        const errCode = (e as any)?.error;
        if (errCode === 'not-allowed') {
          // Reintentar tras interacción
          pendingAutoplay = { text: segment.text, options: opts };
        } else if (errCode !== 'canceled' && errCode !== 'interrupted') {
          opts.onError?.(e);
        }
        resolve();
      };

      try {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        if (isLast) {
          longSpeechKeepAlive = setInterval(() => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
              if (!window.speechSynthesis.speaking) {
                clearSpeechKeepAlive();
              } else {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
              }
            }
          }, 10000);
        }
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Error al ejecutar speak:', err);
        opts.onError?.(err);
        resolve();
      }
    };

    // Algunos navegadores necesitan una llamada previa para poblar voces
    if (window.speechSynthesis.getVoices().length === 0) {
      const onVoices = () => {
        window.speechSynthesis.onvoiceschanged = null;
        selectAndSpeak();
      };
      window.speechSynthesis.onvoiceschanged = onVoices;
      // Fallback por si nunca dispara el evento
      setTimeout(() => {
        if (window.speechSynthesis.onvoiceschanged === onVoices) {
          window.speechSynthesis.onvoiceschanged = null;
          selectAndSpeak();
        }
      }, 300);
    } else {
      selectAndSpeak();
    }
  });
};

// ─────────────────────────────────────────────────────────────
// playAudio — punto de entrada
// ─────────────────────────────────────────────────────────────

export const playAudio = (
  text: string,
  options?: PlayAudioOptions | (() => void)
): void => {
  if (!text || typeof window === 'undefined') return;

  const opts: PlayAudioOptions =
    typeof options === 'function' ? { onEnd: options } : options || {};

  // FIX 2026-09-27: split bilingüe SIEMPRE (quotes = inglés, resto = español)
  const segments = splitBilingual(text, opts.forceLang);
  if (segments.length === 0) {
    console.warn('TTS: Texto vacío o sin contenido reproducible.');
    return;
  }

  playGeneration++;
  const myGeneration = playGeneration;

  window.speechSynthesis?.cancel();
  stopCurrentAudioElement();

  (async () => {
    for (let i = 0; i < segments.length; i++) {
      if (myGeneration !== playGeneration) return;
      const seg = segments[i];
      const isFirst = i === 0;
      const isLast = i === segments.length - 1;
      // ¿Sigue vigente esta reproducción? Se recalcula en cada await.
      const isCurrent = () => myGeneration === playGeneration;

      // 1. Backend
      const played = await tryBackendTTS(seg.text, seg.lang, {
        ...opts,
        onStart: isFirst ? opts.onStart : undefined,
      }, isCurrent);
      if (myGeneration !== playGeneration) return;
      if (played) continue;

      // 2. Fallback Web Speech
      await speakSegment(seg, opts, isLast, isCurrent);
      if (myGeneration !== playGeneration) return;
    }
  })().catch((err) => {
    console.warn('TTS: error general', err);
    opts.onError?.(err);
  });
};

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  } catch {}
}

export default {
  playAudio,
  stopAudio,
  splitBilingual,
};