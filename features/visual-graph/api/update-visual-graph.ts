
import { apiClient } from '@/lib/api-client';
import { VisualGraph } from '@/features/visual-graph/types';

/**
 * Persists the current visual graph state to the remote backend server.
 * @param baseUrl The base URL of the backend API.
 * @param visualGraph The visual graph object to persist.
 */
export const updateVisualGraph = (baseUrl: string, visualGraph: VisualGraph): Promise<void> => {
  return apiClient(`${baseUrl}/visual-graph`, {
    data: visualGraph,
    method: 'POST',
  });
};
