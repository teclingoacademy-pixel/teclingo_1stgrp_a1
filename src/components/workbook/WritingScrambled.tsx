import React, { useState, useEffect } from 'react';
import { Volume2, RotateCcw, CheckCircle2, XCircle, Shuffle, Sparkles } from 'lucide-react';
import { playAudio, isValidEnglishForTTS } from '@/services/workbook/ttsService';
import { WritingProps } from './WritingDragDrop';

export const WritingScrambled: React.FC<WritingProps> = ({ reactivo, onAnswer, validationState }) => {
  const respuestaCorrecta = (reactivo.respuesta_correcta || '').trim();

  // Dividir en palabras y desordenar
  const getShuffledWords = () => {
    // Si la respuesta tiene palabras
    const rawWords = respuestaCorrecta.split(/\s+/).filter(Boolean);
    if (rawWords.length <= 1) {
      // Si es una sola palabra, desordenar en caracteres o sílabas
      return respuestaCorrecta.split('');
    }
    // Asegurar que quede desordenado (no igual al original)
    const shuffled = [...rawWords].sort(() => Math.random() - 0.5);
    return shuffled;
  };

  const [palabrasDesordenadas, setPalabrasDesordenadas] = useState<string[]>([]);
  const [palabrasSeleccionadas, setPalabrasSeleccionadas] = useState<string[]>([]);
  const [yaRespondio, setYaRespondio] = useState<boolean>(false);

  useEffect(() => {
    setPalabrasDesordenadas(getShuffledWords());
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
    setPalabrasDesordenadas((prev) => prev.filter((_, i) => i !== index));
  };

  const quitarPalabra = (index: number) => {
    if (yaRespondio) return;
    const palabra = palabrasSeleccionadas[index];
    if (palabra !== undefined) {
      setPalabrasDesordenadas((prev) => [...prev, palabra]);
      setPalabrasSeleccionadas((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const validarRespuesta = () => {
    if (palabrasSeleccionadas.length === 0) return;

    // Comparar tanto espacio como sin espacio
    const respuestaUsuario = palabrasSeleccionadas.join(' ').trim();
    const cleanUser = respuestaUsuario.toLowerCase().replace(/[.!?]/g, '');
    const cleanTarget = respuestaCorrecta.toLowerCase().replace(/[.!?]/g, '');

    const esCorrecto = cleanUser === cleanTarget || palabrasSeleccionadas.join('').toLowerCase().replace(/[.!?]/g, '') === cleanTarget;

    setYaRespondio(true);
    onAnswer({
      respuesta: respuestaUsuario,
      correcto: esCorrecto,
      tipo: 'writing_scrambled',
    });
  };

  const reiniciar = () => {
    setPalabrasDesordenadas(getShuffledWords());
    setPalabrasSeleccionadas([]);
    setYaRespondio(false);
  };

  const englishAudioText = isValidEnglishForTTS(respuestaCorrecta)
    ? respuestaCorrecta
    : isValidEnglishForTTS(reactivo.frase_traduccion || '')
    ? reactivo.frase_traduccion
    : null;

  return (
    <div className="space-y-4 sm:space-y-5" id="writing-scrambled-container">
      {/* 1. ENCABEZADO */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔀</span>
          <div>
            <p className="text-xs sm:text-sm font-bold text-amber-950 font-sans">
              Reordena las palabras para formar la oración:
            </p>
            <p className="text-[11px] text-amber-800">
              Toca cada palabra en la secuencia sintáctica correcta.
            </p>
          </div>
        </div>
        {englishAudioText && (
          <button
            type="button"
            onClick={() => playAudio(englishAudioText, { forceLang: 'en-US' })}
            title="Escuchar oración completa en inglés"
            aria-label="Escuchar pronunciación de la oración"
            className="p-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. PREGUNTA / CONTEXTO */}
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

      {/* 3. ZONA DE CONSTRUCCIÓN */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
          <span>Oración construida:</span>
          {palabrasSeleccionadas.length > 0 && !yaRespondio && (
            <span className="text-[11px] text-amber-700 font-sans">Toca una palabra para retirarla</span>
          )}
        </div>

        <div className="bg-gray-50/90 border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-5 min-h-[85px] flex flex-wrap gap-2 items-center justify-center transition-all">
          {palabrasSeleccionadas.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-400 text-center font-medium select-none">
              Toca las palabras de abajo en orden...
            </p>
          ) : (
            palabrasSeleccionadas.map((palabra, index) => (
              <button
                key={`${palabra}-${index}`}
                type="button"
                onClick={() => quitarPalabra(index)}
                disabled={yaRespondio}
                title="Toca para remover"
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl font-bold text-sm sm:text-base shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>{palabra}</span>
                {!yaRespondio && (
                  <span className="text-amber-200 text-xs font-mono ml-0.5">✕</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 4. PALABRAS DESORDENADAS */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 text-center">
          Palabras desordenadas:
        </p>
        <div className="flex flex-wrap gap-2.5 justify-center min-h-[48px] items-center">
          {palabrasDesordenadas.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-1">
              Todas las palabras han sido ordenadas arriba.
            </p>
          ) : (
            palabrasDesordenadas.map((palabra, index) => (
              <button
                key={`${palabra}-${index}`}
                type="button"
                disabled={yaRespondio}
                onClick={() => seleccionarPalabra(palabra, index)}
                className="px-4 py-2.5 bg-gray-50 hover:bg-amber-50 active:bg-amber-100 border-2 border-gray-300 hover:border-amber-400 text-gray-800 hover:text-amber-950 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer min-h-[44px]"
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
          <CheckCircle2 className="w-4 h-4" />
          <span>Validar oración</span>
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

      {/* 6. FEEDBACK VISUAL */}
      {yaRespondio && (
        <div
          className={`
            border-2 rounded-xl p-4 animate-fadeIn shadow-xs
            ${
              palabrasSeleccionadas.join(' ').trim().toLowerCase().replace(/[.!?]/g, '') === respuestaCorrecta.toLowerCase().replace(/[.!?]/g, '')
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {palabrasSeleccionadas.join(' ').trim().toLowerCase().replace(/[.!?]/g, '') === respuestaCorrecta.toLowerCase().replace(/[.!?]/g, '') ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-sm sm:text-base">¡Oración correcta!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span className="font-bold text-sm sm:text-base">Orden incorrecto</span>
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
              Oración esperada: <strong className="font-mono text-sm underline">{respuestaCorrecta}</strong>
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

export default WritingScrambled;

