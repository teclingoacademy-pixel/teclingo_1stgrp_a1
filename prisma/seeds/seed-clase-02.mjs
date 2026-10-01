import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const VOZ = 'male';
const VOICE_GENDER = 'male';
const tts = (text) => ({ segments: [{ text, lang: 'en', voiceGender: VOICE_GENDER }] });

// ============================================================
// 1. VIDEO URL + TEMA
// ============================================================
await p.lesson.update({
  where: { id: 'CLASE_02' },
  data: {
    videoUrl: 'https://youtube.com/shorts/3yoU5F9MfQU',
    description: 'El Secreto de los Auxiliares (Aprender a Negar y Preguntar)',
    temaPrincipal: 'Auxiliares - Negacion e Interrogacion'
  }
});
console.log('OK - videoUrl actualizado');

// ============================================================
// 2. TEXTBASE
// ============================================================
await p.textBase.deleteMany({ where: { lessonId: 'CLASE_02' } });
const textContent = 'I am not in the office. I am a student in the big library. Is Luis in the library? No, he is not. He is in his house. Is Maria in the office? Yes, she is. She is a good teacher. Are we friends? Yes, we are friends. We are not sad in this city; we are happy.';
await p.textBase.create({
  data: {
    lessonId: 'CLASE_02',
    title: 'Not in the Office, but in the Library',
    content: textContent,
    wordCount: textContent.split(/\s+/).length,
    difficulty: 1,
    timeAudioSec: 60,
    vocabList: ['student', 'teacher', 'citizen', 'doctor', 'friends', 'library', 'office', 'house', 'city', 'book', 'pen', 'table', 'classroom', 'happy', 'sad', 'big', 'small'],
    verbsList: ['am', 'is', 'are', 'am not', 'is not', 'are not'],
    perfil: 'Alex',
    fase: 'F1',
    parrafos: 1
  }
});
console.log('OK - TextBase creado');

