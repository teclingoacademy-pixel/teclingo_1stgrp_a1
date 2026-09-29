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

import { Router } from 'express';
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

router.post('/grammar/verify', async (req, res) => {
  const { spanish, studentEnglish, targetEnglish } = req.body || {};
  if (!studentEnglish || typeof studentEnglish !== 'string') {
    return res.status(400).json({ error: 'studentEnglish is required' });
  }

  const prompt = `Evaluate the translation. Spanish: "${spanish ?? ''}". Student: "${studentEnglish}". Reference: "${targetEnglish ?? ''}"`;

  try {
    const raw = await callOllama([
      {
        role: 'system',
        content: 'You are an evaluator. Respond with JSON: { "score": number (0-100), "details": string }. Only JSON.',
      },
      { role: 'user', content: prompt },
    ], { json: true, temperature: 0.2 });

    const parsed = parseModelJson<{ score?: unknown; details?: string }>(raw);
    return res.status(200).json({
      score: clampScore(parsed.score, 70, 0, 100),
      details: String(parsed.details || 'Revisa la concordancia verbal.').slice(0, 400),
    });
  } catch (error: any) {
    console.error('[grammar/verify] Error Ollama:', error?.message || error);
    return res.status(200).json({
      score: 0,
      details: 'No se pudo evaluar con el modelo de IA.',
      fallback: true,
      detail: error?.message || String(error),
    });
  }
});

export default router;
