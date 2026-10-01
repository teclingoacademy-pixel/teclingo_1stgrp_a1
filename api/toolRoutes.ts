/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * toolRoutes.ts
 * Herramientas de IA del alumno que hasta ahora solo existian como function
 * serverless en Vercel (api/index.ts), respaldadas por Groq.
 *
 * El frontend las resuelve con apiUrl(), que apunta a VITE_API_URL. Al apuntar
 * al backend de Express estas tres rutas no existian y devolvian 404, dejando
 * sin funcionar AI Tutor y Grammar Fixer. Ahora se sirven con Ollama.
 *
 * /api/tts no se replica aqui: ya existe en server.ts con edge-tts-universal.
 * Ollama no sintetiza voz, asi que esa ruta sigue usando un motor de TTS.
 *
 * Rutas:
 *   POST /api/tutor             -> tutor conversacional
 *   POST /api/grammar/analyze   -> { score, cefr, suggestion }
 *   POST /api/grammar/verify    -> { score, details }
 */

import { Router, Request, Response } from 'express';
import { callOllama, parseModelJson, type OllamaMessage } from './ollamaClient';

const router = Router();
const MAX_HISTORY = 12;

/** Normaliza el historial { role, parts: [{ text }] } que envia el frontend. */
function normalizeHistory(raw: unknown): OllamaMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-MAX_HISTORY)
    .map((h: any) => {
      const role = h?.role === 'assistant' ? 'assistant' : 'user';
      const text = Array.isArray(h?.parts)
        ? h.parts.map((p: any) => p?.text || '').join(' ').trim()
        : typeof h?.content === 'string' ? h.content : '';
      return text ? { role, content: text } : null;
    })
    .filter((m): m is OllamaMessage => m !== null);
}

/** Acota la extension de la respuesta segun el modo y la velocidad elegidas. */
function wordBudget(conversationMode?: string, currentSpeed?: unknown) {
  const mode = conversationMode || 'basic';
  if (mode === 'native') return { minWords: 15, maxWords: 25 };
  if (mode === 'casual') return { minWords: 7, maxWords: 10 };
  const speed = parseFloat(String(currentSpeed ?? '')) || 1.0;
  if (speed <= 0.60) return { minWords: 1, maxWords: 3 };
  if (speed <= 0.75) return { minWords: 3, maxWords: 5 };
  if (speed <= 0.88) return { minWords: 5, maxWords: 10 };
  return { minWords: 10, maxWords: 15 };
}

