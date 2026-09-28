/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TeacherSchedules.tsx — Mis Horarios de Clase
 * Lee los horarios reales desde /api/english-groups/:email (sesiones por grupo).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Clock, MapPin, Users, Zap, LayoutGrid, Calendar, Layers, Loader2, RefreshCw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { GlassCard } from './GlassCard';
import { useAppContext } from '../context/AppContext';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:3000';

interface ClassBlock {
  id: string;
  day: number;        // 1-5
  start: string;      // HH:MM
  end: string;
  group: string;      // codeId o nombre
  room: string;       // turno o "Aula"
  type: 'PRESENCIAL' | 'VIRTUAL';
  level: string;
  students: number;
}

interface ApiGroup {
  grupo_id: string;
  code_id?: string;
  nombre: string;
  grupo: string;
  nivel: string;
  turno?: string;
  alumnos_inscritos?: number;
  sesiones?: { id: string; horaInicio: string; horaFin: string; dias: string; orden: number }[];
}

const DAYS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'];
const DAY_CODES: Record<string, number> = {
  LU: 1, LUN: 1, LUNES: 1,
  MA: 2, MAR: 2, MARTES: 2,
  MI: 3, MIE: 3, MIÉ: 3, MIERCOLES: 3, MIÉRCOLES: 3,
  JU: 4, JUE: 4, JUEVES: 4,
  VI: 5, VIE: 5, VIERNES: 5,
};

