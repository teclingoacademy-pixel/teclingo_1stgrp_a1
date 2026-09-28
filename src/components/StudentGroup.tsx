/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Users, Star, Award, Zap, MessageCircle, GraduationCap, Clock, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { GlassCard } from './GlassCard';
import { useAppContext } from '../context/AppContext';
import identityService, { GrupoIngles, MiembroGrupo } from '../services/identityService';

interface Classmate extends MiembroGrupo {
  nivel?: string;
  avatar?: string;
}

export function StudentGroup() {
  const { userEmail, setQuickChatUser } = useAppContext();
  const email = userEmail || '';

  const [grupo, setGrupo] = useState<GrupoIngles | null>(null);
  const [companeros, setCompaneros] = useState<Classmate[]>([]);
  const [docenteNombre, setDocenteNombre] = useState('');
  const [loading, setLoading] = useState(true);
  const [sinGrupo, setSinGrupo] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const grupos = await identityService.misGruposIngles(email);
        if (grupos.length === 0) {
          setSinGrupo(true);
          setLoading(false);
          return;
        }

        const miGrupo = grupos[0];
        setGrupo(miGrupo);

        const miembros = await identityService.obtenerMiembrosDeGrupo(email, miGrupo.grupo_id);
        const companerosFiltrados = miembros.filter(m => m.email !== email);
        setCompaneros(companerosFiltrados.map(m => ({
          ...m,
          nivel: miGrupo.nivel,
        })));

        if (miGrupo.docente_email) {
          const docentes = await identityService.listarUsuarios('DOCENTE');
          const docente = docentes.find(d => d.email === miGrupo.docente_email);
          setDocenteNombre(docente?.nombre || miGrupo.docente_email);
        }
      } catch (err) {
        console.error('[StudentGroup] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [email]);

  if (loading) {
    return (
      <div className="space-y-12">
        <header>
          <h2 className="text-[#DEFF9A] text-[10px] font-black uppercase tracking-[0.4em] mb-2">Comunidad Inmersiva</h2>
          <h1 className="text-3xl font-black text-white bevel-text uppercase tracking-tight">Mi Grupo</h1>
        </header>
        <div className="text-center py-20 text-white/30 text-xs">Cargando información del grupo...</div>
      </div>
    );
  }

  const handleMensajeDocente = () => {
    if (!grupo?.docente_email) return;
    setQuickChatUser({
      id: grupo.docente_email,
      email: grupo.docente_email,
      name: docenteNombre || grupo.docente_email,
      rol: 'DOCENTE',
    });
  };

  if (sinGrupo || !grupo) {
    return (
      <div className="space-y-12">
        <header>
          <h2 className="text-[#DEFF9A] text-[10px] font-black uppercase tracking-[0.4em] mb-2">Comunidad Inmersiva</h2>
          <h1 className="text-3xl font-black text-white bevel-text uppercase tracking-tight">Mi Grupo</h1>
        </header>
        <div className="text-center py-20 space-y-4">
          <Users size={48} className="text-white/10 mx-auto" />
          <p className="text-white/30 text-xs">No estás inscrito en ningún grupo de inglés aún.</p>
          <p className="text-white/15 text-[10px]">Ve a "Unirse a Grupo (CLE)" para inscribirte con un Code ID.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[#DEFF9A] text-[10px] font-black uppercase tracking-[0.4em] mb-2">Comunidad Inmersiva</h2>
          <h1 className="text-3xl font-black text-white bevel-text uppercase tracking-tight">
            Mi Grupo: <span className="text-[#DEFF9A]">{grupo.nombre} — {grupo.grupo}</span>
          </h1>
          <div className="flex items-center gap-4 mt-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1"><BookOpen size={12} /> {grupo.nivel}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {
              grupo.sesiones && grupo.sesiones.length > 0
                ? grupo.sesiones.map(s => `${s.horaInicio}-${s.horaFin}`).join(', ')
                : 'Sin horario'
            }</span>
            <span className="flex items-center gap-1"><Users size={12} /> {
              grupo.sesiones && grupo.sesiones.length > 0
                ? grupo.sesiones.flatMap(s => s.dias.split(',').map(d => d.trim())).filter((v, i, a) => a.indexOf(v) === i).join(', ')
                : '—'
            }</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
            <Users className="text-[#DEFF9A]" size={20} />
            <span className="text-xs font-black text-white uppercase tracking-widest">
              {companeros.length + 1} INTEGRANTES
            </span>
          </div>
        </div>
      </header>

      {/* DOCENTE ENCARGADO */}
      {docenteNombre && (
        <div className="p-5 rounded-2xl bg-[#DEFF9A]/5 border border-[#DEFF9A]/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#DEFF9A]/10 flex items-center justify-center text-[#DEFF9A] shrink-0">
            <GraduationCap size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black uppercase tracking-widest text-[#DEFF9A]/60">Docente Encargado</p>
            <p className="text-white text-sm font-black uppercase tracking-tight truncate">{docenteNombre}</p>
            <p className="text-white/30 text-[9px] font-mono truncate">{grupo.docente_email}</p>
          </div>
          <button
            onClick={handleMensajeDocente}
            disabled={!grupo.docente_email}
            title="Enviar mensaje al docente"
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#DEFF9A] text-[#061a1a] text-[10px] font-black uppercase tracking-widest hover:scale-105 hover:shadow-[0_0_20px_rgba(222,255,154,0.4)] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <MessageCircle size={14} />
            <span className="hidden sm:inline">Mensaje</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* LISTA DE COMPAÑEROS */}
        <div className="col-span-12 lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Yo primero */}
            <motion.div
              whileHover={{ y: -3 }}
              className="p-5 rounded-2xl bg-[#DEFF9A]/5 border border-[#DEFF9A]/20 flex items-center gap-4"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-[#DEFF9A]/20 flex items-center justify-center text-[#DEFF9A] text-lg font-black border border-[#DEFF9A]/30">
                  TU
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#061a1a] bg-[#4ADE80]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-black uppercase tracking-tight truncate">Tú</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-black text-[#DEFF9A] uppercase tracking-widest bg-[#DEFF9A]/10 px-2 py-0.5 rounded-full border border-[#DEFF9A]/20">
                    {grupo.nivel}
                  </span>
                  <span className="text-white/20 text-[9px]">•</span>
                  <span className="text-[9px] font-black text-white/40 uppercase">Miembro</span>
                </div>
              </div>
            </motion.div>

            {/* Compañeros */}
            {companeros.map((c) => (
              <motion.div
                key={c.asignacion_id}
                whileHover={{ y: -3 }}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#DEFF9A]/20 transition-all flex items-center gap-4 group"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-[#DEFF9A] text-lg font-black border border-white/10 group-hover:bg-[#DEFF9A] group-hover:text-black transition-all">
                    {c.nombre?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#061a1a] bg-white/10" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-black uppercase tracking-tight truncate group-hover:text-[#DEFF9A] transition-colors">
                    {c.nombre}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black text-[#DEFF9A] uppercase tracking-widest bg-[#DEFF9A]/5 px-2 py-0.5 rounded-full border border-[#DEFF9A]/10">
                      {c.nivel || grupo.nivel}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setQuickChatUser({
                    id: c.email,
                    email: c.email,
                    name: c.nombre,
                    rol: 'ALUMNO',
                  })}
                  title={`Enviar mensaje a ${c.nombre}`}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:bg-[#DEFF9A] hover:text-[#061a1a] transition-all"
                >
                  <MessageCircle size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Info del grupo */}
          <GlassCard title="Datos del Grupo" icon={Award} accent="green">
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                <span className="text-white/30 text-[8px] font-black uppercase tracking-widest">Nivel</span>
                <span className="text-[#DEFF9A] text-xs font-black">{grupo.nivel}</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                <span className="text-white/30 text-[8px] font-black uppercase tracking-widest">Turno</span>
                <span className="text-white text-xs font-bold">{grupo.turno || '—'}</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                <span className="text-white/30 text-[8px] font-black uppercase tracking-widest">Horario</span>
                <span className="text-white text-xs font-bold">
                  {grupo.sesiones && grupo.sesiones.length > 0
                    ? grupo.sesiones.map(s => `${s.horaInicio}-${s.horaFin}`).join(', ')
                    : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                <span className="text-white/30 text-[8px] font-black uppercase tracking-widest">Días</span>
                <span className="text-white text-xs font-bold">
                  {grupo.sesiones && grupo.sesiones.length > 0
                    ? grupo.sesiones.flatMap(s => s.dias.split(',').map(d => d.trim())).filter((v, i, a) => a.indexOf(v) === i).join(', ')
                    : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                <span className="text-white/30 text-[8px] font-black uppercase tracking-widest">Capacidad</span>
                <span className="text-white text-xs font-bold">{grupo.alumnos_inscritos || 0} / {grupo.capacidad}</span>
              </div>
            </div>
          </GlassCard>

          {/* Próxima actividad */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#22D3EE]/10 to-transparent border border-[#22D3EE]/20">
            <div className="flex items-center gap-3 mb-3">
              <Zap size={18} className="text-[#22D3EE]" />
              <h4 className="text-white text-[10px] font-black uppercase tracking-widest">Próxima Actividad</h4>
            </div>
            <p className="text-white/50 text-[10px] font-medium leading-relaxed mb-3">
              Revisa tu horario de grupo para la próxima sesión. Prepárate con tu material.
            </p>
            <p className="text-[#22D3EE] text-[9px] font-black uppercase tracking-widest">
              {grupo.sesiones && grupo.sesiones.length > 0
                ? grupo.sesiones.map(s => `${s.horaInicio}-${s.horaFin}`).join(', ')
                : 'Por definir'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
