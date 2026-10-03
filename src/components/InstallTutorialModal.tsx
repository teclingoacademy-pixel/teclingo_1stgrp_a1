/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * InstallTutorialModal.tsx
 * Tutorial de instalacion PWA segun el dispositivo.
 */

import { X, Smartphone, Monitor, Share, MoreVertical, Plus } from 'lucide-react';
import type { DeviceInfo } from '../hooks/useDeviceDetection';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceInfo;
  onContinue: () => void;
}

export function InstallTutorialModal({ isOpen, onClose, device, onContinue }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0a2020] border border-[#DEFF9A]/20 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#DEFF9A]/10 border border-[#DEFF9A]/30 flex items-center justify-center text-[#DEFF9A]">
              {device.isDesktop ? <Monitor size={20} /> : <Smartphone size={20} />}
            </div>
            <div>
              <h3 className="text-white text-lg font-black uppercase tracking-tight">Instala Teclingo</h3>
              <p className="text-white/40 text-xs">Para recibir notificaciones</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/60 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Contenido segun dispositivo */}
        <div className="space-y-4 text-white/80 text-sm">
          {device.isIOS && device.supportsPWA && (
            <>
              <p className="text-xs text-white/60">
                Sigue estos pasos en <strong className="text-[#DEFF9A]">Safari</strong>:
              </p>
              <ol className="space-y-3 list-none">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#DEFF9A]/20 text-[#DEFF9A] text-[11px] font-black flex items-center justify-center shrink-0">1</span>
                  <span className="text-xs">Pulsa el icono <Share size={12} className="inline text-[#DEFF9A]" /> <strong>Compartir</strong> (abajo)</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#DEFF9A]/20 text-[#DEFF9A] text-[11px] font-black flex items-center justify-center shrink-0">2</span>
                  <span className="text-xs">Desliza y pulsa <Plus size={12} className="inline text-[#DEFF9A]" /> <strong>Agregar a pantalla de inicio</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#DEFF9A]/20 text-[#DEFF9A] text-[11px] font-black flex items-center justify-center shrink-0">3</span>
                  <span className="text-xs">Confirma con <strong>Agregar</strong> (arriba)</span>
                </li>
              </ol>
            </>
          )}

          {device.isAndroid && (
            <>
              <p className="text-xs text-white/60">
                Sigue estos pasos en <strong className="text-[#DEFF9A]">Chrome</strong>:
              </p>
              <ol className="space-y-3 list-none">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#DEFF9A]/20 text-[#DEFF9A] text-[11px] font-black flex items-center justify-center shrink-0">1</span>
                  <span className="text-xs">Pulsa el menu <MoreVertical size={12} className="inline text-[#DEFF9A]" /> (arriba a la derecha)</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#DEFF9A]/20 text-[#DEFF9A] text-[11px] font-black flex items-center justify-center shrink-0">2</span>
                  <span className="text-xs">Pulsa <strong>Instalar aplicacion</strong> o <strong>Agregar a pantalla de inicio</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#DEFF9A]/20 text-[#DEFF9A] text-[11px] font-black flex items-center justify-center shrink-0">3</span>
                  <span className="text-xs">Confirma con <strong>Instalar</strong></span>
                </li>
              </ol>
            </>
          )}

          {device.isDesktop && (
            <>
              <p className="text-xs text-white/60">
                Sigue estos pasos en <strong className="text-[#DEFF9A]">{device.browser === 'edge' ? 'Edge' : 'Chrome'}</strong>:
              </p>
              <ol className="space-y-3 list-none">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#DEFF9A]/20 text-[#DEFF9A] text-[11px] font-black flex items-center justify-center shrink-0">1</span>
                  <span className="text-xs">Pulsa el icono <Plus size={12} className="inline text-[#DEFF9A]" /> en la barra de direcciones</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#DEFF9A]/20 text-[#DEFF9A] text-[11px] font-black flex items-center justify-center shrink-0">2</span>
                  <span className="text-xs">Pulsa <strong>Instalar</strong></span>
                </li>
              </ol>
            </>
          )}

          {!device.supportsPWA && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {device.message}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            Despues
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-3 rounded-xl bg-[#DEFF9A] hover:bg-[#DEFF9A]/90 text-[#061a1a] text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            Ya la instale
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstallTutorialModal;
