/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * workbookRows.ts
 * Tipos de "filas" de la hoja workbook.
 * Antes vivían en googleDatasheetA1.ts (obsoleto, se va a eliminar).
 */

export type { SheetReactivoRow } from './reactivo';

export interface SheetConfigRow {
  clave: string;
  valor: string;
  descripcion: string;
  categoria: 'curso' | 'academico' | 'evaluacion' | 'multimedia' | 'sistema';
  tipo_dato: 'string' | 'number' | 'boolean' | 'json';
  actualizado_el: string;
}

export interface SheetClaseRow {
  clase_id: string;
  clase_numero: number;
  semana: number;
  sesion: 'A' | 'B';
  titulo_clase: string;
  titulo_video: string;
  video_url: string;
  tema_principal: string;
  tipo_contenido: 'original' | 'repaso' | 'taller';
  duracion_min: number;
  estado: 'activo' | 'inactivo';
}

export interface SheetVocabularioRow {
  vocab_id: string;
  clase_id: string;
  palabra_ingles: string;
  palabra_espanol: string;
  categoria: 'sustantivo' | 'verbo' | 'adjetivo' | 'expresion' | 'pronombre' | 'adverbio';
  pronunciacion_af: string;
  audio_url: string;
  ejemplo_uso: string;
  dificultad: number;
}

export interface SheetVerboRow {
  verbo_id: string;
  clase_id: string;
  infinitivo: string;
  traduccion: string;
  presente_simple: string;
  tercera_persona: string;
  pasado_simple: string;
  participio: string;
  tipo: 'regular' | 'irregular';
  ejemplo_oracion: string;
}

export interface SheetTextoExplicativoRow {
  explicacion_id: string;
  clase_id: string;
  titulo_explicacion: string;
  contenido_html: string;
  contenido_markdown: string;
  ejemplos_tabla_json: string;
  reglas_clave: string;
  duracion_lectura_min: number;
  version: number;
  activo: boolean;
}

export interface SheetTextoBaseRow {
  texto_id: string;
  clase_id: string;
  titulo?: string;
  titulo_texto?: string;
  contenido?: string;
  contenido_texto?: string;
  translation?: string;
  palabras_count: number;
  dificultad: number;
  vocabulario_usado?: string[];
  verbos_usados?: string[];
  audio_tts_url?: string;
  tiempo_audio_seg: number;
  tipo_texto?: 'dialogo' | 'narrativo' | 'descriptivo';
  activo?: boolean;
}

export interface SheetExposicionRow {
  exposicion_id: string;
  semana: number;
  titulo: string;
  instrucciones: string;
  tema_presentacion: string;
  tiempo_minutos: number;
  criterios_evaluacion: string;
  vocabulario_sugerido: string[];
}

export interface SheetExamenRow {
  examen_id: string;
  titulo: string;
  clases_evaluadas: string;
  total_preguntas: number;
  tiempo_limite_min: number;
  puntaje_minimo_aprobatorio: number;
  descripcion: string;
}

export interface SheetProgresoUsuarioRow {
  progreso_id: string;
  user_id: string;
  clase_id: string;
  habilidad: string;
  reactivo_id: string;
  respuesta_usuario: string;
  correcto: boolean;
  tiempo_respuesta_seg: number;
  puntaje_obtenido: number;
  fecha_registro: string;
}

export interface SheetResumenProgresoRow {
  resumen_id?: string;
  user_id: string;
  clase_id: string;
  habilidades_completadas?: number;
  reactivos_totales_clase?: number;
  reactivos_correctos?: number;
  puntaje_obtenido?: number;
  puntaje_maximo_posible?: number;
  porcentaje_avance: number;
  xp_ganado?: number;
  estado_clase: 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada' | 'disponible' | string;
  ultima_actualizacion: string;
  xp_obtenidos?: number;
  reactivos_resueltos?: number;
}

export interface SheetUsuarioRow {
  user_id: string;
  email: string;
  nombre: string;
  avatar_url?: string | null;
  fecha_registro: string;
  nivel_actual: string;
  xp_total: number;
  clases_completadas: number;
  tipo_cuenta: 'regular' | 'demo';
  activo: boolean;
  password?: string;
}