import { useAiConfigStore } from './store';
import { AIConfig } from './store';

/**
 * API: Fetch AI config for serialization/remote sync.
 */
export const getAiConfig = (): AIConfig => {
  return useAiConfigStore.getState().getConfig();
};

/**
 * API: Load AI config from storage/backend.
 */
export const setAiConfig = (config: AIConfig): void => {
  useAiConfigStore.getState().actions.setConfig(config);
};

export { useAiConfig, useAiConfigActions } from './store';
export type { AIConfig } from './store';
