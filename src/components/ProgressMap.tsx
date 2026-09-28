/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useMemo, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Trophy, Lock, Check, Sparkles, Target, ChevronRight, Star, Crown, Compass, Zap, Calendar, BookOpen, FileCheck2 } from 'lucide-react';
import type { SemanaMalla } from '../types/workbook/malla';
import { useStudentProgress } from '../hooks/useStudentProgress';
import { useStudyPlan } from '../hooks/useStudyPlan';

interface ProgressMapProps {
  studentEmail?: string;
  currentWeek?: number;
  onBackToPDP?: () => void;
  onSelectClass?: (claseId: string) => void;
}

type NodeStatus = 'COMPLETED' | 'CURRENT' | 'LOCKED';

export function ProgressMap({ studentEmail, currentWeek: propCurrentWeek, onBackToPDP, onSelectClass }: ProgressMapProps) {
  const { currentWeek: derivedWeek, overallPercent, completedWeeks, data } = useStudentProgress(studentEmail);
  const { weeks: apiWeeks, loading: weeksLoading } = useStudyPlan('S01');
  const weeks: SemanaMalla[] = useMemo(() => {
    return (apiWeeks || []).slice(0, 15).map((w: any) => ({
      semana: w.semana,
      fechas: w.fechas || '',
      eje_tematico: w.eje_tematico || w.ejeTematico || '',
      unidad_libro: w.unidad_libro || w.unidadLibro || '',
      paginas: w.paginas || '',
      kpi: w.kpi || '',
      horas: (w.horas || []).map((h: any) => ({
        hora: h.hora,
        leccion: h.leccion,
        enfoque: h.enfoque,
      })),
    }));
  }, [apiWeeks]);
  const currentWeek = propCurrentWeek ?? derivedWeek;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = scrollRef.current;
    if (!c || !currentWeek) return;
    const timer = setTimeout(() => {
      const target = c.querySelector('[data-week="' + currentWeek + '"]') as HTMLElement | null;
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
    return () => clearTimeout(timer);
  }, [currentWeek]);

  // FIX 2026-09-28: IDs migrados a N1-CXX. Mapeo real de semana → lecciones.
  const WEEK_TO_LESSONS: Record<number, string[]> = {
    1:  ['N1-C00', 'N1-C01'],
    2:  ['N1-C02', 'N1-C03'],
    3:  ['N1-C04', 'N1-C05'],
    4:  [],
    5:  ['N1-C06', 'N1-C07'],
    6:  ['N1-C08', 'N1-C09'],
    7:  ['N1-C10', 'N1-C11'],
    8:  [],
    9:  ['N1-C12', 'N1-C13'],
    10: ['N1-C14', 'N1-C15'],
    11: ['N1-C16', 'N1-C17'],
    12: ['N1-C18', 'N1-C19'],
    13: ['N1-C20', 'N1-C21'],
    14: ['N1-C25', 'N1-C26'],
    15: ['N1-C28', 'N1-C29'],
  };
  const EXAM_WEEKS = [4, 8, 14];
  const CLOSING_WEEK = 15;

  const getProgress = (weekNum: number): number => {
    const lessons = WEEK_TO_LESSONS[weekNum] || [];
    if (lessons.length === 0) return 0;
    const sum = lessons.reduce((acc, lid) => acc + (data?.byLesson?.[lid]?.percent ?? 0), 0);
    return Math.round(sum / lessons.length);
  };

  // Fase Cero obligatoria: bloquea todo hasta completarla
  const c00Percent = data?.byLesson?.['N1-C00']?.percent ?? 0;
  const c00Done = c00Percent >= 100;

  const getStatus = (weekNum: number): NodeStatus => {
    if (!c00Done && weekNum !== 1) return 'LOCKED';
    const prog = getProgress(weekNum);
    if (prog >= 100 || completedWeeks.includes(weekNum)) return 'COMPLETED';
    if (weekNum === currentWeek) return 'CURRENT';
    if (weekNum < currentWeek) return 'COMPLETED';
    return 'LOCKED';
  };

  const completedCount = weeks.filter(w => getStatus(w.semana) === 'COMPLETED').length;
  const xpTotal = Object.values(data?.byLesson ?? {}).reduce((acc, l) => acc + (l.points ?? 0), 0);

  return (
    <div className="relative w-full h-full bg-[#050a0d] text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[#38BDF8]/5 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#00F5D4]/5 blur-[120px]" />
      </div>

      <div className="relative z-30 sticky top-0 backdrop-blur-xl bg-[#050a0d]/85 border-b border-[#00F5D4]/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              {onBackToPDP && (
                <button
                  onClick={onBackToPDP}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest transition cursor-pointer"
                >
                  <ChevronRight size={12} className="rotate-180" />
                  PDP
                </button>
              )}
              <div>
                <p className="text-[#00F5D4] text-[9px] font-black uppercase tracking-[0.4em]">Ascension Elite</p>
                <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tight italic leading-none">
                  MISSION <span className="text-[#00F5D4]">MAP</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <HudStat icon={<Compass size={12} />} value={completedCount + "/" + weeks.length} label="Semanas" color="#00F5D4" />
              <HudStat icon={<Zap size={12} />} value={String(xpTotal)} label="XP" color="#38BDF8" />
              <HudStat icon={<Target size={12} />} value={overallPercent + "%"} label="Avance" color="#FBBF24" />
            </div>
          </div>

          <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] via-[#00F5D4] to-[#DEFF9A] shadow-[0_0_10px_rgba(0,245,212,0.6)] transition-all duration-1000"
              style={{ width: overallPercent + "%" }}
            />
          </div>

          {!c00Done && (
            <div className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3 sm:p-4 flex items-start gap-3">
              <Lock size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                  Fase Cero Obligatoria
                </p>
                <p className="text-[10px] font-medium text-white/60 leading-relaxed mt-0.5">
                  Antes de acceder a las 15 semanas debes completar la Fase Cero ({c00Percent}%).
                  Toca la Semana 01 para comenzar.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="relative z-20 h-[calc(100%-140px)] overflow-y-auto custom-scrollbar">
        <div className="relative max-w-3xl mx-auto py-10 px-4">
          {weeks.map((w, i) => {
            const status = getStatus(w.semana);
            const progress = getProgress(w.semana);
            const prevUnit = i > 0 ? weeks[i - 1].unidad_libro : null;
            const showUnitHeader = w.unidad_libro !== prevUnit;
            return (
              <div key={w.semana}>
                {showUnitHeader && <UnitHeader nombre={w.unidad_libro} />}
                <WeekCard
                  week={w}
                  status={status}
                  progress={progress}
                  isExam={EXAM_WEEKS.includes(w.semana)}
                  isClosing={w.semana === CLOSING_WEEK}
                  onClick={onSelectClass && (WEEK_TO_LESSONS[w.semana]?.[0]) ? () => onSelectClass(WEEK_TO_LESSONS[w.semana][0]) : undefined}
                />
              </div>
            );
          })}

          <TreasureEnd unlocked={completedCount === weeks.length} />
        </div>
      </div>
    </div>
  );
}

function HudStat({ icon, value, label, color }: { icon: ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
      <span style={{ color }}>{icon}</span>
      <div className="flex flex-col leading-none">
        <span className="text-[10px] font-black" style={{ color }}>{value}</span>
        <span className="text-[7px] font-mono uppercase text-white/40 tracking-widest">{label}</span>
      </div>
    </div>
  );
}

function UnitHeader({ nombre }: { nombre: string }) {
  return (
    <div className="relative flex items-center gap-3 my-8 first:mt-0">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#00F5D4]/40 to-transparent" />
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/30">
        <BookOpen size={11} className="text-[#00F5D4]" />
        <span className="text-[9px] font-black uppercase tracking-widest text-[#00F5D4]">{nombre}</span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#00F5D4]/40 to-transparent" />
    </div>
  );
}

function WeekCard({ week, status, progress, isExam, isClosing, onClick }: {
  week: SemanaMalla;
  status: NodeStatus;
  progress: number;
  isExam?: boolean;
  isClosing?: boolean;
  onClick?: () => void;
}) {
  const isCompleted = status === 'COMPLETED';
  const isCurrent = status === 'CURRENT';
  const isLocked = status === 'LOCKED';

  const color = isCompleted ? '#00F5D4' : isCurrent ? '#38BDF8' : '#4B5563';
  const statusLabel = isCompleted ? 'Completada' : isCurrent ? 'En curso' : 'Bloqueada';

  return (
    <motion.div
      data-week={week.semana}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      onClick={!isLocked && onClick ? onClick : undefined}
      whileHover={!isLocked && onClick ? { scale: 1.01, y: -2 } : undefined}
      whileTap={!isLocked && onClick ? { scale: 0.995 } : undefined}
      className={"relative rounded-3xl border-2 p-5 sm:p-6 mb-4 transition-all " + (
        isCompleted
          ? "bg-gradient-to-br from-[#00F5D4]/8 to-transparent border-[#00F5D4]/40"
          : isCurrent
          ? "bg-gradient-to-br from-[#38BDF8]/10 to-transparent border-[#38BDF8]/50 shadow-[0_0_30px_rgba(56,189,248,0.15)]"
          : "bg-white/[0.02] border-white/5 opacity-55"
      ) + (!isLocked && onClick ? " cursor-pointer hover:shadow-[0_0_25px_rgba(0,245,212,0.15)]" : "")}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shrink-0"
            style={{
              backgroundColor: color + "22",
              borderColor: color + "66",
              border: "2px solid " + color + "66",
              color,
            }}
          >
            {isLocked ? <Lock size={18} /> : isCompleted ? <Check size={22} strokeWidth={3} /> : week.semana}
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: isLocked ? "#6B7280" : color }}>
              Semana {String(week.semana).padStart(2, "0")} · {week.fechas}
            </p>
            <p className="text-[8px] font-mono uppercase tracking-widest text-white/30 mt-0.5">
              {week.paginas}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isExam && (
            <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border whitespace-nowrap bg-amber-500/15 border-amber-400/40 text-amber-300">
              🎯 Examen
            </span>
          )}
          {isClosing && (
            <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border whitespace-nowrap bg-emerald-500/15 border-emerald-400/40 text-emerald-300">
              🏆 Cierre
            </span>
          )}
          <span
            className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border whitespace-nowrap"
            style={{
              color,
              borderColor: color + "66",
              backgroundColor: color + "15",
            }}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <h3 className={"text-sm sm:text-base font-black uppercase leading-tight mb-1 " + (isLocked ? "text-white/40" : "text-white")}>
        {week.eje_tematico}
      </h3>

      <p className="text-[10px] font-mono text-white/40 mb-3">{week.unidad_libro}</p>

      {!isLocked && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-[9px] font-mono">
            <span className="text-white/40 uppercase">Progreso</span>
            <span style={{ color }} className="font-black">{progress}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: progress + "%",
                background: "linear-gradient(90deg, " + color + ", " + color + "cc)",
                boxShadow: "0 0 8px " + color + "80",
              }}
            />
          </div>
        </div>
      )}

      {week.kpi && (
        <div className="flex items-start gap-2 pt-3 border-t border-white/5">
          <FileCheck2 size={12} className="text-[#DEFF9A] shrink-0 mt-0.5" />
          <p className="text-[9px] font-mono text-white/50 leading-relaxed flex-1">
            <span className="text-[#DEFF9A]/70 font-bold">KPI:</span> {week.kpi}
          </p>
        </div>
      )}

      {!isLocked && onClick && (
        <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-white/5">
          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>
            {isCompleted ? 'Repasar' : isCurrent ? 'Continuar' : 'Abrir'}
          </span>
          <ChevronRight size={12} style={{ color }} />
        </div>
      )}
    </motion.div>
  );
}

