/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ClassDetailScreen.tsx
 * Implementa las Pantallas 3, 4 y 5 del Cuaderno de Ejercicios Nivel A1:
 * - Pantalla 3: DETALLE DE CLASE (Video YouTube embebido, Texto explicativo, Vocabulario, 5 Habilidades)
 * - Pantalla 4: EJERCICIOS INTERACTIVOS (1/5 -> 5/5, Timer, Validación de 3 estados, Feedback)
 * - Pantalla 5: RESUMEN DE CLASE (Puntaje, XP, Habilidades completadas, Navegación siguiente)
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Volume2, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronRight, 
  RotateCcw, 
  Award, 
  BookOpen, 
  Headphones, 
  FileText, 
  PenTool, 
  Mic, 
  ExternalLink,
  Zap,
  Bookmark,
  HelpCircle
} from 'lucide-react';
import type {
  SheetClaseRow,
  SheetReactivoRow,
  SheetProgresoUsuarioRow,
  SheetVocabularioRow,
  SheetTextoBaseRow
} from '@/types/workbook/workbookRows';
import {
  clases
} from '@/data/legacy/workbookData';
import { soundManager, speakText, stopSpeech, cleanTextForTTS } from '@/utils/workbook/audioFeedback';
import { playAudio, stopAudio } from '@/services/workbook/ttsService';
import { ReactivoCard } from './ReactivoCard';
import { ReadingTextBase } from './ReadingTextBase';
import { TeacherVirtualCard } from './TeacherVirtualCard';
import { ClassTheoryAccordion } from './ClassTheoryAccordion';
import { AccordionSection } from './AccordionSection';
import { VocabularySection } from './VocabularySection';
import { GrammarTutorialModal, GRAMMAR_TUTORIAL_STORAGE_KEY } from './GrammarTutorialModal';
import { ReadingGrammarTutorialModal, READING_GRAMMAR_TUTORIAL_STORAGE_KEY } from './ReadingGrammarTutorialModal';
import { ListeningTutorialModal, LISTENING_TUTORIAL_STORAGE_KEY } from './ListeningTutorialModal';
import { SpeakingTutorialModal, SPEAKING_TUTORIAL_STORAGE_KEY } from './SpeakingTutorialModal';
import { WritingTutorialModal, WRITING_TUTORIAL_STORAGE_KEY } from './WritingTutorialModal';
import { normalizeText, normalizeContractions } from './SpeakingExercise';
import { apiV1Engine } from '@/services/workbook/apiV1Service';
import { apiUrl } from '@/services/apiConfig';
import { apiService } from '@/services/workbook/apiService';
import { mapPrismaExerciseToSheetRow } from '@/services/workbook/prismaMapper';
import { saveProgressToGoogleSheet } from '@/services/workbook/nativeSheetService';
import { useAppContext } from '../../context/AppContext';
import {
  initClaseResumenProgreso,
  recordReactivoResumenProgreso,
  recordSkillCompletedResumenProgreso,
} from '@/services/workbook/resumenProgresoService';

// Cargar reactivos desde el datasheet/API dinámicamente
export const loadReactivos = async (
  claseId: string,
  habilidad?: string
): Promise<SheetReactivoRow[]> => {
  // FIX 2026-09-27: eliminados los fallbacks a mock/localStorage.
  // Solo se sirven ejercicios reales desde Prisma vía /api/lessons/:id.
  // Si la leccion no tiene ejercicios en DB, se devuelve [] y la UI
  // muestra un empty state honesto (sin contenido simulado).
  try {
    const res = await fetch(apiUrl(`/api/lessons/${encodeURIComponent(claseId)}`));
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data && Array.isArray(json.data.exercises)) {
        const mapped: SheetReactivoRow[] = json.data.exercises.map(
          (ex: unknown) => mapPrismaExerciseToSheetRow(ex as never)
        );
        const filtered =
          habilidad && habilidad !== 'all'
            ? mapped.filter((r) => r.habilidad === habilidad.toLowerCase())
            : mapped;
        console.log(`[loadReactivos] ${claseId}: ${filtered.length} reactivos desde Prisma`);
        return filtered;
      }
    }
  } catch (e) {
    console.warn('[loadReactivos] /api/lessons fallo:', e);
  }

  console.warn(`[loadReactivos] ${claseId}: sin ejercicios reales. Devolviendo [].`);
  return [];
};


interface ClassDetailScreenProps {
  claseId: string;
  onBackToIndex: () => void;
  onSelectNextClass?: (nextClaseId: string) => void;
  onSaveProgress?: (newProgressRows: SheetProgresoUsuarioRow[]) => void;
  existingProgress?: SheetProgresoUsuarioRow[];
}

type SubScreen = 'detail' | 'exercise' | 'summary';
type SkillKey = 'grammar' | 'reading' | 'listening' | 'writing' | 'speaking';

