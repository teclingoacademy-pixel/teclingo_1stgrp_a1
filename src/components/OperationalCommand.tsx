/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * OperationalCommand.tsx
 * Dashboard operativo del Director - conectado a datos reales.
 */

import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Calendar, TrendingUp } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { useAppContext } from '../context/AppContext';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

interface ScheduleItem {
  scheduleId: string;
  groupId: string;
  groupCode: string;
  groupName: string;
  groupLetter: string;
  nivel: string;
  teacherName: string | null;
  teacherInitials: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'ok' | 'alert' | 'conflict';
  conflictReason: string | null;
  dayCode: string;
}

interface DayBlock {
  date: string;
  dayCode: string;
  totalClasses: number;
  schedule: ScheduleItem[];
}

type ViewMode = 'day' | 'week';

const DAY_LABELS: Record<string, string> = {
  LU: 'Lunes', MA: 'Martes', MI: 'Miercoles', JU: 'Jueves',
  VI: 'Viernes', SA: 'Sabado', DO: 'Domingo',
};

export function OperationalCommand() {
  const { userEmail } = useAppContext();
  const [view, setView] = useState<ViewMode>('day');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState<string>('');
  const [dayCode, setDayCode] = useState<string>('');
  const [totalActiveClasses, setTotalActiveClasses] = useState(0);
  const [dayItems, setDayItems] = useState<ScheduleItem[]>([]);
  const [weekDays, setWeekDays] = useState<DayBlock[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = view === 'day'
      ? `${API_BASE}/api/operations/schedule${userEmail ? '?directorEmail=' + encodeURIComponent(userEmail) : ''}`
      : `${API_BASE}/api/operations/schedule-week${userEmail ? '?directorEmail=' + encodeURIComponent(userEmail) : ''}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.ok) throw new Error(data.error || 'Error al cargar');
        if (view === 'day') {
          setDateStr(data.date);
          setDayCode(data.dayCode);
          setTotalActiveClasses(data.totalActiveClasses);
          setDayItems(data.schedule || []);
        } else {
          setWeekDays(data.days || []);
          setTotalActiveClasses(data.totalActiveClasses);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[OperationalCommand] Error:', err);
        setError(err.message || 'Error de conexion');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [view, userEmail]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso + 'T12:00:00');
      return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return iso; }
  };

  const renderCard = (item: ScheduleItem, key: string) => {
    const isAlert = item.status === 'alert' || item.status === 'conflict';
    return (
      <div
        key={key}
        className={`flex-shrink-0 w-64 p-5 rounded-3xl neo-glass transition-all group relative ${
          isAlert ? 'border-[#F59E0B]/40 bg-[#F59E0B]/5' : 'border-white/5 bg-black/20'
        }`}
      >
        <div className="absolute inset-0 border-t border-l border-white/5 rounded-3xl pointer-events-none" />
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-white font-bold text-sm tracking-tight">GRUPO {item.groupLetter} - {item.nivel}</h4>
            <p className="text-white/40 text-[9px] uppercase font-bold tracking-widest mt-1 opacity-60">{item.location}</p>
          </div>
          {isAlert ? (
            <div className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_12px_#F59E0B]" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-[#DEFF9A] shadow-[0_0_8px_#DEFF9A]" />
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
              item.teacherName ? 'bg-white/5 text-white/60' : 'bg-white/5 text-white/30'
            }`}>
              {item.teacherInitials}
            </div>
            <div>
              <p className={`text-[10px] uppercase font-bold ${item.teacherName ? 'text-white/60' : 'text-white/30'}`}>
                {item.teacherName ? `Mtro. ${item.teacherName}` : 'Sin docente'}
              </p>
              <p className="text-white/30 text-[9px] uppercase font-bold">{item.startTime} - {item.endTime}</p>
            </div>
          </div>
        </div>
        {item.conflictReason && (
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
            <AlertCircle size={12} className="text-[#F59E0B]" />
            <span className="text-[#F59E0B] text-[9px] font-bold uppercase tracking-tighter">{item.conflictReason}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <GlassCard className="col-span-12" delay={0.1}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <TrendingUp size={16} className="text-[#DEFF9A]" />
            <div className="text-white/40 text-[10px] uppercase font-bold tracking-widest">
              {view === 'day'
                ? `${dateStr ? formatDate(dateStr) : '...'} - ${totalActiveClasses} ${totalActiveClasses === 1 ? 'Clase Activa' : 'Clases Activas'}`
                : `Semana actual - ${totalActiveClasses} ${totalActiveClasses === 1 ? 'Clase' : 'Clases'} totales`}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                view === 'day' ? 'bg-[#DEFF9A] text-black' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Calendar size={12} className="inline mr-1" /> Dia
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                view === 'week' ? 'bg-[#DEFF9A] text-black' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Calendar size={12} className="inline mr-1" /> Semana
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 text-white/40">
            <Loader2 size={20} className="animate-spin mr-3" />
            <span className="text-[10px] font-black uppercase tracking-widest">Cargando operaciones...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertCircle size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
          </div>
        )}

        {!loading && !error && view === 'day' && (
          <>
            {dayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/20">
                <Calendar size={40} className="mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest">No hay clases hoy</p>
                <p className="text-[9px] text-white/30 mt-1">{DAY_LABELS[dayCode] || dayCode}</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {dayItems.map((item) => renderCard(item, item.scheduleId))}
              </div>
            )}
          </>
        )}

        {!loading && !error && view === 'week' && (
          <div className="space-y-6">
            {weekDays.map((day) => (
              <div key={day.date}>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-[#DEFF9A] text-[10px] font-black uppercase tracking-widest">
                    {DAY_LABELS[day.dayCode] || day.dayCode} - {formatDate(day.date)}
                  </p>
                  <div className="flex-1 h-px bg-white/10" />
                  <p className="text-white/40 text-[9px] font-bold">{day.totalClasses} {day.totalClasses === 1 ? 'clase' : 'clases'}</p>
                </div>
                {day.schedule.length === 0 ? (
                  <p className="text-white/20 text-[9px] uppercase tracking-widest pl-4">Sin clases</p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {day.schedule.map((item) => renderCard(item, item.scheduleId))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
