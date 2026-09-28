/**
 * ProfileOnboardingModal — Modal que obliga al usuario a completar su perfil
 * antes de usar la app. Muestra un aviso centralizado con los pasos pendientes.
 *
 * Lógica:
 *  - Si el perfil está incompleto → se muestra el modal
 *  - El checkbox "No volver a mostrar" solo suprime para la sesión actual (localStorage temporal)
 *  - Si el usuario cierra el modal sin completar, se volverá a mostrar al recargar
 *  - Solo desaparece cuando el perfil está realmente completo
 */

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, User, ArrowRight, X, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteProfile: () => void;
  role: string;
  profileData: Record<string, unknown>;
}

/**
 * Determina si el perfil está completo según el rol.
 * Campos obligatorios para ALUMNO: name, studentId, moduloTec
 *   (career / shift / semestre se eliminaron en esta versión exclusiva de inglés)
 * Campos obligatorios para DOCENTE: name, curp, degree
 * Campos obligatorios para DIRECTOR: name, institutionName
 */
function isProfileComplete(role: string, data: Record<string, unknown>): boolean {
  if (role === 'ALUMNO') {
    return Boolean(
      data.name && String(data.name).trim() &&
      data.numeroControl && String(data.numeroControl).trim() &&
      data.moduloTec && String(data.moduloTec).trim()
    );
  }
  if (role === 'DOCENTE') {
    return Boolean(
      data.name && String(data.name).trim() &&
      data.curp && String(data.curp).trim() &&
      data.degree && String(data.degree).trim()
    );
  }
  if (role === 'DIRECTOR') {
    return Boolean(
      data.name && String(data.name).trim() &&
      data.institutionName && String(data.institutionName).trim()
    );
  }
  return true;
}

/**
 * Retorna los campos que faltan para el rol indicado.
 */
function getMissingFields(role: string, data: Record<string, unknown>): string[] {
  const missing: string[] = [];
  if (role === 'ALUMNO') {
    if (!data.name || !String(data.name).trim()) missing.push('Nombre completo');
    if (!data.numeroControl || !String(data.numeroControl).trim()) missing.push('Número de control');
    if (!data.moduloTec || !String(data.moduloTec).trim()) missing.push('Módulo TEC');
  } else if (role === 'DOCENTE') {
    if (!data.name || !String(data.name).trim()) missing.push('Nombre completo');
    if (!data.curp || !String(data.curp).trim()) missing.push('CURP');
    if (!data.degree || !String(data.degree).trim()) missing.push('Grado académico');
  } else if (role === 'DIRECTOR') {
    if (!data.name || !String(data.name).trim()) missing.push('Nombre completo');
    if (!data.institutionName || !String(data.institutionName).trim()) missing.push('Nombre institución');
  }
  return missing;
}

const STORAGE_KEY_PREFIX = 'teclingo_onboarding_suppress_';

