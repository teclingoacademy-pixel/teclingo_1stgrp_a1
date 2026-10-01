import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const VOZ = 'male';
const VOICE_GENDER = 'male';

const tts = (text) => ({
  segments: [{ text, lang: 'en', voiceGender: VOICE_GENDER }]
});

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  SEED CLASE 00 - FASE CERO');
  console.log('═══════════════════════════════════════\n');

  // PASO 1: videoUrl
  await p.lesson.update({
    where: { id: 'CLASE_00' },
    data: {
      videoUrl: 'https://youtube.com/shorts/JBB6JZT4VIc',
      description: 'Fase Cero: El Secreto de los Singulares y Plurales'
    }
  });
  console.log('OK - videoUrl actualizado');

  // PASO 2: TextBase
  await p.textBase.deleteMany({ where: { lessonId: 'CLASE_00' } });
  const textContent = 'Hello! I am Alex. I am a student in a big city. I have one house and my house is small. On my table, I have one book and two pens. My friend is Luis. He is a student in my class. Maria is a student too; she is in the library. We are friends and we study every day. Look at Alex and Luis: they have new books. Hello, you! You are my classmate. You guys are in my class. There is a computer on the table; it is new.';
  await p.textBase.create({
    data: {
      lessonId: 'CLASE_00',
      title: 'Hello, I am Alex',
      content: textContent,
      wordCount: textContent.split(/\s+/).length,
      difficulty: 1,
      timeAudioSec: 60,
      vocabList: ['I', 'You', 'He', 'She', 'It', 'We', 'They', 'house', 'book', 'pen', 'student', 'table', 'library', 'class', 'city', 'computer'],
      verbsList: ['am', 'have', 'is', 'are', 'study'],
      perfil: 'Alex',
      fase: 'F1',
      parrafos: 1
    }
  });
  console.log('OK - TextBase creado');

  // PASO 3: VocabularyItem
  await p.vocabularyItem.deleteMany({ where: { lessonId: 'CLASE_00' } });
  const vocabs = [
    { term: 'I', translation: 'Yo', type: 'pronoun', ttsText: 'I am a student', exampleUse: 'I am Alex.' },
    { term: 'You', translation: 'Tú / Ustedes', type: 'pronoun', ttsText: 'You are my friend', exampleUse: 'You are my classmate.' },
    { term: 'He', translation: 'Él', type: 'pronoun', ttsText: 'He is a student', exampleUse: 'He is a student in my class.' },
    { term: 'She', translation: 'Ella', type: 'pronoun', ttsText: 'She is in the library', exampleUse: 'She is in the library.' },
    { term: 'It', translation: 'Algo', type: 'pronoun', ttsText: 'It is a computer', exampleUse: 'It is new.' },
    { term: 'We', translation: 'Nosotros', type: 'pronoun', ttsText: 'We are friends', exampleUse: 'We are friends.' },
    { term: 'They', translation: 'Ellos', type: 'pronoun', ttsText: 'They have new books', exampleUse: 'They have new books.' },
    { term: 'You guys', translation: 'Ustedes muchachos', type: 'expression', ttsText: 'You guys are in my class', exampleUse: 'You guys are in my class.' },
    { term: 'You all', translation: 'Ustedes todos', type: 'expression', ttsText: 'You all are here', exampleUse: 'You all are here.' },
    { term: 'house', translation: 'casa', type: 'noun', ttsText: 'I have one house', exampleUse: 'My house is small.' },
    { term: 'houses', translation: 'casas', type: 'noun', ttsText: 'I have two houses', exampleUse: 'Two houses are here.' },
    { term: 'book', translation: 'libro', type: 'noun', ttsText: 'I have one book', exampleUse: 'One book is here.' },
    { term: 'books', translation: 'libros', type: 'noun', ttsText: 'I have two books', exampleUse: 'They have new books.' },
    { term: 'pen', translation: 'pluma', type: 'noun', ttsText: 'I have one pen', exampleUse: 'I have one pen.' },
    { term: 'pens', translation: 'plumas', type: 'noun', ttsText: 'I have two pens', exampleUse: 'Two pens are here.' },
    { term: 'student', translation: 'estudiante', type: 'noun', ttsText: 'I am a student', exampleUse: 'I am a student.' },
    { term: 'students', translation: 'estudiantes', type: 'noun', ttsText: 'We are students', exampleUse: 'We are students.' },
    { term: 'table', translation: 'mesa', type: 'noun', ttsText: 'The book is on the table', exampleUse: 'The book is on the table.' },
    { term: 'computer', translation: 'computadora', type: 'noun', ttsText: 'It is a computer', exampleUse: 'It is a computer.' }
  ];
  for (const v of vocabs) {
    await p.vocabularyItem.create({
      data: {
        lessonId: 'CLASE_00',
        term: v.term,
        translation: v.translation,
        type: v.type,
        ttsText: v.ttsText,
        lang: 'en',
        exampleUse: v.exampleUse,
        tags: [v.type]
      }
    });
  }
  console.log('OK - ' + vocabs.length + ' VocabularyItem creados');

  // PASO 4: LessonQuickVocab
  await p.lessonQuickVocab.deleteMany({ where: { lessonId: 'CLASE_00' } });
  const quickVocab = [
    { order: 1, word: 'I', translation: 'Yo' },
    { order: 2, word: 'You', translation: 'Tú / Ustedes' },
    { order: 3, word: 'It', translation: 'Algo' },
    { order: 4, word: 'house', translation: 'casa' },
    { order: 5, word: 'books', translation: 'libros' },
    { order: 6, word: 'You guys', translation: 'Ustedes muchachos' }
  ];
  for (const q of quickVocab) {
    await p.lessonQuickVocab.create({
      data: { lessonId: 'CLASE_00', order: q.order, word: q.word, translation: q.translation }
    });
  }
  console.log('OK - ' + quickVocab.length + ' LessonQuickVocab creados');

  // PASO 5: TeacherScript
  await p.teacherScript.deleteMany({ where: { lessonId: 'CLASE_00' } });
  const teacherContent = `[ES]
Bienvenidos a la Fase Cero de TecLingo. Hoy vamos a construir los cimientos de tu inglés: el secreto de los singulares y plurales.

Antes de conjugar verbos o memorizar reglas complejas, necesitas dominar una idea fundamental: clasificar la realidad según su número gramatical.

Singular significa uno. Se refiere a una sola entidad. Ejemplos: book, que significa libro; house, que significa casa; student, que significa estudiante.

Plural significa varios o más de uno. En inglés, por regla general, se añade una s al final. Ejemplos: books, que significa libros; houses, que significa casas; students, que significa estudiantes.

Ahora, el secreto más importante: la clasificación de los pronombres en tres canales lógicos.

Canal Uno, Primera Persona Singular. El pronombre I, que significa yo. Representa exclusivamente al emisor del mensaje.

Canal Dos, Bloque Plural. Los pronombres You, que significa tú o ustedes; We, que significa nosotros; They, que significa ellos.

La Regla de Oro de TecLingo: el pronombre You se clasifica estrictamente dentro del bloque de los plurales.

Porque para que exista la interacción de tú, se necesitan mínimo dos personas: quien habla y quien escucha. Por lo tanto, You es estructuralmente plural.

Anclaje práctico. Para decir ustedes en inglés, no existe un pronombre aislado. Usamos You acompañado de un pluralizador: You guys, que significa ustedes muchachos; You all, que significa ustedes todos.

Canal Tres, Bloque Singular de Tercera Persona. Los pronombres He, que significa él; She, que significa ella; It, que significa algo. Representa personas u objetos fuera de la interacción directa.

Un detalle fundamental. It NO se traduce como ello. En TecLingo, It significa algo. Representa objetos indefinidos, animales o conceptos.

A diferencia del español, en inglés la omisión del sujeto es incorrecta. Toda oración requiere declarar explícitamente quién ejecuta la acción.

Ahora dominas los fundamentos de cantidad y clasificación de sujetos. En la próxima clase, aplicaremos estos conceptos con el Verbo To Be.

---

[EN]
"I am Alex."
"I am a student."
"I have one house."
"I have one book and two pens."
"He is a student in my class."
"She is in the library."
"We are friends."
"They have new books."
"You are my classmate."
"You guys are in my class."
"It is a computer."
"It is new."`;

  await p.teacherScript.create({
    data: {
      lessonId: 'CLASE_00',
      title: 'Clase 00 - El Secreto de los Singulares y Plurales',
      content: teacherContent,
      duration: 180
    }
  });
  console.log('OK - TeacherScript creado');

  console.log('\n═══════════════════════════════════════');
  console.log('  SEED CLASE 00 COMPLETADO');
  console.log('═══════════════════════════════════════');

  const totalEx = await p.exercise.count({ where: { lessonId: 'CLASE_00' } });
  console.log('Exercise existentes en CLASE_00: ' + totalEx);
  console.log('  (Los 50 ejercicios se añaden en el siguiente paso)');

  await p.$disconnect();
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
