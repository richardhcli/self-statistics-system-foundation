import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { indexedDBStorage } from '@/lib/persist-middleware';

export interface AIConfig {
  model: string;
  temperature: number;
  liveTranscription: boolean;
  voiceSensitivity: number;
  apiKey?: string;
}

interface AIConfigStoreState {
  // PURE DATA (Persisted to IndexedDB)
  config: AIConfig;

  // LOGIC/ACTIONS (Never persisted - code is source of truth)
  actions: {
    setConfig: (config: AIConfig) => void;
    updateModel: (model: string) => void;
    updateTemperature: (temperature: number) => void;
    updateVoiceSettings: (liveTranscription: boolean, sensitivity: number) => void;
    updateApiKey: (apiKey: string) => void;
  };
}

/**
 * AI Config Store (Zustand with Persist Middleware)
 * Manages AI processing configurations (model, temperature, voice settings).
 * 
 * Persistence: Automatic via Zustand persist middleware + IndexedDB storage.
 * Local-First Architecture: Writes to IndexedDB immediately (no network wait).
 * 
 * This store is private - access ONLY via hooks:
 * - useAiConfig() - for state selectors
 * - useAiConfigActions() - for dispatching updates
 */
export const useAiConfigStore = create<AIConfigStoreState>()(
  persist(
    (set, get) => ({
  config: {
    model: 'gemini-3-flash-preview',
    temperature: 0,
    liveTranscription: true,
    voiceSensitivity: 0.5,
  },

  // LOGIC/ACTIONS (never persisted - stable object reference)
  actions: {
    setConfig: (config: AIConfig) => set({ config }),

    updateModel: (model: string) => {
      set((state) => ({
        config: { ...state.config, model },
      }));
    },

    updateTemperature: (temperature: number) => {
      set((state) => ({
        config: { ...state.config, temperature },
      }));
    },

    updateVoiceSettings: (
      liveTranscription: boolean,
      voiceSensitivity: number
    ) => {
      set((state) => ({
        config: { ...state.config, liveTranscription, voiceSensitivity },
      }));
    },

    updateApiKey: (apiKey: string) => {
      set((state) => ({
        config: { ...state.config, apiKey },
      }));
    }
  }
    }),
    {
      name: 'ai-config-store-v1',
      storage: indexedDBStorage,
      version: 1,
      migrate: (state: any, version: number) => {
        if (version !== 1) {
          console.warn('[AI Config Store] Schema version mismatch - clearing persisted data');
          return {
            config: {
              model: 'gemini-3-flash-preview',
              temperature: 0,
              liveTranscription: true,
              voiceSensitivity: 0.5,
            },
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
 * const { updateModel, updateTemperature } = useAiConfigActions();
 */
export const useAiConfigActions = () => {
  return useAiConfigStore((state) => state.actions);
};
