import { useCallback } from 'react';
import { useJournalActions } from '@/stores/journal';
import { JournalEntryData } from '@/types';
import { getNormalizedDate } from '@/features/journal/utils/time-utils';

/**
 * Hook for creating a dummy/placeholder journal entry
 * 
 * Used in progressive entry creation to show immediate UI feedback
 * while background processes (transcription, AI analysis) complete.
 * 
 * Supports flexible dummy content:
 * - Voice flow: "🎤 Transcribing..." (placeholder shown during processing)
 * - Manual flow: User's typed text (content already filled, no dummy display needed)
 * 
 * Entry ID is normalized using getNormalizedDate() for consistency with manual form.
 * Duration is stored in metadata immediately for AI processing to use.
 * 
 * **Hybrid Strategy:**
 * - Progressive pipeline internally (dummy → transcribed → analyzed)
 * - Dummy entry display suppressed for manual submissions (isDummyContent=false)
 * - Voice submissions show dummy display while processing (isDummyContent=true)
 * 
 * @returns {Function} createDummyEntry(dummyContent?, duration?, dateInfo?) - Creates placeholder and returns entry ID
 * 
 * @example
 * // Voice flow: Create dummy with placeholder
 * const createDummyEntry = useCreateDummyEntry();
 * const entryId = createDummyEntry('🎤 Transcribing...');  // Returns "2026/February/03/14:30:45.123"
 * 
 * @example
 * // Manual flow: Create dummy with actual content (display suppressed by parent)
 * const entryId = createDummyEntry('I just finished debugging the API', '120');  // Content already filled
 * 
 * @example
 * // Voice with duration for AI processing
 * const entryId = createDummyEntry('🎤 Processing...', '45');  // Duration available for AI analysis
 */
export const useCreateDummyEntry = () => {
  const journalActions = useJournalActions();

  const createDummyEntry = useCallback(
    (
      dummyContent: string = '🎤 Transcribing...',
      duration?: string,
      dateInfo?: { year?: string; month?: string; day?: string; time?: string }
    ): string => {
      // Use getNormalizedDate() for consistent date formatting (matches manual form)
      const dateObj = getNormalizedDate(dateInfo);
      
      // Format entry ID: YYYY/MonthName/DD/HH:MM:SS.fff
      const entryId = `${dateObj.year}/${dateObj.month}/${dateObj.day}/${dateObj.time}`;

      // Create dummy entry with flexible content and optional duration
      const dummyEntry: JournalEntryData = {
        content: dummyContent,
        actions: {},
        metadata: {
          flags: { aiAnalyzed: false },
          timePosted: new Date().toISOString(),
          // Duration available immediately for AI processing to use
          duration: duration || undefined,
        },
      };

      journalActions.upsertEntry(entryId, dummyEntry);
      return entryId;
    },
    [journalActions]
  );

  return createDummyEntry;
};
