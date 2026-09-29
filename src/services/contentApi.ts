/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * contentApi.ts
 * Cliente de la base de conocimiento pedagogico (Express -> Prisma -> Postgres)
 * y del Teacher Virtual (Express -> Ollama).
 *
 * Todas las respuestas del backend usan el sobre `{ success, data }` o
 * `{ success, error }`. Este servicio lo desenvuelve y lanza ContentApiError
 * para que los hooks puedan distinguir fallo de red vs. 404 vs. 500.
 */

import { apiUrl } from './apiConfig';

/* ================================================================
   TIPOS
   ================================================================ */

export type SkillCode =
  | 'GRAMMAR' | 'READING' | 'LISTENING' | 'SPEAKING' | 'VOCABULARY' | 'WRITING';

export type MCERCode = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface LessonSummary {
  id: string;
  level: string;
  order: number;
  title: string;
  description?: string | null;
  semana?: number | null;
  sesion?: string | null;
  temaPrincipal?: string | null;
  duracionMin?: number | null;
  isPublished: boolean;
}

export interface TheorySection {
  order: number;
  title: string;
  text: string;
}

export interface GrammarExample {
  id: string;
  topicId: string;
  order: number;
  en: string;
  es: string;
  note?: string | null;
}

export interface GrammarTopic {
  id: string;
  title: string;
  titleEn: string;
  mcer: MCERCode | string;
  category: string;
  summary: string;
  explanation?: string;
  structure?: string;
  keywords?: string[];
  order?: number;
  examples?: GrammarExample[];
}

export interface SkillTutorial {
  id: string;
  skill: SkillCode;
  eyebrow: string;
  title: string;
  explanationText: string;
  keyPoints: string[];
  storageKey: string;
  lang: string;
  rate: number;
}

export interface MallaWeek {
  id: string;
  levelCode: string;
  weekNumber: number;
  phase?: string | null;
  title?: string | null;
  shortTitle?: string | null;
  mcer?: string | null;
  grammarFocus?: string | null;
  isExamWeek: boolean;
  isClosingWeek: boolean;
  lessonIds: string[];
  lessons?: { id: string; order: number; title: string; temaPrincipal?: string | null; duracionMin?: number | null }[];
}

export interface CoursePhase {
  code: string;
  order: number;
  name: string;
  description: string;
  weekFrom: number;
  weekTo: number;
  block: number;
  mcer: string;
}

export interface SemesterSkill {
  skill: string;
  order: number;
  name: string;
  englishName: string;
  iconKey: string;
  kpi: string;
  accreditation: string;
  description: string;
}

export interface ProgramSemester {
  code: string;
  name: string;
  order: number;
  cefrTag: string;
  skills: SemesterSkill[];
}

export interface LessonBundle {
  lesson: LessonSummary & {
    videoUrl?: string | null;
    tituloVideo?: string | null;
    tipoContenido?: string | null;
    week: {
      weekNumber: number;
      phase?: string | null;
      ejeTematico: string;
      unidadLibro: string;
      paginas: string;
      kpi: string;
      horas: unknown;
      levelName: string;
      cefrTag: string;
    } | null;
  };
  curriculum: {
    classCode: string; topic: string; description: string;
    level: string; grammarFocus: string;
    vocabFocus: string[]; keyStructures: string[]; suggestedPrompt: string;
  } | null;
  theory: TheorySection[];
  teacherScript: { title: string; content: string } | null;
  grammarTips: { id: string; title: string; rule: string; commonMistake?: string | null; examples: unknown }[];
  quickVocab: { id: string; order: number; word: string; translation: string }[];
  contract: {
    id: string; profile: string; fragment: string;
    anchorPhrase: string; vocabBlock: number;
    matrixRows: number[]; vocabExtra: string[];
  } | null;
  knowledgeMap: {
    raw: string[];
    resolved: GrammarTopic[];
    vocabTopics: string[];
  };
  texts: {
    id: string; title: string; content: string;
    perfil: string; fase: string; parrafos: number;
    wordCount: number; difficulty: number; timeAudioSec: number;
  }[];
  vocabulary: {
    id: string; term: string; translation: string; type: string;
    pronunciationAf?: string | null; exampleUse?: string | null; tags: string[];
  }[];
  exercises: unknown[];
  counts: {
    theory: number; exercises: number; vocabulary: number;
    grammarTips: number; quickVocab: number;
  };
}

