/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * PresentationForm.tsx
 * Formulario para que el alumno escriba su presentación personal en español.
 */

import { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';

interface Props {
  onSubmit: (sections: {
    section1Spanish: string;
    section2Spanish: string;
    section3Spanish: string;
    section4Spanish: string;
    section5Spanish: string;
  }) => Promise<void>;
  loading: boolean;
  initialValues?: {
    section1Spanish?: string;
    section2Spanish?: string;
    section3Spanish?: string;
    section4Spanish?: string;
    section5Spanish?: string;
  };
}

const SECTIONS = [
  { key: 'section1Spanish', label: '1. Introducción', placeholder: 'Hola, me llamo... tengo ... años. Soy de ...' },
  { key: 'section2Spanish', label: '2. Ocupación y vida', placeholder: 'Soy estudiante/trabajo en... Vivo en...' },
  { key: 'section3Spanish', label: '3. Rutina diaria', placeholder: 'Todos los días me levanto a las...' },
  { key: 'section4Spanish', label: '4. Algo que hiciste', placeholder: 'La semana pasada...' },
  { key: 'section5Spanish', label: '5. Planes futuros', placeholder: 'El próximo mes voy a...' },
] as const;

export function PresentationForm({ onSubmit, loading, initialValues }: Props) {
  const [sections, setSections] = useState({
    section1Spanish: initialValues?.section1Spanish || '',
    section2Spanish: initialValues?.section2Spanish || '',
    section3Spanish: initialValues?.section3Spanish || '',
    section4Spanish: initialValues?.section4Spanish || '',
    section5Spanish: initialValues?.section5Spanish || '',
  });

  const handleChange = (key: keyof typeof sections, value: string) => {
    setSections(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    await onSubmit(sections);
  };

  const isEmpty = Object.values(sections).every(v => !v.trim());

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DEFF9A]/10 border border-[#DEFF9A]/30">
          <Sparkles size={14} className="text-[#DEFF9A]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#DEFF9A]">
            Proyecto Final MCER A1
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
          Mi Presentación
        </h2>
        <p className="text-white/50 text-sm max-w-lg mx-auto">
          Escribe en español lo que quieres decir en tu presentación.
          La IA lo traducirá al inglés para que puedas practicarlo.
        </p>
      </div>

      <div className="space-y-5">
        {SECTIONS.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-white/70">
              {label}
            </label>
            <textarea
              value={sections[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#DEFF9A]/50 transition-colors resize-none"
              disabled={loading}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <button
          onClick={handleSubmit}
          disabled={loading || isEmpty}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#DEFF9A] hover:bg-[#DEFF9A]/90 disabled:bg-white/10 disabled:text-white/30 text-[#061a1a] font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-[#DEFF9A]/20 hover:scale-105 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Traduciendo...
            </>
          ) : (
            <>
              <Send size={18} />
              Generar mi presentación
            </>
          )}
        </button>
      </div>

      {loading && (
        <p className="text-center text-white/40 text-xs">
          La IA está traduciendo las 5 secciones. Esto puede tardar 15-30 segundos.
        </p>
      )}
    </div>
  );
}

export default PresentationForm;
