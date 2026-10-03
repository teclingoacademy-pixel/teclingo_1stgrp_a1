/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Send, 
  Paperclip, 
  MoreVertical,
  Users,
  GraduationCap,
  ShieldCheck,
  Check,
  Image as ImageIcon,
  Eye,
  Star,
  BrainCircuit,
  Zap,
  Mic,
  Languages,
  Sparkles,
  Info,
  X,
  Volume2,
  Crown,
  ArrowLeft,
  Contact,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext, ChatThread, Message as AppMessage } from '../context/AppContext';
import { UserHierarchyModal, User } from './UsersMaster';
import { listarUsuarios, UsuarioComunidad } from '../services/identityService';
import { broadcastMessage } from '../services/messagingService';

// Helper to convert Chat to User for the modal
export const chatToUser = (chat: ChatThread): User => ({
  id: chat.id,
  controlNumber: 'TEC-2024-' + chat.id.slice(-3),
  curp: 'XXXX000000XXXXXX00',
  name: chat.name,
  email: chat.name.toLowerCase().replace(' ', '.') + '@tecnolingo.ai',
  phone: '+52 833 000 0000',
  location: 'Campus General',
  role: chat.type === 'GLOBAL' ? 'ADMIN' : (chat.type === 'GROUP' ? 'ALUMNO' : 'DOCENTE'),
  status: 'ACTIVE',
  joinDate: '01 ENE 2024',
  photo: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=150&h=150&fit=crop',
});