export const ClassDetailScreen: React.FC<ClassDetailScreenProps> = ({
  claseId,
  onBackToIndex,
  onSelectNextClass,
  onSaveProgress,
  existingProgress = [],
}) => {
  // FIX 2026-09-27: título de la clase desde API (Prisma) en lugar del legacy
  const [apiClase, setApiClase] = useState<SheetClaseRow | null>(null);
  const [apiVocab, setApiVocab] = useState<SheetVocabularioRow[]>([]);
    // FIX: resetear scroll al cambiar de clase o subpantalla (móvil aterriza en header)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [claseId]);
useEffect(() => {
    let cancelled = false;
    fetch(apiUrl('/api/lessons/' + encodeURIComponent(claseId)))
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (res && res.success && res.data) {
          const d = res.data;
          setApiClase({
            clase_id: d.clase_id,
            clase_numero: d.clase_numero ?? 0,
            semana: d.semana ?? 0,
            sesion: d.sesion ?? 'A',
            titulo_clase: d.titulo_clase,
            titulo_video: d.titulo_video ?? d.tituloVideo ?? '',
            video_url: d.video_url ?? d.videoUrl ?? '',
            tema_principal: d.temaPrincipal ?? '',
            tipo_contenido: d.tipoContenido ?? 'original',
            duracion_min: d.duracionMin ?? 120,
            estado: d.isPublished ? 'activo' : 'inactivo',
          });
            setApiVocab(((d.vocabulary ?? []) as SheetVocabularioRow[]));
        }
      })
      .catch((e) => console.warn('[ClassDetailScreen] No se pudo cargar título desde API:', e));
    return () => { cancelled = true; };
  }, [claseId]);

  // FIX 2026-09-30: Publicar la clase activa en el contexto global (para el AI Tutor)
  useEffect(() => {
    if (claseId && apiClase) {
      const claseData = {
        clase_id: apiClase.clase_id,
        titulo: apiClase.titulo_clase,
      };
      setCurrentClase(claseData);
      try {
        localStorage.setItem('teclingo_current_clase', JSON.stringify(claseData));
      } catch {}
    }
  }, [claseId, apiClase, setCurrentClase]);

  // Current Class Object
  const currentClase: SheetClaseRow = useMemo(() => {
    // FIX 2026-09-27: si el API respondió, usar esa data
    if (apiClase) return apiClase;

    // FIX 2026-09-27: placeholder correcto — NUNCA usar clases[0] como fallback
    // porque clases[] es legacy (solo tiene C01-C35, sin C00).
    // FIX 2026-09-27: extraer número de A1_CXX para clase_numero
    const numMatch = claseId.match(/^A1_C(\d+)$/);
    const claseNum = numMatch ? parseInt(numMatch[1], 10) : 0;
    return {
      clase_id: claseId,
      clase_numero: claseNum,
      semana: 0,
      sesion: 'A' as const,
      titulo_clase: 'Cargando clase...',
      titulo_video: '',
      video_url: '',
      tema_principal: '',
      tipo_contenido: 'original' as const,
      duracion_min: 120,
      estado: 'activo' as const,
    };
  }, [claseId, apiClase]);

  // Current SubScreen state
  const [subScreen, setSubScreen] = useState<SubScreen>('detail');
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [confirmViewSkill, setConfirmViewSkill] = useState<SkillKey | null>(null);
  const [userProgressBySkill, setUserProgressBySkill] = useState<Record<string, number>>({});
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const { userEmail, setCurrentClase } = useAppContext();
  const [selectedSkill, setSelectedSkill] = useState<SkillKey>('grammar');

  // Texto base para la habilidad Reading (cargado desde la hoja TEXTOS_BASE)
  // FIX 2026-09-27: sin cache local ni legacy. Solo fetch real desde /api/v1/textos-base.
  const [textoBase, setTextoBase] = useState<SheetTextoBaseRow | null>(null);

  // Cargar texto base dinámicamente desde API / Sheet cuando cambie la clase o se seleccione Reading
  useEffect(() => {
    let isMounted = true;

    const fetchTextoBase = async () => {
      // FIX 2026-09-27: sin preload legacy. Solo fetch real.
      // Consulta al endpoint /api/v1/textos-base con TIMESTAMP para evitar caché
      try {
        const res = await fetch(apiUrl(`/api/v1/textos-base?clase_id=${encodeURIComponent(claseId)}&t=${Date.now()}`), {
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        if (res.ok) {
          const json = await res.json();
          // FIX 2026-09-27: el endpoint devuelve { success, data } — mapear al shape SheetTextoBaseRow
          const payload = json && (json.data || json.texto);
          if (payload && payload.clase_id && isMounted) {
            const mapped = {
              texto_id: 'TXT_' + payload.clase_id,
              clase_id: payload.clase_id,
              titulo_texto: payload.titulo_texto || payload.titulo || '',
              titulo: payload.titulo || payload.titulo_texto || '',
              contenido_texto: payload.contenido_texto || payload.contenido || '',
              contenido: payload.contenido || payload.contenido_texto || '',
              translation: payload.translation || payload.traduccion || '',
              palabras_count: payload.word_count || 0,
              dificultad: payload.difficulty || 1,
              tiempo_audio_seg: payload.estimated_sec || 20,
              audio_tts_url: '',
              activo: true,
            };
            setTextoBase(mapped as any);
            try {
              localStorage.setItem(`texto_${claseId}`, JSON.stringify(mapped));
            } catch {}
            return;
          }
        }
      } catch (e) {
        console.warn('HTTP fetch /api/v1/textos-base fallback:', e);
      }

      // 3. FIX 2026-09-27: apiV1Engine.getTextoBase lee de workbookData legacy — REMOVIDO.
      //    Si el fetch al endpoint /api/v1/textos-base falla, se mantiene el estado previo.
    };

    fetchTextoBase();

    return () => {
      isMounted = false;
    };
  }, [claseId, selectedSkill]);

  // REGLA 1: Al iniciar una clase por primera vez, asegurar fila en RESUMEN_PROGRESO
  useEffect(() => {
    try {
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const activeUserId = user?.user_id || 'demo_user_001';
      initClaseResumenProgreso(activeUserId, claseId);
    } catch (e) {
      console.warn('Error inicializando RESUMEN_PROGRESO para clase:', e);
    }
  }, [claseId]);

  // Text explanation
  const explicacion = useMemo(() => {
    return (
      {
        explicacion_id: `${claseId}_EXP`,
        clase_id: claseId,
        titulo_explicacion: currentClase.tema_principal,
        contenido_html: `<p>Contenido pedagógico oficial para <b>${currentClase.titulo_clase}</b>. Revisa los conceptos nucleares, practica el vocabulario y resuelve los reactivos correspondientes.</p>`,
        contenido_markdown: currentClase.tema_principal,
        ejemplos_tabla_json: '[]',
        reglas_clave: `Domina el tema: ${currentClase.tema_principal}`,
        duracion_lectura_min: 3,
        version: 1,
        activo: true,
      }
    );
  }, [claseId, currentClase]);

  // Vocabulary for this class
  // FIX 2026-09-27: vocabulario real desde /api/lessons/:id (Prisma).
  const classVocab = useMemo<SheetVocabularioRow[]>(() => {
    return apiVocab;
  }, [apiVocab]);

  // Specific groupings for A1_C01
  const pronombres = useMemo(() => {
    return classVocab.filter(
      (v) =>
        v.categoria === 'pronombre' ||
        ['I', 'you', 'he', 'she', 'it', 'we', 'they'].includes(v.palabra_ingles)
    );
  }, [classVocab]);

  const sustantivos = useMemo(() => {
    return classVocab.filter(
      (v) =>
        v.categoria === 'sustantivo' ||
        ['student', 'students', 'book', 'books', 'teacher', 'friend', 'classroom'].includes(v.palabra_ingles)
    );
  }, [classVocab]);

  // Formatted vocabulary for VocabularySection component
  const formattedVocabList = useMemo(() => {
    // FIX 2026-09-28: bloque hardcoded de A1_C01 eliminado. Todo viene de classVocab (DB).
    return classVocab.map((v) => ({
      word: v.palabra_ingles,
      ipa: v.pronunciacion_af,
      translation: v.palabra_espanol,
      example: v.ejemplo_uso,
      category: v.categoria,
    }));
  }, [claseId, classVocab]);

    // Reactivos pool for this class (Prisma vía /api/lessons/:id con fallback)
  const [allClassReactivos, setAllClassReactivos] = useState<SheetReactivoRow[]>([]);
  const [isLoadingReactivos, setIsLoadingReactivos] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoadingReactivos(true);
      try {
        const reactivos = await loadReactivos(claseId);
        if (isMounted) {
          console.log(`[allClassReactivos] ${claseId}: ${reactivos.length} total cargados`);
          const bySkill: Record<string, number> = {};
          reactivos.forEach((r) => {
            bySkill[r.habilidad] = (bySkill[r.habilidad] || 0) + 1;
          });
          console.log(`[allClassReactivos] Distribución:`, bySkill);
          setAllClassReactivos(reactivos);
        }
      } catch (e) {
        console.warn('Error cargando reactivos:', e);
        if (isMounted) setAllClassReactivos([]);
      } finally {
        if (isMounted) setIsLoadingReactivos(false);
      }
    })();
    return () => { isMounted = false; };
  }, [claseId]);

  // Reactivos for the active selected skill
  const skillReactivos = useMemo(() => {
    return allClassReactivos.filter((r) => r.habilidad === selectedSkill);
  }, [allClassReactivos, selectedSkill]);

  // ============ EXERCISE RUNNER STATE (Screen 4) ============
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [validationState, setValidationState] = useState<'unanswered' | 'first_fail' | 'correct' | 'second_fail'>('unanswered');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(true);
  const [showGrammarTutorial, setShowGrammarTutorial] = useState<boolean>(false);
  const [showReadingGrammarTutorial, setShowReadingGrammarTutorial] = useState<boolean>(false);
  const [showListeningTutorial, setShowListeningTutorial] = useState<boolean>(false);
  const [showSpeakingTutorial, setShowSpeakingTutorial] = useState<boolean>(false);
  const [showWritingTutorial, setShowWritingTutorial] = useState<boolean>(false);
  
  // Flujo en dos fases: Fase 1 (Lectura) -> Fase 2 (Pregunta)
  const [isReadingPhase, setIsReadingPhase] = useState<boolean>(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Session results tracker for this skill practice run
  const [runResults, setRunResults] = useState<{
    total: number;
    correct: number;
    points: number;
    xp: number;
    answeredRows: SheetProgresoUsuarioRow[];
  }>({
    total: 0,
    correct: 0,
    points: 0,
    xp: 0,
    answeredRows: [],
  });

  const currentReactivo = skillReactivos[currentQuestionIdx] || skillReactivos[0];

  // Identifica si el reactivo actual corresponde a "Lectura + Completar oración"
  const isReadingCompletionExercise = useMemo(() => {
    if (!currentReactivo) return false;
    const hasReadingRef = Boolean(
      textoBase &&
      (
        selectedSkill === 'reading' ||
        currentReactivo.habilidad === 'reading' ||
        currentReactivo.contexto_espanol?.toLowerCase().includes('texto') ||
        currentReactivo.contexto_espanol?.toLowerCase().includes('classroom') ||
        currentReactivo.pista_vocabulario?.toLowerCase().includes('texto') ||
        currentReactivo.pregunta_texto?.toLowerCase().includes('classroom')
      )
    );
    const hasCompletion = Boolean(
      currentReactivo.instruccion?.toLowerCase().includes('completa') ||
      currentReactivo.pregunta_texto?.includes('___') ||
      currentReactivo.tipo_pregunta === 'multiple_choice'
    );
    return hasReadingRef && hasCompletion;
  }, [currentReactivo, textoBase, selectedSkill]);

  // FIX 2026-09-30: Simplificado. Solo depende de que exista textoBase.
  // El boton "Ver lectura" estara disponible siempre que haya un texto.
  const hasReadingPhase = useMemo(() => Boolean(textoBase), [textoBase]);

  // Speech synthesis helper using the unified female natural voice engine with cleanTextForTTS
  const speakReactivoText = (text: string) => {
    const isSpanish = /[áéíóúñ¿¡]/.test(text) || 
      text.toLowerCase().includes('cuál') || 
      text.toLowerCase().includes('selecciona') ||
      text.toLowerCase().includes('escribe') ||
      text.toLowerCase().includes('identifica') ||
      text.toLowerCase().includes('completa');

    speakText(text, {
      lang: isSpanish ? 'es-MX' : 'en-US',
      rate: 0.9,
      pitch: 1.0,
    });
  };

  // State for active vocabulary card playback
  const [playingVocabId, setPlayingVocabId] = useState<string | null>(null);

  // Load and cache voices for Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  // Stop any active TTS audio whenever subScreen or claseId changes, or on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
      stopAudio();
    };
  }, [subScreen, claseId]);

  // Speak vocabulary word in English with en-US natural female voice & blue visual feedback
  const speakEnglishWord = (word: string, vocabId: string) => {
    // Clean word: only pronounce the English word, not translation or symbols
    const cleanWord = word.replace(/\/[^/]+\//g, '').trim();
    setPlayingVocabId(vocabId);

    playAudio(cleanWord, { forceLang: 'en-US',
      onEnd: () => {
        setPlayingVocabId((prev) => (prev === vocabId ? null : prev));
      },
      onError: () => {
        setPlayingVocabId((prev) => (prev === vocabId ? null : prev));
      },
    });
  };

  // Helper to render individual vocabulary card (reproducción activada solo por clic de usuario)
  const renderVocabCard = (item: SheetVocabularioRow) => {
    const isPlaying = playingVocabId === item.vocab_id;
    return (
      <div
        key={item.vocab_id}
        id={`vocab-card-${item.vocab_id}`}
        onClick={() => speakEnglishWord(item.palabra_ingles, item.vocab_id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            speakEnglishWord(item.palabra_ingles, item.vocab_id);
          }
        }}
        title={`Clic para escuchar "${item.palabra_ingles}"`}
        className={`group relative rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer text-left select-none ${
          isPlaying
            ? 'bg-blue-950/40 border-2 border-blue-500 ring-2 ring-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.35)] scale-[1.02]'
            : 'bg-[#121416]/90 border border-white/10 hover:border-blue-400/50 hover:bg-white/[0.06] hover:shadow-lg'
        }`}
      >
        <div>
          {/* Top row: English word + Audio speaker button */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-white font-display tracking-tight leading-tight">
                {item.palabra_ingles}
              </div>
              <div className="text-xs font-mono text-[#39FF14] font-semibold mt-0.5">
                {item.pronunciacion_af}
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                speakEnglishWord(item.palabra_ingles, item.vocab_id);
              }}
              title={`Escuchar pronunciación de ${item.palabra_ingles}`}
              aria-label={`Escuchar pronunciación de ${item.palabra_ingles}`}
              className={`rounded-full p-2 transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0 ml-1.5 ${
                isPlaying
                  ? 'bg-blue-600 text-white shadow-md animate-pulse ring-2 ring-blue-400'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
              }`}
            >
              <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-bounce' : ''}`} />
            </button>
          </div>

          {/* Spanish translation in gray */}
          <div className="text-xs sm:text-sm text-[#8A95A5] font-medium mt-1">
            {item.palabra_espanol}
          </div>
        </div>

        {/* Example in English between quotes */}
        {item.ejemplo_uso && (
          <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] sm:text-xs text-gray-300 italic font-serif leading-snug">
            "{item.ejemplo_uso}"
          </div>
        )}
      </div>
    );
  };

  // Extract and resolve YouTube video info
  const resolvedVideoInfo = useMemo(() => {
    let url = currentClase.video_url || '';
    let title = currentClase.titulo_video || 'Video Lección';

    // FIX 2026-09-27: eliminado el hardcode que forzaba FASE CERO en A1_C01.
    // Los videos vienen de la DB (videoUrl). Solo se usa fallback si NO hay url.
    if (url.includes('qC_8Yp_d-Ww') || !url) {
      url = 'https://youtube.com/shorts/JBB6JZT4VIc?si=Pz1xbJ-YOJpAWmpQ';
      title = 'FASE CERO TECLINGO: El Secreto de los Singulares y Plurales';
    }

    let videoId = 'JBB6JZT4VIc';
    if (url.includes('/shorts/')) {
      const parts = url.split('/shorts/')[1]?.split('?')[0]?.split('&')[0];
      if (parts) videoId = parts;
    } else if (url.includes('v=')) {
      const parts = url.split('v=')[1]?.split('&')[0]?.split('?')[0];
      if (parts) videoId = parts;
    } else if (url.includes('youtu.be/')) {
      const parts = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
      if (parts) videoId = parts;
    } else if (url.includes('/embed/')) {
      const parts = url.split('/embed/')[1]?.split('?')[0]?.split('&')[0];
      if (parts) videoId = parts;
    }

    // Safety fallback: if videoId is dummy qC_8Yp_d-Ww, fallback to verified JBB6JZT4VIc
    if (videoId === 'qC_8Yp_d-Ww' || !videoId) {
      videoId = 'JBB6JZT4VIc';
      url = 'https://youtube.com/shorts/JBB6JZT4VIc?si=Pz1xbJ-YOJpAWmpQ';
    }

    return {
      url,
      title,
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?controls=1&rel=0&modestbranding=1&playsinline=1`,
    };
  }, [currentClase.clase_id, currentClase.video_url, currentClase.titulo_video]);

  // Start skill exercise
  const startSkillExercise = (skill: SkillKey, review: boolean = false) => {
    setSelectedSkill(skill);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setAttemptCount(0);
    setValidationState('unanswered');
    setTimeLeft(currentReactivo ? currentReactivo.tiempo_limite_seg : 25);
    setIsTimerActive(true);
    // FIX 2026-09-30: NO reiniciar isReadingPhase entre skills (solo al inicio de la clase).
    // El alumno puede volver a ver el texto con el boton 'Ver lectura'.
    setRunResults({
      total: 0,
      correct: 0,
      points: 0,
      xp: 0,
      answeredRows: [],
    });
    setIsReviewMode(review);
    setSubScreen('exercise');
  };

  // Tutorial modal check for exercises (persistencia en localStorage)
  useEffect(() => {
    if (subScreen === 'exercise') {
      if (isReadingCompletionExercise) {
        try {
          const seen = localStorage.getItem(READING_GRAMMAR_TUTORIAL_STORAGE_KEY);
          if (seen !== 'true') {
            setShowReadingGrammarTutorial(true);
          } else {
            setShowReadingGrammarTutorial(false);
          }
        } catch {
          setShowReadingGrammarTutorial(true);
        }
      } else if (selectedSkill === 'grammar') {
        try {
          const seen = localStorage.getItem(GRAMMAR_TUTORIAL_STORAGE_KEY);
          if (seen !== 'true') {
            setShowGrammarTutorial(true);
          } else {
            setShowGrammarTutorial(false);
          }
        } catch {
          setShowGrammarTutorial(true);
        }
      } else if (selectedSkill === 'listening') {
        try {
          const seen = localStorage.getItem(LISTENING_TUTORIAL_STORAGE_KEY);
          if (seen !== 'true') {
            setShowListeningTutorial(true);
          } else {
            setShowListeningTutorial(false);
          }
        } catch {
          setShowListeningTutorial(true);
        }
      } else if (selectedSkill === 'speaking') {
        try {
          const seen = localStorage.getItem(SPEAKING_TUTORIAL_STORAGE_KEY);
          if (seen !== 'true') {
            setShowSpeakingTutorial(true);
          } else {
            setShowSpeakingTutorial(false);
          }
        } catch {
          setShowSpeakingTutorial(true);
        }
      } else if (selectedSkill === 'writing') {
        try {
          const seen = localStorage.getItem(WRITING_TUTORIAL_STORAGE_KEY);
          if (seen !== 'true') {
            setShowWritingTutorial(true);
          } else {
            setShowWritingTutorial(false);
          }
        } catch {
          setShowWritingTutorial(true);
        }
      } else {
        setShowGrammarTutorial(false);
        setShowReadingGrammarTutorial(false);
        setShowListeningTutorial(false);
        setShowSpeakingTutorial(false);
        setShowWritingTutorial(false);
      }
    } else {
      setShowGrammarTutorial(false);
      setShowReadingGrammarTutorial(false);
      setShowListeningTutorial(false);
      setShowSpeakingTutorial(false);
      setShowWritingTutorial(false);
    }
  }, [subScreen, selectedSkill, currentQuestionIdx, isReadingCompletionExercise]);

  // Timer countdown hook for Screen 4
  useEffect(() => {
    if (subScreen !== 'exercise') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Si algún modal de tutorial está abierto, pausar temporizador al límite completo
    if (showGrammarTutorial || showReadingGrammarTutorial || showListeningTutorial || showSpeakingTutorial) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (currentReactivo) {
        setTimeLeft(currentReactivo.tiempo_limite_seg);
      }
      return;
    }

    // Si estamos en la Fase 1 de Lectura, pausar temporizador al límite completo
    if (hasReadingPhase && isReadingPhase) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (currentReactivo) {
        setTimeLeft(currentReactivo.tiempo_limite_seg);
      }
      return;
    }

    if (currentReactivo) {
      setTimeLeft(currentReactivo.tiempo_limite_seg);
      setIsTimerActive(true);
    }

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsTimerActive(false);
          // Handle timeout as fail if still unanswered
          setValidationState((curr) => (curr === 'unanswered' ? 'first_fail' : curr));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [subScreen, currentQuestionIdx, showGrammarTutorial, showReadingGrammarTutorial, showListeningTutorial, showSpeakingTutorial, hasReadingPhase, isReadingPhase]);

  // Handle option selection with 3-State validation and automatic transitions
  const handleSelectOption = (option: string) => {
    if (validationState === 'correct' || validationState === 'second_fail') {
      return; // Already resolved
    }

    setSelectedOption(option);
    const isCorrect =
      option === currentReactivo.respuesta_correcta ||
      option.trim().toLowerCase() === (currentReactivo.respuesta_correcta || '').trim().toLowerCase() ||
      (selectedSkill === 'listening' && (
        (currentReactivo.respuesta_correcta || '').trim().toLowerCase().startsWith(option.trim().toLowerCase() + ' ') ||
        option.trim().toLowerCase().startsWith((currentReactivo.respuesta_correcta || '').trim().toLowerCase() + ' ')
      )) ||
      (selectedSkill === 'speaking' && (
        normalizeText(option) === normalizeText(currentReactivo.pregunta_texto || currentReactivo.respuesta_correcta || '') ||
        normalizeContractions(option) === normalizeContractions(currentReactivo.pregunta_texto || currentReactivo.respuesta_correcta || '')
      ));
    const nextAttempts = attemptCount + 1;
    setAttemptCount(nextAttempts);

    // Cancelar cualquier temporizador de avance previo
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    // Obtener usuario actual desde almacenamiento de sesión
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const tiempoTranscurrido = Math.max(0, currentReactivo.tiempo_limite_seg - timeLeft);

    if (isCorrect) {
      soundManager.playCorrect();
      setValidationState('correct');
      if (timerRef.current) clearInterval(timerRef.current);

      // REGLA 1 y 3: Si selecciona la respuesta correcta (en 1er o 2do intento),
      // cambia automáticamente a la siguiente pregunta tras 1.4s
      autoAdvanceTimerRef.current = setTimeout(() => {
        handleNextQuestion();
      }, 1400);

      // PASO 4: Si es usuario REGULAR, guardamos en Google Sheets (PROGRESO_USUARIO)
      // Si es usuario DEMO, NO llamamos a la API (solo estado y storage local)
      if (user && user.tipo_cuenta !== 'demo') {
        saveProgressToGoogleSheet({
          user_id: user.user_id,
          clase_id: currentClase.clase_id,
          habilidad: selectedSkill,
          reactivo_id: currentReactivo.reactivo_id,
          respuesta_usuario: option,
          correcto: true,
          tiempo_respuesta_seg: tiempoTranscurrido,
          fecha_completado: new Date().toISOString(),
          puntaje_obtenido: currentReactivo.puntos || 10,
        }).catch((err) => {
          console.warn('Aviso guardando progreso en Google Sheets:', err);
        });
      }

      // REGLA 2: Actualizar RESUMEN_PROGRESO en tiempo real (+1 reactivo correcto, +10 puntos)
      recordReactivoResumenProgreso({
        userId: user?.user_id || 'demo_user_001',
        claseId: currentClase.clase_id,
        correcto: true,
        puntos: currentReactivo.puntos || 10,
        reactivoId: currentReactivo.reactivo_id,
      });

      // Record result
      const newRow: SheetProgresoUsuarioRow = {
        progreso_id: `PRG_${Date.now()}_${currentReactivo.reactivo_id}`,
        user_id: user?.user_id || 'user_active_student',
        clase_id: currentClase.clase_id,
        habilidad: selectedSkill,
        reactivo_id: currentReactivo.reactivo_id,
        respuesta_usuario: option,
        correcto: true,
        tiempo_respuesta_seg: tiempoTranscurrido,
        puntaje_obtenido: currentReactivo.puntos || 10,
        fecha_registro: new Date().toISOString(),
      };

      setRunResults((prev) => ({
        total: prev.total + 1,
        correct: prev.correct + 1,
        points: prev.points + (currentReactivo.puntos || 10),
        xp: prev.xp + 15,
        answeredRows: [...prev.answeredRows, newRow],
      }));
    } else {
      soundManager.playIncorrect();
      if (nextAttempts === 1) {
        // REGLA 2: Si falla en el 1er intento, muestra aviso de 2ª oportunidad (NO avanza)
        setValidationState('first_fail');
      } else {
        // REGLA 4: Si falla por 2ª vez, anuncia que se equivocó 2 veces y cambia de pregunta tras 3.2s
        setValidationState('second_fail');
        if (timerRef.current) clearInterval(timerRef.current);

        autoAdvanceTimerRef.current = setTimeout(() => {
          handleNextQuestion();
        }, 3200);

        // REGLA 2: Actualizar RESUMEN_PROGRESO en tiempo real (incorrecto)
        recordReactivoResumenProgreso({
          userId: user?.user_id || 'demo_user_001',
          claseId: currentClase.clase_id,
          correcto: false,
          puntos: 0,
          reactivoId: currentReactivo.reactivo_id,
        });

        // PASO 4: Si es usuario REGULAR, guardamos intento en Google Sheets
        // Si es usuario DEMO, NO llamamos a la API
        if (user && user.tipo_cuenta !== 'demo') {
          saveProgressToGoogleSheet({
            user_id: user.user_id,
            clase_id: currentClase.clase_id,
            habilidad: selectedSkill,
            reactivo_id: currentReactivo.reactivo_id,
            respuesta_usuario: option,
            correcto: false,
            tiempo_respuesta_seg: tiempoTranscurrido,
            fecha_completado: new Date().toISOString(),
            puntaje_obtenido: 0,
          }).catch((err) => {
            console.warn('Aviso guardando progreso en Google Sheets:', err);
          });
        }

        const newRow: SheetProgresoUsuarioRow = {
          progreso_id: `PRG_${Date.now()}_${currentReactivo.reactivo_id}`,
          user_id: user?.user_id || 'user_active_student',
          clase_id: currentClase.clase_id,
          habilidad: selectedSkill,
          reactivo_id: currentReactivo.reactivo_id,
          respuesta_usuario: option,
          correcto: false,
          tiempo_respuesta_seg: tiempoTranscurrido,
          puntaje_obtenido: 0,
          fecha_registro: new Date().toISOString(),
        };

        setRunResults((prev) => ({
          total: prev.total + 1,
          correct: prev.correct,
          points: prev.points,
          xp: prev.xp,
          answeredRows: [...prev.answeredRows, newRow],
        }));
      }
    }
  };

  // Next question handler
  const handleNextQuestion = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (currentQuestionIdx + 1 < skillReactivos.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOption(null);
      setAttemptCount(0);
      setValidationState('unanswered');
    } else {
      // REGLA 3: Al completar una habilidad (5 reactivos):
      // - Sumar 1 a habilidades_completadas
      // - Si habilidades_completadas == 5: estado_clase = "completada"
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const activeUserId = user?.user_id || 'demo_user_001';

      recordSkillCompletedResumenProgreso({
        userId: activeUserId,
        claseId: currentClase.clase_id,
        habilidad: selectedSkill,
      });

      // Completed all questions in this skill -> Save progress and show Summary
      if (onSaveProgress && runResults.answeredRows.length > 0) {
        onSaveProgress(runResults.answeredRows);
      }
      setSubScreen('summary');
    }
  };

  // Calculate skill completion in existing progress
  useEffect(() => {
    if (!userEmail) return;
    let cancelled = false;
    (async () => {
      try {
        const url = '/api/progress/' + encodeURIComponent(userEmail);
        const res = await fetch(url);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        if (!json.ok || !json.data || !json.data.byLesson) return;
        const lessonData = json.data.byLesson[claseId];
        if (!lessonData || !lessonData.skills) return;
        const map: Record<string, number> = {};
        const entries = Object.entries(lessonData.skills as Record<string, number>);
        for (let i = 0; i < entries.length; i++) {
          const k = entries[i][0];
          const v = entries[i][1];
          map[k.toUpperCase()] = Number(v) || 0;
        }
        console.log('[ClassDetailScreen] Progreso por skill desde Prisma:', map);
        setUserProgressBySkill(map);
      } catch (e) {
        console.warn('[ClassDetailScreen] Error cargando progreso:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [claseId, userEmail, subScreen]);

  // NUEVO: Detectar cuando las 5 habilidades están completas
  useEffect(() => {
    const skills: SkillKey[] = ['grammar', 'reading', 'listening', 'writing', 'speaking'];
    const allDone = skills.every((s) => (userProgressBySkill[s.toUpperCase()] ?? 0) >= 5);
    if (!allDone) return;
    const key = 'celebrated_' + claseId;
    try {
      if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(key)) {
        setShowCelebration(true);
        sessionStorage.setItem(key, 'true');
      }
    } catch {}
  }, [userProgressBySkill, claseId]);

  const getSkillCount = (skill: SkillKey) => {
    const fromPrisma = userProgressBySkill[skill.toUpperCase()];
    if (typeof fromPrisma === 'number' && fromPrisma > 0) return fromPrisma;

    return existingProgress.filter(
      (p) => p.clase_id === claseId && p.habilidad === skill && p.correcto
    ).length;
  };

  // Next class calculation
  const nextClase = useMemo(() => {
    const currIdx = clases.findIndex((c) => c.clase_id === claseId);
    if (currIdx >= 0 && currIdx + 1 < clases.length) {
      return clases[currIdx + 1];
    }
    return null;
  }, [claseId]);

  return (
    <div className="w-full min-h-screen bg-white text-gray-900 p-2.5 sm:p-6 lg:p-8 select-none max-w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full">
        {/* Top Header / Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-5 pb-3.5 border-b border-gray-200 w-full">
          <button
            id="btn-back-to-index"
            type="button"
            onClick={onBackToIndex}
            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border border-gray-200"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span>Volver al Índice</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px] sm:text-xs">
              Clase #{currentClase.clase_numero} · {currentClase.clase_id}
            </span>
            <span className="hidden sm:inline">Semana {currentClase.semana} · Sesión {currentClase.sesion}</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PANTALLA 3: DETALLE DE CLASE                                              */}
        {/* ========================================================================= */}
        {subScreen === 'detail' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn w-full">
            {/* Title & Topic Header */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-8 shadow-xs relative overflow-hidden max-w-full">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-[10px] sm:text-xs font-mono font-bold uppercase flex items-center gap-1.5">
                  <Bookmark className="w-3 h-3 shrink-0" /> MCER A1
                </span>
                <span className="px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-[10px] sm:text-xs font-mono font-bold">
                  ⏱️ {currentClase.duracion_min} min
                </span>
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] sm:text-xs font-mono font-bold">
                  {currentClase.tipo_contenido === 'original' ? '🎬 Teclingo' : '🔄 Repaso'}
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif italic text-gray-900 mb-2 leading-tight break-words font-bold">
                {currentClase.titulo_clase}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-3xl break-words font-medium">
                {currentClase.tema_principal}
              </p>
            </div>

            {/* ================================================================= */}
            {/* 1. VIDEO DE LA LECCIÓN (SHORTS 9:16) - COLAPSABLE (AZUL)          */}
            {/* ================================================================= */}
            <AccordionSection
              number="1"
              title="Video de la Lección"
              subtitle="Shorts 9:16 · @teclingoacademy"
              badge="Oficial"
              colorScheme="blue"
              defaultOpen={false}
            >
              <div className="space-y-4 py-2">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                  {/* Strictly 9:16 vertical responsive container */}
                  <div className="relative aspect-[9/16] w-full max-w-[320px] rounded-2xl overflow-hidden border border-gray-200 bg-black shadow-lg shrink-0">
                    <iframe
                        className="w-full h-full border-0"
                        src={resolvedVideoInfo.embedUrl}
                        title={`Video Clase: ${resolvedVideoInfo.title}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                  </div>

                  {/* Video Info / Context */}
                  <div className="max-w-md text-center md:text-left space-y-3">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-semibold">
                      <span>{currentClase.clase_id}</span>
                      <span>·</span>
                      <span>Videolección Oficial</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
                      {resolvedVideoInfo.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      Observa la articulación vocal, entonación y el contexto comunicativo antes de explorar el vocabulario y las reglas de la clase.
                    </p>
                    <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <a
                        href={resolvedVideoInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                      >
                        <span>Abrir en YouTube</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <span className="text-[11px] text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-lg font-medium">
                        ⏱️ ~60 seg de alta concentración
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionSection>

            {/* ================================================================= */}
            {/* 2. VOCABULARIO CLAVE DE LA CLASE (COLAPSABLE) (VERDE)             */}
            {/* ================================================================= */}
            <AccordionSection
              number="2"
              title="Vocabulario Clave de la Clase"
              subtitle={`${formattedVocabList.length} palabras · Toca la bocina para escuchar`}
              badge={`${formattedVocabList.length} palabras`}
              colorScheme="emerald"
              defaultOpen={false}
            >
              <VocabularySection words={formattedVocabList} />
            </AccordionSection>

            {/* ================================================================= */}
            {/* 3. FUNDAMENTOS DE LA CLASE (COLAPSABLE) (ÍNDIGO/MORADO)           */}
            {/* ================================================================= */}
            <div className="w-full max-w-full overflow-hidden">
              {claseId === 'A1_C01' ? (
                <ClassTheoryAccordion claseId={claseId} />
              ) : (
                <AccordionSection
                  number="3"
                  title={`Fundamentos de la Clase (${currentClase.clase_id})`}
                  subtitle="Teoría y Teacher Virtual Bilingüe Oficial"
                  badge="Teoría"
                  colorScheme="indigo"
                  defaultOpen={false}
                >
                  <TeacherVirtualCard 
                    explicacion={explicacion} 
                    claseId={claseId} 
                    theme="light" 
                  />
                </AccordionSection>
              )}
            </div>

            {/* ================================================================= */}
            {/* 4. EVALUACIÓN INTEGRAL (5 HABILIDADES) (NARANJA/ÁMBAR)            */}
            {/* ================================================================= */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 sm:p-6 mb-6 shadow-xs max-w-full overflow-hidden">
              <div className="flex items-center space-x-4 mb-5">
                <div className="w-10 h-10 bg-amber-500 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                  4
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2.5 flex-wrap gap-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-amber-900 truncate">
                      Practica las 5 Habilidades de la Clase
                    </h2>
                    <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs shrink-0">
                      Evaluación
                    </span>
                  </div>
                  <p className="text-sm text-amber-700 mt-0.5">
                    Cada habilidad cuenta con 5 reactivos interactivos. Completa las 5 para certificar el 100% de esta clase.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-3.5">
                {[
                  { key: 'grammar' as SkillKey, label: 'Gramática', icon: BookOpen, color: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-white hover:bg-emerald-50/70' },
                  { key: 'reading' as SkillKey, label: 'Reading', icon: FileText, color: 'text-blue-700', border: 'border-blue-200', bg: 'bg-white hover:bg-blue-50/70' },
                  { key: 'listening' as SkillKey, label: 'Listening', icon: Headphones, color: 'text-purple-700', border: 'border-purple-200', bg: 'bg-white hover:bg-purple-50/70' },
                  { key: 'writing' as SkillKey, label: 'Writing', icon: PenTool, color: 'text-amber-700', border: 'border-amber-200', bg: 'bg-white hover:bg-amber-50/70' },
                  { key: 'speaking' as SkillKey, label: 'Speaking', icon: Mic, color: 'text-rose-700', border: 'border-rose-200', bg: 'bg-white hover:bg-rose-50/70' },
                ].map((skill) => {
                  const Icon = skill.icon;
                  const correctCount = getSkillCount(skill.key);
                  const isDone = correctCount >= 5;

                  return (
                    <button
                      key={skill.key}
                      type="button"
                      onClick={() => {
                        if (isDone) { setConfirmViewSkill(skill.key); }
                        else { startSkillExercise(skill.key, false); }
                      }}
                      className={`relative p-3.5 sm:p-4 rounded-xl border transition-all duration-200 text-left flex flex-col justify-between cursor-pointer group shadow-xs active:scale-98 ${isDone ? 'border-[#00F5D4] bg-[#00F5D4]/10 ring-2 ring-[#00F5D4]/40 shadow-[0_0_15px_rgba(0,245,212,0.25)]' : skill.border + ' ' + skill.bg + ' hover:shadow-md hover:scale-[1.02] sm:hover:scale-105'}`}
                    >
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${skill.color} shrink-0`} />
                        {isDone ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> 5/5
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-gray-500">
                            {correctCount}/5 resueltos
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {skill.label}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5">
                          {skill.key === 'reading' && textoBase ? (
                            <span className="text-blue-700 font-medium truncate block">
                              📖 {textoBase.titulo_texto || textoBase.titulo}
                            </span>
                          ) : (
                            '5 reactivos'
                          )}
                        </p>
                      </div>

                      <div className="mt-2.5 sm:mt-3 flex items-center justify-between text-xs font-mono text-gray-800 font-bold pt-2 border-t border-gray-100">
                        <span>{isDone ? 'Ver' : 'Comenzar'}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-1 transition-transform shrink-0" />
                      </div>
                        {isDone && (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full bg-[#00F5D4] text-black text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border-2 border-white">
                            ✓ Completada — Click para ver
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#00F5D4]"></div>
                          </div>
                        )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* PANTALLA 4: EJERCICIOS INTERACTIVOS (RUNNER)                              */}
        {/* ========================================================================= */}
        {subScreen === 'exercise' && currentReactivo && (
          <div className="max-w-3xl mx-auto animate-fadeIn w-full">
            
            {/* Top Navigation & Status Bar */}
            <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-5 mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2.5 shadow-xs w-full">
              <button
                type="button"
                onClick={() => setSubScreen('detail')}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] sm:text-xs font-mono font-bold text-gray-800 flex items-center gap-1.5 transition-all cursor-pointer border border-gray-200"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                <span>Salir</span>
              </button>

              <div className="flex items-center gap-2.5 sm:gap-4">
                {/* Botón para volver a ver la lectura si ya se pasó a la fase de preguntas */}
                {hasReadingPhase && !isReadingPhase && (
                  <button
                    type="button"
                    onClick={() => setIsReadingPhase(true)}
                    title="Releer el texto base"
                    className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs flex items-center gap-1.5 border border-blue-200 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">Ver lectura</span>
                  </button>
                )}

                {/* Botón para ver el tutorial de Grammar / Reading en cualquier momento */}
                {(selectedSkill === 'grammar' || isReadingCompletionExercise) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isReadingCompletionExercise) {
                        setShowReadingGrammarTutorial(true);
                      } else {
                        setShowGrammarTutorial(true);
                      }
                    }}
                    title="Ver guía y tutorial de cómo funciona este ejercicio"
                    className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs flex items-center gap-1.5 border border-gray-200 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-600" />
                    <span className="hidden sm:inline">¿Cómo funciona?</span>
                  </button>
                )}

                {/* Progress 1/5 */}
                <div className="text-xs font-mono">
                  <span className="text-gray-500">Reactivo </span>
                  <span className="text-gray-900 font-bold">{currentQuestionIdx + 1}</span>
                  <span className="text-gray-500"> / {skillReactivos.length}</span>
                </div>

                {/* Timer Badge / Fase Badge */}
                {hasReadingPhase && isReadingPhase ? (
                  <div className="px-2.5 sm:px-3 py-1 rounded-full border border-blue-300 bg-blue-50 text-blue-800 flex items-center gap-1.5 text-xs font-mono font-bold">
                    <BookOpen className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                    <span>Lectura inicial</span>
                  </div>
                ) : (
                  <div className={`px-2.5 sm:px-3 py-1 rounded-full border flex items-center gap-1.5 text-xs font-mono font-bold ${
                    timeLeft <= 5 
                      ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse' 
                      : 'bg-gray-100 border-gray-200 text-gray-800'
                  }`}>
                    <Clock className="w-3.5 h-3.5 shrink-0 text-gray-600" />
                    <span>{selectedSkill.toUpperCase()} - {timeLeft}s</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 h-1.5 sm:h-2 rounded-full mb-4 sm:mb-6 overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${((currentQuestionIdx + 1) / skillReactivos.length) * 100}%` }}
              />
            </div>

            {/* PASO 1 Y PASO 2: Visualización exclusiva por fases */}
            {isReviewMode ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm text-left max-w-full">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <span className="px-2.5 py-1 rounded-full bg-[#00F5D4]/15 text-[#00F5D4] border border-[#00F5D4]/40 text-xs font-mono font-bold uppercase tracking-wider">
                    {currentReactivo.habilidad.toUpperCase()} · #{currentReactivo.numero_reactivo || currentReactivo.numero || 1}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#00F5D4]/15 text-[#00F5D4] border border-[#00F5D4]/40 text-xs font-mono font-bold uppercase tracking-wider">
                    📖 Solo lectura
                  </span>
                </div>

                <p className="text-xs font-mono text-blue-700 mb-3">
                  {currentReactivo.instruccion}
                </p>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-4">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Enunciado</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">
                    {currentReactivo.pregunta_texto}
                  </p>
                  {currentReactivo.frase_traduccion && (
                    <p className="text-sm text-gray-600 italic mt-2">
                      "{currentReactivo.frase_traduccion}"
                    </p>
                  )}
                </div>

                {currentReactivo.opciones && currentReactivo.opciones.length > 0 && (
                  <div className="space-y-2.5 mb-4">
                    {currentReactivo.opciones.map((opt, i) => {
                      const isCorrect = opt === currentReactivo.respuesta_correcta;
                      return (
                        <div
                          key={i}
                          className={"p-3.5 rounded-xl border text-sm " + (isCorrect ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold" : "bg-gray-50 border-gray-200 text-gray-500")}
                        >
                          <span className="font-mono mr-2">{String.fromCharCode(65 + i)})</span>
                          {opt}
                          {isCorrect && <span className="ml-2 text-emerald-700 font-black">✓ Correcta</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {(!currentReactivo.opciones || currentReactivo.opciones.length === 0) && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 mb-4">
                    <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">Respuesta correcta</p>
                    <p className="text-base font-bold text-emerald-950">{currentReactivo.respuesta_correcta}</p>
                  </div>
                )}

                {currentReactivo.respuesta_explicacion && (
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs leading-relaxed">
                    <span className="font-bold">💡 </span>
                    {currentReactivo.respuesta_explicacion}
                  </div>
                )}

                <div className="flex justify-end pt-5 mt-5 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#00F5D4] hover:brightness-95 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    {currentQuestionIdx + 1 >= skillReactivos.length ? "Ver resumen" : "Siguiente reactivo"}
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>
            ) : hasReadingPhase && isReadingPhase ? (
              /* FASE 1: MOSTRAR ÚNICAMENTE LA TARJETA DE LECTURA (MY CLASSROOM) */
              <ReadingTextBase
                texto={textoBase}
                isPhaseMode={true}
                onContinue={() => setIsReadingPhase(false)}
                isTutorialOpen={showGrammarTutorial || showReadingGrammarTutorial}
              />
            ) : (
              /* FASE 2: MOSTRAR ÚNICAMENTE LA PREGUNTA DE GRAMÁTICA */
              <ReactivoCard
                reactivo={currentReactivo}
                selectedOption={selectedOption}
                validationState={validationState}
                onSelectOption={handleSelectOption}
                onNext={handleNextQuestion}
                isLastQuestion={currentQuestionIdx + 1 >= skillReactivos.length}
                timeLeft={timeLeft}
                textoBase={textoBase}
                isTutorialOpen={showGrammarTutorial || showReadingGrammarTutorial || showListeningTutorial || showSpeakingTutorial || showWritingTutorial}
                isReviewMode={isReviewMode}
              />
            )}

            {/* Modal de Tutorial de Grammar Estándar */}
            <GrammarTutorialModal
              isOpen={showGrammarTutorial}
              onClose={() => setShowGrammarTutorial(false)}
            />

            {/* Modal de Tutorial de Lectura + Completar Oración */}
            <ReadingGrammarTutorialModal
              isOpen={showReadingGrammarTutorial}
              onClose={() => setShowReadingGrammarTutorial(false)}
            />

            {/* Modal de Tutorial de Listening Cloze */}
            <ListeningTutorialModal
              isOpen={showListeningTutorial}
              onClose={() => setShowListeningTutorial(false)}
            />

            {/* Modal de Tutorial de Speaking */}
            <SpeakingTutorialModal
              isOpen={showSpeakingTutorial}
              onClose={() => setShowSpeakingTutorial(false)}
            />

            {/* Modal de Tutorial de Writing (Dictado Interactivo) */}
            <WritingTutorialModal
              isOpen={showWritingTutorial}
              onClose={() => setShowWritingTutorial(false)}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* PANTALLA 5: RESUMEN DE CLASE                                              */}
        {/* ========================================================================= */}
        {subScreen === 'summary' && (
          <div className="max-w-2xl mx-auto animate-fadeIn text-center w-full">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-10 shadow-sm relative overflow-hidden max-w-full">
              
              {/* Achievement Badge */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-xs">
                <Award className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-[10px] sm:text-xs font-mono font-bold uppercase">
                Sesión de Práctica Completada
              </span>

              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2.5 sm:mt-3 mb-2 font-serif italic">
                ¡Gran Trabajo!
              </h2>

              <p className="text-xs sm:text-sm text-gray-600 mb-5 sm:mb-6 break-words px-1">
                Has completado los 5 reactivos de <strong>{selectedSkill.toUpperCase()}</strong> en {currentClase.titulo_clase}.
              </p>

              {/* Stats Grid: Never overflows on mobile */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-6 sm:mb-8">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 sm:p-3.5">
                  <div className="text-[9px] sm:text-[10px] font-mono text-gray-500 uppercase">Aciertos</div>
                  <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-600">
                    {runResults.correct} / 5
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 sm:p-3.5">
                  <div className="text-[9px] sm:text-[10px] font-mono text-gray-500 uppercase">Puntos</div>
                  <div className="text-lg sm:text-2xl font-bold font-mono text-gray-900">
                    {runResults.points}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 sm:p-3.5">
                  <div className="text-[9px] sm:text-[10px] font-mono text-gray-500 uppercase">XP Ganados</div>
                  <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-600">
                    +{runResults.xp}
                  </div>
                </div>
              </div>

              {/* Navigation Action Buttons: Full width on mobile stacked */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full">
                <button
                  type="button"
                  onClick={onBackToIndex}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center border border-gray-200"
                >
                  Volver al Index
                </button>

                <button
                  type="button"
                  onClick={() => setSubScreen('detail')}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Otra Habilidad
                </button>

                {nextClase && onSelectNextClass && (
                  <button
                    type="button"
                    onClick={() => onSelectNextClass(nextClase.clase_id)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer text-center"
                  >
                    <span>Siguiente ({nextClase.clase_id})</span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* MODAL: Confirmar ver habilidad completada */}
      {confirmViewSkill && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setConfirmViewSkill(null)}
        >
          <div
            className="max-w-md w-full bg-white rounded-2xl border-2 border-[#00F5D4] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-[#00F5D4]/20 border-2 border-[#00F5D4] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-[#00F5D4]" />
            </div>
            <h3 className="text-lg font-black text-center text-gray-900 mb-2 uppercase">
              Habilidad ya completada
            </h3>
            <p className="text-sm text-center text-gray-600 mb-2 leading-relaxed">
              Ya completaste los 5 reactivos de <strong className="text-gray-900 uppercase">{confirmViewSkill}</strong> en esta clase.
            </p>
            <p className="text-xs text-center text-gray-500 mb-6 italic">
              Entrarás en modo revisión (solo lectura). Tu progreso no se verá afectado.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmViewSkill(null)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  startSkillExercise(confirmViewSkill, true);
                  setConfirmViewSkill(null);
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-[#00F5D4] hover:brightness-95 text-black font-bold text-xs uppercase cursor-pointer shadow-md"
              >
                Ver revisión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

