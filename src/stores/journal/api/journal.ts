import { useJournalStore } from '../store';
import { JournalStore } from '../types';

/**
 * API: Fetch journal entries for serialization/remote sync.
 * Direct state access (not through hooks) for non-React contexts.
 */
export const getJournalEntries = (): JournalStore => {
  return useJournalStore.getState().entries;
};

/**
 * API: Load journal entries from storage/backend.
 */
export const setJournalEntries = (entries: JournalStore): void => {
  useJournalStore.getState().actions.setEntries(entries);
};
