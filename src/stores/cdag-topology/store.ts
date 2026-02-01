import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CdagTopology, CdagNodeData } from './types';
import { mergeTopology as mergeTopologyUtil } from '@/lib/soulTopology';
import { indexedDBStorage } from '@/lib/persist-middleware';

interface CdagTopologyStoreState {
  // State
  topology: CdagTopology;

  // Getters
  getTopology: () => CdagTopology;
  getNode: (label: string) => CdagNodeData | undefined;
  getAllNodes: () => string[];

  // Actions (nested in stable object for performance)
  actions: {
    setTopology: (topology: CdagTopology) => void;
    upsertNode: (label: string, nodeData: CdagNodeData) => void;
    deleteNode: (label: string) => void;
    mergeTopology: (newTopology: CdagTopology) => void;
  };
}

/**
 * CDAG Topology Store (Zustand with Persist Middleware)
 * Manages the logical hierarchical structure (The Second Brain core).
 * 
 * Persistence: Automatic via Zustand persist middleware + IndexedDB storage.
 * Local-First Architecture: Writes to IndexedDB immediately (no network wait).
 * 
 * This store is private - access ONLY via hooks:
 * - useCdagTopology() - for state selectors
 * - useCdagTopologyActions() - for dispatching updates
 */
export const useCdagTopologyStore = create<CdagTopologyStoreState>()(
  persist(
    (set, get) => ({
    topology: {
      progression: { parents: {}, type: 'characteristic' },
    },

    // Getters
    getTopology: () => get().topology,
    getNode: (label: string) => get().topology[label],
    getAllNodes: () => Object.keys(get().topology),

    // Actions (stable object reference - never recreated)
    actions: {
      setTopology: (topology: CdagTopology) => set({ topology }),

      upsertNode: (label: string, nodeData: CdagNodeData) => {
        set((state) => ({
          topology: {
            ...state.topology,
            [label]: nodeData,
          },
        }));
      },

      deleteNode: (label: string) => {
        set((state) => {
          const next = { ...state.topology };
          delete next[label];
          return { topology: next };
        });
      },

      mergeTopology: (newTopology: CdagTopology) => {
        set((state) => ({
          topology: mergeTopologyUtil(state.topology, newTopology),
        }));
      }
    }
    }),
    {
      name: 'cdag-topology-store-v1',
      storage: indexedDBStorage,
      version: 1,
      migrate: (state: any, version: number) => {
        if (version !== 1) {
          console.warn('[CDAG Topology Store] Schema version mismatch - clearing persisted data');
          return { topology: { progression: { parents: {}, type: 'characteristic' } } };
        }
        return state;
      },
    }
  )
);

/**
 * State Hook: Returns CDAG topology using fine-grained selector.
 * Only triggers re-renders when topology changes.
 * 
 * Usage:
 * const topology = useCdagTopology();
 * const progression = useCdagTopology(t => t.progression);
 */
export const useCdagTopology = (
  selector?: (state: CdagTopology) => any
) => {
  return useCdagTopologyStore((state) => {
    if (!selector) return state.topology;
    return selector(state.topology);
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
 * const { upsertNode, mergeTopology } = useCdagTopologyActions();
 */
export const useCdagTopologyActions = () => {
  return useCdagTopologyStore((state) => state.actions);
};
