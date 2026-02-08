import { useCallback } from 'react';
import { useJournalActions, useJournalEntries } from '@/stores/journal';

/**
 * Hook for adding transcribed text to an existing journal entry.
 * 
 * **Stage 2 of Progressive Pipeline:**
 * Replaces dummy entry's placeholder content with actual transcribed text.
 * Maintains all other entry properties (actions, metadata, etc).
 * 
 * Used after transcription completes to update entry from "🎤 Transcribing..." 
 * to actual transcribed content.
 * 
 * @returns {Function} addTranscriptionToEntry(entryId, transcription) - Updates entry content
 * 
 * @example
 * const addTranscriptionToEntry = useAddTranscriptionToEntry();
 * addTranscriptionToEntry("20260207-143000-xyz", "I went to the gym today");
 */
export const useAddTranscriptionToEntry = () => {
  const journalActions = useJournalActions();
  const entries = useJournalEntries();

  const addTranscriptionToEntry = useCallback(
    (entryId: string, transcription: string): void => {
      const existingEntry = entries[entryId];

      if (!existingEntry) {
        console.warn('[useAddTranscriptionToEntry] Entry not found:', entryId);
        return;
      }

      journalActions.updateEntry(entryId, {
        content: transcription,
        status: 'PENDING_ANALYSIS',
      });
    },
    [journalActions, entries]
  );

  return addTranscriptionToEntry;
};
