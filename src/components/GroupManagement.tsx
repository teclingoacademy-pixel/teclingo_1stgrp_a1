/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Users,
  ChevronDown,
  Eye,
  TrendingUp,
  Mic2,
  CheckCircle2,
  MoreVertical,
  X,
  Zap,
  Plus,
  MessageCircle,
  Calendar,
  Clock,
  LayoutGrid,
  List as ListIcon,
  ShieldCheck,
  UserCheck,
  FolderOpen,
  Check,
  UserX,
  ShieldAlert,
  Info,
  Lock,
  ArrowLeft,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from './GlassCard';
import { useAppContext, Group } from '../context/AppContext';
import identityService, { registrarAsistencia, obtenerAsistenciaGrupo, type RegistroAsistencia, type GrupoIngles, type MiembroGrupo } from '../services/identityService';

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  photo: string;
}

export function GroupManagement({ onTakeAttendance }: { onTakeAttendance?: (group: string) => void }) {
  const { currentRole, groups, addGroup, deleteGroup, updateGroup, setQuickChatUser, userEmail } = useAppContext();

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [layoutMode, setLayoutMode] = useState<'cards' | 'table'>('cards');

  const [openedGroupId, setOpenedGroupId] = useState<string | null>(null);

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [attendanceState, setAttendanceState] = useState<Record<string, 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO' | 'RETRASO' | 'SIN_REGISTRO'>>({});

  const [realGroups, setRealGroups] = useState<GrupoIngles[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [realMembers, setRealMembers] = useState<Record<string, MiembroGrupo[]>>({});

  useEffect(() => {
    if (!userEmail) return;
    let cancelled = false;
    const load = async () => {
      setLoadingGroups(true);
      try {
        const data = await identityService.listarGruposIngles(userEmail);
        if (!cancelled) setRealGroups(data);
      } catch (err) {
        console.warn('[GroupManagement] Error loading groups:', err);
      } finally {
        if (!cancelled) setLoadingGroups(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail || realGroups.length === 0) return;
    let cancelled = false;
    const loadAll = async () => {
      const map: Record<string, MiembroGrupo[]> = {};
      for (const g of realGroups) {
        try {
          const members = await identityService.obtenerMiembrosDeGrupo(userEmail, g.grupo_id);
          if (!cancelled) map[g.grupo_id] = members;
        } catch { /* skip */ }
      }
      if (!cancelled) setRealMembers(map);
    };
    loadAll();
    return () => { cancelled = true; };
  }, [userEmail, realGroups]);

  useEffect(() => {
    if (!openedGroupId || !userEmail) {
      setAttendanceState({});
      return;
    }
    let cancelled = false;
    const loadAttendance = async () => {
      setAttendanceLoading(true);
      try {
        const records = await obtenerAsistenciaGrupo(userEmail, openedGroupId, attendanceDate);
        if (cancelled) return;
        const stateMap: Record<string, 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO' | 'RETRASO' | 'SIN_REGISTRO'> = {};
        const members = realMembers[openedGroupId] || [];
        members.forEach(m => { stateMap[m.user_id] = 'SIN_REGISTRO'; });
        records.forEach((r: any) => {
          if (r.user_id && r.estado) {
            stateMap[r.user_id] = r.estado as any;
          }
        });
        setAttendanceState(stateMap);
      } catch (err) {
        console.warn('[GroupManagement] loadAttendance error:', err);
      } finally {
        if (!cancelled) setAttendanceLoading(false);
      }
    };
    loadAttendance();
    return () => { cancelled = true; };
  }, [openedGroupId, attendanceDate, userEmail, realMembers]);

  const saveAttendance = useCallback(async (groupId: string, studentId: string, estado: 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO' | 'RETRASO') => {
    if (!userEmail) return;
    const members = realMembers[groupId] || [];
    const member = members.find(m => m.user_id === studentId);
    try {
      const registros: RegistroAsistencia[] = [{
        user_id: studentId,
        email: member?.email || `${studentId}@teclingo.edu`,
        nombre: member?.nombre || studentId,
        estado,
      }];
      await registrarAsistencia(userEmail, groupId, registros, attendanceDate);
    } catch (err) {
      console.warn('[GroupManagement] saveAttendance error:', err);
    }
  }, [userEmail, attendanceDate, realMembers]);

  const [newGroup, setNewGroup] = useState<Partial<Group>>({
    name: '',
    level: 'A1 - Beginner',
    teacherId: '',
    studentIds: [],
    schedule: '08:00 - 10:00',
    time: '08:00 AM',
    days: ['LUN', 'MIÉ', 'VIE'],
    status: 'ACTIVE'
  });

  const filteredGroups = useMemo(() => {
    if (currentRole === 'DIRECTOR') return groups;
    return realGroups.map(g => {
      const sesiones = g.sesiones || [];
      const schedule = sesiones.map(s => `${s.horaInicio}-${s.horaFin}`).join('; ');
      const days = sesiones.flatMap(s => s.dias.split(',').map(d => d.trim()));
      return {
        id: g.grupo_id,
        name: `${g.nombre} — ${g.grupo}`,
        level: g.nivel || 'A1',
        teacherId: g.docente_email || '',
        studentIds: (realMembers[g.grupo_id] || []).map(m => m.user_id),
        schedule,
        time: schedule,
        days,
        status: (g.status || 'ACTIVE') as 'ACTIVE',
        room: '',
        type: 'PRESENCIAL' as const,
      };
    });
  }, [currentRole, groups, realGroups, realMembers]);

  const activeGroup = useMemo(() => {
    const found = filteredGroups.find(g => g.id === selectedGroupId);
    return found || filteredGroups[0];
  }, [filteredGroups, selectedGroupId]);

  useEffect(() => {
    if (!selectedGroupId && filteredGroups.length > 0) {
      setSelectedGroupId(filteredGroups[0].id);
    }
  }, [filteredGroups, selectedGroupId]);

  const handleAddGroup = () => {
    if (newGroup.name && newGroup.teacherId) {
      addGroup({
        ...newGroup as Group,
        id: `GRP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      });
      setShowAddModal(false);
      setNewGroup({
        name: '',
        level: 'A1 - Beginner',
        teacherId: '',
        studentIds: [],
        schedule: '08:00 - 10:00',
        time: '08:00 AM',
        days: ['LUN', 'MIÉ', 'VIE'],
        status: 'ACTIVE'
      });
    }
  };

  const getMemberInfo = (groupId: string, userId: string): StudentRecord => {
    const members = realMembers[groupId] || [];
    const member = members.find(m => m.user_id === userId);
    return {
      id: userId,
      name: member?.nombre || userId,
      email: member?.email || '',
      photo: `https://i.pravatar.cc/150?u=${userId}`,
    };
  };

  const levels = ['A1 - Beginner', 'A2 - Pre-Int', 'B1 - Intermediate', 'B2 - Upper-Int', 'C1 - Advanced'];

  if (currentRole === 'ALUMNO' && activeGroup) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header>
          <h2 className="text-[#DEFF9A] text-[10px] font-black uppercase tracking-[0.4em] mb-2 text-center md:text-left">Identidad Estudiantil</h2>
          <h1 className="text-3xl md:text-4xl font-black text-white bevel-text uppercase tracking-tight text-center md:text-left">Mi Grupo Académico</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <GlassCard accent="cyan" className="!p-10">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 rounded-[2rem] bg-[#DEFF9A]/10 border border-[#DEFF9A]/30 flex items-center justify-center text-[#DEFF9A] shadow-[0_0_30px_rgba(222,255,154,0.15)]">
                   <Users size={48} />
                </div>
                <div>
                   <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{activeGroup.name}</h3>
                   <span className="text-[#DEFF9A] text-[10px] font-black uppercase tracking-[0.3em] block mt-2">{activeGroup.level}</span>
                </div>

                <div className="flex gap-4 w-full pt-6 border-t border-white/10">
                   <div className="flex-1 text-center">
                      <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Horario</p>
                      <p className="text-white text-xs font-bold uppercase">{activeGroup.schedule}</p>
                   </div>
                   <div className="flex-1 text-center">
                      <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Días</p>
                      <p className="text-white text-xs font-bold uppercase">{(activeGroup.days || []).join(', ')}</p>
                   </div>
                </div>
              </div>
           </GlassCard>

           <GlassCard accent="green" className="!p-10">
              <div className="space-y-8">
                 <h4 className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Mi Profesor</h4>
                 <div className="flex items-center gap-6">
                    <img src={`https://i.pravatar.cc/150?u=${activeGroup.teacherId}`} className="w-20 h-20 rounded-full border-2 border-[#DEFF9A]" alt="" />
                    <div className="space-y-1">
                       <h5 className="text-xl font-black text-white uppercase">{activeGroup.teacherId}</h5>
                       <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Docente Certificado ADN</p>
                    </div>
                 </div>
                 <button
                  onClick={() => setQuickChatUser({ id: activeGroup.teacherId, name: activeGroup.teacherId })}
                  className="w-full py-4 rounded-2xl bg-[#DEFF9A]/10 border border-[#DEFF9A]/20 text-[#DEFF9A] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#DEFF9A] hover:text-black transition-all"
                 >
                    Enviar Mensaje Directo
                 </button>
              </div>
           </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      <AnimatePresence mode="wait">
        {!openedGroupId ? (
          <motion.header
            key="header-list"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          >
            <div>
              <h2 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 ${currentRole === 'DIRECTOR' ? 'text-[#DEFF9A]' : 'text-[#4ADE80]'}`}>
                {currentRole === 'DIRECTOR' ? 'Control de Estructura' : 'Operación Académica'}
              </h2>
              <h1 className="text-3xl font-black text-white bevel-text uppercase tracking-tight">Gestión de Grupos</h1>
              <p className="text-white/40 text-xs mt-1">Monitorea clases, abre grupos para tomar asistencia y consulta expedientes.</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
               {currentRole === 'DIRECTOR' && (
                 <button
                  onClick={() => setShowAddModal(true)}
                  className="px-8 py-3 bg-[#DEFF9A] text-[#061a1a] rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(222,255,154,0.3)] hover:scale-105 transition-transform flex items-center gap-2"
                 >
                    <Plus size={16} /> Crear Nuevo Grupo
                 </button>
               )}

               <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                  <button
                    onClick={() => setViewMode('GRID')}
                    className={`p-2 rounded-xl transition-all ${viewMode === 'GRID' ? 'bg-[#4ADE80] text-black shadow-lg shadow-[#4ADE80]/25' : 'text-white/20 hover:text-white'}`}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('LIST')}
                    className={`p-2 rounded-xl transition-all ${viewMode === 'LIST' ? 'bg-[#4ADE80] text-black shadow-lg' : 'text-white/20 hover:text-white'}`}
                  >
                    <ListIcon size={16} />
                  </button>
               </div>
            </div>
          </motion.header>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!openedGroupId ? (
          <motion.div
            key="groups-overview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            {loadingGroups ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={32} className="text-[#4ADE80] animate-spin mb-4" />
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Cargando grupos...</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center space-y-3">
                <Users size={32} className="text-white/20 mx-auto" />
                <p className="text-white/40 text-xs">No tienes grupos asignados aún.</p>
              </div>
            ) : viewMode === 'GRID' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredGroups.map((group) => {
                  const memberCount = (realMembers[group.id] || []).length || group.studentIds?.length || 0;
                  return (
                    <motion.div
                      key={group.id}
                      whileHover={{ y: -6 }}
                      className="rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-[#4ADE80]/30 transition-all group overflow-hidden relative flex flex-col justify-between p-8"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <span className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[#4ADE80] text-[10px] font-black uppercase tracking-widest">
                            {group.id}
                          </span>
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                            {group.type || 'PRESENCIAL'}
                          </span>
                        </div>

                        <h3 className="text-2xl font-black text-white tracking-tight uppercase group-hover:text-[#4ADE80] transition-colors leading-tight mb-2">
                          {group.name}
                        </h3>
                        <p className="text-[10px] font-black text-[#DEFF9A] uppercase tracking-widest inline-block px-3 py-1 bg-[#DEFF9A]/5 rounded-lg border border-[#DEFF9A]/10">
                          {group.level}
                        </p>

                        <div className="space-y-3 my-6 pt-6 border-t border-white/5 text-white/50 text-xs">
                          <div className="flex items-center gap-2.5">
                            <Clock size={14} className="text-white/20 shrink-0" />
                            <span className="font-medium tracking-tight">Horario: <b className="text-white font-bold">{group.schedule || '—'}</b></span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Users size={14} className="text-white/20 shrink-0" />
                            <span className="font-medium tracking-tight">Roster: <b className="text-white font-bold">{memberCount} Estudiantes</b></span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedGroupId(group.id);
                          setOpenedGroupId(group.id);
                        }}
                        className="w-full mt-4 py-4 rounded-2xl bg-[#4ADE80]/10 border border-[#4ADE80]/20 hover:bg-[#4ADE80] text-[#4ADE80] hover:text-[#061a1a] text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2.5 shadow-[0_5px_15px_rgba(74,222,128,0.05)] text-center"
                      >
                        <FolderOpen size={16} />
                        Abrir Grupo
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <GlassCard className="!p-0 overflow-hidden" accent="green">
                <table className="w-full text-left border-collapse">
                  <thead className="border-b border-white/10 bg-white/5">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/40">Código / ID</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/40">Nombre del Grupo</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/40">Nivel / ADN</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/40">Matrícula</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/40">Horario</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredGroups.map(group => (
                      <tr key={group.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-5">
                          <span className="font-mono text-xs font-bold text-white/40">{group.id}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#4ADE80]/10 border border-[#4ADE80]/30 flex items-center justify-center text-[#4ADE80]">
                              <Users size={14} />
                            </div>
                            <span className="text-white font-bold group-hover:text-[#4ADE80] transition-colors uppercase text-sm">{group.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-[#DEFF9A]/5 border border-[#DEFF9A]/20 text-[#DEFF9A] rounded-lg">
                            {group.level}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-white font-black text-xs">{group.studentIds?.length || 0} Alumnos</span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-white/40 text-[10px] font-black uppercase">{group.schedule || '—'}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button
                            onClick={() => {
                              setSelectedGroupId(group.id);
                              setOpenedGroupId(group.id);
                            }}
                            className="px-5 py-2.5 bg-[#4ADE80]/15 border border-[#4ADE80]/20 hover:bg-[#4ADE80] text-[#4ADE80] hover:text-[#061a1a] rounded-xl text-[9px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-2"
                          >
                            <FolderOpen size={12} /> Abrir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            )}
          </motion.div>
        ) : (
          (() => {
            const currentOpenedGroup = filteredGroups.find(g => g.id === openedGroupId) || filteredGroups[0];
            const members = realMembers[openedGroupId || ''] || [];
            const groupStudentIds = members.map(m => m.user_id);

            const stats = groupStudentIds.reduce(
              (acc, id) => {
                const status = attendanceState[id] || 'SIN_REGISTRO';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
              },
              { PRESENTE: 0, AUSENTE: 0, JUSTIFICADO: 0, RETRASO: 0, SIN_REGISTRO: 0 }
            );

            return (
              <motion.div
                key="group-detail-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/5">
                  <div className="space-y-2">
                    <button
                      onClick={() => setOpenedGroupId(null)}
                      className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 w-max"
                    >
                      <ArrowLeft size={14} /> Volver a Grupos
                    </button>
                    <div className="flex items-center gap-3 pt-2">
                      <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                        Célula Grupal: <span className="text-[#4ADE80]">{currentOpenedGroup?.name}</span>
                      </h1>
                      <div className="px-3 py-1 bg-white/5 border border-white/10 text-white/50 rounded-xl text-[9px] font-mono font-bold uppercase shrink-0">
                        {currentOpenedGroup?.id}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-white/40 pt-1">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {currentOpenedGroup?.schedule || '—'}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Nivel: <b className="text-white/60 font-semibold">{currentOpenedGroup?.level}</b></span>
                      <span className="hidden sm:inline">•</span>
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-white/30" />
                        <input
                          type="date"
                          value={attendanceDate}
                          onChange={(e) => setAttendanceDate(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-[10px] font-bold outline-none focus:border-[#4ADE80]/40"
                        />
                        {attendanceLoading && (
                          <span className="text-[8px] font-black text-[#4ADE80] animate-pulse uppercase tracking-widest">Cargando...</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{stats.PRESENTE} Presentes</span>
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>{stats.AUSENTE} Ausentes</span>
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>{stats.JUSTIFICADO} Justificados</span>
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-pink-500" />
                      <span>{stats.RETRASO} Retrasos</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-[#4ADE80]/5 border border-[#4ADE80]/15 flex items-start gap-4">
                  <div className="p-2.5 rounded-2xl bg-[#4ADE80]/10 text-[#4ADE80] shrink-0 mt-0.5">
                    <Lock size={18} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5 leading-none">
                      Rango de Operación: Régimen de Asistencia (Lector Exclusivo de Roster)
                    </h4>
                    <p className="text-white/50 text-[11px] leading-relaxed">
                      El enrolamiento de usuarios, bajas, modificaciones de nombres, imágenes de perfiles o niveles académicos están <b>consolidados de forma estricta (Read-Only)</b> para el docente. Tu perfil de docente está habilitado únicamente para registrar el pase de lista diario interactivo de la clase actual.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
                    <p className="text-white/60 text-[11px] font-black uppercase tracking-widest font-mono">
                      {groupStudentIds.length} Alumnos en este Grupo
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1.5 rounded-2xl shrink-0 font-mono">
                    <button
                      onClick={() => setLayoutMode('cards')}
                      className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                        layoutMode === 'cards'
                          ? 'text-white border-b-2 border-emerald-400 font-black'
                          : 'text-white/40 hover:text-white/80 border-b-2 border-transparent'
                      }`}
                    >
                      VISTA TARJETAS
                    </button>
                    <div className="w-[1px] h-3.5 bg-white/10" />
                    <button
                      onClick={() => setLayoutMode('table')}
                      className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                        layoutMode === 'table'
                          ? 'text-white border-b-2 border-emerald-400 font-black'
                          : 'text-white/40 hover:text-white/80 border-b-2 border-transparent'
                      }`}
                    >
                      TABLA DE CLASE
                    </button>
                  </div>
                </div>

                {layoutMode === 'cards' ? (
                  <div className="space-y-4">
                    {members.map((member) => {
                      const student = getMemberInfo(openedGroupId || '', member.user_id);
                      const currentStatus = attendanceState[member.user_id] || 'SIN_REGISTRO';

                      const statusBadgeConfig = {
                        PRESENTE: { bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', label: 'Presente', icon: CheckCircle2, ring: 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' },
                        AUSENTE: { bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400', label: 'Ausente', icon: XCircle, ring: 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' },
                        JUSTIFICADO: { bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400', label: 'Justificado', icon: ShieldAlert, ring: 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' },
                        RETRASO: { bg: 'bg-pink-500/15 border-pink-500/30 text-pink-400', label: 'Retraso', icon: Clock, ring: 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]' },
                        SIN_REGISTRO: { bg: 'bg-white/5 border-white/10 text-white/40', label: 'Pendiente', icon: Info, ring: 'border-white/10' }
                      }[currentStatus];

                      const StatusIcon = statusBadgeConfig.icon;

                      let dynamicCardBorderClass = 'border-white/5 bg-white/[0.02]';
                      if (currentStatus === 'PRESENTE') dynamicCardBorderClass = 'border-emerald-500/40 bg-emerald-500/[0.03]';
                      else if (currentStatus === 'AUSENTE') dynamicCardBorderClass = 'border-rose-500/40 bg-rose-500/[0.03]';
                      else if (currentStatus === 'JUSTIFICADO') dynamicCardBorderClass = 'border-blue-500/40 bg-blue-500/[0.03]';
                      else if (currentStatus === 'RETRASO') dynamicCardBorderClass = 'border-amber-500/45 bg-amber-500/[0.03]';

                      return (
                        <div
                          key={member.user_id}
                          className={`p-5 rounded-[2rem] border hover:bg-white/[0.04] transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-6 ${dynamicCardBorderClass}`}
                        >
                          <div className="flex items-center gap-5 shrink-0">
                            <div className="relative">
                              <img
                                src={student.photo}
                                className={`w-14 h-14 rounded-full object-cover border-2 p-0.5 transition-all duration-300 ${statusBadgeConfig.ring}`}
                                alt={student.name}
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-white text-md font-bold uppercase tracking-tight leading-tight">{student.name}</h4>
                                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/30 text-[7px] font-black uppercase tracking-widest font-mono">
                                  READ-ONLY
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-white/35 font-semibold uppercase">{member.user_id}</span>
                                <span className="text-white/20 text-xs">•</span>
                                <span className="text-[9px] font-bold text-white/40 uppercase">{member.email}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="hidden min-[480px]:block text-right">
                              <p className="text-white/20 text-[7px] font-black uppercase tracking-widest leading-none mb-1 font-mono">Estado de Sesión</p>
                              <span className="text-white text-[10px] uppercase font-bold text-white/50">Fecha de Hoy</span>
                            </div>
                            <div className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 font-mono ${statusBadgeConfig.bg}`}>
                              <StatusIcon size={12} className="shrink-0" />
                              {statusBadgeConfig.label}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5 bg-black/30 border border-white/5 p-2 rounded-2xl shrink-0 font-mono">
                            <button
                              onClick={() => {
                                setAttendanceState(prev => ({ ...prev, [member.user_id]: 'PRESENTE' }));
                                if (openedGroupId) saveAttendance(openedGroupId, member.user_id, 'PRESENTE');
                              }}
                              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                                currentStatus === 'PRESENTE'
                                  ? 'bg-[#4ADE80] text-black border-transparent shadow-[0_0_15px_rgba(74,222,128,0.4)] scale-105'
                                  : 'bg-emerald-500/5 hover:bg-emerald-500 hover:text-black border-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              <CheckCircle2 size={12} />
                              Presente
                            </button>

                            <button
                              onClick={() => {
                                setAttendanceState(prev => ({ ...prev, [member.user_id]: 'AUSENTE' }));
                                if (openedGroupId) saveAttendance(openedGroupId, member.user_id, 'AUSENTE');
                              }}
                              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                                currentStatus === 'AUSENTE'
                                  ? 'bg-rose-500 text-black border-transparent shadow-[0_0_15px_rgba(244,63,94,0.4)] scale-105'
                                  : 'bg-rose-500/5 hover:bg-rose-500 hover:text-black border-rose-500/20 text-rose-400'
                              }`}
                            >
                              <XCircle size={12} />
                              Ausente
                            </button>

                            <button
                              onClick={() => {
                                setAttendanceState(prev => ({ ...prev, [member.user_id]: 'JUSTIFICADO' }));
                                if (openedGroupId) saveAttendance(openedGroupId, member.user_id, 'JUSTIFICADO');
                              }}
                              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                                currentStatus === 'JUSTIFICADO'
                                  ? 'bg-amber-500 text-[#061a1a] border-transparent shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105'
                                  : 'bg-amber-500/5 hover:bg-amber-500 hover:text-black border-amber-500/20 text-amber-400'
                              }`}
                            >
                              <ShieldAlert size={12} />
                              Justificado
                            </button>

                            <button
                              onClick={() => {
                                setAttendanceState(prev => ({ ...prev, [member.user_id]: 'RETRASO' }));
                                if (openedGroupId) saveAttendance(openedGroupId, member.user_id, 'RETRASO');
                              }}
                              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                                currentStatus === 'RETRASO'
                                  ? 'bg-pink-500 text-black border-transparent shadow-[0_0_15px_rgba(236,72,153,0.4)] scale-105'
                                  : 'bg-pink-500/5 hover:bg-pink-500 hover:text-black border-pink-500/20 text-pink-400'
                              }`}
                            >
                              <Clock size={12} />
                              Retraso
                            </button>
                          </div>

                          <div className="shrink-0 flex justify-end items-center gap-2">
                            <button
                              onClick={() => setQuickChatUser({ id: member.user_id, name: member.nombre })}
                              className="p-3 bg-[#4ADE80]/10 border border-[#4ADE80]/20 rounded-xl hover:bg-[#4ADE80] hover:text-black text-[#4ADE80] transition-all text-xs flex items-center gap-1.5 font-mono"
                              title="Enviar Mensaje Directo"
                            >
                              <MessageCircle size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-[2rem] border border-white/5 bg-black/40 backdrop-blur-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.02] text-[#6b7280] font-mono text-[10px] font-black uppercase tracking-wider">
                          <th className="py-4 px-6 text-left">ALUMNO</th>
                          <th className="py-4 px-6 text-left">ID</th>
                          <th className="py-4 px-6 text-left">EMAIL</th>
                          <th className="py-4 px-6 text-center">ACCIÓN DE ASISTENCIA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50 text-xs text-white">
                        {members.map((member) => {
                          const student = getMemberInfo(openedGroupId || '', member.user_id);
                          const currentStatus = attendanceState[member.user_id] || 'SIN_REGISTRO';

                          return (
                            <tr key={member.user_id} className="hover:bg-gray-900/40 transition-colors group">
                              <td className="py-3 px-6">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={student.photo}
                                    className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                                    alt={student.name}
                                  />
                                  <span className="font-bold text-white group-hover:text-[#4ADE80] transition-colors uppercase tracking-tight text-xs leading-none">
                                    {student.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-6 font-mono text-[10px] text-white/40 tracking-wider">
                                {member.user_id}
                              </td>
                              <td className="py-3 px-6 text-[10px] text-white/40">
                                {member.email}
                              </td>
                              <td className="py-3 px-6">
                                <div className="flex items-center justify-center">
                                  <div className="inline-flex rounded-xl overflow-hidden border border-white/5 bg-black/60 p-0.5 shrink-0 select-none">
                                    <button
                                      onClick={() => {
                                        setAttendanceState(prev => ({ ...prev, [member.user_id]: 'PRESENTE' }));
                                        if (openedGroupId) saveAttendance(openedGroupId, member.user_id, 'PRESENTE');
                                      }}
                                      className={`w-7 h-7 flex items-center justify-center text-[10px] font-black tracking-widest transition-all rounded-lg ${
                                        currentStatus === 'PRESENTE' ? 'bg-emerald-500 text-black font-black shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'
                                      }`}
                                      title="Presente"
                                    >P</button>
                                    <button
                                      onClick={() => {
                                        setAttendanceState(prev => ({ ...prev, [member.user_id]: 'AUSENTE' }));
                                        if (openedGroupId) saveAttendance(openedGroupId, member.user_id, 'AUSENTE');
                                      }}
                                      className={`w-7 h-7 flex items-center justify-center text-[10px] font-black tracking-widest transition-all rounded-lg ${
                                        currentStatus === 'AUSENTE' ? 'bg-rose-500 text-black font-black shadow-[0_0_12px_rgba(244,63,94,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'
                                      }`}
                                      title="Ausente"
                                    >A</button>
                                    <button
                                      onClick={() => {
                                        setAttendanceState(prev => ({ ...prev, [member.user_id]: 'JUSTIFICADO' }));
                                        if (openedGroupId) saveAttendance(openedGroupId, member.user_id, 'JUSTIFICADO');
                                      }}
                                      className={`w-7 h-7 flex items-center justify-center text-[10px] font-black tracking-widest transition-all rounded-lg ${
                                        currentStatus === 'JUSTIFICADO' ? 'bg-blue-500 text-white font-black shadow-[0_0_12px_rgba(59,130,246,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'
                                      }`}
                                      title="Justificado"
                                    >J</button>
                                    <button
                                      onClick={() => {
                                        setAttendanceState(prev => ({ ...prev, [member.user_id]: 'RETRASO' }));
                                        if (openedGroupId) saveAttendance(openedGroupId, member.user_id, 'RETRASO');
                                      }}
                                      className={`w-7 h-7 flex items-center justify-center text-[10px] font-black tracking-widest transition-all rounded-lg ${
                                        currentStatus === 'RETRASO' ? 'bg-amber-500 text-black font-black shadow-[0_0_12px_rgba(245,158,11,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'
                                      }`}
                                      title="Retraso"
                                    >R</button>
                                    <button
                                      onClick={() => setAttendanceState(prev => ({ ...prev, [member.user_id]: 'SIN_REGISTRO' }))}
                                      className={`w-7 h-7 flex items-center justify-center text-[10px] font-black tracking-wider transition-all rounded-lg ${
                                        currentStatus === 'SIN_REGISTRO' ? 'bg-white/10 text-white/50 border border-white/10' : 'text-white/20 hover:text-white hover:bg-white/5'
                                      }`}
                                      title="Reiniciar"
                                    >-</button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </motion.div>
            );
          })()
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-[#061a1a]/95 backdrop-blur-2xl p-8"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-2xl w-full bg-[#111215] border border-white/10 rounded-[3rem] p-10 overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-[#DEFF9A]/20 flex items-center justify-center text-[#DEFF9A]">
                     <UserCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Crear Nueva Célula Grupal</h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Configuración Institucional de Grupos</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Nombre del Grupo</label>
                       <input
                         type="text"
                         value={newGroup.name}
                         onChange={e => setNewGroup({...newGroup, name: e.target.value})}
                         placeholder="Ej. Pioneers A1 - Evening"
                         className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#DEFF9A]/50 placeholder:text-white/10"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Nivel Académico</label>
                       <select
                         value={newGroup.level}
                         onChange={e => setNewGroup({...newGroup, level: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#DEFF9A]/50"
                       >
                          {levels.map(l => <option key={l} value={l} className="bg-[#061a1a]">{l}</option>)}
                       </select>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-4 rounded-2xl border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={handleAddGroup}
                      className="flex-[2] py-4 rounded-2xl bg-[#DEFF9A] text-black text-[10px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(222,255,154,0.2)] hover:brightness-110 transition-all"
                    >
                      Establecer Grupo
                    </button>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
