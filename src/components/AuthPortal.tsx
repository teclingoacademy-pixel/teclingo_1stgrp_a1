/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mail,
  Lock,
  ArrowRight,
  Terminal,
  Sparkles,
  Zap,
  Globe,
  LogIn,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { verificarEmail, registrarUsuario, loginEmail, loginGoogle, finalizarRegistroGoogle, logActividadGlobal, sendWelcomeEmail } from '../services/identityService';

type UserRole = 'DIRECTOR' | 'DOCENTE' | 'ALUMNO';

interface AuthPortalProps {
  onLogin: (role: UserRole, isDemo?: boolean) => void;
}

interface GoogleCredentialResponse {
  credential?: string;
}

export function AuthPortal({ onLogin }: AuthPortalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [institutionCode, setInstitutionCode] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);
  const [pendingGoogleEmail, setPendingGoogleEmail] = useState('');
  const [pendingGoogleName, setPendingGoogleName] = useState('');
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const onLoginRef = useRef(onLogin);
  const googleInitializedRef = useRef(false);
  onLoginRef.current = onLogin;

  const roleFromProfile = (perfil?: Record<string, unknown>): UserRole => {
    const raw = (perfil?.rol as string) || (perfil?.role as string) || 'ALUMNO';
    const upper = raw.toUpperCase();
    if (upper === 'DIRECTOR' || upper === 'DOCENTE' || upper === 'ALUMNO') return upper;
    if (upper === 'ADMIN') return 'DIRECTOR';
    if (upper === 'TEACHER') return 'DOCENTE';
    if (upper === 'STUDENT') return 'ALUMNO';
    return 'ALUMNO';
  };

  const handleCredentialResponse = useCallback(async (response: GoogleCredentialResponse) => {
    if (!response.credential) return;
    setIsAuthenticating(true);
    setError('');
    setStatusMessage('Validando identidad con Google...');
    try {
      const resultado = await loginGoogle(response.credential, selectedRole ?? undefined, institutionCode);
      if (resultado.ok && resultado.perfil) {
        if (resultado.code === 'registro_google') {
          const emailGoogle = (resultado.perfil.email as string) || '';
          setPendingGoogleToken(response.credential);
          setPendingGoogleEmail(emailGoogle);
          setPendingGoogleName((resultado.perfil.nombre as string) || '');
          setEmail(emailGoogle);
          setSelectedRole(null);
          setMode('register');
          setError('');
          setStatusMessage('');
          setIsAuthenticating(false);
          return;
        }
        const role = roleFromProfile(resultado.perfil);
        localStorage.setItem('teclingo_user_email', resultado.perfil.email as string || '');
        localStorage.setItem('teclingo_user_name', resultado.perfil.nombre as string || '');
        logActividadGlobal(resultado.perfil.email as string, 'auth', 'login_google', 'Google SSO exitoso');
        onLoginRef.current(role);
      } else {
        setError('No se pudo validar tu identidad. Verifica que tu cuenta Google esté registrada en el sistema.');
        setIsAuthenticating(false);
      }
    } catch {
      setError('Error de conexión con el servicio de identidad.');
      setIsAuthenticating(false);
    }
  }, [selectedRole, institutionCode]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId || !googleButtonRef.current) return;
    if (googleInitializedRef.current) return;
    const w = window as typeof window & { google?: { accounts?: { id?: { initialize: (config: Record<string, unknown>) => void; renderButton: (el: HTMLElement, config: Record<string, unknown>) => void; disableAutoSelect: () => void } } } };

    const tryInit = () => {
      if (googleInitializedRef.current || !googleButtonRef.current) return;
      if (!w.google?.accounts?.id) return;
      googleInitializedRef.current = true;
      googleButtonRef.current!.innerHTML = '';
      w.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: GoogleCredentialResponse) => {
          handleCredentialResponse(response);
        },
      });
      w.google.accounts.id.renderButton(googleButtonRef.current!, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'left',
        width: 280,
      });
    };

    tryInit();

    if (!googleInitializedRef.current) {
      let interval: ReturnType<typeof setInterval>;
      const scriptEl = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (scriptEl) {
        scriptEl.addEventListener('load', tryInit);
      }
      interval = setInterval(() => {
        if (googleInitializedRef.current) { clearInterval(interval); return; }
        tryInit();
      }, 500);
      return () => {
        clearInterval(interval);
        if (scriptEl) scriptEl.removeEventListener('load', tryInit);
        if (googleButtonRef.current) googleButtonRef.current.innerHTML = '';
      };
    }

    return () => {
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    setIsAuthenticating(true);

    try {
      const emailLimpio = email.toLowerCase().trim();

      if (mode === 'register') {
        if (!selectedRole) {
          setError('⚠️ Selecciona tu tipo de perfil (Alumno, Docente o Director) para continuar.');
          setIsAuthenticating(false);
          return;
        }

        // Si es ALUMNO o DOCENTE, requerir código institucional
        if (selectedRole !== 'DIRECTOR' && !institutionCode.trim()) {
          setError('⚠️ El Código Institucional es obligatorio. Solicítalo al director de tu institución.');
          setIsAuthenticating(false);
          return;
        }

        if (pendingGoogleToken) {
          setStatusMessage('Completando tu registro con Google...');
          const resultado = await finalizarRegistroGoogle(emailLimpio, selectedRole, institutionCode);
          if (resultado.ok && resultado.perfil) {
            const role = roleFromProfile(resultado.perfil);
            const nombreFinal = pendingGoogleName || (resultado.perfil.nombre as string) || emailLimpio.split('@')[0];
            localStorage.setItem('teclingo_user_email', emailLimpio);
            localStorage.setItem('teclingo_user_name', nombreFinal);

            // Si es DIRECTOR y se generó institution_code, guardarlo
            const generatedCode = resultado.perfil.institution_code as string | undefined;
            if (generatedCode) {
              localStorage.setItem('teclingo_institution_code', generatedCode);
              console.log('[AuthPortal] Código Institucional generado:', generatedCode);
            }

            logActividadGlobal(emailLimpio, 'auth', 'registro_google', `Registro Google completado — rol ${role}`);
            sendWelcomeEmail(emailLimpio, nombreFinal, 'google');
            setPendingGoogleToken(null);
            setPendingGoogleEmail('');
            setPendingGoogleName('');
            setSelectedRole(null);
            onLogin(role);
          } else {
            setError(resultado.error || 'No se pudo completar el registro. Intenta de nuevo.');
            setIsAuthenticating(false);
          }
          return;
        }

        const existe = await verificarEmail(emailLimpio);
        if (existe) {
          setError('Este correo ya está registrado. Inicia sesión en su lugar.');
          setIsAuthenticating(false);
          return;
        }
        setStatusMessage('Creando tu cuenta...');
        const resultado = await registrarUsuario(emailLimpio, password, emailLimpio.split('@')[0], selectedRole, institutionCode);
        if (resultado.ok && resultado.perfil) {
          const role = roleFromProfile(resultado.perfil);
          localStorage.setItem('teclingo_user_email', emailLimpio);
          localStorage.setItem('teclingo_user_name', emailLimpio.split('@')[0]);

          // Si es DIRECTOR y se generó institution_code, guardarlo y mostrarlo
          const generatedCode = resultado.perfil.institution_code as string | undefined;
          if (generatedCode) {
            localStorage.setItem('teclingo_institution_code', generatedCode);
            console.log('[AuthPortal] Código Institucional generado:', generatedCode);
          }

          logActividadGlobal(emailLimpio, 'auth', 'registro_email', 'Registro por email exitoso');
          sendWelcomeEmail(emailLimpio, emailLimpio.split('@')[0], 'email');
          onLogin(role);
        } else {
          setError(resultado.error || 'No se pudo crear la cuenta. Intenta de nuevo.');
          setIsAuthenticating(false);
        }
      } else {
        const existe = await verificarEmail(emailLimpio);
        if (!existe) {
          setError('Este correo no está registrado. Crea una cuenta primero.');
          setIsAuthenticating(false);
          return;
        }
        setStatusMessage('Iniciando sesión...');
        const resultado = await loginEmail(emailLimpio, password);
        if (resultado.ok && resultado.perfil) {
          const role = roleFromProfile(resultado.perfil);
          localStorage.setItem('teclingo_user_email', emailLimpio);
          localStorage.setItem('teclingo_user_name', (resultado.perfil.nombre as string) || emailLimpio.split('@')[0]);
          logActividadGlobal(emailLimpio, 'auth', 'login_email', 'Login por email exitoso');
          onLogin(role);
        } else {
          setError('Credenciales incorrectas. Verifica tu contraseña.');
          setIsAuthenticating(false);
        }
      }
    } catch {
      setError('Error de conexión con el servicio de identidad.');
      setIsAuthenticating(false);
    }
  };

  const handleDemoMode = () => {
    setIsAuthenticating(true);
    setError('');
    setStatusMessage('Cargando modo demo...');
    setTimeout(() => {
      setIsAuthenticating(false);
      onLogin('ALUMNO', true);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#061a1a] flex flex-col overflow-hidden"
    >
      {/* Background 3D Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[linear-gradient(rgba(222,255,154,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(222,255,154,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#DEFF9A]/05 blur-[120px] rounded-full" />
      </div>

      {/* Header compacto — visible en todas las pantallas, no scrollea */}
      <header className="relative z-10 shrink-0 flex items-center justify-center gap-3 pt-3 pb-2 px-4">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-2xl bg-[#DEFF9A]/10 border border-[#DEFF9A]/20 flex items-center justify-center text-[#DEFF9A]">
          <Globe size={18} className="sm:hidden" />
          <Globe size={24} className="hidden sm:block" />
        </div>
        <div className="text-left">
          <h1 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tighter text-white uppercase italic leading-none">
            TECLINGO<span className="text-[#DEFF9A]"> PRO 1.1</span>
          </h1>
          <p className="text-[#DEFF9A] text-[7px] sm:text-[9px] font-black uppercase tracking-[0.25em] sm:tracking-[0.4em] mt-0.5">Identity & Access Terminal</p>
        </div>
      </header>

      {/* Brand slogan — solo en pantallas >= md, integrado al header */}
      <div className="hidden md:block relative z-10 shrink-0 text-center px-4 pt-1">
        <h2 className="text-white text-lg font-black uppercase tracking-tight leading-tight">
          EL INICIO DE TU <span className="text-white/30">MISIÓN LINGÜÍSTICA.</span>
        </h2>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/5">
            <Zap size={12} className="text-[#DEFF9A]" />
            <span className="text-white text-[9px] font-black uppercase tracking-widest">Velocidad Neuronal</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/5">
            <Sparkles size={12} className="text-cyan-400" />
            <span className="text-white text-[9px] font-black uppercase tracking-widest">Inmersión Spatial</span>
          </div>
        </div>
      </div>

      {/* Contenido principal — ocupa el espacio restante, sin scroll */}
      <main className="relative z-10 flex-1 min-h-0 flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md max-h-full overflow-y-auto neo-glass border-[#DEFF9A]/20 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.5)]"
        >
          {/* Mode Switcher */}
          <div className="flex bg-white/5 p-1 rounded-xl mb-3 sm:mb-4 relative overflow-hidden">
            <motion.div
              initial={false}
              animate={{ x: mode === 'login' ? 0 : '100.5%' }}
              className="absolute inset-y-1 left-1 w-[48%] bg-[#DEFF9A] rounded-lg shadow-[0_0_20px_rgba(222,255,154,0.4)]"
            />
            <button
              onClick={() => {
                setMode('login');
                setPendingGoogleToken(null);
                setPendingGoogleEmail('');
                setPendingGoogleName('');
              }}
              className={`relative z-10 flex-1 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-colors ${mode === 'login' ? 'text-[#061a1a]' : 'text-white/40'}`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <LogIn size={11} /> LOGIN
              </div>
            </button>
            <button
              onClick={() => setMode('register')}
              className={`relative z-10 flex-1 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-colors ${mode === 'register' ? 'text-[#061a1a]' : 'text-white/40'}`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <UserPlus size={11} /> REGISTRO
              </div>
            </button>
          </div>

          {/* Status/Error Messages */}
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 mb-3">
              <AlertCircle size={13} className="text-red-400 shrink-0" />
              <p className="text-red-300 text-[10px] font-medium leading-tight">{error}</p>
            </div>
          )}
          {statusMessage && !error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#DEFF9A]/10 border border-[#DEFF9A]/20 mb-3">
              <Terminal size={13} className="text-[#DEFF9A] animate-spin shrink-0" />
              <p className="text-[#DEFF9A] text-[10px] font-medium">{statusMessage}</p>
            </div>
          )}

          {/* Aviso obligatorio: primera vez con Google */}
          {pendingGoogleToken && !error && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-3">
              <AlertCircle size={12} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 text-[9px] font-black uppercase tracking-widest">¡Es tu primera vez en TECLINGO!</p>
                <p className="text-amber-200/80 text-[9px] font-medium mt-0.5 leading-snug">
                  Selecciona tu <span className="font-black text-amber-300">tipo de perfil</span> para completar tu cuenta.
                </p>
              </div>
            </div>
          )}

          {/* Google SSO Button */}
          {!pendingGoogleToken && (
            <div ref={googleButtonRef} className="w-full mb-2.5 flex justify-center scale-90 sm:scale-100 origin-center" />
          )}

          <div className="flex items-center gap-2 mb-2.5">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-white/20 text-[8px] font-black uppercase tracking-widest">Ó acceso manual</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Manual Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-white/40 text-[8px] font-black uppercase tracking-widest ml-3">
                  Tipo de perfil <span className="text-amber-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['ALUMNO', 'DOCENTE', 'DIRECTOR'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={`py-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                        selectedRole === r
                          ? 'bg-[#DEFF9A]/20 border-[#DEFF9A]/50 text-[#DEFF9A]'
                          : 'bg-white/5 border-white/10 text-white/30 hover:border-white/20'
                      }`}
                    >
                      {r === 'ALUMNO' ? 'Alumno' : r === 'DOCENTE' ? 'Docente' : 'Director'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'register' && selectedRole && selectedRole !== 'DIRECTOR' && (
              <div className="space-y-1">
                <label className="text-white/40 text-[8px] font-black uppercase tracking-widest ml-3">
                  Código Institucional <span className="text-red-400/80">*</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-[#DEFF9A]/40" size={14} />
                  <input
                    type="text"
                    required
                    value={institutionCode}
                    onChange={(e) => setInstitutionCode(e.target.value.toUpperCase())}
                    placeholder="Ej: TECLINGO-PANUCO-2026"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-white text-[11px] font-medium focus:outline-none focus:border-[#DEFF9A]/50 focus:ring-1 focus:ring-[#DEFF9A]/20 transition-all placeholder:text-white/10 uppercase font-mono"
                  />
                </div>
                <p className="text-amber-300/80 text-[8px] ml-3 font-bold leading-tight">
                  ⚠️ Solicita este código al director de tu institución. Es obligatorio para vincularte a ella.
                </p>
              </div>
            )}

            {mode === 'register' && selectedRole === 'DIRECTOR' && (
              <div className="space-y-1">
                <div className="p-3 bg-[#DEFF9A]/5 border border-[#DEFF9A]/20 rounded-xl">
                  <p className="text-[#DEFF9A] text-[9px] font-black uppercase tracking-widest leading-tight">
                    💡 Eres Director
                  </p>
                  <p className="text-white/60 text-[8px] mt-1 leading-tight">
                    Al registrarte, el sistema generará automáticamente tu Código Institucional único.
                    Compártelo con tus alumnos y docentes para que puedan vincularse.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-white/40 text-[8px] font-black uppercase tracking-widest ml-3">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#DEFF9A]/40" size={14} />
                <input
                  type="email"
                  required
                  readOnly={mode === 'register' && Boolean(pendingGoogleToken)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rod.mx@tecnolingo.ai"
                  className={`w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-white text-[11px] font-medium focus:outline-none focus:border-[#DEFF9A]/50 focus:ring-1 focus:ring-[#DEFF9A]/20 transition-all placeholder:text-white/10 ${mode === 'register' && pendingGoogleToken ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>

            {pendingGoogleToken ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#4285F4]/10 border border-[#4285F4]/30">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-white text-[9px] font-black uppercase tracking-widest">Cuenta verificada con Google</p>
                  <p className="text-white/60 text-[9px] font-medium mt-0.5 break-all">{pendingGoogleEmail}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-white/40 text-[8px] font-black uppercase tracking-widest ml-3">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#DEFF9A]/40" size={14} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-white text-[11px] font-medium focus:outline-none focus:border-[#DEFF9A]/50 focus:ring-1 focus:ring-[#DEFF9A]/20 transition-all placeholder:text-white/10"
                  />
                </div>
              </div>
            )}

            <button
              disabled={isAuthenticating}
              className="w-full py-3 rounded-xl bg-[#DEFF9A] text-[#061a1a] text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(222,255,154,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group mt-1"
            >
              {isAuthenticating ? (
                <Terminal size={14} className="animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'INICIAR SESIÓN' : pendingGoogleToken ? 'COMPLETAR REGISTRO' : 'CREAR CUENTA'}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Demo Toggle */}
          <div className="mt-3 text-center">
            <button onClick={handleDemoMode} className="group">
              <p className="text-white/20 text-[8px] font-black uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">
                ¿Eres visitante? <span className="text-[#DEFF9A] group-hover:text-cyan-400 underline underline-offset-2">EXPLORAR EN MODO DEMO</span>
              </p>
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer Legal — siempre visible, no desplaza nada */}
      <footer className="relative z-10 shrink-0 flex items-center justify-center gap-3 pb-2 pt-1 text-[7px] font-black text-white/10 uppercase tracking-[0.3em] pointer-events-none">
        <span>Alpha 0.8.2</span>
        <div className="w-1 h-1 rounded-full bg-white/20" />
        <span>© 2026 TECLINGO</span>
      </footer>
    </motion.div>
  );
}
