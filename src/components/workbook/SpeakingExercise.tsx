import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { playAudio, stopAudio } from '@/services/workbook/ttsService';
import { stopSpeech } from '@/utils/workbook/audioFeedback';
import { ReactivoCardData } from './ReactivoCard';

export interface SpeakingExerciseProps {
  reactivo: ReactivoCardData;
  onAnswer: (result: { respuesta: string; correcto: boolean; tipo: 'speaking' }) => void;
  validationState?: 'unanswered' | 'first_fail' | 'second_fail' | 'correct';
}

/**
 * Normalización de texto tolerante para evaluación de Speaking:
 * - Convierte a minúsculas
 * - Elimina signos de puntuación y caracteres especiales
 * - Colapsa espacios múltiples a uno solo
 * - Elimina espacios en los extremos
 */
export const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()¿?¡!"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Normalización adicional para contracciones comunes en inglés
 * (permite aceptar tanto "I'm a student" como "I am a student")
 */
export const normalizeContractions = (text: string): string => {
  return normalizeText(text)
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\byou're\b/g, 'you are')
    .replace(/\bhe's\b/g, 'he is')
    .replace(/\bshe's\b/g, 'she is')
    .replace(/\bit's\b/g, 'it is')
    .replace(/\bwe're\b/g, 'we are')
    .replace(/\bthey're\b/g, 'they are')
    .replace(/\bisn't\b/g, 'is not')
    .replace(/\baren't\b/g, 'are not')
    .replace(/\bdon't\b/g, 'do not')
    .replace(/\bdoesn't\b/g, 'does not')
    .replace(/\bcan't\b/g, 'cannot');
};

export const SpeakingExercise: React.FC<SpeakingExerciseProps> = ({
  reactivo,
  onAnswer,
  validationState = 'unanswered',
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [showTraduccion, setShowTraduccion] = useState<boolean>(true);
  const [transcript, setTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isStoppingAudio, setIsStoppingAudio] = useState<boolean>(false);

  // Referencia al objeto de reconocimiento de voz
  const recognitionRef = useRef<any>(null);

  // ═══ FIX 2026-10-07: SPEAKING solo usa la FRASE, no la orden ═══
  const targetText = React.useMemo(() => {
    try {
      const raw = (reactivo as any).audioTTS;
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed && Array.isArray(parsed.segments) && parsed.segments.length > 0) {
          const enSeg = parsed.segments.find(
            (s: any) => s && typeof s.text === 'string' && (s.lang || '').startsWith('en')
          );
          const first = enSeg || parsed.segments[0];
          if (first && typeof first.text === 'string' && first.text.trim().length > 0) {
            return first.text.trim();
          }
        }
      }
    } catch {}
    const correct = (reactivo.respuesta_correcta || '').trim();
    if (correct) return correct;
    let q = (reactivo.pregunta_texto || '').trim();
    q = q.replace(/^(Listen and repeat|Read aloud|Repeat clearly|Repeat|Read|Say|Escucha y repite|Lee en voz alta)[:\s]*/i, '');
    q = q.replace(/^["\u201C\u201D'](.*)["\u201C\u201D']$/s, '$1').trim();
    return q;
  }, [reactivo.pregunta_texto, reactivo.respuesta_correcta, (reactivo as any).audioTTS]);


  // Limpiar estados cuando cambia el reactivo
  useEffect(() => {
    setTranscript('');
    setErrorMessage('');
    setIsRecording(false);
    setIsPlayingAudio(false);

    // Detener cualquier audio previo
    stopSpeech();
    stopAudio();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
  }, [reactivo.reactivo_id]);

  // Inicializar Speech Recognition
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      setErrorMessage(
        'Tu navegador actual no soporta reconocimiento de voz nativo (Web Speech API). Te recomendamos abrir la app en Google Chrome, Microsoft Edge o Safari.'
      );
      return;
    }

    setIsSupported(true);

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsRecording(true);
        setErrorMessage('');
      };

      recognition.onresult = (event: any) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const spokenText = event.results[0][0].transcript || '';
          console.log('[MIC] Transcribed:', JSON.stringify(spokenText));
          console.log('[MIC] Target:', JSON.stringify(targetText));
          console.log('[MIC] Normalized spoken:', JSON.stringify(normalizeText(spokenText)));
          console.log('[MIC] Normalized target:', JSON.stringify(normalizeText(targetText)));
          setTranscript(spokenText);
          setIsRecording(false);
          evaluateSpokenText(spokenText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsRecording(false);

        if (event.error === 'not-allowed') {
          setErrorMessage(
            'Permiso de micrófono bloqueado. Por favor haz clic en el ícono de candado o configuración en la barra del navegador y permite el acceso al micrófono.'
          );
        } else if (event.error === 'no-speech') {
          setErrorMessage(
            'No se detectó ningún sonido o voz. Presiona "Grabar" e intenta leer la frase de nuevo en voz alta.'
          );
        } else if (event.error !== 'aborted') {
          setErrorMessage(`Aviso del micrófono: ${event.error}. Intenta de nuevo.`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Error inicializando SpeechRecognition:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      stopSpeech();
      stopAudio();
    };
  }, [targetText]);

  // Evaluación con normalización tolerante
  const evaluateSpokenText = (spokenText: string) => {
    const normSpoken = normalizeText(spokenText);
    const normTarget = normalizeText(targetText);

    const normSpokenContractions = normalizeContractions(spokenText);
    const normTargetContractions = normalizeContractions(targetText);

    const isExactMatch = normSpoken === normTarget;
    const isContractionMatch = normSpokenContractions === normTargetContractions;

    // NUEVO (2026-09-25): comparación por similitud de palabras.
    // Acepta si >= 80% de las palabras del target coinciden con las del spoken.
    const targetWords = normTargetContractions.split(' ').filter(Boolean);
    const spokenWords = normSpokenContractions.split(' ').filter(Boolean);

    let matchCount = 0;
    const spokenCopy = [...spokenWords];
    for (const w of targetWords) {
      const idx = spokenCopy.indexOf(w);
      if (idx >= 0) {
        matchCount++;
        spokenCopy.splice(idx, 1);
      }
    }
    const similarity = targetWords.length > 0 ? matchCount / targetWords.length : 0;
    const isSimilarEnough = similarity >= 0.8;

    console.log('[MIC] Similarity:', (similarity * 100).toFixed(1) + '%', '| match:', matchCount, '/', targetWords.length);

    const isCorrect = isExactMatch || isContractionMatch || isSimilarEnough;

    onAnswer({
      respuesta: spokenText,
      correcto: isCorrect,
      tipo: 'speaking',
    });
  };

  // Manejador del botón "Escuchar pronunciación" (TTS)
  const handleToggleAudio = () => {
    // FIX 2026-09-26: Si esta deteniendo, no hacer nada (evitar doble click)
    if (isStoppingAudio) return;

    if (isPlayingAudio) {
      setIsStoppingAudio(true);
      stopSpeech();
      stopAudio();
      setIsPlayingAudio(false);
      setTimeout(() => setIsStoppingAudio(false), 100);
      return;
    }

    // Detener grabacion si estuviera activa
    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      setIsRecording(false);
    }

    setIsPlayingAudio(true);
    playAudio(targetText, { forceLang: 'en-US',
      onStart: () => setIsPlayingAudio(true),
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  // Manejador del botón de Grabar (Micrófono)
  const handleToggleRecord = () => {
    setErrorMessage('');

    // FIX 2026-09-26: Si se esta reproduciendo audio, forzar stop + esperar
    // antes de activar microfono. Esto previene que el mic capture el audio demo.
    const wasPlayingAudio = isPlayingAudio;
    if (isPlayingAudio) {
      stopSpeech();
      stopAudio();
      setIsPlayingAudio(false);
    }

    // Si ya esta grabando, detenerlo (sin esperar)
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsRecording(false);
      return;
    }

    // Si se acababa de detener el audio, esperar 350ms para que el navegador
    // termine de cancelar cualquier buffer de audio residual.
    if (wasPlayingAudio) {
      setTimeout(() => {
        if (!recognitionRef.current) {
          setErrorMessage('El reconocimiento de voz no esta listo.');
          return;
        }
        setTranscript('');
        try {
          recognitionRef.current.start();
        } catch (err: any) {
          try {
            recognitionRef.current.abort();
            setTimeout(() => recognitionRef.current.start(), 120);
          } catch {
            setErrorMessage('No se pudo activar el microfono. Vuelve a hacer clic.');
            setIsRecording(false);
          }
        }
      }, 350);
      return;
    }

    if (!recognitionRef.current) {
      setErrorMessage(
        'El reconocimiento de voz no está listo o no está disponible en este navegador.'
      );
      return;
    }

    setTranscript('');

    try {
      recognitionRef.current.start();
    } catch (err: any) {
      console.warn('Error al iniciar recognition:', err);
      try {
        recognitionRef.current.abort();
        setTimeout(() => {
          recognitionRef.current.start();
        }, 120);
      } catch (retryErr) {
        setErrorMessage('No se pudo activar el micrófono. Vuelve a hacer clic.');
        setIsRecording(false);
      }
    }
  };

  const isResolved = validationState === 'correct' || validationState === 'second_fail';

  return (
    <div id={`speaking-challenge-${reactivo.reactivo_id}`} className="space-y-4">
      {/* 1. ENCABEZADO CONTEXTUAL PEDAGÓGICO */}
      <div className="bg-rose-50/90 border border-rose-200/90 rounded-2xl p-4 sm:p-5 text-rose-950 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            🗣️
          </div>
          <div>
            
            <p className="text-xs sm:text-sm font-semibold text-rose-900 leading-snug">
              Lee la frase en voz alta con tu micrófono después de escuchar la pronunciación:
            </p>
          </div>
        </div>

        {/* Botón Escuchar Pronunciación (TTS) en el header para acceso rápido */}
        <button
          type="button"
          id="btn-speaking-listen-header"
          onClick={handleToggleAudio}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
            isPlayingAudio
              ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-300'
              : 'bg-white text-rose-700 hover:bg-rose-100/80 border border-rose-200'
          }`}
        >
          {isPlayingAudio ? (
            <>
              <VolumeX className="w-4 h-4" />
              <span className="hidden sm:inline">Detener</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-rose-600" />
              <span>Escuchar modelo</span>
            </>
          )}
        </button>
      </div>

      {/* 2. TARJETA CENTRAL: FRASE A LEER (pregunta_texto) DE FORMA CLARA Y GRANDE */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-200 text-center shadow-xs relative">


        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 font-sans tracking-tight leading-tight my-2">
          {targetText}
        </h2>

        {/* TRADUCCIÓN COMO TEXTO DE AYUDA (CON BOTÓN DE MOSTRAR/OCULTAR) */}
        {reactivo.frase_traduccion && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm">
            <button
              type="button"
              id="btn-speaking-toggle-translation"
              onClick={() => setShowTraduccion(!showTraduccion)}
              className="text-slate-500 hover:text-slate-700 inline-flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors font-medium"
            >
              {showTraduccion ? (
                <>
                  <EyeOff className="w-4 h-4 text-slate-400" />
                  <span>Ocultar traducción</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span>Ver traducción</span>
                </>
              )}
            </button>

            {showTraduccion && (
              <span className="text-slate-600 italic font-sans animate-fadeIn">
                "{reactivo.frase_traduccion}"
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. CONTROLES PRINCIPALES: ESCUCHAR PRONUNCIACIÓN Y BOTÓN GRANDE DE GRABAR */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-7 text-center shadow-inner space-y-5">
        {/* Subtítulo indicativo */}
        <div>
          <p className="text-slate-700 font-bold text-base sm:text-lg">
            {isRecording
              ? '🎙️ Grabando... Habla ahora en inglés'
              : isResolved
              ? '✨ Ejercicio de lectura completado'
              : validationState === 'first_fail'
              ? '🔁 2ª oportunidad: Presiona Grabar e intenta nuevamente'
              : 'Presiona el botón de Grabar para leer la frase:'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {isRecording
              ? 'Pronuncia la frase claramente y la app transcribirá automáticamente'
              : 'Puedes escuchar la pronunciación cuantas veces necesites'}
          </p>
        </div>

        {/* ANIMACIÓN DE ONDAS DE SONIDO CUANDO ESTÁ GRABANDO */}
        {isRecording && (
          <div className="flex items-center justify-center gap-1.5 h-8 animate-fadeIn">
            <div className="w-1.5 bg-rose-500 rounded-full animate-soundWave1 h-6" />
            <div className="w-1.5 bg-rose-600 rounded-full animate-soundWave2 h-8" />
            <div className="w-1.5 bg-rose-500 rounded-full animate-soundWave3 h-4" />
            <div className="w-1.5 bg-rose-600 rounded-full animate-soundWave4 h-7" />
            <div className="w-1.5 bg-rose-500 rounded-full animate-soundWave2 h-5" />
          </div>
        )}

        {/* BOTÓN PRINCIPAL DE GRABAR / DETENER */}
        <div className="flex flex-col items-center justify-center">
          <button
            type="button"
            id="btn-speaking-record-main"
            onClick={handleToggleRecord}
            disabled={isResolved || !isSupported || isPlayingAudio}
            aria-label={isRecording ? 'Detener grabación' : 'Grabar voz'}
            className={`
              relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl cursor-pointer
              ${
                isRecording
                  ? 'bg-rose-600 text-white ring-8 ring-rose-300 animate-pulse scale-105'
                  : isResolved
                  ? validationState === 'correct'
                    ? 'bg-emerald-600 text-white cursor-default ring-4 ring-emerald-200'
                    : 'bg-slate-400 text-white cursor-default'
                  : validationState === 'first_fail'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white ring-4 ring-amber-200 hover:scale-105 active:scale-95'
                  : 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-100 hover:scale-105 active:scale-95'
              }
            `}
          >
            {isRecording ? (
              <>
                <MicOff className="w-10 h-10 animate-bounce" />
                <span className="text-[11px] font-bold uppercase tracking-wider mt-1">Detener</span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10" />
                <span className="text-[11px] font-bold uppercase tracking-wider mt-1">
                  {validationState === 'first_fail' ? 'Reintentar' : 'Grabar'}
                </span>
              </>
            )}
          </button>

          <span className="text-xs font-semibold text-slate-600 mt-3">
            {isRecording
              ? '🔴 Grabando... Presiona para detener'
              : isResolved
              ? 'Grabación finalizada'
              : 'Haz clic en el micrófono para hablar'}
          </span>
        </div>

        {/* BOTÓN SECUNDARIO: ESCUCHAR PRONUNCIACIÓN (TTS) */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            id="btn-speaking-listen-tts"
            onClick={handleToggleAudio}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer border ${
              isPlayingAudio
                ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300 animate-pulse'
                : 'bg-white text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-4 h-4 text-white" />
                <span>Detener audio</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span>🔊 Escuchar pronunciación</span>
              </>
            )}
          </button>

        {/* ═══ FIX 2026-10-08: BOTÓN SALTAR — solo en estados de fallo ═══ */}
        {(validationState === 'first_fail' || validationState === 'second_fail') && (
          <div className="pt-4 mt-2 border-t border-slate-200">
            <p className="text-[11px] text-slate-400 mb-2">
              ¿Problemas con el micrófono? Puedes avanzar (contará como error)
            </p>
            <button
              type="button"
              id="btn-speaking-skip"
              onClick={() => {
                onAnswer({
                  respuesta: '__SKIPPED__',
                  correcto: false,
                  tipo: 'speaking',
                });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all cursor-pointer"
              title="Cuenta como error y avanza al siguiente ejercicio"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Saltar y avanzar</span>
            </button>
          </div>
        )}
        </div>
      </div>

      {/* 4. MENSAJE DE ERROR O PERMISOS DE MICRÓFONO */}
      {errorMessage && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-950 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-900">Aviso del micrófono:</p>
            <p className="text-amber-800 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 5. FEEDBACK Y EVALUACIÓN SEGÚN LOS 3 ESTADOS (CORRECTO / 1ER FALLO / 2DO FALLO) */}
      {validationState !== 'unanswered' && (
        <div className="animate-fadeIn">
          {validationState === 'correct' ? (
            /* CASO DE ÉXITO */
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 sm:p-6 shadow-sm text-left">
              <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-lg pb-2 border-b border-emerald-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <span>¡Correcto! Excelente pronunciación</span>
              </div>

              <div className="mt-3 space-y-2 text-xs sm:text-sm">
                {transcript && (
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-200">
                    <span className="text-xs font-bold text-emerald-900 block mb-0.5 uppercase tracking-wide">
                      Lo que entendimos:
                    </span>
                    <span className="text-emerald-950 font-semibold text-base font-sans">
                      "{transcript}"
                    </span>
                  </div>
                )}

                {reactivo.respuesta_explicacion && (
                  <div className="bg-emerald-100/70 p-3 rounded-xl border border-emerald-200 text-emerald-950">
                    <span className="font-bold block mb-0.5">💡 Explicación pedagógica:</span>
                    <span>{reactivo.respuesta_explicacion}</span>
                  </div>
                )}
              </div>
            </div>
          ) : validationState === 'first_fail' ? (
            /* PRIMER FALLO -> SEGUNDA OPORTUNIDAD */
            <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 sm:p-6 shadow-sm text-left">
              <div className="flex items-center gap-2.5 text-amber-900 font-bold text-base sm:text-lg pb-2 border-b border-amber-200">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                <span>Inténtalo de nuevo (2ª oportunidad)</span>
              </div>

              <div className="mt-3 space-y-2.5 text-xs sm:text-sm">
                {transcript && (
                  <div className="bg-white/85 p-3 rounded-xl border border-amber-200">
                    <span className="text-xs font-bold text-amber-900 block mb-0.5 uppercase tracking-wide">
                      Entendimos:
                    </span>
                    <span className="text-red-700 font-bold text-base font-sans">"{transcript}"</span>
                    <span className="text-slate-500 block text-xs mt-1">
                      Esperábamos: <strong className="text-slate-800 font-sans">"{targetText}"</strong>
                    </span>
                  </div>
                )}

                <div className="bg-amber-100/80 p-3 rounded-xl text-amber-950 font-medium border border-amber-200 leading-relaxed">
                  <p>
                    Puedes escuchar la pronunciación correcta con el botón <strong>🔊 Escuchar pronunciación</strong> y luego presionar <strong>Reintentar</strong> para grabar tu segundo intento.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* SEGUNDO FALLO -> SE TERMINAN OPORTUNIDADES */
            <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-5 sm:p-6 shadow-sm text-left">
              <div className="flex items-center gap-2.5 text-rose-900 font-bold text-base sm:text-lg pb-2 border-b border-rose-200">
                <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                <span>Te has equivocado 2 veces</span>
              </div>

              <div className="mt-3 space-y-2.5 text-xs sm:text-sm">
                {transcript && (
                  <div className="bg-white/85 p-3 rounded-xl border border-rose-200">
                    <span className="text-xs font-bold text-rose-900 block mb-0.5 uppercase tracking-wide">
                      Última transcripción:
                    </span>
                    <span className="text-rose-800 font-bold text-base font-sans">"{transcript}"</span>
                  </div>
                )}

                <div className="bg-white/90 p-3.5 rounded-xl border border-rose-200 text-slate-800 space-y-1.5">
                  <p>
                    <strong>Frase correcta:</strong>{' '}
                    <span className="font-bold text-emerald-700 font-sans text-base">
                      {targetText}
                    </span>
                  </p>
                  {reactivo.respuesta_explicacion && (
                    <p className="text-slate-600 pt-1 border-t border-slate-100">
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

export default SpeakingExercise;

