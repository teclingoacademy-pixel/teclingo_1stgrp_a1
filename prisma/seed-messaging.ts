/**
 * seed-messaging.ts
 * Crea la conversación GLOBAL y una conversación GROUP por cada EnglishGroup activo.
 * Ejecutar: npx tsx prisma/seed-messaging.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding messaging...');

  const globalConv = await prisma.conversation.upsert({
    where: { id: 'CHAT-GLOBAL' },
    create: { id: 'CHAT-GLOBAL', type: 'GLOBAL', name: 'Comunidad Teclingo' },
    update: {},
  });
  console.log('GLOBAL:', globalConv.id);

  const groups = await prisma.englishGroup.findMany({ where: { status: 'ACTIVE' } });
  for (const g of groups) {
    const chatId = `GROUP-${g.id}`;
    await prisma.conversation.upsert({
      where: { id: chatId },
      create: { id: chatId, type: 'GROUP', name: `${g.nombre} (Grupo)`, groupId: g.id },
      update: { name: `${g.nombre} (Grupo)`, groupId: g.id },
    });
    if (g.docenteEmail) {
      const t = await prisma.user.findUnique({ where: { email: g.docenteEmail } });
      if (t) {
        await prisma.conversationMember.upsert({
          where: { conversationId_userId: { conversationId: chatId, userId: t.id } },
          create: { conversationId: chatId, userId: t.id, email: t.email, name: t.name, role: 'DOCENTE' },
          update: {},
        });
      }
    }
    console.log('GROUP:', chatId);
  }

  const members = await prisma.groupMember.findMany({ where: { activo: true } });
  for (const m of members) {
    const chatId = `GROUP-${m.groupId}`;
    const conv = await prisma.conversation.findUnique({ where: { id: chatId } });
    if (!conv) continue;
    await prisma.conversationMember.upsert({
      where: { conversationId_userId: { conversationId: chatId, userId: m.userId } },
      create: { conversationId: chatId, userId: m.userId, email: m.email, name: m.nombre, role: 'ALUMNO' },
      update: {},
    });
  }

  console.log('Messaging seed complete');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());