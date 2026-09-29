import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, X, Headphones, CheckCircle2 } from 'lucide-react';
import { speakText, stopSpeech } from '@/utils/workbook/audioFeedback';

interface ListeningTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LISTENING_TUTORIAL_STORAGE_KEY = 'listening_tutorial_seen';
export const explanationText =
  'Escucha la oración completa con el botón de audio y selecciona la palabra que completa el espacio en blanco (___). Tienes 2 oportunidades para responder.';

export const ListeningTutorialModal: React.FC<ListeningTutorialModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);


  const audioSpeechText =
    '¡Bienvenido al reto Listening Cloze! Escucha con atención la oración completa usando el botón de audio y selecciona la palabra correcta que completa el espacio en blanco. Tienes dos oportunidades para responder correctamente. ¡Mucho éxito!';

  // Reset local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDontShowAgain(false);
      setIsPlayingAudio(false);
    } else {
      stopSpeech();
      setIsPlayingAudio(false);
    }
  }, [isOpen]);

  // Clean up audio if component unmounts
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  if (!isOpen) return null;

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      speakText(audioSpeechText, {
        lang: 'es-MX',
        rate: 0.92,
        onStart: () => setIsPlayingAudio(true),
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    }
  };

  const handleClose = () => {
    stopSpeech();
    setIsPlayingAudio(false);

    // Guardar en localStorage según el estado del checkbox
    try {
      if (dontShowAgain) {
        localStorage.setItem(LISTENING_TUTORIAL_STORAGE_KEY, 'true');
      } else {
        localStorage.setItem(LISTENING_TUTORIAL_STORAGE_KEY, 'false');
      }
    } catch (err) {
      console.warn('Error guardando preferencia en localStorage:', err);
    }

    onClose();
  };

  return (
    <div
      id="listening-tutorial-modal-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listening-tutorial-modal-title"
    >
      <div
        id="listening-tutorial-modal-card"
        className="bg-white rounded-2xl max-w-lg w-full border border-blue-200 shadow-2xl overflow-hidden transform transition-all animate-scaleUp text-left"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-5 sm:p-6 text-white relative">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar ventana de ayuda"
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <Headphones className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-blue-200 font-bold block">
                Guía Rápida · Listening Cloze
              </span>
              <h2 id="listening-tutorial-modal-title" className="text-lg sm:text-xl font-bold font-sans text-white leading-tight">
                ¿Cómo funciona el ejercicio de Listening?
              </h2>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Mensaje Explicativo Pedagógico */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 text-blue-950 text-sm leading-relaxed">
            <p className="font-semibold text-base text-blue-900 mb-1">
              {explanationText}
            </p>
          </div>

          {/* Botón de Audio TTS con voz en español */}
          <div className="flex items-center justify-start">
            <button
              type="button"
              id="btn-listening-tutorial-audio"
              onClick={handleToggleAudio}
              className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-all shadow-xs cursor-pointer ${
                isPlayingAudio
                  ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300 animate-pulse'
                  : 'bg-white text-blue-700 hover:bg-blue-50 border-blue-300 hover:border-blue-400'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-4 h-4 text-white animate-bounce shrink-0" />
                  <span>Detener audio explicativo</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>🔊 Escuchar explicación</span>
                </>
              )}
            </button>
          </div>

          {/* Pasos Clave del Andamiaje */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                1
              </span>
              <span>
                <strong>Escucha la oración (🔊):</strong> Haz clic en el botón principal para escuchar la oración completa en inglés natural con la pronunciación correcta.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                2
              </span>
              <span>
                <strong>Completa el espacio en blanco (___):</strong> Observa la oración escrita y elige la opción que corresponde a la palabra faltante.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                3
              </span>
              <span>
                <strong>2 oportunidades:</strong> Tienes 2 oportunidades. Si necesitas volver a escuchar, puedes presionar "Repetir audio" en cualquier momento.
              </span>
            </div>
          </div>

          {/* Checkbox "No volver a mostrar" */}
          <div className="pt-2 border-t border-gray-100">
            <label className="flex items-center gap-3 cursor-pointer select-none text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <input
                type="checkbox"
                id="checkbox-dont-show-listening-tutorial"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>No volver a mostrar este mensaje</span>
            </label>
          </div>
        </div>

        {/* Footer con Botón de Inicio */}
        <div className="bg-gray-50 p-4 sm:p-5 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            id="btn-listening-tutorial-confirm"
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>¡Entendido, comenzar!</span>
          </button>
        </div>
      </div>
    </div>
  );
};

