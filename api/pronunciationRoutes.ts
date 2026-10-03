/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * pronunciationRoutes.ts
 * Historial de intentos de pronunciacion del alumno.
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/pronunciation/attempt
router.post('/pronunciation/attempt', async (req: Request, res: Response) => {
  try {
    const { userId, source, sectionKey, targetPhrase, transcript, score, missedWords } = req.body || {};
    if (!userId || !source || !targetPhrase) {
      return res.status(400).json({ success: false, error: 'userId, source, targetPhrase requeridos' });
    }
    const attempt = await prisma.pronunciationAttempt.create({
      data: {
        userId,
        source,
        sectionKey: sectionKey || null,
        targetPhrase,
        transcript: transcript || '',
        score: typeof score === 'number' ? score : 0,
        missedWords: Array.isArray(missedWords) ? missedWords : [],
      },
    });
    res.json({ success: true, data: attempt });
  } catch (error) {
    console.error('[pronunciation/attempt] Error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Error interno' });
  }
});

// GET /api/pronunciation/:userId
router.get('/pronunciation/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const attempts = await prisma.pronunciationAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json({ success: true, data: attempts });
  } catch (error) {
    console.error('[pronunciation/get] Error:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

// GET /api/pronunciation/:userId/stats
router.get('/pronunciation/:userId/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const all = await prisma.pronunciationAttempt.findMany({
      where: { userId },
      select: { score: true, source: true, sectionKey: true, createdAt: true },
    });
    if (all.length === 0) {
      return res.json({ success: true, data: { totalAttempts: 0, avgScore: 0, bestScore: 0, bySource: {}, bySection: {} } });
    }
    const totalAttempts = all.length;
    const avgScore = Math.round(all.reduce((s, a) => s + a.score, 0) / totalAttempts);
    const bestScore = Math.max(...all.map(a => a.score));
    const bySource: Record<string, { count: number; avg: number; best: number }> = {};
    const bySection: Record<string, { count: number; avg: number; best: number }> = {};
    all.forEach(a => {
      if (!bySource[a.source]) bySource[a.source] = { count: 0, avg: 0, best: 0 };
      bySource[a.source].count++;
      bySource[a.source].avg += a.score;
      bySource[a.source].best = Math.max(bySource[a.source].best, a.score);
      if (a.sectionKey) {
        if (!bySection[a.sectionKey]) bySection[a.sectionKey] = { count: 0, avg: 0, best: 0 };
        bySection[a.sectionKey].count++;
        bySection[a.sectionKey].avg += a.score;
        bySection[a.sectionKey].best = Math.max(bySection[a.sectionKey].best, a.score);
      }
    });
    Object.keys(bySource).forEach(k => { bySource[k].avg = Math.round(bySource[k].avg / bySource[k].count); });
    Object.keys(bySection).forEach(k => { bySection[k].avg = Math.round(bySection[k].avg / bySection[k].count); });
    res.json({ success: true, data: { totalAttempts, avgScore, bestScore, bySource, bySection } });
  } catch (error) {
    console.error('[pronunciation/stats] Error:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

export default router;
