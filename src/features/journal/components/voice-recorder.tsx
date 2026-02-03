import React, { useState, useRef, useEffect } from 'react';
import { transcribeWebmAudio } from '@/lib/google-ai';
import { VoiceRecorderProps } from '../types';

/**
 * VoiceRecorder Component - Audio recording with dual submission flows
 *
 * **Architecture:**
 * - MediaRecorder captures WebM audio (max 60 seconds or manual stop)
 * - Web Speech API runs in parallel for display-only live preview
 * - Web Speech text is NOT stored or used; only Gemini transcription is official
 * - Two submission buttons:
 *   1. "Record" (large) - Records → Stops → Auto-submits (onSubmitAuto)
 *   2. "To Text" (small, visible during recording) - Converts current recording to text (onToTextReview)
 *
 * **State Management:**
 * - `isRecording`: Recording state
 * - `webSpeechText`: Live preview from Web Speech API (display-only, greyed out)
 * - `isProcessing`: Loading state during Gemini transcription
 * - `recordingTime`: Elapsed seconds (for 60s timeout)
 * - `mediaRecorder`: MediaRecorder instance
 * - `audioChunks`: Accumulated WebM chunks during recording
 *
 * **Web Speech API Fallback:**
 * - If Web Speech API unavailable: Records silently (no display preview)
 * - Gemini transcription always works (official source of truth)
 *
 * **Technical Details:**
 * - MediaRecorder captures at system sample rate (auto-detected)
 * - WebM container format (standard for web audio)
 * - Web Speech API: display-only, real-time preview
 * - Gemini: batch transcription of complete WebM file
 * - Max recording: 60 seconds (auto-stops if reached)
 *
 * @component
 * @example
 * <VoiceRecorder
 *   onSubmitAuto={(text) => createJournalEntry(text)}
 *   onToTextReview={(text) => setTextAreaValue(text)}
 * />
 */
