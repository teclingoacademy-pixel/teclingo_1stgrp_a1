/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * useStudentProgress — Hook compartido para leer progreso real desde Prisma.
 * FIX 2026-09-27: usa /api/progress/summary (mismo endpoint que ClassIndexScreen)
 * + mapping correcto de lecciones a semanas.
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '@/services/apiConfig';

export interface SkillProgress {
  correct: number;
  total: number;
  percent: number;
}

export interface LessonProgress {
  lessonId: string;
  correct: number;
  total: number;
  percent: number;
  skills: Record<string, number>;
  points: number;
}

export interface StudentProgressData {
  byLesson: Record<string, LessonProgress>;
  bySkill: Record<string, SkillProgress>;
  resumen: Array<{
    clase_id: string;
    porcentaje_avance: number;
    estado_clase: string;
    reactivos_correctos: number;
    reactivos_totales_clase: number;
    habilidades_completadas: number;
    xp_ganado: number;
  }>;
  totalSubmissions: number;
}

// Mapping oficial leccion -> semana (15 semanas del curso A1)
// FIX 2026-09-28: IDs migrados a N1-CXX
const WEEK_LESSONS: Record<number, string[]> = {
  1:  ['N1-C00', 'N1-C01'],
  2:  ['N1-C02', 'N1-C03'],
  3:  ['N1-C04', 'N1-C05'],
  4:  [],
  5:  ['N1-C06', 'N1-C07'],
  6:  ['N1-C08', 'N1-C09'],
  7:  ['N1-C10', 'N1-C11'],
  8:  [],
  9:  ['N1-C12', 'N1-C13'],
  10: ['N1-C14', 'N1-C15'],
  11: ['N1-C16', 'N1-C17'],
  12: ['N1-C18', 'N1-C19'],
  13: ['N1-C20', 'N1-C21'],
  14: ['N1-C25', 'N1-C26'],
  15: ['N1-C28', 'N1-C29'],
};

interface UseStudentProgressResult {
  loading: boolean;
  error: string | null;
  data: StudentProgressData | null;
  refresh: () => Promise<void>;
  currentWeek: number;
  overallPercent: number;
  strongestSkill: { name: string; percent: number } | null;
  weakestSkill: { name: string; percent: number } | null;
  completedWeeks: number[];
}

const SKILL_LABELS: Record<string, string> = {
  SPEAKING: 'Speaking',
  LISTENING: 'Listening',
  READING: 'Reading',
  WRITING: 'Writing',
  GRAMMAR: 'Grammar',
  VOCABULARY: 'Vocabulary',
};

const EMPTY: StudentProgressData = { byLesson: {}, bySkill: {}, resumen: [], totalSubmissions: 0 };

export function useStudentProgress(email: string | null | undefined): UseStudentProgressResult {
  const [data, setData] = useState<StudentProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!email) {
      setData(EMPTY);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('email', email);
      const res = await fetch(apiUrl('/api/progress/summary') + '?' + params.toString());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      if (!json.success || !json.data) throw new Error(json.error || 'Sin datos');

      const raw = json.data as Record<string, any>;
      const byLesson: Record<string, LessonProgress> = {};
      const resumen: StudentProgressData['resumen'] = [];

      for (const [lessonId, info] of Object.entries(raw)) {
        const pct = info.porcentaje_avance ?? 0;
        byLesson[lessonId] = {
          lessonId,
          correct: info.reactivos_correctos ?? 0,
          total: info.reactivos_totales ?? 25,
          percent: pct,
          skills: {},
          points: info.score ?? 0,
        };
        resumen.push({
          clase_id: lessonId,
          porcentaje_avance: pct,
          estado_clase: info.completed ? 'completada' : (pct > 0 ? 'en_progreso' : 'pendiente'),
          reactivos_correctos: info.reactivos_correctos ?? 0,
          reactivos_totales_clase: info.reactivos_totales ?? 25,
          habilidades_completadas: info.habilidades_completadas ?? 0,
          xp_ganado: info.score ?? 0,
        });
      }

      setData({ byLesson, bySkill: (json.bySkill ?? {}) as Record<string, SkillProgress>, resumen, totalSubmissions: json.totalSubmissions ?? 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando progreso');
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // completedWeeks: una semana esta completa si TODAS sus lecciones estan al 100%
  const byLessonRef = data?.byLesson || {};
  const completedWeeks: number[] = [];
  for (const [weekStr, lessons] of Object.entries(WEEK_LESSONS)) {
    const week = Number(weekStr);
    if (lessons.length === 0) continue;
    const allDone = lessons.every((lid) => (byLessonRef[lid]?.percent ?? 0) >= 100);
    if (allDone) completedWeeks.push(week);
  }
  completedWeeks.sort((a, b) => a - b);

  // currentWeek: primera semana NO completada (1-15)
  let currentWeek = 1;
  for (let w = 1; w <= 15; w++) {
    if (!completedWeeks.includes(w)) { currentWeek = w; break; }
  }
  if (completedWeeks.length >= 15) currentWeek = 15;

  // overallPercent = promedio de % de las 15 semanas (con lessons)
  const weekPercents: number[] = [];
  for (const lessons of Object.values(WEEK_LESSONS)) {
    if (lessons.length === 0) continue;
    const sum = lessons.reduce((acc, lid) => acc + (byLessonRef[lid]?.percent ?? 0), 0);
    weekPercents.push(Math.round(sum / lessons.length));
  }
  const overallPercent = weekPercents.length > 0
    ? Math.round(weekPercents.reduce((a, b) => a + b, 0) / weekPercents.length)
    : 0;

  // FIX 2026-09-28: calcular strongestSkill / weakestSkill desde data.bySkill
  const skillsArr = Object.entries(data?.bySkill ?? {})
    .map(([key, s]) => ({ name: SKILL_LABELS[key] || key, percent: s.percent ?? 0 }))
    .filter((s) => s.percent > 0)
    .sort((a, b) => b.percent - a.percent);

  const strongestSkill = skillsArr.length > 0 ? skillsArr[0] : null;
  const weakestSkill = skillsArr.length > 1 ? skillsArr[skillsArr.length - 1] : null;

  return {
    loading,
    error,
    data,
    refresh: fetchProgress,
    currentWeek,
    overallPercent,
    strongestSkill,
    weakestSkill,
    completedWeeks,
  };
}

export { SKILL_LABELS };