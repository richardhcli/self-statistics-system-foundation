import { useJournalStore } from '../store';
import type { JournalPersistedState } from '../types';

/**
 * API: Fetch journal entries for serialization/remote sync.
 * Direct state access (not through hooks) for non-React contexts.
 */
export const getJournalEntries = (): JournalPersistedState => {
  const { entries, tree, metadata } = useJournalStore.getState();
  return { entries, tree, metadata };
};

/**
 * API: Load journal entries from storage/backend.
 */
export const setJournalEntries = (snapshot: JournalPersistedState): void => {
  useJournalStore.getState().actions.setSnapshot(snapshot);
};
