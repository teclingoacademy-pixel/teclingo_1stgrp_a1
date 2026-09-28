/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * QRScannerModule.tsx — Lector QR real + panel de alumnos del grupo
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Zap, RefreshCw, CheckCircle2, AlertTriangle,
  Camera, Activity, UserCheck, Clock, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import { GlassCard } from './GlassCard';
import { useAppContext } from '../context/AppContext';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:3000';

type ScanStatus = 'scanning' | 'success' | 'duplicate' | 'error';

interface LastRecord {
  name: string;
  email: string;
  avatar?: string | null;
  time: string;
  status: 'SUCCESS' | 'DUPLICATE' | 'ERROR';
  mensaje: string;
}

interface GroupMember {
  user_id: string;
  email: string;
  nombre: string | null;
  avatar?: string | null;
  numero_control?: string | null;
}

interface QRScannerModuleProps {
  grupoId?: string;
  onScanSuccess?: (data: string) => void;
  onClose: () => void;
}

export function QRScannerModule({ grupoId, onScanSuccess, onClose }: QRScannerModuleProps) {
  const { userEmail } = useAppContext();
  const [scanStatus, setScanStatus] = useState<ScanStatus>('scanning');
  const [lastRecord, setLastRecord] = useState<LastRecord | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [counter, setCounter] = useState({ success: 0, duplicate: 0, error: 0 });
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ value: string; ts: number } | null>(null);
  const processingRef = useRef(false);
  const containerId = 'qr-reader-container';

  // ── Cargar alumnos reales del grupo
  useEffect(() => {
    if (!grupoId) return;
    let cancelled = false;
    (async () => {
      setLoadingMembers(true);
      try {
        const r = await fetch(`${API_BASE}/api/english-groups/${grupoId}/members`);
        const data = await r.json();
        if (cancelled) return;
        if (data?.ok && Array.isArray(data.miembros)) {
          setMembers(data.miembros.map((m: any) => ({
            user_id: m.user_id,
            email: m.email,
            nombre: m.nombre,
            avatar: m.avatar,
            numero_control: m.numero_control,
          })));
        }
      } catch (err) {
        console.warn('[QRScanner] loadMembers error:', err);
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    })();
    return () => { cancelled = true; };
  }, [grupoId]);

  // ── Audio feedback
  const playBeep = (type: 'success' | 'duplicate' | 'error') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      if (type === 'success') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else if (type === 'duplicate') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(660, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch { /* ignore */ }
  };

  // ── Procesar QR
  const processQr = useCallback(async (qrValue: string) => {
    if (processingRef.current) return;
    if (!grupoId || !userEmail) {
      setScanStatus('error');
      playBeep('error');
      setLastRecord({
        name: 'Sin grupo activo', email: '',
        time: new Date().toLocaleTimeString(), status: 'ERROR',
        mensaje: 'No se seleccionó un grupo para el pase de lista',
      });
      return;
    }
    processingRef.current = true;

    const now = Date.now();
    const last = lastScannedRef.current;
    if (last && last.value === qrValue && now - last.ts < 4000) {
      processingRef.current = false;
      return;
    }
    lastScannedRef.current = { value: qrValue, ts: now };

    try {
      const r = await fetch(`${API_BASE}/api/attendance/qr-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherEmail: userEmail, grupo_id: grupoId, qrValue }),
      });
      const data = await r.json();

      if (data?.status === 'SUCCESS') {
        setScanStatus('success');
        playBeep('success');
        setCounter(c => ({ ...c, success: c.success + 1 }));
        setLastRecord({
          name: data.alumno?.name || data.alumno?.email || 'Alumno',
          email: data.alumno?.email || '',
          avatar: data.alumno?.avatar,
          time: data.alumno?.hora || new Date().toLocaleTimeString(),
          status: 'SUCCESS',
          mensaje: data.mensaje || 'Presente',
        });
        onScanSuccess?.(qrValue);
      } else if (data?.status === 'DUPLICATE') {
        setScanStatus('duplicate');
        playBeep('duplicate');
        setCounter(c => ({ ...c, duplicate: c.duplicate + 1 }));
        setLastRecord({
          name: data.alumno?.name || data.alumno?.email || 'Alumno',
          email: data.alumno?.email || '',
          avatar: data.alumno?.avatar,
          time: data.alumno?.hora || new Date().toLocaleTimeString(),
          status: 'DUPLICATE',
          mensaje: data.mensaje || 'Ya registrado hoy',
        });
      } else {
        setScanStatus('error');
        playBeep('error');
        setCounter(c => ({ ...c, error: c.error + 1 }));
        setLastRecord({
          name: data?.alumno?.name || 'QR no reconocido',
          email: data?.alumno?.email || '',
          avatar: data?.alumno?.avatar,
          time: new Date().toLocaleTimeString(),
          status: 'ERROR',
          mensaje: data?.mensaje || 'QR inválido o alumno no inscrito',
        });
      }
    } catch (err) {
      console.warn('[QRScanner] fetch error:', err);
      setScanStatus('error');
      playBeep('error');
      setCounter(c => ({ ...c, error: c.error + 1 }));
      setLastRecord({
        name: 'Error de conexión', email: '',
        time: new Date().toLocaleTimeString(), status: 'ERROR',
        mensaje: 'No se pudo conectar al servidor',
      });
    } finally {
      setTimeout(() => {
        setScanStatus('scanning');
        processingRef.current = false;
      }, 2200);
    }
  }, [grupoId, userEmail, onScanSuccess]);

  // Ref para que el scanner NO se recree cuando processQr cambia de identidad
  const processQrRef = useRef(processQr);
  useEffect(() => { processQrRef.current = processQr; }, [processQr]);

  // ── Simular escaneo desde el panel (sin cámara)
  const simulateScan = (m: GroupMember) => {
    if (processingRef.current) return;
    processQr(`TECLINGO:${m.user_id}`);
  };

  // ── Init/cleanup del scanner con Html5Qrcode
  useEffect(() => {
    let isMounted = true;
    let localScanner: Html5Qrcode | null = null;

    const initAndStart = async () => {
      // Detener previo
      if (scannerRef.current) {
        try { if (scannerRef.current.isScanning) await scannerRef.current.stop(); } catch { /* ignore */ }
        scannerRef.current = null;
      }
      if (!isMounted) return;

      const html5QrCode = new Html5Qrcode(containerId);
      localScanner = html5QrCode;
      scannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          { facingMode: cameraFacing },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => { if (isMounted) processQrRef.current(decodedText); },
          () => { /* ignore per-frame errors */ }
        );
        if (!isMounted) {
          try { if (html5QrCode.isScanning) await html5QrCode.stop(); } catch { /* ignore */ }
        }
      } catch (err: any) {
        console.error('Scanner start error', err);
        if (isMounted) {
          const msg = String(err?.message || err);
          if (msg.includes('NotAllowed') || msg.includes('Permission')) {
            setCameraError('Permiso de cámara denegado. Usa el panel de alumnos o habilita la cámara.');
          } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
            setCameraError('No se encontró ninguna cámara en este dispositivo.');
          } else {
            setCameraError('No se pudo iniciar la cámara. Usa el panel de alumnos.');
          }
        }
      }
    };

    initAndStart();

    return () => {
      isMounted = false;
      const s = localScanner || scannerRef.current;
      if (s) {
        try { if (s.isScanning) s.stop().catch(() => {}); } catch { /* ignore */ }
        scannerRef.current = null;
      }
    };
  }, [cameraFacing]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCamera = () => setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');

  const toggleFlash = async () => {
    if (!scannerRef.current) return;
    try {
      const caps = scannerRef.current.getRunningTrackCapabilities();
      if (caps && (caps as any).torch) {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: !isFlashOn }] as any
        } as MediaTrackConstraints);
        setIsFlashOn(!isFlashOn);
      }
    } catch { /* ignore */ }
  };

  // ── Estilos dinámicos
  const focusBoxBorderClass = scanStatus === 'success'
    ? 'border-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-105'
    : scanStatus === 'duplicate'
      ? 'border-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105'
      : scanStatus === 'error'
        ? 'border-[#F43F5E] shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-105'
        : 'border-gray-600 animate-pulse';

  const bracketBorderClass = scanStatus === 'success'
    ? 'border-[#10B981]'
    : scanStatus === 'duplicate'
      ? 'border-[#F59E0B]'
      : scanStatus === 'error'
        ? 'border-[#F43F5E]'
        : 'border-gray-600';

  const overlayClass = scanStatus === 'success'
    ? 'bg-[#10B981]/15'
    : scanStatus === 'duplicate'
      ? 'bg-[#F59E0B]/15'
      : scanStatus === 'error'
        ? 'bg-[#F43F5E]/15'
        : 'bg-black/5';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#061a1a]/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #DEFF9A 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      {/* Header */}
      <div className="absolute top-12 left-12 right-12 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#DEFF9A] flex items-center justify-center text-[#061a1a] shadow-[0_0_20px_#DEFF9A]">
            <Camera size={24} />
          </div>
          <div>
            <h2 className="text-white text-xl font-black uppercase tracking-tighter">QR SCAN MODE</h2>
            <p className="text-[#DEFF9A] text-[10px] font-black uppercase tracking-[0.3em]">
              {grupoId ? `Escaneando · ${members.length} alumnos en el grupo` : '⚠️ Sin grupo seleccionado'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-14 h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all"
        >
          <X size={24} />
        </button>
      </div>

      <div className="relative w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-8 md:gap-12 z-20">

        {/* LEFT HUD: ESTADO + LISTA REAL DE ALUMNOS */}
        <div className="hidden lg:flex flex-col gap-4 w-72 h-[480px]">
          <GlassCard title="SYSTEM STATUS" icon={Activity} accent="cyan" className="!p-4 shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-white/20 text-[7px] font-black uppercase mb-0.5">Lente</p>
                <p className={`text-[9px] font-black uppercase truncate ${
                  scanStatus === 'scanning' ? 'text-[#DEFF9A]' :
                  scanStatus === 'success' ? 'text-emerald-400' :
                  scanStatus === 'duplicate' ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {scanStatus === 'scanning' ? 'BUSCANDO QR...' :
                   scanStatus === 'success' ? '¡REGISTRADO!' :
                   scanStatus === 'duplicate' ? 'YA REGISTRADO' : '¡FALLO!'}
                </p>
              </div>
              <div>
                <p className="text-white/20 text-[7px] font-black uppercase mb-0.5">Conexión</p>
                <p className="text-white text-[9px] font-black uppercase">ONLINE</p>
              </div>
            </div>
            {cameraError && (
              <p className="text-amber-300 text-[7px] font-bold uppercase tracking-widest mt-2 leading-relaxed">
                ⚠️ {cameraError}
              </p>
            )}
          </GlassCard>

          <div className="flex-1 flex flex-col p-4 rounded-[1.8rem] bg-white/[0.03] border border-white/5 overflow-hidden">
            <div className="shrink-0 mb-2">
              <h4 className="text-[#DEFF9A] text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <UserCheck size={10} /> Alumnos del grupo
              </h4>
              <p className="text-white/30 text-[7px] font-bold uppercase mt-1">
                Click para simular escaneo (sin cámara)
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loadingMembers ? (
                <div className="flex flex-col items-center py-8">
                  <Loader2 size={20} className="text-[#DEFF9A] animate-spin mb-2" />
                  <p className="text-white/30 text-[8px] font-black uppercase tracking-widest">Cargando...</p>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-white/30 text-[8px] font-black uppercase tracking-widest">
                    Sin alumnos inscritos en este grupo
                  </p>
                </div>
              ) : members.map(m => (
                <button
                  key={m.user_id}
                  onClick={() => simulateScan(m)}
                  disabled={scanStatus !== 'scanning'}
                  className="w-full p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#DEFF9A]/30 hover:bg-white/5 active:bg-white/10 text-left flex items-center gap-3 transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {m.avatar ? (
                    <img src={m.avatar} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/10" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 text-[10px] font-black shrink-0">
                      {(m.nombre || m.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-[9px] font-black uppercase truncate group-hover:text-[#DEFF9A] transition-colors">
                      {m.nombre || m.email}
                    </p>
                    <p className="text-[#DEFF9A]/60 text-[7px] font-mono tracking-widest uppercase truncate mt-0.5">
                      {m.numero_control || m.user_id.slice(0, 12)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <GlassCard title="CONTADORES" icon={UserCheck} accent="green" className="!p-3 shrink-0">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[#4ADE80] text-lg font-black">{counter.success}</p>
                <p className="text-white/30 text-[7px] font-black uppercase tracking-widest">OK</p>
              </div>
              <div>
                <p className="text-amber-400 text-lg font-black">{counter.duplicate}</p>
                <p className="text-white/30 text-[7px] font-black uppercase tracking-widest">DUP</p>
              </div>
              <div>
                <p className="text-rose-400 text-lg font-black">{counter.error}</p>
                <p className="text-white/30 text-[7px] font-black uppercase tracking-widest">ERR</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* VIEWPORT */}
        <div className="relative">
          <div className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] md:w-[440px] md:h-[440px] rounded-[3.5rem] border-4 border-white/10 overflow-hidden bg-black shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <div id={containerId} className={`w-full h-full object-cover grayscale-[0.3] brightness-[0.8] ${cameraFacing === 'user' ? '[&_video]:scale-x-[-1]' : ''}`} />
            <div className={`absolute inset-0 pointer-events-none transition-all duration-300 mix-blend-overlay ${overlayClass}`} />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-black/40" />

            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6 text-center">
                <div>
                  <Camera size={48} className="text-amber-400 mx-auto mb-3" />
                  <p className="text-white text-xs font-black uppercase tracking-widest leading-relaxed">
                    {cameraError}
                  </p>
                  <p className="text-white/40 text-[10px] mt-2 font-bold uppercase tracking-widest">
                    Usa el panel de la izquierda
                  </p>
                </div>
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`relative w-[220px] h-[220px] md:w-64 md:h-64 border-2 border-dashed transition-all duration-500 ${focusBoxBorderClass}`}>
                <span className={`absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 transition-colors duration-300 ${bracketBorderClass}`} />
                <span className={`absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 transition-colors duration-300 ${bracketBorderClass}`} />
                <span className={`absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 transition-colors duration-300 ${bracketBorderClass}`} />
                <span className={`absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 transition-colors duration-300 ${bracketBorderClass}`} />
                {scanStatus === 'scanning' && !cameraError && (
                  <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-x-0 h-1 bg-[#DEFF9A] shadow-[0_0_20px_#DEFF9A] opacity-50 z-20"
                  />
                )}
              </div>
            </div>

            <AnimatePresence>
              {scanStatus !== 'scanning' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none"
                >
                  <div className={`px-5 py-4 rounded-[2rem] backdrop-blur-md flex flex-col items-center gap-2.5 shadow-[0_15px_30px_rgba(0,0,0,0.5)] border font-mono ${
                    scanStatus === 'success' ? 'bg-[#10B981]/95 text-[#061a1a] border-emerald-400' :
                    scanStatus === 'duplicate' ? 'bg-[#F59E0B]/95 text-[#061a1a] border-amber-400' :
                    'bg-[#F43F5E]/95 text-white border-rose-400'
                  }`}>
                    <span className="text-3xl animate-bounce">
                      {scanStatus === 'success' ? '✔️' : scanStatus === 'duplicate' ? '⚠️' : '❌'}
                    </span>
                    <span className="text-[11px] font-black tracking-widest uppercase text-center leading-none">
                      {scanStatus === 'success' ? 'REGISTRADO' : scanStatus === 'duplicate' ? 'YA REGISTRADO' : 'ERROR'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {scanStatus !== 'scanning' && lastRecord && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                className={`absolute -top-16 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl border flex items-center gap-3 backdrop-blur-2xl whitespace-nowrap z-50 ${
                  scanStatus === 'success' ? 'bg-[#4ADE80] text-[#061a1a] border-[#4ADE80] shadow-[0_0_40px_rgba(74,222,128,0.4)]' :
                  scanStatus === 'duplicate' ? 'bg-amber-400 text-[#061a1a] border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.4)]' :
                  'bg-rose-500 text-white border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.4)]'
                }`}
              >
                {scanStatus === 'success' ? <CheckCircle2 size={18} /> :
                 scanStatus === 'duplicate' ? <Clock size={18} /> : <AlertTriangle size={18} />}
                <span className="text-xs font-black uppercase tracking-tight">{lastRecord.name}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-6">
            <button
              onClick={toggleFlash}
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                isFlashOn ? 'bg-[#DEFF9A] text-[#061a1a] border-[#DEFF9A] shadow-[0_0_20px_#DEFF9A]' : 'bg-white/5 text-white/30 border-white/10'
              }`}
            >
              <Zap size={20} fill={isFlashOn ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={toggleCamera}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* RIGHT HUD */}
        <div className="hidden lg:flex flex-col gap-6 w-64 h-[480px]">
          <GlassCard title="ÚLTIMO REGISTRO" icon={UserCheck} accent="green" className="!p-6 h-full flex flex-col justify-between">
            {lastRecord ? (
              <motion.div
                key={lastRecord.time + lastRecord.status}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-4">
                  {lastRecord.avatar ? (
                    <img src={lastRecord.avatar} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt="" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 text-sm font-black">
                      {(lastRecord.name || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white text-[10px] font-black uppercase truncate">{lastRecord.name}</p>
                    <p className="text-white/30 text-[8px] font-bold mt-0.5 truncate">{lastRecord.email}</p>
                    <p className="text-[#DEFF9A] text-[8px] font-bold mt-1 uppercase tracking-widest">{lastRecord.time}</p>
                  </div>
                </div>
                <div className={`p-3 rounded-xl border text-[8px] font-black uppercase tracking-widest text-center ${
                  lastRecord.status === 'SUCCESS' ? 'bg-[#4ADE80]/10 border-[#4ADE80]/20 text-[#4ADE80]' :
                  lastRecord.status === 'DUPLICATE' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                  'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {lastRecord.mensaje}
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-4 text-white/10">
                  <Activity size={20} />
                </div>
                <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                  Esperando primer reconocimiento...
                </p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Mobile tray */}
      <div className="lg:hidden absolute bottom-8 left-6 right-6 z-30">
        <div className="p-4 rounded-[2rem] bg-black/60 border border-white/10 backdrop-blur-xl text-center">
          <p className="text-white/30 text-[8px] uppercase tracking-widest font-black">
            Apunta la cámara al QR de la credencial del alumno
          </p>
        </div>
      </div>
    </motion.div>
  );
}