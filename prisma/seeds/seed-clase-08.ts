import { PrismaClient, Skill } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Sembrando CLASE_08 — El Verbo HAVE (Posesión y el Secreto del HAS)');

  const lessonId = 'CLASE_08';

  // ═══════ 1. LECCIÓN ═══════
  await prisma.lesson.upsert({
    where: { id: lessonId },
    update: {
      level: 'A1',
      title: 'CLASE 08 TECLINGO: El Verbo HAVE (Posesión y el Secreto del HAS)',
      description: 'Aprende a expresar posesión con el verbo HAVE para I, You, We, They y el cambio especial a HAS para la 3ra persona (He, She, It) en el nivel A1.',
      order: 8,
      isPublished: true,
      videoUrl: 'https://youtube.com/shorts/si-g3xCJvpA?si=j3Kvbi8YKTbNtkHR',
      tituloVideo: 'CLASE 08 TECLINGO: El Verbo HAVE (Posesión y el Secreto del HAS)',
      temaPrincipal: 'El Verbo HAVE (Posesión) y HAS (3ra Persona)',
      tipoContenido: 'original',
      duracionMin: 15,
      semana: 0,
      sesion: 'A',
    },
    create: {
      id: lessonId,
      level: 'A1',
      title: 'CLASE 08 TECLINGO: El Verbo HAVE (Posesión y el Secreto del HAS)',
      description: 'Aprende a expresar posesión con el verbo HAVE para I, You, We, They y el cambio especial a HAS para la 3ra persona (He, She, It) en el nivel A1.',
      order: 8,
      isPublished: true,
      videoUrl: 'https://youtube.com/shorts/si-g3xCJvpA?si=j3Kvbi8YKTbNtkHR',
      tituloVideo: 'CLASE 08 TECLINGO: El Verbo HAVE (Posesión y el Secreto del HAS)',
      temaPrincipal: 'El Verbo HAVE (Posesión) y HAS (3ra Persona)',
      tipoContenido: 'original',
      duracionMin: 15,
      semana: 0,
      sesion: 'A',
    },
  });
  console.log('✅ Lección');

  // ═══════ 2. TEACHER SCRIPT BILINGÜE ═══════
  const scriptEs = `¡Bienvenido a la Clase 08 de Teclingo! Hoy dominaremos el verbo HAVE, que significa Tener.

Para usarlo correctamente sin memorizar listas confusas, seguiremos nuestros Bloques Lógicos de la Fase Cero.

1. Bloque 1 y Bloque Plural (HAVE):
Para 'I' (Yo) y para todos los grupos de varias personas (You, We, They), el verbo se mantiene en su forma base: HAVE.
- I have a book: Yo tengo un libro.
- You have a pen: Tú tienes un bolígrafo.
- We have a house: Nosotros tenemos una casa.
- They have friends: Ellos tienen amigos.

2. Bloque 3 - La Excepción Especial (HAS):
Presta mucha atención: las Terceras Personas (He, She, It) son singulares externos y cambian la escritura del verbo a HAS en oraciones afirmativas.
- He has a car: Él tiene un carro.
- She has a computer: Ella tiene una computadora.
- It has a name: Eso tiene un nombre.

Enfoque Global: El inglés es un sistema de precisión por bloques. Si el dueño es Yo o un Grupo Plural, usas HAVE. Si el dueño es un Singular Externo (He, She, It), usas HAS. Dominar este filtro hará que tu inglés sea exacto. ¡Excelente trabajo!`;

  const scriptEn = `Welcome to Teclingo Class 08! Today we will master the verb HAVE, which means To Have.

To use it correctly without confusing lists, we will follow our Logic Blocks from Phase Zero.

1. Block 1 and Plural Block (HAVE):
For 'I' and for all plural groups (You, We, They), the verb stays in its base form: HAVE.
- I have a book.
- You have a pen.
- We have a house.
- They have friends.

2. Block 3 - The Special Exception (HAS):
Pay close attention: Third Persons (He, She, It) are external singulars and change the verb spelling to HAS in affirmative sentences.
- He has a car.
- She has a computer.
- It has a name.

Global Focus: English is a precision block system. If the owner is I or a Plural Group, use HAVE. If the owner is an External Singular, use HAS. Mastering this filter will make your English exact. Great job!`;

  await prisma.teacherScript.upsert({
    where: { lessonId },
    update: {
      title: 'Fundamento Académico y Guion del Tutor - Clase 08',
      content: scriptEs,
      contentEn: scriptEn,
      duration: 180,
    },
    create: {
      lessonId,
      title: 'Fundamento Académico y Guion del Tutor - Clase 08',
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
      title: 'Texto Base de Apoyo - Clase 08 (El Verbo HAVE y HAS)',
      content: 'Hello! I am Alex. I have a new computer. We have a class in the morning. Maria is a teacher in the office. She has a big book on her table. Luis has a car in the garage. They have many friends at the university. It has a clean room.',
      translation: '¡Hola! Yo soy Alex. Tengo una computadora nueva. Tenemos una clase en la mañana. María es una maestra en la oficina. Ella tiene un libro grande sobre su mesa. Luis tiene un carro en el garaje. Ellos tienen muchos amigos en la universidad. Eso tiene un cuarto limpio.',
      wordCount: 52,
      difficulty: 1,
      timeAudioSec: 32,
      vocabList: ['a', 'an', 'the', 'have', 'has', 'computer', 'class', 'office', 'teacher', 'book', 'table', 'car', 'friends', 'room'],
      verbsList: ['am', 'have', 'is', 'has'],
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
    { term: 'have', translation: 'tener / poseer (I, You, We, They)', type: 'verb', ttsText: 'have', exampleUse: 'I have a computer.', tags: ['verb', 'base-form'], pronunciationAf: '/hæv/' },
    { term: 'has', translation: 'tiene / posee (He, She, It)', type: 'verb', ttsText: 'has', exampleUse: 'She has a car.', tags: ['verb', '3rd-person'], pronunciationAf: '/hæz/' },
    { term: 'computer', translation: 'computadora', type: 'noun', ttsText: 'computer', exampleUse: 'I have a new computer.', tags: ['noun'], pronunciationAf: '/kəmˈpjuːtər/' },
    { term: 'class', translation: 'clase', type: 'noun', ttsText: 'class', exampleUse: 'We have a class in the morning.', tags: ['noun'], pronunciationAf: '/klæs/' },
    { term: 'office', translation: 'oficina', type: 'noun', ttsText: 'office', exampleUse: 'Maria is in the office.', tags: ['noun', 'vowel-start'], pronunciationAf: '/ˈɔːfɪs/' },
    { term: 'teacher', translation: 'maestro / profesora', type: 'noun', ttsText: 'teacher', exampleUse: 'She is a teacher.', tags: ['noun', 'consonant-start'], pronunciationAf: '/ˈtiːtʃər/' },
    { term: 'book', translation: 'libro', type: 'noun', ttsText: 'book', exampleUse: 'She has a big book.', tags: ['noun', 'consonant-start'], pronunciationAf: '/bʊk/' },
    { term: 'table', translation: 'mesa', type: 'noun', ttsText: 'table', exampleUse: 'The book is on the table.', tags: ['noun', 'consonant-start'], pronunciationAf: '/ˈteɪbl/' },
    { term: 'car', translation: 'carro / automóvil', type: 'noun', ttsText: 'car', exampleUse: 'Luis has a car.', tags: ['noun', 'consonant-start'], pronunciationAf: '/kɑːr/' },
    { term: 'friends', translation: 'amigos', type: 'noun', ttsText: 'friends', exampleUse: 'They have many friends.', tags: ['noun', 'plural'], pronunciationAf: '/frendz/' },
    { term: 'room', translation: 'cuarto / habitación', type: 'noun', ttsText: 'room', exampleUse: 'It has a clean room.', tags: ['noun', 'consonant-start'], pronunciationAf: '/ruːm/' },
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
    { skill: Skill.GRAMMAR, n: 1, type: 'multiple_choice', q: 'Complete with HAVE or HAS: "I ________ a new computer on my table."', es: 'Completa con HAVE o HAS: "Tengo una computadora nueva sobre mi mesa"', opts: ['have', 'has', 'is', 'are'], ans: 'have', exp: 'Bloque 1 (I): "I" usa siempre "have".', audioTTS: 'I have a new computer on my table.' },
    { skill: Skill.GRAMMAR, n: 2, type: 'multiple_choice', q: 'Complete with HAVE or HAS: "She ________ a big book in her office."', es: 'Completa con HAVE o HAS: "Ella tiene un libro grande en su oficina"', opts: ['have', 'has', 'is', 'are'], ans: 'has', exp: 'Bloque 3 (She): la 3ra persona singular cambia a "has".', audioTTS: 'She has a big book in her office.' },
    { skill: Skill.GRAMMAR, n: 3, type: 'multiple_choice', q: 'Complete with HAVE or HAS: "We ________ a class in the morning."', es: 'Completa con HAVE o HAS: "Tenemos una clase en la mañana"', opts: ['have', 'has', 'is', 'are'], ans: 'have', exp: 'Bloque Plural (We): el grupo plural utiliza "have".', audioTTS: 'We have a class in the morning.' },
    { skill: Skill.GRAMMAR, n: 4, type: 'multiple_choice', q: 'Complete with HAVE or HAS: "Luis ________ a car in the garage."', es: 'Completa con HAVE o HAS: "Luis tiene un carro en el garaje"', opts: ['have', 'has', 'am', 'are'], ans: 'has', exp: 'Bloque 3 (He/Luis): un singular masculino requiere "has".', audioTTS: 'Luis has a car in the garage.' },
    { skill: Skill.GRAMMAR, n: 5, type: 'multiple_choice', q: 'Complete with HAVE or HAS: "They ________ many friends at school."', es: 'Completa con HAVE o HAS: "Ellos tienen muchos amigos en la escuela"', opts: ['have', 'has', 'is', 'am'], ans: 'have', exp: 'Bloque Plural (They): el pronombre plural utiliza "have".', audioTTS: 'They have many friends at school.' },
    { skill: Skill.GRAMMAR, n: 6, type: 'multiple_choice', q: 'Complete with HAVE or HAS: "You ________ a clean room."', es: 'Completa con HAVE o HAS: "Tú tienes un cuarto limpio"', opts: ['have', 'has', 'is', 'am'], ans: 'have', exp: 'Bloque 2 (You): se procesa en el bloque plural usando "have".', audioTTS: 'You have a clean room.' },
    { skill: Skill.GRAMMAR, n: 7, type: 'multiple_choice', q: 'Complete with HAVE or HAS: "The office ________ a big table."', es: 'Completa con HAVE o HAS: "La oficina tiene una mesa grande"', opts: ['have', 'has', 'are', 'am'], ans: 'has', exp: 'Bloque 3 (It/The office): objeto singular externo exige "has".', audioTTS: 'The office has a big table.' },
    { skill: Skill.GRAMMAR, n: 8, type: 'multiple_choice', q: 'Identify the error: "She have a new car."', es: 'Identifica el error: "She have a new car"', opts: ['"have" should be "has"', '"car" should be plural', '"a" should be "an"', 'No error'], ans: '"have" should be "has"', exp: 'Error de 3ra persona: "She" exige "has".', audioTTS: 'She has a new car.' },
    { skill: Skill.GRAMMAR, n: 9, type: 'multiple_choice', q: 'Identify the error: "They has a class today."', es: 'Identifica el error: "They has a class today"', opts: ['"has" should be "have"', '"class" should be "classes"', '"They" requires "is"', 'No error'], ans: '"has" should be "have"', exp: 'Error de plural: "They" exige "have".', audioTTS: 'They have a class today.' },
    { skill: Skill.GRAMMAR, n: 10, type: 'multiple_choice', q: 'Which pronouns use "HAS" in affirmative sentences?', es: '¿Qué pronombres utilizan "HAS" en oraciones afirmativas?', opts: ['He, She, It', 'I, You, We', 'You, We, They', 'I, He, They'], ans: 'He, She, It', exp: 'Bloque 3 (Singulares externos): He, She, It se conjugan con "has".', audioTTS: 'He, She, and It use has.' },

    // ═══════════ READING (10) ═══════════
    { skill: Skill.READING, n: 1, type: 'multiple_choice', q: 'What object does Alex have in the base text?', es: '¿Qué objeto tiene Alex según el texto?', opts: ['a new computer', 'a car', 'a house', 'a dog'], ans: 'a new computer', exp: 'Texto: "I have a new computer".' },
    { skill: Skill.READING, n: 2, type: 'multiple_choice', q: 'When do we have a class according to the text?', es: '¿Cuándo tenemos clase según el texto?', opts: ['in the morning', 'at night', 'on Sunday', 'in the afternoon'], ans: 'in the morning', exp: 'Texto: "We have a class in the morning".' },
    { skill: Skill.READING, n: 3, type: 'multiple_choice', q: 'What does Maria have on her table?', es: '¿Qué tiene María sobre su mesa?', opts: ['a big book', 'a pen', 'a computer', 'a car'], ans: 'a big book', exp: 'Texto: "She has a big book on her table".' },
    { skill: Skill.READING, n: 4, type: 'multiple_choice', q: 'Where is Maria located?', es: '¿Dónde se encuentra María?', opts: ['in the office', 'in the library', 'at home', 'in the park'], ans: 'in the office', exp: 'Texto: "Maria is a teacher in the office".' },
    { skill: Skill.READING, n: 5, type: 'multiple_choice', q: 'What does Luis have in the garage?', es: '¿Qué tiene Luis en el garaje?', opts: ['a car', 'a book', 'a dog', 'a computer'], ans: 'a car', exp: 'Texto: "Luis has a car in the garage".' },
    { skill: Skill.READING, n: 6, type: 'multiple_choice', q: 'Where do they have many friends?', es: '¿Dónde tienen ellos muchos amigos?', opts: ['at the university', 'in the park', 'at home', 'in the office'], ans: 'at the university', exp: 'Texto: "They have many friends at the university".' },
    { skill: Skill.READING, n: 7, type: 'multiple_choice', q: 'What type of room is mentioned at the end?', es: '¿Cómo es el cuarto mencionado al final?', opts: ['a clean room', 'a big room', 'a small room', 'a dark room'], ans: 'a clean room', exp: 'Texto: "It has a clean room".' },
    { skill: Skill.READING, n: 8, type: 'multiple_choice', q: 'Why is "has" used for Maria in "She has a big book"?', es: '¿Por qué se usa "has" para María?', opts: ['Because Maria is 3rd person singular', 'Because book is plural', 'Because office starts with a vowel', 'Because it is a question'], ans: 'Because Maria is 3rd person singular', exp: '"She" requiere "has".' },
    { skill: Skill.READING, n: 9, type: 'multiple_choice', q: 'Why is "have" used in "We have a class"?', es: '¿Por qué se usa "have" en "We have a class"?', opts: ['Because "We" is a plural subject', 'Because "class" is singular', 'Because "morning" needs have', 'Because "We" is 3rd person'], ans: 'Because "We" is a plural subject', exp: '"We" utiliza "have".' },
    { skill: Skill.READING, n: 10, type: 'multiple_choice', q: 'Is the computer new or old in the text?', es: '¿La computadora es nueva o vieja?', opts: ['a new computer', 'an old computer', 'a big computer', 'a small computer'], ans: 'a new computer', exp: 'Texto: "a new computer".' },

    // ═══════════ LISTENING (10) ═══════════
    { skill: Skill.LISTENING, n: 1, type: 'listen_and_select', q: 'Which verb form did you hear before "a new computer"?', es: '¿Qué forma verbal escuchaste antes de "a new computer"?', opts: ['have', 'has', 'is', 'are'], ans: 'have', exp: 'Audio: "I have a new computer."', audioTTS: 'I have a new computer.' },
    { skill: Skill.LISTENING, n: 2, type: 'listen_and_select', q: 'Which verb form did you hear for Maria?', es: '¿Qué forma verbal escuchaste para María?', opts: ['has', 'have', 'is', 'am'], ans: 'has', exp: 'Audio: "She has a big book."', audioTTS: 'She has a big book.' },
    { skill: Skill.LISTENING, n: 3, type: 'listen_and_select', q: 'What object does Luis possess according to the audio?', es: '¿Qué objeto posee Luis según el audio?', opts: ['a car', 'a book', 'a house', 'a dog'], ans: 'a car', exp: 'Audio: "Luis has a car in the garage."', audioTTS: 'Luis has a car in the garage.' },
    { skill: Skill.LISTENING, n: 4, type: 'listen_and_select', q: 'When do we have a class according to the recording?', es: '¿Cuándo tenemos clase según el audio?', opts: ['in the morning', 'at night', 'on Monday', 'in the afternoon'], ans: 'in the morning', exp: 'Audio: "We have a class in the morning."', audioTTS: 'We have a class in the morning.' },
    { skill: Skill.LISTENING, n: 5, type: 'listen_and_select', q: 'Where do they have many friends in the audio?', es: '¿Dónde tienen muchos amigos?', opts: ['at the university', 'in the park', 'at school', 'at home'], ans: 'at the university', exp: 'Audio: "They have many friends at the university."', audioTTS: 'They have many friends at the university.' },
    { skill: Skill.LISTENING, n: 6, type: 'listen_and_select', q: 'Which object does Maria have on her table?', es: '¿Qué objeto tiene María sobre su mesa?', opts: ['a big book', 'a small pen', 'a clean computer', 'a car'], ans: 'a big book', exp: 'Audio: "She has a big book on her table."', audioTTS: 'She has a big book on her table.' },
    { skill: Skill.LISTENING, n: 7, type: 'listen_and_select', q: 'What room description did you hear in the recording?', es: '¿Qué descripción del cuarto escuchaste?', opts: ['a clean room', 'a big room', 'a small room', 'a new room'], ans: 'a clean room', exp: 'Audio: "It has a clean room."', audioTTS: 'It has a clean room.' },
    { skill: Skill.LISTENING, n: 8, type: 'listen_and_select', q: 'Which pronoun was paired with "have" in the audio?', es: '¿Qué pronombre se unió a "have"?', opts: ['We', 'She', 'He', 'Luis'], ans: 'We', exp: 'Audio: "We have a class in the morning."', audioTTS: 'We have a class in the morning.' },
    { skill: Skill.LISTENING, n: 9, type: 'listen_and_select', q: 'Which verb form was used for "They" in the audio?', es: '¿Qué forma verbal se usó para "They"?', opts: ['have', 'has', 'is', 'are'], ans: 'have', exp: 'Audio: "They have many friends at the university."', audioTTS: 'They have many friends at the university.' },
    { skill: Skill.LISTENING, n: 10, type: 'listen_and_select', q: 'Where is the car according to the audio?', es: '¿En qué lugar está el carro según el audio?', opts: ['in the garage', 'on the street', 'in the park', 'at school'], ans: 'in the garage', exp: 'Audio: "Luis has a car in the garage."', audioTTS: 'Luis has a car in the garage.' },

    // ═══════════ WRITING (10) ═══════════
    { skill: Skill.WRITING, n: 1, type: 'translation', q: 'Translate into English: "Tengo una computadora."', es: 'Traduce: "Tengo una computadora"', opts: ['I have a computer.', 'I has a computer.', 'I am a computer.', 'I have computer.'], ans: 'I have a computer.', exp: 'Con "have" (I).' },
    { skill: Skill.WRITING, n: 2, type: 'translation', q: 'Translate into English: "Ella tiene un libro grande."', es: 'Traduce: "Ella tiene un libro grande"', opts: ['She has a big book.', 'She have a big book.', 'She has big book.', 'She is a big book.'], ans: 'She has a big book.', exp: 'Con "has" (She).' },
    { skill: Skill.WRITING, n: 3, type: 'translation', q: 'Translate into English: "Tenemos una clase."', es: 'Traduce: "Tenemos una clase"', opts: ['We have a class.', 'We has a class.', 'We are a class.', 'We have class.'], ans: 'We have a class.', exp: 'Con "have" (We).' },
    { skill: Skill.WRITING, n: 4, type: 'translation', q: 'Translate into English: "Luis tiene un carro."', es: 'Traduce: "Luis tiene un carro"', opts: ['Luis has a car.', 'Luis have a car.', 'Luis has car.', 'Luis is a car.'], ans: 'Luis has a car.', exp: 'Con "has" (He/Luis).' },
    { skill: Skill.WRITING, n: 5, type: 'translation', q: 'Translate into English: "Ellos tienen amigos."', es: 'Traduce: "Ellos tienen amigos"', opts: ['They have friends.', 'They has friends.', 'They are friends.', 'They have friend.'], ans: 'They have friends.', exp: 'Con "have" (They).' },
    { skill: Skill.WRITING, n: 6, type: 'translation', q: 'Translate into English: "Tú tienes un cuarto limpio."', es: 'Traduce: "Tú tienes un cuarto limpio"', opts: ['You have a clean room.', 'You has a clean room.', 'You are a clean room.', 'You have clean room.'], ans: 'You have a clean room.', exp: 'Con "have" (You).' },
    { skill: Skill.WRITING, n: 7, type: 'translation', q: 'Translate into English: "La oficina tiene una mesa."', es: 'Traduce: "La oficina tiene una mesa"', opts: ['The office has a table.', 'The office have a table.', 'The office has table.', 'The office is a table.'], ans: 'The office has a table.', exp: 'Con "has" (It/The office).' },
    { skill: Skill.WRITING, n: 8, type: 'translation', q: 'Translate into English: "Ella tiene una computadora nueva."', es: 'Traduce: "Ella tiene una computadora nueva"', opts: ['She has a new computer.', 'She have a new computer.', 'She has new computer.', 'She is a new computer.'], ans: 'She has a new computer.', exp: 'Con "has" (She).' },
    { skill: Skill.WRITING, n: 9, type: 'translation', q: 'Translate into English: "Nosotros tenemos una casa."', es: 'Traduce: "Nosotros tenemos una casa"', opts: ['We have a house.', 'We has a house.', 'We are a house.', 'We have house.'], ans: 'We have a house.', exp: 'Con "have" (We).' },
    { skill: Skill.WRITING, n: 10, type: 'translation', q: 'Translate into English: "Él tiene un carro."', es: 'Traduce: "Él tiene un carro"', opts: ['He has a car.', 'He have a car.', 'He has car.', 'He is a car.'], ans: 'He has a car.', exp: 'Con "has" (He).' },

    // ═══════════ SPEAKING (10) ═══════════
    { skill: Skill.SPEAKING, n: 1, type: 'read_aloud', q: 'Listen and repeat: "I have a book."', es: 'Escucha y repite', opts: ['I have a book.', 'I has a book.', 'I have book.', 'I am a book.'], ans: 'I have a book.', exp: '"a" suena /ə/.', audioTTS: 'I have a book.' },
    { skill: Skill.SPEAKING, n: 2, type: 'read_aloud', q: 'Listen and repeat: "She has an email."', es: 'Escucha y repite', opts: ['She has an email.', 'She have an email.', 'She has a email.', 'She has email.'], ans: 'She has an email.', exp: 'Liga "an email".', audioTTS: 'She has an email.' },
    { skill: Skill.SPEAKING, n: 3, type: 'read_aloud', q: 'Listen and repeat: "We have a class."', es: 'Escucha y repite', opts: ['We have a class.', 'We has a class.', 'We have class.', 'We am a class.'], ans: 'We have a class.', exp: 'Ritmo en "have a".', audioTTS: 'We have a class.' },
    { skill: Skill.SPEAKING, n: 4, type: 'read_aloud', q: 'Listen and repeat: "He has a car."', es: 'Escucha y repite', opts: ['He has a car.', 'He have a car.', 'He has car.', 'He is a car.'], ans: 'He has a car.', exp: '"has" con /z/ suave.', audioTTS: 'He has a car.' },
    { skill: Skill.SPEAKING, n: 5, type: 'read_aloud', q: 'Listen and repeat: "They have many friends."', es: 'Escucha y repite', opts: ['They have many friends.', 'They has many friends.', 'They have many friend.', 'They am many friends.'], ans: 'They have many friends.', exp: 'Acentúa "have" y "friends".', audioTTS: 'They have many friends.' },
    { skill: Skill.SPEAKING, n: 6, type: 'read_aloud', q: 'Listen and repeat: "You have a clean room."', es: 'Escucha y repite', opts: ['You have a clean room.', 'You has a clean room.', 'You have clean room.', 'You is a clean room.'], ans: 'You have a clean room.', exp: '"clean" claro y firme.', audioTTS: 'You have a clean room.' },
    { skill: Skill.SPEAKING, n: 7, type: 'read_aloud', q: 'Listen and repeat: "The office has a big table."', es: 'Escucha y repite', opts: ['The office has a big table.', 'The office have a big table.', 'The office has big table.', 'The office is a big table.'], ans: 'The office has a big table.', exp: 'Liga "has a".', audioTTS: 'The office has a big table.' },
    { skill: Skill.SPEAKING, n: 8, type: 'read_aloud', q: 'Listen and repeat: "Maria has a new computer."', es: 'Escucha y repite', opts: ['Maria has a new computer.', 'Maria have a new computer.', 'Maria has new computer.', 'Maria is a new computer.'], ans: 'Maria has a new computer.', exp: 'Pronuncia "computer" /kəmˈpjuːtər/.', audioTTS: 'Maria has a new computer.' },
    { skill: Skill.SPEAKING, n: 9, type: 'read_aloud', q: 'Listen and repeat: "I have a new computer."', es: 'Escucha y repite', opts: ['I have a new computer.', 'I has a new computer.', 'I have new computer.', 'I am a new computer.'], ans: 'I have a new computer.', exp: 'Ritmo en "have a new".', audioTTS: 'I have a new computer.' },
    { skill: Skill.SPEAKING, n: 10, type: 'read_aloud', q: 'Listen and repeat: "Luis has a car in the garage."', es: 'Escucha y repite', opts: ['Luis has a car in the garage.', 'Luis have a car in the garage.', 'Luis has car in garage.', 'Luis is a car in the garage.'], ans: 'Luis has a car in the garage.', exp: '"garage" suena /ɡəˈrɑːʒ/.', audioTTS: 'Luis has a car in the garage.' },
  ];

  for (const ex of E) {
    const id = `CLASE_08_${ex.skill}_${String(ex.n).padStart(2, '0')}`;
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
