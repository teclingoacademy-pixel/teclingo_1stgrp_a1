/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * aiRoutes.ts
 * Teacher Virtual / AI Tutor con RAG sobre el contenido de Postgres.
 *
 * El contexto (teoria, guion, tips, vocabulario, tema de gramatica) se arma
 * desde la BD segun la leccion activa y se inyecta en el prompt. Ollama corre
 * como proveedor LLM local: en desarrollo apunta al servidor Debian por IP,
 * en produccion a localhost.
 *
 * Rutas:
 *   POST /api/ai/ask              -> respuesta del tutor con contexto de la leccion
 *   GET  /api/ai/teacher-context   -> contexto crudo (debug / inspeccion)
 *   GET  /api/ai/health           -> estado de Ollama y modelo cargado
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  callOllama,
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
  OLLAMA_TIMEOUT_MS,
  type OllamaMessage,
} from './ollamaClient';

const prisma = new PrismaClient();
const router = Router();

/**
 * El mapa de la clase declara slugs con guion bajo (present_simple) y el
 * catalogo los guarda con guion medio (present-simple). Debe coincidir con
 * normalizeSlug() en api/contentRoutes.ts y scripts/seed-missing-grammar.mjs.
 */
function normalizeSlug(slug: string): string {
  return String(slug).trim().toLowerCase().replace(/_/g, '-');
}

const MAX_MESSAGE_CHARS = 2_000;
const MAX_HISTORY = 12;
const MAX_THEORY_CHARS = 4_000;
const MAX_SCRIPT_CHARS = 2_500;

// ═════════════════════════════════════════════════════════════════
// Contexto pedagogico de una leccion
// ═════════════════════════════════════════════════════════════════
export type LessonContext = {
  lessonId: string | null;
  title: string;
  theory: string;
  teacherScript: string;
  grammarTips: string;
  vocabulary: string;
  grammarTopics: string;
  curriculum: string;
  found: boolean;
};

export async function buildLessonContext(lessonId?: string): Promise<LessonContext> {
  const empty: LessonContext = {
    lessonId: null, title: '', theory: '', teacherScript: '',
    grammarTips: '', vocabulary: '', grammarTopics: '', curriculum: '', found: false,
  };
  if (!lessonId) return empty;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      theorySections: { orderBy: { order: 'asc' } },
      teacherScript: true,
      grammarTips: true,
      quickVocab: { orderBy: { order: 'asc' } },
      knowledgeMap: true,
      curriculum: true,
    },
  });
  if (!lesson) return empty;

  const theory = lesson.theorySections
    .map((s) => `### ${s.title}\n${s.text}`)
    .join('\n\n')
    .slice(0, MAX_THEORY_CHARS);

  const grammarTips = lesson.grammarTips
    .map((t) => `- ${t.title}: ${t.rule}${t.commonMistake ? ` (error comun: ${t.commonMistake})` : ''}`)
    .join('\n');

  const vocabulary = lesson.quickVocab
    .map((v) => `- ${v.word} = ${v.translation}`)
    .join('\n');

  // El mapa declara los slugs con guion bajo y el catalogo los usa con guion
  // medio, asi que la resolucion va normalizada (igual que en contentRoutes y
  // en scripts/seed-missing-grammar.mjs).
  const slugs = lesson.knowledgeMap?.grammarTopics ?? [];
  const topics = slugs.length
    ? await prisma.grammarTopic.findMany({
        where: { id: { in: slugs.map(normalizeSlug) }, active: true },
      })
    : [];
  const matched = new Set(topics.map((t) => t.id));
  const grammarTopics = [
    ...topics.map((t) => `- ${t.title} (${t.titleEn}) [MCER ${t.mcer}]: ${t.summary}`),
    ...slugs.filter((s) => !matched.has(normalizeSlug(s))).map((s) => `- ${s.replace(/_/g, ' ')} (sin catalogar)`),
  ].join('\n');

  const curriculum = lesson.curriculum
    ? `Tema: ${lesson.curriculum.topic}. Enfoque gramatical: ${lesson.curriculum.grammarFocus}. Vocabulario clave: ${lesson.curriculum.vocabFocus.join(', ')}.`
    : '';

  return {
    lessonId: lesson.id,
    title: lesson.title,
    theory,
    teacherScript: (lesson.teacherScript?.content ?? '').slice(0, MAX_SCRIPT_CHARS),
    grammarTips,
    vocabulary,
    grammarTopics,
    curriculum,
    found: true,
  };
}

