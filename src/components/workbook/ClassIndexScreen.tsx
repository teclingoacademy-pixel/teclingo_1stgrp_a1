/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ClassIndexScreen.tsx
 * Componente INDEX del Cuaderno de Ejercicios Nivel A1 (TecLingo Academy)
 * Muestra el catálogo de 35 clases con seguimiento de progreso, filtros por semana y búsqueda en tiempo real.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Filter, 
  ArrowLeft, 
  PlayCircle,
  BarChart3,
  RotateCcw,
  Table as TableIcon,
  LayoutGrid,
  FileSpreadsheet,
  Download,
  Flame,
  ArrowRight
} from 'lucide-react';
// FIX 2026-09-26: clases ahora viene del API /api/lessons (Prisma)
import type { SheetClaseRow, SheetProgresoUsuarioRow } from '@/types/workbook/workbookRows';
import { getClassTemperature } from '@/utils/workbook/classTemperature';
import { getResumenProgresoForUser } from '@/services/workbook/resumenProgresoService';
import { apiUrl } from '@/services/apiConfig';

interface ClassIndexScreenProps {
  onSelectClass: (claseId: string) => void;
  onBackToCover?: () => void;
  customProgreso?: SheetProgresoUsuarioRow[];
  onResetMockProgress?: () => void;
}

// REGLA 4: Helper de colores de estado
// - pendiente: gris
// - en_progreso: azul
// - completada: verde
const getEstadoClaseBadge = (estado: string, is100: boolean) => {
  if (is100 || estado === 'completada') {
    return {
      label: 'Completada',
      badgeClass: 'bg-emerald-500/20 text-[#00F5D4] border-emerald-500/40 shadow-[0_0_10px_rgba(0,245,212,0.2)]',
      dotColor: 'bg-[#00F5D4]',
      textColor: 'text-[#00F5D4]',
    };
  }
  if (estado === 'en_progreso') {
    return {
      label: 'En progreso',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      dotColor: 'bg-blue-400',
      textColor: 'text-blue-400',
    };
  }
  return {
    label: 'Pendiente',
    badgeClass: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
    dotColor: 'bg-gray-400',
    textColor: 'text-gray-400',
  };
};

