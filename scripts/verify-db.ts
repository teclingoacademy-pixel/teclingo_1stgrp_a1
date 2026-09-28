import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== USUARIOS ===');
  const users = await prisma.user.findMany();
  users.forEach(u => console.log(`  ${u.email} | ${u.name} | ${u.role}`));

  console.log('\n=== LECCIONES ===');
  const lessons = await prisma.lesson.findMany({
    include: { _count: { select: { exercises: true } } }
  });
  lessons.forEach(l => console.log(`  ${l.id} | ${l.level} | ${l.title} | ${l._count.exercises} ejercicios`));

  console.log('\n=== EJERCICIOS POR HABILIDAD ===');
  const bySkill = await prisma.exercise.groupBy({ by: ['skill'], _count: true });
  bySkill.forEach(s => console.log(`  ${s.skill}: ${s._count}`));

  console.log('\n=== MUESTRA DE EJERCICIOS ===');
  const samples = await prisma.exercise.findMany({ take: 5, orderBy: { itemNumber: 'asc' } });
  samples.forEach(e => console.log(`  ${e.id} | ${e.skill} | ${e.questionText.substring(0, 50)}...`));

  await prisma.$disconnect();
}

main().catch(console.error);
