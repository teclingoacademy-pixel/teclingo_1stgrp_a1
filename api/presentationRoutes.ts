/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * presentationRoutes.ts
 * Endpoint para generar la presentacion personal del alumno (Proyecto Final MCER A1).
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { callOllama, OllamaMessage } from './ollamaClient';

const router = Router();
const prisma = new PrismaClient();

const TRANSLATION_PROMPT = `You are a translation assistant for A1 English students.
Translate the following Spanish text to natural, simple English at A1 level.

RULES:
- Use simple vocabulary and short sentences
- Keep the same meaning and tone
- Do NOT add explanations
- Do NOT add quotes
- Return ONLY the English translation, nothing else

Spanish text:
`;

async function translateSection(spanishText: string): Promise<string> {
  if (!spanishText || !spanishText.trim()) return '';
  const messages: OllamaMessage[] = [
    { role: 'user', content: TRANSLATION_PROMPT + spanishText }
  ];
  try {
    const translation = await callOllama(messages, { temperature: 0.2 });
    return translation.trim().replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('[presentation] Error traduciendo seccion:', error);
    return '';
  }
}

router.post('/presentation/generate', async (req: Request, res: Response) => {
  try {
    const { userId, section1Spanish, section2Spanish, section3Spanish, section4Spanish, section5Spanish } = req.body || {};
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId requerido' });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    console.log('[presentation] Generando presentacion para:', user.email);
    const [s1, s2, s3, s4, s5] = await Promise.all([
      translateSection(section1Spanish || ''),
      translateSection(section2Spanish || ''),
      translateSection(section3Spanish || ''),
      translateSection(section4Spanish || ''),
      translateSection(section5Spanish || ''),
    ]);
    const fullPresentation = [s1, s2, s3, s4, s5].filter(Boolean).join('\n\n');
    const existing = await prisma.studentPresentation.findUnique({ where: { userId } });
    let saved;
    if (existing) {
      saved = await prisma.studentPresentation.update({
        where: { userId },
        data: { section1Spanish, section2Spanish, section3Spanish, section4Spanish, section5Spanish, section1English: s1, section2English: s2, section3English: s3, section4English: s4, section5English: s5, fullPresentation, status: 'generated' },
      });
    } else {
      saved = await prisma.studentPresentation.create({
        data: { userId, section1Spanish, section2Spanish, section3Spanish, section4Spanish, section5Spanish, section1English: s1, section2English: s2, section3English: s3, section4English: s4, section5English: s5, fullPresentation, status: 'generated' },
      });
    }
    console.log('[presentation] Presentacion generada para:', user.email);
    res.json({ success: true, data: { id: saved.id, section1English: s1, section2English: s2, section3English: s3, section4English: s4, section5English: s5, fullPresentation, status: saved.status } });
  } catch (error) {
    console.error('[presentation/generate] Error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Error interno' });
  }
});

router.get('/presentation/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const presentation = await prisma.studentPresentation.findUnique({ where: { userId } });
    if (!presentation) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: presentation });
  } catch (error) {
    console.error('[presentation/get] Error:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

export default router;
