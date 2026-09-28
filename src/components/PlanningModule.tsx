/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PlanningModule — Vista de SOLO LECTURA de la planeación semanal.
 *
 * La fuente es la MISMA copia maestra que edita la dirección (Biblioteca
 * Directiva → Prisma `/api/study-plan`). El docente no puede crear, editar,
 * sellar ni aprobar semanas aquí: sólo consulta lo publicado por la dirección.
 */

import { useState, useMemo } from 'react';
import {
  BookOpen,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Lock,
  Stamp,
  RefreshCw,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from './GlassCard';
import { useStudyPlan, type StudyPlanSource } from '../hooks/useStudyPlan';

const SOURCE_LABEL: Record<StudyPlanSource, string> = {
  prisma: 'Biblioteca Directiva (maestro)',
  sheets: 'Malla Curricular Central',
  static: 'Malla Curricular Local',
};

interface SemanaDocente {
  semanaWeb: number;
  unidad: string;
  eje_tematico: string;
  fechas: string;
  paginas: string;
  kpi: string;
  horas: Array<{ hora: number; leccion: string; enfoque: string }>;
}

export function PlanningModule() {
  const { weeks, level, source, loading, error, refresh } = useStudyPlan('S01');
  const [semanaSeleccionadaId, setSemanaSeleccionadaId] = useState<number>(1);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const semanas = useMemo<SemanaDocente[]>(
    () =>
      weeks.map((w) => ({
        semanaWeb: w.semana,
        unidad: w.unidad_libro,
        eje_tematico: w.eje_tematico,
        fechas: w.fechas,
        paginas: w.paginas,
        kpi: w.kpi,
        horas: w.horas.map((h) => ({ hora: h.hora, leccion: h.leccion, enfoque: h.enfoque })),
      })),
    [weeks]
  );

  const activeSemana =
    semanas.find((s) => s.semanaWeb === semanaSeleccionadaId) || semanas[0] || null;

  if (loading && semanas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <RefreshCw size={22} className="text-cyan-400 animate-spin" />
        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
          Sincronizando planeación con la Biblioteca Directiva...
        </p>
      </div>
    );
  }

  if (!activeSemana) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <p className="text-xs font-mono text-orange-400 uppercase tracking-widest">
          La dirección aún no ha publicado la planeación del periodo
        </p>
        <button
          onClick={refresh}
          className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl cursor-pointer flex items-center gap-2"
        >
          <RefreshCw size={13} /> Reintentar
        </button>
      </div>
    );
  }

  const indiceActual = semanas.findIndex((s) => s.semanaWeb === activeSemana.semanaWeb);

  const navegarSemana = (delta: number) => {
    const siguiente = indiceActual + delta;
    if (siguiente >= 0 && siguiente < semanas.length) {
      setSemanaSeleccionadaId(semanas[siguiente].semanaWeb);
    }
  };

  return (
    <div className="space-y-6 text-left">

      {/* PLANNING HEADER BRANDING */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/20 via-[#0a1a20]/30 to-transparent border border-cyan-500/25 shadow-xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 text-left">
        <div className="space-y-1.5 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-cyan-500/10 text-cyan-400 font-mono text-[9px] font-black px-2.5 py-1 rounded border border-cyan-500/20 uppercase tracking-widest">
              PLANEACIÓN SEMANAL
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/5 text-white/50 border border-white/10 font-mono text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-widest">
              <Eye size={11} /> Solo lectura
            </span>
            <span className="text-white/40 text-[10px] font-mono">• {SOURCE_LABEL[source]}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight">
            CALENDARIOS DE PLANEACIÓN & AUDITORÍA SEMANALES
          </h2>
          <p className="text-xs text-white/50 max-w-xl leading-relaxed">
            Esta planeación es publicada y controlada por la dirección. Su progreso, sus KPIs y
            sus entregables son de sólo consulta: cualquier cambio se realiza en la Biblioteca
            Directiva y se refleja aquí automáticamente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0">
          <button
            onClick={refresh}
            className="flex-1 sm:flex-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-black px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer uppercase"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            onClick={() => setShowCalendarModal(true)}
            className="flex-1 sm:flex-initial bg-cyan-600 hover:bg-cyan-500 text-slate-900 font-mono text-xs font-black px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition active:scale-95 border border-cyan-400/20 cursor-pointer uppercase"
          >
            <Calendar size={15} />
            Cronograma General
          </button>
        </div>
      </div>

      {/* MASTER SOURCE STRIP */}
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-slate-950/25 border border-white/5 p-4 rounded-3xl text-left">
        <div className="flex items-start gap-3 text-left">
          <div className="p-2 bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 rounded-xl shrink-0">
            <Lock size={15} />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
              Fuente oficial de esta vista
            </span>
            <strong className="text-xs text-white/90 block uppercase tracking-tight">
              {level
                ? `${level.semester} · ${level.levelName} (${level.cefrTag})`
                : 'Malla curricular del ciclo modular'}
            </strong>
            <span className="text-[9.5px] text-white/30 font-mono">
              {error
                ? 'Aviso: no se pudo contactar al maestro, mostrando copia local.'
                : `Sincronizado con ${SOURCE_LABEL[source]} · ${semanas.length} semanas publicadas`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono text-white/40 font-bold uppercase">Módulo:</span>
          <select
            value={activeSemana.semanaWeb}
            onChange={(e) => setSemanaSeleccionadaId(Number(e.target.value))}
            className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono font-semibold cursor-pointer"
          >
            {semanas.map((s) => (
              <option key={s.semanaWeb} value={s.semanaWeb}>
                S{s.semanaWeb.toString().padStart(2, '0')} — {s.unidad.split(':')[1]?.trim() || s.unidad}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CORE TWO-COLUMN INTERFACE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">

        {/* WEEKLY TIMELINE SUMMARY PANEL (4 GRID SPACES) */}
        <div className="lg:col-span-4 bg-black/40 border border-white/5 p-4 rounded-3xl space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar text-left">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-black font-mono text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
              <FileText size={13} />
              Semanas Publicadas
            </span>
            <span className="text-[10px] text-white/40 font-mono">{level?.cefrTag || 'SEP A1.1'}</span>
          </div>

          <div className="space-y-2">
            {semanas.map((wk) => {
              const isActive = wk.semanaWeb === activeSemana.semanaWeb;
              return (
                <button
                  key={wk.semanaWeb}
                  onClick={() => setSemanaSeleccionadaId(wk.semanaWeb)}
                  className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isActive
                      ? 'bg-cyan-950/25 text-white border-cyan-400/40 shadow-inner'
                      : 'bg-black/20 text-white/50 border-white/[0.02] hover:bg-white/5 hover:text-white/85'
                  }`}
                >
                  <div className="space-y-0.5 truncate text-left">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[9px] font-black px-1.5 py-0.2 rounded ${
                        isActive ? 'bg-cyan-500 text-slate-900 font-bold' : 'bg-white/5 text-white/40'
                      }`}>
                        S{wk.semanaWeb.toString().padStart(2, '0')}
                      </span>
                      <strong className="text-white/90 truncate">
                        {wk.unidad.split(':')[1]?.trim() || wk.unidad}
                      </strong>
                    </div>
                    <p className="text-[10px] text-white/30 truncate pl-1 font-mono italic">
                      {wk.fechas || wk.eje_tematico}
                    </p>
                  </div>

                  <Lock size={13} className="text-cyan-400/60 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* COMPREHENSIVE DETAIL MONITORING PANEL (8 GRID SPACES) */}
        <div className="lg:col-span-8 space-y-6 text-left">
          <GlassCard title={`Planeación Oficial - Semana ${activeSemana.semanaWeb}`} icon={BookOpen} accent="cyan">

            <div className="space-y-6 text-left">

              {/* PRIMARY ROW INFO SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-white/30 text-[9px] font-mono uppercase">Unidad del Libro</span>
                  <p className="text-white text-xs font-black uppercase tracking-tight">{activeSemana.unidad}</p>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-white/30 text-[9px] font-mono uppercase">Periodo</span>
                  <p className="text-white text-xs font-black uppercase tracking-tight">
                    {activeSemana.fechas || 'Fecha por definir por la dirección'}
                  </p>
                </div>
              </div>

              {/* CURRICULUM DESCRIPTION BOX */}
              <div className="p-4 rounded-2xl bg-cyan-950/15 border border-cyan-500/20 space-y-1 text-left">
                <span className="text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider block">Tema General (Syllabus)</span>
                <p className="text-white text-sm font-black leading-snug">{activeSemana.eje_tematico}</p>
                {activeSemana.paginas && (
                  <span className="text-[10px] text-white/40 font-mono">Material: {activeSemana.paginas}</span>
                )}
              </div>

              {/* WEEK NAVIGATION */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => navegarSemana(-1)}
                  disabled={indiceActual <= 0}
                  className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed border border-white/10 text-white px-4 py-2.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition cursor-pointer"
                >
                  <ChevronLeft size={13} /> Anterior
                </button>
                <span className="text-[10px] font-mono text-white/35 uppercase tracking-widest">
                  Semana {indiceActual + 1} de {semanas.length}
                </span>
                <button
                  onClick={() => navegarSemana(1)}
                  disabled={indiceActual >= semanas.length - 1}
                  className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed border border-white/10 text-white px-4 py-2.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Siguiente <ChevronRight size={13} />
                </button>
              </div>

              {/* OFFICIAL HOUR BLOCK (READ-ONLY) */}
              <div className="space-y-3 text-left">
                <span className="text-white/40 text-[10px] font-mono uppercase tracking-wider block">
                  Distribución de Horas (sólo consulta):
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {activeSemana.horas.map((h, i) => (
                    <div
                      key={`${h.hora}-${i}`}
                      className="p-4 rounded-2xl border bg-black/30 border-white/5 text-left space-y-0.5"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-6 h-6 rounded-md border border-cyan-400/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-black flex items-center justify-center shrink-0">
                          {h.hora}
                        </div>
                        <div className="text-left space-y-0.5">
                          <span className="text-[11px] font-bold uppercase tracking-tight block text-white/90">
                            {h.leccion}
                          </span>
                          <span className="text-[9.5px] font-mono text-white/30 leading-snug block">
                            {h.enfoque}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {activeSemana.horas.length === 0 && (
                    <p className="text-[10px] font-mono text-white/25 uppercase tracking-widest">
                      La dirección aún no desglosó las horas de esta semana.
                    </p>
                  )}
                </div>
              </div>

              {/* KPI / DELIVERABLES (READ-ONLY) */}
              <div className="space-y-3 text-left pt-2 border-t border-white/5">
                <span className="text-white/40 text-[10px] font-mono uppercase tracking-wider block">
                  KPI / Entregable Programado por la Dirección:
                </span>

                <div className="p-3.5 bg-black/45 border border-white/5 rounded-2xl flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-xl border border-white/5 text-white/40">
                      <FileText size={15} />
                    </div>
                    <strong className="text-xs text-white block">{activeSemana.kpi || 'KPI por definir'}</strong>
                  </div>
                  <Lock size={14} className="text-white/25 shrink-0" />
                </div>
              </div>

              {/* DIRECTIVE STAMP (READ-ONLY) */}
              <div className="p-4 bg-orange-500/5 border border-orange-500/15 rounded-2xl flex items-start gap-4 text-left">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-mono font-black text-orange-400 uppercase tracking-widest block flex items-center gap-1.5">
                    <Stamp size={12} />
                    Sello de Validación Directiva
                  </span>
                  <p className="text-[11px] text-white/50 leading-relaxed italic pr-2">
                    Documento emitido por la Biblioteca Directiva. No admits modificaciones desde
                    la cuenta docente.
                  </p>
                </div>
                <div className="shrink-0 self-center">
                  <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/50 font-mono text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl">
                    <Lock size={11} /> Sello vigente
                  </span>
                </div>
              </div>

            </div>

          </GlassCard>
        </div>

      </div>

      {/* ================= CRONOGRAMA MODAL DRAWER ================= */}
      <AnimatePresence>
        {showCalendarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl overflow-hidden bg-[#05111b] border border-cyan-500/25 rounded-3xl p-6 shadow-2xl space-y-4 text-left"
            >
              <button
                onClick={() => setShowCalendarModal(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white p-1 hover:bg-white/5 rounded-lg"
              >
                <Lock size={16} />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 rounded-xl">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">
                    Cronograma Anual Autorizado ({semanas.length} Semanas)
                  </h3>
                  <p className="text-[10px] text-white/40 font-mono">Publicado por la Dirección Académica</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[350px] overflow-y-auto custom-scrollbar p-1 text-left">
                {semanas.map((s) => (
                  <button
                    key={s.semanaWeb}
                    onClick={() => {
                      setSemanaSeleccionadaId(s.semanaWeb);
                      setShowCalendarModal(false);
                    }}
                    className={`p-3 rounded-2xl border text-left space-y-1 transition cursor-pointer ${
                      s.semanaWeb === activeSemana.semanaWeb
                        ? 'bg-cyan-950/20 border-cyan-400/40'
                        : 'bg-black/40 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-cyan-400 font-bold">SEMANA {s.semanaWeb.toString().padStart(2, '0')}</span>
                      <Lock size={10} className="text-white/25" />
                    </div>
                    <strong className="text-[10.5px] text-white truncate block uppercase leading-snug">
                      {s.unidad.split(':')[1]?.trim() || s.unidad}
                    </strong>
                    <span className="text-[9px] text-white/30 font-mono block truncate">{s.fechas || 'Sin fecha'}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className="bg-cyan-500 text-slate-900 border border-white/5 font-mono text-[10px] font-black px-6 py-2.5 rounded-xl cursor-pointer hover:bg-cyan-400 transition"
                >
                  Entendido / Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