/** Sanea un score del modelo: un 3B puede devolver 87, "90" o 120. */
function clampScore(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

router.post('/tutor', async (req, res) => {
  const { message, history, systemPrompt, currentSpeed, conversationMode } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const { minWords, maxWords } = wordBudget(conversationMode, currentSpeed);
  const budget = `CRITICAL: Your response MUST be between ${minWords} and ${maxWords} words. Count your words. DO NOT exceed ${maxWords} words. DO NOT write fewer than ${minWords} words. This is mandatory.`;

  // Antes el prompt de conteo de palabras pisaba por completo al systemPrompt
  // del cliente (`finalSystemPrompt || systemPrompt`), asi que la instruccion
  // pedagogica de la herramienta nunca llegaba al modelo. Se concatenan.
  const system = [systemPrompt, budget].filter(Boolean).join('\n\n')
    || 'You are TECLINGO, an English tutor.';

  const messages: OllamaMessage[] = [{ role: 'system', content: system }];
  messages.push(...normalizeHistory(history));
  messages.push({ role: 'user', content: message.trim() });

  try {
    const content = await callOllama(messages);
    return res.status(200).json({ content, sources: [] });
  } catch (error: any) {
    console.error('[tutor] Error Ollama:', error?.message || error);
    // Se devuelve 200 para no romper la UI, pero con detalle del fallo real:
    // durante la evaluacion del modelo conviene distinguir "Ollama respondio"
    // de "se sirvio un texto de relleno".
    return res.status(200).json({
      content: 'No pude conectarme con el modelo de IA. Intenta de nuevo.',
      sources: [],
      fallback: true,
      detail: error?.message || String(error),
    });
  }
});

router.post('/grammar/analyze', async (req, res) => {
  const { text, expertMode } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const prompt = expertMode
    ? `Analyze this English text for advanced style. Provide: 1. Quality score (0-100). 2. CEFR level (A1-C2). 3. Advanced style suggestion. Text: "${text}"`
    : `Analyze this English text. Provide: 1. Quality score (0-100). 2. CEFR level (A1-C2). 3. Brief style suggestion. Text: "${text}"`;

  try {
    const raw = await callOllama([
      {
        role: 'system',
        content: 'You are an English grammar analyzer. Always respond with valid JSON: { "score": number (0-100), "cefr": string (A1/A2/B1/B2/C1/C2), "suggestion": string }. Output ONLY the JSON.',
      },
      { role: 'user', content: prompt },
    ], { json: true, temperature: 0.2 });

    const parsed = parseModelJson<{ score?: unknown; cefr?: string; suggestion?: string }>(raw);
    const VALID_CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const cefr = VALID_CEFR.includes(String(parsed.cefr || '').toUpperCase())
      ? String(parsed.cefr).toUpperCase()
      : 'B1';

    return res.status(200).json({
      score: clampScore(parsed.score, 75, 0, 100),
      cefr,
      suggestion: String(parsed.suggestion || 'Buen trabajo.').slice(0, 400),
    });
  } catch (error: any) {
    console.error('[grammar/analyze] Error Ollama:', error?.message || error);
    // Antes el catch fabricaba un score por longitud de texto y lo devolvia
    // como si fuera del modelo, lo que hacia imposible distinguir una
    // evaluacion real de un relleno. Se mantiene la forma que espera la UI
    // pero se marca como fallback y se expone el error.
    return res.status(200).json({
      score: 0,
      cefr: 'B1',
      suggestion: 'No se pudo analizar con el modelo de IA.',
      fallback: true,
      detail: error?.message || String(error),
    });
  }
});

// ═════════════════════════════════════════════════════════════════
// Verificacion de traduccion: determinista, sin LLM
// ═════════════════════════════════════════════════════════════════
// Medido contra llama3.2:3b, el LLM diagnosticaba mal un error obvio de
// tercera persona ("present tense" vs "present simple", que son lo mismo),
// truncaba la explicacion a media frase y daba scores inestables ante el mismo
// input (85, 0, 80). Un alumno se creeria ese numero, asi que la calificacion
// numerica paso a codigo: same token, same result, siempre.
//
// El LLM queda fuera del score a proposito. Las explicaciones se generan
// tambien de forma determinista a partir del diff real, asi que no pueden
// contradecir la calificacion que acompanian.

/** Contracciones: "I'm" y "I am" son la misma respuesta y no deben penalizarse. */
const CONTRACTIONS: Array<[RegExp, string]> = [
  [/\b(\w+)n't\b/g, '$1 not'],
  [/\bi'm\b/g, 'i am'],
  [/\byou're\b/g, 'you are'],
  [/\bhe's\b/g, 'he is'],
  [/\bshe's\b/g, 'she is'],
  [/\bit's\b/g, 'it is'],
  [/\bwe're\b/g, 'we are'],
  [/\bthey're\b/g, 'they are'],
  [/\bi've\b/g, 'i have'],
  [/\bi'll\b/g, 'i will'],
  [/\bcan't\b/g, 'can not'],
  [/\bwon't\b/g, 'will not'],
];

/**
 * Normaliza para comparar: minusculas, sin acentos, sin puntuacion y con las
 * contracciones expandidas.
 *
 * El orden importa: las contracciones se expanden ANTES de quitar el apostrofo,
 * porque "I'm" sin apostrofo es "im" y ya no casa con /i'm/. Los acentos se
 * quitan porque la referencia puede venir de una fuente con distinta
 * codificacion que lo que el alumno escribe a mano.
 */
function normalizeForCompare(str: string): string {
  let out = String(str ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')       // acentos
    .replace(/[’]/g, "'");                 // apostrofo tipografico -> recto
  for (const [re, rep] of CONTRACTIONS) out = out.replace(re, rep);
  return out
    .replace(/'/g, '')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"¿¡]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toTokens(normalized: string): string[] {
  return normalized ? normalized.split(' ').filter(Boolean) : [];
}

export interface VerificacionTraduccion {
  score: number;
  details: string;
  isCorrect: boolean;
  faltantes: string[];
  sobrantes: string[];
  ordenIncorrecto: boolean;
}

/**
 * Califica por solapamiento de tokens contra la referencia (F1 de precision y
 * cobertura) y descuenta si las mismas palabras vienen en otro orden.
 *
 * No es 0/100 binario a proposito: al alumno que escribio "The child play
 * football" le falta una -s, no se equivocó en todo. Un 0 lo desmoraliza y
 * ademas arrastra el promedio de dominio que se ve en el panel.
 */
export function verifyTranslation(
  studentEnglish: string,
  targetEnglish: string,
  spanish?: string
): VerificacionTraduccion {
  const normStudent = normalizeForCompare(studentEnglish);
  const normReference = normalizeForCompare(targetEnglish);
  const studentTokens = toTokens(normStudent);
  const referenceTokens = toTokens(normReference);

  if (!studentTokens.length) {
    return {
      score: 0, isCorrect: false, faltantes: referenceTokens, sobrantes: [],
      ordenIncorrecto: false, details: 'No escribiste ninguna traducción.',
    };
  }

  const faltantes = referenceTokens.filter(t => !studentTokens.includes(t));
  const sobrantes = studentTokens.filter(t => !referenceTokens.includes(t));

  if (faltantes.length === 0 && sobrantes.length === 0) {
    const ordenIncorrecto = studentTokens.join(' ') !== referenceTokens.join(' ');
    const base = `Esperaba: "${targetEnglish}".`;
    if (ordenIncorrecto) {
      return {
        // Mismas palabras, orden equivocado: es un error real de ingles.
        score: 85, isCorrect: false, faltantes: [], sobrantes: [], ordenIncorrecto: true,
        details: `Usaste todas las palabras correctas pero en otro orden. ${base}`,
      };
    }
    return {
      score: 100, isCorrect: true, faltantes: [], sobrantes: [], ordenIncorrecto: false,
      details: `¡Excelente! Tu traducción coincide con la referencia. ${base}`,
    };
  }

  // F1: precision contra la referencia y cobertura de la referencia.
  const covered = referenceTokens.length - faltantes.length;
  const precision = covered / studentTokens.length;
  const recall = covered / referenceTokens.length;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  const partes: string[] = [];
  if (faltantes.length) partes.push(`Falta${faltantes.length > 1 ? 'n' : ''}: ${faltantes.map(w => `"${w}"`).join(', ')}.`);
  if (sobrantes.length) partes.push(`Sobra${sobrantes.length > 1 ? 'n' : ''}: ${sobrantes.map(w => `"${w}"`).join(', ')}.`);
  partes.push(`Esperaba: "${targetEnglish}".`);
  if (spanish) partes.unshift(`Traduciendo "${spanish}":`);

  return {
    score: clampScore(Math.round(f1 * 100), 0, 0, 100),
    isCorrect: false,
    faltantes,
    sobrantes,
    ordenIncorrecto: false,
    details: partes.join(' '),
  };
}

router.post('/grammar/verify', (req, res) => {
  const { spanish, studentEnglish, targetEnglish } = req.body || {};

  if (!studentEnglish || typeof studentEnglish !== 'string' || !studentEnglish.trim()) {
    return res.status(400).json({ error: 'studentEnglish is required' });
  }
  if (!targetEnglish || typeof targetEnglish !== 'string' || !targetEnglish.trim()) {
    // Sin referencia no hay nada contra que comparar: se responde con la forma
    // que espera la UI para no romperla.
    return res.status(200).json({
      score: 0,
      details: 'Este ejercicio no tiene una traducción de referencia para comparar.',
    });
  }

  const result = verifyTranslation(studentEnglish, targetEnglish, spanish);
  return res.status(200).json({ score: result.score, details: result.details });
});


// ===================================================================
// POST /api/ai/translate-to-english
// Traduce una frase corta (max 5 palabras) de espanol a ingles usando Ollama.
// Usado por The Bridge para practicar frases personalizadas.
// ===================================================================
router.post('/ai/translate-to-english', async (req: Request, res: Response) => {
  try {
    const { text } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ ok: false, error: 'Texto requerido' });
    }

    const cleanText = text.trim();
    const wordCount = cleanText.split(/\s+/).length;

    if (wordCount > 5) {
      return res.status(400).json({
        ok: false,
        error: 'Maximo 5 palabras. Escribiste ' + wordCount + '.',
      });
    }

    const messages: OllamaMessage[] = [
      {
        role: 'system',
        content:
          'You are a Spanish-to-English translator for A1 students. ' +
          'Translate the user Spanish phrase to simple natural English. ' +
          'Return ONLY the English translation. No quotes. No explanations. No prefixes.',
      },
      { role: 'user', content: cleanText },
    ];

    const raw = await callOllama(messages, { temperature: 0.3, maxTokens: 60 });

    let english = String(raw || '').trim();
    english = english
      .replace(/^["'`]+|["'`]+$/g, '')
      .replace(/^(english|translation|traduccion)\s*:\s*/i, '')
      .trim();

    if (!english) {
      return res.status(500).json({ ok: false, error: 'Traduccion vacia' });
    }

    return res.json({
      ok: true,
      original: cleanText,
      english,
      wordCount,
    });
  } catch (error: any) {
    console.error('[ai/translate-to-english] error:', error);
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Error al traducir',
    });
  }
});

export default router;
