/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * presentationService.ts
 * Cliente del endpoint /api/presentation/* para el formulario de presentación personal.
 */

import { apiUrl } from './apiConfig';

export interface PresentationData {
  id?: string;
  section1Spanish?: string | null;
  section2Spanish?: string | null;
  section3Spanish?: string | null;
  section4Spanish?: string | null;
  section5Spanish?: string | null;
  section1English?: string | null;
  section2English?: string | null;
  section3English?: string | null;
  section4English?: string | null;
  section5English?: string | null;
  fullPresentation?: string | null;
  status?: string;
}

export interface GenerateResponse {
  success: boolean;
  data?: PresentationData;
  error?: string;
}

/**
 * Genera la presentación del alumno: envía las 5 secciones en español
 * y recibe las traducciones al inglés.
 */
export async function generatePresentation(
  userId: string,
  sections: {
    section1Spanish: string;
    section2Spanish: string;
    section3Spanish: string;
    section4Spanish: string;
    section5Spanish: string;
  }
): Promise<GenerateResponse> {
  try {
    const res = await fetch(apiUrl('/api/presentation/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...sections }),
    });
    const json = await res.json();
    return json;
  } catch (error) {
    console.error('[presentationService] Error generating:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

/**
 * Obtiene la presentación guardada del alumno.
 */
export async function getPresentation(userId: string): Promise<GenerateResponse> {
  try {
    const res = await fetch(apiUrl('/api/presentation/' + encodeURIComponent(userId)));
    const json = await res.json();
    return json;
  } catch (error) {
    console.error('[presentationService] Error getting:', error);
    return { success: false, error: 'Error de conexión' };
  }
}
