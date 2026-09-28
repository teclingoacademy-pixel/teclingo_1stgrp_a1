/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TeacherAttendance.tsx — Reporte Analítico (solo DIRECTOR)
 * Consume /api/attendance/stats/:grupoId para KPIs, tendencia, heatmap y alumnos.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Clock,
  AlertTriangle,
  ChevronDown,
  Download,
  Calendar,
  Users,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { SafeResponsiveContainer } from './SafeResponsiveContainer';
import { motion } from 'motion/react';
import { GlassCard } from './GlassCard';
import { useAppContext } from '../context/AppContext';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:3000';

interface GroupOption {
  grupo_id: string;
  nombre: string;
  grupo: string;
  nivel: string;
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
  heatmap: { dia: number; porcentaje: number | null }[];
  alumnos: AlumnoStat[];
}

const RANGE_TO_DAYS: Record<string, number> = {
  HOY: 1,
  SEMANA: 7,
  MES: 30,
  CICLO: 180,
};

export function TeacherAttendance() {
  const { userEmail } = useAppContext();
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [range, setRange] = useState('SEMANA');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar grupos del director
  useEffect(() => {
    if (!userEmail) return;
    let cancelled = false;
    const load = async () => {
      setLoadingGroups(true);
      try {
        const r = await fetch(`${API_BASE}/api/english-groups/${encodeURIComponent(userEmail)}`);
        const data = await r.json();
        if (cancelled) return;
        if (data?.ok && Array.isArray(data.grupos)) {
          const mapped: GroupOption[] = data.grupos.map((g: any) => ({
            grupo_id: g.grupo_id,
            nombre: g.nombre,
            grupo: g.grupo,
            nivel: g.nivel,
          }));
          setGroups(mapped);
          if (mapped.length > 0) setSelectedGroupId(mapped[0].grupo_id);
        }
      } catch (err) {
        if (!cancelled) setError('No se pudieron cargar los grupos');
      } finally {
        if (!cancelled) setLoadingGroups(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userEmail]);

  // Cargar stats del grupo seleccionado
  const loadStats = useCallback(async () => {
    if (!selectedGroupId || !userEmail) return;
    setLoadingStats(true);
    setError(null);
    try {
      const days = RANGE_TO_DAYS[range] || 30;
      const url = `${API_BASE}/api/attendance/stats/${selectedGroupId}?email=${encodeURIComponent(userEmail)}&days=${days}`;
      const r = await fetch(url);
      const data = await r.json();
      if (data?.ok) {
        setStats(data);
      } else {
        setError(data?.error || 'Error al cargar stats');
      }
    } catch (err) {
      setError('No se pudieron cargar los stats');
    } finally {
      setLoadingStats(false);
    }
  }, [selectedGroupId, userEmail, range]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const selectedGroup = groups.find(g => g.grupo_id === selectedGroupId);
  const kpis = stats?.kpis;
  const totalAsistencia = kpis?.totalAsistencia ?? 0;
  const promedioEntrada = kpis?.promedioEntrada ?? '—';
  const alumnosEnRiesgo = kpis?.alumnosEnRiesgo ?? 0;
  const tendencia = stats?.tendenciaSemanal ?? [];
  const heatmap = stats?.heatmap ?? [];
  const alumnos = stats?.alumnos ?? [];

  const kpiEstado = totalAsistencia >= 90 ? 'KPI Saludable' : totalAsistencia >= 75 ? 'Atención' : 'Crítico';

  // SVG ring progress (92% → 208/226)
  const ringDash = Math.round((totalAsistencia / 100) * 226);

  return (
    <div className="space-y-12 pb-32">
      {/* Header & Filters */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h2 className="text-[#DEFF9A] text-[10px] font-black uppercase tracking-[0.4em] mb-2">Reporte Analítico</h2>
          <h1 className="text-4xl font-black text-white bevel-text uppercase tracking-tight">Módulo de Asistencias</h1>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              disabled={loadingGroups || groups.length === 0}
              className="appearance-none bg-white/5 border border-white/10 rounded-2xl px-6 py-3 pr-12 text-[10px] font-black uppercase tracking-widest text-[#DEFF9A] outline-none disabled:opacity-40"
            >
              {groups.length === 0 && <option value="">Sin grupos</option>}
              {groups.map(g => (
                <option key={g.grupo_id} value={g.grupo_id} className="bg-[#0a0c10]">
                  {g.nombre} — {g.grupo} {g.nivel}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
          </div>

          <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl">
            {['HOY', 'SEMANA', 'MES', 'CICLO'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                  range === r ? 'bg-[#DEFF9A] text-[#061a1a]' : 'text-white/20 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl text-cyan-400 hover:bg-white/10 transition-all">
            <Filter size={18} />
          </button>
        </div>
      </header>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
          ⚠️ {error}
        </div>
      )}

      {loadingGroups ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#DEFF9A]" size={32} />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 opacity-40">
          <Users className="mx-auto mb-4" size={48} />
          <p className="text-sm font-black uppercase tracking-widest">Sin grupos registrados</p>
          <p className="text-xs mt-2 text-white/40">Crea un grupo de inglés primero desde el módulo de grupos.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassCard accent="green" className="!p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#DEFF9A]/10 blur-[60px] rounded-full" />
              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg className="w-20 h-20 -rotate-90">
                    <circle cx="40" cy="40" r="36" className="stroke-white/5 fill-none" strokeWidth="6" />
                    <motion.circle
                      cx="40" cy="40" r="36"
                      className="stroke-[#DEFF9A] fill-none"
                      strokeWidth="6"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 226' }}
                      animate={{ strokeDasharray: `${ringDash} 226` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-black text-white">{totalAsistencia}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-white/20 text-[8px] font-black uppercase tracking-widest mb-1">Asistencia Total</p>
                  <h3 className="text-white text-lg font-black uppercase">{kpiEstado}</h3>
                  <p className="text-[#DEFF9A] text-[10px] font-bold mt-1 tracking-tight">
                    {kpis?.totalRegistros ?? 0} registros
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard accent="cyan" className="!p-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Clock size={40} />
                </div>
                <div>
                  <p className="text-white/20 text-[8px] font-black uppercase tracking-widest mb-1">Puntualidad QR</p>
                  <h3 className="text-white text-3xl font-black uppercase">
                    {promedioEntrada === '—' ? '—' : promedioEntrada}
                  </h3>
                  <p className="text-cyan-400 text-[10px] font-bold mt-1 tracking-tight">PROMEDIO ENTRADA</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard accent="orange" className="!p-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 relative">
                  <AlertTriangle size={40} />
                  {alumnosEnRiesgo > 0 && (
                    <span className="absolute top-0 right-0 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-[#061a1a] text-[10px] font-black border-4 border-[#0a0c10]">
                      {alumnosEnRiesgo}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-white/20 text-[8px] font-black uppercase tracking-widest mb-1">Alertas Deserción</p>
                  <h3 className="text-white text-lg font-black uppercase">
                    {alumnosEnRiesgo > 0 ? 'Riesgo Detectado' : 'Sin Riesgo'}
                  </h3>
                  <p className="text-orange-400 text-[10px] font-bold mt-1 tracking-tight">
                    {alumnosEnRiesgo} ALUMNO{alumnosEnRiesgo !== 1 ? 'S' : ''} CRÍTICO{alumnosEnRiesgo !== 1 ? 'S' : ''}
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Visualizations Grid */}
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-8">
              <GlassCard title="Rendimiento Semanal del Grupo" icon={BarChart3} accent="green">
                <div className="h-[350px] w-full mt-8">
                  <SafeResponsiveContainer width="100%" height="100%">
                    <BarChart data={tendencia}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="dia" axisLine={false} tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 'black' }} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0a0c10', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                        itemStyle={{ color: '#DEFF9A', fontSize: '12px', fontWeight: 'bold' }}
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      />
                      <Bar dataKey="porcentaje" radius={[8, 8, 0, 0]}>
                        {tendencia.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.porcentaje > 90 ? '#DEFF9A' : entry.porcentaje > 80 ? '#22D3EE' : '#F87171'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </SafeResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            <div className="col-span-12 lg:col-span-4">
              <GlassCard title="Heatmap Mensual" icon={Calendar} accent="cyan">
                <div className="grid grid-cols-7 gap-2 mt-8">
                  {heatmap.map((d) => {
                    const pct = d.porcentaje;
                    const bg = pct === null ? 'rgba(255,255,255,0.02)'
                      : pct >= 90 ? '#DEFF9A'
                      : pct >= 75 ? 'rgba(222,255,154,0.5)'
                      : pct >= 50 ? 'rgba(222,255,154,0.2)'
                      : 'rgba(248,113,113,0.3)';
                    return (
                      <div
                        key={d.dia}
                        className="aspect-square rounded-lg border border-white/5 transition-all hover:scale-110 flex items-center justify-center text-[7px] font-black text-white/40"
                        style={{
                          backgroundColor: bg,
                          boxShadow: pct !== null && pct >= 90 ? '0 0 10px rgba(222,255,154,0.3)' : 'none',
                        }}
                        title={pct !== null ? `${d.dia}: ${pct}%` : `${d.dia}: sin registro`}
                      >
                        {d.dia}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-8 flex items-center justify-between text-[8px] font-black text-white/20 uppercase tracking-widest">
                  <span>Asistencia Baja</span>
                  <div className="flex gap-1">
                    {[0.2, 0.5, 1].map((v, i) => (
                      <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(222,255,154, ${v})` }} />
                    ))}
                  </div>
                  <span>Éxito Total</span>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Detailed Student Table */}
          <GlassCard title="Trend Individual de Asistencia" icon={Users} accent="green">
            <div className="overflow-x-auto custom-scrollbar -mx-6 px-6">
              <table className="w-full mt-6">
                <thead>
                  <tr className="text-left text-[9px] font-black text-white/20 uppercase tracking-widest border-b border-white/5">
                    <th className="pb-6 px-4">Alumno</th>
                    <th className="pb-6 px-4 text-center">Porcentaje</th>
                    <th className="pb-6 px-4">Trend (Últimos 7 días)</th>
                    <th className="pb-6 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {alumnos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-white/30 text-xs font-bold uppercase tracking-widest">
                        Sin registros de asistencia en el periodo
                      </td>
                    </tr>
                  ) : alumnos.map((student) => (
                    <tr key={student.userId} className="group hover:bg-white/[0.02] transition-all">
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 text-xs font-black">
                              {student.nombre.substring(0, 2).toUpperCase()}
                            </div>
                            {student.enRiesgo && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse border-2 border-[#0a0c10]" />
                            )}
                          </div>
                          <div>
                            <p className="text-white text-xs font-black uppercase tracking-tight">{student.nombre || 'Sin nombre'}</p>
                            <p className="text-white/20 text-[8px] font-bold uppercase mt-1">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span className={`text-xs font-black ${student.porcentaje > 90 ? 'text-[#DEFF9A]' : student.porcentaje > 80 ? 'text-cyan-400' : 'text-orange-400'}`}>
                          {student.porcentaje}%
                        </span>
                      </td>
                      <td className="py-6 px-4">
                        <div className="flex gap-2">
                          {student.trend.map((v, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full shadow-sm ${v === 1 ? 'bg-[#4ADE80] shadow-[0_0_5px_#4ADE80]' : 'bg-red-500/20'}`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <div className="flex justify-end gap-3">
                          <button className="p-2.5 rounded-xl bg-white/5 text-white/30 hover:text-white transition-all">
                            <Search size={14} />
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-[#DEFF9A] hover:bg-[#DEFF9A]/10 transition-all">
                            <Download size={14} /> Reporte
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}