import React, { useState, useRef, useEffect } from 'react';
import { VoiceRecorderProps } from '../../types';
import { AudioVisualization } from './audio-visualization';
import { WebSpeechPreview } from './web-speech-preview';
import { useJournalEntryPipeline } from '../../hooks/use-journal-entry-pipeline';

/**
 * VoiceRecorder Component - UI for audio recording with modular sub-components
 *
 * **Architecture:**
 * - Uses modular components: AudioVisualization, WebSpeechPreview
 * - Uses unified hook: useJournalEntryPipeline for progressive entry orchestration
 * - MediaRecorder captures WebM audio (max 60 seconds or manual stop)
 * - Web Speech API runs in parallel for display-only live preview
 * - Web Speech text is NOT stored or used; only Gemini transcription is official
 * 
 * **Sequential Entry Creation (Auto-Submit Flow via useJournalEntryPipeline):**
 * 1. User stops recording → Dummy entry created immediately (🎤 Transcribing...)
 * 2. Stage 2: Gemini transcription completes → Entry content updated with text
 * 3. Stage 3: AI analysis runs on transcribed text → Entry fully populated with actions/skills
 * 
 * **Processing State Tracking:**
 * - Parent passes onProcessingStateChange callback
 * - useVoiceAutoSubmit calls it with (entryId, isProcessing) when AI analysis starts/ends
 * - Parent updates processingEntries Set to show "Analyzing..." button state
 * 
 * **This Component's Responsibilities:**
 * - UI only: Record button, visualization, feedback display
 * - Capture Web Speech preview text (for fallback display only)
 * - Call useVoiceAutoSubmit hook when user stops recording
 * - Pass audio blob to hook for complete orchestration
 * 
 * **Orchestration Moved to Hook:**
 * - useJournalEntryPipeline handles all 3 stages sequentially
 * - useJournalEntryPipeline manages transcription logic (Gemini + fallback)
 * - useJournalEntryPipeline manages AI analysis with processing state callbacks
 * - Component no longer contains Stage 2/3 logic
 * 
 * **Control Flow:**
 * - Cascade fallback: Gemini → Web Speech API → error message
 * - "To Text" button always available (NOT disabled during processing)
 * - User can convert current audio for review at any time
 * 
 * **Technical Details:**
 * - MediaRecorder captures WebM format at system sample rate
 * - Web Speech API: display-only, real-time preview (not used for submission)
 * - Gemini: official transcription source
 * - Max recording: 60 seconds (auto-stops if reached)
 * - Modular cleanup: Visualization, Web Speech, stream, timer
 *
 * @component
 */
