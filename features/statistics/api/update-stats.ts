
import { apiClient } from '@/lib/api-client';
// Import PlayerStatistics from the centralized types hub
import { PlayerStatistics } from '@/types';

/**
 * Persists current player statistics to the remote backend server.
 * @param baseUrl The base URL of the backend API.
 * @param stats The statistics object to persist.
 */
export const updateStats = (baseUrl: string, stats: PlayerStatistics): Promise<void> => {
  return apiClient(`${baseUrl}/player-statistics`, {
    data: stats,
    method: 'POST',
  });
};