import { AppData, TextToActionResponse } from '@/types';
import { entryOrchestrator } from '@/utils/entry-pipeline';
import { getNormalizedDate } from '@/features/journal/utils/time-utils';
import { updateJournalHTML } from '@/features/journal/utils/journal-entry-utils';

/**
 * createJournalEntry
 * Full lifecycle of a journal entry: AI analysis, topology merging, 
 * EXP propagation, and data persistence.
 */
export const createJournalEntry = async (
  context: { 
    entry: string; 
    actions?: string[]; 
    useAI?: boolean; 
    dateInfo?: any;
    duration?: string;
  },
  setData: (fn: (prev: AppData) => AppData) => void,
  currentAppData: AppData // Pass current state for characteristic existence check
): Promise<TextToActionResponse | null> => {
  const { entry, actions = [], useAI = false, dateInfo, duration } = context;
  const date = getNormalizedDate(dateInfo);

  const processor = await entryOrchestrator(
    { entry, actions, useAI, duration },
    currentAppData
  );

  setData(prev => {
    const { data: nextData, entryData } = processor.applyDataUpdates(prev);
    return updateJournalHTML(nextData, date, entryData);
  });

  return processor.analysis;
};