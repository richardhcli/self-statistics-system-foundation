import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlayerStatistics, NodeStats } from './types';
import { updatePlayerStatsState } from './utils/exp-state-manager';
import { indexedDBStorage } from '@/stores/root/persist-middleware';

interface PlayerStatisticsStoreState {
  // PURE DATA (Persisted to IndexedDB)
  stats: PlayerStatistics;

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
  };
}

/**
 * Player Statistics Store (Zustand with Persist Middleware)
 * Manages experience and level tracking for all identified nodes.
 * 
 * Persistence: Automatic via Zustand persist middleware + IndexedDB storage.
 * Local-First Architecture: Writes to IndexedDB immediately (no network wait).
 * 
 * This store is private - access ONLY via hooks:
 * - usePlayerStatistics() - for state selectors
 * - usePlayerStatisticsActions() - for dispatching updates
 */
export const usePlayerStatisticsStore = create<PlayerStatisticsStoreState>()(
  persist(
    (set, get) => ({
    // PURE DATA (will be persisted)
    stats: { progression: { experience: 0, level: 1 } },

    // LOGIC/ACTIONS (never persisted - stable object reference)
    actions: {
      setStats: (stats: PlayerStatistics) => set({ stats }),

      updateStats: (expIncreases: Record<string, number>) => {
        const { nextStats, totalIncrease, levelsGained } = updatePlayerStatsState(
          get().stats,
          expIncreases
        );
        set({ stats: nextStats });
        return { nextStats, totalIncrease, levelsGained };
      },

      addExperience: (nodeLabel: string, amount: number) => {
        return get().actions.updateStats({ [nodeLabel]: amount });
      }
    }
    }),
    {
      name: 'player-statistics-store-v1',
      storage: indexedDBStorage,
      version: 1,
      
      // 🚨 CRITICAL: partialize = data whitelist (zero-function persistence)
      partialize: (state) => ({
        stats: state.stats,
      }),
      
      // Merge function: prioritize code's actions over any persisted junk
      merge: (persistedState: any, currentState: PlayerStatisticsStoreState) => ({
        ...currentState,
        ...persistedState,
        actions: currentState.actions,
      }),
      
      migrate: (state: any, version: number) => {
        if (version !== 1) {
          console.warn('[Player Statistics Store] Schema version mismatch - clearing persisted data');
          return { stats: { progression: { experience: 0, level: 1 } } };
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
