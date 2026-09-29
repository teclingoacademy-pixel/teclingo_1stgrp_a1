/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * contentRoutes.ts
 * Endpoints de lectura del contenido pedagogico persistido en Postgres.
 *
 * Rutas:
 *   GET /api/content/bootstrap                 -> payload inicial del curso
 *   GET /api/content/lessons/:id/full          -> leccion completa (teoria, guiones, tips, vocab)
 *   GET /api/content/grammar/topics            -> biblioteca de gramatica
 *   GET /api/content/grammar/topics/:id        -> tema + ejemplos
 *   GET /api/content/grammar/for-lesson/:id    -> temas mapeados a una clase
 *   GET /api/content/tutorials                 -> tutoriales por habilidad
 *   GET /api/content/tutorials/:skill
 *   GET /api/content/malla/:levelCode          -> semanas de la malla
 *   GET /api/content/phases                    -> fases del curso
 *   GET /api/content/program                   -> semestres + habilidades
 *   GET /api/content/production                -> textos modelo + bloques
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

const LEVEL_CODE = 'S01';
const MAX_LIMIT = 200;

/** Evita que un ?limit=Infinity reviente el mapper de Prisma. */
function parseLimit(raw: unknown, fallback = 50): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.trunc(n), MAX_LIMIT);
}

function fail(res: any, logTag: string, error: unknown) {
  console.error(`[${logTag}] error:`, error);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
}

/**
 * ClassKnowledgeMap guarda los slugs con guion bajo (present_simple) mientras que
 * GrammarTopic los cataloga con guion medio (present-simple). Sin normalizar,
 * la consulta por id nunca cruzaria ambos formatos.
 *
 * Debe coincidir con normalizeSlug() de scripts/seed-missing-grammar.mjs.
 */
function normalizeSlug(slug: string): string {
  return String(slug).trim().toLowerCase().replace(/_/g, '-');
}

