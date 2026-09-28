/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * contractValidator.ts
 * Valida un ejercicio contra el contrato de su leccion.
 */

import { getContract, VOCAB_CATALOG } from '../../data/lessonContract';

export interface ExerciseLike {
  questionText: string;
  correctAnswer: string;
  at?: string | null;
  options?: string[];
}

export function validateExercise(
  lessonId: string,
  ex: ExerciseLike,
): { ok: boolean; errors: string[] } {
  const contract = getContract(lessonId);
  const errors: string[] = [];

  if (!contract) {
    errors.push('No hay contrato para ' + lessonId);
    return { ok: false, errors };
  }

  const allowed = new Set<string>([
    ...(VOCAB_CATALOG[contract.bloqueVocab] || []),
    ...contract.vocabExtra,
  ]);

  const textToCheck = [ex.correctAnswer, ex.at || ''].join(' ').toLowerCase();
  const words = textToCheck.split(/[^a-z0-9']+/).filter((w) => w.length > 1);

  for (const w of words) {
    if (!allowed.has(w) && !/^\d+$/.test(w)) {
      errors.push('Palabra fuera de catalogo: "' + w + '"');
    }
  }

  const anchorWords = contract.fraseAncla
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter((w) => w.length > 3);
  const matchesAnchor = anchorWords.some((w) => textToCheck.includes(w));
  if (!matchesAnchor && ex.at) {
    errors.push('No hay conexion con la frase ancla del TextBase');
  }

  return { ok: errors.length === 0, errors };
}