/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * malla.ts
 * Tipos de la malla curricular semanal del curso.
 * Antes vivían en data/mallaCurricularModulo1.ts (obsoleto).
 * Ahora se cargan desde Prisma vía /api/study-plan/S01.
 */

export interface HoraLeccion {
  hora: number;
  leccion: string;
  enfoque: string;
  videoId?: string;
  track?: string;
}

export interface SemanaMalla {
  semana: number;
  fechas: string;
  eje_tematico: string;
  unidad_libro: string;
  paginas: string;
  horas: HoraLeccion[];
  kpi: string;
}