// ============================================================
// 3. VOCABULARYITEM (25 terminos)
// ============================================================
await p.vocabularyItem.deleteMany({ where: { lessonId: 'CLASE_02' } });
const vocabs = [
  { term: 'I am not', translation: 'Yo no soy / Yo no estoy', type: 'negative', ttsText: 'I am not a student', exampleUse: 'I am not in the office.' },
  { term: 'You are not', translation: 'Tu no eres / Ustedes no son', type: 'negative', ttsText: 'You are not a teacher', exampleUse: 'You are not a teacher.' },
  { term: 'He is not', translation: 'El no es / El no esta', type: 'negative', ttsText: 'He is not a doctor', exampleUse: 'He is not a doctor.' },
  { term: 'She is not', translation: 'Ella no es / Ella no esta', type: 'negative', ttsText: 'She is not sad', exampleUse: 'She is not sad.' },
  { term: 'It is not', translation: 'Eso no es / Eso no esta', type: 'negative', ttsText: 'It is not a book', exampleUse: 'It is not a book.' },
  { term: 'We are not', translation: 'Nosotros no somos / No estamos', type: 'negative', ttsText: 'We are not friends', exampleUse: 'We are not friends.' },
  { term: 'They are not', translation: 'Ellos no son / No estan', type: 'negative', ttsText: 'They are not happy', exampleUse: 'They are not happy.' },
  { term: 'Am I?', translation: '¿Soy yo? / ¿Estoy yo?', type: 'question', ttsText: 'Am I a student', exampleUse: 'Am I a student?' },
  { term: 'Are you?', translation: '¿Eres tu? / ¿Son ustedes?', type: 'question', ttsText: 'Are you a citizen', exampleUse: 'Are you a citizen?' },
  { term: 'Is he?', translation: '¿Es el? / ¿Esta el?', type: 'question', ttsText: 'Is he a doctor', exampleUse: 'Is he a doctor?' },
  { term: 'Is she?', translation: '¿Es ella? / ¿Esta ella?', type: 'question', ttsText: 'Is she in the library', exampleUse: 'Is she in the library?' },
  { term: 'Is it?', translation: '¿Es eso? / ¿Esta eso?', type: 'question', ttsText: 'Is it a book', exampleUse: 'Is it a book?' },
  { term: 'Are we?', translation: '¿Somos nosotros? / ¿Estamos?', type: 'question', ttsText: 'Are we friends', exampleUse: 'Are we friends?' },
  { term: 'Are they?', translation: '¿Son ellos? / ¿Estan ellos?', type: 'question', ttsText: 'Are they in the house', exampleUse: 'Are they in the house?' },
  { term: 'Yes, I am', translation: 'Si, yo soy / yo estoy', type: 'short_answer', ttsText: 'Yes I am', exampleUse: 'Yes, I am.' },
  { term: 'No, I am not', translation: 'No, yo no soy / no estoy', type: 'short_answer', ttsText: 'No I am not', exampleUse: 'No, I am not.' },
  { term: 'Yes, he is', translation: 'Si, el es / el esta', type: 'short_answer', ttsText: 'Yes he is', exampleUse: 'Yes, he is.' },
  { term: 'No, he is not', translation: 'No, el no es / no esta', type: 'short_answer', ttsText: 'No he is not', exampleUse: 'No, he is not.' },
  { term: 'student', translation: 'estudiante', type: 'noun', ttsText: 'I am a student', exampleUse: 'I am a student.' },
  { term: 'teacher', translation: 'maestro/a', type: 'noun', ttsText: 'She is a teacher', exampleUse: 'She is a good teacher.' },
  { term: 'citizen', translation: 'ciudadano/a', type: 'noun', ttsText: 'You are a citizen', exampleUse: 'You are a citizen.' },
  { term: 'doctor', translation: 'medico/a', type: 'noun', ttsText: 'He is a doctor', exampleUse: 'Is he a doctor?' },
  { term: 'happy', translation: 'feliz', type: 'adjective', ttsText: 'We are happy', exampleUse: 'We are happy in this city.' },
  { term: 'sad', translation: 'triste', type: 'adjective', ttsText: 'We are not sad', exampleUse: 'We are not sad in this city.' },
  { term: 'library', translation: 'biblioteca', type: 'noun', ttsText: 'She is in the library', exampleUse: 'She is in the library.' }
];
for (const v of vocabs) {
  await p.vocabularyItem.create({
    data: {
      lessonId: 'CLASE_02', term: v.term, translation: v.translation,
      type: v.type, ttsText: v.ttsText, lang: 'en', exampleUse: v.exampleUse, tags: [v.type]
    }
  });
}
console.log('OK - ' + vocabs.length + ' VocabularyItem creados');

// ============================================================
// 4. LESSONQUICKVOCAB (top 6)
// ============================================================
await p.lessonQuickVocab.deleteMany({ where: { lessonId: 'CLASE_02' } });
const quickVocab = [
  { order: 1, word: 'I am not', translation: 'Yo no soy / Yo no estoy' },
  { order: 2, word: 'Are you...?', translation: '¿Eres tu? / ¿Son ustedes?' },
  { order: 3, word: 'Is she...?', translation: '¿Esta ella?' },
  { order: 4, word: 'Yes, I am', translation: 'Si, yo soy' },
  { order: 5, word: 'No, he is not', translation: 'No, el no es' },
  { order: 6, word: 'We are not', translation: 'Nosotros no somos' }
];
for (const q of quickVocab) {
  await p.lessonQuickVocab.create({
    data: { lessonId: 'CLASE_02', order: q.order, word: q.word, translation: q.translation }
  });
}
console.log('OK - ' + quickVocab.length + ' LessonQuickVocab creados');

