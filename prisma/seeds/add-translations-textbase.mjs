import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const TRANSLATIONS = {
  CLASE_00: "¡Hola! Yo soy Alex. Yo soy un estudiante en una ciudad grande. Tengo una casa y mi casa es pequeña. Sobre mi mesa, tengo un libro y dos plumas. Mi amigo es Luis. Él es un estudiante en mi clase. María es una estudiante también; ella está en la biblioteca. Nosotros somos amigos y estudiamos todos los días. Mira a Alex y a Luis: ellos tienen libros nuevos. ¡Hola, tú! Tú eres mi compañero de clase. Ustedes están en mi clase. Hay una computadora sobre la mesa; algo es nuevo.",
  CLASE_01: "¡Hola! Yo soy Alex y yo soy un estudiante. Hoy, yo estoy en la biblioteca grande. Este es mi amigo Luis; él es un estudiante en mi clase también. María está en la oficina; ella es una buena maestra. Mi casa es pequeña, pero algo está limpio. Nosotros somos amigos y nosotros estamos felices en esta ciudad. Alex y Luis están en clase ahora; ellos son estudiantes muy inteligentes.",
  CLASE_02: "Yo no estoy en la oficina. Yo soy un estudiante en la biblioteca grande. ¿Está Luis en la biblioteca? No, él no está. Él está en su casa. ¿Está María en la oficina? Sí, ella está. Ella es una buena maestra. ¿Somos nosotros amigos? Sí, nosotros somos amigos. Nosotros no estamos tristes en esta ciudad; nosotros estamos felices.",
  CLASE_03: "¡Hola! Yo soy Alex. Yo soy un estudiante en la biblioteca, pero yo no estoy en la oficina. Él es Luis; él es mi compañero de clase y él no está triste hoy. Ella es María; ella es una maestra, pero ella no está en el salón de clase ahora. Mira nuestro salón de clase: es grande y no está sucio. Nosotros somos amigos y nosotros no estamos cansados. Mira a Alex y a Luis: ellos son estudiantes y ellos no están en casa."
};

async function main() {
  console.log('Actualizando traducciones...\n');
  let updated = 0;
  for (const [lessonId, translation] of Object.entries(TRANSLATIONS)) {
    try {
      const result = await p.textBase.updateMany({
        where: { lessonId },
        data: { translation }
      });
      if (result.count > 0) {
        updated++;
        console.log('OK - ' + lessonId + ' (' + result.count + ' actualizado)');
      } else {
        console.log('WARN - ' + lessonId + ' no existe en la DB');
      }
    } catch (e) {
      console.log('ERROR - ' + lessonId + ': ' + e.message);
    }
  }
  console.log('\n' + updated + ' traducciones actualizadas');
  await p.$disconnect();
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
