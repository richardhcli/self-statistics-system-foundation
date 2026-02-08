import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchMonthEntries as fetchMonthEntriesFromFirebase } from '@/lib/firebase/journal';
import { indexedDBStorage } from '@/stores/root/persist-middleware';
import type {
  JournalCacheInfo,
  JournalEntryData,
  JournalPersistedState,
  JournalTreeStructure,
} from './types';

const CACHE_TTL_MS = 1000 * 60 * 5;

const mergeTreeStructure = (
  current: JournalTreeStructure,
  update: Partial<JournalTreeStructure>
): JournalTreeStructure => {
  const next: JournalTreeStructure = { ...current };

  Object.entries(update).forEach(([year, yearValue]) => {
    if (!yearValue) return;

    const existingYear = next[year] ?? { totalExp: 0, months: {} };
    const nextMonths = { ...existingYear.months };

    Object.entries(yearValue.months ?? {}).forEach(([month, monthValue]) => {
      if (!monthValue) return;

      const existingMonth = nextMonths[month] ?? { totalExp: 0, days: {} };
      const nextDays = { ...existingMonth.days };

      Object.entries(monthValue.days ?? {}).forEach(([day, dayValue]) => {
        if (!dayValue) return;
        const existingDay = nextDays[day] ?? { totalExp: 0, entries: [] };
        nextDays[day] = {
          totalExp: dayValue.totalExp ?? existingDay.totalExp,
          entries: dayValue.entries ?? existingDay.entries,
        };
      });

      nextMonths[month] = {
        totalExp: monthValue.totalExp ?? existingMonth.totalExp,
        days: nextDays,
      };
    });

    next[year] = {
      totalExp: yearValue.totalExp ?? existingYear.totalExp,
      months: nextMonths,
    };
  });

  return next;
};

const isCacheStale = (cacheInfo: JournalCacheInfo | undefined, now: number): boolean => {
  if (!cacheInfo) return true;
  if (cacheInfo.isDirty) return true;
  return now - cacheInfo.lastFetched > CACHE_TTL_MS;
};

interface JournalStoreState {
  entries: Record<string, JournalEntryData>;
  tree: JournalTreeStructure;
  metadata: Record<string, JournalCacheInfo>;

  actions: {
    setSnapshot: (snapshot: JournalPersistedState) => void;
    setTree: (tree: JournalTreeStructure) => void;
    cacheEntries: (entries: JournalEntryData[]) => void;
    upsertEntry: (entryId: string, entry: JournalEntryData) => void;
    updateEntry: (entryId: string, updates: Partial<JournalEntryData>) => void;
    removeEntry: (entryId: string) => void;
    optimisticAdd: (entry: JournalEntryData, treeUpdate?: Partial<JournalTreeStructure>) => void;
    invalidateCache: (cacheKey: string) => void;
    fetchMonthEntries: (uid: string, year: string, month: string, force?: boolean) => Promise<void>;
  };
}

/**
 * Journal Store (Zustand with Persist Middleware)
 *
 * Firebase is the source of truth. Zustand + IndexedDB act as a read-aside cache.
 * Access ONLY via hooks:
 * - useJournalEntries / useJournalTree / useJournalMetadata
 * - useJournalActions
 */
export const useJournalStore = create<JournalStoreState>()(
  persist(
    (set, get) => ({
      entries: {},
      tree: {},
      metadata: {},

      actions: {
        setSnapshot: (snapshot: JournalPersistedState) =>
          set({
            entries: snapshot.entries ?? {},
            tree: snapshot.tree ?? {},
            metadata: snapshot.metadata ?? {},
          }),

        setTree: (tree: JournalTreeStructure) => set({ tree }),

        cacheEntries: (entries: JournalEntryData[]) =>
          set((state) => {
            const nextEntries = { ...state.entries };
            entries.forEach((entry) => {
              nextEntries[entry.id] = entry;
            });
            return { entries: nextEntries };
          }),

        upsertEntry: (entryId: string, entry: JournalEntryData) =>
          set((state) => ({
            entries: {
              ...state.entries,
              [entryId]: entry,
            },
          })),

        updateEntry: (entryId: string, updates: Partial<JournalEntryData>) =>
          set((state) => {
            const existing = state.entries[entryId];
            if (!existing) {
              console.warn('[Journal Store] updateEntry skipped (missing entry):', entryId);
              return state;
            }

            return {
              entries: {
                ...state.entries,
                [entryId]: { ...existing, ...updates, id: entryId },
              },
            };
          }),

        removeEntry: (entryId: string) =>
          set((state) => {
            if (!state.entries[entryId]) return state;
            const nextEntries = { ...state.entries };
            delete nextEntries[entryId];
            return { entries: nextEntries };
          }),

        optimisticAdd: (entry: JournalEntryData, treeUpdate?: Partial<JournalTreeStructure>) =>
          set((state) => ({
            entries: {
              ...state.entries,
              [entry.id]: entry,
            },
            tree: treeUpdate ? mergeTreeStructure(state.tree, treeUpdate) : state.tree,
          })),

        invalidateCache: (cacheKey: string) =>
          set((state) => ({
            metadata: {
              ...state.metadata,
              [cacheKey]: {
                lastFetched: state.metadata[cacheKey]?.lastFetched ?? 0,
                isDirty: true,
              },
            },
          })),

        fetchMonthEntries: async (uid: string, year: string, month: string, force = false) => {
          const cacheKey = `${year}-${String(month).padStart(2, '0')}`;
          const { metadata } = get();
          const now = Date.now();

          if (!force && !isCacheStale(metadata[cacheKey], now)) {
            return;
          }

          const entries = await fetchMonthEntriesFromFirebase(uid, year, month);

          set((state) => {
            const nextEntries = { ...state.entries };
            entries.forEach((entry) => {
              nextEntries[entry.id] = entry;
            });

            return {
              entries: nextEntries,
              metadata: {
                ...state.metadata,
                [cacheKey]: {
                  lastFetched: now,
                  isDirty: false,
                },
              },
            };
          });
        },
      },
    }),
    {
      name: 'journal-store-v2',
      storage: indexedDBStorage,
      version: 2,

      partialize: (state) => ({
        entries: state.entries,
        tree: state.tree,
        metadata: state.metadata,
      }),

      merge: (persistedState: any, currentState: JournalStoreState) => ({
        ...currentState,
        ...persistedState,
        actions: currentState.actions,
      }),

      migrate: (state: any, version: number) => {
        if (version !== 2) {
          console.warn('[Journal Store] Schema version mismatch - clearing persisted data');
          return { entries: {}, tree: {}, metadata: {} };
        }
        return state;
      },
    }
  )
);

/**
 * State Hooks: Fine-grained selectors for journal state.
 */
export const useJournalEntries = () => useJournalStore((state) => state.entries);
export const useJournalTree = () => useJournalStore((state) => state.tree);
export const useJournalMetadata = () => useJournalStore((state) => state.metadata);

/**
 * Actions Hook: Returns stable action functions.
 */
export const useJournalActions = () => useJournalStore((state) => state.actions);