function TreasureEnd({ unlocked }: { unlocked: boolean }) {
  return (
    <div className="flex flex-col items-center py-16 gap-4">
      <motion.div
        animate={unlocked ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
        transition={{ duration: 2, repeat: unlocked ? Infinity : 0 }}
        className={"relative w-24 h-24 rounded-full flex items-center justify-center " + (
          unlocked
            ? "bg-gradient-to-br from-[#DEFF9A]/30 to-[#00F5D4]/20 border-2 border-[#DEFF9A] shadow-[0_0_40px_rgba(222,255,154,0.5)]"
            : "bg-white/5 border-2 border-white/10"
        )}
      >
        {unlocked ? (
          <Crown size={48} className="text-[#DEFF9A]" strokeWidth={2} />
        ) : (
          <Trophy size={40} className="text-white/20" />
        )}
        {unlocked && (
          <>
            <Sparkles size={20} className="absolute -top-1 -right-1 text-[#DEFF9A] animate-pulse" />
            <Sparkles size={16} className="absolute -bottom-1 -left-1 text-[#00F5D4] animate-pulse" />
          </>
        )}
      </motion.div>
      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]" style={{ color: unlocked ? "#DEFF9A" : "#6B7280" }}>
          {unlocked ? "Modulo A1 Completado" : "Destino Final · Modulo A1"}
        </p>
      </div>
    </div>
  );
}
