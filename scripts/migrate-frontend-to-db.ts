/**
 * ONE-SHOT: migra todo el contenido pedagogico del frontend a Postgres.
 * Lee las constantes que hoy viven en src/ y las escribe en las tablas nuevas.
 * Tras ejecutarlo, los archivos fuente pueden borrarse.
 *
 *   npx tsx scripts/migrate-frontend-to-db.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { SECTION_SCRIPTS } from '@/components/workbook/ClassTheoryAccordion';
import { LESSON_AUDIO_SCRIPTS } from '@/components/workbook/TeacherVirtualCard';
import { TUTORIAL_TEXT as T_GRAMMAR, GRAMMAR_TUTORIAL_STORAGE_KEY } from '@/components/workbook/GrammarTutorialModal';
import { explanationText as T_READING, READING_GRAMMAR_TUTORIAL_STORAGE_KEY } from '@/components/workbook/ReadingGrammarTutorialModal';
import { explanationText as T_LISTENING, LISTENING_TUTORIAL_STORAGE_KEY } from '@/components/workbook/ListeningTutorialModal';
import { explanationText as T_SPEAKING, SPEAKING_TUTORIAL_STORAGE_KEY } from '@/components/workbook/SpeakingTutorialModal';
import { explanationText as T_WRITING, WRITING_TUTORIAL_STORAGE_KEY } from '@/components/workbook/WritingTutorialModal';
import { GRAMMAR_LIBRARY } from '@/components/tools/grammarLibraryData';
import { CLASS_GRAMMAR_MAP, CLASS_VOCAB_MAP } from '@/services/workbook/aiKnowledgeBridge';
import { WEEK_TO_LESSONS, EXAM_WEEKS, CLOSING_WEEK } from '@/components/ProgressMap';
import { MODEL_TEXTS, GRAMMAR_BLOCKS, STRUCTURE_MATRIX, VOCAB_CATALOG as PROD_VOCAB } from '@/data/modeloProduccionA1Plus';
import { LESSON_CONTRACTS, VOCAB_CATALOG as CONTRACT_VOCAB } from '@/data/lessonContract';
import { COURSE_PHASES, COURSE_WEEKS } from '@/data/coursePhasesA1Plus';
import { TECLINGO_A1_CURRICULUM } from '@/data/workbook/teclingoCurriculum';
import { SESSIONS_DATA } from '@/data/workbook/sessionsData';
import { SEMESTERS, SKILL_MATRIX } from './migrate-curriculum-payload';

const prisma = new PrismaClient();
const LEVEL_CODE = 'S01';
let step = 0;
const log = (m: string) => console.log(`  [${String(++step).padStart(2, '0')}] ${m}`);

async function main() {
  const rows = await prisma.lesson.findMany({ select: { id: true }, orderBy: { order: 'asc' } });
  const valid = new Set(rows.map((l) => l.id));
  console.log(`\nLecciones en BD: ${valid.size}\n`);

  // 1. Guiones del Teacher Virtual
  let ts = 0;
  for (const [lessonId, content] of Object.entries(LESSON_AUDIO_SCRIPTS)) {
    if (!valid.has(lessonId)) continue;
    const data = { content, title: `${lessonId} - Guion del Teacher` };
    await prisma.teacherScript.upsert({ where: { lessonId }, update: data, create: { lessonId, ...data } });
    ts++;
  }
  log(`Guiones Teacher Virtual: ${ts}`);

  // 2. Secciones de teoria
  let theory = 0;
  for (const lessonId of valid) {
    for (const [k, sec] of Object.entries(SECTION_SCRIPTS)) {
      const order = Number(k);
      const data = { title: sec.title, text: sec.text };
      await prisma.lessonTheorySection.upsert({
        where: { lessonId_order: { lessonId, order } },
        update: data,
        create: { lessonId, order, ...data },
      });
      theory++;
    }
  }
  log(`Secciones de teoria: ${theory}`);

  // 3. Tutoriales por habilidad
  const TUTORIALS = [
    { skill: 'GRAMMAR' as const, text: T_GRAMMAR, key: GRAMMAR_TUTORIAL_STORAGE_KEY, eyebrow: 'Guia Rapida - Ejercicios de Grammar', title: 'Como funciona este ejercicio?' },
    { skill: 'READING' as const, text: T_READING, key: READING_GRAMMAR_TUTORIAL_STORAGE_KEY, eyebrow: 'Guia Rapida - Lectura + Completar Oracion', title: 'Como funciona este ejercicio?' },
    { skill: 'LISTENING' as const, text: T_LISTENING, key: LISTENING_TUTORIAL_STORAGE_KEY, eyebrow: 'Guia Rapida - Listening Cloze', title: 'Como funciona el ejercicio de Listening?' },
    { skill: 'SPEAKING' as const, text: T_SPEAKING, key: SPEAKING_TUTORIAL_STORAGE_KEY, eyebrow: 'Guia Rapida - Speaking', title: 'Como funciona el ejercicio de Speaking?' },
    { skill: 'WRITING' as const, text: T_WRITING, key: WRITING_TUTORIAL_STORAGE_KEY, eyebrow: 'Guia Rapida - Writing', title: 'Como funciona el Dictado Interactivo?' },
  ];
  for (const t of TUTORIALS) {
    const data = { eyebrow: t.eyebrow, title: t.title, explanationText: t.text, keyPoints: [] as unknown[], storageKey: t.key };
    await prisma.skillTutorial.upsert({ where: { skill: t.skill }, update: data, create: { skill: t.skill, ...data } });
  }
  log(`Tutoriales por habilidad: ${TUTORIALS.length}`);

  // 4. Biblioteca de gramatica
  for (const [i, topic] of GRAMMAR_LIBRARY.entries()) {
    const data = {
      title: topic.title, titleEn: topic.titleEn, mcer: topic.mcer, category: topic.category,
      summary: topic.summary, explanation: topic.explanation, structure: topic.structure,
      keywords: topic.keywords, order: i, active: true,
    };
    await prisma.grammarTopic.upsert({ where: { id: topic.id }, update: data, create: { id: topic.id, ...data } });
    await prisma.grammarExample.deleteMany({ where: { topicId: topic.id } });
    await prisma.grammarExample.createMany({
      data: topic.examples.map((ex, j) => ({ topicId: topic.id, order: j, en: ex.en, es: ex.es, note: ex.note ?? null })),
    });
  }
  log(`Biblioteca de gramatica: ${GRAMMAR_LIBRARY.length} temas`);

  // 5. Mapa clase -> temas (AI Tutor)
  const mapKeys = new Set([...Object.keys(CLASS_GRAMMAR_MAP), ...Object.keys(CLASS_VOCAB_MAP)]);
  for (const raw of mapKeys) {
    const lessonId = raw.replace(/^A1_/, 'N1-');
    if (!valid.has(lessonId)) continue;
    const data = { grammarTopics: CLASS_GRAMMAR_MAP[raw] ?? [], vocabTopics: CLASS_VOCAB_MAP[raw] ?? [] };
    await prisma.classKnowledgeMap.upsert({ where: { lessonId }, update: data, create: { lessonId, ...data } });
  }
  log(`Mapas clase->temas: ${mapKeys.size}`);

  // 6. Malla pedagogica semana -> leccion
  for (const w of COURSE_WEEKS) {
    const lessonIds = (WEEK_TO_LESSONS[w.semana] ?? []).filter((id) => valid.has(id));
    const data = {
      phase: w.phase, lessonIds, isExamWeek: EXAM_WEEKS.includes(w.semana),
      isClosingWeek: w.semana === CLOSING_WEEK, title: w.titulo, shortTitle: w.tituloCorto,
      mcer: w.mcer, grammarFocus: w.grammarFocus,
    };
    await prisma.mallaWeek.upsert({
      where: { levelCode_weekNumber: { levelCode: LEVEL_CODE, weekNumber: w.semana } },
      update: data, create: { levelCode: LEVEL_CODE, weekNumber: w.semana, ...data },
    });
  }
  log(`Malla pedagogica: ${COURSE_WEEKS.length} semanas`);

  // 7. Fases del curso
  for (const p of COURSE_PHASES) {
    const data = { order: p.order, name: p.name, description: p.description, weekFrom: p.weekFrom, weekTo: p.weekTo, block: p.block, mcer: p.mcer };
    await prisma.coursePhase.upsert({ where: { code: p.code }, update: data, create: { code: p.code, ...data } });
  }
  log(`Fases del curso: ${COURSE_PHASES.length}`);

  // 8. Currículo por semestre (panel del Director)
  for (const s of SEMESTERS) {
    const data = { name: s.name, order: s.order, cefrTag: s.cefrTag };
    await prisma.programSemester.upsert({ where: { code: s.code }, update: data, create: { code: s.code, ...data } });
  }
  let sk = 0;
  for (const [semesterCode, band] of Object.entries(SKILL_MATRIX)) {
    for (const [i, s] of band.entries()) {
      const data = { order: i, name: s.name, englishName: s.englishName, iconKey: s.iconKey, kpi: s.kpi, accreditation: s.accreditation, description: s.description };
      await prisma.semesterSkill.upsert({
        where: { semesterCode_skill: { semesterCode, skill: s.skill } },
        update: data, create: { semesterCode, skill: s.skill, ...data },
      });
      sk++;
    }
  }
  log(`Semestres: ${SEMESTERS.length} | Habilidades: ${sk}`);

  // 9. Modelo de produccion A1+
  for (const [i, t] of MODEL_TEXTS.entries()) {
    const data = { profile: t.profile, title: t.title, theme: t.theme, text: t.text, order: i };
    await prisma.productionModelText.upsert({ where: { id: t.id }, update: data, create: { id: t.id, ...data } });
  }
  log(`Textos modelo: ${MODEL_TEXTS.length}`);

  for (const b of GRAMMAR_BLOCKS) {
    const data = { name: b.name, purpose: b.purpose, mcer: b.mcer, structures: b.structures };
    await prisma.grammarBlock.upsert({ where: { number: b.number }, update: data, create: { number: b.number, ...data } });
  }
  for (const s of STRUCTURE_MATRIX) {
    const data = { block: s.block, mcer: s.mcer, t1: s.t1, t2: s.t2, t3: s.t3 };
    await prisma.grammarStructure.upsert({ where: { structure: s.structure }, update: data, create: { structure: s.structure, ...data } });
  }
  log(`Bloques gramaticales: ${GRAMMAR_BLOCKS.length} | Matriz estructuras: ${STRUCTURE_MATRIX.length}`);

  for (const [num, words] of Object.entries(PROD_VOCAB)) {
    const id = `production-${num}`;
    await prisma.vocabBlock.upsert({ where: { id }, update: { words, label: `Bloque ${num} - Produccion A1+` }, create: { id, source: 'production', label: `Bloque ${num} - Produccion A1+`, words } });
  }
  for (const [num, words] of Object.entries(CONTRACT_VOCAB)) {
    const id = `contract-${num}`;
    await prisma.vocabBlock.upsert({ where: { id }, update: { words, label: `Bloque ${num} - Contrato` }, create: { id, source: 'contract', label: `Bloque ${num} - Contrato`, words } });
  }
  log(`Bloques de vocabulario: ${Object.keys(PROD_VOCAB).length + Object.keys(CONTRACT_VOCAB).length}`);

  // 10. Contrato leccion
  let lc = 0;
  for (const c of LESSON_CONTRACTS) {
    if (!valid.has(c.lessonId)) continue;
    const data = { profile: c.perfil, fragment: c.fragmento, anchorPhrase: c.fraseAncla, vocabBlock: c.bloqueVocab, matrixRows: c.filasMatrix, vocabExtra: c.vocabExtra };
    await prisma.lessonContract.upsert({ where: { lessonId: c.lessonId }, update: data, create: { lessonId: c.lessonId, ...data } });
    lc++;
  }
  log(`Contratos de leccion: ${lc}`);

  // 11. Ficha curricular por clase (teclingoCurriculum -> N1-CXX)
  let cur = 0;
  for (const c of TECLINGO_A1_CURRICULUM) {
    const lessonId = `N1-C${String(c.order).padStart(2, '0')}`;
    if (!valid.has(lessonId)) continue;
    const data = {
      order: c.order, classCode: c.classCode, topic: c.topic, description: c.description,
      level: c.level, grammarFocus: c.grammarFocus, vocabFocus: c.vocabFocus,
      keyStructures: c.keyStructures, suggestedPrompt: c.suggestedPrompt,
    };
    await prisma.lessonCurriculum.upsert({ where: { lessonId }, update: data, create: { lessonId, ...data } });
    // Enriquece la Lesson con video/tema si estan vacios
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        videoUrl: c.youtubeUrl || undefined,
        tituloVideo: c.title || undefined,
        temaPrincipal: c.topic || undefined,
        description: c.description || undefined,
      },
    });
    cur++;
  }
  log(`Fichas curriculares: ${cur}`);

  // 12. Tips gramaticales y vocab rapido (sessionsData sesion N -> N1-C(N-1))
  let tip = 0, qv = 0;
  for (const s of SESSIONS_DATA) {
    const lessonId = `N1-C${String(s.sessionNumber - 1).padStart(2, '0')}`;
    if (!valid.has(lessonId)) continue;
    await prisma.lessonGrammarTip.upsert({
      where: { id: `tip-${lessonId}` },
      update: { title: s.grammarTip.title, rule: s.grammarTip.rule, commonMistake: s.grammarTip.commonMistake ?? null, examples: s.grammarTip.examples as unknown as object },
      create: { id: `tip-${lessonId}`, lessonId, title: s.grammarTip.title, rule: s.grammarTip.rule, commonMistake: s.grammarTip.commonMistake ?? null, examples: s.grammarTip.examples as unknown as object },
    });
    await prisma.lessonQuickVocab.deleteMany({ where: { lessonId } });
    await prisma.lessonQuickVocab.createMany({
      data: s.quickVocab.map((v, i) => ({ lessonId, order: i, word: v.word, translation: v.translation })),
    });
    tip++; qv += s.quickVocab.length;
  }
  log(`Tips gramaticales: ${tip} | Vocab rapido: ${qv}`);

  console.log('\nMigracion completa.\n');
}

main()
  .catch((e) => { console.error('\nERROR:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
