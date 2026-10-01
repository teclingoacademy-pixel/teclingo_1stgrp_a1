/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { apiUrl } from '../../services/apiConfig';
import { 
  MessageSquare, 
  ChevronLeft, 
  Send, 
  Sparkles, 
  Book, 
  Languages, 
  HelpCircle,
  Clock,
  User,
  Bot,
  Search,
  ArrowRight,
  ExternalLink,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GRAMMAR_LIBRARY, GrammarTopic } from './grammarLibraryData';
import { buildAIContext, AIContext } from '../../services/workbook/aiKnowledgeBridge';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{ title: string; uri: string }>;
}

export function AITutor({ onClose, lessonId = 'CLASE_01' }: { onClose: () => void; lessonId?: string }) {
  const [activeTab, setActiveTab] = useState<'chat' | 'library'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "¡Hola! Soy tu tutor pedagógico TECLINGO. ¿En qué puedo apoyarte hoy?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [aiContext, setAiContext] = useState<AIContext | null>(null);
  const [contextType, setContextType] = useState<'general' | 'lesson'>('general');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(lessonId || 'CLASE_01');
  const [grammarTopics, setGrammarTopics] = useState<Array<{ id: string; title: string; mcer: string }>>([]);

  // Library tab states
  const [selectedTopic, setSelectedTopic] = useState<GrammarTopic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'All' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('All');

  // Build AI context from student progress on mount
  useEffect(() => {
    const loadContext = async () => {
      try {
        const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (userRaw) {
          const user = JSON.parse(userRaw);
          const email = user.email || user.user_id || '';
          if (email) {
            const context = await buildAIContext(email);
            setAiContext(context);
          }
        }
      } catch (e) {
        console.warn('[AITutor] No se pudo cargar contexto del alumno:', e);
      }
    };
    loadContext();
  }, []);

  // Cargar temas de la Biblioteca MCER para el selector de contexto
  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl('/api/ai/grammar-topics'))
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (cancelled) return;
        if (json?.success && Array.isArray(json.data)) {
          setGrammarTopics(json.data);
        }
      })
      .catch((e) => console.warn('[AITutor] No se pudieron cargar grammar topics:', e));
    return () => { cancelled = true; };
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isLoading, activeTab]);

  const handleSend = async (customMessage?: string) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim() || isLoading) return;
    
    // If we're coming from library details panel, close it when sending message
    setSelectedTopic(null);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customMessage) setInput('');
    setIsLoading(true);
    
    // Switch to chat tab automatically if we sent from library
    if (activeTab !== 'chat') {
      setActiveTab('chat');
    }

    try {
      // Prepare history for Gemini
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        parts: [{ text: msg.content }]
      }));

      const response = await fetch(apiUrl('/api/ai/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          lessonId: contextType === 'lesson' ? selectedLessonId : undefined,
          contextType: contextType,
          level: 'A1',
          mode: 'tutor',
          history: history.map(h => ({ role: h.role, content: h.parts?.[0]?.text || '' }))
        })
      });

      const data = await response.json();
      const aiContent = data?.data?.content || data?.content || data?.error;
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent || "Lo siento, tuve un problema al procesar tu solicitud.",
        timestamp: new Date(),
        sources: data?.sources
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Fetch Error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Error de conexión con el tutor IA. Por favor intenta de nuevo.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to ask tutor about a specific database topic
  const handleAskAboutTopic = (topic: GrammarTopic) => {
    const mathPhrase = `Me gustaría aprender sobre el tema académico: ${topic.title} (${topic.titleEn} - Nivel ${topic.mcer})`;
    setActiveTab('chat');
    handleSend(mathPhrase);
  };

  // Filter grammar topics
  const filteredTopics = GRAMMAR_LIBRARY.filter(topic => {
    const matchesLevel = selectedLevel === 'All' || topic.mcer === selectedLevel;
    const matchesQuery = searchQuery.trim() === '' || 
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesLevel && matchesQuery;
  });

  // Level color map for CEFR levels
  const getLevelColor = (level: string) => {
    switch(level) {
      case 'A1': return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
      case 'A2': return 'bg-cyan-500/10 border-cyan-500/25 text-cyan-400';
      case 'B1': return 'bg-amber-500/10 border-amber-500/25 text-amber-400';
      case 'B2': return 'bg-purple-500/10 border-purple-500/25 text-purple-400';
      default: return 'bg-[#DEFF9A]/10 border-[#DEFF9A]/25 text-[#DEFF9A]';
    }
  };

  // Helper list of CEFR Levels for filtering UI
  const mcerLevels: Array<'All' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'> = [
    'All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'
  ];

  // custom markdown-like simple renderer
  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let matchesBullet = line.match(/^[\*\-•]\s(.*)/);
      let isHeader = line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ');
      let isBold = line.includes('**');
      
      let contentNode: React.ReactNode = line;

      if (isBold) {
        const parts = line.split('**');
        contentNode = parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-[#DEFF9A]">{part}</strong> : part);
      }

      if (matchesBullet) {
        return (
          <div key={idx} className="flex gap-2 pl-2 my-1 items-start text-sm text-white/90">
            <span className="text-[#DEFF9A] mt-1.5 font-bold shrink-0">•</span>
            <p className="flex-1 leading-relaxed">{matchesBullet[1] ? contentNode : line}</p>
          </div>
        );
      }
      
      if (isHeader) {
        return (
          <h4 key={idx} className="text-[#DEFF9A] text-xs font-black uppercase tracking-wider mt-4 mb-2 first:mt-0">
            {line.replace(/^[#\s]+/, '')}
          </h4>
        );
      }

      if (line.trim().startsWith('`') && line.trim().endsWith('`')) {
        return (
          <pre key={idx} className="bg-black/35 border border-white/5 rounded-xl p-3 my-2 font-mono text-xs text-[#DEFF9A] overflow-x-auto">
            {line.trim().replace(/`/g, '')}
          </pre>
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-sm font-medium leading-relaxed my-1 text-white/85">
          {contentNode}
        </p>
      );
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-[#061a1a] flex flex-col font-sans"
    >
      {/* Header */}
      <header className="p-6 md:p-8 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer"
            title="Regresar al Aula Virtual"
          >
             <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-4">
            {/* Holographic Avatar with Breathing glow */}
            <div className="relative w-12 h-12">
              <motion.div 
                animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-x-0 -inset-y-1 bg-[#DEFF9A] rounded-full blur-[8px]"
              />
              <div className="relative w-full h-full rounded-full border border-[#DEFF9A]/20 flex items-center justify-center bg-[#061a1a] text-[#DEFF9A]">
                 <Bot size={22} className="animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white text-md font-black uppercase tracking-tight">TUTOR TECLINGO</h1>
                <span className="px-2 py-0.5 rounded text-[7px] font-black uppercase bg-[#DEFF9A]/10 border border-[#DEFF9A]/30 text-[#DEFF9A]">OFICIAL</span>
              </div>
              <p className="text-[#DEFF9A] text-[8px] font-black uppercase tracking-[0.3em]">Apoyo Académico 24/7 Activo</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Static Badge */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/5">
             <button 
               onClick={() => { setActiveTab('chat'); setSelectedTopic(null); }}
               className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 ${
                 activeTab === 'chat' 
                   ? 'bg-[#DEFF9A] text-[#061a1a] font-bold shadow-lg shadow-[#DEFF9A]/10' 
                   : 'text-white/50 hover:text-white hover:bg-white/5'
               }`}
             >
               <MessageSquare size={13} />
               Chat Tutor
             </button>
             <button 
               onClick={() => { setActiveTab('library'); setSelectedTopic(null); }}
               className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 ${
                 activeTab === 'library' 
                   ? 'bg-[#DEFF9A] text-[#061a1a] font-bold shadow-lg shadow-[#DEFF9A]/10' 
                   : 'text-white/50 hover:text-white hover:bg-white/5'
               }`}
             >
               <Book size={13} />
               Biblioteca MCER
             </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/5">
             <span className="text-[8px] font-black uppercase tracking-widest text-white/40 shrink-0">Contexto</span>
             <select
               value={contextType === 'general' ? '__general__' : selectedLessonId}
               onChange={(e) => {
                 const v = e.target.value;
                 if (v === '__general__') {
                   setContextType('general');
                 } else {
                   setContextType('lesson');
                   setSelectedLessonId(v);
                 }
               }}
               className="bg-transparent text-white text-[10px] font-black uppercase tracking-wider cursor-pointer outline-none border-none"
             >
               <option value="__general__" className="bg-[#061a1a] text-white">📚 General (Biblioteca MCER)</option>
               <option value="CLASE_00" className="bg-[#061a1a] text-white">📘 Clase 00 — Fase Cero</option>
               <option value="CLASE_01" className="bg-[#061a1a] text-white">📘 Clase 01 — Verbo To Be</option>
               <option value="CLASE_02" className="bg-[#061a1a] text-white">📘 Clase 02 — Auxiliares</option>
               <option value="CLASE_03" className="bg-[#061a1a] text-white">📘 Clase 03 — Apóstrofe</option>
               <option value="CLASE_04" className="bg-[#061a1a] text-white">📘 Clase 04 — Apóstrofe F2</option>
               <option value="CLASE_05" className="bg-[#061a1a] text-white">📘 Clase 05 — Posesivos</option>
               <option value="CLASE_35" className="bg-[#061a1a] text-white">📘 Clase 35 — Apóstrofe Posesivo</option>
             </select>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' ? (
            /* CHAT VIEW */
            <motion.div 
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">
                <div className="max-w-4xl mx-auto space-y-8">
                  {messages.map((msg) => (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-4 md:gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                        msg.role === 'user' 
                          ? 'bg-[#DEFF9A] text-[#061a1a] border-[#DEFF9A]/30' 
                          : 'bg-white/5 text-white/40 border-white/10'
                      }`}>
                        {msg.role === 'user' ? <User size={20} /> : <Sparkles size={18} className="text-[#DEFF9A]" />}
                      </div>

                      <div className={`space-y-2 max-w-[85%] md:max-w-[75%]`}>
                        <div className={`p-5 md:p-6 rounded-3xl ${
                          msg.role === 'user' 
                            ? 'bg-[#DEFF9A]/5 border border-[#DEFF9A]/20 text-white' 
                            : 'bg-white/[0.03] border border-white/5 text-white/95'
                        }`}>
                          {/* Parse markdown-like tags */}
                          <div className="space-y-1.5">
                            {formatMessageText(msg.content)}
                          </div>

                          {/* Render search grounding sources */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-5 pt-4 border-t border-white/5">
                              <p className="text-[8px] font-black uppercase text-[#DEFF9A] tracking-wider flex items-center gap-1.5 mb-2.5">
                                <Languages size={11} className="text-[#DEFF9A]" /> Fuentes y Enlaces Certificados:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {msg.sources.map((src, idx) => (
                                  <a
                                    key={idx}
                                    href={src.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/30 border border-white/5 hover:border-[#DEFF9A]/45 hover:bg-black/50 text-white/70 hover:text-white text-[10px] transition-all"
                                  >
                                    <Book size={10} className="text-white/40" />
                                    <span className="truncate max-w-[200px] font-medium">{src.title}</span>
                                    <ExternalLink size={9} className="text-white/30 shrink-0" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <p className={`text-[8px] font-black text-white/20 uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : ''}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-4 md:gap-6"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-white/5 text-[#DEFF9A] border border-white/10 flex items-center justify-center animate-pulse">
                        <Bot size={20} />
                      </div>
                      <div className="p-5 p-r-8 rounded-3xl bg-white/[0.03] border border-white/5 flex gap-1.5 items-center">
                        <span className="text-[10px] uppercase font-black tracking-widest text-[#DEFF9A]/50 mr-2">Consultando fuentes oficiales</span>
                        <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-[#DEFF9A]" />
                        <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#DEFF9A]" />
                        <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[#DEFF9A]" />
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Chat Input Area */}
              <footer className="p-6 md:p-8 border-t border-white/5 bg-black/10">
                <div className="max-w-4xl mx-auto">
                  {/* Quick Academic Actions */}
                  <div className="flex flex-wrap gap-2 mb-4">
                     <button 
                      onClick={() => handleSend("Explícame la regla de la tercera persona singular en presente simple")}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer"
                     >
                       ¿Qué es la tercera persona singular?
                     </button>
                     <button 
                      onClick={() => handleSend("Explícame la regla de la tercera persona plural y dame ejemplos")}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer"
                     >
                       ¿Cómo funciona la tercera persona plural?
                     </button>
                     <button 
                      onClick={() => handleSend("Dame ejemplos prácticos del Past Perfect en el MCER")}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer"
                     >
                       Ejemplos Past Perfect
                     </button>
                  </div>

                  <div className="relative flex items-center">
                     <input 
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                       placeholder="Escribe tu consulta académica sobre reglas gramaticales, dudas o vocabulario..."
                       disabled={isLoading}
                       className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 pl-7 pr-20 text-white placeholder:text-white/20 focus:outline-none focus:border-[#DEFF9A]/40 transition-all text-sm font-medium disabled:opacity-50"
                     />
                     <button 
                       onClick={() => handleSend()}
                       disabled={isLoading || !input.trim()}
                       className="absolute right-3.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#DEFF9A] text-[#061a1a] flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:scale-100 cursor-pointer"
                       title="Enviar pregunta"
                     >
                        <Send size={16} />
                     </button>
                  </div>
                </div>
              </footer>
            </motion.div>
          ) : (
            /* LIBRARY VIEW (BIBLIOTECA DE GRAMÁTICA MCER) */
            <motion.div 
              key="library"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col md:flex-row h-full overflow-hidden"
            >
              {/* Library left/main pane: Directory */}
              <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 md:p-8 border-r border-white/5 custom-scrollbar bg-black/10">
                <div className="max-w-4xl w-full mx-auto space-y-6 pb-20">
                  {/* Library Banner Header */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 relative overflow-hidden">
                    <div className="absolute top-1/2 right-10 -translate-y-1/2 w-32 h-32 bg-[#DEFF9A]/5 rounded-full blur-2xl pointer-events-none" />
                    <h2 className="text-white text-md font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Book size={18} className="text-[#DEFF9A]" />
                      Biblioteca Pedagógica de Gramática
                    </h2>
                    <p className="text-white/40 text-[11px] leading-relaxed max-w-2xl">
                      Explora la estructura técnica del inglés según los niveles del **Marco Común Europeo de Referencia (MCER)**. Consulta explicaciones detalladas y ejemplos para cada nivel. Puedes conversar sobre cualquiera de estos módulos pulsando el botón de tutoría.
                    </p>
                  </div>

                  {/* Filter controls */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-white/5 pb-6">
                    {/* Search query input */}
                    <div className="relative w-full sm:max-w-xs">
                      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar tema por regla, nivel o palabra clave..."
                        className="w-full bg-white/5 border border-white/5 text-xs text-white placeholder:text-white/25 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#DEFF9A]/40 transition-color"
                      />
                    </div>

                    {/* MCER filter bubble list */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Filter size={12} className="text-white/30 mr-1.5" />
                      {mcerLevels.map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setSelectedLevel(lvl)}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                            selectedLevel === lvl 
                              ? 'bg-[#DEFF9A] border-[#DEFF9A] text-[#061a1a] font-bold' 
                              : 'bg-white/5 border-white/5 text-white/40 hover:text-white hover:border-white/10'
                          } cursor-pointer`}
                        >
                          {lvl === 'All' ? 'Todos' : lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Results Grid / List */}
                  {filteredTopics.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredTopics.map((topic) => (
                        <motion.div
                          key={topic.id}
                          layoutId={topic.id}
                          onClick={() => setSelectedTopic(topic)}
                          className={`p-5 rounded-2xl border bg-white/[0.02] cursor-pointer transition-all hover:bg-white/[0.04] flex flex-col justify-between group ${
                            selectedTopic?.id === topic.id 
                              ? 'border-[#DEFF9A]/60 shadow-[0_0_20px_-10px_#DEFF9A]' 
                              : 'border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div>
                            {/* Topic Level and Category */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black border uppercase ${getLevelColor(topic.mcer)}`}>
                                Nivel {topic.mcer}
                              </span>
                              <span className="text-white/20 text-[8px] font-black uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                                {topic.category}
                              </span>
                            </div>

                            <h3 className="text-white text-sm font-black uppercase mb-1.5 tracking-tight group-hover:text-[#DEFF9A] transition-colors">{topic.title}</h3>
                            <p className="text-white/40 text-[9px] font-bold tracking-widest uppercase mb-3 text-white/50">{topic.titleEn}</p>
                            <p className="text-white/60 text-xs leading-relaxed line-clamp-2">{topic.summary}</p>
                          </div>

                          <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider text-[#DEFF9A]/40 group-hover:text-[#DEFF9A] transition-all flex items-center gap-1.5">
                              Estudiar tema <ArrowRight size={10} />
                            </span>
                            <span className="text-[8px] text-white/20 uppercase font-black tracking-widest">
                              {topic.examples.length} Ejemplos
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 space-y-4">
                      <HelpCircle size={32} className="mx-auto text-white/10 animate-pulse" />
                      <p className="text-white/50 font-black text-xs uppercase tracking-widest">No se encontraron temas para tu búsqueda</p>
                      <button 
                        onClick={() => { setSelectedLevel('All'); setSearchQuery(''); }}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-[9px] uppercase font-black border border-white/5 hover:border-white/10 cursor-pointer"
                      >
                        Restablecer filtros
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Library right side dynamic details sheet panel */}
              <AnimatePresence>
                {selectedTopic ? (
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="w-full md:w-[420px] lg:w-[480px] border-t md:border-t-0 md:border-l border-white/5 bg-[#061a1a]/85 backdrop-blur-xl flex flex-col h-full overflow-hidden"
                  >
                    {/* Topic Details Pane Header */}
                    <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black border ${getLevelColor(selectedTopic.mcer)}`}>
                          MCER {selectedTopic.mcer}
                        </span>
                        <h3 className="text-white text-xs font-black uppercase tracking-widest">Ficha Académica</h3>
                      </div>
                      <button 
                        onClick={() => setSelectedTopic(null)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all cursor-pointer"
                        title="Cerrar Ficha"
                      >
                        × Close
                      </button>
                    </div>

                    {/* Topic Details Pane Scroll Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
                      <div>
                        <h2 className="text-white text-md font-black uppercase tracking-tight leading-snug">{selectedTopic.title}</h2>
                        <p className="text-[#DEFF9A] text-[9px] font-black uppercase tracking-wider mt-1">{selectedTopic.titleEn}</p>
                      </div>

                      {/* Formula / Structure Display Box */}
                      <div className="p-4 rounded-2xl bg-black/45 border border-white/5">
                        <h4 className="text-[8px] font-black uppercase tracking-wider text-white/30 mb-1">Fórmula de Estructura</h4>
                        <code className="text-[#DEFF9A] font-mono text-xs leading-normal font-bold">
                          {selectedTopic.structure}
                        </code>
                      </div>

                      {/* Rich Grammar Explanation parsed */}
                      <div className="space-y-4 text-white/80 text-sm border-t border-b border-white/5 py-6">
                        {formatMessageText(selectedTopic.explanation)}
                      </div>

                      {/* List of Practical Contextualized Examples */}
                      <div className="space-y-4">
                        <h4 className="text-[9.5px] font-black uppercase tracking-wider text-[#DEFF9A] flex items-center gap-1.5">
                          <CheckCircle2 size={13} />
                          Ejemplos Oficiales de Práctica
                        </h4>
                        
                        <div className="space-y-3">
                          {selectedTopic.examples.map((ex, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                              <p className="text-white font-bold text-xs select-all text-[#DEFF9A]">{ex.en}</p>
                              <p className="text-white/50 text-[11px] font-medium">{ex.es}</p>
                              {ex.note && (
                                <p className="text-white/30 text-[9px] font-black uppercase tracking-wider pt-1.5">
                                  ⚠️ {ex.note}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Interconnection Action Button to Chat with Tutor on this custom subject */}
                    <div className="p-6 border-t border-white/5 bg-black/30">
                      <button
                        onClick={() => handleAskAboutTopic(selectedTopic)}
                        className="w-full py-4 px-6 rounded-2xl bg-[#DEFF9A] hover:bg-[#c9f566] text-[#061a1a] font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-xl shadow-[#DEFF9A]/5 cursor-pointer"
                      >
                        <Sparkles size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
                        Iniciar Tutoría Sobre {selectedTopic.mcer}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Placeholder when no topic is selected in Library Detail Panel on wide screens */
                  <div className="hidden lg:flex w-[420px] border-l border-white/5 flex-col items-center justify-center p-8 text-center space-y-4">
                    <Book size={40} className="text-white/5 animate-bounce" style={{ animationDuration: '4s' }} />
                    <div>
                      <h4 className="text-white text-xs font-black uppercase tracking-widest mb-1">Ningún tema seleccionado</h4>
                      <p className="text-white/35 text-[10px] max-w-xs leading-relaxed">
                        Selecciona cualquier módulo de gramática a la izquierda para visualizar su ficha técnica académica, fórmulas gramaticales y ejemplos prácticos alineados con el MCER.
                      </p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
