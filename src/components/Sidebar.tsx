/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Shield,
  GraduationCap,
  User,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Languages,
  Menu,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { MasterSwitcher, UserRole } from './MasterSwitcher';

export interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  disabled?: boolean;
  category?: 'Soporte & Global' | 'Académico' | 'Operaciones' | 'Monitoreo & Innovación';
  isPrincipal?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  currentView: string;
  onViewChange: (view: string) => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  userName: string;
  userSub: string;
  userInitials: string;
  userColor?: string;
  onNavigateToChat: (chatId: string) => void;
}

export function Sidebar({
  items,
  currentView,
  onViewChange,
  currentRole,
  onRoleChange,
  userName,
  userSub,
  userInitials,
  userColor = 'bg-[#DEFF9A]',
  onNavigateToChat
}: SidebarProps) {
  const { 
    isSidebarOpen, 
    setIsSidebarOpen, 
    isSidebarCollapsed, 
    setIsSidebarCollapsed,
    theme,
    setTheme,
    language,
    setLanguage,
    t,
    userProgress,
    institutionName,
    institutionLogo,
    isDemoMode
  } = useAppContext();

    // FIX 2026-10-04: las categorías arrancan EXPANDIDAS para que el usuario
  // vea todos los items disponibles (venus-chat, ai-support, etc.) sin
  // tener que tocar el chevron. Puede colapsarlas manualmente si quiere.
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    'Soporte & Global': true,
    'Académico': true,
    'Operaciones': true,
    'Monitoreo & Innovación': true
  });

  useEffect(() => {
    let touchStartX = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touchEndX = e.touches[0].clientX;
      const touchCurrentY = e.touches[0].clientY;
      const diffX = touchEndX - touchStartX;
      
      // Only trigger if horizontal movement is significantly greater than vertical movement
      if (!isSidebarOpen && touchStartX < 40 && diffX > 60) {
        setIsSidebarOpen(true);
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isSidebarOpen, setIsSidebarOpen]);

  const toggleCollapse = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  const closeMobile = () => setIsSidebarOpen(false);
  const navRef = useRef<HTMLElement | null>(null);

  // Scroll al botón activo cuando cambia currentView
  useEffect(() => {
    if (!navRef.current) return;
    const activeBtn = navRef.current.querySelector(`[data-view-id="${currentView}"]`) as HTMLElement | null;
    if (activeBtn) {
      // Pequeño delay para que el DOM termine de renderizar (sobre todo al expandir sub-items)
      setTimeout(() => {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [currentView, isSidebarCollapsed]);

  const handlePrincipalClick = useCallback((id: string) => {
    onViewChange(id);
    // Expandir/collapse la categoría correspondiente
    const item = items.find(i => i.id === id);
    if (item?.category) {
      setExpandedCats(prev => ({ ...prev, [item.category!]: !prev[item.category!] }));
    }
    if (window.innerWidth < 1024) closeMobile();
  }, [onViewChange, items]);

  const sidebarWidth = isSidebarCollapsed ? 'w-24' : 'w-72';

  return (
    <>
      {/* Mobile Floating Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-[70]">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-3 rounded-2xl bg-[#DEFF9A] text-[#061a1a] shadow-[0_10px_20px_rgba(222,255,154,0.3)] flex items-center justify-center animate-pulse"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
            className="fixed inset-0 bg-[#061a1a]/80 backdrop-blur-sm z-[80] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          x: isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024) ? 0 : -300,
          width: (typeof window !== 'undefined' && window.innerWidth >= 1024) ? (isSidebarCollapsed ? 96 : 288) : 288
        }}
        className={`fixed lg:relative left-0 top-0 h-full backdrop-blur-[40px] z-[90] flex flex-col overflow-x-hidden transition-all duration-300 transform border-r border-white/5 touch-pan-y overscroll-contain ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isSidebarCollapsed ? 'lg:w-24' : 'lg:w-72'}`}
        style={{ backgroundColor: 'var(--bg-main)' }}
      >
        <div className={`p-8 border-b border-white/5 mb-4 relative neo-glass !border-opacity-0 lg:!border-opacity-10 lg:rounded-[3rem] ${isSidebarCollapsed ? 'px-4' : 'px-8'}`} style={{ borderColor: 'var(--border-subtle)' }}>
          <div className={`flex items-center gap-3 mb-2 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <div className={`w-10 h-10 ${userColor} rounded-xl flex items-center justify-center neon-border-glow shadow-[0_0_20px_rgba(222,255,154,0.3)] shrink-0`}>
              {currentRole === 'DIRECTOR' ? <Shield className="text-[#061a1a]" size={20} fill="currentColor" /> :
               currentRole === 'DOCENTE' ? <Zap className="text-[#061a1a]" size={20} fill="currentColor" /> :
               <GraduationCap className="text-[#061a1a]" size={20} fill="currentColor" />}
            </div>
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 min-w-0"
              >
                <h1 className="text-xl font-black tracking-tighter uppercase italic truncate max-w-[180px]" style={{ color: 'var(--text-main)' }}>
                  {institutionName}
                </h1>
                <p className="text-[#DEFF9A]/40 text-[8px] font-black uppercase tracking-[0.3em] truncate">{userSub}</p>
              </motion.div>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button 
            onClick={toggleCollapse}
            className="hidden lg:flex absolute -right-3 top-10 w-8 h-8 rounded-full border border-white/10 items-center justify-center text-white/40 hover:text-[#DEFF9A] transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] z-20"
            style={{ backgroundColor: 'var(--bg-main)' }}
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Mobile Close Button */}
          <button 
            onClick={closeMobile}
            className="lg:hidden absolute top-8 right-8 hover:text-white"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <nav ref={navRef} className={`flex-1 space-y-2 overflow-y-auto overflow-x-hidden touch-pan-y pb-12 custom-scrollbar px-6 ${isSidebarCollapsed ? 'px-2' : 'px-6'}`}>
          {items.some(item => !!item.category) ? (
            <div className="space-y-4">
              {([
                'Soporte & Global',
                'Académico',
                'Operaciones',
                'Monitoreo & Innovación'
              ] as const).filter(cat => items.some(i => i.category === cat)).map((cat) => {
                const catItems = items.filter(item => item.category === cat);
                const principalItem = catItems.find(item => item.isPrincipal) || catItems[0];
                const anidadoItems = catItems.filter(item => item !== principalItem);
                const isExpanded = !!expandedCats[cat];
                const isActive = currentView === principalItem.id;

                return (
                  <div key={cat} className="space-y-1">
                    {/* Category Title Header */}
                    {!isSidebarCollapsed && (
                      <div className="text-[8px] font-black uppercase text-[#DEFF9A]/30 tracking-[0.2em] px-4 pt-2 pb-1">
                        {cat}
                      </div>
                    )}

                    {/* Principal Button */}
                    <button
                      data-view-id={principalItem.id}
                      disabled={principalItem.disabled}
                      onClick={() => {
                        if (principalItem.disabled) return;
                        handlePrincipalClick(principalItem.id);
                      }}
                      className={`w-full flex items-center p-4 rounded-2xl transition-all group relative ${
                        principalItem.disabled
                          ? 'opacity-25 cursor-not-allowed hover:bg-transparent select-none'
                          : isActive 
                            ? 'bg-[#DEFF9A]/10 text-[#DEFF9A] border border-[#DEFF9A]/20 shadow-[0_0_20px_rgba(222,255,154,0.1)]' 
                            : 'hover:text-white hover:bg-white/5 border border-transparent'
                      } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                      style={{ color: principalItem.disabled ? 'var(--text-muted)' : undefined }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <principalItem.icon size={18} className={principalItem.disabled ? 'opacity-20' : isActive ? 'text-[#DEFF9A]' : 'opacity-40 group-hover:opacity-100'} />
                        </div>
                        {!isSidebarCollapsed && (
                          <div className="flex flex-col items-start leading-none text-left">
                            <span className="text-[11px] font-black uppercase tracking-widest leading-none">{principalItem.label}</span>
                            {principalItem.disabled && (
                              <span className="text-[7px] text-[#FF5D5D]/75 font-black uppercase tracking-widest mt-0.5">DESHABILITADO</span>
                            )}
                          </div>
                        )}
                      </div>

                      {!isSidebarCollapsed && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {principalItem.badge && (
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                              principalItem.badge === 'IA' || principalItem.badge === 'REAL-TIME' ? 'bg-cyan-400 text-[#061a1a] border-cyan-400' : 'bg-[#DEFF9A] text-[#061a1a] border-[#DEFF9A]'
                            }`}>
                              {principalItem.badge}
                            </span>
                          )}
                          {anidadoItems.length > 0 && (
                            <ChevronDown 
                              size={12} 
                              className={`transition-transform duration-200 group-hover:text-white ${isExpanded ? 'rotate-180' : ''}`}
                              style={{ color: 'var(--text-muted)' }} 
                            />
                          )}
                        </div>
                      )}

                      {isSidebarCollapsed && isActive && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#DEFF9A] rounded-l-full shadow-[0_0_10px_#DEFF9A]" />
                      )}
                    </button>

                    {/* Collapsible Anidado Menu Items */}
                    <AnimatePresence initial={false}>
                      {isExpanded && !isSidebarCollapsed && anidadoItems.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15, ease: 'easeInOut' }}
                          className="overflow-hidden pl-5 ml-4 border-l space-y-1.5 mt-1 pb-2"
                        style={{ borderColor: 'var(--border-light)' }}
                        >
                          {anidadoItems.map((subItem) => {
                            const isSubActive = currentView === subItem.id;
                            return (
                              <button
                                key={subItem.id}
                                data-view-id={subItem.id}
                                disabled={subItem.disabled}
                                onClick={() => {
                                  if (subItem.disabled) return;
                                  onViewChange(subItem.id);
                                  if (window.innerWidth < 1024) closeMobile();
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group relative text-left ${
                                  subItem.disabled
                                    ? 'opacity-25 cursor-not-allowed hover:bg-transparent select-none'
                                    : isSubActive
                                      ? 'bg-white/5 text-[#DEFF9A] border border-[#DEFF9A]/20 shadow-[0_0_15px_rgba(222,255,154,0.05)]'
                                      : 'hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                                style={{ color: subItem.disabled ? 'var(--text-muted)' : undefined }}
                              >
                                <div className="flex items-center gap-3">
                                  <subItem.icon size={14} className={subItem.disabled ? 'opacity-20' : isSubActive ? 'text-[#DEFF9A]' : 'opacity-40 group-hover:opacity-100'} />
                                  <div className="flex flex-col items-start leading-none">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest">{subItem.label}</span>
                                    {subItem.disabled && (
                                      <span className="text-[6px] text-[#FF5D5D]/75 font-black uppercase tracking-widest mt-0.5">DESHABILITADO</span>
                                    )}
                                  </div>
                                </div>
                                {subItem.badge && (
                                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full border shrink-0 ${
                                    subItem.badge === 'IA' || subItem.badge === 'REAL-TIME' || subItem.badge === 'ESTRICTO'
                                      ? 'bg-cyan-400 text-[#061a1a] border-cyan-400'
                                      : 'bg-[#DEFF9A] text-[#061a1a] border-[#DEFF9A]'
                                  }`}>
                                    {subItem.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ) : (
            items.map((item) => {
              const isActive = currentView === item.id;
              const isVIP = (item.id === 'progress-map' || item.id === 'ai-support') && userProgress >= 90;

              return (
                <button
                  key={item.id}
                  data-view-id={item.id}
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    onViewChange(item.id);
                    if (window.innerWidth < 1024) closeMobile();
                  }}
                  className={`w-full flex items-center p-4 rounded-2xl transition-all group relative ${
                    item.disabled
                      ? 'opacity-25 cursor-not-allowed text-white/30 hover:bg-transparent select-none'
                      : isActive 
                        ? 'bg-[#DEFF9A]/10 text-[#DEFF9A] border border-[#DEFF9A]/20 shadow-[0_0_20px_rgba(222,255,154,0.1)]' 
                        : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                  } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <item.icon size={18} className={item.disabled ? 'opacity-20' : isActive ? 'text-[#DEFF9A]' : 'opacity-40 group-hover:opacity-100'} />
                      {isVIP && !isSidebarCollapsed && (
                         <motion.div 
                           animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                           transition={{ duration: 2, repeat: Infinity }}
                           className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22D3EE]" 
                         />
                      )}
                    </div>
                    {!isSidebarCollapsed && (
                      <div className="flex flex-col items-start leading-none text-left">
                        <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                        {item.disabled && (
                          <span className="text-[7px] text-[#FF5D5D]/75 font-black uppercase tracking-widest mt-0.5">DESHABILITADO</span>
                        )}
                      </div>
                    )}
                  </div>
                  {!isSidebarCollapsed && item.badge && (
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                      item.badge === 'IA' || item.badge === 'REAL-TIME' ? 'bg-cyan-400 text-[#061a1a] border-cyan-400' : 'bg-[#DEFF9A] text-[#061a1a] border-[#DEFF9A]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isSidebarCollapsed && isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#DEFF9A] rounded-l-full shadow-[0_0_10px_#DEFF9A]" />
                  )}
                </button>
              );
            })
          )}
        </nav>

        <div className={`p-6 border-t space-y-6 mt-auto bg-transparent z-20 ${isSidebarCollapsed ? 'px-2 items-center' : 'p-6 pb-24 lg:pb-12'}`} style={{ borderColor: 'var(--border-subtle)' }}>
          {!isSidebarCollapsed && (
            <>
              {/* Theme/Language Selectors */}
              <div className="grid grid-cols-2 gap-2">
                 <div className="rounded-xl border p-1 flex glass-surface">
                    <button 
                      onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'normal' : 'dark')}
                      className="flex-1 flex items-center justify-center py-2 rounded-lg hover:bg-white/5 transition-all hover:text-white"
                      style={{ color: 'var(--text-muted)' }}
                      title="Toggle Theme"
                    >
                       {theme === 'dark' ? <Moon size={14} /> : theme === 'light' ? <Sun size={14} /> : <Monitor size={14} />}
                    </button>
                    <div className="w-px h-4 self-center" style={{ backgroundColor: 'var(--border-subtle)' }} />
                    <button 
                      onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                      className="flex-1 flex items-center justify-center py-2 rounded-lg hover:bg-white/5 transition-all hover:text-white"
                      style={{ color: 'var(--text-muted)' }}
                      title="Toggle Language"
                    >
                       <Languages size={14} />
                       <span className="ml-1 text-[8px] font-black uppercase">{language}</span>
                    </button>
                 </div>
                 
                 <button 
                    onClick={() => {
                      onViewChange('settings');
                      if (window.innerWidth < 1024) closeMobile();
                    }}
                    className="bg-white/5 rounded-xl border border-white/10 p-1 flex items-center justify-center hover:bg-white/5 transition-all text-white/40 hover:text-white"
                    title="Settings"
                 >
                    <SettingsIcon size={14} />
                 </button>
              </div>

              {/* MasterSwitcher (simulador de roles) — SOLO en Modo Demo.
                    Un usuario real registrado NO debe cambiar de rol. */}
              {isDemoMode && (
              <div className="mb-4">
                <p className="text-white/20 text-[8px] font-black uppercase tracking-[0.2em] mb-3">Protocolo Central</p>
                <MasterSwitcher currentRole={currentRole} onRoleChange={onRoleChange} />
              </div>
              )}

              <div className="p-4 rounded-3xl flex items-center gap-3 glass-surface">
                <div className={`w-8 h-8 rounded-full ${userColor} flex items-center justify-center text-[#061a1a] font-black shrink-0 shadow-glow`}>
                  {userInitials}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-black text-white uppercase leading-none truncate">{userName}</p>
                  <p className="text-[8px] font-bold text-white/30 uppercase mt-1 truncate">{userSub}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (window.innerWidth < 1024) closeMobile();
                  (window as any).tecnolingoLogout?.();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all group"
                title={t('logout')}
              >
                <LogOut size={16} className="shrink-0 opacity-70 group-hover:opacity-100" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('logout')}</span>
              </button>
            </>
          )}

          {isSidebarCollapsed && (
            <div className="flex flex-col items-center gap-4">
               <button
                 onClick={() => setIsSidebarCollapsed(false)}
                 className="p-3 rounded-2xl bg-white/5 text-white/40 hover:text-white transition-all"
               >
                  <User size={18} />
               </button>
               <div className={`w-8 h-8 rounded-full ${userColor} flex items-center justify-center text-[#061a1a] font-black shadow-glow`}>
                  {userInitials}
               </div>
               <button
                 onClick={() => (window as any).tecnolingoLogout?.()}
                 className="p-3 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                 title={t('logout')}
               >
                  <LogOut size={16} />
               </button>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
