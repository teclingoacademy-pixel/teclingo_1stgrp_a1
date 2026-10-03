/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * analyticsRoutes.ts
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

async function resolveUser(userIdOrEmail: string) {
  const key = String(userIdOrEmail).toLowerCase().trim();
  if (key.includes('@')) {
    return await prisma.user.findUnique({ where: { email: key } });
  }
  return await prisma.user.findUnique({ where: { id: key } });
}

router.post('/analytics/session/start', async (req: Request, res: Response) => {
  try {
    const { userId, device } = req.body || {};
    if (!userId) return res.status(400).json({ success: false, error: 'userId o email requerido' });
    const user = await resolveUser(userId);
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    const session = await prisma.userSession.create({
      data: { userId: user.id, device: device || null },
    });
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('[analytics/session/start] Error:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

router.post('/analytics/session/end', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId requerido' });
    const session = await prisma.userSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ success: false, error: 'Sesión no encontrada' });
    const endedAt = new Date();
    const durationSec = Math.max(0, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000));
    const updated = await prisma.userSession.update({
      where: { id: sessionId },
      data: { endedAt, durationSec },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[analytics/session/end] Error:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

router.post('/analytics/event', async (req: Request, res: Response) => {
  try {
    const { userId, sessionId, eventType, eventData } = req.body || {};
    if (!userId || !eventType) {
      return res.status(400).json({ success: false, error: 'userId y eventType requeridos' });
    }
    const user = await resolveUser(userId);
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    const activity = await prisma.userActivity.create({
      data: {
        userId: user.id,
        sessionId: sessionId || null,
        eventType,
        eventData: eventData || null,
      },
    });
    res.json({ success: true, data: activity });
  } catch (error) {
    console.error('[analytics/event] Error:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

router.get('/analytics/director', async (req: Request, res: Response) => {
  try {
    const days = Math.min(Number(req.query.days) || 7, 90);
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Sesiones en el período
    const sessions = await prisma.userSession.findMany({
      where: { startedAt: { gte: since } },
      select: { userId: true, startedAt: true, durationSec: true, endedAt: true },
    });

    // Eventos en el período
    const events = await prisma.userActivity.findMany({
      where: { createdAt: { gte: since } },
      select: { userId: true, eventType: true, eventData: true, createdAt: true },
    });

    // Usuarios únicos activos
    const uniqueUsers = new Set(sessions.map(s => s.userId));

    // Duración promedio
    const completedSessions = sessions.filter(s => s.durationSec > 0);
    const avgDurationSec = completedSessions.length > 0
      ? Math.round(completedSessions.reduce((sum, s) => sum + s.durationSec, 0) / completedSessions.length)
      : 0;

    // Total tiempo
    const totalTimeSec = sessions.reduce((sum, s) => sum + s.durationSec, 0);

    // Sesiones por día
    const sessionsByDay: Record<string, number> = {};
    sessions.forEach(s => {
      const day = s.startedAt.toISOString().split('T')[0];
      sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
    });

    // Herramientas más usadas
    const toolUsage: Record<string, number> = {};
    events.forEach(e => {
      if (e.eventType === 'tool_open' && e.eventData) {
        const data = e.eventData as { toolName?: string };
        const tool = data.toolName || 'Unknown';
        toolUsage[tool] = (toolUsage[tool] || 0) + 1;
      }
    });

    // Páginas más vistas
    const pageViews: Record<string, number> = {};
    events.forEach(e => {
      if (e.eventType === 'page_view' && e.eventData) {
        const data = e.eventData as { path?: string };
        const path = data.path || '/';
        pageViews[path] = (pageViews[path] || 0) + 1;
      }
    });

    // Top usuarios (agrupados por userId)
    const userSessionCount: Record<string, number> = {};
    sessions.forEach(s => {
      userSessionCount[s.userId] = (userSessionCount[s.userId] || 0) + 1;
    });
    const topUserIds = Object.entries(userSessionCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId]) => userId);

    const usersInfo = topUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: topUserIds } },
          select: { id: true, email: true, name: true },
        })
      : [];

    const topUsers = topUserIds.map(id => {
      const u = usersInfo.find(x => x.id === id);
      return {
        id,
        email: u?.email || '',
        name: u?.name || null,
        sessionCount: userSessionCount[id],
      };
    });

    res.json({
      success: true,
      data: {
        period: { days, since: since.toISOString() },
        periodDays: days,
        totalSessions: sessions.length,
        uniqueUsers: uniqueUsers.size,
        avgDurationSec,
        totalTimeSec,
        sessionsByDay,
        topTools: Object.entries(toolUsage)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([name, count]) => ({ name, count })),
        topPages: Object.entries(pageViews)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([path, count]) => ({ path, count })),
        topUsers,
      },
    });
  } catch (error) {
    console.error('[analytics/director] Error:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

export default router;
