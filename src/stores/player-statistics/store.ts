import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loadPlayerStatistics, updatePlayerStatistics } from '@/lib/firebase/player-statistics';
import { auth } from '@/lib/firebase/services';
import { PlayerStatistics } from './types';
import { updatePlayerStatsState } from './utils/exp-state-manager';
import { indexedDBStorage } from '@/stores/root/persist-middleware';

const CACHE_TTL_MS = 1000 * 60 * 5;

const getCurrentUserId = () => auth.currentUser?.uid ?? null;

const isCacheStale = (cacheInfo: { lastFetched: number; isDirty?: boolean } | undefined) => {
  if (!cacheInfo) return true;
  if (cacheInfo.isDirty) return true;
  return Date.now() - cacheInfo.lastFetched > CACHE_TTL_MS;
};

interface PlayerStatisticsMetadata {
  lastFetched: number;
  isDirty?: boolean;
}

interface PlayerStatisticsStoreState {
  // PURE DATA (Persisted to IndexedDB)
  stats: PlayerStatistics;
  metadata: PlayerStatisticsMetadata;

  // LOGIC/ACTIONS (Never persisted - code is source of truth)
  actions: {
    setStats: (stats: PlayerStatistics) => void;
    updateStats: (expIncreases: Record<string, number>) => {
      nextStats: PlayerStatistics;
      totalIncrease: number;
      levelsGained: number;
    };
    addExperience: (nodeLabel: string, amount: number) => {
      totalIncrease: number;
      levelsGained: number;
    };
    invalidateCache: () => void;
    fetchStats: (uid?: string, force?: boolean) => Promise<void>;
  };
}

const DEFAULT_STATS: PlayerStatistics = { progression: { experience: 0, level: 1 } };

const markDirty = (set: (fn: (state: PlayerStatisticsStoreState) => PlayerStatisticsStoreState) => void) => {
  set((state) => ({
    ...state,
    metadata: { ...state.metadata, isDirty: true },
  }));
};

const syncStats = async (
  uid: string,
  stats: PlayerStatistics,
  set: (fn: (state: PlayerStatisticsStoreState) => PlayerStatisticsStoreState) => void
) => {
  try {
    await updatePlayerStatistics(uid, stats);
    set((state) => ({
      ...state,
      metadata: { lastFetched: Date.now(), isDirty: false },
    }));
  } catch (error) {
    console.warn('[Player Statistics Store] Failed to sync stats:', error);
  }
};

/**
 * Player Statistics Store (Zustand with Persist Middleware)
 * Manages experience and level tracking for all identified nodes.
 * 
 * Persistence: Automatic via Zustand persist middleware + IndexedDB storage.
 * Hybrid Read-Aside: Firebase is the source of truth; IndexedDB is the cache.
 * 
 * This store is private - access ONLY via hooks:
 * - usePlayerStatistics() - for state selectors
 * - usePlayerStatisticsActions() - for dispatching updates
 */
export const usePlayerStatisticsStore = create<PlayerStatisticsStoreState>()(
  persist(
    (set, get) => ({
      // PURE DATA (will be persisted)
      stats: DEFAULT_STATS,
      metadata: { lastFetched: 0, isDirty: false },

      // LOGIC/ACTIONS (never persisted - stable object reference)
      actions: {
        setStats: (stats: PlayerStatistics) =>
          set({ stats, metadata: { lastFetched: Date.now(), isDirty: false } }),

        updateStats: (expIncreases: Record<string, number>) => {
          const { nextStats, totalIncrease, levelsGained } = updatePlayerStatsState(
            get().stats,
            expIncreases
          );
          set((state) => ({
            ...state,
            stats: nextStats,
          }));
          markDirty(set);

          const uid = getCurrentUserId();
          if (uid) {
            void syncStats(uid, nextStats, set);
          }

          return { nextStats, totalIncrease, levelsGained };
        },

        addExperience: (nodeLabel: string, amount: number) => {
          return get().actions.updateStats({ [nodeLabel]: amount });
        },

        invalidateCache: () =>
          set((state) => ({
            ...state,
            metadata: { ...state.metadata, isDirty: true },
          })),

        fetchStats: async (uid, force = false) => {
          const resolvedUid = uid ?? getCurrentUserId();
          if (!resolvedUid) return;

          const { metadata } = get();
          if (!force && !isCacheStale(metadata)) return;

          const stats = await loadPlayerStatistics(resolvedUid);
          set({
            stats: stats ?? DEFAULT_STATS,
            metadata: { lastFetched: Date.now(), isDirty: false },
          });
        },
      },
    }),
    {
      name: 'player-statistics-store-v2',
      storage: indexedDBStorage,
      version: 2,

      // 🚨 CRITICAL: partialize = data whitelist (zero-function persistence)
      partialize: (state) => ({
        stats: state.stats,
        metadata: state.metadata,
      }),

      // Merge function: prioritize code's actions over any persisted junk
      merge: (persistedState: any, currentState: PlayerStatisticsStoreState) => ({
        ...currentState,
        ...persistedState,
        actions: currentState.actions,
      }),

      migrate: (state: any, version: number) => {
        if (version !== 2) {
          console.warn('[Player Statistics Store] Schema version mismatch - clearing persisted data');
          return { stats: DEFAULT_STATS, metadata: { lastFetched: 0, isDirty: false } };
        }
        return state;
      },
    }
  )
);

/**
 * State Hook: Returns player statistics using fine-grained selector.
 * Only triggers re-renders when stats change.
 * 
 * Usage:
 * const stats = usePlayerStatistics();
 * const progression = usePlayerStatistics(s => s.progression);
 */
export const usePlayerStatistics = (
  selector?: (state: PlayerStatistics) => any
) => {
  return usePlayerStatisticsStore((state) => {
    if (!selector) return state.stats;
    return selector(state.stats);
  });
};

/**
 * Actions Hook: Returns stable action functions.
 * Components using only this hook will NOT re-render on data changes.
 * 
 * Uses Stable Actions Pattern: state.actions is a single object reference
 * that never changes, preventing unnecessary re-renders.
 * 
 * Usage:
 * const { updateStats, addExperience } = usePlayerStatisticsActions();
 */
export const usePlayerStatisticsActions = () => {
  return usePlayerStatisticsStore((state) => state.actions);
};
