
import { apiClient } from '@/lib/api-client';
import type { JournalPersistedState } from '@/stores/journal';

/**
 * Fetches the user's journal store from the remote backend server.
 * @param baseUrl The base URL of the backend API.
 */
export const getJournal = (baseUrl: string): Promise<JournalPersistedState> => {
  return apiClient(`${baseUrl}/journal`);
};
