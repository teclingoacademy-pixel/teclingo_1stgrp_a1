/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Componente ReactivoCard
 * Renderiza los reactivos con las 4 nuevas columnas pedagógicas:
 * 1. contexto_espanol: Contexto en español que referencia texto/vocabulario
 * 2. frase_traduccion: Traducción al español de la frase en inglés
 * 3. opciones_traduccion_json / opciones_traduccion: Traducciones de cada opción
 * 4. pista_vocabulario: Pista pedagógica sobre dónde buscar la respuesta
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, XCircle, ChevronRight, HelpCircle, BookOpen, Lightbulb, Volume2, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { stopSpeech } from '@/utils/workbook/audioFeedback';
import { playAudio, stopAudio, isSpanishInstruction, isValidEnglishForTTS } from '@/services/workbook/ttsService';
import type { SheetTextoBaseRow } from '@/types/workbook/workbookRows';
import { AudioControl } from './AudioControl';
import { SpeakingExercise } from './SpeakingExercise';
import { WritingExercise } from './WritingExercise';

export interface ReactivoCardData {
  reactivo_id: string;
  clase_id: string;
  habilidad: string;
  numero_reactivo?: number;
  numero?: number;
  tipo_pregunta: string;
  instruccion: string;
  pregunta_texto: string;
  opciones: string[];
  opciones_json?: string[] | string;
  opciones_traduccion?: string[] | null;
  opciones_traduccion_json?: string[] | string | null;
  respuesta_correcta: string;
  respuesta_explicacion: string;
  puntos: number;
  tiempo_limite_seg: number;
  dificultad?: number;
  
  // 4 Nuevas Columnas Pedagógicas
  contexto_espanol?: string | null;
  frase_traduccion?: string | null;
  pista_vocabulario?: string | null;

  // Nuevas Columnas Estructuradas v3
  opciones_v3_json?: any;
  respuesta_correcta_id?: string;
  shuffle_opciones?: boolean;
  reglas_validacion_json?: any;
  audio_autoplay?: boolean;
  fuente_evidencia?: string;
  idioma_enunciado?: string;
  idioma_opciones?: string;

  // Andamiaje Pedagógico (Scaffolding de Traducción)
  mostrar_traduccion?: 'completa' | 'parcial' | 'ninguna' | string | null;
  palabras_clave_traduccion?: string | null;

  // Voz del TTS: 'male' usa backend con género masculino; 'female' (default) usa voz femenina.
  voz?: 'male' | 'female' | string | null;
}

export interface ShuffledOptionItem {
  texto: string;
  traduccion: string | null;
}

/**
 * Fisher-Yates shuffle algorithm
 * Mezcla aleatoriamente las opciones para evitar que la respuesta correcta
 * esté siempre en una posición predecible (como la posición A).
 */
export const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getInitialShuffledOptions = (reactivoData: ReactivoCardData): ShuffledOptionItem[] => {
  // 1. Priorizar opciones_v3_json si está disponible
  if (reactivoData.opciones_v3_json) {
    try {
      const v3 = typeof reactivoData.opciones_v3_json === 'string'
        ? JSON.parse(reactivoData.opciones_v3_json)
        : reactivoData.opciones_v3_json;
      if (Array.isArray(v3) && v3.length > 0) {
        const items: ShuffledOptionItem[] = v3.map((opt: any) => ({
          texto: opt.texto,
          traduccion: opt.traduccion || null,
        }));
        return reactivoData.shuffle_opciones !== false ? shuffleArray(items) : items;
      }
    } catch {
      // Continuar con fallback estándar
    }
  }

  let rawOptions: string[] = [];
  if (Array.isArray(reactivoData.opciones) && reactivoData.opciones.length > 0) {
    rawOptions = reactivoData.opciones;
  } else if (reactivoData.opciones_json) {
    try {
      rawOptions = typeof reactivoData.opciones_json === 'string'
        ? JSON.parse(reactivoData.opciones_json)
        : reactivoData.opciones_json;
    } catch {
      rawOptions = [];
    }
  }

  let rawTranslations: string[] | null = null;
  if (Array.isArray(reactivoData.opciones_traduccion)) {
    rawTranslations = reactivoData.opciones_traduccion;
  } else if (reactivoData.opciones_traduccion_json) {
    try {
      rawTranslations = typeof reactivoData.opciones_traduccion_json === 'string'
        ? JSON.parse(reactivoData.opciones_traduccion_json)
        : reactivoData.opciones_traduccion_json;
    } catch {
      rawTranslations = null;
    }
  }

  const items: ShuffledOptionItem[] = rawOptions.map((opt, idx) => ({
    texto: opt,
    traduccion: rawTranslations && rawTranslations[idx] ? rawTranslations[idx] : null,
  }));

  return reactivoData.shuffle_opciones !== false ? shuffleArray(items) : items;
};

export interface ReactivoCardProps {
  reactivo: ReactivoCardData;
  selectedOption: string | null;
  validationState: 'unanswered' | 'first_fail' | 'second_fail' | 'correct';
  onSelectOption: (option: string) => void;
  onNext?: () => void;
  isLastQuestion?: boolean;
  timeLeft?: number;
  textoBase?: SheetTextoBaseRow | null;
  isTutorialOpen?: boolean;
  isReviewMode?: boolean;
}

