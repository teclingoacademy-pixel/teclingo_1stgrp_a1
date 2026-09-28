import { PrismaClient, Skill } from '@prisma/client';
import xlsx from 'xlsx';
import * as path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/14plrt3UgRI2cqvydYNTVRwN6wRLw_GfsP9AnNxFDRqo/export?format=csv&gid=791415901';
const EXCEL_PATH = path.join(__dirname, '../Tecligo_db_conocimiento_contenido_a1-b2_datasheet.xlsx');

const skillMap: Record<string, Skill> = {
  grammar: Skill.GRAMMAR,
  reading: Skill.READING,
  listening: Skill.LISTENING,
  speaking: Skill.SPEAKING,
  vocabulary: Skill.VOCABULARY,
  writing: Skill.WRITING,
};

function parseJsonField(value: any): any {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') { try { return JSON.parse(value); } catch { return [value]; } }
  return [String(value)];
}

function parseAudioUrl(value: any): string | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || /^\d+$/.test(trimmed)) return null;
  return trimmed;
}

async function loadFromExcel(): Promise<any[]> {
  console.log(`📄 Leyendo archivo Excel: ${EXCEL_PATH}`);
  const workbook = xlsx.readFile(EXCEL_PATH);
  const data: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  console.log(`📊 ${data.length} reactivos encontrados en Excel`);
  return data;
}

async function loadFromGoogleSheet(): Promise<any[]> {
  console.log(`🌐 Descargando desde Google Sheet...`);
  const response = await fetch(SHEET_URL);
  if (!response.ok) throw new Error(`Error descargando Google Sheet: ${response.status}`);
  const csvText = await response.text();
  const workbook = xlsx.read(csvText, { type: 'string' });
  const data: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  console.log(`📊 ${data.length} reactivos encontrados en Google Sheet`);
  return data;
}

async function main() {
  const useGoogleSheet = process.argv.includes('--google');
  let rows: any[];

  if (useGoogleSheet) {
    try { rows = await loadFromGoogleSheet(); }
    catch { console.log('⚠️ Google Sheet no disponible, usando Excel local...'); rows = await loadFromExcel(); }
  } else {
    rows = await loadFromExcel();
  }

  // 1. Crear lecciones
  const lessonIds = [...new Set(rows.map((r: any) => r.clase_id).filter(Boolean))];
  console.log(`\n📚 Creando ${lessonIds.length} lecciones...`);

  for (const lessonId of lessonIds) {
    const level = String(lessonId).split('_')[0] || 'A1';
    await prisma.lesson.upsert({
      where: { id: lessonId },
      update: { level },
      create: { id: lessonId, level, title: `Clase ${lessonId}`, order: 1 },
    });
  }
  console.log('✅ Lecciones creadas');

  // 2. Crear ejercicios
  console.log(`\n📝 Creando ${rows.length} ejercicios...`);
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const exerciseId = row.reactivo_id;
    if (!exerciseId) { skipped++; continue; }

    const skillEnum = skillMap[row.habilidad?.toLowerCase()] || Skill.GRAMMAR;
    const options = parseJsonField(row.opciones_json);
    const optionsTranslation = parseJsonField(row.opciones_traduccion_json);
    const audioUrl = parseAudioUrl(row.audio_url);

    try {
      await prisma.exercise.upsert({
        where: { id: exerciseId },
        update: {
          skill: skillEnum,
          questionText: String(row.pregunta_texto || ''),
          correctAnswer: String(row.respuesta_correcta || ''),
          optionsJson: options,
          optionsTranslation: optionsTranslation,
          explanation: row.respuesta_explicacion ? String(row.respuesta_explicacion) : null,
          vocabularyHint: row.pista_vocabulario ? String(row.pista_vocabulario) : null,
          audioUrl,
        },
        create: {
          id: exerciseId,
          lessonId: row.clase_id || 'A1_C01',
          skill: skillEnum,
          itemNumber: parseInt(row.numero_reactivo) || 1,
          questionType: row.tipo_pregunta || 'multiple_choice',
          spanishContext: row.contexto_espanol ? String(row.contexto_espanol) : null,
          instruction: row.instruccion ? String(row.instruccion) : null,
          questionText: String(row.pregunta_texto || ''),
          translationSentence: row.frase_traduccion ? String(row.frase_traduccion) : null,
          optionsJson: options,
          optionsTranslation: optionsTranslation,
          correctAnswer: String(row.respuesta_correcta || ''),
          explanation: row.respuesta_explicacion ? String(row.respuesta_explicacion) : null,
          vocabularyHint: row.pista_vocabulario ? String(row.pista_vocabulario) : null,
          audioUrl,
          points: parseInt(row.puntos) || 10,
          timeLimitSec: parseInt(row.tiempo_limite_seg) || 30,
          difficulty: parseInt(row.dificultad) || 1,
          active: row.activo === true || row.activo === 'TRUE' || row.activo === 'true',
        },
      });
      created++;
    } catch (error: any) {
      console.error(`❌ Error creando ${exerciseId}:`, error.message);
      skipped++;
    }
  }

  console.log(`\n✅ Ejercicios creados: ${created} | Saltados: ${skipped}`);

  // 3. Resumen
  const totalLessons = await prisma.lesson.count();
  const totalExercises = await prisma.exercise.count();
  const bySkill = await prisma.exercise.groupBy({ by: ['skill'], _count: true });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 RESUMEN:`);
  console.log(`   Lessons:    ${totalLessons}`);
  console.log(`   Exercises:  ${totalExercises}`);
  bySkill.forEach(s => console.log(`     ${s.skill}: ${s._count}`));
  console.log(`${'='.repeat(50)}`);
}

main().catch(e => { console.error('❌ Error fatal:', e); process.exit(1); }).finally(() => prisma.$disconnect());
