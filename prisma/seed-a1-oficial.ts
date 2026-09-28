import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

interface SesionSeed {
  hora: number;
  sesion: 'A' | 'B' | 'C';
  duracion: number;
  modalidad: 'presencial' | 'plataforma';
  leccion: string;
  enfoque: string;
  tipo: 'contenido' | 'repaso' | 'examen' | 'proyecto' | 'cierre';
  lessonId?: string;
}

interface WeekSeed {
  semana: number;
  fechas: string;
  phase: 'F1' | 'F2' | 'F3' | 'F4' | 'CIERRE';
  ejeTematico: string;
  unidadLibro: string;
  paginas: string;
  kpi: string;
  sesiones: SesionSeed[];
  feriado?: string;
}

const WEEKS: WeekSeed[] = [
  {
    semana: 1, fechas: '31 ago – 4 sep', phase: 'F1',
    ejeTematico: 'Identidad Personal: To Be + Pronombres',
    unidadLibro: 'Unidad 1: Personal Profiles', paginas: 'Págs. 4–9',
    kpi: 'Presentación personal escrita y oral (1 min)',
    sesiones: [
      { hora: 1, sesion: 'A', duracion: 2, modalidad: 'presencial', leccion: 'Fase Cero: Singular & Plural', enfoque: 'Reglas de pluralización + YOU siempre plural', tipo: 'contenido', lessonId: 'A1_C00' },
      { hora: 2, sesion: 'B', duracion: 2, modalidad: 'presencial', leccion: 'Verbo To Be + Pronombres', enfoque: 'am/is/are + I, you, he, she, it, we, they', tipo: 'contenido', lessonId: 'A1_C01' },
      { hora: 3, sesion: 'C', duracion: 2, modalidad: 'plataforma', leccion: 'Refuerzo C00 + C01', enfoque: 'Ejercicios autocorregidos + Speaking IA', tipo: 'repaso' },
    ],
  },
  {
    semana: 2, fechas: '7 sep – 11 sep', phase: 'F1',
    ejeTematico: 'Datos Personales: Nombre, Edad y Origen',
    unidadLibro: 'Unidad 1: Personal Profiles', paginas: 'Págs. 10–15',
    kpi: 'Ficha de identificación personal completa',
    sesiones: [
      { hora: 1, sesion: 'A', duracion: 2, modalidad: 'presencial', leccion: 'Datos Personales', enfoque: 'My name is... · I am ___ years old · I am from...', tipo: 'contenido', lessonId: 'A1_C02' },
      { hora: 2, sesion: 'B', duracion: 2, modalidad: 'presencial', leccion: 'Posesivos + Genitivo Sajón', enfoque: 'my/your/his/her/our/their + \'s', tipo: 'contenido', lessonId: 'A1_C03' },
      { hora: 3, sesion: 'C', duracion: 2, modalidad: 'plataforma', leccion: 'Refuerzo C02 + C03', enfoque: 'Ejercicios autocorregidos + Speaking IA', tipo: 'repaso' },
    ],
  },
  {
    semana: 3, fechas: '14 sep – 18 sep', phase: 'F1',
    ejeTematico: 'Artículos, Plurales y Preposiciones de Lugar',
    unidadLibro: 'Unidad 1: Family Tree', paginas: 'Págs. 16–23',
    kpi: 'Árbol familiar con artículos y preposiciones',
    feriado: '16 sep Independencia',
    sesiones: [
      { hora: 1, sesion: 'A', duracion: 2, modalidad: 'presencial', leccion: 'Artículos (a/an/the) y Plurales', enfoque: 'a/an/the + -s/-es/-ies', tipo: 'contenido', lessonId: 'A1_C04' },
      { hora: 2, sesion: 'B', duracion: 2, modalidad: 'presencial', leccion: 'Preposiciones + Adjetivos', enfoque: 'from/in/with + small, quiet, big', tipo: 'contenido', lessonId: 'A1_C05' },
      { hora: 3, sesion: 'C', duracion: 2, modalidad: 'plataforma', leccion: 'Refuerzo C04 + C05', enfoque: 'Ejercicios autocorregidos + Speaking IA', tipo: 'repaso' },
    ],
  },
  {
    semana: 4, fechas: '21 sep – 25 sep', phase: 'F1',
    ejeTematico: 'Cierre Fase 1 · Examen Intermedio 1',
    unidadLibro: 'Unidad 1: Repaso', paginas: 'Págs. 24–29',
    kpi: 'Evaluación Intermedia 1 (mín. 70%)',
    sesiones: [
      { hora: 1, sesion: 'A', duracion: 2, modalidad: 'presencial', leccion: 'Repaso Fase 1', enfoque: 'Consolidación C00–C05 + errores comunes', tipo: 'repaso' },
      { hora: 2, sesion: 'B', duracion: 2, modalidad: 'presencial', leccion: 'EXAMEN INTERMEDIO 1', enfoque: 'Evaluación presencial · 50 reactivos · 5 habilidades', tipo: 'examen' },
      { hora: 3, sesion: 'C', duracion: 2, modalidad: 'plataforma', leccion: 'Práctica Fase 1', enfoque: 'Refuerzo post-examen + analytics', tipo: 'repaso' },
    ],
  },
  {
    semana: 5, fechas: '28 sep – 2 oct', phase: 'F2',
    ejeTematico: 'Presente Simple 1ra y 3ra Persona',
    unidadLibro: 'Unidad 2: Morning Routines', paginas: 'Págs. 30–37',
    kpi: 'Bitácora de rutina matutina',
    sesiones: [
      { hora: 1, sesion: 'A', duracion: 2, modalidad: 'presencial', leccion: 'Presente Simple (1ra persona)', enfoque: 'I wake up · I eat · I go', tipo: 'contenido', lessonId: 'A1_C06' },
      { hora: 2, sesion: 'B', duracion: 2, modalidad: 'presencial', leccion: 'Presente Simple (3ra persona)', enfoque: 'He wakes up · She eats · -s/-es/-ies', tipo: 'contenido', lessonId: 'A1_C07' },
      { hora: 3, sesion: 'C', duracion: 2, modalidad: 'plataforma', leccion: 'Refuerzo C06 + C07', enfoque: 'Ejercicios autocorregidos + Speaking IA', tipo: 'repaso' },
    ],
  },
  {
    semana: 6, fechas: '5 oct – 9 oct', phase: 'F2',
    ejeTematico: 'Adverbios y Preposiciones de Tiempo',
    unidadLibro: 'Unidad 2: Daily Schedule', paginas: 'Págs. 38–45',
    kpi: 'Agenda diaria con adverbios y preposiciones',
    sesiones: [
      { hora: 1, sesion: 'A', duracion: 2, modalidad: 'presencial', leccion: 'Adverbios de Frecuencia', enfoque: 'always · usually · sometimes · never', tipo: 'contenido', lessonId: 'A1_C08' },
      { hora: 2, sesion: 'B', duracion: 2, modalidad: 'presencial', leccion: 'Preposiciones de Tiempo y Medio', enfoque: 'at 7:00 · in the morning · by bus · on foot', tipo: 'contenido', lessonId: 'A1_C09' },
      { hora: 3, sesion: 'C', duracion: 2, modalidad: 'plataforma', leccion: 'Refuerzo C08 + C09', enfoque: 'Ejercicios autocorregidos + Speaking IA', tipo: 'repaso' },
    ],
  },
  {
    semana: 7, fechas: '12 oct – 16 oct', phase: 'F2',
    ejeTematico: 'Gustos y Presente Continuo',
    unidadLibro: 'Unidad 2: Free Time', paginas: 'Págs. 46–53',
    kpi: 'Ensayo corto de gustos + acciones en curso',
    sesiones: [
      { hora: 1, sesion: 'A', duracion: 2, modalidad: 'presencial', leccion: 'like / love / hate + -ing', enfoque: 'I like studying · She loves cooking', tipo: 'contenido', lessonId: 'A1_C10' },
      { hora: 2, sesion: 'B', duracion: 2, modalidad: 'presencial', leccion: 'Presente Continuo y Conectores', enfoque: 'am/is/are + -ing · and/but/because', tipo: 'contenido', lessonId: 'A1_C11' },
      { hora: 3, sesion: 'C', duracion: 2, modalidad: 'plataforma', leccion: 'Refuerzo C10 + C11', enfoque: 'Ejercicios autocorregidos + Speaking IA', tipo: 'repaso' },
    ],
  },
  {
    semana: 8, fechas: '19 oct – 23 oct', phase: 'F2',
    ejeTematico: 'Cierre Fase 2 · Examen Intermedio 2',
    unidadLibro: 'Unidad 2: Repaso', paginas: 'Págs. 54–59',
    kpi: 'Evaluación Intermedia 2 (mín. 70%)',
    sesiones: [
      { hora: 1, sesion: 'A', duracion: 2, modalidad: 'presencial', leccion: 'Repaso Fase 2', enfoque: 'Consolidación C06–C11 + errores comunes', tipo: 'repaso' },
      { hora: 2, sesion: 'B', duracion: 2, modalidad: 'presencial', leccion: 'EXAMEN INTERMEDIO 2', enfoque: 'Evaluación presencial · 50 reactivos · 5 habilidades', tipo: 'examen' },
      { hora: 3, sesion: 'C', duracion: 2, modalidad: 'plataforma', leccion: 'Práctica Fase 2', enfoque: 'Refuerzo post-examen + analytics', tipo: 'repaso' },
    ],
  },
  {
    semana: 9, fechas: '26 oct – 30 oct', phase: 'F3',
    ejeTematico: 'Pasado del To Be y Pasado Regular',
    unidadLibro: 'Unidad 3: Past Moments', paginas: 'Págs. 60–67',
    kpi: 'Narración de un fin de semana pasado',
    sesiones: [
      { hora: 1, sesion: 'A', duracion: 2, modalidad: 'presencial', leccion: 'Pasado del Verbo To Be', enfoque: 'was / were', tipo: 'contenido', lessonId: 'A1_C12' },
      { hora: 2, sesion: 'B', duracion: 2, modalidad: 'presencial', leccion: 'Pasado Simple Regular', enfoque: 'visited · talked · played · answered', tipo: 'contenido', lessonId: 'A1_C13' },
      { hora: 3, sesion: 'C', duracion: 2, modalidad: 'plataforma', leccion: 'Refuerzo C12 + C13', enfoque: 'Ejercicios autocorregidos + Speaking IA', tipo: 'repaso' },
    ],
  },
  {
    semana: 10, fechas: '2 nov – 6 nov', phase: 'F3',
    ejeTematico: 'Pasado Irregular y Narración',
    unidadLibro: 'Unidad 3: Storytelling', paginas: 'Págs. 68–75',
    kpi: 'Historia personal completa en pasado',
    feriado: '2 nov Día de Muertos',
    sesiones: [
      { hora: 1, sesion: 'A', duracion: 2, modalidad: 'presencial', leccion: 'Pasado Simple Irregular', enfoque: 'went · ate · took · swam · saw · met', tipo: 'contenido', lessonId: 'A1_C14' },
      { hora: 2, sesion: 'B', duracion: 2, modalidad: 'presencial', leccion: 'Narración de Eventos Pasados', enfoque: 'last week · last summer · last Sunday', tipo: 'contenido', lessonId: 'A1_C15' },
      { hora: 3, sesion: 'C', duracion: 2, modalidad: 'plataforma', leccion: 'Refuerzo C14 + C15', enfoque: 'Ejercicios autocorregidos + Speaking IA', tipo: 'repaso' },
    ],
  },
  {
    semana: 11, fechas: '9 nov – 13 nov', phase: 'F3',
    ejeTematico: 'Cierre Fase 3 · Proyecto Oral',
    unidadLibro: 'Unidad 3: Exposición', paginas: 'Págs. 76–81',
    kpi: 'Exposición oral: Un viaje pasado (2 min)',
    sesiones: [
      { hora: 1, sesion: 'A', duracion: 2, modalidad: 'presencial', leccion: 'Refuerzo Fase 3', enfoque: 'Consolidación pura C12–C15 + errores comunes', tipo: 'repaso' },
      { hora: 2, sesion: 'B', duracion: 2, modalidad: 'presencial', leccion: 'Proyecto Oral Fase 3', enfoque: 'Exposición de 2 min sobre un viaje pasado', tipo: 'proyecto' },
      { hora: 3, sesion: 'C', duracion: 2, modalidad: 'plataforma', leccion: 'Práctica Fase 3', enfoque: 'Speech recognition + autoevaluación oral', tipo: 'repaso' },
    ],
  },
  {
    semana: 12, fechas: '16 nov – 20 nov', phase: 'F4',
    ejeTematico: 'Futuro con Going To y Will',
    unidadLibro: 'Unidad 4: Future Plans', paginas: 'Págs. 82–89',
    kpi: 'Plan de vida a 5 años',
    feriado: '16 nov Revolución',
    sesiones: [
      { hora: 1, sesion: 'A', duracion: 2, modalidad: 'presencial', leccion: 'Futuro con Going To', enfoque: 'am/are going to + verbo', tipo: 'contenido', lessonId: 'A1_C16' },
      { hora: 2, sesion: 'B', duracion: 2, modalidad: 'presencial', leccion: 'Futuro con Will', enfoque: 'will + verbo', tipo: 'contenido', lessonId: 'A1_C17' },
      { hora: 3, sesion: 'C', duracion: 2, modalidad: 'plataforma', leccion: 'Refuerzo C16 + C17', enfoque: 'Ejercicios autocorregidos + Speaking IA', tipo: 'repaso' },
    ],
  },
  {
    semana: 13, fechas: '23 nov – 27 nov', phase: 'F4',
    ejeTematico: 'Integración Final + Preparación Examen',
    unidadLibro: 'Unidad 4: Final Project', paginas: 'Págs. 90–95',
    kpi: 'Texto modelo completo + prep. examen final',
    sesiones: [
      { hora: 1, sesion: 'A', duracion: 2, modalidad: 'presencial', leccion: 'Integración Final + Texto Modelo', enfoque: 'Producción texto modelo Diego/Laura/Carlos', tipo: 'contenido', lessonId: 'A1_C18' },
      { hora: 2, sesion: 'B', duracion: 2, modalidad: 'presencial', leccion: 'Refuerzo Fase 4 · Integración 4 fases', enfoque: 'Conexión C00–C18 · preparación examen final', tipo: 'repaso' },
      { hora: 3, sesion: 'C', duracion: 2, modalidad: 'plataforma', leccion: 'Práctica Fase 4', enfoque: 'Simulacro final en plataforma', tipo: 'repaso' },
    ],
  },
  {
    semana: 14, fechas: '30 nov – 4 dic', phase: 'F4',
    ejeTematico: 'Repaso General · Examen Final MCER A1',
    unidadLibro: 'Unidad 4: Repaso', paginas: 'Págs. 96–101',
    kpi: 'Certificación MCER A1 (mín. 75%)',
    sesiones: [
      { hora: 1, sesion: 'A', duracion: 2, modalidad: 'presencial', leccion: 'Repaso General 4 Fases', enfoque: 'Consolidación integral C00–C18', tipo: 'repaso' },
      { hora: 2, sesion: 'B', duracion: 2, modalidad: 'presencial', leccion: 'EXAMEN FINAL MCER A1', enfoque: 'Evaluación presencial · 100 reactivos · 5 habilidades', tipo: 'examen' },
      { hora: 3, sesion: 'C', duracion: 2, modalidad: 'plataforma', leccion: 'Simulacro final', enfoque: 'Práctica post-examen + analytics', tipo: 'repaso' },
    ],
  },
  {
    semana: 15, fechas: '7 dic – 11 dic', phase: 'CIERRE',
    ejeTematico: 'Clausura Académica · Entrega y Certificación',
    unidadLibro: 'Actividades de Cierre', paginas: 'N/A',
    kpi: 'Entrega de calificaciones + certificados',
    sesiones: [
      { hora: 1, sesion: 'A', duracion: 2, modalidad: 'presencial', leccion: 'Entrega de Calificaciones', enfoque: 'Retroalimentación individual · resultados del examen final', tipo: 'cierre' },
      { hora: 2, sesion: 'B', duracion: 2, modalidad: 'presencial', leccion: 'Ceremonia de Clausura', enfoque: 'Entrega de certificados + reconocimientos', tipo: 'cierre' },
      { hora: 3, sesion: 'C', duracion: 2, modalidad: 'plataforma', leccion: 'Actividad Académica Extra', enfoque: 'Encuesta de satisfacción + cierre de cuentas', tipo: 'cierre' },
    ],
  },
];