const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSubmitAuto, onToTextReview }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [webSpeechText, setWebSpeechText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Refs for recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for visualization
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Ref for Web Speech API
  const webSpeechRef = useRef<any>(null);

  /**
   * Starts audio visualization using Web Audio API.
   * Note: Uses SEPARATE AudioContext from MediaRecorder (prevents conflicts).
   * Visualization is for UI feedback only.
   */
  const startVisualization = async () => {
    try {
      const stream = streamRef.current;
      if (!stream) return;

      // Create separate AudioContext for visualization
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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
          ctx.fillStyle = `hsl(${(i / bufferLength) * 360}, 100%, 50%)`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
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
   * Starts Web Speech API for display-only real-time preview.
   * Text is greyed out, italicized, and NOT used for submission.
   * Gracefully falls back if API unavailable.
   */
  const startWebSpeechPreview = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.log('[VoiceRecorder] Web Speech API unavailable - recording silently');
        setWebSpeechText('(Silent mode - no preview)');
        return;
      }

      webSpeechRef.current = new SpeechRecognition();
      webSpeechRef.current.continuous = true;
      webSpeechRef.current.interimResults = true;
      webSpeechRef.current.lang = 'en-US';

      let finalText = '';

      webSpeechRef.current.onstart = () => {
        console.log('[VoiceRecorder] Web Speech API started');
      };

      webSpeechRef.current.onresult = (event: any) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalText += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Display-only preview: combine final + interim
        const preview = finalText + interimTranscript;
        setWebSpeechText(preview);
      };

      webSpeechRef.current.onerror = (event: any) => {
        console.warn('[VoiceRecorder] Web Speech API error:', event.error);
      };

      webSpeechRef.current.start();
    } catch (err) {
      console.error('[VoiceRecorder] Web Speech API initialization failed:', err);
      setWebSpeechText('(Preview unavailable)');
    }
  };

  /**
   * Stops Web Speech API preview.
   */
  const stopWebSpeechPreview = () => {
    if (webSpeechRef.current) {
      try {
        webSpeechRef.current.stop();
        webSpeechRef.current = null;
      } catch (err) {
        console.error('[VoiceRecorder] Error stopping Web Speech API:', err);
      }
    }
  };

  /**
   * Starts recording audio and initializes visualization/preview.
   * Sets up MediaRecorder with WebM output.
   */
  const startRecording = async () => {
    try {
      console.log('[VoiceRecorder] Starting recording...');

      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Start visualization
      await startVisualization();

      // Start Web Speech API preview (display-only)
      startWebSpeechPreview();

      // Start MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setWebSpeechText('');
      setRecordingTime(0);

      // Start recording time counter (60s max)
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev + 1 >= 60) {
            // Auto-stop at 60 seconds
            stopRecordingAndSubmitAuto();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

      console.log('[VoiceRecorder] Recording started');
    } catch (err) {
      console.error('[VoiceRecorder] Failed to start recording:', err);
      alert('Microphone access failed. Please check your settings.');
    }
  };

  /**
   * Stops recording and triggers auto-submission flow.
   * Called when user clicks Record button (stop) or 60s timeout reached.
   */
  const stopRecordingAndSubmitAuto = async () => {
    console.log('[VoiceRecorder] Stopping recording (auto-submit)...');
    await stopRecordingInternal();

    // Process and submit
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await transcribeAndSubmit(audioBlob, 'auto');
    }
  };

  /**
   * User clicks "To Text" button - transcribes current recording for review.
   * Does NOT stop recording; user can continue recording after.
   */
  const handleToTextClick = async () => {
    console.log('[VoiceRecorder] "To Text" clicked - transcribing for review...');

    if (audioChunksRef.current.length === 0) {
      alert('No audio recorded yet. Please record some audio first.');
      return;
    }

    setIsProcessing(true);

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await transcribeAndSubmit(audioBlob, 'review');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Internal: stops recording without submitting.
   * Cleans up MediaRecorder, stream, visualization, and Web Speech API.
   */
  const stopRecordingInternal = async () => {
    console.log('[VoiceRecorder] Cleaning up recording resources...');

    // Stop MediaRecorder
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Stop visualization
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop Web Speech API
    stopWebSpeechPreview();

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setWebSpeechText('');
    setRecordingTime(0);

    console.log('[VoiceRecorder] Recording stopped, cleanup complete');
  };

  /**
   * Transcribes WebM blob using Gemini and calls appropriate callback.
   * 
   * @param audioBlob WebM audio blob
   * @param flow 'auto' for immediate entry creation, 'review' for textarea population
   */
  const transcribeAndSubmit = async (audioBlob: Blob, flow: 'auto' | 'review') => {
    setIsProcessing(true);

    try {
      console.log(`[VoiceRecorder] Starting Gemini transcription (${flow} flow)...`);
      const transcription = await transcribeWebmAudio(audioBlob);

      if (!transcription) {
        alert('Transcription failed or returned empty. Please try again.');
        return;
      }

      console.log(`[VoiceRecorder] Transcription complete (${flow}):`, transcription.slice(0, 100), '...');

      // Trigger appropriate callback
      if (flow === 'auto') {
        onSubmitAuto(transcription);
      } else if (flow === 'review') {
        onToTextReview(transcription);
      }
    } catch (err) {
      console.error(`[VoiceRecorder] Transcription failed (${flow}):`, err);
      alert(`Transcription error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      stopWebSpeechPreview();
      if (timerRef.current) {
        clearInterval(timerRef.current);
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
        className={`absolute bottom-0 left-0 w-full opacity-20 pointer-events-none transition-opacity duration-500 ${
          isRecording ? 'opacity-30' : 'opacity-0'
        }`}
      />

      {/* Main content (above visualization) */}
      <div className="relative z-10 w-full">
        {/* Title */}
        <h2 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">
          {isRecording ? 'Recording...' : 'Press to Record'}
        </h2>

        {/* Web Speech API Preview (display-only, greyed out) */}
        {webSpeechText && (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400 italic mb-2">Live preview (Web Speech API):</p>
            <p className="text-slate-400 dark:text-slate-500 italic">{webSpeechText}</p>
          </div>
        )}

        {/* Recording time display */}
        {isRecording && (
          <div className="mb-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {recordingTime}s / 60s
              {recordingTime > 45 && <span className="text-orange-500 ml-2">⏱️ (Auto-stop at 60s)</span>}
            </p>
          </div>
        )}

        {/* Large Record button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => (isRecording ? stopRecordingAndSubmitAuto() : startRecording())}
            disabled={isProcessing}
            className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all transform hover:scale-110 active:scale-95 disabled:opacity-50 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 shadow-lg'
                : 'bg-blue-500 hover:bg-blue-600 shadow-lg'
            }`}
          >
            {isRecording ? '■ Stop' : '● Record'}
          </button>
        </div>

        {/* Small "To Text" button (visible only during recording) */}
        {isRecording && (
          <div className="flex justify-center mb-2">
            <button
              onClick={handleToTextClick}
              disabled={isProcessing}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 ${
                isProcessing
                  ? 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {isProcessing ? '⟳ Transcribing...' : '📝 To Text'}
            </button>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="text-center mt-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Transcribing with Gemini...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
