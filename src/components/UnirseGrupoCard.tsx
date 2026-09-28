import { useState, useEffect } from 'react';
import { Languages, LogIn, Check, AlertCircle, Users, BookOpen, Search, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import identityService, { listarGruposDisponibles } from '../services/identityService';
import type { GrupoIngles } from '../services/identityService';

const DIAS_SEMANA = [
  { key: 'LU', full: 'Lunes' }, { key: 'MA', full: 'Martes' }, { key: 'MI', full: 'Miércoles' },
  { key: 'JU', full: 'Jueves' }, { key: 'VI', full: 'Viernes' }, { key: 'SA', full: 'Sábado' }, { key: 'DO', full: 'Domingo' },
];

export function UnirseGrupoCard() {
  const { userEmail } = useAppContext();
  const email = userEmail || '';
  const [codeId, setCodeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [gruposDisponibles, setGruposDisponibles] = useState<GrupoIngles[]>([]);
  const [misGrupos, setMisGrupos] = useState<GrupoIngles[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [showTodos, setShowTodos] = useState(false);

  const cargarGrupos = async () => {
    const data = await listarGruposDisponibles();
    setGruposDisponibles(data);
  };

  const cargarMisGrupos = async () => {
    const data = await identityService.misGruposIngles(email);
    setMisGrupos(data);
  };

  useEffect(() => { cargarGrupos(); }, [email]);
  useEffect(() => { if (email) cargarMisGrupos(); }, [email]);

  const gruposFiltrados = gruposDisponibles.filter(g => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      g.nombre.toLowerCase().includes(q) ||
      g.grupo.toLowerCase().includes(q) ||
      g.nivel.toLowerCase().includes(q)
    );
  });

  const handleUnirse = async () => {
    setError('');
    setExito('');
    if (!codeId.trim()) { setError('Ingresa el código del grupo que te dio tu docente'); return; }
    setLoading(true);
    const res = await identityService.unirseAGrupo(email, codeId);
    setLoading(false);
    if (res.ok) {
      setExito(`Te uniste al grupo "${res.nombre}" exitosamente`);
      setCodeId('');
      setBusqueda('');
      cargarGrupos();
      cargarMisGrupos();
    } else {
      setError(res.mensaje || res.error || 'No se pudo unir al grupo');
    }
  };

  return (
    <div className="space-y-4">
      {/* Sección: Code ID */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#DEFF9A]/10">
            <Languages size={18} className="text-[#DEFF9A]" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Unirse a Grupo de Inglés</h3>
            <p className="text-white/40 text-[10px]">Ingresa el código que te proporcionó tu docente</p>
          </div>
        </div>

        {/* Campo Code ID */}
        <div>
          <label className="block text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1.5">Code ID del Grupo</label>
          <div className="flex gap-2">
            <input
              placeholder="Ej: CLE-AB12CD"
              value={codeId}
              onChange={e => setCodeId(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleUnirse()}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[#DEFF9A] font-mono font-bold text-sm tracking-wider uppercase focus:outline-none focus:border-[#DEFF9A] placeholder:text-white/20 placeholder:font-normal placeholder:font-sans"
            />
            <button
              onClick={handleUnirse}
              disabled={loading || !codeId.trim()}
              className="flex items-center gap-1 px-4 py-2.5 bg-[#DEFF9A] text-[#061a1a] font-black text-xs uppercase rounded-lg hover:bg-[#c5e68a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <LogIn size={14} /> {loading ? 'Uniendo...' : 'Unirse'}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-red-400 text-xs">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        {exito && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-2.5 text-green-400 text-xs">
            <Check size={14} /> {exito}
          </div>
        )}
      </div>

      {/* Sección: Grupos Disponibles */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-xs uppercase flex items-center gap-2">
            <BookOpen size={14} className="text-[#DEFF9A]" /> Grupos Disponibles
          </h3>
          <span className="text-white/30 text-[10px]">{gruposFiltrados.length} grupos</span>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            placeholder="Buscar por nombre, grupo o nivel..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white text-xs focus:outline-none focus:border-[#DEFF9A] placeholder:text-white/20"
          />
        </div>

        {gruposDisponibles.length === 0 ? (
          <div className="text-center py-6">
            <Users size={24} className="text-white/10 mx-auto mb-2" />
            <p className="text-white/30 text-[10px]">No hay grupos disponibles aún</p>
            <p className="text-white/15 text-[9px]">El director debe crear los grupos primero</p>
          </div>
        ) : gruposFiltrados.length === 0 ? (
          <p className="text-white/30 text-[10px] text-center py-4">No se encontraron grupos con "{busqueda}"</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {gruposFiltrados.map(g => (
              <div
                key={g.grupo_id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-white/5 border border-transparent transition-all"
              >
                <div className="p-1.5 rounded bg-[#DEFF9A]/10 shrink-0">
                  <Languages size={14} className="text-[#DEFF9A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold truncate">{g.nombre} — Grupo {g.grupo}</p>
                  <p className="text-white/40 text-[10px]">{g.nivel} · {g.turno || 'Sin turno'}</p>
                  {g.sesiones && g.sesiones.length > 0 ? (
                    <div className="mt-1 space-y-0.5">
                      {g.sesiones.map((s, i) => {
                        const diasArr = s.dias.split(',').map(d => d.trim());
                        const diasLabels = diasArr.map(k => DIAS_SEMANA.find(d => d.key === k)?.full || k).join(', ');
                        return (
                          <div key={s.id || i} className="flex items-center gap-1">
                            <Clock size={8} className="text-[#DEFF9A]" />
                            <span className="text-white/60 text-[9px]">{s.horaInicio}-{s.horaFin}</span>
                            <span className="text-white/20 text-[9px]">|</span>
                            <span className="text-[#DEFF9A]/70 text-[9px]">{diasLabels}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                {g.alumnos_inscritos >= g.capacidad ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">LLENO</span>
                ) : (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-white/30">
                    {g.alumnos_inscritos || 0}/{g.capacidad}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección: Mis Grupos Inscritos */}
      {misGrupos.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
          <button
            onClick={() => setShowTodos(!showTodos)}
            className="w-full flex items-center justify-between text-white font-bold text-xs uppercase"
          >
            <span className="flex items-center gap-2">
              <Check size={14} className="text-green-400" /> Mis Grupos Inscritos ({misGrupos.length})
            </span>
            {showTodos ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showTodos && (
            <div className="space-y-2">
              {misGrupos.map(g => (
                <div key={g.grupo_id} className="flex items-center gap-3 bg-green-500/5 border border-green-500/10 rounded-lg px-3 py-2">
                  <Check size={14} className="text-green-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-white text-xs font-bold">{g.nombre} — Grupo {g.grupo}</p>
                    <p className="text-white/40 text-[10px]">{g.nivel}</p>
                    {g.sesiones && g.sesiones.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {g.sesiones.map((s, i) => {
                          const diasArr = s.dias.split(',').map(d => d.trim());
                          const diasLabels = diasArr.map(k => DIAS_SEMANA.find(d => d.key === k)?.full || k).join(', ');
                          return (
                            <div key={s.id || i} className="flex items-center gap-1">
                              <Clock size={8} className="text-green-400/60" />
                              <span className="text-white/50 text-[9px]">{s.horaInicio}-{s.horaFin}</span>
                              <span className="text-white/20 text-[9px]">|</span>
                              <span className="text-green-400/50 text-[9px]">{diasLabels}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
