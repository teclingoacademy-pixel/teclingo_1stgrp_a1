import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const VOZ = 'male';
const VOICE_GENDER = 'male';
const tts = (text) => ({ segments: [{ text, lang: 'en', voiceGender: VOICE_GENDER }] });

// ============================================================
// 1. VIDEO URL
// ============================================================
await p.lesson.update({
  where: { id: 'CLASE_03' },
  data: {
    videoUrl: 'https://youtube.com/shorts/dL3SVdWFfOs',
    description: 'El Poder del Apostrofe (Contracciones)',
    temaPrincipal: 'Apostrofe - Contracciones'
  }
});
console.log('OK - videoUrl actualizado');

// ============================================================
// 2. TEXTBASE
// ============================================================
await p.textBase.deleteMany({ where: { lessonId: 'CLASE_03' } });
const textContent = "Hello! I'm Alex. I'm a student in the library, but I'm not in the office. He's Luis; he's my classmate and he isn't sad today. She's Maria; she's a teacher, but she isn't in the classroom now. Look at our classroom: it's big and it isn't dirty. We're friends and we aren't tired. Look at Alex and Luis: they're students and they aren't at home.";
await p.textBase.create({
  data: {
    lessonId: 'CLASE_03',
    title: "Hello, I'm Alex",
    content: textContent,
    wordCount: textContent.split(/\s+/).length,
    difficulty: 1,
    timeAudioSec: 60,
    vocabList: ['student', 'classmate', 'teacher', 'library', 'office', 'house', 'classroom', 'computer', 'book', 'table', 'happy', 'sad', 'smart', 'small', 'big', 'clean', 'new', 'tired'],
    verbsList: ["'m", "'re", "'s", "isn't", "aren't"],
    perfil: 'Alex',
    fase: 'F1',
    parrafos: 1
  }
});
console.log('OK - TextBase creado');

// ============================================================
// 3. VOCABULARYITEM
// ============================================================
await p.vocabularyItem.deleteMany({ where: { lessonId: 'CLASE_03' } });
const vocabs = [
  { term: "I'm", translation: 'Yo soy / Yo estoy', type: 'contraction', ttsText: "I'm a student", exampleUse: "I'm a student." },
  { term: "You're", translation: 'Tu eres / Ustedes son', type: 'contraction', ttsText: "You're my classmate", exampleUse: "You're my classmate." },
  { term: "He's", translation: 'El es / El esta', type: 'contraction', ttsText: "He's my classmate", exampleUse: "He's my classmate." },
  { term: "She's", translation: 'Ella es / Ella esta', type: 'contraction', ttsText: "She's a teacher", exampleUse: "She's a teacher." },
  { term: "It's", translation: 'Eso es / Eso esta', type: 'contraction', ttsText: "It's a new computer", exampleUse: "It's a new computer." },
  { term: "We're", translation: 'Nosotros somos / estamos', type: 'contraction', ttsText: "We're friends", exampleUse: "We're friends." },
  { term: "They're", translation: 'Ellos son / estan', type: 'contraction', ttsText: "They're students", exampleUse: "They're students." },
  { term: "I'm not", translation: 'Yo no soy / no estoy', type: 'neg_contraction', ttsText: "I'm not in the office", exampleUse: "I'm not in the office." },
  { term: "aren't", translation: 'No eres / no son', type: 'neg_contraction', ttsText: "They aren't tired", exampleUse: "They aren't tired." },
  { term: "isn't", translation: 'No es / no esta', type: 'neg_contraction', ttsText: "She isn't sad", exampleUse: "She isn't sad." },
  { term: 'student', translation: 'estudiante', type: 'noun', ttsText: "I'm a student", exampleUse: "I'm a student." },
  { term: 'classmate', translation: 'companero/a', type: 'noun', ttsText: "He's my classmate", exampleUse: "He's my classmate." },
  { term: 'teacher', translation: 'maestro/a', type: 'noun', ttsText: "She's a teacher", exampleUse: "She's a teacher." },
  { term: 'library', translation: 'biblioteca', type: 'noun', ttsText: "I'm in the library", exampleUse: "I'm in the library." },
  { term: 'office', translation: 'oficina', type: 'noun', ttsText: "I'm not in the office", exampleUse: "I'm not in the office." },
  { term: 'classroom', translation: 'salon de clase', type: 'noun', ttsText: "It's big and clean", exampleUse: "It's big and clean." },
  { term: 'computer', translation: 'computadora', type: 'noun', ttsText: "It's a new computer", exampleUse: "It's a new computer." },
  { term: 'house', translation: 'casa', type: 'noun', ttsText: "They aren't at home", exampleUse: "They aren't at home." },
  { term: 'book', translation: 'libro', type: 'noun', ttsText: "It's a book", exampleUse: "It's a book." },
  { term: 'table', translation: 'mesa', type: 'noun', ttsText: "The book is on the table", exampleUse: "The book is on the table." },
  { term: 'happy', translation: 'feliz', type: 'adjective', ttsText: "We're happy", exampleUse: "We're happy today." },
  { term: 'sad', translation: 'triste', type: 'adjective', ttsText: "He isn't sad", exampleUse: "He isn't sad today." },
  { term: 'smart', translation: 'inteligente', type: 'adjective', ttsText: "She's smart", exampleUse: "She's smart." },
  { term: 'tired', translation: 'cansado/a', type: 'adjective', ttsText: "We aren't tired", exampleUse: "We aren't tired." },
  { term: 'clean', translation: 'limpio/a', type: 'adjective', ttsText: "It isn't dirty", exampleUse: "It's clean, it isn't dirty." },
  { term: 'new', translation: 'nuevo/a', type: 'adjective', ttsText: "It's new", exampleUse: "It's a new computer." },
  { term: 'big', translation: 'grande', type: 'adjective', ttsText: "It's big", exampleUse: "It's big." },
  { term: 'small', translation: 'pequeno/a', type: 'adjective', ttsText: "It's small", exampleUse: "It's small." }
];
for (const v of vocabs) {
  await p.vocabularyItem.create({
    data: {
      lessonId: 'CLASE_03', term: v.term, translation: v.translation,
      type: v.type, ttsText: v.ttsText, lang: 'en', exampleUse: v.exampleUse, tags: [v.type]
    }
  });
}
console.log('OK - ' + vocabs.length + ' VocabularyItem creados');

