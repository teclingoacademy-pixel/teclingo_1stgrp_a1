/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DocenteAsistenciasOverview.tsx
 * Compilado de asistencias de TODOS los grupos del docente.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Users, ChevronRight, ChevronDown, AlertCircle,
  Loader2, TrendingUp, Calendar, RefreshCw, ClipboardCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from './GlassCard';
import { useAppContext } from '../context/AppContext';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:3000';

interface GroupOption {
  grupo_id: string;
  code_id?: string;
  nombre: string;
  grupo: string;
  nivel: string;
  alumnos_inscritos?: number;
}

interface AlumnoStat {
  userId: string;
  nombre: string;
  email: string;
  porcentaje: number;
  trend: number[];
  enRiesgo: boolean;
}

interface StatsResponse {
  ok: boolean;
  grupo: { id: string; nombre: string; grupo: string; nivel: string };
  kpis: {
    totalAsistencia: number;
    promedioEntrada: string;
    totalRegistros: number;
    alumnosEnRiesgo: number;
  };
  tendenciaSemanal: { dia: string; porcentaje: number }[];
  alumnos: AlumnoStat[];
}

interface Props {
  onRegisterAttendance: (grupoId: string) => void;
}

export function DocenteAsistenciasOverview({ onRegisterAttendance }: Props) {
  const { userEmail } = useAppContext();
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, StatsResponse>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<number>(7);

  const loadGroups = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/english-groups/${encodeURIComponent(userEmail)}`);
      const data = await r.json();
      if (data?.ok && Array.isArray(data.grupos)) {
        setGroups(data.grupos.map((g: any) => ({
          grupo_id: g.grupo_id,
          code_id: g.code_id,
          nombre: g.nombre,
          grupo: g.grupo,
          nivel: g.nivel,
          alumnos_inscritos: g.alumnos_inscritos,
        })));
      }
    } catch (err) {
      console.warn('[DocenteAsistenciasOverview] loadGroups error:', err);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const loadStats = useCallback(async () => {
    if (!userEmail || groups.length === 0) return;
    const next: Record<string, StatsResponse> = {};
    await Promise.all(groups.map(async (g) => {
      try {
        const r = await fetch(
          `${API_BASE}/api/attendance/stats/${g.grupo_id}?email=${encodeURIComponent(userEmail)}&days=${rangeDays}`
        );
        const data = await r.json();
        if (data?.ok) next[g.grupo_id] = data;
      } catch { /* skip */ }
    }));
    setStatsMap(next);
  }, [userEmail, groups, rangeDays]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const totalGroups = groups.length;
  const totalAlumnos = groups.reduce((s, g) => s + (g.alumnos_inscritos ?? 0), 0);
  const avgPct = (() => {
    const valid = Object.values(statsMap).filter(s => s.kpis);
    if (valid.length === 0) return 0;
    return Math.round(valid.reduce((s, x) => s + x.kpis.totalAsistencia, 0) / valid.length);
  })();
  const totalEnRiesgo = Object.values(statsMap).reduce(
    (s, x) => s + (x.kpis?.alumnosEnRiesgo ?? 0), 0
  );

  return (
    <div className="space-y-8 pb-16">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-[#4ADE80] text-[10px] font-black uppercase tracking-[0.4em] mb-2">Compilado de Asistencias</h2>
          <h1 className="text-3xl md:text-4xl font-black text-white bevel-text uppercase tracking-tight">Mis Grupos</h1>
          <p className="text-white/40 text-xs mt-2 font-bold uppercase tracking-widest">
            Resumen de asistencia de todos tus grupos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl">
            {[{ l: 'HOY', v: 1 }, { l: 'SEMANA', v: 7 }, { l: 'MES', v: 30 }].map(r => (
              <button
                key={r.v}
                onClick={() => setRangeDays(r.v)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  rangeDays === r.v ? 'bg-[#4ADE80] text-[#061a1a]' : 'text-white/40 hover:text-white'
                }`}
              >{r.l}</button>
            ))}
          </div>
          <button
            onClick={() => { loadGroups(); loadStats(); }}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all"
            title="Recargar"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard accent="green" className="!p-5">
          <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">Grupos</p>
          <p className="text-2xl font-black text-white">{totalGroups}</p>
        </GlassCard>
        <GlassCard accent="cyan" className="!p-5">
          <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">Alumnos</p>
          <p className="text-2xl font-black text-white">{totalAlumnos}</p>
        </GlassCard>
        <GlassCard accent="green" className="!p-5">
          <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">% Promedio</p>
          <p className="text-2xl font-black text-[#4ADE80]">{avgPct}%</p>
        </GlassCard>
        <GlassCard accent="orange" className="!p-5">
          <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">En riesgo</p>
          <p className="text-2xl font-black text-orange-400">{totalEnRiesgo}</p>
        </GlassCard>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#4ADE80] mb-4" size={36} />
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Cargando grupos...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Users size={48} className="text-white/20 mb-4" />
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">No tienes grupos asignados</p>
          <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest mt-2">Contacta al administrador</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const s = statsMap[g.grupo_id];
            const pct = s?.kpis?.totalAsistencia ?? 0;
            const enRiesgo = s?.kpis?.alumnosEnRiesgo ?? 0;
            const isOpen = expanded === g.grupo_id;

            return (
              <div
                key={g.grupo_id}
                className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden transition-all"
              >
                <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <button
                    onClick={() => setExpanded(isOpen ? null : g.grupo_id)}
                    className="flex-1 flex items-center gap-4 text-left group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#4ADE80]/10 border border-[#4ADE80]/20 flex items-center justify-center text-[#4ADE80] shrink-0">
                      {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black text-[#4ADE80] uppercase tracking-widest px-2 py-0.5 bg-[#4ADE80]/10 rounded">
                          {g.code_id || g.grupo_id.slice(0, 8)}
                        </span>
                        <span className="text-white/30 text-[9px] font-black uppercase tracking-widest">
                          {g.grupo} — {g.nivel}
                        </span>
                      </div>
                      <h3 className="text-white text-base font-black uppercase tracking-tight truncate">{g.nombre}</h3>
                    </div>
                  </button>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-white/30 text-[8px] font-black uppercase tracking-widest">Asistencia</p>
                      <p className={`text-xl font-black ${pct >= 90 ? 'text-[#4ADE80]' : pct >= 75 ? 'text-cyan-400' : 'text-orange-400'}`}>
                        {pct}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/30 text-[8px] font-black uppercase tracking-widest">Alumnos</p>
                      <p className="text-xl font-black text-white">{g.alumnos_inscritos ?? 0}</p>
                    </div>
                    {enRiesgo > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                        <AlertCircle size={14} className="text-orange-400" />
                        <span className="text-orange-400 text-[10px] font-black">{enRiesgo}</span>
                      </div>
                    )}
                    <button
                      onClick={() => onRegisterAttendance(g.grupo_id)}
                      className="px-4 py-2.5 rounded-xl bg-[#4ADE80] text-[#061a1a] text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <ClipboardCheck size={14} /> Registrar
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 overflow-hidden"
                    >
                      <div className="p-5 space-y-6">
                        {s?.tendenciaSemanal && s.tendenciaSemanal.length > 0 && (
                          <div>
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                              <TrendingUp size={12} /> Tendencia semanal
                            </p>
                            <div className="grid grid-cols-5 gap-2">
                              {s.tendenciaSemanal.map((d, i) => (
                                <div key={i} className="text-center">
                                  <div className="h-16 bg-white/5 rounded-xl relative overflow-hidden">
                                    <div
                                      className="absolute bottom-0 left-0 right-0 bg-[#4ADE80] transition-all"
                                      style={{ height: `${d.porcentaje}%` }}
                                    />
                                  </div>
                                  <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mt-1">{d.dia}</p>
                                  <p className="text-white text-[10px] font-black">{d.porcentaje}%</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {s?.alumnos && s.alumnos.length > 0 ? (
                          <div>
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Users size={12} /> Alumnos ({s.alumnos.length})
                            </p>
                            <div className="overflow-x-auto -mx-2 px-2">
                              <table className="w-full">
                                <thead>
                                  <tr className="text-left text-[8px] font-black text-white/20 uppercase tracking-widest border-b border-white/5">
                                    <th className="pb-3 px-2">Alumno</th>
                                    <th className="pb-3 px-2 text-center">%</th>
                                    <th className="pb-3 px-2">Trend (últimos 7)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {s.alumnos.map((a) => (
                                    <tr key={a.userId}>
                                      <td className="py-3 px-2">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 text-[10px] font-black">
                                            {(a.nombre || a.email)[0].toUpperCase()}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-white text-[11px] font-black uppercase tracking-tight truncate">
                                              {a.nombre || a.email}
                                            </p>
                                            <p className="text-white/20 text-[8px] font-bold truncate">{a.email}</p>
                                          </div>
                                          {a.enRiesgo && (
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-3 px-2 text-center">
                                        <span className={`text-[11px] font-black ${a.porcentaje >= 90 ? 'text-[#4ADE80]' : a.porcentaje >= 80 ? 'text-cyan-400' : 'text-orange-400'}`}>
                                          {a.porcentaje}%
                                        </span>
                                      </td>
                                      <td className="py-3 px-2">
                                        <div className="flex gap-1.5">
                                          {a.trend.map((v, i) => (
                                            <div
                                              key={i}
                                              className={`w-2 h-2 rounded-full ${v === 1 ? 'bg-[#4ADE80]' : 'bg-red-500/30'}`}
                                            />
                                          ))}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-black/20 rounded-2xl border border-white/5">
                            <Calendar size={32} className="text-white/10 mx-auto mb-3" />
                            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
                              Sin registros de asistencia en el periodo
                            </p>
                            <button
                              onClick={() => onRegisterAttendance(g.grupo_id)}
                              className="mt-4 px-4 py-2 rounded-xl bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80] text-[9px] font-black uppercase tracking-widest hover:bg-[#4ADE80]/20 transition-all"
                            >
                              Registrar primera asistencia
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}