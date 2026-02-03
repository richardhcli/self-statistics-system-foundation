
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, Headphones } from 'lucide-react';
import { VoiceRecorderProps } from '../types';
import { processVoiceToTextStreaming } from '@/lib/google-ai/utils/voice-to-text-streaming';

/**
 * VoiceRecorder component provides real-time audio recording with live transcription.
 *
 * Features:
 * - Frequency visualization canvas during recording
 * - Space bar keyboard shortcut for start/stop
 * - Incremental transcription display every 3 seconds
 * - Callback on recording completion with full base64 audio
 *
 * State:
 * - `isRecording`: Whether user is currently recording
 * - `liveTranscription`: Accumulated transcription text during recording
 * - `isTranscribing`: Whether currently processing audio chunk for transcription
 *
 * Refs:
 * - `mediaRecorderRef`: MediaRecorder instance for audio capture
 * - `chunksRef`: Accumulated audio Blob chunks during recording
 * - `transcriptionTimeoutRef`: Periodic interval for streaming transcription
 *
 * @component
 * @example
 * <VoiceRecorder
 *   onProcessed={(audioBase64) => handleAudioProcessed(audioBase64)}
 *   onLiveTranscription={(text) => console.log(text)}
 *   isProcessing={isProcessing}
 * />
 */
const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onProcessed, onLiveTranscription, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const transcriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptionChunksRef = useRef<Blob[]>([]);

  /**
   * Processes accumulated audio chunks and sends for live transcription.
   * Called every 3 seconds during recording via interval.
   *
   * @async
   * @returns {Promise<void>}
   */
  const processTranscriptionChunk = async () => {
    if (transcriptionChunksRef.current.length === 0 || isTranscribing) return;

    setIsTranscribing(true);
    try {
      const audioBlob = new Blob(transcriptionChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;
          const audioBase64 = base64data.split(',')[1];

          const response = await processVoiceToTextStreaming(audioBase64);
          if (response.content) {
            setLiveTranscription(response.content);
            onLiveTranscription?.(response.content);
          }
        } catch (error) {
          console.error('Transcription error:', error);
        } finally {
          setIsTranscribing(false);
        }
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Transcription chunk processing error:', error);
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      /**
       * Animates frequency visualization on canvas during recording.
       * Draws bars based on frequency data from audio analyser.
       */
      const draw = () => {
        if (!analyserRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          ctx.fillStyle = `rgba(79, 70, 229, ${dataArray[i] / 255 + 0.2})`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
        
        animationFrameRef.current = requestAnimationFrame(draw);
      };
      draw();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      transcriptionChunksRef.current = [];

      /**
       * Captures audio data and maintains separate buffers for:
       * 1. Final complete audio (chunksRef) - sent on recording stop
       * 2. Incremental chunks (transcriptionChunksRef) - sent every 3s for live transcription
       */
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          transcriptionChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onProcessed(base64data.split(',')[1]);
        };
        stream.getTracks().forEach(track => track.stop());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        if (transcriptionTimeoutRef.current) clearInterval(transcriptionTimeoutRef.current);
        setLiveTranscription('');
        setIsTranscribing(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setLiveTranscription('');

      // Start periodic transcription every 3 seconds
      transcriptionTimeoutRef.current = setInterval(processTranscriptionChunk, 3000);
    } catch (err) {
      alert("Microphone access failed. Please allow access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (transcriptionTimeoutRef.current) {
      clearInterval(transcriptionTimeoutRef.current);
    }
  };

  // Keyboard shortcut for recording (Space key)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isProcessing) {
        // Prevent scroll for non-input elements
        if (document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          if (isRecording) stopRecording();
          else startRecording();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isRecording, isProcessing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transcriptionTimeoutRef.current) {
        clearInterval(transcriptionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 transition-all relative overflow-hidden">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={100} 
        className={`absolute bottom-0 left-0 w-full opacity-20 pointer-events-none transition-opacity duration-500 ${isRecording ? 'opacity-30' : 'opacity-0'}`}
      />

      <div className="relative mb-6">
        {isRecording && <div className="absolute inset-[-10px] rounded-full border-4 border-red-400 opacity-20 animate-ping" />}
        <button 
          onClick={isRecording ? stopRecording : startRecording} 
          disabled={isProcessing} 
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl z-10 relative ${isRecording ? 'bg-red-500 hover:bg-red-600 scale-105' : 'bg-indigo-600 hover:bg-indigo-700'} ${isProcessing ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
        >
          {isProcessing ? <Loader2 className="w-12 h-12 text-white animate-spin" /> : isRecording ? <Square className="w-10 h-10 text-white fill-white rounded-sm" /> : <Mic className="w-12 h-12 text-white" />}
        </button>
      </div>

      <div className="text-center z-10">
        <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-1">
          {isProcessing ? 'AI Structuring...' : isRecording ? 'Listening...' : 'Capture a Moment'}
        </h3>
        
        {/* Live transcription display during recording */}
        {isRecording && liveTranscription && (
          <p className="text-slate-700 dark:text-slate-200 text-sm max-w-[300px] leading-relaxed mb-3 italic border-l-2 border-indigo-500 pl-3">
            {liveTranscription}
            {isTranscribing && <span className="animate-pulse">...</span>}
          </p>
        )}

        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[240px] leading-relaxed">
          {isRecording ? 'Journaling live. Describe your day.' : 'Speak naturally. [Space] to start/stop.'}
        </p>
      </div>

      {isProcessing && <div className="mt-4 flex items-center gap-2 text-indigo-500 font-semibold text-xs uppercase tracking-widest"><Headphones className="w-4 h-4 animate-bounce" />Processing Audio</div>}
    </div>
  );
};

export default VoiceRecorder;
