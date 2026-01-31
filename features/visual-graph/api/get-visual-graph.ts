
import { apiClient } from '@/lib/api-client';
import { VisualGraph } from '@/features/visual-graph/types';

/**
 * Fetches the current visual graph state from the remote backend server.
 * @param baseUrl The base URL of the backend API.
 */
export const getVisualGraph = (baseUrl: string): Promise<VisualGraph> => {
  return apiClient(`${baseUrl}/visual-graph`);
};