export const ClassIndexScreen: React.FC<ClassIndexScreenProps> = ({ 
  onSelectClass, 
  onBackToCover,
  customProgreso,
  onResetMockProgress,
}) => {
  const [filtroSemana, setFiltroSemana] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'original' | 'repaso' | 'taller'>('todos');
  const [viewMode, setViewMode] = useState<'xls' | 'cards'>('xls');

  // FIX 2026-09-26: cargar clases desde /api/lessons
  const [clases, setClases] = useState<SheetClaseRow[]>([]);
  // FIX 2026-09-27: examenes oficiales (Ubicacion, Intermedio, Final)
  const [examenes, setExamenes] = useState<Array<{
    id: string; code: string; title: string; type: string;
    weekNumber: number | null; totalQuestions: number;
    durationMinutes: number; passingScore: number;
  }>>([]);
  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl('/api/lessons'))
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (res && res.success && Array.isArray(res.data)) {
          console.log('[ClassIndexScreen] Clases cargadas:', res.data.length);
          setClases(res.data);
        } else {
          console.warn('[ClassIndexScreen] Respuesta inesperada de /api/lessons:', res);
        }
      })
      .catch((err) => console.warn('[ClassIndexScreen] Error cargando clases:', err));
    return () => { cancelled = true; };
  }, []);

  // FIX 2026-09-27: cargar examenes oficiales
  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl('/api/exams'))
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (res && res.success && Array.isArray(res.data)) {
          // Filtrar solo los 3 oficiales: UBICACION, INTERMEDIO (1), FINAL
          const oficiales = res.data.filter((e: any) =>
            e.type === 'UBICACION' || e.code === 'EXAM_INT_1' || e.type === 'FINAL'
          );
          console.log('[ClassIndexScreen] Examenes cargados:', oficiales.length);
          setExamenes(oficiales);
        }
      })
      .catch((err) => console.warn('[ClassIndexScreen] Error cargando examenes:', err));
    return () => { cancelled = true; };
  }, []);

  // Obtener usuario activo
  const { activeUserId, activeUserEmail } = useMemo(() => {
    try {
      const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userRaw) {
        const u = JSON.parse(userRaw);
        return {
          activeUserId: u?.user_id || 'demo_user_001',
          activeUserEmail: u?.email || '',
        };
      }
    } catch (e) {
      console.warn('Error al leer usuario para ClassIndexScreen:', e);
    }
    return { activeUserId: 'demo_user_001', activeUserEmail: '' };
  }, []);

  // FIX 2026-09-26: Leer progreso real desde Prisma via API (antes era localStorage mock)
  const [resumenMap, setResumenMap] = useState<Map<string, any>>(new Map());
  useEffect(() => {
    if (!activeUserId) return;
    let cancelled = false;
    const params = new URLSearchParams();
    if (activeUserId) params.set('userId', activeUserId);
    if (activeUserEmail) params.set('email', activeUserEmail);
    fetch(apiUrl('/api/progress/summary') + '?' + params.toString())
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        const ok = res && (res.success === true || res.ok === true);
        if (ok && res.data) {
          console.log('[ClassIndexScreen] Progreso recibido:', Object.keys(res.data).length, 'lecciones');
          setResumenMap(new Map(Object.entries(res.data)));
        } else {
          console.warn('[ClassIndexScreen] Respuesta inesperada:', res);
        }
      })
      .catch((err) => console.warn('[ClassIndexScreen] Error cargando progreso:', err));
    return () => { cancelled = true; };
  }, [activeUserId, activeUserEmail]);

  // Fuente secundaria de progreso detallado
  const activeProgreso: SheetProgresoUsuarioRow[] = useMemo(() => {
    if (customProgreso && customProgreso.length > 0) {
      return customProgreso;
    }
    return [];
  }, [customProgreso]);

  // Helper para consultar datos de RESUMEN_PROGRESO por clase
  const getDatosClase = (claseId: string) => {
    const fromResumen = resumenMap.get(claseId);
    if (fromResumen) {
      const pct = fromResumen.porcentaje_avance ?? 0;
      const estado = fromResumen.estado_clase || (pct >= 100 ? 'completada' : pct > 0 ? 'en_progreso' : 'pendiente');
      return {
        porcentaje_avance: pct,
        estado_clase: estado,
        xp_ganado: fromResumen.score ?? fromResumen.xp_ganado ?? fromResumen.puntaje_obtenido ?? 0,
        reactivos_correctos: fromResumen.reactivos_correctos ?? 0,
        reactivos_totales: fromResumen.reactivos_totales ?? 25,
        habilidades_completadas: fromResumen.habilidades_completadas ?? 0,
      };
    }

    // Si no está registrado en RESUMEN_PROGRESO, calcularlo si hay datos previos
    const reactivosClase = activeProgreso.filter((p) => p.clase_id === claseId);
    if (reactivosClase.length > 0) {
      const correctos = reactivosClase.filter((r) => r.correcto).length;
      const pct = Math.min(100, Math.round((correctos / 25) * 100));
      return {
        porcentaje_avance: pct,
        estado_clase: pct >= 100 ? 'completada' : pct > 0 ? 'en_progreso' : 'pendiente',
        xp_ganado: correctos * 10,
        reactivos_correctos: correctos,
        habilidades_completadas: Math.floor(correctos / 5),
      };
    }

    return {
      porcentaje_avance: 0,
      estado_clase: 'pendiente',
      xp_ganado: 0,
      reactivos_correctos: 0,
      reactivos_totales: 25,
      habilidades_completadas: 0,
    };
  };

  // Mantener compatibilidad con getProgresoClase
  const getProgresoClase = (claseId: string) => {
    return getDatosClase(claseId).porcentaje_avance;
  };

  // Filtrar clases por semana, tipo y texto de búsqueda
  const clasesFiltradas = useMemo(() => {
    return clases.filter((c) => {
      const coincideSemana = filtroSemana === null || c.semana === filtroSemana;
      const coincideTipo = filtroTipo === 'todos' || c.tipo_contenido === filtroTipo;
      const query = busqueda.toLowerCase().trim();
      const coincideBusqueda = 
        !query || 
        c.titulo_clase.toLowerCase().includes(query) || 
        c.tema_principal.toLowerCase().includes(query) ||
        `clase ${c.clase_numero}`.includes(query) ||
        c.clase_id.toLowerCase().includes(query);

      return coincideSemana && coincideTipo && coincideBusqueda;
    });
  }, [clases, filtroSemana, filtroTipo, busqueda]);

  // FIX 2026-09-27: mezcla clases + examenes en un solo array ordenado
  const itemsOrdenados = useMemo(() => {
    type Item = { isExam: boolean; clase_id: string; semana: number; orden: number; [k: string]: any };

    const clasesItems: Item[] = clasesFiltradas.map((c) => ({
      ...c, isExam: false, semana: c.semana, orden: c.clase_numero,
    }));

    // Filtro de semana aplica tambien a examenes (a menos que el filtro excluya la semana)
    const examItems: Item[] = examenes
      .map((e) => {
        // Semana fija por tipo segun diseño curricular
        // FIX 2026-09-27: posiciones exactas por code (definidas por planeacion curricular)
        const EXAM_POS: Record<string, { semana: number; orden: number }> = {
          EXAM_UBICACION: { semana: 1,  orden: 0.5 },   // antes de C00 (S1)
          EXAM_INT_1:     { semana: 8,  orden: 999 },   // despues de C12 (fin S7)
          EXAM_FINAL:     { semana: 11, orden: 18.5 },  // entre C17 (18) y C18 (19)
        };
        const pos = EXAM_POS[e.code] ?? { semana: e.weekNumber ?? 1, orden: 999 };
        const semana = pos.semana;
        const orden = pos.orden;
        return {
          isExam: true, clase_id: e.code, semana, orden,
          exam: e,
          titulo_clase: e.title,
          tema_principal: 'Evaluación oficial',
          tipo_contenido: 'examen',
          duracion_min: e.durationMinutes,
          sesion: '—',
          clase_numero: 0,
        } as Item;
      })
      .filter((e) => filtroSemana === null || e.semana === filtroSemana)
      .filter((e) => filtroTipo === 'todos' || filtroTipo === 'original')  // siempre visibles salvo filtros raros
      .filter((e) => {
        const q = busqueda.toLowerCase().trim();
        if (!q) return true;
        return e.titulo_clase.toLowerCase().includes(q) || e.clase_id.toLowerCase().includes(q);
      });

    const all = [...clasesItems, ...examItems];
    all.sort((a, b) => a.semana - b.semana || a.orden - b.orden);
    return all;
  }, [clasesFiltradas, examenes, filtroSemana, filtroTipo, busqueda]);

  // Estadísticas globales
  const totalClases = clases.length;
  const clasesCompletadas = useMemo(() => {
    return clases.filter((c) => getProgresoClase(c.clase_id) >= 100).length;
  }, [clases, activeProgreso, resumenMap]);

  const progresoPromedio = useMemo(() => {
    if (totalClases === 0) return 0;
    const suma = clases.reduce((acc, c) => acc + getProgresoClase(c.clase_id), 0);
    return Math.round(suma / totalClases);
  }, [clases, activeProgreso, totalClases, resumenMap]);

  const xpTotal = useMemo(() => {
    return activeProgreso.reduce((acc, p) => acc + (p.correcto ? (p.puntaje_obtenido || 10) : 0), 0);
  }, [activeProgreso]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#121416] via-[#1A1D20] to-[#241b35] text-white p-2.5 sm:p-6 lg:p-8 select-none max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-white/10 w-full">
          <div className="flex items-center gap-2 sm:gap-3">
            {onBackToCover && (
              <button
                id="btn-back-to-cover"
                type="button"
                onClick={onBackToCover}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                <span>Portada</span>
              </button>
            )}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#39FF14]/15 border border-[#39FF14]/40 text-[#39FF14] text-[10px] sm:text-[11px] font-mono font-bold uppercase">
              <Sparkles className="w-3 h-3 shrink-0" /> Plan 90h · MCER A1
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#8A95A5]">
            <span className="hidden sm:inline">XP Acumulados:</span>
            <span className="px-2.5 py-1 rounded-lg bg-[#39FF14]/20 border border-[#39FF14]/40 text-[#39FF14] font-bold text-xs">
              ⚡ {xpTotal} XP
            </span>
            {onResetMockProgress && (
              <button
                type="button"
                onClick={onResetMockProgress}
                title="Reiniciar datos de prueba"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#8A95A5] hover:text-white transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Index Header */}
        <header className="text-center mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif italic text-white mb-2 leading-tight break-words">
            📚 Módulo A1 - TecLingo
          </h1>
          <p className="text-xs sm:text-base text-[#8A95A5] break-words">
            {totalClases || 19} clases · 90 horas pedagógicas · Certificación MCER A1
          </p>
        </header>

        {/* Global Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 w-full">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 text-center backdrop-blur-sm relative overflow-hidden group hover:border-[#667eea]/50 transition-all">
            <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#8A95A5] mb-1">Catálogo Total</div>
            <div className="text-2xl sm:text-4xl font-bold font-mono text-white flex items-center justify-center gap-2">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#667eea] shrink-0" />
              <span>{totalClases}</span>
              <span className="text-xs sm:text-sm text-[#8A95A5] font-normal">clases</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 text-center backdrop-blur-sm relative overflow-hidden group hover:border-[#10b981]/50 transition-all">
            <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#8A95A5] mb-1">Clases Completadas</div>
            <div className="text-2xl sm:text-4xl font-bold font-mono text-[#10b981] flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <span>{clasesCompletadas}</span>
              <span className="text-xs sm:text-sm text-[#8A95A5] font-normal">/ {totalClases}</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 text-center backdrop-blur-sm relative overflow-hidden group hover:border-[#39FF14]/50 transition-all">
            <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#8A95A5] mb-1">Progreso General del Curso</div>
            <div className="text-2xl sm:text-4xl font-bold font-mono text-[#39FF14] flex items-center justify-center gap-2">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <span>{progresoPromedio}%</span>
            </div>
            {/* Global progress bar */}
            <div className="w-full bg-white/10 h-1.5 sm:h-2 rounded-full mt-2 sm:mt-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#10b981] to-[#39FF14] transition-all duration-500" 
                style={{ width: `${progresoPromedio}%` }}
              />
            </div>
          </div>
        </div>

        {/* Search, Filters & View Mode Bar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 sm:p-5 mb-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between backdrop-blur-sm max-w-full overflow-hidden">
          {/* Search Input */}
          <div className="relative w-full md:w-5/12">
            <Search className="w-4 h-4 text-[#8A95A5] absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0" />
            <input
              id="search-classes-input"
              type="text"
              placeholder="🔍 Buscar clase o tema gramatical..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/30 text-white placeholder-[#8A95A5] text-xs sm:text-sm transition-all outline-none"
            />
          </div>

          {/* Filters: Week & Content Type + View Switcher */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 flex-1 sm:flex-initial">
              <Calendar className="w-3.5 h-3.5 text-[#8A95A5] shrink-0" />
              <select
                id="select-week-filter"
                value={filtroSemana ?? ''}
                onChange={(e) => setFiltroSemana(e.target.value ? Number(e.target.value) : null)}
                className="bg-transparent text-white text-[11px] sm:text-xs font-medium outline-none cursor-pointer w-full"
              >
                <option value="" className="bg-[#1A1D20] text-white">Todas las semanas</option>
                {Array.from({ length: 15 }, (_, i) => (
                  <option key={i + 1} value={i + 1} className="bg-[#1A1D20] text-white">
                    Semana {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 flex-1 sm:flex-initial">
              <Filter className="w-3.5 h-3.5 text-[#8A95A5] shrink-0" />
              <select
                id="select-type-filter"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as any)}
                className="bg-transparent text-white text-[11px] sm:text-xs font-medium outline-none cursor-pointer w-full"
              >
                <option value="todos" className="bg-[#1A1D20] text-white">Todos los formatos</option>
                <option value="original" className="bg-[#1A1D20] text-white">🎬 Clases Teclingo</option>
                <option value="repaso" className="bg-[#1A1D20] text-white">🔄 Repasos MCER</option>
                <option value="taller" className="bg-[#1A1D20] text-white">✍️ Talleres</option>
              </select>
            </div>

            {/* View Mode Toggle: XLS Table vs Cards */}
            <div className="flex items-center gap-1 bg-black/60 border border-white/15 p-1 rounded-xl shrink-0">
              <button
                type="button"
                id="toggle-view-xls"
                onClick={() => setViewMode('xls')}
                title="Vista Hoja de Cálculo XLS"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  viewMode === 'xls'
                    ? 'bg-[#107C41] text-white shadow-[0_0_12px_rgba(16,124,65,0.6)] ring-1 ring-[#107C41]'
                    : 'text-[#8A95A5] hover:text-white hover:bg-white/5'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#00F5D4]" />
                <span className="hidden sm:inline">Tabla XLS</span>
              </button>
              <button
                type="button"
                id="toggle-view-cards"
                onClick={() => setViewMode('cards')}
                title="Vista de Tarjetas"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)] ring-1 ring-blue-500'
                    : 'text-[#8A95A5] hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tarjetas</span>
              </button>
            </div>
          </div>
        </div>

        {/* Temperature Color Scale Legend */}
        <div className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 mb-6 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-2 text-[#8A95A5]">
            <Flame className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="font-bold text-gray-300">Termómetro de Avance:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px]">
            <span className="flex items-center gap-1 text-[#8A95A5]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8A95A5]/40 inline-block" /> 0% Pendiente
            </span>
            <span className="flex items-center gap-1 text-[#F97316]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] inline-block" /> 1-24% Naranja
            </span>
            <span className="flex items-center gap-1 text-[#F59E0B]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block" /> 25-49% Ámbar
            </span>
            <span className="flex items-center gap-1 text-[#A3E635]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A3E635] inline-block" /> 50-74% Lima
            </span>
            <span className="flex items-center gap-1 text-[#10B981]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block" /> 75-99% Esmeralda
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00F5D4]/20 border border-[#00F5D4]/60 text-[#00F5D4] font-bold shadow-[0_0_10px_rgba(0,245,212,0.3)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00F5D4] inline-block animate-pulse" /> 100% Verde Aqua
            </span>
          </div>
        </div>

        {/* Classes Content: XLS Table or Cards */}
        {clasesFiltradas.length === 0 ? (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
            <BookOpen className="w-12 h-12 text-[#8A95A5] mx-auto mb-3 opacity-50" />
            <p className="text-lg text-white font-medium">No se encontraron clases con los filtros seleccionados.</p>
            <p className="text-sm text-[#8A95A5] mt-1">Intenta buscar otro término o reiniciar los filtros.</p>
            <button
              type="button"
              onClick={() => { setBusqueda(''); setFiltroSemana(null); setFiltroTipo('todos'); }}
              className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-bold uppercase transition-all cursor-pointer"
            >
              Limpiar Filtros
            </button>
          </div>
        ) : viewMode === 'xls' ? (
          /* ================================================================= */
          /* VISTA DISENO DE TABLA XLS (Excel / Spreadsheet)                   */
          /* ================================================================= */
          <div className="w-full bg-[#12161A] border border-[#107C41]/40 rounded-2xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
            {/* Excel Ribbon / Spreadsheet Title Bar */}
            <div className="bg-[#107C41] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono border-b border-[#0d6535]">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#00F5D4]" />
                <span className="font-bold tracking-wide">📗 Catalogo_Clases_A1.xlsx</span>
                <span className="text-emerald-200 hidden sm:inline">• Hoja 1: Curriculo_35_Clases</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-emerald-100">
                <span>Registros: <strong className="text-white font-bold">{clasesFiltradas.length}</strong> de 35</span>
                <span className="hidden md:inline">|</span>
                <span className="hidden md:inline">Plan: 90 horas académicas</span>
              </div>
            </div>

            {/* Formula Bar (fx) */}
            <div className="bg-[#181D22] border-b border-white/10 px-3 py-1.5 flex items-center gap-2 text-xs font-mono">
              <span className="font-bold text-[#00F5D4] italic bg-black/40 px-2 py-0.5 rounded border border-white/10">fx</span>
              <span className="text-[#8A95A5] text-[11px] truncate">
                =BUSCARV(id_clase, PlanEstudios_A1, 4, FALSO) &amp; " • Termómetro Temp: Naranja → Verde Aqua"
              </span>
            </div>

            {/* XLS Table Container with Horizontal Scroll */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  {/* Excel Column Headers Row */}
                  <tr className="bg-[#1A221E] text-[#9CA3AF] text-[11px] font-mono uppercase tracking-wider border-b border-white/15 select-none">
                    <th className="py-2.5 px-3 w-12 text-center border-r border-white/10 bg-black/30 text-[#8A95A5]">#</th>
                    <th className="py-2.5 px-3 w-24 border-r border-white/10">A: ID</th>
                    <th className="py-2.5 px-2.5 w-16 text-center border-r border-white/10">B: Sem</th>
                    <th className="py-2.5 px-2.5 w-16 text-center border-r border-white/10">C: Ses</th>
                    <th className="py-2.5 px-4 min-w-[200px] border-r border-white/10">D: Título de la Clase</th>
                    <th className="py-2.5 px-4 min-w-[220px] border-r border-white/10">E: Tema Gramatical</th>
                    <th className="py-2.5 px-3 w-28 text-center border-r border-white/10">F: Formato</th>
                    <th className="py-2.5 px-2.5 w-20 text-center border-r border-white/10">G: Duración</th>
                    <th className="py-2.5 px-4 min-w-[180px] border-r border-white/10">H: % Avance (Temp)</th>
                    <th className="py-2.5 px-3 min-w-[140px] text-center border-r border-white/10">I: Estado</th>
                    <th className="py-2.5 px-3 w-28 text-center">J: Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-xs">
                  {itemsOrdenados.map((clase: any, index: number) => {
                    // FIX 2026-09-27: fila de examen (render distinto)
                    if (clase.isExam) {
                      const e = clase.exam;
                      return (
                        <tr
                          key={e.code}
                          className="bg-indigo-950/40 border-l-4 border-l-indigo-400 hover:bg-indigo-900/50 transition-colors"
                        >
                          <td className="py-3 px-3 text-center border-r border-white/5 text-[11px] bg-indigo-900/30">
                            📝
                          </td>
                          <td className="py-3 px-3 border-r border-white/5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-indigo-500/25 text-indigo-200 border border-indigo-400/50">
                              {e.code}
                            </span>
                          </td>
                          <td className="py-3 px-2.5 text-center border-r border-white/5 text-indigo-200 font-bold">
                            S{clase.semana}
                          </td>
                          <td className="py-3 px-2.5 text-center border-r border-white/5 text-[#8A95A5]">—</td>
                          <td className="py-3 px-4 border-r border-white/5 font-sans font-bold text-indigo-100" colSpan={4}>
                            {e.title}
                          </td>
                          <td className="py-3 px-2.5 text-center border-r border-white/5 text-indigo-200 text-[11px] font-mono">
                            {e.totalQuestions}q · {e.durationMinutes}m
                          </td>
                          <td className="py-3 px-4 border-r border-white/5 text-[11px] text-[#8A95A5] text-center">—</td>
                          <td className="py-3 px-3 text-center border-r border-white/5 whitespace-nowrap">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/40 inline-flex items-center gap-1">
                              🔒 Próximamente
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              disabled
                              className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-gray-600/30 text-gray-400 cursor-not-allowed mx-auto"
                            >
                              Bloqueado
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    const datos = getDatosClase(clase.clase_id);
                    const progreso = datos.porcentaje_avance;
                    const temp = getClassTemperature(progreso);
                    const is100 = temp.isCompleted || datos.estado_clase === 'completada';
                    const estadoBadge = getEstadoClaseBadge(datos.estado_clase, is100);

                    // Aqua styling for 100% complete row
                    const rowBgClass = is100
                      ? 'bg-[#00F5D4]/12 hover:bg-[#00F5D4]/20 border-l-4 border-l-[#00F5D4] shadow-[inset_0_0_20px_rgba(0,245,212,0.08)]'
                      : index % 2 === 0
                      ? 'bg-[#15191D] hover:bg-[#1E252C]'
                      : 'bg-[#121619] hover:bg-[#1E252C]';

                    return (
                      <tr
                        key={clase.clase_id}
                        id={`xls-row-${clase.clase_id}`}
                        onClick={() => onSelectClass(clase.clase_id)}
                        className={`transition-colors cursor-pointer group select-none ${rowBgClass}`}
                      >
                        {/* Excel Row Index */}
                        <td className="py-3 px-3 text-center border-r border-white/5 text-[#8A95A5] text-[11px] bg-black/20 group-hover:text-white font-mono">
                          {index + 1}
                        </td>

                        {/* ID (Col A) */}
                        <td className="py-3 px-3 border-r border-white/5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            is100 ? 'bg-[#00F5D4]/20 text-[#00F5D4] border border-[#00F5D4]/50' : 'bg-white/5 text-[#A5B4FC]'
                          }`}>
                            {clase.clase_id}
                          </span>
                        </td>

                        {/* Sem (Col B) */}
                        <td className="py-3 px-2.5 text-center border-r border-white/5 text-gray-300">
                          S{clase.semana}
                        </td>

                        {/* Ses (Col C) */}
                        <td className="py-3 px-2.5 text-center border-r border-white/5 text-gray-300">
                          #{clase.sesion}
                        </td>

                        {/* Title (Col D) */}
                        <td className="py-3 px-4 border-r border-white/5 font-sans font-semibold text-white group-hover:text-[#00F5D4] transition-colors">
                          <div className="flex items-center gap-1.5">
                            {is100 && <CheckCircle2 className="w-3.5 h-3.5 text-[#00F5D4] shrink-0" />}
                            <span className="truncate max-w-[260px]">{clase.titulo_clase}</span>
                          </div>
                        </td>

                        {/* Grammatical Topic (Col E) */}
                        <td className="py-3 px-4 border-r border-white/5 text-[#8A95A5] font-sans text-[11px] leading-relaxed">
                          <span className="line-clamp-1">{clase.tema_principal}</span>
                        </td>

                        {/* Content Type (Col F) */}
                        <td className="py-3 px-3 text-center border-r border-white/5 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              clase.tipo_contenido === 'original'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : clase.tipo_contenido === 'repaso'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {clase.tipo_contenido === 'original' ? '🎬 Teclingo' : clase.tipo_contenido === 'repaso' ? '🔄 Repaso' : '✍️ Taller'}
                          </span>
                        </td>

                        {/* Duration (Col G) */}
                        <td className="py-3 px-2.5 text-center border-r border-white/5 text-amber-300 text-[11px]">
                          {clase.duracion_min}m
                        </td>

                        {/* Progress Bar and % in Temperature Color (Col H) */}
                        <td className="py-3 px-4 border-r border-white/5 whitespace-nowrap">
                          <div className="flex flex-col gap-1 min-w-[140px]">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className={`font-bold ${temp.textColorClass}`}>
                                {progreso}%
                              </span>
                              <span className="text-[10px] text-[#8A95A5]">
                                {datos.reactivos_correctos}/{datos.reactivos_totales ?? 25}
                              </span>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${temp.barGradient}`}
                                style={{ width: `${progreso}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status (Col I) - REGLA 4: pendiente (gris), en_progreso (azul), completada (verde) */}
                        <td className="py-3 px-3 text-center border-r border-white/5 whitespace-nowrap">
                          <span className={`text-[11px] font-mono font-black px-3 py-1 rounded-full border inline-flex items-center gap-1.5 uppercase tracking-wider ${estadoBadge.badgeClass}`}>
                            <span className={`w-2 h-2 rounded-full ${estadoBadge.dotColor}`} />
                            <span>{estadoBadge.label}</span>
                          </span>
                        </td>

                        {/* Action (Col J) */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectClass(clase.clase_id);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all mx-auto cursor-pointer ${
                              is100
                                ? 'bg-[#00F5D4]/20 hover:bg-[#00F5D4] text-[#00F5D4] hover:text-black border border-[#00F5D4]/50'
                                : 'bg-white/10 hover:bg-[#667eea] text-white hover:text-white'
                            }`}
                          >
                            <span>{progreso > 0 ? 'Abrir' : 'Iniciar'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* XLS Footer Info */}
            <div className="bg-[#15191D] border-t border-white/10 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#8A95A5]">
              <div>Hoja 1 de 1 • Teclingo XLS Engine v2.4</div>
              <div className="flex items-center gap-4">
                <span>Total Clases: 35</span>
                <span>Completadas: <strong className="text-[#00F5D4]">{clasesCompletadas}</strong></span>
              </div>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* VISTA DE TARJETAS (Cards View) CON TEMPERATURA Y VERDE AQUA 100%  */
          /* ================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 w-full">
            {clasesFiltradas.map((clase: SheetClaseRow) => {
              const datos = getDatosClase(clase.clase_id);
              const progreso = datos.porcentaje_avance;
              const temp = getClassTemperature(progreso);
              const is100 = temp.isCompleted || datos.estado_clase === 'completada';
              const estadoBadge = getEstadoClaseBadge(datos.estado_clase, is100);

              const borderHighlight = is100
                ? 'border-l-4 border-l-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.25)]'
                : `border-l-4 ${temp.borderTintClass}`;

              return (
                <div
                  key={clase.clase_id}
                  id={`class-card-${clase.clase_id}`}
                  onClick={() => onSelectClass(clase.clase_id)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectClass(clase.clase_id); }}
                  className={`bg-[#1A1D20]/90 hover:bg-[#22272b] border border-white/10 rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between group max-w-full overflow-hidden ${borderHighlight}`}
                >
                  <div>
                    {/* Header: Class number & Type badge & Estado Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold ${
                          is100 ? 'bg-[#00F5D4]/20 border border-[#00F5D4]/50 text-[#00F5D4]' : 'bg-[#667eea]/20 border border-[#667eea]/40 text-[#a5b4fc]'
                        }`}>
                          #{clase.clase_numero < 10 ? `0${clase.clase_numero}` : clase.clase_numero} · {clase.clase_id}
                        </span>
                        {/* REGLA 4: Estado clase (pendiente: gris, en_progreso: azul, completada: verde) */}
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${estadoBadge.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${estadoBadge.dotColor}`} />
                          <span>{estadoBadge.label}</span>
                        </span>
                      </div>
                      <span
                        className={`text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          clase.tipo_contenido === 'original'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : clase.tipo_contenido === 'repaso'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {clase.tipo_contenido === 'original' ? '🎬 Teclingo' : clase.tipo_contenido === 'repaso' ? '🔄 Repaso' : '✍️ Taller'}
                      </span>
                    </div>

                    {/* Class Title */}
                    <h3 className={`text-sm sm:text-base lg:text-lg font-bold transition-colors leading-snug mb-1.5 sm:mb-2 break-words ${
                      is100 ? 'text-white group-hover:text-[#00F5D4]' : 'text-white group-hover:text-[#a5b4fc]'
                    }`}>
                      {clase.titulo_clase}
                    </h3>

                    {/* Topic */}
                    <p className="text-xs sm:text-sm text-[#8A95A5] line-clamp-2 mb-3 sm:mb-4 leading-relaxed break-words">
                      {clase.tema_principal}
                    </p>
                  </div>

                  <div>
                    {/* Meta info: Week, Session, Duration */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-[#8A95A5] mb-2.5 sm:mb-3 pt-2.5 sm:pt-3 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#667eea] shrink-0" />
                        Semana {clase.semana}
                      </span>
                      <span>·</span>
                      <span className="font-mono">🎯 Sesión {clase.sesion}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                        {clase.duracion_min} min
                      </span>
                    </div>

                    {/* Progress Bar and Status with Temperature Color */}
                    <div className="mt-1.5 sm:mt-2">
                      <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono mb-1">
                        <span className="flex items-center gap-1 text-[11px] text-[#8A95A5]">
                          {datos.reactivos_correctos > 0 ? (
                            <span>{datos.reactivos_correctos}/{datos.reactivos_totales ?? 25} reactivos ({datos.habilidades_completadas}/5 hab.)</span>
                          ) : is100 ? (
                            <span className="text-[#00F5D4] flex items-center gap-1 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#00F5D4] shrink-0" />
                              {datos.reactivos_totales ?? 25}/{datos.reactivos_totales ?? 25} Reactivos
                            </span>
                          ) : (
                            <span>{temp.label}</span>
                          )}
                        </span>
                        <span className={`font-bold font-mono ${temp.textColorClass}`}>
                          {progreso}%
                        </span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 sm:h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${temp.barGradient}`}
                          style={{ width: `${progreso}%` }}
                        />
                      </div>
                    </div>

                    {/* Action button hint */}
                    <div className="mt-3 sm:mt-4 flex items-center justify-end">
                      <div className={`text-[11px] sm:text-xs font-mono font-bold flex items-center gap-1 transition-colors ${
                        is100 ? 'text-[#00F5D4] group-hover:text-white' : 'text-[#a5b4fc] group-hover:text-white'
                      }`}>
                        <span>{progreso > 0 ? 'Continuar Clase' : 'Iniciar Clase'}</span>
                        <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5 shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Helper Note */}
        <div className="mt-12 text-center text-xs font-mono text-[#8A95A5]/60 border-t border-white/10 pt-6">
          TECLINGO ACADEMY • PROGRAMA ACADÉMICO MCER A1 • ALINEADO CON TECNM
        </div>

      </div>
    </div>
  );
};

