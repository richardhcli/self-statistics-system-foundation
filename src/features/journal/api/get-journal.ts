
import { apiClient } from '@/lib/api-client';
import { JournalStore } from '../types';

/**
 * Fetches the user's journal store from the remote backend server.
 * @param baseUrl The base URL of the backend API.
 */
export const getJournal = (baseUrl: string): Promise<JournalStore> => {
  return apiClient(`${baseUrl}/journal`);
};
