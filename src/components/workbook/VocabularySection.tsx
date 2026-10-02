import React, { useState, useEffect } from 'react';
import { LayoutGrid, Table as TableIcon, Volume2 } from 'lucide-react';
import { playAudio, stopAudio } from '@/services/workbook/ttsService';

export interface VocabItem {
  word: string;
  ipa?: string;
  translation: string;
  example?: string;
  category?: string;
}

interface VocabularyCardProps extends VocabItem {
  onPlay?: (word: string) => void;
  isPlaying?: boolean;
}

export const VocabularyCard: React.FC<VocabularyCardProps> = ({
  word,
  ipa,
  translation,
  example,
  onPlay,
  isPlaying = false,
}) => {
  const handleTriggerAudio = () => {
    if (onPlay) onPlay(word);
    else playAudio(word, { forceLang: 'en-US' });
  };

  return (
    <div
      onClick={handleTriggerAudio}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTriggerAudio();
        }
      }}
      title={`Clic para escuchar pronunciación de "${word}"`}
      className={`border rounded-xl p-3.5 sm:p-4 transition-all duration-200 flex flex-col justify-between group select-none cursor-pointer ${
        isPlaying
          ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-400 shadow-md scale-[1.01]'
          : 'bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 shadow-xs hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors truncate">
            {word}
          </h4>
          {ipa && <p className="text-xs text-emerald-600 font-mono mt-0.5">{ipa}</p>}
        </div>

        {/* Botón de speaker de alta visibilidad: bg-blue-100, text-blue-600, w-5 h-5 */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleTriggerAudio();
          }}
          className={`rounded-full p-2 transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0 ml-1.5 ${
            isPlaying
              ? 'bg-blue-600 text-white shadow-md animate-pulse ring-2 ring-blue-400'
              : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
          }`}
          aria-label={`Escuchar pronunciación de ${word}`}
          title={`Escuchar pronunciación de ${word}`}
        >
          <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-bounce' : ''}`} />
        </button>
      </div>

      <div className="space-y-1 mt-1">
        <p className="text-gray-800 text-xs sm:text-sm font-semibold">{translation}</p>
        {example && (
          <p className="text-gray-500 text-[11px] sm:text-xs italic truncate mt-1">
            "{example}"
          </p>
        )}
      </div>
    </div>
  );
};

interface VocabularyTableProps {
  words: VocabItem[];
  onPlay?: (word: string) => void;
  playingWord?: string | null;
}

export const VocabularyTable: React.FC<VocabularyTableProps> = ({
  words,
  onPlay,
  playingWord,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
      <table className="w-full text-left text-xs sm:text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-gray-700">
            <th className="p-3 font-semibold">Palabra</th>
            <th className="p-3 font-semibold">IPA</th>
            <th className="p-3 font-semibold">Traducción</th>
            <th className="p-3 font-semibold hidden md:table-cell">Ejemplo en Contexto</th>
            <th className="p-3 font-semibold text-center w-28">Audio</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-gray-800">
          {words.map((item, idx) => {
            const isPlaying = playingWord === item.word;
            return (
              <tr
                key={idx}
                className={`transition-colors ${
                  isPlaying ? 'bg-blue-50/80 font-semibold' : 'hover:bg-gray-50'
                }`}
              >
                <td className="p-3 font-bold text-gray-900 whitespace-nowrap">
                  {item.word}
                </td>
                <td className="p-3 text-emerald-600 font-mono text-xs whitespace-nowrap">
                  {item.ipa || '—'}
                </td>
                <td className="p-3 text-gray-700 font-medium">{item.translation}</td>
                <td className="p-3 text-gray-500 text-xs italic hidden md:table-cell max-w-xs truncate">
                  {item.example ? `"${item.example}"` : '—'}
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (onPlay) onPlay(item.word);
                        else playAudio(item.word, { forceLang: 'en-US' });
                      }}
                      className={`rounded-full p-2 transition-all shadow-sm hover:shadow-md cursor-pointer inline-flex items-center justify-center ${
                        isPlaying
                          ? 'bg-blue-600 text-white animate-pulse ring-2 ring-blue-400'
                          : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                      }`}
                      aria-label={`Escuchar pronunciación de ${item.word}`}
                      title={`Pronunciar ${item.word}`}
                    >
                      <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce' : ''}`} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

interface VocabularySectionProps {
  words: VocabItem[];
  onPlayWord?: (word: string) => void;
}

export const VocabularySection: React.FC<VocabularySectionProps> = ({
  words,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  const handlePlayWord = (word: string) => {
    setPlayingWord(word);
    playAudio(word, { forceLang: 'en-US',
      onEnd: () => setPlayingWord((prev) => (prev === word ? null : prev)),
      onError: () => setPlayingWord((prev) => (prev === word ? null : prev)),
    });
  };

  // Stop any active audio when switching views or unmounting (sin reproducción automática)
  useEffect(() => {
    return () => {
      stopAudio();
      setPlayingWord(null);
    };
  }, [viewMode]);

  // Clasificación pedagógica de palabras si existen categorías
  const pronouns = words.filter(
    (w) =>
      w.category === 'pronombre' ||
      w.type === 'pronoun' ||
      ['I', 'You', 'He', 'She', 'It', 'We', 'They'].includes(w.word)
  );

  const nouns = words.filter(
    (w) =>
      w.category === 'sustantivo' ||
      w.type === 'noun'
  );

  const hasCategorization = pronouns.length > 0 && nouns.length > 0;

  return (
    <div className="space-y-4">
      {/* Barra superior con instrucciones y Toggle de vista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <p className="text-xs sm:text-sm text-gray-600">
          Toca cualquier palabra o el botón de bocina <span className="text-blue-600 font-bold">🔊</span> para escuchar la pronunciación con voz natural.
        </p>

        <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tarjetas</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Tabla</span>
          </button>
        </div>
      </div>

      {/* Contenido según vista seleccionada */}
      {viewMode === 'cards' ? (
        <div className="space-y-5">
          {hasCategorization ? (
            <>
              {/* Bloque 1: Pronombres Personales */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-sm font-bold text-blue-700 flex items-center gap-1.5">
                    <span>🔵</span> Pronombres Personales
                  </h4>
                  <span className="text-[11px] font-mono font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {pronouns.length} palabras
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {pronouns.map((item, idx) => (
                    <VocabularyCard
                      key={idx}
                      {...item}
                      onPlay={handlePlayWord}
                      isPlaying={playingWord === item.word}
                    />
                  ))}
                </div>
              </div>

              {/* Bloque 2: Sustantivos Clave */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                    <span>🟢</span> Sustantivos Clave
                  </h4>
                  <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {nouns.length} palabras
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {nouns.map((item, idx) => (
                    <VocabularyCard
                      key={idx}
                      {...item}
                      onPlay={handlePlayWord}
                      isPlaying={playingWord === item.word}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {words.map((item, idx) => (
                <VocabularyCard
                  key={idx}
                  {...item}
                  onPlay={handlePlayWord}
                  isPlaying={playingWord === item.word}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <VocabularyTable
          words={words}
          onPlay={handlePlayWord}
          playingWord={playingWord}
        />
      )}
    </div>
  );
};

export default VocabularySection;

