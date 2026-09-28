/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MessageCircle } from 'lucide-react';

export const WHATSAPP_NUMBER = '8461108789';

export const WHATSAPP_SALES_MESSAGE =
  'Hola, estimado equipo de TECLINGO. Me comunico desde la plataforma para solicitar información sobre sus servicios educativos, planes disponibles y promociones vigentes. Quedo atento(a) a su respuesta. ¡Muchas gracias por su atención!';

export const WHATSAPP_TEACHER_MESSAGE =
  'Hola, estimado equipo de TECLINGO. Me gustaría conocer los detalles del servicio Teacher Online: disponibilidad de horarios, modalidad de las clases en línea y requisitos de acceso. Agradezco su atención y quedo en espera de su respuesta. ¡Saludos!';

export function openWhatsApp(message: string) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

interface WhatsAppButtonProps {
  label: string;
  message: string;
  sublabel?: string;
  className?: string;
  iconSize?: number;
  showNumber?: boolean;
}

export function WhatsAppButton({
  label,
  message,
  sublabel,
  className = '',
  iconSize = 16,
  showNumber = true
}: WhatsAppButtonProps) {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`WhatsApp ${WHATSAPP_NUMBER}`}
      className={`group flex items-center justify-center gap-3 rounded-2xl border bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366] hover:text-[#061a1a] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(37,211,102,0.12)] hover:shadow-[0_0_30px_rgba(37,211,102,0.3)] ${className}`}
    >
      <MessageCircle size={iconSize} className="shrink-0" fill="currentColor" />
      <span className="flex flex-col items-start leading-none text-left">
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        {sublabel ? (
          <span className="text-[8px] font-bold uppercase tracking-widest opacity-70 mt-1">{sublabel}</span>
        ) : showNumber ? (
          <span className="text-[8px] font-bold uppercase tracking-widest opacity-70 mt-1">{WHATSAPP_NUMBER}</span>
        ) : null}
      </span>
    </a>
  );
}