
import { apiClient } from '@/lib/api-client';
import { PlayerStatistics } from '../../user-data/types';

export const getStats = (baseUrl: string): Promise<PlayerStatistics> => {
  return apiClient(`${baseUrl}/player-statistics`);
};

export const updateStats = (baseUrl: string, stats: PlayerStatistics): Promise<void> => {
  return apiClient(`${baseUrl}/player-statistics`, {
    data: stats,
    method: 'POST',
  });
};
