/**
 * backfill-institution-code.ts
 * Asigna institutionCode + directorEmail a los StudentProfile/TeacherProfile
 * que quedaron huérfanos por el bug del registro con Google.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Tomar el primer director existente (el Tec de Pánuco en este caso)
  const director = await prisma.directorProfile.findFirst({
    include: { user: { select: { email: true } } },
  });

  if (!director || !director.institutionCode) {
    console.error('No hay director con institution_code. Abortando.');
    return;
  }

  const institutionCode = director.institutionCode;
  const directorEmail = director.user.email;
  console.log(`Usando institutionCode=${institutionCode}, directorEmail=${directorEmail}`);

  // Backfill StudentProfile
  const studentResult = await prisma.studentProfile.updateMany({
    where: {
      OR: [{ institutionCode: null }, { institutionCode: '' }],
    },
    data: { institutionCode, directorEmail },
  });
  console.log(`StudentProfile actualizados: ${studentResult.count}`);

  // Backfill TeacherProfile
  const teacherResult = await prisma.teacherProfile.updateMany({
    where: {
      OR: [{ institutionCode: null }, { institutionCode: '' }],
    },
    data: { institutionCode, directorEmail },
  });
  console.log(`TeacherProfile actualizados: ${teacherResult.count}`);

  console.log('Backfill completo');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());