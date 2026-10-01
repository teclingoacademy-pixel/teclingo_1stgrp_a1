import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const VOZ = 'male';
const VOICE_GENDER = 'male';
const tts = (text) => ({ segments: [{ text, lang: 'en', voiceGender: VOICE_GENDER }] });

// ============================================================
// 1. TEXTBASE
// ============================================================
await p.textBase.deleteMany({ where: { lessonId: 'CLASE_01' } });
const textContent = 'Hello! I am Alex and I am a student. Today, I am in the big library. This is my friend Luis; he is a student in my class too. Maria is in the office; she is a good teacher. My house is small, but it is clean. We are friends and we are happy in this city. Alex and Luis are in class now; they are very smart students.';
await p.textBase.create({
  data: {
    lessonId: 'CLASE_01',
    title: 'Hello, I am Alex',
    content: textContent,
    wordCount: textContent.split(/\s+/).length,
    difficulty: 1,
    timeAudioSec: 60,
    vocabList: ['student', 'teacher', 'library', 'office', 'house', 'city', 'class', 'classroom', 'book', 'table', 'computer', 'happy', 'big', 'small', 'clean', 'new', 'smart', 'friend', 'friends', 'citizen', 'doctor'],
    verbsList: ['am', 'is', 'are'],
    perfil: 'Alex',
    fase: 'F1',
    parrafos: 1
  }
});
console.log('OK - TextBase creado');

// ============================================================
// 2. VOCABULARYITEM (22 terminos)
// ============================================================
await p.vocabularyItem.deleteMany({ where: { lessonId: 'CLASE_01' } });
const vocabs = [
  { term: 'I am', translation: 'Yo soy / Yo estoy', type: 'conjugation', ttsText: 'I am a student', exampleUse: 'I am Alex.' },
  { term: 'You are', translation: 'Tu eres / Ustedes son', type: 'conjugation', ttsText: 'You are a citizen', exampleUse: 'You are a citizen.' },
  { term: 'He is', translation: 'El es / El esta', type: 'conjugation', ttsText: 'He is a teacher', exampleUse: 'He is a teacher.' },
  { term: 'She is', translation: 'Ella es / Ella esta', type: 'conjugation', ttsText: 'She is in the library', exampleUse: 'She is in the library.' },
  { term: 'It is', translation: 'Eso es / Eso esta', type: 'conjugation', ttsText: 'It is a new book', exampleUse: 'It is a new book.' },
  { term: 'We are', translation: 'Nosotros somos / estamos', type: 'conjugation', ttsText: 'We are friends', exampleUse: 'We are friends.' },
  { term: 'They are', translation: 'Ellos son / estan', type: 'conjugation', ttsText: 'They are in the office', exampleUse: 'They are in the office.' },
  { term: 'student', translation: 'estudiante', type: 'noun', ttsText: 'I am a student', exampleUse: 'I am a student.' },
  { term: 'teacher', translation: 'maestro/a', type: 'noun', ttsText: 'She is a teacher', exampleUse: 'She is a good teacher.' },
  { term: 'citizen', translation: 'ciudadano/a', type: 'noun', ttsText: 'You are a citizen', exampleUse: 'You are a citizen.' },
  { term: 'doctor', translation: 'medico/a', type: 'noun', ttsText: 'They are doctors', exampleUse: 'They are doctors.' },
  { term: 'library', translation: 'biblioteca', type: 'noun', ttsText: 'She is in the library', exampleUse: 'She is in the library.' },
  { term: 'office', translation: 'oficina', type: 'noun', ttsText: 'He is in the office', exampleUse: 'He is in the office.' },
  { term: 'house', translation: 'casa', type: 'noun', ttsText: 'My house is small', exampleUse: 'My house is small.' },
  { term: 'city', translation: 'ciudad', type: 'noun', ttsText: 'We are in this city', exampleUse: 'We are happy in this city.' },
  { term: 'book', translation: 'libro', type: 'noun', ttsText: 'It is a new book', exampleUse: 'It is a new book.' },
  { term: 'table', translation: 'mesa', type: 'noun', ttsText: 'The book is on the table', exampleUse: 'The book is on the table.' },
  { term: 'classroom', translation: 'salon de clase', type: 'noun', ttsText: 'We are in the classroom', exampleUse: 'We are in the classroom.' },
  { term: 'computer', translation: 'computadora', type: 'noun', ttsText: 'The computer is new', exampleUse: 'The computer is new.' },
  { term: 'happy', translation: 'feliz', type: 'adjective', ttsText: 'We are happy', exampleUse: 'We are happy today.' },
  { term: 'big', translation: 'grande', type: 'adjective', ttsText: 'The city is big', exampleUse: 'The city is big.' },
  { term: 'small', translation: 'pequeno/a', type: 'adjective', ttsText: 'My house is small', exampleUse: 'My house is small.' }
];
for (const v of vocabs) {
  await p.vocabularyItem.create({
    data: {
      lessonId: 'CLASE_01', term: v.term, translation: v.translation,
      type: v.type, ttsText: v.ttsText, lang: 'en', exampleUse: v.exampleUse, tags: [v.type]
    }
  });
}
console.log('OK - ' + vocabs.length + ' VocabularyItem creados');