// Mapeo lessonId → semana
const LESSON_TO_WEEK: Record<string, number> = {
  A1_C00: 1, A1_C01: 1,
  A1_C02: 2, A1_C03: 2,
  A1_C04: 3, A1_C05: 3,
  A1_C06: 5, A1_C07: 5,
  A1_C08: 6, A1_C09: 6,
  A1_C10: 7, A1_C11: 7,
  A1_C12: 9, A1_C13: 9,
  A1_C14: 10, A1_C15: 10,
  A1_C16: 12, A1_C17: 12,
  A1_C18: 13,
};

(async () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('  SEED OFICIAL A1 — 15 semanas · 90 h · 3 exámenes');
  console.log('═══════════════════════════════════════════════════\n');

  const level = await p.studyLevel.findUnique({ where: { code: 'S01' } });
  if (!level) { console.log('FAIL: StudyLevel S01 no existe'); process.exit(1); }
  console.log('OK   StudyLevel S01: ' + level.id + '\n');

  // 1. Borrar semanas viejas
  const deleted = await p.studyWeek.deleteMany({ where: { levelId: level.id } });
  console.log('OK   Borradas ' + deleted.count + ' semanas viejas\n');

  // 2. Crear las 15 semanas nuevas
  let created = 0;
  for (const w of WEEKS) {
    const horasJson = w.sesiones.map(s => ({
      hora: s.hora,
      sesion: s.sesion,
      duracion: s.duracion,
      modalidad: s.modalidad,
      leccion: s.leccion,
      enfoque: s.enfoque,
      tipo: s.tipo,
      lessonId: s.lessonId || null,
    }));

    const kpiFinal = w.kpi + (w.feriado ? ' [Feriado: ' + w.feriado + ']' : '');

    await p.studyWeek.create({
      data: {
        levelId: level.id,
        weekNumber: w.semana,
        phase: w.phase,
        fechas: w.fechas,
        ejeTematico: w.ejeTematico,
        unidadLibro: w.unidadLibro,
        paginas: w.paginas,
        kpi: kpiFinal,
        horasJson: horasJson as any,
      },
    });
    console.log('  OK S' + String(w.semana).padStart(2, '0') + ' | ' + w.phase + ' | ' + w.fechas + ' | ' + w.sesiones.map(s => s.sesion).join(''));
    created++;
  }
  console.log('\nOK   ' + created + '/15 semanas creadas\n');

  // 3. Vincular las 19 lecciones a sus semanas
  let linked = 0;
  for (const [lessonId, weekNum] of Object.entries(LESSON_TO_WEEK)) {
    const lesson = await p.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) { console.log('  SKIP ' + lessonId + ' (no existe)'); continue; }
    const week = await p.studyWeek.findUnique({
      where: { levelId_weekNumber: { levelId: level.id, weekNumber: weekNum } },
    });
    if (!week) { console.log('  SKIP ' + lessonId + ' (week ' + weekNum + ' no existe)'); continue; }
    await p.lesson.update({
      where: { id: lessonId },
      data: { weekId: week.id, semana: weekNum },
    });
    linked++;
  }
  console.log('OK   Lecciones vinculadas: ' + linked + '/19\n');

  // 4. Verificación
  console.log('═══════════════════════════════════════════════════');
  console.log('  VERIFICACIÓN');
  console.log('═══════════════════════════════════════════════════\n');

  const totalWeeks = await p.studyWeek.count({ where: { levelId: level.id } });
  const allWeeks = await p.studyWeek.findMany({ where: { levelId: level.id }, orderBy: { weekNumber: 'asc' } });

  let examCount = 0;
  let totalHoras = 0;

  allWeeks.forEach(w => {
    const horas = w.horasJson as any[];
    const examenes = horas.filter((h: any) => h.tipo === 'examen').length;
    examCount += examenes;
    const horasSemana = horas.reduce((s: number, h: any) => s + (h.duracion || 0), 0);
    totalHoras += horasSemana;
  });

  console.log('Total semanas: ' + totalWeeks + ' (esperado 15)');
  console.log('Total exámenes: ' + examCount + ' (esperado 3)');
  console.log('Total horas: ' + totalHoras + ' (esperado 90)');
  console.log('');

  console.log('Distribución semanal:');
  allWeeks.forEach(w => {
    const horas = w.horasJson as any[];
    const total = horas.reduce((s: number, h: any) => s + (h.duracion || 0), 0);
    const exam = horas.find((h: any) => h.tipo === 'examen');
    console.log('  S' + String(w.weekNumber).padStart(2, '0') + ' | ' + String(total) + 'h | ' + (exam ? '🎯 ' + exam.leccion : w.ejeTematico.substring(0, 50)));
  });

  await p.$disconnect();
})();