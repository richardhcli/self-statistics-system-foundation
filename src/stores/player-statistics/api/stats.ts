
import { apiClient } from '@/lib/api-client';
import { PlayerStatistics } from '../types';
import { usePlayerStatisticsStore } from '../store';

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

/**
 * Local API: Fetch player statistics for serialization/remote sync.
 */
export const getPlayerStatistics = (): PlayerStatistics => {
  return usePlayerStatisticsStore.getState().getStats();
};

/**
 * Local API: Load player statistics from storage/backend.
 */
export const setPlayerStatistics = (stats: PlayerStatistics): void => {
  usePlayerStatisticsStore.getState().actions.setStats(stats);
};
