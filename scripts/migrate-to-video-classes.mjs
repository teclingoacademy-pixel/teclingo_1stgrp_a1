/**
 * Migración a clases basadas en videos de YouTube
 * - Migra datos de A1_C01 → CLASE_01
 * - Crea 35 lecciones CLASE_00..CLASE_34 en el orden exacto de los videos
 * - Elimina las lecciones viejas
 */

import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// ============================================================
// ORDEN OFICIAL DE LAS 35 CLASES
// ============================================================
const CLASES = [
  { order: 0,  id: 'CLASE_00', title: 'FASE CERO TECLINGO: El Secreto de los Singulares y Plurales', tema: 'Singular & Plural' },
  { order: 1,  id: 'CLASE_01', title: 'CLASE 01 TECLINGO: Dominando el Verbo To Be (Presente Afirmativo)', tema: 'Verbo To Be' },
  { order: 2,  id: 'CLASE_02', title: 'CLASE 02 TECLINGO: El Secreto de los Auxiliares (Aprender a Negar y Preguntar)', tema: 'Auxiliares' },
  { order: 3,  id: 'CLASE_03', title: 'CLASE 03 TECLINGO: El Poder del Apóstrofe (Fase 1: Contracciones)', tema: 'Apóstrofe - Contracciones' },
  { order: 4,  id: 'CLASE_04', title: 'CLASE 04 TECLINGO: Dominando el Apóstrofe (Fase 2: Negaciones e Interrogaciones)', tema: 'Apóstrofe - Negaciones' },
  { order: 5,  id: 'CLASE_05', title: 'CLASE 05 TECLINGO: Dominando los Adjetivos Posesivos', tema: 'Adjetivos Posesivos' },
  { order: 6,  id: 'CLASE_06', title: 'CLASE 06 TECLINGO: Dominando los Demostrativos (This, That, These, Those)', tema: 'Demostrativos' },
  { order: 7,  id: 'CLASE_07', title: 'CLASE 07 TECLINGO: Artículos Definidos e Indefinidos (A, AN, THE)', tema: 'Artículos' },
  { order: 8,  id: 'CLASE_08', title: 'CLASE 08 TECLINGO: El Verbo HAVE (Posesión y el Secreto del HAS)', tema: 'Verbo HAVE' },
  { order: 9,  id: 'CLASE_09', title: 'CLASE 09 TECLINGO: Presente Simple y el Hack de la 3ra Persona', tema: 'Presente Simple' },
  { order: 10, id: 'CLASE_10', title: 'CLASE 10 TECLINGO: El Poder de CAN (Habilidades y Auxiliares Modales)', tema: 'CAN' },
  { order: 11, id: 'CLASE_11', title: 'CLASE 11 TECLINGO: El Auxiliar DO (Verbo de Acción y Motor)', tema: 'Auxiliar DO' },
  { order: 12, id: 'CLASE_12', title: 'CLASE 12: Adverbios de Frecuencia Always, Usually, Sometimes, Never', tema: 'Adverbios de Frecuencia' },
  { order: 13, id: 'CLASE_13', title: 'CLASE 13 TECLINGO: Dominio de Preposiciones (In, On, At - Lugar y Tiempo)', tema: 'Preposiciones' },
  { order: 14, id: 'CLASE_14', title: 'CLASE 14 TECLINGO: Los Imperativos (Órdenes y Prohibiciones)', tema: 'Imperativos' },
  { order: 15, id: 'CLASE_15', title: 'CLASE 15 TECLINGO: Preguntas con WH (What, Where, When, Who)', tema: 'Preguntas WH' },
  { order: 16, id: 'CLASE_16', title: 'CLASE 16 TECLINGO: El Pasado del Verbo To Be (Was y Were)', tema: 'Pasado To Be' },
  { order: 17, id: 'CLASE_17', title: 'CLASE 17 TECLINGO: Existencia en Presente y Pasado (There is, are, was, were)', tema: 'There is/are' },
  { order: 18, id: 'CLASE_18', title: 'CLASE 18 TECLINGO: Cuantificadores (Some, Any, Much, Many) - Parte 2', tema: 'Cuantificadores' },
  { order: 19, id: 'CLASE_19', title: 'CLASE 19 TECLINGO: Conectores Básicos (And, But, Or, Because)', tema: 'Conectores' },
  { order: 20, id: 'CLASE_20', title: 'CLASE 20 TECLINGO: Organiza tu tiempo (Días, Meses y Temporadas P1)', tema: 'Días, Meses y Temporadas' },
  { order: 21, id: 'CLASE_21', title: 'CLASE 21 TECLINGO: Números Ordinales y El Calendario', tema: 'Números Ordinales' },
  { order: 22, id: 'CLASE_22', title: 'CLASE 22 TECLINGO: Los Números del 0 al Infinito (Parte 1 de 3)', tema: 'Números P1' },
  { order: 23, id: 'CLASE_23', title: 'CLASE 23 LOS NÚMEROS EN INGLÉS P2 DE 3: las Decenas 10 al 90', tema: 'Números P2' },
  { order: 24, id: 'CLASE_24', title: 'CLASE 24 TECLINGO: Los Números del 100 al Infinito (Parte 3 de 3)', tema: 'Números P3' },
  { order: 25, id: 'CLASE_25', title: 'CLASE 25 TECLINGO: El Reloj y la Hora (Telling the Time)', tema: 'Reloj y Hora' },
  { order: 26, id: 'CLASE_26', title: 'CLASE 26 TECLINGO: El Futuro Simple con WILL (El Motor del Futuro)', tema: 'WILL' },
  { order: 27, id: 'CLASE_27', title: 'CLASE 27 TECLINGO: El Motor GOING TO Futuro y Pasado vs WILL', tema: 'GOING TO' },
  { order: 28, id: 'CLASE_28', title: 'CLASE 28 TECLINGO: Pronombres de Objeto (Me, You, Him, Her, It, Us, Them)', tema: 'Pronombres de Objeto' },
  { order: 29, id: 'CLASE_29', title: 'CLASE 29 TECLINGO: Los Adjetivos y Comparativos (Nivel A1)', tema: 'Adjetivos y Comparativos' },
  { order: 30, id: 'CLASE_30', title: 'Cómo PRESENTARTE en INGLÉS en 90 segundos | Nombre, Edad y Origen (Nivel A1)', tema: 'Presentación personal' },
  { order: 31, id: 'CLASE_31', title: 'CLASE DE INGLÉS A1: El Presente Continuo (-ING) | ¿Qué estás haciendo AHORA?', tema: 'Presente Continuo' },
  { order: 32, id: 'CLASE_32', title: 'TECLINGO: "Siento que lo hablo muy mal", "me da pena pronunciar"', tema: 'Motivacional' },
  { order: 33, id: 'CLASE_33', title: 'Cómo CONTAR UNA HISTORIA en inglés | Narración en Pasado Simple (A1)', tema: 'Narración Pasado' },
  { order: 34, id: 'CLASE_34', title: 'PASADO SIMPLE en inglés | Regulares (-ED) vs Irregulares (TOOK, WENT, ATE) A1', tema: 'Pasado Simple' },
];

