import React, { useState, useEffect } from 'react';
import { Volume2, RotateCcw, CheckCircle2, XCircle, Sparkles, HelpCircle } from 'lucide-react';
import { playAudio, isValidEnglishForTTS } from '@/services/workbook/ttsService';

export interface WritingProps {
  reactivo: any;
  onAnswer: (result: { respuesta: string; correcto: boolean; tipo: string }) => void;
  validationState?: 'unanswered' | 'first_fail' | 'second_fail' | 'correct';
}

/**
 * Obtiene las fichas disponibles según la naturaleza del reactivo de Writing
 */
export const getWritingTokens = (reactivo: any): string[] => {
  // 1. Si opciones_json o opciones ya tiene un arreglo de opciones
  if (Array.isArray(reactivo.opciones) && reactivo.opciones.length > 0) {
    // Si las opciones son oraciones completas, verificar si se pueden descomponer o usar directamente
    return [...reactivo.opciones];
  }

  if (reactivo.opciones_json) {
    try {
      const parsed = typeof reactivo.opciones_json === 'string' 
        ? JSON.parse(reactivo.opciones_json) 
        : reactivo.opciones_json;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return [...parsed];
      }
    } catch {}
  }

  const ans = (reactivo.respuesta_correcta || '').trim();

  // 2. Si la respuesta es una oración (contiene espacios, ej: "She is a teacher.")
  if (ans.includes(' ')) {
    const words = ans.replace(/[.!?]/g, '').split(/\s+/).filter(Boolean);
    // Agregar 1 o 2 distractores contextuales según la oración
    const distractors: string[] = [];
    if (ans.includes('is')) distractors.push('are');
    else if (ans.includes('are')) distractors.push('is');
    if (ans.includes('a') && !ans.includes('an')) distractors.push('an');

    const combined = [...words, ...distractors];
    // Mezclar aleatoriamente
    return combined.sort(() => Math.random() - 0.5);
  }

  // 3. Si la respuesta es un plural o singular (ej: "books", "students")
  if (ans.toLowerCase() === 'books') {
    return ['book', 's', 'es', 'ies'].sort(() => Math.random() - 0.5);
  }
  if (ans.toLowerCase() === 'students') {
    return ['student', 's', 'es', 'ed'].sort(() => Math.random() - 0.5);
  }
  if (ans.toLowerCase() === 'book') {
    return ['books', 'book', 's', 'a'].sort(() => Math.random() - 0.5);
  }

  // 4. Si la respuesta es un pronombre (he, she, it, we, they, you, I)
  const pronouns = ['he', 'she', 'it', 'we', 'they', 'you'];
  if (pronouns.includes(ans.toLowerCase())) {
    return pronouns.sort(() => Math.random() - 0.5);
  }

  // Fallback general: si la respuesta es una palabra, ofrecer la palabra y posibles variaciones
  return [ans, ans + 's', 'the ' + ans].sort(() => Math.random() - 0.5);
};

