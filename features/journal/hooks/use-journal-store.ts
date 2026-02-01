import { useAppDataStore } from '@/stores/app-data';
import { JournalStore } from '@/features/journal/types';

/**
 * useJournalStore
 * React hook to access and update the journal store slice from Zustand.
 * Automatically triggers re-renders when journal data changes.
 */
export const useJournalStore = () => {
  const journal = useAppDataStore(state => state.data.journal);
  const updateData = useAppDataStore(state => state.updateData);

  const setJournal = (nextJournal: JournalStore) => {
    updateData(prev => ({ ...prev, journal: nextJournal }));
  };

  return { journal, setJournal };
};