export function MessagingModule({ initialChatId, initialPrefilledText }: { initialChatId?: string; initialPrefilledText?: string }) {
  const { currentRole, chats, addMessage, setQuickChatUser, cargarMensajesChat, userEmail, userName, createGroupChat, markChatAsRead } = useAppContext();
  const [selectedChatId, setSelectedChatId] = useState<string>(chats[0]?.id || '');
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const [showADNPin, setShowADNPin] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [showDossier, setShowDossier] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [usuariosBroadcast, setUsuariosBroadcast] = useState<UsuarioComunidad[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchUserBroadcast, setSearchUserBroadcast] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ recipients: number; pushSent: number; pushFailed: number } | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [activeTab, setActiveTab] = useState<'contactos' | 'mensajes'>('mensajes');
  const [contactos, setContactos] = useState<UsuarioComunidad[]>([]);
  const [loadingContactos, setLoadingContactos] = useState(false);
  const [contactFilter, setContactFilter] = useState<'TODOS' | 'DIRECTOR' | 'DOCENTE' | 'ALUMNO'>('TODOS');

  useEffect(() => {
    if (initialChatId) {
      setSelectedChatId(initialChatId);
      setMobileView('chat');

      // Si el chat no existe localmente, crearlo a partir del chatId DIRECT-...
      const exists = chats.find(c => c.id === initialChatId);
      if (!exists && userEmail) {
        const isDirect = initialChatId.startsWith('DIRECT-');
        const chatName = isDirect
          ? (() => {
              const parts = initialChatId.replace('DIRECT-', '').split('_');
              const other = parts.find(p => p.toLowerCase() !== userEmail.toLowerCase()) || parts[0];
              return other;
            })()
          : initialChatId;
        const participants = isDirect
          ? initialChatId.replace('DIRECT-', '').split('_')
          : [userEmail];
        createGroupChat(initialChatId, chatName, participants);
      }
    }
    if (initialPrefilledText) {
      setInputText(initialPrefilledText);
    }
  }, [initialChatId, initialPrefilledText, userEmail, createGroupChat]);

  // Garantizar que el chat seleccionado exista localmente (también cuando el usuario
  // hace click en un item de la lista cuyo chat_id no se haya cargado aún del backend)
  useEffect(() => {
    if (!selectedChatId || !userEmail) return;
    const exists = chats.find(c => c.id === selectedChatId);
    if (exists) return;

    const isDirect = selectedChatId.startsWith('DIRECT-');
    if (!isDirect) return; // Solo auto-creamos chats DIRECT-* (los GROUP los crea el director)

    const chatName = (() => {
      const parts = selectedChatId.replace('DIRECT-', '').split('_');
      const other = parts.find(p => p.toLowerCase() !== userEmail.toLowerCase()) || parts[0];
      return other;
    })();
    const participants = selectedChatId.replace('DIRECT-', '').split('_');
    createGroupChat(selectedChatId, chatName, participants);
  }, [selectedChatId, chats, userEmail, createGroupChat]);

  // Marcar como leído cuando se selecciona un chat
  useEffect(() => {
    if (selectedChatId) {
      markChatAsRead(selectedChatId);
    }
  }, [selectedChatId]);

  // Cargar mensajes al seleccionar un chat
  useEffect(() => {
    if (selectedChatId) {
      cargarMensajesChat(selectedChatId);
    }
  }, [selectedChatId]);

  // Polling: refrescar mensajes del chat seleccionado cada 10 segundos
  useEffect(() => {
    if (!selectedChatId) return;
    const interval = setInterval(() => {
      cargarMensajesChat(selectedChatId);
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedChatId]);

  // Cargar contactos cuando se selecciona la pestaña de contactos o cambia el filtro
  useEffect(() => {
    if (activeTab !== 'contactos') return;
    
    const cargarContactos = async () => {
      setLoadingContactos(true);
      try {
        const filtroBackend = contactFilter === 'TODOS' ? 'TODOS' : contactFilter;
        const usuarios = await listarUsuarios(filtroBackend, search);
        setContactos(usuarios);
      } catch (error) {
        console.error('Error cargando contactos:', error);
      } finally {
        setLoadingContactos(false);
      }
    };
    
    cargarContactos();
  }, [activeTab, contactFilter]);

  const filteredChats = useMemo(() => {
    return chats.filter(chat => {
      const matchesSearch = chat.name.toLowerCase().includes(search.toLowerCase());
      
      // Basic role filtering for demo purposes
      // In a real app, participants logic would handle this
      if (currentRole === 'ALUMNO') {
         return matchesSearch && (chat.type === 'GROUP' || chat.type === 'GLOBAL' || chat.type === 'DIRECT');
      }
      return matchesSearch;
    });
  }, [chats, currentRole, search]);

  const selectedChat = useMemo(
    () => chats.find(c => c.id === selectedChatId) || filteredChats[0],
    [chats, selectedChatId, filteredChats]
  );

  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedChat) return;

    const senderName = userName || (
      currentRole === 'DIRECTOR' ? 'Dirección' :
      currentRole === 'DOCENTE' ? 'Docente' : 'Alumno'
    );

    const newMessage: AppMessage = {
      id: Date.now().toString(),
      senderId: 'ME',
      senderName,
      senderRole: currentRole,
      content: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDirector: currentRole === 'DIRECTOR'
    };

    addMessage(selectedChat.id, newMessage);
    setInputText('');

    // Resetear badge de no leídos para este chat (ya lo estamos viendo)
    markChatAsRead(selectedChat.id);
  };

  // Cargar usuarios y preseleccionar TODOS al abrir el modal
  useEffect(() => {
    if (!showBroadcastModal) return;
    setBroadcastResult(null);
    setBroadcastError(null);
    listarUsuarios('TODOS', '').then((users) => {
      // Excluir al propio director de la lista
      const filtered = users.filter((u) => u.email.toLowerCase() !== (userEmail || '').toLowerCase());
      setUsuariosBroadcast(filtered);
      setSelectedUserIds(filtered.map((u) => u.id));
    }).catch((err) => {
      console.error('[broadcast] Error cargando usuarios:', err);
      setBroadcastError('No se pudieron cargar los usuarios');
    });
  }, [showBroadcastModal, userEmail]);

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) {
      setBroadcastError('Escribe un mensaje antes de enviar');
      return;
    }
    if (selectedUserIds.length === 0) {
      setBroadcastError('Selecciona al menos un usuario');
      return;
    }

    setSendingBroadcast(true);
    setBroadcastError(null);
    setBroadcastResult(null);

    try {
      // Mapear IDs seleccionados a emails (el backend los resuelve a userIds)
      const recipientEmails = usuariosBroadcast
        .filter((u) => selectedUserIds.includes(u.id))
        .map((u) => u.email);

      if (recipientEmails.length === 0) {
        throw new Error('No se pudieron mapear los usuarios seleccionados');
      }

      const result = await broadcastMessage(userEmail || '', recipientEmails, broadcastText);

      setBroadcastResult(result);
      setBroadcastText('');

      // Refrescar el chat GLOBAL para que aparezca el mensaje
      await cargarMensajesChat('CHAT-GLOBAL');

      // Cerrar despues de 2s (exito)
      setTimeout(() => {
        setShowBroadcastModal(false);
        setBroadcastResult(null);
      }, 2000);
    } catch (err: any) {
      console.error('[broadcast] Error:', err);
      setBroadcastError(err?.message || 'Error al enviar el broadcast');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleAISuggest = () => {
    if (!inputText) return;
    setAiSuggestion(`Sugerencia IA: "Hi team! I've published the new administrative updates. Please confirm once you've read them."`);
    setShowAIAssistant(true);
  };

  const applyAISuggestion = () => {
    if (aiSuggestion) {
      setInputText(aiSuggestion.split('"')[1]);
      setAiSuggestion(null);
      setShowAIAssistant(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-200px)] grid grid-cols-12 gap-4 lg:gap-8 pb-12 animate-in fade-in duration-700">
      {/* Sidebar: Red de Apoyo List */}
      <div className={`col-span-12 lg:col-span-4 flex flex-col gap-4 lg:gap-6 h-full ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="space-y-6">
             <header className="flex items-center justify-between">
                <div>
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#DEFF9A] shadow-[0_0_8px_#DEFF9A]" />
                     <h2 className="text-[#DEFF9A] text-[10px] font-black uppercase tracking-[0.4em]">Sincronización Real-Time</h2>
                   </div>
                   <h1 className="text-3xl font-black text-white bevel-text uppercase tracking-tight">
                     {activeTab === 'contactos' ? 'Contactos' : 'Red de Apoyo'}
                   </h1>
                </div>
                
                {currentRole === 'DIRECTOR' && (
                  <button 
                   onClick={() => setShowBroadcastModal(true)}
                   className="p-3 bg-[#DEFF9A] text-black rounded-2xl shadow-[0_0_20px_rgba(222,255,154,0.4)] hover:scale-105 transition-all"
                   title="Broadcast Institucional"
                  >
                     <Volume2 size={20} />
                  </button>
                )}
             </header>

             {/* Botones de pestañas */}
             <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
               <button
                 onClick={() => setActiveTab('contactos')}
                 className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                   activeTab === 'contactos'
                     ? 'bg-[#DEFF9A] text-black shadow-[0_0_15px_rgba(222,255,154,0.3)]'
                     : 'text-white/40 hover:text-white/60'
                 }`}
               >
                 <Contact size={16} />
                 Contactos
               </button>
               <button
                 onClick={() => setActiveTab('mensajes')}
                 className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                   activeTab === 'mensajes'
                     ? 'bg-[#DEFF9A] text-black shadow-[0_0_15px_rgba(222,255,154,0.3)]'
                     : 'text-white/40 hover:text-white/60'
                 }`}
               >
                 <MessageSquare size={16} />
                 Mensajes
               </button>
             </div>

             <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#DEFF9A] transition-colors" size={18} />
                <input 
                 type="text" 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 placeholder={activeTab === 'contactos' ? 'Buscar contactos...' : 'Buscar chats o grupos...'}
                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white text-[11px] placeholder:text-white/10 outline-none focus:border-[#DEFF9A]/40 transition-all font-bold"
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {activeTab === 'contactos' ? (
              // Vista de Contactos
              loadingContactos ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-3">
                  <div className="w-8 h-8 border-2 border-[#DEFF9A] border-t-transparent rounded-full animate-spin" />
                  <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Cargando contactos...</p>
                </div>
              ) : contactos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-3 text-center">
                  <Contact size={32} className="text-white/20" />
                  <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">No hay contactos disponibles</p>
                </div>
              ) : (
                <>
                  {/* Filtros por rol - Solo para DIRECTOR */}
                  {currentRole === 'DIRECTOR' && (
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {[
                        { label: 'Todos', value: 'TODOS' as const, icon: Users, count: contactos.length },
                        { label: 'Directores', value: 'DIRECTOR' as const, icon: Crown, count: contactos.filter(c => c.rol === 'DIRECTOR').length },
                        { label: 'Docentes', value: 'DOCENTE' as const, icon: GraduationCap, count: contactos.filter(c => c.rol === 'DOCENTE').length },
                        { label: 'Alumnos', value: 'ALUMNO' as const, icon: UserPlus, count: contactos.filter(c => c.rol === 'ALUMNO').length },
                      ].map((btn) => (
                        <button
                          key={btn.value}
                          onClick={() => setContactFilter(btn.value)}
                          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                            contactFilter === btn.value
                              ? 'bg-[#DEFF9A]/10 border-[#DEFF9A]/30 text-[#DEFF9A] shadow-[0_0_10px_#DEFF9A15]'
                              : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
                          }`}
                        >
                          <btn.icon size={12} />
                          {btn.label}
                          <span className="ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[8px]">
                            {btn.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Lista de contactos filtrados */}
                  {contactos
                    .filter(c => {
                      const matchesSearch = 
                        c.nombre.toLowerCase().includes(search.toLowerCase()) ||
                        c.email.toLowerCase().includes(search.toLowerCase());
                      const matchesRole = contactFilter === 'TODOS' || c.rol === contactFilter;
                      return matchesSearch && matchesRole;
                    })
                    .map((contacto) => (
                      <motion.button
                        key={contacto.id}
                        whileHover={{ x: 5 }}
                        onClick={() => {
                          // Crear o abrir chat directo con este contacto
                          const sortedEmails = [userEmail, contacto.email].map(e => e.toLowerCase().trim()).sort();
                          const chatId = `DIRECT-${sortedEmails.join('_')}`;
                          createGroupChat(chatId, contacto.nombre, [userEmail, contacto.email]);
                          setSelectedChatId(chatId);
                          setMobileView('chat');
                          setActiveTab('mensajes');
                        }}
                        className="w-full p-4 rounded-[2rem] border text-left flex items-center gap-4 group transition-all relative overflow-hidden bg-white/[0.01] border-white/5 hover:border-white/10"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl border border-white/10 overflow-hidden group-hover:border-[#DEFF9A]/40 transition-all bg-black/40 flex items-center justify-center text-[#DEFF9A]">
                            {contacto.rol === 'DIRECTOR' ? <Crown size={20} /> : 
                             contacto.rol === 'DOCENTE' ? <GraduationCap size={20} /> : <Users size={20} />}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#061a1a] ${
                            contacto.status === 'ACTIVE' ? 'bg-[#4ADE80] shadow-[0_0_10px_#4ADE80]' : 'bg-red-500'
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-white text-[13px] font-black uppercase tracking-tight truncate">
                              {contacto.nombre}
                            </h4>
                            <span className="text-white/20 text-[8px] font-black">
                              {contacto.joinDate || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                              contacto.rol === 'DIRECTOR' ? 'bg-amber-500/20 text-amber-400' :
                              contacto.rol === 'DOCENTE' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-cyan-500/20 text-cyan-400'
                            }`}>
                              {contacto.rol}
                            </span>
                            {contacto.location && (
                              <span className="text-[7px] font-bold text-white/20 truncate max-w-[100px]">
                                {contacto.location}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] truncate font-medium text-white/20">
                            {contacto.email}
                          </p>
                        </div>

                        <div className="text-white/20 group-hover:text-[#DEFF9A] transition-colors">
                          <MessageSquare size={16} />
                        </div>
                      </motion.button>
                    ))
                  }
                </>
              )
            ) : (
              // Vista de Mensajes (comportamiento original)
              filteredChats.map((chat) => (
                <motion.button 
                  key={chat.id}
                  whileHover={{ x: 5 }}
                  onClick={() => {
                     setSelectedChatId(chat.id);
                     setMobileView('chat');
                  }}
                  className={`w-full p-4 rounded-[2rem] border text-left flex items-center gap-4 group transition-all relative overflow-hidden ${
                    selectedChatId === chat.id 
                    ? 'bg-[#DEFF9A]/10 border-[#DEFF9A]/20 shadow-[0_10px_30px_rgba(222,255,154,0.05)]' 
                    : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                  }`}
                >
                   <div className="relative">
                      <div className="w-12 h-12 rounded-2xl border border-white/10 overflow-hidden group-hover:border-[#DEFF9A]/40 transition-all bg-black/40 flex items-center justify-center text-[#DEFF9A]">
                         {chat.type === 'GROUP' ? <Users size={20} /> : <Crown size={20} />}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#061a1a] bg-[#4ADE80] shadow-[0_0_10px_#4ADE80]" />
                   </div>

                   <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                         <h4 className="text-white text-[13px] font-black uppercase tracking-tight truncate">
                           {(() => {
                             if (chat.type !== 'DIRECT') return chat.name;
                             const otherEmail = chat.participants.find(p => p.toLowerCase() !== userEmail.toLowerCase());
                             const resolved = otherEmail && chat.participantNames?.[otherEmail];
                             return resolved || chat.name;
                           })()}
                         </h4>
                         <span className="text-white/20 text-[8px] font-black">
                            {chat.messages[chat.messages.length - 1]?.timestamp || '...'}
                         </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        {chat.type === 'DIRECT' ? (() => {
                          const otherEmail = chat.participants.find(p => p.toLowerCase() !== userEmail.toLowerCase());
                          const role = otherEmail && chat.participantRoles?.[otherEmail];
                          const roleColors: Record<string, string> = {
                            DIRECTOR: 'bg-amber-500/20 text-amber-400',
                            DOCENTE: 'bg-purple-500/20 text-purple-400',
                            ALUMNO: 'bg-cyan-500/20 text-cyan-400'
                          };
                          return role ? (
                            <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${roleColors[role] || 'bg-blue-500/20 text-blue-400'}`}>
                              {role}
                            </span>
                          ) : (
                            <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                              DIRECT
                            </span>
                          );
                        })() : (
                        <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          chat.type === 'GLOBAL' ? 'bg-orange-500/20 text-orange-400' :
                          chat.type === 'GROUP' ? 'bg-[#DEFF9A]/20 text-[#DEFF9A]' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {chat.type} CHANNEL
                        </span>
                        )}
                      </div>
                      <p className={`text-[10px] truncate font-medium ${chat.unreadCount > 0 ? 'text-[#DEFF9A] font-black' : 'text-white/20'}`}>
                         {chat.lastMessage || 'Inicia la conversación...'}
                      </p>
                   </div>

                   {chat.unreadCount > 0 && (
                     <div className="bg-[#DEFF9A] text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_#DEFF9A]">
                        {chat.unreadCount}
                     </div>
                   )}
                </motion.button>
              ))
            )}
         </div>
      </div>

      {/* Main Window: Support Chat */}
      <div className={`col-span-12 lg:col-span-8 h-full flex flex-col rounded-3xl lg:rounded-[3.5rem] bg-black/40 border border-white/5 overflow-hidden relative glass shadow-2xl ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}`}>
         <div className="absolute inset-0 bg-gradient-to-b from-[#DEFF9A]/05 to-transparent pointer-events-none" />
         
         {selectedChat ? (
           <>
             <header className="p-4 sm:p-8 border-b border-white/10 flex items-center justify-between bg-white/[0.02] backdrop-blur-3xl relative z-20">
                <div className="flex items-center gap-3 sm:gap-5">
                   {/* Back Button on Mobile */}
                   <button
                     onClick={() => setMobileView('list')}
                     className="lg:hidden p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 text-white rounded-xl flex items-center justify-center mr-1 transition-all"
                     title="Volver a la lista de chats"
                   >
                     <ArrowLeft size={16} />
                   </button>
                   <div className="relative">
                      <div className="w-14 h-14 rounded-2xl border border-[#DEFF9A]/20 overflow-hidden shadow-2xl bg-black/40 flex items-center justify-center text-[#DEFF9A]">
                          {selectedChat.type === 'GROUP' ? <Users size={24} /> : <Crown size={24} />}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0a0c10] bg-[#4ADE80] shadow-[0_0_15px_#4ADE80]" />
                   </div>
                    <div>
                       <button 
                         className="group flex items-center gap-3 text-left"
                         onClick={() => setShowDossier(true)}
                       >
                         <h3 className="text-xl font-black text-white uppercase tracking-tighter group-hover:text-[#DEFF9A] transition-colors">
                           {(() => {
                             if (selectedChat.type !== 'DIRECT') return selectedChat.name;
                             const otherEmail = selectedChat.participants.find(p => p.toLowerCase() !== userEmail.toLowerCase());
                             const resolved = otherEmail && selectedChat.participantNames?.[otherEmail];
                             return resolved || selectedChat.name;
                           })()}
                         </h3>
                         <Eye size={16} className="text-white/20 group-hover:text-[#DEFF9A] transition-all" />
                       </button>
                       <div className="flex items-center gap-3 mt-1">
                         {selectedChat.type === 'DIRECT' ? (() => {
                           const otherEmail = selectedChat.participants.find(p => p.toLowerCase() !== userEmail.toLowerCase());
                           const role = otherEmail && selectedChat.participantRoles?.[otherEmail];
                           const roleColors: Record<string, string> = {
                             DIRECTOR: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                             DOCENTE: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                             ALUMNO: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                           };
                           return role ? (
                             <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${roleColors[role] || 'text-blue-400 bg-blue-500/10 border-blue-500/20'}`}>
                               {role}
                             </span>
                           ) : (
                             <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                               DIRECT
                             </span>
                           );
                         })() : (
                          <span className="text-[8px] font-black text-[#DEFF9A] uppercase tracking-widest bg-[#DEFF9A]/10 px-2.5 py-1 rounded-lg border border-[#DEFF9A]/20">
                             CANAL {selectedChat.type}
                          </span>
                         )}
                         <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-[#4ADE80] animate-pulse" />
                            Activo ahora
                         </span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-3">
                   <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all shadow-xl">
                      <MoreVertical size={20} />
                   </button>
                </div>
             </header>

             {/* Chat Body */}
             <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-4 sm:space-y-10 custom-scrollbar relative z-0">
                {selectedChat.messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === 'ME' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                     <div className="flex items-center gap-3 mb-3 px-2">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] leading-none">
                           {msg.senderId === 'ME' ? `Tú (${msg.senderRole})` : `${msg.senderName} (${msg.senderRole})`}
                        </span>
                        {msg.isDirector && (
                          <span className="bg-[#fbbf24]/10 text-[#fbbf24] px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border border-[#fbbf24]/20">
                            [DIRECTOR]
                          </span>
                        )}
                        <span className="text-white/10 text-[8px] tracking-tighter">•</span>
                        <span className="text-[8px] font-black text-white/10 uppercase tracking-widest leading-none">{msg.timestamp}</span>
                     </div>
                     
                     <div className={`max-w-[90%] sm:max-w-[80%] p-3.5 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] text-[12px] sm:text-[13px] font-semibold leading-relaxed relative ${
                        msg.isDirector && msg.senderId !== 'ME'
                        ? 'bg-[#fbbf24]/10 border-2 border-[#fbbf24]/30 text-[#fbbf24] shadow-[0_0_30px_rgba(251,191,36,0.1)]'
                        : msg.senderId === 'ME' 
                        ? 'bg-[#DEFF9A] text-[#061a1a] rounded-tr-none shadow-[0_15px_40px_rgba(222,255,154,0.1)]' 
                        : 'bg-white/[0.03] text-white/90 border border-white/5 rounded-tl-none backdrop-blur-3xl'
                     }`}>
                        {msg.isDirector && <div className="flex items-center gap-2 mb-2 text-[#fbbf24] text-[10px] font-black uppercase tracking-widest border-b border-[#fbbf24]/10 pb-2">
                          <Crown size={12} fill="currentColor" /> MENSAJE INSTITUCIONAL
                        </div>}
                        {msg.content}
                        {msg.senderId === 'ME' && (
                          <div className="absolute bottom-4 right-6 flex items-center gap-0.5">
                             <Check size={12} className="text-[#061a1a]/40" />
                             <Check size={12} className="text-[#061a1a]/40 -ml-1.5" />
                          </div>
                        )}
                     </div>
                  </div>
                ))}
                
                {selectedChat.messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                     <MessageSquare size={48} />
                     <p className="text-xs font-black uppercase tracking-widest">Sin mensajes en este canal</p>
                  </div>
                )}
                <div className="h-4" />
             </div>

             {/* AI Assistant Suggestion */}
             <AnimatePresence>
               {showAIAssistant && aiSuggestion && (
                 <motion.div 
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   exit={{ y: 20, opacity: 0 }}
                   className="mx-10 mb-[-2rem] p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-2xl relative z-20 flex flex-col gap-3"
                 >
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 text-purple-400">
                          <Sparkles size={14} />
                          <span className="text-[9px] font-black uppercase tracking-widest">IA SMART REPLY</span>
                       </div>
                       <button onClick={() => setShowAIAssistant(false)} className="text-white/20 hover:text-white">
                          <X size={14} />
                       </button>
                    </div>
                    <p className="text-white/80 text-[11px] font-medium leading-relaxed italic">{aiSuggestion}</p>
                    <button 
                      onClick={applyAISuggestion}
                      className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all"
                    >
                      Aplicar Sugerencia
                    </button>
                 </motion.div>
               )}
             </AnimatePresence>

             {/* Chat Input */}
             <div className="p-3 pb-5 sm:p-10 sm:pb-12 bg-black/80 backdrop-blur-3xl border-t border-white/10 relative z-20">
                <div className="flex items-center gap-2 sm:gap-4 bg-white/05 border border-white/10 rounded-2xl sm:rounded-[2.5rem] p-2 pl-4 sm:p-3 sm:pl-8 shadow-2xl focus-within:border-[#DEFF9A]/40 transition-all">
                   <button className="text-white/20 hover:text-[#DEFF9A] transition-colors p-2 hidden sm:block">
                      <Paperclip size={20} />
                   </button>
                   <button className="text-white/20 hover:text-[#DEFF9A] transition-colors p-2 mr-2 hidden sm:block">
                      <Mic size={20} />
                   </button>
                   
                   <form 
                    className="flex-1 relative flex items-center"
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                   >
                      <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={currentRole === 'DIRECTOR' ? "Escribe un mensaje de autoridad..." : "Escribe un mensaje oficial..."}
                        className="w-full bg-transparent text-white text-[12px] sm:text-[13px] font-bold outline-none placeholder:text-white/10 pr-2"
                      />
                      {inputText && (
                        <button 
                          type="button"
                          onClick={handleAISuggest}
                          className="absolute right-0 flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all scale-90"
                        >
                          <Sparkles size={12} className="sm:size-[14px]" />
                          <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest">AI Check</span>
                        </button>
                      )}
                   </form>

                   <button 
                    onClick={handleSendMessage}
                    className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-3xl bg-[#DEFF9A] text-[#061a1a] flex items-center justify-center shadow-[0_0_20px_#DEFF9A60] hover:shadow-[0_0_30px_#DEFF9A80] hover:scale-105 transition-all shrink-0"
                   >
                      <Send size={16} className="sm:hidden" fill="currentColor" />
                       <Send size={22} className="hidden sm:block" fill="currentColor" />
                   </button>
                </div>
             </div>
           </>
         ) : (
           <div className="h-full flex flex-col items-center justify-center text-center p-20 space-y-6">
              <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                 <MessageSquare size={48} />
              </div>
              <div>
                 <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Selecciona un Canal</h3>
                 <p className="text-white/20 text-xs font-medium max-w-xs leading-relaxed">
                   Conéctate con tu red de apoyo institucional o gestiona tus grupos académicos en tiempo real.
                 </p>
              </div>
           </div>
         )}
      </div>

      <AnimatePresence>
        {showDossier && selectedChat && (
          <UserHierarchyModal 
            user={chatToUser(selectedChat)} 
            onClose={() => setShowDossier(false)}
            onUpdateRole={() => {}}
            onToggleStatus={() => {}}
          />
        )}
      </AnimatePresence>

      {/* Broadcast Modal (Director Only) */}
      <AnimatePresence>
        {showBroadcastModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-[#061a1a]/95 backdrop-blur-2xl p-8"
            onClick={() => setShowBroadcastModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-xl w-full neo-glass border-white/20 rounded-[3rem] p-10 overflow-hidden relative shadow-[0_0_100px_rgba(222,255,154,0.1)]"
              onClick={e => e.stopPropagation()}
            >
               {/* Header */}
               <div className="flex items-center gap-4 mb-6 shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                     <Volume2 size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Broadcast Global</h3>
                    <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest">
                      {selectedUserIds.length} de {usuariosBroadcast.length} destinatarios seleccionados
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBroadcastModal(false)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                  >
                    <X size={20} />
                  </button>
               </div>

               <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                  {/* Selector de usuarios */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center gap-2">
                      <Search size={14} className="text-white/40" />
                      <input
                        type="text"
                        value={searchUserBroadcast}
                        onChange={(e) => setSearchUserBroadcast(e.target.value)}
                        placeholder="Buscar usuario..."
                        className="flex-1 bg-transparent text-white text-xs outline-none placeholder:text-white/20"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          const visible = usuariosBroadcast.filter((u) =>
                            !searchUserBroadcast ||
                            u.nombre.toLowerCase().includes(searchUserBroadcast.toLowerCase()) ||
                            u.email.toLowerCase().includes(searchUserBroadcast.toLowerCase())
                          );
                          const allSelected = visible.every((u) => selectedUserIds.includes(u.id));
                          if (allSelected) {
                            setSelectedUserIds(selectedUserIds.filter((id) => !visible.some((u) => u.id === id)));
                          } else {
                            const newIds = new Set([...selectedUserIds, ...visible.map((u) => u.id)]);
                            setSelectedUserIds(Array.from(newIds));
                          }
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-[#DEFF9A] hover:text-[#DEFF9A]/70 transition-all"
                      >
                        {usuariosBroadcast.length > 0 && usuariosBroadcast.every((u) => selectedUserIds.includes(u.id)) ? 'Deseleccionar todos' : 'Seleccionar todos'}
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {usuariosBroadcast
                        .filter((u) =>
                          !searchUserBroadcast ||
                          u.nombre.toLowerCase().includes(searchUserBroadcast.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchUserBroadcast.toLowerCase())
                        )
                        .map((u) => {
                          const checked = selectedUserIds.includes(u.id);
                          return (
                            <label
                              key={u.id}
                              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${checked ? 'bg-[#DEFF9A]/10 border border-[#DEFF9A]/30' : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.05]'}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  if (checked) {
                                    setSelectedUserIds(selectedUserIds.filter((id) => id !== u.id));
                                  } else {
                                    setSelectedUserIds([...selectedUserIds, u.id]);
                                  }
                                }}
                                className="w-4 h-4 accent-[#DEFF9A] cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-bold truncate">{u.nombre || u.email}</p>
                                <p className="text-white/40 text-[9px] truncate">{u.email}</p>
                              </div>
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${u.rol === 'DIRECTOR' ? 'bg-orange-500/20 text-orange-400' : u.rol === 'DOCENTE' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/50'}`}>
                                {u.rol}
                              </span>
                            </label>
                          );
                        })}
                      {usuariosBroadcast.length === 0 && (
                        <p className="text-white/40 text-xs text-center py-4">Cargando usuarios...</p>
                      )}
                    </div>
                  </div>

                  {/* Textarea del mensaje */}
                  <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20">
                    <textarea
                      value={broadcastText}
                      onChange={(e) => setBroadcastText(e.target.value)}
                      placeholder="Redacta el anuncio..."
                      className="w-full bg-transparent text-white text-sm font-bold h-24 outline-none resize-none placeholder:text-white/10"
                    />
                  </div>

                  {/* Mensajes de estado */}
                  {broadcastError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                      <Info size={14} />
                      <p className="text-[10px] font-black uppercase tracking-widest">{broadcastError}</p>
                    </div>
                  )}

                  {broadcastResult && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                      <Check size={14} />
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        Enviado a {broadcastResult.recipients} usuarios • Push: {broadcastResult.pushSent} ok, {broadcastResult.pushFailed} fail
                      </p>
                    </div>
                  )}
               </div>

               {/* Footer con botones */}
               <div className="flex gap-4 mt-6 shrink-0">
                  <button
                    onClick={() => setShowBroadcastModal(false)}
                    disabled={sendingBroadcast}
                    className="flex-1 py-4 rounded-2xl border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleBroadcast}
                    disabled={sendingBroadcast || selectedUserIds.length === 0 || !broadcastText.trim()}
                    className="flex-[2] py-4 rounded-2xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sendingBroadcast ? 'Enviando...' : `Enviar a ${selectedUserIds.length} usuario${selectedUserIds.length !== 1 ? 's' : ''}`}
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