// ============================================================
// 4. LESSONQUICKVOCAB
// ============================================================
await p.lessonQuickVocab.deleteMany({ where: { lessonId: 'CLASE_03' } });
const quickVocab = [
  { order: 1, word: "I'm", translation: 'Yo soy / Yo estoy' },
  { order: 2, word: "You're", translation: 'Tu eres / Ustedes son' },
  { order: 3, word: "He's / She's / It's", translation: 'El / Ella / Eso es' },
  { order: 4, word: "We're / They're", translation: 'Nosotros / Ellos son' },
  { order: 5, word: "aren't", translation: 'No son / no estan' },
  { order: 6, word: "isn't", translation: 'No es / no esta' }
];
for (const q of quickVocab) {
  await p.lessonQuickVocab.create({
    data: { lessonId: 'CLASE_03', order: q.order, word: q.word, translation: q.translation }
  });
}
console.log('OK - ' + quickVocab.length + ' LessonQuickVocab creados');

// ============================================================
// 5. TEACHERSCRIPT
// ============================================================
await p.teacherScript.deleteMany({ where: { lessonId: 'CLASE_03' } });
const teacherContent = `[ES]
Atencion, antes de avanzar debes conocer al apostrofe. Esta pequena coma flotante sirve para dos funciones principales. Primero, para reducir y unir auxiliares con pronombres o negaciones. Segundo, para indicar posesion, un tema que veremos en la siguiente clase.

Hoy nos enfocaremos en la union. En ingles el pronombre nunca se omite, pero para hablar con fluidez lo unimos a su auxiliar.

En la afirmacion: pronombre mas auxiliar.

Bloque uno. I am se une como I'm. Significa yo soy o yo estoy.

Bloque dos, plurales. You are se une como You're. We are se une como We're. They are se une como They're.

Bloque tres, singulares. He is se une como He's. She is se une como She's. It is se une como It's.

Ahora presta mucha atencion a la regla universal de negacion. Si vas a negar, el auxiliar se pone completo y se le pega la terminacion nt.

Para el bloque plural usamos aren't. Para el bloque singular usamos isn't.

Nota importante. El auxiliar am es la unica excepcion a esta regla. Nunca se pega al not para formar amn't. Para decir yo no soy, siempre diremos I am not o la union afirmativa I'm not.

Domina este mapa visual del apostrofe y tu ingles sonara natural y profesional. Excelente progreso.

---

[EN]
"I'm a student."
"You're my classmate."
"He's my classmate."
"She's a teacher."
"It's a new computer."
"We're friends."
"They're students."
"I'm not in the office."
"He isn't a teacher."
"She isn't in the library."
"We aren't tired."
"They aren't at home."`;

