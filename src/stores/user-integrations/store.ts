import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IntegrationStore, IntegrationLog, IntegrationConfig, ObsidianConfig } from '@/features/integration/types';
import { indexedDBStorage } from '@/lib/persist-middleware';

interface UserIntegrationsStoreState {
  // PURE DATA (Persisted to IndexedDB)
  integrations: IntegrationStore;

  // LOGIC/ACTIONS (Never persisted - code is source of truth)
  actions: {
    setIntegrations: (integrations: IntegrationStore) => void;
    updateConfig: (config: IntegrationConfig) => void;
    updateObsidianConfig: (config: ObsidianConfig) => void;
    addLog: (log: IntegrationLog) => void;
    clearLogs: () => void;
    // Getters moved here - they're logic, not data
    getIntegrations: () => IntegrationStore;
    getConfig: () => IntegrationConfig;
    getObsidianConfig: () => ObsidianConfig;
    getLogs: () => IntegrationLog[];
  };
}

/**
 * User Integrations Store (Zustand with Persist Middleware)
 * Manages external API integration settings and event logs.
 * 
 * Persistence: Automatic via Zustand persist middleware + IndexedDB storage.
 * Local-First Architecture: Writes to IndexedDB immediately (no network wait).
 * 
 * This store is private - access ONLY via hooks:
 * - useUserIntegrations() - for state selectors
 * - useUserIntegrationsActions() - for dispatching updates
 */
export const useUserIntegrationsStore = create<UserIntegrationsStoreState>()(
  persist(
    (set, get) => ({
    // PURE DATA (will be persisted)
    integrations: {
      config: { webhookUrl: '', enabled: false },
      obsidianConfig: {
        enabled: false,
        host: '127.0.0.1',
        port: '27124',
        apiKey: '',
        useHttps: false,
        targetFolder: 'Journal/AI',
      },
      logs: [],
    },

    // LOGIC/ACTIONS (never persisted - stable object reference)
    actions: {
      setIntegrations: (integrations: IntegrationStore) => set({ integrations }),

      // Getters - logic functions, not state
      getIntegrations: () => get().integrations,
      getConfig: () => get().integrations.config,
      getObsidianConfig: () => get().integrations.obsidianConfig,
      getLogs: () => get().integrations.logs,

      updateConfig: (config: IntegrationConfig) => {
        set((state) => ({
          integrations: { ...state.integrations, config },
        }));
      },

      updateObsidianConfig: (obsidianConfig: ObsidianConfig) => {
        set((state) => ({
          integrations: { ...state.integrations, obsidianConfig },
        }));
      },

      addLog: (log: IntegrationLog) => {
        set((state) => ({
          integrations: {
            ...state.integrations,
            logs: [...state.integrations.logs, log],
          },
        }));
      },

      clearLogs: () => {
        set((state) => ({
          integrations: { ...state.integrations, logs: [] },
        }));
      }
    }
    }),
    {
      name: 'user-integrations-store-v1',
      storage: indexedDBStorage,
      version: 1,
      
      // 🚨 CRITICAL: partialize = data whitelist (zero-function persistence)
      partialize: (state) => ({
        integrations: state.integrations,
      }),
      
      // Merge function: prioritize code's actions over any persisted junk
      merge: (persistedState: any, currentState: UserIntegrationsStoreState) => ({
        ...currentState,
        ...persistedState,
        actions: currentState.actions,
      }),
      
      migrate: (state: any, version: number) => {
        if (version !== 1) {
          console.warn('[User Integrations Store] Schema version mismatch - clearing persisted data');
          return {
            integrations: {
              config: { webhookUrl: '', enabled: false },
              obsidianConfig: {
                enabled: false,
                host: '127.0.0.1',
                port: '27124',
                apiKey: '',
                useHttps: false,
                targetFolder: 'Journal/AI',
              },
              logs: [],
            },
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
