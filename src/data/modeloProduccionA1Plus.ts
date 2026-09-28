/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modelo de Produccion Final · MCER A1+ (Fast Track TOEFL)
 * Referencia pedagogica oficial del curso.
 */

export interface ModelText {
  id: string;
  profile: string;
  title: string;
  text: string;
  theme: string;
}

export interface GrammarBlock {
  number: number;
  name: string;
  purpose: string;
  mcer: string;
  structures: string[];
}

export interface StructureRow {
  structure: string;
  block: number;
  mcer: string;
  t1: boolean;
  t2: boolean;
  t3: boolean;
}

export const MODEL_TEXTS: ModelText[] = [
  {
    id: 'texto-1',
    profile: 'Estudiante / Academico',
    title: 'My University Life',
    theme: 'Vida universitaria y estudio cotidiano',
    text: 'Hello! My name is Diego Ramirez. I am 21 years old and I am from Panuco, Veracruz. I am a university student. I live in a small house near the campus with my brother.\n\nEvery day, I wake up at 6:30 AM. I eat breakfast with my family, and I go to class by bike. I like studying languages because it is interesting, but mathematics is difficult for me. Right now, I am sitting in the library and I am reading a book for my English class.\n\nLast week, I took an exam in the morning. The questions were easy and I was very calm. I answered all the exercises and my teacher was happy.\n\nNext semester, I am going to study in a new course. I will meet new friends and I will learn many things. I am very excited about it.',
  },
  {
    id: 'texto-2',
    profile: 'Viajero',
    title: 'My Trip to the Beach',
    theme: 'Viajes y experiencias vacacionales',
    text: 'Hello! My name is Laura Sanchez. I am 25 years old and I am from Guadalajara. I am a photographer. I love traveling with my family every summer.\n\nEvery year, we visit a new place. In the mornings, I take photos of the sunrise, and I walk on the beach. I like swimming in the ocean because it is relaxing, but sometimes the sun is very hot. Right now, I am planning our next trip and I am looking at a map.\n\nLast summer, we went to Veracruz. The weather was beautiful and the food was delicious. We swam in the sea and ate fresh fish. It was an amazing vacation!\n\nNext month, we are going to visit Oaxaca. We will see the old streets and we will try the local food. I am very happy about this new adventure.',
  },
  {
    id: 'texto-3',
    profile: 'Vida Diaria',
    title: 'My Week at Home',
    theme: 'Vida domestica y rutinas familiares',
    text: 'Hello! My name is Carlos Mendoza. I am 30 years old and I am from Tampico. I am a teacher at a small school. I live in a quiet neighborhood with my wife and our dog.\n\nEvery morning, I prepare coffee for my wife and I make breakfast for both of us. She likes cooking dinner because it is her hobby, but I usually clean the kitchen. Right now, I am sitting on the sofa and I am watching a movie with my dog.\n\nLast Sunday, we visited my parents house. My mother was happy and the food was delicious. We talked for hours and played cards in the evening.\n\nNext weekend, we are going to plant a small garden. I will buy some flowers and I will take care of them. I am very excited about this project.',
  },
];

export const GRAMMAR_BLOCKS: GrammarBlock[] = [
  {
    number: 1,
    name: 'Identidad Personal',
    purpose: 'Presentarse a uno mismo y dar informacion basica',
    mcer: 'A1 puro',
    structures: [
      'To Be (am / is / are)',
      'Adjetivos posesivos (my, your, his, her)',
      'Presente Simple en primera persona',
      'Preposiciones de lugar (in, from, with)',
      'Adjetivos descriptivos',
    ],
  },
  {
    number: 2,
    name: 'Rutina y Presente Activo',
    purpose: 'Describir habitos diarios y acciones en progreso',
    mcer: 'A1 puro',
    structures: [
      'Adverbios de frecuencia (every day, every morning, usually)',
      'Presente Simple (I / you / we / they)',
      'Presente Simple tercera persona (he / she / it + -s)',
      'Preposiciones de tiempo (at + hora)',
      'Preposiciones de medio (by bus, by bike)',
      'like + verbo-ing',
      'Conectores (and, but, because)',
      'Presente Continuo (am + verbo-ing, right now)',
    ],
  },
  {
    number: 3,
    name: 'Experiencia Pasada',
    purpose: 'Narrar eventos recientes',
    mcer: 'A1+ (introduccion a A2)',
    structures: [
      'Marcador de pasado (last week, last summer, last Sunday)',
      'Pasado del To Be (was / were)',
      'Pasado Simple regular (visited, talked, played, answered)',
      'Pasado Simple irregular (took, went, ate, swam)',
      'Adjetivos descriptivos en pasado (happy, beautiful, easy, calm)',
    ],
  },
  {
    number: 4,
    name: 'Planes Futuros',
    purpose: 'Expresar intenciones y planes',
    mcer: 'A1+ (introduccion a A2)',
    structures: [
      'Marcador de futuro (next month, next weekend, next semester)',
      'going to (am / are + going to + verbo)',
      'will + verbo',
      'Cierre emocional (I am very excited / happy about it)',
    ],
  },
];

