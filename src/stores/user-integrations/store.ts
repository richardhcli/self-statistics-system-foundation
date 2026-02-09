import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loadIntegrationSettings, updateIntegrationSettings } from '@/lib/firebase/user-profile';
import { auth } from '@/lib/firebase/services';
import { IntegrationStore, IntegrationLog, IntegrationConfig, ObsidianConfig } from '@/features/integration/types';
import { indexedDBStorage } from '@/stores/root/persist-middleware';

const CACHE_TTL_MS = 1000 * 60 * 5;

const getCurrentUserId = () => auth.currentUser?.uid ?? null;

const isCacheStale = (cacheInfo: { lastFetched: number; isDirty?: boolean } | undefined) => {
  if (!cacheInfo) return true;
  if (cacheInfo.isDirty) return true;
  return Date.now() - cacheInfo.lastFetched > CACHE_TTL_MS;
};

interface UserIntegrationsMetadata {
  lastFetched: number;
  isDirty?: boolean;
}

interface UserIntegrationsStoreState {
  // PURE DATA (Persisted to IndexedDB)
  integrations: IntegrationStore;
  metadata: UserIntegrationsMetadata;

  // LOGIC/ACTIONS (Never persisted - code is source of truth)
  actions: {
    setIntegrations: (integrations: IntegrationStore) => void;
    updateConfig: (config: IntegrationConfig) => void;
    updateObsidianConfig: (config: ObsidianConfig) => void;
    addLog: (log: IntegrationLog) => void;
    clearLogs: () => void;
    invalidateCache: () => void;
    fetchIntegrations: (uid?: string, force?: boolean) => Promise<void>;
  };
}

const DEFAULT_INTEGRATIONS: IntegrationStore = {
  config: { webhookUrl: '', enabled: false, secret: '' },
  obsidianConfig: {
    enabled: false,
    host: '127.0.0.1',
    port: '27124',
    apiKey: '',
    useHttps: false,
    targetFolder: 'Journal/AI',
  },
  logs: [],
};

const markDirty = (set: (fn: (state: UserIntegrationsStoreState) => UserIntegrationsStoreState) => void) => {
  set((state) => ({
    ...state,
    metadata: { ...state.metadata, isDirty: true },
  }));
};

const syncIntegrations = async (
  uid: string,
  integrations: IntegrationStore,
  set: (fn: (state: UserIntegrationsStoreState) => UserIntegrationsStoreState) => void
) => {
  try {
    await updateIntegrationSettings(uid, integrations);
    set((state) => ({
      ...state,
      metadata: { lastFetched: Date.now(), isDirty: false },
    }));
  } catch (error) {
    console.warn('[User Integrations Store] Failed to sync integrations:', error);
  }
};

/**
 * User Integrations Store (Zustand with Persist Middleware)
 * Manages external API integration settings and event logs.
 * 
 * Persistence: Automatic via Zustand persist middleware + IndexedDB storage.
 * Hybrid Read-Aside: Firebase is the source of truth; IndexedDB is the cache.
 * 
 * This store is private - access ONLY via hooks:
 * - useUserIntegrations() - for state selectors
 * - useUserIntegrationsActions() - for dispatching updates
 */
export const useUserIntegrationsStore = create<UserIntegrationsStoreState>()(
  persist(
    (set, get) => ({
      // PURE DATA (will be persisted)
      integrations: DEFAULT_INTEGRATIONS,
      metadata: { lastFetched: 0, isDirty: false },

      // LOGIC/ACTIONS (never persisted - stable object reference)
      actions: {
        setIntegrations: (integrations: IntegrationStore) =>
          set({ integrations, metadata: { lastFetched: Date.now(), isDirty: false } }),

        updateConfig: (config: IntegrationConfig) => {
          set((state) => ({
            ...state,
            integrations: { ...state.integrations, config },
          }));
          markDirty(set);

          const uid = getCurrentUserId();
          if (uid) {
            void syncIntegrations(uid, { ...get().integrations, config }, set);
          }
        },

        updateObsidianConfig: (obsidianConfig: ObsidianConfig) => {
          set((state) => ({
            ...state,
            integrations: { ...state.integrations, obsidianConfig },
          }));
          markDirty(set);

          const uid = getCurrentUserId();
          if (uid) {
            void syncIntegrations(uid, { ...get().integrations, obsidianConfig }, set);
          }
        },

        addLog: (log: IntegrationLog) => {
          const nextIntegrations = {
            ...get().integrations,
            logs: [...get().integrations.logs, log],
          };
          set((state) => ({
            ...state,
            integrations: nextIntegrations,
          }));
          markDirty(set);

          const uid = getCurrentUserId();
          if (uid) {
            void syncIntegrations(uid, nextIntegrations, set);
          }
        },

        clearLogs: () => {
          set((state) => ({
            ...state,
            integrations: { ...state.integrations, logs: [] },
          }));
          markDirty(set);

          const uid = getCurrentUserId();
          if (uid) {
            void syncIntegrations(uid, { ...get().integrations, logs: [] }, set);
          }
        },

        invalidateCache: () =>
          set((state) => ({
            ...state,
            metadata: { ...state.metadata, isDirty: true },
          })),

        fetchIntegrations: async (uid, force = false) => {
          const resolvedUid = uid ?? getCurrentUserId();
          if (!resolvedUid) return;

          const { metadata } = get();
          if (!force && !isCacheStale(metadata)) return;

          const integrations = await loadIntegrationSettings(resolvedUid);
          set({
            integrations: integrations ?? DEFAULT_INTEGRATIONS,
            metadata: { lastFetched: Date.now(), isDirty: false },
          });
        },
      },
    }),
    {
      name: 'user-integrations-store-v2',
      storage: indexedDBStorage,
      version: 2,

      // 🚨 CRITICAL: partialize = data whitelist (zero-function persistence)
      partialize: (state) => ({
        integrations: state.integrations,
        metadata: state.metadata,
      }),

      // Merge function: prioritize code's actions over any persisted junk
      merge: (persistedState: any, currentState: UserIntegrationsStoreState) => ({
        ...currentState,
        ...persistedState,
        actions: currentState.actions,
      }),

      migrate: (state: any, version: number) => {
        if (version !== 2) {
          console.warn('[User Integrations Store] Schema version mismatch - clearing persisted data');
          return {
            integrations: DEFAULT_INTEGRATIONS,
            metadata: { lastFetched: 0, isDirty: false },
          };
        }
        return state;
      },
    }
  )
);

/**
 * State Hook: Returns user integrations using fine-grained selector.
 * Only triggers re-renders when integrations change.
 * 
 * Usage:
 * const integrations = useUserIntegrations();
 * const config = useUserIntegrations(s => s.config);
 */
export const useUserIntegrations = (
  selector?: (state: IntegrationStore) => any
) => {
  return useUserIntegrationsStore((state) => {
    if (!selector) return state.integrations;
    return selector(state.integrations);
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
 * const { updateConfig, addLog } = useUserIntegrationsActions();
 */
export const useUserIntegrationsActions = () => {
  return useUserIntegrationsStore((state) => state.actions);
};
