/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Panel Director: Modelo de Produccion Final A1+
 */

import { BookOpen, Layers, Table2, Library, CheckCircle2, Circle } from 'lucide-react';
import { GlassCard } from './GlassCard';
import {
  MODEL_TEXTS,
  GRAMMAR_BLOCKS,
  STRUCTURE_MATRIX,
  VOCAB_CATALOG,
} from '../data/modeloProduccionA1Plus';

export function DirectorModeloA1Plus() {
  return (
    <div className="space-y-8 text-left animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/30 via-[#0a1a20]/20 to-transparent border border-cyan-500/25 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-cyan-500/10 text-cyan-400 font-mono text-[9px] font-black px-2.5 py-1 rounded border border-cyan-500/20 uppercase tracking-widest">
            Referencia Pedagogica Oficial
          </span>
          <span className="text-white/40 text-[10px] font-mono">• MCER A1+ · Fast Track TOEFL</span>
        </div>
        <h2 className="text-xl md:text-3xl font-black text-white uppercase italic tracking-tight mb-2">
          MODELO DE PRODUCCION FINAL
        </h2>
        <p className="text-xs text-white/50 max-w-2xl leading-relaxed">
          Todo el contenido del curso (ejercicios, vocabulario, examenes) debe alinearse a estos 3 textos modelo.
          Cualquier desviacion rompe la coherencia pedagogica del programa.
        </p>
      </div>

      {/* SECCION 1: TEXTOS MODELO */}
      <GlassCard title="3 Textos Modelo — Perfiles Distintos, Misma Estructura" icon={BookOpen} accent="cyan">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
          {MODEL_TEXTS.map((t) => (
            <div key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex flex-col">
              <div className="mb-3">
                <span className="text-[8px] font-mono font-black text-cyan-400 uppercase tracking-widest">
                  {t.profile}
                </span>
                <h3 className="text-sm font-black text-white uppercase mt-1 leading-tight">
                  {t.title}
                </h3>
                <p className="text-[10px] text-white/40 italic mt-1">{t.theme}</p>
              </div>
              <div className="flex-1 text-[11px] text-white/70 leading-relaxed whitespace-pre-line border-l-2 border-cyan-500/30 pl-3">
                {t.text}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* SECCION 2: 4 BLOQUES */}
      <GlassCard title="4 Bloques Gramaticales Comunes (misma secuencia en los 3 textos)" icon={Layers} accent="green">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {GRAMMAR_BLOCKS.map((b) => (
            <div key={b.number} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#DEFF9A]/15 border border-[#DEFF9A]/30 flex items-center justify-center text-[#DEFF9A] font-black">
                    {b.number}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-tight">{b.name}</h4>
                    <p className="text-[9px] text-white/40 italic">{b.purpose}</p>
                  </div>
                </div>
                <span className="text-[8px] font-mono font-black px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 uppercase tracking-wider whitespace-nowrap">
                  {b.mcer}
                </span>
              </div>
              <ul className="space-y-1.5">
                {b.structures.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[10.5px] text-white/65">
                    <span className="text-[#DEFF9A] font-black shrink-0">·</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* SECCION 3: MATRIZ */}
      <GlassCard title="Matriz de Estructuras — Que aparece en cada texto" icon={Table2} accent="cyan">
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-[10.5px] font-mono">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="py-2 pr-3 text-white/40 font-black uppercase tracking-wider">Estructura</th>
                <th className="py-2 px-2 text-white/40 font-black uppercase tracking-wider text-center">Bloque</th>
                <th className="py-2 px-2 text-white/40 font-black uppercase tracking-wider text-center">MCER</th>
                <th className="py-2 px-2 text-white/40 font-black uppercase tracking-wider text-center">T1</th>
                <th className="py-2 px-2 text-white/40 font-black uppercase tracking-wider text-center">T2</th>
                <th className="py-2 px-2 text-white/40 font-black uppercase tracking-wider text-center">T3</th>
              </tr>
            </thead>
            <tbody>
              {STRUCTURE_MATRIX.map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-2 pr-3 text-white/80">{row.structure}</td>
                  <td className="py-2 px-2 text-center text-cyan-400 font-black">{row.block}</td>
                  <td className="py-2 px-2 text-center">
                    <span className={'px-2 py-0.5 rounded text-[9px] font-black ' + (row.mcer === 'A1' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400')}>
                      {row.mcer}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    {row.t1 ? <CheckCircle2 className="inline w-3.5 h-3.5 text-[#DEFF9A]" /> : <Circle className="inline w-3.5 h-3.5 text-white/15" />}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {row.t2 ? <CheckCircle2 className="inline w-3.5 h-3.5 text-[#DEFF9A]" /> : <Circle className="inline w-3.5 h-3.5 text-white/15" />}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {row.t3 ? <CheckCircle2 className="inline w-3.5 h-3.5 text-[#DEFF9A]" /> : <Circle className="inline w-3.5 h-3.5 text-white/15" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* SECCION 4: VOCABULARIO */}
      <GlassCard title="Catalogo de Vocabulario — 54 terminos por bloque" icon={Library} accent="green">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {Object.entries(VOCAB_CATALOG).map(([blockNum, terms]) => {
            const block = GRAMMAR_BLOCKS.find(b => b.number === Number(blockNum));
            return (
              <div key={blockNum} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                  <div className="w-6 h-6 rounded-lg bg-[#DEFF9A]/15 border border-[#DEFF9A]/30 flex items-center justify-center text-[#DEFF9A] text-[10px] font-black">
                    {blockNum}
                  </div>
                  <h4 className="text-[10px] font-black text-white uppercase tracking-wider leading-tight">
                    {block?.name || 'Bloque'}
                  </h4>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {terms.map((term, i) => (
                    <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