function buildSystemPrompt(ctx: LessonContext, level: string, mode: string): string {
  const isTeacher = mode === 'teacher';

  const persona = isTeacher
    ? `Eres el Teacher Virtual de TECLINGO, un profesor de ingles con experiencia en nivel ${level}.
Tu alumno te hace una pregunta sobre la clase. Explica con claridad, usa ejemplos propios
y cierra con una comprobacion breve de que lo entendio. Responde en español y da la forma
inglesa cuando sea relevante.`
    : `Eres el tutor de ingles de TECLINGO para nivel ${level}.
Ayudas al alumno a practicar. Responde en español, incluye la construccion inglesa
correcta y da un ejemplo corto. No te desvies del tema de la clase.`;

  const blocks: string[] = [persona, ''];

  if (ctx.found) {
    blocks.push(`# CONTEXTO DE LA CLASE ACTUAL (${ctx.lessonId}: ${ctx.title})`, '');
    if (ctx.curriculum) blocks.push(ctx.curriculum);
    if (ctx.theory) blocks.push('## Teoria', ctx.theory);
    if (ctx.grammarTopics) blocks.push('## Temas de gramatica', ctx.grammarTopics);
    if (ctx.grammarTips) blocks.push('## Tips rapidos', ctx.grammarTips);
    if (ctx.vocabulary) blocks.push('## Vocabulario de la clase', ctx.vocabulary);
    if (ctx.teacherScript) blocks.push('## Guion del profesor (referencia de tono)', ctx.teacherScript);
    blocks.push('', 'Usa este contexto como fuente de verdad. Si la duda queda fuera de el, dilo y responde con lo que sepas del nivel ' + level + '.');
  } else {
    blocks.push(`No hay contexto de clase cargado para "${ctx.lessonId ?? 'sin clase'}". Responde con conocimiento general de nivel ${level}.`);
  }

  return blocks.join('\n');
}

// ═════════════════════════════════════════════════════════════════
// Cliente Ollama
// ═════════════════════════════════════════════════════════════════
// callOllama y la configuracion viven en api/ollamaClient.ts, compartidos con
// toolRoutes.ts. Solo queda el normalizador de historial, que es especifico del
// Teacher Virtual porque trunca el contexto segun la leccion.

/** Normaliza el historial del cliente a mensajes con los roles de Ollama. */
function normalizeHistory(raw: unknown): OllamaMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-MAX_HISTORY)
    .map((h: any) => {
      const role = h?.role === 'assistant' ? 'assistant' : 'user';
      // El frontend historico manda { role, parts: [{ text }] }.
      const text = typeof h?.content === 'string'
        ? h.content
        : Array.isArray(h?.parts)
          ? h.parts.map((p: any) => p?.text ?? '').join(' ').trim()
          : '';
      return text ? { role, content: text } : null;
    })
    .filter((m): m is OllamaMessage => m !== null);
}

