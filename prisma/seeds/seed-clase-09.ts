import { PrismaClient, Skill } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Sembrando CLASE_09 — Presente Simple y el Hack de la 3ra Persona');

  const lessonId = 'CLASE_09';

  // ═══════ 1. LECCIÓN ═══════
  await prisma.lesson.upsert({
    where: { id: lessonId },
    update: {
      level: 'A1',
      title: 'CLASE 09 TECLINGO: Presente Simple y el Hack de la 3ra Persona',
      description: 'Domina el Presente Simple. Aprende cuándo el verbo NO cambia (I, You, We, They) y las 4 reglas de escritura para la 3ra persona (He, She, It): -S, -ES, -IES, y HAVE → HAS.',
      order: 9,
      isPublished: true,
      videoUrl: 'https://youtube.com/shorts/Y9UxZ78xpe0?si=fw1FNAOpKZgVxom0',
      tituloVideo: 'Presente Simple y el Hack de la 3ra Persona',
      temaPrincipal: 'Presente Simple y la 3ra Persona (-S, -ES, -IES, HAS)',
      tipoContenido: 'original',
      duracionMin: 15,
      semana: 0,
      sesion: 'A',
    },
    create: {
      id: lessonId,
      level: 'A1',
      title: 'CLASE 09 TECLINGO: Presente Simple y el Hack de la 3ra Persona',
      description: 'Domina el Presente Simple. Aprende cuándo el verbo NO cambia (I, You, We, They) y las 4 reglas de escritura para la 3ra persona (He, She, It): -S, -ES, -IES, y HAVE → HAS.',
      order: 9,
      isPublished: true,
      videoUrl: 'https://youtube.com/shorts/Y9UxZ78xpe0?si=fw1FNAOpKZgVxom0',
      tituloVideo: 'Presente Simple y el Hack de la 3ra Persona',
      temaPrincipal: 'Presente Simple y la 3ra Persona (-S, -ES, -IES, HAS)',
      tipoContenido: 'original',
      duracionMin: 15,
      semana: 0,
      sesion: 'A',
    },
  });
  console.log('✅ Lección');

  // ═══════ 2. TEACHER SCRIPT BILINGÜE ═══════
  const scriptEs = `¡Bienvenido a la Clase 09 de Teclingo! Hoy dominaremos el Presente Simple, el tiempo verbal que usamos para hablar de rutinas, hábitos y verdades generales.

La clave del Presente Simple es entender que hay dos bloques: uno donde el verbo NO cambia y otro donde el verbo SÍ cambia.

1. Bloque 1 y Bloque Plural — Sin cambios (I, You, We, They):
Para 'I' (Yo) y para todos los grupos plurales (You, We, They), el verbo se queda tal cual, en su forma base (como aparece en el diccionario).
- I work: Yo trabajo.
- We study: Nosotros estudiamos.
- They eat: Ellos comen.

2. Bloque 3 — La Regla de la Tercera Persona (He, She, It):
Cuando el sujeto es un singular externo (He, She, It), el verbo cambia su escritura. Hay 4 reglas:

Regla General: Se agrega -S al final.
- He works: Él trabaja.

Regla Especial (verbos terminados en O, X, S, SH, CH, Z): Se agrega -ES.
- She goes: Ella va.
- He watches: Él mira.
- It does: Eso hace (de aquí nace la palabra DOES).

Regla de la Y (Consonante + Y): Se cambia la Y por -IES.
- She studies: Ella estudia.

Regla de la Y (Vocal + Y): Solo se agrega -S.
- He plays: Él juega.

Verbo Irregular (HAVE): Cambia totalmente a HAS.
- She has a book: Ella tiene un libro.

Enfoque Global: El inglés es un sistema de precisión por bloques. Recuerda la regla de oro: solo los singulares externos (He, She, It) cambian el verbo. ¡Excelente trabajo!`;

  const scriptEn = `Welcome to Teclingo Class 09! Today we will master the Simple Present, the tense we use to talk about routines, habits and general truths.

The key to the Simple Present is understanding that there are two blocks: one where the verb does NOT change, and another where the verb DOES change.

1. Block 1 and Plural Block — No change (I, You, We, They):
For 'I' and all plural groups (You, We, They), the verb stays the same, in its base form (as it appears in the dictionary).
- I work.
- We study.
- They eat.

2. Block 3 — The Third Person Rule (He, She, It):
When the subject is an external singular (He, She, It), the verb changes its spelling. There are 4 rules:

General Rule: Add -S at the end.
- He works.

Special Rule (verbs ending in O, X, S, SH, CH, Z): Add -ES.
- She goes.
- He watches.
- It does (this is where the word DOES comes from).

Y Rule (Consonant + Y): Change the Y to -IES.
- She studies.

Y Rule (Vowel + Y): Just add -S.
- He plays.

Irregular Verb (HAVE): Changes completely to HAS.
- She has a book.

Global Focus: English is a precision block system. Remember the golden rule: only external singulars (He, She, It) change the verb. Great job!`;

  await prisma.teacherScript.upsert({
    where: { lessonId },
    update: {
      title: 'Fundamento Académico y Guion del Tutor - Clase 09',
      content: scriptEs,
      contentEn: scriptEn,
      duration: 180,
    },
    create: {
      lessonId,
      title: 'Fundamento Académico y Guion del Tutor - Clase 09',
      content: scriptEs,
      contentEn: scriptEn,
      duration: 180,
    },
  });
  console.log('✅ TeacherScript');

  // ═══════ 3. TEXTBASE ═══════
  await prisma.textBase.deleteMany({ where: { lessonId } });
  await prisma.textBase.create({
    data: {
      lessonId,
      title: 'Texto Base de Apoyo - Clase 09 (Presente Simple)',
      content: 'Hello! I am Alex. I work in an office every day. We study English in the morning. They eat lunch at one o\'clock. Maria is a teacher. She works at the university. She goes to class at eight. Luis watches TV in the evening. He studies math at night. She has a new book on her table.',
      translation: '¡Hola! Yo soy Alex. Trabajo en una oficina todos los días. Estudiamos inglés en la mañana. Ellos comen a la una. María es maestra. Ella trabaja en la universidad. Ella va a clase a las ocho. Luis ve televisión por la tarde. Él estudia matemáticas de noche. Ella tiene un libro nuevo sobre su mesa.',
      wordCount: 55,
      difficulty: 1,
      timeAudioSec: 35,
      vocabList: ['i', 'you', 'we', 'they', 'he', 'she', 'it', 'work', 'works', 'study', 'studies', 'eat', 'goes', 'watches', 'has'],
      verbsList: ['am', 'work', 'study', 'eat', 'is', 'works', 'goes', 'watches', 'studies', 'has'],
      active: true,
    },
  });
  console.log('✅ TextBase');

  // ═══════ 4. LIBRERÍA ═══════
  await prisma.vocabularyItem.deleteMany({ where: { lessonId } });
  const lib = [
    { term: 'a', translation: 'un / una → antes de CONSONANTE', type: 'article', ttsText: 'a', exampleUse: 'I have a book.', tags: ['article', 'consonant-sound'], pronunciationAf: '/ə/' },
    { term: 'an', translation: 'un / una → antes de VOCAL', type: 'article', ttsText: 'an', exampleUse: 'She has an idea.', tags: ['article', 'vowel-sound'], pronunciationAf: '/ən/' },
    { term: 'the', translation: 'el / la / los / las → ESPECÍFICO', type: 'article', ttsText: 'the', exampleUse: 'The book is big.', tags: ['article', 'specific'], pronunciationAf: '/ðə/ o /ði/' },
    { term: 'work', translation: 'trabajar (I, You, We, They)', type: 'verb', ttsText: 'work', exampleUse: 'I work every day.', tags: ['verb', 'base-form'], pronunciationAf: '/wɜːrk/' },
    { term: 'works', translation: 'trabaja (He, She, It) → +S', type: 'verb', ttsText: 'works', exampleUse: 'She works at the university.', tags: ['verb', '3rd-person-s'], pronunciationAf: '/wɜːrks/' },
    { term: 'study', translation: 'estudiar (I, You, We, They)', type: 'verb', ttsText: 'study', exampleUse: 'We study English.', tags: ['verb', 'base-form'], pronunciationAf: '/ˈstʌdi/' },
    { term: 'studies', translation: 'estudia (He, She, It) → Y cambia a IES', type: 'verb', ttsText: 'studies', exampleUse: 'She studies math.', tags: ['verb', '3rd-person-ies'], pronunciationAf: '/ˈstʌdiz/' },
    { term: 'go', translation: 'ir (I, You, We, They)', type: 'verb', ttsText: 'go', exampleUse: 'We go to school.', tags: ['verb', 'base-form'], pronunciationAf: '/ɡoʊ/' },
    { term: 'goes', translation: 'va (He, She, It) → +ES (termina en O)', type: 'verb', ttsText: 'goes', exampleUse: 'She goes to class.', tags: ['verb', '3rd-person-es'], pronunciationAf: '/ɡoʊz/' },
    { term: 'watch', translation: 'mirar / ver (I, You, We, They)', type: 'verb', ttsText: 'watch', exampleUse: 'I watch TV.', tags: ['verb', 'base-form'], pronunciationAf: '/wɑːtʃ/' },
    { term: 'watches', translation: 'mira (He, She, It) → +ES (termina en CH)', type: 'verb', ttsText: 'watches', exampleUse: 'He watches TV.', tags: ['verb', '3rd-person-es'], pronunciationAf: '/ˈwɑːtʃɪz/' },
    { term: 'has', translation: 'tiene (He, She, It) → irregular de HAVE', type: 'verb', ttsText: 'has', exampleUse: 'She has a book.', tags: ['verb', '3rd-person-irregular'], pronunciationAf: '/hæz/' },
    { term: 'work (noun)', translation: 'trabajo / empleo', type: 'noun', ttsText: 'work', exampleUse: 'I go to work at eight.', tags: ['noun'], pronunciationAf: '/wɜːrk/' },
    { term: 'office', translation: 'oficina', type: 'noun', ttsText: 'office', exampleUse: 'I work in an office.', tags: ['noun', 'vowel-start'], pronunciationAf: '/ˈɔːfɪs/' },
    { term: 'teacher', translation: 'maestro / profesora', type: 'noun', ttsText: 'teacher', exampleUse: 'She is a teacher.', tags: ['noun', 'consonant-start'], pronunciationAf: '/ˈtiːtʃər/' },
    { term: 'university', translation: 'universidad', type: 'noun', ttsText: 'university', exampleUse: 'She works at the university.', tags: ['noun', 'vowel-start'], pronunciationAf: '/ˌjuːnɪˈvɜːrsəti/' },
  ];

  for (const item of lib) {
    await prisma.vocabularyItem.create({
      data: {
        lessonId,
        term: item.term,
        translation: item.translation,
        type: item.type,
        ttsText: item.ttsText,
        lang: 'en',
        exampleUse: item.exampleUse,
        pronunciationAf: item.pronunciationAf ?? null,
        tags: item.tags ?? [],
      },
    });
  }
  console.log(`✅ Librería: ${lib.length}`);

  // ═══════ 5. EJERCICIOS (50 con audioTTS completo) ═══════
  const existingEx = await prisma.exercise.findMany({
    where: { lessonId },
    select: { id: true },
  });
  const exIds = existingEx.map(e => e.id);
  if (exIds.length > 0) {
    await prisma.submission.deleteMany({ where: { exerciseId: { in: exIds } } });
    await prisma.examQuestion.deleteMany({ where: { exerciseId: { in: exIds } } });
  }
  await prisma.exercise.deleteMany({ where: { lessonId } });

  const E: any[] = [
    // ═══════════ GRAMMAR (10) ═══════════
    { skill: Skill.GRAMMAR, n: 1, type: 'multiple_choice', q: 'Choose the correct form: "I ________ in an office every day."', es: 'Elige la forma correcta: "Trabajo en una oficina todos los días"', opts: ['work', 'works', 'working', 'worked'], ans: 'work', exp: 'Bloque 1 (I): el verbo se queda en forma base sin cambios.', audioTTS: 'I work in an office every day.' },
    { skill: Skill.GRAMMAR, n: 2, type: 'multiple_choice', q: 'Choose the correct form: "She ________ at the university."', es: 'Elige la forma correcta: "Ella trabaja en la universidad"', opts: ['work', 'works', 'working', 'worked'], ans: 'works', exp: 'Bloque 3 (She): se agrega -S a la forma base.', audioTTS: 'She works at the university.' },
    { skill: Skill.GRAMMAR, n: 3, type: 'multiple_choice', q: 'Choose the correct form: "We ________ English in the morning."', es: 'Elige la forma correcta: "Estudiamos inglés en la mañana"', opts: ['study', 'studies', 'studied', 'studying'], ans: 'study', exp: 'Bloque Plural (We): el verbo se queda en forma base.', audioTTS: 'We study English in the morning.' },
    { skill: Skill.GRAMMAR, n: 4, type: 'multiple_choice', q: 'Choose the correct form: "He ________ math at night."', es: 'Elige la forma correcta: "Él estudia matemáticas de noche"', opts: ['study', 'studies', 'studied', 'studying'], ans: 'studies', exp: 'Bloque 3 (He) + Y después de consonante → -IES.', audioTTS: 'He studies math at night.' },
    { skill: Skill.GRAMMAR, n: 5, type: 'multiple_choice', q: 'Choose the correct form: "She ________ to class at eight."', es: 'Elige la forma correcta: "Ella va a clase a las ocho"', opts: ['go', 'goes', 'going', 'went'], ans: 'goes', exp: 'Bloque 3 (She) + termina en O → -ES.', audioTTS: 'She goes to class at eight.' },
    { skill: Skill.GRAMMAR, n: 6, type: 'multiple_choice', q: 'Choose the correct form: "He ________ TV in the evening."', es: 'Elige la forma correcta: "Él ve televisión por la tarde"', opts: ['watch', 'watches', 'watching', 'watched'], ans: 'watches', exp: 'Bloque 3 (He) + termina en CH → -ES.', audioTTS: 'He watches TV in the evening.' },
    { skill: Skill.GRAMMAR, n: 7, type: 'multiple_choice', q: 'Choose the correct form: "She ________ a new book."', es: 'Elige la forma correcta: "Ella tiene un libro nuevo"', opts: ['have', 'has', 'having', 'had'], ans: 'has', exp: 'Bloque 3 (She) + HAVE es irregular → HAS.', audioTTS: 'She has a new book.' },
    { skill: Skill.GRAMMAR, n: 8, type: 'multiple_choice', q: 'Identify the error: "She work at the university."', es: 'Identifica el error: "She work at the university"', opts: ['"work" should be "works"', '"at" should be "in"', '"university" should be plural', 'No error'], ans: '"work" should be "works"', exp: 'Bloque 3 (She) exige -S → works.', audioTTS: 'She works at the university.' },
    { skill: Skill.GRAMMAR, n: 9, type: 'multiple_choice', q: 'Identify the error: "He study math at night."', es: 'Identifica el error: "He study math at night"', opts: ['"study" should be "studies"', '"math" should be "maths"', '"at" should be "in"', 'No error'], ans: '"study" should be "studies"', exp: 'Bloque 3 (He) + Y después de consonante → -IES.', audioTTS: 'He studies math at night.' },
    { skill: Skill.GRAMMAR, n: 10, type: 'multiple_choice', q: 'Which pronouns use "-S" or "-ES" in the Simple Present?', es: '¿Qué pronombres usan "-S" o "-ES" en Presente Simple?', opts: ['He, She, It', 'I, You, We', 'You, We, They', 'I, He, They'], ans: 'He, She, It', exp: 'Bloque 3 (Singulares externos): He, She, It cambian el verbo.', audioTTS: 'He, She, and It use S or ES.' },

    // ═══════════ READING (10) ═══════════
    { skill: Skill.READING, n: 1, type: 'multiple_choice', q: 'Where does Alex work?', es: '¿Dónde trabaja Alex?', opts: ['in an office', 'at school', 'in a hospital', 'at the university'], ans: 'in an office', exp: 'Texto: "I work in an office every day".' },
    { skill: Skill.READING, n: 2, type: 'multiple_choice', q: 'When do they study English?', es: '¿Cuándo estudian inglés?', opts: ['in the morning', 'at night', 'in the evening', 'at noon'], ans: 'in the morning', exp: 'Texto: "We study English in the morning".' },
    { skill: Skill.READING, n: 3, type: 'multiple_choice', q: 'What time do they eat lunch?', es: '¿A qué hora comen?', opts: ['at one o\'clock', 'at noon', 'at eight', 'at six'], ans: 'at one o\'clock', exp: 'Texto: "They eat lunch at one o\'clock".' },
    { skill: Skill.READING, n: 4, type: 'multiple_choice', q: 'Where does Maria work?', es: '¿Dónde trabaja María?', opts: ['at the university', 'in an office', 'in a hospital', 'at home'], ans: 'at the university', exp: 'Texto: "She works at the university".' },
    { skill: Skill.READING, n: 5, type: 'multiple_choice', q: 'What time does Maria go to class?', es: '¿A qué hora va María a clase?', opts: ['at eight', 'at one', 'at six', 'at nine'], ans: 'at eight', exp: 'Texto: "She goes to class at eight".' },
    { skill: Skill.READING, n: 6, type: 'multiple_choice', q: 'What does Luis do in the evening?', es: '¿Qué hace Luis por la tarde?', opts: ['watches TV', 'studies math', 'works', 'reads'], ans: 'watches TV', exp: 'Texto: "Luis watches TV in the evening".' },
    { skill: Skill.READING, n: 7, type: 'multiple_choice', q: 'When does Luis study math?', es: '¿Cuándo estudia matemáticas Luis?', opts: ['at night', 'in the morning', 'in the evening', 'at noon'], ans: 'at night', exp: 'Texto: "He studies math at night".' },
    { skill: Skill.READING, n: 8, type: 'multiple_choice', q: 'Why is "works" used with "She" in the text?', es: '¿Por qué se usa "works" con "She"?', opts: ['Because She is 3rd person singular', 'Because works is base form', 'Because the verb ends in vowel', 'Because it is a question'], ans: 'Because She is 3rd person singular', exp: 'Bloque 3: He, She, It cambian el verbo.' },
    { skill: Skill.READING, n: 9, type: 'multiple_choice', q: 'Why is "study" not "studies" in "We study English"?', es: '¿Por qué es "study" y no "studies" en "We study English"?', opts: ['Because We is a plural subject block', 'Because study is irregular', 'Because the verb ends in Y', 'Because it is negative'], ans: 'Because We is a plural subject block', exp: 'Bloque Plural: We no cambia el verbo.' },
    { skill: Skill.READING, n: 10, type: 'multiple_choice', q: 'What rule applies to "studies" (from study)?', es: '¿Qué regla se aplica en "studies"?', opts: ['Y → IES', 'S → ES', 'Add S', 'Irregular'], ans: 'Y → IES', exp: 'Consonante + Y → se cambia a IES.' },

    // ═══════════ LISTENING (10) ═══════════
    { skill: Skill.LISTENING, n: 1, type: 'listen_and_select', q: 'Which verb form did you hear for "I"?', es: '¿Qué forma verbal escuchaste para "I"?', opts: ['work', 'works', 'working', 'worked'], ans: 'work', exp: 'Audio: "I work in an office every day."', audioTTS: 'I work in an office every day.' },
    { skill: Skill.LISTENING, n: 2, type: 'listen_and_select', q: 'Which verb form did you hear for "She"?', es: '¿Qué forma verbal escuchaste para "She"?', opts: ['works', 'work', 'working', 'worked'], ans: 'works', exp: 'Audio: "She works at the university."', audioTTS: 'She works at the university.' },
    { skill: Skill.LISTENING, n: 3, type: 'listen_and_select', q: 'Which verb form did you hear for "We"?', es: '¿Qué forma verbal escuchaste para "We"?', opts: ['study', 'studies', 'studied', 'studying'], ans: 'study', exp: 'Audio: "We study English in the morning."', audioTTS: 'We study English in the morning.' },
    { skill: Skill.LISTENING, n: 4, type: 'listen_and_select', q: 'Which verb form did you hear for "He"?', es: '¿Qué forma verbal escuchaste para "He"?', opts: ['studies', 'study', 'studied', 'studying'], ans: 'studies', exp: 'Audio: "He studies math at night."', audioTTS: 'He studies math at night.' },
    { skill: Skill.LISTENING, n: 5, type: 'listen_and_select', q: 'Which form did you hear for "She" (verb GO)?', es: '¿Qué forma escuchaste para "She" con el verbo GO?', opts: ['goes', 'go', 'going', 'went'], ans: 'goes', exp: 'Audio: "She goes to class at eight."', audioTTS: 'She goes to class at eight.' },
    { skill: Skill.LISTENING, n: 6, type: 'listen_and_select', q: 'Which form did you hear for "He" (verb WATCH)?', es: '¿Qué forma escuchaste para "He" con WATCH?', opts: ['watches', 'watch', 'watching', 'watched'], ans: 'watches', exp: 'Audio: "He watches TV in the evening."', audioTTS: 'He watches TV in the evening.' },
    { skill: Skill.LISTENING, n: 7, type: 'listen_and_select', q: 'Which form did you hear for "She" (verb HAVE)?', es: '¿Qué forma escuchaste para "She" con HAVE?', opts: ['has', 'have', 'having', 'had'], ans: 'has', exp: 'Audio: "She has a new book."', audioTTS: 'She has a new book.' },
    { skill: Skill.LISTENING, n: 8, type: 'listen_and_select', q: 'Where does Alex work according to the audio?', es: '¿Dónde trabaja Alex según el audio?', opts: ['in an office', 'at school', 'at home', 'in a hospital'], ans: 'in an office', exp: 'Audio: "I work in an office every day."', audioTTS: 'I work in an office every day.' },
    { skill: Skill.LISTENING, n: 9, type: 'listen_and_select', q: 'What does Luis do in the evening?', es: '¿Qué hace Luis por la tarde?', opts: ['watches TV', 'studies math', 'works', 'reads'], ans: 'watches TV', exp: 'Audio: "He watches TV in the evening."', audioTTS: 'He watches TV in the evening.' },
    { skill: Skill.LISTENING, n: 10, type: 'listen_and_select', q: 'Where does Maria work?', es: '¿Dónde trabaja María?', opts: ['at the university', 'in an office', 'at home', 'in a hospital'], ans: 'at the university', exp: 'Audio: "She works at the university."', audioTTS: 'She works at the university.' },

    // ═══════════ WRITING (10) ═══════════
    { skill: Skill.WRITING, n: 1, type: 'translation', q: 'Translate: "Trabajo en una oficina."', es: 'Traduce: "Trabajo en una oficina"', opts: ['I work in an office.', 'I works in an office.', 'I am work in an office.', 'I working in an office.'], ans: 'I work in an office.', exp: 'Con "work" (I).' },
    { skill: Skill.WRITING, n: 2, type: 'translation', q: 'Translate: "Ella trabaja en la universidad."', es: 'Traduce: "Ella trabaja en la universidad"', opts: ['She works at the university.', 'She work at the university.', 'She working at the university.', 'She is work at the university.'], ans: 'She works at the university.', exp: 'Con "works" (She).' },
    { skill: Skill.WRITING, n: 3, type: 'translation', q: 'Translate: "Estudiamos inglés."', es: 'Traduce: "Estudiamos inglés"', opts: ['We study English.', 'We studies English.', 'We studying English.', 'We are study English.'], ans: 'We study English.', exp: 'Con "study" (We).' },
    { skill: Skill.WRITING, n: 4, type: 'translation', q: 'Translate: "Él estudia matemáticas."', es: 'Traduce: "Él estudia matemáticas"', opts: ['He studies math.', 'He study math.', 'He studying math.', 'He is study math.'], ans: 'He studies math.', exp: 'Con "studies" (He) → Y a IES.' },
    { skill: Skill.WRITING, n: 5, type: 'translation', q: 'Translate: "Ella va a clase."', es: 'Traduce: "Ella va a clase"', opts: ['She goes to class.', 'She go to class.', 'She going to class.', 'She is go to class.'], ans: 'She goes to class.', exp: 'Con "goes" (She) → termina en O, +ES.' },
    { skill: Skill.WRITING, n: 6, type: 'translation', q: 'Translate: "Él mira televisión."', es: 'Traduce: "Él mira televisión"', opts: ['He watches TV.', 'He watch TV.', 'He watching TV.', 'He is watch TV.'], ans: 'He watches TV.', exp: 'Con "watches" (He) → termina en CH, +ES.' },
    { skill: Skill.WRITING, n: 7, type: 'translation', q: 'Translate: "Ella tiene un libro."', es: 'Traduce: "Ella tiene un libro"', opts: ['She has a book.', 'She have a book.', 'She having a book.', 'She is have a book.'], ans: 'She has a book.', exp: 'Con "has" (She) → HAVE es irregular.' },
    { skill: Skill.WRITING, n: 8, type: 'translation', q: 'Translate: "Él juega fútbol."', es: 'Traduce: "Él juega fútbol"', opts: ['He plays soccer.', 'He plaies soccer.', 'He play soccer.', 'He is play soccer.'], ans: 'He plays soccer.', exp: 'Vocal + Y → solo se agrega S.' },
    { skill: Skill.WRITING, n: 9, type: 'translation', q: 'Translate: "Ellos comen a la una."', es: 'Traduce: "Ellos comen a la una"', opts: ['They eat at one o\'clock.', 'They eats at one o\'clock.', 'They eating at one o\'clock.', 'They are eat at one o\'clock.'], ans: 'They eat at one o\'clock.', exp: 'Con "eat" (They).' },
    { skill: Skill.WRITING, n: 10, type: 'translation', q: 'Translate: "Ella estudia en la mañana."', es: 'Traduce: "Ella estudia en la mañana"', opts: ['She studies in the morning.', 'She study in the morning.', 'She studying in the morning.', 'She is study in the morning.'], ans: 'She studies in the morning.', exp: 'Con "studies" (She).' },

    // ═══════════ SPEAKING (10) ═══════════
    { skill: Skill.SPEAKING, n: 1, type: 'read_aloud', q: 'Read aloud: "I work in an office."', es: 'Lee en voz alta', opts: ['I work in an office.', 'I works in an office.', 'I working in an office.', 'I am work in an office.'], ans: 'I work in an office.', exp: 'Ritmo natural en "work in an".', audioTTS: 'I work in an office.' },
    { skill: Skill.SPEAKING, n: 2, type: 'read_aloud', q: 'Read aloud: "She works at the university."', es: 'Lee en voz alta', opts: ['She works at the university.', 'She work at the university.', 'She working at the university.', 'She is work at the university.'], ans: 'She works at the university.', exp: '"works" con S suave /s/.', audioTTS: 'She works at the university.' },
    { skill: Skill.SPEAKING, n: 3, type: 'read_aloud', q: 'Read aloud: "We study English."', es: 'Lee en voz alta', opts: ['We study English.', 'We studies English.', 'We studying English.', 'We are study English.'], ans: 'We study English.', exp: 'Ritmo natural en "study English".', audioTTS: 'We study English.' },
    { skill: Skill.SPEAKING, n: 4, type: 'read_aloud', q: 'Read aloud: "He studies math."', es: 'Lee en voz alta', opts: ['He studies math.', 'He study math.', 'He studying math.', 'He is study math.'], ans: 'He studies math.', exp: '"studies" con /z/ final.', audioTTS: 'He studies math.' },
    { skill: Skill.SPEAKING, n: 5, type: 'read_aloud', q: 'Read aloud: "She goes to class."', es: 'Lee en voz alta', opts: ['She goes to class.', 'She go to class.', 'She going to class.', 'She is go to class.'], ans: 'She goes to class.', exp: '"goes" suena /ɡoʊz/.', audioTTS: 'She goes to class.' },
    { skill: Skill.SPEAKING, n: 6, type: 'read_aloud', q: 'Read aloud: "He watches TV."', es: 'Lee en voz alta', opts: ['He watches TV.', 'He watch TV.', 'He watching TV.', 'He is watch TV.'], ans: 'He watches TV.', exp: '"watches" con /ɪz/ final.', audioTTS: 'He watches TV.' },
    { skill: Skill.SPEAKING, n: 7, type: 'read_aloud', q: 'Read aloud: "She has a new book."', es: 'Lee en voz alta', opts: ['She has a new book.', 'She have a new book.', 'She having a new book.', 'She is have a new book.'], ans: 'She has a new book.', exp: 'Liga "has a".', audioTTS: 'She has a new book.' },
    { skill: Skill.SPEAKING, n: 8, type: 'read_aloud', q: 'Read aloud: "He plays soccer."', es: 'Lee en voz alta', opts: ['He plays soccer.', 'He plaies soccer.', 'He play soccer.', 'He is play soccer.'], ans: 'He plays soccer.', exp: '"plays" suena /pleɪz/.', audioTTS: 'He plays soccer.' },
    { skill: Skill.SPEAKING, n: 9, type: 'read_aloud', q: 'Read aloud: "They eat lunch at one o\'clock."', es: 'Lee en voz alta', opts: ['They eat lunch at one o\'clock.', 'They eats lunch at one o\'clock.', 'They eating lunch at one o\'clock.', 'They are eat lunch at one o\'clock.'], ans: 'They eat lunch at one o\'clock.', exp: 'Ritmo natural en "eat lunch".', audioTTS: 'They eat lunch at one o\'clock.' },
    { skill: Skill.SPEAKING, n: 10, type: 'read_aloud', q: 'Read aloud: "She studies in the morning."', es: 'Lee en voz alta', opts: ['She studies in the morning.', 'She study in the morning.', 'She studying in the morning.', 'She is study in the morning.'], ans: 'She studies in the morning.', exp: '"studies in" ligado.', audioTTS: 'She studies in the morning.' },
  ];

  for (const ex of E) {
    const id = `CLASE_09_${ex.skill}_${String(ex.n).padStart(2, '0')}`;
    const audioTTS = ex.audioTTS
      ? { segments: [{ text: ex.audioTTS, lang: 'en', voiceGender: 'female' }] }
      : null;

    await prisma.exercise.create({
      data: {
        id, lessonId,
        skill: ex.skill,
        itemNumber: ex.n,
        questionType: ex.type,
        questionText: ex.q,
        translationSentence: ex.es,
        optionsJson: ex.opts,
        correctAnswer: ex.ans,
        explanation: ex.exp,
        points: 10,
        active: true,
        audioTTS: audioTTS as any,
      },
    });
  }
  console.log(`🎉 50 ejercicios con audioTTS completo (10 por skill)`);
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
