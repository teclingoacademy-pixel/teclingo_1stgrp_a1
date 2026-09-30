/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TeacherVirtualCard.tsx
 * Componente del Teacher Virtual Bilingüe Profesional para TecLingo:
 * - Explica los conceptos nucleares en español (para máxima comprensión cognitiva).
 * - Cita de manera estricta todos los ejemplos en inglés entre comillas dobles (" ").
 * - Añade las traducciones al español entre paréntesis (traducción).
 * - Motor de síntesis de voz (TTS) en español con control de velocidad, pausas y selección de voz.
 * - Incluye el Script de Audio Oficial para lectura guiada y práctica de pronunciación.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  FileText, 
  Sliders, 
  Languages, 
  Zap, 
  ChevronDown, 
  ChevronUp,
  ChevronRight,
  Award
} from 'lucide-react';
import type { SheetTextoExplicativoRow } from '@/types/workbook/workbookRows';
import { cleanTextForTTS } from '@/utils/workbook/audioFeedback';
import { apiUrl } from '@/services/apiConfig';

// ===================================================================
// Parser de guion bilingue [ES] / [EN]
// ===================================================================
function parseBilingualScript(content: string): { es: string; en: string } {
  if (!content) return { es: '', en: '' };
  const parts = content.split(/\[EN\]/i);
  let esBlock = parts[0] || '';
  const enBlock = parts[1] || '';
  esBlock = esBlock.replace(/\[ES\]\s*/i, '').trim();
  esBlock = esBlock.replace(/\s*---\s*$/, '').trim();
  return { es: esBlock, en: enBlock.trim() };
}

