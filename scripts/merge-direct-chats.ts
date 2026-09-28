/**
 * merge-direct-chats.ts
 * Fusiona conversaciones DIRECT duplicadas (distinto orden de emails).
 * 1) Lee todos los Conversation con type=DIRECT
 * 2) Calcula el ID normalizado (emails ordenados)
 * 3) Si ya existe uno con el ID normalizado → mueve mensajes y members, borra el duplicado
 * 4) Si no → renombra el ID al normalizado
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Buscando conversaciones DIRECT...');
  const chats = await prisma.conversation.findMany({ where: { type: 'DIRECT' } });
  console.log(`Encontradas: ${chats.length}`);

  for (const chat of chats) {
    const ids = chat.id.replace('DIRECT-', '').split('_').map(e => e.toLowerCase().trim()).filter(Boolean).sort();
    if (ids.length < 2) continue;
    const normalized = `DIRECT-${ids.join('_')}`;
    if (normalized === chat.id) continue;

    console.log(`\n  ${chat.id}`);
    console.log(`  → ${normalized}`);

    const exists = await prisma.conversation.findUnique({ where: { id: normalized } });

    if (exists) {
      // Mover mensajes al chat normalizado
      const moved = await prisma.message.updateMany({
        where: { conversationId: chat.id },
        data: { conversationId: normalized },
      });
      console.log(`    Movidos ${moved.count} mensajes`);

      // Mover miembros (con cuidado de duplicados)
      const members = await prisma.conversationMember.findMany({ where: { conversationId: chat.id } });
      for (const m of members) {
        const dup = await prisma.conversationMember.findFirst({
          where: { conversationId: normalized, userId: m.userId },
        });
        if (dup) {
          await prisma.conversationMember.delete({ where: { id: m.id } });
        } else {
          await prisma.conversationMember.update({
            where: { id: m.id },
            data: { conversationId: normalized },
          });
        }
      }

      // Actualizar last message del normalizado si el duplicado es más reciente
      const latestMsg = await prisma.message.findFirst({
        where: { conversationId: normalized },
        orderBy: { createdAt: 'desc' },
      });
      if (latestMsg) {
        await prisma.conversation.update({
          where: { id: normalized },
          data: { lastMessage: latestMsg.content.substring(0, 100), lastMessageAt: latestMsg.createdAt },
        });
      }

      // Borrar el duplicado (cascade borra members/messages huérfanos)
      await prisma.conversation.delete({ where: { id: chat.id } });
      console.log(`    Duplicado eliminado`);
    } else {
      // Renombrar simplemente
      await prisma.conversation.update({
        where: { id: chat.id },
        data: { id: normalized },
      });
      console.log(`    Renombrado`);
    }
  }

  console.log('\n✅ Migración completa');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());