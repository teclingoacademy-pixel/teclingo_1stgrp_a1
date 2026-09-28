/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * coursePhasesA1Plus.ts
 * Fuente unica de verdad de la estructura del curso A1+ (Fast Track TOEFL).
 * Define las 4 fases + Cierre, las 15 semanas y sus titulos gramaticales.
 */

export interface CoursePhase {
  code: 'F1' | 'F2' | 'F3' | 'F4' | 'C';
  order: number;
  name: string;
  description: string;
  weekFrom: number;
  weekTo: number;
  block: number;
  mcer: string;
}

export interface CourseWeek {
  semana: number;
  phase: 'F1' | 'F2' | 'F3' | 'F4' | 'C';
  titulo: string;
  tituloCorto: string;
  mcer: string;
  grammarFocus: string;
}

export const FASE_CERO = {
  code: 'A1_C00',
  titulo: 'Fase Cero: Singular & Plural',
  videoId: 'JBB6JZT4VIc',
  youtubeUrl: 'https://www.youtube.com/shorts/JBB6JZT4VIc',
  obligatoria: true,
  bloqueaTodo: true,
} as const;

export const COURSE_PHASES: CoursePhase[] = [
  { code: 'F1', order: 1, name: 'Identidad Personal', description: 'Presentarse a uno mismo. Parrafo 1. Cierre con Examen Int 1.', weekFrom: 1, weekTo: 4, block: 1, mcer: 'A1' },
  { code: 'F2', order: 2, name: 'Rutina y Presente Activo', description: 'Describir habitos. Parrafo 2. Cierre con Examen Int 2.', weekFrom: 5, weekTo: 8, block: 2, mcer: 'A1' },
  { code: 'F3', order: 3, name: 'Experiencia Pasada', description: 'Narrar eventos. Parrafo 3. Cierre con Proyecto Oral.', weekFrom: 9, weekTo: 11, block: 3, mcer: 'A1+' },
  { code: 'F4', order: 4, name: 'Planes Futuros', description: 'Expresar intenciones. Parrafo 4. Cierre con Examen Final.', weekFrom: 12, weekTo: 14, block: 4, mcer: 'A1+' },
  { code: 'C', order: 5, name: 'Cierre Academico', description: 'Entrega de calificaciones, ceremonia y certificacion.', weekFrom: 15, weekTo: 15, block: 5, mcer: 'A1' },
];

export const COURSE_WEEKS: CourseWeek[] = [
  { semana: 1,  phase: 'F1', titulo: 'Verbo To Be + Pronombres Personales', tituloCorto: 'To Be + Pronombres', mcer: 'A1', grammarFocus: 'am / is / are · I, you, he, she, it, we, they' },
  { semana: 2,  phase: 'F1', titulo: 'Datos Personales: Nombre, Edad y Origen', tituloCorto: 'Datos Personales', mcer: 'A1', grammarFocus: 'My name is... · I am ___ years old · I am from...' },
  { semana: 3,  phase: 'F1', titulo: 'Articulos, Plurales y Preposiciones de Lugar', tituloCorto: 'Articulos + Plurales', mcer: 'A1', grammarFocus: 'a / an / the · -s/-es/-ies · from/in/with' },
  { semana: 4,  phase: 'F1', titulo: 'Cierre Fase 1 + Examen Intermedio 1', tituloCorto: 'Cierre F1', mcer: 'A1', grammarFocus: 'Repaso C00-C05 + Evaluacion' },
  { semana: 5,  phase: 'F2', titulo: 'Presente Simple 1ra y 3ra Persona', tituloCorto: 'Presente Simple', mcer: 'A1', grammarFocus: 'I wake up · He wakes up · -s/-es/-ies' },
  { semana: 6,  phase: 'F2', titulo: 'Adverbios de Frecuencia y Preposiciones', tituloCorto: 'Frecuencia + Tiempo', mcer: 'A1', grammarFocus: 'always · usually · at 7:00 · by bus' },
  { semana: 7,  phase: 'F2', titulo: 'Gustos, Presente Continuo y Conectores', tituloCorto: 'Gustos + PC', mcer: 'A1', grammarFocus: 'like + -ing · am/is/are + -ing · and/but/because' },
  { semana: 8,  phase: 'F2', titulo: 'Cierre Fase 2 + Examen Intermedio 2', tituloCorto: 'Cierre F2', mcer: 'A1', grammarFocus: 'Repaso C06-C11 + Evaluacion' },
  { semana: 9,  phase: 'F3', titulo: 'Pasado del To Be y Pasado Regular', tituloCorto: 'Pasado Base', mcer: 'A1+', grammarFocus: 'was / were · visited, talked, played' },
  { semana: 10, phase: 'F3', titulo: 'Pasado Irregular y Narracion', tituloCorto: 'Pasado Irregular', mcer: 'A1+', grammarFocus: 'went · ate · took · swam · saw · last week' },
  { semana: 11, phase: 'F3', titulo: 'Cierre Fase 3 + Proyecto Oral', tituloCorto: 'Cierre F3', mcer: 'A1+', grammarFocus: 'Consolidacion C12-C15 + Presentacion oral' },
  { semana: 12, phase: 'F4', titulo: 'Futuro con Going To y Will', tituloCorto: 'Going To + Will', mcer: 'A1+', grammarFocus: 'am/are going to · will + verbo' },
  { semana: 13, phase: 'F4', titulo: 'Integracion Final + Texto Modelo', tituloCorto: 'Integracion', mcer: 'A1+', grammarFocus: 'Repaso 4 fases · produccion texto modelo' },
  { semana: 14, phase: 'F4', titulo: 'Cierre Fase 4 + Examen Final MCER A1', tituloCorto: 'Examen Final', mcer: 'A1+', grammarFocus: 'Repaso general + Certificacion' },
  { semana: 15, phase: 'C',  titulo: 'Clausura Academica + Entrega + Certificacion', tituloCorto: 'Cierre', mcer: 'A1', grammarFocus: 'Calificaciones · ceremonia · certificados' },
];

export function getPhaseForWeek(semana: number): CoursePhase | null {
  return COURSE_PHASES.find(p => semana >= p.weekFrom && semana <= p.weekTo) ?? null;
}

export function getWeekMeta(semana: number): CourseWeek | null {
  return COURSE_WEEKS.find(w => w.semana === semana) ?? null;
}