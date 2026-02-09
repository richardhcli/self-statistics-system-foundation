import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loadAISettings, updateAISettings } from '@/lib/firebase/user-profile';
import { auth } from '@/lib/firebase/services';
import { indexedDBStorage } from '@/stores/root/persist-middleware';

const CACHE_TTL_MS = 1000 * 60 * 5;

const getCurrentUserId = () => auth.currentUser?.uid ?? null;

const isCacheStale = (cacheInfo: { lastFetched: number; isDirty?: boolean } | undefined) => {
  if (!cacheInfo) return true;
  if (cacheInfo.isDirty) return true;
  return Date.now() - cacheInfo.lastFetched > CACHE_TTL_MS;
};

export interface AIConfig {
  provider: 'gemini' | 'openai';
  model: {
    voiceTranscriptionModel: string;
    abstractionModel: string;
  };
  temperature: number;
  maxTokens: number;
  apiKey?: string;
}

interface AIConfigMetadata {
  lastFetched: number;
  isDirty?: boolean;
}

interface AIConfigStoreState {
  // PURE DATA (Persisted to IndexedDB)
  config: AIConfig;
  metadata: AIConfigMetadata;

  // LOGIC/ACTIONS (Never persisted - code is source of truth)
  actions: {
    setConfig: (config: AIConfig) => void;
    updateProvider: (provider: AIConfig['provider']) => void;
    updateVoiceTranscriptionModel: (model: string) => void;
    updateAbstractionModel: (model: string) => void;
    updateTemperature: (temperature: number) => void;
    updateMaxTokens: (maxTokens: number) => void;
    updateApiKey: (apiKey: string) => void;
    invalidateCache: () => void;
    fetchConfig: (uid?: string, force?: boolean) => Promise<void>;
  };
}

const DEFAULT_CONFIG: AIConfig = {
  provider: 'gemini',
  model: {
    voiceTranscriptionModel: 'gemini-2-flash',
    abstractionModel: 'gemini-3-flash',
  },
  temperature: 0,
  maxTokens: 2048,
  apiKey: '',
};

const markDirty = (set: (fn: (state: AIConfigStoreState) => AIConfigStoreState) => void) => {
  set((state) => ({
    ...state,
    metadata: { ...state.metadata, isDirty: true },
  }));
};

const syncConfig = async (uid: string, config: AIConfig, set: (fn: (state: AIConfigStoreState) => AIConfigStoreState) => void) => {
  try {
    await updateAISettings(uid, config);
    set((state) => ({
      ...state,
      metadata: { lastFetched: Date.now(), isDirty: false },
    }));
  } catch (error) {
    console.warn('[AI Config Store] Failed to sync config:', error);
  }
};

/**
 * AI Config Store (Zustand with Persist Middleware)
 * Manages AI processing configurations (provider, models, temperature, API key).
 * 
 * Persistence: Automatic via Zustand persist middleware + IndexedDB storage.
 * Hybrid Read-Aside: Firebase is the source of truth; IndexedDB is the cache.
 * 
 * This store is private - access ONLY via hooks:
 * - useAiConfig() - for state selectors
 * - useAiConfigActions() - for dispatching updates
 */
export const useAiConfigStore = create<AIConfigStoreState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      metadata: { lastFetched: 0, isDirty: false },

      // LOGIC/ACTIONS (never persisted - stable object reference)
      actions: {
        setConfig: (config: AIConfig) =>
          set({ config, metadata: { lastFetched: Date.now(), isDirty: false } }),

        updateProvider: (provider: AIConfig['provider']) => {
          set((state) => ({
            ...state,
            config: { ...state.config, provider },
          }));
          markDirty(set);

          const uid = getCurrentUserId();
          if (uid) {
            void syncConfig(uid, { ...get().config, provider }, set);
          }
        },

        updateVoiceTranscriptionModel: (model: string) => {
          set((state) => ({
            ...state,
            config: {
              ...state.config,
              model: { ...state.config.model, voiceTranscriptionModel: model },
            },
          }));
          markDirty(set);

          const uid = getCurrentUserId();
          if (uid) {
            void syncConfig(uid, { ...get().config, model: { ...get().config.model, voiceTranscriptionModel: model } }, set);
          }
        },

        updateAbstractionModel: (model: string) => {
          set((state) => ({
            ...state,
            config: {
              ...state.config,
              model: { ...state.config.model, abstractionModel: model },
            },
          }));
          markDirty(set);

          const uid = getCurrentUserId();
          if (uid) {
            void syncConfig(uid, { ...get().config, model: { ...get().config.model, abstractionModel: model } }, set);
          }
        },

        updateTemperature: (temperature: number) => {
          set((state) => ({
            ...state,
            config: { ...state.config, temperature },
          }));
          markDirty(set);

          const uid = getCurrentUserId();
          if (uid) {
            void syncConfig(uid, { ...get().config, temperature }, set);
          }
        },

        updateMaxTokens: (maxTokens: number) => {
          set((state) => ({
            ...state,
            config: { ...state.config, maxTokens },
          }));
          markDirty(set);

          const uid = getCurrentUserId();
          if (uid) {
            void syncConfig(uid, { ...get().config, maxTokens }, set);
          }
        },

        updateApiKey: (apiKey: string) => {
          set((state) => ({
            ...state,
            config: { ...state.config, apiKey },
          }));
          markDirty(set);

          const uid = getCurrentUserId();
          if (uid) {
            void syncConfig(uid, { ...get().config, apiKey }, set);
          }
        },

        invalidateCache: () =>
          set((state) => ({
            ...state,
            metadata: { ...state.metadata, isDirty: true },
          })),

        fetchConfig: async (uid, force = false) => {
          const resolvedUid = uid ?? getCurrentUserId();
          if (!resolvedUid) return;

          const { metadata } = get();
          if (!force && !isCacheStale(metadata)) return;

          const config = await loadAISettings(resolvedUid);
          set({
            config: {
              ...DEFAULT_CONFIG,
              ...config,
              apiKey: config.apiKey ?? '',
            },
            metadata: { lastFetched: Date.now(), isDirty: false },
          });
        },
      },
    }),
    {
      name: 'ai-config-store-v2',
      storage: indexedDBStorage,
      version: 2,
      // 🚨 CRITICAL: partialize = data whitelist (zero-function persistence)
      partialize: (state) => ({
        config: state.config,
        metadata: state.metadata,
      }),
      // Merge function: prioritize code's actions over any persisted junk
      merge: (persistedState: any, currentState: AIConfigStoreState) => ({
        ...currentState,
        ...persistedState,
        actions: currentState.actions,
      }),
      migrate: (state: any, version: number) => {
        if (version !== 2) {
          console.warn('[AI Config Store] Schema version mismatch - clearing persisted data');
          return {
            config: DEFAULT_CONFIG,
            metadata: { lastFetched: 0, isDirty: false },
          };
        }
        return state;
      },
    }
  )
);

/**
 * State Hook: Returns AI config using fine-grained selector.
 * Only triggers re-renders when config changes.
 * 
 * Usage:
 * const config = useAiConfig();
 * const model = useAiConfig(s => s.model);
 */
export const useAiConfig = (selector?: (state: AIConfig) => any) => {
  return useAiConfigStore((state) => {
    if (!selector) return state.config;
    return selector(state.config);
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
 * const { updateAbstractionModel, updateTemperature } = useAiConfigActions();
 */
export const useAiConfigActions = () => {
  return useAiConfigStore((state) => state.actions);
};
