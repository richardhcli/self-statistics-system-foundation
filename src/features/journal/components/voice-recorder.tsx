
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import { VoiceRecorderProps } from '../types';
import { startLiveTranscription, LiveTranscriptionSession } from '@/lib/google-ai/utils/live-transcription';

/**
 * VoiceRecorder component - Real-time audio recording with automatic submission.
 *
 * **Live Streaming Architecture:**
 * - Uses Gemini Live API with WebSocket for real-time transcription
 * - Audio streamed continuously via ScriptProcessorNode at 16kHz sample rate
 * - Receives interim transcriptions as user speaks (sub-second latency)
 * - Receives final transcriptions when speech turns complete (pause detected)
 * - **Automatically submits accumulated transcription when recording stops**
 *
 * **State:**
 * - `isRecording`: Whether currently recording and streaming audio
 * - `liveTranscription`: Accumulated transcription text displayed to user
 * - `interimText`: Current incomplete text chunk (updates as user speaks)
 *
 * **Refs:**
 * - `sessionRef`: Live API session handle for cleanup
 * - `canvasRef`: Canvas element for audio frequency visualization
 * - `animationFrameRef`: RequestAnimationFrame ID for visualization cleanup
 * - `analyserRef`: AnalyserNode for audio visualization (separate from Live API audio)
 * - `visualAudioContextRef`: Separate AudioContext for visualization only
 * - `accumulatedTextRef`: Ref to store final transcription for auto-submission
 *
 * **Auto-Submission Flow:**
 * 1. User starts recording (Space key or click)
 * 2. User speaks → sees real-time transcription
 * 3. User stops recording (Space key or click)
 * 4. Component automatically calls `onComplete` with full transcription
 * 5. Parent component handles AI processing and entry creation
 *
 * **Technical Details:**
 * - Live API uses 16kHz PCM audio format
 * - Visualization uses separate AudioContext to avoid conflicts
 * - Interim text accumulates continuously, resets on turn completion
 * - Final text appended to accumulated transcription ref
 * - No manual confirmation required - short recordings don't need review
 *
 * @component
 * @example
 * <VoiceRecorder onComplete={(text) => handleAutoSubmit(text)} />
 */
const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [interimText, setInterimText] = useState('');

  const sessionRef = useRef<LiveTranscriptionSession | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const visualAudioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  /**
   * Accumulated transcription ref for auto-submission.
   * Updated during recording, read on stop for automatic submission.
   */
  const accumulatedTextRef = useRef<string>('');

  /**
   * Starts audio visualization for user feedback.
   * Uses a separate AudioContext from Live API to avoid conflicts.
   * 
   * @async
   * @returns {Promise<void>}
   */
  const startVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create separate AudioContext for visualization only
      visualAudioContextRef.current = new AudioContext();
      analyserRef.current = visualAudioContextRef.current.createAnalyser();
      const source = visualAudioContextRef.current.createMediaStreamSource(stream);
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
      
      console.log('[VoiceRecorder] Visualization started');
    } catch (err) {
      console.error('[VoiceRecorder] Visualization failed:', err);
    }
  };

  /**
   * Starts Live API transcription session with real-time streaming.
   * Manages WebSocket connection, audio streaming, and transcription callbacks.
   *
   * @async
   * @returns {Promise<void>}
   */
  const startRecording = async () => {
    try {
      console.log('[VoiceRecorder] Starting Live API session...');
      
      // Reset accumulated text for new recording
      accumulatedTextRef.current = '';
      
      // Start audio visualization
      await startVisualization();
      
      // Start Live API transcription session
      const session = await startLiveTranscription({
        onOpen: () => {
          console.log('[VoiceRecorder] Live API connected');
          setIsRecording(true);
          setLiveTranscription('');
          setInterimText('');
        },
        
        onInterimTranscription: (text) => {
          console.log('[VoiceRecorder] Interim:', text);
          // Accumulate interim text as user speaks
          setInterimText(prev => prev + text);
        },
        
        onFinalTranscription: (finalText) => {
          console.log('[VoiceRecorder] Final:', finalText);
          
          // Append to accumulated transcription
          const newTranscription = accumulatedTextRef.current + (accumulatedTextRef.current ? ' ' : '') + finalText;
          accumulatedTextRef.current = newTranscription;
          
          // Update UI display
          setLiveTranscription(newTranscription);
          setInterimText('');
        },
        
        onError: (error) => {
          console.error('[VoiceRecorder] Error:', error);
          alert(`Transcription error: ${error.message}`);
        },
        
        onClose: () => {
          console.log('[VoiceRecorder] Session closed');
        }
      });
      
      sessionRef.current = session;
      console.log('[VoiceRecorder] Session started successfully');
    } catch (err) {
      console.error('[VoiceRecorder] Failed to start recording:', err);
      alert('Microphone access failed or API error. Please check your settings.');
    }
  };

  /**
   * Stops Live API transcription session and automatically submits accumulated text.
   * Closes WebSocket, stops visualization, resets state, and triggers onComplete callback.
   * 
   * **Auto-Submission Logic:**
   * - Reads accumulated text from ref (not state, to avoid stale closure)
   * - Only submits if text is non-empty
   * - Cleans up all resources before submission
   */
  const stopRecording = () => {
    console.log('[VoiceRecorder] Stopping recording');
    
    // Capture accumulated text before cleanup
    const finalText = accumulatedTextRef.current.trim();
    console.log('[VoiceRecorder] Final accumulated text:', finalText);
    
    // Stop Live API session
    if (sessionRef.current) {
      sessionRef.current.stop();
      sessionRef.current = null;
    }
    
    // Stop visualization
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (visualAudioContextRef.current) {
      visualAudioContextRef.current.close();
      visualAudioContextRef.current = null;
    }
    
    // Reset UI state
    setIsRecording(false);
    setInterimText('');
    setLiveTranscription('');
    
    // Auto-submit if we have transcribed text
    if (finalText && onComplete) {
      console.log('[VoiceRecorder] Auto-submitting transcription:', finalText);
      onComplete(finalText);
    } else if (!finalText) {
      console.log('[VoiceRecorder] No text to submit, skipping auto-submission');
    }
    
    console.log('[VoiceRecorder] Recording stopped, cleanup complete');
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
      if (sessionRef.current) {
        sessionRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (visualAudioContextRef.current) {
        visualAudioContextRef.current.close();
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
        
        {/* Live transcription display - shows both final and interim text */}
        {isRecording && (liveTranscription || interimText) && (
          <div className="text-slate-700 dark:text-slate-200 text-sm max-w-[300px] leading-relaxed mb-3 border-l-2 border-indigo-500 pl-3">
            {/* Final transcription (confirmed segments) */}
            {liveTranscription && (
              <p className="mb-1">{liveTranscription}</p>
            )}
            {/* Interim transcription (currently speaking, not yet final) */}
            {interimText && (
              <p className="italic opacity-70">
                {interimText}<span className="animate-pulse">...</span>
              </p>
            )}
          </div>
        )}

        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[240px] leading-relaxed">
          {isRecording 
            ? 'Speak naturally. Press [Space] or click to stop and submit.' 
            : 'Press [Space] or click to start recording.'}
        </p>
      </div>
    </div>
  );
};

export default VoiceRecorder;
