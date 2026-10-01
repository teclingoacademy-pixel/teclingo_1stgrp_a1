import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const VOZ = 'male';
const VOICE_GENDER = 'male';

const tts = (text) => ({
  segments: [{ text, lang: 'en', voiceGender: VOICE_GENDER }]
});

const exercises = [
  // ========== GRAMMAR (10) ==========
  { n: 1, skill: 'GRAMMAR', q: "The word 'house' represents one object, so it is ___.", opts: ['singular', 'plural'], optsTr: ['singular', 'plural'], ans: 'singular', exp: 'house = un solo objeto = singular', ctx: 'Singular vs Plural' },
  { n: 2, skill: 'GRAMMAR', q: "The word 'books' has an 's' at the end, so it is ___.", opts: ['singular', 'plural'], optsTr: ['singular', 'plural'], ans: 'plural', exp: 'books tiene s = plural', ctx: 'Singular vs Plural' },
  { n: 3, skill: 'GRAMMAR', q: "In our method, the pronoun 'You' is strictly classified in the ___ block.", opts: ['singular', 'plural'], optsTr: ['singular', 'plural'], ans: 'plural', exp: 'You es plural en TecLingo', ctx: 'Regla de Oro de You' },
  { n: 4, skill: 'GRAMMAR', q: "The pronoun 'He' refers to ___.", opts: ['a man', 'a woman', 'an object'], optsTr: ['un hombre', 'una mujer', 'un objeto'], ans: 'a man', exp: 'He = el (hombre)', ctx: 'Pronombres' },
  { n: 5, skill: 'GRAMMAR', q: "In our system, the pronoun 'It' means ___.", opts: ['ello', 'algo', 'nosotros'], optsTr: ['ello', 'algo', 'nosotros'], ans: 'algo', exp: 'It = algo (objeto indefinido)', ctx: 'Pronombres' },
  { n: 6, skill: 'GRAMMAR', q: "Which pronoun represents 'Alex and I'?", opts: ['You', 'They', 'We'], optsTr: ['Tu', 'Ellos', 'Nosotros'], ans: 'We', exp: 'Alex y yo = nosotros = We', ctx: 'Pronombres plurales' },
  { n: 7, skill: 'GRAMMAR', q: "Which pronoun represents 'Alex and Luis'?", opts: ['We', 'They', 'You'], optsTr: ['Nosotros', 'Ellos', 'Tu'], ans: 'They', exp: 'Alex y Luis = ellos = They', ctx: 'Pronombres plurales' },
  { n: 8, skill: 'GRAMMAR', q: "To say 'Ustedes' we accompany 'You' with a plural word like ___.", opts: ['you guys', 'you alone', 'you he'], optsTr: ['ustedes muchachos', 'tu solo', 'tu el'], ans: 'you guys', exp: 'You guys = ustedes muchachos', ctx: 'Pluralizadores' },
  { n: 9, skill: 'GRAMMAR', q: "Is the pronoun 'I' classified as singular or plural?", opts: ['Singular', 'Plural'], optsTr: ['Singular', 'Plural'], ans: 'Singular', exp: 'I = primera persona singular', ctx: 'Pronombres' },
  { n: 10, skill: 'GRAMMAR', q: "Select the correct plural form of 'student'.", opts: ['studentes', 'students', 'student'], optsTr: ['incorrecto', 'estudiantes', 'estudiante'], ans: 'students', exp: 'student + s = students', ctx: 'Plurales' },

  // ========== LISTENING (10) ==========
  { n: 1, skill: 'LISTENING', q: 'Que pronombre de primera persona singular escuchaste?', audio: 'I am Alex.', opts: ['You', 'I'], optsTr: ['Tu', 'Yo'], ans: 'I', exp: 'I = primera persona singular', ctx: 'Listening' },
  { n: 2, skill: 'LISTENING', q: 'De acuerdo con la Regla de Oro, en que bloque esta clasificado You?', audio: 'You are my friend.', opts: ['Bloque Singular', 'Bloque Plural'], optsTr: ['Singular', 'Plural'], ans: 'Bloque Plural', exp: 'You es plural', ctx: 'Listening' },
  { n: 3, skill: 'LISTENING', q: 'A quien se refiere el pronombre He?', audio: 'He is in the library.', opts: ['A un hombre', 'A una mujer'], optsTr: ['El', 'Ella'], ans: 'A un hombre', exp: 'He = hombre', ctx: 'Listening' },
  { n: 4, skill: 'LISTENING', q: 'A quien se refiere el pronombre She?', audio: 'She has two books.', opts: ['A El', 'A Ella'], optsTr: ['El', 'Ella'], ans: 'A Ella', exp: 'She = mujer', ctx: 'Listening' },
  { n: 5, skill: 'LISTENING', q: 'Cual es la traduccion correcta de It en nuestro metodo?', audio: 'It is a computer.', opts: ['Algo', 'Ello'], optsTr: ['Algo', 'Ello'], ans: 'Algo', exp: 'It = algo', ctx: 'Listening' },
  { n: 6, skill: 'LISTENING', q: 'Que pronombre plural escuchaste para Nosotros?', audio: 'We are students.', opts: ['We', 'They'], optsTr: ['Nosotros', 'Ellos'], ans: 'We', exp: 'We = nosotros', ctx: 'Listening' },
  { n: 7, skill: 'LISTENING', q: 'Que pronombre escuchaste para Ellos?', audio: 'They study every day.', opts: ['We', 'They'], optsTr: ['Nosotros', 'Ellos'], ans: 'They', exp: 'They = ellos', ctx: 'Listening' },
  { n: 8, skill: 'LISTENING', q: 'La palabra house representa un elemento singular o plural?', audio: 'One house.', opts: ['Singular', 'Plural'], optsTr: ['Singular', 'Plural'], ans: 'Singular', exp: 'house = uno', ctx: 'Listening' },
  { n: 9, skill: 'LISTENING', q: 'La palabra houses representa un elemento singular o plural?', audio: 'Three houses.', opts: ['Singular', 'Plural'], optsTr: ['Singular', 'Plural'], ans: 'Plural', exp: 'houses = varios', ctx: 'Listening' },
  { n: 10, skill: 'LISTENING', q: 'Que significa la expresion you guys?', audio: 'Hello, you guys!', opts: ['Tu solo', 'Ustedes muchachos'], optsTr: ['Tu solo', 'Ustedes muchachos'], ans: 'Ustedes muchachos', exp: 'You guys = ustedes muchachos', ctx: 'Listening' },

  // ========== WRITING (10) ==========
  { n: 1, skill: 'WRITING', q: 'Traduce: "Yo" (Primera persona singular)', ans: 'I', exp: 'I = Yo' },
  { n: 2, skill: 'WRITING', q: 'Traduce: "Tu" (Bloque plural)', ans: 'You', exp: 'You = Tu / Ustedes' },
  { n: 3, skill: 'WRITING', q: 'Traduce: "El" (Tercera persona masculino)', ans: 'He', exp: 'He = El' },
  { n: 4, skill: 'WRITING', q: 'Traduce: "Ella" (Tercera persona femenino)', ans: 'She', exp: 'She = Ella' },
  { n: 5, skill: 'WRITING', q: 'Traduce: "Algo" (Objeto indefinido)', ans: 'It', exp: 'It = Algo' },
  { n: 6, skill: 'WRITING', q: 'Traduce: "Nosotros"', ans: 'We', exp: 'We = Nosotros' },
  { n: 7, skill: 'WRITING', q: 'Traduce: "Ellos"', ans: 'They', exp: 'They = Ellos' },
  { n: 8, skill: 'WRITING', q: 'Traduce la frase singular: "Una casa"', ans: 'A house', exp: 'A house / One house' },
  { n: 9, skill: 'WRITING', q: 'Traduce la frase plural: "Casas"', ans: 'Houses', exp: 'Houses = Casas' },
  { n: 10, skill: 'WRITING', q: 'Traduce: "Ustedes muchachos"', ans: 'You guys', exp: 'You guys = Ustedes muchachos' },

  // ========== READING (10) ==========
  { n: 1, skill: 'READING', q: 'According to the text, how many houses does Alex have?', opts: ['One house', 'Two houses'], optsTr: ['Una casa', 'Dos casas'], ans: 'One house', exp: 'I have one house' },
  { n: 2, skill: 'READING', q: 'Is the word house in the text singular or plural?', opts: ['Singular', 'Plural'], optsTr: ['Singular', 'Plural'], ans: 'Singular', exp: 'one house = singular' },
  { n: 3, skill: 'READING', q: "What objects are on Alex's table?", opts: ['One book and two pens', 'Three computers'], optsTr: ['Un libro y dos plumas', 'Tres computadoras'], ans: 'One book and two pens', exp: 'one book and two pens' },
  { n: 4, skill: 'READING', q: 'Is the word pens singular or plural?', opts: ['Singular', 'Plural'], optsTr: ['Singular', 'Plural'], ans: 'Plural', exp: 'pens = plural' },
  { n: 5, skill: 'READING', q: 'Which pronoun replaces Luis in "He is a student"?', opts: ['He', 'She'], optsTr: ['El', 'Ella'], ans: 'He', exp: 'Luis es hombre = He' },
  { n: 6, skill: 'READING', q: 'Which pronoun replaces Maria in "She is in the library"?', opts: ['He', 'She'], optsTr: ['El', 'Ella'], ans: 'She', exp: 'Maria es mujer = She' },
  { n: 7, skill: 'READING', q: 'What pronoun is used for Alex and Luis when they say "We are friends"?', opts: ['We', 'They'], optsTr: ['Nosotros', 'Ellos'], ans: 'We', exp: 'We = nosotros' },
  { n: 8, skill: 'READING', q: 'What pronoun is used when describing Alex and Luis as "They have new books"?', opts: ['We', 'They'], optsTr: ['Nosotros', 'Ellos'], ans: 'They', exp: 'They = ellos' },
  { n: 9, skill: 'READING', q: 'In "There is a computer; it is new", what does it refer to?', opts: ['Maria', 'The computer'], optsTr: ['Maria', 'La computadora'], ans: 'The computer', exp: 'It = algo (la computadora)' },
  { n: 10, skill: 'READING', q: 'What phrase is used in the text to address the group as Ustedes?', opts: ['You guys', 'You he'], optsTr: ['Ustedes muchachos', 'Tu el'], ans: 'You guys', exp: 'You guys = Ustedes' },

  // ========== SPEAKING (10) ==========
  { n: 1, skill: 'SPEAKING', q: 'Pronuncia con claridad la primera persona singular:', ans: 'I', tts: 'I' },
  { n: 2, skill: 'SPEAKING', q: 'Pronuncia el pronombre del bloque plural:', ans: 'You', tts: 'You' },
  { n: 3, skill: 'SPEAKING', q: 'Pronuncia el pronombre masculino singular:', ans: 'He', tts: 'He' },
  { n: 4, skill: 'SPEAKING', q: 'Pronuncia el pronombre femenino singular:', ans: 'She', tts: 'She' },
  { n: 5, skill: 'SPEAKING', q: 'Pronuncia el pronombre indefinido:', ans: 'It', tts: 'It' },
  { n: 6, skill: 'SPEAKING', q: 'Pronuncia el pronombre plural:', ans: 'We', tts: 'We' },
  { n: 7, skill: 'SPEAKING', q: 'Pronuncia el pronombre plural:', ans: 'They', tts: 'They' },
  { n: 8, skill: 'SPEAKING', q: 'Lee la frase en voz alta respetando el singular:', ans: 'I have one book.', tts: 'I have one book.' },
  { n: 9, skill: 'SPEAKING', q: 'Lee la frase plural en voz alta:', ans: 'We are friends.', tts: 'We are friends.' },
  { n: 10, skill: 'SPEAKING', q: 'Lee la frase completa en voz alta:', ans: 'This is my house.', tts: 'This is my house.' }
];

