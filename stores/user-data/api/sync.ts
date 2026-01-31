
import { apiClient } from '@/lib/api-client';
import { AppData } from '../types';

/**
 * MODULE: Centralized AppData Sync
 * Functional Description:
 * Acts as the primary bridge between the local-first state and a remote backend.
 * Consolidation reduces network chatter and ensures atomic updates of the entire Brain.
 */

/**
 * Fetches the complete AppData state.
 */
export const fetchFullSync = (baseUrl: string): Promise<AppData> => {
  return apiClient(`${baseUrl}/sync/full`);
};

/**
 * Pushes the complete AppData state.
 */
export const pushFullSync = (baseUrl: string, data: AppData): Promise<void> => {
  return apiClient(`${baseUrl}/sync/full`, {
    data,
    method: 'POST',
  });
};