// ═════════════════════════════════════════════════════════════════
// POST /api/ai/ask
// ═════════════════════════════════════════════════════════════════
router.post('/ai/ask', async (req, res) => {
  const { message, lessonId, history, mode, level, contextType } = req.body || {};

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, error: 'message requerido' });
  }
  const question = message.trim().slice(0, MAX_MESSAGE_CHARS);

  const effectiveContextType: 'lesson' | 'general' =
    contextType === 'general' || contextType === 'lesson'
      ? contextType
      : (typeof lessonId === 'string' && lessonId.trim() ? 'lesson' : 'general');

  try {
    if (effectiveContextType === 'general') {
      const grammarCtx = await buildGrammarContext();
      const system = buildGrammarSystemPrompt(grammarCtx, String(level || 'A1'), String(mode || 'tutor'));
      const messages: OllamaMessage[] = [
        { role: 'system', content: system },
        ...normalizeHistory(history),
        { role: 'user', content: question },
      ];
      const answer = await callOllama(messages);
      return res.json({
        success: true,
        data: {
          content: answer,
          model: OLLAMA_MODEL,
          context: {
            contextType: 'general',
            topicsCount: grammarCtx.topics.length,
            found: grammarCtx.found,
          },
        },
      });
    }

    const ctx = await buildLessonContext(
      typeof lessonId === 'string' && lessonId.trim() ? lessonId.trim() : undefined,
    );
    const system = buildSystemPrompt(ctx, String(level || 'A1'), String(mode || 'tutor'));
    const messages: OllamaMessage[] = [
      { role: 'system', content: system },
      ...normalizeHistory(history),
      { role: 'user', content: question },
    ];
    const answer = await callOllama(messages);
    return res.json({
      success: true,
      data: {
        content: answer,
        model: OLLAMA_MODEL,
        context: {
          contextType: 'lesson',
          lessonId: ctx.lessonId,
          lessonTitle: ctx.title,
          found: ctx.found,
        },
      },
    });
  } catch (error) {
    const isOllamaDown =
      error instanceof Error &&
      (error.name === 'TimeoutError' || /fetch failed|ECONNREFUSED|ETIMEDOUT/i.test(error.message));

    if (isOllamaDown) {
      console.warn('[ai/ask] Ollama no disponible:', error);
      return res.status(503).json({
        success: false,
        error: 'El servicio de IA no esta disponible en este momento',
        detail: { baseUrl: OLLAMA_BASE_URL, model: OLLAMA_MODEL },
      });
    }

    console.error('[ai/ask] error:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});
// GET /api/ai/teacher-context?lessonId=N1-C01
// ═════════════════════════════════════════════════════════════════
router.get('/ai/teacher-context', async (req, res) => {
  try {
    const lessonId = String(req.query.lessonId || '').trim();
    if (!lessonId) {
      return res.status(400).json({ success: false, error: 'lessonId requerido' });
    }
    const ctx = await buildLessonContext(lessonId);
    if (!ctx.found) {
      return res.status(404).json({ success: false, error: `Leccion no encontrada: ${lessonId}` });
    }
    res.json({ success: true, data: ctx });
  } catch (error) {
    console.error('[ai/teacher-context] error:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ═════════════════════════════════════════════════════════════════
// GET /api/ai/health
// ═════════════════════════════════════════════════════════════════
router.get('/ai/health', async (_req, res) => {
  try {
    const res2 = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(5_000) });
    if (!res2.ok) {
      return res.status(503).json({
        success: false, ollama: { reachable: false, baseUrl: OLLAMA_BASE_URL, error: `HTTP ${res2.status}` },
      });
    }
    const data: any = await res2.json();
    const models: string[] = (data?.models ?? []).map((m: any) => m?.name).filter(Boolean);
    res.json({
      success: true,
      ollama: {
        reachable: true,
        baseUrl: OLLAMA_BASE_URL,
        configuredModel: OLLAMA_MODEL,
        modelLoaded: models.some((m) => m === OLLAMA_MODEL || m.startsWith(`${OLLAMA_MODEL}:`)),
        availableModels: models,
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      ollama: {
        reachable: false,
        baseUrl: OLLAMA_BASE_URL,
        configuredModel: OLLAMA_MODEL,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
    });
  }
});


// ═════════════════════════════════════════════════════════════════
// BIBLIOTECA MCER (contexto general — sin clase activa)
// ═════════════════════════════════════════════════════════════════

export type GrammarContext = {
  topics: Array<{
    id: string;
    title: string;
    titleEn: string;
    mcer: string;
    category: string;
    summary: string;
    structure: string;
  }>;
  found: boolean;
};

export async function buildGrammarContext(): Promise<GrammarContext> {
  try {
    const topics = await prisma.grammarTopic.findMany({
      where: { active: true },
      select: {
        id: true, title: true, titleEn: true, mcer: true,
        category: true, summary: true, structure: true,
      },
      orderBy: [{ mcer: 'asc' }, { order: 'asc' }],
    });
    return { topics, found: topics.length > 0 };
  } catch (e) {
    console.error('[buildGrammarContext] error:', e);
    return { topics: [], found: false };
  }
}

function buildGrammarSystemPrompt(grammarCtx: GrammarContext, level: string, mode: string): string {
  const isTeacher = mode === 'teacher';
  const persona = isTeacher
    ? 'Eres el Teacher Virtual de TECLINGO, un profesor de ingles experto. Respondes preguntas academicas sobre gramatica, vocabulario y estructuras. Responde en espanol, cita la forma inglesa entre comillas y da ejemplos practicos.'
    : 'Eres el tutor de ingles de TECLINGO para nivel ' + level + '. Respondes preguntas academicas generales sobre gramatica, vocabulario y estructuras. Responde en espanol, incluye la construccion inglesa correcta y da un ejemplo corto.';

  const blocks: string[] = [persona, ''];

  if (grammarCtx.found) {
    blocks.push('# BIBLIOTECA MCER DISPONIBLE (usa estos temas como referencia)', '');
    grammarCtx.topics.forEach((t) => {
      blocks.push('## [' + t.mcer + '] ' + t.title + ' (' + t.titleEn + ')');
      if (t.summary) blocks.push(t.summary);
      if (t.structure) blocks.push('Estructura: ' + t.structure);
      blocks.push('');
    });
    blocks.push('Si la pregunta NO coincide con ningun tema de la lista, responde con tu conocimiento general del nivel ' + level + '.');
  } else {
    blocks.push('No hay temas de la Biblioteca MCER cargados. Responde con tu conocimiento general de nivel ' + level + '.');
  }

  return blocks.join('\n');
}

// ═════════════════════════════════════════════════════════════════
// GET /api/ai/grammar-topics
// ═════════════════════════════════════════════════════════════════
router.get('/ai/grammar-topics', async (_req, res) => {
  try {
    const topics = await prisma.grammarTopic.findMany({
      where: { active: true },
      select: {
        id: true, title: true, titleEn: true, mcer: true,
        category: true, summary: true, structure: true, order: true,
      },
      orderBy: [{ mcer: 'asc' }, { order: 'asc' }],
    });
    res.json({ success: true, data: topics, total: topics.length });
  } catch (error) {
    console.error('[ai/grammar-topics] error:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ═════════════════════════════════════════════════════════════════
// GET /api/ai/grammar-topics/:id
// ═════════════════════════════════════════════════════════════════
router.get('/ai/grammar-topics/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ success: false, error: 'id requerido' });
    const topic = await prisma.grammarTopic.findUnique({
      where: { id },
      include: { examples: { orderBy: { order: 'asc' } } },
    });
    if (!topic) return res.status(404).json({ success: false, error: 'Tema no encontrado: ' + id });
    res.json({ success: true, data: topic });
  } catch (error) {
    console.error('[ai/grammar-topics/:id] error:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});


export default router;