// ═════════════════════════════════════════════════════════════════
// GET /api/content/lessons/:id/full
// Payload unico con todo el contenido de la clase. Evita que el
// frontend dispare N requests por clase.
// ═════════════════════════════════════════════════════════════════
router.get('/content/lessons/:id/full', async (req, res) => {
  const { id } = req.params;
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        exercises: { where: { active: true }, orderBy: [{ skill: 'asc' }, { itemNumber: 'asc' }] },
        vocabulary: { orderBy: { term: 'asc' } },
        texts: { where: { active: true }, orderBy: { createdAt: 'desc' } },
        teacherScript: true,
        theorySections: { orderBy: { order: 'asc' } },
        knowledgeMap: true,
        contract: true,
        curriculum: true,
        grammarTips: true,
        quickVocab: { orderBy: { order: 'asc' } },
        week: { include: { level: true } },
      },
    });

    if (!lesson) {
      return res.status(404).json({ success: false, error: `Leccion no encontrada: ${id}` });
    }

    // ClassKnowledgeMap guarda slugs con guion bajo; GrammarTopic los cataloga
    // con guion medio. Se consulta normalizado y se conserva la lista cruda
    // para que el frontend pueda referenciar el tema como lo declara la clase.
    const mapTopics = lesson.knowledgeMap?.grammarTopics ?? [];
    const normalizedTopics = [...new Set(mapTopics.map(normalizeSlug))];
    const resolvedTopics = normalizedTopics.length
      ? await prisma.grammarTopic.findMany({
          where: { id: { in: normalizedTopics }, active: true },
          orderBy: { order: 'asc' },
          include: { examples: { orderBy: { order: 'asc' } } },
        })
      : [];

    res.json({
      success: true,
      data: {
        lesson: {
          id: lesson.id,
          level: lesson.level,
          order: lesson.order,
          title: lesson.title,
          description: lesson.description,
          semana: lesson.semana,
          sesion: lesson.sesion,
          temaPrincipal: lesson.temaPrincipal,
          videoUrl: lesson.videoUrl,
          tituloVideo: lesson.tituloVideo,
          tipoContenido: lesson.tipoContenido,
          duracionMin: lesson.duracionMin,
          isPublished: lesson.isPublished,
          week: lesson.week
            ? {
                weekNumber: lesson.week.weekNumber,
                phase: lesson.week.phase,
                ejeTematico: lesson.week.ejeTematico,
                unidadLibro: lesson.week.unidadLibro,
                paginas: lesson.week.paginas,
                kpi: lesson.week.kpi,
                horas: lesson.week.horasJson,
                levelName: lesson.week.level.levelName,
                cefrTag: lesson.week.level.cefrTag,
              }
            : null,
        },
        curriculum: lesson.curriculum,
        theory: lesson.theorySections.map((s) => ({
          order: s.order,
          title: s.title,
          text: s.text,
        })),
        teacherScript: lesson.teacherScript
          ? { title: lesson.teacherScript.title, content: lesson.teacherScript.content }
          : null,
        grammarTips: lesson.grammarTips,
        quickVocab: lesson.quickVocab,
        contract: lesson.contract,
        knowledgeMap: {
          raw: mapTopics,
          resolved: resolvedTopics,
          vocabTopics: lesson.knowledgeMap?.vocabTopics ?? [],
        },
        texts: lesson.texts.map((t) => ({
          id: t.id,
          title: t.title,
          content: t.content,
          perfil: t.perfil,
          fase: t.fase,
          parrafos: t.parrafos,
          wordCount: t.wordCount,
          difficulty: t.difficulty,
          timeAudioSec: t.timeAudioSec,
        })),
        vocabulary: lesson.vocabulary.map((v) => ({
          id: v.id,
          term: v.term,
          translation: v.translation,
          type: v.type,
          pronunciationAf: v.pronunciationAf,
          exampleUse: v.exampleUse,
          tags: v.tags,
        })),
        exercises: lesson.exercises,
        counts: {
          theory: lesson.theorySections.length,
          exercises: lesson.exercises.length,
          vocabulary: lesson.vocabulary.length,
          grammarTips: lesson.grammarTips.length,
          quickVocab: lesson.quickVocab.length,
        },
      },
    });
  } catch (error) {
    fail(res, 'content/lessons/:id/full', error);
  }
});

// ═════════════════════════════════════════════════════════════════
// GET /api/content/grammar/topics
// ═════════════════════════════════════════════════════════════════
router.get('/content/grammar/topics', async (req, res) => {
  try {
    const { mcer, category, q } = req.query;
    const topics = await prisma.grammarTopic.findMany({
      where: {
        active: true,
        ...(mcer ? { mcer: String(mcer).toUpperCase() } : {}),
        ...(category ? { category: String(category) } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: String(q), mode: 'insensitive' as const } },
                { titleEn: { contains: String(q), mode: 'insensitive' as const } },
                { summary: { contains: String(q), mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: [{ order: 'asc' }, { title: 'asc' }],
      take: parseLimit(req.query.limit),
    });

    res.json({
      success: true,
      data: topics.map((t) => ({
        id: t.id,
        title: t.title,
        titleEn: t.titleEn,
        mcer: t.mcer,
        category: t.category,
        summary: t.summary,
        keywords: t.keywords,
        order: t.order,
      })),
    });
  } catch (error) {
    fail(res, 'content/grammar/topics', error);
  }
});

// ═════════════════════════════════════════════════════════════════
// GET /api/content/grammar/topics/:id
// ═════════════════════════════════════════════════════════════════
router.get('/content/grammar/topics/:id', async (req, res) => {
  try {
    const topic = await prisma.grammarTopic.findUnique({
      where: { id: req.params.id },
      include: { examples: { orderBy: { order: 'asc' } } },
    });
    if (!topic) {
      return res.status(404).json({ success: false, error: 'Tema de gramatica no encontrado' });
    }
    res.json({ success: true, data: topic });
  } catch (error) {
    fail(res, 'content/grammar/topics/:id', error);
  }
});

// ═════════════════════════════════════════════════════════════════
// GET /api/content/grammar/for-lesson/:id
// ═════════════════════════════════════════════════════════════════
// Resuelve los temas que la clase declara. Devuelve tambien los slugs
// sin match para que el frontend sepa que falta catalogarlos.
// ═════════════════════════════════════════════════════════════════
router.get('/content/grammar/for-lesson/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const map = await prisma.classKnowledgeMap.findUnique({ where: { lessonId: id } });

    if (!map) {
      return res.status(404).json({ success: false, error: `Clase sin mapa de conocimiento: ${id}` });
    }

    // La consulta va normalizada (el mapa usa "_" y el catalogo "-"). unresolved
    // devuelve los slugs tal como los declara la clase, que es la forma en que
    // el frontend los referencia y puede enviarlos a /api/ai/ask.
    const declared = map.grammarTopics ?? [];
    const topics = declared.length
      ? await prisma.grammarTopic.findMany({
          where: { id: { in: declared.map(normalizeSlug) }, active: true },
          orderBy: { order: 'asc' },
          include: { examples: { orderBy: { order: 'asc' } } },
        })
      : [];

    const matched = new Set(topics.map((t) => t.id));
    res.json({
      success: true,
      data: {
        lessonId: id,
        topics,
        vocabTopics: map.vocabTopics,
        unresolved: declared.filter((slug) => !matched.has(normalizeSlug(slug))),
      },
    });
  } catch (error) {
    fail(res, 'content/grammar/for-lesson/:id', error);
  }
});