// ============================================================
// EJECUCIÓN
// ============================================================
async function main() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  MIGRACIÓN A CLASES BASADAS EN VIDEOS');
  console.log('═══════════════════════════════════════════════\n');

  // PASO 1: Migrar A1_C01 → CLASE_01
  console.log('📌 PASO 1: Migrando A1_C01 → CLASE_01');
  const a1c01 = await p.lesson.findUnique({ where: { id: 'A1_C01' } });
  if (a1c01) {
    // Crear CLASE_01 primero con todos los datos
    await p.lesson.upsert({
      where: { id: 'CLASE_01' },
      update: {},
      create: {
        id: 'CLASE_01',
        level: 'A1',
        title: 'CLASE 01 TECLINGO: Dominando el Verbo To Be (Presente Afirmativo)',
        tituloVideo: 'CLASE 01 TECLINGO: Dominando el Verbo To Be (Presente Afirmativo)',
        temaPrincipal: 'Verbo To Be',
        order: 1,
        isPublished: true,
      },
    });

    // Migrar Exercise
    const r1 = await p.exercise.updateMany({
      where: { lessonId: 'A1_C01' },
      data: { lessonId: 'CLASE_01' },
    });
    console.log('   ✅ Ejercicios migrados:', r1.count);

    // Migrar UserProgress
    const r2 = await p.userProgress.updateMany({
      where: { lessonId: 'A1_C01' },
      data: { lessonId: 'CLASE_01' },
    });
    console.log('   ✅ UserProgress migrados:', r2.count);

    // Migrar LessonTheorySection
    const r3 = await p.lessonTheorySection.updateMany({
      where: { lessonId: 'A1_C01' },
      data: { lessonId: 'CLASE_01' },
    });
    console.log('   ✅ TheorySections migradas:', r3.count);

    console.log('   ✅ A1_C01 migrado a CLASE_01\n');
  } else {
    console.log('   ⚠️ A1_C01 no existe, saltando migración\n');
  }

  // PASO 2: Crear las 35 lecciones
  console.log('📌 PASO 2: Creando las 35 lecciones\n');
  let created = 0;
  let skipped = 0;
  for (const c of CLASES) {
    try {
      const existing = await p.lesson.findUnique({ where: { id: c.id } });
      if (existing) {
        // Actualizar solo si ya existe (para no perder cambios)
        await p.lesson.update({
          where: { id: c.id },
          data: {
            title: c.title,
            tituloVideo: c.title,
            temaPrincipal: c.tema,
            order: c.order,
            level: 'A1',
            isPublished: true,
          },
        });
        console.log('   🔄 ' + c.id + ' (actualizada)');
        skipped++;
      } else {
        await p.lesson.create({
          data: {
            id: c.id,
            level: 'A1',
            title: c.title,
            tituloVideo: c.title,
            temaPrincipal: c.tema,
            order: c.order,
            isPublished: true,
          },
        });
        console.log('   ✅ ' + c.id + ' → ' + c.title.substring(0, 60));
        created++;
      }
    } catch (e) {
      console.log('   ❌ Error en ' + c.id + ': ' + e.message);
    }
  }
  console.log('\n   Total: ' + created + ' creadas, ' + skipped + ' actualizadas\n');

  // PASO 3: Eliminar lecciones viejas (excepto CLASE_01 que ya migramos)
  console.log('📌 PASO 3: Eliminando lecciones viejas\n');
  const oldLessons = await p.lesson.findMany({
    where: {
      OR: [
        { id: { startsWith: 'A1_C' } },
        { id: { startsWith: 'N1-' } },
      ],
      NOT: { id: 'CLASE_01' },
    },
  });
  console.log('   Lecciones viejas encontradas: ' + oldLessons.length);
  for (const old of oldLessons) {
    // Verificar dependencias
    const exercises = await p.exercise.count({ where: { lessonId: old.id } });
    if (exercises > 0) {
      console.log('   ⚠️ ' + old.id + ' tiene ' + exercises + ' ejercicios. NO se elimina.');
      continue;
    }
    await p.lesson.delete({ where: { id: old.id } }).catch(e => {
      console.log('   ⚠️ No se pudo eliminar ' + old.id + ': ' + e.message);
    });
    console.log('   🗑️  Eliminada: ' + old.id);
  }

  // PASO 4: Resumen
  console.log('\n═══════════════════════════════════════════════');
  console.log('  RESUMEN FINAL');
  console.log('═══════════════════════════════════════════════');
  const total = await p.lesson.count();
  const clases = await p.lesson.findMany({
    where: { id: { startsWith: 'CLASE_' } },
    orderBy: { order: 'asc' },
  });
  const ejercicios = await p.exercise.count();
  console.log('Total Lesson en DB: ' + total);
  console.log('Lecciones CLASE_*: ' + clases.length);
  console.log('Total Exercise en DB: ' + ejercicios);
  console.log('\nPrimeras 5 clases:');
  clases.slice(0, 5).forEach(c => console.log('  [' + c.order + '] ' + c.id + ' → ' + c.title));
  console.log('\nÚltimas 5 clases:');
  clases.slice(-5).forEach(c => console.log('  [' + c.order + '] ' + c.id + ' → ' + c.title));

  await p.$disconnect();
}

main().catch(e => { console.error('❌ Error fatal:', e); process.exit(1); });