// ============================================================
// 3. LESSONQUICKVOCAB
// ============================================================
await p.lessonQuickVocab.deleteMany({ where: { lessonId: 'CLASE_01' } });
const quickVocab = [
  { order: 1, word: 'I am', translation: 'Yo soy / Yo estoy' },
  { order: 2, word: 'You are', translation: 'Tu eres / Ustedes son' },
  { order: 3, word: 'He is / She is', translation: 'El es / Ella es' },
  { order: 4, word: 'We are', translation: 'Nosotros somos' },
  { order: 5, word: 'They are', translation: 'Ellos son' },
  { order: 6, word: 'student', translation: 'estudiante' }
];
for (const q of quickVocab) {
  await p.lessonQuickVocab.create({
    data: { lessonId: 'CLASE_01', order: q.order, word: q.word, translation: q.translation }
  });
}
console.log('OK - ' + quickVocab.length + ' LessonQuickVocab creados');

// ============================================================
// 4. TEACHERSCRIPT
// ============================================================
await p.teacherScript.deleteMany({ where: { lessonId: 'CLASE_01' } });
const teacherContent = `[ES]
Bienvenidos a la Clase 01 de TecLingo. Hoy dominaremos el verbo to be, que significa ser o estar.

En TecLingo, para que tu aprendizaje sea infalible, dividimos este verbo en tres bloques logicos segun la persona.

Primero, la primera persona. El pronombre I, que significa yo, es unico y siempre se acompana de am. I am significa yo soy o yo estoy.

Segundo, el bloque plural o bloque are. Aqui agrupamos a You, que significa tu o ustedes; We, que significa nosotros; y They, que significa ellos.

Como aprendiste en la clase cero, nuestra Regla de Oro es que You siempre es plural.

Por eso, en este bloque decimos: You are, que significa tu eres o tu estas; We are, que significa nosotros somos o nosotros estamos; They are, que significa ellos son o ellos estan.

Tercero, las terceras personas o el bloque is. Aqui entran los singulares externos: He, que significa el; She, que significa ella; e It, que significa algo. Todos ellos usan is.

He is, que significa el es o el esta. She is, que significa ella es o ella esta. It is, que significa eso es o eso esta.

Resumen global. Para redondear, observa este mapa global. El ingles se vuelve sencillo cuando lo ves por bloques.

Tienes el saco del am para ti mismo, el saco del are para todos los plurales incluyendo siempre a You, y el saco del is para las terceras personas.

Cada conjugacion cubre tanto el ser como el estar. Domina estos tres bloques y habras conquistado la base real del idioma.

Si tienes dudas sobre por que dividimos asi a las personas, recuerda revisar la clase cero para ver los detalles de los bloques. Excelente trabajo.

---

[EN]
"I am a student."
"You are a citizen."
"He is a teacher."
"She is in the library."
"It is a new book."
"We are friends."
"They are in the office."
"I am happy today."
"The city is big."
"We are in the classroom."`;

await p.teacherScript.create({
  data: {
    lessonId: 'CLASE_01',
    title: 'Clase 01 - Dominando el Verbo To Be',
    content: teacherContent,
    duration: 180
  }
});
console.log('OK - TeacherScript creado');

