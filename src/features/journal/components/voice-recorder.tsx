
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import { VoiceRecorderProps } from '../types';
import { transcribeAudio } from '@/lib/google-ai/utils/transcribe-audio';

/**
 * VoiceRecorder component - Real-time audio recording with live transcription.
 *
 * Simplified architecture:
 * - Records audio continuously
 * - Transcribes every 3 seconds during recording
 * - Displays live transcription text
 * - Passes transcribed text to parent via callback
 *
 * State:
 * - `isRecording`: Whether currently recording audio
 * - `liveTranscription`: Accumulated transcription text displayed to user
 * - `isTranscribing`: Whether currently processing audio chunk for transcription
 *
 * Refs:
 * - `mediaRecorderRef`: MediaRecorder instance for audio capture
 * - `chunksRef`: Accumulated audio Blob chunks for transcription
 * - `transcriptionIntervalRef`: Periodic interval (every 3 seconds)
 *
 * @component
 * @example
 * <VoiceRecorder onTranscription={(text) => handleText(text)} />
 */
const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscription }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const transcriptionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  /**
   * Processes accumulated audio chunks and sends for transcription.
   * Called every 3 seconds during recording via interval.
   *
   * @async
   * @returns {Promise<void>}
   */
  const processTranscriptionChunk = async () => {
    if (chunksRef.current.length === 0 || isTranscribing) return;

    setIsTranscribing(true);
    try {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;
          const audioBase64 = base64data.split(',')[1];

          const transcription = await transcribeAudio(audioBase64);
          if (transcription) {
            setLiveTranscription(transcription);
            onTranscription(transcription);
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

  /**
   * Starts audio recording and transcription interval.
   * Sets up MediaRecorder, audio visualization, and 3-second transcription loop.
   *
   * @async
   * @returns {Promise<void>}
   */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      /**
       * Animates frequency visualization canvas.
       * Draws vertical bars based on audio frequency data.
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

      // Set up audio recording
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      /**
       * Captures audio data continuously into chunks buffer.
       * Buffer is processed every 3 seconds for transcription.
       */
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        if (transcriptionIntervalRef.current) clearInterval(transcriptionIntervalRef.current);
        setLiveTranscription('');
        setIsTranscribing(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setLiveTranscription('');

      // Start periodic transcription every 3 seconds
      transcriptionIntervalRef.current = setInterval(processTranscriptionChunk, 3000);
    } catch (err) {
      alert("Microphone access failed. Please allow access.");
    }
  };

  /**
   * Stops audio recording and transcription interval.
   * Cleans up MediaRecorder and interval.
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (transcriptionIntervalRef.current) {
      clearInterval(transcriptionIntervalRef.current);
    }
  };

  // Keyboard shortcut (Space key) for start/stop
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Only trigger if not in input/textarea
      if (document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
        if (e.code === 'Space') {
          e.preventDefault();
          if (isRecording) stopRecording();
          else startRecording();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transcriptionIntervalRef.current) {
        clearInterval(transcriptionIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 transition-all relative overflow-hidden">
      {/* Audio visualization canvas */}
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={100} 
        className={`absolute bottom-0 left-0 w-full opacity-20 pointer-events-none transition-opacity duration-500 ${isRecording ? 'opacity-30' : 'opacity-0'}`}
      />

      {/* Record button */}
      <div className="relative mb-6">
        {isRecording && <div className="absolute inset-[-10px] rounded-full border-4 border-red-400 opacity-20 animate-ping" />}
        <button 
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl z-10 relative ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 scale-105' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isRecording ? (
            <Square className="w-10 h-10 text-white fill-white rounded-sm" />
          ) : (
            <Mic className="w-12 h-12 text-white" />
          )}
        </button>
      </div>

      {/* Title and transcription display */}
      <div className="text-center z-10">
        <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-1">
          {isRecording ? 'Listening...' : 'Voice Recorder'}
        </h3>
        
        {/* Live transcription text */}
        {isRecording && liveTranscription && (
          <p className="text-slate-700 dark:text-slate-200 text-sm max-w-[300px] leading-relaxed mb-3 italic border-l-2 border-indigo-500 pl-3">
            {liveTranscription}
            {isTranscribing && <span className="animate-pulse">...</span>}
          </p>
        )}

        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[240px] leading-relaxed">
          {isRecording 
            ? 'Speak naturally. Press [Space] or click to stop.' 
            : 'Press [Space] or click to start recording.'}
        </p>
      </div>
    </div>
  );
};

export default VoiceRecorder;