export const STRUCTURE_MATRIX: StructureRow[] = [
  { structure: 'To Be (am / is / are)', block: 1, mcer: 'A1', t1: true, t2: true, t3: true },
  { structure: 'Posesivos (my / your / his / her)', block: 1, mcer: 'A1', t1: true, t2: true, t3: true },
  { structure: 'Presente Simple (I)', block: 1, mcer: 'A1', t1: true, t2: true, t3: true },
  { structure: 'Presente Simple (he / she)', block: 2, mcer: 'A1', t1: false, t2: false, t3: true },
  { structure: 'Preposiciones de lugar', block: 1, mcer: 'A1', t1: true, t2: true, t3: true },
  { structure: 'Preposiciones de tiempo', block: 2, mcer: 'A1', t1: true, t2: true, t3: true },
  { structure: 'like + verbo-ing', block: 2, mcer: 'A1+', t1: true, t2: true, t3: true },
  { structure: 'Presente Continuo', block: 2, mcer: 'A1', t1: true, t2: true, t3: true },
  { structure: 'Conectores (and, but, because)', block: 2, mcer: 'A1', t1: true, t2: true, t3: true },
  { structure: 'Pasado Simple regular (-ed)', block: 3, mcer: 'A2', t1: true, t2: true, t3: true },
  { structure: 'Pasado Simple irregular', block: 3, mcer: 'A2', t1: true, t2: true, t3: true },
  { structure: 'was / were', block: 3, mcer: 'A2', t1: true, t2: true, t3: true },
  { structure: 'going to (futuro)', block: 4, mcer: 'A2', t1: true, t2: true, t3: true },
  { structure: 'will (futuro)', block: 4, mcer: 'A2', t1: true, t2: true, t3: true },
  { structure: 'Adverbios de frecuencia', block: 2, mcer: 'A1', t1: true, t2: true, t3: true },
  { structure: 'Adjetivos descriptivos', block: 1, mcer: 'A1', t1: true, t2: true, t3: true },
];

export const VOCAB_CATALOG: Record<number, string[]> = {
  1: ['hello', 'name', 'years old', 'from', 'live', 'house', 'apartment', 'with', 'brother', 'sister', 'wife', 'dog', 'student', 'teacher', 'photographer', 'university', 'small', 'quiet'],
  2: ['every day', 'every morning', 'every year', 'wake up', 'eat', 'breakfast', 'coffee', 'prepare', 'make', 'take a shower', 'go', 'by bus', 'by bike', 'walk', 'like', 'studying', 'learning', 'cooking', 'swimming', 'because', 'but', 'interesting', 'difficult', 'right now', 'sitting', 'reading', 'writing', 'watching', 'planning'],
  3: ['last week', 'last summer', 'last Sunday', 'was', 'were', 'took', 'went', 'ate', 'played', 'visited', 'talked', 'swam', 'answered', 'happy', 'beautiful', 'easy', 'calm', 'amazing'],
  4: ['next month', 'next weekend', 'next semester', 'going to', 'will', 'visit', 'see', 'try', 'meet', 'learn', 'buy', 'take care', 'excited', 'happy', 'project', 'adventure'],
};
