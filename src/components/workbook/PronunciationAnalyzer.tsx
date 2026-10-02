/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * PronunciationAnalyzer.tsx
 * Analizador de acento (basado en The Bridge) reutilizable para cualquier frase.
 */

import { useState, useEffect, useRef } from 'react';
import { Mic, Square, Volume2, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiUrl } from '../../services/apiConfig';
import { registerAudioElement, unregisterAudioElement } from '../../utils/workbook/audioSupervisor';

interface Props {
  targetPhrase: string;
  onScore?: (score: number, transcript: string) => void;
  gender?: 'female' | 'male';
}

export function PronunciationAnalyzer({ targetPhrase, onScore, gender = 'female' }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [missedWords, setMissedWords] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event: any) => {
          const resultTranscript = Array.from(event.results)
            .map((res: any) => res[0].transcript)
            .join(' ');
          setTranscript(resultTranscript);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('[PronunciationAnalyzer] SpeechRecognition no disponible:', e);
      }
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch {}
        unregisterAudioElement(audioRef.current);
      }
    };
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
      console.error('[PronunciationAnalyzer] TTS Error:', e);
      setIsPlaying(false);
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setTranscript('');
    setScore(null);
    setMissedWords([]);
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) { console.warn(e); }
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    if (recognitionRef.current) recognitionRef.current.stop();

    setTimeout(() => {
      setIsProcessing(false);
      const normalize = (s: string) => s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¡¿"']/g, '').trim();
      const target = normalize(targetPhrase);
      const result = normalize(transcript);

      if (!result) {
        setScore(0);
        setMissedWords(target.split(' ').filter(w => w.length > 0));
        if (onScore) onScore(0, transcript);
        return;
      }

      const targetWords = target.split(' ').filter(w => w.length > 0);
      const resultWords = result.split(' ').filter(w => w.length > 0);
      let matches = 0;
      const missed: string[] = [];

      targetWords.forEach(tWord => {
        if (resultWords.includes(tWord)) {
          matches++;
        } else {
          missed.push(tWord);
        }
      });

      const finalScore = Math.round((matches / targetWords.length) * 100);
      setScore(finalScore);
      setMissedWords(missed);
      if (onScore) onScore(finalScore, transcript);
    }, 500);
  };

  const handleRetry = () => {
    setTranscript('');
    setScore(null);
    setMissedWords([]);
  };

  const scoreColor = score === null ? 'text-white/40' :
    score >= 90 ? 'text-green-400' :
    score >= 75 ? 'text-[#DEFF9A]' :
    score >= 50 ? 'text-yellow-400' : 'text-red-400';

  const scoreBg = score === null ? 'bg-white/5' :
    score >= 90 ? 'bg-green-500/10 border-green-500/30' :
    score >= 75 ? 'bg-[#DEFF9A]/10 border-[#DEFF9A]/30' :
    score >= 50 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={handlePlayModel}
          disabled={isPlaying}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 border border-[#22D3EE]/30 disabled:opacity-50 text-[#22D3EE] text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
        >
          <Volume2 size={14} />
          {isPlaying ? 'Reproduciendo...' : 'Escuchar modelo'}
        </button>

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
        <div className="flex items-center justify-center gap-2 text-red-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          Grabando... di la frase en voz alta
        </div>
      )}

      {isProcessing && (
        <div className="text-center text-white/50 text-xs">Analizando...</div>
      )}

      {score !== null && (
        <div className={'p-4 rounded-xl border space-y-2 ' + scoreBg}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {score >= 75 ? (
                <CheckCircle2 size={18} className="text-green-400" />
              ) : (
                <AlertCircle size={18} className="text-yellow-400" />
              )}
              <span className="text-xs font-black uppercase tracking-widest text-white/70">
                Tu score
              </span>
            </div>
            <span className={'text-2xl font-black ' + scoreColor}>{score}%</span>
          </div>

          {transcript && (
            <p className="text-xs text-white/60 italic">
              Dijiste: "{transcript}"
            </p>
          )}

          {missedWords.length > 0 && (
            <p className="text-xs text-yellow-400/80">
              Palabras a mejorar: <strong>{missedWords.join(', ')}</strong>
            </p>
          )}

          {score >= 90 && (
            <p className="text-xs text-green-400">
              Excelente pronunciacion! Muy cerca del nativo.
            </p>
          )}
          {score >= 75 && score < 90 && (
            <p className="text-xs text-[#DEFF9A]">
              Muy bien. Revisa las palabras marcadas para acercarte al 100%.
            </p>
          )}
          {score < 75 && (
            <p className="text-xs text-yellow-400">
              Sigue practicando. Escucha el modelo y vuelve a intentarlo.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default PronunciationAnalyzer;
