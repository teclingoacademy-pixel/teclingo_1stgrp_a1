/**
 * aiKnowledgeBridge.ts
 * Builds AI context from student progress + curriculum data.
 * Used by the AI tutor to provide contextually relevant responses.
 */

import { obtenerProgresoUsuario, obtenerResumenProgreso } from './dataLakeProgressService';

const DATA_LAKE_API_URL =
  (import.meta.env.VITE_IDENTITY_API_URL as string | undefined)?.trim() ||
  'https://script.google.com/macros/s/AKfycbz7buTc2D7FIgWVub6_t4leXfvqc68821957LHOUgP-mBqpWKn_7JaEU-DZWiumAcVb/exec';
const DATA_LAKE_SECRET = 'teclingo_secret_2026';

export interface AIContext {
  student_email: string;
  current_clase: string;
  current_week: number;
  grammar_topics_covered: string[];
  vocabulary_learned: string[];
  weak_skills: string[];
  progress_percent: number;
  xp_total: number;
}

// Known grammar topics per class (from curriculum)
export const CLASS_GRAMMAR_MAP: Record<string, string[]> = {
  'A1_C01': ['present_simple', 'personal_pronouns', 'be_verb'],
  'A1_C02': ['demonstratives', 'there_is_there_are', 'prepositions'],
  'A1_C03': ['present_continuous', 'question_words', 'articles'],
  'A1_C04': ['past_simple_regular', 'time_expressions'],
  'A1_C05': ['past_simple_irregular', 'frequency_adverbs'],
  'A1_C06': ['comparatives', 'superlatives'],
  'A1_C07': ['present_perfect', 'for_since'],
  'A1_C08': ['future_will', 'going_to'],
  'A1_C09': ['modals_can_could', 'ability'],
  'A1_C10': ['conditionals_first', 'if_clauses'],
  'A1_C11': ['passive_voice', 'reported_speech'],
  'A1_C12': ['relative_clauses', 'connecting_words'],
};

// Known vocabulary topics per class
export const CLASS_VOCAB_MAP: Record<string, string[]> = {
  'A1_C01': ['greetings', 'introductions', 'countries', 'nationalities'],
  'A1_C02': ['classroom_objects', 'school_supplies', 'demonstratives'],
  'A1_C03': ['daily_routines', 'house_rooms', 'present_continuous'],
  'A1_C04': ['past_activities', 'hobbies', 'time_expressions'],
  'A1_C05': ['food_drink', 'restaurant', 'frequency_adverbs'],
  'A1_C06': ['clothing', 'appearance', 'comparatives'],
  'A1_C07': ['health_body', 'doctor', 'present_perfect'],
  'A1_C08': ['travel_transport', 'plans', 'future_tenses'],
  'A1_C09': ['abilities_skills', 'permissions', 'modals'],
  'A1_C10': ['weather', 'environment', 'conditionals'],
  'A1_C11': ['work_jobs', 'technology', 'passive_voice'],
  'A1_C12': ['culture_traditions', 'media', 'relative_clauses'],
};

/**
 * Builds AI context for a student based on their progress
 */