async function main() {
  console.log('Cargando 50 ejercicios de CLASE_00...\n');

  await p.exercise.deleteMany({ where: { lessonId: 'CLASE_00' } });

  const skillPrefix = { GRAMMAR: 'GRAM', LISTENING: 'LIST', WRITING: 'WRIT', READING: 'READ', SPEAKING: 'SPEAK' };
  let created = 0;

  for (const e of exercises) {
    const id = 'CLASE_00_' + skillPrefix[e.skill] + '_' + String(e.n).padStart(2, '0');
    const hasOptions = Array.isArray(e.opts) && e.opts.length > 0;

    let ttsText;
    if (e.skill === 'LISTENING' && e.audio) ttsText = e.audio;
    else if (e.skill === 'SPEAKING' && e.tts) ttsText = e.tts;
    else if (e.skill === 'GRAMMAR' && hasOptions && e.q.includes('___')) ttsText = e.q.replace(/___/g, e.ans);
    else if (e.skill === 'READING') ttsText = e.q;
    else if (e.skill === 'WRITING') ttsText = e.ans;
    else ttsText = e.q;

    await p.exercise.create({
      data: {
        id,
        lessonId: 'CLASE_00',
        skill: e.skill,
        itemNumber: e.n,
        questionType: e.skill === 'LISTENING' ? 'listen_and_select' : e.skill === 'SPEAKING' ? 'read_aloud' : 'multiple_choice',
        spanishContext: e.ctx || null,
        instruction: e.skill === 'SPEAKING' ? 'Lee la frase en voz alta:' : 'Selecciona la opcion correcta',
        questionText: e.q,
        translationSentence: null,
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
        audioTTS: tts(ttsText),
        instructionTTS: null,
        audioUI: null,
        uiDisplay: null,
        acceptedAnswers: [],
        aiToolTags: [],
        perfil: 'Alex',
        fase: 'F1',
        parrafos: 1
      }
    });
    created++;
  }

  console.log('OK - ' + created + ' ejercicios creados\n');

  const bySkill = await p.exercise.groupBy({ by: ['skill'], where: { lessonId: 'CLASE_00' }, _count: true });
  console.log('Distribucion por skill:');
  bySkill.forEach(s => console.log('  - ' + s.skill + ': ' + s._count));

  await p.$disconnect();
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
