import { useCallback } from 'react';
import { transcribeWebmAudio } from '@/lib/google-ai';
import { useAddTranscriptionToEntry } from '../create-entry/use-add-transcription-to-entry';

/**
 * Stage 2: Transcribes audio and updates entry with real text.
 * Cascade fallback strategy: Gemini → Web Speech API → null
 * 
 * **Brain Logic:**
 * 1. Try Gemini transcription first (official source, highest quality)
 * 2. If Gemini fails, fallback to Web Speech API text (if captured during recording)
 * 3. Return transcription text for Stage 3, or null if all sources failed
 * 4. Updates entry in global store when transcription succeeds
 * 
 * **Purpose:**
 * Centralizes all transcription logic with fallback handling. Called by voice auto-submit.
 * Keeps VoiceRecorder component UI-only (no transcription logic).
 * 
 * @param webSpeechFallback - Web Speech API text captured during recording (for fallback)
 * @param setFeedback - Callback to update user feedback message
 * @returns Function that transcribes audio and returns real text or null
 */
export const useTranscribeAudio = (
  webSpeechFallback: string,
  setFeedback: (message: string) => void
) => {
  const addTranscriptionToEntry = useAddTranscriptionToEntry();

  const transcribeAudioAndUpdateEntry = useCallback(
    async (audioBlob: Blob, entryId: string): Promise<string | null> => {
      try {
        // Try Gemini transcription first (primary source)
        try {
          console.log('[useTranscribeAudio] Stage 2: Starting Gemini transcription...');
          setFeedback('🤖 Transcribing with Gemini AI...');

          const transcription = await transcribeWebmAudio(audioBlob);

          if (transcription?.trim()) {
            console.log('[useTranscribeAudio] Gemini transcription successful');
            setFeedback('✅ Transcription complete');

            // Update entry with real transcribed text (replaces placeholder)
            addTranscriptionToEntry(entryId, transcription);

            console.log('[useTranscribeAudio] Entry updated with transcription');
            return transcription;
          }
        } catch (err) {
          console.error('[useTranscribeAudio] Gemini transcription failed:', err);
        }

        // Fallback to Web Speech API (if we captured preview text during recording)
        if (webSpeechFallback?.trim()) {
          console.log('[useTranscribeAudio] Using Web Speech API fallback for transcription');
          setFeedback('🔄 Using Web Speech API fallback...');

          // Update entry with fallback transcription
          addTranscriptionToEntry(entryId, webSpeechFallback);

          console.log('[useTranscribeAudio] Entry updated with fallback transcription');
          return webSpeechFallback;
        }

        // Both transcription sources failed - no text available
        console.error('[useTranscribeAudio] No transcription available from any source');
        setFeedback('❌ No message read - please try again');
        return null;
      } catch (err) {
        console.error('[useTranscribeAudio] Transcription error:', err);
        setFeedback('❌ Transcription error');
        return null;
      }
    },
    [webSpeechFallback, setFeedback, addTranscriptionToEntry]
  );

  return transcribeAudioAndUpdateEntry;
};
