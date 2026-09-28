/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { SafeResponsiveContainer } from './SafeResponsiveContainer';
import { Target, Zap, BrainCircuit, TrendingUp, ChevronRight, ShieldCheck, Map as MapIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { GlassCard } from './GlassCard';
import { useAppContext } from '../context/AppContext';
import { useStudentProgress } from '../hooks/useStudentProgress';

interface PDPModuleProps {
  onOpenProgressMap?: () => void;
}

export function PDPModule({ onOpenProgressMap }: PDPModuleProps) {
  const { userEmail } = useAppContext();
  const { data, loading, currentWeek, overallPercent, strongestSkill, weakestSkill } = useStudentProgress(userEmail);

  // Construir data para el radar (0-150)
  const skillOrder = ['SPEAKING', 'LISTENING', 'READING', 'WRITING'];
  const radarData = skillOrder.map((k) => {
    const s = data?.bySkill[k];
    const percent = s?.percent ?? 0;
    return {
      subject: k.charAt(0) + k.slice(1).toLowerCase(),
      A: Math.round((percent / 100) * 150),
      fullMark: 150,
    };
  });

  const strongestName = strongestSkill?.name || 'Sin datos';
  const strongestPct = strongestSkill?.percent ?? 0;
  const weakestName = weakestSkill?.name || 'Sin datos';
  const weakestPct = weakestSkill?.percent ?? 0;

  // Probabilidad de éxito = promedio ponderado de skills + bonus por avance general
  const avgSkills = skillOrder.reduce((acc, k) => acc + (data?.bySkill[k]?.percent ?? 0), 0) / skillOrder.length;
  const successProbability = Math.round((avgSkills * 0.7) + (overallPercent * 0.3));

  // Nivel objetivo en función del avance
  const targetLevel = overallPercent < 20 ? 'A1 (BEGINNER)'
    : overallPercent < 45 ? 'A1.2 (ELEMENTARY)'
    : overallPercent < 70 ? 'A2 (PRE-INTERMEDIATE)'
    : 'B1 (INTERMEDIATE)';

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-[#DEFF9A] text-[10px] font-black uppercase tracking-[0.4em] mb-2">Personal Development Plan</h2>
          <h1 className="text-3xl font-black text-white bevel-text uppercase tracking-tight">Estrategia de Crecimiento AI</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
            <Target className="text-[#DEFF9A]" size={20} />
            <span className="text-xs font-black text-white uppercase tracking-widest">NIVEL OBJETIVO: {targetLevel}</span>
          </div>
          {onOpenProgressMap && (
            <button
              onClick={onOpenProgressMap}
              className="flex items-center gap-2 bg-[#DEFF9A]/10 border border-[#DEFF9A]/30 hover:bg-[#DEFF9A]/20 text-[#DEFF9A] rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest transition cursor-pointer"
            >
              <MapIcon size={16} /> Mission Map
            </button>
          )}
        </div>
      </header>

      {loading && (
        <p className="text-white/40 text-xs font-mono text-center">Cargando progreso...</p>
      )}

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-7">
          <GlassCard title="Mapa de Habilidades TECLINGO" icon={TrendingUp} accent="green">
            <div className="h-[400px] w-full flex items-center justify-center">
              <SafeResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                  <Radar name="Skills" dataKey="A" stroke="#DEFF9A" fill="#DEFF9A" fillOpacity={0.2} />
                </RadarChart>
              </SafeResponsiveContainer>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-white/20 text-[8px] font-black uppercase mb-1">Punto más Fuerte</p>
                <p className="text-[#DEFF9A] text-xs font-black uppercase tracking-widest">{strongestName} ({strongestPct}%)</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-white/20 text-[8px] font-black uppercase mb-1">Área Crítica</p>
                <p className="text-orange-400 text-xs font-black uppercase tracking-widest">{weakestName} ({weakestPct}%)</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-8">
          <GlassCard title="Análisis de Precisión AI" icon={BrainCircuit} accent="cyan">
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#DEFF9A]/5 border border-[#DEFF9A]/10">
                <p className="text-xs font-black text-[#DEFF9A] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Zap size={14} /> Recomendación del Tutor
                </p>
                <p className="text-white/60 text-[11px] leading-relaxed italic border-l-2 border-[#DEFF9A]/40 pl-4">
                  {weakestSkill
                    ? `Detectamos oportunidad de mejora en ${weakestName} (${weakestPct}%). Te recomendamos reforzar con sesiones adicionales antes de continuar con la Semana ${currentWeek}.`
                    : 'Aún no hay suficiente información para darte una recomendación personalizada. Completa tus primeros reactivos.'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-white/40">Probabilidad de Éxito</span>
                  <span className="text-[#22D3EE]">{successProbability}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${successProbability}%` }}
                    className="h-full bg-[#22D3EE] shadow-[0_0_10px_#22D3EE]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className="text-white/30 text-[8px] font-mono uppercase">Semana Actual</p>
                    <p className="text-white text-lg font-black">{currentWeek} / 18</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className="text-white/30 text-[8px] font-mono uppercase">Progreso Global</p>
                    <p className="text-[#DEFF9A] text-lg font-black">{overallPercent}%</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <button
                  onClick={onOpenProgressMap}
                  disabled={!onOpenProgressMap}
                  className="w-full py-4 bg-[#DEFF9A] text-[#061a1a] rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_10_30px_rgba(222,255,154,0.3)] flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  Ir al Mission Map <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </GlassCard>

          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#DEFF9A]/10 to-transparent border border-[#DEFF9A]/20">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck size={20} className="text-[#DEFF9A]" />
              <h4 className="text-white text-[11px] font-black uppercase tracking-widest">Validación de Nivel</h4>
            </div>
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
              Tu progreso está validado bajo el estándar TECLINGO PRO 1.1. Reactivos procesados: {data?.totalSubmissions ?? 0}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}