export const ReactivoCard: React.FC<ReactivoCardProps> = ({
  reactivo,
  selectedOption,
  validationState,
  onSelectOption,
  onNext,
  isLastQuestion = false,
  timeLeft,
  textoBase,
  isTutorialOpen = false,
  isReviewMode = false,
}) => {
  const [showPista, setShowPista] = useState<boolean>(false);
  const [showTraduccion, setShowTraduccion] = useState<boolean>(true);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState<boolean>(false);
  const [mostrarTextoListening, setMostrarTextoListening] = useState<boolean>(false);
  const [dictationText, setDictationText] = useState<string>('');
  const isReviewModeActive = isReviewMode === true;

  const isListening = (reactivo.habilidad || '').toLowerCase() === 'listening';
  const isSpeaking = (reactivo.habilidad || '').toLowerCase() === 'speaking';
  const isWriting = (reactivo.habilidad || '').toLowerCase() === 'writing';
  const isDictation = (reactivo.tipo_pregunta || '').toLowerCase() === 'dictation';

  // Extraer texto a reproducir por el TTS
  // En preguntas con espacio en blanco (___), reemplaza el marcador con la respuesta correcta
  // para que el estudiante escuche la oración completa como pista auditiva (ej: "One book is here." o "One child is here.")
  const audioTextToPlay = React.useMemo(() => {
    // NUEVO (2026-09-27): Writing NUNCA reproduce audio automatico del enunciado.
    // El componente WritingExercise maneja su propio audio (botones manuales).
    const skillLower = (reactivo.habilidad || '').toLowerCase();
    if (skillLower === 'writing') return '';
    // 0. NUEVO (2026-09-25): Si el reactivo trae audioTTS desde Prisma, úsalo directamente.
    //    Cubre LISTEN & SELECT, DICTATION, SHADOWING y cualquier tipo con audio explícito.
    //    Formato esperado: { segments: [{ text: "...", lang: "en", voiceGender: "male" }] }
    try {
      const raw = (reactivo as any).audioTTS;
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed && Array.isArray(parsed.segments) && parsed.segments.length > 0) {
          const enSeg = parsed.segments.find((s: any) => s && typeof s.text === 'string' && (s.lang || '').startsWith('en'));
          const first = enSeg || parsed.segments[0];
          if (first && typeof first.text === 'string' && first.text.trim().length > 0) {
            return first.text.trim();
          }
        }
      }
    } catch {
      // Fallback silencioso a la lógica original
    }

    // 0.5 NUEVO (2026-09-25): Estrategia de MÁXIMO AUDIO para nivel A1.
    //     - listen_and_select / audio_comprehension: leer TODO el enunciado (para input auditivo máximo).
    //     - dictation / shadowing: repetir la frase 2 veces.
    //     - read_aloud: leer la frase completa.
    //     - Resto: extraer solo la frase entre comillas.
    const rawQ = reactivo.pregunta_texto || '';
    const qType = (reactivo.tipo_pregunta || '').toLowerCase();

    // Extraer la frase entre comillas (respetando apóstrofes: She's, Don't, It's).
    const extractPhrase = (q: string): string | null => {
      let m = q.match(/Audio:\s*"([^"]+)"/i);
      if (!m) m = q.match(/Audio:\s*'([^']+)'/i);
      if (!m) m = q.match(/[""]([^""]+)[""]/);  // tipográficas
      return m && m[1] ? m[1].trim() : null;
    };

    const extractedPhrase = extractPhrase(rawQ);

    // LISTEN & SELECT / AUDIO COMPREHENSION → leer TODO el enunciado
    if (qType === 'listen_and_select' || qType === 'audio_comprehension') {
      const fullText = rawQ.replace(/^\s*Audio:\s*/i, '').trim();
      if (isValidEnglishForTTS(fullText)) {
        return fullText;
      }
    }

    // DICTATION / SHADOWING → repetir la frase 2 veces (con pausa)
    if (qType === 'dictation' || qType === 'shadowing') {
      const phrase = extractedPhrase || (reactivo.respuesta_correcta || '').trim();
      if (phrase && isValidEnglishForTTS(phrase)) {
        return `${phrase}. ... ${phrase}.`;
      }
    }

    // READ_ALOUD → frase completa
    if (qType === 'read_aloud') {
      const phrase = extractedPhrase || (reactivo.respuesta_correcta || '').trim();
      if (phrase && isValidEnglishForTTS(phrase)) {
        return phrase;
      }
    }

    // Default: solo la frase extraída
    if (extractedPhrase && isValidEnglishForTTS(extractedPhrase)) {
      return extractedPhrase;
    }

    // 1. Si hay audio explícito [Audio: '...']
    if (reactivo.pregunta_texto) {
      const match = reactivo.pregunta_texto.match(/\[Audio:\s*['"]?([^'"]+)['"]?\]/i);
      if (match && match[1] && isValidEnglishForTTS(match[1])) {
        return match[1].trim();
      }
    }

    const rawQuestion = reactivo.pregunta_texto || '';
    const correctAnswer = (reactivo.respuesta_correcta || '').trim();

    // 2. Lógica exclusiva para Listening Cloze:
    // Reemplaza ___ con respuesta_correcta para leer la oración completa (ej: "She is a teacher.")
    if (isListening) {
      const blankRegex = /_{1,}(?:\s*_{1,})*|\[_{1,}\]|\[\.\.\.\]|\.{3,}|\bblank\b/gi;
      let cleanQuestion = rawQuestion.replace(/\s*\([^)]*\)/g, '').trim();

      const quotedMatch = cleanQuestion.match(/["']([^"']*_{1,}[^"']*)["']/);
      if (quotedMatch && quotedMatch[1]) {
        cleanQuestion = quotedMatch[1].trim();
      }

      if (cleanQuestion && blankRegex.test(cleanQuestion) && correctAnswer) {
        const nonBlank = cleanQuestion.replace(blankRegex, '').replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase();
        let sentence: string;
        if (nonBlank.length > 2 && correctAnswer.toLowerCase().includes(nonBlank)) {
          sentence = correctAnswer;
        } else {
          sentence = cleanQuestion.replace(blankRegex, correctAnswer);
        }
        sentence = sentence.replace(/\s+/g, ' ').replace(/["']/g, '').trim();
        if (isValidEnglishForTTS(sentence)) {
          return sentence;
        }
      }

      if (correctAnswer && isValidEnglishForTTS(correctAnswer) && correctAnswer.includes(' ')) {
        return correctAnswer;
      }

      if (cleanQuestion && isValidEnglishForTTS(cleanQuestion) && !blankRegex.test(cleanQuestion)) {
        return cleanQuestion;
      }

      if (correctAnswer && isValidEnglishForTTS(correctAnswer)) {
        return correctAnswer;
      }
    }

    // 3. Extraer la frase en inglés retirando aclaraciones en español entre paréntesis ej: "(Un ___ está aquí.)"
    let cleanSentence = rawQuestion.replace(/\s*\([^)]*\)/g, '').trim();

    // Si la frase con blank viene entre comillas (ej: Completa: "You ___ my friend.")
    const quotedMatch = cleanSentence.match(/["']([^"']*_{1,}[^"']*)["']/);
    if (quotedMatch && quotedMatch[1]) {
      cleanSentence = quotedMatch[1].trim();
    }

    const blankRegex = /_{1,}(?:\s*_{1,})*|\[_{1,}\]|\[\.\.\.\]|\.{3,}|\bblank\b/gi;

    // Si la oración contiene un espacio en blanco y tenemos respuesta correcta:
    // Reemplazar el espacio en blanco con la respuesta correcta (ej: "One ___ is here." -> "One child is here." o "One book is here.")
    if (cleanSentence && blankRegex.test(cleanSentence) && correctAnswer) {
      let replaced = cleanSentence.replace(blankRegex, correctAnswer);
      replaced = replaced
        .replace(/\s*(?:->|=>|→)\s*/g, '. ')
        .replace(/["']/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (isValidEnglishForTTS(replaced)) {
        return replaced;
      }
    }

    // 4. Si la pregunta original es una instrucción en español (ej: "El plural de 'book' es:"):
    if (isSpanishInstruction(rawQuestion)) {
      const quoted = rawQuestion.match(/["']([a-zA-Z\s]+)["']/);
      if (quoted && quoted[1] && isValidEnglishForTTS(quoted[1])) {
        return quoted[1].trim();
      }
      if (correctAnswer && isValidEnglishForTTS(correctAnswer)) {
        return correctAnswer;
      }
      if (reactivo.frase_traduccion && isValidEnglishForTTS(reactivo.frase_traduccion)) {
        return reactivo.frase_traduccion.trim();
      }
      return '';
    }

    // 5. Oración estándar en inglés
    if (cleanSentence && isValidEnglishForTTS(cleanSentence)) {
      let text = cleanSentence
        .replace(/\s*(?:->|=>|→)\s*/g, '. ')
        .replace(/["']/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      return text;
    }

    // 6. Fallback a la respuesta correcta
    if (correctAnswer && isValidEnglishForTTS(correctAnswer)) {
      return correctAnswer;
    }

    return '';
  }, [reactivo.pregunta_texto, reactivo.respuesta_correcta, reactivo.frase_traduccion, (reactivo as any).audioTTS, isListening]);

  // Frase limpia a mostrar en la tarjeta de la pregunta:
  // En ejercicios de "Completa la oración", solo muestra la frase con el espacio en blanco (ej: "One ___ is here."),
  // retirando traducciones al español entre paréntesis para evitar redundancia y fatiga visual.
  const displayQuestionText = React.useMemo(() => {
    if (!reactivo.pregunta_texto) return '';
    let q = reactivo.pregunta_texto;
    // NUEVO (2026-09-25): En LISTENING, quitar el prefijo 'Audio: "..." ' del visual,
    // porque el audio ya se reproduce con el botón grande. Mostrar solo la pregunta real.
    const qType = (reactivo.tipo_pregunta || '').toLowerCase();
    if (qType === 'listen_and_select' || qType === 'audio_comprehension' || qType === 'dictation') {
      q = q.replace(/^\s*Audio:\s*[""'][^""']*[""']\s*[?.!]?\s*/i, '');
      q = q.replace(/^\s*Audio:\s*/i, '');
    }
    // NUEVO (2026-09-25): limpieza universal de prefijos comunes
    q = q.replace(/^\s*Question:\s*/i, '');
    q = q.replace(/^\s*Audio:\s*/i, '');
    q = q.replace(/^\s*Pregunta:\s*/i, '');
    q = q.replace(/\s+Oral answer:\s*$/i, '');
    q = q.replace(/^\s*Frase:\s*/i, '');
    return q.replace(/\s*\([^)]*\)\s*$/g, '').trim();
  }, [reactivo.pregunta_texto, reactivo.tipo_pregunta]);

  // Opciones mezcladas con Fisher-Yates por reactivo
  const [opcionesMezcladas, setOpcionesMezcladas] = useState<ShuffledOptionItem[]>(() =>
    getInitialShuffledOptions(reactivo)
  );

  // Mezclar opciones aleatoriamente cada vez que cambia el reactivo
  useEffect(() => {
    setOpcionesMezcladas(getInitialShuffledOptions(reactivo));
    setShowPista(false);
    setShowTraduccion(true);
    setMostrarTextoListening(false);
    setDictationText('');

    return () => {
      stopSpeech();
      stopAudio();
      setIsPlayingQuestion(false);
    };
    // FIX 2026-09-25: SOLO depende de reactivo_id.
    // Otras deps causaban que el textarea se resetee en re-renders del padre.
  }, [reactivo.reactivo_id]);

  // FIX 2026-09-25: Handler para dictation con validación tolerante.
  // Ignora mayúsculas, puntuación, espacios extra y normaliza contracciones.
  // NO tolera errores ortográficos reales (studnt ≠ student).
  const normalizeDictation = (s: string): string => {
    let out = s.toLowerCase().trim();
    // 0. Apóstrofes tipográficos → ASCII
    out = out.replace(/[‘’`´]/g, "'");
    // 1. Espacios alrededor de apóstrofes: "i 'm" → "i'm"
    out = out.replace(/s+'s*/g, "'");
    // 2. Expandir contracciones comunes
    out = out.replace(/(w+)'m/g, '$1 am');
    out = out.replace(/(w+)'re/g, '$1 are');
    out = out.replace(/(w+)'ve/g, '$1 have');
    out = out.replace(/(w+)'ll/g, '$1 will');
    out = out.replace(/(w+)'d/g, '$1 would');
    out = out.replace(/(w+)n't/g, '$1 not');
    // 3. Quitar puntuación
    out = out.replace(/[.,!?;:¿¡"«»()[]]/g, '');
    // 4. Colapsar espacios
    out = out.replace(/s+/g, ' ').trim();
    return out;
  };

  const handleSubmitDictation = () => {
    const raw = dictationText.trim();
    if (!raw) return;

    const normalizedInput = normalizeDictation(raw);
    const normalizedAnswer = normalizeDictation(reactivo.respuesta_correcta || '');

    if (normalizedInput === normalizedAnswer) {
      // LOG DE DIAGNOSTICO COMPLETO
      const dump = (s: string) => Array.from(s).map((ch: string) => ch.charCodeAt(0)).join(',');
      console.log('========== DICT DIAGNOSTICO ==========');
      console.log('[raw]               ', JSON.stringify(raw), 'len=' + raw.length);
      console.log('[respuesta_correcta]', JSON.stringify(reactivo.respuesta_correcta), 'len=' + (reactivo.respuesta_correcta || '').length);
      console.log('[norm input]        ', JSON.stringify(normalizedInput), 'len=' + normalizedInput.length);
      console.log('[norm answer]       ', JSON.stringify(normalizedAnswer), 'len=' + normalizedAnswer.length);
      console.log('[bytes input]       ', dump(raw));
      console.log('[bytes answer]      ', dump(reactivo.respuesta_correcta || ''));
      console.log('[MATCH?]            ', normalizedInput === normalizedAnswer);
      console.log('======================================');

      if (normalizedInput === normalizedAnswer) {
        onSelectOption(reactivo.respuesta_correcta);
      } else {
        onSelectOption(raw);
      }
    }
  };

  // Manejador centralizado para reproducir o detener audio TTS
  const handleToggleAudio = () => {
    if (isPlayingQuestion) {
      stopSpeech();
      stopAudio();
      setIsPlayingQuestion(false);
    } else {
      stopSpeech();
      stopAudio();
      if (!audioTextToPlay || !isValidEnglishForTTS(audioTextToPlay)) {
        console.warn('TTS: No hay texto en inglés para reproducir.');
        return;
      }
      setIsPlayingQuestion(true);
      playAudio(audioTextToPlay, { forceLang: 'en-US',
        voiceGender: (reactivo.voz === 'male' ? 'male' : 'female'),
        onStart: () => setIsPlayingQuestion(true),
        onEnd: () => setIsPlayingQuestion(false),
        onError: () => setIsPlayingQuestion(false),
      });
    }
  };

  // Manejador para el botón "Repetir audio" de Listening (detiene audio previo y reinicia de inmediato)
  const handleRepeatAudio = () => {
    stopSpeech();
    stopAudio();
    setIsPlayingQuestion(false);

    if (!audioTextToPlay || !isValidEnglishForTTS(audioTextToPlay)) {
      console.warn('TTS: No hay texto en inglés para reproducir.');
      return;
    }

    setTimeout(() => {
      setIsPlayingQuestion(true);
      playAudio(audioTextToPlay, { forceLang: 'en-US',
        voiceGender: (reactivo.voz === 'male' ? 'male' : 'female'),
        onStart: () => setIsPlayingQuestion(true),
        onEnd: () => setIsPlayingQuestion(false),
        onError: () => setIsPlayingQuestion(false),
      });
    }, 50);
  };

  // Reproducción automática del TTS en todos los ejercicios al cargar o cambiar de reactivo
  // (La idea principal de la app: el listening apoya a la comprensión gramatical)
  useEffect(() => {
    // Si el modal de tutorial está abierto, no reproducir para no sobreponer audios
    if (isTutorialOpen) {
      setIsPlayingQuestion(false);
      return;
    }

    // Regla estricta para Listening y Speaking: SIN AUTOPLAY al cargar la página
    if (isListening || isSpeaking || isWriting) {
      setIsPlayingQuestion(false);
      return;
    }

    if (!audioTextToPlay || !isValidEnglishForTTS(audioTextToPlay)) {
      return;
    }

    let isCancelled = false;

    // Retardo breve para permitir que el componente monte y renderice suavemente
    const timer = setTimeout(() => {
      if (isCancelled) return;
      setIsPlayingQuestion(true);
      playAudio(audioTextToPlay, { forceLang: 'en-US',
        voiceGender: (reactivo.voz === 'male' ? 'male' : 'female'),
        onStart: () => {
          if (!isCancelled) setIsPlayingQuestion(true);
        },
        onEnd: () => {
          if (!isCancelled) setIsPlayingQuestion(false);
        },
        onError: () => {
          if (!isCancelled) setIsPlayingQuestion(false);
        },
      });
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      stopSpeech();
      stopAudio();
      setIsPlayingQuestion(false);
    };
  }, [reactivo.reactivo_id, isTutorialOpen, audioTextToPlay]);

  // Mostrar automáticamente la pista de vocabulario al fallar el 1er intento (2ª oportunidad)
  useEffect(() => {
    if (effectiveValidationState === 'first_fail' && reactivo.pista_vocabulario) {
      setShowPista(true);
    }
  }, [validationState, reactivo.pista_vocabulario]);

  // Resetear pista al cambiar de reactivo
  useEffect(() => {
    setShowPista(false);
  }, [reactivo.reactivo_id]);

  // Andamiaje pedagógico (Scaffolding):
  // - A1_C01 (Fase Cero): 'completa' -> Traducción completa
  // - A1_C02 a A1_C05: 'parcial' -> Solo palabras clave
  // - A1_C06 en adelante: 'ninguna' -> Sin traducción (inmersión total)
  const modoTraduccion: 'completa' | 'parcial' | 'ninguna' = React.useMemo(() => {
    if (reactivo.mostrar_traduccion) {
      const val = reactivo.mostrar_traduccion.toLowerCase().trim();
      if (val === 'completa' || val === 'parcial' || val === 'ninguna') {
        return val as 'completa' | 'parcial' | 'ninguna';
      }
    }

    const match = reactivo.clase_id?.match(/C0?(\d+)/i);
    if (match) {
      const classNum = parseInt(match[1], 10);
      if (classNum === 1) return 'completa';
      if (classNum >= 2 && classNum <= 5) return 'parcial';
      return 'ninguna';
    }

    return 'completa';
  }, [reactivo.mostrar_traduccion, reactivo.clase_id]);

  const palabrasClaveText: string = React.useMemo(() => {
    if (reactivo.palabras_clave_traduccion) {
      return reactivo.palabras_clave_traduccion;
    }
    if (reactivo.pista_vocabulario) {
      return reactivo.pista_vocabulario;
    }
    if (reactivo.frase_traduccion) {
      const words = reactivo.frase_traduccion.split(' ').filter((w) => w.length > 3);
      return words.slice(0, 3).join(', ');
    }
    return '';
  }, [reactivo.palabras_clave_traduccion, reactivo.pista_vocabulario, reactivo.frase_traduccion]);

  const effectiveValidationState = isReviewModeActive ? 'correct' : validationState;
  const effectiveSelectedOption = isReviewModeActive ? reactivo.respuesta_correcta : selectedOption;
  const isResolved = isReviewModeActive || effectiveValidationState === 'correct' || effectiveValidationState === 'second_fail';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-7 shadow-sm text-left max-w-full">
      {/* Header: Skill Pill, Points & Timer */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold uppercase tracking-wider">
            {reactivo.habilidad.toUpperCase()} · #{reactivo.numero_reactivo || reactivo.numero || 1}
          </span>
          <span className="text-xs font-mono text-gray-500 font-medium bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-200">
            +{reactivo.puntos} pts
          </span>
        </div>

        {timeLeft !== undefined && (
          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
            timeLeft <= 5 
              ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
              : 'bg-gray-50 text-gray-700 border-gray-200'
          }`}>
            ⏱️ {timeLeft}s
          </span>
        )}
      </div>

      {/* 1. Contexto Pedagógico */}
      {isListening ? (
        /* CONTEXTO PEDAGÓGICO DE LISTENING */
        <div className="mb-4 p-3.5 sm:p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950">
          <p className="text-xs sm:text-sm font-semibold text-blue-900 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {reactivo.contexto_espanol || (
                (reactivo.tipo_pregunta === 'dictation')
                  ? 'Escucha y escribe exactamente lo que oyes:'
                  : 'Escucha el audio y selecciona lo que oyes:'
              )}
            </span>
          </p>
        </div>
      ) : (
        /* CONTEXTO PEDAGÓGICO STANDARD */
        reactivo.contexto_espanol && (
          <div className="mb-4 p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950">
            <div className="flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm leading-relaxed">
                <span className="font-bold text-blue-900 block sm:inline mr-1.5">Contexto:</span>
                <span className="text-blue-950 font-medium">{reactivo.contexto_espanol}</span>
              </div>
            </div>
          </div>
        )
      )}

      {/* Instrucción en Español (solo si no es listening) */}
      {!isListening && (
        <div className="text-xs sm:text-sm font-mono text-blue-700 mb-3 font-medium flex items-center gap-1.5">
          <span>👉</span>
          <span className="font-sans font-semibold">{reactivo.instruccion}</span>
        </div>
      )}

      {/* 2. ÁREA CENTRAL DE PREGUNTA / AUDIO / SPEAKING / WRITING */}
      {isSpeaking ? (
        /* MODO SPEAKING REAL: Reconocimiento de Voz nativo (Web Speech API) con micrófono y validación */
        <div className="mb-4">
          <SpeakingExercise
            reactivo={reactivo}
            validationState={validationState}
            onAnswer={({ respuesta, correcto }) => {
              if (correcto) {
                onSelectOption(reactivo.respuesta_correcta || respuesta);
              } else {
                // Registrar intento fallido para activar andamiaje / reintento
                onSelectOption(respuesta || '__INCORRECT_SPEECH__');
              }
            }}
          />
        </div>
      ) : isWriting ? (
        /* MODO WRITING INTERACTIVO REAL: Drag & Drop, Tap & Place, Scrambled Sentences */
        <div className="mb-4">
          <WritingExercise
            reactivo={reactivo}
            validationState={validationState}
            onAnswer={({ respuesta, correcto }) => {
              if (correcto) {
                onSelectOption(reactivo.respuesta_correcta || respuesta);
              } else {
                onSelectOption(respuesta || '__INCORRECT_WRITING__');
              }
            }}
          />
        </div>
      ) : isListening ? (
        <div className="space-y-4 mb-4">
          {/* BOTÓN DE AUDIO PRINCIPAL GRANDE Y VISIBLE */}
          <div className="bg-blue-50/70 border border-blue-200/80 p-5 sm:p-6 rounded-2xl text-center shadow-xs">
            {isPlayingQuestion ? (
              <div className="flex items-center justify-center space-x-3 text-blue-700 py-1">
                <div className="animate-pulse">
                  <Volume2 className="w-8 h-8 text-blue-600" />
                </div>
                <span className="text-base sm:text-lg font-bold">Escuchando audio...</span>
                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className="ml-3 text-xs bg-white text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-300 font-medium transition-colors cursor-pointer"
                >
                  Detener
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleToggleAudio}
                className="bg-blue-600 text-white px-7 py-3.5 rounded-xl font-bold text-base sm:text-lg hover:bg-blue-700 transition-all shadow-md inline-flex items-center gap-2.5 cursor-pointer active:scale-95"
              >
                <Volume2 className="w-6 h-6" />
                <span>🔊 Reproducir audio</span>
              </button>
            )}
          </div>

          {/* FIX 2026-09-25: DICTATION vs CLOZE */}
          {isDictation ? (
            <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-blue-300 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-xs uppercase tracking-wider font-semibold text-blue-600">
                  ✍️ Escribe exactamente lo que escuchas:
                </p>
                {textoBase && (
                  <button
                    type="button"
                    onClick={() => setMostrarTextoListening((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer hover:underline"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{mostrarTextoListening ? 'Ocultar texto base' : 'Ver texto base'}</span>
                  </button>
                )}
              </div>
              <textarea
                value={dictationText}
                onChange={(e) => setDictationText(e.target.value)}
                disabled={isResolved}
                placeholder="Escribe exactamente lo que escuchas en inglés..."
                className="w-full min-h-[80px] p-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:outline-none text-base font-mono resize-y disabled:bg-gray-50 disabled:text-gray-500"
              />
              {!isResolved && (
                <button
                  type="button"
                  disabled={!dictationText.trim()}
                  onClick={() => {
                    console.log('[BTN-CLICK] dictationText=', JSON.stringify(dictationText));
                    console.log('[BTN-CLICK] isResolved=', isResolved, 'validationState=', effectiveValidationState);
                    console.log('[BTN-CLICK] disabled=', !dictationText.trim());
                    handleSubmitDictation();
                  }}
                  className="mt-3 w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  ✓ Comprobar respuesta
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-slate-200 text-center shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Completa lo que escuchas:</p>
                {textoBase && (
                  <button
                    type="button"
                    onClick={() => setMostrarTextoListening((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer hover:underline"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{mostrarTextoListening ? 'Ocultar texto base' : 'Ver texto base'}</span>
                  </button>
                )}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 font-sans tracking-wide">
                {displayQuestionText || reactivo.pregunta_texto}
              </div>
            </div>
          )}

          {/* DESPLEGABLE DE TEXTO BASE (A1_C01_TXT01 / My Classroom) */}
          {mostrarTextoListening && textoBase && (
            <div className="p-4 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-950 text-left animate-fadeIn shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-blue-200">
                <div className="flex items-center gap-2 font-bold text-sm text-blue-900">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>{textoBase.titulo_texto || textoBase.titulo || 'Texto Base'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarTextoListening(false)}
                  className="text-xs text-blue-700 hover:text-blue-900 font-medium cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-800 whitespace-pre-line font-sans">
                {textoBase.contenido_texto || textoBase.contenido}
              </p>
            </div>
          )}

          {/* CONTROLES: REPETIR AUDIO Y PISTA FONÉTICA (Oculta al inicio) */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleRepeatAudio}
              className="text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm flex items-center space-x-2 cursor-pointer py-1.5 px-3 rounded-lg hover:bg-blue-50 border border-blue-200/80 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Repetir audio</span>
            </button>

            {/* PISTA FONÉTICA: Oculta al inicio. Disponible como ayuda extra antes de responder */}
            {!isResolved && reactivo.pista_vocabulario && !showPista && (
              <button
                type="button"
                onClick={() => setShowPista(true)}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>Ver pista fonética</span>
              </button>
            )}
          </div>

          {/* PISTA FONÉTICA MOSTRADA SI EL USUARIO SOLICITA AYUDA EXTRA */}
          {!isResolved && reactivo.pista_vocabulario && showPista && (
            <div className="p-3 sm:p-3.5 rounded-xl bg-amber-50/90 border border-amber-300/80 text-amber-950 flex items-start justify-between gap-2.5 animate-fadeIn shadow-xs">
              <div className="flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <span className="font-bold text-amber-900 block sm:inline mr-1.5">Pista fonética:</span>
                  <span className="text-amber-950 font-mono font-medium">{reactivo.pista_vocabulario}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPista(false)}
                className="text-xs text-amber-700 hover:text-amber-900 cursor-pointer"
              >
                Ocultar
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Pregunta en Inglés + Botón de Audio TTS de Alta Visibilidad (Modo Standard) */
        <div className="bg-gray-50/60 rounded-xl p-3.5 sm:p-4 border border-gray-200/90 mb-4">
          <div className="text-base sm:text-xl font-bold text-gray-900 leading-relaxed flex items-start justify-between gap-3">
            <span className="break-words font-sans">{displayQuestionText}</span>
            <button
              type="button"
              disabled={!audioTextToPlay || !isValidEnglishForTTS(audioTextToPlay)}
              onClick={handleToggleAudio}
              title={
                audioTextToPlay && isValidEnglishForTTS(audioTextToPlay)
                  ? "Escuchar en inglés natural"
                  : "Audio no disponible para texto en español"
              }
              aria-label="Escuchar pronunciación de la pregunta"
              className={`rounded-full p-2 transition-all shadow-sm hover:shadow-md shrink-0 ml-1.5 ${
                !audioTextToPlay || !isValidEnglishForTTS(audioTextToPlay)
                  ? 'opacity-30 cursor-not-allowed bg-gray-200 text-gray-400'
                  : isPlayingQuestion
                  ? 'bg-blue-600 text-white shadow-md animate-pulse ring-2 ring-blue-400 cursor-pointer'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-600 cursor-pointer'
              }`}
            >
              <Volume2 className={`w-5 h-5 ${isPlayingQuestion ? 'animate-bounce' : ''}`} />
            </button>
          </div>

          {/* Andamiaje Pedagógico (Scaffolding): Control de Traducción */}
          {modoTraduccion === 'completa' && reactivo.frase_traduccion && (
            <div className="mt-2.5 pt-2 border-t border-gray-200/70 flex items-center justify-between text-xs sm:text-sm">
              <div className="text-gray-600 font-sans italic flex items-center gap-1.5 min-w-0">
                <span className="font-semibold not-italic text-gray-500 text-[11px] uppercase tracking-wide shrink-0">
                  Traducción:
                </span>
                <span className="truncate sm:whitespace-normal">
                  {showTraduccion ? `"${reactivo.frase_traduccion}"` : '••••••••'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTraduccion(!showTraduccion)}
                className="text-[11px] font-mono text-blue-600 hover:underline cursor-pointer ml-2 shrink-0"
              >
                {showTraduccion ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          )}

          {modoTraduccion === 'parcial' && (reactivo.palabras_clave_traduccion || palabrasClaveText) && (
            <div className="mt-2.5 pt-2 border-t border-amber-200/70 flex items-center justify-between text-xs sm:text-sm">
              <div className="text-amber-800 font-sans italic flex items-center gap-1.5 min-w-0">
                <span className="font-semibold not-italic text-amber-700 text-[11px] uppercase tracking-wide shrink-0">
                  Palabras clave:
                </span>
                <span className="truncate sm:whitespace-normal">
                  {showTraduccion ? (reactivo.palabras_clave_traduccion || palabrasClaveText) : '••••••••'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTraduccion(!showTraduccion)}
                className="text-[11px] font-mono text-amber-700 hover:underline cursor-pointer ml-2 shrink-0"
              >
                {showTraduccion ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          )}

          {modoTraduccion === 'ninguna' && (
            <div className="mt-2.5 pt-2 border-t border-gray-200/50 flex items-center justify-between text-[11px] font-mono text-gray-500">
              <span className="italic flex items-center gap-1">
                <span>🎯</span>
                <span>Inmersión Directa en Inglés (Sin traducción)</span>
              </span>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 font-medium">
                Avanzado
              </span>
            </div>
          )}
        </div>
      )}

      {/* 3. Opciones Mezcladas Aleatoriamente (Fisher-Yates) - NO MOSTRAR EN SPEAKING NI WRITING */}
      {!isSpeaking && !isWriting && (
        <div className="space-y-2.5 sm:space-y-3 mb-4">
          {(opcionesMezcladas.length > 0 ? opcionesMezcladas : getInitialShuffledOptions(reactivo)).map((item, idx) => {
            const option = item.texto;
            const isSelected = effectiveSelectedOption === option;
            const isCorrect =
              option === reactivo.respuesta_correcta ||
              option.trim().toLowerCase() === (reactivo.respuesta_correcta || '').trim().toLowerCase() ||
              (isListening && (
                (reactivo.respuesta_correcta || '').trim().toLowerCase().startsWith(option.trim().toLowerCase() + ' ') ||
                option.trim().toLowerCase().startsWith((reactivo.respuesta_correcta || '').trim().toLowerCase() + ' ')
              ));
            // En listening NUNCA mostrar traducción de opciones antes de responder
            const translation = isListening
              ? (isResolved ? item.traduccion : null)
              : (modoTraduccion !== 'ninguna' ? item.traduccion : null);

            let optionStyle = 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300';

            if (effectiveValidationState === 'correct') {
              if (isCorrect) {
                optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
              } else if (isSelected) {
                optionStyle = 'bg-gray-100 border-gray-200 text-gray-400 line-through';
              }
            } else if (effectiveValidationState === 'first_fail') {
              if (isSelected) {
                optionStyle = 'bg-amber-50/80 border-amber-400 text-amber-900 line-through opacity-75 cursor-not-allowed';
              } else {
                optionStyle = 'bg-white border-blue-200 text-gray-800 hover:bg-blue-50 hover:border-blue-400 cursor-pointer shadow-xs';
              }
            } else if (effectiveValidationState === 'second_fail') {
              if (isCorrect) {
                optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-300';
              } else if (isSelected) {
                optionStyle = 'bg-rose-50 border-rose-400 text-rose-950 line-through';
              }
            }

            const isFailedFirst = effectiveValidationState === 'first_fail' && isSelected;

            return (
              <button
                key={`${option}_${idx}`}
                type="button"
                disabled={isResolved || isFailedFirst || isReviewModeActive}
                onClick={() => { if (isReviewModeActive) return; onSelectOption(option); }}
                className={`w-full p-3 sm:p-4 rounded-xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer text-xs sm:text-base gap-3 break-words shadow-xs ${optionStyle}`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 font-mono text-xs flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="break-words leading-snug font-semibold text-gray-900">{option}</span>
                    {translation && (
                      <span className="text-[11px] sm:text-xs text-gray-500 font-normal leading-tight mt-0.5 break-words">
                        {translation}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {effectiveValidationState === 'correct' && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                  {effectiveValidationState === 'first_fail' && isSelected && (
                    <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      1º Intento
                    </span>
                  )}
                  {effectiveValidationState === 'second_fail' && isCorrect && (
                    <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Correcta
                    </span>
                  )}
                  {effectiveValidationState === 'second_fail' && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}



      {/* 4. Pista de Vocabulario (solo si no es listening y existe pista) */}
      {!isListening && reactivo.pista_vocabulario && (
        <div className="mb-4">
          {!showPista && validationState !== 'first_fail' ? (
            <button
              type="button"
              onClick={() => setShowPista(true)}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span>Ver pista de vocabulario</span>
            </button>
          ) : (
            <div className="p-3 sm:p-3.5 rounded-xl bg-amber-50/90 border border-amber-300/80 text-amber-950 flex items-start gap-2.5 animate-fadeIn">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-amber-900 block sm:inline mr-1.5">Pista Pedagógica:</span>
                <span className="text-amber-950 font-medium">{reactivo.pista_vocabulario}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Immediate Feedback & Explicación Detallada */}
      {validationState !== 'unanswered' && !isSpeaking && (
        <div className={`p-4 rounded-xl border mb-5 animate-fadeIn shadow-xs ${
          effectiveValidationState === 'correct'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : effectiveValidationState === 'first_fail'
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-rose-50 border-rose-300 text-rose-950'
        }`}>
          <div className="flex items-start gap-3">
            {effectiveValidationState === 'correct' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : effectiveValidationState === 'first_fail' ? (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="font-bold text-sm sm:text-base">
                  {effectiveValidationState === 'correct' && '✅ ¡Respuesta Correcta! (+15 XP)'}
                  {effectiveValidationState === 'first_fail' && '⚠️ ¡Respuesta incorrecta! Tienes una 2ª oportunidad'}
                  {effectiveValidationState === 'second_fail' && '❌ Te has equivocado 2 veces (ya no hay más oportunidades)'}
                </span>

                {/* Indicador de avance automático */}
                {effectiveValidationState === 'correct' && (
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    Pasando al siguiente reactivo...
                  </span>
                )}
                {effectiveValidationState === 'second_fail' && (
                  <span className="text-xs font-mono font-bold text-rose-700 bg-rose-100/90 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                    Cambiando de reactivo...
                  </span>
                )}
              </div>

              {effectiveValidationState === 'first_fail' && (
                <div className="mt-2 text-xs sm:text-sm text-amber-900 leading-relaxed font-medium bg-white/70 p-2.5 rounded-lg border border-amber-200">
                  <p>
                    {isDictation
                      ? '👂 Vuelve a escuchar el audio y escribe la respuesta correcta para tu 2ª oportunidad.'
                      : isListening
                      ? '👂 Escucha nuevamente el audio y selecciona otra opción para tu 2ª oportunidad.'
                      : '💡 Has tenido un primer fallo. Elige otra de las opciones disponibles para completar tu segunda oportunidad.'}
                  </p>
                </div>
              )}

              {isResolved && (
                <div className="text-xs sm:text-sm mt-3 leading-relaxed font-sans text-gray-800 bg-white/90 p-3.5 rounded-lg border border-gray-200/80 space-y-2">
                  {isListening && (
                    <p className="font-bold text-gray-900">
                      <span className="text-blue-700">Audio:</span> "{audioTextToPlay}"
                    </p>
                  )}
                  {reactivo.frase_traduccion && (
                    <p className="text-gray-600 italic">
                      <span className="font-semibold not-italic text-gray-500">Traducción:</span> "{reactivo.frase_traduccion}"
                    </p>
                  )}
                  <p className="text-gray-800 pt-1 border-t border-gray-200/60">
                    💡 <strong>Respuesta correcta:</strong> <span className="font-bold text-emerald-700">{reactivo.respuesta_correcta}</span> — {reactivo.respuesta_explicacion}
                  </p>
                  {isListening && reactivo.pista_vocabulario && (
                    <p className="text-gray-700 text-xs bg-amber-50/80 p-2 rounded border border-amber-200">
                      🗣️ <strong>Pista fonética:</strong> <span className="font-mono text-amber-900 font-semibold">{reactivo.pista_vocabulario}</span>
                    </p>
                  )}
                  {reactivo.fuente_evidencia && (
                    <p className="text-gray-700 text-xs bg-gray-50/80 p-2 rounded border border-gray-200">
                      📖 <strong>Fuente / Evidencia:</strong> {reactivo.fuente_evidencia}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botón Siguiente / Ver Resumen */}
      {isResolved && onNext && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onNext}
            className="w-full sm:w-auto justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <span>{!isLastQuestion ? 'Siguiente Reactivo' : 'Ver Resumen'}</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReactivoCard;

