
import { apiClient } from '@/lib/api-client';
import { JournalStore } from '../types';

/**
 * Persists the current journal store to the remote backend server.
 * @param baseUrl The base URL of the backend API.
 * @param journal The journal store object to persist.
 */
export const updateJournal = (baseUrl: string, journal: JournalStore): Promise<void> => {
  return apiClient(`${baseUrl}/journal`, {
    data: journal,
    method: 'POST',
  });
};
