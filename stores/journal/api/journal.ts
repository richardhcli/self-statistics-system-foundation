import { useJournalStore } from '../store';
import { JournalStore } from '../types';

/**
 * API: Fetch journal entries for serialization/remote sync.
 */
export const getJournalEntries = (): JournalStore => {
  return useJournalStore.getState().getEntries();
};

/**
 * API: Load journal entries from storage/backend.
 */
export const setJournalEntries = (entries: JournalStore): void => {
  useJournalStore.getState().actions.setEntries(entries);
};