export async function buildAIContext(
  studentEmail: string,
  currentClase?: string
): Promise<AIContext> {
  const defaultContext: AIContext = {
    student_email: studentEmail,
    current_clase: currentClase || 'A1_C01',
    current_week: 1,
    grammar_topics_covered: [],
    vocabulary_learned: [],
    weak_skills: [],
    progress_percent: 0,
    xp_total: 0,
  };

  try {
    // Fetch progress from Data Lake
    const [progresoRes, resumenRes] = await Promise.all([
      obtenerProgresoUsuario(studentEmail),
      obtenerResumenProgreso(studentEmail),
    ]);

    if (!progresoRes.ok || !resumenRes.ok) {
      return defaultContext;
    }

    const progreso = progresoRes.data || [];
    const resumen = resumenRes.data || [];

    // Determine current class from latest progress
    let latestClase = currentClase || 'A1_C01';
    if (progreso.length > 0) {
      const lastEntry = progreso[progreso.length - 1];
      latestClase = lastEntry.clase_id || latestClase;
    }

    // Calculate week from class ID (A1_C07 → week 7)
    const classMatch = latestClase.match(/C(\d+)/);
    const week = classMatch ? parseInt(classMatch[1]) : 1;

    // Gather grammar topics from covered classes
    const grammarTopics: string[] = [];
    const vocabTopics: string[] = [];
    const claseNumbers = new Set<number>();

    resumen.forEach((r: any) => {
      const match = (r.clase_id || '').match(/C(\d+)/);
      if (match) claseNumbers.add(parseInt(match[1]));
    });

    claseNumbers.forEach(num => {
      const classId = `A1_C${String(num).padStart(2, '0')}`;
      const topics = CLASS_GRAMMAR_MAP[classId] || [];
      const vocab = CLASS_VOCAB_MAP[classId] || [];
      const resumenEntry = resumen.find((r: any) => (r.clase_id || '').includes(`C${String(num).padStart(2, '0')}`));
      if (resumenEntry && (resumenEntry.porcentaje_avance >= 50 || resumenEntry.estado_clase === 'completada')) {
        grammarTopics.push(...topics);
        vocabTopics.push(...vocab);
      }
    });

    // Calculate weak skills (skills with < 60% correct rate)
    const skillStats: Record<string, { correct: number; total: number }> = {};
    progreso.forEach((p: any) => {
      const skill = p.habilidad || 'unknown';
      if (!skillStats[skill]) skillStats[skill] = { correct: 0, total: 0 };
      skillStats[skill].total++;
      if (p.correcto === 'TRUE' || p.correcto === true) {
        skillStats[skill].correct++;
      }
    });

    const weakSkills = Object.entries(skillStats)
      .filter(([_, stats]) => stats.total > 0 && (stats.correct / stats.total) < 0.6)
      .map(([skill]) => skill);

    // Calculate totals
    const totalCorrect = progreso.filter((p: any) => p.correcto === 'TRUE' || p.correcto === true).length;
    const progressPercent = progreso.length > 0 ? Math.round((totalCorrect / progreso.length) * 100) : 0;
    const xpTotal = resumen.reduce((acc: number, r: any) => acc + (r.xp_ganado || r.puntaje_obtenido || 0), 0);

    return {
      student_email: studentEmail,
      current_clase: latestClase,
      current_week: week,
      grammar_topics_covered: grammarTopics,
      vocabulary_learned: vocabTopics,
      weak_skills: weakSkills,
      progress_percent: progressPercent,
      xp_total: xpTotal,
    };
  } catch (error) {
    console.error('[aiKnowledgeBridge] Error building context:', error);
    return defaultContext;
  }
}

/**
 * Builds a system prompt addition for the AI tutor based on context
 */
export function buildContextPrompt(context: AIContext): string {
  if (!context.student_email) return '';

  const topicsList = context.grammar_topics_covered.length > 0
    ? context.grammar_topics_covered.join(', ').replace(/_/g, ' ')
    : 'none yet';

  const vocabList = context.vocabulary_learned.length > 0
    ? context.vocabulary_learned.join(', ').replace(/_/g, ' ')
    : 'none yet';

  const weakList = context.weak_skills.length > 0
    ? context.weak_skills.join(', ').replace(/_/g, ' ')
    : 'none identified';

  return `
STUDENT CONTEXT:
- Student is on class ${context.current_clase} (week ${context.current_week} of 18)
- Grammar topics covered: ${topicsList}
- Vocabulary learned: ${vocabList}
- Weak areas: ${weakList}
- Course progress: ${context.progress_percent}%
- XP earned: ${context.xp_total}

ADAPT your responses to:
1. Focus on grammar topics from the student's current class level
2. Use vocabulary the student has already learned
3. Spend extra time on their weak areas
4. Encourage them based on their progress (${context.progress_percent}% complete)
5. If they ask about advanced topics, gently redirect to their current level material
`;
}