const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onToTextReview,
  onProcessingStateChange
}) => {
  // State management - UI state only (orchestration logic moved to hooks)
  const [isRecording, setIsRecording] = useState(false);
  const [webSpeechText, setWebSpeechText] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [userFeedback, setUserFeedback] = useState('waiting for user');

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { processVoiceEntry } = useJournalEntryPipeline();

  /**
   * Starts recording audio and initializes Web Speech API preview component.
   * WebSpeechPreview manages its own lifecycle via useEffect.
   * AudioVisualization manages frequency visualization separately.
   */
  const startRecording = async () => {
    try {
      console.log('[VoiceRecorder] Starting recording...');

      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

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
      setUserFeedback('🎤 Recording in progress...');

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
      setUserFeedback('❌ Failed to access microphone');
      alert('Could not access microphone. Please check permissions.');
    }
  };

  /**
   * Stops recording and returns audio blob for processing.
   * @returns Audio blob or null if no data
   */
  const stopRecording = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || !isRecording) {
        resolve(null);
        return;
      }

      // Set up one-time handler for final data
      mediaRecorder.addEventListener('stop', () => {
        console.log('[VoiceRecorder] MediaRecorder stopped, chunks:', audioChunksRef.current.length);
        
        if (audioChunksRef.current.length === 0) {
          resolve(null);
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        resolve(audioBlob);
      }, { once: true });

      // Stop recording
      mediaRecorder.stop();
      
      // Clean up other resources
      cleanupRecordingResources();
    });
  };

  /**
  /**
   * Stops recording and processes audio via useVoiceAutoSubmit orchestrator hook.
   * 
   * **Hook Responsibilities (Sequential):**
   * 1. Create draft entry with placeholder
   * 2. Transcribe audio (Gemini → Web Speech fallback)
   * 3. Analyze with AI (if transcription succeeded)
   * 4. Call onProcessingStateChange for parent state tracking
   * 
   * **This function responsibilities:**
   * 1. Stop recording to get audio blob
   * 2. Call submitVoiceRecording(blob) via hook
   */
  const stopRecordingAndSubmitAuto = async () => {
    console.log('[VoiceRecorder] Stopping recording and submitting...');

    const audioBlob = await stopRecording();
    
    if (!audioBlob) {
      setUserFeedback('⚠️ No audio recorded');
      return;
    }

    // Call hook orchestrator - handles all 3 stages sequentially
    // Hook will call onProcessingStateChange for AI analysis state tracking
    try {
      const entryId = await processVoiceEntry(audioBlob, webSpeechText, onProcessingStateChange);
      if (onProcessingStateChange) {
        onProcessingStateChange(entryId, false);
      }
      setUserFeedback('✅ Entry created and analyzed');
    } catch (error) {
      console.error('[VoiceRecorder] Voice pipeline failed:', error);
      setUserFeedback('⚠️ Entry created, but AI analysis failed');
    }
  };

  /**
   * User clicks "To Text" button - stops recording and uses Web Speech preview text.
   * Unlike auto-submit, this stops recording without auto-submitting the entry.
   * 
   * **Key Difference from Auto-Submit:**
   * - Auto-submit uses Gemini API for official transcription
   * - To Text uses Web Speech API preview text captured in real-time (no API call)
   * - Faster and immediate, but may be less accurate than Gemini
   * 
   * **Flow:**
   * 1. Stop recording (finalize MediaRecorder)
   * 2. Use captured Web Speech preview text
   * 3. Call onToTextReview callback with transcription
   * 4. Parent appends transcription to manual entry form textarea
   * 5. User can edit and submit manually
   * 
   * This flow allows user to quickly review and edit transcription before submitting,
   * providing immediate feedback without waiting for Gemini API.
   */
  const handleToTextClick = async () => {
    console.log('[VoiceRecorder] "To Text" clicked - using Web Speech preview text...');

    // Stop recording (finalizes MediaRecorder, but we don't need the blob)
    await stopRecording();

    // Use the Web Speech API preview text that was captured in real-time
    if (!webSpeechText || !webSpeechText.trim()) {
      setUserFeedback('❌ No text captured from Web Speech');
      alert('No text was captured. Please try recording again.');
      return;
    }

    console.log('[VoiceRecorder] Using Web Speech preview text');
    setUserFeedback('✅ Text ready for review');
    onToTextReview(webSpeechText);
  };

  /**
   * Cleans up recording resources (stream, timer).
   * AudioVisualization and WebSpeechPreview cleanup handled by their own useEffect.
   * 
   * Note: Web Speech API cleanup is now handled by WebSpeechPreview component.
   */
  const cleanupRecordingResources = () => {
    console.log('[VoiceRecorder] Cleaning up recording resources...');

    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reset UI state
    setIsRecording(false);
    setWebSpeechText('');
    setRecordingTime(0);
    mediaRecorderRef.current = null;
    setUserFeedback('waiting for user');

    console.log('[VoiceRecorder] Cleanup complete');
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 transition-all relative overflow-hidden">
      {/* User feedback (above visualization canvas, at bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-sm text-slate-600 dark:text-slate-400 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none">
        {userFeedback}
      </div>

      {/* Audio visualization component (modular) */}
      {isRecording && streamRef.current && (
        <AudioVisualization stream={streamRef.current} isRecording={isRecording} />
      )}

      {/* Main content (above visualization) */}
      <div className="relative z-10 w-full">
        {/* Title */}
        <h2 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">
          {isRecording ? 'Recording...' : 'Voice Recorder'}
        </h2>

        {/* Web Speech API Preview Component (handles its own lifecycle) */}
        <WebSpeechPreview 
          isRecording={isRecording}
          onPreviewChange={setWebSpeechText}
        />

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
            className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all transform hover:scale-110 active:scale-95 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 shadow-lg'
                : 'bg-blue-500 hover:bg-blue-600 shadow-lg'
            }`}
          >
            {isRecording ? '■ Stop' : '● Record'}
          </button>
        </div>

        {/* Small "To Text" button (visible only during recording, NEVER disabled) */}
        {isRecording && (
          <div className="flex justify-center mb-2">
            <button
              onClick={handleToTextClick}
              disabled={false}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 active:scale-95 bg-amber-500 hover:bg-amber-600 text-white`}
            >
              📝 To Text
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default VoiceRecorder;
