/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * NotificationSettingsModal.tsx
 * Modal para configurar los dias y hora de los recordatorios.
 */

import { useState, useEffect } from 'react';
import { Bell, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { NotificationPrefs } from '../hooks/usePushNotifications';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialPrefs: NotificationPrefs;
  onSave: (prefs: NotificationPrefs) => Promise<boolean>;
  onSendTest: () => Promise<boolean>;
  isSubscribed?: boolean;
  onUnsubscribe?: () => Promise<boolean>;
}

const DAYS = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'X' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 0, label: 'D' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

export function NotificationSettingsModal({ isOpen, onClose, initialPrefs, onSave, onSendTest, isSubscribed = false, onUnsubscribe }: Props) {
  const [days, setDays] = useState<number[]>(initialPrefs.daysOfWeek);
  const [hour, setHour] = useState<number>(initialPrefs.hour);
  const [minute, setMinute] = useState<number>(initialPrefs.minute);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [unsubscribing, setUnsubscribing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDays(initialPrefs.daysOfWeek);
      setHour(initialPrefs.hour);
      setMinute(initialPrefs.minute);
      setMessage(null);
    }
  }, [isOpen, initialPrefs]);

  const toggleDay = (d: number) => {
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const prefs: NotificationPrefs = {
      enabled: days.length > 0,
      daysOfWeek: days,
      hour,
      minute,
      timezone: initialPrefs.timezone,
    };
    const ok = await onSave(prefs);
    setSaving(false);
    setMessage({ type: ok ? 'ok' : 'error', text: ok ? 'Preferencias guardadas' : 'Error al guardar' });
    if (ok) setTimeout(() => onClose(), 1200);
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    const ok = await onSendTest();
    setTesting(false);
    setMessage({ type: ok ? 'ok' : 'error', text: ok ? 'Notificacion enviada!' : 'No se pudo enviar (revisa permisos)' });
  };

  const handleUnsubscribe = async () => {
    if (!onUnsubscribe) return;
    setUnsubscribing(true);
    setMessage(null);
    const ok = await onUnsubscribe();
    setUnsubscribing(false);
    if (ok) {
      setMessage({ type: 'ok', text: 'Notificaciones desactivadas' });
      setTimeout(() => onClose(), 1200);
    } else {
      setMessage({ type: 'error', text: 'Error al desactivar' });
    }
  };

  if (!isOpen) return null;

  const hourStr = String(hour).padStart(2, '0');
  const minStr = String(minute).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0a2020] border border-[#DEFF9A]/20 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#DEFF9A]/10 border border-[#DEFF9A]/30 flex items-center justify-center text-[#DEFF9A]">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-white text-lg font-black uppercase tracking-tight">Recordatorios</h3>
              <p className="text-white/40 text-xs">Configura cuando quieres que te avisemos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/60 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Dias */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-white/60">
            Dias de la semana
          </label>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((d) => (
              <button
                key={d.value}
                onClick={() => toggleDay(d.value)}
                className={'aspect-square rounded-xl font-black text-sm transition-all cursor-pointer border ' + (days.includes(d.value) ? 'bg-[#DEFF9A] text-[#061a1a] border-[#DEFF9A] shadow-lg shadow-[#DEFF9A]/20' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10')}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hora */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-white/60">
            Hora del recordatorio
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <select
                value={hour}
                onChange={(e) => setHour(parseInt(e.target.value, 10))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#DEFF9A]/50 cursor-pointer"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h} className="bg-[#061a1a]">
                    {String(h).padStart(2, '0')} hrs
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <select
                value={minute}
                onChange={(e) => setMinute(parseInt(e.target.value, 10))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#DEFF9A]/50 cursor-pointer"
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m} className="bg-[#061a1a]">
                    {String(m).padStart(2, '0')} min
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Preview — Simulacion de notificacion push */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">
            Asi se vera tu recordatorio
          </p>

          {days.length === 0 ? (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-white/40 text-xs">Selecciona al menos un dia</p>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.06] border border-white/10 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-[#DEFF9A] flex items-center justify-center shrink-0">
                <Bell size={20} className="text-[#061a1a]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white text-xs font-black uppercase tracking-wider">TECLINGO</p>
                  <p className="text-white/40 text-[10px]">{hourStr}:{minStr}</p>
                </div>
                <p className="text-white/80 text-xs leading-relaxed">
                  Es hora de tu practica diaria. Manten tu racha activa.
                </p>
              </div>
            </div>
          )}

          {days.length > 0 && (
            <p className="text-white/40 text-[10px] mt-3 text-center">
              {days.map((d) => DAYS.find((x) => x.value === d)?.label).join(' · ')} a las {hourStr}:{minStr}
            </p>
          )}
        </div>

        {/* Mensaje */}
        {message && (
          <div className={'p-3 rounded-xl flex items-center gap-2 text-xs ' + (message.type === 'ok' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
            {message.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {message.text}
          </div>
        )}

        {/* Desactivar (solo si esta suscrito) */}
        {isSubscribed && onUnsubscribe && (
          <button
            onClick={handleUnsubscribe}
            disabled={unsubscribing}
            className="w-full px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40"
          >
            {unsubscribing ? 'Desactivando...' : 'Desactivar notificaciones'}
          </button>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={handleTest}
            disabled={testing || !days.length}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {testing ? <Loader2 size={14} className="animate-spin inline" /> : 'Probar'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !days.length}
            className="flex-1 px-4 py-3 rounded-xl bg-[#DEFF9A] hover:bg-[#DEFF9A]/90 disabled:opacity-40 text-[#061a1a] text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={14} className="animate-spin inline" /> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationSettingsModal;