// ============================================================
// 5. TEACHERSCRIPT
// ============================================================
await p.teacherScript.deleteMany({ where: { lessonId: 'CLASE_02' } });
const teacherContent = `[ES]
Bienvenidos a tu segunda mision para dominar el ingles.

Hoy aprenderas la herramienta mas poderosa del idioma: que es un verbo auxiliar.

Un auxiliar es un verbo con una superpotencia. Ubica la accion en el tiempo y define a la persona que la realiza. Es el GPS de tu oracion.

Nuestro primer gran auxiliar es el verbo to be, que se divide en tres motores: am, are, is. Comprender esto te permite dominar las dos reglas universales del idioma.

Regla universal uno, para negar. La palabra not va siempre despues del auxiliar.

Escucha como se aplica en cada bloque.

Primera persona: I am not. Significa yo no soy o yo no estoy.

Segundas personas, bloque plural: You are not, We are not y They are not. Recuerda que en TecLingo You siempre es plural.

Terceras personas, singulares: He is not, She is not e It is not. Este ultimo significa algo no es.

Regla universal dos, para interrogar. Toda pregunta inicia siempre con el verbo auxiliar seguido por el sujeto.

Mira como el motor se mueve al frente.

Primera persona: Am I. Significa soy yo o estoy yo.

Segundas personas, plural: Are you, Are we, Are they.

Terceras personas, singular: Is he, Is she, Is it. Este ultimo significa es algo.

Resumen global final. Para redondear lo aprendido, el ingles es un sistema de bloques. El auxiliar manda en la oracion.

Si quieres negar, pones not a su derecha. Si quieres preguntar, mueves el auxiliar al inicio.

No importa la persona, si el auxiliar esta en su lugar, tu ingles es perfecto.

Para dominar estos cambios, solo recuerda los bloques de tu clase cero. Excelente trabajo.

---

[EN]
"I am not in the office."
"Are you a student?"
"He is not a teacher."
"Is she in the library?"
"It is not a book."
"Are we friends?"
"They are not happy."
"Yes, I am."
"No, he is not."
"We are not sad; we are happy."`;

await p.teacherScript.create({
  data: {
    lessonId: 'CLASE_02',
    title: 'Clase 02 - El Secreto de los Auxiliares',
    content: teacherContent,
    duration: 180
  }
});
console.log('OK - TeacherScript creado');