// ============================================================
// 5. EJERCICIOS (con upsert y SIN español en las preguntas)
// ============================================================
const exercises = [
  // GRAMMAR (10) - Todas las preguntas en INGLES
  { n: 1, skill: 'GRAMMAR', en: "I ___ a student in the library.", es: "Yo ___ un estudiante en la biblioteca.", opts: ['am', 'is', 'are'], optsTr: ['soy/estoy', 'es/esta', 'somos/estan'], ans: 'am', exp: 'I always uses AM (Channel 1)', tts: "I am a student in the library." },
  { n: 2, skill: 'GRAMMAR', en: "You ___ a citizen in this city.", es: "Tu ___ un ciudadano en esta ciudad.", opts: ['am', 'is', 'are'], optsTr: ['soy/estoy', 'es/esta', 'eres/estas'], ans: 'are', exp: 'You always uses ARE (Channel 2)', tts: "You are a citizen in this city." },
  { n: 3, skill: 'GRAMMAR', en: "He ___ a teacher in the office.", es: "El ___ un maestro en la oficina.", opts: ['am', 'is', 'are'], optsTr: ['soy/estoy', 'es/esta', 'eres/estas'], ans: 'is', exp: 'He uses IS (Channel 3)', tts: "He is a teacher in the office." },
  { n: 4, skill: 'GRAMMAR', en: "She ___ in the big library today.", es: "Ella ___ en la biblioteca grande hoy.", opts: ['am', 'is', 'are'], optsTr: ['soy/estoy', 'es/esta', 'eres/estas'], ans: 'is', exp: 'She uses IS (Channel 3)', tts: "She is in the big library today." },
  { n: 5, skill: 'GRAMMAR', en: "It ___ a new book on the table.", es: "Eso ___ un libro nuevo en la mesa.", opts: ['am', 'is', 'are'], optsTr: ['soy/estoy', 'es/esta', 'eres/estas'], ans: 'is', exp: 'It uses IS (Channel 3)', tts: "It is a new book on the table." },
  { n: 6, skill: 'GRAMMAR', en: "We ___ friends in the classroom.", es: "Nosotros ___ amigos en el salon.", opts: ['am', 'is', 'are'], optsTr: ['soy/estoy', 'es/esta', 'somos/estan'], ans: 'are', exp: 'We uses ARE (Channel 2)', tts: "We are friends in the classroom." },
  { n: 7, skill: 'GRAMMAR', en: "They ___ doctors in this hospital.", es: "Ellos ___ medicos en este hospital.", opts: ['am', 'is', 'are'], optsTr: ['soy/estoy', 'es/esta', 'son/estan'], ans: 'are', exp: 'They uses ARE (Channel 2)', tts: "They are doctors in this hospital." },
  { n: 8, skill: 'GRAMMAR', en: "Identify the error: 'He am a student.'", es: "Identifica el error: 'He am a student.'", opts: ['He requires IS (Channel 3)', 'He requires ARE'], optsTr: ['El requiere IS (Canal 3)', 'El requiere ARE'], ans: 'He requires IS (Channel 3)', exp: 'He belongs to Channel 3', tts: "He am a student is incorrect. He requires is." },
  { n: 9, skill: 'GRAMMAR', en: "Identify the error: 'Am a teacher.'", es: "Identifica el error: 'Am a teacher.'", opts: ['The pronoun is mandatory in English', 'Am must go at the end'], optsTr: ['El pronombre es obligatorio en ingles', 'Am debe ir al final'], ans: 'The pronoun is mandatory in English', exp: 'Subject is never omitted in English', tts: "Am a teacher is incorrect. The pronoun is mandatory in English." },
  { n: 10, skill: 'GRAMMAR', en: "To which channel does the pronoun 'We' belong?", es: "A que canal pertenece el pronombre 'We'?", opts: ['Channel 1 (AM)', 'Channel 2 (ARE)', 'Channel 3 (IS)'], optsTr: ['Canal 1 (AM)', 'Canal 2 (ARE)', 'Canal 3 (IS)'], ans: 'Channel 2 (ARE)', exp: 'We is in the Plural Block (Channel 2)', tts: "The pronoun We belongs to Channel 2, the ARE block." },

  // LISTENING (10)
  { n: 1, skill: 'LISTENING', en: "What is the exact translation of what you heard?", es: "Cual es la traduccion exacta de lo que escuchaste?", opts: ['I am a student', 'You are a student'], optsTr: ['Yo soy un estudiante', 'Tu eres un estudiante'], ans: 'I am a student', exp: 'I am = Yo soy', tts: "I am a student." },
  { n: 2, skill: 'LISTENING', en: "Which conjugation did the pronoun 'You' use?", es: "Que conjugacion uso el pronombre 'You'?", opts: ['am', 'are'], optsTr: ['soy/estoy', 'eres/estas'], ans: 'are', exp: 'You always uses ARE', tts: "You are a citizen." },
  { n: 3, skill: 'LISTENING', en: "Where is he according to the audio?", es: "Donde esta el segun el audio?", opts: ['In the office', 'In the library'], optsTr: ['En la oficina', 'En la biblioteca'], ans: 'In the office', exp: 'He is in the office', tts: "He is in the office." },
  { n: 4, skill: 'LISTENING', en: "What profession is mentioned?", es: "Que profesion se menciona?", opts: ['Student', 'Teacher'], optsTr: ['Estudiante', 'Maestra'], ans: 'Teacher', exp: 'She is a teacher', tts: "She is a good teacher." },
  { n: 5, skill: 'LISTENING', en: "How is the house described?", es: "Como se describe la casa?", opts: ['Small', 'Big'], optsTr: ['Pequena', 'Grande'], ans: 'Big', exp: 'It is a big house', tts: "It is a big house." },
  { n: 6, skill: 'LISTENING', en: "Who is the friendship relationship referring to?", es: "A quienes se refiere la relacion de amistad?", opts: ['Us', 'Them'], optsTr: ['Nosotros', 'Ellos'], ans: 'Us', exp: 'We = nosotros', tts: "We are friends." },
  { n: 7, skill: 'LISTENING', en: "Where are they?", es: "Donde estan ellos?", opts: ['In the library', 'In the house'], optsTr: ['En la biblioteca', 'En la casa'], ans: 'In the library', exp: 'They are in the library', tts: "They are in the library." },
  { n: 8, skill: 'LISTENING', en: "How does the person feel today?", es: "Como se siente la persona hoy?", opts: ['Happy', 'Sad'], optsTr: ['Feliz', 'Triste'], ans: 'Happy', exp: 'I am happy', tts: "I am happy today." },
  { n: 9, skill: 'LISTENING', en: "Which auxiliary corresponds to Maria (She)?", es: "Que auxiliar le corresponde a Maria (She)?", opts: ['is', 'are'], optsTr: ['es/esta', 'eres/estas'], ans: 'is', exp: 'She uses IS', tts: "Maria is a student." },
  { n: 10, skill: 'LISTENING', en: "Why is the auxiliary 'are' used?", es: "Por que se usa el auxiliar 'are'?", opts: ['Because Alex and Luis = They (Plural)', 'Because it refers to one person'], optsTr: ['Porque Alex y Luis = They (Plural)', 'Porque habla de una sola persona'], ans: 'Because Alex and Luis = They (Plural)', exp: 'Alex and Luis = They = Plural Block', tts: "Alex and Luis are friends." },

  // WRITING (10)
  { n: 1, skill: 'WRITING', en: "Translate: 'Yo soy un estudiante.'", es: "Traduce: 'Yo soy un estudiante.'", ans: 'I am a student', exp: 'I am = Yo soy', tts: "I am a student." },
  { n: 2, skill: 'WRITING', en: "Translate: 'Tu eres un ciudadano.'", es: "Traduce: 'Tu eres un ciudadano.'", ans: 'You are a citizen', exp: 'You are = Tu eres', tts: "You are a citizen." },
  { n: 3, skill: 'WRITING', en: "Translate: 'El es un maestro.'", es: "Traduce: 'El es un maestro.'", ans: 'He is a teacher', exp: 'He is = El es', tts: "He is a teacher." },
  { n: 4, skill: 'WRITING', en: "Translate: 'Ella esta en la biblioteca.'", es: "Traduce: 'Ella esta en la biblioteca.'", ans: 'She is in the library', exp: 'She is = Ella esta', tts: "She is in the library." },
  { n: 5, skill: 'WRITING', en: "Translate: 'Eso es un libro nuevo.'", es: "Traduce: 'Eso es un libro nuevo.'", ans: 'It is a new book', exp: 'It is = Eso es', tts: "It is a new book." },
  { n: 6, skill: 'WRITING', en: "Translate: 'Nosotros somos amigos.'", es: "Traduce: 'Nosotros somos amigos.'", ans: 'We are friends', exp: 'We are = Nosotros somos', tts: "We are friends." },
  { n: 7, skill: 'WRITING', en: "Translate: 'Ellos estan en la oficina.'", es: "Traduce: 'Ellos estan en la oficina.'", ans: 'They are in the office', exp: 'They are = Ellos estan', tts: "They are in the office." },
  { n: 8, skill: 'WRITING', en: "Translate: 'Yo estoy feliz hoy.'", es: "Traduce: 'Yo estoy feliz hoy.'", ans: 'I am happy today', exp: 'I am = Yo estoy', tts: "I am happy today." },
  { n: 9, skill: 'WRITING', en: "Translate: 'La ciudad es grande.'", es: "Traduce: 'La ciudad es grande.'", ans: 'The city is big', exp: 'The city is = La ciudad es', tts: "The city is big." },
  { n: 10, skill: 'WRITING', en: "Translate: 'Nosotros estamos en la clase.'", es: "Traduce: 'Nosotros estamos en la clase.'", ans: 'We are in the classroom', exp: 'We are = Nosotros estamos', tts: "We are in the classroom." },

  // READING (10)
  { n: 1, skill: 'READING', en: "Who is Alex according to the text?", es: "Quien es Alex segun el texto?", opts: ['Alex is a student', 'Alex is a teacher'], optsTr: ['Alex es estudiante', 'Alex es maestro'], ans: 'Alex is a student', exp: 'I am a student', tts: "Who is Alex according to the text. The answer is Alex is a student." },
  { n: 2, skill: 'READING', en: "Where is Alex today?", es: "Donde esta Alex hoy?", opts: ['In the office', 'In the big library'], optsTr: ['En la oficina', 'En la biblioteca grande'], ans: 'In the big library', exp: 'I am in the big library', tts: "Where is Alex today. The answer is In the big library." },
  { n: 3, skill: 'READING', en: "Who is Luis?", es: "Quien es Luis?", opts: ["A student in Alex's class", 'A doctor'], optsTr: ['Un estudiante en la clase de Alex', 'Un medico'], ans: "A student in Alex's class", exp: 'He is a student in my class', tts: "Who is Luis. The answer is A student in Alex class." },
  { n: 4, skill: 'READING', en: "Where is Maria located?", es: "Donde esta Maria?", opts: ['In the office', 'In the house'], optsTr: ['En la oficina', 'En la casa'], ans: 'In the office', exp: 'Maria is in the office', tts: "Where is Maria located. The answer is In the office." },
  { n: 5, skill: 'READING', en: "What is Maria's profession?", es: "Cual es la profesion de Maria?", opts: ['She is a good teacher', 'She is a student'], optsTr: ['Ella es una buena maestra', 'Ella es estudiante'], ans: 'She is a good teacher', exp: 'She is a good teacher', tts: "What is Maria profession. The answer is She is a good teacher." },
  { n: 6, skill: 'READING', en: "How is Alex's house described?", es: "Como se describe la casa de Alex?", opts: ['Small but clean', 'Big and dirty'], optsTr: ['Pequena pero limpia', 'Grande y sucia'], ans: 'Small but clean', exp: 'My house is small, but it is clean', tts: "How is Alex house described. The answer is Small but clean." },
  { n: 7, skill: 'READING', en: "Are Alex and Luis friends?", es: "Son amigos Alex y Luis?", opts: ['Yes, they are friends', 'No, they are not'], optsTr: ['Si, son amigos', 'No, no lo son'], ans: 'Yes, they are friends', exp: 'We are friends', tts: "Are Alex and Luis friends. The answer is Yes they are friends." },
  { n: 8, skill: 'READING', en: "How do they feel in the city?", es: "Como se sienten en la ciudad?", opts: ['They are happy', 'They are sad'], optsTr: ['Estan felices', 'Estan tristes'], ans: 'They are happy', exp: 'We are happy in this city', tts: "How do they feel in the city. The answer is They are happy." },
  { n: 9, skill: 'READING', en: "Where are Alex and Luis now?", es: "Donde estan Alex y Luis ahora?", opts: ['They are in class', 'They are in the park'], optsTr: ['Estan en clase', 'Estan en el parque'], ans: 'They are in class', exp: 'They are in class now', tts: "Where are Alex and Luis now. The answer is They are in class." },
  { n: 10, skill: 'READING', en: "What pronoun replaces 'my house' in 'it is clean'?", es: "Que pronombre reemplaza 'my house' en 'it is clean'?", opts: ['It', 'He'], optsTr: ['It (Eso)', 'He (El)'], ans: 'It', exp: 'It replaces my house', tts: "What pronoun replaces my house. The answer is It." },

  // SPEAKING (10)
  { n: 1, skill: 'SPEAKING', en: "Say the first person sentence (Channel 1):", es: "Pronuncia la oracion de primera persona (Canal 1):", ans: 'I am a student.', exp: 'I am a student.', tts: "I am a student." },
  { n: 2, skill: 'SPEAKING', en: "Say the second person sentence (Channel 2 - You):", es: "Pronuncia la oracion de segunda persona (Canal 2 - You):", ans: 'You are a citizen.', exp: 'You are a citizen.', tts: "You are a citizen." },
  { n: 3, skill: 'SPEAKING', en: "Say the third person masculine sentence (Channel 3):", es: "Pronuncia la oracion de tercera persona masculino (Canal 3):", ans: 'He is a teacher.', exp: 'He is a teacher.', tts: "He is a teacher." },
  { n: 4, skill: 'SPEAKING', en: "Say the sentence with location (Channel 3 - Feminine):", es: "Pronuncia la oracion con ubicacion (Canal 3 - Femenino):", ans: 'She is in the library.', exp: 'She is in the library.', tts: "She is in the library." },
  { n: 5, skill: 'SPEAKING', en: "Say the sentence with a neutral object (Channel 3):", es: "Pronuncia la oracion con objeto neutro (Canal 3):", ans: 'It is a new book.', exp: 'It is a new book.', tts: "It is a new book." },
  { n: 6, skill: 'SPEAKING', en: "Say the group sentence (Channel 2 - We):", es: "Pronuncia la oracion de grupo (Canal 2 - We):", ans: 'We are friends.', exp: 'We are friends.', tts: "We are friends." },
  { n: 7, skill: 'SPEAKING', en: "Say the plural sentence (Channel 2 - They):", es: "Pronuncia la oracion plural (Canal 2 - They):", ans: 'They are in the office.', exp: 'They are in the office.', tts: "They are in the office." },
  { n: 8, skill: 'SPEAKING', en: "Read the sentence expressing mood:", es: "Lee la oracion expresando estado de animo:", ans: 'I am happy today.', exp: 'I am happy today.', tts: "I am happy today." },
  { n: 9, skill: 'SPEAKING', en: "Read the sentence with citizen location:", es: "Lee la oracion de ubicacion ciudadana:", ans: 'She is in the big city.', exp: 'She is in the big city.', tts: "She is in the big city." },
  { n: 10, skill: 'SPEAKING', en: "Read the school group sentence:", es: "Lee la oracion de grupo escolar:", ans: 'We are in the classroom.', exp: 'We are in the classroom.', tts: "We are in the classroom." }
];

