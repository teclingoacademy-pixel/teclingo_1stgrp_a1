/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * prismaMapper.ts
 * Convierte Exercise (Prisma) → SheetReactivoRow (shape del frontend).
 */

import type { SheetReactivoRow } from '@/types/workbook/reactivo';

interface PrismaExercise {
  id: string;
  lessonId: string;
  skill: string;
  itemNumber: number;
  questionType: string;
  instruction: string | null;
  questionText: string;
  optionsJson: unknown;
  correctAnswer: string;
  explanation: string | null;
  vocabularyHint: string | null;
  audioUrl: string | null;
  points: number;
  timeLimitSec: number;
  difficulty: number;
  active: boolean | null;
  translationSentence?: string | null;
  uiDisplay?: string | null;
  instructionTTS?: unknown;
  audioUI?: string | null;
  audioTTS?: unknown;
  acceptedAnswers?: string[];
  aiToolTags?: string[];
  voz?: string | null;
}

/**
 * Convierte un Exercise de Prisma al shape que ClassDetailScreen / ReactivoCard esperan.
 */
export function mapPrismaExerciseToSheetRow(ex: PrismaExercise): SheetReactivoRow {
  let opciones: string[] = [];
  try {
    if (Array.isArray(ex.optionsJson)) {
      opciones = ex.optionsJson as string[];
    } else if (typeof ex.optionsJson === 'string') {
      opciones = JSON.parse(ex.optionsJson);
    } else if (ex.optionsJson && typeof ex.optionsJson === 'object') {
      // Formato {options: [...]} por si viene anidado
      const obj = ex.optionsJson as { options?: string[]; opciones?: string[] };
      opciones = obj.options || obj.opciones || [];
    }
  } catch {
    opciones = [];
  }

  const habilidadLower = (ex.skill || 'grammar').toLowerCase();

  const mapped: Record<string, unknown> = {
    // Identificación
    reactivo_id: ex.id,
    clase_id: ex.lessonId,
    habilidad: habilidadLower,
    numero: ex.itemNumber,
    numero_reactivo: ex.itemNumber,

    // Contenido
    tipo_pregunta: ex.questionType,
    instruccion: ex.instruction || '',
    pregunta_texto: ex.questionText,
    opciones: opciones,
    opciones_json: opciones,
    respuesta_correcta: ex.correctAnswer,
    respuesta_explicacion: ex.explanation || '',
    audio_url: ex.audioUrl || '',

    // Meta
    puntos: ex.points,
    tiempo_limite_seg: ex.timeLimitSec,
    dificultad: ex.difficulty,
    activo: ex.active !== false,

    // Bilingüe / pedagógico
    contexto_espanol: null,
    frase_traduccion: (ex as any).translationSentence || null,
    opciones_traduccion: null,
    opciones_traduccion_json: null,
    pista_vocabulario: ex.vocabularyHint || null,
    mostrar_traduccion: 'parcial',
    palabras_clave_traduccion: null,

    // Campos extendidos (los que ReactivoCard puede necesitar en el futuro)
    uiDisplay: ex.uiDisplay || null,
    instructionTTS: ex.instructionTTS || null,
    audioUI: ex.audioUI || null,
    audioTTS: ex.audioTTS || null,
    acceptedAnswers: ex.acceptedAnswers || [],
    aiToolTags: ex.aiToolTags || [],
    voz: ex.voz || 'female',
  };

  return mapped as unknown as SheetReactivoRow;
}