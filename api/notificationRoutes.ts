/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * notificationRoutes.ts
 * Endpoints para notificaciones push y preferencias de recordatorio.
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

const router = Router();
const prisma = new PrismaClient();

// Configurar VAPID
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contacto@teclingoingles.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[notifications] VAPID configurado');
} else {
  console.warn('[notifications] VAPID keys no configuradas');
}

// GET /api/notifications/vapid-public-key
// Devuelve la clave pública VAPID para el frontend
router.get('/notifications/vapid-public-key', (_req: Request, res: Response) => {
  res.json({ success: true, publicKey: VAPID_PUBLIC_KEY });
});

// POST /api/notifications/subscribe
// Guarda la suscripción push del usuario
router.post('/notifications/subscribe', async (req: Request, res: Response) => {
  try {
    const { userId, subscription } = req.body || {};
    if (!userId || !subscription?.endpoint) {
      return res.status(400).json({ success: false, error: 'userId y subscription.endpoint requeridos' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    const keys = subscription.keys || {};
    const record = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: keys.p256dh || '',
        auth: keys.auth || '',
        userAgent: req.headers['user-agent'] || null,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: keys.p256dh || '',
        auth: keys.auth || '',
        userAgent: req.headers['user-agent'] || null,
      },
    });

    console.log('[notifications] Suscripcion guardada:', record.id);
    res.json({ success: true, data: { id: record.id } });
  } catch (error) {
    console.error('[notifications/subscribe] Error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Error interno' });
  }
});

// GET /api/notifications/preferences/:userId
// Obtiene las preferencias del usuario
router.get('/notifications/preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const pref = await prisma.notificationPreference.findUnique({ where: { userId } });
    res.json({ success: true, data: pref });
  } catch (error) {
    console.error('[notifications/preferences/get] Error:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

// POST /api/notifications/preferences
// Guarda las preferencias del usuario
router.post('/notifications/preferences', async (req: Request, res: Response) => {
  try {
    const { userId, enabled, daysOfWeek, hour, minute, timezone } = req.body || {};
    if (!userId) return res.status(400).json({ success: false, error: 'userId requerido' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    const data = {
      enabled: !!enabled,
      daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek : [],
      hour: typeof hour === 'number' ? hour : 20,
      minute: typeof minute === 'number' ? minute : 0,
      timezone: timezone || 'America/Mexico_City',
    };

    const pref = await prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    res.json({ success: true, data: pref });
  } catch (error) {
    console.error('[notifications/preferences] Error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Error interno' });
  }
});

// POST /api/notifications/test
// Envia una notificacion de prueba al usuario
router.post('/notifications/test', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ success: false, error: 'userId requerido' });

    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    if (subs.length === 0) {
      return res.status(404).json({ success: false, error: 'No hay suscripciones activas' });
    }

    const payload = JSON.stringify({
      title: 'Teclingo',
      body: 'Esta es una notificacion de prueba. Funciona!',
      icon: '/icon-192.png',
      url: '/',
    });

    let sent = 0;
    let failed = 0;
    for (const s of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent++;
      } catch (err) {
        console.warn('[notifications/test] Error enviando:', s.id, err);
        failed++;
      }
    }

    res.json({ success: true, data: { sent, failed } });
  } catch (error) {
    console.error('[notifications/test] Error:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});


// POST /api/messaging/broadcast
// Envia un mensaje a la conversacion GLOBAL con visibleTo = recipientEmails.
// Ademas envia push notification a cada destinatario suscrito.
router.post('/messaging/broadcast', async (req: Request, res: Response) => {
  try {
    const { senderEmail, recipientEmails, content } = req.body || {};

    if (!senderEmail || !content || !Array.isArray(recipientEmails)) {
      return res.status(400).json({ success: false, error: 'senderEmail, content y recipientEmails[] requeridos' });
    }
    if (recipientEmails.length === 0) {
      return res.status(400).json({ success: false, error: 'recipientEmails no puede estar vacio' });
    }

    const sender = await prisma.user.findUnique({ where: { email: String(senderEmail).toLowerCase().trim() } });
    if (!sender) return res.status(404).json({ success: false, error: 'Remitente no encontrado' });
    if (sender.role !== 'ADMIN' && sender.role !== 'TEACHER') {
      return res.status(403).json({ success: false, error: 'Solo ADMIN o TEACHER pueden enviar broadcast' });
    }

    // Buscar la conversacion GLOBAL
    let conv = await prisma.conversation.findFirst({ where: { type: 'GLOBAL' } });
    if (!conv) {
      conv = await prisma.conversation.create({
        data: {
          id: 'CHAT-GLOBAL',
          type: 'GLOBAL',
          name: 'Anuncios Globales',
          createdById: sender.id,
          createdByEmail: sender.email,
        },
      });
    }

    // Buscar los userIds de los destinatarios (por email)
    const normalizedEmails = Array.from(new Set(recipientEmails.map((e: string) => String(e).toLowerCase().trim())));
    const recipients = await prisma.user.findMany({
      where: { email: { in: normalizedEmails } },
      select: { id: true, email: true, name: true },
    });

    if (recipients.length === 0) {
      return res.status(404).json({ success: false, error: 'Ningun destinatario valido encontrado' });
    }

    const recipientIds = recipients.map((r) => r.id);

    // Crear el mensaje con visibleTo = recipientIds
    const msg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: sender.id,
        senderEmail: sender.email,
        senderName: sender.name || sender.email.split('@')[0],
        senderRole: sender.role,
        content: String(content).trim(),
        isDirector: sender.role === 'ADMIN',
        visibleTo: recipientIds,
      },
    });

    await prisma.conversation.update({
      where: { id: conv.id },
      data: {
        lastMessage: String(content).substring(0, 100),
        lastMessageAt: msg.createdAt,
      },
    });

    // Enviar push a cada destinatario que tenga suscripcion activa
    const subs = await prisma.pushSubscription.findMany({ where: { userId: { in: recipientIds } } });
    const payload = JSON.stringify({
      title: 'TECLINGO — Anuncio',
      body: String(content).substring(0, 120),
      icon: '/icon-192.png',
      url: '/',
    });

    let pushSent = 0;
    let pushFailed = 0;
    for (const s of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        pushSent++;
      } catch (err) {
        console.warn('[messaging/broadcast] Push fallo:', s.id, err);
        pushFailed++;
      }
    }

    console.log(`[messaging/broadcast] De ${sender.email} a ${recipients.length} usuarios. Push: ${pushSent} ok, ${pushFailed} fail`);

    res.json({
      success: true,
      data: {
        messageId: msg.id,
        recipients: recipients.length,
        pushSent,
        pushFailed,
      },
    });
  } catch (error) {
    console.error('[messaging/broadcast] Error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Error interno' });
  }
});

export default router;
