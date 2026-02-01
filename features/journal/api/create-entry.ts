import { entryOrchestrator } from '@/utils/text-to-topology/entry-pipeline';
import { getNormalizedDate } from '@/features/journal/utils/time-utils';
import { upsertJournalEntry } from '@/features/journal/utils/journal-entry-utils';
import { JournalEntryData } from '@/types';

/**
 * createJournalEntry
 * Generates dummy journal entry layout immediately, and then 
 * calls entry orchestrator to process and update the entry.
 * 
 * Creates loading placeholder immediately with a fixed timestamp,
 * then orchestrator updates the SAME entry with final values.
 * This prevents duplicate entries by ensuring consistent timestamp usage.
 */
export const createJournalEntry = async (
  context: { 
    entry: string; 
    actions?: string[]; 
    useAI?: boolean; 
    dateInfo?: any;
    duration?: string;
  },
): Promise<void> => {
  const { entry, actions = [], useAI = false, dateInfo, duration } = context;
  
  // Generate normalized date ONCE to use for both loading and final entry
  const normalizedDate = getNormalizedDate(dateInfo);

  const loadingEntry: JournalEntryData = {
    content: 'loading',
    duration: 'loading',
    actions: ['loading'],
    metadata: {
      totalExp: 0,
      levelsGained: 0,
      nodeIncreases: {}
    }
  };

  // Create loading placeholder at the normalized date
  upsertJournalEntry(normalizedDate, loadingEntry);

  // Pass the normalized date to orchestrator to ensure same entry is updated
  await entryOrchestrator({ 
    entry, 
    actions, 
    useAI, 
    duration, 
    normalizedDate 
  });
};