import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, X, HelpCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { speakText, stopSpeech } from '@/utils/workbook/audioFeedback';

interface GrammarTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GRAMMAR_TUTORIAL_STORAGE_KEY = 'grammar_tutorial_seen';
export const TUTORIAL_TEXT = '¡Bienvenido! En este ejercicio debes seleccionar la respuesta correcta. Tienes 2 oportunidades para responder. Si necesitas ayuda, puedes usar el botón de audio para escuchar la frase completa. ¡Mucho éxito!';
export const TUTORIAL_EYEBROW = 'Guía Rápida · Ejercicios de Grammar';
export const TUTORIAL_TITLE = '¿Cómo funciona este ejercicio?';

export const GrammarTutorialModal: React.FC<GrammarTutorialModalProps> = ({ isOpen, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const explanationText =
    '¡Bienvenido! En este ejercicio debes seleccionar la respuesta correcta. Tienes 2 oportunidades para responder. Si necesitas ayuda, puedes usar el botón de audio para escuchar la frase completa. ¡Mucho éxito!';

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
      speakText(explanationText, {
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
    if (dontShowAgain) {
      try {
        localStorage.setItem(GRAMMAR_TUTORIAL_STORAGE_KEY, 'true');
      } catch (err) {
        console.warn('Error guardando preferencia en localStorage:', err);
      }
    } else {
      try {
        localStorage.setItem(GRAMMAR_TUTORIAL_STORAGE_KEY, 'false');
      } catch (err) {
        console.warn('Error guardando preferencia en localStorage:', err);
      }
    }

    onClose();
  };

  return (
    <div
      id="grammar-tutorial-modal-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-modal-title"
    >
      <div
        id="grammar-tutorial-modal-card"
        className="bg-white rounded-2xl max-w-lg w-full border border-blue-200 shadow-2xl overflow-hidden transform transition-all animate-scaleUp text-left"
      >
        {/* Header con gradiente suave */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 sm:p-6 text-white relative">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar ventana de ayuda"
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-blue-200 font-bold block">
                Guía Rápida · Ejercicios de Grammar
              </span>
              <h2 id="tutorial-modal-title" className="text-lg sm:text-xl font-bold font-sans text-white leading-tight">
                ¿Cómo funciona este ejercicio?
              </h2>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Mensaje Explicativo Pedagógico */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 text-gray-800 text-sm leading-relaxed">
            <p className="font-medium text-blue-950">
              {explanationText}
            </p>
          </div>

          {/* Botón de Audio TTS con voz natural */}
          <div className="flex items-center justify-start">
            <button
              type="button"
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
                  <span>🔊 Escuchar explicación en audio</span>
                </>
              )}
            </button>
          </div>

          {/* Puntos Clave resumidos */}
          <div className="space-y-2.5 pt-2 border-t border-gray-100">
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-gray-900">Selecciona la respuesta correcta:</strong> Lee la frase o escucha el audio y pulsa la opción correspondiente.
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-gray-900">Tienes 2 oportunidades:</strong> Si te equivocas en el primer intento, la app te dará una segunda oportunidad para acertar.
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-gray-900">Audio natural 🔊:</strong> Cada reactivo de gramática reproduce su pronunciación en inglés para entrenar tu oído.
              </div>
            </div>
          </div>
        </div>

        {/* Footer con Checkbox y Botón de Acción */}
        <div className="bg-gray-50/90 border-t border-gray-200 px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Checkbox "No volver a mostrar" */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs sm:text-sm text-gray-700 hover:text-gray-900">
            <input
              type="checkbox"
              id="no-volver-a-mostrar-checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
            />
            <span className="font-medium">No volver a mostrar</span>
          </label>

          {/* Botón principal de cierre */}
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1.5"
          >
            <span>¡Entendido, comenzar!</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrammarTutorialModal;

