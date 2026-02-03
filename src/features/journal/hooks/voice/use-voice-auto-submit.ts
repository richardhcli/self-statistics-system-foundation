import { useCallback } from 'react';
import { useCreateEntryPipeline } from '../create-entry/use-create-entry-pipeline';
import { useTranscribeAudio } from './use-transcribe-audio';
import { useAnalyzeVoiceEntry } from './use-analyze-voice-entry';

/**
 * Voice Auto-Submit Orchestrator: Coordinates sequential Stages 1-3
 * 
 * **The Brain:**
 * This is the orchestrator that knows the complete voice auto-submit flow.
 * Coordinates:
 * - Stage 1: Create dummy entry (from pipeline)
 * - Stage 2: Transcribe audio (tries Gemini, falls back to Web Speech)
 * - Stage 3: AI analysis (only on real transcription, never placeholder)
 * 
 * **Sequential Execution:**
 * Stage 1 → Stage 2 (await) → Stage 3 (if transcription succeeded)
 * This ensures AI only processes real text, never placeholder content.
 * 
 * **Purpose:**
 * Centralizes all voice recording orchestration logic. Keeps VoiceRecorder
 * component UI-only (recording UI, button clicks, feedback display).
 * 
 * @param webSpeechFallback - Web Speech API text captured during recording
 * @param setFeedback - Callback to update user feedback message
 * @param onProcessingStateChange - Callback to update entry processing state
 * @returns Function that handles complete voice auto-submit flow
 */
export const useVoiceAutoSubmit = (
  webSpeechFallback: string,
  setFeedback: (message: string) => void,
  onProcessingStateChange?: (entryId: string, isProcessing: boolean) => void
) => {
  const { createDummyEntry, updateWithTranscription } = useCreateEntryPipeline();
  const transcribeAudio = useTranscribeAudio(webSpeechFallback, setFeedback);
  const analyzeVoiceEntry = useAnalyzeVoiceEntry(setFeedback, onProcessingStateChange);

  const submitVoiceRecording = useCallback(
    async (audioBlob: Blob) => {
      console.log('[useVoiceAutoSubmit] Starting voice auto-submit orchestration...');

      // Stage 1: Create dummy entry immediately with placeholder
      // This provides immediate UI feedback while transcription processes
      console.log('[useVoiceAutoSubmit] Stage 1: Creating dummy entry...');
      const entryId = createDummyEntry(
        '🎤 Transcribing...',  // Placeholder shown to user while processing
        undefined,             // No duration for voice (optional)
        undefined              // Auto-generate timestamp
      );
      console.log('[useVoiceAutoSubmit] Dummy entry created:', entryId);

      // Stage 2: Transcribe audio and update entry (SEQUENTIAL - must finish first)
      // Cascade fallback: Gemini → Web Speech API → error
      const transcription = await transcribeAudio(audioBlob, entryId);

      // Stage 3: AI analysis (ONLY after Stage 2 completes with real text)
      // This ensures AI processes actual transcribed content, never placeholder
      if (transcription?.trim()) {
        await analyzeVoiceEntry(entryId, transcription);
      } else {
        console.error('[useVoiceAutoSubmit] Stage 3 skipped - no valid transcription available');
        setFeedback('❌ Could not transcribe audio');
      }

      return entryId;
    },
    [createDummyEntry, transcribeAudio, analyzeVoiceEntry, setFeedback]
  );

  return submitVoiceRecording;
};
