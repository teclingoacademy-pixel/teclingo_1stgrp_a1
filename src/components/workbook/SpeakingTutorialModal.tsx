import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, X, Mic, CheckCircle2 } from 'lucide-react';
import { speakText, stopSpeech } from '@/utils/workbook/audioFeedback';

interface SpeakingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SPEAKING_TUTORIAL_STORAGE_KEY = 'speaking_tutorial_seen';
export const explanationText =
  'Lee la frase en voz alta usando tu micrófono. Puedes escuchar la pronunciación modelo antes de grabar. Tienes 2 oportunidades para pronunciar correctamente.';

export const SpeakingTutorialModal: React.FC<SpeakingTutorialModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);


  const audioSpeechText =
    '¡Bienvenido al reto de Speaking! En este ejercicio practicarás tu pronunciación oral leyendo la frase en voz alta. Puedes presionar Escuchar pronunciación para oír cómo suena la oración correcta antes de hablar. Luego, presiona el botón del micrófono para grabar tu voz. Tienes dos oportunidades para completar cada reto. ¡Mucho éxito!';

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
        localStorage.setItem(SPEAKING_TUTORIAL_STORAGE_KEY, 'true');
      } else {
        localStorage.setItem(SPEAKING_TUTORIAL_STORAGE_KEY, 'false');
      }
    } catch (err) {
      console.warn('Error guardando preferencia en localStorage:', err);
    }

    onClose();
  };

  return (
    <div
      id="speaking-tutorial-modal-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="speaking-tutorial-modal-title"
    >
      <div
        id="speaking-tutorial-modal-card"
        className="bg-white rounded-2xl max-w-lg w-full border border-rose-200 shadow-2xl overflow-hidden transform transition-all animate-scaleUp text-left"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-pink-700 p-5 sm:p-6 text-white relative">
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
              <Mic className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-rose-200 font-bold block">
                Guía Rápida · Speaking
              </span>
              <h2
                id="speaking-tutorial-modal-title"
                className="text-lg sm:text-xl font-bold font-sans text-white leading-tight"
              >
                ¿Cómo funciona el ejercicio de Speaking?
              </h2>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Mensaje Explicativo Pedagógico */}
          <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 text-rose-950 text-sm leading-relaxed">
            <p className="font-semibold text-base text-rose-900 mb-1">
              {explanationText}
            </p>
          </div>

          {/* Botón de Audio TTS con voz en español */}
          <div className="flex items-center justify-start">
            <button
              type="button"
              id="btn-speaking-tutorial-audio"
              onClick={handleToggleAudio}
              className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-all shadow-xs cursor-pointer ${
                isPlayingAudio
                  ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-300 animate-pulse'
                  : 'bg-white text-rose-700 hover:bg-rose-50 border-rose-300 hover:border-rose-400'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-4 h-4 text-white animate-bounce shrink-0" />
                  <span>Detener audio explicativo</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>🔊 Escuchar explicación</span>
                </>
              )}
            </button>
          </div>

          {/* Pasos Clave del Andamiaje */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                1
              </span>
              <span>
                <strong>Escucha la pronunciación (🔊):</strong> Presiona el botón de audio para oír cómo se pronuncia la oración completa antes de grabar.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                2
              </span>
              <span>
                <strong>Presiona Grabar (🎤):</strong> Haz clic en el botón grande del micrófono y dale permiso al navegador si te lo solicita.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                3
              </span>
              <span>
                <strong>Lee en voz alta:</strong> Pronuncia la frase con claridad en inglés. Al terminar de hablar, la app transcribirá y evaluará tu lectura.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                4
              </span>
              <span>
                <strong>2 oportunidades:</strong> Si la pronunciación no coincide a la primera, tendrás un segundo intento para perfeccionarla.
              </span>
            </div>
          </div>

          {/* Checkbox "No volver a mostrar" */}
          <div className="pt-2 border-t border-gray-100">
            <label className="flex items-center gap-3 cursor-pointer select-none text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <input
                type="checkbox"
                id="checkbox-dont-show-speaking-tutorial"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <span>No volver a mostrar este mensaje</span>
            </label>
          </div>
        </div>

        {/* Footer con Botón de Inicio */}
        <div className="bg-gray-50 p-4 sm:p-5 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            id="btn-speaking-tutorial-confirm"
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>¡Entendido, comenzar!</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpeakingTutorialModal;

