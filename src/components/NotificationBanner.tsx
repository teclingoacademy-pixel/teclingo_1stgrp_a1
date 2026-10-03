/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * NotificationBanner.tsx
 * Banner que invita al usuario a activar las notificaciones.
 */

import { useState } from 'react';
import { Bell, X, ChevronRight } from 'lucide-react';

interface Props {
  onActivate: () => void;
  onDismiss: () => void;
}

export function NotificationBanner({ onActivate, onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss();
  };

  return (
    <div className="relative p-5 rounded-2xl bg-gradient-to-r from-[#DEFF9A]/10 to-transparent border border-[#DEFF9A]/30 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#DEFF9A] via-[#22D3EE] to-[#DEFF9A]" />
      
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 text-white/40 cursor-pointer"
        aria-label="Cerrar"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-4 pr-8">
        <div className="w-12 h-12 rounded-2xl bg-[#DEFF9A]/20 border border-[#DEFF9A]/40 flex items-center justify-center text-[#DEFF9A] shrink-0">
          <Bell size={22} />
        </div>

        <div className="flex-1 space-y-2">
          <h4 className="text-white text-sm font-black uppercase tracking-tight">
            Activa tus recordatorios
          </h4>
          <p className="text-white/60 text-xs leading-relaxed">
            Recibe una notificacion cuando sea hora de practicar ingles. Tu eliges los dias y la hora.
          </p>

          <button
            onClick={onActivate}
            className="mt-1 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#DEFF9A] hover:bg-[#DEFF9A]/90 text-[#061a1a] text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-[#DEFF9A]/20"
          >
            Activar
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationBanner;
