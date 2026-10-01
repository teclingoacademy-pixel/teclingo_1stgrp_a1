import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Traducciones al español de cada reactivo
const TRANSLATIONS = {
  // GRAMMAR
  'CLASE_00_GRAM_01': 'La palabra house representa un objeto, entonces es ___.',
  'CLASE_00_GRAM_02': 'La palabra books tiene una s al final, entonces es ___.',
  'CLASE_00_GRAM_03': 'En nuestro método, el pronombre You se clasifica estrictamente en el bloque ___.',
  'CLASE_00_GRAM_04': 'El pronombre He se refiere a ___.',
  'CLASE_00_GRAM_05': 'En nuestro sistema, el pronombre It significa ___.',
  'CLASE_00_GRAM_06': '¿Qué pronombre representa "Alex y yo"?',
  'CLASE_00_GRAM_07': '¿Qué pronombre representa "Alex y Luis"?',
  'CLASE_00_GRAM_08': 'Para decir Ustedes acompañamos You con una palabra plural como ___.',
  'CLASE_00_GRAM_09': '¿El pronombre I se clasifica como singular o plural?',
  'CLASE_00_GRAM_10': 'Selecciona la forma plural correcta de student.',

  // LISTENING
  'CLASE_00_LIST_01': '¿Qué pronombre de primera persona singular escuchaste?',
  'CLASE_00_LIST_02': 'De acuerdo con la Regla de Oro, ¿en qué bloque está clasificado You?',
  'CLASE_00_LIST_03': '¿A quién se refiere el pronombre He?',
  'CLASE_00_LIST_04': '¿A quién se refiere el pronombre She?',
  'CLASE_00_LIST_05': '¿Cuál es la traducción correcta de It en nuestro método?',
  'CLASE_00_LIST_06': '¿Qué pronombre plural escuchaste para Nosotros?',
  'CLASE_00_LIST_07': '¿Qué pronombre escuchaste para Ellos?',
  'CLASE_00_LIST_08': '¿La palabra house representa un elemento singular o plural?',
  'CLASE_00_LIST_09': '¿La palabra houses representa un elemento singular o plural?',
  'CLASE_00_LIST_10': '¿Qué significa la expresión you guys?',

  // WRITING
  'CLASE_00_WRIT_01': 'Traduce: Yo (primera persona singular)',
  'CLASE_00_WRIT_02': 'Traduce: Tú (bloque plural)',
  'CLASE_00_WRIT_03': 'Traduce: Él (tercera persona masculino)',
  'CLASE_00_WRIT_04': 'Traduce: Ella (tercera persona femenino)',
  'CLASE_00_WRIT_05': 'Traduce: Algo (objeto indefinido)',
  'CLASE_00_WRIT_06': 'Traduce: Nosotros',
  'CLASE_00_WRIT_07': 'Traduce: Ellos',
  'CLASE_00_WRIT_08': 'Traduce la frase singular: Una casa',
  'CLASE_00_WRIT_09': 'Traduce la frase plural: Casas',
  'CLASE_00_WRIT_10': 'Traduce: Ustedes muchachos',

  // READING
  'CLASE_00_READ_01': 'Según el texto, ¿cuántas casas tiene Alex?',
  'CLASE_00_READ_02': '¿La palabra house en el texto es singular o plural?',
  'CLASE_00_READ_03': '¿Qué objetos están sobre la mesa de Alex?',
  'CLASE_00_READ_04': '¿La palabra pens es singular o plural?',
  'CLASE_00_READ_05': '¿Qué pronombre reemplaza a Luis en "He is a student"?',
  'CLASE_00_READ_06': '¿Qué pronombre reemplaza a Maria en "She is in the library"?',
  'CLASE_00_READ_07': '¿Qué pronombre se usa para Alex y Luis cuando dicen "We are friends"?',
  'CLASE_00_READ_08': '¿Qué pronombre se usa cuando se describe a Alex y Luis como "They have new books"?',
  'CLASE_00_READ_09': 'En "There is a computer; it is new", ¿a qué se refiere it?',
  'CLASE_00_READ_10': '¿Qué frase se usa en el texto para dirigirse al grupo como Ustedes?',

  // SPEAKING
  'CLASE_00_SPEAK_01': 'Pronuncia con claridad la primera persona singular: I',
  'CLASE_00_SPEAK_02': 'Pronuncia el pronombre del bloque plural: You',
  'CLASE_00_SPEAK_03': 'Pronuncia el pronombre masculino singular: He',
  'CLASE_00_SPEAK_04': 'Pronuncia el pronombre femenino singular: She',
  'CLASE_00_SPEAK_05': 'Pronuncia el pronombre indefinido: It',
  'CLASE_00_SPEAK_06': 'Pronuncia el pronombre plural: We',
  'CLASE_00_SPEAK_07': 'Pronuncia el pronombre plural: They',
  'CLASE_00_SPEAK_08': 'Lee la frase en voz alta respetando el singular: I have one book.',
  'CLASE_00_SPEAK_09': 'Lee la frase plural en voz alta: We are friends.',
  'CLASE_00_SPEAK_10': 'Lee la frase completa en voz alta: This is my house.'
};

async function main() {
  console.log('Agregando traducciones a los 50 ejercicios de CLASE_00...\n');

  let updated = 0;
  let notFound = 0;

  for (const [id, translation] of Object.entries(TRANSLATIONS)) {
    try {
      const result = await p.exercise.update({
        where: { id },
        data: { translationSentence: translation }
      });
      updated++;
      if (updated <= 5) {
        console.log('OK - ' + id);
        console.log('     ES: ' + translation.substring(0, 60));
      }
    } catch (e) {
      console.log('ERROR - ' + id + ': ' + e.message);
      notFound++;
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('  RESULTADO');
  console.log('═══════════════════════════════════════');
  console.log('Actualizados: ' + updated);
  console.log('Errores: ' + notFound);

  // Verificar
  const withTrans = await p.exercise.count({
    where: { lessonId: 'CLASE_00', NOT: { translationSentence: null } }
  });
  const withoutTrans = await p.exercise.count({
    where: { lessonId: 'CLASE_00', translationSentence: null }
  });

  console.log('\nVerificación:');
  console.log('  Con traducción: ' + withTrans);
  console.log('  Sin traducción: ' + withoutTrans);

  await p.$disconnect();
}

main().catch(e => { console.error('ERROR FATAL:', e); process.exit(1); });