await p.teacherScript.create({
  data: {
    lessonId: 'CLASE_03',
    title: 'Clase 03 - El Poder del Apostrofe',
    content: teacherContent,
    duration: 180
  }
});
console.log('OK - TeacherScript creado');

// ============================================================
// 6. EJERCICIOS
// ============================================================
const exercises = [
  // GRAMMAR (10)
  { n: 1, skill: 'GRAMMAR', en: "Select the correct affirmative contraction for 'I am a student':", es: "Selecciona la contraccion afirmativa correcta:", opts: ["I's a student", "I'm a student", "I're a student"], optsTr: ["I's a student", "I'm a student", "I're a student"], ans: "I'm a student", exp: "I am = I'm", tts: "I'm a student." },
  { n: 2, skill: 'GRAMMAR', en: "Select the correct negative contraction for 'She is not in the classroom':", es: "Selecciona la contraccion negativa correcta:", opts: ["She aren't in the classroom", "She isn't in the classroom", "She amn't in the classroom"], optsTr: ["She aren't", "She isn't", "She amn't"], ans: "She isn't in the classroom", exp: "is + not = isn't", tts: "She isn't in the classroom." },
  { n: 3, skill: 'GRAMMAR', en: "Select the correct negative contraction for 'They are not tired':", es: "Selecciona la contraccion negativa correcta:", opts: ["They isn't tired", "They aren't tired", "They am not tired"], optsTr: ["They isn't", "They aren't", "They am not"], ans: "They aren't tired", exp: "are + not = aren't", tts: "They aren't tired." },
  { n: 4, skill: 'GRAMMAR', en: "What is the correct way to form the negative contraction for 'I am not'?", es: "Cual es la forma correcta de 'I am not'?", opts: ["I amn't", "I'm not", "I'sn't"], optsTr: ["I amn't", "I'm not", "I'sn't"], ans: "I'm not", exp: "am + not = I'm not (nunca amn't)", tts: "I'm not." },
  { n: 5, skill: 'GRAMMAR', en: "Select the correct affirmative contraction for 'It is a new computer':", es: "Selecciona la contraccion afirmativa correcta:", opts: ["It's a new computer", "It're a new computer", "It'm a new computer"], optsTr: ["It's", "It're", "It'm"], ans: "It's a new computer", exp: "It is = It's", tts: "It's a new computer." },
  { n: 6, skill: 'GRAMMAR', en: "Select the correct negative contraction for 'We are not sad':", es: "Selecciona la contraccion negativa correcta:", opts: ["We isn't sad", "We aren't sad", "We amn't sad"], optsTr: ["We isn't", "We aren't", "We amn't"], ans: "We aren't sad", exp: "are + not = aren't", tts: "We aren't sad." },
  { n: 7, skill: 'GRAMMAR', en: "Select the correct affirmative contraction for 'You are my classmate':", es: "Selecciona la contraccion afirmativa correcta:", opts: ["You're my classmate", "You's my classmate", "You'm my classmate"], optsTr: ["You're", "You's", "You'm"], ans: "You're my classmate", exp: "You are = You're", tts: "You're my classmate." },
  { n: 8, skill: 'GRAMMAR', en: "Identify the error: 'I amn't in the office.'", es: "Identifica el error:", opts: ["amn't does not exist; use I'm not", "Missing pronoun"], optsTr: ["amn't no existe; usa I'm not", "Falta pronombre"], ans: "amn't does not exist; use I'm not", exp: "amn't no existe", tts: "I amn't is incorrect. The correct form is I'm not." },
  { n: 9, skill: 'GRAMMAR', en: "Identify the error: 'He is's a teacher.'", es: "Identifica el error:", opts: ["Redundant verb To Be; use He's", "He cannot be contracted"], optsTr: ["Redundante; usa He's", "He no se contrae"], ans: "Redundant verb To Be; use He's", exp: "No se duplica To Be", tts: "He is's is incorrect. The correct form is He's a teacher." },
  { n: 10, skill: 'GRAMMAR', en: "Which negative contraction is used for the plural block?", es: "Que contraccion negativa usa el bloque plural?", opts: ["isn't", "aren't", "amn't"], optsTr: ["isn't", "aren't", "amn't"], ans: "aren't", exp: "Plural usa aren't", tts: "The plural block uses aren't." },

  // LISTENING (10)
  { n: 1, skill: 'LISTENING', en: "What negative structure did you hear?", es: "Que estructura negativa escuchaste?", opts: ["I'm not", "He isn't"], optsTr: ["Yo no estoy", "El no esta"], ans: "I'm not", exp: "I'm not = Yo no estoy", tts: "I'm not in the office." },
  { n: 2, skill: 'LISTENING', en: "What is the translation of what you heard?", es: "Cual es la traduccion?", opts: ["She isn't a teacher", "She is a teacher"], optsTr: ["Ella no es maestra", "Ella es maestra"], ans: "She isn't a teacher", exp: "isn't = no es", tts: "She isn't a teacher." },
  { n: 3, skill: 'LISTENING', en: "What affirmative group contraction did you hear?", es: "Que contraccion afirmativa escuchaste?", opts: ["We're", "They're"], optsTr: ["We're", "They're"], ans: "We're", exp: "We're = Nosotros somos", tts: "We're happy today." },
  { n: 4, skill: 'LISTENING', en: "Where is the group NOT located?", es: "Donde NO esta el grupo?", opts: ["The office", "The library"], optsTr: ["La oficina", "La biblioteca"], ans: "The library", exp: "aren't in the library", tts: "They aren't in the library." },
  { n: 5, skill: 'LISTENING', en: "Who is the affirmative sentence referring to?", es: "A quien se refiere?", opts: ["He's", "We're"], optsTr: ["El", "Nosotros"], ans: "He's", exp: "He's = El es", tts: "He's my classmate." },
  { n: 6, skill: 'LISTENING', en: "How is the object described?", es: "Como se describe el objeto?", opts: ["It isn't a new computer", "It is a new computer"], optsTr: ["No es nueva", "Es nueva"], ans: "It isn't a new computer", exp: "It isn't = No es", tts: "It isn't a new computer." },
  { n: 7, skill: 'LISTENING', en: "What mood is negated for the second person?", es: "Que estado se niega?", opts: ["Tired", "Happy"], optsTr: ["Cansado", "Feliz"], ans: "Tired", exp: "You aren't tired", tts: "You aren't tired." },
  { n: 8, skill: 'LISTENING', en: "What affirmative sentence did you hear?", es: "Que oracion afirmativa escuchaste?", opts: ["I'm a student", "I'm not a student"], optsTr: ["Soy estudiante", "No soy estudiante"], ans: "I'm a student", exp: "I'm a student", tts: "I'm a student." },
  { n: 9, skill: 'LISTENING', en: "What adjective is affirmed about her?", es: "Que adjetivo se afirma?", opts: ["Smart", "Sad"], optsTr: ["Inteligente", "Triste"], ans: "Smart", exp: "She's smart", tts: "She's smart." },
  { n: 10, skill: 'LISTENING', en: "What is the translation of what you heard?", es: "Cual es la traduccion?", opts: ["We aren't at home", "We are at home"], optsTr: ["No estamos en casa", "Estamos en casa"], ans: "We aren't at home", exp: "aren't = no estamos", tts: "We aren't at home." },

  // WRITING (10)
  { n: 1, skill: 'WRITING', en: "Translate with contraction: 'Yo soy un estudiante.'", es: "Traduce con contraccion:", ans: "I'm a student", exp: "I am = I'm", tts: "I'm a student." },
  { n: 2, skill: 'WRITING', en: "Translate with contraction: 'Yo no estoy en la oficina.'", es: "Traduce con contraccion:", ans: "I'm not in the office", exp: "I am not = I'm not", tts: "I'm not in the office." },
  { n: 3, skill: 'WRITING', en: "Translate with negative contraction: 'El no es un maestro.'", es: "Traduce con contraccion negativa:", ans: "He isn't a teacher", exp: "He is not = He isn't", tts: "He isn't a teacher." },
  { n: 4, skill: 'WRITING', en: "Translate with negative contraction: 'Ella no esta en la biblioteca.'", es: "Traduce con contraccion negativa:", ans: "She isn't in the library", exp: "She is not = She isn't", tts: "She isn't in the library." },
  { n: 5, skill: 'WRITING', en: "Translate with negative contraction: 'Nosotros no somos amigos.'", es: "Traduce con contraccion negativa:", ans: "We aren't friends", exp: "We are not = We aren't", tts: "We aren't friends." },
  { n: 6, skill: 'WRITING', en: "Translate with negative contraction: 'Ellos no estan tristes.'", es: "Traduce con contraccion negativa:", ans: "They aren't sad", exp: "They are not = They aren't", tts: "They aren't sad." },
  { n: 7, skill: 'WRITING', en: "Translate with negative contraction: 'Eso no es una computadora.'", es: "Traduce con contraccion negativa:", ans: "It isn't a computer", exp: "It is not = It isn't", tts: "It isn't a computer." },
  { n: 8, skill: 'WRITING', en: "Translate with affirmative contraction: 'Tu eres mi companero.'", es: "Traduce con contraccion afirmativa:", ans: "You're my classmate", exp: "You are = You're", tts: "You're my classmate." },
  { n: 9, skill: 'WRITING', en: "Translate with affirmative contraction: 'Ella es inteligente.'", es: "Traduce con contraccion afirmativa:", ans: "She's smart", exp: "She is = She's", tts: "She's smart." },
  { n: 10, skill: 'WRITING', en: "Translate with negative contraction: 'Nosotros no estamos en casa.'", es: "Traduce con contraccion negativa:", ans: "We aren't at home", exp: "We are not = We aren't", tts: "We aren't at home." },

  // READING (10)
  { n: 1, skill: 'READING', en: "Is Alex in the office according to the text?", es: "Esta Alex en la oficina?", opts: ["Yes, he is", "No, he's not in the office"], optsTr: ["Si, esta", "No, no esta"], ans: "No, he's not in the office", exp: "I'm not in the office", tts: "Is Alex in the office. The answer is No he's not in the office." },
  { n: 2, skill: 'READING', en: "Who is Luis?", es: "Quien es Luis?", opts: ["He's Alex's classmate", "He's the teacher"], optsTr: ["Es su companero", "Es el maestro"], ans: "He's Alex's classmate", exp: "He's my classmate", tts: "Who is Luis. The answer is He's Alex's classmate." },
  { n: 3, skill: 'READING', en: "Is Luis sad today?", es: "Esta Luis triste?", opts: ["Yes, he is", "No, he isn't sad today"], optsTr: ["Si", "No"], ans: "No, he isn't sad today", exp: "He isn't sad today", tts: "Is Luis sad today. The answer is No he isn't sad today." },
  { n: 4, skill: 'READING', en: "What is Maria's role?", es: "Cual es el rol de Maria?", opts: ["She's a teacher", "She's a student"], optsTr: ["Es maestra", "Es estudiante"], ans: "She's a teacher", exp: "She's a teacher", tts: "What is Maria role. The answer is She's a teacher." },
  { n: 5, skill: 'READING', en: "Is Maria in the classroom right now?", es: "Esta Maria en el salon ahora?", opts: ["Yes, she is", "No, she isn't in the classroom now"], optsTr: ["Si", "No"], ans: "No, she isn't in the classroom now", exp: "She isn't in the classroom now", tts: "Is Maria in the classroom right now. The answer is No she isn't." },
  { n: 6, skill: 'READING', en: "How is the classroom described?", es: "Como se describe el salon?", opts: ["It's big and it isn't dirty", "It's small and dirty"], optsTr: ["Es grande y limpio", "Es pequeno y sucio"], ans: "It's big and it isn't dirty", exp: "It's big and isn't dirty", tts: "How is the classroom described. The answer is It's big and it isn't dirty." },
  { n: 7, skill: 'READING', en: "Are Alex and Luis tired?", es: "Estan cansados?", opts: ["Yes, they are", "No, they aren't tired"], optsTr: ["Si", "No"], ans: "No, they aren't tired", exp: "They aren't tired", tts: "Are Alex and Luis tired. The answer is No they aren't tired." },
  { n: 8, skill: 'READING', en: "Where are Alex and Luis NOT located?", es: "Donde NO estan?", opts: ["They aren't at home", "They aren't in class"], optsTr: ["No en casa", "No en clase"], ans: "They aren't at home", exp: "They aren't at home", tts: "Where are Alex and Luis not located. The answer is They aren't at home." },
  { n: 9, skill: 'READING', en: "What contracted pronoun is used for Maria?", es: "Que pronombre contraido se usa?", opts: ["She's", "He's"], optsTr: ["She's", "He's"], ans: "She's", exp: "She is = She's", tts: "What contracted pronoun is used for Maria. The answer is She's." },
  { n: 10, skill: 'READING', en: "Which negative contraction is used for the classroom?", es: "Que contraccion negativa usa el salon?", opts: ["isn't", "aren't"], optsTr: ["isn't", "aren't"], ans: "isn't", exp: "It isn't dirty", tts: "Which negative contraction is used for the classroom. The answer is isn't." },

  // SPEAKING (10)
  { n: 1, skill: 'SPEAKING', en: "Say the first person negative exception:", es: "Pronuncia la excepcion negativa:", ans: "I'm not in the office.", exp: "I'm not in the office.", tts: "I'm not in the office." },
  { n: 2, skill: 'SPEAKING', en: "Say the masculine negative contraction:", es: "Pronuncia la contraccion negativa masculina:", ans: "He isn't a teacher.", exp: "He isn't a teacher.", tts: "He isn't a teacher." },
  { n: 3, skill: 'SPEAKING', en: "Say the feminine negative contraction:", es: "Pronuncia la contraccion negativa femenina:", ans: "She isn't in the library.", exp: "She isn't in the library.", tts: "She isn't in the library." },
  { n: 4, skill: 'SPEAKING', en: "Say the group negative contraction:", es: "Pronuncia la contraccion negativa de grupo:", ans: "We aren't tired.", exp: "We aren't tired.", tts: "We aren't tired." },
  { n: 5, skill: 'SPEAKING', en: "Say the plural negative contraction:", es: "Pronuncia la contraccion negativa plural:", ans: "They aren't sad.", exp: "They aren't sad.", tts: "They aren't sad." },
  { n: 6, skill: 'SPEAKING', en: "Read the neutral negative sentence aloud:", es: "Lee la oracion neutra negativa:", ans: "It isn't dirty.", exp: "It isn't dirty.", tts: "It isn't dirty." },
  { n: 7, skill: 'SPEAKING', en: "Read the affirmative contraction fluently:", es: "Lee la contraccion afirmativa:", ans: "She's my classmate.", exp: "She's my classmate.", tts: "She's my classmate." },
  { n: 8, skill: 'SPEAKING', en: "Read the group affirmative contraction:", es: "Lee la contraccion afirmativa de grupo:", ans: "We're happy today.", exp: "We're happy today.", tts: "We're happy today." },
  { n: 9, skill: 'SPEAKING', en: "Read the school negation aloud:", es: "Lee la negacion escolar:", ans: "He isn't at home.", exp: "He isn't at home.", tts: "He isn't at home." },
  { n: 10, skill: 'SPEAKING', en: "Read the first person negation:", es: "Lee la negacion en primera persona:", ans: "I'm not a teacher.", exp: "I'm not a teacher.", tts: "I'm not a teacher." }
];