const skillPrefix = { GRAMMAR: 'GRAM', LISTENING: 'LIST', WRITING: 'WRIT', READING: 'READ', SPEAKING: 'SPEAK' };
let created = 0, updated = 0;

for (const e of exercises) {
  const id = 'CLASE_01_' + skillPrefix[e.skill] + '_' + String(e.n).padStart(2, '0');
  const hasOptions = Array.isArray(e.opts) && e.opts.length > 0;

  const data = {
    lessonId: 'CLASE_01',
    skill: e.skill,
    itemNumber: e.n,
    questionType: e.skill === 'LISTENING' ? 'listen_and_select' : e.skill === 'SPEAKING' ? 'read_aloud' : 'multiple_choice',
    spanishContext: null,
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
const totalEx = await p.exercise.count({ where: { lessonId: 'CLASE_01' } });
const totalVocab = await p.vocabularyItem.count({ where: { lessonId: 'CLASE_01' } });
const totalQuick = await p.lessonQuickVocab.count({ where: { lessonId: 'CLASE_01' } });
const totalText = await p.textBase.count({ where: { lessonId: 'CLASE_01' } });
const totalTeacher = await p.teacherScript.count({ where: { lessonId: 'CLASE_01' } });

console.log('');
console.log('═══════════════════════════════════════');
console.log('  CLASE_01 COMPLETADA');
console.log('═══════════════════════════════════════');
console.log('Exercise: ' + totalEx);
console.log('VocabularyItem: ' + totalVocab);
console.log('LessonQuickVocab: ' + totalQuick);
console.log('TextBase: ' + totalText);
console.log('TeacherScript: ' + totalTeacher);

await p.$disconnect();
