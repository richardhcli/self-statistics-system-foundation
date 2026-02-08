import { useCallback } from 'react';
import { useJournalActions } from '@/stores/journal';
import { generateEntryId } from '@/features/journal/utils/id-generator';
import type { JournalEntryData } from '@/stores/journal';

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
 * Entry ID uses the sortable generator to align with Firebase month queries.
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
 * const entryId = createDummyEntry('🎤 Transcribing...');  // Returns "20260207-143000-xyz"
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
    (dummyContent: string = '🎤 Transcribing...', duration?: string): string => {
      const entryId = generateEntryId();
      const parsedDuration = duration ? Number.parseFloat(duration) : undefined;

      const dummyEntry: JournalEntryData = {
        id: entryId,
        content: dummyContent,
        status: dummyContent.includes('Transcribing') ? 'TRANSCRIBING' : 'DRAFT',
        actions: {},
        metadata: {
          flags: { aiAnalyzed: false },
          timePosted: new Date().toISOString(),
          duration: Number.isFinite(parsedDuration) ? parsedDuration : undefined,
        },
      };

      journalActions.optimisticAdd(dummyEntry);
      return entryId;
    },
    [journalActions]
  );

  return createDummyEntry;
};
