/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * lessonContract.ts
 * Fuente unica de verdad: leccion <-> texto <-> vocab <-> estructura.
 */

export interface LessonContract {
  lessonId: string;
  perfil: 'Diego' | 'Laura' | 'Carlos' | 'Fase Cero';
  fragmento: string;
  fraseAncla: string;
  bloqueVocab: 0 | 1 | 2 | 3 | 4;
  filasMatrix: number[];
  vocabExtra: string[];
}

export const LESSON_CONTRACTS: LessonContract[] = [
  {
    lessonId: 'N1-C00',
    perfil: 'Fase Cero',
    fragmento: 'especial',
    fraseAncla: 'A book is here. Two books are here.',
    bloqueVocab: 0,
    filasMatrix: [1, 2, 3],
    vocabExtra: ['book','books','child','children','person','people','one','two','many','this','that','these','those','singular','plural'],
  },
  {
    lessonId: 'N1-C01',
    perfil: 'Diego',
    fragmento: 'P1',
    fraseAncla: 'Hello! My name is Diego Ramirez. I am 21 years old and I am from Panuco, Veracruz.',
    bloqueVocab: 1,
    filasMatrix: [3, 4],
    vocabExtra: ['diego','ramirez','panuco','veracruz','21','twenty-one'],
  },
  {
    lessonId: 'N1-C02',
    perfil: 'Diego',
    fragmento: 'P1',
    fraseAncla: 'I am 21 years old and I am from Panuco, Veracruz.',
    bloqueVocab: 1,
    filasMatrix: [5, 3],
    vocabExtra: ['diego','laura','carlos','panuco','guadalajara','tampico','21','25','30','twenty-one','twenty-five','thirty'],
  },
  {
    lessonId: 'N1-C03',
    perfil: 'Diego',
    fragmento: 'P1',
    fraseAncla: 'I live in a small house near the campus with my brother.',
    bloqueVocab: 1,
    filasMatrix: [6, 7],
    vocabExtra: ['diego','laura','carlos','small','quiet'],
  },
];

export function getContract(lessonId: string): LessonContract | null {
  return LESSON_CONTRACTS.find((c) => c.lessonId === lessonId) || null;
}

export const VOCAB_CATALOG: Record<number, string[]> = {
  0: ['singular','plural','this','that','these','those','one','two','many','book','books','child','children','person','people','a','an','the','is','are','am'],
  1: ['hello','name','years','old','from','live','house','apartment','with','brother','sister','wife','dog','student','teacher','photographer','university','small','quiet','a','an','the','is','are','am','i','you','he','she','it','we','they','my','your','his','her','our','their'],
  2: ['every','day','morning','year','wake','up','eat','breakfast','coffee','prepare','make','take','shower','go','by','bus','bike','walk','like','studying','learning','cooking','swimming','because','but','and','interesting','difficult','right','now','sitting','reading','writing','watching','planning','library','sofa','movie'],
  3: ['last','week','summer','sunday','was','were','took','went','ate','played','visited','talked','swam','answered','walked','happy','beautiful','easy','calm','amazing','delicious','hours','parents','cards','exercises','exam','questions','weather','food','mother','veracruz','fresh','fish','sea'],
  4: ['next','month','weekend','semester','going','to','will','visit','see','try','meet','learn','buy','take','care','excited','happy','project','adventure','study','plant','flowers','them','oaxaca','course','friends','things'],
};