/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DirectorAnalytics.tsx
 * Dashboard de analytics para el Director: sesiones, herramientas, usuarios.
 */

import { useState, useEffect } from 'react';
import { Activity, Users, Clock, BarChart3, TrendingUp, Loader2, Wrench, Trophy } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { apiUrl } from '../services/apiConfig';

interface DirectorData {
  period: { days: number; since: string };
  totalSessions: number;
  uniqueUsers: number;
  avgDurationSec: number;
  totalTimeSec: number;
  sessionsByDay: Record<string, number>;
  topTools: Array<{ name: string; count: number }>;
  topUsers: Array<{ id: string; email: string; name: string | null; sessionCount: number }>;
}

function formatDuration(sec: number): string {
  if (sec < 60) return sec + 's';
  const min = Math.round(sec / 60);
  if (min < 60) return min + ' min';
  const hrs = (min / 60).toFixed(1);
  return hrs + ' h';
}

export function DirectorAnalytics() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<DirectorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(apiUrl('/api/analytics/director?days=' + days))
      .then(r => r.ok ? r.json() : Promise.reject('HTTP ' + r.status))
      .then(json => {
        if (cancelled) return;
        if (json?.success && json?.data) setData(json.data);
        else setError('Sin datos');
      })
      .catch(e => { if (!cancelled) setError(String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days]);

  const maxSessionCount = data ? Math.max(...Object.values(data.sessionsByDay), 1) : 1;
  const maxToolCount = data && data.topTools.length > 0 ? data.topTools[0].count : 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity size={20} className="text-[#DEFF9A]" />
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Analytics de Plataforma
            </h1>
          </div>
          <p className="text-white/40 text-xs">
            Monitoreo de uso, herramientas y actividad de los alumnos
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/40 border border-white/5 self-start sm:self-auto">
          {[1, 7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={'px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ' + (days === d ? 'bg-[#DEFF9A] text-[#061a1a]' : 'text-white/50 hover:text-white hover:bg-white/5')}
            >
              {d === 1 ? '24h' : d + 'd'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-[#DEFF9A] animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          Error: {error}
        </div>
      )}

      {data && !loading && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard className="!p-5">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={14} className="text-[#DEFF9A]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Sesiones</span>
              </div>
              <div className="text-3xl font-black text-white">{data.totalSessions}</div>
              <div className="text-[10px] text-white/30 mt-1">en {days} día{days > 1 ? 's' : ''}</div>
            </GlassCard>

            <GlassCard className="!p-5">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-[#22D3EE]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Usuarios activos</span>
              </div>
              <div className="text-3xl font-black text-white">{data.uniqueUsers}</div>
              <div className="text-[10px] text-white/30 mt-1">únicos</div>
            </GlassCard>

            <GlassCard className="!p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-[#A855F7]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Duración prom.</span>
              </div>
              <div className="text-3xl font-black text-white">{formatDuration(data.avgDurationSec)}</div>
              <div className="text-[10px] text-white/30 mt-1">por sesión</div>
            </GlassCard>

            <GlassCard className="!p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-[#F59E0B]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Tiempo total</span>
              </div>
              <div className="text-3xl font-black text-white">{formatDuration(data.totalTimeSec)}</div>
              <div className="text-[10px] text-white/30 mt-1">acumulado</div>
            </GlassCard>
          </div>

          {/* Sesiones por día */}
          <GlassCard title="Sesiones por día" icon={BarChart3} accent="cyan">
            {Object.keys(data.sessionsByDay).length === 0 ? (
              <p className="text-white/40 text-xs text-center py-8">Sin sesiones en el período</p>
            ) : (
              <div className="flex items-end gap-2 h-40 pt-4">
                {Object.entries(data.sessionsByDay).sort().map(([day, count]) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-[10px] font-black text-white/60">{count}</div>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[#22D3EE]/60 to-[#22D3EE] transition-all"
                      style={{ height: (count / maxSessionCount) * 100 + 'px' }}
                    />
                    <div className="text-[8px] text-white/30 font-mono">{day.slice(5)}</div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top herramientas */}
            <GlassCard title="Herramientas más usadas" icon={Wrench} accent="green">
              {data.topTools.length === 0 ? (
                <p className="text-white/40 text-xs text-center py-8">Sin datos de herramientas</p>
              ) : (
                <div className="space-y-3">
                  {data.topTools.slice(0, 5).map((tool, i) => (
                    <div key={tool.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-[#DEFF9A]">#{i + 1}</span>
                          <span className="text-xs font-bold text-white">{tool.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-white/50">{tool.count} usos</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#DEFF9A] rounded-full transition-all"
                          style={{ width: (tool.count / maxToolCount) * 100 + '%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Top usuarios */}
            <GlassCard title="Usuarios más activos" icon={Trophy} accent="purple">
              {data.topUsers.length === 0 ? (
                <p className="text-white/40 text-xs text-center py-8">Sin usuarios activos</p>
              ) : (
                <div className="space-y-2">
                  {data.topUsers.slice(0, 5).map((user, i) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-[#DEFF9A]/10 border border-[#DEFF9A]/30 flex items-center justify-center text-[#DEFF9A] text-xs font-black shrink-0">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{user.name || 'Sin nombre'}</div>
                        <div className="text-[10px] text-white/40 truncate">{user.email}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-[#DEFF9A]">{user.sessionCount}</div>
                        <div className="text-[8px] text-white/30 uppercase tracking-widest">sesiones</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}

export default DirectorAnalytics;
