/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Bell, MessageCircle, X, Users, Crown, MessageSquare, ChevronUp, Calendar, Star, Zap, Award, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { fetchCalendarEvents, type CalendarEvent } from '../services/calendarService';

interface MessageNotificationBellProps {
  onNavigateToChat: (chatId: string) => void;
  onNavigateToCalendar?: () => void;
  accentColor?: string;
}

const ACK_STORAGE_KEY = 'teclingo_acknowledged_events';

function getAcknowledgedEvents(): Set<string> {
  try {
    const stored = localStorage.getItem(ACK_STORAGE_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch { /* noop */ }
  return new Set();
}

function saveAcknowledgedEvents(ids: Set<string>): void {
  localStorage.setItem(ACK_STORAGE_KEY, JSON.stringify([...ids]));
}

export function MessageNotificationBell({ onNavigateToChat, onNavigateToCalendar, accentColor = '#DEFF9A' }: MessageNotificationBellProps) {
  const { chats, userEmail, markChatAsRead, currentRole } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Drag & Drop: campana reubicable manualmente ──
  const POSITION_KEY = 'teclingo_bell_position';
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(POSITION_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (typeof p?.x === 'number' && typeof p?.y === 'number') return p;
      }
    } catch { /* noop */ }
    return { x: (typeof window !== 'undefined' ? window.innerWidth : 1200) - 80, y: (typeof window !== 'undefined' ? window.innerHeight : 800) - 80 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    try { localStorage.setItem(POSITION_KEY, JSON.stringify(position)); } catch { /* noop */ }
  }, [position]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    setIsDragging(true);
    dragOffsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch { /* noop */ }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragOffsetRef.current) return;
    const newX = e.clientX - dragOffsetRef.current.x;
    const newY = e.clientY - dragOffsetRef.current.y;
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;
    setPosition({ x: Math.max(0, Math.min(newX, maxX)), y: Math.max(0, Math.min(newY, maxY)) });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    dragOffsetRef.current = null;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
  };


  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [acknowledgedEvents, setAcknowledgedEvents] = useState<Set<string>>(() => getAcknowledgedEvents());

  const chatsWithUnread = useMemo(() => {
    return chats
      .filter(c => c.unreadCount > 0)
      .sort((a, b) => b.unreadCount - a.unreadCount);
  }, [chats]);

  const totalUnread = chatsWithUnread.reduce((sum, c) => sum + c.unreadCount, 0);

  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }, []);

  const todayRef = useRef(new Date());

  const upcomingCalendarEvents = useMemo(() => {
    const today = todayRef.current;
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return calendarEvents
      .filter(e => {
        const eventDate = new Date(e.year, e.month - 1, e.day);
        if (eventDate < todayStart) return false;
        if (e.visibility.includes('GLOBAL')) return true;
        return e.visibility.includes(currentRole as any);
      })
      .sort((a, b) => {
        const da = new Date(a.year, a.month - 1, a.day);
        const db = new Date(b.year, b.month - 1, b.day);
        return da.getTime() - db.getTime();
      });
  }, [calendarEvents, currentRole, todayKey]);

  const unacknowledgedEvents = useMemo(() => {
    return upcomingCalendarEvents.filter(e => !acknowledgedEvents.has(e.id));
  }, [upcomingCalendarEvents, acknowledgedEvents]);

  const calendarAlertCount = unacknowledgedEvents.length;

  useEffect(() => {
    let cancelled = false;
    const now = new Date();
    const load = async () => {
      try {
        const events = await fetchCalendarEvents(now.getFullYear(), now.getMonth() + 1);
        if (!cancelled) setCalendarEvents(events);
      } catch { /* silent */ }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expanded]);

  const handleChatClick = useCallback((chatId: string) => {
    markChatAsRead(chatId);
    setExpanded(false);
    onNavigateToChat(chatId);
  }, [markChatAsRead, onNavigateToChat]);

  const handleAcknowledgeEvent = useCallback((eventId: string) => {
    setAcknowledgedEvents(prev => {
      const next = new Set(prev);
      next.add(eventId);
      saveAcknowledgedEvents(next);
      return next;
    });
  }, []);

  const handleViewEvent = useCallback((event: CalendarEvent) => {
    if (onNavigateToCalendar) {
      setExpanded(false);
      onNavigateToCalendar();
    }
  }, [onNavigateToCalendar]);

  if (!userEmail) return null;

  const totalBadge = totalUnread + calendarAlertCount;

  if (minimized) {
    return (
      <div
        ref={containerRef}
        className={`fixed z-[200] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ left: `${position.x}px`, top: `${position.y}px`, touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <button
          onClick={() => { setMinimized(false); setExpanded(true); }}
          title="Mostrar notificaciones"
          className="relative w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-all shadow-lg"
        >
          <MessageSquare size={16} />
          {totalBadge > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.5)] border-2 border-[#061a1a] animate-pulse">
              {totalBadge > 99 ? '99+' : totalBadge}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`fixed z-[200] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ left: `${position.x}px`, top: `${position.y}px`, touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="flex flex-col items-end gap-2">
        {/* Bell Button */}
        <button
          onClick={() => setExpanded(o => !o)}
          title="Notificaciones"
          aria-label="Notificaciones"
          className="relative w-11 h-11 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all active:scale-95 shadow-lg"
        >
          <Bell size={18} />
          <AnimatePresence>
            {totalBadge > 0 && (
              <motion.span
                key={totalBadge}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.6)] border-2 border-[#061a1a]"
              >
                {totalBadge > 99 ? '99+' : totalBadge}
              </motion.span>
            )}
          </AnimatePresence>
          {totalBadge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500/40 animate-ping pointer-events-none" />
          )}
        </button>

        {/* Minimize Button */}
        <button
          onClick={() => { setMinimized(true); setExpanded(false); }}
          title="Minimizar"
          className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/30 hover:text-white/60 transition-all"
        >
          <ChevronUp size={12} />
        </button>

        {/* Dropdown Panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="w-[min(380px,calc(100vw-2rem))] max-h-[70vh] bg-[#0a0f1a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Bell size={14} style={{ color: accentColor }} />
                  <span className="text-white text-[11px] font-black uppercase tracking-widest">
                    Notificaciones
                  </span>
                  {totalBadge > 0 && (
                    <span className="text-[8px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full">
                      {totalBadge} NUEVAS
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="text-white/30 hover:text-white p-1 rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[60vh] custom-scrollbar">
                {/* ── SECCION: EVENTOS DEL CALENDARIO ── */}
                {upcomingCalendarEvents.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-white/[0.03] border-b border-white/5 flex items-center gap-2">
                      <Calendar size={12} style={{ color: accentColor }} />
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: accentColor }}>
                        Eventos del Calendario
                      </span>
                      <span className="text-[8px] font-black text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full ml-auto">
                        {unacknowledgedEvents.length} / {upcomingCalendarEvents.length}
                      </span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {upcomingCalendarEvents.slice(0, 5).map(event => {
                        const isAcked = acknowledgedEvents.has(event.id);
                        return (
                          <div
                            key={event.id}
                            className={`w-full px-4 py-3 transition-colors flex items-start gap-3 group ${
                              isAcked ? 'bg-white/[0.01] opacity-60' : 'hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="relative shrink-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                event.type === 'SCHOOL' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                                event.type === 'HOLIDAY' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                'bg-[#DEFF9A]/10 border-[#DEFF9A]/20 text-[#DEFF9A]'
                              }`}>
                                {event.type === 'SCHOOL' ? <Award size={16} /> :
                                 event.type === 'HOLIDAY' ? <Star size={16} /> :
                                 <Zap size={16} />}
                              </div>
                              {isAcked && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                  <Check size={10} className="text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <p className={`text-[11px] font-black uppercase tracking-tight truncate ${
                                  isAcked ? 'text-white/40' : 'text-white'
                                }`}>
                                  {event.title}
                                </p>
                                <span className="text-[8px] text-white/30 uppercase tracking-widest shrink-0">
                                  {event.time || 'Todo el dia'}
                                </span>
                              </div>
                              <p className={`text-[10px] truncate leading-snug ${
                                isAcked ? 'text-white/20' : 'text-white/50'
                              }`}>
                                {event.description || 'Sin descripcion'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                  event.type === 'SCHOOL' ? 'bg-cyan-500/20 text-cyan-400' :
                                  event.type === 'HOLIDAY' ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-[#DEFF9A]/20 text-[#DEFF9A]'
                                }`}>
                                  {event.type === 'SCHOOL' ? 'Escolar' :
                                   event.type === 'HOLIDAY' ? 'Asueto' : 'TECLINGO'}
                                </span>
                                <span className="text-white/20 text-[8px]">
                                  {event.day}/{event.month}/{event.year}
                                </span>
                              </div>
                              {/* Botones de accion */}
                              {!isAcked && (
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={() => handleViewEvent(event)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[8px] font-bold text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                                  >
                                    <ExternalLink size={10} /> Ver evento
                                  </button>
                                  <button
                                    onClick={() => handleAcknowledgeEvent(event.id)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-[8px] font-bold text-green-400 hover:bg-green-500/20 transition-all"
                                  >
                                    <Check size={10} /> Visto
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {upcomingCalendarEvents.length > 5 && (
                      <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02]">
                        <p className="text-white/30 text-[8px] text-center font-bold uppercase tracking-widest">
                          +{upcomingCalendarEvents.length - 5} eventos mas
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── SECCION: MENSAJES ── */}
                {chatsWithUnread.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-white/[0.03] border-b border-white/5 flex items-center gap-2">
                      <MessageCircle size={12} className="text-blue-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">
                        Mensajes
                      </span>
                      <span className="text-[8px] font-black text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full ml-auto">
                        {totalUnread}
                      </span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {chatsWithUnread.map(chat => (
                        <button
                          key={chat.id}
                          onClick={() => handleChatClick(chat.id)}
                          className="w-full text-left px-4 py-3 hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors flex items-start gap-3 group"
                        >
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-white group-hover:border-white/20 transition-all">
                              {chat.type === 'GROUP' ? <Users size={16} /> :
                               chat.type === 'GLOBAL' ? <Crown size={16} /> :
                               <MessageCircle size={16} />}
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center border-2 border-[#0a0f1a]">
                              {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <p className="text-white text-[11px] font-black uppercase tracking-tight truncate group-hover:text-[color:var(--accent)] transition-colors" style={{ '--accent': accentColor } as React.CSSProperties}>
                                {chat.name}
                              </p>
                              <span className="text-[8px] text-white/30 uppercase tracking-widest shrink-0">
                                {chat.lastMessage?.slice(0, 20) || ''}
                              </span>
                            </div>
                            <p className="text-white/50 text-[10px] truncate leading-snug">
                              {chat.lastMessage || 'Nuevo mensaje'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                chat.type === 'GLOBAL' ? 'bg-orange-500/20 text-orange-400' :
                                chat.type === 'GROUP' ? 'bg-[#DEFF9A]/20 text-[#DEFF9A]' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {chat.type}
                              </span>
                              <span className="text-white/20 text-[8px]">
                                {chat.unreadCount} {chat.unreadCount === 1 ? 'mensaje' : 'mensajes'}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── EMPTY STATE ── */}
                {chatsWithUnread.length === 0 && unacknowledgedEvents.length === 0 && (
                  <div className="py-10 px-6 text-center space-y-3">
                    <Bell size={28} className="text-white/10 mx-auto" />
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">
                      Sin notificaciones nuevas
                    </p>
                    <p className="text-white/15 text-[9px]">
                      Todo esta al dia
                    </p>
                  </div>
                )}
              </div>

              {totalBadge > 0 && (
                <div className="px-4 py-2.5 border-t border-white/10 bg-white/[0.02]">
                  <p className="text-white/30 text-[8px] text-center font-bold uppercase tracking-widest">
                    {chatsWithUnread.length > 0 ? 'Click en un chat para abrirlo' : 'Revisa tus eventos'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
