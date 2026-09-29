import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, X, PenTool, CheckCircle2 } from 'lucide-react';
import { speakText, stopSpeech } from '@/utils/workbook/audioFeedback';

interface WritingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WRITING_TUTORIAL_STORAGE_KEY = 'writing_tutorial_seen';
export const explanationText =
  'Lee la instrucción en español, escucha la pronunciación en inglés con el botón de audio y escribe la respuesta correcta en el campo de texto. Tienes 2 oportunidades para responder.';

export const WritingTutorialModal: React.FC<WritingTutorialModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);


  const audioSpeechText =
    '¡Bienvenido al reto de Dictado Interactivo en Writing! Lee el enunciado en español y presiona el botón de audio para escuchar la palabra en inglés. Luego, escribe la respuesta en el campo de texto y haz clic en Comprobar o presiona Enter. Tienes dos oportunidades para responder correctamente. ¡Mucho éxito!';

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
        localStorage.setItem(WRITING_TUTORIAL_STORAGE_KEY, 'true');
      } else {
        localStorage.setItem(WRITING_TUTORIAL_STORAGE_KEY, 'false');
      }
    } catch (err) {
      console.warn('Error guardando preferencia en localStorage:', err);
    }

    onClose();
  };

  return (
    <div
      id="writing-tutorial-modal-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="writing-tutorial-modal-title"
    >
      <div
        id="writing-tutorial-modal-card"
        className="bg-white rounded-2xl max-w-lg w-full border border-teal-200 shadow-2xl overflow-hidden transform transition-all animate-scaleUp text-left"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 p-5 sm:p-6 text-white relative">
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
              <PenTool className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-teal-200 font-bold block">
                Guía Rápida · Writing
              </span>
              <h2
                id="writing-tutorial-modal-title"
                className="text-lg sm:text-xl font-bold font-sans text-white leading-tight"
              >
                ¿Cómo funciona el Dictado Interactivo?
              </h2>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Mensaje Explicativo Pedagógico */}
          <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-4 text-teal-950 text-sm leading-relaxed">
            <p className="font-semibold text-base text-teal-900 mb-1">
              {explanationText}
            </p>
          </div>

          {/* Botón de Audio TTS con voz en español */}
          <div className="flex items-center justify-start">
            <button
              type="button"
              id="btn-writing-tutorial-audio"
              onClick={handleToggleAudio}
              className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-all shadow-xs cursor-pointer ${
                isPlayingAudio
                  ? 'bg-teal-600 text-white border-teal-700 ring-2 ring-teal-300 animate-pulse'
                  : 'bg-white text-teal-700 hover:bg-teal-50 border-teal-300 hover:border-teal-400'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-4 h-4 text-white animate-bounce shrink-0" />
                  <span>Detener audio explicativo</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>🔊 Escuchar explicación</span>
                </>
              )}
            </button>
          </div>

          {/* Pasos Clave del Andamiaje */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                1
              </span>
              <span>
                <strong>Lee la instrucción:</strong> Observa la frase o prompt en español para comprender qué término se te solicita.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                2
              </span>
              <span>
                <strong>Escucha el audio (🔊):</strong> Haz clic en el botón de audio para escuchar la pronunciación exacta en inglés como pista.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                3
              </span>
              <span>
                <strong>Escribe en el campo de texto:</strong> Escribe la palabra en inglés. No te preocupes por mayúsculas ni espacios extra.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                4
              </span>
              <span>
                <strong>Comprueba tu respuesta:</strong> Presiona el botón <em>Comprobar</em> o la tecla <em>Enter</em>. Tienes 2 oportunidades para acertar.
              </span>
            </div>
          </div>

          {/* Checkbox "No volver a mostrar" */}
          <div className="pt-2 border-t border-gray-100">
            <label className="flex items-center gap-3 cursor-pointer select-none text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <input
                type="checkbox"
                id="checkbox-dont-show-writing-tutorial"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <span>No volver a mostrar este mensaje</span>
            </label>
          </div>
        </div>

        {/* Footer con Botón de Inicio */}
        <div className="bg-gray-50 p-4 sm:p-5 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            id="btn-writing-tutorial-confirm"
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>¡Entendido, comenzar!</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WritingTutorialModal;

