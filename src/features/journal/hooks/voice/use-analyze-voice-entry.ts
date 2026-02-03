import { useCallback } from 'react';
import { useAnalyzeEntryWithAI } from '../create-entry/use-analyze-entry-with-ai';

/**
 * Stage 3: Analyzes entry with AI to extract actions/skills/characteristics.
 * This function is ONLY called after Stage 2 successfully transcribes text.
 * 
 * **Purpose:**
 * Centralizes AI analysis logic. Called by voice auto-submit after transcription.
 * Keeps VoiceRecorder component UI-only (no AI logic).
 * 
 * **Flow:**
 * 1. Receives real transcribed text from Stage 2
 * 2. Triggers AI analysis using pipeline hook
 * 3. AI updates entry with extracted metadata (actions, skills, etc.)
 * 4. Updates processing state when complete
 * 
 * @param setFeedback - Callback to update user feedback message
 * @param onProcessingStateChange - Callback to update processing state for entry
 * @returns Function that analyzes entry with AI
 */
export const useAnalyzeVoiceEntry = (
  setFeedback: (message: string) => void,
  onProcessingStateChange?: (entryId: string, isProcessing: boolean) => void
) => {
  const analyzeEntryWithAI = useAnalyzeEntryWithAI();

  const analyzeWithAI = useCallback(
    async (entryId: string, transcription: string) => {
      try {
        console.log('[useAnalyzeVoiceEntry] Stage 3: Starting AI analysis on transcribed text...');
        setFeedback('🧠 Analyzing with AI...');

        // Mark entry as processing
        if (onProcessingStateChange) {
          onProcessingStateChange(entryId, true);
        }

        // Trigger AI analysis with real transcription (not placeholder)
        await analyzeEntryWithAI(entryId, transcription);

        console.log('[useAnalyzeVoiceEntry] Stage 3 complete - AI analysis finished');
        setFeedback('✅ Entry created and analyzed');
      } catch (err) {
        console.error('[useAnalyzeVoiceEntry] AI analysis failed:', err);
        setFeedback('⚠️ Entry created, but AI analysis failed');
      } finally {
        // Clear processing state
        if (onProcessingStateChange) {
          onProcessingStateChange(entryId, false);
        }
      }
    },
    [analyzeEntryWithAI, setFeedback, onProcessingStateChange]
  );

  return analyzeWithAI;
};
