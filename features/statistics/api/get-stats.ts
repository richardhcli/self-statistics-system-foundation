
import { apiClient } from '@/lib/api-client';
// Import PlayerStatistics from the centralized types hub
import { PlayerStatistics } from '@/types';

/**
 * Fetches player statistics (experience/levels) from the remote backend server.
 * @param baseUrl The base URL of the backend API.
 */
export const getStats = (baseUrl: string): Promise<PlayerStatistics> => {
  return apiClient(`${baseUrl}/player-statistics`);
};