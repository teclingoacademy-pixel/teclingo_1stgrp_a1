/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * PresentationResult.tsx
 * Muestra la presentación generada con botón de escuchar y editar.
 */

import { useState } from 'react';
import { Volume2, Edit3, CheckCircle2 } from 'lucide-react';
import type { PresentationData } from '../../services/presentationService';
import { playAudio } from '../../services/workbook/ttsService';

interface Props {
  presentation: PresentationData;
  onEdit: () => void;
}

const SECTION_LABELS = [
  { key: 'section1English', label: '1. Introducción' },
  { key: 'section2English', label: '2. Ocupación y vida' },
  { key: 'section3English', label: '3. Rutina diaria' },
  { key: 'section4English', label: '4. Algo que hiciste' },
  { key: 'section5English', label: '5. Planes futuros' },
] as const;

export function PresentationResult({ presentation, onEdit }: Props) {
  const [playing, setPlaying] = useState(false);

  const handlePlayAll = () => {
    if (playing) return;
    setPlaying(true);
    playAudio(presentation.fullPresentation || '', {
      forceLang: 'en-US',
      onEnd: () => setPlaying(false),
      onError: () => setPlaying(false),
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
          <CheckCircle2 size={14} className="text-green-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-green-400">
            Presentación lista
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
          Tu Presentación en Inglés
        </h2>
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={handlePlayAll}
          disabled={playing}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#22D3EE] hover:bg-[#22D3EE]/90 disabled:opacity-50 text-[#061a1a] font-black uppercase tracking-widest text-xs transition-all cursor-pointer"
        >
          <Volume2 size={16} />
          {playing ? 'Reproduciendo...' : 'Escuchar mi presentación'}
        </button>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-xs transition-all cursor-pointer border border-white/10"
        >
          <Edit3 size={16} />
          Editar
        </button>
      </div>

      <div className="space-y-4">
        {SECTION_LABELS.map(({ key, label }) => {
          const value = presentation[key];
          if (!value) return null;
          return (
            <div key={key} className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#DEFF9A]">
                  {label}
                </span>
                <button
                  onClick={() => playAudio(value, { forceLang: 'en-US' })}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Escuchar sección"
                >
                  <Volume2 size={14} className="text-white/60" />
                </button>
              </div>
              <p className="text-white text-sm leading-relaxed whitespace-pre-line">
                {value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PresentationResult;
