import { useCallback } from 'react';
import { useJournalActions, useJournal } from '@/stores/journal';

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
 * addTranscriptionToEntry("2026/February/03/14:30:45.123", "I went to the gym today");
 */
export const useAddTranscriptionToEntry = () => {
  const journalActions = useJournalActions();
  const journal = useJournal();

  const addTranscriptionToEntry = useCallback(
    (entryId: string, transcription: string): void => {
      // Get existing entry data to preserve all properties
      const [year, month, day, time] = entryId.split('/');
      const existingEntry = journal[year]?.[month]?.[day]?.[time];
      
      if (!existingEntry) {
        console.warn('[useAddTranscriptionToEntry] Entry not found:', entryId);
        return;
      }

      // Update entry with transcribed content, preserving all other properties
      journalActions.upsertEntry(entryId, {
        ...existingEntry,
        content: transcription,
      });
    },
    [journalActions, journal]
  );

  return addTranscriptionToEntry;
};