export interface GrammarForLesson {
  lessonId: string;
  topics: GrammarTopic[];
  vocabTopics: string[];
  /** Slugs que el mapa de la clase declara pero no existen en GrammarTopic. */
  unresolved: string[];
}

export interface Bootstrap {
  levelCode: string;
  phases: CoursePhase[];
  semesters: ProgramSemester[];
  weeks: MallaWeek[];
  grammarTopics: GrammarTopic[];
  tutorials: SkillTutorial[];
  modelTexts: { id: string; profile: string; title: string; theme: string; text: string; order: number }[];
  grammarBlocks: { id: string; number: number; name: string; purpose: string; mcer: string; structures: string[] }[];
  counts: Record<string, number>;
}

export interface ProductionContent {
  modelTexts: { id: string; profile: string; title: string; theme: string; text: string; order: number }[];
  grammarBlocks: Bootstrap['grammarBlocks'];
  structures: { structure: string; block: number; mcer: string; t1: boolean; t2: boolean; t3: boolean }[];
  vocabBlocks: { id: string; source: string; label: string; words: string[] }[];
}

export interface AiAnswer {
  content: string;
  model: string;
  context: { lessonId: string | null; lessonTitle: string; found: boolean };
}

export interface AiHealth {
  reachable: boolean;
  baseUrl: string;
  configuredModel: string;
  modelLoaded: boolean;
  availableModels?: string[];
  error?: string;
}

/* ================================================================
   ERROR
   ================================================================ */

export class ContentApiError extends Error {
  readonly status: number;
  readonly detail?: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = 'ContentApiError';
    this.status = status;
    this.detail = detail;
  }

  /** La IA (Ollama) no respondio. El resto de la app sigue funcionando. */
  get isAiUnavailable(): boolean {
    return this.status === 503;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

/* ================================================================
   TRANSPORTE
   ================================================================ */

const DEFAULT_TIMEOUT_MS = 20_000;
const AI_TIMEOUT_MS = 180_000;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS, signal } = opts;

  // El timeout externo y el signal del caller se combinan en uno solo.
  const timeout = AbortSignal.timeout(timeoutMs);
  const composed = signal ? AbortSignal.any([timeout, signal]) : timeout;

  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: composed,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error instanceof Error && (error.name === 'TimeoutError' || /abort/i.test(error.message))) {
      throw new ContentApiError(`Timeout esperando ${path}`, 408);
    }
    throw new ContentApiError('No se pudo conectar con el servidor de contenido', 0, error);
  }

  const text = await res.text();
  let payload: any = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      if (!res.ok) throw new ContentApiError(`Respuesta inválida del servidor (${res.status})`, res.status, text.slice(0, 200));
    }
  }

  if (!res.ok) {
    throw new ContentApiError(
      payload?.error || `Error ${res.status} en ${path}`,
      res.status,
      payload?.detail,
    );
  }

  return payload?.data as T;
}

/* ================================================================
   CONTENIDO
   ================================================================ */

export function getBootstrap(signal?: AbortSignal): Promise<Bootstrap> {
  return request<Bootstrap>('/api/content/bootstrap', { signal });
}

export function getLessonBundle(lessonId: string, signal?: AbortSignal): Promise<LessonBundle> {
  return request<LessonBundle>(`/api/content/lessons/${encodeURIComponent(lessonId)}/full`, { signal });
}

export interface GrammarTopicFilter {
  mcer?: string;
  category?: string;
  q?: string;
  limit?: number;
}

export function getGrammarTopics(filter: GrammarTopicFilter = {}, signal?: AbortSignal): Promise<GrammarTopic[]> {
  const params = new URLSearchParams();
  if (filter.mcer) params.set('mcer', filter.mcer);
  if (filter.category) params.set('category', filter.category);
  if (filter.q) params.set('q', filter.q);
  if (filter.limit) params.set('limit', String(filter.limit));
  const qs = params.toString();
  return request<GrammarTopic[]>(`/api/content/grammar/topics${qs ? `?${qs}` : ''}`, { signal });
}

