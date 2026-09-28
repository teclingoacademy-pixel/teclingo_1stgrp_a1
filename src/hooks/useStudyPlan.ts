/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * useStudyPlan — Fuente única de verdad de la planeación semanal.
 *
 * La copia MAESTRA es la de la Biblioteca Directiva (Prisma `/api/study-plan`).
 * Director y docente consumen este mismo hook, de modo que cualquier cambio
 * aprobado por la dirección se refleja en el panel del docente.
 *
 * Cadena de respaldo: Prisma → Data Lake (overlay) → Google Sheets → malla estática.
 */

import { useCallback, useEffect, useState } from 'react';
import type { SemanaMalla, HoraLeccion } from '../types/workbook/malla';

const DATA_LAKE_API_URL =
  (import.meta.env.VITE_IDENTITY_API_URL as string | undefined)?.trim() ||
  'https://script.google.com/macros/s/AKfycbz7buTc2D7FIgWVub6_t4leXfvqc68821957LHOUgP-mBqpWKn_7JaEU-DZWiumAcVb/exec';
const DATA_LAKE_SECRET = 'teclingo_secret_2026';

export type StudyPlanSource = 'prisma' | 'sheets' | 'static';

export interface StudyPlanLevel {
  code: string;
  semester: string;
  cefrTag: string;
  levelName: string;
  isPublished: boolean;
}

export interface UseStudyPlanResult {
  weeks: SemanaMalla[];
  level: StudyPlanLevel | null;
  source: StudyPlanSource;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function parseHoras(raw: unknown): HoraLeccion[] {
  let value: any = raw;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { return []; }
  }
  if (!Array.isArray(value)) return [];
  return value.map((h: any, i: number) => ({
    hora: Number(h?.hora) || i + 1,
    leccion: String(h?.leccion ?? h?.titulo ?? h?.title ?? ''),
    enfoque: String(h?.enfoque ?? h?.description ?? ''),
    videoId: String(h?.videoId ?? ''),
    track: String(h?.track ?? ''),
  }));
}

function extractRows(rawData: any): any[] {
  if (Array.isArray(rawData)) return rawData;
  if (rawData && typeof rawData === 'object') {
    const rows = rawData.rows || rawData.data || rawData.result || [];
    return Array.isArray(rows) ? rows : [];
  }
  return [];
}

function toSemanas(rows: any[]): SemanaMalla[] {
  const semanaMap = new Map<number, SemanaMalla>();
  rows.forEach((row: any) => {
    let semanaNum = Number(row?.semana) || 0;
    if (!semanaNum && row?.fechas) {
      const match = String(row.fechas).match(/Semana\s+(\d+)/i);
      if (match) semanaNum = Number(match[1]);
    }
    if (!semanaNum) return;

    const horas = parseHoras(row.horas_json ?? row.horas);
    const existing = semanaMap.get(semanaNum);
    if (existing) {
      existing.horas = [...existing.horas, ...horas];
      if (!existing.eje_tematico && row.eje_tematico) existing.eje_tematico = row.eje_tematico;
      if (!existing.unidad_libro && row.unidad_libro) existing.unidad_libro = row.unidad_libro;
      if (!existing.kpi && row.kpi) existing.kpi = row.kpi;
      if (!existing.paginas && row.paginas) existing.paginas = row.paginas;
    } else {
      semanaMap.set(semanaNum, {
        semana: semanaNum,
        fechas: row.fechas || '',
        eje_tematico: row.eje_tematico || '',
        unidad_libro: row.unidad_libro || '',
        paginas: row.paginas || '',
        kpi: row.kpi || '',
        horas,
      });
    }
  });
  return Array.from(semanaMap.values()).sort((a, b) => a.semana - b.semana);
}

