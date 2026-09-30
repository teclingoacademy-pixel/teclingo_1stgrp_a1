/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * src/utils/workbook/audioSupervisor.ts
 * Punto único de "detener TODO el audio de la app".
 *
 * Motivo: el audio TTS vive en tres lugares independientes:
 *  1. services/workbook/ttsService.ts  → Audio del backend + Web Speech con generación
 *  2. utils/workbook/audioFeedback.ts  → estado global de botones + Web Speech
 *  3. Audio() crudos creados por componentes (ListeningLab, TheBridge, ReadingTextBase)
 *
 * Al navegar de página hay que detener los tres a la vez; si no, el TTS sigue
 * sonando en la vista nueva y genera confusión (especialmente los Audio() crudos
 * que ningún cleanup alcanza a tiempo por la animación de salida de AnimatePresence).
 */

import { stopAudio } from '@/services/workbook/ttsService';
import { stopSpeech } from '@/utils/workbook/audioFeedback';

/** Elementos HTMLAudioElement creados fuera de ttsService que deben poder pararse desde aquí. */
const activeElements = new Set<HTMLAudioElement>();

/**
 * Registra un Audio() crudo para que stopAllAudio() pueda detenerlo al navegar.
 * El componente debe llamarlo en cuanto hace `new Audio(...)` y
 * unregisterAudioElement() en ended/error/unmount.
 */
export const registerAudioElement = (el: HTMLAudioElement): void => {
  activeElements.add(el);
};

/** Retira un elemento ya detenido/desmontado para no acumular referencias. */
export const unregisterAudioElement = (el: HTMLAudioElement): void => {
  activeElements.delete(el);
};

/**
 * Detiene todo audio activo: elementos crudos, Web Speech (audioFeedback),
 * Web Speech + Audio del backend + fetch en vuelo (ttsService).
 *
 * Se invoca al cambiar de vista/página (Mainboards, App) y al desmontar
 * componentes que reproducen TTS.
 */
export const stopAllAudio = (): void => {
  activeElements.forEach((el) => {
    try {
      el.pause();
      el.currentTime = 0;
    } catch {
      /* elemento ya liberado */
    }
  });

  // Resetea el estado global (botones "Reproduciendo...") y cancela Web Speech.
  stopSpeech();
  // Aborta fetch del backend, cancela Web Speech y detiene el Audio() de ttsService.
  stopAudio();
};