export function getGrammarTopic(id: string, signal?: AbortSignal): Promise<GrammarTopic> {
  return request<GrammarTopic>(`/api/content/grammar/topics/${encodeURIComponent(id)}`, { signal });
}

/**
 * Temas de gramatica de una clase.
 *
 * `unresolved` NO es un error: son slugs que el mapa declara y que todavia no
 * estan catalogados. La UI debe renderizar una tarjeta de respaldo para ellos
 * (o delegar la explicacion a askTeacher).
 */
export function getGrammarForLesson(lessonId: string, signal?: AbortSignal): Promise<GrammarForLesson> {
  return request<GrammarForLesson>(
    `/api/content/grammar/for-lesson/${encodeURIComponent(lessonId)}`,
    { signal },
  );
}

export function getTutorials(signal?: AbortSignal): Promise<SkillTutorial[]> {
  return request<SkillTutorial[]>('/api/content/tutorials', { signal });
}

export function getTutorial(skill: SkillCode, signal?: AbortSignal): Promise<SkillTutorial> {
  return request<SkillTutorial>(`/api/content/tutorials/${encodeURIComponent(skill)}`, { signal });
}

export function getMalla(levelCode = 'S01', signal?: AbortSignal): Promise<MallaWeek[]> {
  return request<MallaWeek[]>(`/api/content/malla/${encodeURIComponent(levelCode)}`, { signal });
}

export function getPhases(signal?: AbortSignal): Promise<CoursePhase[]> {
  return request<CoursePhase[]>('/api/content/phases', { signal });
}

export function getProgram(signal?: AbortSignal): Promise<{ semesters: ProgramSemester[]; phases: CoursePhase[] }> {
  return request<{ semesters: ProgramSemester[]; phases: CoursePhase[] }>('/api/content/program', { signal });
}

export function getProductionContent(signal?: AbortSignal): Promise<ProductionContent> {
  return request<ProductionContent>('/api/content/production', { signal });
}

/* ================================================================
   TEACHER VIRTUAL
   ================================================================ */

export interface AskTeacherInput {
  message: string;
  lessonId?: string;
  level?: string;
  mode?: 'tutor' | 'teacher';
  history?: { role: string; content?: string; parts?: { text?: string }[] }[];
  signal?: AbortSignal;
}

/**
 * Consulta al Teacher Virtual. El backend arma el contexto (teoria, guion,
 * tips, vocabulario, temas) desde Postgres y lo pasa a Ollama.
 *
 * Lanza ContentApiError con isAiUnavailable=true si Ollama no responde, de modo
 * que la UI pueda degradar a la teoria persistida sin romper la pantalla.
 */
export function askTeacher(input: AskTeacherInput): Promise<AiAnswer> {
  const { signal, ...payload } = input;
  return request<AiAnswer>('/api/ai/ask', {
    method: 'POST',
    body: payload,
    timeoutMs: AI_TIMEOUT_MS,
    signal,
  });
}

export function getTeacherContext(lessonId: string, signal?: AbortSignal): Promise<{
  lessonId: string | null; title: string; theory: string; teacherScript: string;
  grammarTips: string; vocabulary: string; grammarTopics: string;
  curriculum: string; found: boolean;
}> {
  return request(`/api/ai/teacher-context?lessonId=${encodeURIComponent(lessonId)}`, { signal });
}

/**
 * Estado de Ollama. Nunca lanza: si el servicio esta caido devuelve
 * reachable=false para que la UI pueda avisar sin try/catch.
 */
export async function getAiHealth(signal?: AbortSignal): Promise<AiHealth | null> {
  try {
    const res = await fetch(apiUrl('/api/ai/health'), { signal: signal ?? AbortSignal.timeout(8_000) });
    const payload = await res.json().catch(() => null);
    return payload?.ollama ?? null;
  } catch {
    return null;
  }
}