function cleanTextForLanguage(text: string, lang: 'es' | 'en'): string {
  if (lang === 'en') {
    return text.replace(/[\u201C\u201D\"]/g, '').replace(/\s+/g, ' ').trim();
  }
  return text;
}
interface TeacherVirtualCardProps {
  explicacion: SheetTextoExplicativoRow;
  claseId: string;
  theme?: 'dark' | 'light';
}

export const TeacherVirtualCard: React.FC<TeacherVirtualCardProps> = ({
  explicacion,
  claseId,
  theme = 'dark',
}) => {
  // TTS State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.9); // Ritmo didáctico
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [activeSectionTitle, setActiveSectionTitle] = useState<string>('');
  const [showFullScript, setShowFullScript] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // FIX 2026-09-28: estado del guion cargado desde /api/lessons/:id/teacher-script
  const [apiScript, setApiScript] = useState<{ title: string; content: string } | null>(null);
  const [scriptBlocks, setScriptBlocks] = useState<{ es: string; en: string }>({ es: '', en: '' });
  const [activeLanguage, setActiveLanguage] = useState<'es' | 'en'>('es');
  const [isLoadingScript, setIsLoadingScript] = useState<boolean>(false);

  // Accordion Sections State - All closed by default per pedagogical UX guidelines
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
  });

  const toggleSection = (sectionIndex: number) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }));
  };

  const areAllOpen = Object.values(openSections).every(Boolean);
  const areAllClosed = Object.values(openSections).every((v) => !v);

  const toggleAllSections = () => {
    if (areAllOpen) {
      setOpenSections({ 1: false, 2: false, 3: false, 4: false });
    } else {
      setOpenSections({ 1: true, 2: true, 3: true, 4: true });
    }
  };

  // Load available Spanish voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Filter Spanish voices first
      const spanishVoices = voices.filter(
        (v) => v.lang.startsWith('es') || v.lang.includes('Spanish')
      );
      setAvailableVoices(spanishVoices.length > 0 ? spanishVoices : voices);

      // Default voice selection: prioritize natural Spanish
      if (!selectedVoiceURI && spanishVoices.length > 0) {
        const preferred =
          spanishVoices.find(
            (v) =>
              v.name.includes('Natural') ||
              v.name.includes('Sabina') ||
              v.name.includes('Helena') ||
              v.name.includes('Jorge') ||
              v.name.includes('Mexico')
          ) || spanishVoices[0];
        setSelectedVoiceURI(preferred.voiceURI);
      }
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedVoiceURI]);

  // FIX 2026-09-28: cargar guion desde API /api/lessons/:id/teacher-script
  useEffect(() => {
    let cancelled = false;
    if (!claseId) { setApiScript(null); return; }

    setIsLoadingScript(true);
    fetch(apiUrl('/api/lessons/' + encodeURIComponent(claseId) + '/teacher-script'))
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (cancelled) return;
        if (json && json.ok && json.data && json.data.content) {
          setApiScript({ title: json.data.title, content: json.data.content });
          setScriptBlocks(parseBilingualScript(json.data.content));
        } else {
          setApiScript(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiScript(null);
          setScriptBlocks({ es: '', en: '' });
        }
      })
      .finally(() => { if (!cancelled) setIsLoadingScript(false); });

    return () => { cancelled = true; };
  }, [claseId]);

  // Handle Play / Stop Speech
  const handleTogglePlay = (customText?: string, sectionName: string = 'Explicación Completa', forceLang?: 'es' | 'en') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlaying && !isPaused && !customText) {
      // Pause
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (isPaused && !customText) {
      // Resume
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    // Start new speech
    window.speechSynthesis.cancel();

    // Seleccionar idioma y texto segun forceLang o activeLanguage
    const lang: 'es' | 'en' = forceLang || activeLanguage;
    let textToSpeak = '';

    if (customText) {
      textToSpeak = customText;
    } else if (scriptBlocks.es || scriptBlocks.en) {
      textToSpeak = lang === 'en' ? scriptBlocks.en : scriptBlocks.es;
    } else {
      textToSpeak = apiScript?.content || explicacion.contenido_markdown || '';
    }

    if (!textToSpeak) return;

    // Limpieza segun idioma
    let cleanSpokenText: string;
    if (lang === 'en') {
      cleanSpokenText = textToSpeak.replace(/[\u201C\u201D\"]/g, '').replace(/\s+/g, ' ').trim();
    } else {
      cleanSpokenText = cleanTextForTTS(textToSpeak, 'es-MX');
    }

    const utterance = new SpeechSynthesisUtterance(cleanSpokenText);
    utterance.rate = speechRate;

    // Asignar voz e idioma
    const targetLangPrefix = lang === 'en' ? 'en' : 'es';
    let voiceToUse: SpeechSynthesisVoice | undefined;

    if (selectedVoiceURI && availableVoices.length > 0) {
      voiceToUse = availableVoices.find((v) => v.voiceURI === selectedVoiceURI && v.lang.startsWith(targetLangPrefix));
    }
    if (!voiceToUse) {
      const allVoices = window.speechSynthesis.getVoices();
      voiceToUse = allVoices.find((v) => v.lang.startsWith(targetLangPrefix));
    }

    if (voiceToUse) {
      utterance.voice = voiceToUse;
      utterance.lang = voiceToUse.lang;
    } else {
      utterance.lang = lang === 'en' ? 'en-US' : 'es-MX';
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setActiveSectionTitle(sectionName);
      setActiveLanguage(lang);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setActiveSectionTitle('');
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setActiveSectionTitle('');
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setActiveSectionTitle('');
  };

  // Section audio snippets for N1-C01
  const playSectionAudio = (secIndex: number) => {
    if (claseId !== 'N1-C00') {
      handleTogglePlay();
      return;
    }

    if (secIndex === 1) {
      handleTogglePlay(
        `El primer paso para pensar en inglés consiste en clasificar todo elemento del entorno según su número gramatical. 
        Singular, concepto "uno": Se refiere de manera estricta a una sola entidad. Por ejemplo: "student" (estudiante), "book" (libro), "office" (oficina). 
        Plural, concepto "varios" o "más de uno": Representa a dos o más entidades de la misma clase. En inglés, por regla general, se añade el sufijo "-s" o "-es" al sustantivo. Por ejemplo: "students" (estudiantes), "books" (libros), "offices" (oficinas).`,
        '1. Singular vs. Plural'
      );
    } else if (secIndex === 2) {
      handleTogglePlay(
        `El Filtro Maestro R.O.D. Para eliminar la memorización mecánica de conjugaciones desordenadas, el sistema procesa los pronombres personales a través de tres canales lógicos e inflexibles. 
        Canal Azul, Primera Persona: El pronombre "I" (Yo). 
        Canal Verde, Bloque Plural: Los pronombres "You" (Tú o Ustedes), "We" (Nosotros) y "They" (Ellos). 
        La Regla de Oro de TecLingo: En nuestro método, el pronombre "You" se clasifica y se procesa estructuralmente dentro del bloque de los Plurales. 
        Canal Naranja, Bloque Singular de Tercera Persona: Los pronombres "He" (Él), "She" (Ella) e "It" (Eso). Toda entidad singular externa se procesa unificadamente por este canal.`,
        '2. Filtro Maestro R.O.D.'
      );
    } else if (secIndex === 3) {
      handleTogglePlay(
        `La Regla de Oro Sintáctica: El Sujeto Obligatorio. A diferencia del español, donde es común omitir el sujeto en la oración, como "Estamos en la biblioteca", en el idioma inglés la omisión del pronombre o sujeto es incorrecta. Toda oración requiere de manera obligatoria declarar explícitamente quién o qué ejecuta la acción. Ejemplo en español: "Es un libro". Incorrecto en inglés. Ejemplo en inglés: "It is a book". Estructura obligatoria y correcta.`,
        '3. Sujeto Obligatorio'
      );
    } else if (secIndex === 4) {
      handleTogglePlay(
        `Tabla de Conexión Direccional: Fase Cero al Verbo To Be. 
        Primera Persona Singular: Pronombre "I", Verbo "am", Equivalencia: "Yo soy, Yo estoy", Ejemplo: "I am a student" (Yo soy estudiante). 
        Segundas Personas Plurales: Pronombres "You, We, They", Verbo "are", Equivalencia: "Tú eres, Nosotros somos, Ellos son", Ejemplo: "They are friends" (Ellos son amigos). 
        Terceras Personas Singulares: Pronombres "He, She, It", Verbo "is", Equivalencia: "Él es, Ella es, Eso es", Ejemplo: "He is a teacher" (Él es maestro).`,
        '4. Tabla de Conexión'
      );
    }
  };

  const isDark = theme === 'dark';

  // FIX 2026-09-28: contenido del guion desde API (prioridad) o fallback hardcoded
  const activeScriptContent: string | null = apiScript?.content || null;
  const activeScriptTitle: string = apiScript?.title || (claseId + ' - Guion del Teacher');

  return (
    <div
      id="teacher-virtual-card"
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-lg w-full max-w-full ${
        isDark
          ? 'bg-[#121416]/95 border-[#8A95A5]/30 text-white shadow-black/40'
          : 'bg-white border-blue-200 text-gray-900 shadow-blue-100'
      }`}
    >
      {/* 1. HEADER DEL TEACHER VIRTUAL */}
      <div
        className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          isDark
            ? 'bg-gradient-to-r from-[#0B1E36] via-[#121416] to-[#1A1D20] border-[#8A95A5]/25'
            : 'bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white border-blue-100'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar del Teacher */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#F7931E] to-[#e07f12] p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#121416] rounded-[10px] flex items-center justify-center text-xl sm:text-2xl">
              🧑‍🏫
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#F7931E] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 shrink-0" /> Teacher Virtual Bilingüe
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                  isDark
                    ? 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30'
                    : 'bg-green-100 text-green-800 border-green-200'
                }`}
              >
                Regla Bilingüe Estricta
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold leading-tight truncate mt-0.5">
              {explicacion.titulo_explicacion}
            </h2>
            <p className={`text-[11px] sm:text-xs truncate ${isDark ? 'text-[#8A95A5]' : 'text-gray-600'}`}>
              Explicación en Español · Ejemplos en Inglés entre comillas (" ")
            </p>
          </div>
        </div>

        {/* Quick Audio Controls Bar */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#8A95A5]/15">
          {/* Status Label if playing */}
          {isPlaying && (
            <div className="flex items-center gap-1.5 text-xs text-[#39FF14] font-medium font-mono animate-pulse">
              <Volume2 className="w-4 h-4" />
              <span className="truncate max-w-[130px] sm:max-w-none">
                {isPaused ? 'Pausado' : activeSectionTitle || 'Hablando...'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {/* Play / Pause Main Button */}
            <button
              type="button"
              onClick={() => handleTogglePlay()}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                isPlaying && !isPaused
                  ? 'bg-[#F7931E] text-white hover:bg-[#e07f12] shadow-[0_0_14px_rgba(247,147,30,0.4)]'
                  : 'bg-[#39FF14] hover:bg-[#32e012] text-black font-semibold shadow-[0_0_12px_rgba(57,255,20,0.3)]'
              }`}
              title={isPlaying && !isPaused ? 'Pausar audio' : 'Escuchar al Teacher Virtual'}
            >
              {isPlaying && !isPaused ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>{isPaused ? 'Reanudar' : 'Escuchar Teacher'}</span>
                </>
              )}
            </button>

            {/* Stop button */}
            {isPlaying && (
              <button
                type="button"
                onClick={handleStop}
                className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 transition-colors cursor-pointer"
                title="Detener audio"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}

            {/* Settings toggle */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                showSettings
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                  : isDark
                  ? 'bg-[#1A1D20] text-[#8A95A5] border-[#8A95A5]/25 hover:text-white'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
              title="Ajustar velocidad y voz del Teacher"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE AJUSTES DESPLEGABLE (Velocidad y Voz) */}
      {showSettings && (
        <div
          className={`p-3.5 sm:p-4 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
            isDark ? 'bg-[#0B1E36]/90 border-[#8A95A5]/20' : 'bg-blue-50/70 border-blue-100'
          }`}
        >
          {/* Velocidad */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-300 font-mono text-[11px] uppercase">
              Ritmo de voz:
            </span>
            <div className="flex items-center gap-1">
              {[
                { label: '0.8x (Lento)', val: 0.8 },
                { label: '0.9x (Didáctico)', val: 0.9 },
                { label: '1.0x (Normal)', val: 1.0 },
                { label: '1.15x (Fluido)', val: 1.15 },
              ].map((rate) => (
                <button
                  key={rate.val}
                  type="button"
                  onClick={() => {
                    setSpeechRate(rate.val);
                    if (isPlaying) {
                      handleStop();
                      setTimeout(() => handleTogglePlay(), 150);
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all cursor-pointer ${
                    speechRate === rate.val
                      ? 'bg-[#F7931E] text-white font-bold'
                      : isDark
                      ? 'bg-[#1A1D20] text-[#8A95A5] hover:text-white border border-[#8A95A5]/20'
                      : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  {rate.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de Voz */}
          {availableVoices.length > 0 && (
            <div className="flex items-center gap-2 max-w-full">
              <span className="font-semibold text-gray-300 font-mono text-[11px] uppercase shrink-0">
                Voz:
              </span>
              <select
                value={selectedVoiceURI}
                onChange={(e) => {
                  setSelectedVoiceURI(e.target.value);
                  if (isPlaying) {
                    handleStop();
                    setTimeout(() => handleTogglePlay(), 150);
                  }
                }}
                className={`text-[11px] rounded px-2 py-1 border max-w-[180px] sm:max-w-[240px] truncate ${
                  isDark
                    ? 'bg-[#1A1D20] text-gray-200 border-[#8A95A5]/30 focus:border-[#F7931E]'
                    : 'bg-white text-gray-800 border-gray-300'
                }`}
              >
                {availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* 3. REGLA PEDAGÓGICA Y PROTOCOLO BILINGÜE BANNER */}
      <div
        className={`px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs font-mono ${
          isDark ? 'bg-[#1A1D20]/80 border-[#8A95A5]/20' : 'bg-gray-50 border-gray-100'
        }`}
      >
        <div className="flex items-center gap-2 text-[11px] text-gray-300 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[#39FF14] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Conceptos en Español
          </span>
          <span className="text-[#8A95A5]">•</span>
          <span className="inline-flex items-center gap-1 text-[#F7931E] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ejemplos en Inglés entre comillas (" ")
          </span>
          <span className="text-[#8A95A5]">•</span>
          <span className="inline-flex items-center gap-1 text-blue-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Traducción en (paréntesis)
          </span>
        </div>

        {/* Botón para ver script completo */}
        <button
          type="button"
          onClick={() => setShowFullScript(!showFullScript)}
          className={`flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
            showFullScript
              ? 'text-[#F7931E]'
              : isDark
              ? 'text-[#8A95A5] hover:text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{showFullScript ? 'Ocultar Script Completo' : 'Ver Script de Audio'}</span>
          {showFullScript ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* 4. SECCIONES DE AUDIO RÁPIDO (N1-C01) */}
      {claseId === 'N1-C00' && (
        <div
          className={`p-3 sm:p-4 border-b flex items-center gap-2 overflow-x-auto no-scrollbar ${
            isDark ? 'bg-[#0B1E36]/40 border-[#8A95A5]/15' : 'bg-blue-50/30 border-blue-50'
          }`}
        >
          <span className="text-[10px] font-mono text-[#8A95A5] uppercase tracking-wider shrink-0 mr-1">
            🎧 Audio por Sección:
          </span>
          <button
            type="button"
            onClick={() => playSectionAudio(1)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeSectionTitle === '1. Singular vs. Plural'
                ? 'bg-[#39FF14] text-black font-bold border-[#39FF14]'
                : isDark
                ? 'bg-[#1A1D20] text-gray-200 border-[#8A95A5]/25 hover:border-[#39FF14]/50'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>1. Singular vs. Plural</span>
          </button>

          <button
            type="button"
            onClick={() => playSectionAudio(2)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeSectionTitle === '2. Filtro Maestro R.O.D.'
                ? 'bg-[#39FF14] text-black font-bold border-[#39FF14]'
                : isDark
                ? 'bg-[#1A1D20] text-gray-200 border-[#8A95A5]/25 hover:border-[#39FF14]/50'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>2. Canales R.O.D.</span>
          </button>

          <button
            type="button"
            onClick={() => playSectionAudio(3)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeSectionTitle === '3. Sujeto Obligatorio'
                ? 'bg-[#39FF14] text-black font-bold border-[#39FF14]'
                : isDark
                ? 'bg-[#1A1D20] text-gray-200 border-[#8A95A5]/25 hover:border-[#39FF14]/50'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>3. Sujeto Obligatorio</span>
          </button>

          <button
            type="button"
            onClick={() => playSectionAudio(4)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeSectionTitle === '4. Tabla de Conexión'
                ? 'bg-[#39FF14] text-black font-bold border-[#39FF14]'
                : isDark
                ? 'bg-[#1A1D20] text-gray-200 border-[#8A95A5]/25 hover:border-[#39FF14]/50'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>4. Conexión To Be</span>
          </button>
        </div>
      )}

      {/* 5. MODAL / ACCORDION CON EL SCRIPT COMPLETO DE AUDIO SUGERIDO */}
      {showFullScript && (
        <div
          className={`p-4 sm:p-5 border-b font-mono text-xs ${
            isDark ? 'bg-black/60 border-[#8A95A5]/25 text-gray-200' : 'bg-gray-100 border-gray-200 text-gray-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#F7931E] font-bold flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="w-4 h-4" /> Script Oficial de Audio (Voz Humana / TTS)
            </span>
            <button
              type="button"
              onClick={() => handleTogglePlay(scriptBlocks.es, 'Explicación en Español', 'es')}
              className="px-2.5 py-1 rounded bg-[#39FF14] text-black font-bold hover:bg-[#32e012] flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Play className="w-3 h-3 fill-black" />
              <span>Escuchar Script Completo</span>
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar whitespace-pre-line leading-relaxed text-[11px] sm:text-xs text-gray-300 bg-[#121416] p-3.5 rounded-lg border border-[#8A95A5]/20">
            {scriptBlocks.es || scriptBlocks.en || apiScript?.content || explicacion.contenido_markdown}
          </div>
        </div>
      )}

      {/* 6. CONTENIDO PEDAGÓGICO VISUAL EN SECCIONES COLAPSABLES (ACCORDION) */}
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="text-xl">📖</span>
              <span>Fundamento Teórico y Explicación</span>
            </h2>
            <p className="text-xs text-[#8A95A5] mt-0.5">
              Toca cada sección para desplegar la explicación a tu propio ritmo.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleAllSections}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#8A95A5] hover:text-white border border-white/10 text-[11px] font-mono transition-all cursor-pointer"
          >
            {areAllOpen ? 'Colapsar todas' : 'Expandir todas'}
          </button>
        </div>

        {claseId === 'N1-C00' ? (
          /* Renderizado Estructurado Premium de N1-C01 en 4 Secciones Colapsables */
          <div className="space-y-3.5 text-sm leading-relaxed">
            {/* Introducción General */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-gray-200 text-xs sm:text-sm">
              <p className="leading-relaxed">
                Para construir una base lingüística sólida y evitar errores sistemáticos de traducción, es indispensable dominar la estructura de los sujetos antes de introducir cualquier verbo o regla gramatical compleja.
              </p>
            </div>

            {/* SECCIÓN 1: Singular vs. Plural */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02] hover:border-white/20 transition-all shadow-sm">
              <div className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                <button
                  type="button"
                  onClick={() => toggleSection(1)}
                  className="flex-1 flex items-center gap-3 text-left cursor-pointer select-none"
                  aria-expanded={openSections[1]}
                >
                  <span className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-white text-sm sm:text-base block">
                      Singular vs. Plural
                    </span>
                    <span className="text-[11px] text-[#8A95A5] block">
                      El Concepto de Cantidad (Uno vs. Varios)
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playSectionAudio(1);
                    }}
                    title="Escuchar explicación de esta sección"
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      activeSectionTitle === '1. Singular vs. Plural'
                        ? 'bg-[#39FF14] text-black font-bold border-[#39FF14]'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10 hover:text-white'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSection(1)}
                    className="p-1 rounded-md text-[#8A95A5] hover:text-white cursor-pointer"
                    aria-label={openSections[1] ? 'Cerrar sección 1' : 'Abrir sección 1'}
                  >
                    {openSections[1] ? (
                      <ChevronDown className="w-5 h-5 text-gray-300 transition-transform" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 transition-transform" />
                    )}
                  </button>
                </div>
              </div>

              {openSections[1] && (
                <div className="p-4 sm:p-5 bg-black/40 border-t border-white/10 space-y-3 animate-fadeIn">
                  <p className="text-gray-300 text-xs sm:text-sm">
                    El primer paso para pensar en inglés consiste en clasificar todo elemento del entorno según su número gramatical:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-blue-900/20 border border-blue-700/50">
                      <div className="text-xs font-mono font-bold text-blue-400 uppercase mb-1">
                        SINGULAR (Concepto "UNO")
                      </div>
                      <p className="text-xs text-gray-300 mb-2.5">
                        Se refiere de manera estricta a una sola entidad (persona, objeto o concepto).
                      </p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#F7931E] bg-[#F7931E]/15 px-2 py-0.5 rounded">"student"</span>
                          <span className="text-gray-300">(estudiante)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#F7931E] bg-[#F7931E]/15 px-2 py-0.5 rounded">"book"</span>
                          <span className="text-gray-300">(libro)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#F7931E] bg-[#F7931E]/15 px-2 py-0.5 rounded">"office"</span>
                          <span className="text-gray-300">(oficina)</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-green-900/20 border border-green-700/50">
                      <div className="text-xs font-mono font-bold text-green-400 uppercase mb-1">
                        PLURAL (Concepto "VARIOS")
                      </div>
                      <p className="text-xs text-gray-300 mb-2.5">
                        Dos o más entidades. Regla estándar: agregar <span className="font-mono text-green-300">-s</span> o <span className="font-mono text-green-300">-es</span>.
                      </p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#F7931E] bg-[#F7931E]/15 px-2 py-0.5 rounded">"students"</span>
                          <span className="text-gray-300">(estudiantes)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#F7931E] bg-[#F7931E]/15 px-2 py-0.5 rounded">"books"</span>
                          <span className="text-gray-300">(libros)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#F7931E] bg-[#F7931E]/15 px-2 py-0.5 rounded">"offices"</span>
                          <span className="text-gray-300">(oficinas)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 2: El Filtro Maestro R.O.D. */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02] hover:border-white/20 transition-all shadow-sm">
              <div className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                <button
                  type="button"
                  onClick={() => toggleSection(2)}
                  className="flex-1 flex items-center gap-3 text-left cursor-pointer select-none"
                  aria-expanded={openSections[2]}
                >
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-white text-sm sm:text-base block">
                      El Filtro Maestro R.O.D.
                    </span>
                    <span className="text-[11px] text-[#8A95A5] block">
                      Procesamiento Lógico de Pronombres (Canales Azul, Verde y Naranja)
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playSectionAudio(2);
                    }}
                    title="Escuchar explicación de esta sección"
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      activeSectionTitle === '2. Filtro Maestro R.O.D.'
                        ? 'bg-[#39FF14] text-black font-bold border-[#39FF14]'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10 hover:text-white'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSection(2)}
                    className="p-1 rounded-md text-[#8A95A5] hover:text-white cursor-pointer"
                    aria-label={openSections[2] ? 'Cerrar sección 2' : 'Abrir sección 2'}
                  >
                    {openSections[2] ? (
                      <ChevronDown className="w-5 h-5 text-gray-300 transition-transform" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 transition-transform" />
                    )}
                  </button>
                </div>
              </div>

              {openSections[2] && (
                <div className="p-4 sm:p-5 bg-black/40 border-t border-white/10 space-y-3.5 animate-fadeIn">
                  <p className="text-gray-300 text-xs sm:text-sm">
                    Para eliminar la memorización mecánica de conjugaciones desordenadas, el sistema procesa los pronombres personales a través de <strong>tres canales lógicos e inflexibles</strong>:
                  </p>

                  <div className="space-y-3">
                    {/* Canal Azul */}
                    <div className="bg-blue-900/20 border-l-4 border-blue-500 p-3.5 sm:p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-blue-400 text-xs sm:text-sm">
                          🔵 CANAL AZUL (1ra Persona)
                        </h4>
                        <span className="text-[10px] font-mono text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded">
                          Emisor Unifilar
                        </span>
                      </div>
                      <p className="text-gray-300 text-xs mt-1">
                        <strong>Pronombre:</strong> <span className="font-mono text-white bg-blue-500/20 px-1.5 py-0.5 rounded">"I"</span> (Yo)
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Representa exclusivamente al emisor del mensaje. Cuenta con su propia salida verbal dedicada.
                      </p>
                    </div>

                    {/* Canal Verde */}
                    <div className="bg-green-900/20 border-l-4 border-green-500 p-3.5 sm:p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-green-400 text-xs sm:text-sm">
                          🟢 CANAL VERDE (Bloque Plural)
                        </h4>
                        <span className="text-[10px] font-mono text-green-300 bg-green-900/50 px-2 py-0.5 rounded">
                          Regla de Oro TecLingo
                        </span>
                      </div>
                      <p className="text-gray-300 text-xs mt-1">
                        <strong>Pronombres:</strong> <span className="font-mono text-white bg-green-500/20 px-1.5 py-0.5 rounded">"You"</span> (Tú / Usted / Ustedes), <span className="font-mono text-white bg-green-500/20 px-1.5 py-0.5 rounded">"We"</span> (Nosotros), <span className="font-mono text-white bg-green-500/20 px-1.5 py-0.5 rounded">"They"</span> (Ellos / Ellas)
                      </p>
                      <div className="mt-2.5 p-2.5 rounded bg-green-950/40 border border-green-700/40 text-xs space-y-1">
                        <p className="text-green-300 font-semibold flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" /> La Regla de Oro de TecLingo:
                        </p>
                        <p className="text-gray-300 text-[11px] leading-relaxed">
                          "You" se clasifica y se procesa estructuralmente dentro del bloque de los Plurales.
                        </p>
                        <p className="text-gray-400 text-[11px] leading-relaxed">
                          <em>¿Por qué?</em> En el inglés moderno no existe un pronombre independiente para "ustedes"; "You" absorbe ambas funciones.
                        </p>
                        <p className="text-green-200 text-[11px]">
                          <strong>Anclaje Cognitivo:</strong> ¿Quiénes somos "tú" y "yo"? Nosotros (Plural). Por ende, todo el bloque comparte el mismo auxiliar verbal.
                        </p>
                      </div>
                    </div>

                    {/* Canal Naranja */}
                    <div className="bg-orange-900/20 border-l-4 border-orange-500 p-3.5 sm:p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-orange-400 text-xs sm:text-sm">
                          🟠 CANAL NARANJA (3ra Persona Singular)
                        </h4>
                        <span className="text-[10px] font-mono text-orange-300 bg-orange-900/50 px-2 py-0.5 rounded">
                          Entidad Externa
                        </span>
                      </div>
                      <p className="text-gray-300 text-xs mt-1">
                        <strong>Pronombres:</strong> <span className="font-mono text-white bg-orange-500/20 px-1.5 py-0.5 rounded">"He"</span> (Él), <span className="font-mono text-white bg-orange-500/20 px-1.5 py-0.5 rounded">"She"</span> (Ella), <span className="font-mono text-white bg-orange-500/20 px-1.5 py-0.5 rounded">"It"</span> (Eso / objeto / animal / concepto)
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Representa a las personas u objetos fuera de la interacción directa del habla.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 3: La Regla de Oro Sintáctica */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02] hover:border-white/20 transition-all shadow-sm">
              <div className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                <button
                  type="button"
                  onClick={() => toggleSection(3)}
                  className="flex-1 flex items-center gap-3 text-left cursor-pointer select-none"
                  aria-expanded={openSections[3]}
                >
                  <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-white text-sm sm:text-base block">
                      La Regla de Oro Sintáctica: El Sujeto Obligatorio
                    </span>
                    <span className="text-[11px] text-[#8A95A5] block">
                      En inglés nunca se omite el pronombre o sujeto
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playSectionAudio(3);
                    }}
                    title="Escuchar explicación de esta sección"
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      activeSectionTitle === '3. Sujeto Obligatorio'
                        ? 'bg-[#39FF14] text-black font-bold border-[#39FF14]'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10 hover:text-white'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSection(3)}
                    className="p-1 rounded-md text-[#8A95A5] hover:text-white cursor-pointer"
                    aria-label={openSections[3] ? 'Cerrar sección 3' : 'Abrir sección 3'}
                  >
                    {openSections[3] ? (
                      <ChevronDown className="w-5 h-5 text-gray-300 transition-transform" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 transition-transform" />
                    )}
                  </button>
                </div>
              </div>

              {openSections[3] && (
                <div className="p-4 sm:p-5 bg-black/40 border-t border-white/10 space-y-3 animate-fadeIn">
                  <p className="text-gray-300 text-xs sm:text-sm">
                    A diferencia del español, donde es común omitir el sujeto, en inglés la omisión del pronombre es gramaticalmente incorrecta. Toda oración requiere de manera obligatoria declarar explícitamente quién o qué ejecuta la acción.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-red-900/20 border border-red-700/60 rounded-lg p-3.5">
                      <h4 className="font-bold text-red-400 mb-1 text-xs">
                        ❌ Español (sujeto elidido)
                      </h4>
                      <p className="text-gray-200 text-sm italic">"Es un libro."</p>
                      <p className="text-gray-400 text-xs mt-1.5">
                        (Falta el sujeto "It" — INCORRECTO en inglés)
                      </p>
                    </div>

                    <div className="bg-green-900/20 border border-green-700/60 rounded-lg p-3.5">
                      <h4 className="font-bold text-green-400 mb-1 text-xs">
                        ✅ Inglés (estructura obligatoria)
                      </h4>
                      <p className="text-white text-sm font-mono font-bold">"It is a book."</p>
                      <p className="text-gray-400 text-xs mt-1.5">
                        (Sujeto "It" presente — CORRECTO)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 4: Tabla de Conexión Direccional */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02] hover:border-white/20 transition-all shadow-sm">
              <div className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                <button
                  type="button"
                  onClick={() => toggleSection(4)}
                  className="flex-1 flex items-center gap-3 text-left cursor-pointer select-none"
                  aria-expanded={openSections[4]}
                >
                  <span className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-white text-sm sm:text-base block">
                      Tabla de Conexión Direccional
                    </span>
                    <span className="text-[11px] text-[#8A95A5] block">
                      Fase Cero → Verbo To Be en Presente
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playSectionAudio(4);
                    }}
                    title="Escuchar explicación de esta sección"
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      activeSectionTitle === '4. Tabla de Conexión'
                        ? 'bg-[#39FF14] text-black font-bold border-[#39FF14]'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10 hover:text-white'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSection(4)}
                    className="p-1 rounded-md text-[#8A95A5] hover:text-white cursor-pointer"
                    aria-label={openSections[4] ? 'Cerrar sección 4' : 'Abrir sección 4'}
                  >
                    {openSections[4] ? (
                      <ChevronDown className="w-5 h-5 text-gray-300 transition-transform" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 transition-transform" />
                    )}
                  </button>
                </div>
              </div>

              {openSections[4] && (
                <div className="p-4 sm:p-5 bg-black/40 border-t border-white/10 space-y-3 animate-fadeIn">
                  <p className="text-gray-300 text-xs sm:text-sm">
                    Esta matriz integra los cimientos de la Fase Cero con la conjugación en tiempo presente:
                  </p>

                  <div className="overflow-x-auto w-full border border-white/10 rounded-xl bg-[#121416]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#1A1D20] text-[#8A95A5] font-mono uppercase text-[10px] border-b border-white/10">
                        <tr>
                          <th className="p-3">CLASIFICACIÓN</th>
                          <th className="p-3">PRONOMBRES</th>
                          <th className="p-3">VERBO</th>
                          <th className="p-3">EJEMPLO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-gray-200">
                        <tr className="hover:bg-blue-950/20">
                          <td className="p-3 font-semibold text-blue-400">Primera Persona (Singular)</td>
                          <td className="p-3 font-mono font-bold text-white">"I"</td>
                          <td className="p-3 font-mono text-[#39FF14] font-bold">"am"</td>
                          <td className="p-3">
                            <span className="font-mono text-[#F7931E] font-bold">"I am a student."</span>{' '}
                            <span className="text-[#8A95A5] text-[11px]">(Yo soy estudiante.)</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-emerald-950/20">
                          <td className="p-3 font-semibold text-green-400">Segundas Personas (Plurales)</td>
                          <td className="p-3 font-mono font-bold text-white">"You, We, They"</td>
                          <td className="p-3 font-mono text-[#39FF14] font-bold">"are"</td>
                          <td className="p-3">
                            <span className="font-mono text-[#F7931E] font-bold">"They are friends."</span>{' '}
                            <span className="text-[#8A95A5] text-[11px]">(Ellos son amigos.)</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-amber-950/20">
                          <td className="p-3 font-semibold text-orange-400">Terceras Personas (Singulares)</td>
                          <td className="p-3 font-mono font-bold text-white">"He, She, It"</td>
                          <td className="p-3 font-mono text-[#39FF14] font-bold">"is"</td>
                          <td className="p-3">
                            <span className="font-mono text-[#F7931E] font-bold">"He is a teacher."</span>{' '}
                            <span className="text-[#8A95A5] text-[11px]">(Él es maestro.)</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Renderizado Estándar para otras clases con resaltado de comillas */
          <div className="space-y-4">
            {activeScriptContent ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                  <span className="text-xs font-mono text-[#F7931E] uppercase tracking-wider font-bold flex items-center gap-1.5">
                    📖 Guion del Teacher — {claseId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTogglePlay(activeScriptContent || undefined, 'Guion ' + claseId)}
                    className="px-2.5 py-1 rounded bg-[#39FF14] text-black font-bold hover:bg-[#32e012] flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-black" />
                    <span>Escuchar</span>
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-gray-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {activeScriptContent}
                </div>
              </div>
            ) : (
              <div
                className="text-sm text-gray-200 leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: explicacion.contenido_html }}
              />
            )}

            {/* Regla de Oro Destacada */}
            {explicacion.reglas_clave && (
              <div className="bg-[#667eea]/15 border border-[#667eea]/40 rounded-xl p-3.5 flex items-start gap-3">
                <Zap className="w-5 h-5 text-[#a5b4fc] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-mono font-bold text-[#a5b4fc] uppercase">Regla de Oro</div>
                  <div className="text-sm text-white font-medium">{explicacion.reglas_clave}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. FOOTER CON REGLA PEDAGÓGICA Y CRITERIOS DE CALIDAD */}
      <div
        className={`p-3.5 sm:p-4 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
          isDark ? 'bg-[#1A1D20]/90 border-[#8A95A5]/20 text-[#8A95A5]' : 'bg-gray-50 border-gray-100 text-gray-600'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Award className="w-4 h-4 text-[#F7931E] shrink-0" />
          <span className="font-semibold text-gray-200">Metodología TecLingo:</span>
          <span>Explicaciones bilingües diseñadas para el nivel A1</span>
        </div>
        <div className="font-mono text-[11px] text-[#39FF14]">
          {explicacion.duracion_lectura_min || 3} min de estudio guiado
        </div>
      </div>
    </div>
  );
};