const HOURS = Array.from({ length: 14 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

function parseDayCode(code: string): number[] {
  return code
    .toUpperCase()
    .split(/[,\s\-]+/)
    .map((c) => DAY_CODES[c.trim()])
    .filter((d): d is number => typeof d === 'number' && d >= 1 && d <= 5);
}

export function TeacherSchedules() {
  const { userEmail } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileViewMode, setMobileViewMode] = useState<'LIST' | 'GRID'>('LIST');
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [classes, setClasses] = useState<ClassBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadClasses = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/english-groups/${encodeURIComponent(userEmail)}`);
      const data = await r.json();
      if (!data?.ok || !Array.isArray(data.grupos)) {
        setClasses([]);
        return;
      }
      const blocks: ClassBlock[] = [];
      data.grupos.forEach((g: ApiGroup) => {
        (g.sesiones || []).forEach((s) => {
          const days = parseDayCode(s.dias || '');
          const room = g.turno === 'DISTANCIA / EN LÍNEA' || g.turno === 'VIRTUAL' ? 'Zoom Lab' : 'Aula';
          const type: ClassBlock['type'] = g.turno === 'DISTANCIA / EN LÍNEA' || g.turno === 'VIRTUAL' ? 'VIRTUAL' : 'PRESENCIAL';
          days.forEach((d) => {
            blocks.push({
              id: `${g.grupo_id}-${s.id}-d${d}`,
              day: d,
              start: s.horaInicio,
              end: s.horaFin,
              group: g.code_id ? `${g.code_id} — ${g.nombre}` : g.nombre,
              room,
              type,
              level: g.nivel,
              students: g.alumnos_inscritos ?? 0,
            });
          });
        });
      });
      setClasses(blocks);
    } catch (err) {
      console.warn('[TeacherSchedules] load error:', err);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  const getPositionForTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const minutesSinceStart = (h - 7) * 60 + m;
    return (minutesSinceStart / 60) * 100;
  };

  const getDurationPx = (start: string, end: string) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const durationMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    return (durationMinutes / 60) * 100;
  };

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const showIndicator = currentHour >= 7 && currentHour <= 20;
  const indicatorTop = getPositionForTime(`${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[#DEFF9A] text-[10px] font-black uppercase tracking-[0.4em] mb-1">Operación Diaria</h2>
          <h1 className="text-2xl sm:text-3xl font-black text-white bevel-text uppercase tracking-tight">Mis Horarios de Clase</h1>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">
            {classes.length} bloque{classes.length !== 1 ? 's' : ''} · {new Set(classes.map(c => c.group)).size} grupo(s)
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadClasses}
            disabled={loading}
            className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-white/40 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Recargar
          </button>
          <button className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-white/40 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
            Exportar ICS
          </button>
        </div>
      </header>

      {/* Selector de Vista para móvil */}
      <div className="flex md:hidden bg-white/5 border border-white/10 p-1 rounded-xl gap-1">
        <button
          onClick={() => setMobileViewMode('LIST')}
          className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
            mobileViewMode === 'LIST' ? 'bg-[#DEFF9A] text-[#061a1a] shadow-[0_0_10px_#DEFF9A40]' : 'text-white/40'
          }`}
        >
          Agenda Diaria
        </button>
        <button
          onClick={() => setMobileViewMode('GRID')}
          className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
            mobileViewMode === 'GRID' ? 'bg-[#DEFF9A] text-[#061a1a] shadow-[0_0_10px_#DEFF9A40]' : 'text-white/40'
          }`}
        >
          Parrilla 2D
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#DEFF9A] mb-4" size={36} />
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Cargando horarios...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl">
          <Calendar size={48} className="text-white/10 mb-4" />
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Sin horarios asignados</p>
          <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest mt-2">
            Pide a tu director que asigne sesiones a tus grupos
          </p>
        </div>
      ) : (
        <>
          {/* Vista Agenda (móvil) */}
          {mobileViewMode === 'LIST' && (
            <div className="space-y-4 md:hidden">
              <div className="flex gap-1.5 overflow-x-auto pb-1 snap-x scrollbar-none">
                {DAYS.map((day, idx) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDayIdx(idx)}
                    className={`flex-1 min-w-[85px] text-center py-2.5 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all snap-center shrink-0 border ${
                      selectedDayIdx === idx
                        ? 'bg-[#DEFF9A] text-[#061a1a] border-[#DEFF9A] shadow-[0_0_15px_#DEFF9A30]'
                        : 'bg-black/40 text-white/40 border-white/5 hover:text-white'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {classes.filter(s => s.day === selectedDayIdx + 1).length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl bg-black/20">
                    <Calendar size={20} className="mx-auto text-white/10 mb-2" />
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Sin Clases Programadas</p>
                  </div>
                ) : (
                  classes
                    .filter(s => s.day === selectedDayIdx + 1)
                    .map(item => (
                      <div key={item.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#DEFF9A]/5 to-transparent pointer-events-none" />
                        <div className="flex items-center justify-between mb-2 relative z-10">
                          <div className="flex items-center gap-1 text-[#DEFF9A] text-[9px] font-black uppercase tracking-wider">
                            <Clock size={11} />
                            <span>{item.start} - {item.end}</span>
                          </div>
                          {item.type === 'VIRTUAL' ? (
                            <span className="px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[7px] font-black uppercase rounded tracking-wider flex items-center gap-0.5">
                              <Zap size={8} /> VIRTUAL
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/40 text-[7px] font-black uppercase rounded tracking-wider flex items-center gap-0.5">
                              <Layers size={8} /> PRESENCIAL
                            </span>
                          )}
                        </div>
                        <h4 className="text-white text-sm font-black uppercase tracking-tight mb-2 relative z-10">{item.group}</h4>
                        <div className="flex items-center gap-4 text-white/40 text-[8px] font-black uppercase tracking-wider border-t border-white/5 pt-2 relative z-10">
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPin size={10} className="text-[#DEFF9A] shrink-0" />
                            <span className="truncate">{item.room}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Users size={10} className="text-white/20" />
                            <span>{item.students} ALUMNOS</span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* Vista Parrilla 2D */}
          <GlassCard accent="green" className={`!p-0 overflow-hidden ${mobileViewMode === 'LIST' ? 'hidden md:block' : 'block'}`}>
            <div className="overflow-x-auto overflow-y-auto max-h-[550px] md:max-h-none custom-scrollbar">
              <div className="min-w-[1200px] h-[1400px] relative p-12">
                <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-4 sticky top-0 z-20 mb-8 pb-4 bg-transparent backdrop-blur-2xl">
                  <div />
                  {DAYS.map(day => (
                    <div key={day} className="text-center">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">{day}</p>
                    </div>
                  ))}
                </div>

                <div className="relative">
                  <div className="absolute inset-x-0 top-0 h-full pointer-events-none">
                    {HOURS.map((hour, idx) => (
                      <div key={hour} style={{ top: `${idx * 100}px` }} className="absolute inset-x-0 h-px border-t border-white/5 flex items-center">
                        <span className="text-[10px] font-mono font-black text-white/10 -ml-16 w-12 text-right">{hour}</span>
                      </div>
                    ))}
                  </div>

                  {showIndicator && (
                    <div
                      style={{ top: `${indicatorTop}px` }}
                      className="absolute inset-x-0 z-30 pointer-events-none flex items-center"
                    >
                      <div className="w-full h-[2px] bg-[#DEFF9A] shadow-[0_0_15px_#DEFF9A]" />
                      <div className="shrink-0 ml-4 px-3 py-1 bg-[#DEFF9A] text-[#061a1a] text-[9px] font-black uppercase tracking-widest rounded-full shadow-[0_0_20px_#DEFF9A80]">
                        Ahora
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-4 h-full">
                    <div />
                    {DAYS.map((day, dayIdx) => (
                      <div key={day} className="relative h-full border-x border-white/[0.02]">
                        {classes
                          .filter(s => s.day === dayIdx + 1)
                          .map(item => (
                            <motion.div
                              key={item.id}
                              whileHover={{ scale: 1.02, x: 2 }}
                              style={{
                                top: `${getPositionForTime(item.start)}px`,
                                height: `${getDurationPx(item.start, item.end)}px`
                              }}
                              className="absolute inset-x-2 z-10 neo-glass border-white/20 p-4 rounded-3xl group overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-[#DEFF9A]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="relative border-l-2 border-[#DEFF9A] pl-3 h-full flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-[#DEFF9A] text-[10px] font-black uppercase tracking-widest">{item.start} - {item.end}</p>
                                    {item.type === 'VIRTUAL' ? <Zap size={12} className="text-cyan-400" /> : <Layers size={12} className="text-white/20" />}
                                  </div>
                                  <h4 className="text-white text-sm font-black uppercase tracking-tight truncate">{item.group}</h4>
                                  <p className="text-white/30 text-[8px] font-black uppercase tracking-widest mt-1">Nivel {item.level}</p>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-white/30 text-[9px] font-black uppercase tracking-widest">
                                    <MapPin size={10} /> {item.room}
                                  </div>
                                  <div className="flex items-center gap-2 text-white/30 text-[9px] font-black uppercase tracking-widest">
                                    <Users size={10} /> {item.students} ALUMNOS
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}