import { useUserIntegrationsStore } from './store';
import { IntegrationStore } from '@/features/integration/types';

/**
 * API: Fetch user integrations for serialization/remote sync.
 */
export const getUserIntegrations = (): IntegrationStore => {
  return useUserIntegrationsStore.getState().getIntegrations();
};

/**
 * API: Load user integrations from storage/backend.
 */
export const setUserIntegrations = (integrations: IntegrationStore): void => {
  useUserIntegrationsStore.getState().actions.setIntegrations(integrations);
};

export { useUserIntegrations, useUserIntegrationsActions } from './store';
