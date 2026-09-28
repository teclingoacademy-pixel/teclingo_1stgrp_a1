import React, { useState, useEffect } from 'react';
import { Volume2, RotateCcw, CheckCircle2, XCircle, HandMetal, Check } from 'lucide-react';
import { playAudio, isValidEnglishForTTS } from '@/services/workbook/ttsService';
import { getWritingTokens, WritingProps } from './WritingDragDrop';

export const WritingTapPlace: React.FC<WritingProps> = ({ reactivo, onAnswer, validationState }) => {
  const [palabrasDisponibles, setPalabrasDisponibles] = useState<string[]>([]);
  const [palabrasSeleccionadas, setPalabrasSeleccionadas] = useState<string[]>([]);
  const [yaRespondio, setYaRespondio] = useState<boolean>(false);

  const respuestaCorrecta = (reactivo.respuesta_correcta || '').trim();

  useEffect(() => {
    const tokens = getWritingTokens(reactivo);
    setPalabrasDisponibles(tokens);
    setPalabrasSeleccionadas([]);
    setYaRespondio(false);
  }, [reactivo.reactivo_id]);

  useEffect(() => {
    if (validationState === 'correct') {
      setYaRespondio(true);
    }
  }, [validationState]);

  const seleccionarPalabra = (palabra: string, index: number) => {
    if (yaRespondio) return;
    setPalabrasSeleccionadas((prev) => [...prev, palabra]);
    setPalabrasDisponibles((prev) => prev.filter((_, i) => i !== index));
  };

  const quitarPalabra = (index: number) => {
    if (yaRespondio) return;
    const palabra = palabrasSeleccionadas[index];
    if (palabra !== undefined) {
      setPalabrasDisponibles((prev) => [...prev, palabra]);
      setPalabrasSeleccionadas((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const validarRespuesta = () => {
    if (palabrasSeleccionadas.length === 0) return;

    const respConEspacio = palabrasSeleccionadas.join(' ').trim().toLowerCase().replace(/[.!?]/g, '');
    const respSinEspacio = palabrasSeleccionadas.join('').trim().toLowerCase().replace(/[.!?]/g, '');
    const respNormalizada = respuestaCorrecta.toLowerCase().replace(/[.!?]/g, '');

    const esCorrecto = respConEspacio === respNormalizada || respSinEspacio === respNormalizada;
    const textoFinal = respConEspacio === respNormalizada ? palabrasSeleccionadas.join(' ') : palabrasSeleccionadas.join('');

    setYaRespondio(true);
    onAnswer({
      respuesta: textoFinal,
      correcto: esCorrecto,
      tipo: 'writing_tap_place',
    });
  };

  const reiniciar = () => {
    const tokens = getWritingTokens(reactivo);
    setPalabrasDisponibles(tokens);
    setPalabrasSeleccionadas([]);
    setYaRespondio(false);
  };

  const englishAudioText = isValidEnglishForTTS(respuestaCorrecta)
    ? respuestaCorrecta
    : isValidEnglishForTTS(reactivo.frase_traduccion || '')
    ? reactivo.frase_traduccion
    : null;

  return (
    <div className="space-y-4 sm:space-y-5" id="writing-tap-place-container">
      {/* 1. ENCABEZADO DE INSTRUCCIÓN */}
      <div className="bg-indigo-50/90 border border-indigo-200 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">👆</span>
          <div>
            <p className="text-xs sm:text-sm font-bold text-indigo-950 font-sans">
              Toca las palabras/letras en el orden correcto:
            </p>
            <p className="text-[11px] text-indigo-700">
              Toca abajo para colocarlas arriba; toca arriba para devolverlas.
            </p>
          </div>
        </div>
        {englishAudioText && (
          <button
            type="button"
            onClick={() => playAudio(englishAudioText, { forceLang: 'en-US' })}
            title="Escuchar pronunciación del objetivo en inglés"
            aria-label="Escuchar objetivo en inglés"
            className="p-2 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. TARJETA DE PREGUNTA */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug break-words">
          {reactivo.pregunta_texto}
        </h3>
        {reactivo.frase_traduccion && (
          <p className="text-xs sm:text-sm text-gray-500 italic mt-1 break-words">
            {reactivo.frase_traduccion}
          </p>
        )}
      </div>

      {/* 3. ZONA DE RESPUESTA */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
          <span>Tu construcción:</span>
          {palabrasSeleccionadas.length > 0 && !yaRespondio && (
            <span className="text-[11px] text-indigo-600 font-sans">Toca una ficha para quitar</span>
          )}
        </div>

        <div className="bg-gray-50/90 border-2 border-indigo-200/90 rounded-xl p-4 sm:p-5 min-h-[85px] flex flex-wrap gap-2 items-center justify-center transition-all">
          {palabrasSeleccionadas.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-400 text-center font-medium select-none">
              Toca las palabras de la caja inferior para colocarlas aquí...
            </p>
          ) : (
            palabrasSeleccionadas.map((palabra, index) => (
              <button
                key={`${palabra}-${index}`}
                type="button"
                onClick={() => quitarPalabra(index)}
                disabled={yaRespondio}
                title="Toca para remover"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-sm sm:text-base shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>{palabra}</span>
                {!yaRespondio && (
                  <span className="text-indigo-200 text-xs font-mono ml-0.5">✕</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 4. BANCO DE PALABRAS DISPONIBLES */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 text-center">
          Opciones para seleccionar:
        </p>
        <div className="flex flex-wrap gap-2.5 justify-center min-h-[48px] items-center">
          {palabrasDisponibles.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-1">
              Todas las palabras han sido seleccionadas.
            </p>
          ) : (
            palabrasDisponibles.map((palabra, index) => (
              <button
                key={`${palabra}-${index}`}
                type="button"
                disabled={yaRespondio}
                onClick={() => seleccionarPalabra(palabra, index)}
                className="px-4 py-2.5 bg-gray-50 hover:bg-indigo-50 active:bg-indigo-100 border-2 border-gray-300 hover:border-indigo-400 text-gray-800 hover:text-indigo-950 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer min-h-[44px]"
              >
                {palabra}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 5. BOTONES DE ACCIÓN */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={validarRespuesta}
          disabled={palabrasSeleccionadas.length === 0 || yaRespondio}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <Check className="w-4 h-4" />
          <span>Validar</span>
        </button>

        <button
          type="button"
          onClick={reiniciar}
          className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-gray-500" />
          <span>Reiniciar</span>
        </button>
      </div>

      {/* 6. FEEDBACK */}
      {yaRespondio && (
        <div
          className={`
            border-2 rounded-xl p-4 animate-fadeIn shadow-xs
            ${
              (palabrasSeleccionadas.join(' ').trim().toLowerCase().replace(/[.!?]/g, '') === respuestaCorrecta.toLowerCase().replace(/[.!?]/g, '') ||
                palabrasSeleccionadas.join('').trim().toLowerCase().replace(/[.!?]/g, '') === respuestaCorrecta.toLowerCase().replace(/[.!?]/g, ''))
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(palabrasSeleccionadas.join(' ').trim().toLowerCase().replace(/[.!?]/g, '') === respuestaCorrecta.toLowerCase().replace(/[.!?]/g, '') ||
                palabrasSeleccionadas.join('').trim().toLowerCase().replace(/[.!?]/g, '') === respuestaCorrecta.toLowerCase().replace(/[.!?]/g, '')) ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-sm sm:text-base">¡Respuesta correcta!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span className="font-bold text-sm sm:text-base">Respuesta incorrecta</span>
                </>
              )}
            </div>

            {englishAudioText && (
              <button
                type="button"
                onClick={() => playAudio(englishAudioText, { forceLang: 'en-US' })}
                className="text-xs bg-white/80 hover:bg-white border border-current px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio</span>
              </button>
            )}
          </div>

          <div className="mt-2 text-xs sm:text-sm">
            <p>
              Respuesta correcta: <strong className="font-mono text-sm underline">{respuestaCorrecta}</strong>
            </p>
            {reactivo.respuesta_explicacion && (
              <p className="text-gray-600 text-xs mt-1">
                {reactivo.respuesta_explicacion}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingTapPlace;

