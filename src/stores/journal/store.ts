import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { JournalStore, JournalEntryData, JournalYear } from '@/features/journal/types';
import { indexedDBStorage } from '@/lib/persist-middleware';

interface JournalStoreState {
  // PURE DATA (Persisted to IndexedDB)
  entries: JournalStore;

  // LOGIC/ACTIONS (Never persisted - code is source of truth)
  actions: {
    setEntries: (entries: JournalStore) => void;
    updateEntry: (dateKey: string, entry: JournalEntryData) => void;
    deleteEntry: (dateKey: string) => void;
    upsertEntry: (dateKey: string, entry: JournalEntryData) => void;
    // Getters moved here - they're logic, not data
    getEntries: () => JournalStore;
    getEntriesByDate: (date: string) => JournalEntryData | undefined;
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
  // PURE DATA (will be persisted)
  entries: {},

  // LOGIC/ACTIONS (never persisted - stable object reference)
  actions: {
    setEntries: (entries: JournalStore) => set({ entries }),
    
    // Getters - logic functions, not state
    getEntries: () => get().entries,
    getEntriesByDate: (date: string) => {
      const entries = get().entries;
      const parts = date.split('/');
      if (parts.length !== 4) return undefined;
      const [year, month, day, timeKey] = parts;
      return entries[year]?.[month]?.[day]?.[timeKey];
    },
    
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
      
      // 🚨 CRITICAL: partialize = data whitelist (zero-function persistence)
      // Only serialize data, never actions/getters
      partialize: (state) => ({
        entries: state.entries,
      }),
      
      // Merge function: prioritize code's actions over any persisted junk
      merge: (persistedState: any, currentState: JournalStoreState) => ({
        ...currentState,
        ...persistedState,
        actions: currentState.actions, // Always use fresh actions from code
      }),
      
      migrate: (state: any, version: number) => {
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
