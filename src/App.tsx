/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserSettings } from './components/UserSettings';
import { DocenteMainboard } from './components/DocenteMainboard';
import { AlumnoMainboard } from './components/AlumnoMainboard';
import { DirectivoMainboard } from './components/DirectivoMainboard';
import { AuthPortal } from './components/AuthPortal';
import { UserRole } from './components/MasterSwitcher';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { useAppContext } from './context/AppContext';
import { useAnalytics } from './hooks/useAnalytics';
import { consultarIdentidadEnLake } from './services/identityService';
import { ShieldAlert, Zap, AlertTriangle } from 'lucide-react';

export default function App() {
  const { maintenanceMode, currentRole, setCurrentRole, setIsDemoMode, userEmail } = useAppContext();

  // Analytics: registrar sesiones y eventos de uso
  useAnalytics(userEmail);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check local storage for last session
    const lastSession = localStorage.getItem('tecnolingo_session');

    if (lastSession) {
      const savedEmail = localStorage.getItem('teclingo_user_email');
      if (savedEmail) {
        // Sesión real: verifica contra el Lake que la identidad SIGA existiendo.
        // Así, una sesión fantasma (pruebas previas, cuentas borradas) obliga a
        // pasar por AuthPortal/registro en lugar de caer directo al dashboard.
        consultarIdentidadEnLake(savedEmail).then((estado) => {
          if (estado === 'existe') {
            setIsAuthenticated(true);
          } else if (estado === 'no_existe') {
            localStorage.removeItem('tecnolingo_session');
            setIsAuthenticated(false);
          } else {
            // Lake inalcanzable: no bloquear al usuario, conserva la sesión local
            setIsAuthenticated(true);
          }
        });
      } else {
        // Modo demo: no hay identidad real guardada, se conserva la sesión
        setIsAuthenticated(true);
      }
    }

    // Define global logout function
    (window as any).tecnolingoLogout = () => {
      localStorage.removeItem('tecnolingo_session');
      setIsAuthenticated(false);
    };
  }, []);

  const handleLogin = (role: UserRole, isDemo: boolean = false) => {
    localStorage.setItem('tecnolingo_session', role);
    setCurrentRole(role);
    setIsDemoMode(isDemo);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <AuthPortal onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#DEFF9A] selection:text-black overflow-hidden relative">
      <AnimatePresence>
        {maintenanceMode && currentRole === 'ALUMNO' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-[#061a1a]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center"
          >
             <div className="w-24 h-24 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-8 animate-pulse shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <AlertTriangle size={48} />
             </div>
             <h1 className="text-4xl font-black uppercase tracking-tighter italic mb-4">
                SISTEMA EN <span className="text-red-500">MANTENIMIENTO</span>
             </h1>
             <p className="max-w-md text-white/40 text-sm font-medium leading-relaxed">
                El Director ha iniciado una actualización crítica de infraestructura. El acceso para alumnos está temporalmente restringido para garantizar la integridad de tus datos de ADN.
             </p>
             <div className="mt-12 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#DEFF9A]/40">
                <Zap size={14} fill="currentColor" />
                <span>Protocolo Tecnolingo AI Hub v2.4</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {currentRole === 'DOCENTE' ? (
          <motion.div 
            key="docente"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DocenteMainboard currentRole={currentRole} onRoleChange={setCurrentRole} />
          </motion.div>
        ) : currentRole === 'ALUMNO' ? (
          <motion.div 
            key="alumno"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AlumnoMainboard currentRole={currentRole} onRoleChange={setCurrentRole} />
          </motion.div>
        ) : (
          <motion.div 
            key="director"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DirectivoMainboard currentRole={currentRole} onRoleChange={setCurrentRole} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