// ============================================================
// 6. EJERCICIOS (upsert)
// ============================================================
const exercises = [
  // GRAMMAR (10)
  { n: 1, skill: 'GRAMMAR', en: "I ___ a student in the library.", es: "Yo ___ un estudiante en la biblioteca.", opts: ['am not', 'is not', 'are not'], optsTr: ['no soy', 'no es', 'no somos'], ans: 'am not', exp: 'I + am + not (Regla Universal 1)', tts: "I am not a student in the library." },
  { n: 2, skill: 'GRAMMAR', en: "You ___ a teacher in this class.", es: "Tu ___ un maestro en esta clase.", opts: ['am not', 'is not', 'are not'], optsTr: ['no soy', 'no es', 'no eres'], ans: 'are not', exp: 'You + are + not (Bloque Plural)', tts: "You are not a teacher in this class." },
  { n: 3, skill: 'GRAMMAR', en: "He ___ in the office today.", es: "El ___ en la oficina hoy.", opts: ['am not', 'is not', 'are not'], optsTr: ['no soy', 'no esta', 'no estan'], ans: 'is not', exp: 'He + is + not (Canal 3)', tts: "He is not in the office today." },
  { n: 4, skill: 'GRAMMAR', en: "___ you a student in the library?", es: "¿___ tu un estudiante en la biblioteca?", opts: ['Am', 'Is', 'Are'], optsTr: ['Soy', 'Es', 'Eres'], ans: 'Are', exp: 'Pregunta con You: Are you (Regla Universal 2)', tts: "Are you a student in the library?" },
  { n: 5, skill: 'GRAMMAR', en: "___ she a good teacher in the office?", es: "¿___ ella una buena maestra en la oficina?", opts: ['Am', 'Is', 'Are'], optsTr: ['Soy', 'Es', 'Eres'], ans: 'Is', exp: 'Pregunta con She: Is she', tts: "Is she a good teacher in the office?" },
  { n: 6, skill: 'GRAMMAR', en: "Is Luis in the house? No, he ___.", es: "¿Esta Luis en la casa? No, el ___.", opts: ['is not', 'are not', 'am not'], optsTr: ['no esta', 'no estan', 'no estoy'], ans: 'is not', exp: 'Respuesta corta: No, he is not', tts: "No, he is not." },
  { n: 7, skill: 'GRAMMAR', en: "Are you friends? Yes, we ___.", es: "¿Son ustedes amigos? Si, nosotros ___.", opts: ['am', 'is', 'are'], optsTr: ['soy', 'es', 'somos'], ans: 'are', exp: 'Respuesta corta: Yes, we are', tts: "Yes, we are." },
  { n: 8, skill: 'GRAMMAR', en: "Identify the error: 'Is you a citizen?'", es: "Identifica el error: 'Is you a citizen?'", opts: ['Incorrect auxiliary; You requires Are', 'Missing not'], optsTr: ['Auxiliar incorrecto; You requiere Are', 'Falta not'], ans: 'Incorrect auxiliary; You requires Are', exp: 'You siempre usa ARE', tts: "Is you a citizen is incorrect. You requires are." },
  { n: 9, skill: 'GRAMMAR', en: "Where is NOT placed to form a negative sentence?", es: "¿Donde se coloca NOT para formar una negacion?", opts: ['Before the subject', 'After the auxiliary verb', 'At the very end'], optsTr: ['Antes del sujeto', 'Despues del auxiliar', 'Al final'], ans: 'After the auxiliary verb', exp: 'NOT va siempre despues del auxiliar', tts: "NOT is always placed after the auxiliary verb." },
  { n: 10, skill: 'GRAMMAR', en: "What happens to the auxiliary verb in a question?", es: "¿Que pasa con el auxiliar en una pregunta?", opts: ['Stays in the middle', 'Moves to the front, before the subject', 'Disappears'], optsTr: ['Se queda en el medio', 'Se mueve al frente, antes del sujeto', 'Desaparece'], ans: 'Moves to the front, before the subject', exp: 'El auxiliar viaja al frente', tts: "The auxiliary moves to the front, before the subject." },

  // LISTENING (10)
  { n: 1, skill: 'LISTENING', en: "Which place is being negated in the audio?", es: "¿Que lugar se niega en el audio?", opts: ['The library', 'The office'], optsTr: ['La biblioteca', 'La oficina'], ans: 'The office', exp: 'I am not in the office', tts: "I am not in the office." },
  { n: 2, skill: 'LISTENING', en: "What type of sentence did you hear?", es: "¿Que tipo de oracion escuchaste?", opts: ['An affirmation', 'A second person question'], optsTr: ['Una afirmacion', 'Una pregunta en segunda persona'], ans: 'A second person question', exp: 'Are you = pregunta', tts: "Are you a student?" },
  { n: 3, skill: 'LISTENING', en: "What is the exact translation of what you heard?", es: "¿Cual es la traduccion exacta de lo que escuchaste?", opts: ['He is not a teacher', 'He is a teacher'], optsTr: ['El no es un maestro', 'El es un maestro'], ans: 'He is not a teacher', exp: 'He is not = El no es', tts: "He is not a teacher." },
  { n: 4, skill: 'LISTENING', en: "Which place is being asked about?", es: "¿Sobre que lugar se pregunta?", opts: ['The library', 'The house'], optsTr: ['La biblioteca', 'La casa'], ans: 'The library', exp: 'Is she in the library', tts: "Is she in the library?" },
  { n: 5, skill: 'LISTENING', en: "Which object is being discarded?", es: "¿Que objeto se descarta?", opts: ['A computer', 'A book'], optsTr: ['Una computadora', 'Un libro'], ans: 'A book', exp: 'It is not a book', tts: "It is not a book." },
  { n: 6, skill: 'LISTENING', en: "What relationship is being asked in plural?", es: "¿Que relacion se consulta en plural?", opts: ['Are we friends?', 'Are they teachers?'], optsTr: ['¿Somos amigos?', '¿Son maestros?'], ans: 'Are we friends?', exp: 'Are we = pregunta plural', tts: "Are we friends?" },
  { n: 7, skill: 'LISTENING', en: "How does the group feel?", es: "¿Como se siente el grupo?", opts: ['Happy', 'Not happy'], optsTr: ['Felices', 'No estan felices'], ans: 'Not happy', exp: 'They are not happy', tts: "They are not happy." },
  { n: 8, skill: 'LISTENING', en: "What type of answer did you hear?", es: "¿Que tipo de respuesta escuchaste?", opts: ['A short affirmative answer', 'A negative answer'], optsTr: ['Una respuesta corta afirmativa', 'Una respuesta negativa'], ans: 'A short affirmative answer', exp: 'Yes, I am', tts: "Yes, I am." },
  { n: 9, skill: 'LISTENING', en: "What occupation is being asked about?", es: "¿Que ocupacion se consulta?", opts: ['Doctor', 'Teacher'], optsTr: ['Doctor', 'Maestro'], ans: 'Doctor', exp: 'Is he a doctor', tts: "Is he a doctor?" },
  { n: 10, skill: 'LISTENING', en: "Where is the group NOT located?", es: "¿Donde NO esta el grupo?", opts: ['In the city', 'In the house'], optsTr: ['En la ciudad', 'En la casa'], ans: 'In the house', exp: 'We are not in the house', tts: "We are not in the house." },

  // WRITING (10)
  { n: 1, skill: 'WRITING', en: "Translate the negation: 'Yo no soy un estudiante.'", es: "Traduce la negacion: 'Yo no soy un estudiante.'", ans: 'I am not a student', exp: 'I am not', tts: "I am not a student." },
  { n: 2, skill: 'WRITING', en: "Translate the question: '¿Eres tu un ciudadano?'", es: "Traduce la pregunta: '¿Eres tu un ciudadano?'", ans: 'Are you a citizen', exp: 'Are you (auxiliar al frente)', tts: "Are you a citizen?" },
  { n: 3, skill: 'WRITING', en: "Translate the negation: 'El no es un maestro.'", es: "Traduce la negacion: 'El no es un maestro.'", ans: 'He is not a teacher', exp: 'He is not', tts: "He is not a teacher." },
  { n: 4, skill: 'WRITING', en: "Translate the question: '¿Esta ella en la oficina?'", es: "Traduce la pregunta: '¿Esta ella en la oficina?'", ans: 'Is she in the office', exp: 'Is she (auxiliar al frente)', tts: "Is she in the office?" },
  { n: 5, skill: 'WRITING', en: "Translate the negation: 'Eso no es un libro.'", es: "Traduce la negacion: 'Eso no es un libro.'", ans: 'It is not a book', exp: 'It is not', tts: "It is not a book." },
  { n: 6, skill: 'WRITING', en: "Translate the plural negation: 'Nosotros no somos amigos.'", es: "Traduce la negacion plural: 'Nosotros no somos amigos.'", ans: 'We are not friends', exp: 'We are not', tts: "We are not friends." },
  { n: 7, skill: 'WRITING', en: "Translate the plural question: '¿Estan ellos en la biblioteca?'", es: "Traduce la pregunta plural: '¿Estan ellos en la biblioteca?'", ans: 'Are they in the library', exp: 'Are they', tts: "Are they in the library?" },
  { n: 8, skill: 'WRITING', en: "Translate the negation: 'Ella no esta en la ciudad.'", es: "Traduce la negacion: 'Ella no esta en la ciudad.'", ans: 'She is not in the city', exp: 'She is not', tts: "She is not in the city." },
  { n: 9, skill: 'WRITING', en: "Translate the question: '¿Es el un doctor?'", es: "Traduce la pregunta: '¿Es el un doctor?'", ans: 'Is he a doctor', exp: 'Is he (auxiliar al frente)', tts: "Is he a doctor?" },
  { n: 10, skill: 'WRITING', en: "Translate the short negative answer: 'No, el no esta.'", es: "Traduce la respuesta corta negativa: 'No, el no esta.'", ans: 'No, he is not', exp: 'Respuesta corta con auxiliar', tts: "No, he is not." },

  // READING (10)
  { n: 1, skill: 'READING', en: "Is Alex in the office according to the text?", es: "¿Esta Alex en la oficina segun el texto?", opts: ['Yes, he is', 'No, he is not'], optsTr: ['Si, esta', 'No, no esta'], ans: 'No, he is not', exp: 'I am not in the office', tts: "Is Alex in the office. The answer is No he is not." },
  { n: 2, skill: 'READING', en: "What is Alex occupation?", es: "¿Cual es la ocupacion de Alex?", opts: ['Alex is a student', 'Alex is a doctor'], optsTr: ['Alex es estudiante', 'Alex es doctor'], ans: 'Alex is a student', exp: 'I am a student', tts: "What is Alex occupation. The answer is Alex is a student." },
  { n: 3, skill: 'READING', en: "Where is Alex located?", es: "¿Donde esta Alex?", opts: ['In the house', 'In the big library'], optsTr: ['En la casa', 'En la biblioteca grande'], ans: 'In the big library', exp: 'I am a student in the big library', tts: "Where is Alex located. The answer is In the big library." },
  { n: 4, skill: 'READING', en: "Is Luis in the library with Alex?", es: "¿Esta Luis en la biblioteca con Alex?", opts: ['Yes, he is', 'No, he is not'], optsTr: ['Si, esta', 'No, no esta'], ans: 'No, he is not', exp: 'No, he is not', tts: "Is Luis in the library. The answer is No he is not." },
  { n: 5, skill: 'READING', en: "Where is Luis?", es: "¿Donde esta Luis?", opts: ['He is in his house', 'He is in the office'], optsTr: ['Esta en su casa', 'Esta en la oficina'], ans: 'He is in his house', exp: 'He is in his house', tts: "Where is Luis. The answer is He is in his house." },
  { n: 6, skill: 'READING', en: "Is Maria in the office?", es: "¿Esta Maria en la oficina?", opts: ['Yes, she is', 'No, she is not'], optsTr: ['Si, esta', 'No, no esta'], ans: 'Yes, she is', exp: 'Yes, she is', tts: "Is Maria in the office. The answer is Yes she is." },
  { n: 7, skill: 'READING', en: "What is Maria job?", es: "¿Cual es el trabajo de Maria?", opts: ['She is a student', 'She is a good teacher'], optsTr: ['Es estudiante', 'Es una buena maestra'], ans: 'She is a good teacher', exp: 'She is a good teacher', tts: "What is Maria job. The answer is She is a good teacher." },
  { n: 8, skill: 'READING', en: "Are Alex and Luis friends?", es: "¿Son amigos Alex y Luis?", opts: ['Yes, they are friends', 'No, they are not'], optsTr: ['Si, son amigos', 'No, no lo son'], ans: 'Yes, they are friends', exp: 'Yes, we are friends', tts: "Are Alex and Luis friends. The answer is Yes they are friends." },
  { n: 9, skill: 'READING', en: "Are they sad in this city?", es: "¿Estan tristes en esta ciudad?", opts: ['No, they are not sad; they are happy', 'Yes, they are sad'], optsTr: ['No, no estan tristes; estan felices', 'Si, estan tristes'], ans: 'No, they are not sad; they are happy', exp: 'We are not sad; we are happy', tts: "Are they sad in this city. The answer is No they are not sad they are happy." },
  { n: 10, skill: 'READING', en: "Which auxiliary is used to ask about Maria?", es: "¿Que auxiliar se usa para preguntar por Maria?", opts: ['Are', 'Is'], optsTr: ['Are', 'Is'], ans: 'Is', exp: 'Is Maria in the office? (She = Is)', tts: "Which auxiliary is used to ask about Maria. The answer is Is." },

  // SPEAKING (10)
  { n: 1, skill: 'SPEAKING', en: "Say the first person negation:", es: "Pronuncia la negacion en primera persona:", ans: 'I am not a student.', exp: 'I am not a student.', tts: "I am not a student." },
  { n: 2, skill: 'SPEAKING', en: "Say the question raising intonation at the end:", es: "Pronuncia la pregunta subiendo la entonacion:", ans: 'Are you a citizen?', exp: 'Are you a citizen?', tts: "Are you a citizen?" },
  { n: 3, skill: 'SPEAKING', en: "Say the third person negation:", es: "Pronuncia la negacion de tercera persona:", ans: 'He is not in the office.', exp: 'He is not in the office.', tts: "He is not in the office." },
  { n: 4, skill: 'SPEAKING', en: "Say the question with location:", es: "Pronuncia la pregunta con ubicacion:", ans: 'Is she in the library?', exp: 'Is she in the library?', tts: "Is she in the library?" },
  { n: 5, skill: 'SPEAKING', en: "Say the neutral negation:", es: "Pronuncia la oracion neutra negativa:", ans: 'It is not a book.', exp: 'It is not a book.', tts: "It is not a book." },
  { n: 6, skill: 'SPEAKING', en: "Say the plural negation:", es: "Pronuncia la negacion de grupo:", ans: 'We are not friends.', exp: 'We are not friends.', tts: "We are not friends." },
  { n: 7, skill: 'SPEAKING', en: "Say the plural question:", es: "Pronuncia la pregunta plural:", ans: 'Are they in the house?', exp: 'Are they in the house?', tts: "Are they in the house?" },
  { n: 8, skill: 'SPEAKING', en: "Read the affirmative short answer:", es: "Lee la respuesta corta afirmativa:", ans: 'Yes, I am.', exp: 'Yes, I am.', tts: "Yes, I am." },
  { n: 9, skill: 'SPEAKING', en: "Read the negative short answer:", es: "Lee la respuesta corta negativa:", ans: 'No, he is not.', exp: 'No, he is not.', tts: "No, he is not." },
  { n: 10, skill: 'SPEAKING', en: "Read the complete state question:", es: "Lee la pregunta completa de estado:", ans: 'Are we happy in this city?', exp: 'Are we happy in this city?', tts: "Are we happy in this city?" }
];

