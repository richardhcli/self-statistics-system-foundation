
import { apiClient } from '@/lib/api-client';
import type { JournalPersistedState } from '@/stores/journal';

/**
 * Persists the current journal store to the remote backend server.
 * @param baseUrl The base URL of the backend API.
 * @param journal The journal store object to persist.
 */
export const updateJournal = (baseUrl: string, journal: JournalPersistedState): Promise<void> => {
  return apiClient(`${baseUrl}/journal`, {
    data: journal,
    method: 'POST',
  });
};
