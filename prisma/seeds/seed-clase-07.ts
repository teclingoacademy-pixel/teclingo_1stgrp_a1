import { PrismaClient, Skill } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 CLASE_07 — audioTTS con frase COMPLETA en los 5 skills');

  const lessonId = 'CLASE_07';

  // ═══════ 1. LECCIÓN ═══════
  await prisma.lesson.upsert({
    where: { id: lessonId },
    update: {
      level: 'A1',
      title: 'CLASE 07 TECLINGO: Artículos Definidos e Indefinidos (A, AN, THE)',
      description: 'Domina el uso de los artículos A, AN y THE. Regla de sonido y Cambio de Bloque.',
      order: 7, isPublished: true,
      videoUrl: 'https://youtube.com/shorts/zGt6AXU5y5I?si=okKQraTB8EDxqNW4',
      tituloVideo: 'CLASE 07 TECLINGO: Artículos Definidos e Indefinidos (A, AN, THE)',
      temaPrincipal: 'Artículos Indefinidos (A/AN) y Definido (THE)',
      tipoContenido: 'original', duracionMin: 15, semana: 0, sesion: 'A',
    },
    create: {
      id: lessonId, level: 'A1',
      title: 'CLASE 07 TECLINGO: Artículos Definidos e Indefinidos (A, AN, THE)',
      description: 'Domina el uso de los artículos A, AN y THE.',
      order: 7, isPublished: true,
      videoUrl: 'https://youtube.com/shorts/zGt6AXU5y5I?si=okKQraTB8EDxqNW4',
      tituloVideo: 'CLASE 07 TECLINGO: Artículos Definidos e Indefinidos (A, AN, THE)',
      temaPrincipal: 'Artículos Indefinidos (A/AN) y Definido (THE)',
      tipoContenido: 'original', duracionMin: 15, semana: 0, sesion: 'A',
    },
  });
  console.log('✅ Lección');

  // ═══════ 2. TEACHER SCRIPT ═══════
  const scriptEs = `¡Bienvenido a tu nueva lección en TECLINGO! Hoy vas a dominar los Artículos en inglés.

Fundamento Académico:
Esta lección establece la distinción entre la introducción general de un sustantivo con artículos indefinidos (a/an) y su posterior especificación con el artículo definido (the).

Explicación del Tutor:
Los artículos se dividen en dos bloques:

1. ARTÍCULOS INDEFINIDOS: A y AN
- Usa A antes de sonido consonante: A student, A book.
- Usa AN antes de sonido vocal: An email, An exam.

2. ARTÍCULO DEFINIDO: THE
Sirve para objetos específicos o ya mencionados: The book, The books.

La Regla del Cambio de Bloque:
- Primera mención: I have a book.
- Segunda mención: The book is big.

¡A darle!`;

  const scriptEn = `Welcome to your new TECLINGO lesson! Today you will master the Articles in English.

Academic Foundation:
This lesson establishes the distinction between the general introduction of a noun with indefinite articles (a/an) and its later specification with the definite article (the).

Tutor Explanation:
Articles are divided into two blocks:

1. INDEFINITE ARTICLES: A and AN
- Use A before a consonant sound: A student, A book.
- Use AN before a vowel sound: An email, An exam.

2. DEFINITE ARTICLE: THE
It works for specific or already mentioned objects: The book, The books.

The Block Switch Rule:
- First mention: I have a book.
- Second mention: The book is big.

Let's go!`;

  await prisma.teacherScript.upsert({
    where: { lessonId },
    update: { title: 'Fundamento Académico y Guion del Tutor - Clase 07', content: scriptEs, contentEn: scriptEn, duration: 180 },
    create: { lessonId, title: 'Fundamento Académico y Guion del Tutor - Clase 07', content: scriptEs, contentEn: scriptEn, duration: 180 },
  });
  console.log('✅ TeacherScript');

  // ═══════ 3. TEXTBASE ═══════
  await prisma.textBase.deleteMany({ where: { lessonId } });
  await prisma.textBase.create({
    data: {
      lessonId,
      title: 'Texto Base - Clase 07 (A, AN, THE)',
      content: "Hello! I am Alex. I have a book. The book is big and clean. Maria is in the office. She sends an email to the teacher. The email is important. Alex and Luis take an exam in the classroom. The exam is easy for the students. The books are on the table.",
      translation: "¡Hola! Yo soy Alex. Tengo un libro. El libro es grande y limpio. María está en la oficina. Ella envía un correo al maestro. El correo es importante. Alex y Luis hacen un examen en el salón. El examen es fácil para los estudiantes. Los libros están sobre la mesa.",
      wordCount: 58, difficulty: 1, timeAudioSec: 35,
      vocabList: ['a', 'an', 'the', 'book', 'email', 'exam', 'office', 'teacher', 'student', 'table'],
      verbsList: ['have', 'is', 'sends', 'take', 'are'],
      active: true,
    },
  });
  console.log('✅ TextBase');

  // ═══════ 4. LIBRERÍA ═══════
  await prisma.vocabularyItem.deleteMany({ where: { lessonId } });
  const lib = [
    { term: 'a', translation: 'un / una → antes de CONSONANTE', type: 'article', ttsText: 'a', exampleUse: 'I have a book.', tags: ['article','consonant-sound'], pronunciationAf: '/ə/' },
    { term: 'an', translation: 'un / una → antes de VOCAL', type: 'article', ttsText: 'an', exampleUse: 'She sends an email.', tags: ['article','vowel-sound'], pronunciationAf: '/ən/' },
    { term: 'the', translation: 'el / la / los / las → ESPECÍFICO', type: 'article', ttsText: 'the', exampleUse: 'The book is big.', tags: ['article','specific'], pronunciationAf: '/ðə/ o /ði/' },
    { term: 'email', translation: 'correo electrónico (VOCAL → an email)', type: 'noun', ttsText: 'email', exampleUse: 'She sends an email.', tags: ['noun','vowel-start'], pronunciationAf: '/ˈiːmeɪl/' },
    { term: 'exam', translation: 'examen (VOCAL → an exam)', type: 'noun', ttsText: 'exam', exampleUse: 'We take an exam.', tags: ['noun','vowel-start'], pronunciationAf: '/ɪɡˈzæm/' },
    { term: 'office', translation: 'oficina (VOCAL → an office)', type: 'noun', ttsText: 'office', exampleUse: 'Maria is in the office.', tags: ['noun','vowel-start'], pronunciationAf: '/ˈɔːfɪs/' },
    { term: 'student', translation: 'estudiante (CONSONANTE → a student)', type: 'noun', ttsText: 'student', exampleUse: 'He is a student.', tags: ['noun','consonant-start'], pronunciationAf: '/ˈstjuːdənt/' },
    { term: 'teacher', translation: 'maestro (CONSONANTE → a teacher)', type: 'noun', ttsText: 'teacher', exampleUse: 'She is a teacher.', tags: ['noun','consonant-start'], pronunciationAf: '/ˈtiːtʃər/' },
    { term: 'book', translation: 'libro (CONSONANTE → a book)', type: 'noun', ttsText: 'book', exampleUse: 'The book is big.', tags: ['noun','consonant-start'], pronunciationAf: '/bʊk/' },
    { term: 'table', translation: 'mesa (CONSONANTE → a table)', type: 'noun', ttsText: 'table', exampleUse: 'The books are on the table.', tags: ['noun','consonant-start'], pronunciationAf: '/ˈteɪbl/' },
    { term: 'idea', translation: 'idea (VOCAL → an idea)', type: 'noun', ttsText: 'idea', exampleUse: 'Alex has an idea.', tags: ['noun','vowel-start'], pronunciationAf: '/aɪˈdɪə/' },
    { term: 'library', translation: 'biblioteca (CONSONANTE → a library)', type: 'noun', ttsText: 'library', exampleUse: 'She studies in the library.', tags: ['noun','consonant-start'], pronunciationAf: '/ˈlaɪbrəri/' },
    { term: 'have', translation: 'tener / tengo', type: 'verb', ttsText: 'have', exampleUse: 'I have a book.', tags: ['verb'] },
    { term: 'send', translation: 'enviar / envía', type: 'verb', ttsText: 'send', exampleUse: 'She sends an email.', tags: ['verb'] },
    { term: 'take', translation: 'tomar / hacer', type: 'verb', ttsText: 'take', exampleUse: 'We take an exam.', tags: ['verb'] },
    { term: 'important', translation: 'importante (VOCAL)', type: 'adjective', ttsText: 'important', exampleUse: 'The email is important.', tags: ['adjective','vowel-start'] },
    { term: 'easy', translation: 'fácil (VOCAL)', type: 'adjective', ttsText: 'easy', exampleUse: 'The exam is easy.', tags: ['adjective','vowel-start'] },
  ];
  for (const item of lib) {
    await prisma.vocabularyItem.create({
      data: { lessonId, term: item.term, translation: item.translation, type: item.type, ttsText: item.ttsText, lang: 'en', exampleUse: item.exampleUse, pronunciationAf: item.pronunciationAf ?? null, tags: item.tags ?? [] },
    });
  }
  console.log(`✅ Librería: ${lib.length}`);

  // ═══════ 5. EJERCICIOS — audioTTS con frase COMPLETA ═══════
  const existingEx = await prisma.exercise.findMany({ where: { lessonId }, select: { id: true } });
  const exIds = existingEx.map(e => e.id);
  if (exIds.length > 0) {
    await prisma.submission.deleteMany({ where: { exerciseId: { in: exIds } } });
    await prisma.examQuestion.deleteMany({ where: { exerciseId: { in: exIds } } });
  }
  await prisma.exercise.deleteMany({ where: { lessonId } });

  // 🔑 REGLA: audioTTS = frase COMPLETA con respuesta ya insertada
  //    Se genera reemplazando ___ por correctAnswer automáticamente
  const E: any[] = [
    // ─── GRAMMAR (10) ───
    { skill: Skill.GRAMMAR, n: 1, type: 'multiple_choice', q: 'Choose the correct article: "I have ________ book on my table."', es: 'Elige el artículo', opts: ['a','an','the','this'], ans: 'a', exp: 'Sonido consonante → a.' },
    { skill: Skill.GRAMMAR, n: 2, type: 'multiple_choice', q: 'Choose: "She receives ________ email from her teacher."', es: 'Elige el artículo', opts: ['a','an','the','that'], ans: 'an', exp: 'Sonido vocal → an.' },
    { skill: Skill.GRAMMAR, n: 3, type: 'multiple_choice', q: 'Block Switch: "I have a book. ________ book is big."', es: 'Elige el artículo de 2ª mención', opts: ['A','An','The','These'], ans: 'The', exp: 'Cambio de Bloque → The.' },
    { skill: Skill.GRAMMAR, n: 4, type: 'multiple_choice', q: 'Choose: "We take ________ exam in the classroom."', es: 'Elige el artículo', opts: ['the','a','an','those'], ans: 'an', exp: 'Sonido vocal → an.' },
    { skill: Skill.GRAMMAR, n: 5, type: 'multiple_choice', q: 'Choose: "Luis is ________ student in my class."', es: 'Elige el artículo', opts: ['a','an','the','these'], ans: 'a', exp: 'Sonido consonante → a.' },
    { skill: Skill.GRAMMAR, n: 6, type: 'multiple_choice', q: 'Which article for specific plural objects like "books"?', es: '¿Qué artículo para plurales?', opts: ['a','an','the','this'], ans: 'the', exp: 'The funciona para plurales específicos.' },
    { skill: Skill.GRAMMAR, n: 7, type: 'multiple_choice', q: 'Choose: "Maria is in ________ office near the library."', es: 'Elige el artículo', opts: ['a','an','the','that'], ans: 'the', exp: 'Específico por ubicación → the.' },
    { skill: Skill.GRAMMAR, n: 8, type: 'multiple_choice', q: 'Identify the error: "I have an book."', es: 'Identifica el error', opts: ['"an" should be "a"','"book" plural','"have" → "has"','No error'], ans: '"an" should be "a"', exp: 'Book empieza con consonante → a.' },
    { skill: Skill.GRAMMAR, n: 9, type: 'multiple_choice', q: 'Identify the error: "She sends a email."', es: 'Identifica el error', opts: ['"a" should be "an"','"email" → "the"','"sends" → "send"','No error'], ans: '"a" should be "an"', exp: 'Email empieza con vocal → an.' },
    { skill: Skill.GRAMMAR, n: 10, type: 'multiple_choice', q: 'Block Switch: "He has an idea. ________ idea is good."', es: 'Completa el cambio', opts: ['A','An','The','Those'], ans: 'The', exp: 'Cambio de Bloque → The.' },

    // ─── READING (10) ───
    { skill: Skill.READING, n: 1, type: 'multiple_choice', q: 'What object does Alex have?', es: '¿Qué objeto tiene Alex?', opts: ['a book','an email','a car','an office'], ans: 'a book', exp: 'I have a book.' },
    { skill: Skill.READING, n: 2, type: 'multiple_choice', q: 'How is the book described?', es: '¿Cómo se describe el libro?', opts: ['The book is big and clean','The book is small','An exam is hard','The email is short'], ans: 'The book is big and clean', exp: 'The book is big and clean.' },
    { skill: Skill.READING, n: 3, type: 'multiple_choice', q: 'What does Maria send?', es: '¿Qué envía María?', opts: ['an email','a book','a letter','an exam'], ans: 'an email', exp: 'She sends an email.' },
    { skill: Skill.READING, n: 4, type: 'multiple_choice', q: 'Which article for Maria\'s email (2nd mention)?', es: '¿Qué artículo para el correo?', opts: ['The email','An email','A email','This email'], ans: 'The email', exp: 'Cambio de Bloque → The email.' },
    { skill: Skill.READING, n: 5, type: 'multiple_choice', q: 'What do Alex and Luis do?', es: '¿Qué hacen Alex y Luis?', opts: ['They take an exam','They write a book','They send emails','They clean the office'], ans: 'They take an exam', exp: 'They take an exam.' },
    { skill: Skill.READING, n: 6, type: 'multiple_choice', q: 'How is the exam described (2nd mention)?', es: '¿Cómo se describe el examen?', opts: ['The exam is easy','The exam is difficult','The book is new','An exam is long'], ans: 'The exam is easy', exp: 'The exam is easy.' },
    { skill: Skill.READING, n: 7, type: 'multiple_choice', q: 'Where is Maria?', es: '¿Dónde está María?', opts: ['In the office','In the library','At home','In the park'], ans: 'In the office', exp: 'Maria is in the office.' },
    { skill: Skill.READING, n: 8, type: 'multiple_choice', q: 'Where are the books?', es: '¿Dónde están los libros?', opts: ['On the table','In the car','On the floor','In the bag'], ans: 'On the table', exp: 'The books are on the table.' },
    { skill: Skill.READING, n: 9, type: 'multiple_choice', q: 'Why "an" before "email"?', es: '¿Por qué "an" antes de email?', opts: ['Because "email" starts with a vowel sound','Plural','Proper name','Verb'], ans: 'Because "email" starts with a vowel sound', exp: 'Sonido vocal → an.' },
    { skill: Skill.READING, n: 10, type: 'multiple_choice', q: 'Why "The" in "The book is big"?', es: '¿Por qué "The"?', opts: ['Because it was already introduced','Because general','Because vowel','Because plural'], ans: 'Because it was already introduced', exp: 'Cambio de Bloque.' },

    // ─── LISTENING (10) — audioTTS con la frase completa ───
    { skill: Skill.LISTENING, n: 1, type: 'listen_and_select', q: 'Listen and choose the article before "book":', es: 'Escucha y elige el artículo', opts: ['a','an','the','this'], ans: 'a', exp: 'I have a book.', audioTTS: 'I have a book.' },
    { skill: Skill.LISTENING, n: 2, type: 'listen_and_select', q: 'Listen and choose the article before "email":', es: 'Escucha y elige el artículo', opts: ['an','a','the','that'], ans: 'an', exp: 'She sends an email.', audioTTS: 'She sends an email.' },
    { skill: Skill.LISTENING, n: 3, type: 'listen_and_select', q: 'Listen to the second sentence. What article?', es: 'Escucha la segunda oración', opts: ['The','A','An','Those'], ans: 'The', exp: 'The book is big.', audioTTS: 'I have a book. The book is big.' },
    { skill: Skill.LISTENING, n: 4, type: 'listen_and_select', q: 'Listen and identify the object with "an":', es: '¿Qué objeto lleva "an"?', opts: ['an exam','a book','a computer','the table'], ans: 'an exam', exp: 'We take an exam in class.', audioTTS: 'We take an exam in class.' },
    { skill: Skill.LISTENING, n: 5, type: 'listen_and_select', q: 'Listen and identify the role with "a":', es: '¿Qué rol lleva "a"?', opts: ['a teacher','an office','the library','an engineer'], ans: 'a teacher', exp: 'He is a teacher in our school.', audioTTS: 'He is a teacher in our school.' },
    { skill: Skill.LISTENING, n: 6, type: 'listen_and_select', q: 'Where is Maria according to the audio?', es: '¿Dónde está María?', opts: ['in the office','in an office','at home','in the park'], ans: 'in the office', exp: 'Maria is in the office.', audioTTS: 'Maria is in the office.' },
    { skill: Skill.LISTENING, n: 7, type: 'listen_and_select', q: 'What article precedes "idea" in the audio?', es: '¿Qué artículo precede idea?', opts: ['an','a','the','these'], ans: 'an', exp: 'Alex has an idea.', audioTTS: 'Alex has an idea.' },
    { skill: Skill.LISTENING, n: 8, type: 'listen_and_select', q: 'Listen: how is the exam described?', es: '¿Cómo se describe el examen?', opts: ['The exam is easy','An exam is hard','The book is big','The teacher is good'], ans: 'The exam is easy', exp: 'We take an exam. The exam is easy.', audioTTS: 'We take an exam. The exam is easy.' },
    { skill: Skill.LISTENING, n: 9, type: 'listen_and_select', q: 'Which plural phrase was spoken with "the"?', es: '¿Qué frase plural con "the"?', opts: ['The books are on the table','A book is on the table','An exam is easy','The office is clean'], ans: 'The books are on the table', exp: 'The books are on the table.', audioTTS: 'The books are on the table.' },
    { skill: Skill.LISTENING, n: 10, type: 'listen_and_select', q: 'Which place was mentioned with "the"?', es: '¿Qué lugar con "the"?', opts: ['the library','an office','a house','a school'], ans: 'the library', exp: 'They study in the library.', audioTTS: 'They study in the library.' },

    // ─── WRITING (10) ───
    { skill: Skill.WRITING, n: 1, type: 'translation', q: 'Translate: "Tengo un libro."', es: 'Traduce: "Tengo un libro"', opts: ['I have a book.','I have an book.','I have the book.','I have books.'], ans: 'I have a book.', exp: 'Con "a".' },
    { skill: Skill.WRITING, n: 2, type: 'translation', q: 'Translate: "Ella envía un correo."', es: 'Traduce', opts: ['She sends an email.','She sends a email.','She sends the email.','She send email.'], ans: 'She sends an email.', exp: 'Con "an email".' },
    { skill: Skill.WRITING, n: 3, type: 'translation', q: 'Translate: "El libro es grande."', es: 'Traduce', opts: ['The book is big.','A book is big.','An book is big.','Books are big.'], ans: 'The book is big.', exp: 'Con "The".' },
    { skill: Skill.WRITING, n: 4, type: 'translation', q: 'Translate: "Hacemos un examen."', es: 'Traduce', opts: ['We take an exam.','We take a exam.','We take the exam.','We takes exam.'], ans: 'We take an exam.', exp: 'Con "an exam".' },
    { skill: Skill.WRITING, n: 5, type: 'translation', q: 'Translate: "Él es un maestro."', es: 'Traduce', opts: ['He is a teacher.','He is an teacher.','He is the teacher.','He am a teacher.'], ans: 'He is a teacher.', exp: 'Con "a teacher".' },
    { skill: Skill.WRITING, n: 6, type: 'translation', q: 'Translate: "La oficina está limpia."', es: 'Traduce', opts: ['The office is clean.','An office is clean.','A office is clean.','Office is clean.'], ans: 'The office is clean.', exp: 'Con "The office".' },
    { skill: Skill.WRITING, n: 7, type: 'translation', q: 'Translate: "Los libros están sobre la mesa."', es: 'Traduce', opts: ['The books are on the table.','Books are on table.','A books are on the table.','The book is on table.'], ans: 'The books are on the table.', exp: 'Plural específico.' },
    { skill: Skill.WRITING, n: 8, type: 'translation', q: 'Translate (Block Switch): "Tengo un libro. El libro es nuevo."', es: 'Traduce', opts: ['I have a book. The book is new.','I have an book. A book is new.','I have the book. The book is new.','I has a book. Book is new.'], ans: 'I have a book. The book is new.', exp: 'a book → The book.' },
    { skill: Skill.WRITING, n: 9, type: 'translation', q: 'Translate: "Alex tiene una idea."', es: 'Traduce', opts: ['Alex has an idea.','Alex has a idea.','Alex have an idea.','Alex is an idea.'], ans: 'Alex has an idea.', exp: 'Con "an idea".' },
    { skill: Skill.WRITING, n: 10, type: 'translation', q: 'Translate: "El examen es fácil."', es: 'Traduce', opts: ['The exam is easy.','An exam is easy.','A exam is easy.','Exam is easy.'], ans: 'The exam is easy.', exp: 'Con "The exam".' },

    // ─── SPEAKING (10) — audioTTS con la frase a repetir ───
    { skill: Skill.SPEAKING, n: 1, type: 'read_aloud', q: 'Listen and repeat: "I have a book."', es: 'Escucha y repite', opts: ['I have a book.','I have an book.','I have the book.','I have books.'], ans: 'I have a book.', exp: '"a" suena /ə/.', audioTTS: 'I have a book.' },
    { skill: Skill.SPEAKING, n: 2, type: 'read_aloud', q: 'Listen and repeat: "She sends an email."', es: 'Escucha y repite', opts: ['She sends an email.','She sends a email.','She sends the email.','She send email.'], ans: 'She sends an email.', exp: 'Liga "an email".', audioTTS: 'She sends an email.' },
    { skill: Skill.SPEAKING, n: 3, type: 'read_aloud', q: 'Listen and repeat: "The book is big."', es: 'Escucha y repite', opts: ['The book is big.','A book is big.','An book is big.','Books are big.'], ans: 'The book is big.', exp: 'The antes de consonante.', audioTTS: 'The book is big.' },
    { skill: Skill.SPEAKING, n: 4, type: 'read_aloud', q: 'Listen and repeat: "We take an exam."', es: 'Escucha y repite', opts: ['We take an exam.','We take a exam.','We take the exam.','We takes exam.'], ans: 'We take an exam.', exp: 'Ligadura "an exam".', audioTTS: 'We take an exam.' },
    { skill: Skill.SPEAKING, n: 5, type: 'read_aloud', q: 'Listen and repeat: "He is a teacher in our school."', es: 'Escucha y repite', opts: ['He is a teacher in our school.','He is an teacher in our school.','He is the teacher in school.','He am a teacher in school.'], ans: 'He is a teacher in our school.', exp: 'Ritmo en "a teacher".', audioTTS: 'He is a teacher in our school.' },
    { skill: Skill.SPEAKING, n: 6, type: 'read_aloud', q: 'Listen and repeat: "The office is clean and big."', es: 'Escucha y repite', opts: ['The office is clean and big.','An office is clean and big.','A office is clean and big.','Office is clean and big.'], ans: 'The office is clean and big.', exp: 'The suena /ði/ antes de vocal.', audioTTS: 'The office is clean and big.' },
    { skill: Skill.SPEAKING, n: 7, type: 'read_aloud', q: 'Listen and repeat: "The books are on the table."', es: 'Escucha y repite', opts: ['The books are on the table.','Books are on table.','A books are on table.','The book is on table.'], ans: 'The books are on the table.', exp: 'Acentúa books y table.', audioTTS: 'The books are on the table.' },
    { skill: Skill.SPEAKING, n: 8, type: 'read_aloud', q: 'Listen and repeat the Block Switch: "I have a book. The book is new."', es: 'Escucha y repite el Cambio', opts: ['I have a book. The book is new.','I have an book. A book is new.','I have the book. The book is new.','I has a book. Book is new.'], ans: 'I have a book. The book is new.', exp: 'Enfatiza el cambio.', audioTTS: 'I have a book. The book is new.' },
    { skill: Skill.SPEAKING, n: 9, type: 'read_aloud', q: 'Listen and answer using "an": "What do you take in class?"', es: 'Responde con "an"', opts: ['We take an exam.','We take a exam.','We take the exam.','We takes exam.'], ans: 'We take an exam.', exp: 'Ligadura "an exam".', audioTTS: 'We take an exam.' },
    { skill: Skill.SPEAKING, n: 10, type: 'read_aloud', q: 'Listen and repeat: "The exam is easy for the students."', es: 'Escucha y repite', opts: ['The exam is easy for the students.','An exam is easy for students.','A exam is easy for the students.','The exam are easy for students.'], ans: 'The exam is easy for the students.', exp: 'The exam claro.', audioTTS: 'The exam is easy for the students.' },
  ];

  for (const ex of E) {
    const id = `CLASE_07_${ex.skill}_${String(ex.n).padStart(2, '0')}`;
    // 🔊 audioTTS: si viene explícito lo usamos; si no, generamos la frase completa
    //    reemplazando ___ con la respuesta correcta.
    let audioText = ex.audioTTS;
    if (!audioText && ex.q.includes('____')) {
      audioText = ex.q.replace(/_{3,}/g, ex.ans);
    }
    const audioTTS = audioText
      ? { segments: [{ text: audioText, lang: 'en', voiceGender: 'female' }] }
      : null;

    await prisma.exercise.create({
      data: {
        id, lessonId, skill: ex.skill, itemNumber: ex.n, questionType: ex.type,
        questionText: ex.q, translationSentence: ex.es,
        optionsJson: ex.opts, correctAnswer: ex.ans, explanation: ex.exp,
        points: 10, active: true, audioTTS: audioTTS as any,
      },
    });
  }
  console.log(`🎉 50 ejercicios con audioTTS COMPLETO (frase con respuesta incluida)`);
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
