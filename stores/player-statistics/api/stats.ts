
import { apiClient } from '@/lib/api-client';
import { PlayerStatistics } from '../types';

/**
 * Fetches player statistics from the remote backend.
 */
export const getStats = (baseUrl: string): Promise<PlayerStatistics> => {
  return apiClient(`${baseUrl}/player-statistics`);
};

/**
 * Persists player statistics to the remote backend.
 */
export const updateStats = (baseUrl: string, stats: PlayerStatistics): Promise<void> => {
  return apiClient(`${baseUrl}/player-statistics`, {
    data: stats,
    method: 'POST',
  });
};