export function ProfileOnboardingModal({
  isOpen,
  onClose,
  onCompleteProfile,
  role,
  profileData,
}: ProfileOnboardingModalProps) {
  const [suppressSession, setSuppressSession] = useState(false);
  const storageKey = `${STORAGE_KEY_PREFIX}${role}`;

  // Si el perfil ya está completo, no mostrar nada
  const complete = isProfileComplete(role, profileData);
  const missingFields = getMissingFields(role, profileData);

  // Si el perfil está completo, limpiar el flag de supresión
  useEffect(() => {
    if (complete) {
      localStorage.removeItem(storageKey);
    }
  }, [complete, storageKey]);

  // Cargar estado de supresión del localStorage al montar
  useEffect(() => {
    const suppressed = localStorage.getItem(storageKey) === 'true';
    setSuppressSession(suppressed);
  }, [storageKey]);

  const handleSuppressChange = useCallback(() => {
    const newValue = !suppressSession;
    setSuppressSession(newValue);
    if (newValue) {
      localStorage.setItem(storageKey, 'true');
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [suppressSession, storageKey]);

  const handleGoToProfile = useCallback(() => {
    onCompleteProfile();
  }, [onCompleteProfile]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // No mostrar si el perfil está completo, o si se suprimió para esta sesión,
  // o si el modal no está abierto
  const shouldShow = isOpen && !complete && !suppressSession;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={handleClose}
          />

          {/* Modal — mobile: bottom sheet full width, desktop: centered card */}
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full sm:max-w-md max-h-[92vh] bg-[#0a0f1a] border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header gradient */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#38BDF8]/10 to-transparent pointer-events-none" />

            {/* Drag indicator (mobile) */}
            <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              <X size={14} className="text-white/40" />
            </button>

            {/* Scrollable content */}
            <div className="relative px-4 pt-4 pb-3 overflow-y-auto flex-1 min-h-0">
              {/* Icon */}
              <div className="flex justify-center mb-3">
                <div className="w-11 h-11 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-[#F59E0B]" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-white text-base font-black text-center uppercase tracking-tight mb-1">
                Primer Paso Requerido
              </h2>
              <p className="text-white/40 text-[10px] text-center font-bold mb-3">
                Completa tu perfil para desbloquear todas las funciones
              </p>

              {/* Steps info */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-3">
                <div className="flex items-start gap-2.5 mb-3">
                  <div className="w-6 h-6 rounded-md bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[#38BDF8] text-[9px] font-black">1</span>
                  </div>
                  <div>
                    <h3 className="text-white text-xs font-black mb-0.5">Completar Formulario de Perfil</h3>
                    <p className="text-white/30 text-[9px] font-bold leading-snug">
                      Tu ID Card institucional se genera con los datos de este formulario.
                      Los grupos y datos se vinculan aquí.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[#22D3EE] text-[9px] font-black">2</span>
                  </div>
                  <div>
                    <h3 className="text-white text-xs font-black mb-0.5">ADN Digital</h3>
                    <p className="text-white/30 text-[9px] font-bold leading-snug">
                      Personaliza el contenido de tu experiencia de aprendizaje.
                    </p>
                  </div>
                </div>
              </div>

              {/* Missing fields */}
              {missingFields.length > 0 && (
                <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/10 rounded-lg p-2.5 mb-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Info size={10} className="text-[#F59E0B]" />
                    <span className="text-[#F59E0B] text-[9px] font-black uppercase tracking-widest">
                      Campos pendientes ({missingFields.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {missingFields.map(field => (
                      <span
                        key={field}
                        className="text-[8px] font-bold text-[#F59E0B]/60 bg-[#F59E0B]/5 border border-[#F59E0B]/10 px-1.5 py-0.5 rounded"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Checkbox "No volver a mostrar" */}
              <label className="flex items-center gap-2 cursor-pointer mb-3 group">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                    suppressSession
                      ? 'bg-[#38BDF8] border-[#38BDF8]'
                      : 'bg-white/5 border-white/20 group-hover:border-white/40'
                  }`}
                  onClick={handleSuppressChange}
                >
                  {suppressSession && <CheckCircle2 size={9} className="text-white" />}
                </div>
                <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest select-none">
                  No volver a mostrar esta sesión
                </span>
              </label>

              {/* Footer note */}
              <p className="text-white/15 text-[7px] text-center font-bold uppercase tracking-widest">
                Este paso es obligatorio antes de usar la plataforma
              </p>
            </div>

            {/* Sticky action buttons */}
            <div className="px-4 pb-4 pt-2 border-t border-white/5 bg-[#0a0f1a]">
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Ahora no
                </button>
                <button
                  onClick={handleGoToProfile}
                  className="flex-1 py-2.5 bg-[#38BDF8] rounded-xl text-white text-[9px] font-black uppercase tracking-widest shadow-[0_8px_24px_rgba(56,189,248,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5"
                >
                  <User size={12} />
                  Completar Perfil
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { isProfileComplete, getMissingFields };