export const WritingDragDrop: React.FC<WritingProps> = ({ reactivo, onAnswer, validationState }) => {
  const [palabrasDisponibles, setPalabrasDisponibles] = useState<string[]>([]);
  const [zonaRespuesta, setZonaRespuesta] = useState<string[]>([]);
  const [yaRespondio, setYaRespondio] = useState<boolean>(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [isOver, setIsOver] = useState<boolean>(false);

  const respuestaCorrecta = (reactivo.respuesta_correcta || '').trim();

  // Inicializar o reiniciar fichas al cambiar de reactivo
  useEffect(() => {
    const tokens = getWritingTokens(reactivo);
    setPalabrasDisponibles(tokens);
    setZonaRespuesta([]);
    setYaRespondio(false);
  }, [reactivo.reactivo_id]);

  // Actualizar si validationState cambia externamente
  useEffect(() => {
    if (validationState === 'correct') {
      setYaRespondio(true);
    }
  }, [validationState]);

  // Arrastrar (Drag & Drop nativo)
  const handleDragStart = (e: React.DragEvent, index: number, fromZone: 'bank' | 'zone') => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ index, fromZone }));
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data && data.fromZone === 'bank') {
        const item = palabrasDisponibles[data.index];
        if (item !== undefined) {
          setZonaRespuesta((prev) => [...prev, item]);
          setPalabrasDisponibles((prev) => prev.filter((_, i) => i !== data.index));
        }
      }
    } catch {}
    setDraggedItemIndex(null);
  };

  // Tap & Place interactivo (accesible tanto para móvil táctil como para clics rápidos)
  const colocarPalabra = (index: number) => {
    if (yaRespondio) return;
    const item = palabrasDisponibles[index];
    if (item !== undefined) {
      setZonaRespuesta((prev) => [...prev, item]);
      setPalabrasDisponibles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const quitarPalabra = (index: number) => {
    if (yaRespondio) return;
    const item = zonaRespuesta[index];
    if (item !== undefined) {
      setPalabrasDisponibles((prev) => [...prev, item]);
      setZonaRespuesta((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Comparación tolerante (soporta concatenación 'book' + 's' = 'books' o palabras separadas por espacios)
  const validarRespuesta = () => {
    if (zonaRespuesta.length === 0) return;

    // Probar unión con espacios y unión directa sin espacios
    const respConEspacio = zonaRespuesta.join(' ').trim().toLowerCase().replace(/[.!?]/g, '');
    const respSinEspacio = zonaRespuesta.join('').trim().toLowerCase().replace(/[.!?]/g, '');
    const respNormalizada = respuestaCorrecta.toLowerCase().replace(/[.!?]/g, '');

    const esCorrecto = respConEspacio === respNormalizada || respSinEspacio === respNormalizada;

    const textoFinal = respConEspacio === respNormalizada ? zonaRespuesta.join(' ') : zonaRespuesta.join('');

    setYaRespondio(true);
    onAnswer({
      respuesta: textoFinal,
      correcto: esCorrecto,
      tipo: 'writing_drag_drop',
    });
  };

  const reiniciar = () => {
    const tokens = getWritingTokens(reactivo);
    setPalabrasDisponibles(tokens);
    setZonaRespuesta([]);
    setYaRespondio(false);
  };

  // Texto inglés seguro para TTS (nunca leer instrucciones en español)
  const englishAudioText = isValidEnglishForTTS(respuestaCorrecta)
    ? respuestaCorrecta
    : isValidEnglishForTTS(reactivo.frase_traduccion || '')
    ? reactivo.frase_traduccion
    : null;

  return (
    <div className="space-y-4 sm:space-y-5" id="writing-drag-drop-container">
      {/* 1. ENCABEZADO DE INSTRUCCIÓN */}
      <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">✍️</span>
          <div>
            <p className="text-xs sm:text-sm font-bold text-blue-950 font-sans">
              Arrastra o toca las fichas para formar la respuesta:
            </p>
            <p className="text-[11px] text-blue-700">
              Puedes arrastrar las palabras o tocarlas para moverlas a la zona de respuesta.
            </p>
          </div>
        </div>
        {englishAudioText && (
          <button
            type="button"
            onClick={() => playAudio(englishAudioText, { forceLang: 'en-US' })}
            title="Escuchar pronunciación del objetivo en inglés"
            aria-label="Escuchar objetivo en inglés"
            className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. TARJETA DE PREGUNTA / CONTEXTO */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug break-words">
              {reactivo.pregunta_texto}
            </h3>
            {reactivo.frase_traduccion && (
              <p className="text-xs sm:text-sm text-gray-500 italic mt-1 break-words">
                {reactivo.frase_traduccion}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. ZONA DE RESPUESTA (DROP ZONE) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
          <span>Zona de respuesta:</span>
          {zonaRespuesta.length > 0 && !yaRespondio && (
            <span className="text-[11px] text-blue-600 font-sans">Toca una ficha para quitarla</span>
          )}
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            min-h-[85px] border-2 border-dashed rounded-xl p-3.5 sm:p-4 transition-all flex flex-wrap items-center justify-center gap-2
            ${isOver ? 'border-blue-500 bg-blue-50/80 scale-[1.01]' : 'border-gray-300 bg-gray-50/70'}
            ${zonaRespuesta.length > 0 ? 'bg-white border-blue-300 shadow-xs' : ''}
          `}
        >
          {zonaRespuesta.length === 0 ? (
            <div className="text-center py-2 select-none">
              <p className="text-xs sm:text-sm text-gray-400 font-medium">
                Arrastra las palabras aquí o tócalas abajo...
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                (Las fichas se ordenarán en esta caja)
              </p>
            </div>
          ) : (
            zonaRespuesta.map((palabra, index) => (
              <button
                key={`${palabra}-${index}`}
                type="button"
                onClick={() => quitarPalabra(index)}
                disabled={yaRespondio}
                title="Toca para devolver al banco"
                className="group px-3.5 py-2 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border-2 border-blue-400 text-blue-900 rounded-lg font-bold text-sm sm:text-base cursor-pointer shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <span>{palabra}</span>
                {!yaRespondio && (
                  <span className="text-blue-400 group-hover:text-blue-700 text-xs font-mono">×</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 4. BANCO DE PALABRAS / FICHAS DISPONIBLES */}
      <div className="bg-gray-100/90 border border-gray-200 rounded-xl p-3.5 sm:p-4">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2.5">
          Fichas disponibles ({palabrasDisponibles.length}):
        </p>
        <div className="flex flex-wrap gap-2 justify-center min-h-[44px] items-center">
          {palabrasDisponibles.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-1">
              Todas las fichas han sido colocadas en la zona de respuesta.
            </p>
          ) : (
            palabrasDisponibles.map((palabra, index) => (
              <div
                key={`${palabra}-${index}`}
                draggable={!yaRespondio}
                onDragStart={(e) => handleDragStart(e, index, 'bank')}
                onClick={() => colocarPalabra(index)}
                className={`
                  px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-grab active:cursor-grabbing active:scale-95 select-none
                  bg-white border-2 border-gray-300 text-gray-800 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-950
                  ${draggedItemIndex === index ? 'opacity-40' : 'opacity-100'}
                `}
              >
                {palabra}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. BOTONES DE CONTROL */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={validarRespuesta}
          disabled={zonaRespuesta.length === 0 || yaRespondio}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Validar respuesta</span>
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

      {/* 6. FEEDBACK VISUAL INMEDIATO */}
      {yaRespondio && (
        <div
          className={`
            border-2 rounded-xl p-4 animate-fadeIn shadow-xs
            ${
              (zonaRespuesta.join(' ').trim().toLowerCase().replace(/[.!?]/g, '') === respuestaCorrecta.toLowerCase().replace(/[.!?]/g, '') ||
                zonaRespuesta.join('').trim().toLowerCase().replace(/[.!?]/g, '') === respuestaCorrecta.toLowerCase().replace(/[.!?]/g, ''))
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }
          `}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {(zonaRespuesta.join(' ').trim().toLowerCase().replace(/[.!?]/g, '') === respuestaCorrecta.toLowerCase().replace(/[.!?]/g, '') ||
                zonaRespuesta.join('').trim().toLowerCase().replace(/[.!?]/g, '') === respuestaCorrecta.toLowerCase().replace(/[.!?]/g, '')) ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-sm sm:text-base">¡Excelente! Respuesta correcta</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span className="font-bold text-sm sm:text-base">Intento incorrecto</span>
                </>
              )}
            </div>

            {englishAudioText && (
              <button
                type="button"
                onClick={() => playAudio(englishAudioText, { forceLang: 'en-US' })}
                className="text-xs bg-white/80 hover:bg-white border border-current px-2 py-1 rounded-md flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Pronunciación</span>
              </button>
            )}
          </div>

          <div className="mt-2 text-xs sm:text-sm space-y-1">
            <p>
              Respuesta correcta: <strong className="font-mono text-sm underline">{respuestaCorrecta}</strong>
            </p>
            {reactivo.respuesta_explicacion && (
              <p className="text-gray-600 text-xs leading-relaxed mt-1">
                {reactivo.respuesta_explicacion}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingDragDrop;