const skillPrefix = { GRAMMAR: 'GRAM', LISTENING: 'LIST', WRITING: 'WRIT', READING: 'READ', SPEAKING: 'SPEAK' };
let created = 0, updated = 0;

for (const e of exercises) {
  const id = 'CLASE_02_' + skillPrefix[e.skill] + '_' + String(e.n).padStart(2, '0');
  const hasOptions = Array.isArray(e.opts) && e.opts.length > 0;

  const data = {
    lessonId: 'CLASE_02',
    skill: e.skill,
    itemNumber: e.n,
    questionType: e.skill === 'LISTENING' ? 'listen_and_select' : e.skill === 'SPEAKING' ? 'read_aloud' : 'multiple_choice',
    spanishContext: e.ctx || null,
    instruction: e.skill === 'SPEAKING' ? 'Read aloud' : 'Select the correct answer',
    questionText: e.en,
    translationSentence: e.es,
    optionsJson: hasOptions ? e.opts : [],
    optionsTranslation: e.optsTr || null,
    correctAnswer: e.ans,
    explanation: e.exp || null,
    vocabularyHint: null,
    audioUrl: null,
    points: 10,
    timeLimitSec: 30,
    difficulty: 1,
    active: true,
    voz: VOZ,
    audioTTS: tts(e.tts),
    instructionTTS: tts(e.skill === 'SPEAKING' ? 'Read aloud' : 'Select the correct answer'),
    audioUI: null,
    uiDisplay: null,
    acceptedAnswers: [],
    aiToolTags: [],
    perfil: 'Alex',
    fase: 'F1',
    parrafos: 1
  };

  const existing = await p.exercise.findUnique({ where: { id } });
  if (existing) {
    await p.exercise.update({ where: { id }, data });
    updated++;
  } else {
    await p.exercise.create({ data: { id, ...data } });
    created++;
  }
}
console.log('OK - Ejercicios: ' + created + ' creados, ' + updated + ' actualizados');

// ============================================================
// RESUMEN
// ============================================================
const totalEx = await p.exercise.count({ where: { lessonId: 'CLASE_02' } });
const totalVocab = await p.vocabularyItem.count({ where: { lessonId: 'CLASE_02' } });
const totalQuick = await p.lessonQuickVocab.count({ where: { lessonId: 'CLASE_02' } });
const totalText = await p.textBase.count({ where: { lessonId: 'CLASE_02' } });
const totalTeacher = await p.teacherScript.count({ where: { lessonId: 'CLASE_02' } });

console.log('');
console.log('═══════════════════════════════════════');
console.log('  CLASE_02 COMPLETADA');
console.log('═══════════════════════════════════════');
console.log('Exercise: ' + totalEx);
console.log('VocabularyItem: ' + totalVocab);
console.log('LessonQuickVocab: ' + totalQuick);
console.log('TextBase: ' + totalText);
console.log('TeacherScript: ' + totalTeacher);

await p.$disconnect();
