/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users,
  Sparkles, 
  Map,
  Calendar as CalendarIcon, 
  Mail, 
  Trophy, 
  Settings as SettingsIcon,
  MessageSquare,
  Flame,
  CheckCircle2,
  QrCode,
  Zap,
  TrendingUp,
  Clock,
  ChevronRight,
  GraduationCap,
  ClipboardList,
  BarChart3,
  Dna,
  Sun,
  Moon,
  Monitor,
  Languages,
  BookOpen,
  Shield,
  Camera,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar, SidebarItem } from './Sidebar';
import { GlassCard } from './GlassCard';
import { MasterSwitcher, UserRole } from './MasterSwitcher';
import { UserSettings } from './UserSettings';
import { InstitutionalCalendar } from './InstitutionalCalendar';
import { FoliosDocente } from './FoliosDocente';
import { AchievementWall } from './AchievementWall';
import { AISkillsSupport } from './AISkillsSupport';
import { StudentGroup } from './StudentGroup';
import { UnirseGrupoCard } from './UnirseGrupoCard';
import { PDPModule } from './PDPModule';
import { StudentTasks } from './StudentTasks';
import { StudentGrades } from './StudentGrades';
import { StudentFolios } from './StudentFolios';
import { MessagingModule } from './MessagingModule';
import { QuickChat } from './QuickChat';
import { MessageNotificationBell } from './MessageNotificationBell';
import { ProgressMap } from './ProgressMap';
import { ADNTest } from './tools/ADNTest';
import { ExtracurricularHub } from './ExtracurricularHub';
import { ExtracurricularModal } from './ExtracurricularModal';
import { WhatsAppButton, WHATSAPP_TEACHER_MESSAGE } from './WhatsAppButton';
import { useAppContext } from '../context/AppContext';
import { useStudentProgress } from '../hooks/useStudentProgress';
import { stopAllAudio } from '../utils/workbook/audioSupervisor';
import { useMemo } from 'react';
import { LibroVirtual } from './LibroVirtual';
import { ProfileOnboardingModal, isProfileComplete } from './ProfileOnboardingModal';
import { obtenerPerfilCompleto } from '../services/identityService';

