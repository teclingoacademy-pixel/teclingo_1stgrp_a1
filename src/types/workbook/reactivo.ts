/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * reactivo.ts
 * Tipos del shape de reactivo que usa el frontend.
 * Antes vivían en googleDatasheetA1.ts (obsoleto, se va a eliminar).
 */

export interface ReactivoUI {
  // Identificación
  reactivo_id: string;
  clase_id: string;
  habilidad: string;
  numero?: number;
  numero_reactivo?: number;

  // Contenido
  tipo_pregunta: string;
  instruccion: string;
  pregunta_texto: string;
  opciones: string[];
  opciones_json?: string[] | string;
  opciones_traduccion?: string[] | null;
  opciones_traduccion_json?: string[] | string | null;
  respuesta_correcta: string;
  respuesta_explicacion: string;
  audio_url?: string;

  // Meta
  puntos: number;
  tiempo_limite_seg: number;
  dificultad?: number;
  activo?: boolean;

  // Columnas pedagógicas (v2)
  contexto_espanol?: string | null;
  frase_traduccion?: string | null;
  pista_vocabulario?: string | null;

  // Columnas estructuradas v3
  opciones_v3_json?: unknown;
  respuesta_correcta_id?: string;
  shuffle_opciones?: boolean;
  reglas_validacion_json?: unknown;
  audio_autoplay?: boolean;
  fuente_evidencia?: string;
  idioma_enunciado?: string;
  idioma_opciones?: string;

  // Andamiaje pedagógico
  mostrar_traduccion?: 'completa' | 'parcial' | 'ninguna' | string | null;
  palabras_clave_traduccion?: string | null;

  // TTS
  voz?: 'male' | 'female' | string | null;
  audioTTS?: unknown;
  audioUI?: string | null;
  instructionTTS?: unknown;
  acceptedAnswers?: string[];
  aiToolTags?: string[];

}

// Alias legacy: mantener el nombre viejo para compatibilidad
// mientras se migran otros archivos.
export type SheetReactivoRow = ReactivoUI;