async function fetchFromPrisma(code: string): Promise<{ weeks: SemanaMalla[]; level: StudyPlanLevel } | null> {
  const res = await fetch(`/api/study-plan/${encodeURIComponent(code)}`);
  if (!res.ok) return null;
  const json = await res.json();
  if (!json?.success || !json.data || !Array.isArray(json.data.weeks)) return null;
  return {
    weeks: toSemanas(
      json.data.weeks.map((w: any) => ({
        semana: w.weekNumber,
        fechas: w.fechas,
        eje_tematico: w.ejeTematico,
        unidad_libro: w.unidadLibro,
        paginas: w.paginas,
        kpi: w.kpi,
        horas_json: w.horasJson,
      }))
    ),
    level: {
      code: json.data.code,
      semester: json.data.semester,
      cefrTag: json.data.cefrTag,
      levelName: json.data.levelName,
      isPublished: !!json.data.isPublished,
    },
  };
}

async function fetchFromSheets(): Promise<SemanaMalla[] | null> {
  const res = await fetch(`${DATA_LAKE_API_URL}?action=readWorkbookSheet&sheet=MallaCurricular`);
  if (!res.ok) return null;
  return toSemanas(extractRows(await res.json()));
}

/** Overlay opcional del Data Lake (no bloquea: si falla se conserva la fuente base). */
async function overlayDataLake(weeks: SemanaMalla[]): Promise<SemanaMalla[]> {
  try {
    const res = await fetch(DATA_LAKE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'obtenerPlaneacion', secret: DATA_LAKE_SECRET }),
    });
    const json = await res.json();
    if (!json?.ok || !Array.isArray(json.data) || json.data.length === 0) return weeks;

    const merged = [...weeks];
    json.data.forEach((p: any) => {
      const semanaNum = Number(p.semana);
      if (!semanaNum) return;
      const existing = merged.find((w) => w.semana === semanaNum);
      if (existing) {
        existing.eje_tematico = p.eje_tematico || existing.eje_tematico;
        existing.unidad_libro = p.unidad_libro || existing.unidad_libro;
        existing.kpi = p.kpi || existing.kpi;
      } else {
        merged.push({
          semana: semanaNum,
          fechas: p.fecha_inicio ? `${p.fecha_inicio} - ${p.fecha_fin}` : '',
          eje_tematico: p.eje_tematico || '',
          unidad_libro: p.unidad_libro || '',
          paginas: '',
          kpi: p.kpi || '',
          horas: parseHoras(p.horas_json),
        });
      }
    });
    return merged.sort((a, b) => a.semana - b.semana);
  } catch {
    return weeks;
  }
}

export function useStudyPlan(code = 'S01'): UseStudyPlanResult {
  const [weeks, setWeeks] = useState<SemanaMalla[]>([]);
  const [level, setLevel] = useState<StudyPlanLevel | null>(null);
  const [source, setSource] = useState<StudyPlanSource>('prisma');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let next: SemanaMalla[] = [];
      let nextSource: StudyPlanSource = 'static';
      let nextLevel: StudyPlanLevel | null = null;

      try {
        const prisma = await fetchFromPrisma(code);
        if (prisma && prisma.weeks.length > 0) {
          next = prisma.weeks;
          nextLevel = prisma.level;
          nextSource = 'prisma';
        }
      } catch (e) {
        console.warn('[useStudyPlan] /api/study-plan no disponible:', e);
      }

      if (next.length === 0) {
        try {
          const sheets = await fetchFromSheets();
          if (sheets && sheets.length > 0) {
            next = sheets;
            nextSource = 'sheets';
          }
        } catch (e) {
          console.warn('[useStudyPlan] MallaCurricular (Sheets) no disponible:', e);
        }
      }

      if (next.length === 0) {
        console.warn('[useStudyPlan] Sin semanas en Prisma ni fallbacks — mostrando vacío');
        next = [];
        nextSource = 'static';
      }

      setWeeks(await overlayDataLake(next));
      setLevel(nextLevel);
      setSource(nextSource);
    } catch (e) {
      console.error('[useStudyPlan] Error cargando planeación maestra:', e);
      setError(e instanceof Error ? e.message : 'Error cargando la planeación');
      setWeeks([]);
      setSource('static');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  return { weeks, level, source, loading, error, refresh: load };
}
