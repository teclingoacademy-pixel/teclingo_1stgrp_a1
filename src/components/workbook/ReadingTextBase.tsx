/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Componente ReadingTextBase
 * Muestra el texto base completo al inicio de la sección Reading
 * o en la Fase 1 del ejercicio interactivo con TTS automático y botón Continuar.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { SheetTextoBaseRow } from '@/types/workbook/workbookRows';
import { playAudio, stopAudio } from '@/services/workbook/ttsService';
import { registerAudioElement, unregisterAudioElement } from '@/utils/workbook/audioSupervisor';

export interface ReadingTextBaseProps {
  texto?: SheetTextoBaseRow | null;
  className?: string;
  isSticky?: boolean;
  isPhaseMode?: boolean;
  onContinue?: () => void;
  isTutorialOpen?: boolean;
}

export const ReadingTextBase: React.FC<ReadingTextBaseProps> = ({
  texto,
  className = '',
  isSticky = false,
  isPhaseMode = false,
  onContinue,
  isTutorialOpen = false,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasAudioEnded, setHasAudioEnded] = useState<boolean>(!isPhaseMode);
  const [hasStartedAudio, setHasStartedAudio] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showTranslation, setShowTranslation] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayTriggeredRef = useRef<boolean>(false);

  // Stop audio on unmount or when text changes
  useEffect(() => {
    autoPlayTriggeredRef.current = false;
    return () => {
      stopAudio();
      if (audioRef.current) {
        audioRef.current.pause();
        unregisterAudioElement(audioRef.current);
      }
      setIsPlaying(false);
    };
  }, [texto?.texto_id]);

  const titulo = texto?.titulo_texto || texto?.titulo || 'Reading Comprehension';
  const contenido = texto?.contenido_texto || texto?.contenido || '';
  const palabrasCount = texto?.palabras_count || (contenido ? contenido.trim().split(/\s+/).length : 0);
  const tiempoAudio = texto?.tiempo_audio_seg || Math.max(15, Math.round(palabrasCount * 0.6));
  const audioUrl = texto?.audio_tts_url;

  // Iniciar reproducción de audio con manejo de onEnd
  const handleStartAudio = () => {
    setIsPlaying(true);
    setHasStartedAudio(true);

    // Si tiene URL directa válida de audio MP3 (que no sea un dominio mockup), reproducirla; sino usar SpeechSynthesis natural
    const isDirectMp3 = audioUrl && audioUrl.startsWith('http') && !audioUrl.includes('placeholder') && !audioUrl.includes('teclingo.com') && !audioUrl.includes('example.com');

    if (isDirectMp3) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      registerAudioElement(audio);
      audio.onended = () => {
        setIsPlaying(false);
        setHasAudioEnded(true);
        unregisterAudioElement(audio);
      };
      audio.onerror = () => {
        unregisterAudioElement(audio);
        playAudio(contenido, { forceLang: 'en-US',
          onEnd: () => {
            setIsPlaying(false);
            setHasAudioEnded(true);
          },
          onError: () => {
            setIsPlaying(false);
            setHasAudioEnded(true);
          },
        });
      };
      audio.play().catch(() => {
        unregisterAudioElement(audio);
        playAudio(contenido, { forceLang: 'en-US',
          onEnd: () => {
            setIsPlaying(false);
            setHasAudioEnded(true);
          },
          onError: () => {
            setIsPlaying(false);
            setHasAudioEnded(true);
          },
        });
      });
    } else {
      playAudio(contenido, { forceLang: 'en-US',
        onEnd: () => {
          setIsPlaying(false);
          setHasAudioEnded(true);
        },
        onError: () => {
          setIsPlaying(false);
          setHasAudioEnded(true);
        },
      });
    }
  };

  // TTS Automático: Iniciar la reproducción automáticamente al cargar esta fase (solo 1 vez)
  useEffect(() => {
    if (!isPhaseMode || !contenido || isTutorialOpen) return;
    if (autoPlayTriggeredRef.current) return;
    autoPlayTriggeredRef.current = true;

    const timer = setTimeout(() => {
      handleStartAudio();
    }, 400);

    return () => clearTimeout(timer);
  }, [isPhaseMode, contenido, isTutorialOpen]);

  if (!texto) {
    return null;
  }

  // Toggle manual de audio
  const handleToggleAudio = () => {
    if (isPlaying) {
      stopAudio();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      return;
    }

    handleStartAudio();
  };

  // Transición a la siguiente fase
  const handleContinue = () => {
    stopAudio();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    onContinue?.();
  };

  return (
    <div
      id={`reading-text-base-${texto.clase_id || 'default'}`}
      className={`bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-sm transition-all duration-200 ${
        isSticky ? 'sticky top-2 z-20 backdrop-blur-md bg-blue-50/95' : ''
      } ${className}`}
    >
      {/* Header del texto */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shrink-0">
            📖
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-blue-900 leading-tight">
                {titulo}
              </h2>
              {isPhaseMode ? (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-mono font-bold uppercase shadow-xs">
                  Fase 1: Lectura
                </span>
              ) : (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono font-bold uppercase border border-blue-200">
                  Texto Base
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-blue-700 mt-0.5 font-medium">
              {isPhaseMode
                ? 'Escucha atentamente la lectura completa antes de resolver las preguntas.'
                : 'Lee el texto antes de responder las preguntas'}
            </p>
          </div>
        </div>

        {/* Toggle para colapsar solo en modo no-fase */}
        {!isPhaseMode && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 text-xs font-semibold px-2 py-1 rounded-md hover:bg-blue-100/60 transition-colors cursor-pointer shrink-0"
            aria-label={isExpanded ? 'Minimizar texto' : 'Ver texto completo'}
          >
            {isExpanded ? 'Ocultar ▲' : 'Mostrar texto ▼'}
          </button>
        )}
      </div>

      {/* Contenido del texto base */}
      {isExpanded && (
        <>
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-blue-100 shadow-xs">
            <p className="text-gray-800 text-base sm:text-lg leading-relaxed whitespace-pre-line font-medium selection:bg-blue-200">
              {contenido}
            </p>
          </div>

          {/* Traduccion al espanol (colapsable) */}
          {texto?.translation && (
            <div className='mt-3'>
              <button
                type='button'
                onClick={() => setShowTranslation(!showTranslation)}
                className='text-sm text-blue-600 hover:text-blue-800 font-semibold px-3 py-1.5 rounded-lg bg-blue-100/70 hover:bg-blue-200/70 border border-blue-200 transition-colors cursor-pointer flex items-center gap-1.5'
              >
                {showTranslation ? 'Ocultar traduccion' : 'Ver traduccion en espanol'}
              </button>
              {showTranslation && (
                <div className='mt-2 bg-amber-50 rounded-lg p-4 border border-amber-200'>
                  <p className='text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line italic'>
                    {texto.translation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer con estadísticas, botones de audio y botón Continuar */}
          <div className="mt-5 pt-4 border-t border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Lado izquierdo: Info de palabras y botón de audio */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <span className="text-xs sm:text-sm font-semibold text-blue-800 flex items-center gap-1.5 bg-blue-100/70 px-2.5 py-1.5 rounded-lg">
                <span>📊</span>
                <span>{palabrasCount} palabras</span>
                {tiempoAudio > 0 && <span>· ⏱️ ~{tiempoAudio}s</span>}
              </span>

              {/* Botón de reproducción manual */}
              <button
                type="button"
                onClick={handleToggleAudio}
                id="btn-reading-audio"
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer border ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 ring-2 ring-amber-300 animate-pulse'
                    : 'bg-white hover:bg-blue-50 text-blue-800 border-blue-300'
                }`}
              >
                {isPlaying ? (
                  <>
                    <VolumeX className="w-4 h-4 shrink-0" />
                    <span>Pausar audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 shrink-0 text-blue-600" />
                    <span>{hasStartedAudio ? 'Escuchar de nuevo' : 'Escuchar audio'}</span>
                  </>
                )}
              </button>

              {isPlaying && (
                <span className="text-xs text-blue-700 font-medium flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  Reproduciendo lectura...
                </span>
              )}

              {hasAudioEnded && !isPlaying && isPhaseMode && (
                <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Audio finalizado</span>
                </span>
              )}
            </div>

            {/* Lado derecho: Botón Continuar (Paso 2) */}
            {isPhaseMode && onContinue && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {isPlaying && (
                  <button
                    type="button"
                    onClick={() => {
                      setHasAudioEnded(true);
                      handleContinue();
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline px-2 py-1 cursor-pointer"
                  >
                    Saltar audio
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleContinue}
                  id="btn-reading-continue"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300 scale-100 hover:scale-[1.02] active:scale-95"
                >
                  <span>{hasAudioEnded ? 'Continuar a las preguntas' : 'Continuar a la pregunta'}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReadingTextBase;

