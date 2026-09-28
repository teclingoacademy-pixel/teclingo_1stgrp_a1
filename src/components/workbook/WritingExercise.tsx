import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Volume2, VolumeX, CheckCircle2, AlertCircle, XCircle, Send, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { playAudio, stopAudio, isValidEnglishForTTS } from '@/services/workbook/ttsService';
import { stopSpeech } from '@/utils/workbook/audioFeedback';

/**
 * Normaliza una cadena para comparar respuestas de forma tolerante.
 * - trim + lowercase
 * - apóstrofes tipográficos → rectos
 * - comillas tipográficas → rectas
 * - quita puntuación final (. , ! ? ; :)
 * - colapsa espacios múltiples
 */
const normalizeForCompare = (s: string): string =>
  (s || '')
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BC\u2032`\u00B4]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[.,!?;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export interface WritingExerciseProps {
  reactivo: any;
  onAnswer: (result: { respuesta: string; correcto: boolean; tipo?: string }) => void;
  validationState?: 'unanswered' | 'first_fail' | 'second_fail' | 'correct';
  textoBase?: {
    titulo_texto?: string;
    contenido_texto?: string;
    titulo?: string;
    contenido?: string;
    [key: string]: any;
  } | null;
}

/**
 * Divide el texto en 3 partes: antes, match (frase ancla), despues.
 * Case-insensitive, tolera puntuacion final. Si no encuentra, match=null.
 */
function splitByAnchor(fullText: string, anchor: string): { before: string; match: string | null; after: string } {
  if (!fullText || !anchor) return { before: fullText, match: null, after: '' };
  const cleanAnchor = anchor.replace(/[.,!?;:]+$/g, '').trim();
  if (!cleanAnchor) return { before: fullText, match: null, after: '' };
  const idx = fullText.toLowerCase().indexOf(cleanAnchor.toLowerCase());
  if (idx < 0) return { before: fullText, match: null, after: '' };
  return {
    before: fullText.slice(0, idx),
    match: fullText.slice(idx, idx + cleanAnchor.length),
    after: fullText.slice(idx + cleanAnchor.length),
  };
}

export const WritingExercise: React.FC<WritingExerciseProps> = ({
  reactivo,
  onAnswer,
  validationState = 'unanswered',
  textoBase: textoBaseProp,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [submittedAnswer, setSubmittedAnswer] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [showTextBase, setShowTextBase] = useState<boolean>(false);
  const [textoBaseLocal, setTextoBaseLocal] = useState<any | null>(textoBaseProp || null);
  const [loadingTextBase, setLoadingTextBase] = useState<boolean>(false);
  const [textBaseError, setTextBaseError] = useState<string | null>(null);

  // Respuesta esperada en inglés para el TTS y evaluación
  const englishTarget = useMemo(() => {
    const ans = (reactivo.respuesta_correcta || '').trim();
    if (isValidEnglishForTTS(ans)) return ans;
    const trans = (reactivo.frase_traduccion || '').trim();
    if (isValidEnglishForTTS(trans)) return trans;
    return ans;
  }, [reactivo.respuesta_correcta, reactivo.frase_traduccion]);

  // Cargar TextBase de la lección (props o fetch). Cachea en sessionStorage.
  useEffect(() => {
    const claseId = reactivo?.clase_id || reactivo?.claseId || '';
    if (!claseId) { setTextoBaseLocal(null); return; }

    // Prioridad 1: prop del padre
    if (textoBaseProp && (textoBaseProp.contenido_texto || textoBaseProp.contenido)) {
      setTextoBaseLocal(textoBaseProp);
      return;
    }

    // Prioridad 2: sessionStorage cache
    const cacheKey = 'textbase_' + claseId;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setTextoBaseLocal(JSON.parse(cached));
        return;
      }
    } catch {}

    // Prioridad 3: fetch
    let cancelled = false;
    setLoadingTextBase(true);
    setTextBaseError(null);
    fetch('/api/v1/textos-base?clase_id=' + encodeURIComponent(claseId))
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const payload = json && (json.data || json.texto);
        if (payload && (payload.contenido_texto || payload.contenido)) {
          setTextoBaseLocal(payload);
          try { sessionStorage.setItem(cacheKey, JSON.stringify(payload)); } catch {}
        } else {
          setTextoBaseLocal(null);
          setTextBaseError('Texto de referencia no disponible para esta lección.');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTextoBaseLocal(null);
          setTextBaseError('No se pudo cargar el texto de referencia.');
        }
      })
      .finally(() => { if (!cancelled) setLoadingTextBase(false); });

    return () => { cancelled = true; };
  }, [reactivo?.clase_id, reactivo?.claseId, textoBaseProp]);

  // Al cambiar de reactivo, reiniciar estados locales y enfocar el input
  // CRÍTICO: Sin Autoplay - NO reproducir audio automáticamente
  useEffect(() => {
    setInputText('');
    setSubmittedAnswer('');
    stopSpeech();
    stopAudio();
    setIsPlayingAudio(false);

    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      stopSpeech();
      stopAudio();
      setIsPlayingAudio(false);
    };
  }, [reactivo.reactivo_id]);

  // Manejador del botón de Audio (TTS): Lee exclusivamente la respuesta en inglés
  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopSpeech();
      stopAudio();
      setIsPlayingAudio(false);
      return;
    }

    stopSpeech();
    stopAudio();

    if (!englishTarget) {
      console.warn('TTS: No hay texto en inglés para reproducir.');
      return;
    }

    setIsPlayingAudio(true);
    playAudio(englishTarget, { forceLang: 'en-US',
      onStart: () => setIsPlayingAudio(true),
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  // Manejo de envío y comprobación
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;
    if (validationState === 'correct' || validationState === 'second_fail') return;

    setSubmittedAnswer(trimmedInput);

    // Comparación tolerante: normaliza mayúsculas, espacios, apóstrofes y puntuación final.
    // Además, considera TODAS las respuestas aceptadas (acceptedAnswers) y la respuesta canónica.
    const normalizedUser = normalizeForCompare(trimmedInput);

    const rawCandidates: string[] = [
      reactivo.respuesta_correcta,
      ...(Array.isArray(reactivo.acceptedAnswers) ? reactivo.acceptedAnswers : []),
      ...(Array.isArray(reactivo.accepted_answers) ? reactivo.accepted_answers : []),
    ].filter((x): x is string => typeof x === 'string' && x.length > 0);

    const normalizedCandidates = rawCandidates.map(normalizeForCompare).filter(Boolean);
    const isMatch = normalizedCandidates.includes(normalizedUser);

    onAnswer({
      respuesta: trimmedInput,
      correcto: isMatch,
      tipo: 'writing',
    });
  };

  const isResolved = validationState === 'correct' || validationState === 'second_fail';

  // NUEVO (2026-09-25): Detecta el idioma del enunciado para el label dinámico.
  const promptLang: 'es' | 'en' = React.useMemo(() => {
    const q = (reactivo.pregunta_texto || '').trim();
    // REGLA BINARIA: comillas "..." = ingles. Sin comillas = espanol.
    return /^[""].*[""]$/.test(q) ? 'en' : 'es';
  }, [reactivo.pregunta_texto]);

  return (
    <div
      className="w-full bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-5 text-left"
      id="writing-interactive-dictation"
    >
      {/* 1. ENUNCIADO / PROMPT EN ESPAÑOL */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 sm:p-6 text-center shadow-xs">
        <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block mb-1 font-mono">
          Enunciado en {promptLang === 'es' ? 'Español' : 'Inglés'}:
        </span>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug font-sans">
          {reactivo.pregunta_texto}
        </div>
        {reactivo.contexto_espanol && (
          <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium">
            {reactivo.contexto_espanol}
          </p>
        )}
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => playAudio((reactivo.pregunta_texto || '').replace(/^[""]|[""]$/g, ''), { forceLang: promptLang === 'en' ? 'en-US' : 'es-MX' })}
            className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title={promptLang === 'en' ? 'Escuchar enunciado en inglés' : 'Escuchar enunciado en español'}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Escuchar enunciado</span>
          </button>
        </div>
      </div>

      {/* 2. BOTÓN DE AUDIO TTS (PISTA DE PRONUNCIACIÓN EN INGLÉS) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4 sm:p-5">
        <div className="text-center sm:text-left">
          <p className="text-xs sm:text-sm font-bold text-teal-950 flex items-center justify-center sm:justify-start gap-1.5">
            <span>🎧</span>
            <span>Pista auditiva (Pronunciación en inglés):</span>
          </p>
          <p className="text-xs text-teal-800/90 mt-0.5">
            Escucha cómo se pronuncia la palabra correcta antes de escribir.
          </p>
        </div>

        <button
          type="button"
          id="btn-writing-audio-clue"
          onClick={handleToggleAudio}
          disabled={!englishTarget}
          aria-label="Escuchar pronunciación en inglés"
          className={`px-5 py-3 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 ${
            isPlayingAudio
              ? 'bg-teal-700 text-white ring-4 ring-teal-300 animate-pulse'
              : 'bg-teal-600 hover:bg-teal-700 text-white hover:shadow-md'
          }`}
        >
          {isPlayingAudio ? (
            <>
              <VolumeX className="w-5 h-5 text-white animate-bounce shrink-0" />
              <span>Reproduciendo...</span>
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5 shrink-0" />
              <span>🔊 Escuchar audio</span>
            </>
          )}
        </button>
      </div>

      {/* 2.5 PANEL "VER TEXTO DE REFERENCIA" (NUEVO 2026-09-27) */}
      {(textoBaseLocal || loadingTextBase || textBaseError) && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowTextBase((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3 hover:bg-indigo-100/60 transition-colors cursor-pointer"
            aria-expanded={showTextBase}
          >
            <div className="flex items-center gap-2.5 text-left">
              <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="text-xs sm:text-sm font-bold text-indigo-900 block">
                  Ver texto de referencia
                </span>
                <span className="text-[11px] text-indigo-700/80 block">
                  Consulta la frase del texto modelo si necesitas apoyo
                </span>
              </div>
            </div>
            {showTextBase ? (
              <ChevronUp className="w-4 h-4 text-indigo-600 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-indigo-600 shrink-0" />
            )}
          </button>

          {showTextBase && (
            <div className="border-t border-indigo-200 bg-white p-4 sm:p-5 space-y-3">
              {loadingTextBase && (
                <p className="text-xs text-slate-500 italic">Cargando texto...</p>
              )}

              {textBaseError && !loadingTextBase && (
                <p className="text-xs text-rose-600 italic">{textBaseError}</p>
              )}

              {textoBaseLocal && !loadingTextBase && (() => {
                const fullText = textoBaseLocal.contenido_texto || textoBaseLocal.contenido || '';
                const titulo = textoBaseLocal.titulo_texto || textoBaseLocal.titulo || 'Texto modelo';

                return (
                  <>
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                        {titulo}
                      </span>
                      <button
                        type="button"
                        onClick={() => playAudio(fullText, { forceLang: 'en-US' })}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Escuchar el texto completo en inglés"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Escuchar texto</span>
                      </button>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                      {fullText}
                    </p>
                    <p className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md px-2.5 py-1.5 italic">
                      💡 Lee el texto completo y busca la frase que responde al enunciado.
                    </p>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* 3. CAMPO DE TEXTO (INPUT) Y BOTÓN DE COMPROBAR */}
      <form onSubmit={handleSubmit} className="space-y-3" id="form-writing-input">
        <div>
          <label
            htmlFor="writing-text-input"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Escribe tu respuesta en inglés:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <input
              ref={inputRef}
              type="text"
              id="writing-text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isResolved}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="off"
              placeholder="Escribe la palabra aquí..."
              className={`flex-1 px-4 py-3 sm:py-3.5 rounded-xl text-base sm:text-lg font-medium border-2 transition-all outline-hidden font-sans ${
                isResolved
                  ? validationState === 'correct'
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 font-bold cursor-default'
                    : 'border-slate-300 bg-slate-100 text-slate-700 cursor-default'
                  : validationState === 'first_fail'
                  ? 'border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-200/60 bg-amber-50/30'
                  : 'border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 bg-white'
              }`}
            />

            {!isResolved && (
              <button
                type="submit"
                id="btn-writing-submit-check"
                disabled={!inputText.trim()}
                className={`px-6 py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer active:scale-95 shrink-0 ${
                  !inputText.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : validationState === 'first_fail'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                <span>{validationState === 'first_fail' ? 'Reintentar' : 'Comprobar'}</span>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
          <span className="block text-[11px] text-slate-500 mt-1">
            Presiona <strong>Enter</strong> o haz clic en <strong>Comprobar</strong> para evaluar.
          </span>
        </div>
      </form>

      {/* 4. FEEDBACK Y EVALUACIÓN SEGÚN LOS 3 ESTADOS (CORRECTO / 1ER FALLO / 2DO FALLO) */}
      {validationState !== 'unanswered' && (
        <div className="animate-fadeIn">
          {validationState === 'correct' ? (
            /* CASO DE ÉXITO */
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 sm:p-6 shadow-sm text-left space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-900 font-bold text-base sm:text-lg pb-2 border-b border-emerald-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <span>¡Correcto!</span>
              </div>

              <div className="space-y-2 text-xs sm:text-sm">
                <div className="bg-white/90 p-3 rounded-xl border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-900 block mb-0.5 uppercase tracking-wide">
                    Tu respuesta:
                  </span>
                  <span className="text-emerald-950 font-bold text-base font-sans">
                    "{submittedAnswer || inputText}"
                  </span>
                </div>

                {reactivo.respuesta_explicacion && (
                  <div className="bg-emerald-100/70 p-3.5 rounded-xl border border-emerald-200 text-emerald-950">
                    <span className="font-bold block mb-0.5">💡 Explicación:</span>
                    <span className="leading-relaxed">{reactivo.respuesta_explicacion}</span>
                  </div>
                )}
              </div>
            </div>
          ) : validationState === 'first_fail' ? (
            /* PRIMER FALLO -> SEGUNDA OPORTUNIDAD */
            <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 sm:p-6 shadow-sm text-left space-y-3">
              <div className="flex items-center gap-2.5 text-amber-900 font-bold text-base sm:text-lg pb-2 border-b border-amber-200">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                <span>Inténtalo de nuevo (2ª oportunidad)</span>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm">
                {submittedAnswer && (
                  <div className="bg-white/85 p-3 rounded-xl border border-amber-200">
                    <span className="text-xs font-bold text-amber-900 block mb-0.5 uppercase tracking-wide">
                      Escribiste:
                    </span>
                    <span className="text-rose-700 font-bold text-base font-sans">
                      "{submittedAnswer}"
                    </span>
                  </div>
                )}

                <div className="bg-amber-100/80 p-3 rounded-xl text-amber-950 font-medium border border-amber-200 leading-relaxed">
                  <p>
                    Revisa la ortografía. Puedes volver a presionar <strong>🔊 Escuchar audio</strong> para oír la pronunciación y corregir tu respuesta antes de volver a comprobar.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* SEGUNDO FALLO -> SE TERMINAN OPORTUNIDADES */
            <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-5 sm:p-6 shadow-sm text-left space-y-3">
              <div className="flex items-center gap-2.5 text-rose-900 font-bold text-base sm:text-lg pb-2 border-b border-rose-200">
                <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                <span>Te has equivocado 2 veces</span>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm">
                {submittedAnswer && (
                  <div className="bg-white/85 p-3 rounded-xl border border-rose-200">
                    <span className="text-xs font-bold text-rose-900 block mb-0.5 uppercase tracking-wide">
                      Tu última respuesta:
                    </span>
                    <span className="text-rose-800 font-bold text-base font-sans">
                      "{submittedAnswer}"
                    </span>
                  </div>
                )}

                <div className="bg-white/95 p-3.5 rounded-xl border border-rose-200 text-slate-800 space-y-1.5">
                  <p>
                    <strong>Respuesta correcta:</strong>{' '}
                    <span className="font-bold text-emerald-700 font-sans text-base">
                      {reactivo.respuesta_correcta}
                    </span>
                  </p>
                  {reactivo.respuesta_explicacion && (
                    <p className="text-slate-600 pt-1.5 border-t border-slate-100 leading-relaxed">
                      💡 <em>{reactivo.respuesta_explicacion}</em>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WritingExercise;

