/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AsistenciasMaster.tsx — Visión macro del DIRECTOR
 * Consume /api/english-groups/:email y /api/attendance/stats/:grupoId (Prisma/PostgreSQL)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  AlertCircle,
  MapPin,
  Search,
  Calendar as CalendarIcon,
  QrCode,
  ArrowUpRight,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from './GlassCard';
import { PieChart, Pie, Cell } from 'recharts';
import { SafeResponsiveContainer } from './SafeResponsiveContainer';
import { useAppContext } from '../context/AppContext';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:3000';

interface GroupOption {
  grupo_id: string;
  nombre: string;
  grupo: string;
  nivel: string;
  docente_email?: string;
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

interface GroupStats {
  ok: boolean;
  grupo: { id: string; nombre: string; grupo: string; nivel: string };
  kpis: { totalAsistencia: number; promedioEntrada: string; totalRegistros: number; alumnosEnRiesgo: number };
  tendenciaSemanal: { dia: string; porcentaje: number }[];
  heatmap: { dia: number; porcentaje: number | null }[];
  alumnos: AlumnoStat[];
}

interface AttendanceGroupCard {
  id: string;
  name: string;
  sublabel: string;
  percentage: number;
  presentes: number;
  total: number;
  enRiesgo: number;
}

interface InterventionItem {
  id: string;
  userName: string;
  userId: string;
  groupName: string;
  percentage: number;
}

const RANGE_TO_DAYS: Record<string, number> = { HOY: 1, SEMANA: 7, MES: 30 };

export function AsistenciasMaster() {
  const { userEmail } = useAppContext();
  const [range, setRange] = useState<'HOY' | 'SEMANA' | 'MES'>('HOY');
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, GroupStats>>({});
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showInterventions, setShowInterventions] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // ── 1) Cargar grupos del director
  useEffect(() => {
    if (!userEmail) return;
    let cancelled = false;
    (async () => {
      setLoadingGroups(true);
      try {
        const r = await fetch(`${API_BASE}/api/english-groups/${encodeURIComponent(userEmail)}`);
        const data = await r.json();
        if (cancelled) return;
        if (data?.ok && Array.isArray(data.grupos)) {
          setGroups(data.grupos.map((g: any) => ({
            grupo_id: g.grupo_id,
            nombre: g.nombre,
            grupo: g.grupo,
            nivel: g.nivel,
            docente_email: g.docente_email,
            alumnos_inscritos: g.alumnos_inscritos,
          })));
        }
      } finally {
        if (!cancelled) setLoadingGroups(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userEmail]);

  // ── 2) Cargar stats por grupo (según rango)
  const loadStats = useCallback(async () => {
    if (!userEmail || groups.length === 0) return;
    setLoadingStats(true);
    const days = RANGE_TO_DAYS[range] || 1;
    const next: Record<string, GroupStats> = {};
    await Promise.all(groups.map(async (g) => {
      try {
        const r = await fetch(
          `${API_BASE}/api/attendance/stats/${g.grupo_id}?email=${encodeURIComponent(userEmail)}&days=${days}`
        );
        const data = await r.json();
        if (data?.ok) next[g.grupo_id] = data;
      } catch { /* skip */ }
    }));
    setStatsMap(next);
    setLoadingStats(false);
  }, [userEmail, groups, range]);

  useEffect(() => { loadStats(); }, [loadStats]);

  // ── 3) Construir tarjetas por grupo
  const groupsData: AttendanceGroupCard[] = useMemo(() => {
    return groups.map(g => {
      const s = statsMap[g.grupo_id];
      const total = (g.alumnos_inscritos ?? 0) || 1;
      const presentes = s?.alumnos?.reduce((acc, a) => acc + Math.round((a.porcentaje / 100) * a.trend.length), 0) ?? 0;
      const pct = s?.kpis?.totalAsistencia ?? 0;
      return {
        id: g.grupo_id,
        name: g.nombre,
        sublabel: `${g.grupo} — ${g.nivel}`,
        percentage: pct,
        presentes: s?.kpis?.totalRegistros ?? 0,
        total,
        enRiesgo: s?.kpis?.alumnosEnRiesgo ?? 0,
      };
    });
  }, [groups, statsMap]);

  // ── 4) KPIs globales
  const totalGroups = groupsData.length;
  const avgPct = totalGroups > 0
    ? Math.round(groupsData.reduce((s, g) => s + g.percentage, 0) / totalGroups)
    : 0;
  const criticalGroup = groupsData.length > 0
    ? groupsData.reduce((min, g) => (g.percentage < min.percentage ? g : min), groupsData[0])
    : { id: '-', name: '-', percentage: 0, sublabel: '', presentes: 0, total: 0, enRiesgo: 0 };

  // ── 5) Intervenciones (alumnos en riesgo)
  const interventions: InterventionItem[] = useMemo(() => {
    const list: InterventionItem[] = [];
    groups.forEach(g => {
      const s = statsMap[g.grupo_id];
      if (!s?.alumnos) return;
      s.alumnos.filter(a => a.enRiesgo).forEach(a => {
        list.push({
          id: `${g.grupo_id}-${a.userId}`,
          userName: a.nombre || a.email,
          userId: a.userId,
          groupName: `${g.nombre} (${g.grupo})`,
          percentage: a.porcentaje,
        });
      });
    });
    return list;
  }, [groups, statsMap]);

  // ── 6) Búsqueda de alumnos (por nombre o email)
  const allAlumnos = useMemo(() => {
    const list: (AlumnoStat & { groupName: string; groupId: string })[] = [];
    groups.forEach(g => {
      const s = statsMap[g.grupo_id];
      if (!s?.alumnos) return;
      s.alumnos.forEach(a => list.push({ ...a, groupName: g.nombre, groupId: g.grupo_id }));
    });
    return list;
  }, [groups, statsMap]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allAlumnos.filter(a =>
      (a.nombre || '').toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q)
    ).slice(0, 5);
  }, [allAlumnos, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-32"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-[#DEFF9A] text-[10px] font-bold uppercase tracking-[0.4em] mb-2">Visión Macro de Puntualidad</h2>
          <h1 className="text-3xl font-bold tracking-tight text-white bevel-text uppercase underline decoration-[#DEFF9A]/20">Asistencias Panorámicas</h1>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-2">
            TecLingo • Live Attendance Monitoring {loadingStats && <span className="ml-2 text-[#DEFF9A] animate-pulse">• Actualizando</span>}
          </p>
        </div>

        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1">
          {(['HOY', 'SEMANA', 'MES'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                range === r ? 'text-[#DEFF9A] bg-white/5 border border-white/10' : 'text-white/40'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      {/* KPIs Globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <GlassCard accent="green">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Puntualidad Global</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-white bevel-text">{avgPct}%</h3>
                {loadingGroups && <span className="text-white/30 text-[10px] font-bold animate-pulse">Cargando...</span>}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#DEFF9A]/10 border border-[#DEFF9A]/20 flex items-center justify-center text-[#DEFF9A]">
              <UserCheck size={24} />
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#DEFF9A] shadow-[0_0_10px_#DEFF9A]" style={{ width: `${avgPct}%` }} />
          </div>
        </GlassCard>

        <GlassCard accent="orange">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Ausentismo Crítico</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-[#F59E0B] bevel-text">{interventions.length} ALUMNOS</h3>
                <button
                  onClick={() => setShowInterventions(!showInterventions)}
                  className="px-2 py-1 rounded bg-[#F59E0B]/10 text-[#F59E0B] text-[8px] font-black uppercase hover:bg-[#F59E0B]/20 transition-all ml-2"
                >
                  {showInterventions ? 'Ocultar' : 'Ver Lista'}
                </button>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B]">
              <AlertCircle size={24} />
            </div>
          </div>
          <p className="mt-4 text-[9px] font-bold uppercase text-white/40 tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
            Riesgo de deserción (asistencia &lt; 75%)
          </p>
        </GlassCard>

        <GlassCard accent="cyan">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Grupo Crítico</p>
              <h3 className="text-2xl font-black text-white bevel-text">{criticalGroup.name}</h3>
              {criticalGroup.sublabel && <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest mt-1">{criticalGroup.sublabel}</p>}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE]">
              <MapPin size={24} />
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
            <span className="text-white/40">Asistencia {range}:</span>
            <span className={criticalGroup.percentage < 70 ? 'text-red-500' : 'text-white'}>{criticalGroup.percentage}%</span>
          </div>
        </GlassCard>
      </div>

      {/* Intervenciones */}
      <AnimatePresence>
        {showInterventions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard title="Alertas de Intervención Inmediata" icon={AlertCircle} accent="orange" className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {interventions.length === 0 ? (
                  <div className="col-span-full p-8 text-center">
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
                      {loadingStats ? 'Analizando datos...' : 'Sin alertas de intervención'}
                    </p>
                  </div>
                ) : interventions.map((alert) => (
                  <div key={alert.id} className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex flex-col justify-between group hover:bg-red-500/10 transition-all">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-red-500 text-[8px] font-black uppercase tracking-widest">Alerta Deserción</span>
                        <span className="text-white/20 text-[8px] font-mono">{alert.userId.substring(0, 8)}</span>
                      </div>
                      <h4 className="text-white text-sm font-black uppercase tracking-tight">{alert.userName}</h4>
                      <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">
                        {alert.groupName} • <span className="text-red-500">{alert.percentage}%</span>
                      </p>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button className="flex-1 py-2 rounded-lg bg-red-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg hover:brightness-110 transition-all">
                        Reportar Tutor
                      </button>
                      <button className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all">
                        <Search size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-12 gap-8">
        {/* Grid panorámico + Monitor individual */}
        <div className="col-span-12 lg:col-span-8">
          <GlassCard title="Vista Panorámica por Grupos" icon={Users} accent="green">
            {loadingGroups ? (
              <div className="p-12 text-center">
                <Loader2 className="animate-spin text-[#DEFF9A] mx-auto mb-3" size={28} />
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Cargando grupos...</p>
              </div>
            ) : groupsData.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">No hay grupos activos en tu institución</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {groupsData.map((group) => (
                  <motion.div
                    key={group.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-5 rounded-[2rem] bg-black/20 border border-white/5 hover:border-[#DEFF9A]/30 transition-all cursor-pointer group relative"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-[#DEFF9A] transition-colors block truncate">
                          {group.name}
                        </span>
                        <span className="text-white/30 text-[8px] font-bold uppercase tracking-widest">{group.sublabel}</span>
                      </div>
                      <ArrowUpRight size={14} className="text-white/20 group-hover:text-white shrink-0" />
                    </div>
                    <div className="h-32 w-full relative">
                      <SafeResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[{ value: group.percentage }, { value: Math.max(0, 100 - group.percentage) }]}
                            cx="50%" cy="50%" innerRadius="65%" outerRadius="90%"
                            paddingAngle={0} dataKey="value" startAngle={90} endAngle={450}
                          >
                            <Cell fill={group.percentage > 80 ? '#DEFF9A' : group.percentage > 70 ? '#4ADE80' : '#F59E0B'} stroke="none" />
                            <Cell fill="rgba(255,255,255,0.05)" stroke="none" />
                          </Pie>
                        </PieChart>
                      </SafeResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
                        <span className="text-xl font-black text-white">{group.percentage}%</span>
                        {group.enRiesgo > 0 && (
                          <span className="text-[7px] text-orange-400 font-black mt-1">{group.enRiesgo} en riesgo</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>

          <div className="mt-8">
            <GlassCard title="Monitor Individual" icon={Search} accent="cyan">
              <div className="mb-8">
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#DEFF9A] transition-colors" size={20} />
                  <input
                    type="text"
                    placeholder="Identificar alumno por nombre o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-16 pr-8 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#DEFF9A]/40 transition-all font-bold tracking-tight"
                  />
                </div>
              </div>

              {searchQuery && (
                <div className="space-y-4">
                  {searchResults.length === 0 ? (
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest text-center py-8">Sin resultados</p>
                  ) : searchResults.map((a) => (
                    <motion.div
                      key={a.userId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-[2rem] bg-black/40 border border-[#DEFF9A]/20 flex items-center gap-6"
                    >
                      <div className="w-14 h-14 rounded-full bg-[#DEFF9A] flex items-center justify-center text-[#061a1a] text-lg font-black ring-4 ring-[#DEFF9A]/20 shrink-0">
                        {(a.nombre || a.email)[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm font-bold uppercase tracking-tight truncate">{a.nombre || 'Sin nombre'}</h4>
                        <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest truncate">
                          {a.email} • {a.groupName}
                        </p>
                        <div className="flex gap-2 mt-3">
                          {a.trend.map((v, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-sm ${v === 1 ? 'bg-[#4ADE80]' : 'bg-red-500/30'}`}
                              title={v === 1 ? 'Presente' : 'Ausente'}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-2xl font-black ${a.porcentaje > 90 ? 'text-[#DEFF9A]' : a.porcentaje > 80 ? 'text-cyan-400' : 'text-orange-400'}`}>
                          {a.porcentaje}%
                        </span>
                        {a.enRiesgo && <p className="text-red-500 text-[8px] font-black uppercase tracking-widest mt-1">En riesgo</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="col-span-12 lg:col-span-4 h-full">
          <GlassCard title="Estado del Sistema" icon={QrCode} accent="green" className="h-full flex flex-col">
            <div className="flex-1 space-y-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Grupos activos</span>
                  <span className="text-[#DEFF9A] text-lg font-black">{groups.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Alumnos totales</span>
                  <span className="text-white text-lg font-black">{allAlumnos.length}</span>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Alumnos en riesgo</span>
                  <span className="text-orange-400 text-lg font-black">{interventions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Rango analizado</span>
                  <span className="text-white text-[11px] font-black">{range}</span>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Estado API</span>
                  <span className="text-[#4ADE80] text-[11px] font-black">
                    {loadingStats ? 'SINCRONIZANDO' : 'ONLINE'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Fuente</span>
                  <span className="text-white text-[11px] font-black">PostgreSQL</span>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-[#DEFF9A]/5 border border-[#DEFF9A]/20 rounded-3xl text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#DEFF9A] mx-auto flex items-center justify-center shadow-[0_0_20px_#DEFF9A40]">
                <CalendarIcon className="text-[#061a1a]" size={24} />
              </div>
              <h4 className="text-white text-[11px] font-black uppercase tracking-widest">Escaneo QR</h4>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest leading-loose">
                Próximamente: entrada automática por QR<br />
                Actualmente: registro manual por docente
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
}