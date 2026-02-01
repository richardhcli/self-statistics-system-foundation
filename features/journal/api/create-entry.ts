import { useAppDataStore } from '@/stores/app-data';
import { entryOrchestrator } from '@/utils/text-to-topology/entry-pipeline';
import { getNormalizedDate } from '@/features/journal/utils/time-utils';
import { updateJournalHTML } from '@/features/journal/utils/journal-entry-utils';

/**
 * createJournalEntry
 * Full lifecycle of a journal entry: AI analysis, topology merging, 
 * EXP propagation, and data persistence.
 * 
 * Retrieves current state and persists updates via global Zustand store.
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
  const date = getNormalizedDate(dateInfo);

  const { setData } = useAppDataStore.getState();

  const result = await entryOrchestrator({ entry, actions, useAI, duration });

  setData(updateJournalHTML(result.data, date, result.entryData));
};