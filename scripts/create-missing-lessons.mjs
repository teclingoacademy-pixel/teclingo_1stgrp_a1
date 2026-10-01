import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const LESSONS = [
  { id: 'A1_C00', semana: 1, level: 'A1', title: 'Clase A1_C00 - Fase Cero: Singular & Plural' },
  { id: 'A1_C02', semana: 2, level: 'A1', title: 'Clase A1_C02 - Datos Personales' },
  { id: 'A1_C03', semana: 2, level: 'A1', title: 'Clase A1_C03 - Posesivos + Genitivo Sajón' },
  { id: 'A1_C04', semana: 3, level: 'A1', title: 'Clase A1_C04 - Artículos y Plurales' },
  { id: 'A1_C05', semana: 3, level: 'A1', title: 'Clase A1_C05 - Preposiciones + Adjetivos' },
  { id: 'A1_C06', semana: 5, level: 'A1', title: 'Clase A1_C06 - Presente Simple (1ra persona)' },
  { id: 'A1_C07', semana: 5, level: 'A1', title: 'Clase A1_C07 - Presente Simple (3ra persona)' },
  { id: 'A1_C08', semana: 6, level: 'A1', title: 'Clase A1_C08 - Adverbios de Frecuencia' },
  { id: 'A1_C09', semana: 6, level: 'A1', title: 'Clase A1_C09 - Preposiciones de Tiempo y Medio' },
  { id: 'A1_C10', semana: 7, level: 'A1', title: 'Clase A1_C10 - like/love/hate + -ing' },
  { id: 'A1_C11', semana: 7, level: 'A1', title: 'Clase A1_C11 - Presente Continuo y Conectores' },
  { id: 'A1_C12', semana: 9, level: 'A1', title: 'Clase A1_C12 - Pasado del Verbo To Be' },
  { id: 'A1_C13', semana: 9, level: 'A1', title: 'Clase A1_C13 - Pasado Simple Regular' },
  { id: 'A1_C14', semana: 10, level: 'A1', title: 'Clase A1_C14 - Pasado Simple Irregular' },
  { id: 'A1_C15', semana: 10, level: 'A1', title: 'Clase A1_C15 - Narración de Eventos Pasados' },
  { id: 'A1_C16', semana: 12, level: 'A1', title: 'Clase A1_C16 - Futuro con Going To' },
  { id: 'A1_C17', semana: 12, level: 'A1', title: 'Clase A1_C17 - Futuro con Will' },
  { id: 'A1_C18', semana: 13, level: 'A1', title: 'Clase A1_C18 - Integración Final + Texto Modelo' },
];

const level = await p.studyLevel.findUnique({ where: { code: 'S01' } });
if (!level) {
  console.error('❌ StudyLevel S01 no existe');
  process.exit(1);
}

const weeks = await p.studyWeek.findMany({ where: { levelId: level.id } });
const weekByNumber = {};
for (const w of weeks) weekByNumber[w.weekNumber] = w;

let created = 0, skipped = 0;

for (const lesson of LESSONS) {
  const exists = await p.lesson.findUnique({ where: { id: lesson.id } });
  if (exists) {
    console.log('  YA EXISTE:', lesson.id);
    skipped++;
    continue;
  }
  const week = weekByNumber[lesson.semana];
  if (!week) {
    console.log('  SKIP (no hay semana ' + lesson.semana + '):', lesson.id);
    skipped++;
    continue;
  }
  await p.lesson.create({
    data: {
      id: lesson.id,
      level: lesson.level,
      title: lesson.title,
      order: lesson.semana,
      isPublished: true,
      weekId: week.id,
      semana: lesson.semana,
      tipoContenido: 'original',
      duracionMin: 120,
    },
  });
  console.log('  ✅ CREADA:', lesson.id, '→ S' + String(lesson.semana).padStart(2, '0'));
  created++;
}

console.log('\n✅ Total: ' + created + ' creadas, ' + skipped + ' saltadas');

const all = await p.lesson.findMany({ select: { id: true, weekId: true, semana: true } });
console.log('Total Lesson en DB:', all.length);
console.log('Con weekId:', all.filter(l => l.weekId).length);
console.log('Sin weekId:', all.filter(l => !l.weekId).length);

await p.$disconnect();
