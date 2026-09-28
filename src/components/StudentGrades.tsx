/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * StudentGrades.tsx
 * Migrado a Prisma (2026-09-28). Lee progreso real desde useStudentProgress.
 * "Evolución de Certificación" queda como demo pendiente de histórico real.
 */

import {
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  GraduationCap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { motion } from 'motion/react';
import { GlassCard } from './GlassCard';
import { SafeResponsiveContainer } from './SafeResponsiveContainer';
import { useAppContext } from '../context/AppContext';
import { useStudentProgress } from '../hooks/useStudentProgress';

// Etiquetas legibles por skill
const SKILL_LABEL: Record<string, { label: string; color: string }> = {
  GRAMMAR:   { label: 'Grammar',   color: 'text-red-400' },
  READING:   { label: 'Reading',   color: 'text-orange-400' },
  LISTENING: { label: 'Listening', color: 'text-purple-400' },
  WRITING:   { label: 'Writing',   color: 'text-cyan-400' },
  SPEAKING:  { label: 'Speaking',  color: 'text-[#DEFF9A]' },
};

const SKILL_ORDER = ['WRITING', 'LISTENING', 'READING', 'GRAMMAR', 'SPEAKING'];

export function StudentGrades() {
  const { userEmail } = useAppContext();
  const { data, loading, overallPercent, currentWeek } = useStudentProgress(userEmail);

  // ─── Skills reales desde Prisma ─────────────────────────
  const skills = SKILL_ORDER.map((key) => {
    const s = data?.bySkill?.[key];
    const pct = s?.percent ?? 0;
    const meta = SKILL_LABEL[key] || { label: key, color: 'text-white' };
    return {
      skill: meta.label,
      score: Math.round((pct / 100) * 10 * 10) / 10, // escala 0-10 con 1 decimal
      max: 10,
      color: meta.color,
      hasData: (s?.total ?? 0) > 0,
    };
  });

  // ─── GPA General (escala 0-10) ──────────────────────────
  const skillsWithData = skills.filter((s) => s.hasData);
  const gpa = skillsWithData.length > 0
    ? Math.round((skillsWithData.reduce((acc, s) => acc + s.score, 0) / skillsWithData.length) * 10) / 10
    : 0;

  // ─── Nivel MCER según progreso global ───────────────────
  const targetLevel =
    overallPercent < 20 ? 'A1-Init'
    : overallPercent < 40 ? 'A1-Mid'
    : overallPercent < 60 ? 'A1-Fin'
    : overallPercent < 80 ? 'A2-Init'
    : 'A2-Now';

  const statusText = overallPercent < 60 ? `EN CURSO ${targetLevel.split('-')[0]}` : `EN CURSO A2`;

  // ─── Rango estudiantil según GPA ────────────────────────
  const rank =
    gpa >= 9.0 ? 'ELITE'
    : gpa >= 8.0 ? 'AVANZADO'
    : gpa >= 7.0 ? 'COMPETENTE'
    : gpa >= 5.0 ? 'EN DESARROLLO'
    : 'INICIAL';

  // % de avance de la boleta (proxy del GPA redondeado a 100)
  const gpaPercent = Math.round((gpa / 10) * 100);
  const strokeDash = `${Math.round((gpaPercent / 100) * 553)} 553`;

  // Evolución demo (pendiente histórico real)
  const performanceData = [
    { level: 'A1-Init', score: Math.min(100, gpaPercent) },
  ];

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-[#DEFF9A] text-[10px] font-black uppercase tracking-[0.4em] mb-2">Boleta de Cristal</h2>
          <h1 className="text-3xl font-black text-white bevel-text uppercase tracking-tight">Mi Histórico Académico</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-white/20 text-[8px] font-black uppercase tracking-widest mb-1">Status de Certificación</p>
            <div className="flex items-center gap-2 text-[#DEFF9A] justify-end">
              <Zap size={18} fill="currentColor" />
              <span className="text-2xl font-black uppercase">{statusText}</span>
            </div>
          </div>
        </div>
      </header>

      {loading && (
        <p className="text-white/40 text-xs font-mono text-center">Cargando progreso desde Prisma...</p>
      )}

      <div className="grid grid-cols-12 gap-8">
        {/* Promedio General Circular */}
        <div className="col-span-12 lg:col-span-4">
          <GlassCard accent="green" className="!p-10 flex flex-col items-center text-center justify-center h-full">
            <div className="relative mb-8">
              <svg className="w-48 h-48 -rotate-90">
                <circle cx="96" cy="96" r="88" className="stroke-white/5 fill-none" strokeWidth="12" />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  className="stroke-[#DEFF9A] fill-none"
                  strokeWidth="12"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 553" }}
                  animate={{ strokeDasharray: strokeDash }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-4xl font-black text-white leading-none">{gpa.toFixed(1)}</p>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">General GPA</p>
              </div>
              <div className="absolute inset-0 bg-[#DEFF9A]/10 blur-[60px] rounded-full -z-10" />
            </div>
            <div className="space-y-2">
              <h4 className="text-white text-lg font-black uppercase tracking-tight">Rango Estudiantil: {rank}</h4>
              <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-loose">
                {skillsWithData.length === 0
                  ? 'Completa tus primeros reactivos para ver tu progreso real.'
                  : `${skillsWithData.length} de 5 habilidades evaluadas · avance global ${overallPercent}%`}
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Matriz de 5 Skills */}
        <div className="col-span-12 lg:col-span-8">
          <GlassCard title="Matriz de Desempeño por Skill" icon={BarChart3} accent="cyan" className="h-full">
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div className="grid grid-cols-[1fr_80px_100px] gap-4 px-6 text-[8px] font-black text-white/20 uppercase tracking-widest border-b border-white/5 pb-4">
                <span>Habilidad Fundamental</span>
                <span className="text-center">Puntaje</span>
                <span className="text-right">Progreso</span>
              </div>
              {skills.map((s) => (
                <div
                  key={s.skill}
                  className="grid grid-cols-[1fr_80px_100px] gap-4 items-center px-6 py-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${s.color.replace('text-', 'bg-')}`} />
                    <span className="text-white text-[10px] font-black uppercase tracking-widest group-hover:text-white transition-colors">
                      {s.skill}
                    </span>
                  </div>
                  <div className="text-center">
                    {s.hasData ? (
                      <span className={`text-xs font-black ${s.color}`}>
                        {s.score.toFixed(1)} <span className="text-white/20">/ {s.max}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-black text-white/20">— / {s.max}</span>
                    )}
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${s.color.replace('text-', 'bg-')}`}
                      style={{ width: `${(s.score / s.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Evolución — DEMO (pendiente histórico real en Prisma) */}
        <div className="col-span-12">
          <GlassCard title="Evolución de Certificación (Vía TECLINGO PRO 1.1)" icon={TrendingUp} accent="green">
            <div className="h-[300px] w-full mt-8">
              <SafeResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="level"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 'black' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0c10',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                    }}
                    itemStyle={{ color: '#DEFF9A', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#DEFF9A"
                    strokeWidth={4}
                    dot={{ fill: '#DEFF9A', r: 6, strokeWidth: 2, stroke: '#061a1a' }}
                    activeDot={{ r: 8, stroke: '#DEFF9A', strokeWidth: 2, fill: '#0a0c10' }}
                  />
                </LineChart>
              </SafeResponsiveContainer>
            </div>
            <p className="mt-4 text-[10px] text-white/40 font-mono text-center italic">
              📊 Histórico por etapa próximamente. Por ahora muestra tu avance global actual.
            </p>
            <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap gap-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#DEFF9A]/10 flex items-center justify-center text-[#DEFF9A]">
                  <Target size={24} />
                </div>
                <div>
                  <p className="text-white text-[10px] font-black uppercase tracking-widest">
                    {currentWeek <= 3 ? 'Semana ' + currentWeek + ' · Fase 1' :
                     currentWeek <= 7 ? 'Semana ' + currentWeek + ' · Fase 2' :
                     currentWeek <= 11 ? 'Semana ' + currentWeek + ' · Fase 3' :
                     'Semana ' + currentWeek + ' · Fase 4'}
                  </p>
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">
                    En curso: {overallPercent}% logrado
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <p className="text-white text-[10px] font-black uppercase tracking-widest">
                    {overallPercent >= 60 ? 'A1 Certified' : 'A1 · En proceso'}
                  </p>
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">
                    {overallPercent >= 60 ? `Cerrado con ${gpa.toFixed(1)} GPA` : `Avance ${overallPercent}% para certificar`}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default StudentGrades;