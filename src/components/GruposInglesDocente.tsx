/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Languages, Users, BookOpen, Clock, Copy, Check, CheckCircle, XCircle, AlertTriangle, FileText, Save, MessageCircle, List, LayoutGrid } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import identityService from '../services/identityService';
import { obtenerAsistenciaGrupo, registrarAsistencia } from '../services/identityService';
import type { GrupoIngles, MiembroGrupo } from '../services/identityService';

type EstadoAsistencia = 'PRESENTE' | 'AUSENTE' | 'RETRASO' | 'JUSTIFICADO';
type TabMode = 'GRUPOS' | 'ALUMNOS';

const ESTADO_CONFIG: Record<EstadoAsistencia, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  PRESENTE:    { label: 'Presente',   icon: CheckCircle,    color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/30' },
  AUSENTE:     { label: 'Falta',      icon: XCircle,        color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30' },
  RETRASO:     { label: 'Retraso',    icon: AlertTriangle,  color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30' },
  JUSTIFICADO: { label: 'Justificado',icon: FileText,       color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30' },
};

interface AlumnoGlobal extends MiembroGrupo {
  grupo_nombre: string;
  grupo_nivel: string;
}

export function GruposInglesDocente() {
  const { userEmail, userName, currentRole, setQuickChatUser } = useAppContext();
  const email = userEmail || '';
  const [tab, setTab] = useState<TabMode>('GRUPOS');
  const [grupos, setGrupos] = useState<GrupoIngles[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMiembros, setShowMiembros] = useState<string | null>(null);
  const [miembros, setMiembros] = useState<MiembroGrupo[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [asistencia, setAsistencia] = useState<Record<string, EstadoAsistencia>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().slice(0, 10));

  // Estado para Mis Alumnos
  const [todosAlumnos, setTodosAlumnos] = useState<AlumnoGlobal[]>([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [searchAlumno, setSearchAlumno] = useState('');

  useEffect(() => {
    const cargar = async () => {
      const data = await identityService.listarGruposIngles(email);
      setGrupos(data);
      setLoading(false);
    };
    cargar();
  }, [email]);

  // Cargar todos los alumnos de todos los grupos del docente
  useEffect(() => {
    if (tab !== 'ALUMNOS' || grupos.length === 0) return;
    const cargarTodos = async () => {
      setLoadingAlumnos(true);
      const todos: AlumnoGlobal[] = [];
      for (const g of grupos) {
        try {
          const miembrosGrupo = await identityService.obtenerMiembrosDeGrupo(email, g.grupo_id);
          miembrosGrupo.forEach(m => {
            todos.push({
              ...m,
              grupo_nombre: `${g.nombre} — ${g.grupo}`,
              grupo_nivel: g.nivel,
            });
          });
        } catch {}
      }
      setTodosAlumnos(todos);
      setLoadingAlumnos(false);
    };
    cargarTodos();
  }, [tab, grupos, email]);

  const alumnosFiltrados = useMemo(() => {
    if (!searchAlumno) return todosAlumnos;
    const s = searchAlumno.toLowerCase();
    return todosAlumnos.filter(a =>
      a.nombre?.toLowerCase().includes(s) ||
      a.email?.toLowerCase().includes(s) ||
      a.grupo_nombre?.toLowerCase().includes(s)
    );
  }, [todosAlumnos, searchAlumno]);

  const statsAlumnos = useMemo(() => ({
    total: todosAlumnos.length,
    grupos: grupos.length,
  }), [todosAlumnos, grupos]);

  const cargarMiembros = async (grupoId: string) => {
    setShowMiembros(grupoId);
    setAsistencia({});
    setSavedMsg('');
    const data = await identityService.obtenerMiembrosDeGrupo(email, grupoId);
    setMiembros(data);

    const existente = await obtenerAsistenciaGrupo(email, grupoId, fechaSeleccionada);
    if (existente.length > 0) {
      const estadoMap: Record<string, EstadoAsistencia> = {};
      existente.forEach(a => { estadoMap[a.user_id] = a.estado as EstadoAsistencia; });
      setAsistencia(estadoMap);
    }
  };

  const setEstado = (userId: string, estado: EstadoAsistencia) => {
    setAsistencia(prev => ({ ...prev, [userId]: estado }));
  };

  const handleGuardar = async (grupoId: string) => {
    setSaving(true);
    setSavedMsg('');
    const registros = miembros.map(m => ({
      user_id: m.user_id, email: m.email, nombre: m.nombre,
      estado: asistencia[m.user_id] || 'AUSENTE'
    }));
    const res = await registrarAsistencia(email, grupoId, registros, fechaSeleccionada);
    setSaving(false);
    if (res.ok) {
      setSavedMsg(`✅ Asistencia guardada — ${res.registrados} registros (${fechaSeleccionada})`);
    } else {
      setSavedMsg(`❌ Error: ${res.error}`);
    }
  };

  const copiarCode = (codeId: string) => {
    navigator.clipboard.writeText(codeId);
    setCopiedCode(codeId);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const abrirChat = (alumnoEmail: string, alumnoNombre: string) => {
    setQuickChatUser({
      id: alumnoEmail,
      email: alumnoEmail,
      name: alumnoNombre,
      rol: 'ALUMNO',
    });
  };

  const stats = (grupoId: string) => {
    const total = miembros.length;
    const presentes = Object.values(asistencia).filter(e => e === 'PRESENTE').length;
    const faltas = Object.values(asistencia).filter(e => e === 'AUSENTE').length;
    const retrasos = Object.values(asistencia).filter(e => e === 'RETRASO').length;
    const justificados = Object.values(asistencia).filter(e => e === 'JUSTIFICADO').length;
    return { total, presentes, faltas, retrasos, justificados };
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-[#DEFF9A] text-[10px] font-black uppercase tracking-[0.4em] mb-1">Mis Grupos de Inglés</h2>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">
          GRUPOS <span className="text-[#DEFF9A]">CLE</span>
        </h1>
      </header>

      {/* TABS */}
      <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden w-fit">
        <button
          onClick={() => setTab('GRUPOS')}
          className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
            tab === 'GRUPOS' ? 'bg-[#DEFF9A] text-[#061a1a]' : 'text-white/40 hover:text-white'
          }`}
        >
          <BookOpen size={12} /> Mis Grupos
        </button>
        <button
          onClick={() => setTab('ALUMNOS')}
          className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
            tab === 'ALUMNOS' ? 'bg-[#DEFF9A] text-[#061a1a]' : 'text-white/40 hover:text-white'
          }`}
        >
          <Users size={12} /> Mis Alumnos ({statsAlumnos.total})
        </button>
      </div>

      {/* TAB: GRUPOS */}
      {tab === 'GRUPOS' && (
        loading ? (
          <div className="text-white/40 text-xs">Cargando grupos...</div>
        ) : grupos.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center space-y-3">
            <Languages size={32} className="text-white/20 mx-auto" />
            <p className="text-white/40 text-xs">No tienes grupos de inglés asignados aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grupos.map(g => (
              <div key={g.grupo_id} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-bold text-sm">{g.nombre} — Grupo {g.grupo}</h3>
                    <p className="text-white/50 text-xs">{g.nivel} · {g.turno || 'Sin turno'}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-[#DEFF9A]/10 text-[#DEFF9A]">{g.nivel}</span>
                </div>

                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                  <span className="text-white/40 text-xs">Code:</span>
                  <span className="text-[#DEFF9A] font-mono font-bold text-sm tracking-wider">{g.code_id}</span>
                  <button onClick={() => copiarCode(g.code_id)} className="ml-auto text-white/40 hover:text-[#DEFF9A] transition-colors">
                    {copiedCode === g.code_id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 rounded-lg px-3 py-2">
                    <p className="text-white/40 text-[10px]">Alumnos</p>
                    <p className="text-white font-bold">{g.alumnos_inscritos || 0} / {g.capacidad}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg px-3 py-2">
                    <p className="text-white/40 text-[10px]">Horario</p>
                    <p className="text-white font-bold">
                      {g.sesiones && g.sesiones.length > 0
                        ? g.sesiones.map(s => `${s.horaInicio}-${s.horaFin}`).join(', ')
                        : '—'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => showMiembros === g.grupo_id ? setShowMiembros(null) : cargarMiembros(g.grupo_id)}
                  className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white/60 text-[10px] font-bold uppercase hover:bg-[#DEFF9A]/10 hover:text-[#DEFF9A] transition-colors"
                >
                  <Users size={12} /> {showMiembros === g.grupo_id ? 'Cerrar Lista' : 'ASISTENCIA DE ALUMNOS'}
                </button>

                {showMiembros === g.grupo_id && (
                  <div className="pt-2 border-t border-white/5 space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="text-white/40 text-[10px] font-bold uppercase">Fecha:</label>
                      <input
                        type="date"
                        value={fechaSeleccionada}
                        onChange={e => setFechaSeleccionada(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#DEFF9A] [color-scheme:dark]"
                      />
                    </div>

                    {miembros.length === 0 ? (
                      <p className="text-white/30 text-[10px] py-2">No hay alumnos inscritos aún.</p>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {miembros.map(m => (
                            <div key={m.asignacion_id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                              {/* REGLA UNIVERSAL — avatar real del usuario */}
                              <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 bg-[#DEFF9A]/10 flex items-center justify-center">
                                <span className="text-[#DEFF9A] text-[10px] font-bold">{m.nombre?.charAt(0)?.toUpperCase() || '?'}</span>
                                {m.avatar && (
                                  <img
                                    src={m.avatar}
                                    alt={m.nombre || 'Alumno'}
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onError={e => { e.currentTarget.style.display = 'none'; }}
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <p className="text-white text-[11px] font-bold truncate">{m.nombre}</p>
                                  {m.numero_control && (
                                    <span className="text-[#38BDF8] text-[7px] font-black font-mono px-1 py-0.5 rounded bg-[#38BDF8]/10 shrink-0">{m.numero_control}</span>
                                  )}
                                </div>
                                <p className="text-white/30 text-[9px] truncate">{m.email}</p>
                              </div>
                              {/* Botón mensaje */}
                              <button
                                onClick={() => abrirChat(m.email, m.nombre)}
                                title={`Enviar mensaje a ${m.nombre}`}
                                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/30 hover:bg-[#38BDF8]/10 hover:text-[#38BDF8] hover:border-[#38BDF8]/30 transition-all shrink-0"
                              >
                                <MessageCircle size={12} />
                              </button>
                              <div className="flex gap-1 shrink-0">
                                {(Object.keys(ESTADO_CONFIG) as EstadoAsistencia[]).map(estado => {
                                  const cfg = ESTADO_CONFIG[estado];
                                  const Icon = cfg.icon;
                                  const activo = asistencia[m.user_id] === estado;
                                  return (
                                    <button
                                      key={estado}
                                      onClick={() => setEstado(m.user_id, estado)}
                                      title={cfg.label}
                                      className={`p-1.5 rounded-lg border transition-all ${
                                        activo
                                          ? `${cfg.bg} ${cfg.color} scale-110`
                                          : 'bg-white/5 border-white/10 text-white/20 hover:bg-white/10'
                                      }`}
                                    >
                                      <Icon size={12} />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                        {Object.keys(asistencia).length > 0 && (
                          <div className="flex gap-2 text-[9px] font-bold">
                            <span className="text-green-400">{stats(g.grupo_id).presentes} P</span>
                            <span className="text-red-400">{stats(g.grupo_id).faltas} F</span>
                            <span className="text-yellow-400">{stats(g.grupo_id).retrasos} R</span>
                            <span className="text-blue-400">{stats(g.grupo_id).justificados} J</span>
                          </div>
                        )}

                        <button
                          onClick={() => handleGuardar(g.grupo_id)}
                          disabled={saving || Object.keys(asistencia).length === 0}
                          className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-[#DEFF9A] text-[#061a1a] font-black text-[10px] uppercase rounded hover:bg-[#c5e68a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Save size={12} /> {saving ? 'Guardando...' : 'Guardar Asistencia'}
                        </button>

                        {savedMsg && (
                          <p className={`text-[10px] text-center ${savedMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                            {savedMsg}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* TAB: MIS ALUMNOS */}
      {tab === 'ALUMNOS' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DEFF9A]/10 flex items-center justify-center text-[#DEFF9A]">
                <Users size={18} />
              </div>
              <div>
                <p className="text-lg font-black text-white leading-none">{statsAlumnos.total}</p>
                <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Total Alumnos</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 flex items-center justify-center text-[#38BDF8]">
                <BookOpen size={18} />
              </div>
              <div>
                <p className="text-lg font-black text-[#38BDF8] leading-none">{statsAlumnos.grupos}</p>
                <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Grupos</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar alumno por nombre, email o grupo..."
              value={searchAlumno}
              onChange={e => setSearchAlumno(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-[#DEFF9A]/30 transition-all"
            />
          </div>

          {/* Lista */}
          {loadingAlumnos ? (
            <div className="text-white/30 text-xs text-center py-10">Cargando alumnos...</div>
          ) : alumnosFiltrados.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Users size={32} className="text-white/10 mx-auto" />
              <p className="text-white/30 text-xs">
                {todosAlumnos.length === 0
                  ? 'No hay alumnos inscritos en tus grupos.'
                  : 'No se encontraron alumnos con esos criterios.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {alumnosFiltrados.map(a => (
                <div key={a.asignacion_id} className="flex items-center gap-3 sm:gap-4 bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 hover:border-[#DEFF9A]/20 hover:bg-white/[0.07] transition-all">
                  {/* REGLA UNIVERSAL — avatar/imagen real del usuario para ubicación visual */}
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 bg-[#DEFF9A]/10 border border-white/10 flex items-center justify-center">
                    <span className="text-[#DEFF9A] text-sm font-black">{a.nombre?.charAt(0)?.toUpperCase() || '?'}</span>
                    {a.avatar && (
                      <img
                        src={a.avatar}
                        alt={a.nombre || 'Alumno'}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-white text-xs sm:text-sm font-black truncate">{a.nombre}</p>
                      {a.numero_control && (
                        <span className="text-[#38BDF8] text-[7px] sm:text-[8px] font-black font-mono px-1.5 py-0.5 rounded bg-[#38BDF8]/10 border border-[#38BDF8]/20 shrink-0">{a.numero_control}</span>
                      )}
                    </div>
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
                      <span className="text-white/30 text-[9px] truncate max-w-[150px]">{a.email}</span>
                      <span className="text-white/10">•</span>
                      <span className="text-[#DEFF9A] text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#DEFF9A]/10">{a.grupo_nivel}</span>
                      <span className="text-white/20 text-[8px]">{a.grupo_nombre}</span>
                      {a.carrera && <span className="text-white/25 text-[7px] font-bold uppercase truncate max-w-[130px]">{a.carrera}</span>}
                      {a.semestre && <span className="text-white/25 text-[7px] font-bold">{a.semestre}° Sem</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => abrirChat(a.email, a.nombre)}
                    title={`Enviar mensaje a ${a.nombre}`}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/30 hover:bg-[#38BDF8]/10 hover:text-[#38BDF8] hover:border-[#38BDF8]/30 transition-all shrink-0"
                  >
                    <MessageCircle size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