interface AlumnoMainboardProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

 export function AlumnoMainboard({ currentRole, onRoleChange }: AlumnoMainboardProps) {
  const { 
    theme, 
    setTheme, 
    language, 
    setLanguage, 
    t,
    isSidebarCollapsed,
    isSidebarOpen,
    setIsSidebarOpen,
    globalEvents,
    isExtracurricularUnlocked,
    userEmail
  } = useAppContext();
  const [currentView, setCurrentView] = useState('dashboard');
  const [preselectedChatId, setPreselectedChatId] = useState<string | undefined>(undefined);
  const [prefilledMessageText, setPrefilledMessageText] = useState<string | undefined>(undefined);
  const [showADNTest, setShowADNTest] = useState(false);
  const [showClubVIP, setShowClubVIP] = useState(false);
  const [isADNDone, setIsADNDone] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [studentProfileData, setStudentProfileData] = useState<Record<string, unknown>>({});
  const [selectedLessonId, setSelectedLessonId] = useState<string>('A1_C01');
  const { currentWeek: studentCurrentWeek } = useStudentProgress(userEmail || undefined);

  // FIX 2026-09-30: al cambiar de vista/página se detiene TODO el TTS/audio activo
  // (workbook, tools, voces del backend) para que no siga sonando en la vista nueva.
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [currentView]);

  // FIX 2026-09-26: Navegacion a clase especifica
  const handleSelectClass = (claseId: string) => {
    setSelectedLessonId(claseId);
    setCurrentView('libro-virtual');
  };

  // FIX 2026-09-26: Continuar Ruta -> ultima leccion con progreso
  const handleContinueRoute = () => {
    const week = studentCurrentWeek && studentCurrentWeek > 0 ? studentCurrentWeek : 1;
    const claseId = 'A1_C' + String(week).padStart(2, '0');
    setSelectedLessonId(claseId);
    setCurrentView('libro-virtual');
  };

  const handleNavigateToFullChat = (userId: string) => {
    setPreselectedChatId(userId);
    setCurrentView('mensajes');
  };

  const handleBellNavigateToChat = (chatId: string) => {
    setPreselectedChatId(chatId);
    setCurrentView('mensajes');
  };
  const attendancePercentage = 98;
  const attendanceStreak = 12;

  // Cargar perfil del alumno para verificar si está completo
  useEffect(() => {
    const loadProfile = async () => {
      if (!userEmail) return;
      try {
        const perfil = await obtenerPerfilCompleto({ email: userEmail, rol: 'ALUMNO' });
        if (perfil) {
          const profileFields = {
            name: perfil.nombre || '',
            numeroControl: perfil.numero_control || '',
            moduloTec: perfil.modulo_tec || '',
          };
          setStudentProfileData(profileFields);
          // Si el perfil no está completo, mostrar el modal después de un breve delay
          if (!isProfileComplete('ALUMNO', profileFields)) {
            setTimeout(() => setShowOnboardingModal(true), 800);
          }
        }
      } catch (err) {
        console.warn('[AlumnoMainboard] Error loading profile:', err);
      }
    };
    loadProfile();
  }, [userEmail]);

  const sidebarItems: SidebarItem[] = useMemo(() => [
    { id: 'dashboard', label: t('my_dashboard'), icon: LayoutDashboard, category: 'Soporte & Global', isPrincipal: true },
    { id: 'mensajes', label: t('messages'), icon: MessageSquare, category: 'Soporte & Global' },
    { id: 'settings', label: t('settings'), icon: SettingsIcon, category: 'Soporte & Global' },

    { id: 'grupo', label: t('my_group'), icon: Users, category: 'Académico', isPrincipal: true },
    { id: 'unirse-grupo', label: 'Unirse a Grupo (CLE)', icon: Languages, category: 'Académico' },
    { id: 'tareas', label: t('tasks'), icon: ClipboardList, category: 'Académico' },
    { id: 'notas', label: t('grades'), icon: BarChart3, category: 'Académico' },
    { id: 'calendario', label: t('calendar'), icon: CalendarIcon, category: 'Académico' },
    { id: 'folios', label: t('folios'), icon: Mail, category: 'Académico' },

    { id: 'progress-map', label: t('progress_map'), icon: Map, badge: 'IA', category: 'Operaciones', isPrincipal: true },
    { id: 'libro-virtual', label: 'LIBRO VIRTUAL', icon: BookOpen, badge: 'A1', category: 'Operaciones' },
    { id: 'pdp', label: t('pdp'), icon: BarChart3, category: 'Operaciones' },

    { id: 'ai-support', label: t('ai_support'), icon: Sparkles, badge: t('new'), category: 'Monitoreo & Innovación', isPrincipal: true },
    { 
      id: 'extracurricular', 
      label: 'EXTRACURRICULAR', 
      icon: Sparkles, 
      badge: isExtracurricularUnlocked ? t('new') : 'PRÓXIMAMENTE',
      category: 'Monitoreo & Innovación'
    },
    { id: 'evidencia', label: 'Evidencia SMART', icon: Camera, category: 'Monitoreo & Innovación' },
    { id: 'logros', label: t('achievements'), icon: Trophy, category: 'Monitoreo & Innovación' },
  ], [t, isExtracurricularUnlocked]);

  const handleExtracurricular = () => {
    if (isExtracurricularUnlocked) {
      setCurrentView('extracurricular');
      return;
    }
    if (attendancePercentage < 85) {
      alert('ACCESO DENEGADO: Necesitas un mínimo de 85% de asistencia para el AR Portal VIP.');
      return;
    }
    setShowClubVIP(true);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#020b18] via-[#051c3a] to-[#010812] text-white lg:grid lg:grid-cols-[auto_1fr] overflow-hidden relative">
      <Sidebar
        items={sidebarItems}
        currentView={currentView}
        onViewChange={(view) => {
          if (view === 'extracurricular') {
            handleExtracurricular();
          } else {
            setCurrentView(view);
          }
        }}
        currentRole={currentRole}
        onRoleChange={onRoleChange}
        userName="Alumno Inmersivo"
        userSub="Nivel A1 • Dallas"
        userInitials="AL"
        userColor="bg-[#22D3EE]"
        onNavigateToChat={handleBellNavigateToChat}
      />

      <MessageNotificationBell
        onNavigateToChat={handleBellNavigateToChat}
        onNavigateToCalendar={() => setCurrentView('calendario')}
        accentColor="#22D3EE"
      />

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-h-0 ${isSidebarOpen ? 'overflow-hidden' : 'overflow-y-auto'} custom-scrollbar pt-20 lg:pt-0 transition-all duration-300 relative h-screen lg:h-auto`}>
        <div className="p-6 md:p-8 lg:p-12 max-w-[1400px] mx-auto w-full space-y-8 md:space-y-12 pb-48">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {currentView === 'dashboard' ? (
                <div className="space-y-8 md:space-y-12">
                  <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                      <h2 className="text-[#DEFF9A] text-[10px] font-black uppercase tracking-[0.4em] mb-2 md:mb-3">Hola, Alumno_01!</h2>
                      <h1 className="text-3xl md:text-4xl font-black text-white bevel-text uppercase tracking-tight">Good Morning.</h1>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                        <WhatsAppButton
                          label="Teacher Online"
                          sublabel="WhatsApp 8461108789"
                          message={WHATSAPP_TEACHER_MESSAGE}
                          iconSize={16}
                          className="px-5 py-3.5"
                        />
                        {globalEvents.filter(e => e.visibility.includes('GLOBAL') || e.visibility.includes('ALUMNO')).length > 0 && (
                          <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 hidden xl:flex">
                             <CalendarIcon size={16} className="text-[#DEFF9A]" />
                             <div className="text-left">
                                <p className="text-[#DEFF9A] text-[8px] font-black uppercase tracking-widest leading-none">Aviso Institucional</p>
                                <p className="text-white text-[10px] font-bold uppercase truncate max-w-[120px]">
                                   {globalEvents.find(e => e.visibility.includes('GLOBAL') || e.visibility.includes('ALUMNO'))?.title}
                                </p>
                             </div>
                          </div>
                        )}
                        <button 
                         onClick={handleContinueRoute}
                         className="flex items-center justify-center gap-3 px-6 py-4 md:py-3 rounded-2xl bg-[#DEFF9A]/10 border border-[#DEFF9A]/20 text-[#DEFF9A] text-[10px] font-black uppercase tracking-widest hover:bg-[#DEFF9A] hover:text-[#061a1a] transition-all"
                       >
                         Continuar Ruta <ChevronRight size={14} />
                       </button>
                             <div className="flex items-center gap-6 bg-white/[0.02] p-4 rounded-2xl border border-white/5 sm:bg-transparent sm:border-0 sm:p-0">
                                <div className="text-left md:text-right w-full">
                                    <p className="text-white/20 text-[8px] font-black uppercase tracking-widest mb-1">Tu Constancia</p>
                                    <div className="flex items-center gap-3 text-[#F59E0B] md:justify-end">
                                      <div className="relative">
                                        <Flame size={24} fill="currentColor" className="animate-pulse" />
                                        <div className="absolute inset-0 blur-lg bg-[#F59E0B]/40 animate-pulse" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-2xl font-black uppercase leading-none">{attendanceStreak} DÍAS</span>
                                        <span className="text-[8px] font-bold text-[#F59E0B]/60 uppercase tracking-widest">Streak Activo</span>
                                      </div>
                                    </div>
                                </div>
                              </div>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8">
                    {/* ADN Alert Banner */}
                    {!isADNDone && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="col-span-1 md:col-span-2 lg:col-span-12 p-6 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] bg-gradient-to-br md:bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-transparent border border-purple-500/30 flex flex-col lg:flex-row items-center lg:justify-between gap-8 md:gap-10 overflow-hidden relative group text-center lg:text-left"
                      >
                         <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] -translate-y-1/2 translate-x-1/2 rounded-full" />
                         <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10 w-full lg:w-auto">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_40px_rgba(139,92,246,0.2)] shrink-0">
                               <Dna size={32} className="animate-pulse" />
                            </div>
                            <div className="space-y-2">
                               <div className="flex flex-col md:flex-row items-center gap-3">
                                  <h3 className="text-white text-lg md:text-xl font-black uppercase tracking-tight">Tu ADN Académico está incompleto</h3>
                                  <span className="px-3 py-1 rounded-full bg-purple-500 text-white text-[8px] font-black uppercase">Obligatorio</span>
                               </div>
                               <p className="text-white/40 text-[10px] md:text-[11px] font-medium leading-relaxed max-w-xl mx-auto md:mx-0">
                                 Para que la IA de TECLINGO pueda personalizar tus tareas y exámenes con tus gustos, necesitamos recalibrar tu ADN inicial.
                               </p>
                            </div>
                         </div>
                         <button 
                           onClick={() => setShowADNTest(true)}
                           className="w-full lg:w-auto px-10 py-5 rounded-2xl md:rounded-3xl bg-white text-[#061a1a] text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl relative z-10"
                         >
                            Iniciar ADN Test
                         </button>
                      </motion.div>
                    )}


                    {/* Progress Card */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-8">
                       <GlassCard accent="green" className="!p-6 md:!p-10 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-[#DEFF9A]/05 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10 lg:gap-12">
                             <div className="flex-1 space-y-6 md:space-y-8">
                                <div>
                                   <div className="flex items-center gap-4 mb-3">
                                      <span className="px-3 py-1 rounded-full bg-[#DEFF9A] text-[#061a1a] text-[10px] font-black uppercase">NIVEL A1</span>
                                      <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">75% Completado</span>
                                   </div>
                                   <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                                      <div className="h-full bg-[#DEFF9A] rounded-full shadow-[0_0_15px_#DEFF9A]" style={{ width: '75%' }} />
                                   </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 md:gap-8">
                                   <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-black/20 border border-white/5">
                                      <p className="text-white/20 text-[8px] font-black uppercase tracking-widest mb-2">Speaking Accuracy</p>
                                      <div className="flex items-end gap-2">
                                         <p className="text-2xl md:text-3xl font-black text-[#DEFF9A]">8.2</p>
                                         <p className="text-[10px] text-white/40 font-bold mb-1">/ 10</p>
                                      </div>
                                   </div>
                                   <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-black/20 border border-white/5">
                                      <p className="text-white/20 text-[8px] font-black uppercase tracking-widest mb-2">Attendance Score</p>
                                      <p className="text-2xl md:text-3xl font-black text-white">98%</p>
                                   </div>
                                </div>
                             </div>

                             <div className="w-full md:w-64 flex flex-col justify-center items-center gap-6 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-white/[0.03] border border-white/5 text-center">
                                <QrCode size={48} className="text-[#DEFF9A] opacity-60 md:size-64" />
                                <div>
                                   <p className="text-white text-xs font-black uppercase">Acceso Rápido</p>
                                   <p className="text-white/20 text-[8px] font-bold uppercase tracking-widest mt-2 leading-relaxed max-w-[150px] mx-auto">Escanea tu ID en el campus al llegar.</p>
                                </div>
                                <button 
                                  onClick={() => setCurrentView('settings')}
                                  className="w-full py-4 bg-[#DEFF9A] text-[#061a1a] rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(222,255,154,0.3)]"
                                >
                                   Ver ID Card
                                </button>
                             </div>
                          </div>
                       </GlassCard>
                    </div>

                    {/* Upcoming Tasks */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-4">
                       <GlassCard title="Próxima Clase" icon={Clock} accent="cyan">
                          <div className="space-y-6">
                             <div className="flex justify-between items-center text-[9px] font-black text-white/30 uppercase tracking-[0.2em] pb-4 border-b border-white/5">
                                <span>MAÑANA • 08:00 AM</span>
                                <span>SALÓN 102</span>
                             </div>
                             
                             <div className="space-y-4">
                                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Tareas por Completar:</p>
                                <div className="space-y-3">
                                   {[
                                     { t: 'Review Airport Vocab', c: true },
                                     { t: 'Practice "The Bridge" AI', c: false },
                                     { t: 'Upload Passport Evidence', c: false }
                                   ].map((task, i) => (
                                     <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${task.c ? 'bg-[#4ADE80] border-[#4ADE80] text-[#061a1a]' : 'border-white/10'}`}>
                                           {task.c && <CheckCircle2 size={12} strokeWidth={3} />}
                                        </div>
                                        <span className={`text-[9px] font-bold uppercase tracking-tight truncate ${task.c ? 'text-white/60 line-through' : 'text-white'}`}>{task.t}</span>
                                     </div>
                                   ))}
                                </div>
                             </div>

                             <button className="w-full py-4 bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE] rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#22D3EE] hover:text-[#061a1a] transition-all">
                                Ir a Laboratorio IA <ChevronRight size={14} />
                             </button>
                          </div>
                       </GlassCard>
                    </div>

                    {/* Insights Widget */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-12">
                       <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br md:bg-gradient-to-r from-[#DEFF9A]/10 to-transparent border border-[#DEFF9A]/10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                             <div className="w-16 h-16 rounded-2xl md:rounded-3xl bg-[#DEFF9A]/20 flex items-center justify-center text-[#DEFF9A] shrink-0">
                                <TrendingUp size={32} />
                             </div>
                             <div>
                                <h4 className="text-white text-lg md:text-xl font-black uppercase tracking-tight">AI Achievement Alert</h4>
                                <p className="text-white/40 text-[10px] md:text-[11px] font-medium leading-relaxed max-w-xl">
                                   "Tu desempeño en 'Pronunciación de Vocales' ha aumentado un 15% esta semana. ¡Sigue practicando en 'The Bridge' para alcanzar el rango ELITE!"
                                </p>
                             </div>
                          </div>
                          <button 
                            onClick={() => setCurrentView('logros')}
                            className="w-full md:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all shrink-0"
                          >
                            Ver Detalles
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              ) : currentView === 'progress-map' ? (
                <div className="h-[calc(100vh-120px)]">
                  <ProgressMap 
                    studentEmail={userEmail || undefined}
                    onBackToPDP={() => setCurrentView('pdp')}
                    onSelectClass={handleSelectClass}
                  />
                </div>
              ) : currentView === 'libro-virtual' ? (
                <LibroVirtual role="alumno" lessonId={selectedLessonId} />
              ) : currentView === 'pdp' ? (
                <PDPModule onOpenProgressMap={() => setCurrentView('progress-map')} />
              ) : currentView === 'grupo' ? (
                <StudentGroup />
              ) : currentView === 'unirse-grupo' ? (
                <UnirseGrupoCard />
              ) : currentView === 'ai-support' ? (
                <AISkillsSupport />
              ) : currentView === 'tareas' ? (
                <StudentTasks />
              ) : currentView === 'notas' ? (
                <StudentGrades />
              ) : currentView === 'calendario' ? (
                <InstitutionalCalendar />
              ) : currentView === 'folios' ? (
                <StudentFolios />
              ) : currentView === 'mensajes' ? (
                <MessagingModule initialChatId={preselectedChatId} initialPrefilledText={prefilledMessageText} />
              ) : currentView === 'logros' ? (
                <AchievementWall />
              ) : currentView === 'extracurricular' ? (
                <ExtracurricularHub />
              ) : currentView === 'evidencia' ? (
                <EvidenceUploadSection userEmail={userEmail || ''} />
              ) : currentView === 'settings' ? (
                <UserSettings 
                  role="ALUMNO" 
                  onContactTeacher={(teacherId, greeting) => {
                    setPreselectedChatId(teacherId);
                    setPrefilledMessageText(greeting);
                    setCurrentView('mensajes');
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4 opacity-20 text-center">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-dashed border-white/20 flex items-center justify-center mb-8">
                     <GraduationCap size={48} className="text-white/40 md:size-64" />
                  </div>
                  <p className="text-2xl md:text-4xl font-black tracking-[0.3em] md:tracking-[0.5em] uppercase bevel-text mb-4 leading-tight">Module Locked</p>
                  <p className="text-[10px] md:text-[12px] tracking-widest font-bold max-w-md mx-auto leading-relaxed">
                    ESTE MÓDULO ESTÁ EN FASE DE DESARROLLO INMERSIVO. PRÓXIMAMENTE DISPONIBLE PARA EL CICLO 2026-B.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {showADNTest && (
          <ADNTest onClose={() => {
            setShowADNTest(false);
            setIsADNDone(true);
          }} />
        )}
        {showClubVIP && (
          <ExtracurricularModal 
            onClose={() => {
              setShowClubVIP(false);
              if (isExtracurricularUnlocked) {
                setCurrentView('extracurricular');
              }
            }} 
          />
        )}
      </AnimatePresence>

      {/* QuickChat flotante */}
      <QuickChat onNavigateToFullChat={handleNavigateToFullChat} />

      {/* Modal de Onboarding — Perfil incompleto */}
      <ProfileOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onCompleteProfile={() => {
          setShowOnboardingModal(false);
          setCurrentView('settings');
        }}
        role="ALUMNO"
        profileData={studentProfileData}
      />
    </div>
  );
}

interface EvidenceUploadSectionProps {
  userEmail: string;
}

function EvidenceUploadSection({ userEmail }: EvidenceUploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>('');
  const [grupos, setGrupos] = useState<{ grupo_id: string; nombre: string }[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load student's groups
  useEffect(() => {
    const loadGrupos = async () => {
      if (!userEmail) return;
      try {
        const { misGruposIngles } = await import('../services/identityService');
        const misGrupos = await misGruposIngles(userEmail);
        setGrupos(misGrupos.map(g => ({
          grupo_id: g.grupo_id,
          nombre: g.nombre || `Grupo ${g.grupo}`,
        })));
      } catch (err) {
        console.warn('[EvidenceUpload] Error loading groups:', err);
      } finally {
        setLoadingGrupos(false);
      }
    };
    loadGrupos();
  }, [userEmail]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen (JPG, PNG)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo excede el tamaño máximo de 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!previewUrl || !userEmail) return;

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      // Extract base64 from data URL
      const base64Data = previewUrl.split(',')[1];
      const fileName = `evidencia_${new Date().toISOString().slice(0, 10)}_${Date.now()}.jpg`;
      
      const { uploadEvidence } = await import('../services/identityService');
      const result = await uploadEvidence(
        userEmail,
        base64Data,
        fileName,
        'image/jpeg',
        'alumno_clase',
        selectedGrupoId,
        new Date().toISOString().slice(0, 10)
      );

      if (result.ok) {
        setUploadStatus('success');
        setPreviewUrl(null);
        setSelectedGrupoId('');
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setUploadStatus('error');
        console.error('Upload failed:', result.error);
      }
    } catch (error) {
      setUploadStatus('error');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-[#22D3EE] text-[10px] font-black uppercase tracking-[0.4em] mb-3">Evidencia SMART</h2>
        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Capturar Evidencia</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Area */}
        <div className="space-y-6">
          <GlassCard title="Subir Evidencia" icon={Camera} accent="cyan">
            <div className="space-y-6">
              <p className="text-white/60 text-[11px] font-medium leading-relaxed italic">
                "Sube la evidencia de hoy para validar tu sesión ante Dirección. El sistema TECLINGO PRO 1.1 analizará el contexto pedagógico."
              </p>

              {/* Group Selector */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest ml-1">Seleccionar Grupo *</label>
                {loadingGrupos ? (
                  <div className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white/40 text-xs">
                    Cargando grupos...
                  </div>
                ) : grupos.length === 0 ? (
                  <div className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white/40 text-xs">
                    No tienes grupos asignados
                  </div>
                ) : (
                  <select
                    value={selectedGrupoId}
                    onChange={(e) => setSelectedGrupoId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-xs font-bold focus:border-[#22D3EE]/40 outline-none appearance-none"
                  >
                    <option value="" className="bg-[#061a1a]">-- Selecciona un grupo --</option>
                    {grupos.map(g => (
                      <option key={g.grupo_id} value={g.grupo_id} className="bg-[#061a1a]">
                        {g.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE] text-[8px] font-black uppercase tracking-widest">JPG, PNG</div>
                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 text-[8px] font-black uppercase tracking-widest">Max 10MB</div>
              </div>

              {/* File Input */}
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="evidence-upload"
                />
                <label
                  htmlFor="evidence-upload"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:border-[#22D3EE]/40 hover:bg-[#22D3EE]/5 transition-all"
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="max-h-40 max-w-full object-contain rounded-xl" />
                  ) : (
                    <>
                      <Upload size={40} className="text-white/20 mb-4" />
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Toca para seleccionar imagen</p>
                    </>
                  )}
                </label>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!previewUrl || !selectedGrupoId || isUploading}
                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  !previewUrl || !selectedGrupoId || isUploading
                    ? 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'
                    : 'bg-[#22D3EE]/20 border border-[#22D3EE]/30 text-[#22D3EE] hover:bg-[#22D3EE] hover:text-[#061a1a]'
                }`}
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    Subir Evidencia
                  </>
                )}
              </button>

              {/* Status Messages */}
              {uploadStatus === 'success' && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                  <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                    Evidencia subida exitosamente
                  </p>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">!</div>
                  <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest">
                    Error al subir evidencia. Intenta de nuevo.
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <GlassCard title="Instrucciones" icon={Clock} accent="green">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#DEFF9A]/20 flex items-center justify-center text-[#DEFF9A] text-[10px] font-black shrink-0">1</div>
                <p className="text-white/60 text-[10px] font-medium leading-relaxed">
                  Selecciona una foto clara de tu evidencia (asistencia, retraso, etc.)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#DEFF9A]/20 flex items-center justify-center text-[#DEFF9A] text-[10px] font-black shrink-0">2</div>
                <p className="text-white/60 text-[10px] font-medium leading-relaxed">
                  Asegúrate de que la imagen sea legible y muestre la fecha/hora
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#DEFF9A]/20 flex items-center justify-center text-[#DEFF9A] text-[10px] font-black shrink-0">3</div>
                <p className="text-white/60 text-[10px] font-medium leading-relaxed">
                  Presiona "Subir Evidencia" y espera la confirmación
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard title="Formatos Aceptados" icon={Zap} accent="orange">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#22D3EE]/10 flex items-center justify-center text-[#22D3EE]">
                  <Camera size={16} />
                </div>
                <div>
                  <p className="text-white text-[10px] font-black uppercase tracking-widest">JPG / JPEG</p>
                  <p className="text-white/40 text-[8px] font-medium">Formato estándar de imagen</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#DEFF9A]/10 flex items-center justify-center text-[#DEFF9A]">
                  <Camera size={16} />
                </div>
                <div>
                  <p className="text-white text-[10px] font-black uppercase tracking-widest">PNG</p>
                  <p className="text-white/40 text-[8px] font-medium">Formato sin compresión</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
