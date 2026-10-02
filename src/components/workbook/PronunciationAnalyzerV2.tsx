/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * PronunciationAnalyzerV2.tsx
 * Analizador de acento avanzado con barras de audio, selector de voz y guardado.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Volume2, RotateCcw, CheckCircle2, AlertCircle, User } from 'lucide-react';
import { apiUrl } from '../../services/apiConfig';
import { registerAudioElement, unregisterAudioElement } from '../../utils/workbook/audioSupervisor';

interface Props {
  targetPhrase: string;
  userId?: string;
  source?: string;
  sectionKey?: string | null;
  onScore?: (score: number, transcript: string, missedWords: string[]) => void;
  defaultGender?: 'female' | 'male';
}

export function PronunciationAnalyzerV2({
  targetPhrase,
  userId,
  source = 'presentation',
  sectionKey = null,
  onScore,
  defaultGender = 'female',
}: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [missedWords, setMissedWords] = useState<string[]>([]);
  const [gender, setGender] = useState<'female' | 'male'>(defaultGender);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(30).fill(0));
  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const handleStopRecordingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        recognition.onresult = (event: any) => {
          let full = '';
          for (let i = 0; i < event.results.length; i++) {
            full += event.results[i][0].transcript + ' ';
          }
          setTranscript(full.trim());
        };
        recognition.onerror = (event: any) => {
          console.warn('[AnalyzerV2] onerror:', event.error);
          setIsRecording(false);
        };
        recognition.onend = () => {
          setIsRecording(false);
        };
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('[AnalyzerV2] SpeechRecognition no disponible:', e);
      }
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch {}
        unregisterAudioElement(audioRef.current);
      }
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
      if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} }
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const startAudioVisualization = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevels = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const levels = Array.from(dataArray).slice(0, 30).map(v => v / 255);
        setAudioLevels(levels);
        animationRef.current = requestAnimationFrame(updateLevels);
      };
      updateLevels();
    } catch (e) {
      console.warn('[AnalyzerV2] getUserMedia fallo:', e);
    }
  }, []);

  const stopAudioVisualization = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
    if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = null; }
    setAudioLevels(new Array(30).fill(0));
  }, []);

  const handlePlayModel = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const res = await fetch(apiUrl('/api/tts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: targetPhrase, gender }),
      });
      if (!res.ok) throw new Error('TTS error');
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.playbackRate = 0.9;
      audioRef.current = audio;
      registerAudioElement(audio);
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsPlaying(false);
        unregisterAudioElement(audio);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setIsPlaying(false);
        unregisterAudioElement(audio);
      };
      audio.play();
    } catch (e) {
      console.error('[AnalyzerV2] TTS Error:', e);
      setIsPlaying(false);
    }
  };

  const handleStartRecording = async () => {
    setIsRecording(true);
    setTranscript('');
    setScore(null);
    setMissedWords([]);
    setSavedStatus('idle');
    // Auto-stop despues de 8s si no se ha detenido manualmente
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      console.warn('[AnalyzerV2] Auto-stop por timeout (8s)');
      handleStopRecordingRef.current?.();
    }, 8000);
    await startAudioVisualization();
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) { console.warn(e); }
    }
  };

  const handleStopRecording = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsRecording(false);
    setIsProcessing(true);
    stopAudioVisualization();
    if (recognitionRef.current) recognitionRef.current.stop();

    setTimeout(async () => {
      setIsProcessing(false);
      const normalize = (s: string) => s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¡¿"']/g, '').trim();
      const target = normalize(targetPhrase);
      const result = normalize(transcript);

      let finalScore = 0;
      let missed: string[] = [];

      if (result) {
        const targetWords = target.split(' ').filter(w => w.length > 0);
        const resultWords = result.split(' ').filter(w => w.length > 0);
        let matches = 0;
        targetWords.forEach(tWord => {
          if (resultWords.includes(tWord)) matches++;
          else missed.push(tWord);
        });
        finalScore = Math.round((matches / targetWords.length) * 100);
      } else {
        missed = target.split(' ').filter(w => w.length > 0);
      }

      setScore(finalScore);
      setMissedWords(missed);
      if (onScore) onScore(finalScore, transcript, missed);

      if (userId) {
        setSavedStatus('saving');
        try {
          const res = await fetch(apiUrl('/api/pronunciation/attempt'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId, source, sectionKey, targetPhrase,
              transcript, score: finalScore, missedWords: missed,
            }),
          });
          if (res.ok) setSavedStatus('saved');
          else setSavedStatus('error');
        } catch {
          setSavedStatus('error');
        }
      }
    }, 500);
  };

  // Registrar la funcion para que el timeout la pueda llamar
  handleStopRecordingRef.current = handleStopRecording;

  const handleRetry = () => {
    setTranscript('');
    setScore(null);
    setMissedWords([]);
    setSavedStatus('idle');
  };

  const scoreColor = score === null ? 'text-white/40' :
    score >= 90 ? 'text-green-400' :
    score >= 75 ? 'text-[#DEFF9A]' :
    score >= 50 ? 'text-yellow-400' : 'text-red-400';

  const scoreBg = score === null ? 'bg-white/5' :
    score >= 90 ? 'bg-green-500/10 border-green-500/30' :
    score >= 75 ? 'bg-[#DEFF9A]/10 border-[#DEFF9A]/30' :
    score >= 50 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30';

  const scoreLabel = score === null ? '' :
    score >= 90 ? 'EXCELLENT' :
    score >= 75 ? 'ADVANCED' :
    score >= 50 ? 'BASE' : 'KEEP PRACTICING';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={handlePlayModel}
          disabled={isPlaying}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 border border-[#22D3EE]/30 disabled:opacity-50 text-[#22D3EE] text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
        >
          <Volume2 size={14} />
          {isPlaying ? 'Reproduciendo...' : 'Escuchar modelo'}
        </button>

        <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
          <User size={12} className="text-white/50" />
          <button
            onClick={() => setGender('female')}
            className={'px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ' + (gender === 'female' ? 'bg-[#DEFF9A] text-[#061a1a]' : 'text-white/60 hover:text-white')}
          >
            Emily
          </button>
          <button
            onClick={() => setGender('male')}
            className={'px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ' + (gender === 'male' ? 'bg-[#DEFF9A] text-[#061a1a]' : 'text-white/60 hover:text-white')}
          >
            James
          </button>
        </div>

        {!isRecording && score === null && (
          <button
            onClick={handleStartRecording}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            <Mic size={14} />
            Grabar
          </button>
        )}

        {isRecording && (
          <button
            onClick={handleStopRecording}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer animate-pulse"
          >
            <Square size={14} />
            Detener
          </button>
        )}

        {score !== null && (
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 text-xs font-black uppercase tracking-widest transition-all cursor-pointer border border-white/10"
          >
            <RotateCcw size={14} />
            Reintentar
          </button>
        )}
      </div>

      {isRecording && (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-red-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Grabando... di la frase en voz alta
          </div>
          <div className="flex items-end justify-center gap-1 h-12">
            {audioLevels.map((level, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-gradient-to-t from-red-500 via-yellow-400 to-green-400 transition-all"
                style={{ height: Math.max(4, level * 48) + 'px' }}
              />
            ))}
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="text-center text-white/50 text-xs">Analizando...</div>
      )}

      {score !== null && (
        <div className={'p-4 rounded-xl border space-y-3 ' + scoreBg}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Phonetic Signature Analysis
              </div>
              <div className={'text-lg font-black ' + scoreColor}>
                {scoreLabel}
              </div>
            </div>
            <div className="text-right">
              <div className={'text-4xl font-black ' + scoreColor}>
                {score}<span className="text-xl">%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span className={'text-[10px] font-black uppercase tracking-widest ' + (score >= 50 ? 'text-[#DEFF9A]' : 'text-white/30')}>Base</span>
            <span className={'text-[10px] font-black uppercase tracking-widest ' + (score >= 75 ? 'text-[#DEFF9A]' : 'text-white/30')}>Advanced</span>
            <span className={'text-[10px] font-black uppercase tracking-widest ' + (score >= 90 ? 'text-green-400' : 'text-white/30')}>Fluency</span>
          </div>

          {transcript && (
            <p className="text-xs text-white/60 italic pt-2 border-t border-white/10">
              Dijiste: "{transcript}"
            </p>
          )}

          {missedWords.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-yellow-400/80 mb-1">
                <strong>Palabras a mejorar ({missedWords.length}):</strong>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missedWords.map((w, i) => (
                  <span key={i} className="px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          {score >= 90 && (
            <p className="text-xs text-green-400">Excelente pronunciacion. Muy cerca del nativo.</p>
          )}
          {score >= 75 && score < 90 && (
            <p className="text-xs text-[#DEFF9A]">Muy bien. Revisa las palabras marcadas para llegar al 100%.</p>
          )}
          {score < 75 && (
            <p className="text-xs text-yellow-400">Sigue practicando. Escucha el modelo y vuelve a intentarlo.</p>
          )}

          {savedStatus === 'saved' && (
            <p className="text-[10px] text-green-400/70 pt-2 border-t border-white/10">
              Intento guardado en tu historial
            </p>
          )}
          {savedStatus === 'saving' && (
            <p className="text-[10px] text-white/40 pt-2 border-t border-white/10">Guardando...</p>
          )}
          {savedStatus === 'error' && (
            <p className="text-[10px] text-red-400/70 pt-2 border-t border-white/10">
              No se pudo guardar el intento
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default PronunciationAnalyzerV2;
