import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { JournalStore, JournalEntryData, JournalYear } from '@/features/journal/types';
import { indexedDBStorage } from '@/lib/persist-middleware';

interface JournalStoreState {
  // State
  entries: JournalStore;

  // Getters
  getEntries: () => JournalStore;
  getEntriesByDate: (date: string) => JournalEntryData | undefined;

  // Actions (nested in stable object for performance)
  actions: {
    setEntries: (entries: JournalStore) => void;
    updateEntry: (dateKey: string, entry: JournalEntryData) => void;
    deleteEntry: (dateKey: string) => void;
    upsertEntry: (dateKey: string, entry: JournalEntryData) => void;
  };
}

/**
 * Journal Store (Zustand with Persist Middleware)
 * Manages all journal entries (historical records of thoughts and actions).
 * 
 * Persistence: Automatic via Zustand persist middleware + IndexedDB storage.
 * Local-First Architecture: Writes to IndexedDB immediately (no network wait).
 * 
 * This store is private - access ONLY via hooks:
 * - useJournal() - for state selectors
 * - useJournalActions() - for dispatching updates
 */
export const useJournalStore = create<JournalStoreState>()(
  persist(
    (set, get) => ({
  entries: {},

  // Getters
  getEntries: () => get().entries,
  getEntriesByDate: (date: string) => {
    const entries = get().entries;
    // Navigate hierarchical structure: YYYY/MM/DD/timeKey
    const parts = date.split('/');
    if (parts.length !== 4) return undefined;
    
    const [year, month, day, timeKey] = parts;
    return entries[year]?.[month]?.[day]?.[timeKey];
  },

  // Actions (stable object reference - never recreated)
  actions: {
    setEntries: (entries: JournalStore) => set({ entries }),
    
    updateEntry: (dateKey: string, entry: JournalEntryData) => {
      set((state) => {
        const parts = dateKey.split('/');
        if (parts.length !== 4) return state;

        const [year, month, day, timeKey] = parts;
        const next = { ...state.entries };
        
        if (!next[year]) next[year] = {};
        if (!next[year][month]) next[year][month] = {};
        if (!next[year][month][day]) next[year][month][day] = {};
        
        next[year][month][day][timeKey] = entry;
        return { entries: next };
      });
    },

    deleteEntry: (dateKey: string) => {
      set((state) => {
        const parts = dateKey.split('/');
        if (parts.length !== 4) return state;

        const [year, month, day, timeKey] = parts;
        const next = { ...state.entries };
        
        if (next[year]?.[month]?.[day]) {
          const dayEntries = { ...next[year][month][day] };
          delete dayEntries[timeKey];
          next[year][month][day] = dayEntries;
        }
        
        return { entries: next };
      });
    },

    upsertEntry: (dateKey: string, entry: JournalEntryData) => {
      set((state) => {
        const parts = dateKey.split('/');
        if (parts.length !== 4) return state;

        const [year, month, day, timeKey] = parts;
        const next = { ...state.entries };
        
        if (!next[year]) next[year] = {};
        if (!next[year][month]) next[year][month] = {};
        if (!next[year][month][day]) next[year][month][day] = {};
        
        next[year][month][day][timeKey] = {
          ...(next[year][month][day][timeKey] || {}),
          ...entry
        };
        
        return { entries: next };
      });
    }
  }
    }),
    {
      name: 'journal-store-v1',
      storage: indexedDBStorage,
      version: 1,
      // For future migrations: transform state for schema changes
      migrate: (state: any, version: number) => {
        // If version mismatch, clear data (will be re-initialized on next app start)
        if (version !== 1) {
          console.warn('[Journal Store] Schema version mismatch - clearing persisted data');
          return { entries: {} };
        }
        return state;
      },
    }
  )
);

/**
 * State Hook: Returns journal entries using fine-grained selector.
 * Only triggers re-renders when entries change.
 */
export const useJournal = (selector?: (state: JournalStore) => any) => {
  return useJournalStore((state) => {
    if (!selector) return state.entries;
    return selector(state.entries);
  });
};

/**
 * Actions Hook: Returns stable action functions.
 * Components using only this hook will NOT re-render on data changes.
 * 
 * Uses Stable Actions Pattern: state.actions is a single object reference
 * that never changes, preventing unnecessary re-renders.
 */
export const useJournalActions = () => {
  return useJournalStore((state) => state.actions);
};