const skillPrefix = { GRAMMAR: 'GRAM', LISTENING: 'LIST', WRITING: 'WRIT', READING: 'READ', SPEAKING: 'SPEAK' };
let created = 0, updated = 0;

for (const e of exercises) {
  const id = 'CLASE_03_' + skillPrefix[e.skill] + '_' + String(e.n).padStart(2, '0');
  const hasOptions = Array.isArray(e.opts) && e.opts.length > 0;

  const data = {
    lessonId: 'CLASE_03',
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
const totalEx = await p.exercise.count({ where: { lessonId: 'CLASE_03' } });
const totalVocab = await p.vocabularyItem.count({ where: { lessonId: 'CLASE_03' } });
const totalQuick = await p.lessonQuickVocab.count({ where: { lessonId: 'CLASE_03' } });
const totalText = await p.textBase.count({ where: { lessonId: 'CLASE_03' } });
const totalTeacher = await p.teacherScript.count({ where: { lessonId: 'CLASE_03' } });

console.log('');
console.log('═══════════════════════════════════════');
console.log('  CLASE_03 COMPLETADA');
console.log('═══════════════════════════════════════');
console.log('Exercise: ' + totalEx);
console.log('VocabularyItem: ' + totalVocab);
console.log('LessonQuickVocab: ' + totalQuick);
console.log('TextBase: ' + totalText);
console.log('TeacherScript: ' + totalTeacher);

await p.$disconnect();