// ═════════════════════════════════════════════════════════════════
// GET /api/content/tutorials  |  /api/content/tutorials/:skill
// ═════════════════════════════════════════════════════════════════
router.get('/content/tutorials', async (req, res) => {
  try {
    const tutorials = await prisma.skillTutorial.findMany({ orderBy: { skill: 'asc' } });
    res.json({ success: true, data: tutorials });
  } catch (error) {
    fail(res, 'content/tutorials', error);
  }
});

router.get('/content/tutorials/:skill', async (req, res) => {
  try {
    const skill = String(req.params.skill).toUpperCase();
    const tutorial = await prisma.skillTutorial.findUnique({ where: { skill: skill as any } });
    if (!tutorial) {
      return res.status(404).json({ success: false, error: `Tutorial no disponible para ${skill}` });
    }
    res.json({ success: true, data: tutorial });
  } catch (error) {
    fail(res, 'content/tutorials/:skill', error);
  }
});

// ═════════════════════════════════════════════════════════════════
// GET /api/content/malla/:levelCode
// ═════════════════════════════════════════════════════════════════
router.get('/content/malla/:levelCode', async (req, res) => {
  try {
    const weeks = await prisma.mallaWeek.findMany({
      where: { levelCode: String(req.params.levelCode).toUpperCase() },
      orderBy: { weekNumber: 'asc' },
      include: {
        lessons: {
          select: { id: true, order: true, title: true, temaPrincipal: true, duracionMin: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    res.json({
      success: true,
      data: weeks.map((w) => ({
        id: w.id,
        levelCode: w.levelCode,
        weekNumber: w.weekNumber,
        phase: w.phase,
        title: w.title,
        shortTitle: w.shortTitle,
        mcer: w.mcer,
        grammarFocus: w.grammarFocus,
        isExamWeek: w.isExamWeek,
        isClosingWeek: w.isClosingWeek,
        lessonIds: w.lessonIds,
        lessons: w.lessons,
      })),
    });
  } catch (error) {
    fail(res, 'content/malla/:levelCode', error);
  }
});

// ═════════════════════════════════════════════════════════════════
// GET /api/content/phases
// ═════════════════════════════════════════════════════════════════
router.get('/content/phases', async (_req, res) => {
  try {
    const phases = await prisma.coursePhase.findMany({ orderBy: { order: 'asc' } });
    res.json({ success: true, data: phases });
  } catch (error) {
    fail(res, 'content/phases', error);
  }
});

// ═════════════════════════════════════════════════════════════════
// GET /api/content/program
// Semestres con sus habilidades, en el orden del plan de estudios.
// ═════════════════════════════════════════════════════════════════
router.get('/content/program', async (_req, res) => {
  try {
    const semesters = await prisma.programSemester.findMany({
      orderBy: { order: 'asc' },
      include: { skills: { orderBy: { order: 'asc' } } },
    });

    const phases = await prisma.coursePhase.findMany({ orderBy: { order: 'asc' } });

    res.json({
      success: true,
      data: {
        semesters: semesters.map((s) => ({
          code: s.code,
          name: s.name,
          order: s.order,
          cefrTag: s.cefrTag,
          skills: s.skills.map((k) => ({
            skill: k.skill,
            order: k.order,
            name: k.name,
            englishName: k.englishName,
            iconKey: k.iconKey,
            kpi: k.kpi,
            accreditation: k.accreditation,
            description: k.description,
          })),
        })),
        phases,
      },
    });
  } catch (error) {
    fail(res, 'content/program', error);
  }
});

// ═════════════════════════════════════════════════════════════════
// GET /api/content/production
// Material de produccion A1+: textos modelo, bloques de gramatica,
// matriz de estructuras y bloques de vocabulario.
// ═════════════════════════════════════════════════════════════════
router.get('/content/production', async (_req, res) => {
  try {
    const [modelTexts, grammarBlocks, structures, vocabBlocks] = await Promise.all([
      prisma.productionModelText.findMany({ orderBy: { order: 'asc' } }),
      prisma.grammarBlock.findMany({ orderBy: { number: 'asc' } }),
      prisma.grammarStructure.findMany({ orderBy: { structure: 'asc' } }),
      prisma.vocabBlock.findMany({ orderBy: [{ source: 'asc' }, { label: 'asc' }] }),
    ]);

    res.json({
      success: true,
      data: { modelTexts, grammarBlocks, structures, vocabBlocks },
    });
  } catch (error) {
    fail(res, 'content/production', error);
  }
});

// ═════════════════════════════════════════════════════════════════
// GET /api/content/bootstrap
// Una sola llamada para pintar la app: fases, programa, malla,
// gramatica y tutoriales. Las lecciones ya van en /api/lessons.
// ═════════════════════════════════════════════════════════════════
router.get('/content/bootstrap', async (_req, res) => {
  try {
    const [phases, semesters, weeks, topics, tutorials, modelTexts, grammarBlocks] =
      await Promise.all([
        prisma.coursePhase.findMany({ orderBy: { order: 'asc' } }),
        prisma.programSemester.findMany({
          orderBy: { order: 'asc' },
          include: { skills: { orderBy: { order: 'asc' } } },
        }),
        prisma.mallaWeek.findMany({
          where: { levelCode: LEVEL_CODE },
          orderBy: { weekNumber: 'asc' },
        }),
        prisma.grammarTopic.findMany({
          where: { active: true },
          orderBy: [{ order: 'asc' }, { title: 'asc' }],
          select: {
            id: true, title: true, titleEn: true, mcer: true,
            category: true, summary: true, order: true,
          },
        }),
        prisma.skillTutorial.findMany({ orderBy: { skill: 'asc' } }),
        prisma.productionModelText.findMany({ orderBy: { order: 'asc' } }),
        prisma.grammarBlock.findMany({ orderBy: { number: 'asc' } }),
      ]);

    res.json({
      success: true,
      data: {
        levelCode: LEVEL_CODE,
        phases,
        semesters,
        weeks,
        grammarTopics: topics,
        tutorials,
        modelTexts,
        grammarBlocks,
        counts: {
          phases: phases.length,
          semesters: semesters.length,
          weeks: weeks.length,
          grammarTopics: topics.length,
          tutorials: tutorials.length,
          modelTexts: modelTexts.length,
          grammarBlocks: grammarBlocks.length,
        },
      },
    });
  } catch (error) {
    fail(res, 'content/bootstrap', error);
  }
});

export default router;
